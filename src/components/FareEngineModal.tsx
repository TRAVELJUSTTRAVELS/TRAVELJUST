import React, { useState, useEffect } from 'react';
import { AdvancedFareEngine, ActiveSection } from './AdvancedFareEngine';
import { InterStateOneWayPricingSection } from './InterStateOneWayPricingSection';
import { CentralizedFareConfig } from '../types/fareEngine';
import { Maximize2, X, SlidersHorizontal, Layers, Minimize2 } from 'lucide-react';

interface FareEngineModalProps {
  isOpen: boolean;
  onClose: () => void;
  isOwner?: boolean;
  initialMode?: 'SIMPLE' | 'ADVANCED';
  initialSection?: ActiveSection;
  onOpenOwnerAuth?: () => void;
  onFareSaved?: (config: CentralizedFareConfig) => void;
}

export type FareEngineModalMode = 'CENTRALIZED' | 'INTER_STATE_ONE_WAY';

export const FareEngineModal: React.FC<FareEngineModalProps> = ({
  isOpen,
  onClose,
  isOwner = true,
  initialSection,
  onFareSaved,
}) => {
  const [isMinimized, setIsMinimized] = useState(false);
  const [activeMode, setActiveMode] = useState<FareEngineModalMode>(() => {
    return initialSection === 'INTER_STATE_ONE_WAY' ? 'INTER_STATE_ONE_WAY' : 'CENTRALIZED';
  });

  // Keep in sync if initialSection changes when opening
  useEffect(() => {
    if (initialSection === 'INTER_STATE_ONE_WAY') {
      setActiveMode('INTER_STATE_ONE_WAY');
    }
  }, [initialSection, isOpen]);

  if (!isOpen) return null;

  if (isMinimized) {
    return (
      <div
        id="owner-live-fare-engine-modal-backdrop"
        className="fixed bottom-4 right-4 z-50 pointer-events-auto animate-in slide-in-from-bottom-3 duration-200"
      >
        <div
          id="owner-live-fare-engine-modal-dialog"
          onClick={() => setIsMinimized(false)}
          className="group flex items-center gap-2.5 bg-slate-900/95 hover:bg-slate-900 text-white pl-3.5 pr-2.5 py-2 rounded-xl shadow-xl border border-slate-700/80 backdrop-blur-md cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <div className="flex flex-col text-left">
              <span className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
                <SlidersHorizontal className="w-3 h-3 text-emerald-400" />
                Fare & Pricing Engine
              </span>
              <span className="text-[10px] text-emerald-400 font-semibold tracking-wide">
                Live · Click to Expand
              </span>
            </div>
          </div>

          <div className="flex items-center gap-0.5 ml-1.5 border-l border-slate-700/80 pl-1.5">
            <button
              id="owner-fare-engine-restore-btn"
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsMinimized(false);
              }}
              className="p-1 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              title="Expand Fare Engine"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
            <button
              id="owner-fare-engine-minimized-close-btn"
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsMinimized(false);
                onClose();
              }}
              className="p-1 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              title="Close"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      id="owner-live-fare-engine-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-3 md:p-4 bg-slate-950/75 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150"
    >
      <div
        id="owner-live-fare-engine-modal-dialog"
        className="relative w-full max-w-5xl lg:max-w-6xl xl:max-w-7xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col h-[94vh] max-h-[920px] my-auto transition-all"
      >
        {/* Modal Top Control Bar: Mode Navigation */}
        <div
          id="fare-engine-modal-top-bar"
          className="bg-slate-900 border-b border-slate-800 px-4 py-2.5 flex items-center justify-between gap-3 shrink-0"
        >
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-xs" />
              <span className="text-xs font-bold text-white tracking-wide uppercase">
                Owner Portal · Fare & Price Engine
              </span>
            </div>

            <div className="h-4 w-px bg-slate-700 hidden sm:block" />

            {/* Mode Tabs */}
            <div className="flex items-center bg-slate-800/90 p-1 rounded-xl border border-slate-700">
              <button
                id="fare-modal-mode-centralized-btn"
                type="button"
                onClick={() => setActiveMode('CENTRALIZED')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeMode === 'CENTRALIZED'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>Centralized Multi-Service Engine</span>
              </button>
            </div>
          </div>

          {/* Window Controls */}
          <div className="flex items-center gap-1">
            <button
              id="fare-modal-minimize-btn"
              type="button"
              onClick={() => setIsMinimized(true)}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              title="Minimize"
            >
              <Minimize2 className="w-4 h-4" />
            </button>
            <button
              id="fare-modal-close-btn"
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              title="Close modal"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Body: Active View */}
        {activeMode === 'INTER_STATE_ONE_WAY' ? (
          <div
            id="interstate-oneway-configuration-subsection"
            className="flex-1 flex flex-col min-h-0 overflow-hidden"
          >
            <InterStateOneWayPricingSection
              isOwner={isOwner}
              onFareSaved={onFareSaved}
              onSwitchToCentralized={() => setActiveMode('CENTRALIZED')}
            />
          </div>
        ) : (
          <AdvancedFareEngine
            onClose={onClose}
            onMinimize={() => setIsMinimized(true)}
            isOwner={isOwner}
            onFareSaved={onFareSaved}
            initialSection={initialSection}
          />
        )}
      </div>
    </div>
  );
};

