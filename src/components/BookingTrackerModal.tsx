import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  RefreshCw,
  Car,
  MapPin,
  Calendar,
  Clock,
  ShieldCheck,
  Phone,
  Navigation,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Search,
  ExternalLink,
  ChevronRight,
  Compass,
  ArrowRight,
  User,
  KeyRound,
} from 'lucide-react';
import { BookingRequest } from '../types';
import {
  fetchBookingByReference,
  buildLiveTrackingDetails,
  LiveTrackingDetails,
  TrackingStage,
} from '../services/bookingTrackingService';
import { siteConfig } from '../config/siteConfig';

interface BookingTrackerModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialReferenceId?: string;
  onBookNewRide?: () => void;
}

export const BookingTrackerModal: React.FC<BookingTrackerModalProps> = ({
  isOpen,
  onClose,
  initialReferenceId,
  onBookNewRide,
}) => {
  const [searchInput, setSearchInput] = useState(initialReferenceId || '');
  const [activeRefId, setActiveRefId] = useState(initialReferenceId || '');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [trackingData, setTrackingData] = useState<LiveTrackingDetails | null>(null);
  const [copiedOtp, setCopiedOtp] = useState(false);
  const [autoRefreshActive, setAutoRefreshActive] = useState(true);

  // Polling timer
  const pollIntervalRef = useRef<any>(null);

  const loadTracking = async (refId: string, showLoader = true) => {
    if (!refId.trim()) return;
    if (showLoader) setIsLoading(true);
    setErrorMsg(null);

    try {
      const booking = await fetchBookingByReference(refId.trim());
      if (booking) {
        const details = buildLiveTrackingDetails(booking);
        setTrackingData(details);
        setActiveRefId(booking.referenceId);
      } else {
        setErrorMsg(`No booking record found for reference "${refId}". Please check the ID or contact support.`);
      }
    } catch (err) {
      console.warn('Error loading booking tracking:', err);
      setErrorMsg('Could not retrieve tracking details. Please try again.');
    } finally {
      if (showLoader) setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      const targetId = initialReferenceId || activeRefId;
      if (targetId) {
        setSearchInput(targetId);
        setActiveRefId(targetId);
        loadTracking(targetId);
      }
    } else {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    }
  }, [isOpen, initialReferenceId]);

  // Set up live auto-polling every 8 seconds when open and viewing an active booking
  useEffect(() => {
    if (!isOpen || !activeRefId || !autoRefreshActive) {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
      return;
    }

    pollIntervalRef.current = setInterval(() => {
      loadTracking(activeRefId, false);
    }, 8000);

    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, [isOpen, activeRefId, autoRefreshActive]);

  if (!isOpen) return null;

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchInput.trim()) return;
    loadTracking(searchInput.trim());
  };

  const handleCopyOtp = (otp: string) => {
    navigator.clipboard.writeText(otp);
    setCopiedOtp(true);
    setTimeout(() => setCopiedOtp(false), 2000);
  };

  // Google Maps Static / Interactive Embed URL
  const getGoogleMapsEmbedUrl = (data: LiveTrackingDetails) => {
    const origin = encodeURIComponent(data.routeCoordinates.pickup.address);
    const destination = encodeURIComponent(data.routeCoordinates.drop?.address || data.routeCoordinates.pickup.address);
    return `https://www.google.com/maps?saddr=${origin}&daddr=${destination}&output=embed`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh] text-slate-900 dark:text-white">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-950 via-emerald-900 to-slate-900 text-white p-4 sm:p-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-300">
              <Navigation className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base sm:text-lg">
                  Real-Time Ride Tracker
                </h3>
                <span className="inline-flex items-center gap-1 text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Live GPS
                </span>
              </div>
              <p className="text-xs text-emerald-200/80">
                Track status, vehicle arrival, and verified chauffeur dispatch
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {activeRefId && (
              <button
                type="button"
                onClick={() => loadTracking(activeRefId)}
                disabled={isLoading}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-colors flex items-center gap-1.5 text-xs font-bold cursor-pointer"
                title="Refresh Live Status"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Refresh</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              aria-label="Close Tracker"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Search Bar if needed */}
        <div className="px-4 sm:px-6 py-3 bg-slate-50 dark:bg-slate-850 border-b border-slate-200 dark:border-slate-800 shrink-0">
          <form onSubmit={handleSearchSubmit} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Enter Booking Reference ID (e.g. TJ-10821)"
                className="w-full pl-9 pr-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-slate-900 dark:text-white uppercase placeholder:normal-case"
              />
            </div>
            <button
              type="submit"
              disabled={isLoading || !searchInput.trim()}
              className="px-4 py-2 bg-emerald-800 hover:bg-emerald-900 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
            >
              <span>Track</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1">
          {isLoading && !trackingData ? (
            <div className="py-16 text-center space-y-3">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto text-emerald-700" />
              <p className="text-xs font-semibold text-slate-500">
                Fetching real-time dispatch status from TRAVEL JUST backend...
              </p>
            </div>
          ) : errorMsg ? (
            <div className="p-6 text-center bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 rounded-2xl space-y-3">
              <AlertCircle className="w-8 h-8 text-amber-600 mx-auto" />
              <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                Booking Not Found
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 max-w-md mx-auto">
                {errorMsg}
              </p>
              <div className="flex justify-center gap-3 pt-1">
                <a
                  href={`tel:${siteConfig.contact.phone.replace(/\s+/g, '')}`}
                  className="px-3.5 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200 hover:border-emerald-500 transition-colors inline-flex items-center gap-1.5"
                >
                  <Phone className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Call 24/7 Helpline</span>
                </a>
              </div>
            </div>
          ) : trackingData ? (
            <div className="space-y-5">
              
              {/* Reference & Service Pill */}
              <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-2xl border border-slate-200/90 dark:border-slate-700">
                <div className="flex items-center gap-2.5">
                  <span className="font-mono font-bold text-sm sm:text-base text-emerald-950 dark:text-emerald-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2.5 py-1 rounded-xl shadow-2xs">
                    #{trackingData.booking.referenceId}
                  </span>
                  <div>
                    <span className="text-xs font-extrabold text-slate-900 dark:text-white block">
                      {trackingData.booking.selectedVehicle.name}
                    </span>
                    <span className="text-[10px] font-bold text-emerald-800 dark:text-emerald-400 uppercase tracking-wider block">
                      {trackingData.booking.searchDetails.serviceType} Package
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="font-extrabold text-base text-slate-900 dark:text-white block">
                    ₹{Number(trackingData.booking.estimatedFare?.totalEstimatedFare ?? 0).toLocaleString('en-IN')}
                  </span>
                  <span className="text-[10px] text-slate-400 block">
                    Last update: {trackingData.lastRefreshedAt}
                  </span>
                </div>
              </div>

              {/* Progress Bar & Visual Step-by-Step Indicator */}
              <div className="bg-white dark:bg-slate-850 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Booking Progress ({trackingData.progressPercent}%)
                  </span>
                  <span className="text-xs font-extrabold text-emerald-800 dark:text-emerald-400">
                    Stage {trackingData.stageIndex + 1} of 6
                  </span>
                </div>

                {/* Horizontal Progress Bar */}
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-emerald-600 to-emerald-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${trackingData.progressPercent}%` }}
                  />
                </div>

                {/* Step Indicators */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 pt-2">
                  {trackingData.steps.map((step, idx) => {
                    const isPassed = step.isCompleted;
                    const isCurr = step.isCurrent;
                    return (
                      <div
                        key={step.stage}
                        className={`p-2.5 rounded-xl border text-left transition-all ${
                          isCurr
                            ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 shadow-xs ring-2 ring-emerald-500/20'
                            : isPassed
                            ? 'bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 opacity-90'
                            : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 opacity-40'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 mb-1">
                          <div
                            className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 ${
                              isCurr
                                ? 'bg-emerald-600 text-white animate-pulse'
                                : isPassed
                                ? 'bg-emerald-800 text-white'
                                : 'bg-slate-200 text-slate-500'
                            }`}
                          >
                            {isPassed && !isCurr ? '✓' : idx + 1}
                          </div>
                          <span
                            className={`text-[11px] font-bold truncate ${
                              isCurr
                                ? 'text-emerald-950 dark:text-emerald-200'
                                : isPassed
                                ? 'text-slate-800 dark:text-slate-200'
                                : 'text-slate-400'
                            }`}
                          >
                            {step.label}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-tight">
                          {step.sublabel}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Chauffeur & Vehicle Allocation Card (When Assigned or En Route) */}
              {trackingData.chauffeur && (
                <div className="bg-gradient-to-br from-emerald-50/90 via-white to-slate-50 dark:from-slate-800 dark:via-slate-850 dark:to-slate-800 p-4 sm:p-5 rounded-2xl border border-emerald-200 dark:border-slate-700 shadow-xs space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-emerald-800 text-white flex items-center justify-center font-bold text-lg shadow-xs shrink-0">
                        <User className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white">
                            Chauffeur: {trackingData.chauffeur.name}
                          </h4>
                          <span className="text-[11px] font-bold text-amber-600 bg-amber-50 dark:bg-amber-950/40 px-1.5 py-0.2 rounded border border-amber-200">
                            ★ {trackingData.chauffeur.rating}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                          {trackingData.chauffeur.vehicleModel} •{' '}
                          <span className="font-mono font-bold bg-amber-100 text-amber-900 px-1.5 py-0.5 rounded text-[11px]">
                            {trackingData.chauffeur.vehiclePlateNumber}
                          </span>
                        </p>
                      </div>
                    </div>

                    {/* Ride Security Start OTP */}
                    <div className="bg-white dark:bg-slate-800 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-center shrink-0">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        Start Trip OTP
                      </span>
                      <div className="flex items-center gap-1.5 justify-center mt-0.5">
                        <span className="font-mono font-black text-base tracking-widest text-emerald-800 dark:text-emerald-400">
                          {trackingData.chauffeur.securityOtp}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopyOtp(trackingData.chauffeur!.securityOtp)}
                          className="p-1 text-slate-400 hover:text-emerald-800 rounded transition-colors"
                          title="Copy Ride OTP"
                        >
                          {copiedOtp ? <Check className="w-3.5 h-3.5 text-emerald-700" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Chauffeur Quick Call Buttons */}
                  <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-100 dark:border-slate-700/80">
                    <a
                      href={`tel:${trackingData.chauffeur.phone.replace(/\s+/g, '')}`}
                      className="px-3.5 py-2 bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      <span>Call Chauffeur ({trackingData.chauffeur.phone})</span>
                    </a>

                    <a
                      href={`https://wa.me/91${trackingData.chauffeur.phone.replace(/\D/g, '').slice(-10)}?text=${encodeURIComponent(
                        `Hi ${trackingData.chauffeur.name}, I am tracking booking #${trackingData.booking.referenceId} on TRAVEL JUST.`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3.5 py-2 bg-white dark:bg-slate-800 hover:bg-emerald-50 text-slate-800 dark:text-slate-100 font-bold text-xs rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs transition-colors flex items-center gap-1.5"
                    >
                      <svg className="w-3.5 h-3.5 text-[#25D366]" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
                      </svg>
                      <span>WhatsApp Message</span>
                    </a>
                  </div>
                </div>
              )}

              {/* Google Maps Live Location Tracker View */}
              <div className="bg-white dark:bg-slate-850 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
                <div className="p-3.5 bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Compass className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
                    <span className="font-bold text-xs text-slate-800 dark:text-slate-200">
                      Live Vehicle Route Map
                    </span>
                  </div>

                  {trackingData.liveLocation && (
                    <div className="flex items-center gap-3 text-xs">
                      <span className="font-bold text-emerald-800 dark:text-emerald-400 bg-emerald-100/80 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full text-[11px]">
                        ETA: ~{trackingData.liveLocation.estimatedArrivalMinutes} mins
                      </span>
                      <span className="text-slate-500 text-[11px]">
                        Distance: {trackingData.liveLocation.distanceRemainingKm} km
                      </span>
                    </div>
                  )}
                </div>

                {/* Map Display Frame */}
                <div className="relative w-full h-64 sm:h-72 bg-slate-100 dark:bg-slate-900 overflow-hidden">
                  <iframe
                    title="Google Maps Route Tracking"
                    src={getGoogleMapsEmbedUrl(trackingData)}
                    className="w-full h-full border-0"
                    loading="lazy"
                    allowFullScreen
                  />

                  {/* Floating Live Telemetry Badge over Map */}
                  {trackingData.liveLocation && (
                    <div className="absolute top-3 left-3 bg-slate-900/90 backdrop-blur-xs text-white px-3 py-1.5 rounded-xl text-xs font-semibold shadow-md flex items-center gap-2 pointer-events-none">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      <span>{trackingData.liveLocation.statusText}</span>
                      <span className="text-slate-400 text-[10px]">({trackingData.liveLocation.speedKmh} km/h)</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Itinerary Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-700 space-y-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Route Information
                  </span>
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-slate-900 dark:text-white block">
                        {trackingData.booking.searchDetails.pickupLocation}
                      </span>
                      {trackingData.booking.searchDetails.dropLocation && (
                        <span className="text-slate-500 dark:text-slate-400 text-[11px] block mt-0.5">
                          To: {trackingData.booking.searchDetails.dropLocation}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-700 space-y-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Trip Schedule
                  </span>
                  <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span className="font-semibold">{trackingData.booking.searchDetails.travelDate}</span>
                    <span>•</span>
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span className="font-semibold">{trackingData.booking.searchDetails.pickupTime}</span>
                  </div>
                </div>
              </div>

            </div>
          ) : null}
        </div>

        {/* Footer */}
        <div className="p-3.5 sm:p-4 bg-slate-50 dark:bg-slate-850 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-slate-500 dark:text-slate-400">Need immediate assistance?</span>
            <a
              href={`tel:${siteConfig.contact.phone.replace(/\s+/g, '')}`}
              className="font-bold text-emerald-800 dark:text-emerald-400 hover:underline flex items-center gap-1"
            >
              <Phone className="w-3 h-3" />
              <span>{siteConfig.contact.phone}</span>
            </a>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-slate-800 dark:text-slate-200 font-bold rounded-xl transition-colors cursor-pointer"
          >
            Close Tracker
          </button>
        </div>

      </div>
    </div>
  );
};
