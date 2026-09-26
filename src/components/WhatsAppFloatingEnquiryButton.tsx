import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Car,
  MessageSquare,
  X,
  Send,
  AlertCircle,
  CheckCircle2,
  Calendar,
  Clock,
  MapPin,
  Users,
  ChevronRight,
  ExternalLink,
  ShieldCheck,
  Edit3,
} from 'lucide-react';
import { BookingSearchState, Vehicle, PricingConfig } from '../types';
import { siteConfig } from '../config/siteConfig';
import { calculateFare } from '../utils/fareCalculator';
import {
  buildWhatsAppBookingEnquiryMessage,
  trackWhatsAppBookingEnquiry,
  generateEnquiryId,
  formatDisplayDate,
  getWhatsAppUrl,
  WhatsAppBookingEnquiryPayload,
} from '../utils/whatsapp';
import { vehiclesData } from '../data/vehicles';
import { isTimeInPastForDate } from '../utils/timeValidation';

export interface WhatsAppFloatingEnquiryButtonProps {
  searchState: BookingSearchState | null;
  selectedVehicle: Vehicle | null;
  pricingConfig: PricingConfig;
  onEditBooking?: () => void;
  onSelectVehicle?: (vehicle: Vehicle) => void;
}

export const WhatsAppFloatingEnquiryButton: React.FC<WhatsAppFloatingEnquiryButtonProps> = ({
  searchState,
  selectedVehicle,
  pricingConfig,
  onEditBooking,
  onSelectVehicle,
}) => {
  // Modal & Notification UI states
  const [isSummaryOpen, setIsSummaryOpen] = useState<boolean>(false);
  const [validationToast, setValidationToast] = useState<{
    show: boolean;
    missingField: string;
    message: string;
  }>({
    show: false,
    missingField: '',
    message: '',
  });
  const [showTooltip, setShowTooltip] = useState<boolean>(false);

  // Active Vehicle state inside modal (allows user to select or switch vehicle right before WhatsApp)
  const [modalVehicle, setModalVehicle] = useState<Vehicle | null>(selectedVehicle);

  useEffect(() => {
    setModalVehicle(selectedVehicle);
  }, [selectedVehicle]);

  // Current calculation timestamp and unique calculation ID for Stale Fare Protection
  const calculationMetaRef = useRef<{
    id: string;
    calculatedAt: number;
  }>({
    id: `calc_${Date.now()}`,
    calculatedAt: Date.now(),
  });

  // Recompute metadata whenever searchState or vehicle changes
  useEffect(() => {
    calculationMetaRef.current = {
      id: `calc_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`,
      calculatedAt: Date.now(),
    };
  }, [searchState, modalVehicle]);

  // Current authoritative fare computed via TRAVEL JUST Dynamic Fare Engine
  const currentFareEstimate = useMemo(() => {
    if (!searchState || !modalVehicle) return null;
    try {
      return calculateFare(searchState, modalVehicle, pricingConfig);
    } catch {
      return null;
    }
  }, [searchState, modalVehicle, pricingConfig]);

  // Handle User Click on Floating Button
  const handleFloatingButtonClick = () => {
    setValidationToast({ show: false, missingField: '', message: '' });

    // 1. Pre-send Validation check
    const fromLoc = searchState?.pickupLocation?.trim();
    const isLocal = searchState?.serviceType === 'local';
    const toLoc = isLocal ? 'Local Mysuru Sightseeing & City' : searchState?.dropLocation?.trim();
    const travelDate = searchState?.travelDate?.trim() || searchState?.pickupDate?.trim();
    const pickupTime = searchState?.pickupTime?.trim();

    if (!fromLoc) {
      triggerValidationError(
        'Pickup Location',
        'Please enter your pickup location before contacting TRAVEL JUST on WhatsApp.',
        'from-location-input'
      );
      return;
    }

    if (!isLocal && !toLoc) {
      triggerValidationError(
        'Drop Destination',
        'Please enter your drop destination before contacting TRAVEL JUST on WhatsApp.',
        'to-location-input'
      );
      return;
    }

    if (!travelDate) {
      triggerValidationError(
        'Travel Date',
        'Please select your travel date before contacting TRAVEL JUST on WhatsApp.',
        'pickup-date-input'
      );
      return;
    }

    if (!pickupTime) {
      triggerValidationError(
        'Pickup Time',
        'Please select your pickup time before contacting TRAVEL JUST on WhatsApp.',
        'pickup-time-select'
      );
      return;
    }

    if (isTimeInPastForDate(travelDate, pickupTime)) {
      triggerValidationError(
        'Pickup Time',
        'Pickup time cannot be in the past for today. Please select an upcoming pickup time.',
        'pickup-time-select'
      );
      return;
    }

    // If valid, open the compact Route + Fare Summary confirmation dialog
    setIsSummaryOpen(true);
  };

  // Trigger Validation Error & smooth scroll to the missing field
  const triggerValidationError = (fieldName: string, message: string, targetElementId?: string) => {
    setValidationToast({
      show: true,
      missingField: fieldName,
      message,
    });

    if (targetElementId) {
      const el = document.getElementById(targetElementId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.focus?.();
        el.classList.add('ring-2', 'ring-amber-500');
        setTimeout(() => {
          el.classList.remove('ring-2', 'ring-amber-500');
        }, 3000);
        return;
      }
    }

    // Default scroll to booking search section
    const searchSection = document.getElementById('booking-search-section');
    if (searchSection) {
      searchSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Build the WhatsApp payload from current live state
  const buildCurrentPayload = (isFallback = false): WhatsAppBookingEnquiryPayload => {
    const isLocal = searchState?.serviceType === 'local';
    const activeVehicle = modalVehicle || selectedVehicle;
    const distance =
      currentFareEstimate?.exactDistanceKm ||
      currentFareEstimate?.estimatedDistanceKm ||
      searchState?.routeInfo?.distanceKm;
    const fare = currentFareEstimate?.totalEstimatedFare;

    return {
      enquiryId: generateEnquiryId(searchState?.travelDate || searchState?.pickupDate),
      tripType: searchState?.serviceType || 'oneway',
      from: searchState?.pickupLocation || 'Mysuru',
      to: isLocal ? undefined : searchState?.dropLocation || 'Destination',
      travelDate: searchState?.travelDate || searchState?.pickupDate || new Date().toISOString().split('T')[0],
      pickupTime: searchState?.pickupTime || '07:00 AM',
      returnDate: searchState?.serviceType === 'roundtrip' ? searchState?.returnDate || searchState?.dropDate : undefined,
      returnTime: searchState?.serviceType === 'roundtrip' ? searchState?.returnTime : undefined,
      passengers: searchState?.passengers,
      vehicleName: activeVehicle?.name,
      vehicleCategory: activeVehicle?.category,
      distanceKm: distance && distance > 0 ? distance : undefined,
      durationHours: searchState?.durationHours,
      estimatedFare: fare && fare > 0 ? fare : undefined,
      airportTransferType: searchState?.airportTransferType,
      fareCalculationId: calculationMetaRef.current.id,
      isFallback,
    };
  };

  // Action: User confirms and sends WhatsApp Enquiry
  const handleProceedToWhatsApp = () => {
    const payload = buildCurrentPayload(false);
    const message = buildWhatsAppBookingEnquiryMessage(payload);
    trackWhatsAppBookingEnquiry(payload);

    const whatsappUrl = getWhatsAppUrl(message, siteConfig.contact.whatsapp);
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
    setIsSummaryOpen(false);
  };

  // Action: Send Fallback Enquiry (if route or fare cannot be calculated, or user requests immediate help)
  const handleSendFallbackEnquiry = () => {
    const payload = buildCurrentPayload(true);
    const message = buildWhatsAppBookingEnquiryMessage(payload);
    trackWhatsAppBookingEnquiry(payload);

    const whatsappUrl = getWhatsAppUrl(message, siteConfig.contact.whatsapp);
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
    setValidationToast({ show: false, missingField: '', message: '' });
  };

  // Action: Edit Booking Details
  const handleEditBookingClick = () => {
    setIsSummaryOpen(false);
    if (onEditBooking) {
      onEditBooking();
    } else {
      const searchSection = document.getElementById('booking-search-section');
      if (searchSection) {
        searchSection.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  // Quick switch vehicle in modal
  const handleQuickSelectVehicle = (v: Vehicle) => {
    setModalVehicle(v);
    if (onSelectVehicle) {
      onSelectVehicle(v);
    }
  };

  // Trip type display label
  const tripTypeLabel = useMemo(() => {
    switch (searchState?.serviceType) {
      case 'oneway':
        return 'One Way';
      case 'roundtrip':
        return 'Round Trip';
      case 'airport':
        return `Airport Transfer (${searchState.airportTransferType === 'pickup' ? 'Pickup' : 'Drop'})`;
      case 'local':
        return `Local / Hourly (${searchState.durationHours || 8} Hrs)`;
      default:
        return 'One Way';
    }
  }, [searchState]);

  return (
    <>
      {/* 1. FLOATING WHATSAPP BUTTON (Fixed Bottom-Right, Circular, Desktop 48x48px / Mobile 44-46px) */}
      <div
        id="whatsapp-floating-enquiry-container"
        className="fixed bottom-20 right-4 sm:bottom-6 sm:right-6 z-40 select-none flex flex-col items-end pointer-events-auto"
      >
        {/* Hover Tooltip: WhatsApp TRAVEL JUST */}
        {showTooltip && !isSummaryOpen && (
          <div
            id="whatsapp-floating-tooltip"
            className="mb-2 bg-slate-950/95 backdrop-blur-xs text-white text-xs font-semibold px-3 py-1.5 rounded-xl shadow-2xl border border-slate-700 animate-in fade-in duration-150 flex items-center gap-2 whitespace-nowrap pointer-events-none"
          >
            <span className="w-2 h-2 rounded-full bg-[#25D366] shrink-0" />
            <span>WhatsApp TRAVEL JUST</span>
          </div>
        )}

        {/* The Small Circular Button */}
        <button
          id="whatsapp-floating-enquiry-btn"
          type="button"
          onClick={handleFloatingButtonClick}
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
          onFocus={() => setShowTooltip(true)}
          onBlur={() => setShowTooltip(false)}
          aria-label="Send booking enquiry to TRAVEL JUST on WhatsApp"
          className="relative w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-[#25D366] hover:bg-[#20bd5a] text-white shadow-xl hover:shadow-[#25D366]/40 hover:scale-105 active:scale-95 transition-all flex items-center justify-center border-2 border-white ring-3 ring-[#25D366]/30 focus:outline-none focus:ring-4 focus:ring-[#25D366]/60 cursor-pointer"
        >
          {/* Subtle pulsating aura */}
          <span className="absolute -inset-1 rounded-full bg-[#25D366]/40 blur-xs animate-ping pointer-events-none" />

          {/* Vector Car + WhatsApp Visual (No photograph, pure vector iconography) */}
          <div className="relative flex items-center justify-center">
            {/* SVG WhatsApp glyph combined with Vector Car */}
            <svg
              className="w-6 h-6 fill-white text-white drop-shadow-xs"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0 0 12.04 2m.01 1.67c2.2 0 4.26.86 5.82 2.42a8.225 8.225 0 0 1 2.41 5.83c0 4.54-3.7 8.24-8.24 8.24-1.48 0-2.93-.4-4.2-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.196 8.196 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.24-8.24m4.52 11.66c-.25-.13-1.47-.72-1.7-.81-.23-.08-.39-.13-.56.13-.17.25-.64.81-.79.97-.14.17-.29.19-.54.06-.25-.13-1.06-.39-2.03-1.25-.75-.67-1.26-1.5-1.41-1.75-.15-.25-.02-.39.11-.51.11-.11.25-.29.38-.44.13-.14.17-.25.25-.42.08-.17.04-.31-.02-.44-.06-.13-.56-1.35-.77-1.85-.2-.49-.41-.42-.56-.43h-.48c-.17 0-.44.06-.67.31-.23.25-.88.86-.88 2.1s.9 2.44 1.03 2.61c.13.17 1.77 2.7 4.29 3.79.6.26 1.07.41 1.44.53.6.19 1.15.16 1.59.1.48-.07 1.47-.6 1.68-1.18.21-.58.21-1.08.15-1.18-.07-.1-.23-.17-.48-.29" />
            </svg>
            <Car className="w-3 h-3 text-emerald-900 absolute top-1.5 left-1.5 pointer-events-none opacity-0" />
          </div>
        </button>
      </div>

      {/* 2. VALIDATION TOAST (Shown if customer clicks WhatsApp before required booking details are entered) */}
      {validationToast.show && (
        <div
          id="whatsapp-validation-toast"
          className="fixed bottom-20 right-5 sm:bottom-22 sm:right-6 z-50 max-w-sm w-[calc(100vw-40px)] bg-slate-900 text-white p-4 rounded-2xl shadow-2xl border border-amber-500/40 animate-in slide-in-from-bottom-3 duration-200"
          role="alert"
        >
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-amber-400 uppercase tracking-wide">
                  Required: {validationToast.missingField}
                </p>
                <button
                  type="button"
                  onClick={() => setValidationToast({ show: false, missingField: '', message: '' })}
                  className="text-slate-400 hover:text-white transition-colors"
                  aria-label="Dismiss notification"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="text-xs text-slate-200 mt-1 leading-snug">
                Please complete the required booking details before contacting TRAVEL JUST on WhatsApp.
              </p>

              <div className="mt-3 flex items-center gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={handleEditBookingClick}
                  className="text-xs font-bold text-emerald-400 hover:text-emerald-300 transition-colors flex items-center gap-1"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Fill Booking Form</span>
                </button>
                <span className="text-slate-600">·</span>
                <button
                  type="button"
                  onClick={handleSendFallbackEnquiry}
                  className="text-xs font-medium text-slate-300 hover:text-white transition-colors underline"
                >
                  Send quick enquiry anyway
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. ROUTE + FARE SUMMARY BEFORE WHATSAPP (Compact Confirmation Modal) */}
      {isSummaryOpen && (
        <div
          id="whatsapp-enquiry-modal-backdrop"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsSummaryOpen(false);
          }}
        >
          <div
            id="whatsapp-enquiry-modal"
            className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col"
            role="dialog"
            aria-modal="true"
            aria-labelledby="enquiry-modal-title"
          >
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-emerald-800 to-[#128C7E] text-white p-4 sm:p-5 flex items-center justify-between shadow-xs">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white/15 backdrop-blur-xs border border-white/20 flex items-center justify-center text-white shadow-inner">
                  <Car className="w-5 h-5" />
                </div>
                <div>
                  <h3 id="enquiry-modal-title" className="font-extrabold text-base leading-tight">
                    Your Enquiry
                  </h3>
                  <span className="text-xs text-emerald-100 font-medium">
                    TRAVEL JUST WhatsApp Booking Desk
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsSummaryOpen(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors focus:outline-none"
                aria-label="Close Enquiry Dialog"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body: Compact Key-Value Booking Summary */}
            <div className="p-5 space-y-4 text-xs text-slate-800 max-h-[75vh] overflow-y-auto">
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2.5">
                {/* Trip */}
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-medium">Trip:</span>
                  <span className="font-bold text-slate-900 bg-white px-2 py-0.5 rounded-md border border-slate-200">
                    {tripTypeLabel}
                  </span>
                </div>

                {/* From */}
                <div className="flex justify-between items-start gap-3 pt-1 border-t border-slate-100">
                  <span className="text-slate-500 font-medium shrink-0">From:</span>
                  <span className="font-bold text-slate-900 text-right leading-snug">
                    {searchState?.pickupLocation || 'Mysuru'}
                  </span>
                </div>

                {/* To */}
                {searchState?.serviceType !== 'local' && (
                  <div className="flex justify-between items-start gap-3 pt-1 border-t border-slate-100">
                    <span className="text-slate-500 font-medium shrink-0">To:</span>
                    <span className="font-bold text-slate-900 text-right leading-snug">
                      {searchState?.dropLocation || 'Destination'}
                    </span>
                  </div>
                )}

                {/* Date */}
                <div className="flex justify-between items-center pt-1 border-t border-slate-100">
                  <span className="text-slate-500 font-medium">
                    {searchState?.serviceType === 'roundtrip' ? 'Pickup Date:' : 'Date:'}
                  </span>
                  <span className="font-bold text-slate-900">
                    {formatDisplayDate(searchState?.travelDate || searchState?.pickupDate)}
                  </span>
                </div>

                {/* Time */}
                <div className="flex justify-between items-center pt-1 border-t border-slate-100">
                  <span className="text-slate-500 font-medium">
                    {searchState?.serviceType === 'roundtrip' ? 'Pickup Time:' : 'Time:'}
                  </span>
                  <span className="font-bold text-slate-900">
                    {searchState?.pickupTime || '07:00 AM'}
                  </span>
                </div>

                {/* Round Trip Return Details */}
                {searchState?.serviceType === 'roundtrip' && (
                  <>
                    {(searchState.returnDate || searchState.dropDate) && (
                      <div className="flex justify-between items-center pt-1 border-t border-slate-100">
                        <span className="text-slate-500 font-medium">Return Date:</span>
                        <span className="font-bold text-slate-900">
                          {formatDisplayDate(searchState.returnDate || searchState.dropDate)}
                        </span>
                      </div>
                    )}
                    {searchState.returnTime && (
                      <div className="flex justify-between items-center pt-1 border-t border-slate-100">
                        <span className="text-slate-500 font-medium">Return Time:</span>
                        <span className="font-bold text-slate-900">
                          {searchState.returnTime}
                        </span>
                      </div>
                    )}
                  </>
                )}

                {/* Passengers */}
                {searchState?.passengers ? (
                  <div className="flex justify-between items-center pt-1 border-t border-slate-100">
                    <span className="text-slate-500 font-medium">Passengers:</span>
                    <span className="font-bold text-slate-900">
                      {searchState.passengers}
                    </span>
                  </div>
                ) : null}

                {/* Distance (Calculated from Google Maps) */}
                {searchState?.routeInfo?.distanceKm ? (
                  <div className="flex justify-between items-center pt-1 border-t border-slate-100">
                    <span className="text-slate-500 font-medium">Distance:</span>
                    <span className="font-bold text-slate-900">
                      {searchState.routeInfo.distanceKm.toFixed(1)} km
                    </span>
                  </div>
                ) : null}

                {/* Vehicle */}
                <div className="flex justify-between items-center pt-1 border-t border-slate-100">
                  <span className="text-slate-500 font-medium">Vehicle:</span>
                  <span className="font-bold text-slate-900">
                    {modalVehicle ? `${modalVehicle.name} (${modalVehicle.category})` : 'To be suggested'}
                  </span>
                </div>

                {/* Estimated Fare (Calculated strictly by TRAVEL JUST Live Fare Engine) */}
                <div className="flex justify-between items-baseline pt-2 border-t border-slate-200">
                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-700 font-bold">Estimated Fare:</span>
                    {currentFareEstimate?.discountPercentage && (
                      <span className="text-[10px] font-extrabold text-emerald-800 bg-emerald-100 border border-emerald-300 px-1.5 py-0.5 rounded leading-none">
                        {currentFareEstimate.discountPercentage}% OFF
                      </span>
                    )}
                  </div>
                  <div className="text-right">
                    <span className="text-base font-extrabold text-emerald-800">
                      {currentFareEstimate && currentFareEstimate.totalEstimatedFare > 0
                        ? `₹${currentFareEstimate.totalEstimatedFare.toLocaleString('en-IN')}`
                        : 'To be confirmed'}
                    </span>
                    {currentFareEstimate?.originalFare && (
                      <span className="text-xs text-slate-400 line-through block font-medium">
                        ₹{currentFareEstimate.originalFare.toLocaleString('en-IN')}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Quick Vehicle Switcher if customer hasn't selected a vehicle or wants to compare */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                  Select / Change Vehicle:
                </span>
                <div className="grid grid-cols-2 gap-1.5">
                  {vehiclesData.slice(0, 6).map((veh) => {
                    const isPicked = modalVehicle?.id === veh.id;
                    return (
                      <button
                        key={veh.id}
                        type="button"
                        onClick={() => handleQuickSelectVehicle(veh)}
                        className={`text-left p-2 rounded-xl border text-xs font-semibold transition-all flex items-center justify-between ${
                          isPicked
                            ? 'bg-emerald-50 border-emerald-600 text-emerald-950 ring-1 ring-emerald-600'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <span className="truncate">{veh.name}</span>
                        {isPicked && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Informational Disclaimer (Section 25: No Auto-confirm) */}
              <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-3 text-[11px] text-amber-900 leading-relaxed flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <span>
                  Clicking <strong>WhatsApp Enquiry</strong> opens WhatsApp with your journey details pre-filled. TRAVEL JUST staff will review vehicle availability and confirm the final fare.
                </span>
              </div>
            </div>

            {/* Modal Actions (Small Buttons: WhatsApp Enquiry and Edit Booking) */}
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={handleEditBookingClick}
                className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-white hover:border-slate-400 font-bold text-xs transition-colors cursor-pointer"
              >
                Edit Booking
              </button>

              <button
                type="button"
                onClick={handleProceedToWhatsApp}
                className="px-5 py-2.5 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-white font-extrabold text-xs shadow-md transition-all active:scale-98 flex items-center gap-2 cursor-pointer"
              >
                <MessageSquare className="w-4 h-4" />
                <span>WhatsApp Enquiry</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
