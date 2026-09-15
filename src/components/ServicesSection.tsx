import React from 'react';
import { Clock, ArrowRight, Repeat, Plane, CheckCircle2 } from 'lucide-react';
import { servicesData } from '../data/services';
import { ServiceType } from '../types';

interface ServicesSectionProps {
  onSelectService: (serviceType: ServiceType) => void;
}

export const ServicesSection: React.FC<ServicesSectionProps> = ({ onSelectService }) => {
  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'Clock':
        return <Clock className="w-6 h-6" />;
      case 'ArrowRight':
        return <ArrowRight className="w-6 h-6" />;
      case 'Repeat':
        return <Repeat className="w-6 h-6" />;
      case 'Plane':
        return <Plane className="w-6 h-6" />;
      default:
        return <Clock className="w-6 h-6" />;
    }
  };

  return (
    <section id="services" className="py-16 md:py-24 bg-white relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <span className="text-xs font-bold uppercase tracking-widest text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
            Core Transportation Offerings
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mt-3">
            Tailored Services for Every Ride
          </h2>
          <p className="text-base sm:text-lg text-slate-600 mt-2">
            Choose from our versatile transport options designed for point-to-point speed, full-day convenience, round trips, and airport transfers.
          </p>
        </div>

        {/* 4 Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {servicesData.map((service) => (
            <div
              key={service.type}
              className="bg-slate-50/70 rounded-2xl p-6 border border-slate-200/80 hover:border-emerald-700/60 hover:shadow-lg transition-all duration-200 flex flex-col justify-between group"
            >
              <div>
                <div className="w-12 h-12 rounded-xl bg-emerald-800 text-white flex items-center justify-center mb-5 shadow-md shadow-emerald-800/20 group-hover:bg-emerald-900 transition-colors">
                  {getIcon(service.iconName)}
                </div>

                <h3 className="text-xl font-bold text-slate-900 mb-2">
                  {service.title}
                </h3>

                <p className="text-xs sm:text-sm text-slate-600 mb-4 leading-relaxed">
                  {service.shortDescription}
                </p>

                <div className="space-y-2 mb-6 border-t border-slate-200/60 pt-4">
                  {service.keyBenefits.map((benefit, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-xs text-slate-700 font-medium">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-800 shrink-0 mt-0.5" />
                      <span className="text-slate-700 font-medium leading-normal">
                        {benefit}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={() => onSelectService(service.type)}
                className="w-full bg-white hover:bg-emerald-800 text-slate-800 hover:text-white border border-slate-300 hover:border-emerald-800 font-bold text-xs py-3 px-4 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 group-hover:shadow-xs"
              >
                <span>{service.buttonText || `Book ${service.title}`}</span>
                <ArrowRight className="w-4 h-4 text-emerald-800 group-hover:text-white transition-colors" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
