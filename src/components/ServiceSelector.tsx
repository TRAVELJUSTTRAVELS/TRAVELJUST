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
    { type: 'oneway', label: 'ONEWAY' },
    { type: 'roundtrip', label: 'ROUND TRIP' },
    { type: 'airport', label: 'AIRPORT' },
  ];

  return (
    <div className="w-full flex justify-center" id="service-type-selector-wrapper">
      {/* Centered Service Tabs matching rrrr.jpeg capsule shape */}
      <div
        id="service-selector-segmented-bar"
        className="inline-flex items-center justify-center gap-1.5 sm:gap-2.5 max-w-full flex-wrap"
        role="tablist"
        aria-label="Trip Travel Modes"
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
              className={`rounded-full px-4 sm:px-5 py-2 sm:py-2.5 text-xs sm:text-[13px] font-bold tracking-tight transition-all duration-150 cursor-pointer select-none flex items-center justify-center focus-visible:outline-none ${
                isSelected
                  ? 'bg-[#5D70D6] text-white border border-[#5D70D6] shadow-xs'
                  : 'bg-white text-slate-800 border border-slate-300 hover:bg-slate-50 active:bg-slate-100 shadow-xs'
              }`}
            >
              <span
                className={`w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full border-2 flex items-center justify-center mr-1.5 sm:mr-2 shrink-0 transition-colors ${
                  isSelected ? 'border-white' : 'border-slate-600'
                }`}
              >
                {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
              </span>
              <span className="whitespace-nowrap uppercase">{option.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};


