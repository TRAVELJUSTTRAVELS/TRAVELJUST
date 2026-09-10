import React from 'react';
import { ServiceType } from '../types';

interface ServiceSelectorProps {
  selectedService: ServiceType;
  onSelectService: (service: ServiceType) => void;
}

interface ServiceOption {
  type: ServiceType;
  label: string;
}

export const ServiceSelector: React.FC<ServiceSelectorProps> = ({
  selectedService,
  onSelectService,
}) => {
  const options: ServiceOption[] = [
    { type: 'local', label: 'LOCAL' },
    { type: 'oneway', label: 'ONE WAY' },
    { type: 'roundtrip', label: 'ROUND TRIP' },
    { type: 'airport', label: 'Airport' },
  ];

  return (
    <div className="w-full flex justify-center" id="service-type-selector-wrapper">
      {/* Centered White Pill Container with Service Tabs */}
      <div
        id="service-selector-segmented-bar"
        className="inline-flex flex-wrap items-center justify-center bg-white rounded-xl sm:rounded-2xl p-1 sm:p-1.5 shadow-sm border border-slate-200/90 gap-1 sm:gap-1.5"
        role="tablist"
        aria-label="Trip Service Type"
      >
        {options.map((option) => {
          const isSelected = selectedService === option.type;
          return (
            <button
              key={option.type}
              type="button"
              role="tab"
              aria-selected={isSelected}
              id={`service-tab-${option.type}`}
              onClick={() => onSelectService(option.type)}
              className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-all duration-150 cursor-pointer select-none flex items-center gap-1.5 sm:gap-2 ${
                isSelected
                  ? 'bg-[#ECFDF5] text-[#0f2441] border border-emerald-300/80 shadow-2xs font-semibold'
                  : 'bg-transparent text-slate-700 hover:text-slate-900 hover:bg-slate-100/70'
              }`}
            >
              {/* Radio circle matching screenshot 8 */}
              <span
                className={`w-3.5 h-3.5 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                  isSelected ? 'border-2 border-emerald-700' : 'border-2 border-slate-400'
                }`}
              >
                {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-emerald-700" />}
              </span>
              <span className="whitespace-nowrap">{option.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};


