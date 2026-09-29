import {
  BookingTypeCategory,
  DistanceRoundingRule,
  DynamicFareCalculationInput,
  DynamicFareCalculationResult,
  FareSnapshot,
  LocationDetailInfo,
  RoundingRule,
  RouteCategory,
  StatePairPricingRule,
  TimeRoundingMethod,
  VehicleBookingPricing,
  VehicleDynamicPricingConfig,
} from '../types/dynamicPricing';

export {
  calculateLocalFare,
  calculateOneWayFare,
  calculateRoundTripFare,
  calculateAirportFare,
  calculateDiscount,
  calculateExtraKm,
  calculateExtraHours,
  calculateFinalFare,
  calculateMasterFare,
  DEFAULT_CENTRALIZED_FARE_CONFIG,
} from './centralFareEngine';

export const DEFAULT_STATE_PAIR_RULES: StatePairPricingRule[] = [
  {
    id: 'sp_ka_tn',
    fromState: 'Karnataka',
    toState: 'Tamil Nadu',
    ratesByVehicle: {
      'sedan-4-1': 500,
      'suv-6-1': 700,
      'ertiga': 700,
      'innova': 800,
      'innova-crysta': 1000,
      'tempo-traveller-12-1': 1500,
    },
    active: true,
    notes: 'Karnataka to Tamil Nadu (e.g. Ooty, Coimbatore, Chennai) Interstate Border Crossing',
    updatedAt: '2026-09-15T00:00:00.000Z',
  },
  {
    id: 'sp_ka_kl',
    fromState: 'Karnataka',
    toState: 'Kerala',
    ratesByVehicle: {
      'sedan-4-1': 600,
      'suv-6-1': 800,
      'ertiga': 800,
      'innova': 900,
      'innova-crysta': 1100,
      'tempo-traveller-12-1': 1600,
    },
    active: true,
    notes: 'Karnataka to Kerala (e.g. Wayanad, Calicut, Kannur) Interstate Border Crossing',
    updatedAt: '2026-09-15T00:00:00.000Z',
  },
  {
    id: 'sp_ka_ap',
    fromState: 'Karnataka',
    toState: 'Andhra Pradesh',
    ratesByVehicle: {
      'sedan-4-1': 700,
      'suv-6-1': 900,
      'ertiga': 900,
      'innova': 1000,
      'innova-crysta': 1200,
      'tempo-traveller-12-1': 1800,
    },
    active: true,
    notes: 'Karnataka to Andhra Pradesh (e.g. Tirupati, Chittoor, Nellore)',
    updatedAt: '2026-09-15T00:00:00.000Z',
  },
  {
    id: 'sp_ka_ts',
    fromState: 'Karnataka',
    toState: 'Telangana',
    ratesByVehicle: {
      'sedan-4-1': 1000,
      'suv-6-1': 1300,
      'ertiga': 1300,
      'innova': 1400,
      'innova-crysta': 1600,
      'tempo-traveller-12-1': 2200,
    },
    active: true,
    notes: 'Karnataka to Telangana (e.g. Hyderabad)',
    updatedAt: '2026-09-15T00:00:00.000Z',
  },
  {
    id: 'sp_tn_ka',
    fromState: 'Tamil Nadu',
    toState: 'Karnataka',
    ratesByVehicle: {
      'sedan-4-1': 500,
      'suv-6-1': 700,
      'ertiga': 700,
      'innova': 800,
      'innova-crysta': 1000,
      'tempo-traveller-12-1': 1500,
    },
    active: true,
    notes: 'Tamil Nadu to Karnataka Interstate Border Crossing',
    updatedAt: '2026-09-15T00:00:00.000Z',
  },
  {
    id: 'sp_kl_ka',
    fromState: 'Kerala',
    toState: 'Karnataka',
    ratesByVehicle: {
      'sedan-4-1': 600,
      'suv-6-1': 800,
      'ertiga': 800,
      'innova': 900,
      'innova-crysta': 1100,
      'tempo-traveller-12-1': 1600,
    },
    active: true,
    notes: 'Kerala to Karnataka Interstate Border Crossing',
    updatedAt: '2026-09-15T00:00:00.000Z',
  },
  {
    id: 'sp_tn_kl',
    fromState: 'Tamil Nadu',
    toState: 'Kerala',
    ratesByVehicle: {
      'sedan-4-1': 550,
      'suv-6-1': 750,
      'ertiga': 750,
      'innova': 850,
      'innova-crysta': 1050,
      'tempo-traveller-12-1': 1550,
    },
    active: true,
    notes: 'Tamil Nadu to Kerala Interstate Border Crossing (e.g. Coimbatore to Palakkad/Cochin)',
    updatedAt: '2026-09-15T00:00:00.000Z',
  },
  {
    id: 'sp_kl_tn',
    fromState: 'Kerala',
    toState: 'Tamil Nadu',
    ratesByVehicle: {
      'sedan-4-1': 550,
      'suv-6-1': 750,
      'ertiga': 750,
      'innova': 850,
      'innova-crysta': 1050,
      'tempo-traveller-12-1': 1550,
    },
    active: true,
    notes: 'Kerala to Tamil Nadu Interstate Border Crossing (e.g. Palakkad to Coimbatore/Ooty)',
    updatedAt: '2026-09-15T00:00:00.000Z',
  },
];

/**
 * Robust Indian State Detection
 * Evaluates geocoded place metadata or location addresses to identify the Indian state.
 */
export function detectIndianState(locationText?: string, details?: LocationDetailInfo | string): string {
  if (details && typeof details === 'object' && details.state && details.state.trim().length > 0) {
    const s = details.state.trim();
    if (/karnataka/i.test(s)) return 'Karnataka';
    if (/tamil\s*nadu/i.test(s)) return 'Tamil Nadu';
    if (/kerala/i.test(s)) return 'Kerala';
    if (/andhra/i.test(s)) return 'Andhra Pradesh';
    if (/telangana/i.test(s)) return 'Telangana';
    if (/goa/i.test(s)) return 'Goa';
    if (/maharashtra/i.test(s)) return 'Maharashtra';
    if (/pondicherry|puducherry/i.test(s)) return 'Puducherry';
    return s;
  }

  const detailString = typeof details === 'string' ? details : `${details?.formattedAddress || ''} ${details?.city || ''}`;
  const text = `${locationText || ''} ${detailString}`.toLowerCase();

  // Explicit state tokens
  if (text.includes('tamil nadu') || text.includes('tamilnadu') || /\btn\b/i.test(text)) return 'Tamil Nadu';
  if (text.includes('kerala') || /\bkl\b/i.test(text)) return 'Kerala';
  if (text.includes('andhra') || text.includes('andhra pradesh') || /\bap\b/i.test(text)) return 'Andhra Pradesh';
  if (text.includes('telangana') || /\bts\b/i.test(text)) return 'Telangana';
  if (text.includes('goa')) return 'Goa';
  if (text.includes('maharashtra') || /\bmh\b/i.test(text)) return 'Maharashtra';
  if (text.includes('pondicherry') || text.includes('puducherry')) return 'Puducherry';
  if (text.includes('karnataka') || /\bka\b/i.test(text)) return 'Karnataka';

  // Major cities in Tamil Nadu
  const tnCities = [
    'ooty', 'udhagamandalam', 'nilgiri', 'nilgiris', 'coonoor', 'kotagiri', 'gudalur',
    'coimbatore', 'chennai', 'madurai', 'salem', 'vellore', 'tiruchirappalli', 'trichy',
    'hosur', 'erode', 'tiruppur', 'kodaikanal', 'dindigul', 'thanjavur', 'kanyakumari',
    'mudumalai', 'dharmapuri', 'krishnagiri', 'tiruvannamalai', 'ramanathapuram', 'rameswaram'
  ];
  for (const c of tnCities) {
    if (text.includes(c)) return 'Tamil Nadu';
  }

  // Major cities in Kerala
  const klCities = [
    'wayanad', 'kalpetta', 'sulthan bathery', 'sultan bathery', 'mananthavady', 'vythiri',
    'meppadi', 'kochi', 'cochin', 'ernakulam', 'kozhikode', 'calicut', 'trivandrum',
    'thiruvananthapuram', 'kannur', 'kasaragod', 'thrissur', 'palakkad', 'alappuzha',
    'alleppey', 'kottayam', 'munnar', 'idukki', 'kollam', 'malappuram', 'guruvayur',
    'bekal', 'thekkady', 'varkala', 'kovalam'
  ];
  for (const c of klCities) {
    if (text.includes(c)) return 'Kerala';
  }

  // Major cities in Andhra Pradesh
  const apCities = [
    'tirupati', 'chittoor', 'nellore', 'vijayawada', 'visakhapatnam', 'vizag', 'guntur',
    'kurnool', 'kadapa', 'anantapur', 'rajahmundry', 'kakinada', 'tirumala', 'srikalahasti'
  ];
  for (const c of apCities) {
    if (text.includes(c)) return 'Andhra Pradesh';
  }

  // Major cities in Telangana
  const tsCities = ['hyderabad', 'secunderabad', 'warangal', 'nizamabad', 'karimnagar', 'khammam'];
  for (const c of tsCities) {
    if (text.includes(c)) return 'Telangana';
  }

  // Goa
  if (text.includes('panaji') || text.includes('panjim') || text.includes('margao') || text.includes('vasco') || text.includes('calangute')) {
    return 'Goa';
  }

  // Maharashtra
  if (text.includes('mumbai') || text.includes('pune') || text.includes('shirdi') || text.includes('nagpur') || text.includes('nashik') || text.includes('kolhapur')) {
    return 'Maharashtra';
  }

  // Default to Karnataka (Travel Just Mysore base headquarters)
  return 'Karnataka';
}

/**
 * Apply distance rounding rule
 */
export function applyDistanceRounding(distanceKm: number, rule: DistanceRoundingRule = 'NEAREST_1'): number {
  if (rule === 'EXACT') return Number(distanceKm.toFixed(1));
  if (rule === 'NEAREST_5') return Math.ceil(distanceKm / 5) * 5;
  // Default: round to nearest whole integer km
  return Math.ceil(distanceKm);
}

export const DEFAULT_VEHICLE_CONFIGS: Record<string, VehicleDynamicPricingConfig> = {
  'sedan-4-1': {
    id: 'cfg_sedan_4_1',
    vehicleId: 'sedan-4-1',
    vehicleName: 'Sedan (4+1)',
    vehicleCategory: 'Sedan (4+1)',
    active: true,
    pricingVersion: 1,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-03-01T00:00:00.000Z',
    updatedBy: 'Administrator',
    effectiveFrom: '2026-01-01T00:00:00.000Z',
    roundingRule: 'NEAREST_10',
    mode: 'ADVANCED',
    nightConfig: {
      enabled: true,
      startHour: 22,
      endHour: 6,
      chargeType: 'PERCENTAGE',
      amount: 10,
    },
    pricingByBookingType: {
      ONE_WAY: {
        baseFare: 500,
        perKmRate: 13,
        includedKm: 0,
        extraPerKmRate: 13,
        includedHours: 0,
        hourlyRate: 0,
        extraPerHourRate: 0,
        driverAllowance: 300,
        minimumKm: 10,
        minimumFare: 700,
        pricingModel: 'BASE_PLUS_DISTANCE',
        timeRounding: 'BLOCK_30_MIN',
        tollPolicy: 'AT_ACTUALS',
        tollFixedAmount: 0,
        parkingPolicy: 'AT_ACTUALS',
        parkingFixedAmount: 0,
        permitPolicy: 'AT_ACTUALS',
        permitFixedAmount: 0,
        taxPercentage: 0,
      },
      ROUND_TRIP: {
        baseFare: 500,
        perKmRate: 13,
        includedKm: 300, // 300 km min per day
        extraPerKmRate: 13,
        includedHours: 0,
        hourlyRate: 0,
        extraPerHourRate: 0,
        driverAllowance: 300,
        minimumKm: 300,
        minimumFare: 3900,
        pricingModel: 'DISTANCE_ONLY',
        timeRounding: 'BLOCK_1_HOUR',
        tollPolicy: 'AT_ACTUALS',
        tollFixedAmount: 0,
        parkingPolicy: 'AT_ACTUALS',
        parkingFixedAmount: 0,
        permitPolicy: 'AT_ACTUALS',
        permitFixedAmount: 0,
        taxPercentage: 0,
      },
      LOCAL: {
        baseFare: 500,
        perKmRate: 13,
        includedKm: 80,
        extraPerKmRate: 13,
        includedHours: 8,
        hourlyRate: 250,
        extraPerHourRate: 150,
        driverAllowance: 300,
        minimumKm: 40,
        minimumFare: 1500,
        pricingModel: 'DISTANCE_AND_TIME',
        timeRounding: 'BLOCK_30_MIN',
        tollPolicy: 'AT_ACTUALS',
        tollFixedAmount: 0,
        parkingPolicy: 'AT_ACTUALS',
        parkingFixedAmount: 0,
        permitPolicy: 'AT_ACTUALS',
        permitFixedAmount: 0,
        taxPercentage: 0,
      },
      AIRPORT_TRANSFER: {
        baseFare: 699,
        perKmRate: 13,
        includedKm: 0,
        extraPerKmRate: 13,
        includedHours: 0,
        hourlyRate: 0,
        extraPerHourRate: 0,
        driverAllowance: 250,
        minimumKm: 30,
        minimumFare: 1200,
        pricingModel: 'BASE_PLUS_DISTANCE',
        timeRounding: 'BLOCK_30_MIN',
        tollPolicy: 'AT_ACTUALS',
        tollFixedAmount: 0,
        parkingPolicy: 'AT_ACTUALS',
        parkingFixedAmount: 0,
        permitPolicy: 'AT_ACTUALS',
        permitFixedAmount: 0,
        taxPercentage: 0,
      },
      OUTSTATION: {
        baseFare: 600,
        perKmRate: 14,
        includedKm: 300,
        extraPerKmRate: 13,
        includedHours: 0,
        hourlyRate: 0,
        extraPerHourRate: 0,
        driverAllowance: 300,
        minimumKm: 300,
        minimumFare: 4200,
        pricingModel: 'DISTANCE_ONLY',
        timeRounding: 'BLOCK_1_HOUR',
        tollPolicy: 'AT_ACTUALS',
        tollFixedAmount: 0,
        parkingPolicy: 'AT_ACTUALS',
        parkingFixedAmount: 0,
        permitPolicy: 'AT_ACTUALS',
        permitFixedAmount: 0,
        taxPercentage: 0,
      },
    },
    airportSpecific: {
      airportBaseFare: 699,
      airportPerKmRate: 14,
      airportExtraKmRate: 13,
      airportDriverAllowance: 250,
      airportParking: 0,
      airportPickupCharge: 0,
    },
  },

  'suv-6-1': {
    id: 'cfg_suv_6_1',
    vehicleId: 'suv-6-1',
    vehicleName: 'SUV (6+1)',
    vehicleCategory: 'SUV (6+1)',
    active: true,
    pricingVersion: 1,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-03-01T00:00:00.000Z',
    updatedBy: 'Administrator',
    effectiveFrom: '2026-01-01T00:00:00.000Z',
    roundingRule: 'NEAREST_10',
    mode: 'ADVANCED',
    nightConfig: {
      enabled: true,
      startHour: 22,
      endHour: 6,
      chargeType: 'PERCENTAGE',
      amount: 10,
    },
    pricingByBookingType: {
      ONE_WAY: {
        baseFare: 700,
        perKmRate: 18,
        includedKm: 0,
        extraPerKmRate: 15,
        includedHours: 0,
        hourlyRate: 0,
        extraPerHourRate: 0,
        driverAllowance: 400,
        minimumKm: 10,
        minimumFare: 900,
        pricingModel: 'BASE_PLUS_DISTANCE',
        timeRounding: 'BLOCK_30_MIN',
        tollPolicy: 'AT_ACTUALS',
        tollFixedAmount: 0,
        parkingPolicy: 'AT_ACTUALS',
        parkingFixedAmount: 0,
        permitPolicy: 'AT_ACTUALS',
        permitFixedAmount: 0,
        taxPercentage: 0,
      },
      ROUND_TRIP: {
        baseFare: 700,
        perKmRate: 16.5,
        includedKm: 300,
        extraPerKmRate: 15,
        includedHours: 0,
        hourlyRate: 0,
        extraPerHourRate: 0,
        driverAllowance: 400,
        minimumKm: 300,
        minimumFare: 4950,
        pricingModel: 'DISTANCE_ONLY',
        timeRounding: 'BLOCK_1_HOUR',
        tollPolicy: 'AT_ACTUALS',
        tollFixedAmount: 0,
        parkingPolicy: 'AT_ACTUALS',
        parkingFixedAmount: 0,
        permitPolicy: 'AT_ACTUALS',
        permitFixedAmount: 0,
        taxPercentage: 0,
      },
      LOCAL: {
        baseFare: 700,
        perKmRate: 18,
        includedKm: 80,
        extraPerKmRate: 16,
        includedHours: 8,
        hourlyRate: 350,
        extraPerHourRate: 200,
        driverAllowance: 400,
        minimumKm: 40,
        minimumFare: 2200,
        pricingModel: 'DISTANCE_AND_TIME',
        timeRounding: 'BLOCK_30_MIN',
        tollPolicy: 'AT_ACTUALS',
        tollFixedAmount: 0,
        parkingPolicy: 'AT_ACTUALS',
        parkingFixedAmount: 0,
        permitPolicy: 'AT_ACTUALS',
        permitFixedAmount: 0,
        taxPercentage: 0,
      },
      AIRPORT_TRANSFER: {
        baseFare: 999,
        perKmRate: 18,
        includedKm: 0,
        extraPerKmRate: 16,
        includedHours: 0,
        hourlyRate: 0,
        extraPerHourRate: 0,
        driverAllowance: 350,
        minimumKm: 30,
        minimumFare: 1600,
        pricingModel: 'BASE_PLUS_DISTANCE',
        timeRounding: 'BLOCK_30_MIN',
        tollPolicy: 'AT_ACTUALS',
        tollFixedAmount: 0,
        parkingPolicy: 'AT_ACTUALS',
        parkingFixedAmount: 0,
        permitPolicy: 'AT_ACTUALS',
        permitFixedAmount: 0,
        taxPercentage: 0,
      },
      OUTSTATION: {
        baseFare: 800,
        perKmRate: 18,
        includedKm: 300,
        extraPerKmRate: 16,
        includedHours: 0,
        hourlyRate: 0,
        extraPerHourRate: 0,
        driverAllowance: 400,
        minimumKm: 300,
        minimumFare: 5400,
        pricingModel: 'DISTANCE_ONLY',
        timeRounding: 'BLOCK_1_HOUR',
        tollPolicy: 'AT_ACTUALS',
        tollFixedAmount: 0,
        parkingPolicy: 'AT_ACTUALS',
        parkingFixedAmount: 0,
        permitPolicy: 'AT_ACTUALS',
        permitFixedAmount: 0,
        taxPercentage: 0,
      },
    },
    airportSpecific: {
      airportBaseFare: 999,
      airportPerKmRate: 18,
      airportExtraKmRate: 16,
      airportDriverAllowance: 350,
      airportParking: 0,
      airportPickupCharge: 0,
    },
  },

  'innova': {
    id: 'cfg_innova',
    vehicleId: 'innova',
    vehicleName: 'INNOVA',
    vehicleCategory: 'Innova',
    active: true,
    pricingVersion: 1,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-03-01T00:00:00.000Z',
    updatedBy: 'Administrator',
    effectiveFrom: '2026-01-01T00:00:00.000Z',
    roundingRule: 'NEAREST_10',
    mode: 'ADVANCED',
    nightConfig: {
      enabled: true,
      startHour: 22,
      endHour: 6,
      chargeType: 'PERCENTAGE',
      amount: 10,
    },
    pricingByBookingType: {
      ONE_WAY: {
        baseFare: 700,
        perKmRate: 20,
        includedKm: 0,
        extraPerKmRate: 20,
        includedHours: 0,
        hourlyRate: 0,
        extraPerHourRate: 0,
        driverAllowance: 400,
        minimumKm: 10,
        minimumFare: 900,
        pricingModel: 'BASE_PLUS_DISTANCE',
        timeRounding: 'BLOCK_30_MIN',
        tollPolicy: 'AT_ACTUALS',
        tollFixedAmount: 0,
        parkingPolicy: 'AT_ACTUALS',
        parkingFixedAmount: 0,
        permitPolicy: 'AT_ACTUALS',
        permitFixedAmount: 0,
        taxPercentage: 0,
      },
      ROUND_TRIP: {
        baseFare: 700,
        perKmRate: 20,
        includedKm: 300,
        extraPerKmRate: 20,
        includedHours: 0,
        hourlyRate: 0,
        extraPerHourRate: 0,
        driverAllowance: 400,
        minimumKm: 300,
        minimumFare: 6000,
        pricingModel: 'DISTANCE_ONLY',
        timeRounding: 'BLOCK_1_HOUR',
        tollPolicy: 'AT_ACTUALS',
        tollFixedAmount: 0,
        parkingPolicy: 'AT_ACTUALS',
        parkingFixedAmount: 0,
        permitPolicy: 'AT_ACTUALS',
        permitFixedAmount: 0,
        taxPercentage: 0,
      },
      LOCAL: {
        baseFare: 700,
        perKmRate: 20,
        includedKm: 80,
        extraPerKmRate: 20,
        includedHours: 8,
        hourlyRate: 350,
        extraPerHourRate: 200,
        driverAllowance: 400,
        minimumKm: 40,
        minimumFare: 2400,
        pricingModel: 'DISTANCE_AND_TIME',
        timeRounding: 'BLOCK_30_MIN',
        tollPolicy: 'AT_ACTUALS',
        tollFixedAmount: 0,
        parkingPolicy: 'AT_ACTUALS',
        parkingFixedAmount: 0,
        permitPolicy: 'AT_ACTUALS',
        permitFixedAmount: 0,
        taxPercentage: 0,
      },
      AIRPORT_TRANSFER: {
        baseFare: 1199,
        perKmRate: 20,
        includedKm: 0,
        extraPerKmRate: 20,
        includedHours: 0,
        hourlyRate: 0,
        extraPerHourRate: 0,
        driverAllowance: 350,
        minimumKm: 30,
        minimumFare: 1800,
        pricingModel: 'BASE_PLUS_DISTANCE',
        timeRounding: 'BLOCK_30_MIN',
        tollPolicy: 'AT_ACTUALS',
        tollFixedAmount: 0,
        parkingPolicy: 'AT_ACTUALS',
        parkingFixedAmount: 0,
        permitPolicy: 'AT_ACTUALS',
        permitFixedAmount: 0,
        taxPercentage: 0,
      },
      OUTSTATION: {
        baseFare: 800,
        perKmRate: 20,
        includedKm: 300,
        extraPerKmRate: 20,
        includedHours: 0,
        hourlyRate: 0,
        extraPerHourRate: 0,
        driverAllowance: 400,
        minimumKm: 300,
        minimumFare: 6000,
        pricingModel: 'DISTANCE_ONLY',
        timeRounding: 'BLOCK_1_HOUR',
        tollPolicy: 'AT_ACTUALS',
        tollFixedAmount: 0,
        parkingPolicy: 'AT_ACTUALS',
        parkingFixedAmount: 0,
        permitPolicy: 'AT_ACTUALS',
        permitFixedAmount: 0,
        taxPercentage: 0,
      },
    },
    airportSpecific: {
      airportBaseFare: 1199,
      airportPerKmRate: 18,
      airportExtraKmRate: 16,
      airportDriverAllowance: 350,
      airportParking: 0,
      airportPickupCharge: 0,
    },
  },

  'innova-crysta': {
    id: 'cfg_innova_crysta',
    vehicleId: 'innova-crysta',
    vehicleName: 'INNOVA CRYSTA',
    vehicleCategory: 'Innova Crysta',
    active: true,
    pricingVersion: 1,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-03-01T00:00:00.000Z',
    updatedBy: 'Administrator',
    effectiveFrom: '2026-01-01T00:00:00.000Z',
    roundingRule: 'NEAREST_10',
    mode: 'ADVANCED',
    nightConfig: {
      enabled: true,
      startHour: 22,
      endHour: 6,
      chargeType: 'PERCENTAGE',
      amount: 10,
    },
    pricingByBookingType: {
      ONE_WAY: {
        baseFare: 1000,
        perKmRate: 25,
        includedKm: 0,
        extraPerKmRate: 20,
        includedHours: 0,
        hourlyRate: 0,
        extraPerHourRate: 0,
        driverAllowance: 500,
        minimumKm: 10,
        minimumFare: 1400,
        pricingModel: 'BASE_PLUS_DISTANCE',
        timeRounding: 'BLOCK_30_MIN',
        tollPolicy: 'AT_ACTUALS',
        tollFixedAmount: 0,
        parkingPolicy: 'AT_ACTUALS',
        parkingFixedAmount: 0,
        permitPolicy: 'AT_ACTUALS',
        permitFixedAmount: 0,
        taxPercentage: 0,
      },
      ROUND_TRIP: {
        baseFare: 1000,
        perKmRate: 23,
        includedKm: 300,
        extraPerKmRate: 20,
        includedHours: 0,
        hourlyRate: 0,
        extraPerHourRate: 0,
        driverAllowance: 500,
        minimumKm: 300,
        minimumFare: 6900,
        pricingModel: 'DISTANCE_ONLY',
        timeRounding: 'BLOCK_1_HOUR',
        tollPolicy: 'AT_ACTUALS',
        tollFixedAmount: 0,
        parkingPolicy: 'AT_ACTUALS',
        parkingFixedAmount: 0,
        permitPolicy: 'AT_ACTUALS',
        permitFixedAmount: 0,
        taxPercentage: 0,
      },
      LOCAL: {
        baseFare: 1000,
        perKmRate: 25,
        includedKm: 80,
        extraPerKmRate: 20,
        includedHours: 8,
        hourlyRate: 500,
        extraPerHourRate: 300,
        driverAllowance: 500,
        minimumKm: 40,
        minimumFare: 3500,
        pricingModel: 'DISTANCE_AND_TIME',
        timeRounding: 'BLOCK_30_MIN',
        tollPolicy: 'AT_ACTUALS',
        tollFixedAmount: 0,
        parkingPolicy: 'AT_ACTUALS',
        parkingFixedAmount: 0,
        permitPolicy: 'AT_ACTUALS',
        permitFixedAmount: 0,
        taxPercentage: 0,
      },
      AIRPORT_TRANSFER: {
        baseFare: 1599,
        perKmRate: 25,
        includedKm: 0,
        extraPerKmRate: 22,
        includedHours: 0,
        hourlyRate: 0,
        extraPerHourRate: 0,
        driverAllowance: 500,
        minimumKm: 30,
        minimumFare: 2400,
        pricingModel: 'BASE_PLUS_DISTANCE',
        timeRounding: 'BLOCK_30_MIN',
        tollPolicy: 'AT_ACTUALS',
        tollFixedAmount: 0,
        parkingPolicy: 'AT_ACTUALS',
        parkingFixedAmount: 0,
        permitPolicy: 'AT_ACTUALS',
        permitFixedAmount: 0,
        taxPercentage: 0,
      },
      OUTSTATION: {
        baseFare: 1000,
        perKmRate: 25,
        includedKm: 300,
        extraPerKmRate: 22,
        includedHours: 0,
        hourlyRate: 0,
        extraPerHourRate: 0,
        driverAllowance: 500,
        minimumKm: 300,
        minimumFare: 7500,
        pricingModel: 'DISTANCE_ONLY',
        timeRounding: 'BLOCK_1_HOUR',
        tollPolicy: 'AT_ACTUALS',
        tollFixedAmount: 0,
        parkingPolicy: 'AT_ACTUALS',
        parkingFixedAmount: 0,
        permitPolicy: 'AT_ACTUALS',
        permitFixedAmount: 0,
        taxPercentage: 0,
      },
    },
    airportSpecific: {
      airportBaseFare: 1599,
      airportPerKmRate: 25,
      airportExtraKmRate: 22,
      airportDriverAllowance: 500,
      airportParking: 0,
      airportPickupCharge: 0,
    },
  },

  'tempo-traveller-12-1': {
    id: 'cfg_tempo_traveller_12_1',
    vehicleId: 'tempo-traveller-12-1',
    vehicleName: 'TEMPO TRAVELLER (12+1)',
    vehicleCategory: 'Tempo Traveller (12+1)',
    active: true,
    pricingVersion: 1,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-03-01T00:00:00.000Z',
    updatedBy: 'Administrator',
    effectiveFrom: '2026-01-01T00:00:00.000Z',
    roundingRule: 'NEAREST_10',
    mode: 'ADVANCED',
    nightConfig: {
      enabled: true,
      startHour: 22,
      endHour: 6,
      chargeType: 'PERCENTAGE',
      amount: 10,
    },
    pricingByBookingType: {
      ONE_WAY: {
        baseFare: 1000,
        perKmRate: 25,
        includedKm: 0,
        extraPerKmRate: 20,
        includedHours: 0,
        hourlyRate: 0,
        extraPerHourRate: 0,
        driverAllowance: 500,
        minimumKm: 10,
        minimumFare: 1800,
        pricingModel: 'BASE_PLUS_DISTANCE',
        timeRounding: 'BLOCK_30_MIN',
        tollPolicy: 'AT_ACTUALS',
        tollFixedAmount: 0,
        parkingPolicy: 'AT_ACTUALS',
        parkingFixedAmount: 0,
        permitPolicy: 'AT_ACTUALS',
        permitFixedAmount: 0,
        taxPercentage: 0,
      },
      ROUND_TRIP: {
        baseFare: 1200,
        perKmRate: 28,
        includedKm: 300,
        extraPerKmRate: 25,
        includedHours: 0,
        hourlyRate: 0,
        extraPerHourRate: 0,
        driverAllowance: 700,
        minimumKm: 300,
        minimumFare: 8400,
        pricingModel: 'DISTANCE_ONLY',
        timeRounding: 'BLOCK_1_HOUR',
        tollPolicy: 'AT_ACTUALS',
        tollFixedAmount: 0,
        parkingPolicy: 'AT_ACTUALS',
        parkingFixedAmount: 0,
        permitPolicy: 'AT_ACTUALS',
        permitFixedAmount: 0,
        taxPercentage: 0,
      },
      LOCAL: {
        baseFare: 1200,
        perKmRate: 30,
        includedKm: 80,
        extraPerKmRate: 25,
        includedHours: 8,
        hourlyRate: 600,
        extraPerHourRate: 400,
        driverAllowance: 700,
        minimumKm: 50,
        minimumFare: 4500,
        pricingModel: 'DISTANCE_AND_TIME',
        timeRounding: 'BLOCK_30_MIN',
        tollPolicy: 'AT_ACTUALS',
        tollFixedAmount: 0,
        parkingPolicy: 'AT_ACTUALS',
        parkingFixedAmount: 0,
        permitPolicy: 'AT_ACTUALS',
        permitFixedAmount: 0,
        taxPercentage: 0,
      },
      AIRPORT_TRANSFER: {
        baseFare: 2499,
        perKmRate: 30,
        includedKm: 0,
        extraPerKmRate: 26,
        includedHours: 0,
        hourlyRate: 0,
        extraPerHourRate: 0,
        driverAllowance: 600,
        minimumKm: 40,
        minimumFare: 3500,
        pricingModel: 'BASE_PLUS_DISTANCE',
        timeRounding: 'BLOCK_30_MIN',
        tollPolicy: 'AT_ACTUALS',
        tollFixedAmount: 0,
        parkingPolicy: 'AT_ACTUALS',
        parkingFixedAmount: 0,
        permitPolicy: 'AT_ACTUALS',
        permitFixedAmount: 0,
        taxPercentage: 0,
      },
      OUTSTATION: {
        baseFare: 1200,
        perKmRate: 28,
        includedKm: 300,
        extraPerKmRate: 25,
        includedHours: 0,
        hourlyRate: 0,
        extraPerHourRate: 0,
        driverAllowance: 700,
        minimumKm: 300,
        minimumFare: 8400,
        pricingModel: 'DISTANCE_ONLY',
        timeRounding: 'BLOCK_1_HOUR',
        tollPolicy: 'AT_ACTUALS',
        tollFixedAmount: 0,
        parkingPolicy: 'AT_ACTUALS',
        parkingFixedAmount: 0,
        permitPolicy: 'AT_ACTUALS',
        permitFixedAmount: 0,
        taxPercentage: 0,
      },
    },
    airportSpecific: {
      airportBaseFare: 2499,
      airportPerKmRate: 30,
      airportExtraKmRate: 26,
      airportDriverAllowance: 600,
      airportParking: 0,
      airportPickupCharge: 0,
    },
  },
};

// Backward compatibility aliases for lookups (non-enumerable so they do not appear in rate card tabs or Object.keys)
Object.defineProperty(DEFAULT_VEHICLE_CONFIGS, 'ertiga', {
  enumerable: false,
  configurable: true,
  get: () => DEFAULT_VEHICLE_CONFIGS['suv-6-1'],
});
Object.defineProperty(DEFAULT_VEHICLE_CONFIGS, 'toyota-etios', {
  enumerable: false,
  configurable: true,
  get: () => DEFAULT_VEHICLE_CONFIGS['sedan-4-1'],
});
Object.defineProperty(DEFAULT_VEHICLE_CONFIGS, 'swift-desire', {
  enumerable: false,
  configurable: true,
  get: () => DEFAULT_VEHICLE_CONFIGS['sedan-4-1'],
});
Object.defineProperty(DEFAULT_VEHICLE_CONFIGS, 'tempo-traveller-14-1', {
  enumerable: false,
  configurable: true,
  get: () => DEFAULT_VEHICLE_CONFIGS['tempo-traveller-12-1'],
});

/**
 * Apply time rounding based on configured policy
 */
export function roundDurationHours(hours: number, method: TimeRoundingMethod): number {
  if (hours <= 0) return 0;
  switch (method) {
    case 'EXACT':
      return Number(hours.toFixed(4));
    case 'BLOCK_30_MIN':
      return Math.ceil(hours * 2) / 2; // e.g. 2.1 -> 2.5
    case 'BLOCK_1_HOUR':
    case 'ROUND_UP':
      return Math.ceil(hours);
    case 'ROUND_DOWN':
      return Math.floor(hours);
    default:
      return Number(hours.toFixed(2));
  }
}

/**
 * Apply currency rounding based on configured rule
 */
export function applyFareRounding(amount: number, rule: RoundingRule): number {
  switch (rule) {
    case 'EXACT':
      return Math.round(amount * 100) / 100;
    case 'NEAREST_1':
      return Math.round(amount);
    case 'NEAREST_10':
      return Math.round(amount / 10) * 10;
    case 'NEAREST_50':
      return Math.round(amount / 50) * 50;
    default:
      return Math.round(amount);
  }
}

/**
 * Format duration minutes into readable string
 */
export function formatDurationText(mins: number): string {
  if (mins < 60) return `~${Math.round(mins)} min`;
  const h = Math.floor(mins / 60);
  const m = Math.round(mins % 60);
  return m === 0 ? `~${h} hr${h > 1 ? 's' : ''}` : `~${h} hr${h > 1 ? 's' : ''} ${m} min`;
}

/**
 * Check if pickup time falls in the configured night window
 */
export function isNightTime(pickupTimeStr?: string, startHour = 22, endHour = 6): boolean {
  if (!pickupTimeStr) return false;
  const match = pickupTimeStr.match(/(\d{1,2}):(\d{2})/);
  if (!match) return false;
  const hour = parseInt(match[1], 10);
  if (startHour > endHour) {
    // Crosses midnight, e.g. 22:00 to 06:00
    return hour >= startHour || hour < endHour;
  } else {
    return hour >= startHour && hour < endHour;
  }
}

/**
 * Helper to identify Mysore <-> Ooty corridor
 */
export function isMysoreOotyRoute(origin?: string, destination?: string): boolean {
  if (!origin || !destination) return false;
  const o = origin.toLowerCase();
  const d = destination.toLowerCase();
  const isMysore = (t: string) => t.includes('mysur') || t.includes('myso');
  const isOoty = (t: string) =>
    t.includes('ooty') || t.includes('udhagamandalam') || t.includes('nilgiri');
  return (isMysore(o) && isOoty(d)) || (isOoty(o) && isMysore(d));
}

/**
 * Centralized Dynamic Fare Calculation Engine
 * Strictly follows the 20-step execution order.
 */
export function calculateDynamicFare(input: DynamicFareCalculationInput): DynamicFareCalculationResult {
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
  } = input;

  // 1-5: Load vehicle configuration & apply distance rounding
  const vehicleConfig =
    customPricingConfig ||
    DEFAULT_VEHICLE_CONFIGS[vehicleId] ||
    (vehicleId === 'ertiga' || vehicleId === 'suv' ? DEFAULT_VEHICLE_CONFIGS['suv-6-1'] : undefined) ||
    DEFAULT_VEHICLE_CONFIGS['sedan-4-1'];

  const distanceRounding: DistanceRoundingRule =
    input.distanceRounding || vehicleConfig.distanceRounding || 'NEAREST_1';
  const distanceKm = applyDistanceRounding(Math.max(0, Number(rawDistanceKm.toFixed(2))), distanceRounding);
  const durationMinutes = Math.max(0, Math.round(rawDurationMinutes));
  const rawDurationHours = durationMinutes / 60;
  const durationFormatted = formatDurationText(durationMinutes);

  // State Detection & Route Classification
  const originState = input.originState || detectIndianState(origin, input.originDetails);
  const destinationState = input.destinationState || detectIndianState(destination, input.destinationDetails);
  const isInterState = originState.toLowerCase().trim() !== destinationState.toLowerCase().trim();
  const routeCategory: RouteCategory = isInterState ? 'INTER_STATE' : 'INTRA_STATE';

  // 6-7: Load pricing rule for booking type
  const pricingRule: VehicleBookingPricing =
    vehicleConfig.pricingByBookingType?.[bookingType] ||
    vehicleConfig.pricingByBookingType?.['ONE_WAY'] ||
    (DEFAULT_VEHICLE_CONFIGS['sedan-4-1'] || DEFAULT_VEHICLE_CONFIGS['toyota-etios']).pricingByBookingType.ONE_WAY;

  const pricingModel = pricingRule.pricingModel || 'BASE_PLUS_DISTANCE';
  const roundingRule = vehicleConfig.roundingRule || 'NEAREST_10';
  const timeRounding = pricingRule.timeRounding || 'BLOCK_30_MIN';

  const effectiveVehicleId = vehicleId || vehicleConfig.vehicleId;
  const isMysoreOotySedan =
    bookingType === 'ONE_WAY' &&
    (effectiveVehicleId === 'sedan-4-1' ||
      effectiveVehicleId === 'toyota-etios' ||
      effectiveVehicleId === 'swift-desire' ||
      vehicleConfig.vehicleCategory === 'Sedan') &&
    isMysoreOotyRoute(origin, destination);

  // 8: Apply Base Fare
  let baseFare = isMysoreOotySedan ? 0 : pricingRule.baseFare;
  if (bookingType === 'AIRPORT_TRANSFER' && vehicleConfig.airportSpecific?.airportBaseFare) {
    baseFare = vehicleConfig.airportSpecific.airportBaseFare;
  }

  // 9-11: Apply Included KM, Per KM, and Extra Per KM rules
  // Handle Round Trip daily multiplier
  let includedKm = pricingRule.includedKm;
  let billableKm = distanceKm;
  let distanceFare = 0;
  let extraDistanceFare = 0;
  let rtDailyMinKm: number | undefined = undefined;

  if (bookingType === 'ROUND_TRIP') {
    // For round trip: road distance is doubled, with daily minimum included
    const days = Math.max(1, roundTripDays);
    rtDailyMinKm = pricingRule.dailyMinimumKm || pricingRule.minimumKm || 300;
    const minIncluded = rtDailyMinKm * days;
    const actualRtKm = distanceKm * 2;
    billableKm = Math.max(actualRtKm, minIncluded);
    includedKm = minIncluded;

    const perKm = pricingRule.perKmRate;
    const extraRtKm = Math.max(0, actualRtKm - minIncluded);
    const extraRate =
      pricingRule.extraPerKmRate !== undefined && pricingRule.extraPerKmRate > 0
        ? pricingRule.extraPerKmRate
        : perKm;

    if (extraRtKm > 0) {
      distanceFare = minIncluded * perKm;
      extraDistanceFare = extraRtKm * extraRate;
    } else {
      distanceFare = minIncluded * perKm;
      extraDistanceFare = 0;
    }
  } else {
    // One-Way / Airport / Local / Outstation
    const perKmRate =
      bookingType === 'AIRPORT_TRANSFER' && vehicleConfig.airportSpecific?.airportPerKmRate
        ? vehicleConfig.airportSpecific.airportPerKmRate
        : pricingRule.perKmRate;
    const extraPerKmRate =
      bookingType === 'AIRPORT_TRANSFER' && vehicleConfig.airportSpecific?.airportExtraKmRate
        ? vehicleConfig.airportSpecific.airportExtraKmRate
        : pricingRule.extraPerKmRate;

    if (isMysoreOotySedan) {
      // Special Mysore <-> Ooty corridor: Minimum ₹2900 with 150 km limit
      includedKm = 150;
      baseFare = 0;
      distanceFare = 2900;
      billableKm = Math.max(distanceKm, 150);
      if (distanceKm > 150) {
        const extraKm = distanceKm - 150;
        extraDistanceFare = extraKm * (pricingRule.extraPerKmRate || 13);
      }
    } else {
      const minKm = pricingRule.minimumKm || 0;
      billableKm = Math.max(distanceKm, minKm);
      const kmThreshold = includedKm > 0 ? includedKm : minKm;

      if (kmThreshold > 0 && billableKm > kmThreshold && (extraPerKmRate || 0) > 0) {
        distanceFare = kmThreshold * perKmRate;
        const extraKm = billableKm - kmThreshold;
        extraDistanceFare = extraKm * extraPerKmRate;
      } else {
        distanceFare = billableKm * perKmRate;
      }
    }
  }

  // 12-14: Apply duration & hourly pricing based on PricingModel
  // Only charge duration if pricing model includes TIME and booking type is LOCAL
  const chargesDuration =
    bookingType === 'LOCAL' &&
    (pricingModel === 'TIME_ONLY' ||
      pricingModel === 'DISTANCE_AND_TIME' ||
      pricingModel === 'BASE_PLUS_TIME');

  const roundedDurationHours = roundDurationHours(rawDurationHours, timeRounding);
  let hourlyFare = 0;
  let extraHourFare = 0;
  let billableHours = 0;
  const includedHours = pricingRule.includedHours;

  if (chargesDuration) {
    const minHours = pricingRule.minimumHours || 0;
    billableHours = Math.max(roundedDurationHours, minHours);
    const hourlyRate = pricingRule.hourlyRate;
    const extraPerHourRate = pricingRule.extraPerHourRate;
    const hourThreshold = includedHours > 0 ? includedHours : minHours;

    if (hourThreshold > 0 && billableHours > hourThreshold && (extraPerHourRate || 0) > 0) {
      hourlyFare = hourThreshold * hourlyRate;
      const extraHours = billableHours - hourThreshold;
      extraHourFare = extraHours * extraPerHourRate;
    } else {
      hourlyFare = billableHours * hourlyRate;
    }
  }

  // 15: Apply Driver Allowance
  let driverAllowance = pricingRule.driverAllowance;
  if (isMysoreOotySedan) {
    driverAllowance = 0; // Chauffeur allowance already incorporated into flat ₹2900 package
  } else if (bookingType === 'ROUND_TRIP') {
    const days = Math.max(1, roundTripDays);
    driverAllowance = pricingRule.driverAllowance * days;
  } else if (bookingType === 'AIRPORT_TRANSFER' && vehicleConfig.airportSpecific?.airportDriverAllowance !== undefined) {
    driverAllowance = vehicleConfig.airportSpecific.airportDriverAllowance;
  }

  // 16: Night Charge
  let nightCharge = 0;
  const nightCfg = vehicleConfig.nightConfig;
  if (nightCfg && nightCfg.enabled && isNightTime(pickupTime, nightCfg.startHour, nightCfg.endHour)) {
    if (nightCfg.chargeType === 'FIXED') {
      nightCharge = nightCfg.amount;
    } else if (nightCfg.chargeType === 'PER_KM') {
      nightCharge = distanceKm * nightCfg.amount;
    } else if (nightCfg.chargeType === 'PERCENTAGE') {
      const baseSubtotal = baseFare + distanceFare + extraDistanceFare + hourlyFare + extraHourFare;
      nightCharge = Math.round(baseSubtotal * (nightCfg.amount / 100));
    }
  }

  // 17: Additional Charges (Toll, Parking, Permit, Taxes)
  let tolls = 0;
  if (pricingRule.tollPolicy === 'FIXED_ESTIMATE') {
    tolls = pricingRule.tollFixedAmount || 0;
  }

  let parking = 0;
  if (pricingRule.parkingPolicy === 'FIXED_ESTIMATE') {
    parking = pricingRule.parkingFixedAmount || 0;
  }
  if (bookingType === 'AIRPORT_TRANSFER' && vehicleConfig.airportSpecific?.airportParking) {
    parking += vehicleConfig.airportSpecific.airportParking;
  }

  let permits = 0;
  if (pricingRule.permitPolicy === 'FIXED_ESTIMATE') {
    permits = pricingRule.permitFixedAmount || 0;
  }

  // Intermediate via stops charge
  let viaStopsCharge = 0;
  if (viaStopsCount > 0) {
    viaStopsCharge = viaStopsCount * 150;
  }

  // 17b: Dedicated INTER-STATE calculation (EXCLUSIVELY for ONE WAY bookings)
  let interStateCharge = 0;
  let interStateAppliedRule = isInterState ? 'Inter-State Border Crossing' : 'Intra-State (Same State)';
  let interStateRate = 0;

  if (bookingType === 'ONE_WAY') {
    if (isInterState && !isMysoreOotySedan) {
      // 1. Check active State-Pair Rule first (Highest Priority)
      const statePairRules = input.statePairRules || DEFAULT_STATE_PAIR_RULES;
      const matchedPair = statePairRules.find(
        (r) =>
          r.active !== false &&
          r.fromState.toLowerCase().trim() === originState.toLowerCase().trim() &&
          r.toState.toLowerCase().trim() === destinationState.toLowerCase().trim()
      );

      const vehiclePairRate =
        matchedPair?.ratesByVehicle?.[effectiveVehicleId] ??
        matchedPair?.ratesByVehicle?.[vehicleId] ??
        matchedPair?.ratesByVehicle?.['sedan-4-1'];

      if (matchedPair && typeof vehiclePairRate === 'number' && vehiclePairRate > 0) {
        interStateCharge = vehiclePairRate;
        interStateRate = vehiclePairRate;
        interStateAppliedRule = `${matchedPair.fromState} → ${matchedPair.toState} (State-Pair Rule: ₹${vehiclePairRate})`;
      } else {
        // 2. Check Vehicle-Specific Inter-State Rule
        const mode = pricingRule.interStatePricingMode || vehicleConfig.interStatePricingMode || 'FLAT';
        if (mode === 'PER_KM') {
          const perKm = pricingRule.interStatePerKmRate ?? vehicleConfig.interStatePerKmRate ?? 3;
          interStateCharge = Math.round(distanceKm * perKm);
          interStateRate = perKm;
          interStateAppliedRule = `Vehicle Inter-State Rate (₹${perKm}/km @ ${distanceKm} km)`;
        } else {
          // Default FLAT
          const flat = pricingRule.interStateCharge ?? vehicleConfig.interStateCharge ?? 500;
          interStateCharge = flat;
          interStateRate = flat;
          interStateAppliedRule = `Vehicle Inter-State ONE WAY Rule (${vehicleConfig.vehicleName} - ₹${flat})`;
        }
      }
    } else if (isMysoreOotySedan) {
      // Mysore-Ooty Sedan package already has state crossing incorporated
      interStateCharge = 0;
      interStateAppliedRule = 'Incorporated into Mysore-Ooty ₹2900 Fixed Package';
    } else {
      // Intra-State
      interStateCharge = 0;
      interStateAppliedRule = 'Intra-State (Same State - ₹0)';
    }
  } else {
    // Non-ONE_WAY booking types (ROUND_TRIP, LOCAL, AIRPORT_TRANSFER, OUTSTATION)
    // The INTER-STATE column/rule is strictly NOT used or applied.
    interStateCharge = 0;
    interStateAppliedRule = 'Not Applicable (ONE WAY Only)';
  }

  // Calculate pre-tax subtotal based on selected pricingModel
  let coreFare = 0;
  switch (pricingModel) {
    case 'DISTANCE_ONLY':
      coreFare = distanceFare + extraDistanceFare;
      break;
    case 'TIME_ONLY':
      coreFare = hourlyFare + extraHourFare;
      break;
    case 'BASE_PLUS_DISTANCE':
      coreFare = baseFare + distanceFare + extraDistanceFare;
      break;
    case 'BASE_PLUS_TIME':
      coreFare = baseFare + hourlyFare + extraHourFare;
      break;
    case 'DISTANCE_AND_TIME':
    default:
      coreFare = baseFare + distanceFare + extraDistanceFare + hourlyFare + extraHourFare;
      break;
  }

  const subtotalBeforeMin =
    coreFare +
    driverAllowance +
    interStateCharge +
    nightCharge +
    tolls +
    parking +
    permits +
    viaStopsCharge;

  // 17c: Apply Configured Discount (Percentage or Fixed)
  let discountAmount = 0;
  let discountLabel = '';
  const discountType = pricingRule.discountType || 'NONE';
  const discountValue = pricingRule.discountValue || 0;

  if (discountType === 'PERCENTAGE' && discountValue > 0) {
    discountAmount = Math.round(subtotalBeforeMin * (discountValue / 100));
    discountLabel = `${discountValue}% Promotional Discount`;
  } else if (discountType === 'FIXED' && discountValue > 0) {
    discountAmount = Math.min(subtotalBeforeMin, discountValue);
    discountLabel = `₹${discountValue} Instant Discount`;
  }

  const subtotalAfterDiscount = Math.max(0, subtotalBeforeMin - discountAmount);

  // 18: Apply Minimum Fare constraint
  let minimumFareApplied = false;
  let runningTotal = subtotalAfterDiscount;
  const minFare = isMysoreOotySedan ? 2900 : (pricingRule.minimumFare || 0);
  if (runningTotal < minFare) {
    runningTotal = minFare;
    minimumFareApplied = true;
  }

  // Apply taxes if configured
  let taxes = 0;
  if (pricingRule.taxPercentage > 0) {
    taxes = Math.round(runningTotal * (pricingRule.taxPercentage / 100));
    runningTotal += taxes;
  }

  const unroundedFare = runningTotal;

  // 19: Apply Rounding rule
  const totalFare = applyFareRounding(unroundedFare, roundingRule);

  // 20: Transparent customer breakdown (private internal formulas hidden from customer view)
  const breakdown: Array<{ label: string; amount: number; detail?: string }> = [];

  if (isMysoreOotySedan) {
    breakdown.push({
      label: 'Mysore ⇄ Ooty Sedan Special Minimum Fare (150 km limit)',
      amount: 2900,
      detail: 'Includes 150 km road journey, fuel, and chauffeur allowance',
    });
    if (extraDistanceFare > 0) {
      const extraKm = Math.max(0, distanceKm - 150);
      breakdown.push({
        label: `Extra Distance (${extraKm.toFixed(1)} km @ ₹${pricingRule.extraPerKmRate || 13}/km)`,
        amount: Math.round(extraDistanceFare),
      });
    }
  } else {
    if (baseFare > 0 && (pricingModel === 'BASE_PLUS_DISTANCE' || pricingModel === 'BASE_PLUS_TIME' || pricingModel === 'DISTANCE_AND_TIME')) {
      breakdown.push({
        label: `Base Fare (${vehicleConfig.vehicleName})`,
        amount: Math.round(baseFare),
      });
    }

    if (bookingType === 'ROUND_TRIP') {
      const days = Math.max(1, roundTripDays);
      const actualRtKm = distanceKm * 2;
      const extraRtKm = Math.max(0, actualRtKm - includedKm);
      const extraRate =
        pricingRule.extraPerKmRate !== undefined && pricingRule.extraPerKmRate > 0
          ? pricingRule.extraPerKmRate
          : pricingRule.perKmRate;

      if (extraRtKm > 0) {
        breakdown.push({
          label: `Base Minimum Distance (${includedKm} km [${rtDailyMinKm || 300} km/day x ${days} Day${days > 1 ? 's' : ''}] @ ₹${pricingRule.perKmRate}/km)`,
          amount: Math.round(distanceFare),
        });
        breakdown.push({
          label: `Extra Distance (${Math.round(extraRtKm)} km @ ₹${extraRate}/km)`,
          amount: Math.round(extraDistanceFare),
        });
      } else {
        breakdown.push({
          label: `Round Trip Road Distance (${Math.round(billableKm)} km billed · ${days} Day${days > 1 ? 's' : ''} @ ₹${pricingRule.perKmRate}/km)`,
          amount: Math.round(distanceFare),
          detail: `Min. ${rtDailyMinKm || 300} km/day included (${includedKm} km total)`,
        });
      }
    } else if (distanceFare > 0) {
      const kmLabel = includedKm > 0 ? `${includedKm} km included` : `${distanceKm} km`;
      breakdown.push({
        label: `Distance Charge (${kmLabel})`,
        amount: Math.round(distanceFare),
      });
    }

    if (bookingType !== 'ROUND_TRIP' && extraDistanceFare > 0) {
      const extraKm = Math.max(0, distanceKm - includedKm);
      breakdown.push({
        label: `Extra Distance (${extraKm.toFixed(1)} km)`,
        amount: Math.round(extraDistanceFare),
      });
    }
  }

  if (hourlyFare > 0) {
    breakdown.push({
      label: `Duration Charge (${billableHours} hrs)`,
      amount: Math.round(hourlyFare),
    });
  }

  if (extraHourFare > 0) {
    const extraH = Math.max(0, billableHours - includedHours);
    breakdown.push({
      label: `Extra Hours (${extraH} hrs)`,
      amount: Math.round(extraHourFare),
    });
  }

  if (driverAllowance > 0) {
    const label =
      bookingType === 'ROUND_TRIP'
        ? `Driver Allowance (${roundTripDays} Day${roundTripDays > 1 ? 's' : ''})`
        : `Driver Allowance (Bata)`;
    breakdown.push({
      label,
      amount: Math.round(driverAllowance),
    });
  }

  if (nightCharge > 0) {
    breakdown.push({
      label: `Night Travel Surcharge (${nightCfg.startHour}:00 - 0${nightCfg.endHour}:00)`,
      amount: Math.round(nightCharge),
    });
  }

  if (tolls > 0) {
    breakdown.push({
      label: `Estimated Tolls (${pricingRule.tollPolicy === 'FIXED_ESTIMATE' ? 'Fixed' : 'Standard'})`,
      amount: Math.round(tolls),
    });
  }

  if (parking > 0) {
    breakdown.push({
      label: `Parking Charge`,
      amount: Math.round(parking),
    });
  }

  if (permits > 0) {
    breakdown.push({
      label: `Interstate / Special Permit`,
      amount: Math.round(permits),
    });
  }

  if (interStateCharge > 0) {
    breakdown.push({
      label: 'Inter-State Border Crossing Charge (ONE WAY Only)',
      amount: Math.round(interStateCharge),
      detail: `${originState} ➔ ${destinationState} • ${interStateAppliedRule}`,
    });
  }

  if (viaStopsCharge > 0) {
    breakdown.push({
      label: `Via Stops (${viaStopsCount} stops)`,
      amount: Math.round(viaStopsCharge),
    });
  }

  if (discountAmount > 0) {
    breakdown.push({
      label: discountLabel,
      amount: -discountAmount,
      detail: `Discount deducted from gross fare`,
    });
  }

  if (taxes > 0) {
    breakdown.push({
      label: `GST (${pricingRule.taxPercentage}%)`,
      amount: Math.round(taxes),
    });
  }

  if (minimumFareApplied) {
    breakdown.push({
      label: `Minimum Fare Adjustment`,
      amount: Math.max(0, totalFare - subtotalAfterDiscount),
    });
  }

  const timestamp = new Date().toISOString();

  // Immutable audit snapshot for confirmed bookings
  const fareSnapshot: FareSnapshot = {
    vehicleId: vehicleConfig.vehicleId,
    vehicleType: vehicleConfig.vehicleName,
    baseFare,
    perKmRate: pricingRule.perKmRate,
    includedKm,
    extraPerKmRate: pricingRule.extraPerKmRate,
    includedHours,
    hourlyRate: pricingRule.hourlyRate,
    extraPerHourRate: pricingRule.extraPerHourRate,
    driverAllowance,
    distanceKm: bookingType === 'ROUND_TRIP' ? distanceKm * 2 : distanceKm,
    durationMinutes: bookingType === 'ROUND_TRIP' ? durationMinutes * 2 : durationMinutes,
    durationHours:
      bookingType === 'ROUND_TRIP'
        ? Number((rawDurationHours * 2).toFixed(2))
        : Number(rawDurationHours.toFixed(2)),
    routeCategory,
    originState,
    destinationState,
    interStateCharge: Math.round(interStateCharge),
    interStateRate,
    interStateAppliedRule,
    additionalCharges: Math.round(nightCharge + tolls + parking + permits + taxes + viaStopsCharge + interStateCharge),
    subtotal: Math.round(subtotalBeforeMin),
    discountType: discountType !== 'NONE' ? discountType : undefined,
    discountValue: discountValue > 0 ? discountValue : undefined,
    discountAmount: discountAmount > 0 ? discountAmount : undefined,
    originalFare: Math.round(subtotalBeforeMin),
    roundingAdjustment: Math.round(totalFare - unroundedFare),
    totalFare,
    pricingVersion: vehicleConfig.pricingVersion,
    currency: 'INR',
    timestamp,
    pricingModel,
    roundTripDays: bookingType === 'ROUND_TRIP' ? roundTripDays : undefined,
    dailyMinimumKm: rtDailyMinKm,
  };

  return {
    distanceKm: bookingType === 'ROUND_TRIP' ? distanceKm * 2 : distanceKm,
    durationMinutes: bookingType === 'ROUND_TRIP' ? durationMinutes * 2 : durationMinutes,
    durationHours:
      bookingType === 'ROUND_TRIP'
        ? Number((rawDurationHours * 2).toFixed(2))
        : Number(rawDurationHours.toFixed(2)),
    durationFormatted,
    vehicleId: vehicleConfig.vehicleId,
    vehicleName: vehicleConfig.vehicleName,
    vehicleCategory: vehicleConfig.vehicleCategory,
    pricingVersion: vehicleConfig.pricingVersion,
    pricingModel,
    baseFare,
    includedKm,
    billableKm,
    distanceFare: Math.round(distanceFare),
    extraDistanceFare: Math.round(extraDistanceFare),
    includedHours,
    billableHours,
    hourlyFare: Math.round(hourlyFare),
    extraHourFare: Math.round(extraHourFare),
    driverAllowance: Math.round(driverAllowance),
    routeCategory,
    originState,
    destinationState,
    isInterState,
    interStateCharge: Math.round(interStateCharge),
    interStateAppliedRule,
    distanceRoundingApplied: distanceRounding,
    nightCharge: Math.round(nightCharge),
    taxes: Math.round(taxes),
    tolls: Math.round(tolls),
    parking: Math.round(parking),
    permits: Math.round(permits),
    additionalCharges: Math.round(nightCharge + tolls + parking + permits + taxes + viaStopsCharge + interStateCharge),
    subtotal: Math.round(subtotalBeforeMin),
    discountType: discountType !== 'NONE' ? discountType : undefined,
    discountValue: discountValue > 0 ? discountValue : undefined,
    discountAmount: discountAmount > 0 ? discountAmount : undefined,
    discountLabel: discountLabel || undefined,
    originalFare: Math.round(subtotalBeforeMin),
    minimumFareApplied,
    unroundedFare,
    roundingAdjustment: Math.round(totalFare - unroundedFare),
    totalFare,
    currency: 'INR',
    fareBreakdown: breakdown,
    timestamp,
    fareSnapshot,
    roundTripDays: bookingType === 'ROUND_TRIP' ? roundTripDays : undefined,
    dailyMinimumKm: rtDailyMinKm,
  };
}
