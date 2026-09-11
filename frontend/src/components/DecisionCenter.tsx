import React from 'react';
import { ShieldAlert, Users, AlertTriangle, Home, Route, Play, CheckCircle2, ChevronRight, Radio } from 'lucide-react';
import { OverviewKPIs, Zone, Shelter } from '../types';

interface DecisionCenterProps {
  kpis: OverviewKPIs | null;
  zones: Zone[];
  shelters: Shelter[];
  onStartSimulation: () => void;
  onSelectZone: (zone: Zone) => void;
}

export const DecisionCenter: React.FC<DecisionCenterProps> = ({
  kpis,
  zones,
  shelters,
  onStartSimulation,
  onSelectZone,
}) => {
  const topPriorityZone = zones.find((z) => z.risk_score.risk_level === 'CRITICAL') || zones[0];

  return (
    <div className="p-4 lg:p-8 bg-command-bg min-h-[calc(100vh-140px)] text-gray-100 flex flex-col items-center overflow-y-auto">
      <div className="w-full max-w-4xl space-y-6">
        {/* Terminal Header: RescueNet AI */}
        <div className="text-center pb-4 border-b border-gray-800">
          <span className="text-xs font-mono text-gray-400 tracking-widest uppercase">
            ──────────────────────────────────────────────
          </span>
          <h1 className="text-2xl sm:text-3xl font-black tracking-widest text-white mt-1">
            RESCUENET AI DECISION CENTER
          </h1>
          <p className="text-xs text-gray-400 mt-1 font-mono">
            3D MOUNTAIN TOPOGRAPHY • DYNAMIC RIVER INUNDATION • SAFE RELOCATION PLATFORM
          </p>
          <span className="text-xs font-mono text-gray-400 tracking-widest uppercase">
            ──────────────────────────────────────────────
          </span>
        </div>

        {/* Core KPI Blocks */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-center">
          <div className="bg-command-card p-3 rounded-xl border border-red-800">
            <span className="text-[11px] text-gray-400 block uppercase font-semibold">🔴 Critical Zones</span>
            <span className="text-2xl sm:text-3xl font-black text-red-500">{kpis?.critical_zones || 7}</span>
          </div>
          <div className="bg-command-card p-3 rounded-xl border border-gray-800">
            <span className="text-[11px] text-gray-400 block uppercase font-semibold">👥 People At Risk</span>
            <span className="text-2xl sm:text-3xl font-black text-white">
              {kpis?.people_at_risk?.toLocaleString() || '18,430'}
            </span>
          </div>
          <div className="bg-command-card p-3 rounded-xl border border-red-900 bg-red-950/20">
            <span className="text-[11px] text-red-300 block uppercase font-semibold">🚨 Immediate Reloc.</span>
            <span className="text-2xl sm:text-3xl font-black text-red-400">
              {kpis?.immediate_relocation?.toLocaleString() || '3,210'}
            </span>
          </div>
          <div className="bg-command-card p-3 rounded-xl border border-gray-800">
            <span className="text-[11px] text-gray-400 block uppercase font-semibold">🏠 Avail. Capacity</span>
            <span className="text-2xl sm:text-3xl font-black text-emerald-400">
              {kpis?.available_shelter_capacity?.toLocaleString() || '8,450'}
            </span>
          </div>
          <div className="bg-command-card p-3 rounded-xl border border-gray-800">
            <span className="text-[11px] text-gray-400 block uppercase font-semibold">🛣️ Safe Routes</span>
            <span className="text-2xl sm:text-3xl font-black text-blue-400">{kpis?.safe_routes || 12}</span>
          </div>
        </div>

        {/* Live Risk Status Banner */}
        <div className="bg-command-card p-3.5 rounded-xl border border-gray-800 flex flex-wrap items-center justify-between text-xs gap-3">
          <span className="font-bold text-gray-300 uppercase tracking-wider">Live Risk Map Classification:</span>
          <div className="flex items-center space-x-4">
            <span className="flex items-center space-x-1.5 text-red-400 font-semibold">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
              <span>Critical (80-100)</span>
            </span>
            <span className="flex items-center space-x-1.5 text-orange-400 font-semibold">
              <span className="w-2.5 h-2.5 rounded-full bg-orange-500"></span>
              <span>High (60-80)</span>
            </span>
            <span className="flex items-center space-x-1.5 text-yellow-400 font-semibold">
              <span className="w-2.5 h-2.5 rounded-full bg-yellow-500"></span>
              <span>Warning (30-60)</span>
            </span>
            <span className="flex items-center space-x-1.5 text-emerald-400 font-semibold">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
              <span>Safe (0-30)</span>
            </span>
          </div>
        </div>

        {/* Top Priority Action Card */}
        {topPriorityZone && (
          <div className="bg-gradient-to-br from-red-950/40 via-gray-900 to-gray-950 p-6 rounded-2xl border-2 border-red-600 shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-800 pb-3 mb-4">
              <div className="flex items-center space-x-2">
                <span className="bg-red-600 text-white text-xs font-black px-2 py-0.5 rounded">TOP PRIORITY</span>
                <h3 className="text-xl font-black text-white">{topPriorityZone.name}</h3>
              </div>
              <div className="text-right">
                <span className="text-xs text-gray-400 block">Calculated Risk</span>
                <span className="text-xl font-black text-red-400 font-mono">
                  {topPriorityZone.risk_score.normalized_score.toFixed(0)} / 100
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5 text-xs">
              <div className="bg-gray-900/80 p-3 rounded-xl border border-gray-800">
                <span className="text-gray-400 block text-[11px] mb-1">Directly Exposed Population</span>
                <span className="text-lg font-black text-white">
                  {topPriorityZone.demographics.exposed_population.toLocaleString()} Residents
                </span>
                <span className="text-[10px] text-amber-400 block mt-1">
                  Includes {topPriorityZone.demographics.children + topPriorityZone.demographics.elderly + topPriorityZone.demographics.pwd} vulnerable
                </span>
              </div>

              <div className="bg-gray-900/80 p-3 rounded-xl border border-gray-800">
                <span className="text-gray-400 block text-[11px] mb-1">Recommended Shelter</span>
                <span className="text-base font-bold text-emerald-400">
                  {topPriorityZone.recommended_shelter_name}
                </span>
                <span className="text-[10px] text-gray-400 block mt-1">
                  Safe Headroom: <b>1,200 available spaces</b>
                </span>
              </div>

              <div className="bg-gray-900/80 p-3 rounded-xl border border-gray-800">
                <span className="text-gray-400 block text-[11px] mb-1">Designated 3D Safe Corridor</span>
                <span className="text-base font-bold text-blue-400">Route B (Western Ridge)</span>
                <span className="text-[10px] text-gray-400 block mt-1">
                  4.8 km / 13 min • 0% Flood Inundation
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <button
                onClick={onStartSimulation}
                className="w-full sm:w-1/2 flex items-center justify-center space-x-2 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-bold py-3 px-4 rounded-xl shadow-lg transition"
              >
                <Play className="w-4 h-4 fill-white" />
                <span>START SIMULATION (WHAT-IF)</span>
              </button>

              <button
                onClick={() => alert(`RESCUENET AI RELOCATION DIRECTIVE DISPATCHED: Evacuation orders transmitted to District Police, NDRF unit 4, and 18 relief buses for ${topPriorityZone.name}. Designated destination: ${topPriorityZone.recommended_shelter_name}.`)}
                className="w-full sm:w-1/2 flex items-center justify-center space-x-2 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold py-3 px-4 rounded-xl shadow-lg transition"
              >
                <Radio className="w-4 h-4" />
                <span>EXECUTE RELOCATION PLAN & DISPATCH SOS</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
