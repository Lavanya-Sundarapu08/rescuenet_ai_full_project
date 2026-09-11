import React, { useState, useEffect } from 'react';
import { Navigation, AlertTriangle, ShieldCheck, Clock, Route, CheckCircle2, XCircle, ArrowRight } from 'lucide-react';
import { Zone, Shelter, RelocationRecommendation } from '../types';
import { fetchRoutePlan } from '../services/api';
import { RealGISDisasterMap } from './RealGISDisasterMap';
import { WAYANAD_LOCATIONS, GeoLocation } from '../data/wayanadGISData';

interface SafeRoutingViewProps {
  zones: Zone[];
  shelters: Shelter[];
  selectedZone: Zone | null;
  onSelectZone: (zone: Zone) => void;
}

export const SafeRoutingView: React.FC<SafeRoutingViewProps> = ({
  zones,
  shelters,
  selectedZone,
  onSelectZone,
}) => {
  const [activeZone, setActiveZone] = useState<Zone>(selectedZone || zones[0]);
  const [routePlan, setRoutePlan] = useState<RelocationRecommendation | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (selectedZone) {
      setActiveZone(selectedZone);
    }
  }, [selectedZone]);

  useEffect(() => {
    if (!activeZone) return;
    const loadPlan = async () => {
      setLoading(true);
      try {
        const plan = await fetchRoutePlan(activeZone.id);
        setRoutePlan(plan);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadPlan();
  }, [activeZone]);

  const optimalRoute = routePlan?.routes.find((r) => r.type === 'OPTIMAL');
  const rejectedRoute = routePlan?.routes.find((r) => r.type === 'REJECTED');
  const secondaryRoute = routePlan?.routes.find((r) => r.type === 'SECONDARY');

  const matchedLocation: GeoLocation = WAYANAD_LOCATIONS.find((l) => l.id === activeZone.id) || WAYANAD_LOCATIONS[0];

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] bg-command-bg text-gray-100 overflow-hidden">
      {/* Top Selector Bar */}
      <div className="p-3 bg-command-sidebar border-b border-command-border flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="bg-emerald-600/20 p-2 rounded-lg border border-emerald-500/40">
            <Navigation className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              Safe Evacuation Route Optimizer
            </h2>
            <p className="text-[11px] text-gray-400">
              Shortest Route != Safest Route: actively penalizes submerged roads and landslide choke-points in Wayanad terrain.
            </p>
          </div>
        </div>

        {/* Origin Zone Dropdown */}
        <div className="flex items-center space-x-2 text-xs">
          <span className="text-gray-400 font-semibold">Evacuation Origin:</span>
          <select
            value={activeZone.id}
            onChange={(e) => {
              const found = zones.find((z) => z.id === e.target.value);
              if (found) {
                setActiveZone(found);
                onSelectZone(found);
              }
            }}
            className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-1.5 text-white font-medium focus:outline-none focus:border-emerald-500"
          >
            {zones.map((z) => (
              <option key={z.id} value={z.id}>
                {z.name} (Risk {z.risk_score.normalized_score.toFixed(0)}/100)
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Split: Left Route Details, Right 3D GIS Map */}
      <div className="flex-1 flex overflow-hidden">
        {/* LEFT PANEL: Route Comparison & Rationale */}
        <div className="w-96 bg-command-sidebar border-r border-command-border p-4 overflow-y-auto flex flex-col space-y-4 shrink-0">
          {/* Destination Shelter Callout */}
          {routePlan && (
            <div className="bg-gradient-to-r from-blue-950/60 to-emerald-950/60 border border-emerald-500/50 p-3.5 rounded-xl shadow-md">
              <div className="flex items-center justify-between text-xs font-bold text-emerald-400 mb-1">
                <span>DESIGNATED DESTINATION</span>
                <span className="bg-emerald-600 text-white px-2 py-0.5 rounded text-[10px]">VERIFIED CAPACITY</span>
              </div>
              <h4 className="text-sm font-bold text-white">{routePlan.selected_shelter_name}</h4>
              <p className="text-[11px] text-gray-300 mt-1 leading-relaxed">
                {routePlan.selection_rationale}
              </p>
            </div>
          )}

          {/* Route Option 1: OPTIMAL SAFE ROUTE (GREEN) */}
          {optimalRoute && (
            <div className="bg-emerald-950/30 border-2 border-emerald-500 p-3.5 rounded-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-bold text-emerald-300 uppercase">
                    Optimal Safe Evacuation Route
                  </span>
                </div>
                <span className="bg-emerald-600 text-white font-bold text-[10px] px-1.5 py-0.5 rounded">
                  RECOMMENDED
                </span>
              </div>
              <h5 className="text-xs font-semibold text-white mt-2">{optimalRoute.name}</h5>
              <div className="grid grid-cols-3 gap-2 mt-2 text-center text-xs">
                <div className="bg-gray-900/80 p-1.5 rounded border border-gray-800">
                  <span className="text-[10px] text-gray-400 block">Distance</span>
                  <span className="font-bold text-emerald-400">{optimalRoute.total_distance_km} km</span>
                </div>
                <div className="bg-gray-900/80 p-1.5 rounded border border-gray-800">
                  <span className="text-[10px] text-gray-400 block">Time</span>
                  <span className="font-bold text-emerald-400">{optimalRoute.total_travel_time_min} min</span>
                </div>
                <div className="bg-gray-900/80 p-1.5 rounded border border-gray-800">
                  <span className="text-[10px] text-gray-400 block">Hazard Score</span>
                  <span className="font-bold text-emerald-400">{optimalRoute.hazard_exposure_score}/100</span>
                </div>
              </div>
              <p className="text-[11px] text-gray-300 mt-2 leading-relaxed">
                {optimalRoute.description}
              </p>
            </div>
          )}

          {/* Route Option 2: REJECTED SHORTEST ROUTE (RED DASHED) */}
          {rejectedRoute && (
            <div className="bg-red-950/30 border border-red-700/80 p-3.5 rounded-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-1.5">
                  <XCircle className="w-4 h-4 text-red-400" />
                  <span className="text-xs font-bold text-red-300 uppercase">
                    Shortest Direct Route (REJECTED)
                  </span>
                </div>
                <span className="bg-red-600 text-white font-bold text-[10px] px-1.5 py-0.5 rounded">
                  DANGER: DO NOT USE
                </span>
              </div>
              <h5 className="text-xs font-semibold text-white mt-2">{rejectedRoute.name}</h5>
              <div className="grid grid-cols-3 gap-2 mt-2 text-center text-xs">
                <div className="bg-gray-900/80 p-1.5 rounded border border-gray-800">
                  <span className="text-[10px] text-gray-400 block">Distance</span>
                  <span className="font-bold text-red-400">{rejectedRoute.total_distance_km} km</span>
                </div>
                <div className="bg-gray-900/80 p-1.5 rounded border border-gray-800">
                  <span className="text-[10px] text-gray-400 block">Time</span>
                  <span className="font-bold text-red-400">{rejectedRoute.total_travel_time_min} min</span>
                </div>
                <div className="bg-gray-900/80 p-1.5 rounded border border-gray-800">
                  <span className="text-[10px] text-gray-400 block">Hazard Score</span>
                  <span className="font-bold text-red-500 font-mono">{rejectedRoute.hazard_exposure_score}/100</span>
                </div>
              </div>
              <div className="bg-red-950/80 border border-red-800 p-2 rounded text-[11px] text-red-200 mt-2 font-medium">
                {rejectedRoute.rejection_reason}
              </div>
            </div>
          )}

          {/* Route Option 3: SECONDARY DETOUR (YELLOW) */}
          {secondaryRoute && (
            <div className="bg-yellow-950/20 border border-yellow-700/60 p-3.5 rounded-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-1.5">
                  <Route className="w-4 h-4 text-yellow-400" />
                  <span className="text-xs font-bold text-yellow-300 uppercase">
                    Secondary Backup Route
                  </span>
                </div>
                <span className="bg-yellow-600 text-black font-bold text-[10px] px-1.5 py-0.5 rounded">
                  CONTINGENCY
                </span>
              </div>
              <h5 className="text-xs font-semibold text-white mt-2">{secondaryRoute.name}</h5>
              <p className="text-[11px] text-gray-400 mt-1">
                {secondaryRoute.description} ({secondaryRoute.total_distance_km} km / {secondaryRoute.total_travel_time_min} min)
              </p>
            </div>
          )}
        </div>

        {/* RIGHT: Real 3D GIS Map Showing Roads, Rivers, and Mountain Terrain */}
        <div className="flex-1 relative">
          <RealGISDisasterMap
            selectedLocation={matchedLocation}
            onSelectLocation={(loc) => {
              const f = zones.find((z) => z.id === loc.id);
              if (f) {
                setActiveZone(f);
                onSelectZone(f);
              }
            }}
          />
        </div>
      </div>
    </div>
  );
};
