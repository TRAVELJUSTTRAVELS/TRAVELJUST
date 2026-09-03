import React, { useState, useMemo } from 'react';
import {
  MapPin,
  Plane,
  TreePine,
  Landmark,
  Compass,
  Search,
  Navigation,
  Clock,
  ArrowRight,
  Copy,
  Check,
  Sparkles,
  ExternalLink,
  Car,
  ChevronRight,
  Building,
  ShieldCheck,
} from 'lucide-react';
import { PlaceSuggestion, BookingSearchState } from '../types';
import {
  POPULAR_LOCATIONS,
  LOCATION_CATEGORIES,
  calculateRouteDistance,
} from '../services/googleMapsService';

interface PopularDestinationsDirectoryProps {
  onSelectDestinationForBooking?: (destination: PlaceSuggestion, serviceType?: 'oneway' | 'roundtrip' | 'local' | 'airport') => void;
  onSetPickupLocation?: (location: PlaceSuggestion) => void;
}

export const PopularDestinationsDirectory: React.FC<PopularDestinationsDirectoryProps> = ({
  onSelectDestinationForBooking,
  onSetPickupLocation,
}) => {
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Filter locations based on category tab & search query
  const filteredLocations = useMemo(() => {
    let list = POPULAR_LOCATIONS;

    if (activeCategory !== 'all') {
      const cat = LOCATION_CATEGORIES.find((c) => c.id === activeCategory);
      if (cat) {
        list = cat.locations;
      }
    }

    if (!searchQuery.trim()) {
      return list;
    }

    const queryTokens = searchQuery.toLowerCase().trim().split(/[\s,/-]+/);
    return list.filter((item) => {
      const combined = `${item.placeName} ${item.areaLocality} ${item.taluk || ''} ${item.village || ''} ${item.district || ''} ${item.city} ${item.formattedAddress} ${item.pincode || ''} ${item.landmark || ''} ${item.description || ''}`.toLowerCase();
      return queryTokens.every((token) => combined.includes(token));
    });
  }, [activeCategory, searchQuery]);

  const handleCopyAddress = (item: PlaceSuggestion, e: React.MouseEvent) => {
    e.stopPropagation();
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(item.formattedAddress);
      setCopiedId(item.placeId);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  const handleBookNow = (item: PlaceSuggestion) => {
    if (onSelectDestinationForBooking) {
      const serviceType = item.isAirport ? 'airport' : (item.estimatedFromMysuruKm && item.estimatedFromMysuruKm > 50) ? 'oneway' : 'local';
      onSelectDestinationForBooking(item, serviceType);
    }
  };

  return (
    <section id="destinations-directory-section" className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Section Header */}
      <div className="text-center max-w-3xl mx-auto mb-10 space-y-3">
        <div className="inline-flex items-center gap-2 bg-emerald-100/90 text-emerald-900 border border-emerald-200/80 px-3.5 py-1 rounded-full text-xs font-bold tracking-wide uppercase">
          <Sparkles className="w-3.5 h-3.5 text-emerald-700" />
          <span>Explore Verified Google Map Locations & Routes</span>
        </div>

        <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          Popular Destinations, Addresses & Local Places
        </h2>

        <p className="text-base text-slate-600 font-normal leading-relaxed">
          Browse verified addresses, airport terminals, heritage monuments, hill resorts, wildlife safaris, and local city nodes with live distance calculations and direct 1-click booking.
        </p>
      </div>

      {/* Search & Category Filter Bar */}
      <div className="bg-white rounded-3xl p-4 sm:p-6 shadow-sm border border-slate-200 mb-8 space-y-4">
        {/* Search Input Box */}
        <div className="relative">
          <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by destination name, address, city, or landmark (e.g. 'KIAL T2', 'Ooty Lake', 'Mysore Palace', 'Bandipur')..."
            className="w-full pl-12 pr-10 py-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 hover:text-slate-700 cursor-pointer"
            >
              Clear
            </button>
          )}
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          <button
            type="button"
            onClick={() => setActiveCategory('all')}
            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
              activeCategory === 'all'
                ? 'bg-emerald-800 text-white shadow-sm ring-2 ring-emerald-800/30'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            All Destinations ({POPULAR_LOCATIONS.length})
          </button>

          {LOCATION_CATEGORIES.map((cat) => {
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveCategory(cat.id)}
                className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-emerald-800 text-white shadow-sm ring-2 ring-emerald-800/30'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                <span>{cat.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    isActive ? 'bg-emerald-700 text-emerald-100' : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {cat.locations.length}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Grid of Verified Places */}
      {filteredLocations.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 space-y-3">
          <Search className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="text-lg font-bold text-slate-800">No destinations found</h3>
          <p className="text-sm text-slate-500 max-w-md mx-auto">
            Try searching with a different keyword, PIN code, or select "All Destinations" to view the full directory.
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setActiveCategory('all');
            }}
            className="mt-2 text-xs font-bold text-emerald-800 hover:text-emerald-900 underline cursor-pointer"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredLocations.map((item) => {
            const isAirport = item.isAirport || item.category === 'airports';
            const isPark = item.types?.includes('park') || item.category === 'wildlife_safari';
            const isTemple = item.types?.includes('place_of_worship') || item.category === 'heritage_pilgrimage';

            return (
              <div
                key={item.placeId}
                className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs hover:shadow-md hover:border-emerald-200 transition-all flex flex-col justify-between group"
              >
                <div className="space-y-3">
                  {/* Card Top: Icon & Category Badge */}
                  <div className="flex items-start justify-between gap-2">
                    <div
                      className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
                        isAirport
                          ? 'bg-sky-100 text-sky-700'
                          : isPark
                          ? 'bg-emerald-100 text-emerald-800'
                          : isTemple
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-emerald-50 text-emerald-800'
                      }`}
                    >
                      {isAirport ? (
                        <Plane className="w-5 h-5" />
                      ) : isPark ? (
                        <TreePine className="w-5 h-5" />
                      ) : isTemple ? (
                        <Landmark className="w-5 h-5" />
                      ) : (
                        <MapPin className="w-5 h-5" />
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 flex-wrap justify-end">
                      {isAirport && (
                        <span className="px-2 py-0.5 rounded-full bg-sky-100 text-sky-800 text-[10px] font-extrabold uppercase tracking-wide">
                          Airport
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Destination Title & City */}
                  <div>
                    <h3 className="text-base font-bold text-slate-900 leading-snug group-hover:text-emerald-800 transition-colors">
                      {item.placeName}
                    </h3>
                    <p className="text-xs font-semibold text-slate-500 mt-0.5">
                      {[item.district, item.areaLocality, item.city].filter(Boolean).join(' • ')}
                    </p>
                  </div>

                  {/* Full Verified Address */}
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 flex items-start justify-between gap-2">
                    <p className="text-[11px] text-slate-600 leading-relaxed font-normal">
                      {item.formattedAddress}
                    </p>
                    <button
                      type="button"
                      onClick={(e) => handleCopyAddress(item, e)}
                      title="Copy Address"
                      className="text-slate-400 hover:text-emerald-700 p-1 shrink-0 rounded-lg hover:bg-slate-200/60 transition-colors cursor-pointer"
                    >
                      {copiedId === item.placeId ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>

                  {/* Landmark or Description */}
                  {item.landmark && (
                    <p className="text-xs text-slate-500 flex items-start gap-1.5">
                      <span className="text-slate-400 shrink-0">📍</span>
                      <span className="line-clamp-1"><strong className="text-slate-700">Landmark:</strong> {item.landmark}</span>
                    </p>
                  )}

                  {item.description && (
                    <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                      {item.description}
                    </p>
                  )}

                  {/* Highlights tags */}
                  {item.highlights && item.highlights.length > 0 && (
                    <div className="flex items-center gap-1.5 flex-wrap pt-1">
                      {item.highlights.map((tag, idx) => (
                        <span
                          key={idx}
                          className="text-[10px] font-medium bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md"
                        >
                          ✓ {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Card Footer: Distance Stats & Action Buttons */}
                <div className="pt-4 mt-4 border-t border-slate-100 space-y-3">
                  {item.estimatedFromMysuruKm !== undefined && (
                    <div className="flex items-center justify-between text-xs text-slate-600">
                      <span className="font-semibold text-slate-700 flex items-center gap-1">
                        <Navigation className="w-3.5 h-3.5 text-emerald-700" />
                        <span>~{item.estimatedFromMysuruKm} km from Mysuru</span>
                      </span>
                      {item.estimatedTravelTime && (
                        <span className="flex items-center gap-1 text-slate-500 font-medium">
                          <Clock className="w-3 h-3" />
                          <span>{item.estimatedTravelTime}</span>
                        </span>
                      )}
                    </div>
                  )}

                  {/* Booking Action Buttons */}
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    {onSetPickupLocation && (
                      <button
                        type="button"
                        onClick={() => onSetPickupLocation(item)}
                        className="w-full text-center py-2 px-2.5 rounded-xl border border-slate-300 hover:border-slate-400 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all cursor-pointer"
                      >
                        Set Pickup
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleBookNow(item)}
                      className={`w-full text-center py-2 px-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold shadow-xs hover:shadow-sm transition-all flex items-center justify-center gap-1 cursor-pointer ${
                        !onSetPickupLocation ? 'col-span-2' : ''
                      }`}
                    >
                      <span>Book Ride Here</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};
