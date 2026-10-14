import React, { useState } from 'react';
import { AdvancedFareEngine } from '../AdvancedFareEngine';
import { Sparkles, ShieldCheck, CheckCircle2, ArrowUpRight } from 'lucide-react';
import { CentralizedFareConfig } from '../../types/fareEngine';

interface OwnerFareEngineProps {
  onFareSaved?: (config: CentralizedFareConfig) => void;
}

export const OwnerFareEngine: React.FC<OwnerFareEngineProps> = ({ onFareSaved }) => {
  const [lastSavedTime, setLastSavedTime] = useState<string | null>(null);

  const handleSaved = (config: CentralizedFareConfig) => {
    setLastSavedTime(new Date().toLocaleTimeString());
    if (onFareSaved) onFareSaved(config);
  };

  return (
    <div className="space-y-4">
      {/* Top Explanation Banner */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-bold uppercase tracking-wider mb-1 border border-emerald-200">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Single Source of Truth • Real-Time Dynamic Engine</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Centralized Fare & Price Engine
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure rates for Local, One Way, Round Trip, Airport (KIAL T1/T2), and Inter State corridors.
            Changes saved and published here immediately reflect across all customer booking forms.
          </p>
        </div>

        {lastSavedTime && (
          <div className="flex items-center gap-1.5 text-xs text-emerald-700 font-semibold bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Last published at {lastSavedTime}</span>
          </div>
        )}
      </div>

      {/* Embedded Full-Featured Advanced Fare Engine */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <AdvancedFareEngine
          isOwner={true}
          onFareSaved={handleSaved}
          initialSection="LOCAL"
        />
      </div>
    </div>
  );
};
