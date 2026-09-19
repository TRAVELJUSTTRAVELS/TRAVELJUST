import {
  BookingTypeCategory,
  DistanceRoundingRule,
  DualEngineFareComparison,
  DualEngineVehicleComparison,
  DynamicFareCalculationInput,
  DynamicFareCalculationResult,
  FareEngineType,
  GoogleMapsDrivingMetrics,
  RouteCategory,
  StatePairPricingRule,
} from '../types/dynamicPricing';
import {
  DEFAULT_STATE_PAIR_RULES,
  DEFAULT_VEHICLE_CONFIGS,
  applyDistanceRounding,
  applyFareRounding,
  detectIndianState,
  formatDurationText,
  isNightTime,
} from './dynamicFareEngine';

export const TARGET_VEHICLES = [
  { id: 'sedan-4-1', name: 'Sedan (4+1)', category: 'Sedan (4+1)', capacity: '4+1 Passengers' },
  { id: 'suv-6-1', name: 'SUV (6+1)', category: 'SUV (6+1)', capacity: '6+1 Passengers' },
  { id: 'innova', name: 'INNOVA', category: 'Innova', capacity: '6+1 / 7+1 Passengers' },
  { id: 'innova-crysta', name: 'INNOVA CRYSTA', category: 'Innova Crysta', capacity: '7+1 Passengers' },
  { id: 'tempo-traveller-12-1', name: 'TEMPO TRAVELL(12+1)', category: 'Tempo Traveller (12+1)', capacity: '12+1 Passengers' },
] as const;

export type TargetVehicleId = typeof TARGET_VEHICLES[number]['id'];

/**
 * Hill / Ghat Route Classifier for South India
 * Detects whether the route ascends into Western Ghats or Nilgiris
 */
export function detectGhatTerrain(origin: string, destination: string): boolean {
  const text = `${origin} ${destination}`.toLowerCase();
  const ghatKeywords = [
    'ooty', 'udhagamandalam', 'nilgiri', 'coonoor', 'kotagiri', 'gudalur',
    'wayanad', 'vythiri', 'kalpetta', 'sulthan bathery', 'meppadi', 'thamarassery',
    'munnar', 'idukki', 'vagamon', 'kodaikanal', 'coorg', 'madikeri', 'virajpet',
    'somwarpet', 'kushalnagar', 'chikmagalur', 'chikkamagaluru', 'sakleshpur',
    'kemmangundi', 'mullayanagiri', 'bababudangiri', 'charmadi', 'shiradi',
    'sampaje', 'bisle', 'agumbe', 'kudremukh', 'horanadu', 'sringeri'
  ];
  return ghatKeywords.some((k) => text.includes(k));
}

/**
 * Global active fare engine in memory / local storage
 */
let currentActiveEngine: FareEngineType = 'ENGINE_A';

export function getActiveFareEngine(): FareEngineType {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const stored = window.localStorage.getItem('tj_active_fare_engine');
      if (stored === 'ENGINE_A' || stored === 'ENGINE_B') {
        return stored;
      }
    }
  } catch (e) {
    // ignore local storage error
  }
  return currentActiveEngine;
}

export function setActiveFareEngine(engine: FareEngineType): void {
  currentActiveEngine = engine;
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem('tj_active_fare_engine', engine);
      window.dispatchEvent(new CustomEvent('tj_fare_engine_changed', { detail: { engine } }));
    }
  } catch (e) {
    // ignore
  }
}

/**
 * Compute Google Maps Driving Metrics from raw distance & duration
 */
export function extractDrivingMetrics(
  origin: string,
  destination: string,
  rawDistanceKm: number,
  rawDurationMinutes: number,
  tollEstimate?: number,
  encodedPolyline?: string
): GoogleMapsDrivingMetrics {
  const distanceKm = Math.max(0, Number(rawDistanceKm.toFixed(1)));
  const durationMinutes = Math.max(0, Math.round(rawDurationMinutes));
  const isGhatTerrain = detectGhatTerrain(origin, destination);

  // Expected highway time at 55 km/h
  const baselineMinutes = distanceKm > 0 ? Math.round((distanceKm / 55) * 60) : 0;
  const trafficDelayMinutes = Math.max(0, durationMinutes - baselineMinutes);
  
  // Traffic congestion factor (1.00 to 1.25)
  let trafficCongestionFactor = 1.0;
  if (trafficDelayMinutes > 15 && baselineMinutes > 0) {
    const delayRatio = trafficDelayMinutes / baselineMinutes;
    trafficCongestionFactor = Math.min(1.25, 1.0 + Number((delayRatio * 0.2).toFixed(2)));
  }

  const originState = detectIndianState(origin);
  const destinationState = destination ? detectIndianState(destination) : originState;
  const isInterState = originState.toLowerCase().trim() !== destinationState.toLowerCase().trim();

  return {
    distanceMeters: Math.round(distanceKm * 1000),
    distanceKm,
    durationSeconds: Math.round(durationMinutes * 60),
    durationMinutes,
    durationFormatted: formatDurationText(durationMinutes),
    trafficDelayMinutes,
    trafficCongestionFactor,
    isGhatTerrain,
    terrainMultiplier: isGhatTerrain ? 1.15 : 1.0,
    tollEstimate: tollEstimate || 0,
    encodedPolyline,
    isInterState,
    originState,
    destinationState,
  };
}

// ----------------------------------------------------------------------
// ENGINE A: Standard Commercial Slab Engine
// Fixed slabs, predictable per-km pricing, driver bata, state border permits
// ----------------------------------------------------------------------
export function calculateEngineAFare(input: DynamicFareCalculationInput): DynamicFareCalculationResult {
  const {
    origin,
    destination,
    distanceKm: rawDistanceKm,
    durationMinutes: rawDurationMinutes,
    bookingType,
    vehicleId,
    pickupTime,
    roundTripDays = 1,
    airportTransferType = 'pickup',
    viaStopsCount = 0,
    customPricingConfig,
    statePairRules = DEFAULT_STATE_PAIR_RULES,
  } = input;

  const vehicleConfig =
    customPricingConfig ||
    DEFAULT_VEHICLE_CONFIGS[vehicleId] ||
    (vehicleId === 'ertiga' || vehicleId === 'suv' ? DEFAULT_VEHICLE_CONFIGS['suv-6-1'] : undefined) ||
    DEFAULT_VEHICLE_CONFIGS['sedan-4-1'];

  const distanceRounding: DistanceRoundingRule = input.distanceRounding || vehicleConfig.distanceRounding || 'NEAREST_1';
  const distanceKm = applyDistanceRounding(Math.max(0, Number(rawDistanceKm.toFixed(2))), distanceRounding);
  const durationMinutes = Math.max(0, Math.round(rawDurationMinutes));
  const rawDurationHours = durationMinutes / 60;
  const durationFormatted = formatDurationText(durationMinutes);

  const originState = input.originState || detectIndianState(origin, input.originDetails);
  const destinationState = input.destinationState || detectIndianState(destination, input.destinationDetails);
  const isInterState = originState.toLowerCase().trim() !== destinationState.toLowerCase().trim();
  const routeCategory: RouteCategory = isInterState ? 'INTER_STATE' : 'INTRA_STATE';

  // Specific rule tables for the 5 target vehicles under Engine A
  const pricingRule = vehicleConfig.pricingByBookingType?.[bookingType] || vehicleConfig.pricingByBookingType?.['ONE_WAY'];

  let baseFare = pricingRule.baseFare;
  let includedKm = pricingRule.includedKm;
  let billableKm = distanceKm;
  let distanceFare = 0;
  let extraDistanceFare = 0;
  let driverAllowance = pricingRule.driverAllowance;
  let hourlyFare = 0;
  let extraHourFare = 0;
  let billableHours = 0;

  // 1. STATE TRIPS (Intra-State)
  if (!isInterState || bookingType !== 'ONE_WAY') {
    if (bookingType === 'LOCAL') {
      // Slabs: 4h/40km or 8h/80km or 12h/120km
      const targetHours = Math.max(4, Math.round(durationMinutes / 60) || 8);
      includedKm = targetHours * 10;
      billableKm = Math.max(distanceKm, includedKm);
      baseFare = pricingRule.baseFare;
      distanceFare = pricingRule.baseFare; // Base covers package
      if (distanceKm > includedKm) {
        extraDistanceFare = (distanceKm - includedKm) * (pricingRule.extraPerKmRate || pricingRule.perKmRate);
      }
      if (targetHours > (pricingRule.includedHours || 8)) {
        extraHourFare = (targetHours - (pricingRule.includedHours || 8)) * (pricingRule.extraPerHourRate || 150);
      }
      driverAllowance = pricingRule.driverAllowance || 300;
    } else if (bookingType === 'ROUND_TRIP') {
      const days = Math.max(1, roundTripDays);
      const minDailyKm = pricingRule.minimumKm || 300;
      const minIncluded = minDailyKm * days;
      const actualRtKm = distanceKm * 2;
      billableKm = Math.max(actualRtKm, minIncluded);
      includedKm = minIncluded;
      distanceFare = billableKm * pricingRule.perKmRate;
      driverAllowance = (pricingRule.driverAllowance || 350) * days;
      baseFare = 0; // Incorporated in daily km billing
    } else if (bookingType === 'AIRPORT_TRANSFER') {
      baseFare = vehicleConfig.airportSpecific?.airportBaseFare || pricingRule.baseFare || 699;
      const rate = vehicleConfig.airportSpecific?.airportPerKmRate || pricingRule.perKmRate;
      distanceFare = distanceKm * rate;
      driverAllowance = vehicleConfig.airportSpecific?.airportDriverAllowance || 250;
    } else {
      // ONEWAY Intra-State
      baseFare = pricingRule.baseFare;
      const minKm = pricingRule.minimumKm || 30;
      billableKm = Math.max(distanceKm, minKm);
      distanceFare = billableKm * pricingRule.perKmRate;
      driverAllowance = pricingRule.driverAllowance || 300;
    }
  }

  // 2. INTER-STATE (Strictly ONE WAY only: One state to another state)
  let interStateCharge = 0;
  let interStateAppliedRule = 'Intra-State';
  if (isInterState && bookingType === 'ONE_WAY') {
    // Inter-State One Way rules: Km × Interstate rate + State border permit entry fee
    const perKmRate = pricingRule.perKmRate || 14;
    billableKm = distanceKm;
    distanceFare = billableKm * perKmRate;
    driverAllowance = pricingRule.driverAllowance || 400;

    // Border crossing tax lookup from state-pair rules
    const matchedPair = statePairRules.find(
      (r) =>
        r.active !== false &&
        r.fromState.toLowerCase().trim() === originState.toLowerCase().trim() &&
        r.toState.toLowerCase().trim() === destinationState.toLowerCase().trim()
    );

    const vehiclePairRate = matchedPair?.ratesByVehicle?.[vehicleId] ||
      matchedPair?.ratesByVehicle?.[vehicleConfig.vehicleId] ||
      (vehicleId.includes('sedan') ? 500 : vehicleId.includes('tempo') ? 1500 : 700);

    interStateCharge = vehiclePairRate;
    interStateAppliedRule = `${originState} → ${destinationState} Commercial State Border Permit (₹${vehiclePairRate})`;
  }

  // Night Surcharge
  let nightCharge = 0;
  const nightCfg = vehicleConfig.nightConfig;
  if (nightCfg && nightCfg.enabled && isNightTime(pickupTime, nightCfg.startHour, nightCfg.endHour)) {
    if (nightCfg.chargeType === 'FIXED') {
      nightCharge = nightCfg.amount;
    } else if (nightCfg.chargeType === 'PERCENTAGE') {
      nightCharge = Math.round((baseFare + distanceFare + extraDistanceFare) * (nightCfg.amount / 100));
    }
  }

  // Tolls & Permits (Google Maps Toll estimate or default)
  let tolls = pricingRule.tollPolicy === 'FIXED_ESTIMATE' ? (pricingRule.tollFixedAmount || 0) : 0;
  if (bookingType === 'AIRPORT_TRANSFER') {
    tolls = 120; // Kempegowda Airport expressway corridor toll
  }

  let permits = pricingRule.permitPolicy === 'FIXED_ESTIMATE' ? (pricingRule.permitFixedAmount || 0) : 0;
  let viaStopsCharge = viaStopsCount * 150;

  const coreFare = baseFare + distanceFare + extraDistanceFare + hourlyFare + extraHourFare;
  const subtotalBeforeMin = coreFare + driverAllowance + interStateCharge + nightCharge + tolls + permits + viaStopsCharge;

  const minFare = pricingRule.minimumFare || 0;
  let runningTotal = subtotalBeforeMin;
  let minimumFareApplied = false;
  if (runningTotal < minFare) {
    runningTotal = minFare;
    minimumFareApplied = true;
  }

  const roundingRule = vehicleConfig.roundingRule || 'NEAREST_10';
  const totalFare = applyFareRounding(runningTotal, roundingRule);

  // Breakdown
  const breakdown: Array<{ label: string; amount: number; detail?: string }> = [];
  if (baseFare > 0) {
    breakdown.push({ label: `Base Fare (${vehicleConfig.vehicleName})`, amount: baseFare });
  }
  if (distanceFare > 0) {
    const detailText = bookingType === 'ROUND_TRIP'
      ? `${billableKm} km (min guarantee @ ₹${pricingRule.perKmRate}/km)`
      : `${billableKm} km @ ₹${pricingRule.perKmRate}/km`;
    breakdown.push({ label: 'Distance Charge', amount: Math.round(distanceFare), detail: detailText });
  }
  if (extraDistanceFare > 0) {
    breakdown.push({ label: 'Extra Distance Charge', amount: Math.round(extraDistanceFare) });
  }
  if (extraHourFare > 0) {
    breakdown.push({ label: 'Extra Hours Charge', amount: Math.round(extraHourFare) });
  }
  if (driverAllowance > 0) {
    breakdown.push({ label: 'Driver Batta / Allowance', amount: driverAllowance, detail: 'Chauffeur day allowance' });
  }
  if (interStateCharge > 0) {
    breakdown.push({ label: 'Inter-State Border Entry Permit', amount: interStateCharge, detail: interStateAppliedRule });
  }
  if (nightCharge > 0) {
    breakdown.push({ label: 'Night Driving Surcharge (10 PM - 6 AM)', amount: nightCharge });
  }
  if (tolls > 0) {
    breakdown.push({ label: 'Highway Toll Estimation', amount: tolls });
  }
  if (viaStopsCharge > 0) {
    breakdown.push({ label: `Via Stops (${viaStopsCount} stops)`, amount: viaStopsCharge });
  }

  return {
    distanceKm,
    durationMinutes,
    durationHours: Number(rawDurationHours.toFixed(2)),
    durationFormatted,
    vehicleId,
    vehicleName: vehicleConfig.vehicleName,
    vehicleCategory: vehicleConfig.vehicleCategory,
    pricingVersion: vehicleConfig.pricingVersion || 1,
    pricingModel: pricingRule.pricingModel || 'BASE_PLUS_DISTANCE',
    baseFare,
    includedKm,
    billableKm,
    distanceFare,
    extraDistanceFare,
    includedHours: pricingRule.includedHours || 0,
    billableHours,
    hourlyFare,
    extraHourFare,
    driverAllowance,
    interStateCharge,
    routeCategory,
    originState,
    destinationState,
    isInterState,
    interStateAppliedRule,
    distanceRoundingApplied: distanceRounding,
    nightCharge,
    taxes: 0,
    tolls,
    parking: 0,
    permits,
    additionalCharges: driverAllowance + interStateCharge + nightCharge + tolls + viaStopsCharge,
    subtotal: subtotalBeforeMin,
    minimumFareApplied,
    unroundedFare: runningTotal,
    roundingAdjustment: totalFare - runningTotal,
    totalFare,
    currency: 'INR',
    fareBreakdown: breakdown,
    timestamp: new Date().toISOString(),
    engineType: 'ENGINE_A',
    engineName: 'Engine A: Commercial Slab Engine',
    engineDescription: 'Standard commercial slab model with predictable tiered distance, fixed allowances, and transparent border crossing fees.',
    fareSnapshot: {
      vehicleId,
      vehicleType: vehicleConfig.vehicleName,
      engineType: 'ENGINE_A',
      baseFare,
      perKmRate: pricingRule.perKmRate,
      includedKm,
      extraPerKmRate: pricingRule.extraPerKmRate,
      includedHours: pricingRule.includedHours || 0,
      hourlyRate: pricingRule.hourlyRate || 0,
      extraPerHourRate: pricingRule.extraPerHourRate || 0,
      driverAllowance,
      distanceKm,
      durationMinutes,
      durationHours: Number(rawDurationHours.toFixed(2)),
      additionalCharges: driverAllowance + interStateCharge + nightCharge + tolls,
      subtotal: subtotalBeforeMin,
      totalFare,
      pricingVersion: vehicleConfig.pricingVersion || 1,
      currency: 'INR',
      timestamp: new Date().toISOString(),
      pricingModel: pricingRule.pricingModel || 'BASE_PLUS_DISTANCE',
      routeCategory,
      originState,
      destinationState,
      interStateCharge,
      interStateRate: interStateCharge,
      interStateAppliedRule,
    },
  };
}

// ----------------------------------------------------------------------
// ENGINE B: Real-Time Dynamic & Algorithmic Route Engine
// Traffic-aware, terrain/ghat indexed, return dead-haul amortization
// ----------------------------------------------------------------------
export function calculateEngineBFare(input: DynamicFareCalculationInput): DynamicFareCalculationResult {
  const {
    origin,
    destination,
    distanceKm: rawDistanceKm,
    durationMinutes: rawDurationMinutes,
    bookingType,
    vehicleId,
    pickupTime,
    roundTripDays = 1,
    viaStopsCount = 0,
    customPricingConfig,
    statePairRules = DEFAULT_STATE_PAIR_RULES,
  } = input;

  const vehicleConfig =
    customPricingConfig ||
    DEFAULT_VEHICLE_CONFIGS[vehicleId] ||
    (vehicleId === 'ertiga' || vehicleId === 'suv' ? DEFAULT_VEHICLE_CONFIGS['suv-6-1'] : undefined) ||
    DEFAULT_VEHICLE_CONFIGS['sedan-4-1'];

  const metrics = extractDrivingMetrics(origin, destination, rawDistanceKm, rawDurationMinutes);
  const distanceKm = metrics.distanceKm;
  const durationMinutes = metrics.durationMinutes;
  const rawDurationHours = durationMinutes / 60;
  const durationFormatted = metrics.durationFormatted;

  const originState = metrics.originState || 'Karnataka';
  const destinationState = metrics.destinationState || originState;
  const isInterState = metrics.isInterState || false;
  const routeCategory: RouteCategory = isInterState ? 'INTER_STATE' : 'INTRA_STATE';

  // Dynamic Vehicle Parameters for Engine B
  const DYNAMIC_VEHICLE_FACTORS: Record<string, {
    baseFare: number;
    dynamicPerKmRate: number;
    terrainMultiplier: number;
    trafficMinuteRate: number;
    deadHaulAmortization: number;
    driverBatta: number;
    interStatePermitBonus: number;
  }> = {
    'sedan-4-1': {
      baseFare: 550,
      dynamicPerKmRate: 14.5,
      terrainMultiplier: 1.12,
      trafficMinuteRate: 2.0,
      deadHaulAmortization: 1.30,
      driverBatta: 350,
      interStatePermitBonus: 500,
    },
    'suv-6-1': {
      baseFare: 750,
      dynamicPerKmRate: 18.5,
      terrainMultiplier: 1.15,
      trafficMinuteRate: 2.5,
      deadHaulAmortization: 1.32,
      driverBatta: 450,
      interStatePermitBonus: 700,
    },
    'innova': {
      baseFare: 800,
      dynamicPerKmRate: 19.5,
      terrainMultiplier: 1.18,
      trafficMinuteRate: 2.8,
      deadHaulAmortization: 1.35,
      driverBatta: 450,
      interStatePermitBonus: 800,
    },
    'innova-crysta': {
      baseFare: 1100,
      dynamicPerKmRate: 25.5,
      terrainMultiplier: 1.20,
      trafficMinuteRate: 3.5,
      deadHaulAmortization: 1.38,
      driverBatta: 550,
      interStatePermitBonus: 1000,
    },
    'tempo-traveller-12-1': {
      baseFare: 1400,
      dynamicPerKmRate: 31.0,
      terrainMultiplier: 1.25,
      trafficMinuteRate: 4.5,
      deadHaulAmortization: 1.40,
      driverBatta: 750,
      interStatePermitBonus: 1500,
    },
  };

  const vKey = DYNAMIC_VEHICLE_FACTORS[vehicleId] ? vehicleId : 'sedan-4-1';
  const factors = DYNAMIC_VEHICLE_FACTORS[vKey];

  let baseFare = factors.baseFare;
  let billableKm = distanceKm;
  let distanceFare = 0;
  let trafficFee = 0;
  let terrainSurcharge = 0;
  let driverAllowance = factors.driverBatta;
  let deadHaulRecovery = 0;

  // Real-Time Traffic Delay Compensation
  if (metrics.trafficDelayMinutes && metrics.trafficDelayMinutes > 15) {
    trafficFee = Math.round(metrics.trafficDelayMinutes * factors.trafficMinuteRate);
  }

  // Ghat Terrain Surcharge (Nilgiris, Western Ghats, Coorg, Wayanad)
  const isGhat = metrics.isGhatTerrain || false;
  const terrainFactor = isGhat ? factors.terrainMultiplier : 1.0;

  // 1. STATE TRIPS (Intra-State)
  if (!isInterState || bookingType !== 'ONE_WAY') {
    if (bookingType === 'LOCAL') {
      const hours = Math.max(4, Math.round(durationMinutes / 60) || 8);
      billableKm = Math.max(distanceKm, hours * 10);
      distanceFare = billableKm * factors.dynamicPerKmRate;
      baseFare = factors.baseFare;
      driverAllowance = factors.driverBatta;
    } else if (bookingType === 'ROUND_TRIP') {
      const days = Math.max(1, roundTripDays);
      const minDailyKm = 280;
      const minIncluded = minDailyKm * days;
      const actualRtKm = distanceKm * 2;
      billableKm = Math.max(actualRtKm, minIncluded);
      distanceFare = billableKm * (factors.dynamicPerKmRate * 0.95); // 5% discount for round trips
      driverAllowance = factors.driverBatta * days;
      if (isGhat) {
        terrainSurcharge = Math.round(distanceFare * (terrainFactor - 1.0));
      }
      baseFare = 0;
    } else if (bookingType === 'AIRPORT_TRANSFER') {
      baseFare = factors.baseFare + 200;
      distanceFare = distanceKm * factors.dynamicPerKmRate;
      driverAllowance = factors.driverBatta;
    } else {
      // ONEWAY State
      billableKm = distanceKm;
      distanceFare = distanceKm * factors.dynamicPerKmRate;
      if (isGhat) {
        terrainSurcharge = Math.round(distanceFare * (terrainFactor - 1.0));
      }
    }
  }

  // 2. INTER-STATE (Strictly ONE WAY only: One State to Another State)
  let interStateCharge = 0;
  let interStateAppliedRule = 'Intra-State';
  if (isInterState && bookingType === 'ONE_WAY') {
    // Inter-State One Way: applies dead-haul return amortization factor
    billableKm = distanceKm;
    const baseDistanceCharge = distanceKm * factors.dynamicPerKmRate;
    const amortizedDistanceCharge = baseDistanceCharge * factors.deadHaulAmortization;
    deadHaulRecovery = Math.round(amortizedDistanceCharge - baseDistanceCharge);
    distanceFare = Math.round(baseDistanceCharge);

    if (isGhat) {
      terrainSurcharge = Math.round(baseDistanceCharge * (terrainFactor - 1.0));
    }

    // Border crossing tax from state-pair rules
    const matchedPair = statePairRules.find(
      (r) =>
        r.active !== false &&
        r.fromState.toLowerCase().trim() === originState.toLowerCase().trim() &&
        r.toState.toLowerCase().trim() === destinationState.toLowerCase().trim()
    );

    const permitFee = matchedPair?.ratesByVehicle?.[vehicleId] ||
      matchedPair?.ratesByVehicle?.[vehicleConfig.vehicleId] ||
      factors.interStatePermitBonus;

    interStateCharge = permitFee;
    interStateAppliedRule = `${originState} → ${destinationState} Inter-State Corridor & Border Entry (₹${permitFee})`;
  }

  // Night Charge
  let nightCharge = 0;
  const nightCfg = vehicleConfig.nightConfig;
  if (nightCfg && nightCfg.enabled && isNightTime(pickupTime, nightCfg.startHour, nightCfg.endHour)) {
    nightCharge = Math.round((baseFare + distanceFare + deadHaulRecovery) * 0.12); // 12% dynamic night rate
  }

  // Tolls
  let tolls = metrics.tollEstimate || (bookingType === 'AIRPORT_TRANSFER' ? 120 : 0);
  let viaStopsCharge = viaStopsCount * 150;

  const coreFare = baseFare + distanceFare + deadHaulRecovery + terrainSurcharge + trafficFee;
  const subtotalBeforeMin = coreFare + driverAllowance + interStateCharge + nightCharge + tolls + viaStopsCharge;

  const totalFare = applyFareRounding(subtotalBeforeMin, 'NEAREST_10');

  // Breakdown
  const breakdown: Array<{ label: string; amount: number; detail?: string }> = [];
  if (baseFare > 0) {
    breakdown.push({ label: `Dynamic Base Fare (${vehicleConfig.vehicleName})`, amount: baseFare });
  }
  if (distanceFare > 0) {
    breakdown.push({
      label: `Google Maps Driving Distance (${billableKm} km @ ₹${factors.dynamicPerKmRate}/km)`,
      amount: Math.round(distanceFare),
      detail: `Real-time distance via Google Routes API: ${metrics.durationFormatted}`,
    });
  }
  if (deadHaulRecovery > 0) {
    breakdown.push({
      label: `Return-Haul Dead-Mileage Amortization (${Math.round((factors.deadHaulAmortization - 1) * 100)}%)`,
      amount: deadHaulRecovery,
      detail: 'Inter-State One-Way empty cab return fuel & route compensation',
    });
  }
  if (terrainSurcharge > 0) {
    breakdown.push({
      label: `Ghat / Hill Terrain Index (${Math.round((terrainFactor - 1) * 100)}%)`,
      amount: terrainSurcharge,
      detail: 'Western Ghats / Nilgiris hairpin gradient & fuel coefficient',
    });
  }
  if (trafficFee > 0) {
    breakdown.push({
      label: `Live Traffic Congestion Index (+${metrics.trafficDelayMinutes} mins)`,
      amount: trafficFee,
      detail: `Real-time congestion delay on route: ${metrics.trafficCongestionFactor}x traffic factor`,
    });
  }
  if (driverAllowance > 0) {
    breakdown.push({ label: 'Chauffeur Outstation Allowance', amount: driverAllowance, detail: 'Driver day batta' });
  }
  if (interStateCharge > 0) {
    breakdown.push({ label: 'Inter-State Commercial Border Permit', amount: interStateCharge, detail: interStateAppliedRule });
  }
  if (nightCharge > 0) {
    breakdown.push({ label: 'Dynamic Night Driving Surcharge (12%)', amount: nightCharge });
  }
  if (tolls > 0) {
    breakdown.push({ label: 'Google Maps Highway FastTag Tolls', amount: tolls });
  }
  if (viaStopsCharge > 0) {
    breakdown.push({ label: `Via Stops (${viaStopsCount} stops)`, amount: viaStopsCharge });
  }

  return {
    distanceKm,
    durationMinutes,
    durationHours: Number(rawDurationHours.toFixed(2)),
    durationFormatted,
    vehicleId,
    vehicleName: vehicleConfig.vehicleName,
    vehicleCategory: vehicleConfig.vehicleCategory,
    pricingVersion: (vehicleConfig.pricingVersion || 1) + 1,
    pricingModel: 'DISTANCE_AND_TIME',
    baseFare,
    includedKm: 0,
    billableKm,
    distanceFare,
    extraDistanceFare: deadHaulRecovery + terrainSurcharge,
    includedHours: 0,
    billableHours: Number(rawDurationHours.toFixed(2)),
    hourlyFare: trafficFee,
    extraHourFare: 0,
    driverAllowance,
    interStateCharge,
    routeCategory,
    originState,
    destinationState,
    isInterState,
    interStateAppliedRule,
    distanceRoundingApplied: 'NEAREST_1',
    nightCharge,
    taxes: 0,
    tolls,
    parking: 0,
    permits: 0,
    additionalCharges: driverAllowance + interStateCharge + nightCharge + tolls + viaStopsCharge,
    subtotal: subtotalBeforeMin,
    minimumFareApplied: false,
    unroundedFare: subtotalBeforeMin,
    roundingAdjustment: totalFare - subtotalBeforeMin,
    totalFare,
    currency: 'INR',
    fareBreakdown: breakdown,
    timestamp: new Date().toISOString(),
    engineType: 'ENGINE_B',
    engineName: 'Engine B: Live Route & Traffic Dynamic Engine',
    engineDescription: 'Intelligent real-time dynamic engine incorporating live Google Maps traffic congestion, hill/ghat terrain index, and empty return dead-haul amortization.',
    fareSnapshot: {
      vehicleId,
      vehicleType: vehicleConfig.vehicleName,
      engineType: 'ENGINE_B',
      baseFare,
      perKmRate: factors.dynamicPerKmRate,
      includedKm: 0,
      extraPerKmRate: factors.dynamicPerKmRate,
      includedHours: 0,
      hourlyRate: factors.trafficMinuteRate * 60,
      extraPerHourRate: 0,
      driverAllowance,
      distanceKm,
      durationMinutes,
      durationHours: Number(rawDurationHours.toFixed(2)),
      additionalCharges: driverAllowance + interStateCharge + nightCharge + tolls,
      subtotal: subtotalBeforeMin,
      totalFare,
      pricingVersion: (vehicleConfig.pricingVersion || 1) + 1,
      currency: 'INR',
      timestamp: new Date().toISOString(),
      pricingModel: 'DISTANCE_AND_TIME',
      routeCategory,
      originState,
      destinationState,
      interStateCharge,
      interStateRate: interStateCharge,
      interStateAppliedRule,
    },
  };
}

/**
 * Dual Engine Comparative Analysis for a single vehicle
 */
export function calculateDualEngineFare(input: DynamicFareCalculationInput): DualEngineFareComparison {
  const engineA = calculateEngineAFare(input);
  const engineB = calculateEngineBFare(input);
  const activeEngine = getActiveFareEngine();

  const metrics = extractDrivingMetrics(
    input.origin,
    input.destination,
    input.distanceKm,
    input.durationMinutes
  );

  const fareDiff = engineB.totalFare - engineA.totalFare;
  const pctDiff = engineA.totalFare > 0
    ? Number(((fareDiff / engineA.totalFare) * 100).toFixed(1))
    : 0;

  let recommendedEngine: FareEngineType = 'ENGINE_A';
  if (metrics.isGhatTerrain || (metrics.trafficDelayMinutes && metrics.trafficDelayMinutes > 30)) {
    recommendedEngine = 'ENGINE_B';
  }

  let summary = `Engine A: ₹${engineA.totalFare.toLocaleString('en-IN')} (Standard Slab) vs Engine B: ₹${engineB.totalFare.toLocaleString('en-IN')} (Route Dynamic)`;
  if (fareDiff !== 0) {
    summary += ` · Difference: ${fareDiff > 0 ? '+' : ''}₹${fareDiff} (${pctDiff}%)`;
  }

  return {
    engineA,
    engineB,
    activeEngine,
    recommendedEngine,
    metrics,
    fareDifference: fareDiff,
    percentageDifference: pctDiff,
    summary,
  };
}

/**
 * Dual Engine Multi-Vehicle Comparison across all 5 mandatory vehicles
 */
export function calculateDualEngineAllVehicles(
  input: Omit<DynamicFareCalculationInput, 'vehicleId'>
): DualEngineVehicleComparison[] {
  return TARGET_VEHICLES.map((veh) => {
    const vInput: DynamicFareCalculationInput = {
      ...input,
      vehicleId: veh.id,
    };
    const resA = calculateEngineAFare(vInput);
    const resB = calculateEngineBFare(vInput);
    return {
      vehicleId: veh.id,
      vehicleName: veh.name,
      engineAFare: resA.totalFare,
      engineBFare: resB.totalFare,
      difference: resB.totalFare - resA.totalFare,
      engineAResult: resA,
      engineBResult: resB,
    };
  });
}
