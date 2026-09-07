import React, { useState } from 'react';
import {
  X,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  User,
  Phone,
  Mail,
  Users,
  MessageSquare,
  Copy,
  Check,
  ShieldCheck,
  Calendar,
  Clock,
  MapPin,
  Car,
  AlertCircle,
  FileText,
  Database,
  Loader2,
  Navigation,
  Send,
  ExternalLink,
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
import { formatBookingConfirmationMessage, openWhatsAppChat } from '../utils/whatsapp';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  searchDetails: BookingSearchState;
  selectedVehicle: Vehicle;
  pricingConfig: PricingConfig;
  onCompleteBooking: (booking: BookingRequest) => void;
  customer?: CustomerUser | null;
  onOpenCustomerLogin?: () => void;
}

export const BookingModal: React.FC<BookingModalProps> = ({
  isOpen,
  onClose,
  searchDetails,
  selectedVehicle,
  pricingConfig,
  onCompleteBooking,
  customer = null,
  onOpenCustomerLogin,
}) => {
  const [step, setStep] = useState<3 | 4 | 5>(3); // Step 3: Passenger Details, Step 4: Review, Step 5: Confirmation

  const [passengerDetails, setPassengerDetails] = useState<PassengerDetails>({
    fullName: customer?.fullName || '',
    mobileNumber: customer?.mobileNumber || '',
    email: customer?.email || '',
    passengersCount: searchDetails.passengers || 2,
    specialInstructions: '',
  });

  // Sync customer details when customer signs in or modal opens
  React.useEffect(() => {
    if (customer) {
      setPassengerDetails((prev) => ({
        ...prev,
        fullName: prev.fullName || customer.fullName,
        mobileNumber: prev.mobileNumber || customer.mobileNumber,
        email: prev.email || customer.email || '',
      }));
    }
  }, [customer]);

  const [pickupDate, setPickupDate] = useState<string>(
    searchDetails.pickupDate || searchDetails.travelDate || new Date().toISOString().split('T')[0]
  );
  const [pickupTime, setPickupTime] = useState<string>(
    searchDetails.pickupTime || '09:00'
  );
  const [dropDate, setDropDate] = useState<string>(
    searchDetails.dropDate || searchDetails.returnDate || searchDetails.pickupDate || searchDetails.travelDate || new Date().toISOString().split('T')[0]
  );

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [bookingRef, setBookingRef] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dbSaveResult, setDbSaveResult] = useState<SaveBookingResult | null>(null);
  const [autoWhatsAppSent, setAutoWhatsAppSent] = useState(false);
  const [autoDispatchCountdown, setAutoDispatchCountdown] = useState<number | null>(null);

  if (!isOpen) return null;

  const currentSearchDetails: BookingSearchState = {
    ...searchDetails,
    travelDate: pickupDate,
    pickupDate: pickupDate,
    pickupTime: pickupTime,
    dropDate: dropDate,
    returnDate: dropDate,
  };

  const fareEstimate = calculateFare(currentSearchDetails, selectedVehicle, pricingConfig);

  const validatePassengerDetails = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!passengerDetails.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    }

    if (!passengerDetails.mobileNumber.trim()) {
      newErrors.mobileNumber = 'Mobile number is required for booking confirmation';
    } else if (passengerDetails.mobileNumber.trim().length < 7) {
      newErrors.mobileNumber = 'Please enter a valid phone number';
    }

    if (!pickupDate) {
      newErrors.pickupDate = 'Pickup date is required';
    }

    if (!pickupTime) {
      newErrors.pickupTime = 'Pickup time is required';
    }

    if (searchDetails.serviceType === 'roundtrip' && !dropDate) {
      newErrors.dropDate = 'Drop / Return date is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNextToReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (validatePassengerDetails()) {
      setStep(4);
    }
  };

  const handleSendWhatsAppConfirmation = (ref: string = bookingRef) => {
    const message = formatBookingConfirmationMessage({
      referenceId: ref || bookingRef,
      searchDetails: currentSearchDetails,
      selectedVehicle,
      passengerDetails,
      estimatedFare: fareEstimate,
    });
    openWhatsAppChat(message);
    setAutoWhatsAppSent(true);
  };

  const handleConfirmSubmit = async (sendToWhatsAppDirectly: boolean = false) => {
    setIsSubmitting(true);
    // Generate unique booking reference ID e.g., TJ-84920
    const randomNum = Math.floor(10000 + Math.random() * 90000);
    const refId = `TJ-${randomNum}`;
    setBookingRef(refId);

    const newBooking: BookingRequest = {
      referenceId: refId,
      searchDetails: currentSearchDetails,
      selectedVehicle,
      passengerDetails,
      estimatedFare: fareEstimate,
      createdAt: new Date().toISOString(),
      status: 'Pending Confirmation',
    };

    // Save directly to Supabase Database
    try {
      const res = await saveBookingToSupabase(newBooking);
      setDbSaveResult(res);
    } catch (saveErr) {
      console.warn('Booking save error:', saveErr);
    }

    onCompleteBooking(newBooking);
    setIsSubmitting(false);
    setStep(5);

    if (sendToWhatsAppDirectly) {
      handleSendWhatsAppConfirmation(refId);
    } else {
      // Start 4-second auto-dispatch countdown for seamless automated WhatsApp confirmation
      setAutoDispatchCountdown(4);
    }
  };

  // Countdown timer effect for automated WhatsApp dispatch
  React.useEffect(() => {
    if (step === 5 && autoDispatchCountdown !== null && autoDispatchCountdown > 0) {
      const timer = setTimeout(() => {
        setAutoDispatchCountdown((prev) => (prev !== null && prev > 0 ? prev - 1 : null));
      }, 1000);
      return () => clearTimeout(timer);
    } else if (step === 5 && autoDispatchCountdown === 0) {
      setAutoDispatchCountdown(null);
      if (!autoWhatsAppSent) {
        handleSendWhatsAppConfirmation();
      }
    }
  }, [step, autoDispatchCountdown, autoWhatsAppSent, bookingRef]);

  const handleCopyRef = () => {
    navigator.clipboard.writeText(bookingRef);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-2xl my-8 overflow-hidden relative text-slate-900 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-emerald-900 text-white p-5 sm:p-6 flex items-center justify-between shrink-0">
          <div>
            <span className="text-[11px] font-bold text-emerald-300 uppercase tracking-wider block">
              Booking Process
            </span>
            <h3 className="text-xl font-bold">
              {step === 3 && 'Step 3 — Passenger Details'}
              {step === 4 && 'Step 4 — Review Ride Details'}
              {step === 5 && 'Step 5 — Booking Request Submitted'}
            </h3>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-full transition-colors"
            aria-label="Close dialog"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Stepper Progress Bar */}
        {step !== 5 && (
          <div className="bg-slate-100 px-6 py-2 border-b border-slate-200 flex items-center justify-between text-xs font-semibold text-slate-600">
            <span className={step >= 3 ? 'text-emerald-800 font-bold' : ''}>
              1. Passenger Info
            </span>
            <span>→</span>
            <span className={step >= 4 ? 'text-emerald-800 font-bold' : ''}>
              2. Review
            </span>
            <span>→</span>
            <span>3. Confirmation</span>
          </div>
        )}

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* STEP 3: Passenger Details & Trip Schedule */}
          {step === 3 && (
            <form id="passenger-form" onSubmit={handleNextToReview} className="space-y-5">
              {/* Trip Timing & Dates Section */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-emerald-800" />
                    <span>Trip Schedule & Timing</span>
                  </span>
                  <span className="text-[11px] font-bold text-emerald-800 uppercase">
                    {searchDetails.serviceType}
                  </span>
                </div>

                <div className={`grid grid-cols-1 ${searchDetails.serviceType === 'roundtrip' ? 'sm:grid-cols-3' : 'sm:grid-cols-2'} gap-3`}>
                  {/* PICKUP DATE */}
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                      Pickup Date <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Calendar className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                      <input
                        type="date"
                        value={pickupDate}
                        onChange={(e) => {
                          const newD = e.target.value;
                          setPickupDate(newD);
                          if (dropDate < newD) setDropDate(newD);
                        }}
                        className={`w-full pl-9 pr-2.5 py-2 bg-white border rounded-xl text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-600 ${
                          errors.pickupDate ? 'border-red-500' : 'border-slate-300'
                        }`}
                        required
                      />
                    </div>
                  </div>

                  {/* PICKUP TIME */}
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                      Pickup Time <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Clock className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                      <input
                        type="time"
                        value={pickupTime}
                        onChange={(e) => setPickupTime(e.target.value)}
                        className={`w-full pl-9 pr-2.5 py-2 bg-white border rounded-xl text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-600 ${
                          errors.pickupTime ? 'border-red-500' : 'border-slate-300'
                        }`}
                        required
                      />
                    </div>
                  </div>

                  {/* DROP / RETURN DATE (Only for Roundtrip) */}
                  {searchDetails.serviceType === 'roundtrip' && (
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                        Drop / Return Date <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <Calendar className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                        <input
                          type="date"
                          min={pickupDate}
                          value={dropDate}
                          onChange={(e) => setDropDate(e.target.value)}
                          className={`w-full pl-9 pr-2.5 py-2 bg-white border rounded-xl text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-600 ${
                            errors.dropDate ? 'border-red-500' : 'border-slate-300'
                          }`}
                          required
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Customer Account Auto-Fill Banner */}
              {customer ? (
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-emerald-800 text-white flex items-center justify-center font-bold text-xs">
                      {customer.fullName.slice(0, 2).toUpperCase() || 'TJ'}
                    </div>
                    <div>
                      <span className="font-bold text-emerald-950 block">
                        Logged in as {customer.fullName}
                      </span>
                      <span className="text-[11px] text-emerald-700">
                        Contact details auto-filled for instant booking
                      </span>
                    </div>
                  </div>
                  <span className="bg-emerald-200/80 text-emerald-900 font-bold px-2 py-0.5 rounded-full text-[10px] uppercase">
                    1-Click Ready
                  </span>
                </div>
              ) : (
                onOpenCustomerLogin && (
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 text-slate-700">
                      <User className="w-4 h-4 text-emerald-800" />
                      <span>Have a TRAVEL JUST account?</span>
                    </div>
                    <button
                      type="button"
                      onClick={onOpenCustomerLogin}
                      className="font-bold text-emerald-800 hover:text-emerald-950 underline text-xs"
                    >
                      Sign In to Auto-Fill
                    </button>
                  </div>
                )
              )}

              {/* Passenger Info Section */}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <User className="w-5 h-5 absolute left-3.5 top-3 text-slate-400" />
                    <input
                      type="text"
                      value={passengerDetails.fullName}
                      onChange={(e) =>
                        setPassengerDetails({ ...passengerDetails, fullName: e.target.value })
                      }
                      placeholder="Enter your full name"
                      className={`w-full pl-10 pr-3 py-2.5 bg-slate-50 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white ${
                        errors.fullName ? 'border-red-500' : 'border-slate-300'
                      }`}
                    />
                  </div>
                  {errors.fullName && (
                    <p className="text-xs text-red-600 mt-1 flex items-center gap-1 font-medium">
                      <AlertCircle className="w-3.5 h-3.5" /> {errors.fullName}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Mobile Number <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Phone className="w-5 h-5 absolute left-3.5 top-3 text-slate-400" />
                    <input
                      type="tel"
                      value={passengerDetails.mobileNumber}
                      onChange={(e) =>
                        setPassengerDetails({
                          ...passengerDetails,
                          mobileNumber: e.target.value,
                        })
                      }
                      placeholder="Enter mobile number"
                      className={`w-full pl-10 pr-3 py-2.5 bg-slate-50 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white ${
                        errors.mobileNumber ? 'border-red-500' : 'border-slate-300'
                      }`}
                    />
                  </div>
                  {errors.mobileNumber && (
                    <p className="text-xs text-red-600 mt-1 flex items-center gap-1 font-medium">
                      <AlertCircle className="w-3.5 h-3.5" /> {errors.mobileNumber}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Number of Passengers
                  </label>
                  <div className="relative">
                    <Users className="w-5 h-5 absolute left-3.5 top-3 text-slate-400" />
                    <select
                      value={passengerDetails.passengersCount}
                      onChange={(e) =>
                        setPassengerDetails({
                          ...passengerDetails,
                          passengersCount: Number(e.target.value),
                        })
                      }
                      className="w-full pl-10 pr-8 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white appearance-none"
                    >
                      {Array.from(
                        { length: selectedVehicle.seatingCapacity },
                        (_, i) => i + 1
                      ).map((n) => (
                        <option key={n} value={n}>
                          {n} {n === 1 ? 'Passenger' : 'Passengers'}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Special Instructions / Flight Details
                  </label>
                  <div className="relative">
                    <MessageSquare className="w-5 h-5 absolute left-3.5 top-3 text-slate-400" />
                    <textarea
                      rows={2}
                      value={passengerDetails.specialInstructions}
                      onChange={(e) =>
                        setPassengerDetails({
                          ...passengerDetails,
                          specialInstructions: e.target.value,
                        })
                      }
                      placeholder="Mention any flight numbers, terminal details, luggage notes, or special requirements..."
                      className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white"
                    />
                  </div>
                </div>
              </div>
            </form>
          )}

          {/* STEP 4: Review Booking Summary */}
          {step === 4 && (
            <div className="space-y-4">
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <span className="text-xs font-bold text-slate-500 uppercase">
                    Service Type
                  </span>
                  <span className="text-sm font-bold text-emerald-900 uppercase">
                    {searchDetails.serviceType}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="font-semibold text-slate-500 block">Pickup Location</span>
                    <span className="font-bold text-slate-800 flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3.5 h-3.5 text-emerald-800 shrink-0" />
                      {searchDetails.pickupLocation}
                    </span>
                  </div>

                  {searchDetails.dropLocation && searchDetails.serviceType !== 'local' && (
                    <div>
                      <span className="font-semibold text-slate-500 block">Drop Location</span>
                      <span className="font-bold text-slate-800 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3.5 h-3.5 text-emerald-800 shrink-0" />
                        {searchDetails.dropLocation}
                      </span>
                    </div>
                  )}

                  <div>
                    <span className="font-semibold text-slate-500 block">Pickup Date & Time</span>
                    <span className="font-bold text-slate-800 flex items-center gap-1 mt-0.5">
                      <Calendar className="w-3.5 h-3.5 text-emerald-800 shrink-0" />
                      {pickupDate} at {pickupTime}
                    </span>
                  </div>

                  {searchDetails.serviceType === 'roundtrip' && (
                    <div>
                      <span className="font-semibold text-slate-500 block">Drop / Return Date</span>
                      <span className="font-bold text-slate-800 flex items-center gap-1 mt-0.5">
                        <Calendar className="w-3.5 h-3.5 text-emerald-800 shrink-0" />
                        {dropDate}
                      </span>
                    </div>
                  )}

                  <div>
                    <span className="font-semibold text-slate-500 block">Vehicle Selected</span>
                    <span className="font-bold text-slate-800 flex items-center gap-1 mt-0.5">
                      <Car className="w-3.5 h-3.5 text-emerald-800 shrink-0" />
                      {selectedVehicle.name} ({selectedVehicle.category})
                    </span>
                  </div>

                  {searchDetails.routeInfo?.summaryText && (
                    <div className="col-span-full bg-emerald-50 border border-emerald-200 p-2.5 rounded-xl flex items-center justify-between">
                      <span className="font-bold text-emerald-950 flex items-center gap-1.5">
                        <Navigation className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                        <span>Route Calculation: {searchDetails.routeInfo.summaryText}</span>
                      </span>
                      {searchDetails.routeInfo.stopsCount > 0 && (
                        <span className="text-[10px] font-bold bg-emerald-200/80 text-emerald-900 px-2 py-0.5 rounded-full">
                          {searchDetails.routeInfo.stopsCount} via stops
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-600">Passenger Name</span>
                  <span className="text-xs font-bold text-slate-900">
                    {passengerDetails.fullName} ({passengerDetails.passengersCount} Passengers)
                  </span>
                </div>

                {searchDetails.serviceType === 'local' && (
                  <div className="flex items-center justify-between pt-1 border-t border-slate-200">
                    <span className="text-xs font-semibold text-slate-600">Local Package Coverage</span>
                    <span className="text-xs font-bold text-emerald-900">
                      {(searchDetails.durationHours || 8) * 10} KM Included
                      {searchDetails.extraKm && searchDetails.extraKm > 0 ? ` + ${searchDetails.extraKm} KM Extra (@ ₹${pricingConfig.vehiclePricing?.[selectedVehicle.id]?.localPerKmRate || pricingConfig.vehiclePricing?.[selectedVehicle.id]?.perKmFare || 12}/km)` : ''}
                    </span>
                  </div>
                )}

                {searchDetails.serviceType === 'oneway' && searchDetails.extraKm && searchDetails.extraKm > 0 && (
                  <div className="flex items-center justify-between pt-1 border-t border-slate-200">
                    <span className="text-xs font-semibold text-slate-600">Extra KM / Detour Allowance</span>
                    <span className="text-xs font-bold text-emerald-900">
                      +{searchDetails.extraKm} KM Extra (@ ₹{pricingConfig.vehiclePricing?.[selectedVehicle.id]?.oneWayPerKmRate || pricingConfig.vehiclePricing?.[selectedVehicle.id]?.perKmFare || 13.5}/km)
                    </span>
                  </div>
                )}

                {searchDetails.serviceType === 'airport' && searchDetails.extraKm && searchDetails.extraKm > 0 && (
                  <div className="flex items-center justify-between pt-1 border-t border-slate-200">
                    <span className="text-xs font-semibold text-slate-600">Extra KM / City Detour Allowance</span>
                    <span className="text-xs font-bold text-emerald-900">
                      +{searchDetails.extraKm} KM Extra (@ ₹{pricingConfig.vehiclePricing?.[selectedVehicle.id]?.airportPerKmRate || pricingConfig.vehiclePricing?.[selectedVehicle.id]?.perKmFare || 14}/km)
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-600">Contact Number</span>
                  <span className="text-xs font-bold text-slate-900">
                    {passengerDetails.mobileNumber}
                  </span>
                </div>
              </div>

              {/* Total Estimated Fare Highlight */}
              <div className="bg-emerald-800 text-white p-4 rounded-2xl flex items-center justify-between">
                <div>
                  <span className="text-xs text-emerald-200 font-semibold block uppercase">
                    Estimated Fare
                  </span>
                  <span className="text-2xl font-extrabold">
                    {pricingConfig.currencySymbol}
                    {fareEstimate.totalEstimatedFare}{' '}
                    <span className="text-xs font-medium text-emerald-200">
                      {pricingConfig.currencyCode}
                    </span>
                  </span>
                </div>
                <div className="text-right text-[11px] text-emerald-100">
                  <span>Transparent Pricing</span>
                  <br />
                  <span>No Hidden Charges</span>
                </div>
              </div>

              <p className="text-[11px] text-slate-500 text-center italic">
                By submitting this request, you agree to receive a confirmation call/email from our team. Final fare will be verified prior to journey dispatch.
              </p>
            </div>
          )}

          {/* STEP 5: Confirmation Screen */}
          {step === 5 && (
            <div className="text-center space-y-5 py-4">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto shadow-sm">
                <CheckCircle2 className="w-10 h-10 stroke-[2]" />
              </div>

              <div>
                <h4 className="text-2xl font-bold text-slate-900">
                  Your Ride Request Has Been Received
                </h4>
                <p className="text-sm text-slate-600 mt-1 max-w-md mx-auto">
                  Our dispatch team will contact you to confirm the booking and final fare.
                </p>
              </div>

              {/* Booking Reference Box */}
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 max-w-md mx-auto text-center space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-900 block">
                  Booking Reference ID
                </span>
                <div className="flex items-center justify-center gap-2">
                  <span className="text-2xl font-extrabold text-emerald-900 tracking-wider">
                    {bookingRef}
                  </span>
                  <button
                    onClick={handleCopyRef}
                    className="p-1.5 bg-white border border-emerald-300 rounded-lg text-emerald-800 hover:bg-emerald-100 transition-colors"
                    title="Copy Reference ID"
                  >
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
                {copied && (
                  <span className="text-[11px] font-semibold text-emerald-800 block">
                    Copied to clipboard!
                  </span>
                )}
              </div>

              {/* Trip Summary Badge */}
              <div className="max-w-md mx-auto p-2.5 bg-slate-100 border border-slate-200 rounded-xl flex items-center justify-between text-xs text-slate-800 font-medium">
                <span className="flex items-center gap-1.5 font-bold text-slate-900">
                  <Car className="w-4 h-4 text-emerald-800 shrink-0" />
                  <span>{selectedVehicle.name}</span>
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-800 text-white font-bold text-[10px]">
                  ₹{Number(fareEstimate?.totalEstimatedFare ?? 0).toLocaleString('en-IN')} Total
                </span>
              </div>

              {/* AUTOMATIC WHATSAPP CONFIRMATION CARD WITH CAR LOGO */}
              <div className="max-w-md mx-auto bg-gradient-to-br from-emerald-50 via-white to-emerald-50/50 border-2 border-[#25D366]/40 rounded-2xl p-4 text-left shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-full bg-[#25D366] text-white flex items-center justify-center shadow-sm shrink-0">
                      <Car className="w-5 h-5 stroke-[2.2]" />
                    </div>
                    <div>
                      <span className="text-xs font-extrabold text-slate-900 block">
                        Instant WhatsApp Confirmation
                      </span>
                      <span className="text-[10px] text-emerald-700 font-semibold block">
                        Auto-Dispatch & Fast Driver Allocation
                      </span>
                    </div>
                  </div>
                  {autoDispatchCountdown !== null && autoDispatchCountdown > 0 ? (
                    <span className="text-[10px] bg-emerald-800 text-white font-bold px-2 py-0.5 rounded-full animate-pulse shadow-xs">
                      Auto-opening in {autoDispatchCountdown}s...
                    </span>
                  ) : autoWhatsAppSent ? (
                    <span className="text-[10px] bg-[#25D366] text-white font-bold px-2 py-0.5 rounded-full shadow-xs flex items-center gap-1">
                      <Check className="w-3 h-3" /> Dispatched
                    </span>
                  ) : (
                    <span className="text-[10px] bg-[#25D366] text-white font-bold px-2 py-0.5 rounded-full shadow-xs">
                      Recommended
                    </span>
                  )}
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">
                  Send your booking slip directly to our 24/7 WhatsApp dispatch desk (<strong>{siteConfig.contact.whatsapp}</strong>) for instant confirmation and real-time driver allocation.
                </p>

                <div className="space-y-2">
                  <button
                    type="button"
                    id="whatsapp-confirm-booking-btn"
                    onClick={() => {
                      setAutoDispatchCountdown(null);
                      handleSendWhatsAppConfirmation();
                    }}
                    className="w-full bg-[#25D366] hover:bg-[#20bd5a] active:scale-[0.99] text-white font-extrabold text-xs py-3 px-4 rounded-xl shadow-md hover:shadow-[#25D366]/30 flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center">
                      <Car className="w-3.5 h-3.5" />
                    </div>
                    <span>{autoWhatsAppSent ? 'Resend Confirmation to WhatsApp' : 'Send Confirmation to WhatsApp Now'}</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>

                  {autoDispatchCountdown !== null && autoDispatchCountdown > 0 && (
                    <div className="flex items-center justify-between text-[11px] px-1 text-slate-500">
                      <span>Automatic WhatsApp launch in <strong>{autoDispatchCountdown} seconds</strong></span>
                      <button
                        type="button"
                        onClick={() => setAutoDispatchCountdown(null)}
                        className="text-slate-600 hover:text-slate-900 underline font-semibold cursor-pointer"
                      >
                        Cancel auto-open
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Notice */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
                <p className="font-semibold text-slate-800 mb-1">What Happens Next?</p>
                1. Our dispatch manager reviews vehicle availability for your route.
                <br />
                2. You will receive a call/WhatsApp message at{' '}
                <strong className="text-slate-900">{passengerDetails.mobileNumber}</strong>.
                <br />
                3. Final trip itinerary and driver details will be dispatched prior to pickup time.
              </div>

              <div className="pt-2 text-xs text-slate-500">
                Support Helpline: <strong className="text-slate-800">{siteConfig.contact.phone}</strong>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="bg-slate-50 p-4 px-6 border-t border-slate-200 flex items-center justify-between shrink-0">
          {step === 3 && (
            <>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900"
              >
                Cancel
              </button>

              <button
                type="submit"
                form="passenger-form"
                className="bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-sm px-6 py-2.5 rounded-xl shadow transition-all flex items-center gap-2"
              >
                Review Booking
                <ArrowRight className="w-4 h-4" />
              </button>
            </>
          )}

          {step === 4 && (
            <>
              <button
                type="button"
                onClick={() => setStep(3)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 flex items-center gap-1"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleConfirmSubmit(true)}
                  disabled={isSubmitting}
                  className="bg-[#25D366] hover:bg-[#20bd5a] disabled:opacity-75 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow transition-all flex items-center gap-1.5 cursor-pointer"
                  title="Submit and immediately open WhatsApp Confirmation"
                >
                  <Car className="w-4 h-4" />
                  <span>Confirm on WhatsApp</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleConfirmSubmit(false)}
                  disabled={isSubmitting}
                  className="bg-emerald-800 hover:bg-emerald-900 disabled:opacity-75 text-white font-extrabold text-sm px-5 py-2.5 rounded-xl shadow transition-all flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Confirming Booking...
                    </>
                  ) : (
                    <>
                      Submit Booking
                      <CheckCircle2 className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </>
          )}

          {step === 5 && (
            <div className="w-full flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => handleSendWhatsAppConfirmation()}
                className="w-full sm:w-auto bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold text-xs sm:text-sm px-6 py-2.5 rounded-xl shadow flex items-center justify-center gap-2 transition-all"
              >
                <Car className="w-4 h-4" />
                <span>WhatsApp Confirmation</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                className="w-full sm:w-auto bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs sm:text-sm px-6 py-2.5 rounded-xl shadow transition-all"
              >
                Done / Close
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
