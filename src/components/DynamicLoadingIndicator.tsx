import React from 'react';
import { Loader2, Route, Sparkles, Car } from 'lucide-react';

interface ProgressBarProps {
  isLoading: boolean;
  className?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ isLoading, className = '' }) => {
  if (!isLoading) return null;

  return (
    <div
      role="progressbar"
      aria-label="Loading in progress"
      className={`relative w-full h-1 sm:h-1.5 overflow-hidden bg-emerald-100/60 dark:bg-emerald-950/40 rounded-full ${className}`}
    >
      <div className="animate-progress-bar" />
    </div>
  );
};

interface SearchLoadingBannerProps {
  message?: string;
  subMessage?: string;
}

export const SearchLoadingBanner: React.FC<SearchLoadingBannerProps> = ({
  message = 'Calculating live route & matching best cabs...',
  subMessage = 'Connecting to Google Maps Distance Matrix & Centralized Fare Engine',
}) => {
  return (
    <div className="w-full bg-emerald-50/80 dark:bg-emerald-950/60 border border-emerald-200/80 dark:border-emerald-800/80 rounded-2xl p-4 sm:p-5 shadow-xs animate-in fade-in zoom-in-95 duration-200">
      <div className="flex items-center gap-3.5">
        <div className="w-10 h-10 rounded-xl bg-emerald-600 dark:bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-xs">
          <Loader2 className="w-5 h-5 animate-spin" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-emerald-950 dark:text-emerald-100 truncate">
              {message}
            </span>
            <span className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-200/70 dark:bg-emerald-800/80 text-emerald-900 dark:text-emerald-200">
              <Sparkles className="w-2.5 h-2.5" /> Live
            </span>
          </div>
          <p className="text-xs text-emerald-800 dark:text-emerald-300/80 mt-0.5 truncate">
            {subMessage}
          </p>
        </div>
      </div>
      <div className="mt-3.5">
        <ProgressBar isLoading={true} />
      </div>
    </div>
  );
};

export const VehicleListSkeleton: React.FC = () => {
  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      <SearchLoadingBanner />
      {[1, 2, 3].map((idx) => (
        <div
          key={idx}
          className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 shadow-xs relative overflow-hidden"
        >
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
            <div className="flex items-center gap-4 w-full md:w-auto">
              <div className="w-20 h-16 rounded-xl skeleton-shimmer shrink-0" />
              <div className="space-y-2 flex-1 min-w-0">
                <div className="h-5 w-40 rounded-md skeleton-shimmer" />
                <div className="h-3 w-56 rounded-md skeleton-shimmer" />
                <div className="flex gap-2">
                  <div className="h-4 w-16 rounded skeleton-shimmer" />
                  <div className="h-4 w-16 rounded skeleton-shimmer" />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between md:justify-end gap-6 w-full md:w-auto border-t md:border-t-0 pt-3 md:pt-0 border-slate-100 dark:border-slate-800">
              <div className="space-y-1.5 text-right">
                <div className="h-6 w-24 rounded-md skeleton-shimmer ml-auto" />
                <div className="h-3 w-16 rounded skeleton-shimmer ml-auto" />
              </div>
              <div className="h-11 w-36 rounded-xl skeleton-shimmer shrink-0" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
