import React, { useState, useEffect, useCallback } from 'react';
import {
  MapPin,
  Calendar,
  Clock as ClockIcon,
  Users,
  Car,
  RotateCcw,
  Plane,
  AlertCircle,
  Plus,
  Trash2,
  Route,
  CheckCircle2,
  ArrowRight,
  Navigation,
  Sparkles,
  ChevronDown,
  ShieldCheck,
  Info,
  Timer,
  UserCheck,
  Check,
  RefreshCw,
} from 'lucide-react';
import {
  BookingSearchState,
  ServiceType,
  AirportTransferType,
  PlaceSuggestion,
  CalculatedRouteInfo,
  PricingConfig,
} from '../types';
import { ServiceSelector } from './ServiceSelector';
import { LocationAutocompleteInput } from './LocationAutocompleteInput';
import { RouteSummaryCard } from './RouteSummaryCard';
import { vehiclesData } from '../data/vehicles';
import { calculateRouteDistance, estimateDrivingDistanceMatrix } from '../services/googleMapsService';
import { calculateRoundTripDays, ROUND_TRIP_TIERS, calculateFare } from '../utils/fareCalculator';
import { defaultPricingConfig } from '../config/siteConfig';

interface BookingSearchProps {
  initialState?: Partial<BookingSearchState>;
  onSearch: (searchState: BookingSearchState) => void;
  onConfirmBooking?: (searchState: BookingSearchState, preferredVehicleId?: string) => void;
  onReset?: () => void;
  isCompact?: boolean;
  pricingConfig?: PricingConfig;
  onOpenFareEngine?: () => void;
}

export const BookingSearch: React.FC<BookingSearchProps> = ({
  initialState,
  onSearch,
  onConfirmBooking,
  onReset,
  pricingConfig,
  onOpenFareEngine,
}) => {
  const effectivePricingConfig = pricingConfig || defaultPricingConfig;
  // Get tomorrow's date string YYYY-MM-DD as standard initial value
  const getTomorrowDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };

  const getDayAfterTomorrowDate = () => {
    const date = new Date();
    date.setDate(date.getDate() + 2);
    return date.toISOString().split('T')[0];
  };

  const [serviceType, setServiceType] = useState<ServiceType>(
    initialState?.serviceType || 'oneway'
  );

  const [pickupLocation, setPickupLocation] = useState(
    initialState?.pickupLocation || ''
  );
  const [dropLocation, setDropLocation] = useState(
    initialState?.dropLocation || ''
  );
  const [travelDate, setTravelDate] = useState(initialState?.travelDate || initialState?.pickupDate || getTomorrowDate());
  const [dropDate, setDropDate] = useState(
    initialState?.dropDate ||
      initialState?.returnDate ||
      (initialState?.serviceType === 'roundtrip' || (!initialState?.serviceType)
        ? getDayAfterTomorrowDate()
        : (initialState?.travelDate || getTomorrowDate()))
  );
  const [returnDate, setReturnDate] = useState(
    initialState?.returnDate || initialState?.dropDate || getDayAfterTomorrowDate()
  );
  const [pickupTime, setPickupTime] = useState(initialState?.pickupTime || '09:00');
  const [returnTime, setReturnTime] = useState(initialState?.returnTime || initialState?.dropTime || '18:00');
  const [durationHours, setDurationHours] = useState<number>(initialState?.durationHours || 8);
  const [extraKm, setExtraKm] = useState<number>(initialState?.extraKm || 0);
  const [airportTransferType, setAirportTransferType] = useState<AirportTransferType>(
    initialState?.airportTransferType || 'pickup'
  );
  const [passengers, setPassengers] = useState<number>(initialState?.passengers || 2);
  const [vehicleType, setVehicleType] = useState<string>(initialState?.vehicleType || 'all');
  const [viaLocations, setViaLocations] = useState<string[]>(initialState?.viaLocations || []);

  // Today's date string for min date boundary
  const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  const handleTravelDateChange = (newDate: string) => {
    setTravelDate(newDate);
    if (errors.travelDate) setErrors((prev) => ({ ...prev, travelDate: '' }));
    
    // Automatically update drop date if it becomes earlier than pickup date
    if (dropDate < newDate) {
      setDropDate(newDate);
      setReturnDate(newDate);
    }
  };

  const handleDropDateChange = (newDate: string) => {
    setDropDate(newDate);
    setReturnDate(newDate);
    if (errors.dropDate) setErrors((prev) => ({ ...prev, dropDate: '' }));
  };

  // Live route calculation state
  const [routeInfo, setRouteInfo] = useState<CalculatedRouteInfo | null>(
    initialState?.routeInfo || null
  );
  const [isCalculatingRoute, setIsCalculatingRoute] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Trigger route computation when locations change
  const computeActiveRoute = useCallback(async () => {
    const origin = pickupLocation.trim();
    const destination =
      serviceType === 'local' ? 'Local Mysuru Sightseeing & City' : dropLocation.trim();

    if (!origin || (serviceType !== 'local' && !destination)) {
      setRouteInfo(null);
      return;
    }

    setIsCalculatingRoute(true);
    try {
      const validStops = viaLocations.filter((s) => s && s.trim().length > 0);
      const computed = await calculateRouteDistance(origin, destination, validStops);
      setRouteInfo(computed);
    } catch (err) {
      console.debug('Route calculation error:', err);
      const fallback = estimateDrivingDistanceMatrix(origin, destination, viaLocations);
      setRouteInfo(fallback);
    } finally {
      setIsCalculatingRoute(false);
    }
  }, [pickupLocation, dropLocation, viaLocations, serviceType]);

  // Debounced auto-recalculate on change
  useEffect(() => {
    const timer = setTimeout(() => {
      computeActiveRoute();
    }, 350);
    return () => clearTimeout(timer);
  }, [computeActiveRoute]);

  // Adjust defaults when service type switches
  const handleServiceChange = (newService: ServiceType) => {
    setServiceType(newService);
    setErrors({});
  };

  const handleAirportTransferToggle = (type: AirportTransferType) => {
    setAirportTransferType(type);
  };

  const handleAddViaLocation = (initialVal = '') => {
    setViaLocations((prev) => [...prev, initialVal]);
  };

  const handleUpdateViaLocation = (index: number, val: string) => {
    setViaLocations((prev) => {
      const updated = [...prev];
      updated[index] = val;
      return updated;
    });
  };

  const handleRemoveViaLocation = (index: number) => {
    setViaLocations((prev) => prev.filter((_, i) => i !== index));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!pickupLocation.trim()) {
      newErrors.pickupLocation =
        serviceType === 'airport' && airportTransferType === 'pickup'
          ? 'Please select or enter airport terminal'
          : 'Please enter pickup location';
    }

    if (
      (serviceType === 'oneway' || serviceType === 'roundtrip' || serviceType === 'airport') &&
      !dropLocation.trim()
    ) {
      newErrors.dropLocation =
        serviceType === 'airport' && airportTransferType === 'drop'
          ? 'Please select or enter airport destination'
          : 'Please enter drop location';
    }

    const activeTravelDate = travelDate || getTomorrowDate();
    if (!travelDate) {
      setTravelDate(activeTravelDate);
    }

    if (passengers < 1) {
      newErrors.passengers = 'Minimum 1 passenger required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const activeRoundTripDays = calculateRoundTripDays(travelDate, returnDate);
  const activeIncludedMinKm = activeRoundTripDays * 300;

  // Selected vehicle and calculated fares for in-form live breakdown
  const selectedVehicleObj = vehicleType !== 'all' 
    ? vehiclesData.find((v) => v.id === vehicleType) || vehiclesData[0] 
    : vehiclesData[0];
  const selectedLocalVehicle = selectedVehicleObj;
  const selectedRoundTripVehicle = selectedVehicleObj;
  const selectedOneWayVehicle = selectedVehicleObj;
  const selectedAirportVehicle = selectedVehicleObj;

  const selectedOneWayFare = serviceType === 'oneway'
    ? calculateFare(
        {
          serviceType: 'oneway',
          pickupLocation: pickupLocation || 'Mysuru',
          dropLocation: dropLocation || 'Drop Location',
          travelDate,
          pickupTime,
          durationHours,
          airportTransferType,
          passengers,
          vehicleType: selectedVehicleObj.id,
          routeInfo,
        },
        selectedVehicleObj,
        effectivePricingConfig
      )
    : null;

  const selectedLocalFare = serviceType === 'local' 
    ? calculateFare(
        {
          serviceType: 'local',
          pickupLocation,
          dropLocation: 'Local Mysuru City Coverage',
          travelDate,
          pickupTime,
          durationHours,
          extraKm,
          airportTransferType,
          passengers,
          vehicleType: selectedVehicleObj.id,
        },
        selectedVehicleObj,
        effectivePricingConfig
      )
    : null;

  const selectedRoundTripFare = serviceType === 'roundtrip'
    ? calculateFare(
        {
          serviceType: 'roundtrip',
          pickupLocation: pickupLocation || 'Mysuru',
          dropLocation: dropLocation || 'Outstation Destination',
          viaLocations: viaLocations.filter((l) => l && l.trim() !== ''),
          travelDate,
          returnDate,
          roundTripDays: activeRoundTripDays,
          pickupTime,
          returnTime,
          durationHours,
          airportTransferType,
          passengers,
          vehicleType: selectedVehicleObj.id,
          routeInfo,
        },
        selectedVehicleObj,
        effectivePricingConfig
      )
    : null;

  const selectedAirportFare = serviceType === 'airport'
    ? calculateFare(
        {
          serviceType: 'airport',
          pickupLocation: pickupLocation || (airportTransferType === 'drop' ? 'Mysuru City' : 'Mysuru Airport (MYQ)'),
          dropLocation: dropLocation || (airportTransferType === 'drop' ? 'Bengaluru Kempegowda Intl Airport (BLR)' : 'Mysuru Destination'),
          travelDate,
          pickupTime,
          durationHours,
          airportTransferType,
          passengers,
          vehicleType: selectedVehicleObj.id,
          routeInfo,
        },
        selectedVehicleObj,
        effectivePricingConfig
      )
    : null;

  const handleSelectRoundTripDays = (days: number) => {
    const base = travelDate ? new Date(travelDate + 'T00:00:00') : new Date();
    const target = new Date(base);
    target.setDate(target.getDate() + (days - 1));
    const targetStr = target.toISOString().split('T')[0];
    setDropDate(targetStr);
    setReturnDate(targetStr);
  };

  const formatFriendlyDate = (dateStr: string) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr + 'T00:00:00');
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString('en-IN', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
      });
    } catch {
      return dateStr;
    }
  };

  const constructSearchPayload = (): BookingSearchState => {
    const validViaStops = viaLocations.filter((l) => l && l.trim() !== '');
    const activeRoute =
      routeInfo ||
      estimateDrivingDistanceMatrix(
        pickupLocation,
        serviceType === 'local' ? 'Local Mysuru Coverage' : dropLocation,
        validViaStops
      );

    const effectiveDropDate = dropDate || returnDate || travelDate;

    return {
      serviceType,
      pickupLocation,
      dropLocation: serviceType === 'local' ? 'Local Mysuru City Coverage' : dropLocation,
      viaLocations: serviceType === 'roundtrip' ? validViaStops : undefined,
      travelDate,
      pickupDate: travelDate,
      dropDate: effectiveDropDate,
      returnDate: serviceType === 'roundtrip' ? returnDate || effectiveDropDate : effectiveDropDate,
      roundTripDays: serviceType === 'roundtrip' ? activeRoundTripDays : undefined,
      pickupTime,
      dropTime: returnTime,
      returnTime: serviceType === 'roundtrip' ? returnTime : undefined,
      durationHours,
      extraKm: serviceType === 'local' ? extraKm : undefined,
      airportTransferType,
      passengers,
      vehicleType,
      routeInfo: activeRoute,
    };
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    onSearch(constructSearchPayload());
  };

  const handleConfirmBookingClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    const searchData = constructSearchPayload();

    if (onConfirmBooking) {
      onConfirmBooking(searchData, vehicleType);
    } else {
      onSearch(searchData);
    }
  };

  const [autoResetSecondsLeft, setAutoResetSecondsLeft] = useState<number>(300); // 5 minutes = 300 seconds
  const [isResetting, setIsResetting] = useState<boolean>(false);
  const [resetSuccessFeedback, setResetSuccessFeedback] = useState<boolean>(false);
  const lastInteractionTimeRef = React.useRef<number>(Date.now());

  // Function to register user activity/interaction
  const registerUserActivity = useCallback(() => {
    lastInteractionTimeRef.current = Date.now();
    setAutoResetSecondsLeft(300);
  }, []);

  const handleResetForm = useCallback(() => {
    setIsResetting(true);
    setPickupLocation('');
    setDropLocation('');
    setViaLocations([]);
    setTravelDate(getTomorrowDate());
    setReturnDate(getDayAfterTomorrowDate());
    setPickupTime('09:00');
    setReturnTime('18:00');
    setDurationHours(8);
    setExtraKm(0);
    setPassengers(2);
    setVehicleType('all');
    setErrors({});
    lastInteractionTimeRef.current = Date.now();
    setAutoResetSecondsLeft(300);
    if (onReset) onReset();

    // Visual feedback
    setResetSuccessFeedback(true);
    setTimeout(() => {
      setIsResetting(false);
    }, 450);
    setTimeout(() => {
      setResetSuccessFeedback(false);
    }, 2200);
  }, [onReset]);

  // 5-minute automatic reset timer (runs strictly within this component)
  useEffect(() => {
    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - lastInteractionTimeRef.current) / 1000);
      const remaining = Math.max(0, 300 - elapsed);
      setAutoResetSecondsLeft(remaining);

      if (remaining <= 0) {
        handleResetForm();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [handleResetForm]);

  const minutesLeft = Math.floor(autoResetSecondsLeft / 60);
  const secondsLeft = autoResetSecondsLeft % 60;
  const formattedCountdown = `${minutesLeft}:${secondsLeft.toString().padStart(2, '0')}`;

  return (
    <div
      onKeyDown={registerUserActivity}
      onClick={registerUserActivity}
      className="bg-white rounded-2xl shadow-xl border border-slate-200/80 p-5 sm:p-7 relative z-20 transition-all"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Service Type Switcher */}
        <ServiceSelector
          selectedService={serviceType}
          onSelectService={handleServiceChange}
        />

        {/* Airport Transfer Specific Type Selector */}
        {serviceType === 'airport' && (
          <div className="bg-sky-50/70 p-3.5 rounded-2xl border border-sky-200/80 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-sky-950 uppercase tracking-wider flex items-center gap-1.5">
                <Plane className="w-4 h-4 text-sky-700" />
                <span>Airport Transfer Direction</span>
              </span>
              <span className="text-[11px] font-semibold text-sky-700">Flight Hub Transfer</span>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => handleAirportTransferToggle('pickup')}
                className={`py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  airportTransferType === 'pickup'
                    ? 'bg-sky-800 text-white shadow-sm ring-2 ring-sky-600/30'
                    : 'bg-white text-slate-700 hover:bg-sky-100/60 border border-slate-200'
                }`}
              >
                <span
                  className={`px-1.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                    airportTransferType === 'pickup'
                      ? 'bg-sky-950 text-sky-200'
                      : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  FROM
                </span>
                <span>Pickup from Airport</span>
              </button>
              <button
                type="button"
                onClick={() => handleAirportTransferToggle('drop')}
                className={`py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  airportTransferType === 'drop'
                    ? 'bg-sky-800 text-white shadow-sm ring-2 ring-sky-600/30'
                    : 'bg-white text-slate-700 hover:bg-sky-100/60 border border-slate-200'
                }`}
              >
                <span
                  className={`px-1.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                    airportTransferType === 'drop'
                      ? 'bg-sky-950 text-sky-200'
                      : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  TO
                </span>
                <span>Drop to Airport</span>
              </button>
            </div>
          </div>
        )}

        {/* Form Fields Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Pickup Location Field (FROM) */}
          <div className="relative">
            <LocationAutocompleteInput
              id="pickup-location-input"
              label={
                serviceType === 'airport' && airportTransferType === 'pickup'
                  ? 'FROM (Airport Pickup Terminal)'
                  : 'FROM (Pickup Location)'
              }
              placeholder={
                serviceType === 'airport' && airportTransferType === 'pickup'
                  ? 'e.g. KIAL Terminal 1 or Mysuru Airport'
                  : 'Enter pickup address, locality, or landmark'
              }
              value={pickupLocation}
              onChange={(val) => {
                setPickupLocation(val);
                if (errors.pickupLocation) setErrors({ ...errors, pickupLocation: '' });
              }}
              iconType={
                serviceType === 'airport' && airportTransferType === 'pickup'
                  ? 'airport'
                  : 'pickup'
              }
              error={errors.pickupLocation}
              required
              onClear={() => setPickupLocation('')}
            />
          </div>

          {/* Drop Location Field (TO) */}
          {serviceType !== 'local' ? (
            <div className="relative">
              <LocationAutocompleteInput
                id="drop-location-input"
                label={
                  serviceType === 'airport' && airportTransferType === 'drop'
                    ? 'TO (Airport Drop Terminal)'
                    : 'TO (Destination Location)'
                }
                placeholder={
                  serviceType === 'airport' && airportTransferType === 'drop'
                    ? 'e.g. KIAL Terminal 1 / Terminal 2'
                    : 'Enter destination city, hotel, or landmark'
                }
                value={dropLocation}
                onChange={(val) => {
                  setDropLocation(val);
                  if (errors.dropLocation) setErrors({ ...errors, dropLocation: '' });
                }}
                iconType={
                  serviceType === 'airport' && airportTransferType === 'drop' ? 'airport' : 'drop'
                }
                error={errors.dropLocation}
                required
                onClear={() => setDropLocation('')}
              />
            </div>
          ) : (
            <div>
              <div className="flex items-center justify-between min-h-[20px] mb-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wide flex items-center gap-1.5">
                  <ClockIcon className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Local Package Hours</span>
                </label>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-emerald-800">
                  <ClockIcon className="w-5 h-5" />
                </div>
                <select
                  value={durationHours}
                  onChange={(e) => setDurationHours(Number(e.target.value))}
                  className="w-full h-[52px] pl-11 pr-9 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white appearance-none transition-all font-medium cursor-pointer"
                >
                  <option value={4}>4 Hours / 40 Km Package</option>
                  <option value={8}>8 Hours / 80 Km Package (Recommended)</option>
                  <option value={12}>12 Hours / 120 Km Full Day Package</option>
                </select>
                <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-400">
                  <ChevronDown className="w-4 h-4" />
                </div>
              </div>
            </div>
          )}

          {/* PICKUP DATE */}
          <div>
            <div className="flex items-center justify-between min-h-[20px] mb-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wide flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-emerald-700" />
                <span>Pickup Date</span>
                <span className="text-red-500">*</span>
              </label>
              {travelDate && (
                <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                  {formatFriendlyDate(travelDate)}
                </span>
              )}
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-emerald-800">
                <Calendar className="w-5 h-5" />
              </div>
              <input
                id="pickup-date-input"
                type="date"
                min={getTodayDate()}
                value={travelDate}
                onChange={(e) => handleTravelDateChange(e.target.value)}
                className={`w-full h-[52px] pl-11 pr-3.5 bg-slate-50 border rounded-xl text-sm text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white transition-all ${
                  errors.travelDate ? 'border-red-500 ring-1 ring-red-500' : 'border-slate-300'
                }`}
                required
              />
            </div>
            {errors.travelDate && (
              <p className="text-xs text-red-600 mt-1 flex items-center gap-1 font-medium">
                <AlertCircle className="w-3.5 h-3.5" /> {errors.travelDate}
              </p>
            )}
          </div>

          {/* PICKUP TIME */}
          <div>
            <div className="flex items-center justify-between min-h-[20px] mb-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wide flex items-center gap-1.5">
                <ClockIcon className="w-3.5 h-3.5 text-emerald-700" />
                <span>Pickup Time</span>
                <span className="text-red-500">*</span>
              </label>
              <span className="text-[11px] font-medium text-slate-500">24hr / IST</span>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-emerald-800">
                <ClockIcon className="w-5 h-5" />
              </div>
              <input
                id="pickup-time-input"
                type="time"
                value={pickupTime}
                onChange={(e) => setPickupTime(e.target.value)}
                className="w-full h-[52px] pl-11 pr-3.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white transition-all"
                required
              />
            </div>
          </div>

          {/* DROP / RETURN DATE (Only for Round Trip) */}
          {serviceType === 'roundtrip' && (
            <div>
              <div className="flex items-center justify-between min-h-[20px] mb-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wide flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Drop / Return Date</span>
                  <span className="text-red-500">*</span>
                </label>
                {dropDate && (
                  <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                    {formatFriendlyDate(dropDate)}
                    {activeRoundTripDays > 1 && ` (${activeRoundTripDays}D)`}
                  </span>
                )}
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-emerald-800">
                  <Calendar className="w-5 h-5" />
                </div>
                <input
                  id="drop-date-input"
                  type="date"
                  min={travelDate || getTodayDate()}
                  value={dropDate}
                  onChange={(e) => handleDropDateChange(e.target.value)}
                  className={`w-full h-[52px] pl-11 pr-3.5 bg-slate-50 border rounded-xl text-sm text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white transition-all ${
                    errors.dropDate ? 'border-red-500 ring-1 ring-red-500' : 'border-slate-300'
                  }`}
                  required
                />
              </div>
            </div>
          )}

          {/* Vehicle Preference Filter */}
          <div>
            <div className="flex items-center justify-between min-h-[20px] mb-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wide flex items-center gap-1.5">
                <Car className="w-3.5 h-3.5 text-emerald-700" />
                <span>Vehicle Preference</span>
              </label>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-emerald-800">
                <Car className="w-5 h-5" />
              </div>
              <select
                id="vehicle-preference-select"
                value={vehicleType}
                onChange={(e) => setVehicleType(e.target.value)}
                className="w-full h-[52px] pl-11 pr-9 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white appearance-none transition-all font-medium cursor-pointer"
              >
                <option value="all">All Available Vehicles ({vehiclesData.length} Models)</option>
                {vehiclesData.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name} ({v.category} - {v.seatingCapacity} Seater)
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-400">
                <ChevronDown className="w-4 h-4" />
              </div>
            </div>
          </div>
        </div>

        {/* Dynamic Via Stop Inputs for Round Trip */}
        {serviceType === 'roundtrip' && viaLocations.length > 0 && (
          <div className="bg-emerald-50/50 p-4 rounded-2xl border border-emerald-200/80 space-y-3 animate-in fade-in duration-200">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-950 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-emerald-700" />
                <span>Enroute / Sightseeing Stops ({viaLocations.length})</span>
              </span>
              {viaLocations.length < 5 && (
                <button
                  type="button"
                  onClick={() => handleAddViaLocation('')}
                  className="text-xs font-bold text-emerald-800 hover:text-emerald-950 flex items-center gap-1 cursor-pointer bg-white px-2.5 py-1 rounded-lg border border-emerald-200 shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Another Stop</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {viaLocations.map((viaLoc, idx) => (
                <div key={idx} className="relative flex items-center gap-2">
                  <div className="flex-1">
                    <LocationAutocompleteInput
                      id={`via-stop-input-${idx}`}
                      label={`Stop #${idx + 1} (Enroute Location)`}
                      placeholder="e.g. Bandipur, Coorg, Wayanad..."
                      value={viaLoc}
                      onChange={(val) => handleUpdateViaLocation(idx, val)}
                      iconType="via"
                      onClear={() => handleUpdateViaLocation(idx, '')}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveViaLocation(idx)}
                    title="Remove this stop"
                    className="p-2.5 mt-5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors cursor-pointer border border-transparent hover:border-red-200"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Live Distance and Route Calculation Summary Card (Hidden when dedicated in-form fare cards are active) */}
        {serviceType !== 'oneway' && serviceType !== 'roundtrip' && serviceType !== 'local' && serviceType !== 'airport' && (
          <RouteSummaryCard routeInfo={routeInfo} isLoading={isCalculatingRoute} />
        )}

        {/* Dynamic Fare Engine Live Comparison Header / Badge */}
        {(selectedOneWayFare || selectedLocalFare || selectedRoundTripFare || selectedAirportFare) && onOpenFareEngine && (
          <div className="flex items-center justify-between px-1 text-xs">
            <div className="flex items-center gap-1.5 text-emerald-800 font-bold">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
              <span>Live Dynamic Fare Engine Active</span>
            </div>
            <button
              type="button"
              onClick={onOpenFareEngine}
              className="text-emerald-800 hover:text-emerald-950 font-extrabold underline underline-offset-2 flex items-center gap-1 cursor-pointer transition-colors text-[11px]"
            >
              <span>Compare All Vehicle Rates</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        )}

        {/* One Way Drop Selected Vehicle Fare Details Card */}
        {serviceType === 'oneway' && selectedOneWayFare && (
          <div className="bg-slate-50 border border-emerald-200/90 rounded-2xl p-4 sm:p-5 space-y-3.5 shadow-sm animate-in fade-in duration-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 border-b border-slate-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100/90 text-emerald-800 flex items-center justify-center font-black shrink-0">
                  <Car className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-700 bg-emerald-100/60 px-2 py-0.5 rounded">
                      One Way Drop Fare Details
                    </span>
                    <span className="text-xs font-semibold text-slate-500">
                      {selectedOneWayVehicle.category}
                    </span>
                  </div>
                  <h4 className="text-base font-extrabold text-slate-900 leading-tight">
                    {selectedOneWayVehicle.name}
                  </h4>
                </div>
              </div>

              <div className="text-left sm:text-right bg-white sm:bg-transparent p-2.5 sm:p-0 rounded-xl border sm:border-0 border-emerald-100">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide block">
                  Estimated Total Fare
                </span>
                <span className="text-xl sm:text-2xl font-black text-emerald-800">
                  Rs. {selectedOneWayFare.totalEstimatedFare.toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            {/* Inclusions breakdown */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <div className="bg-white p-2.5 rounded-xl border border-slate-200/80 flex items-center gap-2.5">
                <Route className="w-4 h-4 text-emerald-700 shrink-0" />
                <div>
                  <div className="text-[10px] font-bold uppercase text-slate-500">Estimated Route</div>
                  <div className="text-xs font-bold text-slate-800">
                    {routeInfo?.distanceKm ? `${routeInfo.distanceKm} KM` : 'Direct Route'}
                  </div>
                </div>
              </div>
              <div className="bg-white p-2.5 rounded-xl border border-slate-200/80 flex items-center gap-2.5">
                <ClockIcon className="w-4 h-4 text-emerald-700 shrink-0" />
                <div>
                  <div className="text-[10px] font-bold uppercase text-slate-500">Estimated ETA</div>
                  <div className="text-xs font-bold text-slate-800">
                    {routeInfo?.durationText || 'Standard Highway'}
                  </div>
                </div>
              </div>
              <div className="bg-white p-2.5 rounded-xl border border-slate-200/80 flex items-center gap-2.5">
                <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
                <div>
                  <div className="text-[10px] font-bold uppercase text-slate-500">EXTRA PER KM</div>
                  <div className="text-xs font-bold text-slate-800">
                    Rs. {(effectivePricingConfig.vehiclePricing[selectedOneWayVehicle.id]?.oneWayPerKmRate || effectivePricingConfig.vehiclePricing[selectedOneWayVehicle.id]?.perKmFare || Math.round(effectivePricingConfig.perKmFare * selectedOneWayVehicle.basePriceFactor)).toFixed(1)}/KM
                  </div>
                </div>
              </div>
            </div>

            <p className="text-[11px] text-slate-500 flex items-center gap-1.5 pt-0.5">
              <Info className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>* <strong className="text-[#F54900] font-bold no-underline">Note:</strong> Toll charges, parking fees, and state permit taxes are payable as per actuals during the trip.</span>
            </p>
          </div>
        )}

        {/* Local Package Selected Vehicle Fare Details Card */}
        {serviceType === 'local' && selectedLocalFare && (
          <div className="bg-slate-50 border border-emerald-200/90 rounded-2xl p-4 sm:p-5 space-y-3.5 shadow-sm animate-in fade-in duration-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 border-b border-slate-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100/90 text-emerald-800 flex items-center justify-center font-black shrink-0">
                  <Car className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-700 bg-emerald-100/60 px-2 py-0.5 rounded">
                      Local Travel Package Fare
                    </span>
                    <span className="text-xs font-semibold text-slate-500">
                      {selectedLocalVehicle.category}
                    </span>
                  </div>
                  <h4 className="text-base font-extrabold text-slate-900 leading-tight">
                    {selectedLocalVehicle.name}
                  </h4>
                </div>
              </div>

              <div className="text-left sm:text-right bg-white sm:bg-transparent p-2.5 sm:p-0 rounded-xl border sm:border-0 border-emerald-100">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide block">
                  Estimated Total Fare
                </span>
                <span className="text-xl sm:text-2xl font-black text-emerald-800">
                  Rs. {selectedLocalFare.totalEstimatedFare.toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            {/* Inclusions breakdown */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="bg-white p-2.5 rounded-xl border border-slate-200/80 flex items-center gap-2.5">
                <ClockIcon className="w-4 h-4 text-emerald-700 shrink-0" />
                <div>
                  <div className="text-[10px] font-bold uppercase text-slate-500">Package Duration</div>
                  <div className="text-xs font-bold text-slate-800">{durationHours} Hours Included</div>
                </div>
              </div>
              <div className="bg-white p-2.5 rounded-xl border border-slate-200/80 flex items-center gap-2.5">
                <Route className="w-4 h-4 text-emerald-700 shrink-0" />
                <div>
                  <div className="text-[10px] font-bold uppercase text-slate-500">Included Distance</div>
                  <div className="text-xs font-bold text-slate-800">
                    {durationHours * 10} KM Included
                    {extraKm > 0 && (
                      <span className="text-emerald-700 font-extrabold ml-1">
                        (+{extraKm} KM Extra)
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="bg-white p-2.5 rounded-xl border border-slate-200/80 flex items-center gap-2.5">
                <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
                <div>
                  <div className="text-[10px] font-bold uppercase text-slate-500">EXTRA PER KM</div>
                  <div className="text-xs font-bold text-slate-800">
                    Rs. {(effectivePricingConfig.vehiclePricing[selectedLocalVehicle.id]?.localPerKmRate || 12).toFixed(1)}/KM
                  </div>
                </div>
              </div>
              <div className="bg-white p-2.5 rounded-xl border border-slate-200/80 flex items-center gap-2.5">
                <Timer className="w-4 h-4 text-emerald-700 shrink-0" />
                <div>
                  <div className="text-[10px] font-bold uppercase text-slate-500">Extra Hour Rate</div>
                  <div className="text-xs font-bold text-slate-800">
                    Rs. {effectivePricingConfig.vehiclePricing[selectedLocalVehicle.id]?.perHourFare || effectivePricingConfig.perHourFare || 150}/Hr
                  </div>
                </div>
              </div>
            </div>

            <p className="text-[11px] text-slate-500 flex items-center gap-1.5 pt-0.5">
              <Info className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>* <strong className="text-[#F54900] font-bold no-underline">Note:</strong> Extra distance billed at Rs. {(effectivePricingConfig.vehiclePricing[selectedLocalVehicle.id]?.localPerKmRate || 12).toFixed(1)}/KM & extra hours billed at Rs. {effectivePricingConfig.vehiclePricing[selectedLocalVehicle.id]?.perHourFare || effectivePricingConfig.perHourFare || 150}/Hour beyond package limit. Parking/entry fees as per actuals.</span>
            </p>
          </div>
        )}

        {/* Round Trip Selected Vehicle Fare Details Card */}
        {serviceType === 'roundtrip' && selectedRoundTripFare && (
          <div className="bg-slate-50 border border-emerald-200/90 rounded-2xl p-4 sm:p-5 space-y-3.5 shadow-sm animate-in fade-in duration-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 border-b border-slate-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100/90 text-emerald-800 flex items-center justify-center font-black shrink-0">
                  <Car className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-700 bg-emerald-100/60 px-2 py-0.5 rounded">
                      Round Trip Fare Details
                    </span>
                    <span className="text-xs font-semibold text-slate-500">
                      {selectedRoundTripVehicle.category}
                    </span>
                  </div>
                  <h4 className="text-base font-extrabold text-slate-900 leading-tight">
                    {selectedRoundTripVehicle.name}
                  </h4>
                </div>
              </div>

              <div className="text-left sm:text-right bg-white sm:bg-transparent p-2.5 sm:p-0 rounded-xl border sm:border-0 border-emerald-100">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide block">
                  Estimated Total Fare
                </span>
                <span className="text-xl sm:text-2xl font-black text-emerald-800">
                  Rs. {selectedRoundTripFare.totalEstimatedFare.toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            {/* Inclusions breakdown */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <div className="bg-white p-2.5 rounded-xl border border-slate-200/80 flex items-center gap-2.5">
                <Calendar className="w-4 h-4 text-emerald-700 shrink-0" />
                <div>
                  <div className="text-[10px] font-bold uppercase text-slate-500">Trip Duration</div>
                  <div className="text-xs font-bold text-slate-800">
                    {activeRoundTripDays} Day{activeRoundTripDays > 1 ? 's' : ''} Round Trip
                  </div>
                </div>
              </div>
              <div className="bg-white p-2.5 rounded-xl border border-slate-200/80 flex items-center gap-2.5">
                <Route className="w-4 h-4 text-emerald-700 shrink-0" />
                <div>
                  <div className="text-[10px] font-bold uppercase text-slate-500">Included Distance</div>
                  <div className="text-xs font-bold text-slate-800">
                    Min. {activeIncludedMinKm.toLocaleString('en-IN')} KM
                  </div>
                </div>
              </div>
              <div className="bg-white p-2.5 rounded-xl border border-slate-200/80 flex items-center gap-2.5">
                <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
                <div>
                  <div className="text-[10px] font-bold uppercase text-slate-500">EXTRA PER KM</div>
                  <div className="text-xs font-bold text-slate-800">
                    Rs. {(effectivePricingConfig.vehiclePricing[selectedRoundTripVehicle.id]?.perKmFare || Math.round(effectivePricingConfig.perKmFare * selectedRoundTripVehicle.basePriceFactor)).toFixed(1)}/KM
                  </div>
                </div>
              </div>
            </div>

            {/* Breakdown summary */}
            <div className="bg-white rounded-xl p-3 border border-slate-200/80 space-y-1.5 text-xs">
              <div className="font-bold text-slate-700 flex items-center justify-between pb-1 border-b border-slate-100">
                <span>Fare Breakdown Details</span>
                <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">Transparent Pricing</span>
              </div>
              {selectedRoundTripFare.breakdown.map((item, idx) => (
                <div key={idx} className="flex justify-between text-slate-600">
                  <span>{item.label}</span>
                  <span className="font-semibold text-slate-900">Rs. {item.amount.toLocaleString('en-IN')}</span>
                </div>
              ))}
            </div>

            <p className="text-[11px] text-slate-500 flex items-center gap-1.5 pt-0.5">
              <Info className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>* <strong className="text-[#F54900] font-bold no-underline">Note:</strong> Toll charges, parking, and state permit taxes are payable as per actuals during the journey.</span>
            </p>
          </div>
        )}

        {/* Airport Transfer Selected Vehicle Fare Details Card */}
        {serviceType === 'airport' && selectedAirportFare && (
          <div className="bg-slate-50 border border-emerald-200/90 rounded-2xl p-4 sm:p-5 space-y-3.5 shadow-sm animate-in fade-in duration-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 border-b border-slate-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100/90 text-emerald-800 flex items-center justify-center font-black shrink-0">
                  <Plane className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-700 bg-emerald-100/60 px-2 py-0.5 rounded">
                      Airport Transfer Fare Details
                    </span>
                    <span className="text-xs font-semibold text-slate-500">
                      {selectedAirportVehicle.category}
                    </span>
                  </div>
                  <h4 className="text-base font-extrabold text-slate-900 leading-tight">
                    {selectedAirportVehicle.name}
                  </h4>
                </div>
              </div>

              <div className="text-left sm:text-right bg-white sm:bg-transparent p-2.5 sm:p-0 rounded-xl border sm:border-0 border-emerald-100">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide block">
                  Estimated Total Fare
                </span>
                <span className="text-xl sm:text-2xl font-black text-emerald-800">
                  Rs. {selectedAirportFare.totalEstimatedFare.toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            {/* Inclusions breakdown */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <div className="bg-white p-2.5 rounded-xl border border-slate-200/80 flex items-center gap-2.5">
                <Plane className="w-4 h-4 text-emerald-700 shrink-0" />
                <div>
                  <div className="text-[10px] font-bold uppercase text-slate-500">Transfer Direction</div>
                  <div className="text-xs font-bold text-slate-800">
                    {airportTransferType === 'pickup' ? 'Airport Pickup' : 'Airport Drop'}
                  </div>
                </div>
              </div>
              <div className="bg-white p-2.5 rounded-xl border border-slate-200/80 flex items-center gap-2.5">
                <Route className="w-4 h-4 text-emerald-700 shrink-0" />
                <div>
                  <div className="text-[10px] font-bold uppercase text-slate-500">Route Distance</div>
                  <div className="text-xs font-bold text-slate-800">
                    {routeInfo?.distanceKm ? `${routeInfo.distanceKm} KM` : 'Dedicated Corridor'}
                  </div>
                </div>
              </div>
              <div className="bg-white p-2.5 rounded-xl border border-slate-200/80 flex items-center gap-2.5">
                <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
                <div>
                  <div className="text-[10px] font-bold uppercase text-slate-500">EXTRA PER KM</div>
                  <div className="text-xs font-bold text-slate-800">
                    Rs. {(effectivePricingConfig.vehiclePricing[selectedAirportVehicle.id]?.airportPerKmRate || effectivePricingConfig.vehiclePricing[selectedAirportVehicle.id]?.perKmFare || 14).toFixed(1)}/KM
                  </div>
                </div>
              </div>
            </div>

            <p className="text-[11px] text-slate-500 flex items-center gap-1.5 pt-0.5">
              <Info className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>* <strong className="text-[#F54900] font-bold no-underline">Note:</strong> Airport terminal parking tickets and expressway toll charges are payable as per actuals.</span>
            </p>
          </div>
        )}

        {/* Action Buttons Row */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3.5 pt-5 border-t border-slate-200/80">
          <div className="flex items-center gap-2.5 w-full sm:w-auto order-2 sm:order-1">
            <button
              type="button"
              id="reset-booking-details-btn"
              onClick={handleResetForm}
              disabled={isResetting}
              aria-label="Reset all search details"
              className={`group relative w-full sm:w-auto px-4 py-2.5 text-xs font-bold rounded-xl transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer border active:scale-95 select-none ${
                resetSuccessFeedback
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300 shadow-xs'
                  : 'bg-slate-50/80 hover:bg-slate-100 text-slate-600 hover:text-slate-900 border-slate-200 hover:border-slate-300 shadow-2xs hover:shadow-xs'
              }`}
            >
              <span className="relative flex items-center justify-center">
                {resetSuccessFeedback ? (
                  <Check className="w-3.5 h-3.5 text-emerald-600 animate-in zoom-in-50 duration-200" />
                ) : (
                  <RotateCcw
                    className={`w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 transition-transform duration-500 ease-out ${
                      isResetting ? '-rotate-180 scale-110 text-emerald-700' : 'group-hover:-rotate-45'
                    }`}
                  />
                )}
              </span>

              <span>{resetSuccessFeedback ? 'Details Cleared' : 'Reset Details'}</span>

              {/* Micro badge when reset active */}
              {resetSuccessFeedback && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
              )}
            </button>

            <div
              title="Form details auto-reset after 5 minutes of inactivity"
              className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100/90 hover:bg-slate-200/70 text-[11px] font-semibold text-slate-500 border border-slate-200/70 transition-colors"
            >
              <Timer className="w-3 h-3 text-slate-400" />
              <span>Auto-reset in {formattedCountdown}</span>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto order-1 sm:order-2">
            <button
              type="button"
              id="confirm-booking-btn"
              onClick={handleConfirmBookingClick}
              className="group relative w-full sm:w-auto overflow-hidden bg-gradient-to-r from-emerald-800 via-emerald-700 to-emerald-800 hover:from-emerald-900 hover:via-emerald-800 hover:to-emerald-900 text-white font-black text-sm sm:text-base px-8 py-3.5 rounded-xl shadow-lg hover:shadow-xl hover:shadow-emerald-900/25 transition-all duration-200 active:scale-[0.98] flex items-center justify-center gap-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 cursor-pointer border border-emerald-600/40"
            >
              {/* Shimmer light bar animation */}
              <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full duration-1000 bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform pointer-events-none" />

              <div className="w-5 h-5 rounded-full bg-emerald-600/90 text-white flex items-center justify-center shadow-xs shrink-0 group-hover:bg-white group-hover:text-emerald-800 transition-colors">
                <CheckCircle2 className="w-3.5 h-3.5" />
              </div>
              <span className="tracking-wide">Confirm Booking</span>
              <ArrowRight className="w-4 h-4 text-emerald-200 group-hover:text-white group-hover:translate-x-1 transition-all" />
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
