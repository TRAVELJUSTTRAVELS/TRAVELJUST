import React, { useState } from 'react';
import {
  Clock,
  ArrowRight,
  Repeat,
  Plane,
  CheckCircle2,
  Info,
  X,
  MapPin,
  Sparkles,
  FileText,
} from 'lucide-react';
import { servicesData, ServiceDetail } from '../data/services';
import { ServiceType } from '../types';

interface ServicesSectionProps {
  onSelectService: (serviceType: ServiceType) => void;
}

export const ServicesSection: React.FC<ServicesSectionProps> = ({ onSelectService }) => {
  // Optional modal to view comprehensive tiers & guidelines without cluttering the cards
  const [selectedDetailService, setSelectedDetailService] = useState<ServiceDetail | null>(null);

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'Clock':
        return <Clock className="w-6 h-6 text-white" />;
      case 'ArrowRight':
        return <ArrowRight className="w-6 h-6 text-white" />;
      case 'Repeat':
        return <Repeat className="w-6 h-6 text-white" />;
      case 'Plane':
        return <Plane className="w-6 h-6 text-white" />;
      default:
        return <Clock className="w-6 h-6 text-white" />;
    }
  };

  const handleBook = (type: ServiceType) => {
    onSelectService(type);
    const searchSection = document.getElementById('booking-search-section');
    if (searchSection) {
      searchSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section id="services" className="py-16 md:py-24 bg-white dark:bg-slate-950 transition-colors relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="flex items-center justify-center gap-2 text-xs font-bold text-emerald-800 dark:text-emerald-400 mb-2 tracking-wider uppercase">
            <span>Transportation Offerings</span>
            <span aria-hidden="true">·</span>
            <span>Mysuru & South India Corridors</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Tailored Cab Services for Every Journey
          </h2>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 mt-2.5 leading-relaxed">
            Reliable transportation for local hourly packages, point-to-point drops, outstation return trips, and airport transfers.
          </p>
        </div>

        {/* 4 Service Cards Grid - Exact replica of the design image */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
          {servicesData.map((service: ServiceDetail) => (
            <div
              key={service.type}
              className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-6 sm:p-7 flex flex-col justify-between shadow-xs hover:shadow-lg hover:-translate-y-1 hover:border-emerald-600/40 dark:hover:border-emerald-500/40 transition-all duration-300 group"
            >
              <div>
                {/* Top Icon Badge in light forest green */}
                <div className="w-12 h-12 rounded-2xl bg-emerald-600 dark:bg-emerald-700 flex items-center justify-center shadow-xs mb-6 group-hover:scale-105 transition-transform duration-300">
                  {getIcon(service.iconName)}
                </div>

                {/* Title */}
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-3 tracking-tight">
                  {service.title}
                </h3>

                {/* Description */}
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-6 min-h-[48px]">
                  {service.shortDescription}
                </p>

                {/* Divider Line */}
                <div className="border-t border-slate-100 dark:border-slate-800 pt-6 mb-6">
                  {/* Bullet Points */}
                  <ul className="space-y-3.5">
                    {service.keyBenefits.map((benefit, idx) => (
                      <li
                        key={idx}
                        className="flex items-start gap-2.5 text-[13px] sm:text-sm text-slate-700 dark:text-slate-300 leading-snug"
                      >
                        <CheckCircle2
                          className="w-4 h-4 text-[#065f46] dark:text-emerald-400 shrink-0 mt-0.5"
                          strokeWidth={2}
                        />
                        <span>{benefit}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Bottom Action Area */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => handleBook(service.type)}
                  className="w-full py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-semibold text-sm hover:border-slate-300 hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors flex items-center justify-center gap-2 group/btn cursor-pointer shadow-2xs hover:shadow-xs"
                >
                  <span>{service.buttonText || `Book ${service.title}`}</span>
                  <ArrowRight className="w-4 h-4 text-slate-700 dark:text-slate-300 group-hover/btn:translate-x-1 transition-transform" />
                </button>

                {/* Subtle Interactive Trigger for detailed inclusions */}
                <button
                  type="button"
                  onClick={() => setSelectedDetailService(service)}
                  className="w-full mt-2 text-[11px] font-medium text-slate-400 hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors py-1 flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Info className="w-3 h-3" />
                  <span>View full package inclusions & policy</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Interactive Detail Modal for Deep Service Inclusions */}
      {selectedDetailService && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl relative">
            <button
              type="button"
              onClick={() => setSelectedDetailService(null)}
              className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              aria-label="Close dialog"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 dark:bg-emerald-700 flex items-center justify-center text-white shrink-0">
                {getIcon(selectedDetailService.iconName)}
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                  {selectedDetailService.title}
                </h3>
                <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">
                  {selectedDetailService.badge}
                </span>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mb-5 leading-relaxed">
              {selectedDetailService.fullDescription}
            </p>

            <div className="space-y-4 text-xs">
              {/* Popular Corridors / Tiers */}
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800">
                <span className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-white mb-2 text-xs">
                  <MapPin className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" />
                  Popular Packages & Route Options:
                </span>
                <ul className="space-y-1.5 pl-1">
                  {selectedDetailService.packageTiers.map((tier, idx) => (
                    <li key={idx} className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-700 shrink-0" />
                      <span>{tier}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Recommended For */}
              <div className="p-3.5 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30">
                <span className="flex items-center gap-1.5 font-bold text-emerald-900 dark:text-emerald-300 mb-1 text-xs">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-700" />
                  Recommended For:
                </span>
                <p className="text-emerald-800 dark:text-emerald-400 leading-relaxed text-[11px]">
                  {selectedDetailService.idealFor}
                </p>
              </div>

              {/* Transparent Policies */}
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800">
                <span className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-white mb-1.5 text-xs">
                  <FileText className="w-3.5 h-3.5 text-slate-400" />
                  Transparent Travel Guidelines:
                </span>
                <ul className="space-y-1">
                  {selectedDetailService.guidelines.map((guide, idx) => (
                    <li key={idx} className="text-[11px] text-slate-600 dark:text-slate-400">
                      · {guide}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="mt-6 flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setSelectedDetailService(null);
                  handleBook(selectedDetailService.type);
                }}
                className="w-full py-3 px-4 rounded-xl bg-[#064e3b] hover:bg-[#043d2e] text-white font-bold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs"
              >
                <span>{selectedDetailService.buttonText}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
