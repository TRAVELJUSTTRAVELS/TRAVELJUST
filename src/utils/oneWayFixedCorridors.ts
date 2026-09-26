import { BookingSearchState, PlaceSuggestion, Vehicle, FareEstimate } from '../types';
import { OneWayCorridorId, OneWayFixedCorridorConfig } from '../types/fareEngine';
import { DEFAULT_ONE_WAY_FIXED_CORRIDORS } from './centralFareEngine';
import { fareService } from '../services/fareService';

export type { OneWayCorridorId, OneWayFixedCorridorConfig };

/**
 * Returns the active corridor configuration from central fare settings or default baseline
 */
export function getOneWayCorridorConfig(corridorId: OneWayCorridorId): OneWayFixedCorridorConfig {
  try {
    const centralized = fareService.getCentralizedConfigSync();
    if (centralized && centralized.fixedCorridors && centralized.fixedCorridors[corridorId]) {
      return centralized.fixedCorridors[corridorId];
    }
  } catch (e) {
    // fallback to static default
  }
  return DEFAULT_ONE_WAY_FIXED_CORRIDORS[corridorId];
}

/**
 * Normalizes and checks if a location string or place object refers strictly to Mysuru / Mysore
 * Prevents false positives with outstation destinations or other cities.
 */
export function isMysuruRegion(locationStr?: string, placeObj?: PlaceSuggestion | null): boolean {
  const combined = `${locationStr || ''} ${placeObj?.placeName || ''} ${placeObj?.areaLocality || ''} ${placeObj?.city || ''} ${placeObj?.formattedAddress || ''}`.toLowerCase();
  
  if (!combined.trim()) return false;

  // Strict Exclusions: Destination cannot be another major city or hill station
  const nonMysuruExclusions = [
    'ooty',
    'udhagamandalam',
    'coorg',
    'madikeri',
    'kodagu',
    'wayanad',
    'chikmagalur',
    'chikkamagaluru',
    'kodaikanal',
    'munnar',
    'mangalore',
    'mangaluru',
    'goa',
    'hassan',
    'shivamogga',
    'shimoga',
  ];

  for (const excl of nonMysuruExclusions) {
    if (combined.includes(excl)) {
      return false;
    }
  }

  // Explicit check for Mysuru / Mysore landmarks or region
  return (
    combined.includes('mysuru') ||
    combined.includes('mysore') ||
    combined.includes('mandakalli') ||
    combined.includes('chamundi') ||
    combined.includes('kuvempunagar') ||
    combined.includes('vijayanagar mysuru') ||
    combined.includes('gokulam') ||
    combined.includes('jayalakshmipuram') ||
    combined.includes('saraswathipuram') ||
    combined.includes('bannimantap') ||
    combined.includes('siddhartha nagar') ||
    combined.includes('srirangapatna')
  );
}

/**
 * Normalizes and checks if a location string or place object refers strictly to Kempegowda International Airport (BLR T1 / T2)
 */
export function isKempegowdaAirportRegion(locationStr?: string, placeObj?: PlaceSuggestion | null): boolean {
  const combined = `${locationStr || ''} ${placeObj?.placeName || ''} ${placeObj?.areaLocality || ''} ${placeObj?.city || ''} ${placeObj?.formattedAddress || ''} ${placeObj?.landmark || ''}`.toLowerCase();

  if (!combined.trim()) return false;

  // Strict Exclusions
  const nonAirportExclusions = [
    'ooty',
    'udhagamandalam',
    'coorg',
    'madikeri',
    'kodagu',
    'wayanad',
    'chikmagalur',
    'chikkamagaluru',
    'kodaikanal',
    'munnar',
    'mangalore',
    'mysuru',
    'mysore',
  ];

  for (const excl of nonAirportExclusions) {
    if (combined.includes(excl)) {
      return false;
    }
  }

  // Direct airport placeId check
  if (
    placeObj?.placeId === 'loc_kial_t1' ||
    placeObj?.placeId === 'loc_kial_t2' ||
    placeObj?.placeId === 'loc_airport_blr'
  ) {
    return true;
  }

  // Keywords for Kempegowda International Airport Terminal 1 & 2
  const airportKeywords = [
    'kempegowda',
    'kial',
    'blr t1',
    'blr t2',
    'terminal 1',
    'terminal 2',
    'terminal-1',
    'terminal-2',
    'blr airport',
    'bangalore airport',
    'bengaluru airport',
    'kia airport',
    'devanahalli airport',
    'kia t1',
    'kia t2',
  ];

  return airportKeywords.some((keyword) => combined.includes(keyword));
}

/**
 * Normalizes and checks if a location string or place object refers strictly to Bengaluru City (excluding Kempegowda Airport)
 */
export function isBengaluruCityRegion(locationStr?: string, placeObj?: PlaceSuggestion | null): boolean {
  // If it's the Airport, it routes to Corridor 1 (Airport), not Corridor 2 (City)
  if (isKempegowdaAirportRegion(locationStr, placeObj)) {
    return false;
  }

  const combined = `${locationStr || ''} ${placeObj?.placeName || ''} ${placeObj?.areaLocality || ''} ${placeObj?.city || ''} ${placeObj?.formattedAddress || ''}`.toLowerCase();

  if (!combined.trim()) return false;

  // Strict Exclusions: Destination cannot be outside Bengaluru City Limits
  const outstationExclusions = [
    'ooty',
    'udhagamandalam',
    'coorg',
    'madikeri',
    'kodagu',
    'wayanad',
    'chikmagalur',
    'chikkamagaluru',
    'kodaikanal',
    'munnar',
    'mangalore',
    'mangaluru',
    'goa',
    'hassan',
    'mysuru',
    'mysore',
    'kabini',
    'bandipur',
    'nagarhole',
  ];

  for (const excl of outstationExclusions) {
    if (combined.includes(excl)) {
      return false;
    }
  }

  const bengaluruKeywords = [
    'bengaluru city',
    'bangalore city',
    'bengaluru',
    'bangalore',
    'kengeri',
    'majestic',
    'ksr bengaluru',
    'electronic city',
    'whitefield',
    'koramangala',
    'indiranagar',
    'jayanagar',
    'jp nagar',
    'banashankari',
    'hsr layout',
    'btm layout',
    'rajajinagar',
    'malleshwaram',
    'marathahalli',
    'bellandur',
    'yesvantpur',
    'yelahanka',
    'mg road',
    'cubbon park',
    'shivajinagar',
    'rajarajeshwari nagar',
    'rr nagar',
  ];

  return bengaluruKeywords.some((keyword) => combined.includes(keyword));
}

export interface MatchedOneWayCorridor {
  corridor: OneWayFixedCorridorConfig;
  direction: 'MYSURU_TO_DEST' | 'DEST_TO_MYSURU';
  directionLabel: string;
}

/**
 * Checks if a search state is eligible for ONE-WAY Fixed Price Corridors
 * STRICT PRIORITY RULE:
 * 1. Booking type MUST be ONE_WAY (search.serviceType === 'oneway')
 * 2. Only exact configured corridors match:
 *    - Corridor 1: Mysuru ⇄ Kempegowda International Airport (T1 / T2)
 *    - Corridor 2: Mysuru ⇄ Bengaluru City (~149 km limit)
 * 3. Bidirectional matching respected based on admin setting
 * 4. All other destinations (Ooty, Coorg, Wayanad, etc.) return null
 */
export function matchOneWayFixedCorridor(search: BookingSearchState): MatchedOneWayCorridor | null {
  if (search.serviceType !== 'oneway') {
    return null;
  }

  const pickup = search.pickupLocation || '';
  const drop = search.dropLocation || '';
  const pickupObj = search.pickupLocationObj;
  const dropObj = search.dropLocationObj;

  const pickupIsMysuru = isMysuruRegion(pickup, pickupObj);
  const dropIsMysuru = isMysuruRegion(drop, dropObj);

  const pickupIsAirport = isKempegowdaAirportRegion(pickup, pickupObj);
  const dropIsAirport = isKempegowdaAirportRegion(drop, dropObj);

  const pickupIsBengaluru = isBengaluruCityRegion(pickup, pickupObj);
  const dropIsBengaluru = isBengaluruCityRegion(drop, dropObj);

  // Retrieve current active corridor configurations
  const corridor1 = getOneWayCorridorConfig('MYSURU_KIA_AIRPORT');
  const corridor2 = getOneWayCorridorConfig('MYSURU_BENGALURU_CITY');

  // CORRIDOR 1: Mysuru ⇄ Kempegowda International Airport (Terminal 1 / Terminal 2)
  if (corridor1.active !== false) {
    if (pickupIsMysuru && dropIsAirport) {
      return {
        corridor: corridor1,
        direction: 'MYSURU_TO_DEST',
        directionLabel: 'Mysuru to Kempegowda International Airport (Terminal 1 / Terminal 2)',
      };
    }
    if (pickupIsAirport && dropIsMysuru && corridor1.bidirectional !== false) {
      return {
        corridor: corridor1,
        direction: 'DEST_TO_MYSURU',
        directionLabel: 'Kempegowda International Airport (Terminal 1 / Terminal 2) to Mysuru',
      };
    }
  }

  // CORRIDOR 2: Mysuru ⇄ Bengaluru City (~149 km limit)
  if (corridor2.active !== false) {
    if (pickupIsMysuru && dropIsBengaluru) {
      return {
        corridor: corridor2,
        direction: 'MYSURU_TO_DEST',
        directionLabel: 'Mysuru to Bengaluru City (DISTANCE ~149 km limit)',
      };
    }
    if (pickupIsBengaluru && dropIsMysuru && corridor2.bidirectional !== false) {
      return {
        corridor: corridor2,
        direction: 'DEST_TO_MYSURU',
        directionLabel: 'Bengaluru City to Mysuru (DISTANCE ~149 km limit)',
      };
    }
  }

  // Does NOT match Corridor 1 or Corridor 2 -> Proceed to normal ONE-WAY fare engine
  return null;
}

/**
 * Calculates the exact fixed price for the matched ONE-WAY corridor
 * Without comparing or running dynamic fare calculation formulas
 */
export function calculateOneWayFixedFare(
  matched: MatchedOneWayCorridor,
  vehicle: Vehicle,
  _search: BookingSearchState
): FareEstimate {
  const { corridor, directionLabel } = matched;
  const vId = vehicle.id;

  // Resolve fixed rate by vehicle ID
  let fixedPrice = corridor.rates[vId as keyof typeof corridor.rates];

  if (!fixedPrice || typeof fixedPrice !== 'number') {
    if (vId.includes('crysta')) {
      fixedPrice = corridor.rates['innova-crysta'] || (corridor.id === 'MYSURU_KIA_AIRPORT' ? 4610 : 4119);
    } else if (vId.includes('innova')) {
      fixedPrice = corridor.rates['innova'] || (corridor.id === 'MYSURU_KIA_AIRPORT' ? 4299 : 3799);
    } else if (vId.includes('suv') || vId.includes('ertiga')) {
      fixedPrice = corridor.rates['suv-6-1'] || (corridor.id === 'MYSURU_KIA_AIRPORT' ? 3910 : 3519);
    } else {
      fixedPrice = corridor.rates['sedan-4-1'] || (corridor.id === 'MYSURU_KIA_AIRPORT' ? 2899 : 2599);
    }
  }

  const distanceKm = corridor.referenceDistanceKm || (corridor.id === 'MYSURU_KIA_AIRPORT' ? 182 : 149);
  const durationHours = corridor.durationHours || (corridor.id === 'MYSURU_KIA_AIRPORT' ? 3.5 : 2.5);

  const breakdown = [
    {
      label: `Fixed One-Way Corridor Fare (${directionLabel})`,
      amount: fixedPrice,
    },
    {
      label: `Included Highway Distance (${corridor.distanceLabel || `~${distanceKm} km`})`,
      amount: 0,
    },
    {
      label: 'Driver Allowance & Highway Service Surcharge',
      amount: 0,
    },
    {
      label: 'Guaranteed Fixed Rate (No Fare Engine Comparison)',
      amount: 0,
    },
  ];

  return {
    estimatedDistanceKm: distanceKm,
    exactDistanceKm: distanceKm,
    estimatedDurationHours: durationHours,
    baseFareAmount: fixedPrice,
    distanceFareAmount: 0,
    durationFareAmount: 0,
    driverAllowanceAmount: 0,
    passengerSurchargeAmount: 0,
    airportSurchargeAmount: 0,
    totalEstimatedFare: fixedPrice,
    originalFare: undefined,
    includedMinKm: distanceKm,
    isValid: true,
    isFixedPrice: true,
    fixedRouteName: corridor.corridorName,
    pricingModel: 'ONE_WAY_FIXED_CORRIDOR',
    breakdown,
    fareSnapshot: {
      vehicleId: vehicle.id,
      vehicleType: vehicle.name,
      pricingVersion: 1,
      pricingModel: 'ONE_WAY_FIXED_CORRIDOR',
      baseFare: fixedPrice,
      perKmRate: 0,
      extraPerKmRate: 13,
      includedKm: distanceKm,
      includedHours: durationHours,
      hourlyRate: 0,
      extraPerHourRate: 0,
      driverAllowance: 0,
      distanceKm,
      durationMinutes: durationHours * 60,
      durationHours,
      additionalCharges: 0,
      totalFare: fixedPrice,
      currency: 'INR',
      timestamp: new Date().toISOString(),
      originState: 'Karnataka',
      destinationState: 'Karnataka',
    },
  };
}
