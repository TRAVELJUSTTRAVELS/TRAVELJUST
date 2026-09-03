import React from 'react';
import { Navigation, Clock, MapPin, CheckCircle2, Loader2, Sparkles, Route as RouteIcon, ShieldCheck } from 'lucide-react';
import { CalculatedRouteInfo } from '../types';

interface RouteSummaryCardProps {
  routeInfo: CalculatedRouteInfo | null;
  isLoading?: boolean;
  className?: string;
  isCompact?: boolean;
}

export const RouteSummaryCard: React.FC<RouteSummaryCardProps> = ({
  routeInfo,
  isLoading = false,
  className = '',
  isCompact = false,
}) => {
  if (isLoading) {
    return (
      <div
        className={`bg-emerald-50/80 border border-emerald-200/80 rounded-2xl p-3.5 flex items-center justify-center gap-2.5 text-xs text-emerald-900 font-medium animate-pulse ${className}`}
      >
        <Loader2 className="w-4 h-4 text-emerald-700 animate-spin" />
        <span>Calculating point-to-point driving distance & route...</span>
      </div>
    );
  }

  if (!routeInfo || !routeInfo.distanceKm) {
    return null;
  }

  if (isCompact) {
    return (
      <div
        className={`inline-flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-950 px-3 py-1.5 rounded-xl text-xs font-bold shadow-2xs ${className}`}
      >
        <Navigation className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
        <span>{routeInfo.summaryText || `${routeInfo.distanceKm} km · ${routeInfo.durationFormatted}`}</span>
      </div>
    );
  }

  const corridorText = routeInfo.routeDescription || routeInfo.highwayCorridor || '';

  return (
    <div
      className={`bg-gradient-to-r from-emerald-50 via-teal-50/60 to-emerald-50 border border-emerald-200 rounded-2xl p-4 shadow-2xs transition-all ${className}`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Main Distance and Duration Headline */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-700 text-white flex items-center justify-center shrink-0 shadow-xs">
            <Navigation className="w-5 h-5 text-emerald-100" />
          </div>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-base font-extrabold text-slate-900 tracking-tight">
                {routeInfo.summaryText || `${routeInfo.distanceKm} km · ${routeInfo.durationFormatted}`}
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100/90 text-emerald-800 font-bold text-[10px]">
                <Sparkles className="w-2.5 h-2.5" /> Point-to-Point Route
              </span>
              {routeInfo.dataSource === 'google_maps' && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-bold text-[10px]">
                  <ShieldCheck className="w-2.5 h-2.5" /> Google Maps Verified
                </span>
              )}
            </div>

            <p className="text-xs text-slate-600 font-medium mt-0.5">
              Accurate driving distance powered by Google Maps route calculation
            </p>
          </div>
        </div>

        {/* Stops & Toll pill */}
        <div className="flex items-center gap-2 flex-wrap">
          {typeof routeInfo.tollEstimate === 'number' && routeInfo.tollEstimate > 0 && (
            <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-amber-50 border border-amber-200 text-[11px] font-bold text-amber-800 shadow-2xs">
              <span>Toll Approx. ₹{routeInfo.tollEstimate}</span>
            </div>
          )}
          {routeInfo.stopsCount > 0 && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white/80 border border-emerald-200 text-xs font-bold text-slate-700 shadow-2xs">
              <RouteIcon className="w-3.5 h-3.5 text-emerald-700" />
              <span>{routeInfo.stopsCount} via stop{routeInfo.stopsCount > 1 ? 's' : ''} included</span>
            </div>
          )}
        </div>
      </div>

      {/* Highway / Corridor Info if available */}
      {corridorText && (
        <div className="mt-2.5 text-[11px] font-medium text-emerald-900/90 bg-emerald-100/50 px-2.5 py-1 rounded-lg border border-emerald-200/50 flex items-center gap-1.5">
          <span className="font-bold text-emerald-950">Corridor:</span>
          <span className="truncate">{corridorText}</span>
        </div>
      )}

      {/* Route Path Flow */}
      <div className="mt-2.5 pt-2.5 border-t border-emerald-200/60 flex items-center gap-2 text-xs text-slate-700 font-medium truncate">
        <span className="text-emerald-800 font-bold truncate max-w-[40%]">
          {routeInfo.originAddress}
        </span>
        <span className="text-slate-400 shrink-0">➔</span>
        {routeInfo.viaStops && routeInfo.viaStops.length > 0 && (
          <>
            <span className="text-slate-600 truncate max-w-[20%] text-[11px] bg-white px-1.5 py-0.5 rounded border border-slate-200">
              +{routeInfo.viaStops.length} stop{routeInfo.viaStops.length > 1 ? 's' : ''}
            </span>
            <span className="text-slate-400 shrink-0">➔</span>
          </>
        )}
        <span className="text-slate-900 font-bold truncate max-w-[40%]">
          {routeInfo.destinationAddress}
        </span>
      </div>
    </div>
  );
};
