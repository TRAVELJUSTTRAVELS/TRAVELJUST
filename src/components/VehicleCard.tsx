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
import { getWhatsAppUrl } from '../utils/whatsapp';

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

  const handleWhatsAppBooking = (e: React.MouseEvent) => {
    e.stopPropagation();
    const pickup = searchDetails?.pickupLocation || 'Mysuru';
    const drop = searchDetails?.dropLocation || 'Bangalore Airport';
    const date = searchDetails?.travelDate || 'Today';
    const time = searchDetails?.pickupTime || '09:00 AM';
    const fare = fareEstimate.totalEstimatedFare;

    const msg = (
`🚕 *TRAVEL JUST - CAB BOOKING INQUIRY* 🚕
━━━━━━━━━━━━━━━━━━━━━━━━━━
🚗 *Vehicle:* ${vehicle.name} (${vehicle.seatingCapacity} Seater - ${vehicle.category})
📍 *Pickup Location:* ${pickup}
🏁 *Drop Location:* ${drop}
📅 *Pickup Date:* ${date}
⏰ *Pickup Time:* ${time}
💰 *Estimated Fare:* ₹${Number(fare ?? 0).toLocaleString('en-IN')}
━━━━━━━━━━━━━━━━━━━━━━━━━━
_Please confirm availability and dispatch driver details._`
    );

    window.open(getWhatsAppUrl(msg), '_blank', 'noopener,noreferrer');
  };

  return (
    <div
      className={`bg-white rounded-2xl border transition-all duration-200 overflow-hidden ${
        isSelected
          ? 'border-emerald-700 ring-2 ring-emerald-700/20 shadow-md bg-emerald-50/10'
          : 'border-slate-200 hover:border-emerald-600/60 hover:shadow-md'
      }`}
    >
      <div className="p-5 sm:p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
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
                  ₹{searchDetails?.serviceType === 'local' 
                    ? (pricingConfig.vehiclePricing?.[vehicle.id]?.localPerKmRate || pricingConfig.vehiclePricing?.[vehicle.id]?.perKmFare || 12) 
                    : searchDetails?.serviceType === 'oneway'
                    ? (pricingConfig.vehiclePricing?.[vehicle.id]?.oneWayPerKmRate || pricingConfig.vehiclePricing?.[vehicle.id]?.perKmFare || 13.5)
                    : searchDetails?.serviceType === 'airport'
                    ? (pricingConfig.vehiclePricing?.[vehicle.id]?.airportPerKmRate || pricingConfig.vehiclePricing?.[vehicle.id]?.perKmFare || 14)
                    : (pricingConfig.vehiclePricing?.[vehicle.id]?.perKmFare || 13)}/km
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
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Estimated Fare
            </span>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                {pricingConfig.currencySymbol}
                {fareEstimate.totalEstimatedFare}
              </span>
              <span className="text-xs font-semibold text-slate-500">
                {pricingConfig.currencyCode}
              </span>
            </div>

            <div className="flex items-center gap-1 text-[11px] text-emerald-800 font-semibold mt-0.5">
              <Clock className="w-3.5 h-3.5" />
              <span>Est. ~{fareEstimate.estimatedDurationHours} hrs</span>
            </div>

            {/* Fare Breakdown Toggle */}
            <button
              type="button"
              onClick={() => setShowBreakdown(!showBreakdown)}
              className="text-[11px] text-emerald-800 hover:text-emerald-900 font-bold underline flex items-center gap-0.5 mt-1 focus:outline-none"
            >
              <Info className="w-3 h-3" />
              {showBreakdown ? 'Hide Fare Details' : 'View Fare Breakdown'}
              {showBreakdown ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
          </div>

          <div className="w-full sm:w-auto flex flex-col sm:flex-row lg:flex-col gap-2">
            <button
              type="button"
              onClick={() => onSelect(vehicle)}
              className={`w-full sm:w-auto px-6 py-3 rounded-xl font-bold text-sm shadow-xs transition-all flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-emerald-600 ${
                isSelected
                  ? 'bg-emerald-900 text-white hover:bg-emerald-950'
                  : 'bg-emerald-800 hover:bg-emerald-900 text-white'
              }`}
            >
              {isSelected ? (
                <>
                  <Check className="w-4 h-4 stroke-[3]" /> Vehicle Selected
                </>
              ) : (
                'Select Vehicle'
              )}
            </button>

            <button
              type="button"
              id={`whatsapp-book-btn-${vehicle.id}`}
              onClick={handleWhatsAppBooking}
              title="Quick Booking via WhatsApp"
              className="w-full sm:w-auto px-3.5 py-2 rounded-lg font-bold text-xs bg-[#25D366]/10 hover:bg-[#25D366]/20 text-[#075E54] border border-[#25D366]/30 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Car className="w-3.5 h-3.5" />
              <span>Book via WhatsApp</span>
            </button>
          </div>
        </div>
      </div>

      {/* Expanded Fare Breakdown Box */}
      {showBreakdown && (
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
          {searchDetails?.serviceType !== 'local' && (
            <p className="text-[11px] font-medium text-slate-500 pt-1.5 leading-relaxed">
              * <strong className="text-[#F54900] font-bold">NOTE:</strong> final fare may vary based on actual route, Extra KM, Parking, Toll, state tax.
            </p>
          )}
        </div>
      )}
    </div>
  );
};
