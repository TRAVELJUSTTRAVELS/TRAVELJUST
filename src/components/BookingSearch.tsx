import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  ArrowLeftRight,
  ChevronDown,
  Plus,
  Trash2,
  Plane,
  RotateCcw,
  Check,
  AlertCircle,
  Search,
  Route,
  Sparkles,
  Loader2,
} from 'lucide-react';
import {
  BookingSearchState,
  ServiceType,
  AirportTransferType,
  CalculatedRouteInfo,
  PricingConfig,
  PlaceSuggestion,
} from '../types';
import { ServiceSelector } from './ServiceSelector';
import { LocationAutocompleteInput } from './LocationAutocompleteInput';
import { CalendarPopover } from './CalendarPopover';
import { calculateRouteDistance, estimateDrivingDistanceMatrix } from '../services/googleMapsService';
import { calculateRoundTripDays } from '../utils/fareCalculator';
import { defaultPricingConfig } from '../config/siteConfig';

interface BookingSearchProps {
  initialState?: Partial<BookingSearchState>;
  onSearch: (searchState: BookingSearchState) => void;
  onConfirmBooking?: (searchState: BookingSearchState, preferredVehicleId?: string) => void;
  onReset?: () => void;
  isCompact?: boolean;
  pricingConfig?: PricingConfig;
}

const TIME_OPTIONS = [
  '12:00 AM', '12:30 AM', '01:00 AM', '01:30 AM', '02:00 AM', '02:30 AM',
  '03:00 AM', '03:30 AM', '04:00 AM', '04:30 AM', '05:00 AM', '05:30 AM',
  '06:00 AM', '06:30 AM', '07:00 AM', '07:30 AM', '08:00 AM', '08:30 AM',
  '09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
  '12:00 PM', '12:30 PM', '01:00 PM', '01:30 PM', '02:00 PM', '02:30 PM',
  '03:00 PM', '03:30 PM', '04:00 PM', '04:30 PM', '05:00 PM', '05:30 PM',
  '06:00 PM', '06:30 PM', '07:00 PM', '07:30 PM', '08:00 PM', '08:30 PM',
  '09:00 PM', '09:30 PM', '10:00 PM', '10:30 PM', '11:00 PM', '11:30 PM'
];

// Helper to convert date to "10 Sept 2026" display format matching screenshots
const formatDateToSeptFormat = (isoDate: string): string => {
  if (!isoDate) return '';
  const parts = isoDate.split('-');
  if (parts.length === 3) {
    const year = parts[0];
    const monthIndex = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec'];
    const monthName = months[monthIndex] || parts[1];
    return `${day} ${monthName} ${year}`;
  }
  return isoDate;
};

// 24-hour time options matching screenshots (e.g. 19:25, 23:25)
const TIME_OPTIONS_24H = [
  '00:00', '00:30', '01:00', '01:30', '02:00', '02:30',
  '03:00', '03:30', '04:00', '04:30', '05:00', '05:30',
  '06:00', '06:30', '07:00', '07:30', '08:00', '08:30',
  '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
  '15:00', '15:30', '16:00', '16:30', '17:00', '17:30',
  '18:00', '18:30', '19:00', '19:25', '19:30', '20:00',
  '20:30', '21:00', '21:30', '22:00', '22:30', '23:00',
  '23:25', '23:30'
];

// Helper to convert DD-MM-YYYY display from YYYY-MM-DD
const formatDateToDDMMYYYY = (isoDate: string): string => {
  if (!isoDate) return '';
  const parts = isoDate.split('-');
  if (parts.length === 3) {
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
  }
  return isoDate;
};

// Helper to normalize 24-hour time to 12-hour format with AM/PM
const formatTo12Hour = (timeStr: string): string => {
  if (!timeStr) return '07:00 AM';
  if (timeStr.includes('AM') || timeStr.includes('PM')) return timeStr;
  const [hStr, mStr] = timeStr.split(':');
  let hour = parseInt(hStr, 10);
  const minute = mStr || '00';
  const ampm = hour >= 12 ? 'PM' : 'AM';
  hour = hour % 12;
  if (hour === 0) hour = 12;
  return `${hour.toString().padStart(2, '0')}:${minute} ${ampm}`;
};

// Helper to convert 12-hour AM/PM to 24-hour HH:mm
const formatTo24Hour = (time12: string): string => {
  if (!time12) return '07:00';
  if (!time12.includes('AM') && !time12.includes('PM')) return time12;
  const [time, modifier] = time12.split(' ');
  const [hStr, mStr] = time.split(':');
  let h = parseInt(hStr, 10);
  if (modifier === 'PM' && h < 12) h += 12;
  if (modifier === 'AM' && h === 12) h = 0;
  return `${h.toString().padStart(2, '0')}:${mStr || '00'}`;
};

export const BookingSearch: React.FC<BookingSearchProps> = ({
  initialState,
  onSearch,
  onConfirmBooking,
  onReset,
  pricingConfig,
}) => {
  // Today's date in local calendar YYYY-MM-DD
  const getTodayDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const getTomorrowDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const year = tomorrow.getFullYear();
    const month = String(tomorrow.getMonth() + 1).padStart(2, '0');
    const day = String(tomorrow.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [serviceType, setServiceType] = useState<ServiceType>(
    initialState?.serviceType || 'oneway'
  );

  // Default locations: blank for customer input before typing
  const [pickupLocation, setPickupLocation] = useState(
    initialState?.pickupLocation || ''
  );
  const [pickupLocationObj, setPickupLocationObj] = useState<PlaceSuggestion | undefined>(
    initialState?.pickupLocationObj || undefined
  );
  const [dropLocation, setDropLocation] = useState(
    initialState?.dropLocation || ''
  );
  const [dropLocationObj, setDropLocationObj] = useState<PlaceSuggestion | undefined>(
    initialState?.dropLocationObj || undefined
  );

  // Default travel date: today's date dynamically
  const [travelDate, setTravelDate] = useState(
    initialState?.travelDate || initialState?.pickupDate || getTodayDate()
  );

  // Return date for round trip
  const [dropDate, setDropDate] = useState(
    initialState?.dropDate || initialState?.returnDate || getTomorrowDate()
  );
  const [returnDate, setReturnDate] = useState(
    initialState?.returnDate || initialState?.dropDate || getTomorrowDate()
  );

  // Default pickup time in 12-hour AM/PM format
  const [pickupTime, setPickupTime] = useState(
    initialState?.pickupTime ? formatTo12Hour(initialState.pickupTime) : '07:00 PM'
  );
  const [returnTime, setReturnTime] = useState(
    initialState?.returnTime ? formatTo12Hour(initialState.returnTime) : '11:00 PM'
  );

  const [durationHours, setDurationHours] = useState<number>(initialState?.durationHours || 8);
  const [airportTransferType, setAirportTransferType] = useState<AirportTransferType>(
    initialState?.airportTransferType || 'pickup'
  );
  const [flightNumber, setFlightNumber] = useState<string>(initialState?.flightNumber || '');
  const [passengers, setPassengers] = useState<number>(initialState?.passengers || 2);
  const [viaLocations, setViaLocations] = useState<string[]>(initialState?.viaLocations || []);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Refs for HTML date pickers
  const pickupDateInputRef = useRef<HTMLInputElement>(null);
  const dropDateInputRef = useRef<HTMLInputElement>(null);
  type ActiveCalendarKey = 'rt-departure' | 'rt-return' | 'ow-departure' | 'local-departure' | 'airport-departure';

  const [activeCalendar, setActiveCalendar] = useState<ActiveCalendarKey | null>(null);

  // Live route calculation state
  const [routeInfo, setRouteInfo] = useState<CalculatedRouteInfo | null>(
    initialState?.routeInfo || null
  );
  const [isCalculatingRoute, setIsCalculatingRoute] = useState(false);

  // Reset and auto-reset states
  const [autoResetSecondsLeft, setAutoResetSecondsLeft] = useState<number>(300);
  const [isResetting, setIsResetting] = useState<boolean>(false);
  const [resetSuccessFeedback, setResetSuccessFeedback] = useState<boolean>(false);
  const lastInteractionTimeRef = useRef<number>(Date.now());

  // User activity tracker for auto-reset
  const registerUserActivity = useCallback(() => {
    lastInteractionTimeRef.current = Date.now();
    setAutoResetSecondsLeft(300);
  }, []);

  // Compute route distance dynamically using Place ID and exact coordinates
  const computeActiveRoute = useCallback(async () => {
    if (serviceType === 'local') {
      setRouteInfo(null);
      setIsCalculatingRoute(false);
      return;
    }

    const origin = pickupLocation.trim();
    const destination = dropLocation.trim();

    if (!origin || !destination) {
      setRouteInfo(null);
      return;
    }

    setIsCalculatingRoute(true);
    try {
      const validStops = viaLocations.filter((s) => s && s.trim().length > 0);
      const originCoords =
        pickupLocationObj?.lat && pickupLocationObj?.lng
          ? { lat: pickupLocationObj.lat, lng: pickupLocationObj.lng }
          : undefined;
      const destCoords =
        dropLocationObj?.lat && dropLocationObj?.lng
          ? { lat: dropLocationObj.lat, lng: dropLocationObj.lng }
          : undefined;

      const computed = await calculateRouteDistance(
        origin,
        destination,
        validStops,
        originCoords,
        destCoords,
        pickupLocationObj?.placeId,
        dropLocationObj?.placeId
      );
      setRouteInfo(computed);
    } catch (err) {
      console.debug('Route calculation fallback:', err);
      const fallback = estimateDrivingDistanceMatrix(origin, destination, viaLocations);
      setRouteInfo(fallback);
    } finally {
      setIsCalculatingRoute(false);
    }
  }, [pickupLocation, dropLocation, viaLocations, serviceType, pickupLocationObj, dropLocationObj]);

  useEffect(() => {
    const timer = setTimeout(() => {
      computeActiveRoute();
    }, 400);
    return () => clearTimeout(timer);
  }, [computeActiveRoute]);

  const handleTravelDateChange = (newDate: string) => {
    registerUserActivity();
    setTravelDate(newDate);
    if (errors.travelDate) setErrors((prev) => ({ ...prev, travelDate: '' }));
    if (dropDate && dropDate < newDate) {
      setDropDate(newDate);
      setReturnDate(newDate);
      if (errors.dropDate) setErrors((prev) => ({ ...prev, dropDate: '' }));
    }
  };

  const handleDropDateChange = (newDate: string) => {
    registerUserActivity();
    setDropDate(newDate);
    setReturnDate(newDate);
    if (newDate < travelDate) {
      setErrors((prev) => ({ ...prev, dropDate: 'Return date cannot be earlier than departure date.' }));
    } else if (errors.dropDate) {
      setErrors((prev) => ({ ...prev, dropDate: '' }));
    }
  };

  const toggleCalendar = (calKey: ActiveCalendarKey, e?: React.SyntheticEvent) => {
    e?.stopPropagation();
    registerUserActivity();
    setActiveCalendar((prev) => (prev === calKey ? null : calKey));
  };

  const handleSwapLocations = () => {
    registerUserActivity();
    const tempLoc = pickupLocation;
    const tempObj = pickupLocationObj;
    setPickupLocation(dropLocation);
    setPickupLocationObj(dropLocationObj);
    setDropLocation(tempLoc);
    setDropLocationObj(tempObj);
    if (errors.pickupLocation || errors.dropLocation) {
      setErrors((prev) => ({ ...prev, pickupLocation: '', dropLocation: '' }));
    }
  };

  const handleAddStop = () => {
    registerUserActivity();
    setViaLocations((prev) => [...prev, '']);
  };

  const handleUpdateStop = (index: number, val: string) => {
    registerUserActivity();
    setViaLocations((prev) => {
      const updated = [...prev];
      updated[index] = val;
      return updated;
    });
  };

  const handleRemoveStop = (index: number) => {
    registerUserActivity();
    setViaLocations((prev) => prev.filter((_, i) => i !== index));
  };

  const handleServiceChange = (newService: ServiceType) => {
    registerUserActivity();
    setServiceType(newService);
    setErrors({});
    if (newService === 'local') {
      setRouteInfo(null);
      setViaLocations([]);
    }
  };

  const handleResetForm = useCallback(() => {
    setIsResetting(true);
    setPickupLocation('');
    setPickupLocationObj(undefined);
    setDropLocation('');
    setDropLocationObj(undefined);
    setRouteInfo(null);
    setViaLocations([]);
    setTravelDate(getTodayDate());
    setDropDate(getTomorrowDate());
    setReturnDate(getTomorrowDate());
    setPickupTime('07:00');
    setReturnTime('19:00');
    setDurationHours(8);
    setFlightNumber('');
    setErrors({});
    lastInteractionTimeRef.current = Date.now();
    setAutoResetSecondsLeft(300);
    if (onResetRef.current) onResetRef.current();

    setResetSuccessFeedback(true);
    setTimeout(() => {
      setIsResetting(false);
    }, 350);
    setTimeout(() => {
      setResetSuccessFeedback(false);
    }, 2000);
  }, []);

  const onResetRef = useRef(onReset);
  useEffect(() => {
    onResetRef.current = onReset;
  }, [onReset]);

  const handleResetFormRef = useRef(handleResetForm);
  useEffect(() => {
    handleResetFormRef.current = handleResetForm;
  }, [handleResetForm]);

  // 5-minute inactivity auto-reset timer
  useEffect(() => {
    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - lastInteractionTimeRef.current) / 1000);
      const remaining = Math.max(0, 300 - elapsed);
      setAutoResetSecondsLeft((prev) => (prev !== remaining ? remaining : prev));

      if (remaining <= 0) {
        handleResetFormRef.current?.();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!pickupLocation.trim()) {
      newErrors.pickupLocation = 'Please select a valid pickup location.';
    }

    if (serviceType !== 'local') {
      if (!dropLocation.trim()) {
        newErrors.dropLocation = 'Please select a valid destination.';
      } else if (pickupLocation.trim().toLowerCase() === dropLocation.trim().toLowerCase()) {
        newErrors.dropLocation = 'Pickup and destination cannot be the same.';
      }
    }

    if (!travelDate) {
      newErrors.travelDate = 'Please select a valid pickup date.';
    }

    if (!pickupTime) {
      newErrors.pickupTime = 'Please select pickup time.';
    }

    if (serviceType === 'roundtrip') {
      if (!dropDate) {
        newErrors.dropDate = 'Please select a valid return date.';
      } else if (dropDate < travelDate) {
        newErrors.dropDate = 'Return date cannot be earlier than departure date.';
      }
    }

    if (serviceType !== 'local' && routeInfo?.validationStatus === 'NO_ROUTE_FOUND') {
      newErrors.dropLocation = 'Unable to calculate the route. Please select the locations from the suggested Google Maps results.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const constructSearchPayload = (): BookingSearchState => {
    const validViaStops = viaLocations.filter((v) => v.trim().length > 0);
    const activeRoute =
      serviceType === 'local'
        ? {
            distanceKm: (durationHours || 8) * 10,
            durationMinutes: (durationHours || 8) * 60,
            durationText: `${durationHours || 8} Hours`,
            routeSummary: `Mysuru Local Hourly Rental (${durationHours || 8} Hrs / ${(durationHours || 8) * 10} Km Package)`,
            highwayCorridor: 'Mysuru City & Local Sightseeing Coverage',
            tollEstimate: 0,
            recommendedService: 'local' as const,
            dataSource: 'intelligent_matrix' as const,
          }
        : routeInfo ||
          estimateDrivingDistanceMatrix(
            pickupLocation,
            dropLocation,
            validViaStops,
            pickupLocationObj?.lat && pickupLocationObj?.lng ? { lat: pickupLocationObj.lat, lng: pickupLocationObj.lng } : undefined,
            dropLocationObj?.lat && dropLocationObj?.lng ? { lat: dropLocationObj.lat, lng: dropLocationObj.lng } : undefined
          );

    const activeRoundTripDays = calculateRoundTripDays(travelDate, returnDate || dropDate);

    return {
      serviceType,
      pickupLocation: pickupLocation.trim(),
      pickupLocationObj,
      dropLocation: serviceType === 'local' ? 'Local Mysuru City Coverage' : dropLocation.trim(),
      dropLocationObj,
      viaLocations: validViaStops.length > 0 ? validViaStops : undefined,
      travelDate,
      pickupDate: travelDate,
      dropDate: serviceType === 'roundtrip' ? dropDate : travelDate,
      returnDate: serviceType === 'roundtrip' ? returnDate || dropDate : travelDate,
      roundTripDays: serviceType === 'roundtrip' ? activeRoundTripDays : undefined,
      pickupTime: formatTo12Hour(pickupTime),
      dropTime: serviceType === 'roundtrip' ? formatTo12Hour(returnTime) : undefined,
      returnTime: serviceType === 'roundtrip' ? formatTo12Hour(returnTime) : undefined,
      durationHours: serviceType === 'local' ? durationHours : 8,
      airportTransferType,
      passengers,
      vehicleType: 'all',
      flightNumber: flightNumber.trim() || undefined,
      routeInfo: activeRoute,
    };
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    registerUserActivity();
    if (!validateForm()) return;
    const searchData = constructSearchPayload();
    if (searchData.serviceType !== 'local' && searchData.routeInfo?.validationStatus === 'NO_ROUTE_FOUND') {
      setErrors((prev) => ({
        ...prev,
        dropLocation: 'Unable to calculate the route. Please select the locations from the suggested Google Maps results.',
      }));
      return;
    }
    onSearch(searchData);
  };

  return (
    <div
      id="travel-just-booking-widget"
      onKeyDown={registerUserActivity}
      onClick={registerUserActivity}
      className="rounded-[28px] shadow-xl border border-slate-200/80 transition-all relative z-20 w-full bg-[#ECFDF5]"
    >
      {/* Top Banner with HEX ECFDF5 background and centered tab pill */}
      <div className="pt-6 pb-5 px-4 sm:px-6 md:px-8 flex flex-col items-center justify-center bg-[#ECFDF5] rounded-t-[28px]">
        <ServiceSelector
          selectedService={serviceType}
          onSelectService={handleServiceChange}
        />
      </div>

      {/* Main white form container */}
      <div className="bg-white rounded-b-[28px] p-4 sm:p-6 md:p-7 lg:p-8">
        <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6">
          {/* 1. OUTSTATION ROUND-TRIP (6 BOXES) */}
          {serviceType === 'roundtrip' && (
            <div className="w-full space-y-4">
              <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-2.5 xl:gap-3">
                {/* FROM */}
                <div className="flex-1 min-w-0">
                  <LocationAutocompleteInput
                    id="rt-from-location-input"
                    label="From"
                    variant="card-box"
                    placeholder="Enter pickup city or landmark"
                    value={pickupLocation}
                    selectedPlace={pickupLocationObj}
                    allowCurrentLocation={false}
                    onChange={(val, suggestion) => {
                      setPickupLocation(val);
                      if (suggestion) setPickupLocationObj(suggestion);
                      if (errors.pickupLocation) setErrors((prev) => ({ ...prev, pickupLocation: '' }));
                    }}
                    error={errors.pickupLocation}
                    onClear={() => {
                      setPickupLocation('');
                      setPickupLocationObj(undefined);
                    }}
                  />
                </div>

                {/* SWAP BUTTON */}
                <div className="flex justify-center items-center -my-1 lg:my-0 lg:-mx-4 z-10 shrink-0">
                  <button
                    type="button"
                    id="rt-swap-locations-btn"
                    onClick={handleSwapLocations}
                    title="Swap From and To"
                    aria-label="Swap locations"
                    className="w-8 h-8 rounded-full bg-white border border-slate-200 shadow-sm flex items-center justify-center hover:bg-slate-50 active:scale-95 transition-all text-slate-700 cursor-pointer"
                  >
                    <ArrowLeftRight className="w-3.5 h-3.5 text-slate-700" />
                  </button>
                </div>

                {/* TO */}
                <div className="flex-1 min-w-0 relative">
                  <LocationAutocompleteInput
                    id="rt-to-location-input"
                    label="To"
                    variant="card-box"
                    placeholder="Enter destination city or landmark"
                    value={dropLocation}
                    selectedPlace={dropLocationObj}
                    allowCurrentLocation={false}
                    onChange={(val, suggestion) => {
                      setDropLocation(val);
                      if (suggestion) setDropLocationObj(suggestion);
                      if (errors.dropLocation) setErrors((prev) => ({ ...prev, dropLocation: '' }));
                    }}
                    error={errors.dropLocation}
                    onClear={() => {
                      setDropLocation('');
                      setDropLocationObj(undefined);
                    }}
                  />
                </div>

                {/* DEPARTURE */}
                <div
                  id="rt-departure-date-box"
                  role="button"
                  tabIndex={0}
                  aria-label="Select departure date"
                  aria-haspopup="dialog"
                  aria-expanded={activeCalendar === 'rt-departure'}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      toggleCalendar('rt-departure', e);
                    }
                  }}
                  onClick={(e) => toggleCalendar('rt-departure', e)}
                  className={`w-full lg:w-36 xl:w-40 relative border rounded-xl bg-white p-3 sm:py-3 sm:px-3.5 transition-all flex flex-col justify-between min-h-[72px] sm:min-h-[76px] cursor-pointer shadow-2xs shrink-0 select-none ${
                    errors.travelDate
                      ? 'border-rose-400 ring-1 ring-rose-300'
                      : activeCalendar === 'rt-departure'
                      ? 'border-emerald-600 ring-2 ring-emerald-500/30'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between text-slate-500 text-xs sm:text-[13px] font-normal leading-none mb-1 pointer-events-none">
                    <span className="flex items-center gap-1">
                      Departure <ChevronDown className={`w-3.5 h-3.5 text-indigo-900 transition-transform ${activeCalendar === 'rt-departure' ? 'rotate-180' : ''}`} />
                    </span>
                    {errors.travelDate && (
                      <AlertCircle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                    )}
                  </div>
                  <div className="text-slate-900 font-medium text-sm sm:text-base leading-tight truncate pointer-events-none">
                    {formatDateToSeptFormat(travelDate)}
                  </div>
                  {errors.travelDate && (
                    <span className="text-[10px] text-rose-600 font-medium truncate block leading-tight pointer-events-none">
                      {errors.travelDate}
                    </span>
                  )}
                  <input
                    ref={pickupDateInputRef}
                    id="rt-departure-date-input"
                    type="date"
                    min={getTodayDate()}
                    value={travelDate}
                    tabIndex={-1}
                    aria-hidden="true"
                    onChange={(e) => handleTravelDateChange(e.target.value)}
                    onClick={(e) => toggleCalendar('rt-departure', e)}
                    className="sr-only"
                    aria-label="Select departure date"
                  />

                  <CalendarPopover
                    isOpen={activeCalendar === 'rt-departure'}
                    onClose={() => setActiveCalendar(null)}
                    selectedDate={travelDate}
                    minDate={getTodayDate()}
                    title="Departure Date"
                    align="left"
                    onSelectDate={(newDate) => {
                      handleTravelDateChange(newDate);
                      setActiveCalendar(null);
                    }}
                  />
                </div>

                {/* RETURN */}
                <div
                  id="rt-return-date-box"
                  role="button"
                  tabIndex={0}
                  aria-label="Select return date"
                  aria-haspopup="dialog"
                  aria-expanded={activeCalendar === 'rt-return'}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      toggleCalendar('rt-return', e);
                    }
                  }}
                  onClick={(e) => toggleCalendar('rt-return', e)}
                  className={`w-full lg:w-36 xl:w-40 relative border rounded-xl bg-white p-3 sm:py-3 sm:px-3.5 transition-all flex flex-col justify-between min-h-[72px] sm:min-h-[76px] cursor-pointer shadow-2xs shrink-0 select-none ${
                    errors.dropDate
                      ? 'border-rose-400 ring-1 ring-rose-300'
                      : activeCalendar === 'rt-return'
                      ? 'border-emerald-600 ring-2 ring-emerald-500/30'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between text-slate-500 text-xs sm:text-[13px] font-normal leading-none mb-1 pointer-events-none">
                    <span className="flex items-center gap-1">
                      Return <ChevronDown className={`w-3.5 h-3.5 text-indigo-900 transition-transform ${activeCalendar === 'rt-return' ? 'rotate-180' : ''}`} />
                    </span>
                    {errors.dropDate && (
                      <AlertCircle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                    )}
                  </div>
                  <div className="text-slate-900 font-medium text-sm sm:text-base leading-tight truncate pointer-events-none">
                    {formatDateToSeptFormat(dropDate || returnDate || travelDate)}
                  </div>
                  {errors.dropDate && (
                    <span className="text-[10px] text-rose-600 font-medium truncate block leading-tight pointer-events-none">
                      {errors.dropDate}
                    </span>
                  )}
                  <input
                    ref={dropDateInputRef}
                    id="rt-return-date-input"
                    type="date"
                    min={travelDate || getTodayDate()}
                    value={dropDate}
                    tabIndex={-1}
                    aria-hidden="true"
                    onChange={(e) => handleDropDateChange(e.target.value)}
                    onClick={(e) => toggleCalendar('rt-return', e)}
                    className="sr-only"
                    aria-label="Select return date"
                  />

                  <CalendarPopover
                    isOpen={activeCalendar === 'rt-return'}
                    onClose={() => setActiveCalendar(null)}
                    selectedDate={dropDate || returnDate || travelDate}
                    minDate={travelDate || getTodayDate()}
                    title="Return Date"
                    align="right"
                    onSelectDate={(newDate) => {
                      handleDropDateChange(newDate);
                      setActiveCalendar(null);
                    }}
                  />
                </div>

                {/* PICKUP-TIME */}
                <div className="w-full lg:w-32 xl:w-36 relative border border-slate-200 rounded-xl bg-white p-3 sm:py-3 sm:px-3 hover:border-slate-300 transition-all flex flex-col justify-between min-h-[72px] sm:min-h-[76px] shadow-2xs shrink-0">
                  <div className="text-slate-500 text-xs sm:text-[13px] font-normal leading-none mb-1">
                    Pickup-Time
                  </div>
                  <div className="relative flex items-center">
                    <select
                      value={formatTo12Hour(pickupTime)}
                      onChange={(e) => setPickupTime(e.target.value)}
                      className="w-full bg-transparent border-none p-0 text-slate-900 font-semibold text-xs sm:text-sm focus:outline-none appearance-none cursor-pointer pr-4"
                      aria-label="Select pickup time"
                    >
                      {TIME_OPTIONS.map((t) => (
                        <option key={t} value={t} className="text-slate-900 font-medium py-1">{t}</option>
                      ))}
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-0 pointer-events-none" />
                  </div>
                </div>

                {/* DROP-TIME */}
                <div className="w-full lg:w-32 xl:w-36 relative border border-slate-200 rounded-xl bg-white p-3 sm:py-3 sm:px-3 hover:border-slate-300 transition-all flex flex-col justify-between min-h-[72px] sm:min-h-[76px] shadow-2xs shrink-0">
                  <div className="text-slate-500 text-xs sm:text-[13px] font-normal leading-none mb-1">
                    Drop-Time
                  </div>
                  <div className="relative flex items-center">
                    <select
                      value={formatTo12Hour(returnTime)}
                      onChange={(e) => setReturnTime(e.target.value)}
                      className="w-full bg-transparent border-none p-0 text-slate-900 font-semibold text-xs sm:text-sm focus:outline-none appearance-none cursor-pointer pr-4"
                      aria-label="Select drop time"
                    >
                      {TIME_OPTIONS.map((t) => (
                        <option key={t} value={t} className="text-slate-900 font-medium py-1">{t}</option>
                      ))}
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-0 pointer-events-none" />
                  </div>
                </div>
              </div>

              {/* Add Stop option */}
              <div className="flex items-center justify-end">
                <button
                  type="button"
                  id="rt-add-stop-explicit-btn"
                  onClick={handleAddStop}
                  className="inline-flex items-center gap-1 text-xs text-slate-600 hover:text-slate-900 font-medium cursor-pointer transition-colors"
                >
                  <Plus className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Add intermediate stop</span>
                </button>
              </div>
            </div>
          )}

          {/* 2. OUTSTATION ONE-WAY (4 BOXES) */}
          {serviceType === 'oneway' && (
            <div className="w-full">
              <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-2.5 xl:gap-3">
                {/* FROM */}
                <div className="flex-1 min-w-0">
                  <LocationAutocompleteInput
                    id="from-location-input"
                    label="From"
                    variant="card-box"
                    placeholder="Enter pickup city or landmark"
                    value={pickupLocation}
                    selectedPlace={pickupLocationObj}
                    allowCurrentLocation={false}
                    onChange={(val, suggestion) => {
                      setPickupLocation(val);
                      if (suggestion) setPickupLocationObj(suggestion);
                      if (errors.pickupLocation) setErrors((prev) => ({ ...prev, pickupLocation: '' }));
                    }}
                    error={errors.pickupLocation}
                    onClear={() => {
                      setPickupLocation('');
                      setPickupLocationObj(undefined);
                    }}
                  />
                </div>

                {/* SWAP BUTTON */}
                <div className="flex justify-center items-center -my-1 lg:my-0 lg:-mx-4 z-10 shrink-0">
                  <button
                    type="button"
                    id="swap-locations-btn"
                    onClick={handleSwapLocations}
                    title="Swap From and To"
                    aria-label="Swap locations"
                    className="w-8 h-8 rounded-full bg-white border border-slate-200 shadow-sm flex items-center justify-center hover:bg-slate-50 active:scale-95 transition-all text-slate-700 cursor-pointer"
                  >
                    <ArrowLeftRight className="w-3.5 h-3.5 text-slate-700" />
                  </button>
                </div>

                {/* TO */}
                <div className="flex-1 min-w-0 relative">
                  <LocationAutocompleteInput
                    id="to-location-input"
                    label="To"
                    variant="card-box"
                    placeholder="Enter destination city or landmark"
                    value={dropLocation}
                    selectedPlace={dropLocationObj}
                    allowCurrentLocation={false}
                    onChange={(val, suggestion) => {
                      setDropLocation(val);
                      if (suggestion) setDropLocationObj(suggestion);
                      if (errors.dropLocation) setErrors((prev) => ({ ...prev, dropLocation: '' }));
                    }}
                    error={errors.dropLocation}
                    onClear={() => {
                      setDropLocation('');
                      setDropLocationObj(undefined);
                    }}
                  />
                </div>

                {/* DEPARTURE */}
                <div
                  id="oneway-departure-date-box"
                  role="button"
                  tabIndex={0}
                  aria-label="Select departure date"
                  aria-haspopup="dialog"
                  aria-expanded={activeCalendar === 'ow-departure'}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      toggleCalendar('ow-departure', e);
                    }
                  }}
                  onClick={(e) => toggleCalendar('ow-departure', e)}
                  className={`w-full lg:w-44 xl:w-48 relative border rounded-xl bg-white p-3 sm:py-3 sm:px-4 transition-all flex flex-col justify-between min-h-[72px] sm:min-h-[76px] cursor-pointer shadow-2xs shrink-0 select-none ${
                    errors.travelDate
                      ? 'border-rose-400 ring-1 ring-rose-300'
                      : activeCalendar === 'ow-departure'
                      ? 'border-emerald-600 ring-2 ring-emerald-500/30'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between text-slate-500 text-xs sm:text-[13px] font-normal leading-none mb-1 pointer-events-none">
                    <span className="flex items-center gap-1">
                      Departure <ChevronDown className={`w-3.5 h-3.5 text-indigo-900 transition-transform ${activeCalendar === 'ow-departure' ? 'rotate-180' : ''}`} />
                    </span>
                    {errors.travelDate && (
                      <AlertCircle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                    )}
                  </div>
                  <div className="text-slate-900 font-medium text-sm sm:text-base leading-tight truncate pointer-events-none">
                    {formatDateToSeptFormat(travelDate)}
                  </div>
                  {errors.travelDate && (
                    <span className="text-[10px] text-rose-600 font-medium truncate block leading-tight pointer-events-none">
                      {errors.travelDate}
                    </span>
                  )}
                  <input
                    ref={pickupDateInputRef}
                    id="pickup-date-native-input"
                    type="date"
                    min={getTodayDate()}
                    value={travelDate}
                    tabIndex={-1}
                    aria-hidden="true"
                    onChange={(e) => handleTravelDateChange(e.target.value)}
                    onClick={(e) => toggleCalendar('ow-departure', e)}
                    className="sr-only"
                    aria-label="Select departure date"
                  />

                  <CalendarPopover
                    isOpen={activeCalendar === 'ow-departure'}
                    onClose={() => setActiveCalendar(null)}
                    selectedDate={travelDate}
                    minDate={getTodayDate()}
                    title="Departure Date"
                    align="left"
                    onSelectDate={(newDate) => {
                      handleTravelDateChange(newDate);
                      setActiveCalendar(null);
                    }}
                  />
                </div>

                {/* PICKUP-TIME */}
                <div className="w-full lg:w-38 xl:w-44 relative border border-slate-200 rounded-xl bg-white p-3 sm:py-3 sm:px-4 hover:border-slate-300 transition-all flex flex-col justify-between min-h-[72px] sm:min-h-[76px] shadow-2xs shrink-0">
                  <div className="text-slate-500 text-xs sm:text-[13px] font-normal leading-none mb-1">
                    Pickup-Time
                  </div>
                  <div className="relative flex items-center">
                    <select
                      id="pickup-time-select"
                      value={formatTo12Hour(pickupTime)}
                      onChange={(e) => setPickupTime(e.target.value)}
                      className="w-full bg-transparent border-none p-0 text-slate-900 font-semibold text-sm sm:text-base focus:outline-none appearance-none cursor-pointer pr-5 tracking-tight"
                      aria-label="Select pickup time"
                    >
                      {TIME_OPTIONS.map((timeOption) => (
                        <option key={timeOption} value={timeOption} className="text-slate-900 font-medium py-1">
                          {timeOption}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="w-4 h-4 text-slate-400 absolute right-0 pointer-events-none" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 3. HOURLY RENTAL (4 BOXES) */}
          {serviceType === 'local' && (
            <div className="w-full">
              <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-2.5 xl:gap-3">
                {/* FROM */}
                <div className="flex-[2] min-w-0">
                  <LocationAutocompleteInput
                    id="local-pickup-location-input"
                    label="From"
                    variant="card-box"
                    placeholder="Enter pickup location (e.g. Mysuru City / Hotel)"
                    value={pickupLocation}
                    selectedPlace={pickupLocationObj}
                    allowCurrentLocation={false}
                    onChange={(val, suggestion) => {
                      setPickupLocation(val);
                      if (suggestion) setPickupLocationObj(suggestion);
                      if (errors.pickupLocation) setErrors((prev) => ({ ...prev, pickupLocation: '' }));
                    }}
                    error={errors.pickupLocation}
                    onClear={() => {
                      setPickupLocation('');
                      setPickupLocationObj(undefined);
                    }}
                  />
                </div>

                {/* DEPARTURE */}
                <div
                  id="local-departure-date-box"
                  role="button"
                  tabIndex={0}
                  aria-label="Select departure date"
                  aria-haspopup="dialog"
                  aria-expanded={activeCalendar === 'local-departure'}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      toggleCalendar('local-departure', e);
                    }
                  }}
                  onClick={(e) => toggleCalendar('local-departure', e)}
                  className={`w-full lg:w-44 xl:w-48 relative border rounded-xl bg-white p-3 sm:py-3 sm:px-4 transition-all flex flex-col justify-between min-h-[72px] sm:min-h-[76px] cursor-pointer shadow-2xs shrink-0 select-none ${
                    errors.travelDate
                      ? 'border-rose-400 ring-1 ring-rose-300'
                      : activeCalendar === 'local-departure'
                      ? 'border-emerald-600 ring-2 ring-emerald-500/30'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between text-slate-500 text-xs sm:text-[13px] font-normal leading-none mb-1 pointer-events-none">
                    <span className="flex items-center gap-1">
                      Departure <ChevronDown className={`w-3.5 h-3.5 text-indigo-900 transition-transform ${activeCalendar === 'local-departure' ? 'rotate-180' : ''}`} />
                    </span>
                    {errors.travelDate && (
                      <AlertCircle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                    )}
                  </div>
                  <div className="text-slate-900 font-medium text-sm sm:text-base leading-tight truncate pointer-events-none">
                    {formatDateToSeptFormat(travelDate)}
                  </div>
                  {errors.travelDate && (
                    <span className="text-[10px] text-rose-600 font-medium truncate block leading-tight pointer-events-none">
                      {errors.travelDate}
                    </span>
                  )}
                  <input
                    ref={pickupDateInputRef}
                    id="local-departure-date-input"
                    type="date"
                    min={getTodayDate()}
                    value={travelDate}
                    tabIndex={-1}
                    aria-hidden="true"
                    onChange={(e) => handleTravelDateChange(e.target.value)}
                    onClick={(e) => toggleCalendar('local-departure', e)}
                    className="sr-only"
                    aria-label="Select date"
                  />

                  <CalendarPopover
                    isOpen={activeCalendar === 'local-departure'}
                    onClose={() => setActiveCalendar(null)}
                    selectedDate={travelDate}
                    minDate={getTodayDate()}
                    title="Departure Date"
                    align="left"
                    onSelectDate={(newDate) => {
                      handleTravelDateChange(newDate);
                      setActiveCalendar(null);
                    }}
                  />
                </div>

                {/* PICKUP-TIME */}
                <div
                  id="local-pickup-time-box"
                  className={`w-full lg:w-36 xl:w-40 relative border rounded-xl bg-white p-3 sm:py-3 sm:px-4 transition-all flex flex-col justify-between min-h-[72px] sm:min-h-[76px] shadow-2xs shrink-0 ${
                    errors.pickupTime
                      ? 'border-rose-400 ring-1 ring-rose-300'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between text-slate-500 text-xs sm:text-[13px] font-normal leading-none mb-1">
                    <span>Pickup-Time</span>
                    {errors.pickupTime && (
                      <AlertCircle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                    )}
                  </div>
                  <div className="relative flex items-center">
                    <select
                      id="local-pickup-time-select"
                      value={formatTo12Hour(pickupTime)}
                      onChange={(e) => {
                        setPickupTime(e.target.value);
                        if (errors.pickupTime) setErrors((prev) => ({ ...prev, pickupTime: '' }));
                      }}
                      className="w-full bg-transparent border-none p-0 text-slate-900 font-semibold text-sm sm:text-base focus:outline-none appearance-none cursor-pointer pr-4"
                      aria-label="Select start time"
                    >
                      {TIME_OPTIONS.map((t) => (
                        <option key={t} value={t} className="text-slate-900 font-medium py-1">{t}</option>
                      ))}
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-0 pointer-events-none" />
                  </div>
                  {errors.pickupTime && (
                    <span className="text-[10px] text-rose-600 font-medium truncate block leading-tight">
                      {errors.pickupTime}
                    </span>
                  )}
                </div>

                {/* DURATION */}
                <div
                  id="local-duration-box"
                  className="w-full lg:w-48 xl:w-52 relative border border-slate-200 rounded-xl bg-white p-3 sm:py-3 sm:px-4 hover:border-slate-300 transition-all flex flex-col justify-between min-h-[72px] sm:min-h-[76px] shadow-2xs shrink-0"
                >
                  <div className="flex items-center justify-between text-slate-500 text-xs sm:text-[13px] font-normal leading-none mb-1">
                    <span>Duration</span>
                    {durationHours === 12 && (
                      <span className="text-[10px] font-extrabold text-emerald-800 bg-emerald-100 border border-emerald-300 px-1.5 py-0.5 rounded leading-none">
                        15% OFF
                      </span>
                    )}
                  </div>
                  <div className="relative flex items-center">
                    <select
                      id="local-duration-select"
                      value={durationHours}
                      onChange={(e) => setDurationHours(Number(e.target.value))}
                      className="w-full bg-transparent border-none p-0 text-slate-900 font-medium text-sm sm:text-base focus:outline-none appearance-none cursor-pointer pr-4"
                      aria-label="Select trip duration"
                    >
                      <option value={4}>4 Hours / 40 Km</option>
                      <option value={8}>8 Hours / 80 Km</option>
                      <option value={12}>12 Hours / 120 Km</option>
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-0 pointer-events-none" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 4. AIRPORT (4 BOXES) */}
          {serviceType === 'airport' && (
            <div className="w-full space-y-4">
              <div className="flex items-center justify-center gap-2">
                <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-50 text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => setAirportTransferType('pickup')}
                    className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
                      airportTransferType === 'pickup'
                        ? 'bg-[#192A56] text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Airport Pickup
                  </button>
                  <button
                    type="button"
                    onClick={() => setAirportTransferType('drop')}
                    className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
                      airportTransferType === 'drop'
                        ? 'bg-[#192A56] text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Airport Drop
                  </button>
                </div>
              </div>

              <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-2.5 xl:gap-3">
                {/* FROM */}
                <div className="flex-1 min-w-0">
                  <LocationAutocompleteInput
                    id="airport-pickup-input"
                    label="From"
                    variant="card-box"
                    placeholder={airportTransferType === 'pickup' ? 'Enter airport (e.g. BLR Airport)' : 'Enter pickup city or hotel'}
                    value={pickupLocation}
                    selectedPlace={pickupLocationObj}
                    allowCurrentLocation={false}
                    onChange={(val, suggestion) => {
                      setPickupLocation(val);
                      if (suggestion) setPickupLocationObj(suggestion);
                      if (errors.pickupLocation) setErrors((prev) => ({ ...prev, pickupLocation: '' }));
                    }}
                    error={errors.pickupLocation}
                    onClear={() => {
                      setPickupLocation('');
                      setPickupLocationObj(undefined);
                    }}
                  />
                </div>

                {/* SWAP BUTTON */}
                <div className="flex justify-center items-center -my-1 lg:my-0 lg:-mx-4 z-10 shrink-0">
                  <button
                    type="button"
                    onClick={handleSwapLocations}
                    title="Swap From and To"
                    aria-label="Swap locations"
                    className="w-8 h-8 rounded-full bg-white border border-slate-200 shadow-sm flex items-center justify-center hover:bg-slate-50 active:scale-95 transition-all text-slate-700 cursor-pointer"
                  >
                    <ArrowLeftRight className="w-3.5 h-3.5 text-slate-700" />
                  </button>
                </div>

                {/* TO */}
                <div className="flex-1 min-w-0 relative">
                  <LocationAutocompleteInput
                    id="airport-drop-input"
                    label="To"
                    variant="card-box"
                    placeholder={airportTransferType === 'drop' ? 'Enter airport (e.g. BLR Airport)' : 'Enter destination city or hotel'}
                    value={dropLocation}
                    selectedPlace={dropLocationObj}
                    allowCurrentLocation={false}
                    onChange={(val, suggestion) => {
                      setDropLocation(val);
                      if (suggestion) setDropLocationObj(suggestion);
                      if (errors.dropLocation) setErrors((prev) => ({ ...prev, dropLocation: '' }));
                    }}
                    error={errors.dropLocation}
                    onClear={() => {
                      setDropLocation('');
                      setDropLocationObj(undefined);
                    }}
                  />
                </div>

                {/* DEPARTURE */}
                <div
                  id="airport-departure-date-box"
                  role="button"
                  tabIndex={0}
                  aria-label="Select departure date"
                  aria-haspopup="dialog"
                  aria-expanded={activeCalendar === 'airport-departure'}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      toggleCalendar('airport-departure', e);
                    }
                  }}
                  onClick={(e) => toggleCalendar('airport-departure', e)}
                  className={`w-full lg:w-44 xl:w-48 relative border rounded-xl bg-white p-3 sm:py-3 sm:px-4 transition-all flex flex-col justify-between min-h-[72px] sm:min-h-[76px] cursor-pointer shadow-2xs shrink-0 select-none ${
                    errors.travelDate
                      ? 'border-rose-400 ring-1 ring-rose-300'
                      : activeCalendar === 'airport-departure'
                      ? 'border-emerald-600 ring-2 ring-emerald-500/30'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between text-slate-500 text-xs sm:text-[13px] font-normal leading-none mb-1 pointer-events-none">
                    <span className="flex items-center gap-1">
                      Departure <ChevronDown className={`w-3.5 h-3.5 text-indigo-900 transition-transform ${activeCalendar === 'airport-departure' ? 'rotate-180' : ''}`} />
                    </span>
                    {errors.travelDate && (
                      <AlertCircle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                    )}
                  </div>
                  <div className="text-slate-900 font-medium text-sm sm:text-base leading-tight truncate pointer-events-none">
                    {formatDateToSeptFormat(travelDate)}
                  </div>
                  {errors.travelDate && (
                    <span className="text-[10px] text-rose-600 font-medium truncate block leading-tight pointer-events-none">
                      {errors.travelDate}
                    </span>
                  )}
                  <input
                    ref={pickupDateInputRef}
                    id="airport-departure-date-input"
                    type="date"
                    min={getTodayDate()}
                    value={travelDate}
                    tabIndex={-1}
                    aria-hidden="true"
                    onChange={(e) => handleTravelDateChange(e.target.value)}
                    onClick={(e) => toggleCalendar('airport-departure', e)}
                    className="sr-only"
                    aria-label="Select airport date"
                  />

                  <CalendarPopover
                    isOpen={activeCalendar === 'airport-departure'}
                    onClose={() => setActiveCalendar(null)}
                    selectedDate={travelDate}
                    minDate={getTodayDate()}
                    title="Departure Date"
                    align="left"
                    onSelectDate={(newDate) => {
                      handleTravelDateChange(newDate);
                      setActiveCalendar(null);
                    }}
                  />
                </div>

                {/* PICKUP-TIME */}
                <div className="w-full lg:w-38 xl:w-44 relative border border-slate-200 rounded-xl bg-white p-3 sm:py-3 sm:px-4 hover:border-slate-300 transition-all flex flex-col justify-between min-h-[72px] sm:min-h-[76px] shadow-2xs shrink-0">
                  <div className="text-slate-500 text-xs sm:text-[13px] font-normal leading-none mb-1">
                    Pickup-Time
                  </div>
                  <div className="relative flex items-center">
                    <select
                      value={formatTo12Hour(pickupTime)}
                      onChange={(e) => setPickupTime(e.target.value)}
                      className="w-full bg-transparent border-none p-0 text-slate-900 font-semibold text-sm sm:text-base focus:outline-none appearance-none cursor-pointer pr-4"
                      aria-label="Select airport time"
                    >
                      {TIME_OPTIONS.map((t) => (
                        <option key={t} value={t} className="text-slate-900 font-medium py-1">{t}</option>
                      ))}
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-0 pointer-events-none" />
                  </div>
                </div>
              </div>

              {/* Optional Flight Number */}
              <div className="max-w-md pt-1">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 block mb-1">
                  Flight Number (Optional)
                </label>
                <div className="border border-slate-200 rounded-xl px-3 py-2 flex items-center gap-2 focus-within:border-slate-400 bg-white transition-colors">
                  <Plane className="w-4 h-4 text-slate-400 shrink-0" />
                  <input
                    type="text"
                    placeholder="e.g. 6E 543 or AI 802"
                    value={flightNumber}
                    onChange={(e) => setFlightNumber(e.target.value)}
                    className="w-full bg-transparent border-none p-0 text-sm font-semibold text-slate-900 focus:outline-none uppercase placeholder:normal-case placeholder:font-normal placeholder:text-slate-400"
                  />
                </div>
              </div>
            </div>
          )}

        {/* DYNAMIC ADDITIONAL ENROUTE STOPS (When added via '+' button) */}
        {serviceType !== 'local' && viaLocations.length > 0 && (
          <div className="bg-sky-50/50 p-4 rounded-xl border border-sky-100 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[#0f2441] flex items-center gap-1.5">
                <span>Enroute / Additional Stops ({viaLocations.length})</span>
              </span>
              {viaLocations.length < 4 && (
                <button
                  type="button"
                  onClick={handleAddStop}
                  className="text-xs font-bold text-[#20A8D8] hover:text-[#1880a6] flex items-center gap-1 cursor-pointer bg-white px-2.5 py-1 rounded-md border border-sky-200"
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
                      label={`Stop #${idx + 1}`}
                      placeholder="e.g. Srirangapatna, Mandya..."
                      value={viaLoc}
                      onChange={(val) => handleUpdateStop(idx, val)}
                      iconType="via"
                      onClear={() => handleUpdateStop(idx, '')}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveStop(idx)}
                    title="Remove stop"
                    aria-label="Remove stop"
                    className="p-2.5 mt-5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* LIVE GOOGLE MAPS ROUTE & ACCURATE ROAD DISTANCE STRIP */}
        {serviceType !== 'local' && routeInfo && routeInfo.distanceKm > 0 && (
          <div
            id="google-maps-route-info-card"
            className="bg-slate-50/90 border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-xs space-y-3.5 transition-all"
          >
            {/* Main Key Route Data Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-4 text-xs">
              {/* FROM */}
              <div className="bg-white border border-slate-200 rounded-xl p-2.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">FROM</span>
                <p className="font-bold text-slate-800 text-xs sm:text-sm truncate" title={pickupLocation}>
                  {pickupLocation}
                </p>
              </div>

              {/* TO */}
              <div className="bg-white border border-slate-200 rounded-xl p-2.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">TO</span>
                <p className="font-bold text-slate-800 text-xs sm:text-sm truncate" title={dropLocation}>
                  {dropLocation}
                </p>
              </div>

              {/* DISTANCE */}
              <div className="bg-white border border-emerald-200/80 rounded-xl p-2.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 block mb-0.5">DISTANCE</span>
                <p className="font-extrabold text-emerald-700 text-xs sm:text-sm flex items-center gap-1">
                  <span>~{Math.round(routeInfo.distanceKm)} km</span>
                  <span className="text-[11px] font-normal text-slate-500">({routeInfo.distanceKm} km)</span>
                </p>
              </div>

              {/* DRIVING TIME */}
              <div className="bg-white border border-sky-200/80 rounded-xl p-2.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#009966] block mb-0.5">DRIVING TIME</span>
                <p className="font-extrabold text-slate-900 text-xs sm:text-sm flex items-center gap-1">
                  <span>~{routeInfo.durationText || routeInfo.durationFormatted || '3 hr 30 min'}</span>
                </p>
              </div>
            </div>

            {/* ROUTE Highway Description */}
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs pt-1 border-t border-slate-200/60">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-extrabold uppercase tracking-wider bg-slate-200 text-slate-700 px-2 py-0.5 rounded">
                  ROUTE
                </span>
                <span className="font-semibold text-slate-700 text-xs flex items-center gap-1">
                  <Route className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Actual road route:</span>
                  <span className="text-slate-900 font-bold">{routeInfo.highwayCorridor || 'NH 275 Bengaluru-Mysuru Expressway + NH 44 Airport Corridor'}</span>
                </span>
              </div>
            </div>

            {/* Alternate Routes Chip if Available */}
            {routeInfo.alternateRoutes && routeInfo.alternateRoutes.length > 0 && (
              <div className="text-[11px] text-slate-600 flex items-center gap-2 pt-1 border-t border-slate-100">
                <span className="font-bold text-slate-700">Alternate Route:</span>
                <span>
                  {routeInfo.alternateRoutes[0].description} ({routeInfo.alternateRoutes[0].distanceKm} km · {routeInfo.alternateRoutes[0].durationFormatted})
                </span>
              </div>
            )}
          </div>
        )}

        {/* Route Validation Warning Banner */}
        {serviceType !== 'local' && routeInfo && (routeInfo.validationStatus === 'NO_ROUTE_FOUND' || routeInfo.validationStatus === 'SANITY_CHECK_FAILED') && (
          <div
            id="route-validation-warning-card"
            className="bg-amber-50 border border-amber-300 rounded-2xl p-4 text-xs text-amber-900 flex items-start gap-3 shadow-2xs"
          >
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold text-amber-950">
                {routeInfo.validationStatus === 'SANITY_CHECK_FAILED' ? 'Route Verification Warning' : 'Unable to Trace Exact Road Route'}
              </p>
              <p className="text-amber-800 leading-relaxed">
                {routeInfo.validationMessage || 'Please select a recognized pickup and drop location from the autocomplete suggestions to ensure 100% road-accurate distance and transparent pricing.'}
              </p>
            </div>
          </div>
        )}

        {/* Loading State: Route Calculation */}
        {serviceType !== 'local' && isCalculatingRoute && (
          <div
            id="route-calculating-indicator"
            className="flex items-center justify-center gap-2.5 py-2.5 px-4 bg-sky-50/90 border border-sky-200 rounded-xl text-sky-800 text-xs font-semibold animate-pulse"
          >
            <Loader2 className="w-4 h-4 animate-spin text-[#20A8D8]" />
            <span>Calculating route...</span>
          </div>
        )}

        {/* PRIMARY CTA BUTTON: EXPLORE CABS */}
        <div className="flex flex-col items-center justify-center pt-2 sm:pt-3">
          <button
            type="submit"
            id="explore-cabs-primary-btn"
            className="w-full max-w-[280px] h-[48px] sm:h-[50px] bg-[#ECFDF5] hover:bg-[#d1fae5] text-slate-900 border border-emerald-300 font-extrabold text-base sm:text-lg uppercase tracking-wide rounded-lg shadow-sm hover:shadow transition-all duration-150 active:scale-[0.99] flex items-center justify-center cursor-pointer select-none"
          >
            EXPLORE CABS
          </button>

          {/* Minimal, subtle reset details */}
          <div className="flex items-center justify-center mt-3 text-xs text-slate-400">
            <button
              type="button"
              id="reset-booking-details-link"
              onClick={handleResetForm}
              disabled={isResetting}
              className="hover:text-slate-600 font-medium cursor-pointer transition-colors flex items-center gap-1"
            >
              {resetSuccessFeedback ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700 font-semibold">Details Cleared</span>
                </>
              ) : (
                <>
                  <RotateCcw className={`w-3.5 h-3.5 ${isResetting ? 'animate-spin text-slate-600' : ''}`} />
                  <span>Reset Details</span>
                </>
              )}
            </button>
          </div>
        </div>
        </form>
      </div>
    </div>
  );
};
