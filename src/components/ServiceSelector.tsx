import React from 'react';
import { ServiceType } from '../types';

interface ServiceSelectorProps {
  selectedService: ServiceType;
  onSelectService: (service: ServiceType) => void;
  disabled?: boolean;
}

interface ServiceOption {
  type: ServiceType;
  label: string;
}

export const ServiceSelector: React.FC<ServiceSelectorProps> = ({
  selectedService,
  onSelectService,
  disabled = false,
}) => {
  const options: ServiceOption[] = [
    { type: 'local', label: 'LOCAL' },
    { type: 'oneway', label: 'ONEWAY' },
    { type: 'roundtrip', label: 'ROUND TRIP' },
    { type: 'airport', label: 'AIRPORT' },
  ];

  return (
    <div className="w-full flex justify-center items-center" id="service-type-selector-wrapper">
      {/* Category Tabs:
          - Shows ONLY clean text (no radio dots, no heavy background boxes)
          - Deep forest green #075441 tab removed
          - Active tab indicated by bold text and clean emerald underline
      */}
      <div
        id="service-selector-segmented-bar"
        className="grid grid-cols-4 sm:inline-flex sm:items-center sm:justify-center gap-1 sm:gap-6 lg:gap-12 px-1 sm:px-2 py-1 w-full sm:w-auto"
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
              disabled={disabled}
              id={`service-tab-${option.type}`}
              onClick={() => onSelectService(option.type)}
              className={`cursor-pointer transition-all duration-150 select-none min-h-[44px] px-1 sm:px-3 py-1 flex items-center justify-center focus-visible:outline-none ${
                disabled ? 'opacity-60 cursor-not-allowed pointer-events-none' : ''
              } ${
                isSelected
                  ? 'text-[#10233F] font-black border-b-[3px] sm:border-b-4 border-[#00A878]'
                  : 'text-[#4B6382] hover:text-[#10233F] font-extrabold border-b-[3px] sm:border-b-4 border-transparent'
              }`}
            >
              <span className="whitespace-nowrap uppercase tracking-wider text-[11px] xs:text-xs sm:text-base lg:text-[21px] xl:text-[23px]">
                {option.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
