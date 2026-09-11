import React, { useEffect, useRef, useState } from 'react';
import * as maplibregl from 'maplibre-gl';
import { setWorkerUrl } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

// Ensure MapLibre uses public worker script without 404 or worker errors
if (typeof window !== 'undefined') {
  setWorkerUrl('/maplibre-gl-worker.mjs');
}

import {
  WAYANAD_LOCATIONS,
  WAYANAD_EMERGENCY_NODES,
  WAYANAD_DISTRICT_BOUNDARY_GEOJSON,
  CRITICAL_DANGER_ZONES_GEOJSON,
  HIGH_RISK_ZONES_GEOJSON,
  WATCH_ZONES_GEOJSON,
  SAFE_ZONES_GEOJSON,
  WAYANAD_RIVERS_GEOJSON,
  WAYANAD_ROADS_GEOJSON,
  CYCLONE_TIMELINE_STEPS,
  CYCLONE_HISTORICAL_TRACK_GEOJSON,
  CYCLONE_FORECAST_TRACK_GEOJSON,
  CYCLONE_UNCERTAINTY_CONE_GEOJSON,
  CYCLONE_WIND_ZONES_GEOJSON,
  CYCLONE_RAINFALL_SWATH_GEOJSON,
  CYCLONE_LANDSLIDE_SUSCEPTIBILITY_GEOJSON,
  getMultiHazardZonesGeoJSON,
  getFloodInundationGeoJSON,
  getLandslideSusceptibilityGeoJSON,
  getRoadsGeoJSON,
  getLocationsForCycloneStep,
  GeoLocation,
  EmergencyFacility
} from '../data/wayanadGISData';
import {
  Clock, Home,
  Compass, Plus, Minus, RotateCcw, Box, Map, Layers,
  Search, ShieldAlert, AlertTriangle, CheckSquare, Square,
  Info, ChevronRight, X, Mountain, Crosshair, ArrowRight,
  Bell, Activity, Droplets, Navigation, CheckCircle2,
  Wind, Play, Pause, FastForward, Radio, Eye
} from 'lucide-react';

interface RealGISDisasterMapProps {
  selectedLocation: GeoLocation | null;
  onSelectLocation: (loc: GeoLocation) => void;
  isEmergencyMode?: boolean;
  onNavigateToRouting?: () => void;
  layerToggles?: { [key: string]: boolean };
  timelineStep?: number;
  onCycloneStepChange?: (stepIdx: number) => void;
  highlightShelters?: boolean;
  onToggleShelterHighlight?: () => void;
  is3DMode?: boolean;
  onToggle3DMode?: (val: boolean) => void;
}

export const RealGISDisasterMap: React.FC<RealGISDisasterMapProps> = ({
  selectedLocation,
  onSelectLocation,
  isEmergencyMode = false,
  onNavigateToRouting,
  layerToggles,
  timelineStep: externalTimelineStep,
  onCycloneStepChange,
  highlightShelters = false,
  onToggleShelterHighlight,
  is3DMode: external3DMode,
  onToggle3DMode
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const isLoadedRef = useRef<boolean>(false);
  const locationMarkersRef = useRef<maplibregl.Marker[]>([]);
  const facilityMarkersRef = useRef<maplibregl.Marker[]>([]);
  const cycloneMarkerRef = useRef<maplibregl.Marker[]>([]);
  const animFrameIdRef = useRef<number | null>(null);

  // Default to 3D mode enabled for immediate realistic terrain visualization
  const [internal3DMode, setInternal3DMode] = useState<boolean>(true);
  const is3D = external3DMode !== undefined ? external3DMode : internal3DMode;

  const [legendOpen, setLegendOpen] = useState<boolean>(false); // Collapsed by default to free map space
  const [activePopupLocation, setActivePopupLocation] = useState<GeoLocation | null>(null);
  const isInitialMount = useRef<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchFocused, setSearchFocused] = useState<boolean>(false);
  const [bannerCollapsed, setBannerCollapsed] = useState<boolean>(false);

  // Predictive Cyclone & Multi-Hazard Timeline (Default: Step 3: T+14h Flash Inundation & Route B Cutoff)
  const [internalTimelineStep, setInternalTimelineStep] = useState<number>(3);
  const timelineStep = externalTimelineStep !== undefined ? externalTimelineStep : internalTimelineStep;

  // Sync internal state when prop changes from parent
  useEffect(() => {
    if (externalTimelineStep !== undefined) {
      setInternalTimelineStep(externalTimelineStep);
    }
  }, [externalTimelineStep]);

  const [isPlayingTimeline, setIsPlayingTimeline] = useState<boolean>(false);

  // Dynamic Locations based on active timeline step
  const currentLocations = getLocationsForCycloneStep(timelineStep);
  const activeStepData = CYCLONE_TIMELINE_STEPS[timelineStep] || CYCLONE_TIMELINE_STEPS[0];

  // Real-time Critical Alert Banner
  const [realtimeAlert, setRealtimeAlert] = useState<{
    show: boolean;
    title: string;
    details: string;
    action: string;
  }>({
    show: true,
    title: '🔴 T+14h PEAK FLASH FLOOD & ROUTE B CUTOFF: SEVERE CYCLONIC STORM SHAKTI',
    details: 'Chaliyar River crests at 6.10m (+1.60m breach) | Chooralmala bridge crossing submerged | Traffic diverted to Route C Green Corridor.',
    action: 'Mandatory Immediate Evacuation via Route C to Sulthan Bathery Safe Hub'
  });

  // Autocomplete search suggestions
  const searchSuggestions = currentLocations.filter(
    (l) => l.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
           l.taluk.toLowerCase().includes(searchQuery.toLowerCase())
  ).slice(0, 5);

  // Auto-play timeline simulation
  useEffect(() => {
    let interval: any = null;
    if (isPlayingTimeline) {
      interval = setInterval(() => {
        setInternalTimelineStep((prev) => {
          const next = (prev + 1) % CYCLONE_TIMELINE_STEPS.length;
          if (onCycloneStepChange) onCycloneStepChange(next);
          return next;
        });
      }, 4000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPlayingTimeline, onCycloneStepChange]);

  // Handle manual step selection
  const handleSelectStep = (idx: number) => {
    setInternalTimelineStep(idx);
    setIsPlayingTimeline(false);
    if (onCycloneStepChange) onCycloneStepChange(idx);

    const step = CYCLONE_TIMELINE_STEPS[idx] || CYCLONE_TIMELINE_STEPS[0];
    let actionText = 'Normal monitoring active; maintain safe preparedness.';
    if (idx === 1) actionText = 'Alert riverside wards in Meppadi; river rising +0.38 m/hr.';
    if (idx === 2) actionText = 'Slope instability detected (FoS 0.58); initiate Phase 1 evacuation.';
    if (idx === 3) actionText = 'CRITICAL: Route B Chooralmala bridge submerged; divert to Route C Green Corridor!';
    if (idx === 4) actionText = 'Secondary surge active; maintain emergency boat pontoon crossing.';
    if (idx === 5) actionText = 'Water receded below 4.0m; initiate recovery and pontoon transit.';

    setRealtimeAlert({
      show: true,
      title: `🔴 TIMELINE ${step.step}: ${step.label.toUpperCase()}`,
      details: `Wind: ${step.wind_kmh} km/h (Gusts ${step.gust_kmh} km/h) | Rain: ${step.rainfall_12h_mm} mm (Rate: +${step.rain_rate_mm_hr} mm/h) | River Level: ${step.river_level_m}m | Soil Moisture: ${step.soil_saturation_pct}% (FoS: ${step.slope_fos})`,
      action: actionText
    });
  };

  // Helper: setup river downstream animated particle system
  const setupRiverFlowAnimation = (map: maplibregl.Map) => {
    const riverLines: [number, number][][] = [];
    if (WAYANAD_RIVERS_GEOJSON && Array.isArray(WAYANAD_RIVERS_GEOJSON.features)) {
      WAYANAD_RIVERS_GEOJSON.features.forEach((feat: any) => {
        if (feat && feat.geometry && feat.geometry.type === 'LineString' && Array.isArray(feat.geometry.coordinates)) {
          riverLines.push(feat.geometry.coordinates);
        }
      });
    }

    if (riverLines.length === 0) return;

    // Build particle slots: 8 particles per river LineString
    const particles: { lineIndex: number; progress: number; speed: number; size: number }[] = [];
    riverLines.forEach((line, lIdx) => {
      const numParticles = Math.max(6, Math.min(10, Math.floor(line.length * 1.5)));
      for (let i = 0; i < numParticles; i++) {
        particles.push({
          lineIndex: lIdx,
          progress: i / numParticles,
          speed: 0.0035 + (i % 3) * 0.0012,
          size: 3.2 + (i % 2) * 1.2
        });
      }
    });

    let lastTime = performance.now();

    const animateParticles = (currentTime: number) => {
      if (!mapRef.current) return;

      // Throttle to ~30 FPS for silky performance
      if (currentTime - lastTime > 32) {
        lastTime = currentTime;

        if (mapRef.current.isStyleLoaded()) {
          const particleFeatures: GeoJSON.Feature<GeoJSON.Point>[] = [];

          particles.forEach((p) => {
            p.progress = (p.progress + p.speed) % 1.0;
            const line = riverLines[p.lineIndex];
            if (!line || line.length < 2) return;

            // Find interpolated coordinate along LineString
            const totalSegments = line.length - 1;
            const globalPos = p.progress * totalSegments;
            const segIdx = Math.min(Math.floor(globalPos), totalSegments - 1);
            const segFrac = globalPos - segIdx;

            const p0 = line[segIdx];
            const p1 = line[segIdx + 1];
            if (!p0 || !p1) return;

            const lng = p0[0] + (p1[0] - p0[0]) * segFrac;
            const lat = p0[1] + (p1[1] - p0[1]) * segFrac;

            particleFeatures.push({
              type: 'Feature',
              geometry: {
                type: 'Point',
                coordinates: [lng, lat]
              },
              properties: {
                radius: p.size,
                opacity: 0.85 + 0.15 * Math.sin(p.progress * Math.PI)
              }
            });
          });

          try {
            const source = mapRef.current.getSource('river-flow-particles') as maplibregl.GeoJSONSource;
            if (source && typeof source.setData === 'function') {
              source.setData({
                type: 'FeatureCollection',
                features: particleFeatures
              });
            }
          } catch (e) {
            // Ignore transient frame errors
          }
        }
      }

      animFrameIdRef.current = requestAnimationFrame(animateParticles);
    };

    animFrameIdRef.current = requestAnimationFrame(animateParticles);
  };

  // Initialize MapLibre GL 3D Emergency GIS Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    const initialMultiHazard = getMultiHazardZonesGeoJSON(timelineStep);
    const initialFlood = getFloodInundationGeoJSON(timelineStep);
    const initialLandslide = getLandslideSusceptibilityGeoJSON(timelineStep);
    const initialRoads = getRoadsGeoJSON(timelineStep);

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: {
        version: 8,
        // Native 3D Terrain Configuration in Style Object
        terrain: {
          source: 'terrain-dem',
          exaggeration: 2.4
        },
        sources: {
          // Dark Basemap: Esri World Dark Gray Base (Clean, high-resolution, completely free, zero watermarks)
          'dark-basemap': {
            type: 'raster',
            tiles: [
              'https://services.arcgisonline.com/arcgis/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}'
            ],
            tileSize: 256,
            attribution: 'Esri, HERE, Garmin, © OpenStreetMap contributors, and the GIS user community'
          },
          // 3D DEM Elevation Data (AWS Terrarium)
          'terrain-dem': {
            type: 'raster-dem',
            tiles: [
              'https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png'
            ],
            encoding: 'terrarium',
            tileSize: 256,
            maxzoom: 15
          },
          'district-boundary': { type: 'geojson', data: WAYANAD_DISTRICT_BOUNDARY_GEOJSON },
          'critical-danger': { type: 'geojson', data: initialMultiHazard.critical },
          'high-risk': { type: 'geojson', data: initialMultiHazard.highRisk },
          'watch-zones': { type: 'geojson', data: initialMultiHazard.watch },
          'safe-zones': { type: 'geojson', data: initialMultiHazard.safe },
          'flood-inundation': { type: 'geojson', data: initialFlood },
          'rivers': { type: 'geojson', data: WAYANAD_RIVERS_GEOJSON },
          'river-flow-particles': { type: 'geojson', data: { type: 'FeatureCollection', features: [] } },
          'roads': { type: 'geojson', data: initialRoads },
          // Cyclone Layers
          'cyclone-uncertainty': { type: 'geojson', data: CYCLONE_UNCERTAINTY_CONE_GEOJSON },
          'cyclone-wind-zones': { type: 'geojson', data: CYCLONE_WIND_ZONES_GEOJSON },
          'cyclone-rainfall-swath': { type: 'geojson', data: CYCLONE_RAINFALL_SWATH_GEOJSON },
          'cyclone-landslides': { type: 'geojson', data: initialLandslide },
          'cyclone-historical': { type: 'geojson', data: CYCLONE_HISTORICAL_TRACK_GEOJSON },
          'cyclone-forecast': { type: 'geojson', data: CYCLONE_FORECAST_TRACK_GEOJSON }
        },
        layers: [
          // 1. Dark Basemap
          {
            id: 'dark-basemap-layer',
            type: 'raster',
            source: 'dark-basemap',
            paint: {
              'raster-opacity': 0.95,
              'raster-contrast': 0.15
            }
          },
          // 2. High-Definition Elevation Hillshading (Accentuate Western Ghats peaks, ridges & river gorges)
          {
            id: 'terrain-hillshade',
            type: 'hillshade',
            source: 'terrain-dem',
            paint: {
              'hillshade-exaggeration': 0.75,
              'hillshade-shadow-color': '#020617',
              'hillshade-highlight-color': '#334155',
              'hillshade-accent-color': '#0f172a'
            }
          },
          // 3. Cyclone Forecast Uncertainty Cone
          {
            id: 'cyclone-cone-fill',
            type: 'fill',
            source: 'cyclone-uncertainty',
            paint: {
              'fill-color': '#f59e0b',
              'fill-opacity': 0.12
            }
          },
          {
            id: 'cyclone-cone-line',
            type: 'line',
            source: 'cyclone-uncertainty',
            paint: {
              'line-color': '#f59e0b',
              'line-width': 1.8,
              'line-dasharray': [3, 2]
            }
          },
          // 4. Cyclone Wind Risk Zones
          {
            id: 'cyclone-wind-fill',
            type: 'fill',
            source: 'cyclone-wind-zones',
            paint: {
              'fill-color': [
                'match',
                ['get', 'risk_level'],
                'EXTREME', '#ef4444',
                'HIGH', '#f97316',
                'MODERATE', '#eab308',
                'LOW', '#0284c7',
                '#64748b'
              ],
              'fill-opacity': ['get', 'fill_opacity']
            }
          },
          {
            id: 'cyclone-wind-line',
            type: 'line',
            source: 'cyclone-wind-zones',
            paint: {
              'line-color': ['get', 'color'],
              'line-width': 1.8,
              'line-opacity': 0.75
            }
          },
          // 5. Heavy Rainfall Swath
          {
            id: 'cyclone-rainfall-fill',
            type: 'fill',
            source: 'cyclone-rainfall-swath',
            paint: {
              'fill-color': '#06b6d4',
              'fill-opacity': 0.20
            }
          },
          {
            id: 'cyclone-rainfall-line',
            type: 'line',
            source: 'cyclone-rainfall-swath',
            paint: {
              'line-color': '#06b6d4',
              'line-width': 1.5,
              'line-dasharray': [4, 2]
            }
          },
          // 6. Dynamic Flood Inundation Polygons (grows with rainfall & river surge)
          {
            id: 'flood-inundation-fill',
            type: 'fill',
            source: 'flood-inundation',
            paint: {
              'fill-color': '#0284c7',
              'fill-opacity': 0.42
            }
          },
          {
            id: 'flood-inundation-line',
            type: 'line',
            source: 'flood-inundation',
            paint: {
              'line-color': '#38bdf8',
              'line-width': 2.0,
              'line-dasharray': [3, 2],
              'line-opacity': 0.90
            }
          },
          // 7. Mountain Landslide Susceptibility Chutes (Chooralmala-Mundakkai Escarpment)
          {
            id: 'cyclone-landslide-fill',
            type: 'fill',
            source: 'cyclone-landslides',
            paint: {
              'fill-color': '#ea580c',
              'fill-opacity': 0.35
            }
          },
          {
            id: 'cyclone-landslide-line',
            type: 'line',
            source: 'cyclone-landslides',
            paint: {
              'line-color': '#ea580c',
              'line-width': 2.2
            }
          },
          // 8. Cyclone Historical Track (Solid Line)
          {
            id: 'cyclone-historical-line',
            type: 'line',
            source: 'cyclone-historical',
            filter: ['==', '$type', 'LineString'],
            paint: {
              'line-color': '#0284c7',
              'line-width': 3.5,
              'line-opacity': 0.85
            }
          },
          {
            id: 'cyclone-historical-points',
            type: 'circle',
            source: 'cyclone-historical',
            filter: ['==', '$type', 'Point'],
            paint: {
              'circle-radius': 4.5,
              'circle-color': '#0284c7',
              'circle-stroke-width': 1.5,
              'circle-stroke-color': '#ffffff'
            }
          },
          // 9. Cyclone Forecast Track (Dashed Line)
          {
            id: 'cyclone-forecast-line',
            type: 'line',
            source: 'cyclone-forecast',
            filter: ['==', '$type', 'LineString'],
            paint: {
              'line-color': '#f59e0b',
              'line-width': 3.5,
              'line-dasharray': [3, 2],
              'line-opacity': 0.90
            }
          },
          {
            id: 'cyclone-forecast-points',
            type: 'circle',
            source: 'cyclone-forecast',
            filter: ['==', '$type', 'Point'],
            paint: {
              'circle-radius': 5.0,
              'circle-color': '#f59e0b',
              'circle-stroke-width': 2.0,
              'circle-stroke-color': '#ffffff'
            }
          },
          // 10. District Boundary
          {
            id: 'district-boundary-line',
            type: 'line',
            source: 'district-boundary',
            paint: {
              'line-color': '#e2e8f0',
              'line-width': 2.0,
              'line-dasharray': [4, 2],
              'line-opacity': 0.85
            }
          },
          // 11. Realistic River Network with Glowing Water Channels & Deep Valley Beds
          {
            id: 'rivers-glow',
            type: 'line',
            source: 'rivers',
            paint: {
              'line-color': '#0284c7',
              'line-width': 7.0,
              'line-opacity': 0.35,
              'line-blur': 3.0
            }
          },
          {
            id: 'rivers-bed',
            type: 'line',
            source: 'rivers',
            paint: {
              'line-color': '#082f49',
              'line-width': 4.0,
              'line-opacity': 0.90
            }
          },
          {
            id: 'rivers-core',
            type: 'line',
            source: 'rivers',
            paint: {
              'line-color': '#38bdf8',
              'line-width': 2.2,
              'line-opacity': 0.95
            }
          },
          // 12. Animated River Downstream Flow Particles
          {
            id: 'river-flow-particles',
            type: 'circle',
            source: 'river-flow-particles',
            paint: {
              'circle-radius': ['get', 'radius'],
              'circle-color': '#38bdf8',
              'circle-opacity': ['get', 'opacity'],
              'circle-blur': 0.3,
              'circle-stroke-width': 1.5,
              'circle-stroke-color': '#ffffff'
            }
          },
          // 13. Safe / Low-Risk Zones (Blue Polygons)
          {
            id: 'safe-zones-fill',
            type: 'fill',
            source: 'safe-zones',
            paint: {
              'fill-color': '#0284c7',
              'fill-opacity': 0.22
            }
          },
          {
            id: 'safe-zones-border',
            type: 'line',
            source: 'safe-zones',
            paint: {
              'line-color': '#38bdf8',
              'line-width': 2.0,
              'line-opacity': 0.85
            }
          },
          // 14. Watch Zones (Yellow Polygons)
          {
            id: 'watch-zones-fill',
            type: 'fill',
            source: 'watch-zones',
            paint: {
              'fill-color': '#eab308',
              'fill-opacity': 0.22
            }
          },
          {
            id: 'watch-zones-border',
            type: 'line',
            source: 'watch-zones',
            paint: {
              'line-color': '#eab308',
              'line-width': 2.0,
              'line-opacity': 0.85
            }
          },
          // 15. High-Risk Zones (Orange Polygons)
          {
            id: 'high-risk-fill',
            type: 'fill',
            source: 'high-risk',
            paint: {
              'fill-color': '#ea580c',
              'fill-opacity': 0.28
            }
          },
          {
            id: 'high-risk-border',
            type: 'line',
            source: 'high-risk',
            paint: {
              'line-color': '#f97316',
              'line-width': 2.2,
              'line-opacity': 0.90
            }
          },
          // 16. Critical Danger Zones (Red Polygons & Glowing Borders)
          {
            id: 'critical-danger-fill',
            type: 'fill',
            source: 'critical-danger',
            paint: {
              'fill-color': '#dc2626',
              'fill-opacity': 0.50
            }
          },
          {
            id: 'critical-danger-glow',
            type: 'line',
            source: 'critical-danger',
            paint: {
              'line-color': '#ff0000',
              'line-width': 12.0,
              'line-opacity': 0.80,
              'line-blur': 4.0
            }
          },
          {
            id: 'critical-danger-border',
            type: 'line',
            source: 'critical-danger',
            paint: {
              'line-color': '#ff1a1a',
              'line-width': 4.5,
              'line-opacity': 1.0
            }
          },
          // 17. Road Network (Route B dynamically reflects BLOCKED / OPEN)
          {
            id: 'roads-casing',
            type: 'line',
            source: 'roads',
            paint: {
              'line-color': '#0f172a',
              'line-width': 5.0,
              'line-opacity': 0.70
            }
          },
          {
            id: 'roads-layer',
            type: 'line',
            source: 'roads',
            paint: {
              'line-color': ['get', 'color'],
              'line-width': ['coalesce', ['get', 'stroke_width'], 2.5],
              'line-opacity': 0.95
            }
          }
        ]
      },
      // Centered on Wayanad Mountain Valley (Meppadi - Chooralmala Ridges)
      center: [76.1264, 11.5600],
      zoom: 11.2,
      pitch: 52, // Default 3D Pitch: 52° to immediately showcase elevation, ridges & valleys!
      bearing: -18, // Slanted bearing to emphasize Western Ghats ridgelines
      maxZoom: 18,
      minZoom: 6,
      maxPitch: 85
    });

    map.addControl(new maplibregl.NavigationControl({ showCompass: true, visualizePitch: true }), 'bottom-right');
    mapRef.current = map;

    map.on('error', (e) => {
      console.warn('MapLibre notice:', e);
    });

    map.on('load', () => {
      isLoadedRef.current = true;

      // Safe terrain confirmation
      try {
        if (is3D) {
          map.setTerrain({ source: 'terrain-dem', exaggeration: 2.4 });
        }
      } catch (err) {
        console.warn('Terrain initialization warning:', err);
      }

      // Initialize Downstream River Flow Animated Particles
      setupRiverFlowAnimation(map);

      // Initialize Custom High-Visibility DOM Markers
      renderCycloneCenterMarker(map, activeStepData.coordinates);
      renderSettlementMarkers(map, currentLocations);
      renderEmergencyFacilityMarkers(map, highlightShelters);
      syncToggles(map, layerToggles);
    });

    return () => {
      isLoadedRef.current = false;
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Update 3D terrain mode if external prop or internal state changes
  useEffect(() => {
    if (!mapRef.current || !isLoadedRef.current) return;
    const map = mapRef.current;
    if (!map.isStyleLoaded()) return;

    try {
      if (is3D) {
        map.setTerrain({ source: 'terrain-dem', exaggeration: 2.4 });
        map.easeTo({ pitch: 52, bearing: -18, duration: 1200 });
      } else {
        map.setTerrain(null);
        map.easeTo({ pitch: 0, bearing: 0, duration: 1000 });
      }
    } catch (err) {
      console.warn('Terrain toggle warning:', err);
    }
  }, [is3D]);

  // Handle 3D / 2D Mode Switch
  const toggle3DMode = () => {
    const nextVal = !is3D;
    setInternal3DMode(nextVal);
    if (onToggle3DMode) onToggle3DMode(nextVal);
  };

  // Highlight shelters and fly to safe hub network when user clicks Shelter Headroom KPI
  useEffect(() => {
    if (!mapRef.current || !isLoadedRef.current) return;
    const map = mapRef.current;
    if (!map.isStyleLoaded()) return;

    try {
      renderEmergencyFacilityMarkers(map, highlightShelters);
      if (highlightShelters) {
        map.flyTo({
          center: [76.18, 11.63],
          zoom: 11.4,
          pitch: is3D ? 48 : 0,
          duration: 1500
        });
      }
    } catch (err) {
      console.warn('Shelter highlight warning:', err);
    }
  }, [highlightShelters, is3D]);

  // Reactive Multi-Hazard Dynamics: When timelineStep changes, update all map sources!
  useEffect(() => {
    if (!mapRef.current || !isLoadedRef.current) return;
    const map = mapRef.current;
    if (!map.isStyleLoaded()) return;

    try {
      // 1. Update Cyclone marker & settlement badges
      renderCycloneCenterMarker(map, activeStepData.coordinates);
      renderSettlementMarkers(map, currentLocations);

      // 2. Update Risk Zones GeoJSON sources
      const multiHazard = getMultiHazardZonesGeoJSON(timelineStep);
      const critSrc = map.getSource('critical-danger') as maplibregl.GeoJSONSource;
      if (critSrc && typeof critSrc.setData === 'function') critSrc.setData(multiHazard.critical);

      const highSrc = map.getSource('high-risk') as maplibregl.GeoJSONSource;
      if (highSrc && typeof highSrc.setData === 'function') highSrc.setData(multiHazard.highRisk);

      const watchSrc = map.getSource('watch-zones') as maplibregl.GeoJSONSource;
      if (watchSrc && typeof watchSrc.setData === 'function') watchSrc.setData(multiHazard.watch);

      const safeSrc = map.getSource('safe-zones') as maplibregl.GeoJSONSource;
      if (safeSrc && typeof safeSrc.setData === 'function') safeSrc.setData(multiHazard.safe);

      // 3. Update Flood Inundation Polygons (expands dynamically across timeline)
      const floodSrc = map.getSource('flood-inundation') as maplibregl.GeoJSONSource;
      if (floodSrc && typeof floodSrc.setData === 'function') floodSrc.setData(getFloodInundationGeoJSON(timelineStep));

      // 4. Update Landslide Susceptibility Chutes
      const slideSrc = map.getSource('cyclone-landslides') as maplibregl.GeoJSONSource;
      if (slideSrc && typeof slideSrc.setData === 'function') slideSrc.setData(getLandslideSusceptibilityGeoJSON(timelineStep));

      // 5. Update Road Network (Route B turns BOLD RED at T+14h!)
      const roadSrc = map.getSource('roads') as maplibregl.GeoJSONSource;
      if (roadSrc && typeof roadSrc.setData === 'function') roadSrc.setData(getRoadsGeoJSON(timelineStep));
    } catch (err) {
      console.warn('Timeline update error:', err);
    }
  }, [timelineStep]);

  // Fly to selected location whenever it changes from the sidebar or parent
  useEffect(() => {
    if (!mapRef.current || !selectedLocation || !isLoadedRef.current) return;
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return; // Do NOT pop open detail card on initial mount!
    }
    const map = mapRef.current;
    if (!map.isStyleLoaded()) return;

    try {
      map.flyTo({
        center: selectedLocation.coordinates,
        zoom: 12.8,
        pitch: is3D ? 55 : 0,
        duration: 1200
      });
      setActivePopupLocation(selectedLocation);
    } catch (err) {
      console.warn('FlyTo error:', err);
    }
  }, [selectedLocation, is3D]);

  // Render Custom Animated Spinning Cyclone Center Marker
  const renderCycloneCenterMarker = (map: maplibregl.Map, coords: [number, number]) => {
    if (!coords || !Array.isArray(coords)) return;
    cycloneMarkerRef.current.forEach((m) => m.remove());
    cycloneMarkerRef.current = [];

    const el = document.createElement('div');
    el.className = 'cyclone-center-symbol cursor-pointer flex flex-col items-center';
    el.innerHTML = `
      <div class="relative flex items-center justify-center">
        <div class="absolute w-14 h-14 rounded-full border-2 border-red-500/80 animate-ping"></div>
        <div class="absolute w-10 h-10 rounded-full bg-red-600/30 border border-red-400 backdrop-blur-sm"></div>
        <div class="w-8 h-8 rounded-full bg-gradient-to-tr from-red-600 to-amber-500 flex items-center justify-center shadow-lg shadow-red-500/50 border border-white">
          <svg class="w-5 h-5 text-white animate-spin" style="animation-duration: 3s;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <path d="M12 2a10 10 0 0 0-9.5 13.5l1.5-1A8 8 0 1 1 12 4V2z"/>
            <path d="M12 22a10 10 0 0 0 9.5-13.5l-1.5 1A8 8 0 1 1 12 20v2z"/>
          </svg>
        </div>
      </div>
      <div class="mt-1 bg-gray-950/90 border border-red-500/80 rounded px-1.5 py-0.5 shadow-md flex items-center space-x-1">
        <span class="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
        <span class="text-[9px] font-black text-white uppercase tracking-tight">CYCLONE SHAKTI (${activeStepData.wind_kmh} km/h)</span>
      </div>
    `;

    el.addEventListener('click', () => {
      map.flyTo({ center: coords, zoom: 9.8, duration: 1200 });
    });

    const marker = new maplibregl.Marker({ element: el, anchor: 'center' })
      .setLngLat(coords)
      .addTo(map);

    cycloneMarkerRef.current.push(marker);
  };

  // Render Settlement Markers with Risk Badges & Elevation
  const renderSettlementMarkers = (map: maplibregl.Map, locations: GeoLocation[]) => {
    if (!Array.isArray(locations)) return;
    locationMarkersRef.current.forEach((m) => m.remove());
    locationMarkersRef.current = [];

    locations.forEach((loc) => {
      if (!loc || !loc.coordinates) return;
      const el = document.createElement('div');
      el.className = 'gis-settlement-marker cursor-pointer flex flex-col items-center group';

      let borderColor = '#38bdf8';
      let dotColor = '#0284c7';
      let badgeBg = 'bg-sky-950/90';
      let textColor = 'text-sky-300';
      let statusBadge = 'bg-sky-900/60 text-sky-200';

      if (loc.risk_level === 'CRITICAL') {
        borderColor = '#ef4444';
        dotColor = '#dc2626';
        badgeBg = 'bg-red-950/95';
        textColor = 'text-red-200';
        statusBadge = 'bg-red-600 text-white font-black animate-pulse';
      } else if (loc.risk_level === 'HIGH_RISK') {
        borderColor = '#f97316';
        dotColor = '#ea580c';
        badgeBg = 'bg-orange-950/90';
        textColor = 'text-orange-200';
        statusBadge = 'bg-orange-600 text-white font-bold';
      } else if (loc.risk_level === 'WATCH') {
        borderColor = '#eab308';
        dotColor = '#ca8a04';
        badgeBg = 'bg-yellow-950/90';
        textColor = 'text-yellow-200';
        statusBadge = 'bg-yellow-600 text-black font-bold';
      }

      el.innerHTML = `
        <div class="relative flex items-center justify-center">
          ${loc.risk_level === 'CRITICAL' ? `<div class="absolute w-6 h-6 rounded-full bg-red-500/40 animate-ping"></div>` : ''}
          <div class="w-3.5 h-3.5 rounded-full border-2 border-white shadow-md" style="background-color: ${dotColor};"></div>
        </div>
        <div class="mt-0.5 px-2 py-0.5 rounded ${badgeBg} border shadow-lg flex items-center space-x-1.5 backdrop-blur-sm transition-transform group-hover:scale-110" style="border-color: ${borderColor};">
          <span class="text-[10px] font-bold text-white tracking-wide">${loc.name.split(' ')[0]}</span>
          <span class="text-[8px] px-1 py-0.2 rounded ${statusBadge}">${loc.risk_level === 'CRITICAL' ? 'CRIT' : loc.risk_level === 'HIGH_RISK' ? 'HIGH' : loc.risk_level === 'WATCH' ? 'WATCH' : 'SAFE'}</span>
          <span class="text-[9px] font-mono ${textColor}">${loc.risk_score}</span>
        </div>
      `;

      el.addEventListener('click', (e) => {
        e.stopPropagation();
        onSelectLocation(loc);
        setActivePopupLocation(loc);
        map.flyTo({ center: loc.coordinates, zoom: 12.8, pitch: is3D ? 58 : 0, duration: 1000 });
      });

      const marker = new maplibregl.Marker({ element: el, anchor: 'top' })
        .setLngLat(loc.coordinates)
        .addTo(map);

      locationMarkersRef.current.push(marker);
    });
  };

  // Render Emergency Facilities (Shelters, Hospitals) with Detailed Headroom Beacons
  const renderEmergencyFacilityMarkers = (map: maplibregl.Map, isHighlightShelters: boolean = false) => {
    facilityMarkersRef.current.forEach((m) => m.remove());
    facilityMarkersRef.current = [];

    if (!Array.isArray(WAYANAD_EMERGENCY_NODES)) return;

    WAYANAD_EMERGENCY_NODES.forEach((fac) => {
      if (!fac || !fac.coordinates) return;
      const el = document.createElement('div');
      el.className = 'gis-facility-marker cursor-pointer flex flex-col items-center group';

      const isShelter = fac.type === 'shelter';
      const isHospital = fac.type === 'hospital';
      const isBridge = fac.type === 'bridge';

      if (isShelter && isHighlightShelters) {
        // High-visibility glowing carrying capacity badge showing Capacity, Occupied, and Headroom
        el.innerHTML = `
          <div class="relative flex items-center justify-center">
            <div class="absolute w-12 h-12 rounded-full bg-emerald-500/50 animate-ping"></div>
            <div class="w-9 h-9 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-400 border-2 border-white text-white text-base flex items-center justify-center shadow-2xl shadow-emerald-500/80">
              🏠
            </div>
          </div>
          <div class="mt-1 px-3 py-1.5 bg-[#022c22]/95 border-2 border-emerald-400 rounded-xl shadow-2xl backdrop-blur-md flex flex-col items-center animate-bounce" style="animation-duration: 2.2s;">
            <div class="flex items-center space-x-1.5">
              <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span class="text-[11px] font-black text-white uppercase tracking-tight">${fac.name}</span>
            </div>
            <div class="text-[10px] font-mono font-black text-emerald-300 mt-0.5">
              ${fac.headroom ? `${fac.headroom.toLocaleString()} HEADROOM AVAILABLE` : 'OPERATIONAL SAFE HUB'}
            </div>
            <div class="text-[8.5px] text-emerald-200/90 font-mono">
              Cap: ${fac.capacity?.toLocaleString()} | Occ: ${fac.occupied?.toLocaleString()}
            </div>
          </div>
        `;
      } else {
        const bg = isBridge ? 'bg-red-600' : isHospital ? 'bg-emerald-600' : 'bg-blue-600';
        const symbol = isBridge ? '⚠️' : isHospital ? '🏥' : '🏠';
        el.innerHTML = `
          <div class="w-5 h-5 rounded-full ${bg} border border-white text-white text-[10px] flex items-center justify-center shadow-md">
            ${symbol}
          </div>
          <div class="hidden group-hover:flex mt-0.5 px-2 py-0.5 bg-gray-900/95 border border-gray-700 text-[9px] text-white rounded whitespace-nowrap shadow-xl">
            ${fac.name} (${fac.capacity ? `${fac.headroom} Headroom` : fac.status})
          </div>
        `;
      }

      el.addEventListener('click', (e) => {
        e.stopPropagation();
        map.flyTo({ center: fac.coordinates, zoom: 13.2, pitch: is3D ? 50 : 0, duration: 1000 });
      });

      const marker = new maplibregl.Marker({ element: el, anchor: 'center' })
        .setLngLat(fac.coordinates)
        .addTo(map);

      facilityMarkersRef.current.push(marker);
    });
  };

  // Synchronize Operational Layer Toggles
  const syncToggles = (map: maplibregl.Map, toggles?: { [key: string]: boolean }) => {
    if (!map || !map.isStyleLoaded() || !toggles) return;

    const toggle = (layerId: string, visible: boolean) => {
      try {
        if (map.getLayer(layerId)) {
          map.setLayoutProperty(layerId, 'visibility', visible ? 'visible' : 'none');
        }
      } catch (e) {
        // Safe catch
      }
    };

    // Cyclone Layers
    toggle('cyclone-cone-fill', !!toggles.cycloneTracking);
    toggle('cyclone-cone-line', !!toggles.cycloneTracking);
    toggle('cyclone-historical-line', !!toggles.cycloneTracking);
    toggle('cyclone-historical-points', !!toggles.cycloneTracking);
    toggle('cyclone-forecast-line', !!toggles.cycloneTracking);
    toggle('cyclone-forecast-points', !!toggles.cycloneTracking);

    // Wind & Rain Layers
    toggle('cyclone-wind-fill', !!toggles.windRisk);
    toggle('cyclone-wind-line', !!toggles.windRisk);
    toggle('cyclone-rainfall-fill', !!toggles.rainfall);
    toggle('cyclone-rainfall-line', !!toggles.rainfall);

    // Flood & Landslide Layers
    toggle('flood-inundation-fill', !!toggles.floodRisk);
    toggle('flood-inundation-line', !!toggles.floodRisk);
    toggle('cyclone-landslide-fill', !!toggles.landslideRisk);
    toggle('cyclone-landslide-line', !!toggles.landslideRisk);

    // Multi-Hazard Risk Zones
    toggle('critical-danger-fill', !!toggles.criticalDanger);
    toggle('critical-danger-glow', !!toggles.criticalDanger);
    toggle('critical-danger-border', !!toggles.criticalDanger);
    toggle('high-risk-fill', !!toggles.highRisk);
    toggle('high-risk-border', !!toggles.highRisk);
    toggle('watch-zones-fill', !!toggles.watchZones);
    toggle('watch-zones-border', !!toggles.watchZones);
    toggle('safe-zones-fill', !!toggles.safeZones);
    toggle('safe-zones-border', !!toggles.safeZones);

    // GIS Infrastructure & Rivers
    toggle('rivers-glow', !!toggles.rivers);
    toggle('rivers-bed', !!toggles.rivers);
    toggle('rivers-core', !!toggles.rivers);
    toggle('river-flow-particles', !!toggles.rivers);
    toggle('roads-casing', !!toggles.roads);
    toggle('roads-layer', !!toggles.roads);
    toggle('district-boundary-line', !!toggles.districtBoundary);
  };

  useEffect(() => {
    if (mapRef.current && isLoadedRef.current) {
      syncToggles(mapRef.current, layerToggles);
    }
  }, [layerToggles]);

  // Camera Presets
  const setPresetView = (preset: 'DISTRICT' | 'VALLEY' | 'INCIDENT') => {
    if (!mapRef.current || !isLoadedRef.current) return;
    const map = mapRef.current;

    try {
      if (preset === 'DISTRICT') {
        map.flyTo({ center: [76.1200, 11.6500], zoom: 10.0, pitch: is3D ? 45 : 0, bearing: 0, duration: 1400 });
      } else if (preset === 'VALLEY') {
        // Oblique river valley perspective looking up the Western Ghats gorge
        map.flyTo({ center: [76.1360, 11.5450], zoom: 12.8, pitch: 64, bearing: 35, duration: 1600 });
      } else if (preset === 'INCIDENT') {
        // Find highest risk active incident
        const highest = [...currentLocations].sort((a, b) => b.risk_score - a.risk_score)[0];
        if (highest) {
          onSelectLocation(highest);
          setActivePopupLocation(highest);
          map.flyTo({ center: highest.coordinates, zoom: 13.5, pitch: is3D ? 65 : 15, bearing: -15, duration: 1500 });
        }
      }
    } catch (e) {
      console.warn('Preset view error:', e);
    }
  };

  return (
    <div className="relative w-full h-full flex flex-col bg-[#050811] overflow-hidden select-none">

      {/* 1. TOP BAR: REAL-TIME CRITICAL DISASTER ALERT (20-25% reduced padding with [−] collapse toggle) */}
      {realtimeAlert.show && (
        bannerCollapsed ? (
          <div className="z-20 bg-red-950/90 border-b border-red-600/60 px-3 py-0.5 flex items-center justify-between text-[11px] backdrop-blur-md shadow-xl">
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
              <span className="font-bold text-red-200">🔴 T+{activeStepData.step} ALERT: Chaliyar crest 6.10m | Route B Cutoff</span>
              <span className="text-gray-400 hidden sm:inline">| Chooralmala bridge submerged</span>
            </div>
            <button
              onClick={() => setBannerCollapsed(false)}
              className="text-[10px] bg-red-900/70 hover:bg-red-800 text-red-200 px-2 py-0.5 rounded border border-red-500/40 font-mono font-bold transition flex items-center space-x-1"
              title="Expand critical disaster alert"
            >
              <span>+</span>
              <span>EXPAND</span>
            </button>
          </div>
        ) : (
          <div className="z-20 bg-red-950/95 border-b border-red-600/80 px-3 py-1 flex items-center justify-between text-xs backdrop-blur-md shadow-2xl">
            <div className="flex items-center space-x-2.5 truncate">
              <span className="flex h-2 w-2 relative shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
              </span>
              <span className="font-black text-red-100 uppercase tracking-wide text-[11px] shrink-0">{realtimeAlert.title}</span>
              <span className="text-red-200/90 text-[11px] hidden md:inline truncate">{realtimeAlert.details}</span>
            </div>
            <div className="flex items-center space-x-2 shrink-0 ml-2">
              <span className="hidden lg:inline bg-red-900/80 text-red-100 border border-red-500/60 px-2 py-0.5 rounded text-[9.5px] font-bold tracking-wide uppercase">
                {realtimeAlert.action}
              </span>
              <button
                onClick={() => setBannerCollapsed(true)}
                className="text-red-300 hover:text-white px-1.5 py-0.5 rounded hover:bg-red-900/50 font-mono text-[11px] font-bold"
                title="Collapse alert banner"
              >
                [−]
              </button>
              <button
                onClick={() => setRealtimeAlert((prev) => ({ ...prev, show: false }))}
                className="text-red-300 hover:text-white p-1 rounded hover:bg-red-900/50"
                title="Dismiss alert"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )
      )}

      {/* 2. MAP CANVAS */}
      <div className="relative flex-1 w-full h-full">
        <div ref={mapContainerRef} className="w-full h-full" />

        {/* 3. 48-HOUR PREDICTIVE EARLY DETECTION TIMELINE HUD (Compact 2-row layout <=10% map height) */}
        <div className="absolute top-2.5 left-1/2 -translate-x-1/2 z-20 bg-[#0f172a]/95 border border-cyan-500/40 rounded-xl px-2.5 py-1.5 shadow-2xl backdrop-blur-md flex flex-col items-center gap-1 max-w-[95vw]">
          {/* Row 1: Header + Step Buttons + Play/Pause */}
          <div className="flex items-center space-x-1.5">
            <div className="flex items-center space-x-1 text-cyan-400 text-[10.5px] font-black uppercase tracking-wider pr-1.5 border-r border-gray-700">
              <Clock className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
              <span className="hidden sm:inline">PREDICTIVE TIMELINE</span>
              <span className="sm:hidden">TIMELINE</span>
            </div>

            {/* Timeline Step Buttons */}
            <div className="flex items-center space-x-1">
              {CYCLONE_TIMELINE_STEPS.map((step, idx) => (
                <button
                  key={step.step}
                  onClick={() => handleSelectStep(idx)}
                  className={`px-1.5 py-0.5 text-[11px] rounded font-bold transition-all flex items-center space-x-1 ${
                    timelineStep === idx
                      ? 'bg-red-600 text-white shadow-md shadow-red-600/40 border border-red-400 ring-1 ring-white/30'
                      : 'bg-gray-800/90 text-gray-300 hover:bg-gray-700 border border-gray-700'
                  }`}
                  title={step.label}
                >
                  <span>{step.step}</span>
                </button>
              ))}
            </div>

            {/* Auto-Play Button */}
            <button
              onClick={() => setIsPlayingTimeline(!isPlayingTimeline)}
              className={`px-2 py-0.5 text-[10px] rounded font-bold flex items-center space-x-1 transition-colors ${
                isPlayingTimeline
                  ? 'bg-amber-600 text-white animate-pulse'
                  : 'bg-gray-800 text-cyan-300 hover:bg-gray-700 border border-gray-700'
              }`}
              title={isPlayingTimeline ? 'Pause auto progression' : 'Play continuous timeline simulation'}
            >
              {isPlayingTimeline ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
              <span>{isPlayingTimeline ? 'PAUSE' : 'PLAY'}</span>
            </button>
          </div>

          {/* Row 2: Single-line Telemetry Summary */}
          <div className="flex items-center space-x-2 text-[9.5px] text-gray-300 border-t border-gray-800/80 pt-0.5 font-mono">
            <span>Lead: <strong className="text-red-400">{activeStepData.lead_window?.split(' ')[0] || '1h 45m'}</strong></span>
            <span className="text-gray-600">•</span>
            <span>Rain: <strong className="text-cyan-400">+{activeStepData.rain_rate_mm_hr || 18.4}mm/h</strong></span>
            <span className="text-gray-600">•</span>
            <span>River: <strong className="text-blue-400">{activeStepData.river_level_m || 5.85}m ({activeStepData.river_rate_m_hr})</strong></span>
            <span className="text-gray-600">•</span>
            <span>Soil/FoS: <strong className="text-amber-400">{activeStepData.soil_saturation_pct}% ({activeStepData.slope_fos})</strong></span>
            <span className="text-gray-600">•</span>
            <span>Blocked: <strong className="text-red-400">{activeStepData.blocked_roads ?? 7}</strong></span>
          </div>
        </div>

        {/* 4. SEARCH / GEOCODER (Top-Left, 240px wide) */}
        <div className="absolute top-2.5 left-2.5 z-20 w-60">
          <div className="relative">
            <input
              type="text"
              placeholder="Find address, ward, mountain..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              className="w-full bg-gray-900/95 border border-gray-700 focus:border-cyan-500 rounded-lg pl-7 pr-2.5 py-1 text-xs text-white placeholder-gray-400 focus:outline-none shadow-xl backdrop-blur-md"
            />
            <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2 top-2" />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1.5 text-gray-400 hover:text-white"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {searchFocused && searchQuery && (
            <div className="absolute left-0 right-0 mt-1 bg-[#0f172a] border border-gray-700 rounded-lg shadow-2xl max-h-48 overflow-y-auto z-30">
              {searchSuggestions.map((loc) => (
                <div
                  key={loc.id}
                  onClick={() => {
                    onSelectLocation(loc);
                    setActivePopupLocation(loc);
                    setSearchQuery('');
                    setSearchFocused(false);
                    mapRef.current?.flyTo({ center: loc.coordinates, zoom: 13, pitch: is3D ? 55 : 0, duration: 1200 });
                  }}
                  className="px-2.5 py-1.5 text-xs hover:bg-gray-800 cursor-pointer border-b border-gray-800 last:border-0 flex items-center justify-between"
                >
                  <div>
                    <span className="font-bold text-white text-[11px]">{loc.name}</span>
                    <span className="text-[9px] text-gray-400 ml-1">({loc.taluk})</span>
                  </div>
                  <span className={`text-[9px] px-1 py-0.5 rounded font-black ${
                    loc.risk_level === 'CRITICAL' ? 'bg-red-600 text-white' :
                    loc.risk_level === 'HIGH_RISK' ? 'bg-orange-600 text-white' :
                    loc.risk_level === 'WATCH' ? 'bg-yellow-600 text-black' : 'bg-blue-600 text-white'
                  }`}>
                    {loc.risk_score}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 5. CAMERA & MODE CONTROLS (Top-Right, Compact horizontal bar) */}
        <div className="absolute top-2.5 right-2.5 z-20 flex items-center space-x-1.5">
          {/* 2D / 3D Terrain Switcher */}
          <div className="bg-gray-900/90 border border-gray-700 rounded-lg p-0.5 flex items-center shadow-xl backdrop-blur-md">
            <button
              onClick={toggle3DMode}
              className={`px-2 py-0.5 text-[11px] font-bold rounded flex items-center space-x-1 transition-colors ${
                !is3D ? 'bg-cyan-600 text-white shadow' : 'text-gray-400 hover:text-white'
              }`}
            >
              <Map className="w-3 h-3" />
              <span>2D</span>
            </button>
            <button
              onClick={toggle3DMode}
              className={`px-2 py-0.5 text-[11px] font-bold rounded flex items-center space-x-1 transition-colors ${
                is3D ? 'bg-cyan-600 text-white shadow' : 'text-gray-400 hover:text-white'
              }`}
            >
              <Mountain className="w-3 h-3" />
              <span>3D TERRAIN</span>
            </button>
          </div>

          {/* Quick Camera Presets */}
          <div className="hidden sm:flex bg-gray-900/90 border border-gray-700 rounded-lg p-0.5 shadow-xl backdrop-blur-md items-center">
            <button
              onClick={() => setPresetView('DISTRICT')}
              className="px-2 py-0.5 text-[10.5px] font-semibold text-gray-300 hover:text-white hover:bg-gray-800 rounded"
              title="Overview of all Wayanad"
            >
              DISTRICT
            </button>
            <button
              onClick={() => setPresetView('VALLEY')}
              className="px-2 py-0.5 text-[10.5px] font-semibold text-gray-300 hover:text-white hover:bg-gray-800 rounded"
              title="Oblique perspective down river gorge"
            >
              VALLEY
            </button>
            <button
              onClick={() => setPresetView('INCIDENT')}
              className="px-2 py-0.5 text-[10.5px] font-black text-red-400 hover:text-red-300 hover:bg-red-950/60 rounded flex items-center space-x-1"
              title="Zoom to highest-risk active incident"
            >
              <Crosshair className="w-3 h-3 text-red-400" />
              <span>INCIDENT</span>
            </button>
          </div>
        </div>

        {/* 6. DOCKED SELECTED LOCATION DETAIL PANEL (Slide-over Bottom-Right, completely clear of controls) */}
        {activePopupLocation && (
          <div className="absolute bottom-6 right-14 z-30 w-80 sm:w-96 max-w-[90vw] bg-[#0b1329]/95 border border-cyan-500/50 rounded-2xl shadow-2xl p-4 text-xs backdrop-blur-xl animate-fadeIn">
            <div className="flex items-start justify-between pb-2 border-b border-gray-800">
              <div>
                <div className="flex items-center space-x-2">
                  <h4 className="font-black text-white text-sm uppercase tracking-wide">{activePopupLocation.name}</h4>
                  <span className={`text-[9px] px-2 py-0.5 rounded font-black ${
                    activePopupLocation.risk_level === 'CRITICAL' ? 'bg-red-600 text-white animate-pulse' :
                    activePopupLocation.risk_level === 'HIGH_RISK' ? 'bg-orange-600 text-white' :
                    activePopupLocation.risk_level === 'WATCH' ? 'bg-yellow-600 text-black' : 'bg-blue-600 text-white'
                  }`}>
                    {activePopupLocation.risk_level}
                  </span>
                </div>
                <span className="text-[10px] text-gray-400">Taluk: {activePopupLocation.taluk} | Elev: {activePopupLocation.elevation_m}m ASL</span>
              </div>
              <button
                onClick={() => setActivePopupLocation(null)}
                className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-gray-800 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Pre-Impact Lead Time Countdown Banner */}
            <div className="my-2.5 p-2 rounded-xl bg-gradient-to-r from-red-950/70 to-amber-950/50 border border-red-500/40 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-red-400 animate-pulse" />
                <div>
                  <span className="text-[9px] uppercase font-bold text-gray-400 block">Pre-Impact Lead Window</span>
                  <span className="text-sm font-black text-white font-mono">{activePopupLocation.lead_time_formatted || activePopupLocation.time_to_impact}</span>
                </div>
              </div>
              <span className={`text-[9px] px-2 py-0.5 rounded-full font-black uppercase ${
                activePopupLocation.evac_priority?.includes('P1') ? 'bg-red-600 text-white animate-pulse' :
                activePopupLocation.evac_priority?.includes('P2') ? 'bg-orange-600 text-white' :
                'bg-cyan-600 text-white'
              }`}>
                {activePopupLocation.evac_priority || 'PRIORITY 1'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 my-2">
              <div className="bg-gray-900/90 p-2 rounded-xl border border-gray-800">
                <span className="text-[10px] text-gray-400 block font-medium">Exposed Population</span>
                <span className="text-sm font-black text-white">{activePopupLocation.population_exposed.toLocaleString()}</span>
                <span className="text-[9px] text-red-400 block mt-0.5">High Density</span>
              </div>
              <div className="bg-gray-900/90 p-2 rounded-xl border border-gray-800">
                <span className="text-[10px] text-gray-400 block font-medium">Vulnerable Count</span>
                <span className="text-sm font-black text-amber-400">{activePopupLocation.vulnerable_population.toLocaleString()}</span>
                <span className="text-[9px] text-amber-300 block mt-0.5">Elderly & Children</span>
              </div>
            </div>

            <div className="space-y-1 text-[11px] text-gray-300 py-1">
              <div><strong className="text-gray-400">Primary Hazard:</strong> {activePopupLocation.primary_hazard}</div>
              <div><strong className="text-gray-400">Trend:</strong> <span className="text-red-400 font-bold">{activePopupLocation.trend}</span></div>
              <div><strong className="text-gray-400">Assigned Safe Hub:</strong> <span className="text-emerald-300 font-semibold">{activePopupLocation.nearest_shelter} ({activePopupLocation.shelter_distance_km} km)</span></div>
            </div>

            <div className="mt-3 pt-2 border-t border-gray-800 flex items-center justify-between">
              <span className="text-[9px] text-gray-500 font-mono">Updated: {activePopupLocation.last_updated} IST</span>
              {onNavigateToRouting && (
                <button
                  onClick={onNavigateToRouting}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs flex items-center space-x-1.5 shadow-lg shadow-emerald-600/30 transition"
                >
                  <Navigation className="w-3.5 h-3.5" />
                  <span>VIEW SAFE ROUTE</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* 6.5 LIVE SHELTER BALANCING HUD (Top-Center below Stepper when Shelter KPI active) */}
        {highlightShelters && (
          <div className="absolute top-16 left-1/2 -translate-x-1/2 z-20 bg-emerald-950/95 border border-emerald-400/80 rounded-xl px-4 py-2 shadow-2xl backdrop-blur-md flex items-center space-x-3 text-xs animate-fadeIn max-w-[90vw]">
            <div className="w-6 h-6 rounded-full bg-emerald-600 border border-white flex items-center justify-center shrink-0 shadow">
              <Home className="w-3.5 h-3.5 text-white" />
            </div>
            <div>
              <span className="font-black text-emerald-100 uppercase tracking-wide mr-2">
                🟢 REAL-TIME CARRYING CAPACITY BALANCING ACTIVE:
              </span>
              <span className="text-emerald-200">
                <strong>7,160 Headroom Ready</strong> across 6 Certified Multi-Hazard Safe Hubs (0% Overcrowding Target)
              </span>
            </div>
            <button
              onClick={onToggleShelterHighlight}
              className="text-emerald-300 hover:text-white p-1 rounded hover:bg-emerald-900/50"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* 7. MAP LEGEND (Bottom-Left: Collapsed to floating button) */}
        <div className="absolute bottom-3 left-3 z-20">
          {legendOpen ? (
            <div className="bg-[#0f172a]/95 border border-gray-800 rounded-xl p-3 shadow-2xl text-[11px] backdrop-blur-md w-64 max-h-72 overflow-y-auto animate-fadeIn">
              <div className="flex items-center justify-between pb-1.5 border-b border-gray-800 mb-2">
                <span className="font-black text-white uppercase tracking-wide flex items-center space-x-1">
                  <Layers className="w-3.5 h-3.5 text-cyan-400" />
                  <span>COMMAND GIS LEGEND</span>
                </span>
                <button onClick={() => setLegendOpen(false)} className="text-gray-400 hover:text-white p-0.5 rounded hover:bg-gray-800">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Cyclone Section */}
              <div className="mb-2">
                <span className="text-[10px] font-bold text-cyan-400 block mb-1">CYCLONE & WIND</span>
                <div className="space-y-1 text-gray-300">
                  <div className="flex items-center space-x-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-spin"></span>
                    <span>Current Cyclone Center</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="w-4 h-0.5 bg-blue-500"></span>
                    <span>Historical Track (Past)</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="w-4 h-0.5 border-b border-dashed border-amber-400"></span>
                    <span>Forecast Track (Dashed)</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="w-3 h-2 bg-amber-500/20 border border-amber-400/60 rounded-sm"></span>
                    <span>Uncertainty Cone</span>
                  </div>
                </div>
              </div>

              {/* Hydrology & River Flow Section */}
              <div className="mb-2 pt-1.5 border-t border-gray-800">
                <span className="text-[10px] font-bold text-sky-400 block mb-1">HYDROLOGY & 3D TERRAIN</span>
                <div className="space-y-1 text-gray-300">
                  <div className="flex items-center space-x-2">
                    <span className="w-3 h-1 bg-cyan-400 rounded-sm"></span>
                    <span>Downstream River Channels</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>
                    <span>Flow Particle Direction</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="w-3 h-2 bg-blue-600/40 border border-cyan-400 rounded-sm"></span>
                    <span>Flood Inundation Polygons</span>
                  </div>
                </div>
              </div>

              {/* Risk Level Section */}
              <div className="mb-2 pt-1.5 border-t border-gray-800">
                <span className="text-[10px] font-bold text-gray-400 block mb-1">MULTI-HAZARD RISK HIERARCHY</span>
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center space-x-1.5 text-red-400 font-semibold">
                      <span className="w-2 h-2 rounded-full bg-red-600"></span>
                      <span>CRITICAL</span>
                    </span>
                    <span className="text-gray-400 font-mono">80–100</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center space-x-1.5 text-orange-400 font-semibold">
                      <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                      <span>HIGH RISK</span>
                    </span>
                    <span className="text-gray-400 font-mono">60–80</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center space-x-1.5 text-yellow-400 font-semibold">
                      <span className="w-2 h-2 rounded-full bg-yellow-500"></span>
                      <span>WATCH</span>
                    </span>
                    <span className="text-gray-400 font-mono">30–60</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center space-x-1.5 text-sky-400 font-semibold">
                      <span className="w-2 h-2 rounded-full bg-sky-500"></span>
                      <span>SAFE</span>
                    </span>
                    <span className="text-gray-400 font-mono">0–30</span>
                  </div>
                </div>
              </div>

              {/* Infrastructure Section */}
              <div className="pt-1.5 border-t border-gray-800">
                <span className="text-[10px] font-bold text-gray-400 block mb-1">EVACUATION CORRIDORS</span>
                <div className="space-y-1 text-gray-300">
                  <div className="flex items-center space-x-2">
                    <span className="w-3 h-1 bg-emerald-500 rounded-sm"></span>
                    <span>Safe Corridor (Route B/C)</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="w-3 h-1 bg-red-600 rounded-sm"></span>
                    <span>Blocked / Submerged Crossing</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-emerald-400">🏠</span>
                    <span>Relief Hub with Headroom</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setLegendOpen(true)}
              className="bg-[#0f172a]/90 hover:bg-gray-800 text-gray-300 hover:text-white p-2 rounded-xl border border-gray-700 shadow-2xl flex items-center space-x-2 backdrop-blur-md"
              title="Open GIS Map Legend"
            >
              <Layers className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-bold">LEGEND</span>
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
