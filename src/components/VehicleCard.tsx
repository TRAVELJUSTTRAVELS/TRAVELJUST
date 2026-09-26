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
import { VehicleVectorGraphic } from './VehicleVectorGraphic';
import { siteConfig } from '../config/siteConfig';
import { fareService } from '../services/fareService';
import { FareVehicleId } from '../types/fareEngine';

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

  // Check if current trip is a One-Way booking (intra-state or inter-state)
  const isOneWay = Boolean(
    searchDetails?.serviceType === 'oneway' ||
    fareEstimate.pricingModel === 'ONE_WAY_FIXED_CORRIDOR' ||
    fareEstimate.pricingModel === 'INTER_STATE_ONE_WAY' ||
    fareEstimate.isInterState
  );

  // Authoritative check: whether the current selection is strictly an Inter-State One-Way trip
  const isInterStateOneWay = Boolean(
    fareEstimate.isInterState ||
    fareEstimate.pricingModel === 'INTER_STATE_ONE_WAY' ||
    (searchDetails?.serviceType === 'oneway' && (
      fareEstimate.isInterState ||
      searchDetails?.routeInfo?.isInterstate ||
      (fareEstimate.originState && fareEstimate.destinationState && fareEstimate.originState !== fareEstimate.destinationState)
    ))
  );

  // Authoritative extra KM rate strictly retrieved from the active Fare & Price Engine
  const extraKmRate = (() => {
    // 1. Check fareEstimate snapshot produced by Fare & Price Engine calculation
    if (fareEstimate.fareSnapshot?.extraPerKmRate && fareEstimate.fareSnapshot.extraPerKmRate > 0) {
      return fareEstimate.fareSnapshot.extraPerKmRate;
    }
    if (fareEstimate.fareSnapshot?.perKmRate && fareEstimate.fareSnapshot.perKmRate > 0) {
      return fareEstimate.fareSnapshot.perKmRate;
    }

    // 2. Fetch directly from Centralized Fare Engine active config
    const central = fareService.getCentralizedConfigSync();
    const vid: FareVehicleId =
      vehicle.id === 'sedan-4-1' || vehicle.id === 'toyota-etios' || vehicle.id === 'swift-desire'
        ? 'sedan-4-1'
        : vehicle.id === 'suv-6-1' || vehicle.id === 'ertiga' || vehicle.id === 'suv'
        ? 'suv-6-1'
        : vehicle.id === 'innova' || vehicle.id === 'innova-6-1' || vehicle.id === 'innova-7-1'
        ? 'innova'
        : vehicle.id === 'innova-crysta' || vehicle.id === 'innova-crysta-7-1'
        ? 'innova-crysta'
        : vehicle.id === 'tempo-traveller-12-1' || vehicle.id === 'tempo-traveller' || vehicle.id === 'tempo-traveller-14-1'
        ? 'tempo-traveller-12-1'
        : 'sedan-4-1';

    if (central) {
      if (searchDetails?.serviceType === 'local' && central.local[vid]) {
        return central.local[vid].extraPerKmRate || central.local[vid].perKmRate;
      }
      if (searchDetails?.serviceType === 'oneway' && central.oneWay[vid]) {
        return central.oneWay[vid].extraPerKmRate || central.oneWay[vid].perKmRate;
      }
      if (searchDetails?.serviceType === 'roundtrip' && central.roundTrip[vid]) {
        return central.roundTrip[vid].perKmRate;
      }
      if (searchDetails?.serviceType === 'airport' && central.airport[vid]) {
        return central.airport[vid].extraPerKmRate || central.airport[vid].perKmRate;
      }
      if (central.interStateOneWay?.[vid]) {
        return central.interStateOneWay[vid].extraPerKmRate || central.interStateOneWay[vid].perKmRate;
      }
    }

    const vPricing =
      pricingConfig.vehiclePricing?.[vehicle.id] ||
      (vehicle.id === 'suv-6-1' ? pricingConfig.vehiclePricing?.['ertiga'] : undefined);
    if (vPricing) {
      if (searchDetails?.serviceType === 'local' && vPricing.localPerKmRate) return vPricing.localPerKmRate;
      if (searchDetails?.serviceType === 'oneway' && vPricing.oneWayPerKmRate) return vPricing.oneWayPerKmRate;
      if (searchDetails?.serviceType === 'airport' && vPricing.airportPerKmRate) return vPricing.airportPerKmRate;
      if (vPricing.perKmFare) return vPricing.perKmFare;
    }

    return 13;
  })();

  const formattedTotalFare =
    typeof fareEstimate.totalEstimatedFare === 'number' && !isNaN(fareEstimate.totalEstimatedFare)
      ? fareEstimate.totalEstimatedFare.toLocaleString('en-IN')
      : '--';

  const formattedOriginalFare =
    fareEstimate.originalFare && !isNaN(fareEstimate.originalFare)
      ? fareEstimate.originalFare.toLocaleString('en-IN')
      : null;

  const formattedDiscount =
    fareEstimate.discountAmount && !isNaN(fareEstimate.discountAmount) && fareEstimate.discountAmount > 0
      ? fareEstimate.discountAmount.toLocaleString('en-IN')
      : null;

  return (
    <div
      id={`vehicle-card-${vehicle.id}`}
      className={`bg-white rounded-2xl border transition-all duration-200 overflow-hidden ${
        isSelected
          ? 'border-emerald-700 ring-2 ring-emerald-700/20 shadow-md bg-emerald-50/10'
          : 'border-slate-200 hover:border-emerald-600/60 hover:shadow-md'
      }`}
    >
      <div id={`vehicle-card-content-${vehicle.id}`} className="p-5 sm:p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          {/* Left Side: Vehicle Info & Vector Graphic */}
          <div className="flex items-start gap-4 flex-1">
            {/* 4K High-Definition Vector Silhouette Artwork */}
            <div className="w-20 h-16 sm:w-24 sm:h-20 rounded-2xl bg-gradient-to-b from-slate-50 to-emerald-50/60 border border-slate-200/90 flex flex-col items-center justify-center shrink-0 shadow-2xs p-1.5 transition-all group-hover:border-emerald-300">
              <VehicleVectorGraphic vehicleId={vehicle.id} size="md" className="max-w-full drop-shadow-xs" />
              <span className="text-[9px] sm:text-[10px] font-extrabold tracking-wider uppercase text-emerald-950 mt-0.5 truncate max-w-full px-1">
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

              <p
                id={`vehicle-description-${vehicle.id}`}
                className="text-xs sm:text-sm text-slate-600 leading-relaxed line-clamp-2"
              >
                {vehicle.description}
              </p>

              {/* Capacities & Badges */}
              <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs font-medium text-slate-700 pt-1">
                <div className="flex items-center gap-1.5 bg-slate-100/80 px-2.5 py-1 rounded-lg">
                  <Users className="w-4 h-4 text-emerald-800" />
                  <span id={`vehicle-passenger-capacity-${vehicle.id}`}>Up to {vehicle.seatingCapacity} Passengers</span>
                </div>

                <div className="flex items-center gap-1.5 bg-slate-100/80 px-2.5 py-1 rounded-lg">
                  <Briefcase className="w-4 h-4 text-emerald-800" />
                  <span>{vehicle.luggageCapacity} Bags</span>
                </div>

                {!fareEstimate.isFixedPrice && (
                  <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-900 border border-emerald-200/90 px-2.5 py-1 rounded-lg font-bold shadow-2xs">
                    <span>Extra KM:</span>
                    <span id={`vehicle-extra-km-rate-${vehicle.id}`} className="font-extrabold text-emerald-950">
                      ₹{extraKmRate}/km
                    </span>
                  </div>
                )}

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
                      {formattedTotalFare}
                    </span>
                    {formattedOriginalFare && (
                      <span className="text-sm sm:text-base font-semibold text-slate-400 line-through">
                        {pricingConfig.currencySymbol}
                        {formattedOriginalFare}
                      </span>
                    )}
                  </div>

                  {formattedDiscount && (
                    <div className="text-[11px] font-bold text-emerald-700 lg:text-right">
                      You save {pricingConfig.currencySymbol}{formattedDiscount} (15% Off)
                    </div>
                  )}

                  <div className="flex items-center gap-1.5 text-[11px] text-slate-600 font-semibold mt-0.5 lg:justify-end flex-wrap">
                    <div className="flex items-center gap-1 text-slate-700">
                      <Clock className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                      <span>
                        {fareEstimate.exactDistanceKm || fareEstimate.estimatedDistanceKm} km • ~{fareEstimate.estimatedDurationHours} hrs
                      </span>
                    </div>
                    {fareEstimate.isFixedPrice ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-emerald-50 text-emerald-950 border border-emerald-300 shadow-2xs">
                        {fareEstimate.estimatedDistanceKm === 149 ? 'DISTANCE ~149 km limit' : 'DISTANCE ~182 km'}
                      </span>
                    ) : (
                      searchDetails?.serviceType !== 'local' &&
                      !isInterStateOneWay &&
                      fareEstimate.includedMinKm && (
                        <span
                          id={`vehicle-km-limit-${vehicle.id}`}
                          className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-900 border border-emerald-300 shadow-2xs"
                        >
                          {fareEstimate.includedMinKm} Km Limit
                        </span>
                      )
                    )}
                  </div>

                  {/* Fare Breakdown Toggle (Hidden for local booking form and one-way Preferred Vehicle) */}
                  {searchDetails?.serviceType !== 'local' && !isOneWay && !isInterStateOneWay && (
                    <button
                      id={`btn-fare-breakdown-${vehicle.id}`}
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
                id={`btn-select-vehicle-${vehicle.id}`}
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
          <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center gap-1.5 text-[11px] sm:text-xs font-medium text-slate-500 leading-relaxed">
            <span className="text-amber-600 font-bold">*NOTE:</span>
            <span>Final fare may vary based on Extra KM, Extra Hours, Parking, and Toll charges.</span>
          </div>
        )}

        {/* One Way Booking Disclaimer Note (Only in one way preferred vehicle, not in inter state one way) */}
        {searchDetails?.serviceType === 'oneway' && !isInterStateOneWay && (
          <div
            id={`vehicle-oneway-disclaimer-${vehicle.id}`}
            className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center gap-1.5 text-[11px] sm:text-xs font-medium text-slate-500 leading-relaxed"
          >
            <span className="text-[#F54900] font-bold">* NOTE:</span>
            <span>EXTRA KM, TOLL CHARGES EXTRA.</span>
          </div>
        )}

        {/* Round Trip Booking Disclaimer Note (Only in round trip preferred all vehicles) */}
        {searchDetails?.serviceType === 'roundtrip' && (
          <div
            id={`vehicle-roundtrip-disclaimer-${vehicle.id}`}
            className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center gap-1.5 text-[11px] sm:text-xs font-medium text-slate-500 leading-relaxed"
          >
            <span className="text-[#F54900] font-bold">* NOTE:</span>
            <span>EXTRA KM, TOLL, PARKING, STATE TAX, CHARGES EXTRA.</span>
          </div>
        )}
      </div>

      {/* Expanded Fare Breakdown Box (Only for outstation roundtrip/airport bookings, hidden for one-way) */}
      {searchDetails?.serviceType !== 'local' && !isOneWay && !isInterStateOneWay && showBreakdown && (
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
        </div>
      )}
    </div>
  );
};
