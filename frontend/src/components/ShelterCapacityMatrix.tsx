import React from 'react';
import { Home, Droplets, Utensils, HeartPulse, Zap, ShieldCheck, AlertOctagon, CheckCircle2 } from 'lucide-react';
import { Shelter } from '../types';

interface ShelterCapacityMatrixProps {
  shelters: Shelter[];
}

export const ShelterCapacityMatrix: React.FC<ShelterCapacityMatrixProps> = ({ shelters }) => {
  const totalSafeHeadroom = shelters.reduce((acc, s) => acc + s.available_capacity, 0);
  const totalOccupied = shelters.reduce((acc, s) => acc + s.current_occupancy, 0);
  const totalCapacity = shelters.reduce((acc, s) => acc + s.max_capacity, 0);

  return (
    <div className="p-4 lg:p-6 bg-command-bg min-h-[calc(100vh-140px)] text-gray-100 overflow-y-auto">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-command-border mb-6">
        <div>
          <h2 className="text-xl font-black text-white flex items-center space-x-2">
            <Home className="w-5 h-5 text-purple-400" />
            <span>CARRYING CAPACITY & RESOURCE CONTINUITY MATRIX</span>
          </h2>
          <p className="text-xs text-gray-400 mt-1">
            Dynamic shelter headroom evaluation: available capacity = safe capacity - occupancy. Multi-resource vectors tracked: water (L/day), food (days), sanitation, and medical support.
          </p>
        </div>

        {/* Global Summary Badge */}
        <div className="flex items-center space-x-3 mt-3 md:mt-0">
          <div className="bg-emerald-950/50 border border-emerald-600 p-2.5 rounded-xl text-center">
            <span className="text-[10px] uppercase font-bold text-emerald-400 block">Available Headroom</span>
            <span className="text-xl font-black text-white">{totalSafeHeadroom.toLocaleString()} Beds</span>
          </div>
          <div className="bg-gray-900 border border-gray-800 p-2.5 rounded-xl text-center">
            <span className="text-[10px] uppercase font-bold text-gray-400 block">Current Occupancy</span>
            <span className="text-xl font-black text-gray-300">
              {totalOccupied.toLocaleString()} / {totalCapacity.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* Shelters Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {shelters.map((s) => {
          const occPct = Math.round((s.current_occupancy / s.max_capacity) * 100);
          const isUnsafe = s.status === 'UNSAFE';
          const isFull = s.status === 'OVER_CAPACITY';
          const isNear = s.status === 'NEAR_CAPACITY';

          return (
            <div
              key={s.id}
              className={`p-4 rounded-xl border flex flex-col justify-between transition ${
                isUnsafe
                  ? 'bg-red-950/20 border-red-800/80 opacity-75'
                  : isFull
                  ? 'bg-orange-950/20 border-orange-800'
                  : isNear
                  ? 'bg-yellow-950/20 border-yellow-800'
                  : 'bg-command-card border-command-border hover:border-purple-500/50'
              }`}
            >
              <div>
                {/* Header & Status */}
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-mono text-gray-400">{s.id}</span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-black ${
                      isUnsafe
                        ? 'bg-red-900 text-red-200'
                        : isFull
                        ? 'bg-orange-900 text-orange-200'
                        : isNear
                        ? 'bg-yellow-900 text-yellow-200'
                        : 'bg-emerald-900 text-emerald-200'
                    }`}
                  >
                    {s.status}
                  </span>
                </div>

                <h4 className="font-bold text-sm text-white mb-2 line-clamp-2">{s.name}</h4>

                {/* Capacity Bar */}
                <div className="mb-3">
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span className="text-gray-400">Headroom Ready</span>
                    <span className="text-white font-mono font-bold">{s.available_capacity}</span>
                  </div>
                  <div className="w-full bg-gray-800 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-2 rounded-full ${
                        isUnsafe ? 'bg-red-600' : isFull ? 'bg-orange-500' : isNear ? 'bg-yellow-500' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${Math.min(100, occPct)}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-[10px] text-gray-500 mt-1">
                    <span>{s.current_occupancy} Occupied</span>
                    <span>Max {s.max_capacity}</span>
                  </div>
                </div>

                {/* Multi-Resource Vectors */}
                <div className="space-y-1.5 text-xs border-t border-gray-800/80 pt-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400 flex items-center space-x-1.5">
                      <Droplets className="w-3.5 h-3.5 text-blue-400" />
                      <span>Water Supply</span>
                    </span>
                    <span className="font-semibold text-gray-200">
                      {s.resources.water_liters_per_person_day} L/person/day
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-gray-400 flex items-center space-x-1.5">
                      <Utensils className="w-3.5 h-3.5 text-amber-400" />
                      <span>Rations Stock</span>
                    </span>
                    <span className="font-semibold text-gray-200">{s.resources.food_stock_days} Days</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-gray-400 flex items-center space-x-1.5">
                      <HeartPulse className="w-3.5 h-3.5 text-red-400" />
                      <span>Medical Staff</span>
                    </span>
                    <span className="font-semibold text-gray-200">
                      {s.resources.medical_staff_count} MDs / {s.resources.isolation_beds} Beds
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-gray-400 flex items-center space-x-1.5">
                      <Zap className="w-3.5 h-3.5 text-yellow-400" />
                      <span>Backup Power</span>
                    </span>
                    <span className="font-semibold text-gray-200">
                      {s.resources.backup_generator ? 'Generator Active' : 'No Generator'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Safety Compliance Footer */}
              <div className="mt-3 pt-2 border-t border-gray-800/80 flex items-center justify-between text-[11px]">
                <span className="text-gray-400">Structure Grade:</span>
                <span className="font-bold text-white font-mono">
                  {s.resources.structural_safety_grade}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
