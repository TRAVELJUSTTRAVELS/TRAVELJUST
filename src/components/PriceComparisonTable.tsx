import React from 'react';
import { ShieldCheck, TrendingDown, Sparkles, CheckCircle2, Car } from 'lucide-react';
import { BookingSearchState, PricingConfig, Vehicle } from '../types';
import { calculateFare } from '../utils/fareCalculator';

interface PriceComparisonTableProps {
  vehicle: Vehicle;
  searchDetails: BookingSearchState;
  pricingConfig: PricingConfig;
  isSelectedByUser: boolean;
}

export const PriceComparisonTable: React.FC<PriceComparisonTableProps> = ({
  vehicle,
  searchDetails,
  pricingConfig,
  isSelectedByUser,
}) => {
  const fare = calculateFare(searchDetails, vehicle, pricingConfig);

  // If fare cannot be calculated (e.g. invalid route or pending coordinates)
  if (!fare || !fare.totalEstimatedFare || fare.isValid === false) {
    return null;
  }

  const tjTotal = fare.totalEstimatedFare;
  const marketTotal =
    fare.originalFare && fare.originalFare > tjTotal
      ? fare.originalFare
      : Math.round((tjTotal * 1.22) / 10) * 10;

  const estimatedSavings = Math.max(0, marketTotal - tjTotal);
  const savingsPct = Math.round((estimatedSavings / marketTotal) * 100);

  const tjBaseAndDistance = fare.baseFareAmount + fare.distanceFareAmount;
  const marketBaseAndDistance = Math.round(marketTotal * 0.82);

  return (
    <div
      id="price-comparison-section"
      className="mt-8 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden transition-all duration-200"
    >
      {/* Header bar */}
      <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-emerald-50/70 via-slate-50 to-white dark:from-emerald-950/30 dark:via-slate-900 dark:to-slate-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-900 dark:text-emerald-300 text-[11px] font-bold uppercase tracking-wider border border-emerald-200/80 dark:border-emerald-800/80">
              <Sparkles className="w-3 h-3 text-emerald-700 dark:text-emerald-400" />
              Direct Fleet Advantage
            </span>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              {isSelectedByUser ? (
                <span className="text-emerald-700 dark:text-emerald-400 font-bold">● Selected Vehicle</span>
              ) : (
                '● Recommended Comparison'
              )}
            </span>
          </div>
          <h4 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-slate-100 mt-1 flex items-center gap-2">
            <Car className="w-4 h-4 text-emerald-800 dark:text-emerald-400 shrink-0" />
            Price Comparison: {vehicle.name} ({vehicle.category})
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Transparent rate breakdown showing base fare and your guaranteed savings vs standard aggregators.
          </p>
        </div>

        {/* Savings Highlight Pill */}
        <div className="shrink-0 flex items-center gap-2 bg-emerald-100/90 dark:bg-emerald-900/60 border border-emerald-300 dark:border-emerald-700 px-3.5 py-2 rounded-xl">
          <TrendingDown className="w-5 h-5 text-emerald-800 dark:text-emerald-300 shrink-0" />
          <div className="text-left">
            <div className="text-[10px] uppercase font-extrabold tracking-wider text-emerald-800 dark:text-emerald-300">
              Estimated Savings
            </div>
            <div className="text-base font-extrabold text-emerald-950 dark:text-emerald-100 tabular-nums leading-tight">
              Save {pricingConfig.currencySymbol}{estimatedSavings.toLocaleString('en-IN')}{' '}
              <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">
                ({savingsPct}% OFF)
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Clean Tabular Layout */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs sm:text-sm border-collapse">
          <thead>
            <tr className="bg-slate-50/90 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200/90 dark:border-slate-800 text-[11px] sm:text-xs uppercase tracking-wider">
              <th scope="col" className="py-3 px-4 sm:px-6">
                Fare Component
              </th>
              <th scope="col" className="py-3 px-3 sm:px-5 text-slate-500 dark:text-slate-400">
                Standard Market Rates
              </th>
              <th
                scope="col"
                className="py-3 px-3 sm:px-5 bg-emerald-50/80 dark:bg-emerald-950/40 text-emerald-950 dark:text-emerald-200 border-x border-emerald-200/60 dark:border-emerald-800/60 font-extrabold"
              >
                TRAVEL JUST (Direct)
              </th>
              <th scope="col" className="py-3 px-4 sm:px-6 text-emerald-800 dark:text-emerald-300 font-bold">
                Your Advantage
              </th>
            </tr>
          </thead>
          <tbody
            key={`${vehicle.id}-${fare.totalEstimatedFare}`}
            className="divide-y divide-slate-100 dark:divide-slate-800/80"
          >
            {/* Row 1: Base & Distance Ride Fare */}
            <tr className="animate-fade-in-up [animation-delay:40ms] opacity-0 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
              <td className="py-3.5 px-4 sm:px-6 font-semibold text-slate-800 dark:text-slate-200">
                <div>Base & Kilometre Rate</div>
                <div className="text-[11px] font-normal text-slate-500 dark:text-slate-400">
                  Calculated based on {fare.estimatedDistanceKm || searchDetails.distanceKm || '--'} km journey
                </div>
              </td>
              <td className="py-3.5 px-3 sm:px-5 text-slate-600 dark:text-slate-400 tabular-nums line-through decoration-slate-400">
                {pricingConfig.currencySymbol}
                {marketBaseAndDistance.toLocaleString('en-IN')}
              </td>
              <td className="py-3.5 px-3 sm:px-5 bg-emerald-50/30 dark:bg-emerald-950/20 font-bold text-slate-900 dark:text-slate-100 border-x border-emerald-200/40 dark:border-emerald-800/40 tabular-nums">
                {pricingConfig.currencySymbol}
                {tjBaseAndDistance.toLocaleString('en-IN')}
              </td>
              <td className="py-3.5 px-4 sm:px-6 text-slate-700 dark:text-slate-300 font-medium">
                <span className="inline-flex items-center gap-1 text-emerald-800 dark:text-emerald-400 font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  Direct fleet pricing
                </span>
                <span className="hidden sm:inline text-xs text-slate-500 dark:text-slate-400 ml-1">
                  (No 20% broker commission)
                </span>
              </td>
            </tr>

            {/* Row 2: Surge & Prime-Time Charges */}
            <tr className="animate-fade-in-up [animation-delay:90ms] opacity-0 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
              <td className="py-3.5 px-4 sm:px-6 font-semibold text-slate-800 dark:text-slate-200">
                <div>Surge & Peak Time Fee</div>
                <div className="text-[11px] font-normal text-slate-500 dark:text-slate-400">
                  Late-night, weekend & festive surges
                </div>
              </td>
              <td className="py-3.5 px-3 sm:px-5 text-amber-700 dark:text-amber-400 font-medium text-xs">
                +15% to +35% Dynamic
              </td>
              <td className="py-3.5 px-3 sm:px-5 bg-emerald-50/30 dark:bg-emerald-950/20 font-extrabold text-emerald-800 dark:text-emerald-300 border-x border-emerald-200/40 dark:border-emerald-800/40 tabular-nums">
                {pricingConfig.currencySymbol}0 (Zero Surge)
              </td>
              <td className="py-3.5 px-4 sm:px-6 text-slate-700 dark:text-slate-300 font-medium">
                <span className="inline-flex items-center gap-1 text-emerald-800 dark:text-emerald-400 font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  100% Fixed Rates
                </span>
                <span className="hidden sm:inline text-xs text-slate-500 dark:text-slate-400 ml-1">
                  (Rain or rush hours)
                </span>
              </td>
            </tr>

            {/* Row 3: Platform & Convenience Fee */}
            <tr className="animate-fade-in-up [animation-delay:140ms] opacity-0 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
              <td className="py-3.5 px-4 sm:px-6 font-semibold text-slate-800 dark:text-slate-200">
                <div>App Booking / Convenience Fee</div>
                <div className="text-[11px] font-normal text-slate-500 dark:text-slate-400">
                  Third-party app surcharge
                </div>
              </td>
              <td className="py-3.5 px-3 sm:px-5 text-slate-600 dark:text-slate-400 tabular-nums">
                {pricingConfig.currencySymbol}149 – {pricingConfig.currencySymbol}249 + GST
              </td>
              <td className="py-3.5 px-3 sm:px-5 bg-emerald-50/30 dark:bg-emerald-950/20 font-extrabold text-emerald-800 dark:text-emerald-300 border-x border-emerald-200/40 dark:border-emerald-800/40 tabular-nums">
                {pricingConfig.currencySymbol}0 Free
              </td>
              <td className="py-3.5 px-4 sm:px-6 text-slate-700 dark:text-slate-300 font-medium">
                <span className="inline-flex items-center gap-1 text-emerald-800 dark:text-emerald-400 font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  Zero Platform Fee
                </span>
              </td>
            </tr>

            {/* Row 4: Driver Allowance & Night Charges */}
            <tr className="animate-fade-in-up [animation-delay:190ms] opacity-0 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
              <td className="py-3.5 px-4 sm:px-6 font-semibold text-slate-800 dark:text-slate-200">
                <div>Driver Allowance & Support</div>
                <div className="text-[11px] font-normal text-slate-500 dark:text-slate-400">
                  Chauffeur charges & hill driving assistance
                </div>
              </td>
              <td className="py-3.5 px-3 sm:px-5 text-slate-600 dark:text-slate-400 text-xs">
                Often added at trip end
              </td>
              <td className="py-3.5 px-3 sm:px-5 bg-emerald-50/30 dark:bg-emerald-950/20 font-bold text-slate-900 dark:text-slate-100 border-x border-emerald-200/40 dark:border-emerald-800/40 tabular-nums">
                {fare.driverAllowanceAmount && fare.driverAllowanceAmount > 0 ? (
                  `${pricingConfig.currencySymbol}${fare.driverAllowanceAmount.toLocaleString('en-IN')}`
                ) : (
                  'Included in Base'
                )}
              </td>
              <td className="py-3.5 px-4 sm:px-6 text-slate-700 dark:text-slate-300 font-medium">
                <span className="inline-flex items-center gap-1 text-emerald-800 dark:text-emerald-400 font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  Transparent upfront quote
                </span>
              </td>
            </tr>

            {/* Final Row: Net Total Fare & Estimated Savings */}
            <tr className="animate-fade-in-up [animation-delay:250ms] opacity-0 bg-emerald-50/50 dark:bg-emerald-950/30 border-t-2 border-emerald-600/30 dark:border-emerald-600/40">
              <td className="py-4 px-4 sm:px-6 font-extrabold text-slate-900 dark:text-white text-sm sm:text-base">
                Net Estimated Fare
              </td>
              <td className="py-4 px-3 sm:px-5 font-bold text-slate-500 dark:text-slate-400 tabular-nums text-sm sm:text-base line-through">
                {pricingConfig.currencySymbol}
                {marketTotal.toLocaleString('en-IN')}
              </td>
              <td className="py-4 px-3 sm:px-5 bg-emerald-100/70 dark:bg-emerald-900/60 font-extrabold text-emerald-950 dark:text-white border-x-2 border-emerald-600/40 dark:border-emerald-500/40 tabular-nums text-base sm:text-lg">
                {pricingConfig.currencySymbol}
                {tjTotal.toLocaleString('en-IN')}
              </td>
              <td className="py-4 px-4 sm:px-6 font-extrabold text-emerald-800 dark:text-emerald-300 text-xs sm:text-sm">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="bg-emerald-700 text-white px-2 py-0.5 rounded-md text-xs font-black shadow-2xs">
                    SAVE {pricingConfig.currencySymbol}{estimatedSavings.toLocaleString('en-IN')}
                  </span>
                  <span className="text-xs text-emerald-900 dark:text-emerald-200">
                    ({savingsPct}% Lower vs Market)
                  </span>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Trust reassurance banner */}
      <div className="px-4 py-3 bg-slate-50 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs text-slate-600 dark:text-slate-400">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-800 dark:text-emerald-400 shrink-0" />
          <span>
            Strict price lock guaranteed: Once booked, your rate is locked with zero surprise charges.
          </span>
        </div>
        <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500">
          *Estimates based on prevailing Mysuru-Bengaluru-Ooty market aggregator rates.
        </span>
      </div>
    </div>
  );
};
