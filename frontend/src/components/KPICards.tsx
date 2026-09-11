import React from 'react';
import { ShieldAlert, Users, AlertTriangle, Home, Route, Radio, Droplets, CheckCircle2 } from 'lucide-react';
import { OverviewKPIs } from '../types';

interface KPICardsProps {
  kpis: OverviewKPIs | null;
  highlightShelters?: boolean;
  onToggleShelterHighlight?: () => void;
}

export const KPICards: React.FC<KPICardsProps> = ({ kpis, highlightShelters, onToggleShelterHighlight }) => {
  if (!kpis) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2.5 p-3 bg-command-bg border-b border-command-border">
        {[...Array(7)].map((_, i) => (
          <div key={i} className="h-20 bg-gray-900/50 rounded-lg animate-pulse border border-gray-800"></div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-2.5 p-3 bg-command-bg border-b border-command-border">
      {/* 1. Active Hazards */}
      <div className="bg-command-card border border-red-900/40 p-2.5 rounded-lg flex flex-col justify-between hover:border-red-600/50 transition">
        <div className="flex items-center justify-between text-gray-400 text-[11px] font-medium uppercase tracking-wider">
          <span>Active Hazards</span>
          <Droplets className="w-3.5 h-3.5 text-red-500" />
        </div>
        <div className="flex items-baseline space-x-1.5 mt-1">
          <span className="text-2xl font-black text-red-400">{kpis.active_hazards}</span>
          <span className="text-[10px] text-red-300/80">Rain/Flood/Slide</span>
        </div>
      </div>

      {/* 2. Critical Zones */}
      <div className="bg-command-card border border-red-900/40 p-2.5 rounded-lg flex flex-col justify-between hover:border-red-600/50 transition">
        <div className="flex items-center justify-between text-gray-400 text-[11px] font-medium uppercase tracking-wider">
          <span>Critical Zones</span>
          <ShieldAlert className="w-3.5 h-3.5 text-red-500" />
        </div>
        <div className="flex items-baseline space-x-1.5 mt-1">
          <span className="text-2xl font-black text-red-500">{kpis.critical_zones}</span>
          <span className="text-[10px] text-orange-400 font-semibold">({kpis.high_risk_zones} High Risk)</span>
        </div>
      </div>

      {/* 3. People at Risk */}
      <div className="bg-command-card border border-gray-800 p-2.5 rounded-lg flex flex-col justify-between hover:border-gray-700 transition">
        <div className="flex items-center justify-between text-gray-400 text-[11px] font-medium uppercase tracking-wider">
          <span>People at Risk</span>
          <Users className="w-3.5 h-3.5 text-amber-500" />
        </div>
        <div className="flex items-baseline space-x-1.5 mt-1">
          <span className="text-2xl font-black text-white">{kpis.people_at_risk.toLocaleString()}</span>
          <span className="text-[10px] text-gray-400">/{kpis.total_population.toLocaleString()}</span>
        </div>
      </div>

      {/* 4. Immediate Relocation */}
      <div className="bg-command-card border border-red-900/60 p-2.5 rounded-lg flex flex-col justify-between bg-red-950/20 hover:border-red-500 transition">
        <div className="flex items-center justify-between text-red-300 text-[11px] font-medium uppercase tracking-wider">
          <span>Immediate Reloc.</span>
          <AlertTriangle className="w-3.5 h-3.5 text-red-500 animate-pulse" />
        </div>
        <div className="flex items-baseline space-x-1.5 mt-1">
          <span className="text-2xl font-black text-red-400">{kpis.immediate_relocation.toLocaleString()}</span>
          <span className="text-[10px] text-red-300 font-bold">P1 Priority</span>
        </div>
      </div>

      {/* 5. Available Shelter Capacity */}
      <div
        onClick={onToggleShelterHighlight}
        className={`bg-command-card border p-2.5 rounded-lg flex flex-col justify-between cursor-pointer transition-all ${
          highlightShelters
            ? 'border-emerald-400 ring-2 ring-emerald-400/50 bg-emerald-950/40 shadow-lg shadow-emerald-500/20'
            : 'border-gray-800 hover:border-emerald-500/60'
        }`}
        title="Click to highlight safe shelters and headroom on the map"
      >
        <div className="flex items-center justify-between text-gray-400 text-[11px] font-medium uppercase tracking-wider">
          <span className="flex items-center space-x-1">
            <span>Shelter Headroom</span>
            {highlightShelters && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>}
          </span>
          <Home className={`w-3.5 h-3.5 ${highlightShelters ? 'text-emerald-400 animate-bounce' : 'text-emerald-500'}`} />
        </div>
        <div className="flex items-baseline space-x-1.5 mt-1">
          <span className="text-2xl font-black text-emerald-400">{kpis.available_shelter_capacity.toLocaleString()}</span>
          <span className="text-[10px] text-emerald-300/80 font-bold">{highlightShelters ? 'MAP ACTIVE' : 'Spaces Ready'}</span>
        </div>
      </div>

      {/* 6. Blocked Roads */}
      <div className="bg-command-card border border-gray-800 p-2.5 rounded-lg flex flex-col justify-between hover:border-amber-600/50 transition">
        <div className="flex items-center justify-between text-gray-400 text-[11px] font-medium uppercase tracking-wider">
          <span>Blocked Roads</span>
          <Route className="w-3.5 h-3.5 text-amber-500" />
        </div>
        <div className="flex items-baseline space-x-1.5 mt-1">
          <span className="text-2xl font-black text-amber-400">{kpis.blocked_roads}</span>
          <span className="text-[10px] text-emerald-400 font-medium">({kpis.safe_routes} Safe)</span>
        </div>
      </div>

      {/* 7. Active Broadcast Alerts */}
      <div className="bg-command-card border border-gray-800 p-2.5 rounded-lg flex flex-col justify-between hover:border-blue-600/50 transition">
        <div className="flex items-center justify-between text-gray-400 text-[11px] font-medium uppercase tracking-wider">
          <span>Active Alerts</span>
          <Radio className="w-3.5 h-3.5 text-blue-500" />
        </div>
        <div className="flex items-baseline space-x-1.5 mt-1">
          <span className="text-2xl font-black text-blue-400">{kpis.active_alerts}</span>
          <span className="text-[10px] text-blue-300/80">CAP / SMS Live</span>
        </div>
      </div>
    </div>
  );
};
