import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  ArrowLeftRight,
  ChevronDown,
  Plus,
  Trash2,
  RotateCcw,
  Check,
  AlertCircle,
  Search,
  Route,
  Sparkles,
  Loader2,
  PlusCircle,
  MinusCircle,
} from 'lucide-react';
import {
  BookingSearchState,
  ServiceType,
  AirportTransferType,
  CalculatedRouteInfo,
  PricingConfig,
  PlaceSuggestion,
} from '../types';
import {
  TIME_OPTIONS,
  formatTo12Hour,
  formatTo24Hour,
  isTimeInPastForDate,
  getNextAvailableTimeSlot,
  getFilteredTimeOptionsForDate,
  getTodayDateString,
  getTomorrowDateString,
} from '../utils/timeValidation';
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

// Helper to convert date to "Fri, Sep 25" display format matching screenshots
const formatDateToDayMonthFormat = (isoDate: string): string => {
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

// Helper to convert DD-MM-YYYY display from YYYY-MM-DD (e.g. 27-09-2026)
const formatDateToDDMMYYYY = (isoDate: string): string => {
  if (!isoDate) return '';
  const parts = isoDate.split('-');
  if (parts.length === 3) {
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
  }
  return isoDate;
};



export const BookingSearch: React.FC<BookingSearchProps> = ({
  initialState,
  onSearch,
  onConfirmBooking,
  onReset,
  pricingConfig,
}) => {
  // Today's date in local calendar YYYY-MM-DD
  const getTodayDate = getTodayDateString;
  const getTomorrowDate = getTomorrowDateString;

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

  // Default pickup time: initialized to 9:00 AM or initialState
  const [pickupTime, setPickupTime] = useState<string>(() => {
    if (initialState?.pickupTime) {
      return formatTo12Hour(initialState.pickupTime);
    }
    return '9:00 AM';
  });
  const [returnTime, setReturnTime] = useState(
    initialState?.returnTime ? formatTo12Hour(initialState.returnTime) : '9:00 PM'
  );

  const [durationHours, setDurationHours] = useState<number>(initialState?.durationHours || 12);
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

  // Periodic clock tick to refresh available time slots dynamically as time progresses
  const [currentTimeTick, setCurrentTimeTick] = useState<number>(() => Date.now());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTimeTick(Date.now());
    }, 15000);
    return () => clearInterval(timer);
  }, []);

  // Dynamically filter out options earlier than current local time when travel date is set to today
  const pickupTimeOptions = useMemo(() => {
    return getFilteredTimeOptionsForDate(travelDate);
  }, [travelDate, currentTimeTick]);

  // Keep pickupTime synchronized if previously selected slot is now filtered out
  useEffect(() => {
    if (pickupTimeOptions.length > 0) {
      const formatted = formatTo12Hour(pickupTime);
      if (!pickupTimeOptions.includes(formatted)) {
        setPickupTime(pickupTimeOptions[0]);
      }
    }
  }, [pickupTimeOptions, pickupTime]);

  const handlePickupTimeChange = (newTime: string) => {
    registerUserActivity();
    setPickupTime(newTime);
    if (errors.pickupTime) {
      setErrors((prev) => ({ ...prev, pickupTime: '' }));
    }
  };

  const handleTimeSelectFocus = () => {
    // Keep focus smooth
  };

  // Periodic check to ensure selected pickup time doesn't expire while idle on page
  useEffect(() => {
    const interval = setInterval(() => {
      if (isTimeInPastForDate(travelDate, pickupTime)) {
        const nextSlot = getNextAvailableTimeSlot(travelDate);
        setPickupTime(nextSlot);
      }
    }, 20000);
    return () => clearInterval(interval);
  }, [travelDate, pickupTime]);

  const handleTravelDateChange = (newDate: string) => {
    registerUserActivity();
    setTravelDate(newDate);
    if (errors.travelDate) setErrors((prev) => ({ ...prev, travelDate: '' }));

    // If currently selected pickup time is now in the past for the selected date, advance to next upcoming slot
    if (isTimeInPastForDate(newDate, pickupTime)) {
      const nextSlot = getNextAvailableTimeSlot(newDate);
      setPickupTime(nextSlot);
      if (errors.pickupTime) setErrors((prev) => ({ ...prev, pickupTime: '' }));
    } else if (errors.pickupTime) {
      setErrors((prev) => ({ ...prev, pickupTime: '' }));
    }

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
    if (isTimeInPastForDate(travelDate, pickupTime)) {
      setPickupTime(getNextAvailableTimeSlot(travelDate));
    }
    if (newService === 'local') {
      setRouteInfo(null);
      setViaLocations([]);
      setDurationHours(4);
    }
    if (newService === 'airport') {
      if (airportTransferType === 'pickup') {
        if (!pickupLocation || (!pickupLocation.includes('Airport') && !pickupLocation.includes('Terminal'))) {
          setPickupLocation('Terminal 1, Kempegowda International Airport (BLR)');
        }
      } else {
        if (!dropLocation || (!dropLocation.includes('Airport') && !dropLocation.includes('Terminal'))) {
          setDropLocation('Terminal 1, Kempegowda International Airport (BLR)');
        }
      }
    }
  };

  const handleAirportTypeSwitch = (type: AirportTransferType) => {
    setAirportTransferType(type);
    registerUserActivity();
    if (type === 'drop') {
      // In drop to airport: pickup is user's address, drop is airport
      if (pickupLocation.includes('Airport') || pickupLocation.includes('Terminal') || pickupLocation.includes('Kempegowda')) {
        setDropLocation(pickupLocation);
        setDropLocationObj(pickupLocationObj);
        setPickupLocation('');
        setPickupLocationObj(undefined);
      } else if (!dropLocation || (!dropLocation.includes('Airport') && !dropLocation.includes('Terminal'))) {
        setDropLocation('Terminal 1, Kempegowda International Airport (BLR)');
      }
    } else {
      // In pickup from airport: pickup is airport, drop is user's address
      if (dropLocation.includes('Airport') || dropLocation.includes('Terminal') || dropLocation.includes('Kempegowda')) {
        setPickupLocation(dropLocation);
        setPickupLocationObj(dropLocationObj);
        setDropLocation('');
        setDropLocationObj(undefined);
      } else if (!pickupLocation || (!pickupLocation.includes('Airport') && !pickupLocation.includes('Terminal'))) {
        setPickupLocation('Terminal 1, Kempegowda International Airport (BLR)');
      }
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
    const today = getTodayDate();
    setTravelDate(today);
    setDropDate(getTomorrowDate());
    setReturnDate(getTomorrowDate());
    setPickupTime(getNextAvailableTimeSlot(today));
    setReturnTime('07:00 PM');
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
    } else if (isTimeInPastForDate(travelDate, pickupTime)) {
      newErrors.pickupTime = 'Pickup time cannot be in the past for today.';
    }

    if (serviceType === 'roundtrip') {
      if (!dropDate) {
        newErrors.dropDate = 'Please select a valid return date.';
      } else if (dropDate < travelDate) {
        newErrors.dropDate = 'Return date cannot be earlier than departure date.';
      } else if (dropDate === travelDate && formatTo24Hour(returnTime) <= formatTo24Hour(pickupTime)) {
        setReturnTime('23:45');
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
            distanceKm: (durationHours || 12) * 10,
            durationMinutes: (durationHours || 12) * 60,
            durationText: `${durationHours || 12} Hours`,
            routeSummary: `Mysuru Local Hourly Rental (${durationHours || 12} Hrs / ${(durationHours || 12) * 10} Km Package)`,
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
      durationHours: serviceType === 'local' ? (durationHours || 12) : 8,
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
      {/* Top Banner with centered tab bar */}
      <div className="pt-6 pb-4 px-4 sm:px-6 md:px-8 flex flex-col items-center justify-center bg-[#ECFDF5] rounded-t-[28px]">
        <ServiceSelector
          selectedService={serviceType}
          onSelectService={handleServiceChange}
        />
      </div>

      {/* Main white form container */}
      <div className="bg-white rounded-b-[28px] p-4 sm:p-6 md:p-7 lg:p-8">
        <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6">
          {/* 1. OUTSTATION ROUND-TRIP (6 BOXES) */}
          {/* 1. OUTSTATION ROUND-TRIP (MATCHING SCREENSHOT 11.jpeg & 1.jpeg) */}
          {serviceType === 'roundtrip' && (
            <div className="w-full space-y-4 pt-1 pb-1">
              {viaLocations.length === 0 ? (
                /* SINGLE-ROW LAYOUT WHEN NO STOPS (SCREENSHOT 11.jpeg) */
                <div className="flex flex-col lg:flex-row items-stretch lg:items-end gap-4 lg:gap-5 w-full">
                  {/* FROM */}
                  <div className="flex-1 min-w-[170px]">
                    <LocationAutocompleteInput
                      id="rt-from-location-input"
                      label="FROM"
                      variant="underline"
                      showSearchIconLeft
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
                  <div className="flex items-center justify-center -my-1 lg:my-0 lg:mb-1 shrink-0">
                    <button
                      type="button"
                      id="rt-swap-locations-btn"
                      onClick={handleSwapLocations}
                      title="Swap From and To"
                      aria-label="Swap locations"
                      className="w-8 h-8 rounded-full bg-slate-100 hover:bg-sky-50 text-[#90A1B9] flex items-center justify-center shadow-2xs transition-all cursor-pointer active:scale-95"
                    >
                      <ArrowLeftRight className="w-4 h-4 text-[#90A1B9]" />
                    </button>
                  </div>

                  {/* TO WITH (+) BUTTON */}
                  <div className="flex-1 min-w-[170px]">
                    <LocationAutocompleteInput
                      id="rt-to-location-input"
                      label="TO"
                      variant="underline"
                      showSearchIconLeft
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
                      rightActions={
                        <button
                          type="button"
                          id="rt-add-stop-plus-btn"
                          onClick={handleAddStop}
                          title="Add Stop"
                          aria-label="Add stop"
                          className="text-[#90A1B9] hover:text-slate-600 p-0.5 transition-colors cursor-pointer"
                        >
                          <PlusCircle className="w-5 h-5 text-[#90A1B9] stroke-[1.75]" />
                        </button>
                      }
                    />
                  </div>

                  {/* PICK UP DATE */}
                  <div className="w-full lg:w-44 xl:w-48 shrink-0">
                    <div className="flex items-center justify-between mb-1.5 min-h-[20px]">
                      <label className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-800">
                        PICK UP DATE
                      </label>
                      {errors.travelDate && (
                        <AlertCircle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                      )}
                    </div>
                    <div
                      id="rt-departure-date-box"
                      role="button"
                      tabIndex={0}
                      aria-label="Select pickup date"
                      aria-haspopup="dialog"
                      aria-expanded={activeCalendar === 'rt-departure'}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          toggleCalendar('rt-departure', e);
                        }
                      }}
                      onClick={(e) => toggleCalendar('rt-departure', e)}
                      className="relative border-b border-slate-300 pb-1.5 flex items-center justify-between cursor-pointer hover:border-slate-400 focus:outline-none transition-colors"
                    >
                      <span className="text-sm sm:text-base font-semibold text-slate-900 leading-tight">
                        {formatDateToDayMonthFormat(travelDate)}
                      </span>
                      <ChevronDown
                        className={`w-4 h-4 text-[#90A1B9] transition-transform ${
                          activeCalendar === 'rt-departure' ? 'rotate-180' : ''
                        }`}
                      />
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
                        aria-label="Select pickup date"
                      />
                      <CalendarPopover
                        isOpen={activeCalendar === 'rt-departure'}
                        onClose={() => setActiveCalendar(null)}
                        selectedDate={travelDate}
                        minDate={getTodayDate()}
                        title="Pick Up Date"
                        align="left"
                        onSelectDate={(newDate) => {
                          handleTravelDateChange(newDate);
                          setActiveCalendar(null);
                        }}
                      />
                    </div>
                    {errors.travelDate && (
                      <span className="text-[10px] text-rose-600 font-medium truncate block leading-tight mt-1">
                        {errors.travelDate}
                      </span>
                    )}
                  </div>

                  {/* RETURN DATE */}
                  <div className="w-full lg:w-40 xl:w-44 shrink-0">
                    <div className="flex items-center justify-between mb-1.5 min-h-[20px]">
                      <label className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-800">
                        RETURN DATE
                      </label>
                      {errors.dropDate && (
                        <AlertCircle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                      )}
                    </div>
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
                      className="relative border-b border-slate-300 pb-1.5 flex items-center justify-between cursor-pointer hover:border-slate-400 focus:outline-none transition-colors"
                    >
                      <span className="text-sm sm:text-base font-semibold text-slate-900 leading-tight">
                        {formatDateToDayMonthFormat(dropDate || returnDate || travelDate)}
                      </span>
                      <ChevronDown
                        className={`w-4 h-4 text-[#90A1B9] transition-transform ${
                          activeCalendar === 'rt-return' ? 'rotate-180' : ''
                        }`}
                      />
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
                    {errors.dropDate && (
                      <span className="text-[10px] text-rose-600 font-medium truncate block leading-tight mt-1">
                        {errors.dropDate}
                      </span>
                    )}
                  </div>

                  {/* PICK UP TIME */}
                  <div className="w-full lg:w-36 xl:w-40 shrink-0">
                    <div className="flex items-center justify-between mb-1.5 min-h-[20px]">
                      <label className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-800">
                        PICK UP TIME
                      </label>
                      {errors.pickupTime && (
                        <AlertCircle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                      )}
                    </div>
                    <div
                      id="rt-pickup-time-box"
                      className="relative border-b border-slate-300 pb-1.5 flex items-center justify-between hover:border-slate-400 focus-within:border-[#0ea5e9] transition-colors"
                    >
                      <select
                        id="rt-pickup-time-select"
                        value={formatTo12Hour(pickupTime)}
                        onChange={(e) => handlePickupTimeChange(e.target.value)}
                        onFocus={handleTimeSelectFocus}
                        className="w-full bg-transparent border-none p-0 text-sm sm:text-base font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0ea5e9]/25 active:ring-2 active:ring-[#0ea5e9]/35 rounded px-1.5 -ml-1.5 appearance-none cursor-pointer pr-5 transition-all"
                        aria-label="Select pickup time"
                      >
                        {pickupTimeOptions.map((t) => (
                          <option
                            key={t}
                            value={t}
                            className="text-slate-900 font-semibold py-1"
                          >
                            {t}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="w-4 h-4 text-[#90A1B9] absolute right-0 pointer-events-none transition-colors" />
                    </div>
                    {errors.pickupTime && (
                      <span className="text-[10px] text-rose-600 font-medium truncate block leading-tight mt-1">
                        {errors.pickupTime}
                      </span>
                    )}
                  </div>
                </div>
              ) : (
                /* TWO-ROW LAYOUT WHEN STOPS EXIST (SCREENSHOT 1.jpeg) */
                <div className="space-y-4 sm:space-y-5 w-full">
                  {/* ROW 1: FROM -> STOP 1 -> ... -> TO -> PICK UP DATE */}
                  <div className="flex flex-col lg:flex-row items-stretch lg:items-end gap-4 lg:gap-5 w-full">
                    {/* FROM */}
                    <div className="flex-1 min-w-[170px]">
                      <LocationAutocompleteInput
                        id="rt-from-location-input"
                        label="FROM"
                        variant="underline"
                        showSearchIconLeft
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

                    {/* INTERMEDIATE STOPS (STOP 1, STOP 2, ...) */}
                    {viaLocations.map((viaLoc, idx) => (
                      <div key={idx} className="flex-1 min-w-[170px]">
                        <LocationAutocompleteInput
                          id={`rt-stop-input-${idx}`}
                          label={`STOP ${idx + 1}`}
                          variant="underline"
                          showSearchIconLeft
                          placeholder="Enter Stop Location"
                          value={viaLoc}
                          allowCurrentLocation={false}
                          onChange={(val) => handleUpdateStop(idx, val)}
                          onClear={() => handleUpdateStop(idx, '')}
                          rightActions={
                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                type="button"
                                onClick={() => handleRemoveStop(idx)}
                                title={`Remove Stop ${idx + 1}`}
                                aria-label={`Remove Stop ${idx + 1}`}
                                className="text-[#90A1B9] hover:text-rose-600 p-0.5 transition-colors cursor-pointer"
                              >
                                <MinusCircle className="w-5 h-5 text-[#90A1B9] stroke-[1.75]" />
                              </button>
                              {viaLocations.length < 3 && (
                                <button
                                  type="button"
                                  onClick={handleAddStop}
                                  title="Add another stop"
                                  aria-label="Add stop"
                                  className="text-[#90A1B9] hover:text-[#0ea5e9] p-0.5 transition-colors cursor-pointer"
                                >
                                  <PlusCircle className="w-5 h-5 text-[#90A1B9] stroke-[1.75]" />
                                </button>
                              )}
                            </div>
                          }
                        />
                      </div>
                    ))}

                    {/* TO WITH (-) AND (+) BUTTONS */}
                    <div className="flex-1 min-w-[170px]">
                      <LocationAutocompleteInput
                        id="rt-to-location-input"
                        label="TO"
                        variant="underline"
                        showSearchIconLeft
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
                        rightActions={
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => handleRemoveStop(viaLocations.length - 1)}
                              title="Remove last stop"
                              aria-label="Remove stop"
                              className="text-[#90A1B9] hover:text-rose-600 p-0.5 transition-colors cursor-pointer"
                            >
                              <MinusCircle className="w-5 h-5 text-[#90A1B9] stroke-[1.75]" />
                            </button>
                            {viaLocations.length < 3 && (
                              <button
                                type="button"
                                onClick={handleAddStop}
                                title="Add another stop"
                                aria-label="Add stop"
                                className="text-[#90A1B9] hover:text-[#0ea5e9] p-0.5 transition-colors cursor-pointer"
                              >
                                <PlusCircle className="w-5 h-5 text-[#90A1B9] stroke-[1.75]" />
                              </button>
                            )}
                          </div>
                        }
                      />
                    </div>

                    {/* PICK UP DATE */}
                    <div className="w-full lg:w-40 xl:w-44 shrink-0">
                      <div className="flex items-center justify-between mb-1.5 min-h-[20px]">
                        <label className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-800">
                          PICK UP DATE
                        </label>
                        {errors.travelDate && (
                          <AlertCircle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                        )}
                      </div>
                      <div
                        id="rt-departure-date-box"
                        role="button"
                        tabIndex={0}
                        aria-label="Select pickup date"
                        aria-haspopup="dialog"
                        aria-expanded={activeCalendar === 'rt-departure'}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            toggleCalendar('rt-departure', e);
                          }
                        }}
                        onClick={(e) => toggleCalendar('rt-departure', e)}
                        className="relative border-b border-slate-300 pb-1.5 flex items-center justify-between cursor-pointer hover:border-slate-400 focus:outline-none transition-colors"
                      >
                        <span className="text-sm sm:text-base font-semibold text-slate-900 leading-tight">
                          {formatDateToDayMonthFormat(travelDate)}
                        </span>
                        <ChevronDown
                          className={`w-4 h-4 text-[#90A1B9] transition-transform ${
                            activeCalendar === 'rt-departure' ? 'rotate-180' : ''
                          }`}
                        />
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
                          aria-label="Select pickup date"
                        />
                        <CalendarPopover
                          isOpen={activeCalendar === 'rt-departure'}
                          onClose={() => setActiveCalendar(null)}
                          selectedDate={travelDate}
                          minDate={getTodayDate()}
                          title="Pick Up Date"
                          align="left"
                          onSelectDate={(newDate) => {
                            handleTravelDateChange(newDate);
                            setActiveCalendar(null);
                          }}
                        />
                      </div>
                      {errors.travelDate && (
                        <span className="text-[10px] text-rose-600 font-medium truncate block leading-tight mt-1">
                          {errors.travelDate}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* ROW 2: RETURN DATE -> PICK UP TIME */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-4 lg:gap-6 w-full">
                    {/* RETURN DATE */}
                    <div className="w-full sm:w-44 shrink-0">
                      <div className="flex items-center justify-between mb-1.5 min-h-[20px]">
                        <label className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-800">
                          RETURN DATE
                        </label>
                        {errors.dropDate && (
                          <AlertCircle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                        )}
                      </div>
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
                        className="relative border-b border-slate-300 pb-1.5 flex items-center justify-between cursor-pointer hover:border-slate-400 focus:outline-none transition-colors"
                      >
                        <span className="text-sm sm:text-base font-semibold text-slate-900 leading-tight">
                          {formatDateToDayMonthFormat(dropDate || returnDate || travelDate)}
                        </span>
                        <ChevronDown
                          className={`w-4 h-4 text-[#90A1B9] transition-transform ${
                            activeCalendar === 'rt-return' ? 'rotate-180' : ''
                          }`}
                        />
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
                      {errors.dropDate && (
                        <span className="text-[10px] text-rose-600 font-medium truncate block leading-tight mt-1">
                          {errors.dropDate}
                        </span>
                      )}
                    </div>

                    {/* PICK UP TIME */}
                    <div className="w-full sm:w-40 shrink-0">
                      <div className="flex items-center justify-between mb-1.5 min-h-[20px]">
                        <label className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-800">
                          PICK UP TIME
                        </label>
                        {errors.pickupTime && (
                          <AlertCircle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                        )}
                      </div>
                      <div
                        id="rt-pickup-time-box"
                        className="relative border-b border-slate-300 pb-1.5 flex items-center justify-between hover:border-slate-400 focus-within:border-[#0ea5e9] transition-colors"
                      >
                        <select
                          id="rt-pickup-time-select"
                          value={formatTo12Hour(pickupTime)}
                          onChange={(e) => handlePickupTimeChange(e.target.value)}
                          onFocus={handleTimeSelectFocus}
                          className="w-full bg-transparent border-none p-0 text-sm sm:text-base font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0ea5e9]/25 active:ring-2 active:ring-[#0ea5e9]/35 rounded px-1.5 -ml-1.5 appearance-none cursor-pointer pr-5 transition-all"
                          aria-label="Select pickup time"
                        >
                          {pickupTimeOptions.map((t) => (
                            <option
                              key={t}
                              value={t}
                              className="text-slate-900 font-semibold py-1"
                            >
                              {t}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="w-4 h-4 text-[#90A1B9] absolute right-0 pointer-events-none transition-colors" />
                      </div>
                      {errors.pickupTime && (
                        <span className="text-[10px] text-rose-600 font-medium truncate block leading-tight mt-1">
                          {errors.pickupTime}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}
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
                    label="FROM"
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
                    className="w-9 h-9 rounded-full bg-white border border-slate-200/90 shadow-2xs flex items-center justify-center hover:bg-emerald-50 hover:border-emerald-300 hover:shadow-xs active:scale-95 transition-all text-[#90A1B9] cursor-pointer"
                  >
                    <ArrowLeftRight className="w-3.5 h-3.5 text-[#90A1B9] hover:text-emerald-700 transition-colors" />
                  </button>
                </div>

                {/* TO */}
                <div className="flex-1 min-w-0 relative">
                  <LocationAutocompleteInput
                    id="to-location-input"
                    label="TO"
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

                {/* PICKUP DATE */}
                <div
                  id="oneway-departure-date-box"
                  role="button"
                  tabIndex={0}
                  aria-label="Select pickup date"
                  aria-haspopup="dialog"
                  aria-expanded={activeCalendar === 'ow-departure'}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      toggleCalendar('ow-departure', e);
                    }
                  }}
                  onClick={(e) => toggleCalendar('ow-departure', e)}
                  className={`w-full lg:w-44 xl:w-48 relative border rounded-2xl bg-white p-3 sm:py-3 sm:px-4 transition-all duration-150 flex flex-col justify-between min-h-[74px] sm:min-h-[78px] cursor-pointer shadow-2xs shrink-0 select-none group ${
                    errors.travelDate
                      ? 'border-rose-400 ring-2 ring-rose-200'
                      : activeCalendar === 'ow-departure'
                      ? 'border-emerald-600 ring-2 ring-emerald-500/20'
                      : 'border-slate-200/90 hover:border-slate-300 hover:shadow-xs'
                  }`}
                >
                  <div className="flex items-center justify-between text-slate-500 text-[11px] sm:text-xs font-semibold uppercase tracking-wider leading-none mb-1 pointer-events-none">
                    <span className="flex items-center gap-1">
                      PICKUP DATE <ChevronDown className={`w-3.5 h-3.5 text-[#90A1B9] transition-transform ${activeCalendar === 'ow-departure' ? 'rotate-180 text-emerald-700' : ''}`} />
                    </span>
                    {errors.travelDate && (
                      <AlertCircle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                    )}
                  </div>
                  <div className="text-slate-900 font-semibold text-sm sm:text-base leading-tight truncate pointer-events-none">
                    {formatDateToDayMonthFormat(travelDate)}
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
                    aria-label="Select pickup date"
                  />

                  <CalendarPopover
                    isOpen={activeCalendar === 'ow-departure'}
                    onClose={() => setActiveCalendar(null)}
                    selectedDate={travelDate}
                    minDate={getTodayDate()}
                    title="PICKUP DATE"
                    align="left"
                    onSelectDate={(newDate) => {
                      handleTravelDateChange(newDate);
                      setActiveCalendar(null);
                    }}
                  />
                </div>

                {/* PICKUP TIME */}
                <div
                  id="oneway-pickup-time-box"
                  className={`w-full lg:w-38 xl:w-44 relative border rounded-2xl bg-white p-3 sm:py-3 sm:px-4 transition-all duration-150 flex flex-col justify-between min-h-[74px] sm:min-h-[78px] shadow-2xs shrink-0 group ${
                    errors.pickupTime
                      ? 'border-rose-400 ring-2 ring-rose-200'
                      : 'border-slate-200/90 hover:border-slate-300 hover:shadow-xs'
                  }`}
                >
                  <div className="flex items-center justify-between text-slate-500 text-[11px] sm:text-xs font-semibold uppercase tracking-wider leading-none mb-1">
                    <span>PICKUP TIME</span>
                    {errors.pickupTime && (
                      <AlertCircle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                    )}
                  </div>
                  <div className="relative flex items-center">
                    <select
                      id="pickup-time-select"
                      value={formatTo12Hour(pickupTime)}
                      onChange={(e) => handlePickupTimeChange(e.target.value)}
                      onFocus={handleTimeSelectFocus}
                      className="w-full bg-transparent border-none p-0 text-slate-900 font-semibold text-sm sm:text-base focus:outline-none appearance-none cursor-pointer pr-4 tracking-tight"
                      aria-label="Select pickup time"
                    >
                      {pickupTimeOptions.map((timeOption) => (
                        <option
                          key={timeOption}
                          value={timeOption}
                          className="text-slate-900 font-semibold py-1"
                        >
                          {timeOption}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 text-[#90A1B9] absolute right-0 pointer-events-none transition-colors" />
                  </div>
                  {errors.pickupTime && (
                    <span className="text-[10px] text-rose-600 font-medium truncate block leading-tight">
                      {errors.pickupTime}
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* 3. HOURLY RENTAL / LOCAL (MATCHING SCREENSHOT 12.jpeg) */}
          {serviceType === 'local' && (
            <div className="w-full pt-1 pb-1">
              <div className="flex flex-col sm:grid sm:grid-cols-2 lg:flex lg:flex-row items-stretch gap-3 xl:gap-3.5 w-full">
                {/* 1. CITY */}
                <div className="flex-1 lg:flex-[1.4] min-w-0">
                  <LocationAutocompleteInput
                    id="local-pickup-location-input"
                    label="CITY"
                    variant="card-box"
                    placeholder="Bangalore, Karnataka"
                    value={pickupLocation}
                    selectedPlace={pickupLocationObj}
                    allowCurrentLocation={false}
                    showSearchIconLeft={true}
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

                {/* 2. PICKUP DATE */}
                <div
                  id="local-departure-date-box"
                  role="button"
                  tabIndex={0}
                  aria-label="Select pickup date"
                  aria-haspopup="dialog"
                  aria-expanded={activeCalendar === 'local-departure'}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      toggleCalendar('local-departure', e);
                    }
                  }}
                  onClick={(e) => toggleCalendar('local-departure', e)}
                  className={`flex-1 min-w-0 relative border rounded-2xl bg-white p-3 sm:py-3 sm:px-4 transition-all duration-150 flex flex-col justify-between min-h-[74px] sm:min-h-[78px] cursor-pointer shadow-2xs select-none group ${
                    errors.travelDate
                      ? 'border-rose-400 ring-2 ring-rose-200'
                      : activeCalendar === 'local-departure'
                      ? 'border-indigo-600 ring-2 ring-indigo-500/20'
                      : 'border-slate-200/90 hover:border-slate-300 hover:shadow-xs'
                  }`}
                >
                  <div className="flex items-center gap-1.5 text-slate-500 text-[11px] sm:text-xs font-semibold uppercase tracking-wider leading-none mb-1 pointer-events-none">
                    <span>PICKUP DATE</span>
                    <ChevronDown
                      className={`w-3.5 h-3.5 text-[#90A1B9] transition-transform ${
                        activeCalendar === 'local-departure' ? 'rotate-180' : ''
                      }`}
                    />
                    {errors.travelDate && (
                      <AlertCircle className="w-3.5 h-3.5 text-rose-500 ml-auto shrink-0" />
                    )}
                  </div>
                  <div className="text-slate-900 font-semibold text-sm sm:text-base leading-tight truncate pointer-events-none">
                    {formatDateToDayMonthFormat(travelDate)}
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
                    title="PICKUP DATE"
                    align="left"
                    onSelectDate={(newDate) => {
                      handleTravelDateChange(newDate);
                      setActiveCalendar(null);
                    }}
                  />
                </div>

                {/* 3. PICKUP-TIME */}
                <div
                  id="local-pickup-time-box"
                  className={`flex-1 min-w-0 relative border rounded-2xl bg-white p-3 sm:py-3 sm:px-4 transition-all duration-150 flex flex-col justify-between min-h-[74px] sm:min-h-[78px] shadow-2xs group ${
                    errors.pickupTime
                      ? 'border-rose-400 ring-2 ring-rose-200'
                      : 'border-slate-200/90 hover:border-slate-300 hover:shadow-xs'
                  }`}
                >
                  <div className="flex items-center justify-between text-slate-500 text-[11px] sm:text-xs font-semibold uppercase tracking-wider leading-none mb-1">
                    <span>PICKUP TIME</span>
                    {errors.pickupTime && (
                      <AlertCircle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                    )}
                  </div>
                  <div className="relative flex items-center">
                    <select
                      id="local-pickup-time-select"
                      value={formatTo12Hour(pickupTime)}
                      onChange={(e) => handlePickupTimeChange(e.target.value)}
                      onFocus={handleTimeSelectFocus}
                      className="w-full bg-transparent border-none p-0 text-slate-900 font-semibold text-sm sm:text-base focus:outline-none appearance-none cursor-pointer pr-5"
                      aria-label="Select pickup time"
                    >
                      {pickupTimeOptions.map((timeOption) => (
                        <option
                          key={timeOption}
                          value={timeOption}
                          className="text-slate-900 font-semibold py-1"
                        >
                          {timeOption}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 text-[#90A1B9] absolute right-0 pointer-events-none transition-colors" />
                  </div>
                  {errors.pickupTime && (
                    <span className="text-[10px] text-rose-600 font-medium truncate block leading-tight">
                      {errors.pickupTime}
                    </span>
                  )}
                </div>

                {/* 4. PACKAGES */}
                <div
                  id="local-duration-box"
                  className="flex-1 min-w-0 relative border border-slate-200/90 hover:border-slate-300 hover:shadow-xs rounded-2xl bg-white p-3 sm:py-3 sm:px-4 transition-all duration-150 flex flex-col justify-between min-h-[74px] sm:min-h-[78px] shadow-2xs group cursor-pointer"
                >
                  <div className="text-slate-500 text-[11px] sm:text-xs font-semibold uppercase tracking-wider leading-none mb-1 pointer-events-none">
                    PACKAGES
                  </div>
                  <div className="relative flex items-center">
                    <select
                      id="local-duration-select"
                      value={durationHours || 12}
                      onChange={(e) => {
                        registerUserActivity();
                        setDurationHours(Number(e.target.value));
                      }}
                      className="w-full bg-transparent border-none p-0 text-slate-900 font-semibold text-sm sm:text-base focus:outline-none appearance-none cursor-pointer pr-5"
                      aria-label="Select packages"
                    >
                      <option value={12} className="text-slate-900 font-semibold py-1">
                        12 HRS 120 KM
                      </option>
                      <option value={8} className="text-slate-900 font-semibold py-1">
                        8 HRS 80 KM
                      </option>
                      <option value={4} className="text-slate-900 font-semibold py-1">
                        4 HRS 40 KM
                      </option>
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 text-[#90A1B9] absolute right-0 pointer-events-none transition-colors" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 4. AIRPORT (5-BOX LAYOUT: TRIP, PICKUP AIRPORT/ADDRESS, DROP ADDRESS/AIRPORT, PICK UP DATE, PICK UP TIME) */}
          {serviceType === 'airport' && (
            <div className="w-full space-y-3.5">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-2.5 xl:gap-3 items-stretch">
                {/* 1. TRIP */}
                <div
                  id="airport-trip-box"
                  className="w-full relative border border-slate-200/90 hover:border-slate-300 rounded-2xl bg-white p-3 sm:py-3 sm:px-3.5 transition-all duration-150 flex flex-col justify-between min-h-[74px] sm:min-h-[78px] shadow-2xs group cursor-pointer"
                >
                  <div className="text-slate-500 text-[11px] sm:text-xs font-semibold uppercase tracking-wider leading-none mb-1 pointer-events-none">
                    TRIP
                  </div>
                  <div className="relative flex items-center">
                    <select
                      id="airport-trip-select"
                      value={airportTransferType}
                      onChange={(e) => handleAirportTypeSwitch(e.target.value as AirportTransferType)}
                      className="w-full bg-transparent border-none p-0 text-slate-900 font-semibold text-sm sm:text-base focus:outline-none appearance-none cursor-pointer pr-5"
                      aria-label="Select airport trip"
                    >
                      <option value="pickup">FROM AIRPORT</option>
                      <option value="drop">TO AIRPORT</option>
                    </select>
                    <ChevronDown className="w-4 h-4 text-[#90A1B9] absolute right-0 pointer-events-none transition-colors" />
                  </div>
                </div>

                {/* 2. PICKUP AIRPORT (if Pickup) / PICKUP ADDRESS (if Drop) */}
                <div className="w-full min-w-0">
                  <LocationAutocompleteInput
                    id="airport-pickup-input"
                    label={airportTransferType === 'pickup' ? 'PICKUP AIRPORT' : 'PICKUP ADDRESS'}
                    variant="card-box"
                    placeholder={airportTransferType === 'pickup' ? 'Enter Airport (e.g. BLR Airport)' : 'Enter Pickup Location'}
                    value={pickupLocation}
                    selectedPlace={pickupLocationObj}
                    allowCurrentLocation={airportTransferType === 'drop'}
                    showSearchIconLeft={airportTransferType === 'drop'}
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

                {/* 3. DROP ADDRESS (if Pickup) / DROP AIRPORT (if Drop) */}
                <div className="w-full min-w-0">
                  <LocationAutocompleteInput
                    id="airport-drop-input"
                    label={airportTransferType === 'pickup' ? 'DROP ADDRESS' : 'DROP AIRPORT'}
                    variant="card-box"
                    placeholder={airportTransferType === 'pickup' ? 'Enter Drop Location' : 'Enter Airport (e.g. BLR Airport)'}
                    value={dropLocation}
                    selectedPlace={dropLocationObj}
                    allowCurrentLocation={false}
                    showSearchIconLeft={airportTransferType === 'pickup'}
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

                {/* 4. PICK UP DATE */}
                <div
                  id="airport-departure-date-box"
                  role="button"
                  tabIndex={0}
                  aria-label="Select pickup date"
                  aria-haspopup="dialog"
                  aria-expanded={activeCalendar === 'airport-departure'}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      toggleCalendar('airport-departure', e);
                    }
                  }}
                  onClick={(e) => toggleCalendar('airport-departure', e)}
                  className={`w-full relative border rounded-2xl bg-white p-3 sm:py-3 sm:px-3.5 transition-all duration-150 flex flex-col justify-between min-h-[74px] sm:min-h-[78px] cursor-pointer shadow-2xs select-none group ${
                    errors.travelDate
                      ? 'border-rose-400 ring-2 ring-rose-200'
                      : activeCalendar === 'airport-departure'
                      ? 'border-emerald-600 ring-2 ring-emerald-500/20'
                      : 'border-slate-200/90 hover:border-slate-300 hover:shadow-xs'
                  }`}
                >
                  <div className="flex items-center justify-between text-slate-500 text-[11px] sm:text-xs font-semibold uppercase tracking-wider leading-none mb-1 pointer-events-none">
                    <span>PICKUP DATE</span>
                    {errors.travelDate && (
                      <AlertCircle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                    )}
                  </div>
                  <div className="relative flex items-center justify-between pointer-events-none">
                    <span className="text-slate-900 font-semibold text-sm sm:text-base leading-tight truncate">
                      {formatDateToDayMonthFormat(travelDate)}
                    </span>
                    <ChevronDown className={`w-4 h-4 text-[#90A1B9] transition-transform ${activeCalendar === 'airport-departure' ? 'rotate-180' : ''}`} />
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
                    title="PICKUP DATE"
                    align="right"
                    onSelectDate={(newDate) => {
                      handleTravelDateChange(newDate);
                      setActiveCalendar(null);
                    }}
                  />
                </div>

                {/* 5. PICK UP TIME */}
                <div
                  id="airport-pickup-time-box"
                  className={`w-full relative border rounded-2xl bg-white p-3 sm:py-3 sm:px-3.5 transition-all duration-150 flex flex-col justify-between min-h-[74px] sm:min-h-[78px] shadow-2xs group ${
                    errors.pickupTime
                      ? 'border-rose-400 ring-2 ring-rose-200'
                      : 'border-slate-200/90 hover:border-slate-300 hover:shadow-xs'
                  }`}
                >
                  <div className="flex items-center justify-between text-slate-500 text-[11px] sm:text-xs font-semibold uppercase tracking-wider leading-none mb-1">
                    <span>PICKUP TIME</span>
                    {errors.pickupTime && (
                      <AlertCircle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                    )}
                  </div>
                  <div className="relative flex items-center">
                    <select
                      id="airport-pickup-time-select"
                      value={formatTo12Hour(pickupTime)}
                      onChange={(e) => handlePickupTimeChange(e.target.value)}
                      onFocus={handleTimeSelectFocus}
                      className="w-full bg-transparent border-none p-0 text-slate-900 font-semibold text-sm sm:text-base focus:outline-none appearance-none cursor-pointer pr-5"
                      aria-label="Select airport pickup time"
                    >
                      {TIME_OPTIONS.map((t) => (
                        <option
                          key={t}
                          value={t}
                          className="text-slate-900 font-semibold py-1"
                        >
                          {t}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="w-4 h-4 text-[#90A1B9] absolute right-0 pointer-events-none transition-colors" />
                  </div>
                  {errors.pickupTime && (
                    <span className="text-[10px] text-rose-600 font-medium truncate block leading-tight">
                      {errors.pickupTime}
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

        {/* DYNAMIC ADDITIONAL ENROUTE STOPS (When added via '+' button) */}
        {serviceType !== 'local' && serviceType !== 'roundtrip' && viaLocations.length > 0 && (
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
            className="w-full max-w-[280px] h-[50px] sm:h-[52px] bg-[#ECFDF5] hover:bg-[#d1fae5] text-emerald-950 hover:text-emerald-900 border-2 border-emerald-300 hover:border-emerald-400 font-extrabold text-base sm:text-lg uppercase tracking-wider rounded-xl shadow-sm hover:shadow transition-all duration-150 active:scale-[0.99] flex items-center justify-center cursor-pointer select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50"
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
