import { PricingConfig, VehiclePricingConfig, Vehicle, BookingSearchState, FareEstimate } from '../types';

export const FARE_DISCLAIMER =
  'Final fare may vary based on actual route, waiting time, additional stops, and applicable charges.';

/**
 * Centrally configurable pricing engine configuration for TRAVEL JUST.
 * Administrators can easily adjust base fare, per-kilometer fare, per-hour fare,
 * airport surcharge, waiting charge, additional passenger charge, night charge,
 * and extra stop charge.
 */
export const pricingConfig: PricingConfig & {
  waitingCharge: number;
  nightCharge: number;
  disclaimer: string;
} = {
  currencySymbol: '₹',
  currencyCode: 'INR',

  // 1. Base starting fare
  baseFare: 300,

  // 2. Per-kilometer standard fare
  perKmFare: 13.0,

  // 3. Per-hour package / waiting fare
  perHourFare: 150,

  // 4. Airport transfer surcharge
  airportSurcharge: 100,

  // 5. Waiting charge per hour
  waitingCharge: 100,
  waitingChargePerHour: 100,

  // 6. Additional passenger charge (for passengers above standard capacity)
  additionalPassengerCharge: 50,

  // 7. Night surcharge (applied for pickups between 10:00 PM and 6:00 AM)
  nightCharge: 150,
  nightChargePercentage: 10,

  // 8. Extra stop charge per intermediate via point
  extraStopCharge: 100,

  // Standard GST percentage
  gstPercentage: 5,

  // Canonical fare disclaimer
  disclaimer: FARE_DISCLAIMER,

  // Per-vehicle tier configurations
  vehiclePricing: {
    'sedan-4-1': {
      vehicleId: 'sedan-4-1',
      baseFare: 599,
      localPerKmRate: 12.0,
      localDriverAllowance: 399,
      oneWayPerKmRate: 13.0,
      oneWayDriverAllowance: 300,
      airportPerKmRate: 13.0,
      airportDriverAllowance: 250,
      perKmFare: 12.0,
      perHourFare: 150,
      driverAllowancePerDay: 399,
      airportBaseFare: 699,
      minKmPerDay: 300,
      nightChargePercentage: 10,
    },
    'suv-6-1': {
      vehicleId: 'suv-6-1',
      baseFare: 799,
      localPerKmRate: 14.0,
      localDriverAllowance: 499,
      oneWayPerKmRate: 16.5,
      oneWayDriverAllowance: 350,
      airportPerKmRate: 16.0,
      airportDriverAllowance: 300,
      perKmFare: 14.0,
      perHourFare: 180,
      driverAllowancePerDay: 499,
      airportBaseFare: 999,
      minKmPerDay: 300,
      nightChargePercentage: 10,
    },
    'innova': {
      vehicleId: 'innova',
      baseFare: 999,
      localPerKmRate: 20.0,
      localDriverAllowance: 499,
      oneWayPerKmRate: 20.0,
      oneWayDriverAllowance: 450,
      airportPerKmRate: 20.0,
      airportDriverAllowance: 350,
      perKmFare: 20.0,
      perHourFare: 220,
      driverAllowancePerDay: 499,
      airportBaseFare: 1199,
      minKmPerDay: 300,
      nightChargePercentage: 15,
    },
    'innova-crysta': {
      vehicleId: 'innova-crysta',
      baseFare: 1199,
      localPerKmRate: 22.0,
      localDriverAllowance: 499,
      oneWayPerKmRate: 24.0,
      oneWayDriverAllowance: 500,
      airportPerKmRate: 24.0,
      airportDriverAllowance: 400,
      perKmFare: 22.0,
      perHourFare: 250,
      driverAllowancePerDay: 499,
      airportBaseFare: 1599,
      minKmPerDay: 300,
      nightChargePercentage: 15,
    },
    'tempo-traveller-12-1': {
      vehicleId: 'tempo-traveller-12-1',
      baseFare: 1800,
      localPerKmRate: 33.0,
      localDriverAllowance: 799,
      oneWayPerKmRate: 33.0,
      oneWayDriverAllowance: 700,
      airportPerKmRate: 30.0,
      airportDriverAllowance: 500,
      perKmFare: 33.0,
      perHourFare: 350,
      driverAllowancePerDay: 799,
      airportBaseFare: 2499,
      minKmPerDay: 300,
      nightChargePercentage: 15,
    },
  },
};

export const defaultPricingConfig = pricingConfig;

/**
 * Retrieves the stored pricing configuration from localStorage with defaults fallback.
 */
export function getStoredPricingConfig(): typeof pricingConfig {
  try {
    const raw = typeof window !== 'undefined' ? localStorage.getItem('tj_pricing_config') : null;
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        ...pricingConfig,
        ...parsed,
        vehiclePricing: {
          ...pricingConfig.vehiclePricing,
          ...(parsed.vehiclePricing || {}),
        },
      };
    }
  } catch (e) {
    console.warn('Error reading stored pricing config:', e);
  }
  return pricingConfig;
}

/**
 * Updates the stored pricing configuration in localStorage and dispatches an update event.
 */
export function updateStoredPricingConfig(updates: Partial<typeof pricingConfig>): typeof pricingConfig {
  const current = getStoredPricingConfig();
  const next = {
    ...current,
    ...updates,
    vehiclePricing: {
      ...current.vehiclePricing,
      ...(updates.vehiclePricing || {}),
    },
  };
  if (typeof window !== 'undefined') {
    localStorage.setItem('tj_pricing_config', JSON.stringify(next));
    window.dispatchEvent(new CustomEvent('tj:pricing-config-updated', { detail: next }));
  }
  return next;
}

/**
 * Resets the stored pricing configuration back to default values.
 */
export function resetStoredPricingConfig(): typeof pricingConfig {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('tj_pricing_config');
    window.dispatchEvent(new CustomEvent('tj:pricing-config-updated', { detail: pricingConfig }));
  }
  return pricingConfig;
}

export interface CalculateEstimatedFareOptions {
  serviceType: 'local' | 'oneway' | 'roundtrip' | 'airport' | string;
  vehicleType: string | Vehicle;
  distance?: number;
  distanceKm?: number;
  duration?: number;
  durationHours?: number;
  durationMinutes?: number;
  passengerCount?: number;
  passengers?: number;
  waitingHours?: number;
  extraStopsCount?: number;
  viaLocations?: string[];
  isNightTrip?: boolean;
  pickupTime?: string;
  pickupDate?: string;
  travelDate?: string;
  returnDate?: string;
  roundTripDays?: number;
  config?: PricingConfig;
}

/**
 * Checks if a pickup time string (e.g. "11:30 PM", "23:30", "04:00 AM")
 * falls during night hours (10:00 PM to 6:00 AM).
 */
export function isNightHours(pickupTime?: string): boolean {
  if (!pickupTime) return false;
  try {
    const timeLower = pickupTime.toLowerCase().trim();
    const isPM = timeLower.includes('pm');
    const isAM = timeLower.includes('am');
    const cleaned = timeLower.replace(/[apm\s]/g, '');
    const parts = cleaned.split(':');
    let hours = parseInt(parts[0], 10);
    if (isNaN(hours)) return false;

    if (isPM && hours < 12) hours += 12;
    if (isAM && hours === 12) hours = 0;

    // Night window: 22:00 (10 PM) to 06:00 (6 AM)
    return hours >= 22 || hours < 6;
  } catch {
    return false;
  }
}

/**
 * Calculates the Estimated Fare based on the configurable pricing engine.
 * Considers service type, vehicle type, distance, duration, passenger count,
 * waiting time, extra stops, and night travel surcharge.
 */
export function calculateEstimatedFare(
  input: CalculateEstimatedFareOptions | string | BookingSearchState,
  vehicleArg?: string | Vehicle,
  distanceArg?: number,
  durationArg?: number,
  passengerCountArg?: number,
  configArg?: PricingConfig
): FareEstimate {
  let serviceType = 'oneway';
  let vehicleId = 'sedan-4-1';
  let vehicleObj: Vehicle | undefined;
  let distanceKm = 0;
  let durationHours = 1;
  let passengerCount = 1;
  let waitingHours = 0;
  let extraStopsCount = 0;
  let isNight = false;
  let pickupTimeStr = '';
  let roundTripDays = 1;
  let activeConfig: PricingConfig = configArg || pricingConfig;

  // Case 1: First argument is options object
  if (typeof input === 'object' && input !== null) {
    // If passed a BookingSearchState
    if ('serviceType' in input && vehicleArg && typeof vehicleArg === 'object' && 'id' in vehicleArg) {
      const search = input as BookingSearchState;
      vehicleObj = vehicleArg as Vehicle;
      vehicleId = vehicleObj.id;
      serviceType = search.serviceType || 'oneway';
      distanceKm = search.routeInfo?.distanceKm ?? search.distanceKm ?? 0;
      durationHours =
        (search.routeInfo?.durationMinutes ? search.routeInfo.durationMinutes / 60 : undefined) ??
        search.durationHours ??
        1;
      passengerCount = search.passengers || 1;
      pickupTimeStr = search.pickupTime || '';
      isNight = isNightHours(pickupTimeStr);
      extraStopsCount = search.viaLocations?.filter((l) => l && l.trim().length > 0).length ||
        search.stops?.length ||
        0;
      if (configArg) activeConfig = configArg;
    } else {
      const opts = input as CalculateEstimatedFareOptions;
      serviceType = opts.serviceType || 'oneway';
      if (typeof opts.vehicleType === 'object' && opts.vehicleType !== null) {
        vehicleObj = opts.vehicleType as Vehicle;
        vehicleId = vehicleObj.id;
      } else if (typeof opts.vehicleType === 'string') {
        vehicleId = opts.vehicleType;
      }
      distanceKm = opts.distance ?? opts.distanceKm ?? 0;
      if (opts.duration !== undefined) {
        durationHours = opts.duration > 24 ? opts.duration / 60 : opts.duration;
      } else if (opts.durationHours !== undefined) {
        durationHours = opts.durationHours;
      } else if (opts.durationMinutes !== undefined) {
        durationHours = opts.durationMinutes / 60;
      }
      passengerCount = opts.passengerCount ?? opts.passengers ?? 1;
      waitingHours = opts.waitingHours ?? 0;
      extraStopsCount = opts.extraStopsCount ?? (opts.viaLocations ? opts.viaLocations.filter((s) => s && s.trim().length > 0).length : 0);
      pickupTimeStr = opts.pickupTime || '';
      isNight = opts.isNightTrip ?? isNightHours(pickupTimeStr);
      roundTripDays = opts.roundTripDays ?? 1;
      if (opts.config) activeConfig = opts.config;
    }
  } else if (typeof input === 'string') {
    // Case 2: Positional arguments
    serviceType = input;
    if (typeof vehicleArg === 'object' && vehicleArg !== null) {
      vehicleObj = vehicleArg as Vehicle;
      vehicleId = vehicleObj.id;
    } else if (typeof vehicleArg === 'string') {
      vehicleId = vehicleArg;
    }
    distanceKm = distanceArg || 0;
    durationHours = durationArg !== undefined ? (durationArg > 24 ? durationArg / 60 : durationArg) : 1;
    passengerCount = passengerCountArg || 1;
    if (configArg) activeConfig = configArg;
  }

  // Fallback defaults
  if (distanceKm <= 0 && serviceType === 'local') {
    distanceKm = Math.max(40, (durationHours || 4) * 10);
  } else if (distanceKm <= 0) {
    distanceKm = 50;
  }
  if (durationHours <= 0) durationHours = 1;

  // Retrieve vehicle pricing or factor
  const vConfig: VehiclePricingConfig | undefined = activeConfig.vehiclePricing?.[vehicleId];
  const standardSeating = vehicleObj?.seatingCapacity || (vehicleId.includes('tempo') ? 12 : vehicleId.includes('innova') ? 7 : vehicleId.includes('suv') ? 6 : 4);
  const baseMultiplier = vehicleObj?.basePriceFactor || (vehicleId.includes('tempo') ? 2.2 : vehicleId.includes('innova-crysta') ? 1.7 : vehicleId.includes('innova') ? 1.5 : vehicleId.includes('suv') ? 1.25 : 1.0);

  // 1. Base Fare
  let baseFareAmount = vConfig?.baseFare ?? Math.round(activeConfig.baseFare * baseMultiplier);

  // 2. Per-km Fare
  let perKmRate = activeConfig.perKmFare;
  if (serviceType === 'local' && vConfig?.localPerKmRate) {
    perKmRate = vConfig.localPerKmRate;
  } else if (serviceType === 'oneway' && vConfig?.oneWayPerKmRate) {
    perKmRate = vConfig.oneWayPerKmRate;
  } else if (serviceType === 'airport' && vConfig?.airportPerKmRate) {
    perKmRate = vConfig.airportPerKmRate;
  } else if (vConfig?.perKmFare) {
    perKmRate = vConfig.perKmFare;
  } else {
    perKmRate = Math.round(activeConfig.perKmFare * baseMultiplier * 10) / 10;
  }

  // 3. Distance Fare calculation
  let distanceFareAmount = Math.round(distanceKm * perKmRate);

  // 4. Per-hour / duration fare calculation
  let perHourRate = vConfig?.perHourFare ?? Math.round(activeConfig.perHourFare * baseMultiplier);
  let durationFareAmount = 0;
  let driverAllowanceAmount = 0;

  if (serviceType === 'local') {
    durationFareAmount = Math.round(durationHours * perHourRate);
    driverAllowanceAmount = vConfig?.localDriverAllowance || 300;
  } else if (serviceType === 'roundtrip') {
    driverAllowanceAmount = (vConfig?.driverAllowancePerDay || 400) * Math.max(1, roundTripDays);
    // Standard minimum billable distance for outstation round trip (e.g. 300km/day)
    const minBillableKm = (vConfig?.minKmPerDay || 300) * Math.max(1, roundTripDays);
    if (distanceKm < minBillableKm) {
      distanceFareAmount = Math.round(minBillableKm * perKmRate);
    }
  } else if (serviceType === 'oneway') {
    driverAllowanceAmount = vConfig?.oneWayDriverAllowance || 300;
  } else if (serviceType === 'airport') {
    driverAllowanceAmount = vConfig?.airportDriverAllowance || 250;
    if (vConfig?.airportBaseFare) {
      baseFareAmount = vConfig.airportBaseFare;
    }
  }

  // 5. Airport Surcharge
  let airportSurchargeAmount = 0;
  if (serviceType === 'airport') {
    airportSurchargeAmount = activeConfig.airportSurcharge || 100;
  }

  // 6. Waiting Charge
  const waitingRate = (activeConfig as any).waitingCharge ?? activeConfig.waitingChargePerHour ?? 100;
  const waitingChargeAmount = Math.round(Math.max(0, waitingHours) * waitingRate);

  // 7. Additional Passenger Charge
  const extraPassengers = Math.max(0, passengerCount - standardSeating);
  const passengerSurchargeAmount = extraPassengers * (activeConfig.additionalPassengerCharge || 50);

  // 8. Night Surcharge
  let nightChargeAmount = 0;
  if (isNight) {
    const flatNight = (activeConfig as any).nightCharge;
    const nightPct = vConfig?.nightChargePercentage || activeConfig.nightChargePercentage || 10;
    if (flatNight && flatNight > 0) {
      nightChargeAmount = flatNight;
    } else {
      nightChargeAmount = Math.round((baseFareAmount + distanceFareAmount) * (nightPct / 100));
    }
  }

  // 9. Extra Stop Charge
  const extraStopChargeAmount = Math.max(0, extraStopsCount) * (activeConfig.extraStopCharge || 100);

  // Subtotal before discounts
  const subtotal =
    baseFareAmount +
    distanceFareAmount +
    durationFareAmount +
    driverAllowanceAmount +
    airportSurchargeAmount +
    waitingChargeAmount +
    passengerSurchargeAmount +
    nightChargeAmount +
    extraStopChargeAmount;

  // Local 12h / 120km promotional package (15% discount)
  const isLocal12Hours = serviceType === 'local' && Math.round(durationHours) === 12;
  const discountPercentage = isLocal12Hours ? 15 : undefined;
  const discountAmount = isLocal12Hours ? Math.round(subtotal * 0.15) : undefined;
  const totalEstimatedFare = discountAmount ? subtotal - discountAmount : subtotal;

  // Itemized breakdown
  const breakdown: { label: string; amount: number }[] = [
    { label: 'Base Starting Fare', amount: baseFareAmount },
    { label: `Distance Fare (${Math.round(distanceKm)} km @ ${activeConfig.currencySymbol}${perKmRate}/km)`, amount: distanceFareAmount },
  ];

  if (durationFareAmount > 0) {
    breakdown.push({ label: `Hourly Duration Fare (${Math.round(durationHours)} hrs)`, amount: durationFareAmount });
  }
  if (driverAllowanceAmount > 0) {
    breakdown.push({ label: 'Chauffeur Allowance', amount: driverAllowanceAmount });
  }
  if (airportSurchargeAmount > 0) {
    breakdown.push({ label: 'Airport Zone Surcharge', amount: airportSurchargeAmount });
  }
  if (waitingChargeAmount > 0) {
    breakdown.push({ label: `Waiting Charge (${waitingHours} hrs)`, amount: waitingChargeAmount });
  }
  if (passengerSurchargeAmount > 0) {
    breakdown.push({ label: `Extra Passenger Surcharge (${extraPassengers} pax)`, amount: passengerSurchargeAmount });
  }
  if (nightChargeAmount > 0) {
    breakdown.push({ label: 'Night Travel Surcharge (10:00 PM - 06:00 AM)', amount: nightChargeAmount });
  }
  if (extraStopChargeAmount > 0) {
    breakdown.push({ label: `Intermediate Via Stops (${extraStopsCount} stops)`, amount: extraStopChargeAmount });
  }
  if (discountAmount && discountAmount > 0) {
    breakdown.push({ label: '15% Package Discount (12 Hrs / 120 Km)', amount: -discountAmount });
  }

  return {
    estimatedDistanceKm: Math.round(distanceKm),
    exactDistanceKm: distanceKm,
    estimatedDurationHours: Math.round(durationHours * 10) / 10,
    baseFareAmount,
    distanceFareAmount,
    durationFareAmount,
    driverAllowanceAmount,
    airportSurchargeAmount,
    waitingChargeAmount,
    passengerSurchargeAmount,
    nightChargeAmount,
    extraStopChargeAmount,
    totalEstimatedFare: Math.round(totalEstimatedFare),
    originalFare: discountAmount ? subtotal : undefined,
    discountPercentage,
    discountAmount,
    discountLabel: isLocal12Hours ? '15% Off (12 Hrs Package)' : undefined,
    roundTripDays: serviceType === 'roundtrip' ? roundTripDays : undefined,
    isValid: true,
    breakdown,
    disclaimer: FARE_DISCLAIMER,
    pricingVersion: 1,
    pricingModel: 'CONFIGURABLE_PRICING_ENGINE' as any,
  };
}
