import React, { useState, useEffect } from 'react';
import {
  History,
  Trash2,
  ChevronRight,
  Clock,
  Compass,
  ArrowRight,
  Layers,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import {
  CachedSearchItem,
  getRecentCachedSearches,
  removeCachedSearch,
  clearAllCachedSearches,
} from '../services/searchCacheService';
import { BookingSearchState } from '../types';

interface RecentSearchesBarProps {
  currentSearchKey?: string;
  onSelectSearch: (search: BookingSearchState) => void;
  isOffline?: boolean;
}

export const RecentSearchesBar: React.FC<RecentSearchesBarProps> = ({
  currentSearchKey,
  onSelectSearch,
  isOffline = false,
}) => {
  const [searches, setSearches] = useState<CachedSearchItem[]>([]);
  const [isOpen, setIsOpen] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(true);

  const loadSearches = async () => {
    setLoading(true);
    try {
      const items = await getRecentCachedSearches();
      setSearches(items);
    } catch (e) {
      console.warn('Error loading recent searches:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSearches();

    const handleUpdate = () => {
      loadSearches();
    };

    window.addEventListener('tj:search-cache-updated', handleUpdate);
    return () => {
      window.removeEventListener('tj:search-cache-updated', handleUpdate);
    };
  }, []);

  const handleRemove = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    await removeCachedSearch(id);
    setSearches((prev) => prev.filter((s) => s.id !== id));
  };

  const handleClearAll = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Clear all cached recent searches?')) {
      await clearAllCachedSearches();
      setSearches([]);
    }
  };

  if (searches.length === 0 && !loading) {
    return null;
  }

  return (
    <div
      id="recent-cached-searches-container"
      className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-4 sm:p-5 mb-6 transition-all"
    >
      {/* Header bar */}
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-800">
            <History className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-bold text-slate-900 leading-none">
                Recent Searches
              </h4>
              <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                {searches.length} saved
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Quickly re-estimate routes and book verified fleet with 1 click
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {searches.length > 0 && (
            <button
              id="clear-all-cached-searches-btn"
              type="button"
              onClick={handleClearAll}
              className="text-[11px] font-medium text-slate-400 hover:text-rose-600 px-2 py-1 rounded-md transition-colors cursor-pointer"
            >
              Clear all
            </button>
          )}
          <button
            id="toggle-recent-searches-btn"
            type="button"
            onClick={() => setIsOpen((prev) => !prev)}
            className="text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
          >
            {isOpen ? 'Collapse' : 'Show All'}
          </button>
        </div>
      </div>

      {/* Searches List */}
      {isOpen && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5 pt-1">
          {searches.map((item) => {
            const isSelected = currentSearchKey === item.key;
            return (
              <div
                key={item.id}
                id={`cached-search-card-${item.id}`}
                onClick={() => onSelectSearch(item.searchDetails)}
                className={`group relative p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  isSelected
                    ? 'border-emerald-600 bg-emerald-50/50 shadow-xs ring-1 ring-emerald-500'
                    : 'border-slate-200 bg-slate-50/60 hover:bg-white hover:border-emerald-300 hover:shadow-sm'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    {/* Badge & Time */}
                    <div className="flex items-center gap-1.5 flex-wrap text-[10px] mb-1">
                      <span className="font-bold text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded leading-none">
                        {item.serviceBadge}
                      </span>
                      <span className="text-slate-400 flex items-center gap-0.5 leading-none">
                        <Clock className="w-2.5 h-2.5" />
                        {item.formattedDate}
                      </span>
                    </div>

                    {/* Route Title */}
                    <h5 className="text-xs font-bold text-slate-900 truncate group-hover:text-emerald-800 transition-colors">
                      {item.routeTitle}
                    </h5>

                    {/* Pickup & Drop detail */}
                    <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-1 truncate">
                      <Compass className="w-3 h-3 text-slate-400 shrink-0" />
                      <span className="truncate">{item.pickupSummary}</span>
                      <ArrowRight className="w-2.5 h-2.5 text-slate-400 shrink-0" />
                      <span className="truncate">{item.dropSummary}</span>
                    </div>

                    {/* Meta info: km & lowest fare */}
                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-200/60 text-xs">
                      <div className="flex items-center gap-2 text-slate-500 text-[11px]">
                        {item.distanceKm && item.distanceKm > 0 && (
                          <span>{item.distanceKm} km</span>
                        )}
                        <span>{item.passengers} pax</span>
                      </div>

                      {item.lowestFare > 0 && (
                        <div className="text-right">
                          <span className="text-[10px] text-slate-400">from </span>
                          <span className="font-extrabold text-emerald-800 text-xs">
                            ₹{item.lowestFare.toLocaleString('en-IN')}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Delete button */}
                  <button
                    id={`delete-cached-search-${item.id}-btn`}
                    type="button"
                    onClick={(e) => handleRemove(e, item.id)}
                    className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-all cursor-pointer shrink-0"
                    title="Remove from history"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
