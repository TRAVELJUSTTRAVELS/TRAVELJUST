import {
  IndianState,
  InterStateAdditionalChargeConfig,
  InterStateFareCalculationInput,
  InterStateFareCalculationResult,
  InterStateFareSnapshot,
  InterStateOneWayVehicleRate,
  InterStateRouteRule,
  InterStateStatePairRule,
} from '../../types/interstateOneWay';
import { ALL_INDIAN_STATES, resolveIndianState } from './indianStatesData';

export const INITIAL_INTERSTATE_RATES: Record<string, InterStateOneWayVehicleRate> = {
  'sedan-4-1': {
    id: 'isow_sedan_4_1',
    vehicleId: 'sedan-4-1',
    vehicleName: 'Sedan (4+1)',
    vehicleCategory: 'Sedan (4+1)',
    baseFare: 600,
    perKmRate: 15,
    minimumKm: 149,
    includedKm: 0,
    extraPerKmRate: 14,
    driverAllowance: 500,
    minimumFare: 4200,
    maximumFare: 50000,
    active: true,
    effectiveFrom: '2026-01-01T00:00:00.000Z',
    pricingVersion: 'ISOW-2026-001',
    notes: 'Sedan (4+1) Inter-State One-Way rate card'
  },
  'suv-6-1': {
    id: 'isow_suv_6_1',
    vehicleId: 'suv-6-1',
    vehicleName: 'SUV (6+1)',
    vehicleCategory: 'SUV (6+1)',
    baseFare: 800,
    perKmRate: 18,
    minimumKm: 149,
    includedKm: 0,
    extraPerKmRate: 16,
    driverAllowance: 600,
    minimumFare: 5100,
    maximumFare: 60000,
    active: true,
    effectiveFrom: '2026-01-01T00:00:00.000Z',
    pricingVersion: 'ISOW-2026-001',
    notes: 'SUV (6+1) Inter-State One-Way rate card'
  },
  'innova': {
    id: 'isow_innova',
    vehicleId: 'innova',
    vehicleName: 'INNOVA',
    vehicleCategory: 'Innova',
    baseFare: 900,
    perKmRate: 20,
    minimumKm: 149,
    includedKm: 0,
    extraPerKmRate: 18,
    driverAllowance: 600,
    minimumFare: 5900,
    maximumFare: 70000,
    active: true,
    effectiveFrom: '2026-01-01T00:00:00.000Z',
    pricingVersion: 'ISOW-2026-001',
    notes: 'INNOVA Inter-State One-Way rate card'
  },
  'innova-crysta': {
    id: 'isow_innova_crysta',
    vehicleId: 'innova-crysta',
    vehicleName: 'INNOVA CRYSTA',
    vehicleCategory: 'Innova Crysta',
    baseFare: 1100,
    perKmRate: 22,
    minimumKm: 149,
    includedKm: 0,
    extraPerKmRate: 20,
    driverAllowance: 700,
    minimumFare: 6800,
    maximumFare: 80000,
    active: true,
    effectiveFrom: '2026-01-01T00:00:00.000Z',
    pricingVersion: 'ISOW-2026-001',
    notes: 'INNOVA CRYSTA Inter-State One-Way rate card'
  },
  'tempo-traveller-12-1': {
    id: 'isow_tempo_12_1',
    vehicleId: 'tempo-traveller-12-1',
    vehicleName: 'TEMPO TRAVELLER (12+1)',
    vehicleCategory: 'Tempo Traveller (12+1)',
    baseFare: 1500,
    perKmRate: 28,
    minimumKm: 149,
    includedKm: 0,
    extraPerKmRate: 25,
    driverAllowance: 900,
    minimumFare: 9900,
    maximumFare: 120000,
    active: true,
    effectiveFrom: '2026-01-01T00:00:00.000Z',
    pricingVersion: 'ISOW-2026-001',
    notes: 'TEMPO TRAVELLER (12+1) Inter-State One-Way rate card'
  }
};

export const INITIAL_STATE_PAIRS: InterStateStatePairRule[] = [
  {
    id: 'sp_ka_tn',
    fromState: 'Karnataka',
    fromStateCode: 'KA',
    toState: 'Tamil Nadu',
    toStateCode: 'TN',
    ratesByVehicle: {
      'sedan-4-1': 500,
      'suv-6-1': 700,
      'ertiga': 700,
      'innova': 800,
      'innova-crysta': 1000,
      'tempo-traveller-12-1': 1500,
    },
    active: true,
    description: 'Karnataka to Tamil Nadu Inter-State Border Permit (Ooty, Coimbatore, Chennai, Salem)'
  },
  {
    id: 'sp_ka_kl',
    fromState: 'Karnataka',
    fromStateCode: 'KA',
    toState: 'Kerala',
    toStateCode: 'KL',
    ratesByVehicle: {
      'sedan-4-1': 600,
      'suv-6-1': 800,
      'ertiga': 800,
      'innova': 900,
      'innova-crysta': 1100,
      'tempo-traveller-12-1': 1600,
    },
    active: true,
    description: 'Karnataka to Kerala Inter-State Border Permit (Wayanad, Calicut, Kannur, Cochin)'
  },
  {
    id: 'sp_ka_ap',
    fromState: 'Karnataka',
    fromStateCode: 'KA',
    toState: 'Andhra Pradesh',
    toStateCode: 'AP',
    ratesByVehicle: {
      'sedan-4-1': 700,
      'suv-6-1': 900,
      'ertiga': 900,
      'innova': 1000,
      'innova-crysta': 1200,
      'tempo-traveller-12-1': 1800,
    },
    active: true,
    description: 'Karnataka to Andhra Pradesh (Tirupati, Chittoor, Nellore, Vijayawada)'
  },
  {
    id: 'sp_ka_ts',
    fromState: 'Karnataka',
    fromStateCode: 'KA',
    toState: 'Telangana',
    toStateCode: 'TS',
    ratesByVehicle: {
      'sedan-4-1': 1000,
      'suv-6-1': 1200,
      'ertiga': 1200,
      'innova': 1300,
      'innova-crysta': 1500,
      'tempo-traveller-12-1': 2200,
    },
    active: true,
    description: 'Karnataka to Telangana (Hyderabad, Secunderabad, Warangal)'
  },
  {
    id: 'sp_ka_ga',
    fromState: 'Karnataka',
    fromStateCode: 'KA',
    toState: 'Goa',
    toStateCode: 'GA',
    ratesByVehicle: {
      'sedan-4-1': 600,
      'suv-6-1': 800,
      'ertiga': 800,
      'innova': 900,
      'innova-crysta': 1100,
      'tempo-traveller-12-1': 1600,
    },
    active: true,
    description: 'Karnataka to Goa Inter-State Border Crossing (Panaji, Margao, Calangute)'
  },
  {
    id: 'sp_ka_mh',
    fromState: 'Karnataka',
    fromStateCode: 'KA',
    toState: 'Maharashtra',
    toStateCode: 'MH',
    ratesByVehicle: {
      'sedan-4-1': 1200,
      'suv-6-1': 1500,
      'ertiga': 1500,
      'innova': 1600,
      'innova-crysta': 1800,
      'tempo-traveller-12-1': 2500,
    },
    active: true,
    description: 'Karnataka to Maharashtra (Kolhapur, Pune, Mumbai, Shirdi)'
  },
  {
    id: 'sp_tn_ka',
    fromState: 'Tamil Nadu',
    fromStateCode: 'TN',
    toState: 'Karnataka',
    toStateCode: 'KA',
    ratesByVehicle: {
      'sedan-4-1': 500,
      'suv-6-1': 700,
      'ertiga': 700,
      'innova': 800,
      'innova-crysta': 1000,
      'tempo-traveller-12-1': 1500,
    },
    active: true,
    description: 'Tamil Nadu to Karnataka Inter-State Border Crossing'
  },
  {
    id: 'sp_kl_ka',
    fromState: 'Kerala',
    fromStateCode: 'KL',
    toState: 'Karnataka',
    toStateCode: 'KA',
    ratesByVehicle: {
      'sedan-4-1': 600,
      'suv-6-1': 800,
      'ertiga': 800,
      'innova': 900,
      'innova-crysta': 1100,
      'tempo-traveller-12-1': 1600,
    },
    active: true,
    description: 'Kerala to Karnataka Inter-State Border Crossing'
  }
];

export const INITIAL_ROUTE_RULES: InterStateRouteRule[] = [
  {
    id: 'rr_mysore_ooty',
    originRegion: 'Mysuru',
    destinationRegion: 'Ooty',
    vehicleId: 'sedan-4-1',
    overrideBaseFare: 600,
    overridePerKmRate: 15,
    overrideDriverAllowance: 500,
    active: true,
    notes: 'Mysuru to Nilgiris / Ooty corridor special route check'
  }
];

export class InterStateOneWayStore {
  private rates: Map<string, InterStateOneWayVehicleRate>;
  private statePairs: InterStateStatePairRule[];
  private routeRules: InterStateRouteRule[];
  private additionalConfig: InterStateAdditionalChargeConfig;
  private currentPricingVersion: string;
  private auditLogs: Array<{
    id: string;
    timestamp: string;
    adminUser: string;
    action: string;
    summary: string;
    oldValue?: any;
    newValue?: any;
    pricingVersion: string;
  }>;

  constructor() {
    this.rates = new Map();
    this.currentPricingVersion = 'ISOW-2026-001';
    this.additionalConfig = {
      tollMode: 'INCLUDED',
      defaultTollEstimate: 350,
      permitChargeEnabled: true,
      borderTaxEnabled: true,
      parkingCharge: 0,
      serviceTaxPercentage: 0,
      roundingRule: 'NEAREST_10',
      distanceRounding: 'NEAREST_1',
      quoteValidityMinutes: 15,
    };
    this.statePairs = JSON.parse(JSON.stringify(INITIAL_STATE_PAIRS));
    this.routeRules = JSON.parse(JSON.stringify(INITIAL_ROUTE_RULES));
    this.auditLogs = [
      {
        id: 'isow_audit_init',
        timestamp: '2026-03-01T00:00:00.000Z',
        adminUser: 'System Admin',
        action: 'INITIALIZE',
        summary: 'Initialized dedicated TRAVEL JUST Inter-State One-Way Dynamic Fare Engine (ISOW-2026-001)',
        pricingVersion: 'ISOW-2026-001',
      }
    ];

    for (const [key, val] of Object.entries(INITIAL_INTERSTATE_RATES)) {
      this.rates.set(key, JSON.parse(JSON.stringify(val)));
    }
  }

  public getAllRates(): InterStateOneWayVehicleRate[] {
    return Array.from(this.rates.values());
  }

  public getRate(vehicleId: string): InterStateOneWayVehicleRate | undefined {
    return (
      this.rates.get(vehicleId) ||
      (vehicleId === 'ertiga' || vehicleId === 'suv' ? this.rates.get('suv-6-1') : undefined) ||
      (vehicleId === 'toyota-etios' || vehicleId === 'swift-desire' ? this.rates.get('sedan-4-1') : undefined) ||
      (vehicleId === 'tempo-traveller' || vehicleId === 'tempo-traveller-14-1' ? this.rates.get('tempo-traveller-12-1') : undefined) ||
      (vehicleId === 'innova-6-1' || vehicleId === 'innova-7-1' ? this.rates.get('innova') : undefined) ||
      this.rates.get('sedan-4-1')
    );
  }

  public updateRate(
    vehicleId: string,
    updates: Partial<InterStateOneWayVehicleRate>,
    adminUser = 'Administrator'
  ): InterStateOneWayVehicleRate {
    const existing = this.getRate(vehicleId);
    if (!existing) {
      throw new Error(`Vehicle rate for ${vehicleId} not found`);
    }

    // Bump pricing version e.g. ISOW-2026-002
    const versionNum = parseInt(this.currentPricingVersion.replace('ISOW-2026-', ''), 10) || 1;
    this.currentPricingVersion = `ISOW-2026-${String(versionNum + 1).padStart(3, '0')}`;

    const merged: InterStateOneWayVehicleRate = {
      ...existing,
      ...updates,
      vehicleId,
      pricingVersion: this.currentPricingVersion,
    };

    this.rates.set(vehicleId, merged);

    this.auditLogs.unshift({
      id: `isow_audit_${Date.now()}`,
      timestamp: new Date().toISOString(),
      adminUser,
      action: 'UPDATE_RATE',
      summary: `Updated Inter-State One-Way rate for ${merged.vehicleName}`,
      oldValue: existing,
      newValue: merged,
      pricingVersion: this.currentPricingVersion,
    });

    return merged;
  }

  public getStatePairs(): InterStateStatePairRule[] {
    return this.statePairs;
  }

  public saveStatePair(rule: InterStateStatePairRule, adminUser = 'Administrator'): InterStateStatePairRule {
    const idx = this.statePairs.findIndex((p) => p.id === rule.id);
    if (idx >= 0) {
      this.statePairs[idx] = rule;
    } else {
      this.statePairs.push({
        ...rule,
        id: rule.id || `sp_${Date.now()}`,
      });
    }

    this.auditLogs.unshift({
      id: `isow_audit_${Date.now()}`,
      timestamp: new Date().toISOString(),
      adminUser,
      action: 'UPDATE_STATE_PAIR',
      summary: `Updated state pair rule: ${rule.fromState} ➔ ${rule.toState}`,
      newValue: rule,
      pricingVersion: this.currentPricingVersion,
    });

    return rule;
  }

  public getAdditionalConfig(): InterStateAdditionalChargeConfig {
    return this.additionalConfig;
  }

  public updateAdditionalConfig(
    updates: Partial<InterStateAdditionalChargeConfig>,
    adminUser = 'Administrator'
  ): InterStateAdditionalChargeConfig {
    this.additionalConfig = {
      ...this.additionalConfig,
      ...updates,
    };

    this.auditLogs.unshift({
      id: `isow_audit_${Date.now()}`,
      timestamp: new Date().toISOString(),
      adminUser,
      action: 'UPDATE_ADDITIONAL_CONFIG',
      summary: `Updated additional charges config (Toll Mode: ${this.additionalConfig.tollMode})`,
      newValue: this.additionalConfig,
      pricingVersion: this.currentPricingVersion,
    });

    return this.additionalConfig;
  }

  public getPricingVersion(): string {
    return this.currentPricingVersion;
  }

  public getAuditLogs() {
    return this.auditLogs;
  }

  public getSupportedStates(): IndianState[] {
    return ALL_INDIAN_STATES;
  }

  /**
   * Authoritative calculation function for TRAVEL JUST Inter-State One-Way Live Dynamic Fare Engine
   * Implements strict isolation, route validation, state matching, hierarchy, and snapshots.
   */
  public calculateFare(input: InterStateFareCalculationInput): InterStateFareCalculationResult {
    const { origin, destination, distanceKm: rawDistanceKm, durationMinutes: rawDurationMinutes, vehicleId } = input;

    // 1. Validate Input Locations
    if (!origin || !destination || origin.trim().length === 0 || destination.trim().length === 0) {
      return {
        success: false,
        error: 'INVALID_LOCATIONS',
        errorMessage: 'Origin and Destination are required to calculate an Inter-State One-Way fare.',
        isInterState: false,
        currency: 'INR',
      };
    }

    // 2. Identify Origin & Destination States
    const originState = resolveIndianState(origin, input.originDetails);
    const destinationState = resolveIndianState(destination, input.destinationDetails);

    // 3. Strict Inter-State Verification
    const isInterState = originState.code.toUpperCase() !== destinationState.code.toUpperCase();

    if (!isInterState) {
      return {
        success: false,
        error: 'INTRA_STATE_REJECTED',
        errorMessage: 'This route is not an Inter-State journey. Please select the appropriate TRAVEL JUST fare category.',
        isInterState: false,
        tripClassification: 'INTRA-STATE',
        route: {
          origin,
          destination,
          originState: originState.name,
          originStateCode: originState.code,
          destinationState: destinationState.name,
          destinationStateCode: destinationState.code,
          isInterState: false,
          distanceMeters: Math.round(rawDistanceKm * 1000),
          distanceKm: rawDistanceKm,
          durationSeconds: Math.round(rawDurationMinutes * 60),
          durationMinutes: rawDurationMinutes,
          durationFormatted: `${Math.floor(rawDurationMinutes / 60)}h ${rawDurationMinutes % 60}m`,
          stopsCount: input.stops?.length || 0,
        },
        currency: 'INR',
      };
    }

    // 4. Validate Google Maps Driving Route & Distance
    if (!rawDistanceKm || rawDistanceKm <= 0) {
      return {
        success: false,
        error: 'GOOGLE_MAPS_ROUTING_FAILED',
        errorMessage: 'Unable to calculate the live driving route at this time. Please try again or contact TRAVEL JUST.',
        isInterState: true,
        currency: 'INR',
      };
    }

    // 5. Load Active Vehicle Inter-State Rate Card
    const rate = this.rates.get(vehicleId) || this.getRate(vehicleId);
    if (!rate || rate.active === false) {
      return {
        success: false,
        error: 'VEHICLE_RATE_UNAVAILABLE',
        errorMessage: 'Live fare is currently unavailable for the selected vehicle. Please choose another vehicle or contact TRAVEL JUST.',
        isInterState: true,
        currency: 'INR',
      };
    }

    // 6. Negative / Invalid Rate Protection
    if (
      rate.baseFare < 0 ||
      rate.perKmRate <= 0 ||
      rate.minimumKm < 0 ||
      rate.extraPerKmRate < 0 ||
      rate.driverAllowance < 0
    ) {
      return {
        success: false,
        error: 'INVALID_RATE_CONFIGURATION',
        errorMessage: 'Invalid vehicle pricing configuration detected. Please contact TRAVEL JUST operations.',
        isInterState: true,
        currency: 'INR',
      };
    }

    // 7. Apply Distance Rounding (Precise calculation first)
    const distanceRounding = this.additionalConfig.distanceRounding;
    let distanceKm = rawDistanceKm;
    if (distanceRounding === 'NEAREST_1') {
      distanceKm = Math.round(distanceKm * 10) / 10;
    } else if (distanceRounding === 'NEAREST_5') {
      distanceKm = Math.round(distanceKm / 5) * 5;
    }

    const durationMinutes = Math.round(rawDurationMinutes);
    const durationHours = Math.floor(durationMinutes / 60);
    const durationRemMins = durationMinutes % 60;
    const durationFormatted =
      durationHours > 0
        ? `${durationHours} hr${durationHours > 1 ? 's' : ''} ${durationRemMins} min`
        : `${durationRemMins} min`;

    // 8. Precedence Hierarchy:
    // 1. Route-specific override
    // 2. State-pair rule
    // 3. Vehicle Inter-State rate
    // 4. Global fallback
    let precedenceApplied: InterStateFareSnapshot['precedenceApplied'] = 'VEHICLE_RATE';
    let ruleDescription = `${rate.vehicleName} Inter-State One-Way Tariff`;

    let baseFare = rate.baseFare;
    let perKmRate = rate.perKmRate;
    let minimumKm = rate.minimumKm;
    let includedKm = rate.includedKm;
    let extraPerKmRate = rate.extraPerKmRate;
    let driverAllowance = rate.driverAllowance;
    let stateCharges = 0;

    // Check State Pair rule
    const matchedStatePair = this.statePairs.find(
      (p) =>
        p.active &&
        p.fromStateCode.toUpperCase() === originState.code.toUpperCase() &&
        p.toStateCode.toUpperCase() === destinationState.code.toUpperCase()
    );

    if (matchedStatePair) {
      const pairFee =
        matchedStatePair.ratesByVehicle[vehicleId] ??
        matchedStatePair.ratesByVehicle['sedan-4-1'] ??
        500;
      stateCharges = pairFee;
      precedenceApplied = 'STATE_PAIR_OVERRIDE';
      ruleDescription = `${matchedStatePair.fromState} ➔ ${matchedStatePair.toState} Inter-State Border Rule`;
    }

    // Check Route Rule override
    const matchedRouteRule = this.routeRules.find(
      (r) =>
        r.active &&
        origin.toLowerCase().includes(r.originRegion.toLowerCase()) &&
        destination.toLowerCase().includes(r.destinationRegion.toLowerCase()) &&
        (r.vehicleId === vehicleId || r.vehicleId === 'all')
    );

    if (matchedRouteRule) {
      if (matchedRouteRule.overrideBaseFare !== undefined) baseFare = matchedRouteRule.overrideBaseFare;
      if (matchedRouteRule.overridePerKmRate !== undefined) perKmRate = matchedRouteRule.overridePerKmRate;
      if (matchedRouteRule.overrideDriverAllowance !== undefined) driverAllowance = matchedRouteRule.overrideDriverAllowance;
      precedenceApplied = 'ROUTE_OVERRIDE';
      ruleDescription = `Route Override: ${matchedRouteRule.originRegion} ➔ ${matchedRouteRule.destinationRegion}`;
    }

    // 9. Calculate Minimum & Chargeable KM
    // Formula: Chargeable KM = MAX(Google Maps Driving KM, Minimum Billable KM)
    const chargeableKm = Math.max(distanceKm, minimumKm);

    // 10. Included KM & Extra KM rules (Prevents double charging)
    let extraKm = 0;
    let extraKmCharge = 0;
    let distanceCharge = 0;

    if (includedKm > 0) {
      if (distanceKm > includedKm) {
        extraKm = Number((distanceKm - includedKm).toFixed(1));
        extraKmCharge = Math.round(extraKm * extraPerKmRate);
      }
      distanceCharge = Math.round(includedKm * perKmRate);
    } else {
      // Standard: chargeableKm * perKmRate
      distanceCharge = Math.round(chargeableKm * perKmRate);
    }

    // 11. Multi-Stop routing charges (if any stops added)
    const stopsCount = input.stops?.length || 0;
    const stopsCharge = stopsCount * 200;

    // 12. Toll Handling (Mode A: Included, Mode B: Additional)
    const effectiveTollMode = input.applyTollMode || this.additionalConfig.tollMode;
    const tollCharge = effectiveTollMode === 'INCLUDED' ? this.additionalConfig.defaultTollEstimate : 0;

    // 13. Subtotal calculation
    const additionalCharges = stateCharges + tollCharge + stopsCharge + this.additionalConfig.parkingCharge;
    const discount = 0;
    const subtotal = baseFare + distanceCharge + extraKmCharge + driverAllowance + additionalCharges - discount;

    // 14. Tax Calculation
    const tax = Math.round((subtotal * this.additionalConfig.serviceTaxPercentage) / 100);
    const unroundedFare = Math.max(rate.minimumFare, subtotal + tax);

    // 15. Apply Currency Rounding
    let finalFare = unroundedFare;
    const roundingRule = this.additionalConfig.roundingRule;
    if (roundingRule === 'NEAREST_10') {
      finalFare = Math.round(unroundedFare / 10) * 10;
    } else if (roundingRule === 'NEAREST_50') {
      finalFare = Math.round(unroundedFare / 50) * 50;
    } else if (roundingRule === 'CEIL_10') {
      finalFare = Math.ceil(unroundedFare / 10) * 10;
    } else {
      finalFare = Math.round(unroundedFare);
    }

    const rounding = finalFare - unroundedFare;

    // 16. Unique Calculation ID & Quote Expiry
    const hex = Math.random().toString(16).substring(2, 10).toUpperCase();
    const calculationId = `TJ-ISOW-FC-${hex}`;
    const now = new Date();
    const expiry = new Date(now.getTime() + this.additionalConfig.quoteValidityMinutes * 60000).toISOString();

    // 17. Detailed Customer-Facing Breakdown
    const detailedBreakdown: Array<{ label: string; amount: number; detail?: string }> = [
      {
        label: `Base Fare (${rate.vehicleName})`,
        amount: baseFare,
        detail: 'Inter-State One-Way dispatch base fee'
      },
      {
        label: `Distance Charge (${chargeableKm} KM @ ₹${perKmRate}/km)`,
        amount: distanceCharge,
        detail: distanceKm < minimumKm ? `Minimum ${minimumKm} KM applied` : `${distanceKm} KM driving distance`
      }
    ];

    if (extraKmCharge > 0) {
      detailedBreakdown.push({
        label: `Extra KM Charge (${extraKm} KM @ ₹${extraPerKmRate}/km)`,
        amount: extraKmCharge,
        detail: `Beyond included ${includedKm} KM allowance`
      });
    }

    if (driverAllowance > 0) {
      detailedBreakdown.push({
        label: 'Driver Allowance (Bata)',
        amount: driverAllowance,
        detail: 'Inter-State single journey allowance'
      });
    }

    if (stateCharges > 0) {
      detailedBreakdown.push({
        label: `State Border Permit (${originState.code} ➔ ${destinationState.code})`,
        amount: stateCharges,
        detail: 'Inter-state crossing permit & statutory tax'
      });
    }

    if (tollCharge > 0) {
      detailedBreakdown.push({
        label: 'Expressway / Highway Tolls',
        amount: tollCharge,
        detail: 'Included FASTag toll estimate'
      });
    }

    if (stopsCharge > 0) {
      detailedBreakdown.push({
        label: `Route Waypoints (${stopsCount} stop${stopsCount > 1 ? 's' : ''})`,
        amount: stopsCharge,
        detail: 'En-route stop management'
      });
    }

    // 18. Immutable Fare Snapshot
    const fareSnapshot: InterStateFareSnapshot = {
      calculationId,
      tripType: 'INTERSTATE_ONE_WAY',
      origin,
      destination,
      originState: originState.name,
      originStateCode: originState.code,
      destinationState: destinationState.name,
      destinationStateCode: destinationState.code,
      vehicleId: rate.vehicleId,
      vehicleName: rate.vehicleName,
      googleMapsDistanceKm: distanceKm,
      googleMapsDurationMinutes: durationMinutes,
      googleMapsDurationFormatted: durationFormatted,
      baseFare,
      perKmRate,
      minimumKm,
      includedKm,
      chargeableKm,
      distanceCharge,
      extraKm,
      extraPerKmRate,
      extraKmCharge,
      driverAllowance,
      stateCharges,
      tollCharge,
      tollMode: effectiveTollMode,
      otherAdditionalCharges: stopsCharge + this.additionalConfig.parkingCharge,
      subtotal,
      discount,
      tax,
      roundingAdjustment: rounding,
      finalFare,
      pricingVersion: rate.pricingVersion || this.currentPricingVersion,
      precedenceApplied,
      ruleDescription,
      calculatedAt: now.toISOString(),
      expiresAt: expiry,
    };

    return {
      success: true,
      calculationId,
      quoteExpiry: expiry,
      pricingVersion: rate.pricingVersion || this.currentPricingVersion,
      isInterState: true,
      tripClassification: 'INTER-STATE ONE-WAY',
      route: {
        origin,
        destination,
        originState: originState.name,
        originStateCode: originState.code,
        destinationState: destinationState.name,
        destinationStateCode: destinationState.code,
        isInterState: true,
        distanceMeters: Math.round(distanceKm * 1000),
        distanceKm,
        durationSeconds: durationMinutes * 60,
        durationMinutes,
        durationFormatted,
        stopsCount,
      },
      fare: {
        baseFare,
        minimumKm,
        includedKm,
        chargeableKm,
        perKmRate,
        distanceCharge,
        extraKm,
        extraPerKmRate,
        extraKmCharge,
        driverAllowance,
        stateCharges,
        tollCharge,
        tollMode: effectiveTollMode,
        additionalCharges,
        discount,
        tax,
        subtotal,
        rounding,
        finalFare,
      },
      detailedBreakdown,
      currency: 'INR',
      fareSnapshot,
    };
  }
}

export const serverInterStateStore = new InterStateOneWayStore();
