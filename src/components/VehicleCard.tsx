import React, { useState } from 'react';
import {
  Users,
  Briefcase,
  Check,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  Sparkles,
  Car,
  Clock,
  Info,
} from 'lucide-react';
import { Vehicle, FareEstimate, PricingConfig, BookingSearchState } from '../types';
import { siteConfig } from '../config/siteConfig';

interface VehicleCardProps {
  vehicle: Vehicle;
  fareEstimate: FareEstimate;
  pricingConfig: PricingConfig;
  searchDetails?: BookingSearchState;
  onSelect: (vehicle: Vehicle) => void;
  isSelected?: boolean;
}

export const VehicleCard: React.FC<VehicleCardProps> = ({
  vehicle,
  fareEstimate,
  pricingConfig,
  searchDetails,
  onSelect,
  isSelected,
}) => {
  const [showBreakdown, setShowBreakdown] = useState(false);

  return (
    <div
      className={`bg-white rounded-2xl border transition-all duration-200 overflow-hidden ${
        isSelected
          ? 'border-emerald-700 ring-2 ring-emerald-700/20 shadow-md bg-emerald-50/10'
          : 'border-slate-200 hover:border-emerald-600/60 hover:shadow-md'
      }`}
    >
      <div className="p-5 sm:p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          {/* Left Side: Vehicle Info & Vector Graphic */}
        <div className="flex items-start gap-4 flex-1">
          {/* SVG Abstract Vector Badge Representation */}
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-emerald-50 border border-emerald-100 flex flex-col items-center justify-center shrink-0 text-emerald-800 shadow-2xs p-2">
            <Car className="w-8 h-8 sm:w-10 sm:h-10 stroke-[1.8]" />
            <span className="text-[10px] font-bold tracking-wider uppercase mt-1 text-emerald-900">
              {vehicle.category}
            </span>
          </div>

          <div className="space-y-1.5 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-bold text-lg sm:text-xl text-slate-900 leading-snug">
                {vehicle.name}
              </h3>
              {vehicle.badge && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-900 text-xs font-semibold">
                  <Sparkles className="w-3 h-3 text-emerald-700" />
                  {vehicle.badge}
                </span>
              )}
              {fareEstimate.roundTripDays && fareEstimate.roundTripDays >= 1 && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-900 text-emerald-200 text-xs font-bold border border-emerald-700/60">
                  <Sparkles className="w-3 h-3 text-emerald-400" />
                  {fareEstimate.roundTripDays} Day{fareEstimate.roundTripDays > 1 ? 's' : ''} Round Trip ({Number(fareEstimate.includedMinKm || (fareEstimate.roundTripDays * 300)).toLocaleString('en-IN')} km min)
                </span>
              )}
              {fareEstimate.discountPercentage && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-900 text-xs font-bold border border-emerald-300">
                  <Sparkles className="w-3 h-3 text-emerald-700" />
                  12h/120km Special 15% OFF
                </span>
              )}
            </div>

            <p className="text-xs sm:text-sm text-slate-600 line-clamp-2">
              {vehicle.description}
            </p>

            {/* Capacities & Badges */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs font-medium text-slate-700 pt-1">
              <div className="flex items-center gap-1.5 bg-slate-100/80 px-2.5 py-1 rounded-lg">
                <Users className="w-4 h-4 text-emerald-800" />
                <span>Up to {vehicle.seatingCapacity} Passengers</span>
              </div>

              <div className="flex items-center gap-1.5 bg-slate-100/80 px-2.5 py-1 rounded-lg">
                <Briefcase className="w-4 h-4 text-emerald-800" />
                <span>{vehicle.luggageCapacity} Bags</span>
              </div>

              <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-900 border border-emerald-200/80 px-2.5 py-1 rounded-lg font-bold">
                <span>Extra KM:</span>
                <span>
                  ₹{(() => {
                    const rate = searchDetails?.serviceType === 'local' 
                      ? (pricingConfig.vehiclePricing?.[vehicle.id]?.localPerKmRate || pricingConfig.vehiclePricing?.[vehicle.id]?.perKmFare || 13) 
                      : searchDetails?.serviceType === 'oneway'
                      ? (pricingConfig.vehiclePricing?.[vehicle.id]?.oneWayPerKmRate || pricingConfig.vehiclePricing?.[vehicle.id]?.perKmFare || 13.5)
                      : searchDetails?.serviceType === 'airport'
                      ? (pricingConfig.vehiclePricing?.[vehicle.id]?.airportPerKmRate || pricingConfig.vehiclePricing?.[vehicle.id]?.perKmFare || 14)
                      : (pricingConfig.vehiclePricing?.[vehicle.id]?.perKmFare || 13);
                    if ((vehicle.id === 'sedan-4-1' || vehicle.id === 'toyota-etios' || vehicle.id === 'swift-desire') && (rate === 12 || rate === 12.0)) {
                      return 13;
                    }
                    return rate;
                  })()}/km
                </span>
              </div>

              <div className="flex items-center gap-1.5 text-emerald-800">
                <ShieldCheck className="w-4 h-4" />
                <span className="font-semibold">{vehicle.comfortLevel}</span>
              </div>
            </div>

            {/* Feature Tags */}
            <div className="flex flex-wrap items-center gap-1.5 pt-2">
              {vehicle.features.map((feat) => (
                <span
                  key={feat}
                  className="text-[11px] font-medium text-slate-600 bg-slate-50 border border-slate-200/80 px-2 py-0.5 rounded-md"
                >
                  {feat}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Right Side: Estimated Fare & Select Action */}
        <div className="flex flex-col sm:flex-row lg:flex-col items-start sm:items-center lg:items-end justify-between border-t lg:border-t-0 border-slate-100 pt-4 lg:pt-0 gap-3 min-w-[210px]">
          <div className="text-left lg:text-right">
            <div className="flex items-center gap-1.5 flex-wrap lg:justify-end">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Estimated Fare
              </span>
              {fareEstimate.discountPercentage && (
                <span className="text-[10px] font-extrabold text-emerald-800 bg-emerald-100 border border-emerald-300 px-1.5 py-0.2 rounded leading-none">
                  {fareEstimate.discountPercentage}% OFF
                </span>
              )}
            </div>
            {fareEstimate.isValid === false ? (
              <div>
                <span className="text-xl sm:text-2xl font-extrabold text-amber-700 block">
                  Route Pending
                </span>
                <p className="text-[11px] text-amber-800 max-w-[220px] mt-0.5 leading-tight">
                  {fareEstimate.validationError || 'Select verified pickup and drop points to calculate road fare.'}
                </p>
              </div>
            ) : (
              <>
                <div className="flex items-baseline gap-2 lg:justify-end flex-wrap">
                  <span className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                    {pricingConfig.currencySymbol}
                    {fareEstimate.totalEstimatedFare}
                  </span>
                  {fareEstimate.originalFare && (
                    <span className="text-sm sm:text-base font-semibold text-slate-400 line-through">
                      {pricingConfig.currencySymbol}
                      {fareEstimate.originalFare}
                    </span>
                  )}
                </div>

                {fareEstimate.discountAmount && fareEstimate.discountAmount > 0 && (
                  <div className="text-[11px] font-bold text-emerald-700 lg:text-right">
                    You save {pricingConfig.currencySymbol}{fareEstimate.discountAmount} (15% Off)
                  </div>
                )}

                <div className="flex items-center gap-1.5 text-[11px] text-emerald-800 font-semibold mt-0.5 lg:justify-end flex-wrap">
                  <div className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    <span>
                      {fareEstimate.exactDistanceKm
                        ? `${fareEstimate.exactDistanceKm} km road`
                        : `${fareEstimate.estimatedDistanceKm} km`} • ~{fareEstimate.estimatedDurationHours} hrs
                    </span>
                  </div>
                  {fareEstimate.includedMinKm && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
                      {fareEstimate.includedMinKm} Km Limit
                    </span>
                  )}
                </div>

                {/* Fare Breakdown Toggle (Hidden for local booking form) */}
                {searchDetails?.serviceType !== 'local' && (
                  <button
                    type="button"
                    onClick={() => setShowBreakdown(!showBreakdown)}
                    className="text-[11px] text-emerald-800 hover:text-emerald-900 font-bold underline flex items-center gap-0.5 mt-1 focus:outline-none cursor-pointer"
                  >
                    <Info className="w-3 h-3" />
                    {showBreakdown ? 'Hide Fare Details' : 'View Fare Breakdown'}
                    {showBreakdown ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  </button>
                )}
              </>
            )}
          </div>

          <div className="w-full sm:w-auto flex items-center justify-end">
            <button
              type="button"
              disabled={fareEstimate.isValid === false}
              onClick={() => onSelect(vehicle)}
              className={`w-full sm:w-auto min-w-[140px] px-6 py-3 rounded-xl font-bold text-xs sm:text-sm shadow-xs transition-all flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-emerald-700 cursor-pointer ${
                fareEstimate.isValid === false
                  ? 'bg-slate-200 text-slate-500 cursor-not-allowed border border-slate-300'
                  : isSelected
                  ? 'bg-emerald-900 text-white hover:bg-emerald-950 ring-2 ring-emerald-600/50'
                  : 'bg-emerald-800 hover:bg-emerald-900 text-white active:scale-[0.99]'
              }`}
            >
              {fareEstimate.isValid === false ? (
                'Route Required'
              ) : isSelected ? (
                <>
                  <Check className="w-4 h-4 stroke-[3]" /> Selected
                </>
              ) : (
                'SELECT'
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Local Booking Disclaimer Note */}
      {searchDetails?.serviceType === 'local' && (
        <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center gap-1 text-[11px] sm:text-xs font-medium text-slate-500 leading-relaxed">
          <span className="text-[#F54900] font-bold">*NOTE:</span>
          <span>Final fare may vary based on, Extra KM, Extra Hours, Parking, Toll.</span>
        </div>
      )}
    </div>

      {/* Expanded Fare Breakdown Box (Only for outstation/airport bookings) */}
      {searchDetails?.serviceType !== 'local' && showBreakdown && (
        <div className="bg-slate-50 border-t border-slate-200/80 p-4 px-6 text-xs text-slate-700 space-y-2 animate-in fade-in duration-150">
          <div className="font-bold text-slate-900 uppercase tracking-wider text-[11px] mb-2 flex items-center justify-between">
            <span>Detailed Fare Calculation</span>
            <span className="text-emerald-800">Verified Pricing</span>
          </div>
          <div className="space-y-1.5 divide-y divide-slate-200/60">
            {fareEstimate.breakdown.map((item, idx) => (
              <div key={idx} className="flex justify-between items-center pt-1.5">
                <span className="text-slate-600">{item.label}</span>
                <span className="font-semibold text-slate-900">
                  {pricingConfig.currencySymbol}
                  {item.amount}
                </span>
              </div>
            ))}
            <div className="flex justify-between items-center pt-2 font-bold text-slate-900 text-sm">
              <span>Total Estimated Fare</span>
              <span className="text-emerald-800">
                {pricingConfig.currencySymbol}
                {fareEstimate.totalEstimatedFare}
              </span>
            </div>
          </div>
          <p className="text-[11px] font-medium text-slate-500 pt-1.5 leading-relaxed">
            * <strong className="text-[#F54900] font-bold">NOTE:</strong> Final fare may vary based on actual route, Extra KM, Parking, Toll, state tax.
          </p>
        </div>
      )}
    </div>
  );
};
