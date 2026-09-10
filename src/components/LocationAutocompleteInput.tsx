import React, { useState, useEffect, useRef, useId } from 'react';
import {
  MapPin,
  Plane,
  Check,
  Search,
  Sparkles,
  Loader2,
  Navigation,
  Hotel,
  Train,
  Mountain,
  Compass,
  AlertCircle,
} from 'lucide-react';
import { PlaceSuggestion } from '../types';
import {
  fetchPlaceSuggestions,
  fetchPlaceDetails,
  reverseGeocodeCoordinates,
  POPULAR_LOCATIONS,
  saveRecentSearch,
  getRecentSearches,
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
  labelClassName?: string;
  inputClassName?: string;
  showSearchIconLeft?: boolean;
}

type FilterCategory = 'all' | 'hotels_resorts' | 'railway_stations' | 'airports' | 'tourist_attractions';

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
  labelClassName = '',
  inputClassName = '',
  showSearchIconLeft = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLocatingGPS, setIsLocatingGPS] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);
  const [activeCategory, setActiveCategory] = useState<FilterCategory>('all');
  const [sessionToken, setSessionToken] = useState<string>(() => `st_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const defaultId = useId();
  const inputId = id || defaultId;

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
      const recents = getRecentSearches();
      let pool = POPULAR_LOCATIONS;

      if (activeCategory !== 'all') {
        pool = POPULAR_LOCATIONS.filter((p) => {
          if (activeCategory === 'airports') return p.isAirport || p.category === 'airports';
          if (activeCategory === 'hotels_resorts') return p.category === 'hotels_resorts';
          if (activeCategory === 'railway_stations') return p.category === 'railway_stations';
          if (activeCategory === 'tourist_attractions') return p.category === 'tourist_attractions' || p.category === 'hill_stations' || p.category === 'wildlife_safari';
          return true;
        });
      }

      if (recents.length > 0 && activeCategory === 'all') {
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
        let filtered = results;
        if (activeCategory !== 'all') {
          filtered = results.filter((p) => {
            if (activeCategory === 'airports') return p.isAirport || p.category === 'airports';
            if (activeCategory === 'hotels_resorts') return p.category === 'hotels_resorts' || (p.types || []).includes('lodging') || (p.types || []).includes('hotel');
            if (activeCategory === 'railway_stations') return p.category === 'railway_stations' || (p.types || []).includes('train_station');
            if (activeCategory === 'tourist_attractions') return p.category === 'tourist_attractions' || (p.types || []).includes('tourist_attraction');
            return true;
          });
          if (filtered.length === 0) filtered = results; // fallback to unfiltered if category too strict
        }
        setSuggestions(filtered);
      } catch (err) {
        console.debug('Error fetching suggestions:', err);
        setSuggestions([]);
      } finally {
        setIsLoading(false);
      }
    }, 120);

    return () => clearTimeout(timer);
  }, [value, isOpen, activeCategory, sessionToken]);

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

    onChange(enriched.placeName, enriched);
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
        onChange(place.placeName, place);
        setIsOpen(false);
      } catch (err) {
        console.error('Reverse geocoding error:', err);
        const fallbackPlace: PlaceSuggestion = {
          placeId: `gps_${Date.now()}`,
          placeName: 'My Current Location (GPS)',
          areaLocality: 'Current Location',
          city: 'Karnataka, South India',
          formattedAddress: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
          lat: latitude,
          lng: longitude,
        };
        onChange(fallbackPlace.placeName, fallbackPlace);
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
              variant === 'underline'
                ? `text-[12px] leading-[16px] font-bold uppercase tracking-wide text-[#0f2441] flex items-center gap-1.5 ${labelClassName}`
                : `text-[12px] leading-[16px] font-bold text-slate-700 uppercase tracking-wide flex items-center gap-1.5 ${labelClassName}`
            }
          >
            {variant !== 'underline' && renderIcon()}
            <span className="font-bold text-[12px] leading-[16px]">{label}</span>
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
          className={`relative border rounded-xl bg-white p-3 sm:py-3 sm:px-4 transition-all flex flex-col justify-between min-h-[72px] sm:min-h-[76px] shadow-2xs ${
            error
              ? 'border-rose-400 ring-1 ring-rose-300'
              : isOpen
              ? 'border-slate-400 ring-2 ring-slate-100'
              : 'border-slate-200 hover:border-slate-300'
          }`}
        >
          {/* Top Label & Compact Actions inside card box */}
          <div className="flex items-center justify-between min-h-[18px] mb-1">
            <span className="text-slate-500 text-xs sm:text-[13px] font-normal leading-none block">
              {label}
            </span>
            <div className="flex items-center gap-1.5">
              {error && (
                <AlertCircle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
              )}
              {allowCurrentLocation && !disabled && (
                <button
                  type="button"
                  id={`${inputId}-gps-btn`}
                  onClick={handleUseCurrentLocation}
                  disabled={isLocatingGPS}
                  title="Detect GPS location"
                  className="inline-flex items-center gap-1 text-[10px] text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/70 px-1.5 py-0.5 rounded font-medium cursor-pointer transition-colors"
                >
                  {isLocatingGPS ? (
                    <>
                      <Loader2 className="w-2.5 h-2.5 text-emerald-600 animate-spin" />
                      <span>Locating...</span>
                    </>
                  ) : (
                    <>
                      <Navigation className="w-2.5 h-2.5 text-emerald-600" />
                      <span>Current Location</span>
                    </>
                  )}
                </button>
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

          {/* Bottom input */}
          <div className="relative flex items-center">
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
              className={`w-full bg-transparent border-none p-0 text-slate-900 font-medium text-sm sm:text-base focus:outline-none placeholder:text-slate-400 placeholder:font-normal truncate ${inputClassName} ${
                disabled ? 'opacity-60 cursor-not-allowed' : ''
              }`}
            />
            {isLoading && (
              <Loader2 className="w-3.5 h-3.5 text-slate-400 animate-spin shrink-0 ml-1.5 pointer-events-none" />
            )}
          </div>
          {error && (
            <span className="text-[10px] text-rose-600 font-medium truncate block leading-tight mt-0.5">
              {error}
            </span>
          )}
        </div>
      ) : variant === 'underline' ? (
        <div className="relative flex items-center gap-2 border-b border-gray-300 pb-1.5 focus-within:border-[#20A8D8] transition-colors">
          {showSearchIconLeft && (
            <Search className="w-5 h-5 text-gray-400 shrink-0 pointer-events-none" />
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
            className={`w-full bg-transparent border-none p-0 text-base md:text-lg lg:text-[19px] font-bold text-slate-900 focus:outline-none placeholder:text-slate-400 placeholder:font-normal ${inputClassName} ${
              disabled ? 'opacity-60 cursor-not-allowed' : ''
            }`}
          />

          {isLoading && (
            <div className="shrink-0 pointer-events-none">
              <Loader2 className="w-4 h-4 text-[#20A8D8] animate-spin" />
            </div>
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
            className={`w-full h-[52px] bg-slate-50 border text-slate-900 rounded-xl px-3.5 text-sm font-semibold focus:bg-white focus:outline-none transition-all placeholder:text-slate-400 ${
              error
                ? 'border-rose-400 focus:ring-2 focus:ring-rose-200 bg-rose-50/30'
                : isOpen
                ? 'border-emerald-600 ring-2 ring-emerald-100 bg-white shadow-xs'
                : 'border-slate-300 hover:border-slate-400'
            } ${disabled ? 'opacity-60 cursor-not-allowed bg-slate-100' : ''} ${inputClassName}`}
          />

          {/* Right Status Indicator */}
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5 pointer-events-none">
            {isLoading ? (
              <Loader2 className="w-4 h-4 text-emerald-600 animate-spin" />
            ) : (
              <Search className="w-3.5 h-3.5 text-slate-400" />
            )}
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && variant !== 'card-box' && <p className="text-xs text-rose-600 font-medium">{error}</p>}
      {gpsError && <p className="text-xs text-amber-600 font-medium">{gpsError}</p>}

      {/* Intelligent Suggestions Dropdown */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden max-h-96 overflow-y-auto animate-in fade-in-50 zoom-in-95 duration-150">
          {/* Quick Actions Header: Use Current Location (GPS) & Categories */}
          <div className="p-2.5 bg-slate-50/95 border-b border-slate-100 space-y-2">
            {/* Current Location GPS Button */}
            {allowCurrentLocation && (
              <button
                type="button"
                id="use-current-location-btn"
                onClick={handleUseCurrentLocation}
                disabled={isLocatingGPS}
                className="w-full flex items-center justify-between px-3 py-2 bg-emerald-50 hover:bg-emerald-100/80 text-emerald-900 border border-emerald-200 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs group"
              >
                <span className="flex items-center gap-2">
                  {isLocatingGPS ? (
                    <Loader2 className="w-4 h-4 text-emerald-600 animate-spin" />
                  ) : (
                    <Navigation className="w-4 h-4 text-emerald-600 group-hover:scale-110 transition-transform" />
                  )}
                  <span>{isLocatingGPS ? 'Acquiring GPS Location...' : 'Use Current Location (GPS)'}</span>
                </span>
                <span className="text-[10px] text-emerald-700 bg-white/80 px-2 py-0.5 rounded-full border border-emerald-200 font-medium">
                  Instant Pickup
                </span>
              </button>
            )}

            {/* Category Filter Pills: Hotels, Stations, Airports, Sightseeing */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none text-[11px]">
              <button
                type="button"
                onClick={() => setActiveCategory('all')}
                className={`px-2.5 py-1 rounded-lg font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                  activeCategory === 'all'
                    ? 'bg-[#14CD03] text-white shadow-2xs'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                All Places
              </button>
              <button
                type="button"
                onClick={() => setActiveCategory('hotels_resorts')}
                className={`px-2.5 py-1 rounded-lg font-semibold whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1 ${
                  activeCategory === 'hotels_resorts'
                    ? 'bg-purple-600 text-white shadow-2xs'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                <Hotel className="w-3 h-3" />
                <span>Hotels & Resorts</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveCategory('railway_stations')}
                className={`px-2.5 py-1 rounded-lg font-semibold whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1 ${
                  activeCategory === 'railway_stations'
                    ? 'bg-amber-600 text-white shadow-2xs'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                <Train className="w-3 h-3" />
                <span>Railway Stations</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveCategory('airports')}
                className={`px-2.5 py-1 rounded-lg font-semibold whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1 ${
                  activeCategory === 'airports'
                    ? 'bg-sky-600 text-white shadow-2xs'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                <Plane className="w-3 h-3" />
                <span>Airports</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveCategory('tourist_attractions')}
                className={`px-2.5 py-1 rounded-lg font-semibold whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1 ${
                  activeCategory === 'tourist_attractions'
                    ? 'bg-emerald-700 text-white shadow-2xs'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                <Compass className="w-3 h-3" />
                <span>Sightseeing</span>
              </button>
            </div>
          </div>

          {/* List of Suggestions */}
          <div className="p-1 divide-y divide-slate-100">
            {suggestions.length === 0 && !isLoading ? (
              <div className="p-5 text-center text-xs text-slate-500">
                <Search className="w-6 h-6 text-slate-300 mx-auto mb-1.5" />
                No matching place found. You can enter any hotel, railway station, airport, or specific landmark.
              </div>
            ) : (
              suggestions.map((item, idx) => {
                const isSelected = selectedIndex === idx;
                const isAirport = item.isAirport || item.category === 'airports';

                // Format clean address without PIN codes, Taluks, or clutter
                const rawAddr = item.formattedAddress || [item.areaLocality, item.city, item.state].filter(Boolean).join(', ');
                const cleanAddress = rawAddr
                  .replace(/\b\d{6}\b/g, '')
                  .replace(/,\s*,/g, ',')
                  .replace(/\s+/g, ' ')
                  .trim()
                  .replace(/^,\s*|,\s*$/g, '');

                return (
                  <button
                    key={item.placeId || `sug_${idx}`}
                    type="button"
                    onClick={() => handleSelect(item)}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    className={`w-full text-left p-2.5 rounded-xl transition-all flex items-center gap-3 text-xs cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-50 text-emerald-950 ring-1 ring-emerald-200'
                        : 'hover:bg-slate-50/90 text-slate-700'
                    }`}
                  >
                    {/* Icon based on place category */}
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                        isAirport
                          ? 'bg-sky-100 text-sky-700'
                          : item.category === 'hotels_resorts'
                          ? 'bg-purple-100 text-purple-700'
                          : item.category === 'railway_stations'
                          ? 'bg-amber-100 text-amber-700'
                          : isSelected
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {getPlaceIcon(item)}
                    </div>

                    {/* Place Name and Clean Locality/City */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-xs sm:text-sm truncate">
                          {item.placeName}
                        </span>
                        {isAirport && (
                          <span className="px-1.5 py-0.2 rounded bg-sky-100 text-sky-800 text-[9px] font-bold uppercase tracking-wider shrink-0">
                            Airport
                          </span>
                        )}
                        {item.category === 'hotels_resorts' && (
                          <span className="px-1.5 py-0.2 rounded bg-purple-100 text-purple-800 text-[9px] font-bold uppercase tracking-wider shrink-0">
                            Hotel
                          </span>
                        )}
                        {item.category === 'railway_stations' && (
                          <span className="px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 text-[9px] font-bold uppercase tracking-wider shrink-0">
                            Station
                          </span>
                        )}
                      </div>
                      {cleanAddress && cleanAddress.toLowerCase() !== item.placeName.toLowerCase() && (
                        <p className="text-[11px] text-slate-500 truncate mt-0.5">
                          {cleanAddress}
                        </p>
                      )}
                    </div>

                    {isSelected && (
                      <Check className="w-4 h-4 text-emerald-700 shrink-0 self-center" />
                    )}
                  </button>
                );
              })
            )}
          </div>

          {/* Footer info: Google Maps Platform powered */}
          <div className="px-3 py-1.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
            <span className="flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-emerald-600" />
              <span>Google Maps Places & Routes Autocomplete</span>
            </span>
            <span>Karnataka • Tamil Nadu • Kerala</span>
          </div>
        </div>
      )}
    </div>
  );
};
