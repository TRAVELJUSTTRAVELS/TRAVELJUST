import React from 'react';
import {
  MapPin,
  Calendar,
  Clock,
  Users,
  Edit3,
  Car,
  SlidersHorizontal,
  Info,
  X,
  Trash2,
  MessageSquare,
} from 'lucide-react';
import { BookingSearchState, Vehicle, PricingConfig } from '../types';
import { VehicleCard } from './VehicleCard';
import { vehiclesData } from '../data/vehicles';
import { calculateFare } from '../utils/fareCalculator';
import {
  buildWhatsAppBookingEnquiryMessage,
  trackWhatsAppBookingEnquiry,
  openWhatsAppChat,
  generateEnquiryId,
} from '../utils/whatsapp';

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

  const handleWhatsAppEnquiry = () => {
    if (!selectedVehicle) return;
    const fareRes = calculateFare(searchDetails, selectedVehicle, pricingConfig);
    const payload = {
      enquiryId: generateEnquiryId(searchDetails.travelDate || searchDetails.pickupDate),
      tripType: searchDetails.serviceType,
      from: searchDetails.pickupLocation,
      to: searchDetails.serviceType === 'local' ? undefined : searchDetails.dropLocation,
      travelDate: searchDetails.travelDate || searchDetails.pickupDate || new Date().toISOString().split('T')[0],
      pickupTime: searchDetails.pickupTime || '07:00 AM',
      returnDate: searchDetails.returnDate || searchDetails.dropDate,
      returnTime: searchDetails.returnTime,
      passengers: searchDetails.passengers,
      vehicleName: selectedVehicle.name,
      vehicleCategory: selectedVehicle.category,
      distanceKm: fareRes.exactDistanceKm || fareRes.estimatedDistanceKm || searchDetails.routeInfo?.distanceKm,
      durationHours: searchDetails.durationHours,
      estimatedFare: fareRes.totalEstimatedFare,
      airportTransferType: searchDetails.airportTransferType,
    };
    const message = buildWhatsAppBookingEnquiryMessage(payload);
    trackWhatsAppBookingEnquiry(payload);
    openWhatsAppChat(message);
  };

  const getServiceTitle = (type: string) => {
    switch (type) {
      case 'local':
        return 'Local Travel Package';
      case 'oneway':
        return 'One Way Drop';
      case 'roundtrip':
        return 'Round Trip Journey';
      case 'airport':
        return `Airport Transfer (${searchDetails.airportTransferType === 'pickup' ? 'Pickup' : 'Drop'})`;
      default:
        return 'Travel Service';
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Search Criteria Bar */}
      <div className="bg-emerald-900 text-white rounded-2xl p-5 sm:p-6 shadow-md relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="inline-block px-2.5 py-0.5 rounded-md bg-emerald-800 text-emerald-100 text-xs font-bold uppercase tracking-wider mb-2">
              {getServiceTitle(searchDetails.serviceType)}
            </div>
            <h2 className="text-xl sm:text-2xl font-bold flex flex-wrap items-center gap-2">
              <span>{searchDetails.pickupLocation}</span>
              {searchDetails.dropLocation && searchDetails.serviceType !== 'local' && (
                <>
                  <span className="text-emerald-300">→</span>
                  <span>{searchDetails.dropLocation}</span>
                </>
              )}
            </h2>
            <div className="flex flex-wrap items-center gap-4 text-xs text-emerald-100/90 mt-2">
              <span className="flex items-center gap-1.5 bg-emerald-800/80 px-2.5 py-1 rounded-lg border border-emerald-700/60 font-medium">
                <Calendar className="w-3.5 h-3.5 text-emerald-300" />
                <span className="font-bold text-white">Pickup:</span>
                <span>{searchDetails.pickupDate || searchDetails.travelDate}</span>
              </span>

              <span className="flex items-center gap-1.5 bg-emerald-800/80 px-2.5 py-1 rounded-lg border border-emerald-700/60 font-medium">
                <Clock className="w-3.5 h-3.5 text-emerald-300" />
                <span className="font-bold text-white">Time:</span>
                <span>{searchDetails.pickupTime || '09:00'}</span>
              </span>

              {searchDetails.serviceType === 'roundtrip' && (
                <span className="flex items-center gap-1.5 bg-emerald-800/80 px-2.5 py-1 rounded-lg border border-emerald-700/60 font-medium">
                  <Calendar className="w-3.5 h-3.5 text-emerald-300" />
                  <span className="font-bold text-white">Return:</span>
                  <span>{searchDetails.dropDate || searchDetails.returnDate || searchDetails.travelDate}</span>
                </span>
              )}

              <span className="flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-emerald-300" />
                {searchDetails.passengers} Passengers
              </span>
              {searchDetails.routeInfo?.summaryText && (
                <span className="flex items-center gap-1.5 bg-emerald-800/90 border border-emerald-700/80 px-2.5 py-0.5 rounded-full text-emerald-200 font-bold">
                  <span>📍</span>
                  {searchDetails.routeInfo.summaryText}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 self-start lg:self-center">
            <button
              type="button"
              onClick={onEditSearch}
              className="bg-white/10 hover:bg-white/20 text-white font-semibold text-xs px-4 py-2.5 rounded-xl border border-white/20 transition-all flex items-center gap-2"
            >
              <Edit3 className="w-4 h-4" />
              Modify Search
            </button>
            {onClearSearch && (
              <button
                type="button"
                onClick={onClearSearch}
                title="Close and dismiss search results"
                className="bg-red-500/20 hover:bg-red-500/30 text-white font-semibold text-xs px-3 py-2.5 rounded-xl border border-red-400/30 transition-all flex items-center gap-1.5"
              >
                <X className="w-4 h-4" />
                <span>Close</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Available Vehicles Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xl font-bold text-slate-900">
              Select Your Preferred Vehicle
            </h3>
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
              <span className="text-xs text-slate-400">
                ({pricingConfig.currencyCode})
              </span>
            </div>
            <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
              <Info className="w-3 h-3 text-emerald-400 shrink-0" />
              <span>* <strong className="text-[#F54900] font-bold">NOTE:</strong> final fare may vary based on actual route, Extra KM, Parking, Toll, state tax.</span>
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-2.5 w-full sm:w-auto">
            <button
              type="button"
              id="search-results-whatsapp-enquiry-btn"
              onClick={handleWhatsAppEnquiry}
              aria-label="Send booking enquiry to TRAVEL JUST on WhatsApp"
              className="w-full sm:w-auto bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold text-sm px-5 py-3.5 rounded-xl shadow-md transition-all active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer"
            >
              <MessageSquare className="w-4 h-4" />
              <span>WhatsApp Enquiry</span>
            </button>

            <button
              type="button"
              id="search-results-proceed-btn"
              onClick={onProceedToBooking}
              className="w-full sm:w-auto bg-emerald-800 hover:bg-emerald-900 text-white font-extrabold text-base px-8 py-3.5 rounded-xl shadow-lg transition-all active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer"
            >
              Proceed to Passenger Details
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
