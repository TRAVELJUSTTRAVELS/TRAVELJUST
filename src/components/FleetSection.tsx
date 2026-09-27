import React from 'react';
import { Users, Briefcase, ShieldCheck, Sparkles, Check } from 'lucide-react';
import { vehiclesData } from '../data/vehicles';
import { VehicleVectorGraphic } from './VehicleVectorGraphic';
import { ServiceType } from '../types';

interface FleetSectionProps {
  onSelectVehicleForBooking: (vehicleId: string) => void;
}

export const FleetSection: React.FC<FleetSectionProps> = ({ onSelectVehicleForBooking }) => {
  return (
    <section id="fleet" className="py-16 md:py-24 bg-slate-50/80 border-y border-slate-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <span className="text-xs font-bold uppercase tracking-widest text-emerald-800 bg-emerald-100/80 px-3 py-1 rounded-full">
            Modern Fleet
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mt-3">
            Vehicles Built for Every Voyage
          </h2>
          <p className="text-base sm:text-lg text-slate-600 mt-2">
            Maintained to executive standards for cleanliness, safety, climate control, and passenger comfort.
          </p>
        </div>

        {/* Vehicle Showcase Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {vehiclesData.map((vehicle) => (
            <div
              key={vehicle.id}
              className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs hover:shadow-md transition-all duration-200 flex flex-col justify-between"
            >
              <div>
                {/* 4K High Definition Vector Illustration Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="h-16 w-24 rounded-2xl bg-gradient-to-b from-slate-50 to-emerald-50/70 border border-slate-200/90 text-emerald-800 flex items-center justify-center shadow-2xs p-1">
                    <VehicleVectorGraphic vehicleId={vehicle.id} size="md" className="max-w-full drop-shadow-xs" />
                  </div>
                  <div className="text-right">
                    <span className="inline-block px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-bold text-[11px] uppercase tracking-wider">
                      {vehicle.category}
                    </span>
                    {vehicle.badge && (
                      <span className="block text-[10px] font-bold text-emerald-800 mt-0.5">
                        {vehicle.badge}
                      </span>
                    )}
                  </div>
                </div>

                <h3 className="text-xl font-bold text-slate-900 mb-2">{vehicle.name}</h3>
                <p className="text-xs sm:text-sm text-slate-600 mb-4 leading-relaxed">
                  {vehicle.description}
                </p>

                {/* Specs Pill List */}
                <div className="grid grid-cols-2 gap-2 mb-4 bg-slate-50 p-3 rounded-xl text-xs font-medium text-slate-700">
                  <div className="flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-[#004F3B] shrink-0" />
                    <span className="font-bold text-[#004F3B]">{vehicle.seatingCapacity} Passengers</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Briefcase className="w-4 h-4 text-[#004F3B] shrink-0" />
                    <span className="font-bold text-[#004F3B]">{vehicle.luggageCapacity} Bags Capacity</span>
                  </div>
                  <div className="flex items-center gap-1.5 col-span-2 text-emerald-900 font-semibold pt-1 border-t border-slate-200/60">
                    <ShieldCheck className="w-4 h-4 text-emerald-800 shrink-0" />
                    <span>{vehicle.comfortLevel} Class Experience</span>
                  </div>
                </div>

                {/* Features Tag List */}
                {vehicle.features && vehicle.features.length > 0 && (
                  <div className="mb-6">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                      Included Amenities
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {vehicle.features.map((feat) => (
                        <span
                          key={feat}
                          className="text-[11px] font-medium text-slate-700 bg-emerald-50/60 border border-emerald-100 px-2 py-0.5 rounded-md flex items-center gap-1"
                        >
                          <Check className="w-3 h-3 text-emerald-800" />
                          {feat}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() => onSelectVehicleForBooking(vehicle.id)}
                className="w-full bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs py-3 px-4 rounded-xl transition-all shadow-xs"
              >
                Choose {vehicle.category}
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
