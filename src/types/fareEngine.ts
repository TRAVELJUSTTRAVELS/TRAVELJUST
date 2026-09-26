export type FareVehicleId =
  | 'sedan-4-1'
  | 'suv-6-1'
  | 'innova'
  | 'innova-crysta'
  | 'tempo-traveller-12-1';

export type ServiceTypeCategory = 'LOCAL' | 'ONE_WAY' | 'ROUND_TRIP' | 'AIRPORT' | 'INTER_STATE_ONE_WAY';

export type DiscountType = 'PERCENTAGE' | 'FIXED' | 'NONE';

export interface VehicleMetaInfo {
  id: FareVehicleId;
  name: string;
  code: string;
  models: string;
  seats: string;
  luggage: string;
  badgeColor: string;
}

export const FARE_VEHICLES_META: VehicleMetaInfo[] = [
  {
    id: 'sedan-4-1',
    name: 'SEDAN — 4+1',
    code: 'Sedan',
    models: 'Toyota Etios, Swift Dzire',
    seats: '4+1 Seater',
    luggage: '2 Medium Bags',
    badgeColor: 'bg-blue-100 text-blue-900 border-blue-300',
  },
  {
    id: 'suv-6-1',
    name: 'SUV — 6+1',
    code: 'SUV',
    models: 'Maruti Ertiga',
    seats: '6+1 Seater',
    luggage: '3 Bags',
    badgeColor: 'bg-emerald-100 text-emerald-900 border-emerald-300',
  },
  {
    id: 'innova',
    name: 'INNOVA',
    code: 'Innova',
    models: 'Toyota Innova (Standard)',
    seats: '6+1 / 7+1 Seater',
    luggage: '4 Large Bags',
    badgeColor: 'bg-amber-100 text-amber-900 border-amber-300',
  },
  {
    id: 'innova-crysta',
    name: 'INNOVA CRYSTA',
    code: 'Innova Crysta',
    models: 'Toyota Innova Crysta (Luxury)',
    seats: '6+1 / 7+1 Seater',
    luggage: '4 Large Bags',
    badgeColor: 'bg-purple-100 text-purple-900 border-purple-300',
  },
  {
    id: 'tempo-traveller-12-1',
    name: 'TEMPO TRAVELLER — 12+1',
    code: 'Tempo',
    models: 'Force Urbania / Traveller',
    seats: '12+1 Seater',
    luggage: '8-10 Bags',
    badgeColor: 'bg-rose-100 text-rose-900 border-rose-300',
  },
];

export interface LocalPricing {
  baseFare: number;
  driverAllowance: number;
  perKmRate: number;
  perHourRate: number;
  extraPerKmRate: number;
  extraPerHourRate: number;
  includedKm: number;
  includedHours: number;
  discountType: DiscountType;
  discountValue: number;
}

export interface OneWayPricing {
  baseFare: number;
  driverAllowance: number;
  perKmRate: number;
  extraPerKmRate: number;
  includedKm: number;
  minBillableKm?: number;
  discountType: DiscountType;
  discountValue: number;
}

export interface RoundTripPricing {
  driverAllowance: number;
  perKmRate: number;
  dailyMinimumKm: number;
  discountType: DiscountType;
  discountValue: number;
}

export interface AirportPricing {
  baseFare: number;
  driverAllowance: number;
  perKmRate: number;
  extraPerKmRate: number;
  discountType: DiscountType;
  discountValue: number;
}

export interface InterStateOneWayPricing {
  baseFare: number;
  driverAllowance: number;
  perKmRate: number;
  extraPerKmRate: number;
  minimumBillableKm: number;
  includedKm: number;
  tollCharges: number;
  parkingCharges: number;
  permitStateTaxCharges: number;
  stateEntryCharges: number;
  otherCharges: number;
  includeTolls: boolean;
  includePermit: boolean;
  includeStateEntry: boolean;
  includeOtherCharges: boolean;
  discountType: DiscountType;
  discountValue: number;
  gstPercentage: number;
  active: boolean;
}

export type OneWayCorridorId = 'MYSURU_KIA_AIRPORT' | 'MYSURU_BENGALURU_CITY';

export interface OneWayFixedCorridorConfig {
  id: OneWayCorridorId;
  corridorName: string;
  fromLocation: string;
  toLocation: string;
  referenceDistanceKm: number;
  distanceLabel: string;
  durationHours: number;
  rates: {
    'sedan-4-1': number;
    'suv-6-1': number;
    'innova': number;
    'innova-crysta': number;
    'tempo-traveller-12-1'?: number;
    [key: string]: number | undefined;
  };
  active: boolean;
  bidirectional: boolean;
}

export interface CentralizedFareConfig {
  version: number;
  versionCode?: string;
  status?: 'ACTIVE' | 'DRAFT' | 'INACTIVE';
  lastUpdatedFormatted?: string;
  updatedAt: string;
  updatedBy: string;
  local: Record<FareVehicleId, LocalPricing>;
  oneWay: Record<FareVehicleId, OneWayPricing>;
  roundTrip: Record<FareVehicleId, RoundTripPricing>;
  airport: Record<FareVehicleId, AirportPricing>;
  interStateOneWay: Record<FareVehicleId, InterStateOneWayPricing>;
  fixedCorridors?: Record<OneWayCorridorId, OneWayFixedCorridorConfig>;
}

export interface FareHistoryEntry {
  id: string;
  timestamp: string;
  user: string;
  serviceType: ServiceTypeCategory | 'GLOBAL';
  vehicleId?: FareVehicleId | 'all';
  vehicleName?: string;
  fareCategory?: string;
  field?: string;
  previousPrice?: number | string;
  newPrice?: number | string;
  action: 'UPDATE' | 'DISCOUNT_UPDATE' | 'RESET' | 'INITIALIZE';
  previousValue?: string | number | Record<string, any>;
  newValue?: string | number | Record<string, any>;
  discountChange?: string;
  updateStatus: 'SUCCESS' | 'ACTIVE';
  pricingVersion?: string | number;
  saveStatus?: 'SUCCESS' | 'FAILED';
  notes?: string;
}

export interface FareBreakdownLine {
  label: string;
  amount: number;
  type?: 'base' | 'driver' | 'km' | 'hour' | 'extra_km' | 'extra_hour' | 'discount' | 'other';
}

export interface FareCalculationResult {
  serviceType: ServiceTypeCategory;
  vehicleId: FareVehicleId;
  vehicleName: string;
  distanceKm: number;
  durationHours?: number;
  travelDays?: number;
  baseFare: number;
  driverAllowance: number;
  kmCharge: number;
  extraKmCharge: number;
  hourCharge: number;
  extraHourCharge: number;
  originalFare: number;
  discountAmount: number;
  discountLabel?: string;
  finalFare: number;
  breakdown: FareBreakdownLine[];
}

export interface FareDiscountConfigModalState {
  isOpen: boolean;
  serviceType: ServiceTypeCategory | 'ALL';
  vehicleId: FareVehicleId | 'ALL';
  discountType: DiscountType;
  discountValue: number;
}
