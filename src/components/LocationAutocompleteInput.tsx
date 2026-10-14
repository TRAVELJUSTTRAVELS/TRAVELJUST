import React, { useState, useEffect, useRef, useId } from 'react';
import {
  MapPin,
  Plane,
  Check,
  CheckCircle2,
  Search,
  Sparkles,
  Loader2,
  Navigation,
  Hotel,
  Train,
  Mountain,
  Compass,
  AlertCircle,
  XCircle,
  ChevronLeft,
  X,
} from 'lucide-react';
import { PlaceSuggestion } from '../types';
import {
  fetchPlaceSuggestions,
  fetchPlaceDetails,
  reverseGeocodeCoordinates,
  POPULAR_LOCATIONS,
  saveRecentSearch,
  getRecentSearches,
  isWithinSupportedServiceArea,
  getMysuruPrioritizedDestinations,
} from '../services/googleMapsService';

interface LocationAutocompleteInputProps {
  id?: string;
  label: string;
  placeholder?: string;
  value: string;
  onChange: (value: string, suggestion?: PlaceSuggestion) => void;
  selectedPlace?: PlaceSuggestion | null;
  allowCurrentLocation?: boolean;
  iconType?: 'pickup' | 'drop' | 'via' | 'airport';
  error?: string;
  disabled?: boolean;
  required?: boolean;
  onClear?: () => void;
  className?: string;
  variant?: 'box' | 'underline' | 'card-box';
  borderless?: boolean;
  labelClassName?: string;
  inputClassName?: string;
  showSearchIconLeft?: boolean;
  rightActions?: React.ReactNode;
}

export interface FormattedLocationResult {
  placeName: string;
  state: string;
  formattedText: string;
}

const INDIAN_STATES = [
  'Andaman and Nicobar Islands',
  'Andhra Pradesh',
  'Arunachal Pradesh',
  'Assam',
  'Bihar',
  'Chandigarh',
  'Chhattisgarh',
  'Dadra and Nagar Haveli',
  'Daman and Diu',
  'Delhi',
  'Goa',
  'Gujarat',
  'Haryana',
  'Himachal Pradesh',
  'Jammu and Kashmir',
  'Jharkhand',
  'Karnataka',
  'Kerala',
  'Ladakh',
  'Lakshadweep',
  'Madhya Pradesh',
  'Maharashtra',
  'Manipur',
  'Meghalaya',
  'Mizoram',
  'Nagaland',
  'Odisha',
  'Puducherry',
  'Punjab',
  'Rajasthan',
  'Sikkim',
  'Tamil Nadu',
  'Telangana',
  'Tripura',
  'Uttar Pradesh',
  'Uttarakhand',
  'West Bengal',
];

// Helper to format location results strictly with the place name and State only
export const formatLocationPlaceAndState = (
  item: PlaceSuggestion | string | null | undefined
): FormattedLocationResult => {
  if (!item) {
    return { placeName: '', state: 'Karnataka', formattedText: '' };
  }

  let rawName = '';
  let fullContext = '';

  if (typeof item === 'string') {
    rawName = item.trim();
    fullContext = item;
  } else {
    rawName = (item.placeName || item.areaLocality || item.city || '').trim();
    fullContext = `${item.state || ''} ${item.city || ''} ${item.formattedAddress || ''} ${item.areaLocality || ''} ${rawName}`;
  }

  // 1. Determine State
  let detectedState = '';
  if (typeof item !== 'string' && item.state && item.state.trim()) {
    const candidate = item.state.trim().replace(/,\s*India$/i, '').trim();
    const matched = INDIAN_STATES.find(
      (st) => st.toLowerCase() === candidate.toLowerCase()
    );
    if (matched) detectedState = matched;
  }

  if (!detectedState) {
    const sortedStates = [...INDIAN_STATES].sort((a, b) => b.length - a.length);
    for (const st of sortedStates) {
      if (new RegExp(`\\b${st}\\b`, 'i').test(fullContext)) {
        detectedState = st;
        break;
      }
    }
  }

  if (!detectedState) {
    detectedState = 'Karnataka';
  }

  // 2. Clean rawName to obtain place name only (strip country, postal codes, repeated states)
  let cleanPlace = rawName;

  // Remove country
  cleanPlace = cleanPlace
    .replace(/,\s*India$/i, '')
    .replace(/,\s*IN$/i, '')
    .replace(/,\s*South India$/i, '');

  // Remove 6-digit Indian PIN codes and attached state/city
  cleanPlace = cleanPlace.replace(/,?\s*(?:[A-Za-z\s]+)?\b\d{6}\b.*$/i, '');

  // Remove trailing state if attached to the place name
  const sortedStates = [...INDIAN_STATES].sort((a, b) => b.length - a.length);
  for (const st of sortedStates) {
    const trailingStateRegex = new RegExp(`[,\\s\\-]+${st}\\b.*$`, 'i');
    if (trailingStateRegex.test(cleanPlace)) {
      cleanPlace = cleanPlace.replace(trailingStateRegex, '');
    }
  }

  // Remove trailing commas, hyphens, slashes, whitespace
  cleanPlace = cleanPlace.replace(/[,\\/\\-\s]+$/, '').trim();

  // If cleaning resulted in empty string, fallback to locality/city or state
  if (!cleanPlace) {
    if (typeof item !== 'string') {
      cleanPlace = item.areaLocality || item.city || detectedState;
    } else {
      cleanPlace = detectedState;
    }
  }

  const formattedText = cleanPlace ? `${cleanPlace}, ${detectedState}` : detectedState;

  return {
    placeName: cleanPlace,
    state: detectedState,
    formattedText,
  };
};

export const getCleanStateName = (item: PlaceSuggestion): string => {
  return formatLocationPlaceAndState(item).state;
};

export const LocationAutocompleteInput: React.FC<LocationAutocompleteInputProps> = ({
  id,
  label,
  placeholder = 'Enter location or landmark',
  value,
  onChange,
  selectedPlace,
  allowCurrentLocation = true,
  iconType = 'pickup',
  error,
  disabled = false,
  required = false,
  onClear,
  className = '',
  variant = 'box',
  borderless = false,
  labelClassName = '',
  inputClassName = '',
  showSearchIconLeft = false,
  rightActions,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLocatingGPS, setIsLocatingGPS] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);
  const [sessionToken, setSessionToken] = useState<string>(() => `st_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`);
  const [serviceAreaError, setServiceAreaError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const defaultId = useId();
  const inputId = id || defaultId;
  const isPickup = inputId.includes('from-location-input') || iconType === 'pickup';
  const isDrop = inputId.includes('to-location-input') || iconType === 'drop';

  // Client-side validation: ensure destination is within supported service area
  useEffect(() => {
    if (isDrop && value && value.trim().length > 3) {
      if (!isWithinSupportedServiceArea(value)) {
        setServiceAreaError('Destination is outside our South India operational area (Karnataka, Tamil Nadu, Kerala).');
      } else {
        setServiceAreaError(null);
      }
    } else {
      setServiceAreaError(null);
    }
  }, [value, isDrop]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch suggestions with debounce when customer searches or opens dropdown
  useEffect(() => {
    if (!isOpen) return;

    if (!value || value.trim().length === 0) {
      // If destination input, prioritize local popular destinations from Mysuru context
      if (isDrop) {
        const prioritized = getMysuruPrioritizedDestinations();
        setSuggestions(prioritized);
        setIsLoading(false);
        return;
      }

      const recents = getRecentSearches();
      const pool = POPULAR_LOCATIONS;

      if (recents.length > 0) {
        const filteredRecents = recents.slice(0, 3);
        const rest = pool.filter((p) => !filteredRecents.some((r) => r.placeId === p.placeId));
        setSuggestions([...filteredRecents, ...rest.slice(0, 10)]);
      } else {
        setSuggestions(pool.slice(0, 12));
      }
      setIsLoading(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const results = await fetchPlaceSuggestions(value, sessionToken);
        setSuggestions(results);
      } catch (err) {
        console.debug('Error fetching suggestions:', err);
        setSuggestions([]);
      } finally {
        setIsLoading(false);
      }
    }, 120);

    return () => clearTimeout(timer);
  }, [value, isOpen, sessionToken]);

  const handleSelect = async (suggestion: PlaceSuggestion) => {
    // Generate new session token after selection
    setSessionToken(`st_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`);
    setIsOpen(false);
    setSelectedIndex(-1);

    // Save recent search
    saveRecentSearch(suggestion);

    // Enrich with place details if lat/lng are missing and placeId is present
    let enriched = suggestion;
    if ((!suggestion.lat || !suggestion.lng) && suggestion.placeId) {
      try {
        const details = await fetchPlaceDetails(suggestion.placeId, sessionToken);
        if (details) {
          enriched = { ...suggestion, ...details };
        }
      } catch (e) {
        console.debug('Could not resolve place details:', e);
      }
    }

    const { formattedText } = formatLocationPlaceAndState(enriched);
    onChange(formattedText, enriched);
  };

  const handleUseCurrentLocation = async () => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setGpsError('Geolocation is not supported by your browser.');
      return;
    }

    setIsLocatingGPS(true);
    setGpsError(null);

    const getPositionPromise = (options: PositionOptions): Promise<GeolocationPosition> => {
      return new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, options);
      });
    };

    try {
      let pos: GeolocationPosition;
      try {
        // Attempt 1: High accuracy (GPS satellite / cellular) with 5s timeout
        pos = await getPositionPromise({
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 30000,
        });
      } catch (firstErr: any) {
        // If user denied permission explicitly, respect and don't retry
        if (firstErr && firstErr.code === 1 /* PERMISSION_DENIED */) {
          throw firstErr;
        }
        // Attempt 2: Standard accuracy (Wi-Fi / network geolocation) with 10s timeout
        pos = await getPositionPromise({
          enableHighAccuracy: false,
          timeout: 10000,
          maximumAge: 60000,
        });
      }

      const { latitude, longitude } = pos.coords;
      try {
        const place = await reverseGeocodeCoordinates(latitude, longitude);
        saveRecentSearch(place);
        const { formattedText } = formatLocationPlaceAndState(place);
        onChange(formattedText, place);
        setIsOpen(false);
      } catch (err) {
        console.error('Reverse geocoding error:', err);
        const fallbackPlace: PlaceSuggestion = {
          placeId: `gps_${Date.now()}`,
          placeName: 'Current Location (GPS)',
          areaLocality: 'Current Location',
          city: 'Mysuru',
          state: 'Karnataka',
          formattedAddress: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
          lat: latitude,
          lng: longitude,
        };
        const { formattedText } = formatLocationPlaceAndState(fallbackPlace);
        onChange(formattedText, fallbackPlace);
        setIsOpen(false);
      }
    } catch (error: any) {
      console.warn('Geolocation error:', error);
      if (error?.code === 1 /* PERMISSION_DENIED */) {
        setGpsError('Location permission denied. Please allow location access in your browser or site settings.');
      } else if (error?.code === 2 /* POSITION_UNAVAILABLE */) {
        setGpsError('Position unavailable. Please ensure location services are enabled on your device.');
      } else if (error?.code === 3 /* TIMEOUT */) {
        setGpsError('Location request timed out. Please enter your location manually.');
      } else {
        setGpsError('Unable to retrieve your location. Please enter your location manually.');
      }
    } finally {
      setIsLocatingGPS(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') {
        setIsOpen(true);
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
        handleSelect(suggestions[selectedIndex]);
      } else if (suggestions.length > 0) {
        handleSelect(suggestions[0]);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  const renderIcon = () => {
    if (iconType === 'airport') {
      return <Plane className="w-4 h-4 text-sky-600 shrink-0" />;
    }
    if (iconType === 'pickup') {
      return (
        <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 ring-4 ring-emerald-100 shrink-0" />
      );
    }
    if (iconType === 'drop') {
      return (
        <span className="w-2.5 h-2.5 rounded-full bg-rose-600 ring-4 ring-rose-100 shrink-0" />
      );
    }
    return <MapPin className="w-4 h-4 text-amber-600 shrink-0" />;
  };

  // Helper to render category icon
  const getPlaceIcon = (item: PlaceSuggestion) => {
    if (item.isAirport || item.category === 'airports') {
      return <Plane className="w-4 h-4 text-sky-700" />;
    }
    if (item.category === 'hotels_resorts' || (item.types || []).includes('lodging') || (item.types || []).includes('hotel')) {
      return <Hotel className="w-4 h-4 text-purple-700" />;
    }
    if (item.category === 'railway_stations' || (item.types || []).includes('train_station')) {
      return <Train className="w-4 h-4 text-amber-700" />;
    }
    if (item.category === 'tourist_attractions' || item.category === 'hill_stations') {
      return <Mountain className="w-4 h-4 text-emerald-700" />;
    }
    return <MapPin className="w-4 h-4 text-slate-600" />;
  };

  const hasVerifiedCoords = Boolean(selectedPlace?.lat && selectedPlace?.lng);

  return (
    <div ref={containerRef} className={`relative ${variant === 'card-box' ? '' : variant === 'underline' ? 'space-y-1' : 'space-y-1.5'} ${className}`}>
      {/* Label & Actions (shown outside for underline and box variants) */}
      {variant !== 'card-box' && (
        <div className="flex items-center justify-between min-h-[20px]">
          <label
            htmlFor={inputId}
            className={
              labelClassName
                ? `flex items-center gap-1.5 ${labelClassName}`
                : variant === 'underline'
                ? 'text-[11px] sm:text-xs font-bold uppercase tracking-wider text-[#334155] flex items-center gap-1.5'
                : 'text-[11px] sm:text-xs font-semibold text-[#334155] uppercase tracking-wider flex items-center gap-1.5'
            }
            style={{ color: '#334155' }}
          >
            {variant !== 'underline' && renderIcon()}
            <span style={{ color: '#334155' }} className="text-[#334155]">{label}</span>
            {required && <span className="text-rose-500">*</span>}
          </label>
          
          <div className="flex items-center gap-2">
            {allowCurrentLocation && !disabled && (
              <button
                type="button"
                id={`${inputId}-gps-btn`}
                onClick={handleUseCurrentLocation}
                disabled={isLocatingGPS}
                title="Detect and use current geographic location"
                className="inline-flex items-center gap-1 text-[11px] text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/80 px-2 py-0.5 rounded-md font-semibold cursor-pointer transition-colors shadow-2xs"
              >
                {isLocatingGPS ? (
                  <>
                    <Loader2 className="w-3 h-3 text-emerald-600 animate-spin" />
                    <span>Locating...</span>
                  </>
                ) : (
                  <>
                    <Navigation className="w-3 h-3 text-emerald-600" />
                    <span>Use Current Location</span>
                  </>
                )}
              </button>
            )}
            {hasVerifiedCoords && (
              <span className="hidden sm:inline-flex items-center gap-1 text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                <Check className="w-3 h-3 text-emerald-600" />
                <span>Verified Location</span>
              </span>
            )}
            {value && !disabled && onClear && (
              <button
                type="button"
                onClick={onClear}
                className="text-[11px] text-slate-400 hover:text-slate-600 font-medium cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      )}

      {/* Input Container */}
      {variant === 'card-box' ? (
        <div
          className={`relative rounded-2xl bg-white p-3 sm:py-3.5 sm:px-4 transition-all duration-150 flex flex-col justify-between min-h-[74px] sm:min-h-[80px] ${
            borderless
              ? 'border-none shadow-none ring-0'
              : error
              ? 'border-2 border-rose-400 ring-2 ring-rose-200'
              : isOpen
              ? 'border-2 border-[#00D99A] ring-2 ring-[#00D99A]/20 shadow-xs'
              : 'border border-[#E0E5EC] hover:border-[#ccd4e0] shadow-2xs'
          }`}
        >
          {/* Top Label & Actions inside card box */}
          <div className="flex items-center justify-between min-h-[18px] mb-1">
            <span
              className={labelClassName || "text-[#8EA3C2] text-xs sm:text-[13px] lg:text-[14px] font-bold uppercase tracking-wider leading-none block"}
            >
              {label}
            </span>
            <div className="flex items-center gap-1.5">
              {error && (
                <AlertCircle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
              )}
            </div>
          </div>

          {/* Bottom input with green pin icon and bold navy text */}
          <div className="relative flex items-center">
            <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-[#00A878] shrink-0 mr-2" aria-hidden="true" />
            <input
              ref={inputRef}
              id={inputId}
              type="text"
              value={value}
              disabled={disabled}
              onChange={(e) => {
                onChange(e.target.value);
                if (!isOpen) setIsOpen(true);
              }}
              onFocus={() => setIsOpen(true)}
              onClick={() => setIsOpen(true)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              autoComplete="off"
              style={{ outline: 'none', border: 'none', boxShadow: 'none' }}
              className={`w-full bg-transparent border-none p-0 text-[#10233F] font-bold text-sm sm:text-base lg:text-[18px] xl:text-[20px] focus:outline-none focus-visible:outline-none focus:ring-0 focus-visible:ring-0 !outline-none !shadow-none !border-none placeholder:text-[#8EA3C2]/70 placeholder:font-normal truncate tracking-tight ${inputClassName} ${
                disabled ? 'opacity-60 cursor-not-allowed' : ''
              }`}
            />

            {isLoading && (
              <Loader2 className="w-3.5 h-3.5 text-[#00A878] animate-spin shrink-0 ml-1.5 pointer-events-none" />
            )}
          </div>
          {(error || serviceAreaError) && (
            <span className="text-[10px] text-rose-600 font-medium truncate block leading-tight mt-0.5">
              {error || serviceAreaError}
            </span>
          )}
        </div>
      ) : variant === 'underline' ? (
        <div>
          <div
            className={`relative flex items-center gap-2 ${
              borderless ? 'border-none pb-1.5' : 'border-b pb-1.5'
            } transition-colors ${
              borderless
                ? 'border-none'
                : error
                ? 'border-rose-400'
                : isOpen
                ? 'border-[#0ea5e9]'
                : 'border-slate-300 hover:border-slate-400 focus-within:border-[#0ea5e9]'
            }`}
          >
            {showSearchIconLeft && (
              <Search className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-[#90A1B9] shrink-0 pointer-events-none" />
            )}
            <input
              ref={inputRef}
              id={inputId}
              type="text"
              value={value}
              disabled={disabled}
              onChange={(e) => {
                onChange(e.target.value);
                if (!isOpen) setIsOpen(true);
              }}
              onFocus={() => {
                setIsOpen(true);
              }}
              onClick={() => {
                if (!isOpen) setIsOpen(true);
              }}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              autoComplete="off"
              className={`w-full bg-transparent border-none p-0 text-sm sm:text-base font-semibold text-slate-900 focus:outline-none placeholder:text-slate-400 placeholder:font-normal truncate ${inputClassName} ${
                disabled ? 'opacity-60 cursor-not-allowed' : ''
              }`}
            />

            {rightActions}

            {isLoading && (
              <div className="shrink-0 pointer-events-none">
                <Loader2 className="w-4 h-4 text-[#0ea5e9] animate-spin" />
              </div>
            )}
          </div>
          {error && (
            <span className="text-[10px] text-rose-600 font-medium truncate block leading-tight mt-1">
              {error}
            </span>
          )}
        </div>
      ) : (
        <div className="relative">
          <input
            ref={inputRef}
            id={inputId}
            type="text"
            value={value}
            disabled={disabled}
            onChange={(e) => {
              onChange(e.target.value);
              if (!isOpen) setIsOpen(true);
            }}
            onFocus={() => {
              setIsOpen(true);
            }}
            onClick={() => {
              if (!isOpen) setIsOpen(true);
            }}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            autoComplete="off"
            className={`w-full h-[52px] bg-slate-50 dark:bg-slate-800 border text-slate-900 dark:text-white rounded-xl px-3.5 text-sm font-semibold focus:bg-white dark:focus:bg-slate-900 focus:outline-none transition-all placeholder:text-slate-400 ${
              rightActions ? 'pr-16' : 'pr-9'
            } ${
              error
                ? 'border-rose-400 focus:ring-2 focus:ring-rose-200 bg-rose-50/30'
                : isOpen
                ? 'border-[#006045] ring-2 ring-emerald-100 dark:ring-emerald-950 bg-white dark:bg-slate-900 shadow-xs'
                : 'border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600'
            } ${disabled ? 'opacity-60 cursor-not-allowed bg-slate-100 dark:bg-slate-850' : ''} ${inputClassName}`}
          />

          {/* Right Status Indicator and Actions */}
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5 z-10">
            {rightActions}
            {isLoading ? (
              <Loader2 className="w-4 h-4 text-[#006045] dark:text-emerald-400 animate-spin pointer-events-none" />
            ) : (
              <Search className="w-3.5 h-3.5 text-slate-400 pointer-events-none" />
            )}
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && variant !== 'card-box' && <p className="text-xs text-rose-600 font-medium">{error}</p>}
      {gpsError && <p className="text-xs text-amber-600 font-medium">{gpsError}</p>}

      {/* Intelligent Suggestions Dropdown (Screenshots 1.jpeg & 2.jpeg) */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-2 z-50 bg-white rounded-2xl shadow-2xl border border-[#E0E5EC] overflow-hidden max-h-[360px] sm:max-h-[420px] overflow-y-auto animate-in fade-in-50 zoom-in-95 duration-150">
          
          {/* Current Location GPS quick row when input is empty and allowed */}
          {allowCurrentLocation && !value && (
            <button
              type="button"
              id="use-current-location-btn"
              onClick={handleUseCurrentLocation}
              disabled={isLocatingGPS}
              className="w-full text-left py-3 px-4 sm:px-5 hover:bg-[#D0F9E5]/30 transition-colors border-b border-[#E0E5EC] flex items-center justify-between text-xs sm:text-sm text-[#075441] font-bold cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <Navigation className="w-4 h-4 text-[#00A878]" />
                <span>{isLocatingGPS ? 'Detecting GPS location...' : 'Use Current Location (GPS)'}</span>
              </span>
              <span className="text-[11px] font-semibold text-[#00A878] bg-[#D0F9E5] px-2 py-0.5 rounded-full">Instant</span>
            </button>
          )}

          {/* Clean List of Suggestions Formatted with Place Name and State Only */}
          <div className="divide-y divide-[#E0E5EC]/60">
            {suggestions.length === 0 && !isLoading ? (
              <div className="py-6 px-4 text-center text-xs text-[#8EA3C2] font-medium">
                No matching places found. Enter city, hotel, airport, or landmark.
              </div>
            ) : (
              suggestions.map((item, idx) => {
                const isSelected = selectedIndex === idx;
                const formatted = formatLocationPlaceAndState(item);

                return (
                  <button
                    key={item.placeId || `sug_${idx}`}
                    type="button"
                    onClick={() => handleSelect(item)}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    className={`w-full text-left py-3 px-4 sm:px-5 transition-colors cursor-pointer flex items-center justify-between border-b border-[#E0E5EC]/60 last:border-b-0 ${
                      isSelected
                        ? 'bg-[#D0F9E5]/40 text-[#10233F]'
                        : 'hover:bg-[#D0F9E5]/20 text-[#10233F]'
                    }`}
                  >
                    <div className="flex items-start gap-2.5 select-none">
                      <MapPin className="w-4 h-4 text-[#00A878] shrink-0 mt-0.5" />
                      <div className="text-sm sm:text-[15px] lg:text-[16px] leading-relaxed">
                        <span className="text-[#10233F] font-bold">
                          {formatted.placeName}
                        </span>
                        <span className="text-[#8EA3C2] font-semibold">, {formatted.state}</span>
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};
