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
  Navigation,
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
import { FARE_DISCLAIMER } from '../config/pricingConfig';
import { saveBookingToFirestore } from '../lib/firebase';
import { RidePushSubscriptionCard } from './RidePushSubscriptionCard';
import { createGoogleCalendarTripEvent } from '../services/googleCalendarService';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  searchDetails: BookingSearchState;
  selectedVehicle: Vehicle;
  pricingConfig: PricingConfig;
  onCompleteBooking: (booking: BookingRequest) => void;
  customer?: CustomerUser | null;
  onOpenTrackBooking?: (referenceId: string) => void;
  selectedAddOns?: import('../types').SelectedAddOn[];
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
  onOpenTrackBooking,
  selectedAddOns = [],
}) => {
  const [bookingRef, setBookingRef] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [isAddingToCalendar, setIsAddingToCalendar] = useState(false);
  const [calendarSynced, setCalendarSynced] = useState(false);
  const [calendarLink, setCalendarLink] = useState<string | null>(null);
  const [calendarError, setCalendarError] = useState<string | null>(null);

  // Calculate fare estimate based on search details, selected vehicle, and selected dynamic amenities
  const baseFareEstimate = calculateFare(searchDetails, selectedVehicle, pricingConfig);
  const addOnsTotal = selectedAddOns.reduce((sum, item) => sum + item.totalPrice, 0);
  const fareEstimate = addOnsTotal > 0 ? {
    ...baseFareEstimate,
    totalEstimatedFare: baseFareEstimate.totalEstimatedFare + addOnsTotal,
    breakdown: [
      ...baseFareEstimate.breakdown,
      { label: `Selected Add-ons & Amenities (${selectedAddOns.length})`, amount: addOnsTotal },
    ],
  } : baseFareEstimate;

  const passengerDetails: PassengerDetails = {
    fullName: customer?.fullName || 'Customer',
    mobileNumber: customer?.mobileNumber || '',
    email: customer?.email || '',
    specialInstructions: '',
  };

  const hasInitializedRef = useRef(false);

  useEffect(() => {
    if (!isOpen) {
      hasInitializedRef.current = false;
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
        selectedAddOns: selectedAddOns,
        addOnsTotal: addOnsTotal,
      };

      // Sync to backend booking registry
      fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newBooking),
      }).catch((err) => console.warn('Booking registry save error:', err));

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
    }
  }, [isOpen, customer, searchDetails, selectedVehicle, selectedAddOns]);

  const handleAddToGoogleCalendar = async () => {
    if (!bookingRef) return;
    setIsAddingToCalendar(true);
    setCalendarError(null);

    try {
      const travelDateStr = searchDetails.pickupDate || searchDetails.travelDate || new Date().toISOString().split('T')[0];
      const timeStr = searchDetails.pickupTime || '07:00 AM';

      // Parse time into hours and minutes
      let hours = 7;
      let minutes = 0;
      const timeMatch = timeStr.match(/(\d+):(\d+)\s*(AM|PM)?/i);
      if (timeMatch) {
        hours = parseInt(timeMatch[1], 10);
        minutes = parseInt(timeMatch[2], 10);
        const meridiem = (timeMatch[3] || '').toUpperCase();
        if (meridiem === 'PM' && hours < 12) hours += 12;
        if (meridiem === 'AM' && hours === 12) hours = 0;
      }

      const pad = (n: number) => String(n).padStart(2, '0');
      const startIso = `${travelDateStr}T${pad(hours)}:${pad(minutes)}:00`;

      // End time (duration from routeInfo or default 3 hours)
      const durationHours = searchDetails.routeInfo?.durationMinutes
        ? Math.max(1, Math.ceil(searchDetails.routeInfo.durationMinutes / 60))
        : searchDetails.durationHours || 3;
      const endHours = (hours + durationHours) % 24;
      const endIso = `${travelDateStr}T${pad(endHours)}:${pad(minutes)}:00`;

      const amenitiesText =
        selectedAddOns && selectedAddOns.length > 0
          ? `\nRequested Amenities & Add-ons:\n${selectedAddOns
              .map(
                (a) =>
                  `• ${a.quantity > 1 ? `${a.quantity}x ` : ''}${a.name} (${
                    a.totalPrice === 0 ? 'Complimentary' : `₹${a.totalPrice}`
                  })`
              )
              .join('\n')}`
          : '';

      const summary = `TRAVEL JUST Cab: ${searchDetails.pickupLocation} → ${searchDetails.dropLocation || 'Local Package'} (#${bookingRef})`;
      const description = `Trip Type: ${searchDetails.serviceType.toUpperCase()}\nVehicle: ${selectedVehicle.name}\nEstimated Fare: ₹${fareEstimate.totalEstimatedFare}\nCustomer: ${passengerDetails.fullName} (${passengerDetails.mobileNumber})${amenitiesText}`;
      const location = `${searchDetails.pickupLocation}, Mysuru / Karnataka`;

      const result = await createGoogleCalendarTripEvent({
        summary,
        description,
        location,
        startDateTime: startIso,
        endDateTime: endIso,
        attendees: passengerDetails.email ? [passengerDetails.email] : undefined,
        referenceId: bookingRef,
      });

      setCalendarSynced(true);
      if (result.htmlLink) {
        setCalendarLink(result.htmlLink);
      }
    } catch (err: any) {
      console.warn('Google Calendar event creation error:', err);
      setCalendarError(err?.message || 'Could not add event to Google Calendar. Please check calendar permissions.');
    } finally {
      setIsAddingToCalendar(false);
    }
  };

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
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              Booking Confirmed
            </div>
            <h3 className="text-lg sm:text-xl font-bold">
              Booking Request Received
            </h3>
            <p className="text-xs text-emerald-200 mt-0.5">
              Your ride details have been securely recorded in our dispatch system
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
          {/* Booking Confirmation Alert */}
          <div className="flex items-start gap-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl p-4">
            <div className="w-11 h-11 rounded-xl bg-emerald-800 text-white flex items-center justify-center shrink-0 shadow-xs mt-0.5">
              <CheckCircle2 className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div className="space-y-0.5 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h4 className="font-extrabold text-base text-emerald-950 leading-tight">
                  Booking Confirmed
                </h4>
                <span className="px-2 py-0.5 bg-emerald-700 text-white text-[10px] font-bold rounded-full uppercase tracking-wider">
                  Verified
                </span>
              </div>
              <p className="text-xs text-emerald-800 leading-relaxed">
                Thank you, <strong>{passengerDetails.fullName || 'Valued Customer'}</strong>. Your trip reservation has been confirmed. Our fleet dispatch desk will assign your verified chauffeur and vehicle prior to scheduled departure.
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
            <div className="flex items-center gap-2 flex-wrap justify-center sm:justify-end">
              <button
                type="button"
                onClick={handleCopyRef}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors shadow-2xs cursor-pointer"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-slate-500" />}
                <span>{copied ? 'Copied!' : 'Copy Reference ID'}</span>
              </button>

              <button
                type="button"
                onClick={handleAddToGoogleCalendar}
                disabled={isAddingToCalendar || calendarSynced}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-2xs cursor-pointer ${
                  calendarSynced
                    ? 'bg-emerald-50 border border-emerald-300 text-emerald-800'
                    : 'bg-white border border-slate-300 hover:bg-slate-100 text-slate-800'
                }`}
              >
                {isAddingToCalendar ? (
                  <span className="w-3.5 h-3.5 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                ) : calendarSynced ? (
                  <Check className="w-4 h-4 text-emerald-600" />
                ) : (
                  <Calendar className="w-4 h-4 text-blue-600" />
                )}
                <span>{calendarSynced ? 'Added to Google Calendar' : 'Add to Google Calendar'}</span>
              </button>
            </div>
          </div>

          {calendarLink && (
            <div className="p-3 bg-blue-50/80 border border-blue-200 rounded-xl flex items-center justify-between text-xs text-blue-900">
              <span className="flex items-center gap-1.5 font-medium">
                <Calendar className="w-4 h-4 text-blue-600 shrink-0" />
                Trip synced to your Google Calendar with 2-hour departure alerts!
              </span>
              <a
                href={calendarLink}
                target="_blank"
                rel="noreferrer"
                className="font-bold text-blue-700 hover:underline inline-flex items-center gap-1 shrink-0 ml-2"
              >
                <span>Open Event</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          )}

          {calendarError && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start gap-2">
              <span className="font-bold">Calendar Notice:</span>
              <span>{calendarError}</span>
            </div>
          )}

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

            {/* Selected Add-on Services & Amenities Strip */}
            {selectedAddOns && selectedAddOns.length > 0 && (
              <div className="bg-emerald-50/90 border border-emerald-200 rounded-xl p-3 text-xs space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-emerald-950 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                    <span>Requested Amenities & Add-ons</span>
                    <span className="px-1.5 py-0.2 rounded-md bg-emerald-200 text-emerald-900 text-[10px]">
                      {selectedAddOns.length}
                    </span>
                  </span>
                  <span className="text-[11px] font-black text-emerald-900">
                    {addOnsTotal === 0 ? 'Complimentary' : `+₹${addOnsTotal.toLocaleString('en-IN')}`}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  {selectedAddOns.map((addon) => (
                    <span
                      key={addon.addOnId}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-emerald-200 text-slate-800 font-bold text-[11px] shadow-2xs"
                    >
                      <Check className="w-3 h-3 text-emerald-600 stroke-[3]" />
                      <span>
                        {addon.quantity > 1 ? `${addon.quantity}x ` : ''}
                        {addon.shortLabel || addon.name}
                      </span>
                      <span className="text-[10px] text-slate-500 font-semibold">
                        ({addon.totalPrice === 0 ? 'Free' : `₹${addon.totalPrice}`})
                      </span>
                    </span>
                  ))}
                </div>
              </div>
            )}

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

            {/* Configurable Pricing Disclaimer */}
            <div className="p-3 bg-amber-50/90 border border-amber-200 rounded-xl text-[11px] text-amber-900 flex items-start gap-2 leading-relaxed">
              <span className="font-bold text-amber-700 uppercase tracking-wider shrink-0">* NOTE:</span>
              <span>{fareEstimate.disclaimer || FARE_DISCLAIMER}</span>
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
              <p>4. Chauffeur and vehicle details will be assigned before scheduled pickup.</p>
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

          <div className="w-full sm:w-auto flex flex-wrap items-center gap-2 justify-end">
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenTrackBooking?.(bookingRef);
              }}
              className="w-full sm:w-auto bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
            >
              <Navigation className="w-3.5 h-3.5 text-emerald-300" />
              <span>Track Live Ride</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-6 py-2.5 rounded-xl shadow-xs transition-all cursor-pointer"
            >
              Done / Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
