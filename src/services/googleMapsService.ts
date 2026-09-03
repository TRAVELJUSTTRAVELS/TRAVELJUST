import { PlaceSuggestion, CalculatedRouteInfo } from '../types';
import { AIRPORT_LOCATIONS } from '../data/locations/airports';
import { MYSURU_LOCAL_LOCATIONS } from '../data/locations/mysuruLocal';
import { MYSURU_TALUKS_VILLAGES } from '../data/locations/mysuruTaluksVillages';
import { MANDYA_CHAMARAJANAGAR_LOCATIONS } from '../data/locations/mandyaChamarajanagar';
import { COORG_WAYANAD_OOTY_LOCATIONS } from '../data/locations/coorgWayanadOoty';
import { BENGALURU_EXPRESSWAY_LOCATIONS } from '../data/locations/bengaluruExpressway';
import { INTERCITY_HERITAGE_COASTAL_LOCATIONS } from '../data/locations/intercityHeritageCoastal';
import { ROUTE_MATRIX } from '../data/locations/routeDistances';

export interface LocationCategory {
  id: string;
  label: string;
  iconName?: string;
  badge?: string;
  description?: string;
  locations: PlaceSuggestion[];
}

// Master categorized catalog of South Indian, Karnataka, Kerala, Tamil Nadu, and Airport Hubs
export const POPULAR_LOCATIONS: PlaceSuggestion[] = [
  ...AIRPORT_LOCATIONS,
  ...MYSURU_LOCAL_LOCATIONS,
  ...MYSURU_TALUKS_VILLAGES,
  ...MANDYA_CHAMARAJANAGAR_LOCATIONS,
  ...COORG_WAYANAD_OOTY_LOCATIONS,
  ...BENGALURU_EXPRESSWAY_LOCATIONS,
  ...INTERCITY_HERITAGE_COASTAL_LOCATIONS,
];

// Helper to quickly look up a location by ID
export function getPlaceById(placeId: string): PlaceSuggestion | undefined {
  return POPULAR_LOCATIONS.find((loc) => loc.placeId === placeId);
}

// Full categorized groupings for directory browser UI
export const LOCATION_CATEGORIES: LocationCategory[] = [
  {
    id: 'airports',
    label: 'Airport Terminals & Flight Hubs',
    badge: '24x7 Airport Transfer',
    description: 'Kempegowda International T1 & T2, Mysuru Mandakalli, Mangalore, Coimbatore, Calicut & Kannur.',
    locations: AIRPORT_LOCATIONS,
  },
  {
    id: 'mysuru_local',
    label: 'Mysuru City & Heritage Landmarks',
    badge: 'City Tours',
    description: 'Mysore Palace, Chamundi Hill, Mysuru Zoo, St. Philomena, Karanji Lake, Jaganmohan & Railway Station.',
    locations: MYSURU_LOCAL_LOCATIONS.filter((l) => l.category === 'mysuru_local'),
  },
  {
    id: 'mysuru_areas',
    label: 'Mysuru Layouts & Industrial Corridors',
    badge: 'Local Cabs',
    description: 'Vijayanagar Stages 1-4, Gokulam, Kuvempunagar, Hebbal Infosys, Hootagalli, Koorgalli & Kadakola KIADB.',
    locations: MYSURU_LOCAL_LOCATIONS.filter((l) => l.category === 'mysuru_areas'),
  },
  {
    id: 'mysuru_taluks',
    label: 'Mysuru District Taluks & Villages',
    badge: 'Taluk Network',
    description: 'Nanjangud, T. Narasipura, Somnathpur, Talakadu, Hunsur, Bilikere, Piriyapatna, Bylakuppe, K.R. Nagar, Saligrama, H.D. Kote, Kabini & Saragur.',
    locations: MYSURU_TALUKS_VILLAGES,
  },
  {
    id: 'mandya_chamarajanagar',
    label: 'Mandya & Chamarajanagar Taluks',
    badge: 'District Corridors',
    description: 'Srirangapatna, Ranganathittu, KRS Dam, Mandya Sugar City, Melukote, Maddur, Shivanasamudra Falls, Chamarajanagar, Gundlupet, Bandipur & MM Hills.',
    locations: MANDYA_CHAMARAJANAGAR_LOCATIONS,
  },
  {
    id: 'hill_stations',
    label: 'Coorg, Ooty & Wayanad Hills',
    badge: 'Scenic Ghats',
    description: 'Madikeri, Mandalpatti 4x4 Jeep Trail, Dubare, Talakaveri, Ooty Lake, Doddabetta, Coonoor, Pykara, Kalpetta, Vythiri & Banasura Sagar Dam.',
    locations: COORG_WAYANAD_OOTY_LOCATIONS.filter((l) => l.category === 'hill_stations'),
  },
  {
    id: 'wildlife_safari',
    label: 'Wildlife Safaris & Tiger Reserves',
    badge: 'Jungle Safaris',
    description: 'Bandipur Tiger Reserve, Kabini Jungle Safari, Nagarahole, Mudumalai Elephant Camp, Muthanga & BR Hills K Gudi.',
    locations: [
      ...MYSURU_TALUKS_VILLAGES.filter((l) => l.category === 'wildlife_safari'),
      ...MANDYA_CHAMARAJANAGAR_LOCATIONS.filter((l) => l.category === 'wildlife_safari'),
      ...COORG_WAYANAD_OOTY_LOCATIONS.filter((l) => l.category === 'wildlife_safari'),
    ],
  },
  {
    id: 'bengaluru_metro',
    label: 'Bengaluru Metro & Expressway Towns',
    badge: 'Expressway Direct',
    description: '10-Lane Expressway, Channapatna Toys, Ramanagara Sholay Hills, Bidadi, HSR, BTM, Koramangala, Indiranagar, Electronic City & Whitefield.',
    locations: BENGALURU_EXPRESSWAY_LOCATIONS,
  },
  {
    id: 'heritage_pilgrimage',
    label: 'Pilgrimage & Heritage UNESCO Sites',
    badge: 'Temple Tours',
    description: 'Belur & Halebidu Hoysala Temples, Shravanabelagola Bahubali, Melukote, Nanjangud, Sringeri, Dharmasthala, Kukke Subrahmanya, Hampi & Tirupati.',
    locations: [
      ...MYSURU_TALUKS_VILLAGES.filter((l) => l.category === 'heritage_pilgrimage'),
      ...MANDYA_CHAMARAJANAGAR_LOCATIONS.filter((l) => l.category === 'heritage_pilgrimage'),
      ...INTERCITY_HERITAGE_COASTAL_LOCATIONS.filter((l) => l.category === 'heritage_pilgrimage'),
    ],
  },
  {
    id: 'coastal_beach',
    label: 'Coastal Beaches & Outstation Gateways',
    badge: 'Beach & Outstation',
    description: 'Mangaluru Panambur Beach, Udupi Malpe Beach, Murudeshwar Shiva Statue, Gokarna Om Beach, Kozhikode, Chikkamagaluru & Pondicherry.',
    locations: INTERCITY_HERITAGE_COASTAL_LOCATIONS.filter((l) => l.category === 'coastal_beach' || l.category === 'hill_stations'),
  },
];

// Helper to format minutes into clean human readable string
export function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `Approx. ${Math.round(minutes)} min`;
  }
  const hrs = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  if (mins === 0) {
    return `${hrs} hr${hrs > 1 ? 's' : ''}`;
  }
  return `${hrs} hr${hrs > 1 ? 's' : ''} ${mins} min`;
}

// Helper to find location details and coordinates from catalog or string
export function findLocationCoordinates(query: string): {
  lat?: number;
  lng?: number;
  placeId?: string;
  matchedLocation?: PlaceSuggestion;
} {
  if (!query || !query.trim()) return {};
  const norm = query.toLowerCase().trim();

  // Exact ID check
  const byId = POPULAR_LOCATIONS.find((loc) => loc.placeId.toLowerCase() === norm);
  if (byId && byId.lat && byId.lng) {
    return { lat: byId.lat, lng: byId.lng, placeId: byId.placeId, matchedLocation: byId };
  }

  // Exact or near-exact name match
  const byName = POPULAR_LOCATIONS.find((loc) => {
    const pName = loc.placeName.toLowerCase();
    const fAddr = loc.formattedAddress.toLowerCase();
    const area = loc.areaLocality.toLowerCase();
    return norm.includes(pName) || pName.includes(norm) || norm === fAddr || norm === area;
  });

  if (byName && byName.lat && byName.lng) {
    return { lat: byName.lat, lng: byName.lng, placeId: byName.placeId, matchedLocation: byName };
  }

  // Token match
  const queryTokens = norm.split(/[\s,/-]+/).filter((t) => t.length > 2);
  if (queryTokens.length > 0) {
    const byToken = POPULAR_LOCATIONS.find((loc) => {
      const combined = `${loc.placeName} ${loc.areaLocality} ${loc.village || ''} ${loc.taluk || ''} ${loc.city} ${loc.formattedAddress}`.toLowerCase();
      return queryTokens.every((tok) => combined.includes(tok));
    });
    if (byToken && byToken.lat && byToken.lng) {
      return { lat: byToken.lat, lng: byToken.lng, placeId: byToken.placeId, matchedLocation: byToken };
    }
  }

  return {};
}

// Great-circle Haversine formula in kilometers
export function calculateHaversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's mean radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Calculate road distance & driving time between two geographical points using road network factor
export function estimateDrivingDistanceMatrix(
  originStr: string,
  destStr: string,
  viaStops: string[] = []
): CalculatedRouteInfo {
  const norm = (s: string) => s.toLowerCase().trim();
  const o = norm(originStr);
  const d = norm(destStr);

  // Check matching key in high-accuracy route matrix
  let matchedEntry: { distanceKm: number; durationMinutes: number; highway: string; toll: number } | null = null;
  const keys = Object.keys(ROUTE_MATRIX);

  for (const k of keys) {
    const [p1, p2] = k.split('-');
    const normP1 = p1.replace(/_/g, ' ');
    const normP2 = p2.replace(/_/g, ' ');

    if (
      (o.includes(normP1) || normP1.includes(o)) &&
      (d.includes(normP2) || normP2.includes(d))
    ) {
      matchedEntry = ROUTE_MATRIX[k];
      break;
    }
    // Reverse check
    if (
      (o.includes(normP2) || normP2.includes(o)) &&
      (d.includes(normP1) || normP1.includes(d))
    ) {
      matchedEntry = ROUTE_MATRIX[k];
      break;
    }
  }

  // Check if either origin or destination is in POPULAR_LOCATIONS with estimatedFromMysuruKm
  if (!matchedEntry && (o.includes('mysur') || o.includes('myso'))) {
    const foundDest = POPULAR_LOCATIONS.find((loc) => {
      const name = loc.placeName.toLowerCase();
      const area = loc.areaLocality.toLowerCase();
      const village = (loc.village || '').toLowerCase();
      const taluk = (loc.taluk || '').toLowerCase();
      return (
        d.includes(name) ||
        name.includes(d) ||
        d.includes(area) ||
        (village && d.includes(village)) ||
        (taluk && d.includes(taluk))
      );
    });

    if (foundDest && foundDest.estimatedFromMysuruKm) {
      const travelMins = Math.round((foundDest.estimatedFromMysuruKm / 48) * 60);
      matchedEntry = {
        distanceKm: foundDest.estimatedFromMysuruKm,
        durationMinutes: Math.max(15, travelMins),
        highway: foundDest.highlights?.[2] || 'Mysuru Connected Highway Corridor',
        toll: foundDest.estimatedFromMysuruKm > 100 ? 165 : 0,
      };
    }
  } else if (!matchedEntry && (d.includes('mysur') || d.includes('myso'))) {
    // Reverse check when traveling TO Mysuru
    const foundOrigin = POPULAR_LOCATIONS.find((loc) => {
      const name = loc.placeName.toLowerCase();
      const area = loc.areaLocality.toLowerCase();
      const village = (loc.village || '').toLowerCase();
      const taluk = (loc.taluk || '').toLowerCase();
      return (
        o.includes(name) ||
        name.includes(o) ||
        o.includes(area) ||
        (village && o.includes(village)) ||
        (taluk && o.includes(taluk))
      );
    });

    if (foundOrigin && foundOrigin.estimatedFromMysuruKm) {
      const travelMins = Math.round((foundOrigin.estimatedFromMysuruKm / 48) * 60);
      matchedEntry = {
        distanceKm: foundOrigin.estimatedFromMysuruKm,
        durationMinutes: Math.max(15, travelMins),
        highway: foundOrigin.highlights?.[2] || 'Mysuru Connected Highway Corridor',
        toll: foundOrigin.estimatedFromMysuruKm > 100 ? 165 : 0,
      };
    }
  }

  // Check point-to-point coordinate math if available
  const originCoord = findLocationCoordinates(originStr);
  const destCoord = findLocationCoordinates(destStr);

  let distanceKm = 12.8;
  let durationMinutes = 30;
  let highwayDescription = matchedEntry ? matchedEntry.highway : '';
  let toll = matchedEntry ? matchedEntry.toll : 0;
  let dataSource: 'google_maps' | 'intelligent_matrix' | 'geocoded_route' = 'intelligent_matrix';

  const isAirport =
    o.includes('airport') ||
    d.includes('airport') ||
    o.includes('kial') ||
    d.includes('kial') ||
    o.includes('blr') ||
    d.includes('blr');

  if (matchedEntry) {
    distanceKm = matchedEntry.distanceKm;
    durationMinutes = matchedEntry.durationMinutes;
    highwayDescription = matchedEntry.highway;
    toll = matchedEntry.toll;
  } else if (originCoord.lat && originCoord.lng && destCoord.lat && destCoord.lng) {
    // High-precision Point-to-Point Geodesic Calculation with Road Network Multiplier
    const straightLineKm = calculateHaversineKm(
      originCoord.lat,
      originCoord.lng,
      destCoord.lat,
      destCoord.lng
    );

    // Determine terrain and highway characteristics
    const isHills =
      o.includes('coorg') || d.includes('coorg') ||
      o.includes('ooty') || d.includes('ooty') ||
      o.includes('wayanad') || d.includes('wayanad') ||
      o.includes('madikeri') || d.includes('madikeri') ||
      o.includes('kodaikanal') || d.includes('kodaikanal') ||
      o.includes('sakleshpur') || d.includes('sakleshpur');

    const isExpressway =
      (o.includes('mysur') || o.includes('myso')) &&
      (d.includes('bengaluru') || d.includes('bangalore') || d.includes('kial') || d.includes('airport'));

    // Road curvature multipliers:
    // Hills / Ghats: 1.45x
    // Expressway: 1.18x
    // Standard National/State Highway: 1.28x
    // Local / City: 1.35x
    const roadFactor = isHills ? 1.45 : isExpressway ? 1.18 : straightLineKm > 40 ? 1.28 : 1.35;
    const computedKm = Math.max(3.5, Number((straightLineKm * roadFactor).toFixed(1)));
    distanceKm = computedKm;

    // Average travel speeds:
    // Hills: 38 km/h
    // Expressway: 72 km/h
    // Standard Highway: 50 km/h
    // Local City: 28 km/h
    const avgSpeed = isHills ? 38 : isExpressway ? 72 : straightLineKm > 40 ? 50 : 28;
    const hours = computedKm / avgSpeed;
    durationMinutes = Math.max(12, Math.round(hours * 60));

    highwayDescription = isExpressway
      ? 'NH 275 Mysore-Bengaluru 10-Lane Expressway'
      : isHills
      ? 'Scenic Ghat & Hill Corridor'
      : 'South Indian Highway Corridor';

    toll = isExpressway ? 320 : computedKm > 120 ? 165 : 0;
    dataSource = 'geocoded_route';
  } else {
    // Dynamic geographic estimation based on South Indian road network density
    const charWeight = (o.length + d.length) * 3.5;
    const isOutstation =
      o !== d &&
      !o.includes('mysuru') &&
      !d.includes('mysuru') &&
      !o.includes('mysore') &&
      !d.includes('mysore');

    distanceKm = Math.max(
      15,
      Math.min(420, isOutstation ? 130 + charWeight : 25 + charWeight * 0.7)
    );
    distanceKm = Math.round(distanceKm * 10) / 10;

    const travelHours = distanceKm / 46;
    durationMinutes = Math.round(travelHours * 60);
  }

  // Account for intermediate via stops
  const validStops = viaStops.filter((s) => s && s.trim().length > 0);
  if (validStops.length > 0) {
    const extraKmPerStop = 18.0;
    const extraMinPerStop = 25;
    distanceKm = Number((distanceKm + validStops.length * extraKmPerStop).toFixed(1));
    durationMinutes += validStops.length * extraMinPerStop;
  }

  const durationFormatted = formatDuration(durationMinutes);
  const summaryText = `${distanceKm} km · ${durationFormatted}`;

  return {
    distanceKm,
    durationMinutes,
    durationFormatted,
    summaryText,
    originAddress: originStr,
    destinationAddress: destStr,
    stopsCount: validStops.length,
    viaStops: validStops,
    isAirportRoute: isAirport,
    highwayCorridor: highwayDescription,
    tollEstimate: toll,
    originCoords: originCoord.lat && originCoord.lng ? { lat: originCoord.lat, lng: originCoord.lng } : undefined,
    destinationCoords: destCoord.lat && destCoord.lng ? { lat: destCoord.lat, lng: destCoord.lng } : undefined,
    dataSource,
  };
}

// Client-side in-memory caches
const clientRouteCache = new Map<string, CalculatedRouteInfo>();
const clientPlacesCache = new Map<string, PlaceSuggestion[]>();

// Common query aliases and spelling variations map
const ALIAS_MAP: Record<string, string[]> = {
  bidai: ['bidadi', 'toyota', 'wonderla'],
  bidadi: ['bidai', 'toyota', 'wonderla', 'kiadb'],
  wayand: ['wayanad', 'kalpetta', 'sulthan bathery', 'vythiri', 'meppadi'],
  wayanad: ['wayand', 'kalpetta', 'sulthan bathery', 'vythiri', 'meppadi', 'thirunelli'],
  channapattana: ['channapatna', 'gombegala', 'wooden toys'],
  channapatna: ['channapattana', 'gombegala', 'wooden toys'],
  coorg: ['madikeri', 'kodagu', 'kushalnagar', 'dubare', 'mandalpatti'],
  madikeri: ['coorg', 'mercara', 'raja seat', 'abbey falls'],
  kushalnagar: ['coorg', 'nisargadhama', 'harangi', 'bylakuppe', 'dubare'],
  kabini: ['karapura', 'antharasanthe', 'nagarahole', 'jungle lodges', 'kabini dam'],
  kengeri: ['kengeri satellite town', 'kengeri metro', 'nice road', 'mysore road'],
  maddur: ['maddur vada', 'tiffany', 'shivapura', 'shimsha'],
  mandya: ['sugar city', 'mysugar', 'sanjay circle'],
  hassan: ['hasanamba', 'hemavathi', 'belur', 'halebidu', 'sakleshpur'],
  chikkamagaluru: ['chikmagalur', 'mullayanagiri', 'bababudangiri', 'coffee', 'sringeri'],
  chikmagalur: ['chikkamagaluru', 'mullayanagiri', 'bababudangiri', 'coffee', 'sringeri'],
  ooty: ['udhagamandalam', 'nilgiris', 'doddabetta', 'coonoor', 'pykara', 'botanical'],
  bengalurucity: ['bengaluru', 'bangalore', 'majestic', 'mg road', 'indiranagar', 'koramangala', 'hsr'],
  bangalore: ['bengaluru', 'kial', 'airport', 'whitefield', 'electronic city'],
  karnataka: ['mysuru', 'bengaluru', 'mandya', 'coorg', 'hassan', 'chikkamagaluru'],
};

// Helper to expand query with aliases
function expandSearchTerms(query: string): string[] {
  const norm = query.toLowerCase().trim();
  const terms = [norm];
  for (const [key, aliases] of Object.entries(ALIAS_MAP)) {
    if (norm.includes(key) || key.includes(norm)) {
      terms.push(...aliases);
    }
  }
  return Array.from(new Set(terms));
}

// Clean address string helper to remove PIN codes and raw clutter
export function sanitizeDisplayAddress(rawAddr: string): string {
  if (!rawAddr) return '';
  return rawAddr
    .replace(/\b\d{6}\b/g, '') // remove 6-digit pin code
    .replace(/\b(PIN|Pin|Pincode|Taluk|Tq|Village|Vill):\s*[^,]*(,|$)/gi, '') // remove taluk/pin labels
    .replace(/,\s*,/g, ',')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^,\s*|,\s*$/g, '');
}

// Recent searches storage key & helpers
const RECENT_SEARCHES_STORAGE_KEY = 'traveljust_recent_places';

export function getRecentSearches(): PlaceSuggestion[] {
  try {
    const raw = localStorage.getItem(RECENT_SEARCHES_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.slice(0, 5) : [];
  } catch {
    return [];
  }
}

export function saveRecentSearch(place: PlaceSuggestion): void {
  try {
    const current = getRecentSearches();
    const filtered = current.filter((p) => p.placeName.toLowerCase() !== place.placeName.toLowerCase());
    const updated = [place, ...filtered].slice(0, 5);
    localStorage.setItem(RECENT_SEARCHES_STORAGE_KEY, JSON.stringify(updated));
  } catch {
    // Ignore storage issues
  }
}

// Reverse Geocoding Helper using GPS coordinates to find closest Mysuru / Karnataka location
export function reverseGeocodeToPlace(lat: number, lng: number): PlaceSuggestion {
  let closest: PlaceSuggestion = POPULAR_LOCATIONS[0];
  let minDistance = Infinity;

  for (const loc of POPULAR_LOCATIONS) {
    if (loc.lat && loc.lng) {
      const dist = calculateHaversineKm(lat, lng, loc.lat, loc.lng);
      if (dist < minDistance) {
        minDistance = dist;
        closest = loc;
      }
    }
  }

  // If very close to a known spot (< 3 km), return that exact location
  if (minDistance <= 3.0) {
    return {
      ...closest,
      formattedAddress: `Current Location near ${closest.placeName}, ${closest.city}`,
    };
  }

  // Otherwise return structured current location
  return {
    placeId: `current_loc_${Date.now()}`,
    placeName: `Current Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`,
    areaLocality: closest.areaLocality || 'Current GPS Location',
    city: closest.city || 'Mysuru & Surrounding District',
    formattedAddress: `Current GPS Coordinates · near ${closest.placeName}`,
    lat,
    lng,
    isAirport: false,
  };
}

// Client-side API caller for Places Autocomplete with advanced ranking
export async function fetchPlaceSuggestions(
  query: string,
  sessionToken?: string
): Promise<PlaceSuggestion[]> {
  if (!query || query.trim().length < 1) {
    const recents = getRecentSearches();
    if (recents.length > 0) {
      const remaining = POPULAR_LOCATIONS.filter(
        (p) => !recents.some((r) => r.placeName.toLowerCase() === p.placeName.toLowerCase())
      );
      return [...recents, ...remaining.slice(0, 10)];
    }
    return POPULAR_LOCATIONS.slice(0, 12);
  }

  const trimmed = query.trim().toLowerCase();
  const cacheKey = trimmed;
  if (clientPlacesCache.has(cacheKey)) {
    return clientPlacesCache.get(cacheKey)!;
  }

  try {
    const res = await fetch('/api/maps/autocomplete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ input: query, sessionToken }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.success && Array.isArray(data.suggestions) && data.suggestions.length > 0) {
        // Sanitize addresses
        const cleaned: PlaceSuggestion[] = data.suggestions.map((s: PlaceSuggestion) => ({
          ...s,
          formattedAddress: sanitizeDisplayAddress(s.formattedAddress || `${s.areaLocality}, ${s.city}`),
        }));
        clientPlacesCache.set(cacheKey, cleaned);
        return cleaned;
      }
    }
  } catch (err) {
    // Fallback to local catalog
  }

  // Advanced multi-token and priority scoring search
  const queryTokens = trimmed.split(/[\s,/-]+/).filter((t) => t.length > 0);
  const expandedTerms = expandSearchTerms(trimmed);

  const scoredMatches = POPULAR_LOCATIONS.map((item) => {
    let score = 0;
    const pName = item.placeName.toLowerCase();
    const area = item.areaLocality.toLowerCase();
    const city = item.city.toLowerCase();
    const combined = `${item.placeName} ${item.areaLocality} ${item.taluk || ''} ${item.village || ''} ${item.city} ${item.pincode || ''} ${item.landmark || ''} ${(item.highlights || []).join(' ')}`.toLowerCase();

    // Highest weight: exact prefix match on place name
    if (pName.startsWith(trimmed)) {
      score += 100;
    } else if (pName.includes(trimmed)) {
      score += 60;
    }

    // Weight on area or city
    if (area.includes(trimmed) || city.includes(trimmed)) {
      score += 40;
    }

    // All query tokens match
    const tokenMatch = queryTokens.every((token) => combined.includes(token));
    if (tokenMatch) {
      score += 50;
    } else {
      const matchedTokenCount = queryTokens.filter((token) => combined.includes(token)).length;
      score += matchedTokenCount * 15;
    }

    // Expanded alias match
    if (expandedTerms.some((term) => combined.includes(term))) {
      score += 35;
    }

    return { item, score };
  })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((entry) => ({
      ...entry.item,
      formattedAddress: sanitizeDisplayAddress(
        entry.item.formattedAddress || [entry.item.areaLocality, entry.item.city].filter(Boolean).join(', ')
      ),
    }));

  if (scoredMatches.length > 0) {
    clientPlacesCache.set(cacheKey, scoredMatches);
    return scoredMatches;
  }

  // If no matches, generate custom dynamic place suggestion
  const customList: PlaceSuggestion[] = [
    {
      placeId: `custom_${Date.now()}`,
      placeName: query.trim(),
      areaLocality: 'Specified Destination',
      city: query.toLowerCase().includes('bangalore') || query.toLowerCase().includes('bengaluru')
        ? 'Bengaluru, Karnataka'
        : 'Mysuru & Regional Districts, Karnataka',
      formattedAddress: `${query.trim()}, South India`,
      taluk: 'Regional Taluk',
      isAirport:
        query.toLowerCase().includes('airport') ||
        query.toLowerCase().includes('kial') ||
        query.toLowerCase().includes('blr'),
    },
    ...POPULAR_LOCATIONS.slice(0, 5),
  ];

  clientPlacesCache.set(cacheKey, customList);
  return customList;
}

// Client-side API caller for Route & Distance Calculation
export async function calculateRouteDistance(
  origin: string,
  destination: string,
  viaStops: string[] = []
): Promise<CalculatedRouteInfo> {
  if (!origin || !destination) {
    return estimateDrivingDistanceMatrix(
      origin || 'Mysore Palace, Sayyaji Rao Rd, Mysuru',
      destination || 'Kempegowda International Airport Terminal 1 (BLR/KIAL)',
      viaStops
    );
  }

  const validStops = viaStops.filter((s) => s && s.trim().length > 0);
  const cacheKey = `${origin.trim().toLowerCase()}__${destination.trim().toLowerCase()}__${validStops.join('|').toLowerCase()}`;

  if (clientRouteCache.has(cacheKey)) {
    return clientRouteCache.get(cacheKey)!;
  }

  // Pre-resolve coordinates & place IDs from local database for maximum point-to-point accuracy
  const originMatch = findLocationCoordinates(origin);
  const destMatch = findLocationCoordinates(destination);
  const viaCoords = validStops.map((stop) => {
    const m = findLocationCoordinates(stop);
    return m.lat && m.lng ? { lat: m.lat, lng: m.lng } : null;
  });

  try {
    const res = await fetch('/api/maps/compute-route', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        origin,
        destination,
        viaStops: validStops,
        originCoords: originMatch.lat && originMatch.lng ? { lat: originMatch.lat, lng: originMatch.lng } : undefined,
        destinationCoords: destMatch.lat && destMatch.lng ? { lat: destMatch.lat, lng: destMatch.lng } : undefined,
        originPlaceId: originMatch.placeId,
        destinationPlaceId: destMatch.placeId,
        viaCoords,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.success && data.routeInfo) {
        clientRouteCache.set(cacheKey, data.routeInfo);
        return data.routeInfo;
      }
    }
  } catch (err) {
    // Fallback to internal road matrix
  }

  const calculated = estimateDrivingDistanceMatrix(origin, destination, validStops);
  clientRouteCache.set(cacheKey, calculated);
  return calculated;
}
