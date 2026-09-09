export type BookingTypeCategory = 'ONE_WAY' | 'ROUND_TRIP' | 'LOCAL' | 'AIRPORT_TRANSFER' | 'OUTSTATION';

export type PricingModel =
  | 'DISTANCE_ONLY'
  | 'TIME_ONLY'
  | 'DISTANCE_AND_TIME'
  | 'BASE_PLUS_DISTANCE'
  | 'BASE_PLUS_TIME';

export type RoundingRule = 'EXACT' | 'NEAREST_1' | 'NEAREST_10' | 'NEAREST_50';

export type TimeRoundingMethod =
  | 'EXACT'
  | 'BLOCK_30_MIN'
  | 'BLOCK_1_HOUR'
  | 'ROUND_UP'
  | 'ROUND_DOWN';

export type NightChargeType = 'NONE' | 'FIXED' | 'PER_KM' | 'PERCENTAGE';

export type PolicyType = 'INCLUDED' | 'AT_ACTUALS' | 'EXCLUDED' | 'FIXED_ESTIMATE';

export interface VehicleBookingPricing {
  baseFare: number;
  perKmRate: number;
  includedKm: number; // 0 if all km are charged at perKmRate
  extraPerKmRate: number;
  includedHours: number;
  hourlyRate: number;
  extraPerHourRate: number;
  driverAllowance: number;
  minimumKm: number;
  minimumFare: number;
  pricingModel: PricingModel;
  timeRounding: TimeRoundingMethod;
  tollPolicy: PolicyType;
  tollFixedAmount: number;
  parkingPolicy: PolicyType;
  parkingFixedAmount: number;
  permitPolicy: PolicyType;
  permitFixedAmount: number;
  taxPercentage: number; // e.g. 5% GST
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
}

export interface FareSnapshot {
  vehicleId: string;
  vehicleType: string;
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
  totalFare: number;
  pricingVersion: number;
  currency: string;
  timestamp: string;
  pricingModel: PricingModel;
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
  nightCharge: number;
  taxes: number;
  tolls: number;
  parking: number;
  permits: number;
  additionalCharges: number;
  minimumFareApplied: boolean;
  unroundedFare: number;
  totalFare: number;
  currency: string;
  fareBreakdown: Array<{ label: string; amount: number; detail?: string }>;
  timestamp: string;
  fareSnapshot: FareSnapshot;
}
