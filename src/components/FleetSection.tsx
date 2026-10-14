import React, { useState } from 'react';
import {
  Users,
  Briefcase,
  ShieldCheck,
  Check,
  ArrowRight,
  Info,
  X,
  Sparkles,
} from 'lucide-react';
import { vehiclesData } from '../data/vehicles';
import { VehicleVectorGraphic } from './VehicleVectorGraphic';
import { Vehicle } from '../types';

interface FleetSectionProps {
  onSelectVehicleForBooking: (vehicleId: string) => void;
}

export const FleetSection: React.FC<FleetSectionProps> = ({ onSelectVehicleForBooking }) => {
  // State for interactive Luggage & Seating Guide modal
  const [selectedVehicleForGuide, setSelectedVehicleForGuide] = useState<Vehicle | null>(null);

  const getSuitabilityText = (id: string) => {
    switch (id) {
      case 'sedan-4-1':
        return 'City Errands & Expressway Transit';
      case 'suv-6-1':
        return 'Hills, Coorg & Family Touring';
      case 'innova':
        return 'Comfort Highway & Ooty Ghats';
      case 'innova-crysta':
        return 'Executive Class & VIP Travel';
      case 'tempo-traveller-12-1':
        return 'Group Holidays & Pilgrimages';
      default:
        return 'All South India Corridors';
    }
  };

  const getLuggageBreakdown = (id: string) => {
    switch (id) {
      case 'sedan-4-1':
        return '2 Medium Trolley Bags + 2 Backpacks';
      case 'suv-6-1':
        return '3 Large Trolleys + 2 Duffel Bags';
      case 'innova':
        return '4 Large Strolleys + Cabin Bags';
      case 'innova-crysta':
        return '4 Large Trolleys + Dedicated Roof Space';
      case 'tempo-traveller-12-1':
        return '8+ Large Suitcases in Rear Boot';
      default:
        return 'Generous Boot Luggage Space';
    }
  };

  return (
    <section id="fleet" className="py-16 md:py-24 bg-slate-50/80 dark:bg-slate-950/60 border-y border-slate-200/80 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <span className="text-xs font-bold uppercase tracking-widest text-emerald-800 dark:text-emerald-400 bg-emerald-100/80 dark:bg-emerald-950/40 px-3 py-1 rounded-full border border-emerald-200/50 dark:border-emerald-800/50">
            Modern Fleet
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight mt-3">
            Vehicles Built for Every Voyage
          </h2>
          <p className="text-base sm:text-lg text-slate-600 dark:text-slate-400 mt-2">
            Maintained to executive standards for cleanliness, safety, climate control, and passenger comfort.
          </p>
        </div>

        {/* Vehicle Showcase Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
          {vehiclesData.map((vehicle) => (
            <div
              key={vehicle.id}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-6 shadow-2xs hover:shadow-lg hover:-translate-y-1 hover:border-emerald-600/40 dark:hover:border-emerald-500/40 transition-all duration-300 flex flex-col justify-between group"
            >
              <div className="flex-1 flex flex-col">
                {/* 4K Vector Illustration Header & Badges */}
                <div className="flex items-center justify-between mb-4">
                  <div className="h-16 w-24 rounded-2xl bg-gradient-to-b from-slate-50 to-emerald-50/70 dark:from-slate-800 dark:to-emerald-950/40 border border-slate-200/90 dark:border-slate-700 text-emerald-800 dark:text-emerald-400 flex items-center justify-center shadow-2xs p-1 group-hover:scale-105 transition-transform duration-300">
                    <VehicleVectorGraphic vehicleId={vehicle.id} size="md" className="max-w-full drop-shadow-xs" />
                  </div>
                  <div className="text-right">
                    <span className="inline-block px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-[11px] uppercase tracking-wider">
                      {vehicle.category}
                    </span>
                    {vehicle.badge && (
                      <span className="block text-[10px] font-bold text-emerald-800 dark:text-emerald-400 mt-0.5">
                        {vehicle.badge}
                      </span>
                    )}
                  </div>
                </div>

                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">{vehicle.name}</h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mb-4 leading-relaxed min-h-[40px]">
                  {vehicle.description}
                </p>

                {/* Specs Pill List */}
                <div className="grid grid-cols-2 gap-2 mb-4 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-300 border border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-emerald-800 dark:text-emerald-400 shrink-0" />
                    <span className="font-bold text-emerald-950 dark:text-emerald-300">{vehicle.seatingCapacity} Passengers</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Briefcase className="w-4 h-4 text-emerald-800 dark:text-emerald-400 shrink-0" />
                    <span className="font-bold text-emerald-950 dark:text-emerald-300">{vehicle.luggageCapacity} Bags Capacity</span>
                  </div>
                  <div className="flex items-center gap-1.5 col-span-2 text-emerald-900 dark:text-emerald-300 font-semibold pt-1 border-t border-slate-200/60 dark:border-slate-700/60">
                    <ShieldCheck className="w-4 h-4 text-emerald-800 dark:text-emerald-400 shrink-0" />
                    <span>{vehicle.comfortLevel} Class Experience</span>
                  </div>
                </div>

                {/* Features Tag List */}
                {vehicle.features && vehicle.features.length > 0 && (
                  <div className="mb-4 flex-1">
                    <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-2">
                      Included Amenities
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {vehicle.features.map((feat) => (
                        <span
                          key={feat}
                          className="text-[11px] font-medium text-slate-700 dark:text-slate-300 bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/40 px-2 py-0.5 rounded-md flex items-center gap-1"
                        >
                          <Check className="w-3 h-3 text-emerald-800 dark:text-emerald-400" />
                          {feat}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons: Clean bordered white button with dark typography aligning seamlessly across cards */}
              <div className="pt-4 mt-auto border-t border-slate-100 dark:border-slate-800/80">
                <button
                  type="button"
                  onClick={() => onSelectVehicleForBooking(vehicle.id)}
                  className="w-full py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-semibold text-sm hover:border-slate-300 hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors flex items-center justify-center gap-2 group/btn cursor-pointer shadow-2xs hover:shadow-xs"
                >
                  <span>Choose {vehicle.category}</span>
                  <ArrowRight className="w-4 h-4 text-slate-700 dark:text-slate-300 group-hover/btn:translate-x-1 transition-transform" />
                </button>

                {/* Interactive Seating & Luggage Guide Trigger */}
                <button
                  type="button"
                  onClick={() => setSelectedVehicleForGuide(vehicle)}
                  className="w-full mt-2 text-[11px] font-medium text-slate-400 hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors py-1 flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Info className="w-3 h-3" />
                  <span>Luggage & Seating Breakdown</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Interactive Luggage & Seating Guide Modal */}
      {selectedVehicleForGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl relative">
            <button
              type="button"
              onClick={() => setSelectedVehicleForGuide(null)}
              className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              aria-label="Close dialog"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-4 mb-4">
              <div className="h-16 w-24 rounded-2xl bg-gradient-to-b from-slate-50 to-emerald-50/70 dark:from-slate-800 dark:to-emerald-950/40 border border-slate-200/90 dark:border-slate-700 text-emerald-800 dark:text-emerald-400 flex items-center justify-center p-1 shrink-0">
                <VehicleVectorGraphic vehicleId={selectedVehicleForGuide.id} size="md" className="max-w-full drop-shadow-xs" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                  {selectedVehicleForGuide.name}
                </h3>
                <span className="text-xs font-bold text-emerald-800 dark:text-emerald-400">
                  {selectedVehicleForGuide.comfortLevel} Class Configuration
                </span>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mb-5 leading-relaxed">
              {selectedVehicleForGuide.description}
            </p>

            <div className="space-y-3.5 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 flex items-start gap-3">
                <Users className="w-5 h-5 text-emerald-700 dark:text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-slate-900 dark:text-white block mb-0.5">
                    Seating Layout ({selectedVehicleForGuide.seatingCapacity} Passengers + Chauffeur)
                  </span>
                  <p className="text-slate-600 dark:text-slate-400 leading-normal text-[11px]">
                    Spacious push-back ergonomic seating with ample legroom for adult travelers across all rows.
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 flex items-start gap-3">
                <Briefcase className="w-5 h-5 text-emerald-700 dark:text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-slate-900 dark:text-white block mb-0.5">
                    Luggage Capacity ({selectedVehicleForGuide.luggageCapacity} Large Bags)
                  </span>
                  <p className="text-slate-600 dark:text-slate-400 leading-normal text-[11px]">
                    {getLuggageBreakdown(selectedVehicleForGuide.id)}. Additional soft luggage fits easily under seats.
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-emerald-900 dark:text-emerald-300 block mb-0.5">
                    Best Suited For
                  </span>
                  <p className="text-emerald-800 dark:text-emerald-400 leading-normal text-[11px]">
                    {getSuitabilityText(selectedVehicleForGuide.id)}. Sanitized AC cabin with professional verified driver.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6 flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  const id = selectedVehicleForGuide.id;
                  setSelectedVehicleForGuide(null);
                  onSelectVehicleForBooking(id);
                }}
                className="w-full py-3 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-semibold text-sm hover:border-slate-300 hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-2xs hover:shadow-xs"
              >
                <span>Select & Book {selectedVehicleForGuide.category}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
