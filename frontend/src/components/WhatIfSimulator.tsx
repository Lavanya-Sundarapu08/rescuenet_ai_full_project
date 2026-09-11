import React, { useState } from 'react';
import { Sliders, Play, RotateCcw, AlertTriangle, Users, TrendingUp, ShieldAlert, ArrowRight, Wind, CloudRain } from 'lucide-react';
import { SimulationScenario, SimulationResult } from '../types';
import { runSimulation } from '../services/api';

export const WhatIfSimulator: React.FC = () => {
  const [rainfall, setRainfall] = useState<number>(180);
  const [riverLevel, setRiverLevel] = useState<number>(6.5);
  const [duration, setDuration] = useState<number>(6);
  const [damDischarge, setDamDischarge] = useState<number>(1200);

  // Cyclone Parameters
  const [cycloneWind, setCycloneWind] = useState<number>(115);
  const [cycloneRain, setCycloneRain] = useState<number>(220);
  const [cycloneProx, setCycloneProx] = useState<number>(95);

  const [loading, setLoading] = useState<boolean>(false);
  const [result, setResult] = useState<any | null>(null);

  const handleRunSimulation = async (
    rf = rainfall, rl = riverLevel, dur = duration, dam = damDischarge,
    wind = cycloneWind, stormRain = cycloneRain, prox = cycloneProx
  ) => {
    setLoading(true);
    try {
      const res = await runSimulation({
        scenario_name: `Multi-Hazard Cyclone & Monsoon Surge (${wind}km/h Wind)`,
        rainfall_mm: rf,
        river_level_m: rl,
        duration_hours: dur,
        dam_discharge_cumec: dam,
        cyclone_wind_kmh: wind,
        cyclone_rainfall_mm: stormRain,
        cyclone_proximity_km: prox
      } as any);
      setResult(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Presets
  const applyPreset = (rf: number, rl: number, dam: number, wind: number, stormRain: number, prox: number) => {
    setRainfall(rf);
    setRiverLevel(rl);
    setDamDischarge(dam);
    setCycloneWind(wind);
    setCycloneRain(stormRain);
    setCycloneProx(prox);
    handleRunSimulation(rf, rl, duration, dam, wind, stormRain, prox);
  };

  return (
    <div className="p-4 lg:p-6 bg-[#0b1120] min-h-[calc(100vh-140px)] text-gray-100 overflow-y-auto">
      {/* Title & Description */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-gray-800 mb-6">
        <div>
          <h2 className="text-xl font-black text-white flex items-center space-x-2">
            <Sliders className="w-5 h-5 text-amber-400" />
            <span>WHAT-IF MULTI-HAZARD & CYCLONE SIMULATOR</span>
          </h2>
          <p className="text-xs text-gray-400 mt-1">
            Simulate compound disasters: adjust cyclone wind intensity, storm precipitation squalls, and river surges to calculate newly inundated red zones, road blockages, and shelter deficits.
          </p>
        </div>

        {/* Preset Chips */}
        <div className="flex items-center space-x-2 mt-3 md:mt-0">
          <span className="text-xs text-gray-400 font-semibold">Presets:</span>
          <button
            onClick={() => applyPreset(110, 4.2, 800, 75, 120, 150)}
            className="px-2.5 py-1 bg-gray-800 hover:bg-gray-700 text-xs rounded border border-gray-700 text-gray-300"
          >
            Deep Depression (75km/h)
          </button>
          <button
            onClick={() => applyPreset(180, 6.5, 1200, 115, 220, 95)}
            className="px-2.5 py-1 bg-amber-900/60 hover:bg-amber-800 text-xs rounded border border-amber-700 text-amber-200 font-semibold"
          >
            Severe Cyclone (115km/h)
          </button>
          <button
            onClick={() => applyPreset(250, 7.8, 1800, 145, 300, 45)}
            className="px-2.5 py-1 bg-red-900/70 hover:bg-red-800 text-xs rounded border border-red-700 text-red-200 font-bold animate-pulse"
          >
            Catastrophic Storm Surge (145km/h)
          </button>
        </div>
      </div>

      {/* Control Sliders Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6 bg-[#0f172a] p-4 rounded-xl border border-gray-800">
        {/* Cyclone Wind Speed Slider */}
        <div className="bg-gray-900/80 p-3 rounded-lg border border-red-900/40">
          <div className="flex justify-between text-xs font-semibold mb-1">
            <span className="text-red-300 flex items-center space-x-1">
              <Wind className="w-3.5 h-3.5" />
              <span>Cyclone Wind</span>
            </span>
            <span className="text-red-400 font-mono font-bold">{cycloneWind} km/h</span>
          </div>
          <input
            type="range"
            min="60"
            max="180"
            step="5"
            value={cycloneWind}
            onChange={(e) => setCycloneWind(Number(e.target.value))}
            className="w-full h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-red-500"
          />
          <div className="flex justify-between text-[10px] text-gray-500 mt-1">
            <span>60 km/h</span>
            <span className="text-red-400">&gt;120 Extreme</span>
            <span>180 km/h</span>
          </div>
        </div>

        {/* Storm Precipitation */}
        <div className="bg-gray-900/80 p-3 rounded-lg border border-cyan-900/40">
          <div className="flex justify-between text-xs font-semibold mb-1">
            <span className="text-cyan-300 flex items-center space-x-1">
              <CloudRain className="w-3.5 h-3.5" />
              <span>Storm Rainfall</span>
            </span>
            <span className="text-cyan-400 font-mono font-bold">{cycloneRain} mm</span>
          </div>
          <input
            type="range"
            min="100"
            max="350"
            step="10"
            value={cycloneRain}
            onChange={(e) => setCycloneRain(Number(e.target.value))}
            className="w-full h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
          />
          <div className="flex justify-between text-[10px] text-gray-500 mt-1">
            <span>100 mm</span>
            <span className="text-cyan-400">&gt;200 Heavy</span>
            <span>350 mm</span>
          </div>
        </div>

        {/* Cyclone Proximity */}
        <div className="bg-gray-900/80 p-3 rounded-lg border border-gray-800">
          <div className="flex justify-between text-xs font-semibold mb-1">
            <span className="text-gray-300">Track Distance</span>
            <span className="text-amber-400 font-mono font-bold">{cycloneProx} km</span>
          </div>
          <input
            type="range"
            min="20"
            max="200"
            step="5"
            value={cycloneProx}
            onChange={(e) => setCycloneProx(Number(e.target.value))}
            className="w-full h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-amber-500"
          />
          <div className="flex justify-between text-[10px] text-gray-500 mt-1">
            <span>20 km (Direct)</span>
            <span>200 km</span>
          </div>
        </div>

        {/* River Surge */}
        <div className="bg-gray-900/80 p-3 rounded-lg border border-gray-800">
          <div className="flex justify-between text-xs font-semibold mb-1">
            <span className="text-gray-300">River Level</span>
            <span className="text-blue-400 font-mono font-bold">{riverLevel.toFixed(1)} m</span>
          </div>
          <input
            type="range"
            min="3.0"
            max="8.5"
            step="0.1"
            value={riverLevel}
            onChange={(e) => setRiverLevel(Number(e.target.value))}
            className="w-full h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
          />
          <div className="flex justify-between text-[10px] text-gray-500 mt-1">
            <span>3.0 m</span>
            <span className="text-blue-400">Danger: &gt;5.5m</span>
            <span>8.5 m</span>
          </div>
        </div>

        {/* Dam Spillway */}
        <div className="bg-gray-900/80 p-3 rounded-lg border border-gray-800">
          <div className="flex justify-between text-xs font-semibold mb-1">
            <span className="text-gray-300">Dam Spillway</span>
            <span className="text-purple-400 font-mono font-bold">{damDischarge} c</span>
          </div>
          <input
            type="range"
            min="400"
            max="2500"
            step="50"
            value={damDischarge}
            onChange={(e) => setDamDischarge(Number(e.target.value))}
            className="w-full h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
          />
          <div className="flex justify-between text-[10px] text-gray-500 mt-1">
            <span>400 cumec</span>
            <span>2,500</span>
          </div>
        </div>

        {/* Execution Button */}
        <div className="flex items-center">
          <button
            onClick={() => handleRunSimulation()}
            disabled={loading}
            className="w-full h-full min-h-[50px] bg-amber-600 hover:bg-amber-500 text-white font-black text-xs uppercase tracking-wider rounded-lg shadow-lg flex items-center justify-center space-x-2 transition-all disabled:opacity-50"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                <Play className="w-4 h-4" />
                <span>SIMULATE IMPACT</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Simulation Results View */}
      {result && (
        <div className="space-y-4 animate-fadeIn">
          {/* Narrative Summary Alert */}
          <div className="bg-amber-950/40 border border-amber-500/50 p-4 rounded-xl flex items-start space-x-3">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-bold text-amber-200">Simulation Impact Report</h4>
              <p className="text-xs text-amber-100/90 mt-1">{result.delta.narrative_summary}</p>
            </div>
          </div>

          {/* Metric Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-[#0f172a] p-3 rounded-lg border border-gray-800">
              <span className="text-[10px] text-gray-400 font-semibold block uppercase">Simulated Population Exposed</span>
              <span className="text-xl font-black text-white">{result.delta.simulated_exposed.toLocaleString()}</span>
              <span className="text-[10px] text-red-400 block mt-0.5">+{result.delta.delta_exposed.toLocaleString()} additional citizens</span>
            </div>
            <div className="bg-[#0f172a] p-3 rounded-lg border border-gray-800">
              <span className="text-[10px] text-gray-400 font-semibold block uppercase">Priority 1 Critical Zones</span>
              <span className="text-xl font-black text-red-500">{result.delta.simulated_p1_zones_count} Zones</span>
              <span className="text-[10px] text-gray-400 block mt-0.5">New: {result.delta.new_critical_zones.join(', ') || 'None'}</span>
            </div>
            <div className="bg-[#0f172a] p-3 rounded-lg border border-gray-800">
              <span className="text-[10px] text-gray-400 font-semibold block uppercase">System Stress Index</span>
              <span className="text-xl font-black text-amber-400">{result.delta.system_stress_index}%</span>
              <span className="text-[10px] text-gray-400 block mt-0.5">Shelter Demand vs Capacity</span>
            </div>
            <div className="bg-[#0f172a] p-3 rounded-lg border border-gray-800">
              <span className="text-[10px] text-gray-400 font-semibold block uppercase">Potentially Blocked Roads</span>
              <span className="text-xl font-black text-purple-400">{result.cyclone_impact?.blocked_roads_est || 7} Segments</span>
              <span className="text-[10px] text-gray-400 block mt-0.5">Bridge washouts & mudslides</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
