import { BookingSearchState, Vehicle, PricingConfig, FareEstimate } from '../types';
import { BookingTypeCategory } from '../types/dynamicPricing';
import { calculateDynamicFare, detectIndianState } from './dynamicFareEngine';
import { fareService } from '../services/fareService';
import {
  calculateInterStateFare,
  DEFAULT_CENTRALIZED_FARE_CONFIG,
  getVehicleMeta,
} from './centralFareEngine';
import { FareVehicleId } from '../types/fareEngine';
import {
  matchOneWayFixedCorridor,
  calculateOneWayFixedFare,
} from './oneWayFixedCorridors';

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

  // CRITICAL REQUIREMENT:
  // ONLY IN ONE WAY fixed prices for mentioned destinations (Mysuru, Kempegowda International Airport Terminal 1, Terminal 2, Bengaluru city)
  // "dont compare with FARE & PRICE ENGINE"
  if (search.serviceType === 'oneway') {
    const matchedCorridor = matchOneWayFixedCorridor(search);
    if (matchedCorridor) {
      return calculateOneWayFixedFare(matchedCorridor, vehicle, search);
    }
  }

  const hasRouteInfo =
    (search.routeInfo &&
      typeof search.routeInfo.distanceKm === 'number' &&
      search.routeInfo.distanceKm > 0) ||
    (typeof search.distanceKm === 'number' && search.distanceKm > 0);
  const routeDistance = search.routeInfo?.distanceKm ?? search.distanceKm ?? 0;
  const routeDurationMinutes =
    search.routeInfo?.durationMinutes ??
    (routeDistance > 0 ? (routeDistance / 45) * 60 : 0);

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

  // Determine origin and destination states from suggestions or computed route
  const originDetailsStr = search.pickupLocationObj
    ? `${search.pickupLocationObj.formattedAddress || ''} ${search.pickupLocationObj.city || ''} ${search.pickupLocationObj.state || ''}`
    : undefined;
  const destinationDetailsStr = search.dropLocationObj
    ? `${search.dropLocationObj.formattedAddress || ''} ${search.dropLocationObj.city || ''} ${search.dropLocationObj.state || ''}`
    : undefined;

  const detectedOriginState =
    search.pickupLocationObj?.state ||
    search.routeInfo?.interstateStates?.fromState ||
    detectIndianState(search.pickupLocation, search.pickupLocationObj);
  const detectedDestinationState =
    search.dropLocationObj?.state ||
    search.routeInfo?.interstateStates?.toState ||
    detectIndianState(search.dropLocation, search.dropLocationObj);

  const originState = detectedOriginState || undefined;
  const destinationState = detectedDestinationState || undefined;

  // STRICT PRIORITY RULE:
  // IF Trip Type = ONE-WAY or INTER-STATE:
  //     IF Trip Type = INTER-STATE OR (Pickup State ≠ Drop State):
  //         USE INTER-STATE ONE-WAY FARE ENGINE
  //     ELSE:
  //         USE NORMAL ONE-WAY FARE ENGINE
  const isInterStateOneWay =
    search.serviceType === 'oneway' &&
    Boolean(detectedOriginState && detectedDestinationState && detectedOriginState !== detectedDestinationState);

  if (isInterStateOneWay) {
    const centralized = fareService.getCentralizedConfigSync();
    const vId = vehicle.id as FareVehicleId;
    const isPricing =
      centralized.interStateOneWay?.[vId] ||
      DEFAULT_CENTRALIZED_FARE_CONFIG.interStateOneWay[vId] ||
      DEFAULT_CENTRALIZED_FARE_CONFIG.interStateOneWay['sedan-4-1'];

    const calc = calculateInterStateFare(
      isPricing,
      distanceKm,
      getVehicleMeta(vehicle.id),
      detectedOriginState,
      detectedDestinationState
    );

    return {
      estimatedDistanceKm: Math.round(calc.distanceKm),
      exactDistanceKm: distanceKm,
      estimatedDurationHours: Math.round((durationMinutes / 60) * 10) / 10,
      baseFareAmount: calc.baseFare,
      distanceFareAmount: calc.kmCharge + calc.extraKmCharge,
      durationFareAmount: calc.driverAllowance,
      driverAllowanceAmount: calc.driverAllowance,
      tollEstimate: isPricing.includeTolls ? isPricing.tollCharges : 0,
      interstatePermitEstimate: isPricing.includePermit ? isPricing.permitStateTaxCharges : 0,
      nightChargeAmount: 0,
      passengerSurchargeAmount: 0,
      airportSurchargeAmount: 0,
      totalEstimatedFare: calc.finalFare,
      originalFare: calc.originalFare !== calc.finalFare ? calc.originalFare : undefined,
      discountPercentage: isPricing.discountType === 'PERCENTAGE' ? isPricing.discountValue : undefined,
      discountAmount: calc.discountAmount > 0 ? calc.discountAmount : undefined,
      discountLabel: calc.discountLabel,
      includedMinKm: isPricing.minimumBillableKm,
      isValid: true,
      breakdown: calc.breakdown.map((b) => ({ label: b.label, amount: b.amount })),
      isInterState: true,
      originState: detectedOriginState,
      destinationState: detectedDestinationState,
      pricingModel: 'INTER_STATE_ONE_WAY',
      fareSnapshot: {
        vehicleId: vehicle.id,
        vehicleType: vehicle.name,
        pricingVersion: 2,
        pricingModel: 'INTER_STATE_ONE_WAY',
        baseFare: calc.baseFare,
        perKmRate: isPricing.perKmRate,
        extraPerKmRate: isPricing.extraPerKmRate,
        includedKm: isPricing.includedKm || 0,
        includedHours: 0,
        hourlyRate: 0,
        extraPerHourRate: 0,
        driverAllowance: calc.driverAllowance,
        distanceKm: calc.distanceKm,
        durationMinutes: 0,
        durationHours: 0,
        additionalCharges:
          (isPricing.includeTolls ? isPricing.tollCharges : 0) +
          (isPricing.includePermit ? isPricing.permitStateTaxCharges : 0) +
          (isPricing.includeStateEntry ? isPricing.stateEntryCharges : 0) +
          (isPricing.includeOtherCharges ? isPricing.otherCharges : 0),
        totalFare: calc.finalFare,
        currency: 'INR',
        timestamp: new Date().toISOString(),
        originState: detectedOriginState,
        destinationState: detectedDestinationState,
      },
    };
  }

  // Execute the authoritative Dynamic Fare Engine
  const result = calculateDynamicFare({
    origin: search.pickupLocation || 'Mysuru',
    destination:
      search.dropLocation || (search.serviceType === 'local' ? 'Local City' : 'Destination'),
    originDetails: originDetailsStr,
    destinationDetails: destinationDetailsStr,
    originState,
    destinationState,
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

  // Special 15% discount for Local Booking 12 Hours / 120 Km package across all vehicles
  const isLocal12Hours = search.serviceType === 'local' && Number(search.durationHours) === 12;
  const originalFare = result.totalFare;
  const discountPercentage = isLocal12Hours ? 15 : undefined;
  const discountAmount = isLocal12Hours ? Math.round(originalFare * 0.15) : undefined;
  const finalTotalFare = isLocal12Hours && discountAmount ? originalFare - discountAmount : originalFare;

  const breakdownList = result.fareBreakdown.map((item) => ({ label: item.label, amount: item.amount }));
  if (isLocal12Hours && discountAmount) {
    breakdownList.push({
      label: 'Special 15% Discount (12 Hrs / 120 Km Package)',
      amount: -discountAmount,
    });
  }

  const snapshot = result.fareSnapshot
    ? {
        ...result.fareSnapshot,
        totalFare: finalTotalFare,
      }
    : undefined;

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
    totalEstimatedFare: finalTotalFare,
    originalFare: isLocal12Hours ? originalFare : undefined,
    discountPercentage,
    discountAmount,
    discountLabel: isLocal12Hours ? '15% Off (12 Hrs / 120 Km)' : undefined,
    roundTripDays: bookingType === 'ROUND_TRIP' ? days : undefined,
    includedMinKm: result.includedKm || undefined,
    isValid: true,
    breakdown: breakdownList,
    fareSnapshot: snapshot,
    pricingVersion: result.pricingVersion,
    pricingModel: result.pricingModel,
  };
}
