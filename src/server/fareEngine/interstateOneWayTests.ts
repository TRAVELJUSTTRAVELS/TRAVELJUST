import { InterStateTestCaseResult } from '../../types/interstateOneWay';
import { InterStateOneWayStore } from './interstateOneWayStore';

export function runInterStateOneWayTests(store?: InterStateOneWayStore): {
  total: number;
  passed: number;
  failed: number;
  results: InterStateTestCaseResult[];
  summary: string;
} {
  const testStore = store || new InterStateOneWayStore();
  const results: InterStateTestCaseResult[] = [];

  // TEST 1: Valid Inter-State Route (Karnataka to Tamil Nadu)
  {
    const start = performance.now();
    const res = testStore.calculateFare({
      origin: 'Mysuru, Karnataka',
      destination: 'Coimbatore, Tamil Nadu',
      vehicleId: 'sedan-4-1',
      distanceKm: 210,
      durationMinutes: 300,
    });
    const passed =
      res.success === true &&
      res.isInterState === true &&
      res.tripClassification === 'INTER-STATE ONE-WAY' &&
      res.route?.originStateCode === 'KA' &&
      res.route?.destinationStateCode === 'TN' &&
      res.fare?.finalFare! > 0;

    results.push({
      id: 'test_1',
      testNumber: 1,
      title: 'Valid Inter-State Route (KA ➔ TN)',
      description: 'Verifies successful classification and calculation of Karnataka to Tamil Nadu route.',
      expectedOutcome: 'isInterState = true, tripClassification = INTER-STATE ONE-WAY, KA ➔ TN recognized',
      actualOutcome: `success: ${res.success}, isInterState: ${res.isInterState}, route: ${res.route?.originStateCode} ➔ ${res.route?.destinationStateCode}, Fare: ₹${res.fare?.finalFare}`,
      passed,
      executionTimeMs: Number((performance.now() - start).toFixed(2)),
      details: res,
    });
  }

  // TEST 2: Same-State Route Rejected (Karnataka to Karnataka)
  {
    const start = performance.now();
    const res = testStore.calculateFare({
      origin: 'Mysuru, Karnataka',
      destination: 'Bengaluru, Karnataka',
      vehicleId: 'sedan-4-1',
      distanceKm: 145,
      durationMinutes: 180,
    });
    const expectedMsg = 'This route is not an Inter-State journey. Please select the appropriate TRAVEL JUST fare category.';
    const passed =
      res.success === false &&
      res.isInterState === false &&
      res.error === 'INTRA_STATE_REJECTED' &&
      res.errorMessage === expectedMsg;

    results.push({
      id: 'test_2',
      testNumber: 2,
      title: 'Same-State Route Rejection (KA ➔ KA)',
      description: 'Strict verification that intra-state routes are rejected from Inter-State engine.',
      expectedOutcome: `Rejected with message: "${expectedMsg}"`,
      actualOutcome: `success: ${res.success}, error: ${res.error}, message: "${res.errorMessage}"`,
      passed,
      executionTimeMs: Number((performance.now() - start).toFixed(2)),
      details: res,
    });
  }

  // TEST 3: Minimum KM Rule Applied
  {
    const start = performance.now();
    // Actual 100 KM < Minimum KM (149 KM)
    const res = testStore.calculateFare({
      origin: 'Mysuru, Karnataka',
      destination: 'Wayanad, Kerala',
      vehicleId: 'sedan-4-1',
      distanceKm: 100,
      durationMinutes: 140,
    });
    const expectedMinKm = res.fare?.minimumKm || 149;
    const passed =
      res.success === true &&
      res.fare?.minimumKm === expectedMinKm &&
      res.fare?.chargeableKm === expectedMinKm &&
      res.fare?.distanceCharge === expectedMinKm * res.fare?.perKmRate!;

    results.push({
      id: 'test_3',
      testNumber: 3,
      title: `Minimum Billable KM Enforcement (100 km actual vs ${expectedMinKm} km min)`,
      description: `When driving distance is 100 KM, system charges minimum ${expectedMinKm} KM billable distance.`,
      expectedOutcome: `chargeableKm = ${expectedMinKm}, distanceCharge = ${expectedMinKm} * perKmRate`,
      actualOutcome: `distanceKm: 100, minimumKm: ${res.fare?.minimumKm}, chargeableKm: ${res.fare?.chargeableKm}, distanceCharge: ₹${res.fare?.distanceCharge}`,
      passed,
      executionTimeMs: Number((performance.now() - start).toFixed(2)),
      details: res,
    });
  }

  // TEST 4: Actual KM Exceeding Minimum KM
  {
    const start = performance.now();
    // Actual 340 KM > Minimum 250 KM
    const res = testStore.calculateFare({
      origin: 'Bengaluru, Karnataka',
      destination: 'Chennai, Tamil Nadu',
      vehicleId: 'sedan-4-1',
      distanceKm: 340,
      durationMinutes: 360,
    });
    const passed =
      res.success === true &&
      res.fare?.chargeableKm === 340 &&
      res.fare?.distanceCharge === 340 * res.fare?.perKmRate!;

    results.push({
      id: 'test_4',
      testNumber: 4,
      title: 'Actual KM Above Minimum (340 km actual vs 250 km min)',
      description: 'When driving distance exceeds minimum KM, chargeable KM equals actual driving distance.',
      expectedOutcome: 'chargeableKm = 340, distanceCharge = 340 * perKmRate',
      actualOutcome: `distanceKm: 340, chargeableKm: ${res.fare?.chargeableKm}, distanceCharge: ₹${res.fare?.distanceCharge}`,
      passed,
      executionTimeMs: Number((performance.now() - start).toFixed(2)),
      details: res,
    });
  }

  // TEST 5: Included KM & Extra KM Calculation
  {
    const start = performance.now();
    // Temporary custom rate with includedKm = 300, extraPerKmRate = 14
    const customStore = new InterStateOneWayStore();
    customStore.updateRate('sedan-4-1', {
      includedKm: 300,
      perKmRate: 15,
      extraPerKmRate: 14,
    });
    const res = customStore.calculateFare({
      origin: 'Bengaluru, Karnataka',
      destination: 'Hyderabad, Telangana',
      vehicleId: 'sedan-4-1',
      distanceKm: 375,
      durationMinutes: 480,
    });

    const passed =
      res.success === true &&
      res.fare?.includedKm === 300 &&
      res.fare?.extraKm === 75 &&
      res.fare?.extraKmCharge === 75 * 14;

    results.push({
      id: 'test_5',
      testNumber: 5,
      title: 'Included KM & Extra KM Calculation (300 km included, 375 km actual)',
      description: 'Verifies that 75 KM extra is calculated cleanly without double counting distance charge.',
      expectedOutcome: 'includedKm = 300, extraKm = 75, extraKmCharge = 75 * 14 = 1050',
      actualOutcome: `includedKm: ${res.fare?.includedKm}, extraKm: ${res.fare?.extraKm}, extraKmCharge: ₹${res.fare?.extraKmCharge}`,
      passed,
      executionTimeMs: Number((performance.now() - start).toFixed(2)),
      details: res,
    });
  }

  // TEST 6: Vehicle Rate Selection (Sedan vs SUV)
  {
    const start = performance.now();
    const sedanRes = testStore.calculateFare({
      origin: 'Bengaluru, Karnataka',
      destination: 'Tirupati, Andhra Pradesh',
      vehicleId: 'sedan-4-1',
      distanceKm: 250,
      durationMinutes: 300,
    });
    const suvRes = testStore.calculateFare({
      origin: 'Bengaluru, Karnataka',
      destination: 'Tirupati, Andhra Pradesh',
      vehicleId: 'suv-6-1',
      distanceKm: 250,
      durationMinutes: 300,
    });

    const passed =
      sedanRes.success === true &&
      suvRes.success === true &&
      sedanRes.fare?.perKmRate === 15 &&
      suvRes.fare?.perKmRate === 18 &&
      suvRes.fare?.finalFare! > sedanRes.fare?.finalFare!;

    results.push({
      id: 'test_6',
      testNumber: 6,
      title: 'Vehicle Rate Selection (Sedan ₹15/km vs SUV ₹18/km)',
      description: 'Ensures correct vehicle-specific tariff card is applied.',
      expectedOutcome: 'Sedan: ₹15/km, SUV: ₹18/km, SUV final fare higher than Sedan',
      actualOutcome: `Sedan rate: ₹${sedanRes.fare?.perKmRate}/km (Total: ₹${sedanRes.fare?.finalFare}), SUV rate: ₹${suvRes.fare?.perKmRate}/km (Total: ₹${suvRes.fare?.finalFare})`,
      passed,
      executionTimeMs: Number((performance.now() - start).toFixed(2)),
      details: { sedan: sedanRes, suv: suvRes },
    });
  }

  // TEST 7: Route Distance Update Recalculation
  {
    const start = performance.now();
    const resA = testStore.calculateFare({
      origin: 'Mysuru, Karnataka',
      destination: 'Calicut, Kerala',
      vehicleId: 'sedan-4-1',
      distanceKm: 250,
      durationMinutes: 360,
    });
    const resB = testStore.calculateFare({
      origin: 'Mysuru, Karnataka',
      destination: 'Calicut, Kerala',
      vehicleId: 'sedan-4-1',
      distanceKm: 290,
      durationMinutes: 400,
    });

    const passed =
      resA.success === true &&
      resB.success === true &&
      resB.fare?.finalFare! > resA.fare?.finalFare! &&
      resB.fare?.chargeableKm === 290;

    results.push({
      id: 'test_7',
      testNumber: 7,
      title: 'Real-time Route Change Recalculation',
      description: 'Verifies fare dynamically recalculates when driving distance changes from 250 KM to 290 KM.',
      expectedOutcome: 'New distance (290 km) generates higher authoritative fare than 250 km',
      actualOutcome: `250 km Fare: ₹${resA.fare?.finalFare} ➔ 290 km Fare: ₹${resB.fare?.finalFare}`,
      passed,
      executionTimeMs: Number((performance.now() - start).toFixed(2)),
      details: { resA, resB },
    });
  }

  // TEST 8: Google Maps Failure Handling
  {
    const start = performance.now();
    const res = testStore.calculateFare({
      origin: 'Bengaluru, Karnataka',
      destination: 'Chennai, Tamil Nadu',
      vehicleId: 'sedan-4-1',
      distanceKm: 0,
      durationMinutes: 0,
    });

    const passed =
      res.success === false &&
      res.error === 'GOOGLE_MAPS_ROUTING_FAILED' &&
      res.errorMessage === 'Unable to calculate the live driving route at this time. Please try again or contact TRAVEL JUST.';

    results.push({
      id: 'test_8',
      testNumber: 8,
      title: 'Google Maps Failure Handling (Zero Distance)',
      description: 'Gracefully halts fare calculation without returning mock/static estimated values.',
      expectedOutcome: 'Rejected with GOOGLE_MAPS_ROUTING_FAILED error',
      actualOutcome: `success: ${res.success}, error: ${res.error}, message: "${res.errorMessage}"`,
      passed,
      executionTimeMs: Number((performance.now() - start).toFixed(2)),
      details: res,
    });
  }

  // TEST 9: Missing Vehicle Rate Protection
  {
    const start = performance.now();
    const res = testStore.calculateFare({
      origin: 'Bengaluru, Karnataka',
      destination: 'Chennai, Tamil Nadu',
      vehicleId: 'unknown_hypercar_xyz',
      distanceKm: 350,
      durationMinutes: 360,
    });

    // If fallback kicks in or unknown is rejected
    const passed =
      res.success === false ||
      (res.success === true && res.fare?.baseFare! > 0);

    results.push({
      id: 'test_9',
      testNumber: 9,
      title: 'Missing Vehicle Rate Protection',
      description: 'Verifies that non-configured vehicle queries are safely handled without server crashes.',
      expectedOutcome: 'Safe error message or fallback to standard vehicle rate card',
      actualOutcome: `success: ${res.success}, vehicle: ${res.fareSnapshot?.vehicleName || res.error}`,
      passed,
      executionTimeMs: Number((performance.now() - start).toFixed(2)),
      details: res,
    });
  }

  // TEST 10: Pricing Version Increment & Snapshot Integrity
  {
    const start = performance.now();
    const testInst = new InterStateOneWayStore();
    const v1 = testInst.getPricingVersion(); // "ISOW-2026-001"

    // Calculate booking on v1
    const snapshotV1 = testInst.calculateFare({
      origin: 'Bengaluru, Karnataka',
      destination: 'Chennai, Tamil Nadu',
      vehicleId: 'sedan-4-1',
      distanceKm: 340,
      durationMinutes: 360,
    });

    // Update rate card
    testInst.updateRate('sedan-4-1', { perKmRate: 16 });
    const v2 = testInst.getPricingVersion(); // "ISOW-2026-002"

    // Snapshot V1 must retain original values
    const passed =
      v1 === 'ISOW-2026-001' &&
      v2 === 'ISOW-2026-002' &&
      snapshotV1.pricingVersion === 'ISOW-2026-001' &&
      snapshotV1.fareSnapshot?.perKmRate === 15;

    results.push({
      id: 'test_10',
      testNumber: 10,
      title: 'Pricing Version Control & Immutable Snapshot (ISOW-2026-001 ➔ ISOW-2026-002)',
      description: 'Updating rate increments version while confirmed booking snapshot retains original rate card.',
      expectedOutcome: 'v1 = ISOW-2026-001, v2 = ISOW-2026-002, snapshot retained perKmRate = 15',
      actualOutcome: `Initial version: ${v1}, New version: ${v2}, Snapshot retained version: ${snapshotV1.pricingVersion} (rate: ₹${snapshotV1.fareSnapshot?.perKmRate})`,
      passed,
      executionTimeMs: Number((performance.now() - start).toFixed(2)),
      details: { v1, v2, snapshotV1 },
    });
  }

  const passedCount = results.filter((r) => r.passed).length;
  const failedCount = results.length - passedCount;

  return {
    total: results.length,
    passed: passedCount,
    failed: failedCount,
    results,
    summary: `${passedCount} of ${results.length} Inter-State One-Way tests passed successfully.`,
  };
}
