export type BookingTypeCategory = 'ONE_WAY' | 'ROUND_TRIP' | 'LOCAL' | 'AIRPORT_TRANSFER' | 'OUTSTATION';

export type FareEngineType = 'ENGINE_A' | 'ENGINE_B';

export type TripJurisdiction = 'INTRA_STATE' | 'INTER_STATE';

export type RouteCategory = 'INTRA_STATE' | 'INTER_STATE';

export interface GoogleMapsDrivingMetrics {
  distanceMeters: number;
  distanceKm: number;
  durationSeconds: number;
  durationMinutes: number;
  durationFormatted: string;
  trafficDelayMinutes?: number;
  trafficCongestionFactor?: number;
  isGhatTerrain?: boolean;
  terrainMultiplier?: number;
  tollEstimate?: number;
  highwayCorridor?: string;
  encodedPolyline?: string;
  isInterState?: boolean;
  originState?: string;
  destinationState?: string;
}

export type InterStatePricingMode = 'FLAT' | 'PER_KM' | 'STATE_PAIR';

export type DistanceRoundingRule = 'EXACT' | 'NEAREST_1' | 'NEAREST_5';

export type PricingModel =
  | 'DISTANCE_ONLY'
  | 'TIME_ONLY'
  | 'DISTANCE_AND_TIME'
  | 'BASE_PLUS_DISTANCE'
  | 'BASE_PLUS_TIME'
  | 'INTER_STATE_ONE_WAY'
  | 'ONE_WAY_FIXED_CORRIDOR';

export type RoundingRule = 'EXACT' | 'NEAREST_1' | 'NEAREST_10' | 'NEAREST_50';

export type TimeRoundingMethod =
  | 'EXACT'
  | 'BLOCK_30_MIN'
  | 'BLOCK_1_HOUR'
  | 'ROUND_UP'
  | 'ROUND_DOWN';

export type NightChargeType = 'NONE' | 'FIXED' | 'PER_KM' | 'PERCENTAGE';

export type PolicyType = 'INCLUDED' | 'AT_ACTUALS' | 'EXCLUDED' | 'FIXED_ESTIMATE';

export interface StatePairPricingRule {
  id: string;
  fromState: string;
  toState: string;
  ratesByVehicle?: Record<string, number>; // vehicleId -> charge amount (₹)
  chargeType?: 'FLAT' | 'PER_KM';
  amount?: number;
  vehicleId?: string;
  active: boolean;
  notes?: string;
  description?: string;
  updatedAt?: string;
}

export interface FareAuditLogEntry {
  id: string;
  adminUser?: string;
  user?: string;
  timestamp: string;
  vehicleId?: string;
  vehicleName?: string;
  action?: string;
  summary?: string;
  changedField?: string;
  changes?: any;
  oldValue?: any;
  newValue?: any;
  reason?: string;
  fareVersion?: string;
  pricingVersion?: number | string;
}

export interface VehicleBookingPricing {
  baseFare: number;
  perKmRate: number;
  includedKm: number; // 0 if all km are charged at perKmRate
  extraPerKmRate: number;
  includedHours: number;
  hourlyRate: number;
  perHourRate?: number;
  extraPerHourRate: number;
  driverAllowance: number;
  minimumKm: number;
  minimumHours?: number; // Minimum hours for local booking
  dailyMinimumKm?: number; // Daily minimum km for round trip booking (defaults to minimumKm or 300)
  minimumFare: number;
  active?: boolean;
  pricingModel: PricingModel;
  timeRounding: TimeRoundingMethod;
  tollPolicy: PolicyType;
  tollFixedAmount: number;
  parkingPolicy: PolicyType;
  parkingFixedAmount: number;
  permitPolicy: PolicyType;
  permitFixedAmount: number;
  taxPercentage: number; // e.g. 5% GST
  // Discount configuration
  discountType?: 'PERCENTAGE' | 'FIXED' | 'NONE';
  discountValue?: number; // e.g. 10 for 10% or 200 for ₹200
  discountAmount?: number;
  // Dedicated INTER-STATE column/rule exclusively for ONE WAY bookings
  interStateCharge?: number; // e.g. ₹500 for Sedan, ₹700 for SUV
  interStatePerKmRate?: number; // e.g. ₹3/km for PER_KM mode
  interStatePricingMode?: InterStatePricingMode;
  interStateChargeType?: 'FLAT' | 'PER_KM' | 'NONE';
}

export interface VehicleNightConfig {
  enabled: boolean;
  startHour: number; // e.g. 22 (10 PM)
  endHour: number;   // e.g. 6 (6 AM)
  chargeType: NightChargeType;
  amount: number;    // e.g. 10 (for 10%) or 300 (for ₹300)
}

export interface VehicleDynamicPricingConfig {
  id: string;
  vehicleId: string;
  vehicleName: string;
  vehicleCategory: string;
  active: boolean;
  pricingVersion: number;
  createdAt: string;
  updatedAt: string;
  updatedBy: string;
  effectiveFrom: string;
  roundingRule: RoundingRule;
  distanceRounding?: DistanceRoundingRule;
  interStatePricingMode?: InterStatePricingMode;
  interStatePerKmRate?: number;
  interStateCharge?: number;
  mode: 'MODERATE' | 'ADVANCED';
  pricingByBookingType: Record<BookingTypeCategory, VehicleBookingPricing>;
  nightConfig: VehicleNightConfig;
  airportSpecific?: {
    airportBaseFare?: number;
    airportPerKmRate?: number;
    airportExtraKmRate?: number;
    airportDriverAllowance?: number;
    airportParking?: number;
    airportPickupCharge?: number;
  };
}

export interface LocationDetailInfo {
  placeId?: string;
  formattedAddress?: string;
  lat?: number;
  lng?: number;
  state?: string;
  city?: string;
  country?: string;
}

export interface DynamicFareCalculationInput {
  origin: string;
  destination: string;
  distanceKm: number;
  durationMinutes: number;
  bookingType: BookingTypeCategory;
  vehicleId: string;
  pickupDateTime?: string;
  pickupTime?: string; // HH:MM
  roundTripDays?: number;
  airportTransferType?: 'pickup' | 'drop';
  viaStopsCount?: number;
  customPricingConfig?: VehicleDynamicPricingConfig;
  originState?: string;
  destinationState?: string;
  originDetails?: LocationDetailInfo | string;
  destinationDetails?: LocationDetailInfo | string;
  distanceRounding?: DistanceRoundingRule;
  statePairRules?: StatePairPricingRule[];
  engineType?: FareEngineType;
  trafficDelayMinutes?: number;
  isGhatTerrain?: boolean;
}

export interface FareSnapshot {
  vehicleId: string;
  vehicleType: string;
  engineType?: FareEngineType;
  baseFare: number;
  perKmRate: number;
  includedKm: number;
  extraPerKmRate: number;
  includedHours: number;
  hourlyRate: number;
  extraPerHourRate: number;
  driverAllowance: number;
  distanceKm: number;
  durationMinutes: number;
  durationHours: number;
  additionalCharges: number;
  subtotal?: number;
  discountType?: 'PERCENTAGE' | 'FIXED' | 'NONE';
  discountValue?: number;
  discountAmount?: number;
  originalFare?: number;
  roundingAdjustment?: number;
  totalFare: number;
  pricingVersion: number;
  currency: string;
  timestamp: string;
  pricingModel: PricingModel;
  routeCategory?: RouteCategory;
  originState?: string;
  destinationState?: string;
  interStateCharge?: number;
  interStateRate?: number;
  interStateAppliedRule?: string;
  roundTripDays?: number;
  dailyMinimumKm?: number;
}

export interface DynamicFareCalculationResult {
  distanceKm: number;
  durationMinutes: number;
  durationHours: number;
  durationFormatted: string;
  vehicleId: string;
  vehicleName: string;
  vehicleCategory: string;
  pricingVersion: number;
  pricingModel: PricingModel;
  baseFare: number;
  includedKm: number;
  billableKm: number;
  distanceFare: number;
  extraDistanceFare: number;
  includedHours: number;
  billableHours: number;
  hourlyFare: number;
  extraHourFare: number;
  driverAllowance: number;
  interStateCharge: number;
  routeCategory: RouteCategory;
  originState: string;
  destinationState: string;
  isInterState: boolean;
  interStateAppliedRule: string;
  distanceRoundingApplied: DistanceRoundingRule;
  nightCharge: number;
  taxes: number;
  tolls: number;
  parking: number;
  permits: number;
  additionalCharges: number;
  subtotal?: number;
  discountType?: 'PERCENTAGE' | 'FIXED' | 'NONE';
  discountValue?: number;
  discountAmount?: number;
  discountLabel?: string;
  originalFare?: number;
  minimumFareApplied: boolean;
  unroundedFare: number;
  roundingAdjustment?: number;
  totalFare: number;
  currency: string;
  fareBreakdown: Array<{ label: string; amount: number; detail?: string }>;
  timestamp: string;
  fareSnapshot: FareSnapshot;
  engineType?: FareEngineType;
  engineName?: string;
  engineDescription?: string;
  roundTripDays?: number;
  dailyMinimumKm?: number;
}

export interface DualEngineFareComparison {
  engineA: DynamicFareCalculationResult;
  engineB: DynamicFareCalculationResult;
  activeEngine: FareEngineType;
  recommendedEngine: FareEngineType;
  metrics: GoogleMapsDrivingMetrics;
  fareDifference: number;
  percentageDifference: number;
  summary: string;
}

export interface DualEngineVehicleComparison {
  vehicleId: string;
  vehicleName: string;
  engineAFare: number;
  engineBFare: number;
  difference: number;
  engineAResult: DynamicFareCalculationResult;
  engineBResult: DynamicFareCalculationResult;
}
