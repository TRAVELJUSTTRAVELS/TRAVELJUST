import React from 'react';
import { Clock, ArrowRight, Repeat, Plane } from 'lucide-react';
import { ServiceType } from '../types';

interface ServiceSelectorProps {
  selectedService: ServiceType;
  onSelectService: (service: ServiceType) => void;
}

export const ServiceSelector: React.FC<ServiceSelectorProps> = ({
  selectedService,
  onSelectService,
}) => {
  const options: { type: ServiceType; title: string; subtitle: string; icon: React.ReactNode }[] = [
    {
      type: 'local',
      title: 'Local',
      subtitle: 'Hourly & local commute',
      icon: <Clock className="w-5 h-5" />,
    },
    {
      type: 'oneway',
      title: 'One Way Drop',
      subtitle: 'Point-to-point drop',
      icon: <ArrowRight className="w-5 h-5" />,
    },
    {
      type: 'roundtrip',
      title: 'Round Trip',
      subtitle: 'Outbound & return journey',
      icon: <Repeat className="w-5 h-5" />,
    },
    {
      type: 'airport',
      title: 'Airport Transfer',
      subtitle: 'Pickup or drop coordination',
      icon: <Plane className="w-5 h-5" />,
    },
  ];

  return (
    <div className="w-full">
      <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center justify-between">
        <span>Select Service Type</span>
        <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
          Instant Booking
        </span>
      </label>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        {options.map((option) => {
          const isSelected = selectedService === option.type;
          return (
            <div
              key={option.type}
              onClick={() => onSelectService(option.type)}
              className={`relative group p-4 rounded-2xl text-left transition-all duration-300 flex flex-col justify-between gap-3 cursor-pointer select-none focus:outline-none ${
                isSelected
                  ? 'bg-emerald-100/80 text-emerald-950 border-2 border-emerald-600 shadow-md ring-2 ring-emerald-500/20 scale-[1.02]'
                  : 'bg-white text-slate-800 border border-slate-200 hover:border-emerald-400 hover:bg-emerald-50/40 shadow-xs hover:shadow-md hover:-translate-y-0.5'
              }`}
            >
              {/* Active Indicator Top-Right Pill */}
              <div className="flex items-center justify-between w-full">
                <div
                  className={`p-2.5 rounded-xl transition-all duration-300 ${
                    isSelected
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-emerald-50 text-emerald-800 group-hover:bg-emerald-600 group-hover:text-white'
                  }`}
                >
                  {option.icon}
                </div>
                <div
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${
                    isSelected
                      ? 'border-emerald-700 bg-emerald-700 text-white scale-110 shadow-xs'
                      : 'border-slate-300 bg-transparent group-hover:border-emerald-500'
                  }`}
                >
                  {isSelected && (
                    <svg className="w-3 h-3 stroke-current stroke-[3]" viewBox="0 0 12 12" fill="none">
                      <path d="M2.5 6L5 8.5L9.5 3.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </div>
              </div>

              <div>
                <span
                  className={`block font-extrabold text-sm sm:text-base leading-tight ${
                    isSelected ? 'text-emerald-950' : 'text-slate-900 group-hover:text-emerald-950'
                  }`}
                >
                  {option.title}
                </span>
                <span
                  className={`block text-xs mt-1 font-semibold line-clamp-1 ${
                    isSelected ? 'text-emerald-800' : 'text-slate-500 group-hover:text-slate-700'
                  }`}
                >
                  {option.subtitle}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
