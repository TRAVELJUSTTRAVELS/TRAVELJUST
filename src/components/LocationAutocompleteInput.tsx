import React, { useState, useEffect, useRef } from 'react';
import {
  MapPin,
  Plane,
  Check,
  Search,
  Sparkles,
  Loader2,
  Clock,
} from 'lucide-react';
import { PlaceSuggestion } from '../types';
import {
  fetchPlaceSuggestions,
  POPULAR_LOCATIONS,
  saveRecentSearch,
} from '../services/googleMapsService';

interface LocationAutocompleteInputProps {
  id?: string;
  label: string;
  placeholder?: string;
  value: string;
  onChange: (value: string, suggestion?: PlaceSuggestion) => void;
  iconType?: 'pickup' | 'drop' | 'via' | 'airport';
  error?: string;
  disabled?: boolean;
  required?: boolean;
  onClear?: () => void;
  className?: string;
}

export const LocationAutocompleteInput: React.FC<LocationAutocompleteInputProps> = ({
  id,
  label,
  placeholder = 'Enter location or landmark',
  value,
  onChange,
  iconType = 'pickup',
  error,
  disabled = false,
  required = false,
  onClear,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

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

  // Fetch suggestions with debounce when customer searches (non-empty query)
  useEffect(() => {
    if (!isOpen || !value || value.trim().length === 0) {
      setSuggestions([]);
      setIsLoading(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const results = await fetchPlaceSuggestions(value);
        setSuggestions(results);
      } catch (err) {
        console.debug('Error fetching suggestions:', err);
        setSuggestions([]);
      } finally {
        setIsLoading(false);
      }
    }, 120);

    return () => clearTimeout(timer);
  }, [value, isOpen]);

  const handleSelect = (suggestion: PlaceSuggestion) => {
    saveRecentSearch(suggestion);
    onChange(suggestion.placeName, suggestion);
    setIsOpen(false);
    setSelectedIndex(-1);
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

  return (
    <div ref={containerRef} className={`relative space-y-1.5 ${className}`}>
      {/* Label & Actions */}
      <div className="flex items-center justify-between min-h-[20px]">
        <label
          htmlFor={id}
          className="text-xs font-bold text-slate-700 uppercase tracking-wide flex items-center gap-1.5"
        >
          {renderIcon()}
          <span>{label}</span>
          {required && <span className="text-rose-500">*</span>}
        </label>
        
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

      {/* Input Box */}
      <div className="relative">
        <input
          ref={inputRef}
          id={id}
          type="text"
          value={value}
          disabled={disabled}
          onChange={(e) => {
            onChange(e.target.value);
            if (!isOpen) setIsOpen(true);
          }}
          onFocus={() => {
            if (value && value.trim().length > 0) {
              setIsOpen(true);
            }
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          autoComplete="off"
          className={`w-full h-[52px] bg-slate-50 border text-slate-900 rounded-xl px-3.5 text-sm font-semibold focus:bg-white focus:outline-none transition-all placeholder:text-slate-400 ${
            error
              ? 'border-rose-400 focus:ring-2 focus:ring-rose-200 bg-rose-50/30'
              : isOpen && value && value.trim().length > 0
              ? 'border-emerald-600 ring-2 ring-emerald-100 bg-white shadow-xs'
              : 'border-slate-300 hover:border-slate-400'
          } ${disabled ? 'opacity-60 cursor-not-allowed bg-slate-100' : ''}`}
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

      {/* Error Message */}
      {error && <p className="text-xs text-rose-600 font-medium">{error}</p>}

      {/* Intelligent Suggestions Dropdown - Appears strictly when customer searches */}
      {isOpen && value && value.trim().length > 0 && (
        <div className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden max-h-84 overflow-y-auto animate-in fade-in-50 zoom-in-95 duration-150">
          {/* Header */}
          <div className="px-3.5 py-2 bg-slate-50/95 border-b border-slate-100 flex items-center justify-between text-[11px] text-slate-600 font-semibold">
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>Matching Destinations & Places</span>
            </span>
            <span className="text-[10px] text-slate-400">Click to select</span>
          </div>

          {/* List of Suggestions - Destination Names & Clean Locality */}
          <div className="p-1 divide-y divide-slate-100">
            {suggestions.length === 0 && !isLoading ? (
              <div className="p-5 text-center text-xs text-slate-500">
                <Search className="w-6 h-6 text-slate-300 mx-auto mb-1.5" />
                No matching destination found. You can type any specific address, destination, or landmark.
              </div>
            ) : (
              suggestions.map((item, idx) => {
                const isSelected = selectedIndex === idx;
                const isAirport = item.isAirport || item.category === 'airports';

                // Format clean address without PIN codes, Taluks, or clutter
                const rawAddr = item.formattedAddress || [item.areaLocality, item.city, item.state].filter(Boolean).join(', ');
                const cleanAddress = rawAddr
                  .replace(/\b\d{6}\b/g, '') // remove 6 digit PIN codes
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
                    {/* Clean Icon */}
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                        isAirport
                          ? 'bg-sky-100 text-sky-700'
                          : isSelected
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {isAirport ? (
                        <Plane className="w-4 h-4" />
                      ) : (
                        <MapPin className="w-4 h-4" />
                      )}
                    </div>

                    {/* Place Name and Clean Locality/City Only */}
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
        </div>
      )}
    </div>
  );
};
