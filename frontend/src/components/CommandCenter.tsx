import React, { useState } from 'react';
import {
  Users, Wheat, Droplets, MapPin, Layers, Search, ShieldAlert,
  AlertTriangle, CheckSquare, Square, ChevronRight, ArrowRight,
  Activity, ExternalLink, Calendar, Info, ChevronLeft, Mountain,
  Wind, CloudRain, Waves, Flame, Radio, Zap, Clock
} from 'lucide-react';
import { Zone, Shelter, EvacuationRouteOption } from '../types';
import { RealGISDisasterMap } from './RealGISDisasterMap';
import {
  WAYANAD_LOCATIONS,
  CYCLONE_LIVE_DATA,
  CYCLONE_TIMELINE_STEPS,
  getLocationsForCycloneStep,
  GeoLocation
} from '../data/wayanadGISData';

interface CommandCenterProps {
  zones: Zone[];
  shelters: Shelter[];
  selectedZone: Zone | null;
  onSelectZone: (zone: Zone) => void;
  activeRoutes: EvacuationRouteOption[];
  onNavigateToRouting: (zone: Zone) => void;
  is3DMode: boolean;
  setIs3DMode: (val: boolean) => void;
  highlightShelters?: boolean;
  onToggleShelterHighlight?: () => void;
  timelineStep?: number;
  onTimelineStepChange?: (stepIdx: number) => void;
  blockedRoadsCount?: number;
}

export const CommandCenter: React.FC<CommandCenterProps> = ({
  zones,
  shelters,
  selectedZone,
  onSelectZone,
  activeRoutes,
  onNavigateToRouting,
  is3DMode,
  setIs3DMode,
  highlightShelters = false,
  onToggleShelterHighlight,
  timelineStep: externalTimelineStep,
  onTimelineStepChange,
  blockedRoadsCount
}) => {
  const [leftSidebarOpen, setLeftSidebarOpen] = useState<boolean>(true);
  const [rightSidebarOpen, setRightSidebarOpen] = useState<boolean>(true);
  const [internalStep, setInternalStep] = useState<number>(3);
  const cycloneStep = externalTimelineStep !== undefined ? externalTimelineStep : internalStep;

  const handleTimelineStepChange = (stepIdx: number) => {
    setInternalStep(stepIdx);
    if (onTimelineStepChange) {
      onTimelineStepChange(stepIdx);
    }
  };

  // 14 Complete Layer Checkboxes (Section 15 of Specification)
  const [layers, setLayers] = useState({
    satelliteOrDark: true,      // ☑ Satellite / Dark Basemap
    terrain3D: true,            // ☑ 3D Terrain
    floodRisk: true,            // ☑ Flood Risk
    landslideRisk: true,        // ☑ Landslide Risk
    cycloneTracking: true,      // ☑ Cyclone Tracking
    windRisk: true,             // ☑ Wind Risk
    rainfall: true,             // ☑ Rainfall
    populationExposure: true,   // ☑ Population Exposure
    infrastructure: true,       // ☑ Infrastructure
    rivers: true,               // ☑ Rivers
    roads: true,                // ☑ Roads
    evacuationRoutes: true,     // ☑ Evacuation Routes
    shelters: true,             // ☑ Shelters
    criticalDanger: true,       // ☑ Critical Red Zones
    highRisk: true,             // ☑ High Risk Orange Zones
    watchZones: true,           // ☑ Watch Yellow Zones
    safeZones: true,            // ☑ Safe Blue Zones
    districtBoundary: true      // ☑ District Boundary
  });

  const toggleLayer = (key: keyof typeof layers) => {
    setLayers((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Selected GeoLocation state for immediate reactive map navigation
  const [selectedGeoLocation, setSelectedGeoLocation] = useState<GeoLocation | null>(null);

  // Dynamic Locations based on cyclone timeline step
  const dynamicLocations = getLocationsForCycloneStep(cycloneStep);
  const activeStepData = CYCLONE_TIMELINE_STEPS[cycloneStep];

  // Matched selected location (prioritize user click, then backend selectedZone match, then first location)
  const activeLocation: GeoLocation =
    selectedGeoLocation ||
    dynamicLocations.find((l) => l.id === selectedZone?.id) ||
    dynamicLocations[0];

  const handleSelectLocation = (loc: GeoLocation) => {
    setSelectedGeoLocation(loc);
    const found = zones.find((z) => z.id === loc.id || z.name.toLowerCase().includes(loc.name.toLowerCase().split(' ')[0]));
    if (found) {
      onSelectZone(found);
    }
  };

  // Sorted Locations by EVACUATION PRIORITY & PRE-IMPACT LEAD TIME
  const sortedLocations = [...dynamicLocations].sort((a, b) => {
    const timeA = a.lead_time_minutes ?? 9999;
    const timeB = b.lead_time_minutes ?? 9999;
    if (timeA !== timeB) return timeA - timeB; // Shortest countdown first!
    return b.risk_score - a.risk_score;
  });
  const maxPop = sortedLocations[0]?.population_exposed || 5200;

  return (
    <div className="flex flex-col h-[calc(100vh-136px)] min-h-[620px] bg-[#050811] text-gray-100 overflow-hidden font-sans">

      {/* ========================================================= */}
      {/* MULTI-HAZARD FLOW BAR (Section 18)                        */}
      {/* ========================================================= */}
      <div className="bg-[#0b1120] border-b border-gray-800 px-3 py-1.5 flex items-center justify-between overflow-x-auto text-[11px] shrink-0">
        <div className="flex items-center space-x-2 shrink-0">
          <span className="font-black text-white uppercase tracking-wider flex items-center space-x-1">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>MULTI-HAZARD CASCADE:</span>
          </span>
        </div>

        <div className="flex items-center space-x-2 shrink-0 text-gray-300">
          <span className="bg-red-950/80 text-red-200 border border-red-500/50 px-2 py-0.5 rounded font-bold flex items-center space-x-1">
            <Wind className="w-3 h-3 text-red-400" />
            <span>🌪️ CYCLONE SHAKTI ({activeStepData.wind_kmh} km/h)</span>
          </span>
          <span className="text-gray-500">→</span>

          <span className="bg-cyan-950/80 text-cyan-200 border border-cyan-500/50 px-2 py-0.5 rounded font-semibold flex items-center space-x-1">
            <CloudRain className="w-3 h-3 text-cyan-400" />
            <span>🌧️ RAINFALL ({activeStepData.rainfall_12h_mm} mm)</span>
          </span>
          <span className="text-gray-500">→</span>

          <span className="bg-blue-950/80 text-blue-200 border border-blue-500/50 px-2 py-0.5 rounded font-semibold flex items-center space-x-1">
            <Waves className="w-3 h-3 text-blue-400" />
            <span>🌊 RIVER SURGE (+{activeStepData.river_surge_m} m)</span>
          </span>
          <span className="text-gray-500">→</span>

          <span className="bg-amber-950/80 text-amber-200 border border-amber-500/50 px-2 py-0.5 rounded font-semibold flex items-center space-x-1">
            <Mountain className="w-3 h-3 text-amber-400" />
            <span>⛰️ LANDSLIDE INSTABILITY (CRITICAL)</span>
          </span>
          <span className="text-gray-500">→</span>

          <span className="bg-purple-950/80 text-purple-200 border border-purple-500/50 px-2 py-0.5 rounded font-bold">
            👥 {activeStepData.exposed_population.toLocaleString()} EXPOSED
          </span>
          <span className="text-gray-500">→</span>

          <span className="bg-red-900/80 text-white px-2 py-0.5 rounded font-bold">
            🚧 {blockedRoadsCount ?? activeStepData.blocked_roads ?? 7} BLOCKED
          </span>
          <span className="text-gray-500">→</span>

          {activeStepData.route_b_status === 'BLOCKED' ? (
            <span className="bg-red-950/90 text-red-200 border border-red-500/80 px-2.5 py-0.5 rounded font-black flex items-center space-x-1 animate-pulse">
              <AlertTriangle className="w-3 h-3 text-red-400" />
              <span>🔴 ROUTE B CUTOFF (BRIDGE SUBMERGED) → ROUTE C ACTIVE</span>
            </span>
          ) : activeStepData.route_b_status === 'CAUTION' ? (
            <span className="bg-amber-950/90 text-amber-200 border border-amber-500/80 px-2.5 py-0.5 rounded font-bold flex items-center space-x-1">
              <AlertTriangle className="w-3 h-3 text-amber-400" />
              <span>🟡 ROUTE B ADVISORY (WATER RISING)</span>
            </span>
          ) : (
            <span className="bg-emerald-950/90 text-emerald-200 border border-emerald-500/60 px-2.5 py-0.5 rounded font-black flex items-center space-x-1">
              <ShieldAlert className="w-3 h-3 text-emerald-400" />
              <span>🟢 ROUTE B EVACUATION SAFE</span>
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden relative">

        {/* ========================================================= */}
        {/* LEFT SIDEBAR: FLOOD / CYCLONE / DISASTER MONITORING       */}
        {/* ========================================================= */}
        {leftSidebarOpen ? (
          <aside className="w-64 md:w-72 bg-[#0f172a]/95 border-r border-gray-800 flex flex-col shrink-0 overflow-y-auto z-10 shadow-2xl">
            {/* Header */}
            <div className="p-3 border-b border-gray-800 bg-gray-900/60 flex items-center justify-between">
              <div>
                <h2 className="text-xs font-black uppercase tracking-wider text-white flex items-center space-x-1.5">
                  <Activity className="w-3.5 h-3.5 text-cyan-400" />
                  <span>MULTI-HAZARD MONITORING</span>
                </h2>
                <div className="flex items-center space-x-1.5 text-[10px] text-gray-400 mt-0.5">
                  <MapPin className="w-3 h-3 text-red-400" />
                  <span>Region: <strong>Wayanad & Arabian Sea Basin</strong></span>
                </div>
              </div>
              <button
                onClick={() => setLeftSidebarOpen(false)}
                className="text-gray-400 hover:text-white p-1 rounded hover:bg-gray-800"
                title="Collapse sidebar"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>

            {/* 4 Rate-of-Rise Analytical Metric Cards */}
            <div className="p-3 grid grid-cols-2 gap-2 border-b border-gray-800">
              {/* Card 1: Rainfall Rate of Rise */}
              <div className="bg-gray-900/90 p-2.5 rounded-lg border border-gray-800">
                <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-tight flex items-center justify-between">
                  <span>RAINFALL SURGE</span>
                  <Droplets className="w-3 h-3 text-cyan-400" />
                </div>
                <div className="text-base font-black text-cyan-400 mt-0.5">
                  +{activeStepData.rain_rate_mm_hr || 18.4} <span className="text-[10px] font-normal text-gray-400">mm/hr</span>
                </div>
                <div className="text-[9px] text-red-400 font-bold flex items-center space-x-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
                  <span>⚠️ SURGE (&gt;10mm/h)</span>
                </div>
              </div>

              {/* Card 2: River Chaliyar Level */}
              <div className="bg-gray-900/90 p-2.5 rounded-lg border border-gray-800">
                <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-tight flex items-center justify-between">
                  <span>RIVER LEVEL</span>
                  <Activity className="w-3 h-3 text-blue-400" />
                </div>
                <div className="text-base font-black text-blue-400 mt-0.5">
                  {activeStepData.river_level_m || 5.85} <span className="text-[10px] font-normal text-gray-400">m</span>
                </div>
                <div className="text-[9px] text-amber-300 font-medium">
                  {activeStepData.river_rate_m_hr || '+0.42 m/hr'} (Danger: 4.5m)
                </div>
              </div>

              {/* Card 3: Soil Saturation & Landslide FoS Threshold */}
              <div className="bg-gray-900/90 p-2.5 rounded-lg border border-gray-800">
                <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-tight flex items-center justify-between">
                  <span>SOIL & SLOPE FoS</span>
                  <Mountain className="w-3 h-3 text-amber-400" />
                </div>
                <div className="text-base font-black text-amber-400 mt-0.5">
                  {activeStepData.soil_saturation_pct || 94.2}% <span className="text-[10px] font-normal text-gray-400">| FoS: {activeStepData.slope_fos}</span>
                </div>
                <div className={`text-[9px] font-bold ${
                  (activeStepData.slope_fos || 0.71) < 0.60 ? 'text-red-400 animate-pulse' : 'text-amber-400'
                }`}>
                  {(activeStepData.slope_fos || 0.71) < 0.60 ? '🔴 FoS < 0.60 FAILURE' : '⚠️ AT CRITICAL LIMIT'}
                </div>
              </div>

              {/* Card 4: Evacuation Lead Window */}
              <div className="bg-gray-900/90 p-2.5 rounded-lg border border-gray-800">
                <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-tight flex items-center justify-between">
                  <span>LEAD WINDOW</span>
                  <Clock className="w-3 h-3 text-red-400" />
                </div>
                <div className="text-base font-black text-red-400 mt-0.5 font-mono">
                  {activeStepData.lead_window?.split(' ')[0] || '1h 45m'}
                </div>
                <div className="text-[9px] text-emerald-400 font-medium">
                  P1 Corridor Active
                </div>
              </div>
            </div>

            {/* 14 Interactive Layer Checkboxes (Section 15) */}
            <div className="p-3 flex-1">
              <div className="text-[10px] font-black uppercase tracking-wider text-gray-400 mb-2 flex items-center justify-between">
                <span className="flex items-center space-x-1">
                  <Layers className="w-3 h-3 text-cyan-400" />
                  <span>OPERATIONAL GIS LAYERS (14)</span>
                </span>
                <span className="text-[9px] text-cyan-400 font-mono">ALL WORKING</span>
              </div>

              <div className="space-y-1.5 text-xs">
                {/* 1. Cyclone Tracking */}
                <label className="flex items-center space-x-2 p-1.5 rounded hover:bg-gray-800/80 cursor-pointer bg-red-950/20 border border-red-900/30">
                  <input
                    type="checkbox"
                    checked={layers.cycloneTracking}
                    onChange={() => toggleLayer('cycloneTracking')}
                    className="rounded border-gray-700 text-red-500 focus:ring-0 w-3.5 h-3.5 bg-gray-900"
                  />
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-spin"></span>
                  <span className="text-gray-200 font-semibold">Cyclone Tracking & Cone</span>
                </label>

                {/* 2. Wind Risk */}
                <label className="flex items-center space-x-2 p-1.5 rounded hover:bg-gray-800/80 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={layers.windRisk}
                    onChange={() => toggleLayer('windRisk')}
                    className="rounded border-gray-700 text-amber-500 focus:ring-0 w-3.5 h-3.5 bg-gray-900"
                  />
                  <span className="w-2.5 h-2.5 rounded bg-amber-500"></span>
                  <span className="text-gray-300">Wind Risk Zones</span>
                </label>

                {/* 3. Rainfall */}
                <label className="flex items-center space-x-2 p-1.5 rounded hover:bg-gray-800/80 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={layers.rainfall}
                    onChange={() => toggleLayer('rainfall')}
                    className="rounded border-gray-700 text-cyan-500 focus:ring-0 w-3.5 h-3.5 bg-gray-900"
                  />
                  <span className="w-2.5 h-2.5 rounded bg-cyan-400"></span>
                  <span className="text-gray-300">Rainfall Swath (&gt;180mm)</span>
                </label>

                {/* 4. Flood Risk */}
                <label className="flex items-center space-x-2 p-1.5 rounded hover:bg-gray-800/80 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={layers.floodRisk}
                    onChange={() => toggleLayer('floodRisk')}
                    className="rounded border-gray-700 text-blue-500 focus:ring-0 w-3.5 h-3.5 bg-gray-900"
                  />
                  <span className="w-2.5 h-2.5 rounded bg-blue-500"></span>
                  <span className="text-gray-300">Flood Inundation</span>
                </label>

                {/* 5. Landslide Risk */}
                <label className="flex items-center space-x-2 p-1.5 rounded hover:bg-gray-800/80 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={layers.landslideRisk}
                    onChange={() => toggleLayer('landslideRisk')}
                    className="rounded border-gray-700 text-orange-500 focus:ring-0 w-3.5 h-3.5 bg-gray-900"
                  />
                  <span className="w-2.5 h-2.5 rounded bg-orange-600"></span>
                  <span className="text-gray-300">Landslide Susceptibility</span>
                </label>

                {/* 6. Critical Danger Zones (Red) */}
                <label className="flex items-center space-x-2 p-1.5 rounded hover:bg-gray-800/80 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={layers.criticalDanger}
                    onChange={() => toggleLayer('criticalDanger')}
                    className="rounded border-gray-700 text-red-500 focus:ring-0 w-3.5 h-3.5 bg-gray-900"
                  />
                  <span className="w-2.5 h-2.5 rounded-full bg-red-600"></span>
                  <span className="text-gray-300 font-semibold text-red-300">Critical Red Zones (80-100)</span>
                </label>

                {/* 7. High Risk Zones (Orange) */}
                <label className="flex items-center space-x-2 p-1.5 rounded hover:bg-gray-800/80 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={layers.highRisk}
                    onChange={() => toggleLayer('highRisk')}
                    className="rounded border-gray-700 text-orange-500 focus:ring-0 w-3.5 h-3.5 bg-gray-900"
                  />
                  <span className="w-2.5 h-2.5 rounded-full bg-orange-500"></span>
                  <span className="text-gray-300">High Risk Orange (60-80)</span>
                </label>

                {/* 8. Watch Zones (Yellow) */}
                <label className="flex items-center space-x-2 p-1.5 rounded hover:bg-gray-800/80 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={layers.watchZones}
                    onChange={() => toggleLayer('watchZones')}
                    className="rounded border-gray-700 text-yellow-500 focus:ring-0 w-3.5 h-3.5 bg-gray-900"
                  />
                  <span className="w-2.5 h-2.5 rounded-full bg-yellow-500"></span>
                  <span className="text-gray-300">Watch Yellow (30-60)</span>
                </label>

                {/* 9. Safe Zones (Blue) */}
                <label className="flex items-center space-x-2 p-1.5 rounded hover:bg-gray-800/80 cursor-pointer bg-sky-950/20 border border-sky-900/30">
                  <input
                    type="checkbox"
                    checked={layers.safeZones}
                    onChange={() => toggleLayer('safeZones')}
                    className="rounded border-gray-700 text-sky-400 focus:ring-0 w-3.5 h-3.5 bg-gray-900"
                  />
                  <span className="w-2.5 h-2.5 rounded-full bg-sky-400"></span>
                  <span className="text-sky-300 font-semibold">Safe Blue Zones (0-30)</span>
                </label>

                {/* 10. Evacuation Routes */}
                <label className="flex items-center space-x-2 p-1.5 rounded hover:bg-gray-800/80 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={layers.evacuationRoutes}
                    onChange={() => toggleLayer('evacuationRoutes')}
                    className="rounded border-gray-700 text-emerald-500 focus:ring-0 w-3.5 h-3.5 bg-gray-900"
                  />
                  <span className="w-2.5 h-2.5 rounded bg-emerald-500"></span>
                  <span className="text-gray-300">Safe Evacuation Route B</span>
                </label>

                {/* 11. Roads & Blockages */}
                <label className="flex items-center space-x-2 p-1.5 rounded hover:bg-gray-800/80 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={layers.roads}
                    onChange={() => toggleLayer('roads')}
                    className="rounded border-gray-700 text-gray-400 focus:ring-0 w-3.5 h-3.5 bg-gray-900"
                  />
                  <span className="w-2.5 h-2.5 rounded bg-red-500"></span>
                  <span className="text-gray-300">Roads & Blockages</span>
                </label>

                {/* 12. Rivers */}
                <label className="flex items-center space-x-2 p-1.5 rounded hover:bg-gray-800/80 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={layers.rivers}
                    onChange={() => toggleLayer('rivers')}
                    className="rounded border-gray-700 text-cyan-400 focus:ring-0 w-3.5 h-3.5 bg-gray-900"
                  />
                  <span className="w-2.5 h-2.5 rounded bg-cyan-500"></span>
                  <span className="text-gray-300">River Network</span>
                </label>

                {/* 13. Shelters */}
                <label className="flex items-center space-x-2 p-1.5 rounded hover:bg-gray-800/80 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={layers.shelters}
                    onChange={() => toggleLayer('shelters')}
                    className="rounded border-gray-700 text-blue-400 focus:ring-0 w-3.5 h-3.5 bg-gray-900"
                  />
                  <span className="text-[10px]">🏠</span>
                  <span className="text-gray-300">Safe Shelters & Camps</span>
                </label>

                {/* 14. District Boundary */}
                <label className="flex items-center space-x-2 p-1.5 rounded hover:bg-gray-800/80 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={layers.districtBoundary}
                    onChange={() => toggleLayer('districtBoundary')}
                    className="rounded border-gray-700 text-gray-400 focus:ring-0 w-3.5 h-3.5 bg-gray-900"
                  />
                  <span className="w-2.5 h-0.5 border-b border-dashed border-gray-300"></span>
                  <span className="text-gray-300">District Boundary</span>
                </label>
              </div>
            </div>

            {/* Footer Metadata */}
            <div className="p-2.5 bg-gray-950/80 border-t border-gray-800 text-[10px] text-gray-400 flex items-center justify-between">
              <span className="flex items-center space-x-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>IMD / KSDMA LIVE</span>
              </span>
              <span className="font-mono">14:32:08 IST</span>
            </div>
          </aside>
        ) : (
          <button
            onClick={() => setLeftSidebarOpen(true)}
            className="absolute left-2 top-14 z-20 bg-[#0f172a]/90 hover:bg-gray-800 text-gray-300 hover:text-white p-2 rounded-lg border border-gray-700 shadow-2xl flex items-center space-x-1"
            title="Expand Monitoring Panel"
          >
            <ChevronRight className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-bold">MONITORING</span>
          </button>
        )}

        {/* ========================================================= */}
        {/* CENTER DOMINANT REAL GIS DISASTER MAP                     */}
        {/* ========================================================= */}
        <main className="flex-1 relative h-full">
          <RealGISDisasterMap
            selectedLocation={activeLocation}
            onSelectLocation={handleSelectLocation}
            isEmergencyMode={true}
            onNavigateToRouting={() => selectedZone && onNavigateToRouting(selectedZone)}
            layerToggles={layers}
            timelineStep={cycloneStep}
            onCycloneStepChange={handleTimelineStepChange}
            highlightShelters={highlightShelters}
            onToggleShelterHighlight={onToggleShelterHighlight}
            is3DMode={is3DMode}
            onToggle3DMode={setIs3DMode}
          />
        </main>

        {/* ========================================================= */}
        {/* RIGHT SIDEBAR: EVACUATION PRIORITY (BY LEAD TIME)         */}
        {/* ========================================================= */}
        {rightSidebarOpen ? (
          <aside className="w-72 md:w-80 bg-[#0f172a]/95 border-l border-gray-800 flex flex-col shrink-0 overflow-y-auto z-10 shadow-2xl">
            {/* Header */}
            <div className="p-3 border-b border-gray-800 bg-gray-900/60 flex items-center justify-between">
              <div>
                <h2 className="text-xs font-black uppercase tracking-wider text-white flex items-center space-x-1.5">
                  <Clock className="w-3.5 h-3.5 text-red-400 animate-pulse" />
                  <span>EVACUATION PRIORITY (BY LEAD TIME)</span>
                </h2>
                <div className="text-[10px] text-gray-400">Ranked by pre-impact window & vulnerability</div>
              </div>
              <button
                onClick={() => setRightSidebarOpen(false)}
                className="text-gray-400 hover:text-white p-1 rounded hover:bg-gray-800"
                title="Collapse sidebar"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Ranked List with Lead Time Badges */}
            <div className="p-2 space-y-1.5 overflow-y-auto flex-1">
              {sortedLocations.map((loc, idx) => {
                const percent = Math.round((loc.population_exposed / maxPop) * 100);
                const isSelected = activeLocation.id === loc.id;
                const isP1 = loc.evac_priority?.includes('P1') || loc.risk_level === 'CRITICAL';
                const isP2 = loc.evac_priority?.includes('P2') || loc.risk_level === 'HIGH_RISK';
                const isSafe = loc.risk_level === 'SAFE';

                // Subtle pulse ONLY on the top-ranked P1 item to avoid visual noise
                const pulseClass = idx === 0 && isP1 ? 'animate-pulse' : '';

                let badgeColor = 'bg-yellow-950/80 text-yellow-300 border-yellow-600/50';
                let barColor = 'bg-yellow-500';
                if (isP1) {
                  badgeColor = `bg-red-950/90 text-red-200 border-red-500/80 ${pulseClass} font-black`;
                  barColor = 'bg-red-600';
                } else if (isP2) {
                  badgeColor = 'bg-orange-950/90 text-orange-200 border-orange-500/70 font-bold';
                  barColor = 'bg-orange-500';
                } else if (isSafe) {
                  badgeColor = 'bg-emerald-950/90 text-emerald-200 border-emerald-500/60 font-medium';
                  barColor = 'bg-emerald-500';
                }

                return (
                  <div
                    key={loc.id}
                    onClick={() => handleSelectLocation(loc)}
                    className={`px-2.5 py-1.5 rounded-lg cursor-pointer transition-all border ${
                      isSelected
                        ? 'bg-gray-800/95 border-cyan-500 shadow-md shadow-cyan-500/20'
                        : 'bg-gray-900/60 border-gray-800/80 hover:bg-gray-800/70 hover:border-gray-700'
                    }`}
                  >
                    {/* Row 1: Rank + Location + Exposed Pop */}
                    <div className="flex items-center justify-between text-[11px] leading-tight">
                      <div className="flex items-center space-x-1.5 truncate max-w-[170px]">
                        <span className="text-[10px] text-gray-500 font-mono w-3.5 shrink-0">{idx + 1}.</span>
                        <span className="font-bold text-white truncate">{loc.name}</span>
                      </div>
                      <span className="font-mono text-[10.5px] font-bold text-gray-300 shrink-0">
                        {loc.population_exposed.toLocaleString()}
                      </span>
                    </div>

                    {/* Row 2: Prominent Lead Time Countdown + Priority Badge */}
                    <div className="flex items-center justify-between mt-1 text-[9.5px]">
                      <div className="flex items-center space-x-1 font-mono">
                        <Clock className={`w-3 h-3 ${isP1 ? 'text-red-400 animate-pulse' : 'text-amber-400'}`} />
                        <span className={`font-bold ${isP1 ? 'text-red-300 font-black' : 'text-gray-200'}`}>
                          {loc.lead_time_formatted || loc.time_to_impact}
                        </span>
                      </div>
                      <span className={`px-1.5 py-0.5 rounded border text-[8.5px] uppercase tracking-wide leading-none ${badgeColor}`}>
                        {loc.evac_priority || (isP1 ? 'P1 ACT NOW' : isP2 ? 'P2 PREPARE' : 'P3 STANDBY')}
                      </span>
                    </div>

                    {/* Row 3: 2px Urgency Bar */}
                    <div className="w-full h-0.5 bg-gray-800 rounded-full overflow-hidden mt-1">
                      <div
                        className={`h-full rounded-full ${barColor} transition-all duration-500`}
                        style={{ width: `${percent}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </aside>
        ) : (
          <button
            onClick={() => setRightSidebarOpen(true)}
            className="absolute right-2 top-14 z-20 bg-[#0f172a]/90 hover:bg-gray-800 text-gray-300 hover:text-white p-2 rounded-lg border border-gray-700 shadow-2xl flex items-center space-x-1"
            title="Expand Evacuation Priority Panel"
          >
            <span className="text-xs font-bold">PRIORITY</span>
            <ChevronLeft className="w-4 h-4 text-cyan-400" />
          </button>
        )}

      </div>
    </div>
  );
};
