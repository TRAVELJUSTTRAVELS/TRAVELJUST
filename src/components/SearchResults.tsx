import React from 'react';
import {
  Car,
  Info,
  CheckCircle2,
} from 'lucide-react';
import { BookingSearchState, Vehicle, PricingConfig } from '../types';
import { VehicleCard } from './VehicleCard';
import { vehiclesData } from '../data/vehicles';
import { calculateFare } from '../utils/fareCalculator';

interface SearchResultsProps {
  searchDetails: BookingSearchState;
  pricingConfig: PricingConfig;
  selectedVehicle: Vehicle | null;
  onSelectVehicle: (vehicle: Vehicle) => void;
  onEditSearch: () => void;
  onProceedToBooking: () => void;
  onClearSearch?: () => void;
}

export const SearchResults: React.FC<SearchResultsProps> = ({
  searchDetails,
  pricingConfig,
  selectedVehicle,
  onSelectVehicle,
  onEditSearch,
  onProceedToBooking,
  onClearSearch,
}) => {
  // Filter vehicles if user selected a specific vehicle type preference
  const availableVehicles = vehiclesData.filter((v) => {
    if (searchDetails.vehicleType !== 'all' && v.id !== searchDetails.vehicleType) {
      return false;
    }
    // Filter out vehicles that cannot hold passenger count
    if (v.seatingCapacity < searchDetails.passengers) {
      return false;
    }
    return true;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Available Vehicles Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-xl font-bold text-slate-900">
                Select Your Preferred Vehicle
              </h3>
              {searchDetails.serviceType === 'local' && searchDetails.durationHours === 12 && (
                <span className="text-xs font-bold text-emerald-800 bg-emerald-100 border border-emerald-300 px-2.5 py-0.5 rounded-full inline-flex items-center gap-1">
                  <span>🎉</span> 15% OFF on 12 Hours / 120 Km
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500">
              Showing {availableVehicles.length} available vehicle options matching your criteria
            </p>
          </div>
        </div>

        {availableVehicles.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-3">
            <Car className="w-12 h-12 text-slate-400 mx-auto" />
            <h4 className="font-bold text-slate-800 text-lg">
              No Vehicles Available for Selected Passenger Count
            </h4>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Please adjust your passenger count or select an all-vehicles filter to view available mini-buses or larger vehicles.
            </p>
            <button
              onClick={onEditSearch}
              className="mt-2 bg-emerald-800 text-white font-semibold text-xs px-5 py-2.5 rounded-xl hover:bg-emerald-900 transition-colors"
            >
              Modify Search Options
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {availableVehicles.map((vehicle) => {
              const fareEstimate = calculateFare(searchDetails, vehicle, pricingConfig);
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
                    if (searchDetails.serviceType === 'local') {
                      onProceedToBooking();
                    }
                  }}
                  isSelected={isSelected}
                />
              );
            })}
          </div>
        )}
      </div>

      {/* Fare Estimation & Proceed Bottom Bar (Hidden for Local Package Form) */}
      {selectedVehicle && searchDetails.serviceType !== 'local' && (
        <div className="sticky bottom-4 z-30 bg-slate-900 text-white p-4 sm:p-5 rounded-2xl shadow-2xl border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 animate-in slide-in-from-bottom-4 duration-200">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 block">
              Selected: {selectedVehicle.name}
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-extrabold text-white">
                Estimated Fare: {pricingConfig.currencySymbol}
                {calculateFare(searchDetails, selectedVehicle, pricingConfig).totalEstimatedFare}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
              <Info className="w-3 h-3 text-emerald-400 shrink-0" />
              <span>* <strong className="text-[#F54900] font-bold">NOTE:</strong> Final fare may vary based on actual route, Extra KM, Parking, Toll, state tax.</span>
            </p>
          </div>

          <div className="flex items-center w-full sm:w-auto">
            <button
              type="button"
              id="search-results-confirm-booking-btn"
              onClick={onProceedToBooking}
              className="w-full sm:w-auto bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 text-white font-extrabold text-base px-8 py-3.5 rounded-xl shadow-lg transition-all active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer uppercase tracking-wider"
            >
              <CheckCircle2 className="w-5 h-5 text-emerald-200" />
              <span>CONFIRM BOOKING</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
