import { BookingSearchState, Vehicle, PricingConfig, ServiceType } from '../types';
import { calculateFare } from '../utils/fareCalculator';
import { vehiclesData } from '../data/vehicles';

export interface CachedVehicleFare {
  vehicleId: string;
  vehicleName: string;
  category: string;
  seatingCapacity: number;
  totalEstimatedFare: number;
  originalFare?: number;
  discountAmount?: number;
  discountLabel?: string;
  breakdown: Array<{ label: string; amount: number }>;
}

export interface CachedSearchItem {
  id: string;
  key: string;
  timestamp: number;
  formattedDate: string;
  searchDetails: BookingSearchState;
  routeTitle: string;
  pickupSummary: string;
  dropSummary: string;
  serviceType: ServiceType;
  serviceBadge: string;
  distanceKm?: number;
  estimatedDuration?: string;
  passengers: number;
  availableVehiclesCount: number;
  lowestFare: number;
  cachedFares: CachedVehicleFare[];
  isOfflineAvailable: boolean;
  notes?: string;
}

const CACHE_NAME = 'tj-search-results-cache-v1';
const STORAGE_KEY = 'tj_recent_cached_searches_v2';
const MAX_CACHED_SEARCHES = 20;

/**
 * Generate a consistent deterministic key for a search request
 */
export function generateSearchKey(search: BookingSearchState): string {
  const parts = [
    search.serviceType,
    search.pickupLocation?.trim().toLowerCase() || '',
    search.dropLocation?.trim().toLowerCase() || '',
    search.travelDate || '',
    search.pickupTime || '',
    search.durationHours || 0,
    search.passengers || 1,
    search.airportTransferType || '',
  ];
  return parts.join('|');
}

/**
 * Generate human-readable route title
 */
export function formatRouteTitle(search: BookingSearchState): string {
  if (search.serviceType === 'local') {
    const hours = search.durationHours || 8;
    const km = hours === 4 ? 40 : hours === 8 ? 80 : 120;
    return `Mysuru City Tour (${hours}h / ${km}km)`;
  }

  if (search.serviceType === 'airport') {
    const isDrop = search.airportTransferType === 'drop';
    if (isDrop) {
      return `${search.pickupLocation || 'Mysuru'} ➔ Airport Drop`;
    }
    return `Airport Pickup ➔ ${search.dropLocation || 'Mysuru'}`;
  }

  if (search.serviceType === 'oneway') {
    return `${search.pickupLocation || 'Mysuru'} ➔ ${search.dropLocation || 'Destination'}`;
  }

  if (search.serviceType === 'roundtrip') {
    return `${search.pickupLocation || 'Mysuru'} ⇄ ${search.dropLocation || 'Destination'} (Round-Trip)`;
  }

  return `${search.pickupLocation || 'Mysuru'} ➔ ${search.dropLocation || 'Destination'}`;
}

export function formatServiceBadge(serviceType: ServiceType): string {
  switch (serviceType) {
    case 'oneway':
      return 'Outstation One-Way';
    case 'roundtrip':
      return 'Round-Trip';
    case 'local':
      return 'Local City Package';
    case 'airport':
      return 'Airport Taxi';
    default:
      return 'Taxi Service';
  }
}

/**
 * Save a search and its pre-calculated vehicle fares to Cache Storage & LocalStorage
 */
export async function saveSearchToServiceWorkerCache(
  searchDetails: BookingSearchState,
  pricingConfig: PricingConfig,
  customVehicles?: Vehicle[]
): Promise<CachedSearchItem> {
  const key = generateSearchKey(searchDetails);
  const id = `search_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const vehicles = customVehicles || vehiclesData;

  // Filter vehicles matching search passenger requirements
  const eligibleVehicles = vehicles.filter((v) => {
    if (searchDetails.vehicleType !== 'all' && v.id !== searchDetails.vehicleType) {
      if (
        (searchDetails.vehicleType === 'toyota-etios' || searchDetails.vehicleType === 'swift-desire') &&
        v.id === 'sedan-4-1'
      ) {
        return true;
      }
      if (
        (searchDetails.vehicleType === 'innova-6-1' || searchDetails.vehicleType === 'innova-7-1') &&
        v.id === 'innova'
      ) {
        return true;
      }
      return false;
    }
    return v.seatingCapacity >= (searchDetails.passengers || 1);
  });

  // Calculate and store fare for each vehicle
  const cachedFares: CachedVehicleFare[] = eligibleVehicles.map((vehicle) => {
    try {
      const fare = calculateFare(searchDetails, vehicle, pricingConfig);
      return {
        vehicleId: vehicle.id,
        vehicleName: vehicle.name,
        category: vehicle.category,
        seatingCapacity: vehicle.seatingCapacity,
        totalEstimatedFare: fare.totalEstimatedFare,
        originalFare: fare.originalFare,
        discountAmount: fare.discountAmount,
        discountLabel: fare.discountLabel,
        breakdown: fare.breakdown || [],
      };
    } catch {
      return {
        vehicleId: vehicle.id,
        vehicleName: vehicle.name,
        category: vehicle.category,
        seatingCapacity: vehicle.seatingCapacity,
        totalEstimatedFare: 0,
        breakdown: [],
      };
    }
  });

  const lowestFare = cachedFares.reduce((min, f) => {
    if (f.totalEstimatedFare <= 0) return min;
    return min === 0 ? f.totalEstimatedFare : Math.min(min, f.totalEstimatedFare);
  }, 0);

  const now = new Date();
  const formattedDate = new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: 'numeric',
    hour12: true,
  }).format(now);

  const item: CachedSearchItem = {
    id,
    key,
    timestamp: Date.now(),
    formattedDate,
    searchDetails: JSON.parse(JSON.stringify(searchDetails)), // clone clean copy
    routeTitle: formatRouteTitle(searchDetails),
    pickupSummary: searchDetails.pickupLocation || 'Mysuru',
    dropSummary: searchDetails.dropLocation || (searchDetails.serviceType === 'local' ? 'Mysuru Sightseeing' : 'Bengaluru Airport'),
    serviceType: searchDetails.serviceType,
    serviceBadge: formatServiceBadge(searchDetails.serviceType),
    distanceKm: searchDetails.distanceKm || searchDetails.routeInfo?.distanceKm,
    estimatedDuration: searchDetails.routeInfo?.durationFormatted,
    passengers: searchDetails.passengers || 1,
    availableVehiclesCount: cachedFares.length,
    lowestFare,
    cachedFares,
    isOfflineAvailable: true,
  };

  // 1. Persist to LocalStorage
  try {
    const existing = getStoredSearches();
    // Deduplicate identical search keys, putting newest on top
    const filtered = existing.filter((s) => s.key !== key);
    const updated = [item, ...filtered].slice(0, MAX_CACHED_SEARCHES);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.warn('Could not persist search to localStorage:', err);
  }

  // 2. Persist to Service Worker Cache Storage API
  if (typeof window !== 'undefined' && 'caches' in window) {
    try {
      const cache = await caches.open(CACHE_NAME);
      const url = `/api/search/cached/${encodeURIComponent(key)}`;
      const response = new Response(JSON.stringify(item), {
        headers: {
          'Content-Type': 'application/json',
          'X-Cache-Timestamp': item.timestamp.toString(),
          'X-Cache-Offline': 'true',
        },
      });
      await cache.put(url, response);

      // Also store latest search for offline index
      const latestUrl = '/api/search/latest';
      await cache.put(
        latestUrl,
        new Response(JSON.stringify(item), {
          headers: { 'Content-Type': 'application/json' },
        })
      );
    } catch (err) {
      console.warn('Service Worker Cache Storage write skipped:', err);
    }
  }

  // 3. Notify subscribers
  try {
    window.dispatchEvent(
      new CustomEvent('tj:search-cache-updated', { detail: { search: item } })
    );
  } catch {
    // Ignore event dispatch errors
  }

  return item;
}

/**
 * Get all recent searches from memory/storage
 */
export function getStoredSearches(): CachedSearchItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return getFallbackSampleSearches();
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    return getFallbackSampleSearches();
  } catch {
    return getFallbackSampleSearches();
  }
}

/**
 * Asynchronously retrieve searches, checking Service Worker Cache Storage first
 */
export async function getRecentCachedSearches(): Promise<CachedSearchItem[]> {
  // 1. Try Cache Storage
  if (typeof window !== 'undefined' && 'caches' in window) {
    try {
      const cache = await caches.open(CACHE_NAME);
      const keys = await cache.keys();
      const items: CachedSearchItem[] = [];

      for (const request of keys) {
        if (request.url.includes('/api/search/cached/')) {
          const response = await cache.match(request);
          if (response) {
            const data: CachedSearchItem = await response.json();
            items.push(data);
          }
        }
      }

      if (items.length > 0) {
        items.sort((a, b) => b.timestamp - a.timestamp);
        return items;
      }
    } catch (err) {
      console.warn('Could not read from Cache Storage:', err);
    }
  }

  // 2. Fall back to localStorage
  return getStoredSearches();
}

/**
 * Delete a specific cached search
 */
export async function removeCachedSearch(id: string): Promise<void> {
  const current = getStoredSearches();
  const target = current.find((item) => item.id === id);
  const updated = current.filter((item) => item.id !== id);

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.warn('Could not update localStorage on remove:', err);
  }

  if (target && typeof window !== 'undefined' && 'caches' in window) {
    try {
      const cache = await caches.open(CACHE_NAME);
      await cache.delete(`/api/search/cached/${encodeURIComponent(target.key)}`);
    } catch (err) {
      console.warn('Could not delete from Cache Storage:', err);
    }
  }

  try {
    window.dispatchEvent(new CustomEvent('tj:search-cache-updated', { detail: { removedId: id } }));
  } catch {}
}

/**
 * Clear all cached searches
 */
export async function clearAllCachedSearches(): Promise<void> {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {}

  if (typeof window !== 'undefined' && 'caches' in window) {
    try {
      await caches.delete(CACHE_NAME);
    } catch {}
  }

  try {
    window.dispatchEvent(new CustomEvent('tj:search-cache-updated', { detail: { cleared: true } }));
  } catch {}
}

/**
 * Seed initial helpful offline searches so users testing offline mode immediately have rich options
 */
function getFallbackSampleSearches(): CachedSearchItem[] {
  const today = new Date().toISOString().split('T')[0];

  return [
    {
      id: 'sample_mpr_blr_airport',
      key: 'airport|mysuru|kempegowda intl airport (kial)|' + today + '|09:00|0|2|drop',
      timestamp: Date.now() - 1000 * 60 * 15, // 15 mins ago
      formattedDate: '15 mins ago',
      searchDetails: {
        serviceType: 'airport',
        pickupLocation: 'Mysuru Palace, Mysuru',
        dropLocation: 'Kempegowda International Airport (KIAL), Bengaluru',
        travelDate: today,
        pickupTime: '09:00',
        durationHours: 0,
        airportTransferType: 'drop',
        passengers: 2,
        vehicleType: 'all',
        distanceKm: 185,
        routeInfo: {
          distanceKm: 185,
          durationMinutes: 190,
          durationFormatted: '3 hrs 10 min',
          highwayCorridor: 'NH 275 Bengaluru-Mysuru Expressway',
          tollEstimate: 330,
        },
      },
      routeTitle: 'Mysuru ➔ Bengaluru Airport (KIAL Drop)',
      pickupSummary: 'Mysuru Palace',
      dropSummary: 'Kempegowda Intl Airport',
      serviceType: 'airport',
      serviceBadge: 'Airport Taxi',
      distanceKm: 185,
      estimatedDuration: '3 hrs 10 min',
      passengers: 2,
      availableVehiclesCount: 4,
      lowestFare: 2999,
      cachedFares: [
        {
          vehicleId: 'sedan-4-1',
          vehicleName: 'Toyota Etios / Swift Dzire',
          category: 'Sedan (4+1)',
          seatingCapacity: 4,
          totalEstimatedFare: 2999,
          breakdown: [
            { label: 'Base Fare & Toll Inclusion', amount: 2699 },
            { label: 'Expressway Toll & FASTag', amount: 300 },
          ],
        },
        {
          vehicleId: 'suv-ertiga',
          vehicleName: 'Maruti Ertiga Hybrid',
          category: 'SUV (6+1)',
          seatingCapacity: 6,
          totalEstimatedFare: 3899,
          breakdown: [
            { label: 'Base Fare & Toll Inclusion', amount: 3599 },
            { label: 'Expressway Toll & FASTag', amount: 300 },
          ],
        },
        {
          vehicleId: 'innova',
          vehicleName: 'Toyota Innova / Crysta',
          category: 'Innova (6+1 / 7+1)',
          seatingCapacity: 7,
          totalEstimatedFare: 4799,
          breakdown: [
            { label: 'Base Fare & Chauffeur Charge', amount: 4499 },
            { label: 'Expressway Toll & FASTag', amount: 300 },
          ],
        },
      ],
      isOfflineAvailable: true,
      notes: 'Pre-cached corridor for instant offline estimation',
    },
    {
      id: 'sample_mpr_ooty',
      key: 'oneway|mysuru|ooty, tamil nadu|' + today + '|08:00|0|4|',
      timestamp: Date.now() - 1000 * 60 * 45, // 45 mins ago
      formattedDate: '45 mins ago',
      searchDetails: {
        serviceType: 'oneway',
        pickupLocation: 'Mysuru Railway Station, Mysuru',
        dropLocation: 'Charing Cross, Ooty, Tamil Nadu',
        travelDate: today,
        pickupTime: '08:00',
        durationHours: 0,
        airportTransferType: 'drop',
        passengers: 4,
        vehicleType: 'all',
        distanceKm: 125,
        routeInfo: {
          distanceKm: 125,
          durationMinutes: 210,
          durationFormatted: '3 hrs 30 min',
          highwayCorridor: 'Via Bandipur Tiger Reserve & Mudumalai',
          isInterstate: true,
          interstateTaxEstimate: 600,
        },
      },
      routeTitle: 'Mysuru ➔ Ooty, Nilgiris (One-Way)',
      pickupSummary: 'Mysuru Railway Station',
      dropSummary: 'Ooty, Tamil Nadu',
      serviceType: 'oneway',
      serviceBadge: 'Outstation One-Way',
      distanceKm: 125,
      estimatedDuration: '3 hrs 30 min',
      passengers: 4,
      availableVehiclesCount: 4,
      lowestFare: 3650,
      cachedFares: [
        {
          vehicleId: 'sedan-4-1',
          vehicleName: 'Toyota Etios / Swift Dzire',
          category: 'Sedan (4+1)',
          seatingCapacity: 4,
          totalEstimatedFare: 3650,
          breakdown: [
            { label: 'Outstation Distance Charge (Min 250 KM)', amount: 2750 },
            { label: 'Chauffeur Allowance', amount: 300 },
            { label: 'Tamil Nadu State Border Permit', amount: 600 },
          ],
        },
        {
          vehicleId: 'innova',
          vehicleName: 'Toyota Innova / Crysta',
          category: 'Innova (6+1 / 7+1)',
          seatingCapacity: 7,
          totalEstimatedFare: 5250,
          breakdown: [
            { label: 'Outstation Distance Charge (Min 250 KM)', amount: 4250 },
            { label: 'Chauffeur Allowance', amount: 400 },
            { label: 'Tamil Nadu State Border Permit', amount: 600 },
          ],
        },
      ],
      isOfflineAvailable: true,
    },
    {
      id: 'sample_mpr_local_pkg',
      key: 'local|mysuru city|mysuru sightseeing|' + today + '|09:30|8|3|',
      timestamp: Date.now() - 1000 * 60 * 120, // 2 hrs ago
      formattedDate: '2 hours ago',
      searchDetails: {
        serviceType: 'local',
        pickupLocation: 'Gokulam, Mysuru',
        dropLocation: 'Mysuru City Sightseeing',
        travelDate: today,
        pickupTime: '09:30',
        durationHours: 8,
        airportTransferType: 'drop',
        passengers: 3,
        vehicleType: 'all',
        distanceKm: 80,
      },
      routeTitle: 'Mysuru Local Sightseeing (8h / 80km)',
      pickupSummary: 'Gokulam, Mysuru',
      dropSummary: 'Palace, Chamundi Hill, KRS',
      serviceType: 'local',
      serviceBadge: 'Local City Package',
      distanceKm: 80,
      estimatedDuration: '8 Hours',
      passengers: 3,
      availableVehiclesCount: 4,
      lowestFare: 2199,
      cachedFares: [
        {
          vehicleId: 'sedan-4-1',
          vehicleName: 'Toyota Etios / Swift Dzire',
          category: 'Sedan (4+1)',
          seatingCapacity: 4,
          totalEstimatedFare: 2199,
          breakdown: [
            { label: '8 Hours / 80 KM Package Fare', amount: 1949 },
            { label: 'Driver Allowance', amount: 250 },
          ],
        },
      ],
      isOfflineAvailable: true,
    },
  ];
}
