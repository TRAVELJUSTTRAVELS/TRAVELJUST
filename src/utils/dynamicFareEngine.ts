import {
  BookingTypeCategory,
  DynamicFareCalculationInput,
  DynamicFareCalculationResult,
  FareSnapshot,
  RoundingRule,
  TimeRoundingMethod,
  VehicleBookingPricing,
  VehicleDynamicPricingConfig,
} from '../types/dynamicPricing';

export const DEFAULT_VEHICLE_CONFIGS: Record<string, VehicleDynamicPricingConfig> = {
  'sedan-4-1': {
    id: 'cfg_sedan_4_1',
    vehicleId: 'sedan-4-1',
    vehicleName: 'SEDAN (4+1)',
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
        perKmRate: 14,
        includedKm: 0,
        extraPerKmRate: 13,
        includedHours: 0,
        hourlyRate: 250,
        extraPerHourRate: 150,
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
        includedHours: 12,
        hourlyRate: 200,
        extraPerHourRate: 150,
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
        perKmRate: 14,
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
        perKmRate: 14,
        includedKm: 0,
        extraPerKmRate: 13,
        includedHours: 3,
        hourlyRate: 250,
        extraPerHourRate: 150,
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
        includedHours: 12,
        hourlyRate: 250,
        extraPerHourRate: 150,
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

  'toyota-etios': {
    id: 'cfg_toyota_etios',
    vehicleId: 'toyota-etios',
    vehicleName: 'TOYOTA ETIOS (4+1)',
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
        perKmRate: 14,
        includedKm: 0,
        extraPerKmRate: 13,
        includedHours: 0,
        hourlyRate: 250,
        extraPerHourRate: 150,
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
        includedHours: 12,
        hourlyRate: 200,
        extraPerHourRate: 150,
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
        perKmRate: 14,
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
        perKmRate: 14,
        includedKm: 0,
        extraPerKmRate: 13,
        includedHours: 3,
        hourlyRate: 250,
        extraPerHourRate: 150,
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
        includedHours: 12,
        hourlyRate: 250,
        extraPerHourRate: 150,
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

  'swift-desire': {
    id: 'cfg_swift_desire',
    vehicleId: 'swift-desire',
    vehicleName: 'SWIFT DESIRE (4+1)',
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
        perKmRate: 14,
        includedKm: 0,
        extraPerKmRate: 13,
        includedHours: 0,
        hourlyRate: 250,
        extraPerHourRate: 150,
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
        includedKm: 300,
        extraPerKmRate: 13,
        includedHours: 12,
        hourlyRate: 200,
        extraPerHourRate: 150,
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
        perKmRate: 14,
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
        perKmRate: 14,
        includedKm: 0,
        extraPerKmRate: 13,
        includedHours: 3,
        hourlyRate: 250,
        extraPerHourRate: 150,
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
        includedHours: 12,
        hourlyRate: 250,
        extraPerHourRate: 150,
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

  'ertiga': {
    id: 'cfg_ertiga',
    vehicleId: 'ertiga',
    vehicleName: 'ERTIGA (6+1)',
    vehicleCategory: 'MUV (6+1)',
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
        hourlyRate: 350,
        extraPerHourRate: 200,
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
        includedHours: 12,
        hourlyRate: 300,
        extraPerHourRate: 200,
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
        extraPerKmRate: 15,
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
        includedHours: 3,
        hourlyRate: 350,
        extraPerHourRate: 200,
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
        includedHours: 12,
        hourlyRate: 350,
        extraPerHourRate: 200,
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
        perKmRate: 18,
        includedKm: 0,
        extraPerKmRate: 15,
        includedHours: 0,
        hourlyRate: 350,
        extraPerHourRate: 200,
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
        perKmRate: 17.5,
        includedKm: 300,
        extraPerKmRate: 15,
        includedHours: 12,
        hourlyRate: 320,
        extraPerHourRate: 200,
        driverAllowance: 400,
        minimumKm: 300,
        minimumFare: 5250,
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
        extraPerKmRate: 15,
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
        perKmRate: 18,
        includedKm: 0,
        extraPerKmRate: 16,
        includedHours: 3,
        hourlyRate: 350,
        extraPerHourRate: 200,
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
        perKmRate: 18,
        includedKm: 300,
        extraPerKmRate: 16,
        includedHours: 12,
        hourlyRate: 350,
        extraPerHourRate: 200,
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
      airportBaseFare: 1199,
      airportPerKmRate: 18,
      airportExtraKmRate: 16,
      airportDriverAllowance: 350,
      airportParking: 0,
      airportPickupCharge: 0,
    },
  },

  'innova-6-1': {
    id: 'cfg_innova_6_1',
    vehicleId: 'innova-6-1',
    vehicleName: 'INNOVA 6+1',
    vehicleCategory: 'Innova (6+1)',
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
        hourlyRate: 350,
        extraPerHourRate: 200,
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
        perKmRate: 17.5,
        includedKm: 300,
        extraPerKmRate: 15,
        includedHours: 12,
        hourlyRate: 320,
        extraPerHourRate: 200,
        driverAllowance: 400,
        minimumKm: 300,
        minimumFare: 5250,
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
        extraPerKmRate: 15,
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
        perKmRate: 18,
        includedKm: 0,
        extraPerKmRate: 16,
        includedHours: 3,
        hourlyRate: 350,
        extraPerHourRate: 200,
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
        perKmRate: 18,
        includedKm: 300,
        extraPerKmRate: 16,
        includedHours: 12,
        hourlyRate: 350,
        extraPerHourRate: 200,
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
      airportBaseFare: 1199,
      airportPerKmRate: 18,
      airportExtraKmRate: 16,
      airportDriverAllowance: 350,
      airportParking: 0,
      airportPickupCharge: 0,
    },
  },

  'innova-7-1': {
    id: 'cfg_innova_7_1',
    vehicleId: 'innova-7-1',
    vehicleName: 'INNOVA 7+1',
    vehicleCategory: 'Innova (7+1)',
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
        baseFare: 750,
        perKmRate: 19,
        includedKm: 0,
        extraPerKmRate: 16,
        includedHours: 0,
        hourlyRate: 380,
        extraPerHourRate: 220,
        driverAllowance: 450,
        minimumKm: 10,
        minimumFare: 1000,
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
        baseFare: 750,
        perKmRate: 18.5,
        includedKm: 300,
        extraPerKmRate: 16,
        includedHours: 12,
        hourlyRate: 340,
        extraPerHourRate: 220,
        driverAllowance: 450,
        minimumKm: 300,
        minimumFare: 5550,
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
        baseFare: 750,
        perKmRate: 19,
        includedKm: 80,
        extraPerKmRate: 16,
        includedHours: 8,
        hourlyRate: 380,
        extraPerHourRate: 220,
        driverAllowance: 450,
        minimumKm: 40,
        minimumFare: 2600,
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
        baseFare: 1249,
        perKmRate: 19,
        includedKm: 0,
        extraPerKmRate: 17,
        includedHours: 3,
        hourlyRate: 380,
        extraPerHourRate: 220,
        driverAllowance: 400,
        minimumKm: 30,
        minimumFare: 1900,
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
        baseFare: 850,
        perKmRate: 19,
        includedKm: 300,
        extraPerKmRate: 17,
        includedHours: 12,
        hourlyRate: 380,
        extraPerHourRate: 220,
        driverAllowance: 450,
        minimumKm: 300,
        minimumFare: 5700,
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
      airportBaseFare: 1249,
      airportPerKmRate: 19,
      airportExtraKmRate: 17,
      airportDriverAllowance: 400,
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
        hourlyRate: 500,
        extraPerHourRate: 300,
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
        includedHours: 12,
        hourlyRate: 450,
        extraPerHourRate: 300,
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
        includedHours: 3,
        hourlyRate: 500,
        extraPerHourRate: 300,
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
        includedHours: 12,
        hourlyRate: 500,
        extraPerHourRate: 300,
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
        hourlyRate: 500,
        extraPerHourRate: 300,
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
        includedHours: 12,
        hourlyRate: 500,
        extraPerHourRate: 350,
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
        includedHours: 4,
        hourlyRate: 600,
        extraPerHourRate: 400,
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
        includedHours: 12,
        hourlyRate: 600,
        extraPerHourRate: 400,
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

  // 1-5: Validate inputs & Google route metrics
  const distanceKm = Math.max(0, Number(rawDistanceKm.toFixed(2)));
  const durationMinutes = Math.max(0, Math.round(rawDurationMinutes));
  const rawDurationHours = durationMinutes / 60;
  const durationFormatted = formatDurationText(durationMinutes);

  // 6-7: Load vehicle configuration for booking type
  const vehicleConfig =
    customPricingConfig ||
    DEFAULT_VEHICLE_CONFIGS[vehicleId] ||
    DEFAULT_VEHICLE_CONFIGS['sedan-4-1'] ||
    DEFAULT_VEHICLE_CONFIGS['toyota-etios'];
  const pricingRule: VehicleBookingPricing =
    vehicleConfig.pricingByBookingType?.[bookingType] ||
    vehicleConfig.pricingByBookingType?.['ONE_WAY'] ||
    (DEFAULT_VEHICLE_CONFIGS['sedan-4-1'] || DEFAULT_VEHICLE_CONFIGS['toyota-etios']).pricingByBookingType.ONE_WAY;

  const pricingModel = pricingRule.pricingModel || 'BASE_PLUS_DISTANCE';
  const roundingRule = vehicleConfig.roundingRule || 'NEAREST_10';
  const timeRounding = pricingRule.timeRounding || 'BLOCK_30_MIN';

  // 8: Apply Base Fare
  let baseFare = pricingRule.baseFare;
  if (bookingType === 'AIRPORT_TRANSFER' && vehicleConfig.airportSpecific?.airportBaseFare) {
    baseFare = vehicleConfig.airportSpecific.airportBaseFare;
  }

  // 9-11: Apply Included KM, Per KM, and Extra Per KM rules
  // Handle Round Trip daily multiplier
  let includedKm = pricingRule.includedKm;
  let billableKm = distanceKm;
  let distanceFare = 0;
  let extraDistanceFare = 0;

  if (bookingType === 'ROUND_TRIP') {
    // For round trip: road distance is doubled, with minimum per day included
    const days = Math.max(1, roundTripDays);
    const minIncluded = (pricingRule.minimumKm || 300) * days;
    const actualRtKm = distanceKm * 2;
    billableKm = Math.max(actualRtKm, minIncluded);
    includedKm = minIncluded;

    const perKm = pricingRule.perKmRate;
    distanceFare = billableKm * perKm;
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

    if (includedKm > 0) {
      if (distanceKm <= includedKm) {
        distanceFare = distanceKm * perKmRate;
      } else {
        distanceFare = includedKm * perKmRate;
        const extraKm = distanceKm - includedKm;
        extraDistanceFare = extraKm * extraPerKmRate;
      }
    } else {
      distanceFare = distanceKm * perKmRate;
    }
  }

  // 12-14: Apply duration & hourly pricing based on PricingModel
  // Only charge duration if pricing model includes TIME
  const chargesDuration =
    pricingModel === 'TIME_ONLY' ||
    pricingModel === 'DISTANCE_AND_TIME' ||
    pricingModel === 'BASE_PLUS_TIME';

  const roundedDurationHours = roundDurationHours(rawDurationHours, timeRounding);
  let hourlyFare = 0;
  let extraHourFare = 0;
  let billableHours = 0;
  const includedHours = pricingRule.includedHours;

  if (chargesDuration) {
    billableHours = roundedDurationHours;
    const hourlyRate = pricingRule.hourlyRate;
    const extraPerHourRate = pricingRule.extraPerHourRate;

    if (includedHours > 0) {
      if (billableHours <= includedHours) {
        hourlyFare = billableHours * hourlyRate;
      } else {
        hourlyFare = includedHours * hourlyRate;
        const extraHours = billableHours - includedHours;
        extraHourFare = extraHours * extraPerHourRate;
      }
    } else {
      hourlyFare = billableHours * hourlyRate;
    }
  }

  // 15: Apply Driver Allowance
  let driverAllowance = pricingRule.driverAllowance;
  if (bookingType === 'ROUND_TRIP') {
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
    coreFare + driverAllowance + nightCharge + tolls + parking + permits + viaStopsCharge;

  // 18: Apply Minimum Fare constraint
  let minimumFareApplied = false;
  let runningTotal = subtotalBeforeMin;
  const minFare = pricingRule.minimumFare || 0;
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

  if (baseFare > 0 && (pricingModel === 'BASE_PLUS_DISTANCE' || pricingModel === 'BASE_PLUS_TIME' || pricingModel === 'DISTANCE_AND_TIME')) {
    breakdown.push({
      label: `Base Fare (${vehicleConfig.vehicleName})`,
      amount: Math.round(baseFare),
    });
  }

  if (bookingType === 'ROUND_TRIP') {
    const days = Math.max(1, roundTripDays);
    breakdown.push({
      label: `Round Trip Road Distance (${Math.round(billableKm)} km billed · ${days} Day${days > 1 ? 's' : ''})`,
      amount: Math.round(distanceFare),
      detail: `Min. ${includedKm} km included`,
    });
  } else if (distanceFare > 0) {
    const kmLabel = includedKm > 0 ? `${includedKm} km included` : `${distanceKm} km`;
    breakdown.push({
      label: `Distance Charge (${kmLabel})`,
      amount: Math.round(distanceFare),
    });
  }

  if (extraDistanceFare > 0) {
    const extraKm = Math.max(0, distanceKm - includedKm);
    breakdown.push({
      label: `Extra Distance (${extraKm.toFixed(1)} km)`,
      amount: Math.round(extraDistanceFare),
    });
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

  if (viaStopsCharge > 0) {
    breakdown.push({
      label: `Via Stops (${viaStopsCount} stops)`,
      amount: Math.round(viaStopsCharge),
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
      amount: Math.max(0, totalFare - subtotalBeforeMin),
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
    distanceKm,
    durationMinutes,
    durationHours: Number(rawDurationHours.toFixed(2)),
    additionalCharges: nightCharge + tolls + parking + permits + taxes + viaStopsCharge,
    totalFare,
    pricingVersion: vehicleConfig.pricingVersion,
    currency: 'INR',
    timestamp,
    pricingModel,
  };

  return {
    distanceKm,
    durationMinutes,
    durationHours: Number(rawDurationHours.toFixed(2)),
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
    nightCharge: Math.round(nightCharge),
    taxes: Math.round(taxes),
    tolls: Math.round(tolls),
    parking: Math.round(parking),
    permits: Math.round(permits),
    additionalCharges: Math.round(nightCharge + tolls + parking + permits + taxes + viaStopsCharge),
    minimumFareApplied,
    unroundedFare,
    totalFare,
    currency: 'INR',
    fareBreakdown: breakdown,
    timestamp,
    fareSnapshot,
  };
}
