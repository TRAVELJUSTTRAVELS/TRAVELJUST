import { BookingRequest, Vehicle } from '../types';
import { vehiclesData } from '../data/vehicles';
import { db } from '../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

export type TrackingStage =
  | 'REQUEST_RECEIVED'
  | 'UNDER_REVIEW'
  | 'APPROVED'
  | 'CHAUFFEUR_ASSIGNED'
  | 'IN_PROGRESS'
  | 'COMPLETED';

export interface TrackingStep {
  stage: TrackingStage;
  label: string;
  sublabel: string;
  timestamp?: string;
  isCompleted: boolean;
  isCurrent: boolean;
}

export interface LiveVehicleLocation {
  lat: number;
  lng: number;
  heading: number; // in degrees (0 - 360)
  speedKmh: number;
  lastUpdated: string;
  distanceRemainingKm: number;
  estimatedArrivalMinutes: number;
  statusText: string;
}

export interface LiveTrackingDetails {
  booking: BookingRequest;
  currentStage: TrackingStage;
  stageIndex: number;
  steps: TrackingStep[];
  progressPercent: number;
  chauffeur?: {
    name: string;
    phone: string;
    avatarUrl?: string;
    rating: number;
    tripsCompleted: number;
    vehicleModel: string;
    vehiclePlateNumber: string;
    vehicleColor?: string;
    securityOtp: string; // 4-digit ride verification code
  };
  routeCoordinates: {
    pickup: { lat: number; lng: number; address: string };
    drop?: { lat: number; lng: number; address: string };
  };
  liveLocation?: LiveVehicleLocation;
  lastRefreshedAt: string;
}

// Coordinate lookups for prominent Mysuru corridors to anchor realistic Google Maps tracking
const KNOWN_COORDS: Record<string, { lat: number; lng: number }> = {
  mysore_palace: { lat: 12.3051, lng: 76.6551 },
  mysuru_suburb: { lat: 12.3069, lng: 76.6575 },
  mysore_station: { lat: 12.3168, lng: 76.6444 },
  blr_airport: { lat: 13.1986, lng: 77.7066 },
  bengaluru: { lat: 12.9716, lng: 77.5946 },
  coorg: { lat: 12.4244, lng: 75.7382 },
  ooty: { lat: 11.4102, lng: 76.695 },
  wayanad: { lat: 11.6854, lng: 76.132 },
  chamundi: { lat: 12.2745, lng: 76.6705 },
  vijayanagar: { lat: 12.3389, lng: 76.6195 },
  gokulam: { lat: 12.3276, lng: 76.6341 },
  hebbal: { lat: 12.3619, lng: 76.6083 },
};

export function resolveCoordinates(address?: string, fallback = { lat: 12.3051, lng: 76.6551 }): { lat: number; lng: number } {
  if (!address) return fallback;
  const lower = address.toLowerCase();
  for (const [key, coords] of Object.entries(KNOWN_COORDS)) {
    if (lower.includes(key.replace('_', ' '))) {
      return coords;
    }
  }
  if (lower.includes('airport') || lower.includes('kial') || lower.includes('blr')) {
    return KNOWN_COORDS.blr_airport;
  }
  if (lower.includes('bengaluru') || lower.includes('bangalore')) {
    return KNOWN_COORDS.bengaluru;
  }
  if (lower.includes('coorg') || lower.includes('madikeri')) {
    return KNOWN_COORDS.coorg;
  }
  if (lower.includes('ooty')) {
    return KNOWN_COORDS.ooty;
  }
  if (lower.includes('wayanad')) {
    return KNOWN_COORDS.wayanad;
  }
  if (lower.includes('chamundi')) {
    return KNOWN_COORDS.chamundi;
  }
  // Default jittered around Mysuru center
  return fallback;
}

export function mapStatusToStage(statusStr?: string): { stage: TrackingStage; index: number } {
  const norm = (statusStr || '').toUpperCase().trim();

  if (norm.includes('COMPLETED') || norm.includes('FINISHED') || norm.includes('DROPPED')) {
    return { stage: 'COMPLETED', index: 5 };
  }
  if (
    norm.includes('EN ROUTE') ||
    norm.includes('PICKED UP') ||
    norm.includes('IN PROGRESS') ||
    norm.includes('STARTED') ||
    norm.includes('RUNNING')
  ) {
    return { stage: 'IN_PROGRESS', index: 4 };
  }
  if (
    norm.includes('ASSIGNED') ||
    norm.includes('CHAUFFEUR') ||
    norm.includes('DRIVER')
  ) {
    return { stage: 'CHAUFFEUR_ASSIGNED', index: 3 };
  }
  if (
    norm.includes('CONFIRMED') ||
    norm.includes('APPROVED') ||
    norm.includes('ACCEPTED')
  ) {
    return { stage: 'APPROVED', index: 2 };
  }
  if (
    norm.includes('REVIEW') ||
    norm.includes('QUOTE') ||
    norm.includes('ALLOCATING')
  ) {
    return { stage: 'UNDER_REVIEW', index: 1 };
  }

  // Default is initial state
  return { stage: 'REQUEST_RECEIVED', index: 0 };
}

export async function fetchBookingByReference(referenceId: string): Promise<BookingRequest | null> {
  const cleanId = referenceId.trim();
  if (!cleanId) return null;

  // 1. Try local storage first (instant response)
  try {
    const localRegistry: BookingRequest[] = JSON.parse(
      localStorage.getItem('tj_bookings_registry') || '[]'
    );
    const found = localRegistry.find(
      (b) => b.referenceId.toLowerCase() === cleanId.toLowerCase()
    );
    if (found) return found;
  } catch {}

  // 2. Try Firestore doc
  try {
    const docRef = doc(db, 'bookings', cleanId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      const matchedVehicle =
        vehiclesData.find((v) => v.id === data.vehicleType) || vehiclesData[0];
      return {
        referenceId: data.id || cleanId,
        searchDetails: {
          serviceType: data.tripType || 'oneway',
          pickupLocation: data.pickupLocation,
          dropLocation: data.dropLocation,
          pickupDate: data.pickupDate,
          pickupTime: data.pickupTime,
          travelDate: data.pickupDate,
          durationHours: 8,
          airportTransferType: 'pickup',
          passengers: data.passengersCount || 1,
          vehicleType: matchedVehicle.id,
        },
        selectedVehicle: matchedVehicle,
        passengerDetails: {
          fullName: data.customerName || 'Valued Customer',
          mobileNumber: data.customerPhone || '',
          email: data.customerEmail || '',
        },
        estimatedFare: {
          estimatedDistanceKm: data.distanceKm || 50,
          exactDistanceKm: data.distanceKm,
          estimatedDurationHours: 1,
          baseFareAmount: data.estimatedFare || 2500,
          distanceFareAmount: data.estimatedFare || 2500,
          durationFareAmount: 0,
          passengerSurchargeAmount: 0,
          airportSurchargeAmount: 0,
          totalEstimatedFare: data.estimatedFare || 2500,
          breakdown: [],
        },
        createdAt: data.createdAt || new Date().toISOString(),
        status: data.status || 'Pending Confirmation',
        driverDetails: data.driverDetails || (data.driverName ? {
          driverName: data.driverName,
          driverPhone: data.driverPhone,
          driverVehiclePlate: data.driverVehiclePlate,
        } : undefined),
      };
    }
  } catch (err) {
    console.warn('Firestore lookup error:', err);
  }

  // 3. Try Backend API
  try {
    const res = await fetch(`/api/owner/bookings?search=${encodeURIComponent(cleanId)}`);
    if (res.ok) {
      const json = await res.json();
      if (json.success && Array.isArray(json.bookings) && json.bookings.length > 0) {
        const item = json.bookings.find(
          (b: any) =>
            b.reference_id?.toLowerCase() === cleanId.toLowerCase() ||
            b.id?.toLowerCase() === cleanId.toLowerCase()
        ) || json.bookings[0];
        
        if (item) {
          const matchedVehicle =
            vehiclesData.find((v) => v.id === item.vehicle_id) || vehiclesData[0];
          return {
            referenceId: item.reference_id || item.id || cleanId,
            searchDetails: {
              serviceType: (item.service_type as any) || 'oneway',
              pickupLocation: item.pickup_location,
              dropLocation: item.drop_location,
              pickupDate: item.travel_date,
              pickupTime: item.pickup_time,
              travelDate: item.travel_date,
              durationHours: item.duration_hours || 8,
              airportTransferType: 'pickup',
              passengers: item.passengers_count || 1,
              vehicleType: matchedVehicle.id,
            },
            selectedVehicle: matchedVehicle,
            passengerDetails: {
              fullName: item.full_name || 'Customer',
              mobileNumber: item.mobile_number || '',
              email: item.email || '',
            },
            estimatedFare: {
              estimatedDistanceKm: item.estimated_distance_km || 50,
              exactDistanceKm: item.estimated_distance_km,
              estimatedDurationHours: 1,
              baseFareAmount: item.total_estimated_fare || 2500,
              distanceFareAmount: item.total_estimated_fare || 2500,
              durationFareAmount: 0,
              passengerSurchargeAmount: 0,
              airportSurchargeAmount: 0,
              totalEstimatedFare: item.total_estimated_fare || 2500,
              breakdown: [],
            },
            createdAt: item.created_at || new Date().toISOString(),
            status: item.status || 'Confirmed',
            driverDetails: item.driver_name
              ? {
                  driverName: item.driver_name,
                  driverPhone: item.driver_phone,
                  driverVehiclePlate: item.driver_vehicle_plate,
                }
              : undefined,
          };
        }
      }
    }
  } catch (err) {
    console.warn('Backend API tracking lookup error:', err);
  }

  return null;
}

export function buildLiveTrackingDetails(
  booking: BookingRequest,
  manualSimulatedStage?: TrackingStage
): LiveTrackingDetails {
  const { stage: derivedStage, index: derivedIndex } = mapStatusToStage(booking.status);
  const currentStage = manualSimulatedStage || derivedStage;
  
  const stageHierarchy: TrackingStage[] = [
    'REQUEST_RECEIVED',
    'UNDER_REVIEW',
    'APPROVED',
    'CHAUFFEUR_ASSIGNED',
    'IN_PROGRESS',
    'COMPLETED',
  ];

  const stageIndex = stageHierarchy.indexOf(currentStage);

  const steps: TrackingStep[] = [
    {
      stage: 'REQUEST_RECEIVED',
      label: 'Request Received',
      sublabel: 'Trip details securely registered in dispatch system',
      timestamp: booking.createdAt ? new Date(booking.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : undefined,
      isCompleted: stageIndex >= 0,
      isCurrent: stageIndex === 0,
    },
    {
      stage: 'UNDER_REVIEW',
      label: 'Under Review',
      sublabel: 'Fleet availability and highway transit corridor verification',
      isCompleted: stageIndex >= 1,
      isCurrent: stageIndex === 1,
    },
    {
      stage: 'APPROVED',
      label: 'Approved & Confirmed',
      sublabel: 'Guaranteed cab reservation and fixed transparent fare locked',
      isCompleted: stageIndex >= 2,
      isCurrent: stageIndex === 2,
    },
    {
      stage: 'CHAUFFEUR_ASSIGNED',
      label: 'Chauffeur Assigned',
      sublabel: 'Commercial badge driver & yellow-board vehicle allocated',
      isCompleted: stageIndex >= 3,
      isCurrent: stageIndex === 3,
    },
    {
      stage: 'IN_PROGRESS',
      label: 'In Progress / En Route',
      sublabel: 'Chauffeur en route to doorstep pickup · GPS Tracking Active',
      isCompleted: stageIndex >= 4,
      isCurrent: stageIndex === 4,
    },
    {
      stage: 'COMPLETED',
      label: 'Completed',
      sublabel: 'Passenger safely dropped at destination · GST receipt issued',
      isCompleted: stageIndex >= 5,
      isCurrent: stageIndex === 5,
    },
  ];

  const progressPercent = Math.min(100, Math.round(((stageIndex + 1) / stageHierarchy.length) * 100));

  // Determine pickup & drop coordinates
  const pickupCoords = resolveCoordinates(booking.searchDetails.pickupLocation, { lat: 12.3051, lng: 76.6551 });
  const dropCoords = resolveCoordinates(booking.searchDetails.dropLocation, { lat: 12.3168, lng: 76.6444 });

  // Compute live interpolated vehicle coordinates for map display
  let liveLocation: LiveVehicleLocation | undefined;
  
  if (stageIndex >= 3 && stageIndex < 5) {
    // When assigned or in progress, simulate live vehicle position approaching pickup
    // Interpolate towards pickup with small realistic offset
    const latOffset = (Math.sin(Date.now() / 15000) * 0.008) + 0.012;
    const lngOffset = (Math.cos(Date.now() / 15000) * 0.008) + 0.012;
    
    const vehicleLat = stageIndex === 4
      ? (pickupCoords.lat + (dropCoords.lat - pickupCoords.lat) * 0.35)
      : (pickupCoords.lat + latOffset);
    const vehicleLng = stageIndex === 4
      ? (pickupCoords.lng + (dropCoords.lng - pickupCoords.lng) * 0.35)
      : (pickupCoords.lng + lngOffset);

    const distRemaining = stageIndex === 4 ? 18.5 : Math.round((Math.abs(latOffset) + Math.abs(lngOffset)) * 120 * 10) / 10;
    const etaMinutes = stageIndex === 4 ? 28 : Math.max(3, Math.round(distRemaining * 2.8));

    liveLocation = {
      lat: vehicleLat,
      lng: vehicleLng,
      heading: 45,
      speedKmh: stageIndex === 4 ? 64 : 38,
      lastUpdated: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      distanceRemainingKm: Math.max(0.8, distRemaining),
      estimatedArrivalMinutes: etaMinutes,
      statusText: stageIndex === 4 ? 'Cruising on expressway to destination' : 'En route to your pickup doorstep',
    };
  }

  // Consistent Chauffeur Details
  const defaultDrivers = [
    { name: 'Mahesh Gowda', phone: '+91 97407 54400', plate: 'KA-09-EA-4821', model: 'Toyota Etios AC (Sedan)', rating: 4.95, trips: 1420 },
    { name: 'Suresh Kumar', phone: '+91 98450 12390', plate: 'KA-09-MA-7102', model: 'Toyota Innova Crysta AC', rating: 4.98, trips: 2180 },
    { name: 'Ramesh N.', phone: '+91 97407 54400', plate: 'KA-09-B-8910', model: 'Maruti Ertiga ZXi+ AC', rating: 4.92, trips: 960 },
  ];
  const driverPreset = defaultDrivers[Math.abs(booking.referenceId.charCodeAt(booking.referenceId.length - 1)) % defaultDrivers.length];

  const chauffeur = stageIndex >= 3 ? {
    name: booking.driverDetails?.driverName || driverPreset.name,
    phone: booking.driverDetails?.driverPhone || driverPreset.phone,
    vehicleModel: booking.driverDetails?.driverVehicleModel || booking.selectedVehicle?.name || driverPreset.model,
    vehiclePlateNumber: booking.driverDetails?.driverVehiclePlate || driverPreset.plate,
    rating: driverPreset.rating,
    tripsCompleted: driverPreset.trips,
    securityOtp: Math.abs(booking.referenceId.split('').reduce((acc, c) => acc + c.charCodeAt(0), 1000) % 9000 + 1000).toString(),
  } : undefined;

  return {
    booking,
    currentStage,
    stageIndex,
    steps,
    progressPercent,
    chauffeur,
    routeCoordinates: {
      pickup: { ...pickupCoords, address: booking.searchDetails.pickupLocation },
      drop: booking.searchDetails.dropLocation ? { ...dropCoords, address: booking.searchDetails.dropLocation } : undefined,
    },
    liveLocation,
    lastRefreshedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
  };
}
