import { BookingTypeCategory } from '../../types/dynamicPricing';
import { serverPricingStore } from './pricingStore';

export interface TestCaseResult {
  testId: string;
  category: 'Local' | 'One Way' | 'Interstate One Way' | 'Airport Transfer' | 'Round Trip' | 'Vehicle' | 'Failure Cases';
  title: string;
  input: any;
  passed: boolean;
  expected: string;
  actual: string;
  details?: any;
  durationMs: number;
}

export interface TestSuiteSummary {
  total: number;
  passed: number;
  failed: number;
  passRate: number;
  durationMs: number;
  timestamp: string;
  results: TestCaseResult[];
}

/**
 * Section 38 Automated Test Suite for TRAVEL JUST 2-in-1 Dynamic Fare Engine
 */
export function runFareEngineTestSuite(): TestSuiteSummary {
  const startTime = Date.now();
  const results: TestCaseResult[] = [];

  const addTest = (
    testId: string,
    category: TestCaseResult['category'],
    title: string,
    input: any,
    assertion: () => { passed: boolean; expected: string; actual: string; details?: any }
  ) => {
    const t0 = Date.now();
    try {
      const outcome = assertion();
      results.push({
        testId,
        category,
        title,
        input,
        passed: outcome.passed,
        expected: outcome.expected,
        actual: outcome.actual,
        details: outcome.details,
        durationMs: Date.now() - t0,
      });
    } catch (err: any) {
      results.push({
        testId,
        category,
        title,
        input,
        passed: false,
        expected: 'Successful execution without exception',
        actual: `Threw error: ${err?.message || String(err)}`,
        durationMs: Date.now() - t0,
      });
    }
  };

  // ==========================================
  // 1. LOCAL TESTS
  // ==========================================
  addTest('LOC_01', 'Local', 'Short Local Booking (40 km / 4 hrs)', { distanceKm: 35, durationMinutes: 200 }, () => {
    const res = serverPricingStore.calculateAuthoritativeFare({
      origin: 'Mysore Palace, Mysuru',
      destination: 'Chamundi Hill, Mysuru',
      distanceKm: 35,
      durationMinutes: 200,
      bookingType: 'LOCAL',
      vehicleId: 'sedan-4-1',
    });
    const passed = res.totalFare >= 1500 && res.routeCategory === 'INTRA_STATE';
    return {
      passed,
      expected: 'Fare >= ₹1,500 with INTRA_STATE classification',
      actual: `₹${res.totalFare} (${res.routeCategory})`,
      details: res.fareBreakdown,
    };
  });

  addTest('LOC_02', 'Local', 'Hourly Package (80 km / 8 hrs Standard)', { distanceKm: 75, durationMinutes: 480 }, () => {
    const res = serverPricingStore.calculateAuthoritativeFare({
      origin: 'Mysuru City Center',
      destination: 'Brindavan Gardens, KRS',
      distanceKm: 75,
      durationMinutes: 480,
      bookingType: 'LOCAL',
      vehicleId: 'sedan-4-1',
    });
    // Base 500 + 80km package rate + driver allowance 300
    const passed = res.totalFare >= 1500 && res.extraHourFare === 0;
    return {
      passed,
      expected: 'Standard 8-hr package, no extra hour fare applied within 8 hrs',
      actual: `₹${res.totalFare}, Extra hour: ₹${res.extraHourFare}`,
    };
  });

  addTest('LOC_03', 'Local', 'Extra Hour Pricing strictly applied only in LOCAL', { distanceKm: 75, durationMinutes: 600 }, () => {
    const resLocal = serverPricingStore.calculateAuthoritativeFare({
      origin: 'Mysuru City',
      destination: 'Local Sightseeing',
      distanceKm: 75,
      durationMinutes: 600, // 10 hrs (2 extra hrs)
      bookingType: 'LOCAL',
      vehicleId: 'sedan-4-1',
    });
    // Ensure ONE_WAY does NOT have extra hour fare even with long duration
    const resOneWay = serverPricingStore.calculateAuthoritativeFare({
      origin: 'Mysuru',
      destination: 'Bengaluru',
      distanceKm: 145,
      durationMinutes: 600,
      bookingType: 'ONE_WAY',
      vehicleId: 'sedan-4-1',
    });

    const passed = resLocal.extraHourFare > 0 && resOneWay.extraHourFare === 0 && resOneWay.hourlyFare === 0;
    return {
      passed,
      expected: 'Local has extraHourFare > 0, One Way extraHourFare is strictly 0',
      actual: `Local extra hr: ₹${resLocal.extraHourFare}, OneWay extra hr: ₹${resOneWay.extraHourFare}`,
    };
  });

  addTest('LOC_04', 'Local', 'Extra KM in Local Package (110 km > 80 km included)', { distanceKm: 110, durationMinutes: 480 }, () => {
    const res = serverPricingStore.calculateAuthoritativeFare({
      origin: 'Mysuru',
      destination: 'Nanjangud & Srirangapatna',
      distanceKm: 110,
      durationMinutes: 480,
      bookingType: 'LOCAL',
      vehicleId: 'sedan-4-1',
    });
    const passed = res.extraDistanceFare > 0;
    return {
      passed,
      expected: 'Extra distance fare applied for (110 - 80) = 30 extra km',
      actual: `Extra distance fare: ₹${res.extraDistanceFare}`,
    };
  });

  // ==========================================
  // 2. ONE WAY TESTS
  // ==========================================
  addTest('OW_01', 'One Way', 'Short Route (Mysuru to Mandya - 45 km, Same State)', { distanceKm: 45, durationMinutes: 55 }, () => {
    const res = serverPricingStore.calculateAuthoritativeFare({
      origin: 'Mysuru, Karnataka',
      destination: 'Mandya, Karnataka',
      distanceKm: 45,
      durationMinutes: 55,
      bookingType: 'ONE_WAY',
      vehicleId: 'sedan-4-1',
    });
    const passed = res.routeCategory === 'INTRA_STATE' && res.interStateCharge === 0 && res.totalFare > 0;
    return {
      passed,
      expected: 'INTRA_STATE, ₹0 interstate charge, valid total fare',
      actual: `${res.routeCategory}, Interstate charge: ₹${res.interStateCharge}, Total: ₹${res.totalFare}`,
    };
  });

  addTest('OW_02', 'One Way', 'Long Route (Mysuru to Hubballi - 410 km, Same State)', { distanceKm: 410, durationMinutes: 450 }, () => {
    const res = serverPricingStore.calculateAuthoritativeFare({
      origin: 'Mysuru, Karnataka',
      destination: 'Hubballi, Karnataka',
      distanceKm: 410,
      durationMinutes: 450,
      bookingType: 'ONE_WAY',
      vehicleId: 'sedan-4-1',
    });
    // Pricing distance must be actual driving distance, not doubled
    const passed = res.routeCategory === 'INTRA_STATE' && res.distanceKm === 410 && res.billableKm === 410;
    return {
      passed,
      expected: 'Distance = 410 km (One-way distance not doubled), INTRA_STATE',
      actual: `Distance: ${res.distanceKm} km, Total: ₹${res.totalFare}`,
    };
  });

  // ==========================================
  // 3. INTERSTATE ONE WAY TESTS (6 Specific State Pairs)
  // ==========================================
  addTest('INTER_01', 'Interstate One Way', 'Karnataka → Tamil Nadu (Mysuru to Coimbatore)', { distanceKm: 215 }, () => {
    const res = serverPricingStore.calculateAuthoritativeFare({
      origin: 'Mysuru, Karnataka',
      destination: 'Coimbatore, Tamil Nadu',
      originState: 'Karnataka',
      destinationState: 'Tamil Nadu',
      distanceKm: 215,
      durationMinutes: 280,
      bookingType: 'ONE_WAY',
      vehicleId: 'sedan-4-1',
    });
    const passed = res.isInterState && res.originState === 'Karnataka' && res.destinationState === 'Tamil Nadu' && res.interStateCharge === 500;
    return {
      passed,
      expected: 'isInterState = true, State-Pair Rule ₹500 for Sedan',
      actual: `isInterState: ${res.isInterState}, Interstate Charge: ₹${res.interStateCharge} (${res.interStateAppliedRule})`,
    };
  });

  addTest('INTER_02', 'Interstate One Way', 'Karnataka → Kerala (Mysuru to Wayanad)', { distanceKm: 125 }, () => {
    const res = serverPricingStore.calculateAuthoritativeFare({
      origin: 'Mysuru, Karnataka',
      destination: 'Sulthan Bathery, Wayanad, Kerala',
      originState: 'Karnataka',
      destinationState: 'Kerala',
      distanceKm: 125,
      durationMinutes: 180,
      bookingType: 'ONE_WAY',
      vehicleId: 'sedan-4-1',
    });
    const passed = res.isInterState && res.interStateCharge === 600;
    return {
      passed,
      expected: 'isInterState = true, Karnataka → Kerala State-Pair Rule ₹600 for Sedan',
      actual: `isInterState: ${res.isInterState}, Interstate Charge: ₹${res.interStateCharge}`,
    };
  });

  addTest('INTER_03', 'Interstate One Way', 'Tamil Nadu → Karnataka (Coimbatore to Mysuru)', { distanceKm: 215 }, () => {
    const res = serverPricingStore.calculateAuthoritativeFare({
      origin: 'Coimbatore, Tamil Nadu',
      destination: 'Mysuru, Karnataka',
      originState: 'Tamil Nadu',
      destinationState: 'Karnataka',
      distanceKm: 215,
      durationMinutes: 280,
      bookingType: 'ONE_WAY',
      vehicleId: 'sedan-4-1',
    });
    const passed = res.isInterState && res.interStateCharge === 500;
    return {
      passed,
      expected: 'isInterState = true, Tamil Nadu → Karnataka Rule ₹500 for Sedan',
      actual: `isInterState: ${res.isInterState}, Interstate Charge: ₹${res.interStateCharge}`,
    };
  });

  addTest('INTER_04', 'Interstate One Way', 'Kerala → Karnataka (Calicut to Mysuru)', { distanceKm: 210 }, () => {
    const res = serverPricingStore.calculateAuthoritativeFare({
      origin: 'Kozhikode, Kerala',
      destination: 'Mysuru, Karnataka',
      originState: 'Kerala',
      destinationState: 'Karnataka',
      distanceKm: 210,
      durationMinutes: 310,
      bookingType: 'ONE_WAY',
      vehicleId: 'sedan-4-1',
    });
    const passed = res.isInterState && res.interStateCharge === 600;
    return {
      passed,
      expected: 'isInterState = true, Kerala → Karnataka Rule ₹600 for Sedan',
      actual: `isInterState: ${res.isInterState}, Interstate Charge: ₹${res.interStateCharge}`,
    };
  });

  addTest('INTER_05', 'Interstate One Way', 'Tamil Nadu → Kerala (Coimbatore to Palakkad)', { distanceKm: 55 }, () => {
    const res = serverPricingStore.calculateAuthoritativeFare({
      origin: 'Coimbatore, Tamil Nadu',
      destination: 'Palakkad, Kerala',
      originState: 'Tamil Nadu',
      destinationState: 'Kerala',
      distanceKm: 55,
      durationMinutes: 75,
      bookingType: 'ONE_WAY',
      vehicleId: 'sedan-4-1',
    });
    const passed = res.isInterState && res.interStateCharge > 0;
    return {
      passed,
      expected: 'isInterState = true, Interstate charge applied',
      actual: `isInterState: ${res.isInterState}, Charge: ₹${res.interStateCharge}`,
    };
  });

  addTest('INTER_06', 'Interstate One Way', 'Kerala → Tamil Nadu (Palakkad to Coimbatore)', { distanceKm: 55 }, () => {
    const res = serverPricingStore.calculateAuthoritativeFare({
      origin: 'Palakkad, Kerala',
      destination: 'Coimbatore, Tamil Nadu',
      originState: 'Kerala',
      destinationState: 'Tamil Nadu',
      distanceKm: 55,
      durationMinutes: 75,
      bookingType: 'ONE_WAY',
      vehicleId: 'sedan-4-1',
    });
    const passed = res.isInterState && res.interStateCharge > 0;
    return {
      passed,
      expected: 'isInterState = true, Interstate charge applied',
      actual: `isInterState: ${res.isInterState}, Charge: ₹${res.interStateCharge}`,
    };
  });

  // ==========================================
  // 4. AIRPORT TRANSFER TESTS
  // ==========================================
  addTest('AIR_01', 'Airport Transfer', 'Airport → City (Kempegowda BLR Airport to Mysuru)', { distanceKm: 180 }, () => {
    const res = serverPricingStore.calculateAuthoritativeFare({
      origin: 'Kempegowda International Airport (BLR), Bengaluru',
      destination: 'Mysore Palace, Mysuru',
      distanceKm: 180,
      durationMinutes: 210,
      bookingType: 'AIRPORT_TRANSFER',
      vehicleId: 'sedan-4-1',
      airportTransferType: 'pickup',
    });
    const passed = res.totalFare >= 3000 && res.baseFare > 0;
    return {
      passed,
      expected: 'Airport specific base fare applied, total fare >= ₹3000',
      actual: `Base: ₹${res.baseFare}, Total: ₹${res.totalFare}`,
    };
  });

  addTest('AIR_02', 'Airport Transfer', 'City → Airport (Mysuru to Kempegowda BLR Airport)', { distanceKm: 180 }, () => {
    const res = serverPricingStore.calculateAuthoritativeFare({
      origin: 'Gokulam, Mysuru',
      destination: 'Kempegowda International Airport (BLR), Bengaluru',
      distanceKm: 180,
      durationMinutes: 210,
      bookingType: 'AIRPORT_TRANSFER',
      vehicleId: 'sedan-4-1',
      airportTransferType: 'drop',
    });
    const passed = res.totalFare >= 3000;
    return {
      passed,
      expected: 'Valid airport drop fare calculated',
      actual: `Total Fare: ₹${res.totalFare}`,
    };
  });

  // ==========================================
  // 5. ROUND TRIP TESTS
  // ==========================================
  addTest('RT_01', 'Round Trip' as any, 'Same-Day Round Trip (Mysuru to Bengaluru & Return)', { distanceKm: 145, roundTripDays: 1 }, () => {
    const res = serverPricingStore.calculateAuthoritativeFare({
      origin: 'Mysuru, Karnataka',
      destination: 'Bengaluru, Karnataka',
      distanceKm: 145,
      durationMinutes: 200,
      bookingType: 'ROUND_TRIP',
      vehicleId: 'sedan-4-1',
      roundTripDays: 1,
    });
    const passed = res.totalFare > 0 && res.driverAllowance > 0 && res.billableKm >= 250;
    return {
      passed,
      expected: 'Round trip applies daily min km (>=250 km) and 1 day driver allowance',
      actual: `Billable KM: ${res.billableKm}, Driver allowance: ₹${res.driverAllowance}, Total: ₹${res.totalFare}`,
    };
  });

  addTest('RT_02', 'Round Trip' as any, 'Multi-Day Round Trip (Mysuru to Ooty - 3 Days)', { distanceKm: 125, roundTripDays: 3 }, () => {
    const res = serverPricingStore.calculateAuthoritativeFare({
      origin: 'Mysuru, Karnataka',
      destination: 'Ooty, Tamil Nadu',
      distanceKm: 125,
      durationMinutes: 220,
      bookingType: 'ROUND_TRIP',
      vehicleId: 'sedan-4-1',
      roundTripDays: 3,
    });
    // 3 days driver allowance (e.g. 3 x ₹300 = ₹900)
    const passed = res.driverAllowance >= 900 && res.billableKm >= 750;
    return {
      passed,
      expected: 'Driver allowance applies for 3 days (>=₹900) with 3-day min km (750 km)',
      actual: `Driver allowance: ₹${res.driverAllowance}, Billable KM: ${res.billableKm}, Total: ₹${res.totalFare}`,
    };
  });

  addTest('RT_03', 'Round Trip' as any, 'Multiple Stops Route (+ Add Stops via waypoint handling)', { distanceKm: 180, viaStopsCount: 2 }, () => {
    const res = serverPricingStore.calculateAuthoritativeFare({
      origin: 'Mysuru',
      destination: 'Madikeri, Coorg',
      distanceKm: 180,
      durationMinutes: 240,
      bookingType: 'ONE_WAY',
      vehicleId: 'sedan-4-1',
      viaStopsCount: 2,
    });
    const passed = res.totalFare > 0 && res.distanceKm === 180;
    return {
      passed,
      expected: 'Multi-stop route calculates valid total fare with all waypoints accounted',
      actual: `Total fare: ₹${res.totalFare}, Distance: ${res.distanceKm} km`,
    };
  });

  // ==========================================
  // 6. VEHICLE RULES & RATES TESTS
  // ==========================================
  addTest('VEH_01', 'Vehicle', 'Sedan vs SUV (6+1) vs Innova Crysta Pricing Hierarchy', { distanceKm: 200 }, () => {
    const resSedan = serverPricingStore.calculateAuthoritativeFare({
      origin: 'Mysuru',
      destination: 'Bengaluru',
      distanceKm: 145,
      durationMinutes: 180,
      bookingType: 'ONE_WAY',
      vehicleId: 'sedan-4-1',
    });
    const resSuv = serverPricingStore.calculateAuthoritativeFare({
      origin: 'Mysuru',
      destination: 'Bengaluru',
      distanceKm: 145,
      durationMinutes: 180,
      bookingType: 'ONE_WAY',
      vehicleId: 'suv-6-1',
    });
    const resCrysta = serverPricingStore.calculateAuthoritativeFare({
      origin: 'Mysuru',
      destination: 'Bengaluru',
      distanceKm: 145,
      durationMinutes: 180,
      bookingType: 'ONE_WAY',
      vehicleId: 'innova-crysta',
    });

    const passed = resSedan.totalFare < resSuv.totalFare && resSuv.totalFare < resCrysta.totalFare;
    return {
      passed,
      expected: 'Sedan < SUV (6+1) < Innova Crysta fare progression',
      actual: `Sedan: ₹${resSedan.totalFare}, SUV (6+1): ₹${resSuv.totalFare}, Crysta: ₹${resCrysta.totalFare}`,
    };
  });

  addTest('VEH_02', 'Vehicle', 'Minimum Fare Enforcement for Short Local Trip (Sedan min ₹1500)', { distanceKm: 15, durationMinutes: 60 }, () => {
    const res = serverPricingStore.calculateAuthoritativeFare({
      origin: 'Mysuru Palace',
      destination: 'Chamundi Hill, Mysuru',
      distanceKm: 15,
      durationMinutes: 60,
      bookingType: 'LOCAL',
      vehicleId: 'sedan-4-1',
    });
    const passed = res.totalFare >= 1500 && res.minimumFareApplied;
    return {
      passed,
      expected: 'Minimum fare of ₹1,500 applied with minimumFareApplied = true',
      actual: `Total: ₹${res.totalFare}, minimumFareApplied: ${res.minimumFareApplied}`,
    };
  });

  // ==========================================
  // 6. FAILURE & INTEGRITY CASES
  // ==========================================
  addTest('FAIL_01', 'Failure Cases', 'Zero / Negative Distance Rejection', { distanceKm: -10 }, () => {
    const res = serverPricingStore.calculateAuthoritativeFare({
      origin: 'Mysuru',
      destination: 'Mysuru',
      distanceKm: -10,
      durationMinutes: 0,
      bookingType: 'ONE_WAY',
      vehicleId: 'sedan-4-1',
    });
    const passed = res.distanceKm === 0 && res.totalFare >= 700; // minimum fare fallback
    return {
      passed,
      expected: 'Distance clamped to 0, minimum fare protection applies safely',
      actual: `Distance: ${res.distanceKm}, Total: ₹${res.totalFare}`,
    };
  });

  const durationMs = Date.now() - startTime;
  const passedCount = results.filter((r) => r.passed).length;

  return {
    total: results.length,
    passed: passedCount,
    failed: results.length - passedCount,
    passRate: Number(((passedCount / results.length) * 100).toFixed(1)),
    durationMs,
    timestamp: new Date().toISOString(),
    results,
  };
}
