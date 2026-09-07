import { BookingSearchState, Vehicle, PricingConfig, FareEstimate } from '../types';

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
  const breakdown: { label: string; amount: number }[] = [];
  
  // Retrieve specific pricing config for this vehicle if available, or fall back dynamically
  const vPricing = config.vehiclePricing?.[vehicle.id] || {
    vehicleId: vehicle.id,
    baseFare: Math.round(config.baseFare * vehicle.basePriceFactor),
    localPerKmRate: Number((12.0 * vehicle.basePriceFactor).toFixed(1)),
    localDriverAllowance: Math.round(250 * vehicle.basePriceFactor),
    oneWayPerKmRate: Number((13.5 * vehicle.basePriceFactor).toFixed(1)),
    oneWayDriverAllowance: Math.round(300 * vehicle.basePriceFactor),
    airportPerKmRate: Number((13.5 * vehicle.basePriceFactor).toFixed(1)),
    airportDriverAllowance: Math.round(250 * vehicle.basePriceFactor),
    perKmFare: Number((config.perKmFare * vehicle.basePriceFactor).toFixed(1)),
    perHourFare: Math.round(config.perHourFare * vehicle.basePriceFactor),
    driverAllowancePerDay: Math.round(300 * vehicle.basePriceFactor),
    airportBaseFare: Math.round(699 * vehicle.basePriceFactor),
    minKmPerDay: 300,
    nightChargePercentage: config.nightChargePercentage || 10,
  };

  const base = vPricing.baseFare;
  breakdown.push({
    label: `Base Rate for ${vehicle.name}`,
    amount: Math.round(base),
  });

  let distanceKm = 0;
  let durationHours = 0;
  let distanceFare = 0;
  let durationFare = 0;
  let airportSurcharge = 0;
  let passengerSurcharge = 0;
  let roundTripDays: number | undefined = undefined;
  let includedMinKm: number | undefined = undefined;

  // Estimate distance and duration based on service type and actual calculated route info
  const hasRouteInfo = search.routeInfo && typeof search.routeInfo.distanceKm === 'number' && search.routeInfo.distanceKm > 0;
  const routeDistance = hasRouteInfo ? search.routeInfo!.distanceKm : 0;
  const routeDurationHours = hasRouteInfo && search.routeInfo!.durationMinutes
    ? Number((search.routeInfo!.durationMinutes / 60).toFixed(1))
    : 0;

  if (search.serviceType === 'local') {
    durationHours = search.durationHours || 8;
    const includedKm = durationHours * 10; // 10km allowance per package hour
    distanceKm = includedKm;
    durationFare = durationHours * vPricing.perHourFare;
    
    breakdown.push({
      label: `Local City Package (${durationHours} hrs / ${includedKm} km included)`,
      amount: Math.round(durationFare),
    });

    // Local Driver Allowance (Bata)
    const localAllowance = vPricing.localDriverAllowance || 0;
    if (localAllowance > 0) {
      durationFare += localAllowance;
      breakdown.push({
        label: `Local Driver Allowance (Bata)`,
        amount: Math.round(localAllowance),
      });
    }

    // Extra KM from explicit button selection or route distance exceeding included allowance
    const explicitExtraKm = (typeof search.extraKm === 'number' && search.extraKm > 0) ? search.extraKm : 0;
    const routeExtraKm = (hasRouteInfo && routeDistance > includedKm) ? (routeDistance - includedKm) : 0;
    const totalExtraKm = Math.max(explicitExtraKm, routeExtraKm);

    if (totalExtraKm > 0) {
      const rate = vPricing.localPerKmRate || vPricing.perKmFare;
      const extraKmCharge = Math.round(totalExtraKm * rate);
      distanceFare += extraKmCharge;
      distanceKm = includedKm + totalExtraKm;
      breakdown.push({
        label: `Extra KM (${totalExtraKm} km @ ₹${rate}/km)`,
        amount: extraKmCharge,
      });
    }
  } else if (search.serviceType === 'oneway') {
    if (hasRouteInfo) {
      distanceKm = routeDistance;
      durationHours = routeDurationHours || Math.round((distanceKm / 45) * 10) / 10;
    } else {
      const textLen = (search.pickupLocation?.length || 10) + (search.dropLocation?.length || 10);
      distanceKm = Math.max(30, Math.min(300, textLen * 4.5));
      durationHours = Math.round((distanceKm / 45) * 10) / 10;
    }
    
    const rate = vPricing.oneWayPerKmRate || vPricing.perKmFare;
    distanceFare = distanceKm * rate;
    breakdown.push({
      label: `One-Way Distance Charge (${distanceKm.toFixed(1)} km @ ₹${rate}/km)`,
      amount: Math.round(distanceFare),
    });

    // Extra KM / Detour Charge
    const explicitExtraKm = (typeof search.extraKm === 'number' && search.extraKm > 0) ? search.extraKm : 0;
    if (explicitExtraKm > 0) {
      const extraKmCharge = Math.round(explicitExtraKm * rate);
      distanceFare += extraKmCharge;
      distanceKm += explicitExtraKm;
      breakdown.push({
        label: `Extra KM / Detour (${explicitExtraKm} km @ ₹${rate}/km)`,
        amount: extraKmCharge,
      });
    }

    // One-Way Driver Allowance
    const oneWayAllowance = vPricing.oneWayDriverAllowance || 0;
    if (oneWayAllowance > 0) {
      durationFare += oneWayAllowance;
      breakdown.push({
        label: `One-Way Driver Allowance`,
        amount: Math.round(oneWayAllowance),
      });
    }
  } else if (search.serviceType === 'roundtrip') {
    // Multi-Day Round Trip Fare Engine
    const days = calculateRoundTripDays(search.travelDate, search.returnDate, search.roundTripDays);
    roundTripDays = days;
    
    // Minimum 300 km included per day rule across all vehicles
    const minDailyKm = vPricing.minKmPerDay || 300;
    includedMinKm = days * minDailyKm;

    const oneWayDist = hasRouteInfo
      ? routeDistance
      : Math.max(50, Math.min(250, ((search.pickupLocation?.length || 10) + (search.dropLocation?.length || 10)) * 3.5));
    const calculatedRoundTripKm = Math.round(oneWayDist * 2);
    
    // Distance billed is max of actual round trip distance and the included multi-day minimum
    distanceKm = Math.max(calculatedRoundTripKm, includedMinKm);
    durationHours = hasRouteInfo && routeDurationHours
      ? Number((routeDurationHours * 2).toFixed(1))
      : Math.round((distanceKm / 40) * 10) / 10;
    
    // Per km rate
    distanceFare = distanceKm * vPricing.perKmFare;
    
    const dayLabel = days === 1 ? '1 Day Booking' : `${days} Days Booking`;
    breakdown.push({
      label: `Round Trip (${dayLabel}: ${Number(distanceKm ?? 0).toLocaleString('en-IN')} km billed @ ₹${vPricing.perKmFare}/km - Min. ${Number(includedMinKm ?? 0).toLocaleString('en-IN')} km included)`,
      amount: Math.round(distanceFare),
    });
    
    // Multi-Day Driver Allowance (N days * daily allowance)
    const dailyAllowance = vPricing.driverAllowancePerDay || 300;
    const totalDriverAllowance = days * dailyAllowance;
    breakdown.push({
      label: `Driver Allowance (${days} Day${days > 1 ? 's' : ''} @ ₹${dailyAllowance}/day)`,
      amount: Math.round(totalDriverAllowance),
    });
    durationFare += totalDriverAllowance;
  } else if (search.serviceType === 'airport') {
    distanceKm = hasRouteInfo ? routeDistance : 40;
    durationHours = hasRouteInfo && routeDurationHours ? routeDurationHours : 1.2;
    
    // Determine airport rate based on route distance vs base rate
    const airportRatePerKm = vPricing.airportPerKmRate || vPricing.perKmFare;
    const calculatedAirportRate = Math.round(distanceKm * airportRatePerKm);
    const airportRate = Math.max(vPricing.airportBaseFare, calculatedAirportRate);
    airportSurcharge = airportRate;
    
    breakdown.push({
      label: `Airport Corridor Rate (${distanceKm.toFixed(1)} km @ ₹${airportRatePerKm}/km - ${search.airportTransferType === 'pickup' ? 'Pickup' : 'Drop'})`,
      amount: Math.round(airportRate),
    });

    // Extra KM / Detour Charge for Airport Transfers
    const explicitExtraKm = (typeof search.extraKm === 'number' && search.extraKm > 0) ? search.extraKm : 0;
    if (explicitExtraKm > 0) {
      const extraKmCharge = Math.round(explicitExtraKm * airportRatePerKm);
      distanceFare += extraKmCharge;
      distanceKm += explicitExtraKm;
      breakdown.push({
        label: `Extra KM / City Detour (${explicitExtraKm} km @ ₹${airportRatePerKm}/km)`,
        amount: extraKmCharge,
      });
    }

    // Airport Transfer Driver Allowance
    const airportAllowance = vPricing.airportDriverAllowance || 0;
    if (airportAllowance > 0) {
      durationFare += airportAllowance;
      breakdown.push({
        label: `Airport Chauffeur Allowance`,
        amount: Math.round(airportAllowance),
      });
    }
  }

  // Intermediate via-stops charge (if multiple stops are planned)
  const validStops = search.viaLocations ? search.viaLocations.filter((s) => s && s.trim().length > 0) : [];
  if (validStops.length > 0) {
    const stopCharge = validStops.length * (config.extraStopCharge || 150);
    durationFare += stopCharge;
    breakdown.push({
      label: `Intermediate Stops (${validStops.length} via stop${validStops.length > 1 ? 's' : ''})`,
      amount: stopCharge,
    });
  }

  // Extra passenger adjustment if exceeding standard capacity
  if (search.passengers > 4 && vehicle.seatingCapacity >= search.passengers) {
    const extraPax = search.passengers - 4;
    passengerSurcharge = extraPax * config.additionalPassengerCharge;
    breakdown.push({
      label: `Extra Passenger Surcharge (${extraPax} pax)`,
      amount: Math.round(passengerSurcharge),
    });
  }

  // Night hours check (if pickup time is between 22:00 and 06:00)
  if (search.pickupTime) {
    const hour = parseInt(search.pickupTime.split(':')[0], 10);
    if (!isNaN(hour) && (hour >= 22 || hour < 6)) {
      const nightPct = vPricing.nightChargePercentage || config.nightChargePercentage || 10;
      const subtotal = base + distanceFare + durationFare + airportSurcharge;
      const nightCharge = Math.round((subtotal * nightPct) / 100);
      breakdown.push({
        label: `Night Travel Surcharge (${nightPct}%)`,
        amount: nightCharge,
      });
      durationFare += nightCharge;
    }
  }

  const total = base + distanceFare + durationFare + airportSurcharge + passengerSurcharge;
  const roundedTotal = Math.round(total);

  return {
    estimatedDistanceKm: Math.round(distanceKm),
    estimatedDurationHours: durationHours,
    baseFareAmount: Math.round(base),
    distanceFareAmount: Math.round(distanceFare),
    durationFareAmount: Math.round(durationFare),
    passengerSurchargeAmount: Math.round(passengerSurcharge),
    airportSurchargeAmount: Math.round(airportSurcharge),
    totalEstimatedFare: roundedTotal,
    roundTripDays,
    includedMinKm,
    breakdown,
  };
}
