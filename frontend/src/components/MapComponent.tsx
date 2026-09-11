import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { Zone, Shelter, EvacuationRouteOption } from '../types';

interface MapComponentProps {
  zones: Zone[];
  shelters: Shelter[];
  selectedZone: Zone | null;
  onSelectZone: (zone: Zone) => void;
  activeRoutes?: EvacuationRouteOption[];
  showSatBasemap?: boolean;
}

export const MapComponent: React.FC<MapComponentProps> = ({
  zones,
  shelters,
  selectedZone,
  onSelectZone,
  activeRoutes = [],
  showSatBasemap = false,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const layersRef = useRef<{ [key: string]: L.LayerGroup }>({});

  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // Initialize Leaflet Map centered on Kaveri-Wayanad Basin
    const map = L.map(mapContainerRef.current, {
      center: [11.60, 76.12],
      zoom: 11,
      zoomControl: true,
      attributionControl: false,
    });

    // Dark Tactical Tile Layer
    const darkTiles = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
      subdomains: 'abcd',
    }).addTo(map);

    // Satellite Imagery Layer
    const satTiles = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      maxZoom: 19,
    });

    layersRef.current['dark'] = L.layerGroup([darkTiles]);
    layersRef.current['sat'] = L.layerGroup([satTiles]);
    layersRef.current['zones'] = L.layerGroup().addTo(map);
    layersRef.current['shelters'] = L.layerGroup().addTo(map);
    layersRef.current['routes'] = L.layerGroup().addTo(map);

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Handle Basemap Switch
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;
    if (showSatBasemap) {
      map.removeLayer(layersRef.current['dark']);
      map.addLayer(layersRef.current['sat']);
    } else {
      map.removeLayer(layersRef.current['sat']);
      map.addLayer(layersRef.current['dark']);
    }
  }, [showSatBasemap]);

  // Update Zones Layer
  useEffect(() => {
    if (!mapInstanceRef.current || !layersRef.current['zones']) return;
    const group = layersRef.current['zones'];
    group.clearLayers();

    zones.forEach((zone) => {
      // Color coding based on risk level
      let color = '#22c55e'; // Safe green
      let fillOpacity = 0.35;
      if (zone.risk_score.risk_level === 'CRITICAL') {
        color = '#ef4444'; // Red
        fillOpacity = 0.65;
      } else if (zone.risk_score.risk_level === 'HIGH_RISK') {
        color = '#f97316'; // Orange
        fillOpacity = 0.50;
      } else if (zone.risk_score.risk_level === 'WATCH') {
        color = '#eab308'; // Yellow
        fillOpacity = 0.40;
      }

      const isSelected = selectedZone?.id === zone.id;

      // Draw Polygon
      const polygon = L.polygon(zone.polygon_coords, {
        color: isSelected ? '#ffffff' : color,
        weight: isSelected ? 3 : 2,
        fillColor: color,
        fillOpacity: isSelected ? 0.8 : fillOpacity,
        dashArray: isSelected ? '4' : undefined,
      }).addTo(group);

      // Centroid Marker with label
      const markerHtml = `
        <div style="
          background: ${color};
          color: white;
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 10px;
          font-weight: bold;
          white-space: nowrap;
          box-shadow: 0 2px 4px rgba(0,0,0,0.5);
          border: 1px solid rgba(255,255,255,0.4);
          cursor: pointer;
        ">
          ${zone.name} (${zone.risk_score.normalized_score.toFixed(0)})
        </div>
      `;

      const icon = L.divIcon({
        html: markerHtml,
        className: 'zone-centroid-label',
        iconAnchor: [35, 12],
      });

      const marker = L.marker([zone.centroid_lat, zone.centroid_lng], { icon }).addTo(group);

      const onClick = () => {
        onSelectZone(zone);
      };

      polygon.on('click', onClick);
      marker.on('click', onClick);
    });
  }, [zones, selectedZone, onSelectZone]);

  // Update Shelters Layer
  useEffect(() => {
    if (!mapInstanceRef.current || !layersRef.current['shelters']) return;
    const group = layersRef.current['shelters'];
    group.clearLayers();

    shelters.forEach((shelter) => {
      let iconColor = '#22c55e'; // Green available
      let label = '🟢 AVAILABLE';
      if (shelter.status === 'UNSAFE') {
        iconColor = '#1f2937';
        label = '⚫ UNSAFE';
      } else if (shelter.status === 'OVER_CAPACITY') {
        iconColor = '#ef4444';
        label = '🔴 FULL';
      } else if (shelter.status === 'NEAR_CAPACITY') {
        iconColor = '#eab308';
        label = '🟡 HIGH OCC.';
      }

      const markerHtml = `
        <div style="
          display: flex;
          align-items: center;
          background: #111827;
          border: 1.5px solid ${iconColor};
          padding: 2px 6px;
          border-radius: 12px;
          color: #f3f4f6;
          font-size: 9px;
          font-weight: 600;
          box-shadow: 0 4px 6px rgba(0,0,0,0.6);
          white-space: nowrap;
        ">
          <span style="display:inline-block; width:7px; height:7px; border-radius:50%; background:${iconColor}; margin-right:4px;"></span>
          ${shelter.name.split(' ')[0]} (${shelter.available_capacity})
        </div>
      `;

      const icon = L.divIcon({
        html: markerHtml,
        className: 'shelter-marker-icon',
        iconAnchor: [40, 10],
      });

      const marker = L.marker([shelter.lat, shelter.lng], { icon }).addTo(group);
      marker.bindPopup(`
        <div style="font-size: 11px; line-height: 1.4;">
          <b style="font-size: 12px; color:#60a5fa;">${shelter.name}</b><br/>
          <b>Status:</b> ${shelter.status}<br/>
          <b>Safe Headroom:</b> ${shelter.available_capacity} / ${shelter.max_capacity}<br/>
          <b>Drinking Water:</b> ${shelter.resources.water_liters_per_person_day} L/person/day<br/>
          <b>Food Stock:</b> ${shelter.resources.food_stock_days} days<br/>
          <b>Medical Support:</b> ${shelter.resources.medical_staff_count} doctors, ${shelter.resources.isolation_beds} beds<br/>
          <b>Structural Safety:</b> Grade ${shelter.resources.structural_safety_grade}
        </div>
      `);
    });
  }, [shelters]);

  // Update Routes Layer
  useEffect(() => {
    if (!mapInstanceRef.current || !layersRef.current['routes']) return;
    const group = layersRef.current['routes'];
    group.clearLayers();

    activeRoutes.forEach((route) => {
      let color = '#22c55e'; // Optimal green
      let dashArray = undefined;
      let weight = 5;

      if (route.type === 'REJECTED') {
        color = '#ef4444'; // Red dashed for hazardous route
        dashArray = '6, 6';
        weight = 4;
      } else if (route.type === 'SECONDARY') {
        color = '#eab308'; // Yellow for alternative detour
        weight = 4;
      }

      const polyline = L.polyline(route.waypoints, {
        color,
        weight,
        dashArray,
        opacity: 0.9,
      }).addTo(group);

      polyline.bindPopup(`
        <div style="font-size:11px;">
          <b style="color:${color};">${route.name}</b><br/>
          <b>Distance:</b> ${route.total_distance_km} km | <b>Travel Time:</b> ${route.total_travel_time_min} min<br/>
          <b>Hazard Score:</b> ${route.hazard_exposure_score}/100<br/>
          <p style="margin-top:4px; color:#d1d5db;">${route.description}</p>
          ${route.rejection_reason ? `<p style="color:#f87171; font-weight:bold;">${route.rejection_reason}</p>` : ''}
        </div>
      `);
    });

    if (activeRoutes.length > 0 && activeRoutes[0].waypoints.length > 0) {
      const bounds = L.latLngBounds(activeRoutes[0].waypoints);
      mapInstanceRef.current.fitBounds(bounds, { padding: [40, 40] });
    }
  }, [activeRoutes]);

  return <div ref={mapContainerRef} className="w-full h-full relative" />;
};
