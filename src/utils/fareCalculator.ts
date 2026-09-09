import { BookingSearchState, Vehicle, PricingConfig, FareEstimate } from '../types';
import { BookingTypeCategory } from '../types/dynamicPricing';
import { calculateDynamicFare } from './dynamicFareEngine';
import { fareService } from '../services/fareService';

/**
 * Calculates the inclusive number of days for a round trip.
 * Defaults to 1 day minimum.
 */
export function calculateRoundTripDays(
  travelDate?: string,
  returnDate?: string,
  explicitDays?: number
): number {
  if (typeof explicitDays === 'number' && explicitDays > 0) {
    return Math.floor(explicitDays);
  }
  if (!travelDate || !returnDate) {
    return 1;
  }
  const start = new Date(travelDate);
  const end = new Date(returnDate);
  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return 1;
  }
  const startUTC = Date.UTC(start.getFullYear(), start.getMonth(), start.getDate());
  const endUTC = Date.UTC(end.getFullYear(), end.getMonth(), end.getDate());
  const diffDays = Math.floor((endUTC - startUTC) / (1000 * 60 * 60 * 24)) + 1;
  return Math.max(1, diffDays);
}

/**
 * Standard multi-day round trip tier definitions (1 to 10 days)
 */
export interface RoundTripTier {
  days: number;
  label: string;
  includedMinKm: number;
  driverAllowanceDays: number;
}

export const ROUND_TRIP_TIERS: RoundTripTier[] = [
  { days: 1, label: '1 Day Booking', includedMinKm: 300, driverAllowanceDays: 1 },
  { days: 2, label: '2 Days Booking', includedMinKm: 600, driverAllowanceDays: 2 },
  { days: 3, label: '3 Days Booking', includedMinKm: 900, driverAllowanceDays: 3 },
  { days: 4, label: '4 Days Booking', includedMinKm: 1200, driverAllowanceDays: 4 },
  { days: 5, label: '5 Days Booking', includedMinKm: 1500, driverAllowanceDays: 5 },
  { days: 6, label: '6 Days Booking', includedMinKm: 1800, driverAllowanceDays: 6 },
  { days: 7, label: '7 Days Booking', includedMinKm: 2100, driverAllowanceDays: 7 },
  { days: 8, label: '8 Days Booking', includedMinKm: 2400, driverAllowanceDays: 8 },
  { days: 9, label: '9 Days Booking', includedMinKm: 2700, driverAllowanceDays: 9 },
  { days: 10, label: '10 Days Booking', includedMinKm: 3000, driverAllowanceDays: 10 },
];

export function calculateFare(
  search: BookingSearchState,
  vehicle: Vehicle,
  config: PricingConfig
): FareEstimate {
  // Map front-end service type to Dynamic Pricing category
  let bookingType: BookingTypeCategory = 'ONE_WAY';
  if (search.serviceType === 'local') {
    bookingType = 'LOCAL';
  } else if (search.serviceType === 'roundtrip') {
    bookingType = 'ROUND_TRIP';
  } else if (search.serviceType === 'airport') {
    bookingType = 'AIRPORT_TRANSFER';
  }

  const hasRouteInfo =
    search.routeInfo &&
    typeof search.routeInfo.distanceKm === 'number' &&
    search.routeInfo.distanceKm > 0;
  const routeDistance = hasRouteInfo ? search.routeInfo!.distanceKm : 0;
  const routeDurationMinutes =
    hasRouteInfo && search.routeInfo!.durationMinutes
      ? search.routeInfo!.durationMinutes
      : routeDistance > 0
      ? (routeDistance / 45) * 60
      : 0;

  // Validation for one-way point-to-point drop
  if (search.serviceType === 'oneway' && (!hasRouteInfo || routeDistance <= 0)) {
    return {
      estimatedDistanceKm: 0,
      exactDistanceKm: 0,
      estimatedDurationHours: 0,
      baseFareAmount: 0,
      distanceFareAmount: 0,
      durationFareAmount: 0,
      passengerSurchargeAmount: 0,
      airportSurchargeAmount: 0,
      totalEstimatedFare: 0,
      isValid: false,
      validationError:
        'Please select valid FROM and TO locations to compute the exact driving route and fare.',
      breakdown: [],
    };
  }

  // Calculate distance, duration and multi-day variables
  let distanceKm = routeDistance;
  let durationMinutes = routeDurationMinutes;
  let days = 1;

  if (search.serviceType === 'local') {
    const hours = search.durationHours || 8;
    const includedKm = hours * 10;
    distanceKm = includedKm + (search.extraKm || 0);
    durationMinutes = hours * 60;
  } else if (search.serviceType === 'roundtrip') {
    days = calculateRoundTripDays(search.travelDate, search.returnDate, search.roundTripDays);
    distanceKm = routeDistance > 0 ? routeDistance : 140;
    durationMinutes = routeDurationMinutes > 0 ? routeDurationMinutes : (distanceKm / 40) * 60;
  } else if (search.serviceType === 'airport') {
    distanceKm = routeDistance > 0 ? routeDistance : 170.0;
    durationMinutes = routeDurationMinutes > 0 ? routeDurationMinutes : 210;
    if (search.extraKm && search.extraKm > 0) {
      distanceKm += search.extraKm;
    }
  }

  // Retrieve current independent vehicle dynamic pricing configuration
  const dynamicConfig = fareService.getConfigSync(vehicle.id);

  // Execute the 20-step authoritative Dynamic Fare Engine
  const result = calculateDynamicFare({
    origin: search.pickupLocation || 'Mysuru',
    destination:
      search.dropLocation || (search.serviceType === 'local' ? 'Local City' : 'Destination'),
    distanceKm,
    durationMinutes,
    bookingType,
    vehicleId: vehicle.id,
    pickupTime: search.pickupTime,
    roundTripDays: days,
    airportTransferType: search.airportTransferType || 'pickup',
    viaStopsCount: search.viaLocations ? search.viaLocations.filter((s) => s && s.trim().length > 0).length : 0,
    customPricingConfig: dynamicConfig,
  });

  return {
    estimatedDistanceKm: Math.round(result.distanceKm),
    exactDistanceKm: result.distanceKm,
    estimatedDurationHours: result.durationHours,
    baseFareAmount: result.baseFare,
    distanceFareAmount: Math.round(result.distanceFare + result.extraDistanceFare),
    durationFareAmount: Math.round(result.hourlyFare + result.extraHourFare + result.driverAllowance),
    driverAllowanceAmount: result.driverAllowance,
    tollEstimate: search.routeInfo?.tollEstimate || result.tolls || 0,
    interstatePermitEstimate: search.routeInfo?.interstateTaxEstimate || result.permits || 0,
    nightChargeAmount: result.nightCharge,
    passengerSurchargeAmount: 0,
    airportSurchargeAmount: bookingType === 'AIRPORT_TRANSFER' ? result.baseFare : 0,
    totalEstimatedFare: result.totalFare,
    roundTripDays: bookingType === 'ROUND_TRIP' ? days : undefined,
    includedMinKm: result.includedKm || undefined,
    isValid: true,
    breakdown: result.fareBreakdown.map((item) => ({ label: item.label, amount: item.amount })),
    fareSnapshot: result.fareSnapshot,
    pricingVersion: result.pricingVersion,
    pricingModel: result.pricingModel,
  };
}
