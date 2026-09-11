import React, { useState, useEffect } from 'react';
import {
  ShieldAlert, Activity, Radio, Bot, Bell, Navigation, Database,
  Sliders, Smartphone, Box, Map, Calendar, AlertTriangle
} from 'lucide-react';
import { AlertMessage } from '../types';

interface HeaderProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  alerts: AlertMessage[];
  onOpenCopilot: () => void;
  is3DMode: boolean;
  setIs3DMode: (val: boolean) => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  setCurrentTab,
  alerts,
  onOpenCopilot,
  is3DMode,
  setIs3DMode,
}) => {
  const [time, setTime] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }) + ' IST');
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="bg-[#0f172a] border-b border-gray-800 sticky top-0 z-50 select-none">
      {/* 1. Official Government Activation Bar */}
      <div className="bg-[#0b0f19] border-b border-gray-800/80 px-4 py-1.5 flex flex-wrap items-center justify-between text-xs text-gray-300">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <span className="text-[13px]">🏛️</span>
            <span className="text-white font-bold tracking-wide">
              Flood & Disaster Monitoring GIS Dashboard
            </span>
          </div>
          <span className="text-gray-500">|</span>
          <span className="text-gray-400 hidden sm:inline text-[11px]">
            Department of Disaster Management (DDM) & KSDMA, Wayanad Emergency Command
          </span>
        </div>

        {/* Section 22: LIVE Data Source Indicator */}
        <div className="flex items-center space-x-3 text-[11px] font-mono">
          <div className="flex items-center space-x-1.5 bg-emerald-950/80 text-emerald-400 border border-emerald-800 px-2 py-0.5 rounded-full">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-bold">LIVE</span>
          </div>

          <div className="hidden md:flex items-center space-x-1 text-gray-400">
            <span>Last Updated:</span>
            <span className="text-white font-bold">{time}</span>
          </div>

          <span className="text-gray-500 hidden lg:inline">|</span>
          <span className="text-gray-400 hidden lg:inline text-[10px]">
            Sources: Weather API, CWC Sensors, OSM, KSDMA
          </span>
        </div>
      </div>

      {/* 2. Main Navigation Bar */}
      <div className="px-4 py-2 flex items-center justify-between">
        {/* Project Branding */}
        <div
          className="flex items-center space-x-2.5 cursor-pointer"
          onClick={() => setCurrentTab('command-center')}
        >
          <div className="bg-gradient-to-br from-red-600 via-rose-600 to-amber-500 p-1.5 rounded-lg shadow-md shadow-red-900/40">
            <ShieldAlert className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <span className="text-lg font-black tracking-wider text-white">RescueNet AI</span>
              <span className="text-[9px] bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded border border-red-500/40 font-mono">
                SIH26191
              </span>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center bg-gray-900/90 p-1 rounded-xl border border-gray-800 space-x-1">
          <button
            onClick={() => setCurrentTab('command-center')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
              currentTab === 'command-center'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-gray-400 hover:text-white hover:bg-gray-800'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>GIS Map Dashboard</span>
          </button>

          <button
            onClick={() => setCurrentTab('routing')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
              currentTab === 'routing'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-gray-400 hover:text-white hover:bg-gray-800'
            }`}
          >
            <Navigation className="w-3.5 h-3.5" />
            <span>Safe Routing</span>
          </button>

          <button
            onClick={() => setCurrentTab('simulator')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
              currentTab === 'simulator'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-gray-400 hover:text-white hover:bg-gray-800'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">What-If Simulator</span>
          </button>

          <button
            onClick={() => setCurrentTab('shelters')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
              currentTab === 'shelters'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-gray-400 hover:text-white hover:bg-gray-800'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Shelter Capacity</span>
          </button>

          <button
            onClick={() => setCurrentTab('citizen')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
              currentTab === 'citizen'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-gray-400 hover:text-white hover:bg-gray-800'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span className="hidden lg:inline">Citizen Portal</span>
          </button>
        </nav>

        {/* AI Copilot Button (Section 21) */}
        <div className="flex items-center space-x-2">
          <button
            onClick={onOpenCopilot}
            className="flex items-center space-x-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white px-3 py-1.5 rounded-lg text-xs font-semibold shadow-md shadow-purple-900/30 transition"
          >
            <Bot className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">AI Decision Assistant</span>
          </button>
        </div>
      </div>
    </header>
  );
};
