import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  ArrowRightLeft,
  Search,
  Plane,
  ChevronDown,
  RotateCcw,
  Plus,
  X,
  MapPin,
} from 'lucide-react';
import {
  BookingSearchState,
  PricingConfig,
  ServiceType,
  AirportTransferType,
  PlaceSuggestion,
} from '../types';
import { LocationAutocompleteInput } from './LocationAutocompleteInput';
import { CalendarPopover } from './CalendarPopover';
import { ServiceSelector } from './ServiceSelector';
import { calculateRouteDistance } from '../services/googleMapsService';

interface BookingSearchProps {
  initialState?: Partial<BookingSearchState>;
  onSearch?: (searchState: BookingSearchState) => void;
  onConfirmBooking?: (searchState: BookingSearchState, preferredVehicleId?: string) => void;
  onReset?: () => void;
  isCompact?: boolean;
  pricingConfig?: PricingConfig;
}

const LOCAL_PACKAGES = [
  { hours: 4, kms: 40, label: '4 HRS 40 KM' },
  { hours: 8, kms: 80, label: '8 HRS 80 KM' },
  { hours: 12, kms: 120, label: '12 HRS 120 KM' },
];

const TIME_OPTIONS = [
  '05:00 AM', '05:30 AM', '06:00 AM', '06:30 AM',
  '07:00 AM', '07:30 AM', '08:00 AM', '08:30 AM',
  '09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM',
  '11:00 AM', '11:30 AM', '12:00 PM', '12:30 PM',
  '01:00 PM', '01:30 PM', '02:00 PM', '02:30 PM',
  '03:00 PM', '03:30 PM', '04:00 PM', '04:30 PM',
  '05:00 PM', '05:30 PM', '06:00 PM', '06:30 PM',
  '07:00 PM', '07:30 PM', '08:00 PM', '08:30 PM',
  '09:00 PM', '09:30 PM', '10:00 PM', '10:30 PM',
  '11:00 PM', '11:30 PM',
];

const AIRPORT_LIST = [
  { id: 'BLR', name: 'Bengaluru Kempegowda Airport (BLR)' },
  { id: 'MYQ', name: 'Mysuru Mandakalli Airport (MYQ)' },
  { id: 'COK', name: 'Kochi Cochin International Airport (COK)' },
  { id: 'CJB', name: 'Coimbatore International Airport (CJB)' },
  { id: 'MAA', name: 'Chennai International Airport (MAA)' },
];

export const BookingSearch: React.FC<BookingSearchProps> = ({
  initialState,
  onSearch,
  onReset,
}) => {
  const getTodayStr = () => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const [serviceType, setServiceType] = useState<ServiceType>(
    initialState?.serviceType || 'oneway'
  );

  // Form Fields
  const [pickupLocation, setPickupLocation] = useState<string>(
    initialState?.pickupLocation || 'Bangalore, Karnataka'
  );
  const [pickupLocationObj, setPickupLocationObj] = useState<PlaceSuggestion | undefined>(
    initialState?.pickupLocationObj
  );

  const [dropLocation, setDropLocation] = useState<string>(
    initialState?.dropLocation || 'Mysuru, Karnataka'
  );
  const [dropLocationObj, setDropLocationObj] = useState<PlaceSuggestion | undefined>(
    initialState?.dropLocationObj
  );

  // Additional stops for ROUND TRIP
  const [intermediateStops, setIntermediateStops] = useState<string[]>([]);
  const [showAddStopInput, setShowAddStopInput] = useState(false);
  const [newStopText, setNewStopText] = useState('');

  // Airport transfer type: 'pickup' (from Airport) or 'drop' (to Airport)
  const [airportTransferType, setAirportTransferType] = useState<AirportTransferType>(
    initialState?.airportTransferType || 'drop'
  );
  const [selectedAirport, setSelectedAirport] = useState<string>(
    'Bengaluru Kempegowda Airport (BLR)'
  );

  // Dates & Times
  const [travelDate, setTravelDate] = useState<string>(
    initialState?.travelDate || initialState?.pickupDate || getTodayStr()
  );
  const [returnDate, setReturnDate] = useState<string>(
    initialState?.returnDate || getTodayStr()
  );
  const [pickupTime, setPickupTime] = useState<string>(
    initialState?.pickupTime || '9:00 AM'
  );
  const [durationHours, setDurationHours] = useState<number>(
    initialState?.durationHours || 4
  );

  // Popover controls
  const [isPickupCalendarOpen, setIsPickupCalendarOpen] = useState(false);
  const [isReturnCalendarOpen, setIsReturnCalendarOpen] = useState(false);
  const [isSearchingRoute, setIsSearchingRoute] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // External initialState syncing
  useEffect(() => {
    if (initialState) {
      if (initialState.serviceType) setServiceType(initialState.serviceType);
      if (initialState.pickupLocation !== undefined) setPickupLocation(initialState.pickupLocation);
      if (initialState.pickupLocationObj !== undefined) setPickupLocationObj(initialState.pickupLocationObj);
      if (initialState.dropLocation !== undefined) setDropLocation(initialState.dropLocation);
      if (initialState.dropLocationObj !== undefined) setDropLocationObj(initialState.dropLocationObj);
      if (initialState.travelDate) setTravelDate(initialState.travelDate);
      if (initialState.pickupDate) setTravelDate(initialState.pickupDate);
      if (initialState.returnDate) setReturnDate(initialState.returnDate);
      if (initialState.pickupTime) setPickupTime(initialState.pickupTime);
      if (initialState.durationHours) setDurationHours(initialState.durationHours);
      if (initialState.airportTransferType) setAirportTransferType(initialState.airportTransferType);
    }
  }, [initialState]);

  // When switching service types, adjust defaults to match screenshots
  const handleServiceTypeChange = (type: ServiceType) => {
    setServiceType(type);
    setValidationError(null);
    setShowAddStopInput(false);

    if (type === 'local') {
      if (!pickupLocation) setPickupLocation('Bangalore, Karnataka');
    } else if (type === 'oneway') {
      if (!pickupLocation) setPickupLocation('Bangalore, Karnataka');
      if (!dropLocation) setDropLocation('Mysuru, Karnataka');
    } else if (type === 'roundtrip') {
      if (!pickupLocation) setPickupLocation('Bangalore, Karnataka');
      if (!dropLocation) setDropLocation('Mysuru, Karnataka');
    } else if (type === 'airport') {
      if (!pickupLocation) setPickupLocation('Bangalore, Karnataka');
    }
  };

  // Swap pickup & drop locations
  const handleSwapLocations = () => {
    const tempLoc = pickupLocation;
    const tempObj = pickupLocationObj;
    setPickupLocation(dropLocation);
    setPickupLocationObj(dropLocationObj);
    setDropLocation(tempLoc);
    setDropLocationObj(tempObj);
  };

  // Format date display: e.g. "Fri, Oct 9"
  const formatDateDisplay = (dateStr: string) => {
    try {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
        return d.toLocaleDateString('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
        });
      }
    } catch {
      // fallback
    }
    return dateStr;
  };

  // Compute round-trip duration in days
  const getRoundTripDuration = () => {
    if (!travelDate || !returnDate) return 1;
    const sParts = travelDate.split('-').map(Number);
    const eParts = returnDate.split('-').map(Number);
    if (sParts.length === 3 && eParts.length === 3) {
      const sUtc = Date.UTC(sParts[0], sParts[1] - 1, sParts[2]);
      const eUtc = Date.UTC(eParts[0], eParts[1] - 1, eParts[2]);
      return Math.max(1, Math.floor((eUtc - sUtc) / (1000 * 60 * 60 * 24)) + 1);
    }
    return 1;
  };

  // Reset details
  const handleReset = () => {
    setPickupLocation('Bangalore, Karnataka');
    setPickupLocationObj(undefined);
    setDropLocation('Mysuru, Karnataka');
    setDropLocationObj(undefined);
    setIntermediateStops([]);
    setShowAddStopInput(false);
    setNewStopText('');
    setTravelDate(getTodayStr());
    setReturnDate(getTodayStr());
    setPickupTime('9:00 AM');
    setDurationHours(4);
    setAirportTransferType('drop');
    setSelectedAirport('Bengaluru Kempegowda Airport (BLR)');
    setValidationError(null);
    if (onReset) onReset();
  };

  // Add intermediate stop
  const handleAddStop = () => {
    if (newStopText.trim()) {
      setIntermediateStops((prev) => [...prev, newStopText.trim()]);
      setNewStopText('');
      setShowAddStopInput(false);
    }
  };

  const handleRemoveStop = (index: number) => {
    setIntermediateStops((prev) => prev.filter((_, i) => i !== index));
  };

  // Submit search
  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setValidationError(null);

    if (serviceType === 'local') {
      if (!pickupLocation.trim()) {
        setValidationError('Please specify city.');
        return;
      }
    } else if (serviceType === 'airport') {
      if (airportTransferType === 'pickup') {
        if (!dropLocation.trim()) {
          setValidationError('Please specify destination city/address.');
          return;
        }
      } else {
        if (!pickupLocation.trim()) {
          setValidationError('Please specify pickup city/address.');
          return;
        }
      }
    } else {
      if (!pickupLocation.trim()) {
        setValidationError('Please specify pickup location.');
        return;
      }
      if (!dropLocation.trim()) {
        setValidationError('Please specify destination.');
        return;
      }
    }

    if (serviceType === 'roundtrip' && returnDate < travelDate) {
      setValidationError('Return date cannot be earlier than pickup date.');
      return;
    }

    setIsSearchingRoute(true);

    try {
      let routeInfo = undefined;
      let calculatedDistance = undefined;

      const origin = serviceType === 'airport' && airportTransferType === 'pickup' ? selectedAirport : pickupLocation;
      const destination = serviceType === 'airport' && airportTransferType === 'drop' ? selectedAirport : dropLocation;

      if (serviceType !== 'local' && origin && destination) {
        try {
          const calc = await calculateRouteDistance(origin, destination);
          if (calc && calc.validationStatus === 'VALID') {
            routeInfo = calc;
            calculatedDistance = calc.distanceKm;
          }
        } catch (routeErr) {
          console.warn('Live route calculation note:', routeErr);
        }
      }

      const searchState: BookingSearchState = {
        serviceType,
        pickupLocation: origin.trim(),
        pickupLocationObj,
        dropLocation: serviceType === 'local' ? '' : destination.trim(),
        dropLocationObj: serviceType === 'local' ? undefined : dropLocationObj,
        travelDate,
        pickupDate: travelDate,
        dropDate: serviceType === 'roundtrip' ? returnDate : travelDate,
        returnDate: serviceType === 'roundtrip' ? returnDate : undefined,
        pickupTime,
        durationHours: serviceType === 'local' ? durationHours : 8,
        airportTransferType: serviceType === 'airport' ? airportTransferType : 'pickup',
        passengers: 2,
        vehicleType: 'all',
        routeInfo,
        distanceKm: calculatedDistance,
      };

      if (onSearch) {
        onSearch(searchState);
      }
    } catch (err) {
      console.error('Search preparation error:', err);
      setValidationError('Unable to complete route lookup. Please try again.');
    } finally {
      setIsSearchingRoute(false);
    }
  };

  return (
    <div
      id="travel-just-booking-widget"
      className="bg-white dark:bg-slate-900 rounded-3xl sm:rounded-[32px] shadow-xl shadow-slate-200/50 dark:shadow-none border border-[#E0E5EC] dark:border-slate-800 relative"
    >
      {/* Category Tabs Header across full width */}
      <div
        id="booking-header-tabs-section"
        className="w-full bg-[#D0F9E5] px-4 py-3.5 sm:py-4 lg:py-5 border-b border-[#00D99A]/20 flex items-center justify-center rounded-t-3xl sm:rounded-t-[31px]"
      >
        <ServiceSelector
          selectedService={serviceType}
          onSelectService={(service) => {
            setServiceType(service);
            setValidationError(null);
          }}
          disabled={isSearchingRoute}
        />
      </div>

      {/* Clean White Form Area with Large Rounded Input Containers & Thin Gray-Blue Borders (#E0E5EC) */}
      <div className="p-4 sm:p-7 md:p-8 lg:p-9 bg-white dark:bg-slate-900">
        <form onSubmit={handleSubmit}>
          {validationError && (
            <div className="mb-4 p-3.5 bg-red-50 border border-red-200 rounded-2xl text-xs sm:text-sm font-semibold text-red-700 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-600 shrink-0" />
              <span>{validationError}</span>
            </div>
          )}

          {/* =========================================================================
              LOCAL FORM
              Four fields in one horizontal desktop row:
              1. CITY (Location autocomplete with green pin #00A878)
              2. PICKUP DATE
              3. PICKUP TIME
              4. PACKAGES
          ========================================================================== */}
          {serviceType === 'local' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4 items-stretch">
              {/* Field 1: CITY */}
              <div className="w-full">
                <LocationAutocompleteInput
                  id="local-city-location-input"
                  label="CITY"
                  placeholder="Bangalore, Karnataka"
                  value={pickupLocation}
                  onChange={(val, obj) => {
                    setPickupLocation(val);
                    if (obj) setPickupLocationObj(obj);
                  }}
                  selectedPlace={pickupLocationObj}
                  variant="card-box"
                  iconType="pickup"
                  onClear={() => {
                    setPickupLocation('');
                    setPickupLocationObj(undefined);
                  }}
                />
              </div>

              {/* Field 2: PICKUP DATE */}
              <div
                role="button"
                tabIndex={0}
                aria-label={`Select Pickup Date, currently ${formatDateDisplay(travelDate)}`}
                onClick={() => setIsPickupCalendarOpen((prev) => !prev)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setIsPickupCalendarOpen((prev) => !prev);
                  }
                }}
                className={`relative rounded-2xl border bg-white dark:bg-slate-800 p-3 sm:py-3.5 sm:px-4 flex flex-col justify-between min-h-[74px] sm:min-h-[80px] cursor-pointer transition-all select-none ${
                  isPickupCalendarOpen
                    ? 'border-2 border-[#00D99A] ring-2 ring-[#00D99A]/20 shadow-xs'
                    : 'border-[#E0E5EC] dark:border-slate-700 hover:border-[#ccd4e0]'
                }`}
              >
                <span className="text-[#8EA3C2] text-xs sm:text-[13px] lg:text-[14px] font-bold uppercase tracking-wider leading-none block">
                  PICKUP DATE
                </span>
                <div className="flex items-center justify-between w-full mt-1">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-[#00A878] shrink-0" />
                    <span className="text-[#10233F] dark:text-white font-bold text-sm sm:text-base lg:text-[18px] xl:text-[20px]">
                      {formatDateDisplay(travelDate)}
                    </span>
                  </div>
                  <ChevronDown
                    className={`w-4 h-4 text-[#24364E] dark:text-slate-400 shrink-0 transition-transform duration-200 ${
                      isPickupCalendarOpen ? 'rotate-180 text-[#00A878]' : ''
                    }`}
                  />
                </div>
                <CalendarPopover
                  isOpen={isPickupCalendarOpen}
                  onClose={() => setIsPickupCalendarOpen(false)}
                  selectedDate={travelDate}
                  minDate={getTodayStr()}
                  onSelectDate={(date) => {
                    setTravelDate(date);
                    setIsPickupCalendarOpen(false);
                  }}
                  title="Select Pickup Date"
                />
              </div>

              {/* Field 3: PICKUP TIME */}
              <div className="relative rounded-2xl border border-[#E0E5EC] dark:border-slate-700 bg-white dark:bg-slate-800 p-3 sm:py-3.5 sm:px-4 flex flex-col justify-between min-h-[74px] sm:min-h-[80px]">
                <span className="text-[#8EA3C2] text-xs sm:text-[13px] lg:text-[14px] font-bold uppercase tracking-wider leading-none block">
                  PICKUP TIME
                </span>
                <div className="relative flex items-center justify-between mt-1">
                  <div className="flex items-center gap-2 w-full">
                    <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-[#8EA3C2] shrink-0 pointer-events-none" />
                    <select
                      value={pickupTime}
                      onChange={(e) => setPickupTime(e.target.value)}
                      className="w-full bg-transparent border-none p-0 text-[#10233F] dark:text-white font-bold text-sm sm:text-base lg:text-[18px] xl:text-[20px] appearance-none focus:outline-none cursor-pointer pr-6"
                    >
                      {TIME_OPTIONS.map((t) => (
                        <option key={t} value={t} className="bg-white dark:bg-slate-900 text-[#10233F]">
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>
                  <ChevronDown className="w-4 h-4 text-[#24364E] dark:text-slate-400 shrink-0 absolute right-0 pointer-events-none" />
                </div>
              </div>

              {/* Field 4: PACKAGES */}
              <div className="relative rounded-2xl border border-[#E0E5EC] dark:border-slate-700 bg-white dark:bg-slate-800 p-3 sm:py-3.5 sm:px-4 flex flex-col justify-between min-h-[74px] sm:min-h-[80px]">
                <span className="text-[#8EA3C2] text-xs sm:text-[13px] lg:text-[14px] font-bold uppercase tracking-wider leading-none block">
                  PACKAGES
                </span>
                <div className="relative flex items-center justify-between mt-1">
                  <select
                    value={durationHours}
                    onChange={(e) => setDurationHours(Number(e.target.value))}
                    className="w-full bg-transparent border-none p-0 text-[#10233F] dark:text-white font-bold text-sm sm:text-base lg:text-[18px] xl:text-[20px] appearance-none focus:outline-none cursor-pointer pr-6"
                  >
                    {LOCAL_PACKAGES.map((pkg) => (
                      <option key={pkg.hours} value={pkg.hours} className="bg-white dark:bg-slate-900 text-[#10233F]">
                        {pkg.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-[#24364E] dark:text-slate-400 shrink-0 absolute right-0 pointer-events-none" />
                </div>
              </div>
            </div>
          )}

          {/* =========================================================================
              ONEWAY FORM
              Desktop field arrangement:
              1. FROM (Location autocomplete with green pin #00A878)
              2. Route swap control (circular white button with opposing arrows #10233F)
              3. TO (Location autocomplete with Google Maps suggestions)
              4. PICKUP DATE (Calendar picker)
              5. PICKUP TIME (Dropdown with #24364E chevron)
          ========================================================================== */}
          {serviceType === 'oneway' && (
            <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3">
              {/* FROM */}
              <div className="flex-1">
                <LocationAutocompleteInput
                  id="oneway-from-location-input"
                  label="FROM"
                  placeholder="Bangalore, Karnataka"
                  value={pickupLocation}
                  onChange={(val, obj) => {
                    setPickupLocation(val);
                    if (obj) setPickupLocationObj(obj);
                  }}
                  selectedPlace={pickupLocationObj}
                  variant="card-box"
                  iconType="pickup"
                  onClear={() => {
                    setPickupLocation('');
                    setPickupLocationObj(undefined);
                  }}
                />
              </div>

              {/* Route swap control: circular white button */}
              <div className="flex items-center justify-center -my-1 lg:my-0 shrink-0">
                <button
                  type="button"
                  onClick={handleSwapLocations}
                  title="Swap Origin and Destination"
                  className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-white dark:bg-slate-800 border border-[#E0E5EC] dark:border-slate-700 shadow-2xs hover:shadow-xs hover:border-[#00D99A] hover:bg-[#D0F9E5]/30 transition-all flex items-center justify-center text-[#10233F] dark:text-slate-200 cursor-pointer active:scale-90"
                >
                  <ArrowRightLeft className="w-4 h-4 sm:w-5 sm:h-5 text-[#10233F] dark:text-slate-200" />
                </button>
              </div>

              {/* TO */}
              <div className="flex-1">
                <LocationAutocompleteInput
                  id="oneway-to-location-input"
                  label="TO"
                  placeholder="Mysuru, Karnataka"
                  value={dropLocation}
                  onChange={(val, obj) => {
                    setDropLocation(val);
                    if (obj) setDropLocationObj(obj);
                  }}
                  selectedPlace={dropLocationObj}
                  variant="card-box"
                  iconType="drop"
                  onClear={() => {
                    setDropLocation('');
                    setDropLocationObj(undefined);
                  }}
                />
              </div>

              {/* PICKUP DATE */}
              <div
                role="button"
                tabIndex={0}
                aria-label={`Select Pickup Date, currently ${formatDateDisplay(travelDate)}`}
                onClick={() => setIsPickupCalendarOpen((prev) => !prev)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setIsPickupCalendarOpen((prev) => !prev);
                  }
                }}
                className={`relative w-full lg:w-48 rounded-2xl border bg-white dark:bg-slate-800 p-3 sm:py-3.5 sm:px-4 flex flex-col justify-between min-h-[74px] sm:min-h-[80px] cursor-pointer transition-all select-none ${
                  isPickupCalendarOpen
                    ? 'border-2 border-[#00D99A] ring-2 ring-[#00D99A]/20 shadow-xs'
                    : 'border-[#E0E5EC] dark:border-slate-700 hover:border-[#ccd4e0]'
                }`}
              >
                <span className="text-[#8EA3C2] text-xs sm:text-[13px] lg:text-[14px] font-bold uppercase tracking-wider leading-none block">
                  PICKUP DATE
                </span>
                <div className="flex items-center justify-between w-full mt-1">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-[#00A878] shrink-0" />
                    <span className="text-[#10233F] dark:text-white font-bold text-sm sm:text-base lg:text-[18px] xl:text-[20px]">
                      {formatDateDisplay(travelDate)}
                    </span>
                  </div>
                  <ChevronDown
                    className={`w-4 h-4 text-[#24364E] dark:text-slate-400 shrink-0 transition-transform duration-200 ${
                      isPickupCalendarOpen ? 'rotate-180 text-[#00A878]' : ''
                    }`}
                  />
                </div>
                <CalendarPopover
                  isOpen={isPickupCalendarOpen}
                  onClose={() => setIsPickupCalendarOpen(false)}
                  selectedDate={travelDate}
                  minDate={getTodayStr()}
                  onSelectDate={(date) => {
                    setTravelDate(date);
                    setIsPickupCalendarOpen(false);
                  }}
                  title="Select Pickup Date"
                  align="right"
                />
              </div>

              {/* PICKUP TIME */}
              <div className="w-full lg:w-40 rounded-2xl border border-[#E0E5EC] dark:border-slate-700 bg-white dark:bg-slate-800 p-3 sm:py-3.5 sm:px-4 flex flex-col justify-between min-h-[74px] sm:min-h-[80px]">
                <span className="text-[#8EA3C2] text-xs sm:text-[13px] lg:text-[14px] font-bold uppercase tracking-wider leading-none block">
                  PICKUP TIME
                </span>
                <div className="relative flex items-center justify-between mt-1">
                  <div className="flex items-center gap-2 w-full">
                    <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-[#8EA3C2] shrink-0 pointer-events-none" />
                    <select
                      value={pickupTime}
                      onChange={(e) => setPickupTime(e.target.value)}
                      className="w-full bg-transparent border-none p-0 text-[#10233F] dark:text-white font-bold text-sm sm:text-base lg:text-[18px] xl:text-[20px] appearance-none focus:outline-none cursor-pointer pr-5"
                    >
                      {TIME_OPTIONS.map((t) => (
                        <option key={t} value={t} className="bg-white dark:bg-slate-900 text-[#10233F]">
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>
                  <ChevronDown className="w-4 h-4 text-[#24364E] dark:text-slate-400 shrink-0 absolute right-0 pointer-events-none" />
                </div>
              </div>
            </div>
          )}

          {/* =========================================================================
              ROUND TRIP FORM
              Desktop field arrangement:
              1. FROM (Location autocomplete with green pin #00A878)
              2. Route swap control
              3. TO (+ Add intermediate stop button)
              4. PICK UP DATE (Range connected)
              5. RETURN DATE (Range connected with duration badge)
              6. TIME
          ========================================================================== */}
          {serviceType === 'roundtrip' && (
            <div className="space-y-3">
              <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3">
                {/* FROM */}
                <div className="flex-1">
                  <LocationAutocompleteInput
                    id="roundtrip-from-location-input"
                    label="FROM"
                    placeholder="Bangalore, Karnataka"
                    value={pickupLocation}
                    onChange={(val, obj) => {
                      setPickupLocation(val);
                      if (obj) setPickupLocationObj(obj);
                    }}
                    selectedPlace={pickupLocationObj}
                    variant="card-box"
                    iconType="pickup"
                    onClear={() => {
                      setPickupLocation('');
                      setPickupLocationObj(undefined);
                    }}
                  />
                </div>

                {/* Route swap control */}
                <div className="flex items-center justify-center -my-1 lg:my-0 shrink-0">
                  <button
                    type="button"
                    onClick={handleSwapLocations}
                    title="Swap Origin and Destination"
                    className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-white dark:bg-slate-800 border border-[#E0E5EC] dark:border-slate-700 shadow-2xs hover:shadow-xs hover:border-[#00D99A] hover:bg-[#D0F9E5]/30 transition-all flex items-center justify-center text-[#10233F] dark:text-slate-200 cursor-pointer active:scale-90"
                  >
                    <ArrowRightLeft className="w-4 h-4 sm:w-5 sm:h-5 text-[#10233F] dark:text-slate-200" />
                  </button>
                </div>

                {/* TO + Green plus icon */}
                <div className="flex-1 relative">
                  <LocationAutocompleteInput
                    id="roundtrip-to-location-input"
                    label="TO"
                    placeholder="Mysuru, Karnataka"
                    value={dropLocation}
                    onChange={(val, obj) => {
                      setDropLocation(val);
                      if (obj) setDropLocationObj(obj);
                    }}
                    selectedPlace={dropLocationObj}
                    variant="card-box"
                    iconType="drop"
                    onClear={() => {
                      setDropLocation('');
                      setDropLocationObj(undefined);
                    }}
                    rightActions={
                      <button
                        type="button"
                        onClick={() => setShowAddStopInput(!showAddStopInput)}
                        title="Add intermediate stop"
                        className="w-5 h-5 rounded-full bg-[#D0F9E5] hover:bg-[#bbf3db] flex items-center justify-center text-[#075441] cursor-pointer transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                      </button>
                    }
                  />
                </div>

                {/* PICK UP DATE */}
                <div
                  role="button"
                  tabIndex={0}
                  aria-label={`Select Pickup Date, currently ${formatDateDisplay(travelDate)}`}
                  onClick={() => {
                    setIsPickupCalendarOpen((prev) => !prev);
                    setIsReturnCalendarOpen(false);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setIsPickupCalendarOpen((prev) => !prev);
                      setIsReturnCalendarOpen(false);
                    }
                  }}
                  className={`relative w-full lg:w-44 rounded-2xl border bg-white dark:bg-slate-800 p-3 sm:py-3.5 sm:px-4 flex flex-col justify-between min-h-[74px] sm:min-h-[80px] cursor-pointer transition-all select-none ${
                    isPickupCalendarOpen
                      ? 'border-2 border-[#00D99A] ring-2 ring-[#00D99A]/20 shadow-xs'
                      : 'border-[#E0E5EC] dark:border-slate-700 hover:border-[#ccd4e0]'
                  }`}
                >
                  <span className="text-[#8EA3C2] text-xs sm:text-[13px] lg:text-[14px] font-bold uppercase tracking-wider leading-none block">
                    PICK UP DATE
                  </span>
                  <div className="flex items-center justify-between w-full mt-1">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-[#00A878] shrink-0" />
                      <span className="text-[#10233F] dark:text-white font-bold text-sm sm:text-base lg:text-[18px] xl:text-[20px]">
                        {formatDateDisplay(travelDate)}
                      </span>
                    </div>
                    <ChevronDown
                      className={`w-4 h-4 text-[#24364E] dark:text-slate-400 shrink-0 transition-transform duration-200 ${
                        isPickupCalendarOpen ? 'rotate-180 text-[#00A878]' : ''
                      }`}
                    />
                  </div>
                  <CalendarPopover
                    isOpen={isPickupCalendarOpen}
                    onClose={() => setIsPickupCalendarOpen(false)}
                    selectedDate={travelDate}
                    minDate={getTodayStr()}
                    rangeEndDate={returnDate}
                    onSelectDate={(date) => {
                      setTravelDate(date);
                      if (returnDate < date) setReturnDate(date);
                      setIsPickupCalendarOpen(false);
                    }}
                    title="Select Pickup Date"
                    align="left"
                  />
                </div>

                {/* RETURN DATE */}
                <div
                  role="button"
                  tabIndex={0}
                  aria-label={`Select Return Date, currently ${formatDateDisplay(returnDate)}`}
                  onClick={() => {
                    setIsReturnCalendarOpen((prev) => !prev);
                    setIsPickupCalendarOpen(false);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setIsReturnCalendarOpen((prev) => !prev);
                      setIsPickupCalendarOpen(false);
                    }
                  }}
                  className={`relative w-full lg:w-44 rounded-2xl border bg-white dark:bg-slate-800 p-3 sm:py-3.5 sm:px-4 flex flex-col justify-between min-h-[74px] sm:min-h-[80px] cursor-pointer transition-all select-none ${
                    isReturnCalendarOpen
                      ? 'border-2 border-[#00D99A] ring-2 ring-[#00D99A]/20 shadow-xs'
                      : 'border-[#E0E5EC] dark:border-slate-700 hover:border-[#ccd4e0]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[#8EA3C2] text-xs sm:text-[13px] lg:text-[14px] font-bold uppercase tracking-wider leading-none block">
                      RETURN DATE
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#D0F9E5] text-[#075441] leading-none">
                      {getRoundTripDuration()} {getRoundTripDuration() === 1 ? 'Day' : 'Days'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between w-full mt-1">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-[#00A878] shrink-0" />
                      <span className="text-[#10233F] dark:text-white font-bold text-sm sm:text-base lg:text-[18px] xl:text-[20px]">
                        {formatDateDisplay(returnDate)}
                      </span>
                    </div>
                    <ChevronDown
                      className={`w-4 h-4 text-[#24364E] dark:text-slate-400 shrink-0 transition-transform duration-200 ${
                        isReturnCalendarOpen ? 'rotate-180 text-[#00A878]' : ''
                      }`}
                    />
                  </div>
                  <CalendarPopover
                    isOpen={isReturnCalendarOpen}
                    onClose={() => setIsReturnCalendarOpen(false)}
                    selectedDate={returnDate}
                    minDate={travelDate}
                    rangeStartDate={travelDate}
                    onSelectDate={(date) => {
                      setReturnDate(date);
                      setIsReturnCalendarOpen(false);
                    }}
                    title="Select Return Date"
                    align="right"
                  />
                </div>

                {/* TIME */}
                <div className="w-full lg:w-36 rounded-2xl border border-[#E0E5EC] dark:border-slate-700 bg-white dark:bg-slate-800 p-3 sm:py-3.5 sm:px-4 flex flex-col justify-between min-h-[74px] sm:min-h-[80px]">
                  <span className="text-[#8EA3C2] text-xs sm:text-[13px] lg:text-[14px] font-bold uppercase tracking-wider leading-none block">
                    TIME
                  </span>
                  <div className="relative flex items-center justify-between mt-1">
                    <div className="flex items-center gap-2 w-full">
                      <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-[#8EA3C2] shrink-0 pointer-events-none" />
                      <select
                        value={pickupTime}
                        onChange={(e) => setPickupTime(e.target.value)}
                        className="w-full bg-transparent border-none p-0 text-[#10233F] dark:text-white font-bold text-sm sm:text-base lg:text-[18px] xl:text-[20px] appearance-none focus:outline-none cursor-pointer pr-5"
                      >
                        {TIME_OPTIONS.map((t) => (
                          <option key={t} value={t} className="bg-white dark:bg-slate-900 text-[#10233F]">
                            {t}
                          </option>
                        ))}
                      </select>
                    </div>
                    <ChevronDown className="w-4 h-4 text-[#24364E] dark:text-slate-400 shrink-0 absolute right-0 pointer-events-none" />
                  </div>
                </div>
              </div>

              {/* Added intermediate stops badge list */}
              {intermediateStops.length > 0 && (
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <span className="text-xs font-semibold text-[#8EA3C2]">Stops:</span>
                  {intermediateStops.map((stop, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#D0F9E5] border border-[#00D99A]/40 text-xs font-bold text-[#075441]"
                    >
                      <MapPin className="w-3 h-3 text-[#00A878]" />
                      <span>{stop}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveStop(idx)}
                        className="p-0.5 hover:text-red-500 cursor-pointer"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}

              {/* Add stop input drawer if open */}
              {showAddStopInput && (
                <div className="flex items-center gap-2 p-2.5 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-[#E0E5EC] dark:border-slate-700 animate-in fade-in duration-150">
                  <input
                    type="text"
                    value={newStopText}
                    onChange={(e) => setNewStopText(e.target.value)}
                    placeholder="Enter intermediate stop (e.g. Mandya, Srirangapatna)"
                    className="flex-1 bg-white dark:bg-slate-900 px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold border border-[#E0E5EC] focus:outline-none focus:ring-1 focus:ring-[#075441] text-[#10233F]"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddStop();
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleAddStop}
                    className="px-4 py-2 bg-[#075441] text-white rounded-xl text-xs font-bold hover:bg-[#053d2f] cursor-pointer"
                  >
                    Add
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddStopInput(false)}
                    className="px-3 py-2 text-[#8EA3C2] hover:text-[#10233F] text-xs font-semibold cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          )}

          {/* =========================================================================
              AIRPORT FORM
              Direction choices:
              - TRIP (Airport Drop / Airport Pickup)
              - AIRPORT selection dropdown
              - CITY (Location autocomplete)
              - PICKUP DATE
              - PICKUP TIME
          ========================================================================== */}
          {serviceType === 'airport' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 sm:gap-4 items-stretch">
              {/* TRIP TYPE */}
              <div className="relative rounded-2xl border border-[#E0E5EC] dark:border-slate-700 bg-white dark:bg-slate-800 p-3 sm:py-3.5 sm:px-4 flex flex-col justify-between min-h-[74px] sm:min-h-[80px]">
                <span className="text-[#8EA3C2] text-xs sm:text-[13px] lg:text-[14px] font-bold uppercase tracking-wider leading-none block">
                  TRIP
                </span>
                <div className="relative flex items-center justify-between mt-1">
                  <div className="flex items-center gap-2 w-full">
                    <Plane className="w-4 h-4 sm:w-5 sm:h-5 text-[#00A878] shrink-0 pointer-events-none" />
                    <select
                      value={airportTransferType}
                      onChange={(e) => setAirportTransferType(e.target.value as AirportTransferType)}
                      className="w-full bg-transparent border-none p-0 text-[#10233F] dark:text-white font-bold text-sm sm:text-base lg:text-[18px] appearance-none focus:outline-none cursor-pointer pr-5"
                    >
                      <option value="drop" className="bg-white dark:bg-slate-900 text-[#10233F]">
                        Airport Drop
                      </option>
                      <option value="pickup" className="bg-white dark:bg-slate-900 text-[#10233F]">
                        Airport Pickup
                      </option>
                    </select>
                  </div>
                  <ChevronDown className="w-4 h-4 text-[#24364E] dark:text-slate-400 shrink-0 absolute right-0 pointer-events-none" />
                </div>
              </div>

              {/* AIRPORT SELECT */}
              <div className="relative rounded-2xl border border-[#E0E5EC] dark:border-slate-700 bg-white dark:bg-slate-800 p-3 sm:py-3.5 sm:px-4 flex flex-col justify-between min-h-[74px] sm:min-h-[80px]">
                <span className="text-[#8EA3C2] text-xs sm:text-[13px] lg:text-[14px] font-bold uppercase tracking-wider leading-none block">
                  AIRPORT
                </span>
                <div className="relative flex items-center justify-between mt-1">
                  <select
                    value={selectedAirport}
                    onChange={(e) => setSelectedAirport(e.target.value)}
                    className="w-full bg-transparent border-none p-0 text-[#10233F] dark:text-white font-bold text-sm sm:text-base lg:text-[17px] appearance-none focus:outline-none cursor-pointer pr-5 truncate"
                  >
                    {AIRPORT_LIST.map((apt) => (
                      <option key={apt.id} value={apt.name} className="bg-white dark:bg-slate-900 text-[#10233F]">
                        {apt.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-[#24364E] dark:text-slate-400 shrink-0 absolute right-0 pointer-events-none" />
                </div>
              </div>

              {/* CITY (Pickup/Drop city with autocomplete) */}
              <div className="w-full">
                <LocationAutocompleteInput
                  id="airport-city-location-input"
                  label={airportTransferType === 'pickup' ? 'DROP CITY' : 'PICKUP CITY'}
                  placeholder="Bangalore, Karnataka"
                  value={airportTransferType === 'pickup' ? dropLocation : pickupLocation}
                  onChange={(val, obj) => {
                    if (airportTransferType === 'pickup') {
                      setDropLocation(val);
                      if (obj) setDropLocationObj(obj);
                    } else {
                      setPickupLocation(val);
                      if (obj) setPickupLocationObj(obj);
                    }
                  }}
                  selectedPlace={airportTransferType === 'pickup' ? dropLocationObj : pickupLocationObj}
                  variant="card-box"
                  iconType={airportTransferType === 'pickup' ? 'drop' : 'pickup'}
                  onClear={() => {
                    if (airportTransferType === 'pickup') {
                      setDropLocation('');
                      setDropLocationObj(undefined);
                    } else {
                      setPickupLocation('');
                      setPickupLocationObj(undefined);
                    }
                  }}
                />
              </div>

              {/* PICKUP DATE */}
              <div
                role="button"
                tabIndex={0}
                aria-label={`Select Pickup Date, currently ${formatDateDisplay(travelDate)}`}
                onClick={() => setIsPickupCalendarOpen((prev) => !prev)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setIsPickupCalendarOpen((prev) => !prev);
                  }
                }}
                className={`relative rounded-2xl border bg-white dark:bg-slate-800 p-3 sm:py-3.5 sm:px-4 flex flex-col justify-between min-h-[74px] sm:min-h-[80px] cursor-pointer transition-all select-none ${
                  isPickupCalendarOpen
                    ? 'border-2 border-[#00D99A] ring-2 ring-[#00D99A]/20 shadow-xs'
                    : 'border-[#E0E5EC] dark:border-slate-700 hover:border-[#ccd4e0]'
                }`}
              >
                <span className="text-[#8EA3C2] text-xs sm:text-[13px] lg:text-[14px] font-bold uppercase tracking-wider leading-none block">
                  PICKUP DATE
                </span>
                <div className="flex items-center justify-between w-full mt-1">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-[#00A878] shrink-0" />
                    <span className="text-[#10233F] dark:text-white font-bold text-sm sm:text-base lg:text-[18px] xl:text-[20px]">
                      {formatDateDisplay(travelDate)}
                    </span>
                  </div>
                  <ChevronDown
                    className={`w-4 h-4 text-[#24364E] dark:text-slate-400 shrink-0 transition-transform duration-200 ${
                      isPickupCalendarOpen ? 'rotate-180 text-[#00A878]' : ''
                    }`}
                  />
                </div>
                <CalendarPopover
                  isOpen={isPickupCalendarOpen}
                  onClose={() => setIsPickupCalendarOpen(false)}
                  selectedDate={travelDate}
                  minDate={getTodayStr()}
                  onSelectDate={(date) => {
                    setTravelDate(date);
                    setIsPickupCalendarOpen(false);
                  }}
                  title="Select Pickup Date"
                  align="right"
                />
              </div>

              {/* PICKUP TIME */}
              <div className="relative rounded-2xl border border-[#E0E5EC] dark:border-slate-700 bg-white dark:bg-slate-800 p-3 sm:py-3.5 sm:px-4 flex flex-col justify-between min-h-[74px] sm:min-h-[80px]">
                <span className="text-[#8EA3C2] text-xs sm:text-[13px] lg:text-[14px] font-bold uppercase tracking-wider leading-none block">
                  PICKUP TIME
                </span>
                <div className="relative flex items-center justify-between mt-1">
                  <div className="flex items-center gap-2 w-full">
                    <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-[#8EA3C2] shrink-0 pointer-events-none" />
                    <select
                      value={pickupTime}
                      onChange={(e) => setPickupTime(e.target.value)}
                      className="w-full bg-transparent border-none p-0 text-[#10233F] dark:text-white font-bold text-sm sm:text-base lg:text-[18px] appearance-none focus:outline-none cursor-pointer pr-5"
                    >
                      {TIME_OPTIONS.map((t) => (
                        <option key={t} value={t} className="bg-white dark:bg-slate-900 text-[#10233F]">
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>
                  <ChevronDown className="w-4 h-4 text-[#24364E] dark:text-slate-400 shrink-0 absolute right-0 pointer-events-none" />
                </div>
              </div>
            </div>
          )}

          {/* =========================================================================
              BOTTOM BUTTONS: EXPLORE CABS & Reset Details
              - EXPLORE CABS: Wide pill shape, light mint green fill (#A7F2D2), thin border #00D99A,
                dark green bold uppercase text (#075441), letter spacing ~3px (tracking-[0.18em])
              - Reset Details: centered beneath primary button, with muted blue-gray reset icon & text (#8EA3C2)
          ========================================================================== */}
          <div className="mt-8 sm:mt-9 flex flex-col items-center justify-center gap-3">
            <button
              id="explore-cabs-submit-btn"
              type="submit"
              disabled={isSearchingRoute}
              className="w-full sm:w-auto min-w-[300px] sm:min-w-[380px] lg:min-w-[420px] px-12 sm:px-16 lg:px-20 py-4 sm:py-5 rounded-full bg-[#A7F2D2] hover:bg-[#92ebcb] active:bg-[#7fe7c2] border-2 border-[#00D99A] text-[#075441] font-black text-lg sm:text-xl lg:text-[25px] xl:text-[27px] uppercase tracking-[0.16em] sm:tracking-[0.18em] shadow-sm hover:shadow-md transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 select-none active:scale-[0.99]"
            >
              {isSearchingRoute ? (
                <span>Calculating Route...</span>
              ) : (
                <span>EXPLORE CABS</span>
              )}
            </button>

            <button
              id="reset-details-btn"
              type="button"
              onClick={handleReset}
              className="inline-flex items-center gap-2 text-sm sm:text-base lg:text-[18px] font-semibold text-[#8EA3C2] hover:text-[#10233F] transition-colors cursor-pointer py-1.5"
            >
              <RotateCcw className="w-4 h-4 text-[#8EA3C2]" />
              <span>Reset Details</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
