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
  // Today's date in YYYY-MM-DD
  const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  const getTomorrowDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };

  const [serviceType, setServiceType] = useState<ServiceType>(
    initialState?.serviceType || 'oneway'
  );

  // Default locations: "Mysuru Palace, Mysuru" and "Kempegowda International Airport, Bengaluru"
  const [pickupLocation, setPickupLocation] = useState(
    initialState?.pickupLocation || 'Mysuru Palace, Mysuru'
  );
  const [pickupLocationObj, setPickupLocationObj] = useState<PlaceSuggestion | undefined>(
    initialState?.pickupLocationObj || {
      placeId: 'loc_mys_palace',
      placeName: 'Mysuru Palace, Mysuru (Amba Vilas Palace & Heritage Grounds)',
      areaLocality: 'Sayyaji Rao Rd, Agrahara',
      city: 'Mysuru, Karnataka',
      formattedAddress: 'Mysuru Palace, Sayyaji Rao Rd, Agrahara, Chamrajpura, Mysuru, Karnataka 570001',
      lat: 12.3051,
      lng: 76.6551,
      category: 'mysuru_local',
      types: ['tourist_attraction', 'locality'],
    }
  );
  const [dropLocation, setDropLocation] = useState(
    initialState?.dropLocation || 'Kempegowda International Airport, Bengaluru'
  );
  const [dropLocationObj, setDropLocationObj] = useState<PlaceSuggestion | undefined>(
    initialState?.dropLocationObj || {
      placeId: 'loc_kial_t1',
      placeName: 'Kempegowda International Airport Terminal 1 (BLR T1 / KIAL)',
      areaLocality: 'Devanahalli, North Bengaluru',
      city: 'Bengaluru, Karnataka',
      formattedAddress: 'Terminal 1, KIAL Rd, Devanahalli, Bengaluru, Karnataka 560300',
      lat: 13.1986,
      lng: 77.7066,
      isAirport: true,
      category: 'airports',
      types: ['airport', 'transit_station'],
    }
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

  // Default pickup time: 7:00 AM
  const [pickupTime, setPickupTime] = useState(
    initialState?.pickupTime ? formatTo12Hour(initialState.pickupTime) : '07:00 AM'
  );
  const [returnTime, setReturnTime] = useState(
    initialState?.returnTime ? formatTo12Hour(initialState.returnTime) : '07:00 PM'
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

  // Live route calculation state
  const [routeInfo, setRouteInfo] = useState<CalculatedRouteInfo | null>(
    initialState?.routeInfo || {
      distanceKm: 170.0,
      durationMinutes: 210,
      durationText: '3 hr 30 min',
      routeSummary: 'Mysuru Palace to Kempegowda International Airport via NH 275 Bengaluru-Mysuru Expressway',
      highwayCorridor: 'NH 275 Bengaluru-Mysuru Expressway + NH 44 Airport Corridor',
      tollEstimate: 320,
      recommendedService: 'airport',
      dataSource: 'google_maps',
      originCoords: { lat: 12.3051, lng: 76.6551 },
      destCoords: { lat: 13.1986, lng: 77.7066 },
      originPlaceId: 'loc_mys_palace',
      destPlaceId: 'loc_kial_t1',
    }
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
    setTravelDate(newDate);
    if (errors.travelDate) setErrors((prev) => ({ ...prev, travelDate: '' }));
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
  };

  const handleResetForm = useCallback(() => {
    setIsResetting(true);
    setPickupLocation('Mysuru Palace, Mysuru');
    setPickupLocationObj({
      placeId: 'loc_mys_palace',
      placeName: 'Mysuru Palace, Mysuru (Amba Vilas Palace & Heritage Grounds)',
      areaLocality: 'Sayyaji Rao Rd, Agrahara',
      city: 'Mysuru, Karnataka',
      formattedAddress: 'Mysuru Palace, Sayyaji Rao Rd, Agrahara, Chamrajpura, Mysuru, Karnataka 570001',
      lat: 12.3051,
      lng: 76.6551,
      category: 'mysuru_local',
      types: ['tourist_attraction', 'locality'],
    });
    setDropLocation('Kempegowda International Airport, Bengaluru');
    setDropLocationObj({
      placeId: 'loc_kial_t1',
      placeName: 'Kempegowda International Airport Terminal 1 (BLR T1 / KIAL)',
      areaLocality: 'Devanahalli, North Bengaluru',
      city: 'Bengaluru, Karnataka',
      formattedAddress: 'Terminal 1, KIAL Rd, Devanahalli, Bengaluru, Karnataka 560300',
      lat: 13.1986,
      lng: 77.7066,
      isAirport: true,
      category: 'airports',
      types: ['airport', 'transit_station'],
    });
    setRouteInfo({
      distanceKm: 170.0,
      durationMinutes: 210,
      durationText: '3 hr 30 min',
      routeSummary: 'Mysuru Palace to Kempegowda International Airport via NH 275 Bengaluru-Mysuru Expressway',
      highwayCorridor: 'NH 275 Bengaluru-Mysuru Expressway + NH 44 Airport Corridor',
      tollEstimate: 320,
      recommendedService: 'airport',
      dataSource: 'google_maps',
      originCoords: { lat: 12.3051, lng: 76.6551 },
      destCoords: { lat: 13.1986, lng: 77.7066 },
      originPlaceId: 'loc_mys_palace',
      destPlaceId: 'loc_kial_t1',
    });
    setViaLocations([]);
    setTravelDate(getTodayDate());
    setDropDate(getTomorrowDate());
    setReturnDate(getTomorrowDate());
    setPickupTime('07:00 AM');
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
      newErrors.pickupLocation = 'Please enter pickup location';
    }

    if (serviceType !== 'local' && !dropLocation.trim()) {
      newErrors.dropLocation = 'Please enter destination';
    }

    if (!travelDate) {
      newErrors.travelDate = 'Please select travel date';
    }

    if (serviceType === 'roundtrip' && !dropDate) {
      newErrors.dropDate = 'Please select return date';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const constructSearchPayload = (): BookingSearchState => {
    const validViaStops = viaLocations.filter((v) => v.trim().length > 0);
    const activeRoute =
      routeInfo ||
      estimateDrivingDistanceMatrix(
        pickupLocation,
        serviceType === 'local' ? 'Local Coverage' : dropLocation,
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
      pickupTime: formatTo24Hour(pickupTime),
      dropTime: serviceType === 'roundtrip' ? formatTo24Hour(returnTime) : undefined,
      returnTime: serviceType === 'roundtrip' ? formatTo24Hour(returnTime) : undefined,
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
        dropLocation: 'Unable to trace road route between these points. Please pick from suggested places.',
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
      className="bg-white rounded-[26px] shadow-sm border border-slate-200/80 p-5 sm:p-7 md:p-8 lg:px-10 lg:py-8 transition-all relative z-20 w-full"
    >
      <form onSubmit={handleSubmit} className="space-y-6 md:space-y-7">
        {/* TOP BOOKING TYPE TABS */}
        <ServiceSelector
          selectedService={serviceType}
          onSelectService={handleServiceChange}
        />

        {/* AIRPORT TRANSFER DIRECTION SELECTOR (When Airport tab is active) */}
        {serviceType === 'airport' && (
          <div className="flex justify-center">
            <div className="inline-flex rounded-lg border border-slate-300 p-1 bg-slate-50 gap-1 text-xs sm:text-sm font-bold">
              <button
                type="button"
                onClick={() => setAirportTransferType('pickup')}
                className={`px-4 py-1.5 rounded-md transition-all cursor-pointer ${
                  airportTransferType === 'pickup'
                    ? 'bg-[#D0FAE5] text-slate-900 font-bold shadow-xs border border-emerald-300/60'
                    : 'text-slate-700 hover:bg-slate-200/70'
                }`}
              >
                Pickup from Airport
              </button>
              <button
                type="button"
                onClick={() => setAirportTransferType('drop')}
                className={`px-4 py-1.5 rounded-md transition-all cursor-pointer ${
                  airportTransferType === 'drop'
                    ? 'bg-[#D0FAE5] text-slate-900 font-bold shadow-xs border border-emerald-300/60'
                    : 'text-slate-700 hover:bg-slate-200/70'
                }`}
              >
                Drop to Airport
              </button>
            </div>
          </div>
        )}

        {/* ONE WAY BOOKING FORM */}
        {serviceType === 'oneway' && (
          <div className="w-full">
            {/* Desktop: single horizontal row; Mobile/Tablet: vertical stacked */}
            <div className="flex flex-col lg:flex-row lg:items-end gap-5 lg:gap-4 xl:gap-6">
              {/* 1. FROM Field */}
              <div className="flex-1 min-w-0">
                <LocationAutocompleteInput
                  id="from-location-input"
                  label="FROM"
                  variant="underline"
                  showSearchIconLeft
                  placeholder="Enter pickup city, hotel, or station"
                  value={pickupLocation}
                  selectedPlace={pickupLocationObj}
                  allowCurrentLocation={true}
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

              {/* 2. SWAP BUTTON */}
              <div className="flex justify-center items-center lg:self-end lg:mb-1.5">
                <button
                  type="button"
                  id="swap-locations-btn"
                  onClick={handleSwapLocations}
                  title="Swap Pickup and Destination"
                  aria-label="Swap locations"
                  className="w-11 h-11 md:w-12 md:h-12 rounded-full bg-[#f1f3f5] hover:bg-[#e9ecef] border border-[#dee2e6] flex items-center justify-center transition-all duration-150 cursor-pointer shadow-2xs active:scale-95 group"
                >
                  <ArrowLeftRight className="w-5 h-5 text-[#14CD03] group-hover:rotate-180 transition-transform duration-300" />
                </button>
              </div>

              {/* 3. TO Field */}
              <div className="flex-1 min-w-0 relative">
                <div className="relative">
                  <LocationAutocompleteInput
                    id="to-location-input"
                    label="TO"
                    variant="underline"
                    showSearchIconLeft
                    placeholder="Enter destination city, hotel, or station"
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
              </div>

              {/* 4. PICK UP DATE Field */}
              <div className="w-full lg:w-44 xl:w-48 space-y-1">
                <label
                  htmlFor="pickup-date-display"
                  className="text-[12px] leading-[16px] font-bold uppercase tracking-wide text-[#0f2441] block whitespace-nowrap"
                >
                  PICK UP DATE
                </label>
                <div
                  id="pickup-date-display"
                  onClick={() => {
                    if (pickupDateInputRef.current?.showPicker) {
                      pickupDateInputRef.current.showPicker();
                    } else {
                      pickupDateInputRef.current?.focus();
                    }
                  }}
                  className="relative cursor-pointer border-b border-gray-300 pb-1.5 flex items-center justify-between hover:border-[#20A8D8] transition-colors"
                >
                  <span className="text-base md:text-lg lg:text-[19px] font-bold text-slate-900 select-none">
                    {formatDateToDDMMYYYY(travelDate)}
                  </span>
                  <ChevronDown className="w-5 h-5 text-[#20A8D8] shrink-0 pointer-events-none" />
                  <input
                    ref={pickupDateInputRef}
                    id="pickup-date-native-input"
                    type="date"
                    min={getTodayDate()}
                    value={travelDate}
                    onChange={(e) => handleTravelDateChange(e.target.value)}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    aria-label="Select pickup date"
                  />
                </div>
                {errors.travelDate && (
                  <p className="text-xs text-rose-600 font-medium mt-1">{errors.travelDate}</p>
                )}
              </div>

              {/* 5. PICK UP TIME Field */}
              <div className="w-full lg:w-36 xl:w-40 space-y-1">
                <label
                  htmlFor="pickup-time-select"
                  className="text-[12px] leading-[16px] font-bold uppercase tracking-wide text-[#0f2441] block whitespace-nowrap"
                >
                  PICK UP TIME
                </label>
                <div className="relative border-b border-gray-300 pb-1.5 flex items-center justify-between hover:border-[#20A8D8] transition-colors">
                  <select
                    id="pickup-time-select"
                    value={pickupTime}
                    onChange={(e) => setPickupTime(e.target.value)}
                    className="w-full bg-transparent border-none p-0 text-base md:text-lg lg:text-[19px] font-bold text-slate-900 focus:outline-none appearance-none cursor-pointer pr-6"
                    aria-label="Select pickup time"
                  >
                    {TIME_OPTIONS.map((timeOption) => (
                      <option key={timeOption} value={timeOption} className="text-slate-900 font-medium py-1">
                        {timeOption}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-5 h-5 text-[#20A8D8] shrink-0 pointer-events-none absolute right-0" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ROUND TRIP BOOKING FORM */}
        {serviceType === 'roundtrip' && (
          <div className="w-full space-y-5">
            {/* Top Row: FROM <SWAP> TO */}
            <div className="flex flex-col lg:flex-row lg:items-end gap-5 lg:gap-4 xl:gap-6">
              {/* FROM */}
              <div className="flex-1 min-w-0">
                <LocationAutocompleteInput
                  id="rt-from-location-input"
                  label="FROM"
                  variant="underline"
                  showSearchIconLeft
                  placeholder="Enter pickup city, hotel, or station"
                  value={pickupLocation}
                  selectedPlace={pickupLocationObj}
                  allowCurrentLocation={true}
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

              {/* SWAP */}
              <div className="flex justify-center items-center lg:self-end lg:mb-1.5">
                <button
                  type="button"
                  onClick={handleSwapLocations}
                  title="Swap Pickup and Destination"
                  aria-label="Swap locations"
                  className="w-11 h-11 md:w-12 md:h-12 rounded-full bg-[#f1f3f5] hover:bg-[#e9ecef] border border-[#dee2e6] flex items-center justify-center transition-all cursor-pointer shadow-2xs active:scale-95 group"
                >
                  <ArrowLeftRight className="w-5 h-5 text-[#14CD03] group-hover:rotate-180 transition-transform duration-300" />
                </button>
              </div>

              {/* TO with explicit "+ ADD STOP" */}
              <div className="flex-1 min-w-0 relative">
                <div className="relative">
                  <LocationAutocompleteInput
                    id="rt-to-location-input"
                    label="TO"
                    variant="underline"
                    showSearchIconLeft
                    placeholder="Enter destination city, hotel, or station"
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

                  {/* Explicit "+ ADD STOP" badge beside TO in Round Trip */}
                  <div className="absolute right-0 top-0">
                    <button
                      type="button"
                      id="rt-add-stop-explicit-btn"
                      onClick={handleAddStop}
                      title="Add enroute stop"
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-[#14CD03] hover:text-[#0fa302] bg-emerald-50/70 hover:bg-emerald-100 px-2.5 py-1 rounded-full border border-emerald-200 cursor-pointer transition-colors shadow-2xs"
                    >
                      <Plus className="w-3.5 h-3.5 text-[#14CD03]" />
                      <span>ADD STOP</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Row: Pickup Date, Pickup Time, Return Date, Return Time */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 lg:gap-6 pt-2">
              {/* Pickup Date */}
              <div className="space-y-1">
                <label className="text-[12px] leading-[16px] font-bold uppercase tracking-wide text-[#0f2441] block whitespace-nowrap">
                  PICK UP DATE
                </label>
                <div
                  onClick={() => {
                    if (pickupDateInputRef.current?.showPicker) {
                      pickupDateInputRef.current.showPicker();
                    } else {
                      pickupDateInputRef.current?.focus();
                    }
                  }}
                  className="relative cursor-pointer border-b border-gray-300 pb-1.5 flex items-center justify-between hover:border-[#20A8D8] transition-colors"
                >
                  <span className="text-base md:text-lg lg:text-[19px] font-bold text-slate-900 select-none">
                    {formatDateToDDMMYYYY(travelDate)}
                  </span>
                  <ChevronDown className="w-5 h-5 text-[#20A8D8] shrink-0 pointer-events-none" />
                  <input
                    ref={pickupDateInputRef}
                    type="date"
                    min={getTodayDate()}
                    value={travelDate}
                    onChange={(e) => handleTravelDateChange(e.target.value)}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    aria-label="Select pickup date"
                  />
                </div>
              </div>

              {/* Pickup Time */}
              <div className="space-y-1">
                <label className="text-[12px] leading-[16px] font-bold uppercase tracking-wide text-[#0f2441] block whitespace-nowrap">
                  PICK UP TIME
                </label>
                <div className="relative border-b border-gray-300 pb-1.5 flex items-center justify-between hover:border-[#20A8D8] transition-colors">
                  <select
                    value={pickupTime}
                    onChange={(e) => setPickupTime(e.target.value)}
                    className="w-full bg-transparent border-none p-0 text-base md:text-lg lg:text-[19px] font-bold text-slate-900 focus:outline-none appearance-none cursor-pointer pr-6"
                    aria-label="Select pickup time"
                  >
                    {TIME_OPTIONS.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                  <ChevronDown className="w-5 h-5 text-[#20A8D8] shrink-0 pointer-events-none absolute right-0" />
                </div>
              </div>

              {/* Return Date */}
              <div className="space-y-1">
                <label className="text-[12px] leading-[16px] font-bold uppercase tracking-wide text-[#0f2441] block whitespace-nowrap">
                  RETURN DATE
                </label>
                <div
                  onClick={() => {
                    if (dropDateInputRef.current?.showPicker) {
                      dropDateInputRef.current.showPicker();
                    } else {
                      dropDateInputRef.current?.focus();
                    }
                  }}
                  className="relative cursor-pointer border-b border-gray-300 pb-1.5 flex items-center justify-between hover:border-[#20A8D8] transition-colors"
                >
                  <span className="text-base md:text-lg lg:text-[19px] font-bold text-slate-900 select-none">
                    {formatDateToDDMMYYYY(dropDate)}
                  </span>
                  <ChevronDown className="w-5 h-5 text-[#20A8D8] shrink-0 pointer-events-none" />
                  <input
                    ref={dropDateInputRef}
                    type="date"
                    min={travelDate || getTodayDate()}
                    value={dropDate}
                    onChange={(e) => handleDropDateChange(e.target.value)}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    aria-label="Select return date"
                  />
                </div>
                {errors.dropDate && (
                  <p className="text-xs text-rose-600 font-medium mt-1">{errors.dropDate}</p>
                )}
              </div>

              {/* Return Time */}
              <div className="space-y-1">
                <label className="text-[12px] leading-[16px] font-bold uppercase tracking-wide text-[#0f2441] block whitespace-nowrap">
                  RETURN TIME
                </label>
                <div className="relative border-b border-gray-300 pb-1.5 flex items-center justify-between hover:border-[#20A8D8] transition-colors">
                  <select
                    value={returnTime}
                    onChange={(e) => setReturnTime(e.target.value)}
                    className="w-full bg-transparent border-none p-0 text-base md:text-lg lg:text-[19px] font-bold text-slate-900 focus:outline-none appearance-none cursor-pointer pr-6"
                    aria-label="Select return time"
                  >
                    {TIME_OPTIONS.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                  <ChevronDown className="w-5 h-5 text-[#20A8D8] shrink-0 pointer-events-none absolute right-0" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* LOCAL BOOKING FORM */}
        {serviceType === 'local' && (
          <div className="w-full">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 lg:gap-6 items-end">
              {/* 1. PICKUP LOCATION */}
              <div className="min-w-0">
                <LocationAutocompleteInput
                  id="local-pickup-location-input"
                  label="PICKUP LOCATION"
                  variant="underline"
                  showSearchIconLeft
                  placeholder="Enter pickup address, hotel, or landmark"
                  value={pickupLocation}
                  selectedPlace={pickupLocationObj}
                  allowCurrentLocation={true}
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

              {/* 2. DATE */}
              <div className="space-y-1">
                <label className="text-[12px] leading-[16px] font-bold uppercase tracking-wide text-[#0f2441] block whitespace-nowrap">
                  DATE
                </label>
                <div
                  onClick={() => {
                    if (pickupDateInputRef.current?.showPicker) {
                      pickupDateInputRef.current.showPicker();
                    } else {
                      pickupDateInputRef.current?.focus();
                    }
                  }}
                  className="relative cursor-pointer border-b border-gray-300 pb-1.5 flex items-center justify-between hover:border-[#20A8D8] transition-colors"
                >
                  <span className="text-base md:text-lg lg:text-[19px] font-bold text-slate-900 select-none">
                    {formatDateToDDMMYYYY(travelDate)}
                  </span>
                  <ChevronDown className="w-5 h-5 text-[#20A8D8] shrink-0 pointer-events-none" />
                  <input
                    ref={pickupDateInputRef}
                    type="date"
                    min={getTodayDate()}
                    value={travelDate}
                    onChange={(e) => handleTravelDateChange(e.target.value)}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    aria-label="Select date"
                  />
                </div>
              </div>

              {/* 3. START TIME */}
              <div className="space-y-1">
                <label className="text-[12px] leading-[16px] font-bold uppercase tracking-wide text-[#0f2441] block whitespace-nowrap">
                  START TIME
                </label>
                <div className="relative border-b border-gray-300 pb-1.5 flex items-center justify-between hover:border-[#20A8D8] transition-colors">
                  <select
                    value={pickupTime}
                    onChange={(e) => setPickupTime(e.target.value)}
                    className="w-full bg-transparent border-none p-0 text-base md:text-lg lg:text-[19px] font-bold text-slate-900 focus:outline-none appearance-none cursor-pointer pr-6"
                    aria-label="Select start time"
                  >
                    {TIME_OPTIONS.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                  <ChevronDown className="w-5 h-5 text-[#20A8D8] shrink-0 pointer-events-none absolute right-0" />
                </div>
              </div>

              {/* 4. DURATION / PACKAGE */}
              <div className="space-y-1">
                <label className="text-[12px] leading-[16px] font-bold uppercase tracking-wide text-[#0f2441] block whitespace-nowrap">
                  DURATION / PACKAGE
                </label>
                <div className="relative border-b border-gray-300 pb-1.5 flex items-center justify-between hover:border-[#20A8D8] transition-colors">
                  <select
                    value={durationHours}
                    onChange={(e) => setDurationHours(Number(e.target.value))}
                    className="w-full bg-transparent border-none p-0 text-base md:text-lg lg:text-[18px] font-bold text-slate-900 focus:outline-none appearance-none cursor-pointer pr-6"
                    aria-label="Select package duration"
                  >
                    <option value={4}>4 Hours / 40 Km</option>
                    <option value={8}>8 Hours / 80 Km</option>
                    <option value={12}>12 Hours / 120 Km</option>
                  </select>
                  <ChevronDown className="w-5 h-5 text-[#20A8D8] shrink-0 pointer-events-none absolute right-0" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* AIRPORT BOOKING FORM */}
        {serviceType === 'airport' && (
          <div className="w-full space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 lg:gap-6 items-end">
              {/* AIRPORT / PICKUP LOCATION */}
              <div className="min-w-0">
                <LocationAutocompleteInput
                  id="airport-pickup-input"
                  label={airportTransferType === 'pickup' ? 'AIRPORT LOCATION' : 'PICKUP LOCATION'}
                  variant="underline"
                  showSearchIconLeft
                  placeholder={
                    airportTransferType === 'pickup'
                      ? 'e.g. KIAL Bengaluru or Mysuru Airport'
                      : 'Enter your pickup address'
                  }
                  value={pickupLocation}
                  selectedPlace={pickupLocationObj}
                  allowCurrentLocation={airportTransferType !== 'pickup'}
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

              {/* DROP LOCATION */}
              <div className="min-w-0">
                <LocationAutocompleteInput
                  id="airport-drop-input"
                  label={airportTransferType === 'drop' ? 'AIRPORT LOCATION' : 'DROP LOCATION'}
                  variant="underline"
                  showSearchIconLeft
                  placeholder={
                    airportTransferType === 'drop'
                      ? 'e.g. KIAL Bengaluru Terminal 1/2'
                      : 'Enter your drop address'
                  }
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

              {/* DATE */}
              <div className="space-y-1">
                <label className="text-[12px] leading-[16px] font-bold uppercase tracking-wide text-[#0f2441] block whitespace-nowrap">
                  DATE
                </label>
                <div
                  onClick={() => {
                    if (pickupDateInputRef.current?.showPicker) {
                      pickupDateInputRef.current.showPicker();
                    } else {
                      pickupDateInputRef.current?.focus();
                    }
                  }}
                  className="relative cursor-pointer border-b border-gray-300 pb-1.5 flex items-center justify-between hover:border-[#20A8D8] transition-colors"
                >
                  <span className="text-base md:text-lg lg:text-[19px] font-bold text-slate-900 select-none">
                    {formatDateToDDMMYYYY(travelDate)}
                  </span>
                  <ChevronDown className="w-5 h-5 text-[#20A8D8] shrink-0 pointer-events-none" />
                  <input
                    ref={pickupDateInputRef}
                    type="date"
                    min={getTodayDate()}
                    value={travelDate}
                    onChange={(e) => handleTravelDateChange(e.target.value)}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    aria-label="Select airport date"
                  />
                </div>
              </div>

              {/* TIME */}
              <div className="space-y-1">
                <label className="text-[12px] leading-[16px] font-bold uppercase tracking-wide text-[#0f2441] block whitespace-nowrap">
                  TIME
                </label>
                <div className="relative border-b border-gray-300 pb-1.5 flex items-center justify-between hover:border-[#20A8D8] transition-colors">
                  <select
                    value={pickupTime}
                    onChange={(e) => setPickupTime(e.target.value)}
                    className="w-full bg-transparent border-none p-0 text-base md:text-lg lg:text-[19px] font-bold text-slate-900 focus:outline-none appearance-none cursor-pointer pr-6"
                    aria-label="Select airport time"
                  >
                    {TIME_OPTIONS.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                  <ChevronDown className="w-5 h-5 text-[#20A8D8] shrink-0 pointer-events-none absolute right-0" />
                </div>
              </div>
            </div>

            {/* Optional Flight Number */}
            <div className="max-w-md pt-1">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-1">
                Flight Number (Optional)
              </label>
              <div className="border-b border-gray-300 pb-1.5 flex items-center gap-2 focus-within:border-[#20A8D8] transition-colors">
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
        {viaLocations.length > 0 && (
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
        {routeInfo && routeInfo.distanceKm > 0 && (
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

            {/* ROUTE Highway Description, Tolls & Interstate Badges */}
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

              <div className="flex items-center gap-2 flex-wrap">
                {routeInfo.isInterstate && (
                  <div className="flex items-center gap-1 text-purple-800 bg-purple-50 border border-purple-200 px-2.5 py-0.5 rounded-lg font-bold text-[11px]">
                    <span>Interstate ({routeInfo.interstateStates?.fromState || 'KA'} → {routeInfo.interstateStates?.toState || 'Outstation'})</span>
                    {routeInfo.interstateTaxEstimate ? (
                      <span className="font-normal text-purple-600">· Permit ~₹{routeInfo.interstateTaxEstimate}</span>
                    ) : null}
                  </div>
                )}

                {typeof routeInfo.tollEstimate === 'number' && routeInfo.tollEstimate > 0 && (
                  <div className="flex items-center gap-1 text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-lg font-bold text-[11px]">
                    <span>Fastag Tolls: ₹{routeInfo.tollEstimate}</span>
                  </div>
                )}
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
        {routeInfo && (routeInfo.validationStatus === 'NO_ROUTE_FOUND' || routeInfo.validationStatus === 'SANITY_CHECK_FAILED') && (
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

        {/* PRIMARY CTA BUTTON: EXPLORE CABS */}
        <div className="flex flex-col items-center justify-center pt-2 sm:pt-3">
          <button
            type="submit"
            id="explore-cabs-primary-btn"
            className="w-full max-w-[280px] h-[48px] sm:h-[50px] bg-[#A4F4CF] hover:bg-[#8ee8be] text-slate-900 font-extrabold text-base sm:text-lg uppercase tracking-wide rounded-lg shadow-sm hover:shadow transition-all duration-150 active:scale-[0.99] flex items-center justify-center cursor-pointer select-none"
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
  );
};
