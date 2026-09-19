export interface IndianState {
  code: string; // e.g. "KA", "TN", "KL", "AP", "TS", "GA", "MH", "DL", etc.
  name: string; // e.g. "Karnataka", "Tamil Nadu", "Kerala"
  type: 'STATE' | 'UNION_TERRITORY';
  active: boolean;
  capital?: string;
  aliases?: string[];
  majorCities?: string[];
}

export interface InterStateOneWayVehicleRate {
  id: string;
  vehicleId: string;
  vehicleName: string;
  vehicleCategory: string;
  baseFare: number;
  perKmRate: number;
  minimumKm: number;
  includedKm: number; // 0 if all km are charged at perKmRate or minimumKm
  extraPerKmRate: number;
  driverAllowance: number;
  minimumFare: number;
  maximumFare?: number;
  active: boolean;
  effectiveFrom: string;
  effectiveUntil?: string;
  pricingVersion: string; // e.g. "ISOW-2026-001"
  notes?: string;
}

export interface InterStateStatePairRule {
  id: string;
  fromState: string;
  fromStateCode: string;
  toState: string;
  toStateCode: string;
  ratesByVehicle: Record<string, number>; // vehicleId -> specific border permit / entry fee (₹)
  active: boolean;
  description?: string;
  effectiveDate?: string;
}

export interface InterStateRouteRule {
  id: string;
  originRegion: string;
  destinationRegion: string;
  vehicleId: string;
  overrideBaseFare?: number;
  overridePerKmRate?: number;
  overrideDriverAllowance?: number;
  flatFareOverride?: number;
  active: boolean;
  effectiveDate?: string;
  notes?: string;
}

export type InterStateTollMode = 'INCLUDED' | 'ADDITIONAL';

export interface InterStateAdditionalChargeConfig {
  tollMode: InterStateTollMode;
  defaultTollEstimate: number;
  permitChargeEnabled: boolean;
  borderTaxEnabled: boolean;
  parkingCharge: number;
  serviceTaxPercentage: number; // e.g. 0 or 5
  roundingRule: 'EXACT' | 'NEAREST_10' | 'NEAREST_50' | 'CEIL_10';
  distanceRounding: 'EXACT' | 'NEAREST_1' | 'NEAREST_5';
  quoteValidityMinutes: number; // default 15
}

export interface InterStateFareCalculationInput {
  origin: string;
  destination: string;
  originDetails?: {
    placeId?: string;
    formattedAddress?: string;
    state?: string;
    stateCode?: string;
    lat?: number;
    lng?: number;
    city?: string;
  };
  destinationDetails?: {
    placeId?: string;
    formattedAddress?: string;
    state?: string;
    stateCode?: string;
    lat?: number;
    lng?: number;
    city?: string;
  };
  vehicleId: string;
  distanceKm: number;
  durationMinutes: number;
  stops?: Array<{
    address: string;
    placeId?: string;
    lat?: number;
    lng?: number;
  }>;
  pickupDate?: string;
  pickupTime?: string;
  applyTollMode?: InterStateTollMode;
}

export interface InterStateFareSnapshot {
  calculationId: string;
  tripType: 'INTERSTATE_ONE_WAY';
  origin: string;
  destination: string;
  originState: string;
  originStateCode: string;
  destinationState: string;
  destinationStateCode: string;
  vehicleId: string;
  vehicleName: string;
  googleMapsDistanceKm: number;
  googleMapsDurationMinutes: number;
  googleMapsDurationFormatted: string;
  baseFare: number;
  perKmRate: number;
  minimumKm: number;
  includedKm: number;
  chargeableKm: number;
  distanceCharge: number;
  extraKm: number;
  extraPerKmRate: number;
  extraKmCharge: number;
  driverAllowance: number;
  stateCharges: number;
  tollCharge: number;
  tollMode: InterStateTollMode;
  otherAdditionalCharges: number;
  subtotal: number;
  discount: number;
  tax: number;
  roundingAdjustment: number;
  finalFare: number;
  pricingVersion: string;
  precedenceApplied: 'ROUTE_OVERRIDE' | 'STATE_PAIR_OVERRIDE' | 'VEHICLE_RATE' | 'GLOBAL_FALLBACK';
  ruleDescription: string;
  calculatedAt: string;
  expiresAt: string;
}

export interface InterStateFareCalculationResult {
  success: boolean;
  error?: string;
  errorMessage?: string;
  isInterState: boolean;
  tripClassification?: 'INTER-STATE ONE-WAY' | 'INTRA-STATE';
  calculationId?: string;
  quoteExpiry?: string;
  pricingVersion?: string;
  route?: {
    origin: string;
    destination: string;
    originState: string;
    originStateCode: string;
    destinationState: string;
    destinationStateCode: string;
    isInterState: boolean;
    distanceMeters: number;
    distanceKm: number;
    durationSeconds: number;
    durationMinutes: number;
    durationFormatted: string;
    stopsCount: number;
  };
  fare?: {
    baseFare: number;
    minimumKm: number;
    includedKm: number;
    chargeableKm: number;
    perKmRate: number;
    distanceCharge: number;
    extraKm: number;
    extraPerKmRate: number;
    extraKmCharge: number;
    driverAllowance: number;
    stateCharges: number;
    tollCharge: number;
    tollMode: InterStateTollMode;
    additionalCharges: number;
    discount: number;
    tax: number;
    subtotal: number;
    rounding: number;
    finalFare: number;
  };
  detailedBreakdown?: Array<{
    label: string;
    amount: number;
    detail?: string;
  }>;
  currency: 'INR';
  fareSnapshot?: InterStateFareSnapshot;
}

export interface InterStateTestCaseResult {
  id: string;
  testNumber: number;
  title: string;
  description: string;
  expectedOutcome: string;
  actualOutcome: string;
  passed: boolean;
  executionTimeMs: number;
  details?: any;
}
