import React, { useState } from 'react';
import { Smartphone, MapPin, AlertTriangle, ShieldCheck, Navigation, Phone, CheckSquare, Heart } from 'lucide-react';
import { Zone } from '../types';

interface CitizenPortalProps {
  zones: Zone[];
}

export const CitizenPortal: React.FC<CitizenPortalProps> = ({ zones }) => {
  const [selectedZoneId, setSelectedZoneId] = useState<string>(zones[0]?.id || 'ZN-01');
  const zone = zones.find((z) => z.id === selectedZoneId) || zones[0];

  const isCrit = zone.risk_score.risk_level === 'CRITICAL';
  const isHigh = zone.risk_score.risk_level === 'HIGH_RISK';

  return (
    <div className="p-4 bg-[#080c14] min-h-[calc(100vh-140px)] flex justify-center items-start text-gray-100 overflow-y-auto">
      {/* Mobile Device Frame */}
      <div className="w-full max-w-md bg-gray-950 border-2 border-gray-800 rounded-3xl p-5 shadow-2xl flex flex-col space-y-4">
        {/* Device Top Bar */}
        <div className="flex items-center justify-between border-b border-gray-800 pb-3">
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping"></span>
            <span className="text-xs font-black tracking-wider text-white">RESCUENET AI CITIZEN ALERT</span>
          </div>
          <span className="text-[10px] text-gray-400 font-mono">GPS: ENABLED</span>
        </div>

        {/* Location Selector */}
        <div>
          <label className="text-xs font-semibold text-gray-400 block mb-1">Select Your Ward / Village:</label>
          <div className="flex items-center bg-gray-900 border border-gray-700 rounded-xl px-3 py-2">
            <MapPin className="w-4 h-4 text-red-500 mr-2 shrink-0" />
            <select
              value={selectedZoneId}
              onChange={(e) => setSelectedZoneId(e.target.value)}
              className="w-full bg-transparent text-sm font-bold text-white focus:outline-none"
            >
              {zones.map((z) => (
                <option key={z.id} value={z.id} className="bg-gray-900">
                  {z.name} ({z.taluk})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Personal Risk Status Card */}
        <div
          className={`p-4 rounded-2xl border text-center ${
            isCrit
              ? 'bg-red-950/70 border-red-600 text-red-200'
              : isHigh
              ? 'bg-orange-950/70 border-orange-600 text-orange-200'
              : 'bg-emerald-950/70 border-emerald-600 text-emerald-200'
          }`}
        >
          <span className="text-xs uppercase font-bold tracking-widest block mb-1">Current Zone Status</span>
          <div className="text-2xl font-black mb-1">
            {isCrit ? '🔴 CRITICAL — EVACUATE NOW' : isHigh ? '🟠 HIGH RISK — PREPARE TRANSIT' : '🟢 SAFE STATUS'}
          </div>
          <span className="text-xs opacity-90 block">
            AI Hazard Estimate: <b>{zone.risk_score.normalized_score.toFixed(0)} / 100</b>
          </span>
          <div className="mt-2 text-xs bg-black/40 py-1 px-2.5 rounded-full inline-block font-mono">
            Safe Window: <b>75 Minutes Remaining</b>
          </div>
        </div>

        {/* Designated Safe Destination Shelter */}
        <div className="bg-gray-900 border border-gray-800 p-4 rounded-2xl">
          <div className="flex items-center justify-between text-xs text-gray-400 font-semibold mb-1">
            <span>RECOMMENDED SAFE SHELTER</span>
            <span className="text-emerald-400 font-mono font-bold">100% FLOOD SAFE</span>
          </div>
          <h3 className="text-base font-black text-white">{zone.recommended_shelter_name || 'Designated Camp'}</h3>
          <div className="grid grid-cols-2 gap-2 mt-3 text-center text-xs">
            <div className="bg-gray-950 p-2 rounded-xl border border-gray-800">
              <span className="text-[10px] text-gray-400 block">Safe Distance</span>
              <span className="text-sm font-bold text-white">4.8 km</span>
            </div>
            <div className="bg-gray-950 p-2 rounded-xl border border-gray-800">
              <span className="text-[10px] text-gray-400 block">Est. Travel Time</span>
              <span className="text-sm font-bold text-white">13 min</span>
            </div>
          </div>

          <button
            onClick={() => alert(`Starting turn-by-turn guidance to ${zone.recommended_shelter_name}. Please follow Western Ridge Road (Route B). Do not use Bridge 2.`)}
            className="w-full mt-3 flex items-center justify-center space-x-2 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm py-3 rounded-xl shadow-lg transition"
          >
            <Navigation className="w-4 h-4" />
            <span>START SAFE NAVIGATION</span>
          </button>
        </div>

        {/* Emergency Instructions & Kit Checklist */}
        <div className="bg-gray-900/60 border border-gray-800 p-3.5 rounded-2xl text-xs space-y-2">
          <span className="font-bold text-gray-300 block uppercase tracking-wider text-[11px]">
            Emergency Evacuation Checklist:
          </span>
          <div className="space-y-1.5 text-gray-400">
            <div className="flex items-center space-x-2">
              <CheckSquare className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>Bring government ID, land records & medications</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckSquare className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>Turn off primary electricity and LPG gas main</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckSquare className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>DO NOT attempt to cross river bridge with flowing water</span>
            </div>
          </div>
        </div>

        {/* Emergency SOS Hotlines */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          <a
            href="tel:112"
            className="flex items-center justify-center space-x-1.5 bg-red-950/60 border border-red-800 text-red-200 py-2 rounded-xl text-xs font-bold"
          >
            <Phone className="w-3.5 h-3.5" />
            <span>DIAL 112 SOS</span>
          </a>
          <a
            href="tel:1077"
            className="flex items-center justify-center space-x-1.5 bg-gray-900 border border-gray-700 text-gray-200 py-2 rounded-xl text-xs font-bold"
          >
            <Phone className="w-3.5 h-3.5" />
            <span>DISTRICT CONTROL</span>
          </a>
        </div>
      </div>
    </div>
  );
};
