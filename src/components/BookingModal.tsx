import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  CheckCircle2,
  Copy,
  Check,
  Calendar,
  Clock,
  MapPin,
  Car,
  ExternalLink,
  Phone,
  MessageSquare,
} from 'lucide-react';
import {
  BookingSearchState,
  Vehicle,
  PricingConfig,
  PassengerDetails,
  BookingRequest,
  CustomerUser,
} from '../types';
import { calculateFare } from '../utils/fareCalculator';
import { siteConfig } from '../config/siteConfig';
import { saveBookingToSupabase, SaveBookingResult } from '../services/supabaseService';
import { saveBookingToFirestore } from '../lib/firebase';
import { formatBookingConfirmationMessage, openWhatsAppChat } from '../utils/whatsapp';
import { RidePushSubscriptionCard } from './RidePushSubscriptionCard';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  searchDetails: BookingSearchState;
  selectedVehicle: Vehicle;
  pricingConfig: PricingConfig;
  onCompleteBooking: (booking: BookingRequest) => void;
  customer?: CustomerUser | null;
}

// Helper to convert date to "Fri, Sep 25" display format matching screenshots
const formatDateDisplay = (isoDate?: string): string => {
  if (!isoDate) return '';
  const parts = isoDate.split('-');
  if (parts.length === 3) {
    const year = parseInt(parts[0], 10);
    const monthIndex = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    const dateObj = new Date(year, monthIndex, day);
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const dayOfWeek = dayNames[dateObj.getDay()];
    const monthName = monthNames[monthIndex] || parts[1];
    return `${dayOfWeek}, ${monthName} ${day}`;
  }
  return isoDate;
};

export const BookingModal: React.FC<BookingModalProps> = ({
  isOpen,
  onClose,
  searchDetails,
  selectedVehicle,
  pricingConfig,
  onCompleteBooking,
  customer = null,
}) => {
  const [bookingRef, setBookingRef] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [autoWhatsAppSent, setAutoWhatsAppSent] = useState(false);
  const [, setDbSaveResult] = useState<SaveBookingResult | null>(null);

  // Calculate fare estimate based on search details and selected vehicle
  const fareEstimate = calculateFare(searchDetails, selectedVehicle, pricingConfig);

  const passengerDetails: PassengerDetails = {
    fullName: customer?.fullName || 'Customer',
    mobileNumber: customer?.mobileNumber || '',
    email: customer?.email || '',
    specialInstructions: '',
  };

  // Direct Booking Initialization & Instant Dispatch to Fleet Manager & Customer WhatsApp
  const hasInitializedRef = useRef(false);

  const handleSendWhatsAppConfirmation = (ref: string = bookingRef) => {
    const message = formatBookingConfirmationMessage({
      referenceId: ref || bookingRef,
      searchDetails,
      selectedVehicle,
      passengerDetails,
      estimatedFare: fareEstimate,
    });
    openWhatsAppChat(message);
    setAutoWhatsAppSent(true);
  };

  useEffect(() => {
    if (!isOpen) {
      hasInitializedRef.current = false;
      setAutoWhatsAppSent(false);
      return;
    }

    if (!hasInitializedRef.current) {
      hasInitializedRef.current = true;
      const randomNum = Math.floor(10000 + Math.random() * 90000);
      const refId = `TJ-${randomNum}`;
      setBookingRef(refId);

      const newBooking: BookingRequest = {
        referenceId: refId,
        searchDetails,
        selectedVehicle,
        passengerDetails,
        estimatedFare: fareEstimate,
        createdAt: new Date().toISOString(),
        status: 'Pending Confirmation',
        fare_snapshot: fareEstimate.fareSnapshot,
        pricing_version: fareEstimate.pricingVersion,
      };

      // Save directly to Supabase and inform parent registry
      saveBookingToSupabase(newBooking)
        .then((res) => setDbSaveResult(res))
        .catch((err) => console.warn('Booking save error:', err));

      // Persist to Cloud Firestore
      saveBookingToFirestore({
        id: refId,
        userId: customer?.id,
        customerName: passengerDetails.fullName,
        customerPhone: passengerDetails.mobileNumber,
        customerEmail: passengerDetails.email || undefined,
        tripType: searchDetails.serviceType,
        pickupLocation: searchDetails.pickupLocation,
        dropLocation: searchDetails.dropLocation,
        pickupDate: searchDetails.pickupDate,
        pickupTime: searchDetails.pickupTime,
        vehicleType: selectedVehicle.id,
        estimatedFare: fareEstimate.totalEstimatedFare,
        distanceKm: fareEstimate.exactDistanceKm || searchDetails.routeInfo?.distanceKm,
        status: 'PENDING',
        createdAt: new Date().toISOString(),
      }).catch((err) => console.warn('Firestore booking save error:', err));

      onCompleteBooking(newBooking);

      // Instantly dispatch booking request notification to Fleet Manager & Customer via WhatsApp
      handleSendWhatsAppConfirmation(refId);
    }
  }, [isOpen, customer, searchDetails, selectedVehicle]);

  const handleCopyRef = () => {
    if (!bookingRef) return;
    navigator.clipboard.writeText(bookingRef);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) return null;

  const distanceKmVal = fareEstimate.exactDistanceKm || searchDetails.routeInfo?.distanceKm;
  const distanceStr = distanceKmVal
    ? `${Math.round(distanceKmVal)} KM`
    : searchDetails.routeInfo?.distanceKm
    ? `${Math.round(searchDetails.routeInfo.distanceKm)} KM`
    : 'As per route';
  const durationStr =
    searchDetails.routeInfo?.durationText ||
    (searchDetails.routeInfo?.durationMinutes
      ? `${Math.floor(searchDetails.routeInfo.durationMinutes / 60)}h ${
          searchDetails.routeInfo.durationMinutes % 60
        }m`
      : '~3 hrs');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-2xl my-8 overflow-hidden relative text-slate-900 flex flex-col max-h-[90vh]">
        {/* Div 1: Header */}
        <div className="bg-emerald-900 text-white p-5 sm:p-6 flex items-center justify-between shrink-0">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-800 border border-emerald-700/80 text-[10px] font-bold text-emerald-200 uppercase tracking-wider mb-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Direct Fleet Dispatch
            </div>
            <h3 className="text-lg sm:text-xl font-bold">
              Booking Request Sent to Fleet Manager
            </h3>
            <p className="text-xs text-emerald-200 mt-0.5">
              Booking Request Received notification dispatched automatically via WhatsApp instantly
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-full transition-colors cursor-pointer"
            aria-label="Close dialog"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Div 2: Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4 flex-1">
          {/* Instant Dispatch Status Alert */}
          <div className="flex items-start gap-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl p-4">
            <div className="w-11 h-11 rounded-xl bg-emerald-800 text-white flex items-center justify-center shrink-0 shadow-xs mt-0.5">
              <CheckCircle2 className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div className="space-y-0.5 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h4 className="font-extrabold text-base text-emerald-950 leading-tight">
                  Booking Request Sent to Fleet Manager
                </h4>
                <span className="px-2 py-0.5 bg-emerald-700 text-white text-[10px] font-bold rounded-full uppercase tracking-wider">
                  Instant Dispatch
                </span>
              </div>
              <p className="text-xs text-emerald-800 leading-relaxed">
                Your ride details have been received and a <strong>Booking Request Received</strong> notification has been automatically dispatched via WhatsApp.
              </p>
            </div>
          </div>

          {/* Booking Reference Card */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                Booking Reference ID
              </span>
              <span className="text-2xl font-black text-slate-900 tracking-wider font-mono">
                {bookingRef}
              </span>
            </div>
            <button
              type="button"
              onClick={handleCopyRef}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors shadow-2xs cursor-pointer"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-slate-500" />}
              <span>{copied ? 'Copied to Clipboard!' : 'Copy Reference ID'}</span>
            </button>
          </div>

          {/* Instant WhatsApp Notification Confirmation Card */}
          <div className="bg-gradient-to-br from-emerald-50 via-white to-emerald-50/60 border-2 border-[#25D366]/60 rounded-2xl p-4 sm:p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#25D366] text-white flex items-center justify-center shadow-xs shrink-0">
                  <MessageSquare className="w-5 h-5 stroke-[2.2]" />
                </div>
                <div>
                  <span className="text-sm font-extrabold text-slate-900 block leading-tight">
                    Fleet Manager WhatsApp Desk
                  </span>
                  <span className="text-[11px] text-emerald-800 font-semibold block">
                    {siteConfig.contact.whatsapp} • Instant Confirmation Slip
                  </span>
                </div>
              </div>

              <span className="text-[11px] bg-[#25D366] text-white font-bold px-2.5 py-1 rounded-full shadow-xs flex items-center gap-1">
                <Check className="w-3.5 h-3.5" /> Dispatched
              </span>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              The booking request slip has been generated and transmitted directly to our Fleet Manager. You can open WhatsApp to chat with the dispatch team anytime.
            </p>

            <button
              type="button"
              onClick={() => handleSendWhatsAppConfirmation()}
              className="w-full bg-[#25D366] hover:bg-[#20bd5a] active:scale-[0.99] text-white font-extrabold text-sm py-3 px-4 rounded-xl shadow-md hover:shadow-[#25D366]/30 flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <MessageSquare className="w-4 h-4" />
              <span>{autoWhatsAppSent ? 'Re-open WhatsApp Chat with Fleet Manager' : 'Open WhatsApp Chat with Fleet Manager'}</span>
              <ExternalLink className="w-4 h-4" />
            </button>
          </div>

          {/* Live Push Notification Subscription for Ride Status */}
          {bookingRef && (
            <RidePushSubscriptionCard
              referenceId={bookingRef}
              customerPhone={passengerDetails.mobileNumber}
              customerEmail={passengerDetails.email}
            />
          )}

          {/* Ride & Trip Summary Card */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs space-y-3.5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Car className="w-4 h-4 text-emerald-800" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Confirmed Ride Details
                </span>
              </div>
              <span className="text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-900 uppercase">
                {searchDetails.serviceType}
              </span>
            </div>

            {/* Route & Schedule */}
            <div className="space-y-2 text-xs">
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <span className="text-slate-500 text-[11px] block">Pickup Location:</span>
                  <span className="font-bold text-slate-900 text-sm">
                    {searchDetails.pickupLocation || 'Mysuru'}
                  </span>
                </div>
              </div>

              {((searchDetails.viaLocations && searchDetails.viaLocations.length > 0) ||
                (searchDetails.stops && searchDetails.stops.length > 0)) && (
                <div className="pl-6 text-[11px] text-slate-600 space-y-1">
                  <span className="font-semibold text-slate-500">Via Stops:</span>
                  {(searchDetails.viaLocations || []).map((st, idx) => (
                    <div key={`via-${idx}`} className="flex items-center gap-1 text-slate-700 font-medium">
                      <span>•</span>
                      <span>{st}</span>
                    </div>
                  ))}
                  {(searchDetails.stops || []).map((st, idx) => (
                    <div key={`stop-${idx}`} className="flex items-center gap-1 text-slate-700 font-medium">
                      <span>•</span>
                      <span>{typeof st === 'string' ? st : st.location}</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <span className="text-slate-500 text-[11px] block">Drop Location:</span>
                  <span className="font-bold text-slate-900 text-sm">
                    {searchDetails.dropLocation ||
                      (searchDetails.serviceType === 'local'
                        ? 'Local City Coverage'
                        : 'Bengaluru Airport')}
                  </span>
                </div>
              </div>
            </div>

            {/* Date, Time, Distance & Vehicle Info Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-2 border-t border-slate-100 text-xs">
              <div className="bg-slate-50 p-2.5 rounded-xl">
                <span className="text-slate-500 text-[10px] block font-semibold uppercase">
                  Pickup Schedule
                </span>
                <span className="font-bold text-slate-900 block mt-0.5">
                  {formatDateDisplay(searchDetails.pickupDate || searchDetails.travelDate)}
                </span>
                <span className="text-slate-600 text-[11px] font-medium">
                  {searchDetails.pickupTime || '7:00 AM'}
                </span>
              </div>

              {searchDetails.serviceType === 'roundtrip' && (
                <div className="bg-slate-50 p-2.5 rounded-xl">
                  <span className="text-slate-500 text-[10px] block font-semibold uppercase">
                    Return Schedule
                  </span>
                  <span className="font-bold text-slate-900 block mt-0.5">
                    {formatDateDisplay(
                      searchDetails.dropDate ||
                        searchDetails.returnDate ||
                        searchDetails.pickupDate
                    )}
                  </span>
                  <span className="text-slate-600 text-[11px] font-medium">
                    {searchDetails.returnTime || searchDetails.pickupTime || '9:00 PM'}
                  </span>
                </div>
              )}

              <div className="bg-slate-50 p-2.5 rounded-xl">
                <span className="text-slate-500 text-[10px] block font-semibold uppercase">
                  Est. Distance & Time
                </span>
                <span className="font-bold text-slate-900 block mt-0.5">
                  {distanceStr}
                </span>
                <span className="text-slate-600 text-[11px] font-medium">
                  {durationStr}
                </span>
              </div>

              <div className="bg-slate-50 p-2.5 rounded-xl col-span-2 sm:col-span-1">
                <span className="text-slate-500 text-[10px] block font-semibold uppercase">
                  Selected Vehicle
                </span>
                <span className="font-bold text-slate-900 block mt-0.5">
                  {selectedVehicle.name}
                </span>
                <span className="text-slate-600 text-[11px] font-medium">
                  {selectedVehicle.category} • {selectedVehicle.seatingCapacity} Seater
                </span>
              </div>
            </div>

            {/* Estimated Fare Display */}
            <div className="bg-slate-900 text-white p-3.5 sm:p-4 rounded-xl flex items-center justify-between">
              <div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 block">
                    Total Estimated Fare
                  </span>
                  {fareEstimate.discountPercentage && (
                    <span className="text-[10px] font-extrabold bg-emerald-400 text-slate-950 px-1.5 py-0.2 rounded font-mono leading-none">
                      {fareEstimate.discountPercentage}% OFF
                    </span>
                  )}
                </div>
                <div className="flex items-baseline gap-2 mt-0.5">
                  <span className="text-2xl font-black text-white">
                    ₹{fareEstimate.totalEstimatedFare}
                  </span>
                  {fareEstimate.originalFare && (
                    <span className="text-sm text-slate-400 line-through font-semibold">
                      ₹{fareEstimate.originalFare}
                    </span>
                  )}
                </div>
                {fareEstimate.discountAmount && fareEstimate.discountAmount > 0 && (
                  <span className="text-[10px] text-emerald-300 font-semibold block mt-0.5">
                    Saved ₹{fareEstimate.discountAmount} (15% Package Discount)
                  </span>
                )}
              </div>
              <div className="text-right text-[11px] text-slate-300 space-y-0.5">
                <span className="block font-semibold text-emerald-200">
                  {searchDetails.serviceType === 'local'
                    ? `${(searchDetails.durationHours || 8) * 10} KM Included`
                    : 'Driver & Fuel Included'}
                </span>
                <span className="text-[10px] text-slate-400 block">
                  Tolls/parking as per actual slips
                </span>
              </div>
            </div>
          </div>

          {/* Next Steps & Support Hotline */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-600 space-y-2">
            <p className="font-bold text-slate-800 text-xs uppercase tracking-wider">
              Confirmed Booking Status
            </p>
            <div className="space-y-1.5 text-slate-700 leading-relaxed">
              <p>1. Booking Request Received</p>
              <p>2. Booking Reference ID: <strong className="font-mono text-slate-900">{bookingRef}</strong></p>
              <p>3. Booking Details Confirmed</p>
              <p>4. You receive Chauffeur Details & Cab details on WhatsApp.</p>
              <p>5. Cab arrives at your pickup point at scheduled time.</p>
            </div>
            <div className="pt-2 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2 text-[11px]">
              <span className="text-slate-500">24x7 Fleet Hotline:</span>
              <a
                href="tel:+919740754400"
                className="font-bold text-emerald-900 hover:underline flex items-center gap-1"
              >
                <Phone className="w-3 h-3 text-emerald-700" />
                <span>Call Fleet Desk: +919740754400</span>
              </a>
            </div>
          </div>
        </div>

        {/* Div 3: Footer Actions */}
        <div className="bg-slate-50 p-4 px-6 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <a
            href="tel:+919740754400"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 text-xs font-bold text-slate-700 hover:text-slate-900 py-2"
          >
            <Phone className="w-4 h-4 text-emerald-800" />
            <span>Call Fleet Desk: +919740754400</span>
          </a>

          <div className="w-full sm:w-auto flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleSendWhatsAppConfirmation()}
              className="w-full sm:w-auto bg-[#25D366] hover:bg-[#20bd5a] text-white font-extrabold text-xs px-5 py-2.5 rounded-xl shadow-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              <MessageSquare className="w-4 h-4" />
              <span>WhatsApp Slip</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-xs transition-all cursor-pointer"
            >
              Done / Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
