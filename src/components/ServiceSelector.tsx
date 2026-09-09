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
    { type: 'airport', label: 'AIRPORT TRANSFERS' },
  ];

  return (
    <div className="w-full flex justify-center" id="service-type-selector-wrapper">
      {/* Centered Segmented Tab Navigation - 180px width each on desktop, 50px height, #999 border, #D0FAE5 active */}
      <div
        id="service-selector-segmented-bar"
        className="w-full max-w-[760px] grid grid-cols-4 border border-[#999] rounded-lg overflow-hidden bg-white shadow-2xs divide-x divide-[#999]"
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
              className={`h-[46px] sm:h-[50px] px-1 sm:px-2 md:px-3 flex items-center justify-center text-center font-bold uppercase transition-colors duration-150 cursor-pointer select-none text-[10.5px] min-[380px]:text-xs sm:text-sm md:text-[15px] lg:text-[16px] tracking-tight sm:tracking-normal ${
                isSelected
                  ? 'bg-[#D0FAE5] text-slate-900 font-black'
                  : 'bg-white text-black hover:bg-slate-50 active:bg-slate-100'
              }`}
            >
              <span className="truncate">{option.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

