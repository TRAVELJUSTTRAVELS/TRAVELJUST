import {
  AirportPricing,
  CentralizedFareConfig,
  DiscountType,
  FareBreakdownLine,
  FareCalculationResult,
  FareVehicleId,
  InterStateOneWayPricing,
  LocalPricing,
  OneWayCorridorId,
  OneWayFixedCorridorConfig,
  OneWayPricing,
  RoundTripPricing,
  ServiceTypeCategory,
  VehicleMetaInfo,
  FARE_VEHICLES_META,
} from '../types/fareEngine';

export const DEFAULT_ONE_WAY_FIXED_CORRIDORS: Record<OneWayCorridorId, OneWayFixedCorridorConfig> = {
  MYSURU_KIA_AIRPORT: {
    id: 'MYSURU_KIA_AIRPORT',
    corridorName: 'Mysuru ⇄ Kempegowda International Airport (Terminal 1 / Terminal 2)',
    fromLocation: 'Mysuru / Mysore',
    toLocation: 'Kempegowda International Airport (Terminal 1 / Terminal 2)',
    referenceDistanceKm: 182,
    distanceLabel: 'Approximately 182 km',
    durationHours: 3.5,
    rates: {
      'sedan-4-1': 2899,
      'suv-6-1': 3910,
      'innova': 4299,
      'innova-crysta': 4610,
      'tempo-traveller-12-1': 6999,
    },
    active: true,
    bidirectional: true,
  },
  MYSURU_BENGALURU_CITY: {
    id: 'MYSURU_BENGALURU_CITY',
    corridorName: 'Mysuru ⇄ Bengaluru City (~149 km limit)',
    fromLocation: 'Mysuru / Mysore',
    toLocation: 'Bengaluru City / Bangalore City',
    referenceDistanceKm: 149,
    distanceLabel: 'Approximately 149 km',
    durationHours: 2.5,
    rates: {
      'sedan-4-1': 2599,
      'suv-6-1': 3519,
      'innova': 3799,
      'innova-crysta': 4119,
      'tempo-traveller-12-1': 5999,
    },
    active: true,
    bidirectional: true,
  },
};

/**
 * Standard Centralized Baseline Configuration for TRAVEL JUST
 */
export const DEFAULT_CENTRALIZED_FARE_CONFIG: CentralizedFareConfig = {
  version: 3,
  updatedAt: new Date().toISOString(),
  updatedBy: 'TRAVEL JUST System Initializer',
  local: {
    'sedan-4-1': {
      baseFare: 599,
      driverAllowance: 399,
      perKmRate: 12,
      perHourRate: 50,
      extraPerKmRate: 14,
      extraPerHourRate: 150,
      includedKm: 80,
      includedHours: 8,
      discountType: 'NONE',
      discountValue: 0,
    },
    'suv-6-1': {
      baseFare: 599,
      driverAllowance: 499,
      perKmRate: 14,
      perHourRate: 75,
      extraPerKmRate: 156,
      extraPerHourRate: 175,
      includedKm: 80,
      includedHours: 8,
      discountType: 'NONE',
      discountValue: 0,
    },
    'innova': {
      baseFare: 599,
      driverAllowance: 499,
      perKmRate: 16,
      perHourRate: 85,
      extraPerKmRate: 18,
      extraPerHourRate: 175,
      includedKm: 80,
      includedHours: 8,
      discountType: 'NONE',
      discountValue: 0,
    },
    'innova-crysta': {
      baseFare: 599,
      driverAllowance: 499,
      perKmRate: 18,
      perHourRate: 95,
      extraPerKmRate: 19,
      extraPerHourRate: 180,
      includedKm: 80,
      includedHours: 8,
      discountType: 'NONE',
      discountValue: 0,
    },
    'tempo-traveller-12-1': {
      baseFare: 1200,
      driverAllowance: 799,
      perKmRate: 39,
      perHourRate: 120,
      extraPerKmRate: 30,
      extraPerHourRate: 400,
      includedKm: 80,
      includedHours: 8,
      discountType: 'NONE',
      discountValue: 0,
    },
  },
  oneWay: {
    'sedan-4-1': {
      baseFare: 500,
      driverAllowance: 300,
      perKmRate: 13,
      extraPerKmRate: 13,
      includedKm: 0,
      minBillableKm: 0,
      discountType: 'NONE',
      discountValue: 0,
    },
    'suv-6-1': {
      baseFare: 700,
      driverAllowance: 350,
      perKmRate: 18,
      extraPerKmRate: 16,
      includedKm: 0,
      minBillableKm: 0,
      discountType: 'NONE',
      discountValue: 0,
    },
    'innova': {
      baseFare: 700,
      driverAllowance: 400,
      perKmRate: 18,
      extraPerKmRate: 15,
      includedKm: 0,
      minBillableKm: 0,
      discountType: 'NONE',
      discountValue: 0,
    },
    'innova-crysta': {
      baseFare: 800,
      driverAllowance: 450,
      perKmRate: 20,
      extraPerKmRate: 17,
      includedKm: 0,
      minBillableKm: 0,
      discountType: 'NONE',
      discountValue: 0,
    },
    'tempo-traveller-12-1': {
      baseFare: 1200,
      driverAllowance: 700,
      perKmRate: 30,
      extraPerKmRate: 25,
      includedKm: 0,
      minBillableKm: 0,
      discountType: 'NONE',
      discountValue: 0,
    },
  },
  roundTrip: {
    'sedan-4-1': {
      driverAllowance: 300,
      perKmRate: 13,
      extraPerKmRate: 13,
      dailyMinimumKm: 300,
      discountType: 'NONE',
      discountValue: 0,
    },
    'suv-6-1': {
      driverAllowance: 350,
      perKmRate: 16,
      extraPerKmRate: 16,
      dailyMinimumKm: 300,
      discountType: 'NONE',
      discountValue: 0,
    },
    'innova': {
      driverAllowance: 400,
      perKmRate: 17.5,
      extraPerKmRate: 17.5,
      dailyMinimumKm: 300,
      discountType: 'NONE',
      discountValue: 0,
    },
    'innova-crysta': {
      driverAllowance: 450,
      perKmRate: 19,
      extraPerKmRate: 19,
      dailyMinimumKm: 300,
      discountType: 'NONE',
      discountValue: 0,
    },
    'tempo-traveller-12-1': {
      driverAllowance: 700,
      perKmRate: 28,
      extraPerKmRate: 28,
      dailyMinimumKm: 300,
      discountType: 'NONE',
      discountValue: 0,
    },
  },
  airport: {
    'sedan-4-1': {
      baseFare: 699,
      driverAllowance: 250,
      perKmRate: 13,
      extraPerKmRate: 13,
      discountType: 'NONE',
      discountValue: 0,
    },
    'suv-6-1': {
      baseFare: 999,
      driverAllowance: 350,
      perKmRate: 18,
      extraPerKmRate: 16,
      discountType: 'NONE',
      discountValue: 0,
    },
    'innova': {
      baseFare: 1199,
      driverAllowance: 400,
      perKmRate: 18,
      extraPerKmRate: 15,
      discountType: 'NONE',
      discountValue: 0,
    },
    'innova-crysta': {
      baseFare: 1499,
      driverAllowance: 450,
      perKmRate: 20,
      extraPerKmRate: 17,
      discountType: 'NONE',
      discountValue: 0,
    },
    'tempo-traveller-12-1': {
      baseFare: 2499,
      driverAllowance: 600,
      perKmRate: 30,
      extraPerKmRate: 26,
      discountType: 'NONE',
      discountValue: 0,
    },
  },
  interStateOneWay: {
    'sedan-4-1': {
      baseFare: 500,
      driverAllowance: 350,
      perKmRate: 14.5,
      extraPerKmRate: 14.5,
      minimumBillableKm: 149,
      includedKm: 0,
      tollCharges: 150,
      parkingCharges: 0,
      permitStateTaxCharges: 600,
      stateEntryCharges: 150,
      otherCharges: 0,
      includeTolls: true,
      includePermit: true,
      includeStateEntry: true,
      includeOtherCharges: false,
      discountType: 'NONE',
      discountValue: 0,
      gstPercentage: 5,
      active: true,
    },
    'suv-6-1': {
      baseFare: 700,
      driverAllowance: 400,
      perKmRate: 19,
      extraPerKmRate: 18,
      minimumBillableKm: 149,
      includedKm: 0,
      tollCharges: 200,
      parkingCharges: 0,
      permitStateTaxCharges: 800,
      stateEntryCharges: 200,
      otherCharges: 0,
      includeTolls: true,
      includePermit: true,
      includeStateEntry: true,
      includeOtherCharges: false,
      discountType: 'NONE',
      discountValue: 0,
      gstPercentage: 5,
      active: true,
    },
    'innova': {
      baseFare: 800,
      driverAllowance: 450,
      perKmRate: 20,
      extraPerKmRate: 19,
      minimumBillableKm: 149,
      includedKm: 0,
      tollCharges: 250,
      parkingCharges: 0,
      permitStateTaxCharges: 900,
      stateEntryCharges: 250,
      otherCharges: 0,
      includeTolls: true,
      includePermit: true,
      includeStateEntry: true,
      includeOtherCharges: false,
      discountType: 'NONE',
      discountValue: 0,
      gstPercentage: 5,
      active: true,
    },
    'innova-crysta': {
      baseFare: 1000,
      driverAllowance: 500,
      perKmRate: 22,
      extraPerKmRate: 21,
      minimumBillableKm: 149,
      includedKm: 0,
      tollCharges: 300,
      parkingCharges: 0,
      permitStateTaxCharges: 1100,
      stateEntryCharges: 300,
      otherCharges: 0,
      includeTolls: true,
      includePermit: true,
      includeStateEntry: true,
      includeOtherCharges: false,
      discountType: 'NONE',
      discountValue: 0,
      gstPercentage: 5,
      active: true,
    },
    'tempo-traveller-12-1': {
      baseFare: 1500,
      driverAllowance: 800,
      perKmRate: 32,
      extraPerKmRate: 30,
      minimumBillableKm: 149,
      includedKm: 0,
      tollCharges: 450,
      parkingCharges: 0,
      permitStateTaxCharges: 1600,
      stateEntryCharges: 400,
      otherCharges: 0,
      includeTolls: true,
      includePermit: true,
      includeStateEntry: true,
      includeOtherCharges: false,
      discountType: 'NONE',
      discountValue: 0,
      gstPercentage: 5,
      active: true,
    },
  },
  fixedCorridors: DEFAULT_ONE_WAY_FIXED_CORRIDORS,
};

/**
 * 23. Fare Calculation Engine Architecture
 * Helper functions
 */

export function calculateExtraKm(actualKm: number, includedKm: number): number {
  if (!includedKm || includedKm <= 0) return 0;
  return Math.max(0, Number((actualKm - includedKm).toFixed(2)));
}

export function calculateExtraHours(actualHours: number, includedHours: number): number {
  if (!includedHours || includedHours <= 0) return 0;
  return Math.max(0, Number((actualHours - includedHours).toFixed(2)));
}

export function calculateDiscount(
  subtotal: number,
  discountType: DiscountType,
  discountValue: number
): number {
  if (!discountValue || discountValue <= 0 || discountType === 'NONE') {
    return 0;
  }
  if (discountType === 'PERCENTAGE') {
    return Math.round(subtotal * (discountValue / 100));
  }
  if (discountType === 'FIXED') {
    return Math.min(subtotal, Math.round(discountValue));
  }
  return 0;
}

export function calculateFinalFare(subtotal: number, discount: number): number {
  return Math.max(0, Math.round(subtotal - discount));
}

export function getVehicleMeta(vehicleId: string): VehicleMetaInfo {
  const normId =
    vehicleId === 'ertiga' || vehicleId === 'suv'
      ? 'suv-6-1'
      : vehicleId === 'toyota-etios' || vehicleId === 'swift-desire'
      ? 'sedan-4-1'
      : vehicleId === 'tempo-traveller' || vehicleId === 'tempo-traveller-14-1'
      ? 'tempo-traveller-12-1'
      : vehicleId === 'innova-6-1' || vehicleId === 'innova-7-1'
      ? 'innova'
      : vehicleId;

  const found = FARE_VEHICLES_META.find((v) => v.id === normId);
  return found || FARE_VEHICLES_META[0];
}

/**
 * 4. LOCAL FARE CALCULATION
 * LOCAL TOTAL = Base Fare + Driver Allowance + KM Charge + Hour Charge + Extra KM Charge + Extra Hour Charge - Discount
 * Where:
 * KM Charge = Applicable KM * Per KM Rate
 * Hour Charge = Applicable Hours * Per Hour Rate
 * Extra charges only apply when configured included KM/hour limits are exceeded.
 */
export function calculateLocalFare(
  pricing: LocalPricing,
  distanceKm: number,
  hours: number,
  vehicleMeta?: VehicleMetaInfo
): FareCalculationResult {
  const meta = vehicleMeta || FARE_VEHICLES_META[0];
  const safeDistance = Math.max(0, Number(distanceKm.toFixed(2)));
  const safeHours = Math.max(0, Number(hours.toFixed(2)));

  const baseFare = Math.max(0, pricing.baseFare || 0);
  const driverAllowance = Math.max(0, pricing.driverAllowance || 0);

  const includedKm = pricing.includedKm || 80;
  const includedHours = pricing.includedHours || 8;

  // Normal applicable KM and Hours (up to included limit, or actual if no limit)
  const applicableKm = includedKm > 0 ? Math.min(safeDistance, includedKm) : safeDistance;
  const applicableHours = includedHours > 0 ? Math.min(safeHours, includedHours) : safeHours;

  const kmCharge = Math.round(applicableKm * (pricing.perKmRate || 0));
  const hourCharge = Math.round(applicableHours * (pricing.perHourRate || 0));

  // Extra charges only apply when configured included limits are exceeded
  const extraKm = calculateExtraKm(safeDistance, includedKm);
  const extraHours = calculateExtraHours(safeHours, includedHours);

  const extraKmCharge = Math.round(extraKm * (pricing.extraPerKmRate || 0));
  const extraHourCharge = Math.round(extraHours * (pricing.extraPerHourRate || 0));

  const originalFare =
    baseFare + driverAllowance + kmCharge + hourCharge + extraKmCharge + extraHourCharge;

  const discountAmount = calculateDiscount(
    originalFare,
    pricing.discountType,
    pricing.discountValue
  );
  const finalFare = calculateFinalFare(originalFare, discountAmount);

  const breakdown: FareBreakdownLine[] = [
    { label: 'Base Package Fare', amount: baseFare, type: 'base' },
    { label: 'Driver Allowance', amount: driverAllowance, type: 'driver' },
    {
      label: `KM Charge (${applicableKm} km @ ₹${pricing.perKmRate}/km)`,
      amount: kmCharge,
      type: 'km',
    },
    {
      label: `Hour Charge (${applicableHours} hrs @ ₹${pricing.perHourRate}/hr)`,
      amount: hourCharge,
      type: 'hour',
    },
  ];

  if (extraKm > 0 && extraKmCharge > 0) {
    breakdown.push({
      label: `Extra KM Charge (${extraKm} km @ ₹${pricing.extraPerKmRate}/km)`,
      amount: extraKmCharge,
      type: 'extra_km',
    });
  }

  if (extraHours > 0 && extraHourCharge > 0) {
    breakdown.push({
      label: `Extra Hours Charge (${extraHours} hrs @ ₹${pricing.extraPerHourRate}/hr)`,
      amount: extraHourCharge,
      type: 'extra_hour',
    });
  }

  if (discountAmount > 0) {
    const discountLabel =
      pricing.discountType === 'PERCENTAGE'
        ? `${pricing.discountValue}% Promotional Discount`
        : `₹${pricing.discountValue} Discount`;
    breakdown.push({
      label: discountLabel,
      amount: -discountAmount,
      type: 'discount',
    });
  }

  return {
    serviceType: 'LOCAL',
    vehicleId: meta.id,
    vehicleName: meta.name,
    distanceKm: safeDistance,
    durationHours: safeHours,
    baseFare,
    driverAllowance,
    kmCharge,
    extraKmCharge,
    hourCharge,
    extraHourCharge,
    originalFare,
    discountAmount,
    discountLabel:
      discountAmount > 0
        ? pricing.discountType === 'PERCENTAGE'
          ? `${pricing.discountValue}% Off`
          : `₹${pricing.discountValue} Off`
        : undefined,
    finalFare,
    breakdown,
  };
}

/**
 * 6. ONE-WAY FARE CALCULATION
 * ONE-WAY TOTAL = Base Fare + Driver Allowance + (Distance * Per KM Rate) + Applicable Extra KM Charges - Discount
 */
export function calculateOneWayFare(
  pricing: OneWayPricing,
  distanceKm: number,
  vehicleMeta?: VehicleMetaInfo
): FareCalculationResult {
  const meta = vehicleMeta || FARE_VEHICLES_META[0];
  const safeDistance = Math.max(0, Number(distanceKm.toFixed(2)));
  const minBillableKm = pricing.minBillableKm && pricing.minBillableKm > 0 ? pricing.minBillableKm : 0;
  const billableDistance = minBillableKm > 0 ? Math.max(safeDistance, minBillableKm) : safeDistance;

  const baseFare = Math.max(0, pricing.baseFare || 0);
  const driverAllowance = Math.max(0, pricing.driverAllowance || 0);

  let kmCharge = 0;
  let extraKmCharge = 0;

  if (pricing.includedKm && pricing.includedKm > 0) {
    const applicableKm = Math.min(billableDistance, pricing.includedKm);
    kmCharge = Math.round(applicableKm * (pricing.perKmRate || 0));
    const extraKm = calculateExtraKm(billableDistance, pricing.includedKm);
    extraKmCharge = Math.round(extraKm * (pricing.extraPerKmRate || pricing.perKmRate || 0));
  } else {
    kmCharge = Math.round(billableDistance * (pricing.perKmRate || 0));
    extraKmCharge = 0;
  }

  const originalFare = baseFare + driverAllowance + kmCharge + extraKmCharge;

  const discountAmount = calculateDiscount(
    originalFare,
    pricing.discountType,
    pricing.discountValue
  );
  const finalFare = calculateFinalFare(originalFare, discountAmount);

  const breakdown: FareBreakdownLine[] = [
    { label: 'Base Fare', amount: baseFare, type: 'base' },
    { label: 'Driver Allowance', amount: driverAllowance, type: 'driver' },
    {
      label:
        minBillableKm > 0 && safeDistance < minBillableKm
          ? `Distance Charge (${billableDistance} km billable [Min ${minBillableKm} km] @ ₹${pricing.perKmRate}/km)`
          : `Distance Charge (${billableDistance} km @ ₹${pricing.perKmRate}/km)`,
      amount: kmCharge,
      type: 'km',
    },
  ];

  if (extraKmCharge > 0) {
    breakdown.push({
      label: `Extra KM Charge`,
      amount: extraKmCharge,
      type: 'extra_km',
    });
  }

  if (discountAmount > 0) {
    const discountLabel =
      pricing.discountType === 'PERCENTAGE'
        ? `${pricing.discountValue}% Promotional Discount`
        : `₹${pricing.discountValue} Discount`;
    breakdown.push({
      label: discountLabel,
      amount: -discountAmount,
      type: 'discount',
    });
  }

  return {
    serviceType: 'ONE_WAY',
    vehicleId: meta.id,
    vehicleName: meta.name,
    distanceKm: safeDistance,
    baseFare,
    driverAllowance,
    kmCharge,
    extraKmCharge,
    hourCharge: 0,
    extraHourCharge: 0,
    originalFare,
    discountAmount,
    discountLabel:
      discountAmount > 0
        ? pricing.discountType === 'PERCENTAGE'
          ? `${pricing.discountValue}% Off`
          : `₹${pricing.discountValue} Off`
        : undefined,
    finalFare,
    breakdown,
  };
}

/**
 * 8. ROUND-TRIP CALCULATION
 * Billable KM = MAX(Actual Total KM, Daily Minimum KM * Number of Days)
 * ROUND-TRIP TOTAL = (Billable KM * Per KM Rate) + (Driver Allowance * Number of Days) - Discount
 */
export function calculateRoundTripFare(
  pricing: RoundTripPricing,
  oneWayDistanceKm: number,
  roundTripDays: number,
  vehicleMeta?: VehicleMetaInfo
): FareCalculationResult {
  const meta = vehicleMeta || FARE_VEHICLES_META[0];
  const days = Math.max(1, Math.round(roundTripDays || 1));
  const actualTotalKm = Math.max(0, Number((oneWayDistanceKm * 2).toFixed(2)));

  const dailyMinKm = pricing.dailyMinimumKm || 300;
  const minIncludedKm = dailyMinKm * days;
  const billableKm = Math.max(actualTotalKm, minIncludedKm);

  const extraKm = Math.max(0, actualTotalKm - minIncludedKm);
  const extraRate =
    pricing.extraPerKmRate !== undefined && pricing.extraPerKmRate > 0
      ? pricing.extraPerKmRate
      : (pricing.perKmRate || 0);

  const baseKmCharge = Math.round(minIncludedKm * (pricing.perKmRate || 0));
  const extraKmCharge = extraKm > 0 ? Math.round(extraKm * extraRate) : 0;
  const kmCharge = extraKm > 0 ? baseKmCharge + extraKmCharge : Math.round(billableKm * (pricing.perKmRate || 0));

  const driverAllowanceTotal = Math.round((pricing.driverAllowance || 0) * days);

  const originalFare = kmCharge + driverAllowanceTotal;

  const discountAmount = calculateDiscount(
    originalFare,
    pricing.discountType,
    pricing.discountValue
  );
  const finalFare = calculateFinalFare(originalFare, discountAmount);

  const breakdown: FareBreakdownLine[] = [
    ...(extraKm > 0
      ? [
          {
            label: `Base Minimum Distance (${minIncludedKm} km [${dailyMinKm} km/day x ${days} day${days > 1 ? 's' : ''}] @ ₹${pricing.perKmRate}/km)`,
            amount: baseKmCharge,
            type: 'km' as const,
          },
          {
            label: `Extra Distance (${Math.round(extraKm)} km @ ₹${extraRate}/km)`,
            amount: extraKmCharge,
            type: 'km' as const,
          },
        ]
      : [
          {
            label: `Round Trip Distance (${billableKm} km ${
              billableKm > actualTotalKm ? `[Min ${dailyMinKm} km/day x ${days} day${days > 1 ? 's' : ''}]` : ''
            } @ ₹${pricing.perKmRate}/km)`,
            amount: kmCharge,
            type: 'km' as const,
          },
        ]),
    {
      label: `Driver Allowance (₹${pricing.driverAllowance}/day x ${days} day${days > 1 ? 's' : ''})`,
      amount: driverAllowanceTotal,
      type: 'driver' as const,
    },
  ];

  if (discountAmount > 0) {
    const discountLabel =
      pricing.discountType === 'PERCENTAGE'
        ? `${pricing.discountValue}% Promotional Discount`
        : `₹${pricing.discountValue} Discount`;
    breakdown.push({
      label: discountLabel,
      amount: -discountAmount,
      type: 'discount',
    });
  }

  return {
    serviceType: 'ROUND_TRIP',
    vehicleId: meta.id,
    vehicleName: meta.name,
    distanceKm: billableKm,
    travelDays: days,
    baseFare: 0,
    driverAllowance: driverAllowanceTotal,
    kmCharge,
    extraKmCharge,
    hourCharge: 0,
    extraHourCharge: 0,
    originalFare,
    discountAmount,
    discountLabel:
      discountAmount > 0
        ? pricing.discountType === 'PERCENTAGE'
          ? `${pricing.discountValue}% Off`
          : `₹${pricing.discountValue} Off`
        : undefined,
    finalFare,
    breakdown,
  };
}

/**
 * 10. AIRPORT FARE CALCULATION
 * AIRPORT TOTAL = Base Fare + Driver Allowance + (Distance * Per KM Rate) + Applicable Extra KM Charges - Discount
 */
export function calculateAirportFare(
  pricing: AirportPricing,
  distanceKm: number,
  vehicleMeta?: VehicleMetaInfo
): FareCalculationResult {
  const meta = vehicleMeta || FARE_VEHICLES_META[0];
  const safeDistance = Math.max(0, Number(distanceKm.toFixed(2)));

  const baseFare = Math.max(0, pricing.baseFare || 0);
  const driverAllowance = Math.max(0, pricing.driverAllowance || 0);

  const kmCharge = Math.round(safeDistance * (pricing.perKmRate || 0));
  const extraKmCharge = 0;

  const originalFare = baseFare + driverAllowance + kmCharge + extraKmCharge;

  const discountAmount = calculateDiscount(
    originalFare,
    pricing.discountType,
    pricing.discountValue
  );
  const finalFare = calculateFinalFare(originalFare, discountAmount);

  const breakdown: FareBreakdownLine[] = [
    { label: 'Airport Base Fare', amount: baseFare, type: 'base' },
    { label: 'Driver Allowance', amount: driverAllowance, type: 'driver' },
    {
      label: `Distance Charge (${safeDistance} km @ ₹${pricing.perKmRate}/km)`,
      amount: kmCharge,
      type: 'km',
    },
  ];

  if (extraKmCharge > 0) {
    breakdown.push({
      label: `Extra KM Charge`,
      amount: extraKmCharge,
      type: 'extra_km',
    });
  }

  if (discountAmount > 0) {
    const discountLabel =
      pricing.discountType === 'PERCENTAGE'
        ? `${pricing.discountValue}% Promotional Discount`
        : `₹${pricing.discountValue} Discount`;
    breakdown.push({
      label: discountLabel,
      amount: -discountAmount,
      type: 'discount',
    });
  }

  return {
    serviceType: 'AIRPORT',
    vehicleId: meta.id,
    vehicleName: meta.name,
    distanceKm: safeDistance,
    baseFare,
    driverAllowance,
    kmCharge,
    extraKmCharge,
    hourCharge: 0,
    extraHourCharge: 0,
    originalFare,
    discountAmount,
    discountLabel:
      discountAmount > 0
        ? pricing.discountType === 'PERCENTAGE'
          ? `${pricing.discountValue}% Off`
          : `₹${pricing.discountValue} Off`
        : undefined,
    finalFare,
    breakdown,
  };
}

/**
 * 11. INTER-STATE ONE-WAY FARE CALCULATION
 * Exclusively for ONE-WAY trips between two different states
 * Base Fare + Billable KM x Per KM Rate + Driver Allowance + Tolls + Permits + Taxes - Discount
 * Billable KM = MAX(Actual Route Distance, Minimum Billable KM)
 */
export function calculateInterStateFare(
  pricing: InterStateOneWayPricing,
  distanceKm: number,
  vehicleMeta?: VehicleMetaInfo,
  fromState?: string,
  toState?: string
): FareCalculationResult {
  const meta = vehicleMeta || FARE_VEHICLES_META[0];
  const safeDistance = Math.max(0, Number(distanceKm.toFixed(2)));
  const minimumBillableKm = Math.max(0, pricing.minimumBillableKm || 149);
  const billableKm = Math.max(safeDistance, minimumBillableKm);

  const baseFare = Math.max(0, pricing.baseFare || 0);
  const driverAllowance = Math.max(0, pricing.driverAllowance || 0);

  let kmCharge = 0;
  let extraKmCharge = 0;

  if (pricing.includedKm && pricing.includedKm > 0) {
    const includedKm = pricing.includedKm;
    const extraKm = Math.max(0, billableKm - includedKm);
    const applicableBaseKm = Math.min(billableKm, includedKm);
    kmCharge = Math.round(applicableBaseKm * (pricing.perKmRate || 0));
    extraKmCharge = Math.round(extraKm * (pricing.extraPerKmRate || pricing.perKmRate || 0));
  } else {
    kmCharge = Math.round(billableKm * (pricing.perKmRate || 0));
  }

  const tollCharges = pricing.includeTolls ? (pricing.tollCharges || 0) : 0;
  const parkingCharges = pricing.parkingCharges || 0;
  const permitCharges = pricing.includePermit ? (pricing.permitStateTaxCharges || 0) : 0;
  const stateEntryCharges = pricing.includeStateEntry ? (pricing.stateEntryCharges || 0) : 0;
  const otherCharges = pricing.includeOtherCharges ? (pricing.otherCharges || 0) : 0;

  const subtotalBeforeTax =
    baseFare +
    driverAllowance +
    kmCharge +
    extraKmCharge +
    tollCharges +
    parkingCharges +
    permitCharges +
    stateEntryCharges +
    otherCharges;

  const gstPercentage = Math.max(0, pricing.gstPercentage || 0);
  const gstAmount = gstPercentage > 0 ? Math.round(subtotalBeforeTax * (gstPercentage / 100)) : 0;

  const subtotal = subtotalBeforeTax + gstAmount;
  const discountAmount = calculateDiscount(subtotal, pricing.discountType, pricing.discountValue);
  const finalFare = calculateFinalFare(subtotal, discountAmount);

  const breakdown: FareBreakdownLine[] = [];

  if (baseFare > 0) {
    breakdown.push({ label: 'Inter-State Base Fare', amount: baseFare, type: 'base' });
  }

  const kmLabel = billableKm > safeDistance
    ? `Distance Charge (${billableKm} km [Min Billable: ${minimumBillableKm} km] @ ₹${pricing.perKmRate}/km)`
    : `Distance Charge (${billableKm} km @ ₹${pricing.perKmRate}/km)`;

  breakdown.push({
    label: kmLabel,
    amount: kmCharge,
    type: 'km',
  });

  if (extraKmCharge > 0) {
    breakdown.push({
      label: `Extra KM Charge (${Math.max(0, billableKm - (pricing.includedKm || 0))} km @ ₹${pricing.extraPerKmRate || pricing.perKmRate}/km)`,
      amount: extraKmCharge,
      type: 'extra_km',
    });
  }

  if (driverAllowance > 0) {
    breakdown.push({
      label: 'Driver Allowance',
      amount: driverAllowance,
      type: 'driver',
    });
  }

  if (tollCharges > 0) {
    breakdown.push({
      label: 'Highway Toll Charges (FASTag)',
      amount: tollCharges,
      type: 'other',
    });
  }

  if (permitCharges > 0) {
    const permitLabel = fromState && toState
      ? `Inter-State Border Permit (${fromState} → ${toState})`
      : 'Inter-State Border Permit / Tax';
    breakdown.push({
      label: permitLabel,
      amount: permitCharges,
      type: 'other',
    });
  }

  if (stateEntryCharges > 0) {
    breakdown.push({
      label: 'State Entry & Municipal Taxes',
      amount: stateEntryCharges,
      type: 'other',
    });
  }

  if (parkingCharges > 0) {
    breakdown.push({
      label: 'Parking Charges',
      amount: parkingCharges,
      type: 'other',
    });
  }

  if (otherCharges > 0) {
    breakdown.push({
      label: 'Other Route Charges',
      amount: otherCharges,
      type: 'other',
    });
  }

  if (gstAmount > 0) {
    breakdown.push({
      label: `GST / Commercial Tax (${gstPercentage}%)`,
      amount: gstAmount,
      type: 'other',
    });
  }

  if (discountAmount > 0) {
    const discountLabel =
      pricing.discountType === 'PERCENTAGE'
        ? `${pricing.discountValue}% Promotional Discount`
        : `₹${pricing.discountValue} Discount`;
    breakdown.push({
      label: discountLabel,
      amount: -discountAmount,
      type: 'discount',
    });
  }

  return {
    serviceType: 'INTER_STATE_ONE_WAY',
    vehicleId: meta.id,
    vehicleName: meta.name,
    distanceKm: billableKm,
    baseFare,
    driverAllowance,
    kmCharge,
    extraKmCharge,
    hourCharge: 0,
    extraHourCharge: 0,
    originalFare: subtotal,
    discountAmount,
    discountLabel:
      discountAmount > 0
        ? pricing.discountType === 'PERCENTAGE'
          ? `${pricing.discountValue}% Off`
          : `₹${pricing.discountValue} Off`
        : undefined,
    finalFare,
    breakdown,
  };
}

/**
 * Universal Master Calculation Dispatcher
 * Calls the single authoritative engine for any service type and vehicle
 */
export function calculateMasterFare(params: {
  config: CentralizedFareConfig;
  serviceType: ServiceTypeCategory;
  vehicleId: string;
  distanceKm: number;
  durationHours?: number;
  roundTripDays?: number;
  fromState?: string;
  toState?: string;
}): FareCalculationResult {
  const meta = getVehicleMeta(params.vehicleId);
  const vehicleId = meta.id;

  switch (params.serviceType) {
    case 'LOCAL': {
      const pricing =
        params.config.local[vehicleId] ||
        DEFAULT_CENTRALIZED_FARE_CONFIG.local[vehicleId] ||
        DEFAULT_CENTRALIZED_FARE_CONFIG.local['sedan-4-1'];
      return calculateLocalFare(
        pricing,
        params.distanceKm || (params.durationHours || 8) * 10,
        params.durationHours || 8,
        meta
      );
    }
    case 'ROUND_TRIP': {
      const pricing =
        params.config.roundTrip[vehicleId] ||
        DEFAULT_CENTRALIZED_FARE_CONFIG.roundTrip[vehicleId] ||
        DEFAULT_CENTRALIZED_FARE_CONFIG.roundTrip['sedan-4-1'];
      return calculateRoundTripFare(
        pricing,
        params.distanceKm || 150,
        params.roundTripDays || 1,
        meta
      );
    }
    case 'AIRPORT': {
      const pricing =
        params.config.airport[vehicleId] ||
        DEFAULT_CENTRALIZED_FARE_CONFIG.airport[vehicleId] ||
        DEFAULT_CENTRALIZED_FARE_CONFIG.airport['sedan-4-1'];
      return calculateAirportFare(pricing, params.distanceKm || 170, meta);
    }
    case 'INTER_STATE_ONE_WAY': {
      const pricing =
        params.config.interStateOneWay?.[vehicleId] ||
        DEFAULT_CENTRALIZED_FARE_CONFIG.interStateOneWay[vehicleId] ||
        DEFAULT_CENTRALIZED_FARE_CONFIG.interStateOneWay['sedan-4-1'];
      return calculateInterStateFare(
        pricing,
        params.distanceKm || 250,
        meta,
        params.fromState,
        params.toState
      );
    }
    case 'ONE_WAY':
    default: {
      // Automatic State Detection Rule:
      // IF One-Way trip AND Origin State != Destination State, THEN activate the 'INTER-STATE ONE-WAY' fare engine.
      if (
        params.fromState &&
        params.toState &&
        params.fromState.toLowerCase().trim() !== params.toState.toLowerCase().trim()
      ) {
        const isPricing =
          params.config.interStateOneWay?.[vehicleId] ||
          DEFAULT_CENTRALIZED_FARE_CONFIG.interStateOneWay[vehicleId] ||
          DEFAULT_CENTRALIZED_FARE_CONFIG.interStateOneWay['sedan-4-1'];
        return calculateInterStateFare(
          isPricing,
          params.distanceKm || 250,
          meta,
          params.fromState,
          params.toState
        );
      }

      const pricing =
        params.config.oneWay[vehicleId] ||
        DEFAULT_CENTRALIZED_FARE_CONFIG.oneWay[vehicleId] ||
        DEFAULT_CENTRALIZED_FARE_CONFIG.oneWay['sedan-4-1'];
      return calculateOneWayFare(pricing, params.distanceKm || 140, meta);
    }
  }
}
