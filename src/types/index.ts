export type ServiceType = 'local' | 'oneway' | 'roundtrip' | 'airport';

export type AirportTransferType = 'pickup' | 'drop';

export interface PlaceSuggestion {
  placeId: string;
  placeName: string;         // e.g. "Kempegowda International Airport (KIAL)"
  areaLocality: string;      // e.g. "Devanahalli"
  city: string;              // e.g. "Bengaluru, Karnataka"
  formattedAddress: string;  // e.g. "KIAL Rd, Devanahalli, Bengaluru, Karnataka 560300"
  taluk?: string;            // e.g. "Devanahalli Taluk", "Srirangapatna Taluk", "Madikeri Taluk"
  district?: string;         // e.g. "Mysuru District", "Kodagu District", "Mandya District"
  village?: string;          // e.g. "Mandakalli", "Bylakuppe", "Melukote", "Nanjarayapatna"
  pincode?: string;
  landmark?: string;
  category?: 'airports' | 'mysuru_local' | 'mysuru_areas' | 'bengaluru_metro' | 'hill_stations' | 'wildlife_safari' | 'heritage_pilgrimage' | 'coastal_beach' | 'intercity_hub';
  types?: string[];
  isAirport?: boolean;
  lat?: number;
  lng?: number;
  popularDestination?: boolean;
  estimatedFromMysuruKm?: number;
  estimatedTravelTime?: string;
  description?: string;
  highlights?: string[];
}

export interface CalculatedRouteInfo {
  distanceKm: number;
  distanceMeters?: number;
  durationMinutes: number;
  durationFormatted: string; // e.g. "Approx. 32 min" or "3 hrs 15 min"
  summaryText: string;       // e.g. "12.8 km · Approx. 32 min"
  originAddress: string;
  destinationAddress: string;
  stopsCount: number;
  viaStops?: string[];
  encodedPolyline?: string;
  routeDescription?: string;
  highwayCorridor?: string;
  tollEstimate?: number;
  isAirportRoute?: boolean;
  originCoords?: { lat: number; lng: number };
  destinationCoords?: { lat: number; lng: number };
  dataSource?: 'google_maps' | 'intelligent_matrix' | 'geocoded_route';
}

export interface BookingSearchState {
  serviceType: ServiceType;
  pickupLocation: string;
  pickupLocationObj?: PlaceSuggestion;
  dropLocation: string;
  dropLocationObj?: PlaceSuggestion;
  viaLocations?: string[];
  travelDate: string; // Primary Pickup Date (YYYY-MM-DD)
  pickupDate?: string; // Explicit Pickup Date
  dropDate?: string; // Explicit Drop Date (YYYY-MM-DD)
  returnDate?: string; // Round Trip Return / Drop Date
  roundTripDays?: number; // Calculated or selected multi-day count (1 to 10+ days)
  pickupTime: string; // Pickup Time (HH:MM e.g. 09:00)
  dropTime?: string; // Drop Time
  returnTime?: string; // Round Trip Return Time
  durationHours: number; // e.g. 4, 8, 12
  extraKm?: number; // Optional planned extra KM for Local City Packages (e.g. +10 km, +20 km, +50 km)
  airportTransferType: AirportTransferType;
  passengers: number;
  vehicleType: string; // 'all' or vehicle id
  routeInfo?: CalculatedRouteInfo;
}

export interface Vehicle {
  id: string;
  name: string;
  category: string;
  seatingCapacity: number;
  luggageCapacity: number;
  description: string;
  features: string[];
  suitableServices: ServiceType[];
  comfortLevel: 'Executive' | 'Premium' | 'Luxury' | 'Group Comfort';
  basePriceFactor: number; // multiplier for vehicle tier
  badge?: string;
}

export interface VehiclePricingConfig {
  vehicleId: string;
  baseFare: number;              // Base starting fare (e.g. ₹300 for Sedan, ₹500 for SUV, ₹1200 for Tempo)
  
  // Local Package rates & allowance
  localPerKmRate: number;        // Local Package per KM Rate (e.g. ₹12/km, ₹15/km, ₹18/km, ₹30/km)
  localDriverAllowance: number;  // Local Driver Allowance (e.g. ₹250, ₹300, ₹350, ₹500)
  
  // One Way Drop rates & allowance
  oneWayPerKmRate: number;       // One way per KM Rate (e.g. ₹13/km, ₹16.5/km, ₹20/km, ₹33/km)
  oneWayDriverAllowance: number; // One way Driver Allowance (e.g. ₹300, ₹350, ₹450, ₹700)
  
  // Airport Transfer rates & allowance
  airportPerKmRate: number;      // Airport Transfer per KM rate (e.g. ₹13/km, ₹16/km, ₹19/km, ₹30/km)
  airportDriverAllowance: number;// Airport Transfer Driver Allowance (e.g. ₹250, ₹300, ₹350, ₹500)
  
  // General / Roundtrip / Package rates
  perKmFare: number;             // Roundtrip / General Per KM rate (e.g. ₹11/km, ₹14.5/km, ₹17.5/km)
  perHourFare: number;           // Per Hour rate for local city packages (e.g. ₹150/hr, ₹200/hr, ₹240/hr)
  driverAllowancePerDay: number; // Roundtrip Chauffeur day allowance (e.g. ₹300, ₹400, ₹450, ₹700)
  airportBaseFare: number;       // Airport corridor base rate (e.g. ₹699, ₹999, ₹1199, ₹2499)
  minKmPerDay?: number;          // Minimum billable km per day for outstation (e.g. 250km or 300km)
  nightChargePercentage?: number;
}

export interface PricingConfig {
  currencySymbol: string;
  currencyCode: string;
  baseFare: number;
  perKmFare: number;
  perHourFare: number;
  airportSurcharge: number;
  waitingChargePerHour: number;
  additionalPassengerCharge: number;
  nightChargePercentage: number;
  extraStopCharge: number;
  gstPercentage?: number;
  vehiclePricing: Record<string, VehiclePricingConfig>;
}

export interface FareEstimate {
  estimatedDistanceKm: number;
  estimatedDurationHours: number;
  baseFareAmount: number;
  distanceFareAmount: number;
  durationFareAmount: number;
  passengerSurchargeAmount: number;
  airportSurchargeAmount: number;
  totalEstimatedFare: number;
  roundTripDays?: number;
  includedMinKm?: number;
  breakdown: { label: string; amount: number }[];
}

export interface PassengerDetails {
  fullName: string;
  mobileNumber: string;
  email: string;
  passengersCount: number;
  specialInstructions: string;
}

export interface DriverDetails {
  driverName?: string;
  driverPhone?: string;
  driverVehiclePlate?: string;
  assignedAt?: string;
}

export interface BookingRequest {
  referenceId: string;
  searchDetails: BookingSearchState;
  selectedVehicle: Vehicle;
  passengerDetails: PassengerDetails;
  estimatedFare: FareEstimate;
  createdAt: string;
  status: 'Pending Confirmation' | 'Confirmed' | 'Driver Assigned' | 'Completed';
  driverDetails?: DriverDetails;
}

export interface SiteConfig {
  businessName: string;
  tagline: string;
  description: string;
  siteUrl: string;
  contact: {
    phone: string;
    whatsapp: string;
    email: string;
    businessHours: string;
  };
  socialProfiles: { platform: string; url: string }[];
}

export interface CustomerUser {
  id: string;
  fullName: string;
  mobileNumber: string;
  email?: string;
  defaultPickupLocation?: string;
  createdAt: string;
  totalTripsCount?: number;
}

export interface CustomerLoginNotification {
  id: string;
  customerId: string;
  fullName: string;
  mobileNumber: string;
  email?: string;
  loginTime: string;
  isNewRegistration: boolean;
  whatsappDispatched: boolean;
  ownerWhatsappNumber: string;
  formattedMessage: string;
  whatsappUrl: string;
}

export interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category?: string;
}

export interface DriverPartnerApplication {
  id: string;
  referenceId: string;
  fullName: string;
  mobileNumber: string;
  alternatePhone?: string;
  city: string; // Base city in Karnataka (e.g. Mysuru, Bengaluru, etc.)
  partnerType: 'driver_owner' | 'fleet_operator' | 'attached_driver' | 'vendor';
  fleetSize?: string;
  vehicleModel: string; // e.g. "Toyota Etios", "Maruti Ertiga", "Toyota Innova", "Innova Crysta", "Force Tempo Traveller"
  vehicleCategory: 'sedan' | 'ertiga' | 'innova' | 'crysta' | 'tempo' | 'other';
  registrationNumber: string; // e.g. "KA-09-AB-1234" (Yellow Board)
  manufacturingYear: string; // e.g. "2023"
  fuelType: 'diesel' | 'petrol' | 'cng' | 'electric';
  hasAC: boolean;
  permitType: 'karnataka_state' | 'aitp_all_india' | 'local_permit';
  preferredTrips: string[]; // e.g. ['oneway_expressway', 'airport_drops', 'outstation_tours', 'local_packages']
  insuranceDetails?: {
    isInsured: boolean;
    validityDate?: string;
    insuranceType?: 'comprehensive' | 'third_party';
    docName?: string;
    docDataUrl?: string;
  };
  fitnessDetails?: {
    isFitnessValid: boolean;
    validityDate?: string;
    docName?: string;
    docDataUrl?: string;
  };
  carImage?: string; // base64 preview or asset URL
  carImageName?: string;
  documentsReady: {
    commercialDL: boolean;
    rcAndInsurance: boolean;
    vehicleFitness: boolean;
    policeVerification: boolean;
  };
  additionalNotes?: string;
  createdAt: string;
  status: 'New Inquiry' | 'Under Review' | 'Verified' | 'Active Partner';
}

export interface GroundedPlace {
  title: string;
  uri: string;
  reviewSnippet?: string;
  address?: string;
}
