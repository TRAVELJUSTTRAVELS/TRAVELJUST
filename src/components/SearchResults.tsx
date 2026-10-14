import React, { useState } from 'react';
import {
  Car,
  CheckCircle2,
  History,
} from 'lucide-react';
import { BookingSearchState, Vehicle, PricingConfig, SelectedAddOn } from '../types';
import { VehicleCard } from './VehicleCard';
import { vehiclesData } from '../data/vehicles';
import { calculateFare } from '../utils/fareCalculator';
import { FARE_DISCLAIMER } from '../config/pricingConfig';
import { RecentSearchesBar } from './RecentSearchesBar';
import { generateSearchKey } from '../services/searchCacheService';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { VehicleListSkeleton, ProgressBar } from './DynamicLoadingIndicator';
import { PriceComparisonTable } from './PriceComparisonTable';
import { BookingAddOnsSelector } from './BookingAddOnsSelector';

interface SearchResultsProps {
  searchDetails: BookingSearchState;
  pricingConfig: PricingConfig;
  selectedVehicle: Vehicle | null;
  onSelectVehicle: (vehicle: Vehicle) => void;
  onEditSearch: () => void;
  onProceedToBooking: () => void;
  onClearSearch?: () => void;
  onSelectCachedSearch?: (search: BookingSearchState) => void;
  isLoading?: boolean;
  isSubmittingBooking?: boolean;
  selectedAddOns?: SelectedAddOn[];
  onAddOnsChange?: (selected: SelectedAddOn[]) => void;
}

export const SearchResults: React.FC<SearchResultsProps> = ({
  searchDetails,
  pricingConfig,
  selectedVehicle,
  onSelectVehicle,
  onEditSearch,
  onProceedToBooking,
  onClearSearch,
  onSelectCachedSearch,
  isLoading = false,
  isSubmittingBooking = false,
  selectedAddOns = [],
  onAddOnsChange,
}) => {
  const { isOnline, isUnstable, checkConnection } = useOnlineStatus();
  const [showRecentSearches, setShowRecentSearches] = useState<boolean>(true);
  const currentKey = generateSearchKey(searchDetails);

  // Filter vehicles if user selected a specific vehicle type preference
  const availableVehicles = vehiclesData.filter((v) => {
    // Filter out vehicles not suitable for the selected service mode (e.g. Tempo Traveller for Local & Round Trip only)
    if (v.suitableServices && !v.suitableServices.includes(searchDetails.serviceType)) {
      return false;
    }

    if (searchDetails.vehicleType !== 'all' && v.id !== searchDetails.vehicleType) {
      if (
        (searchDetails.vehicleType === 'toyota-etios' || searchDetails.vehicleType === 'swift-desire') &&
        v.id === 'sedan-4-1'
      ) {
        return true;
      }
      if (
        (searchDetails.vehicleType === 'innova-6-1' || searchDetails.vehicleType === 'innova-7-1') &&
        v.id === 'innova'
      ) {
        return true;
      }
      return false;
    }
    // Filter out vehicles that cannot hold passenger count
    if (v.seatingCapacity < searchDetails.passengers) {
      return false;
    }
    return true;
  });

  return (
    <div id="search-results-page-container" className="space-y-6 animate-in fade-in duration-300">
      {/* Available Vehicles Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-xl font-bold text-slate-900">
                Select Your Preferred Vehicle
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Showing {availableVehicles.length} available vehicle options matching your criteria
            </p>
          </div>
        </div>

        {isLoading ? (
          <VehicleListSkeleton />
        ) : availableVehicles.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 text-center space-y-3">
            <Car className="w-12 h-12 text-slate-400 mx-auto" />
            <h4 className="font-bold text-slate-800 dark:text-slate-100 text-lg">
              No Vehicles Available for Selected Passenger Count
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
              Please adjust your passenger count or select an all-vehicles filter to view available mini-buses or larger vehicles.
            </p>
            <button
              onClick={onEditSearch}
              className="mt-2 bg-emerald-800 dark:bg-emerald-700 text-white font-semibold text-xs px-5 py-2.5 rounded-xl hover:bg-emerald-900 transition-colors cursor-pointer"
            >
              Modify Search Options
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Transparent Pricing Engine Banner */}
            <div
              id="search-results-fare-disclaimer-banner"
              className="p-3 sm:p-3.5 bg-emerald-50/90 dark:bg-emerald-950/40 border border-emerald-200/90 dark:border-emerald-800/80 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs shadow-2xs"
            >
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-extrabold text-emerald-950 dark:text-emerald-200 uppercase tracking-wider text-[10px] bg-emerald-200/70 dark:bg-emerald-850 px-2 py-0.5 rounded-md">
                  Estimated Fare
                </span>
                <span className="text-slate-600 dark:text-slate-300 text-[11px] font-medium leading-relaxed">
                  {FARE_DISCLAIMER}
                </span>
              </div>
            </div>

            {/* Dynamic Add-on Services & Amenities (Configured & priced by Owner & Fleet Portal) */}
            <BookingAddOnsSelector
              serviceType={searchDetails.serviceType}
              vehicleId={selectedVehicle?.id}
              selectedAddOns={selectedAddOns}
              onChange={onAddOnsChange || (() => {})}
              tripDays={searchDetails.roundTripDays || 1}
            />

            {availableVehicles.map((vehicle) => {
              const baseFareEstimate = calculateFare(searchDetails, vehicle, pricingConfig);
              const addOnsTotal = selectedAddOns.reduce((sum, item) => sum + item.totalPrice, 0);
              const fareEstimate =
                addOnsTotal > 0
                  ? {
                      ...baseFareEstimate,
                      totalEstimatedFare: baseFareEstimate.totalEstimatedFare + addOnsTotal,
                      breakdown: [
                        ...baseFareEstimate.breakdown,
                        {
                          label: `Selected Add-ons & Amenities (${selectedAddOns.length})`,
                          amount: addOnsTotal,
                        },
                      ],
                    }
                  : baseFareEstimate;

              const isSelected = selectedVehicle?.id === vehicle.id;

              return (
                <VehicleCard
                  key={vehicle.id}
                  vehicle={vehicle}
                  fareEstimate={fareEstimate}
                  pricingConfig={pricingConfig}
                  searchDetails={searchDetails}
                  onSelect={(v) => {
                    onSelectVehicle(v);
                  }}
                  onProceedToBooking={onProceedToBooking}
                  isSelected={isSelected}
                  isSubmittingBooking={isSubmittingBooking}
                />
              );
            })}
          </div>
        )}

        {/* Price Comparison Table for Selected Vehicle */}
        {!isLoading && availableVehicles.length > 0 && (
          <PriceComparisonTable
            vehicle={selectedVehicle || availableVehicles[0]}
            searchDetails={searchDetails}
            pricingConfig={pricingConfig}
            isSelectedByUser={Boolean(selectedVehicle)}
          />
        )}
      </div>
    </div>
  );
};

