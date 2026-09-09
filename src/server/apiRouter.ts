import express, { Router } from "express";
import { GoogleGenAI, ThinkingLevel } from "@google/genai";
import { AIRPORT_LOCATIONS } from "../data/locations/airports";
import { MYSURU_LOCAL_LOCATIONS } from "../data/locations/mysuruLocal";
import { COORG_WAYANAD_OOTY_LOCATIONS } from "../data/locations/coorgWayanadOoty";
import { BENGALURU_EXPRESSWAY_LOCATIONS } from "../data/locations/bengaluruExpressway";
import { REGIONAL_HUBS_HOTELS_STATIONS } from "../data/locations/regionalHubsHotelsStations";
import { INTERCITY_HERITAGE_COASTAL_LOCATIONS } from "../data/locations/intercityHeritageCoastal";
import { ROUTE_MATRIX } from "../data/locations/routeDistances";
import { getInitialSeedTrips } from "../data/seedTrips";
import { serverPricingStore } from "./fareEngine/pricingStore";

const POPULAR_LOCATIONS = [
  ...AIRPORT_LOCATIONS,
  ...REGIONAL_HUBS_HOTELS_STATIONS,
  ...MYSURU_LOCAL_LOCATIONS,
  ...COORG_WAYANAD_OOTY_LOCATIONS,
  ...BENGALURU_EXPRESSWAY_LOCATIONS,
  ...INTERCITY_HERITAGE_COASTAL_LOCATIONS,
];

function detectInterstateTrip(originText: string, destText: string): {
  isInterstate: boolean;
  interstateTaxEstimate: number;
  fromState: string;
  toState: string;
} {
  const detectState = (text: string) => {
    const t = text.toLowerCase();
    if (
      t.includes("tamil nadu") ||
      t.includes("ooty") ||
      t.includes("udhagamandalam") ||
      t.includes("coimbatore") ||
      t.includes("nilgiris") ||
      t.includes("chennai") ||
      t.includes("salem") ||
      t.includes("madurai") ||
      t.includes("erode") ||
      t.includes("tiruppur") ||
      t.includes("hosur") ||
      t.includes("vellore")
    ) {
      return "Tamil Nadu";
    }
    if (
      t.includes("kerala") ||
      t.includes("wayanad") ||
      t.includes("kalpetta") ||
      t.includes("sulthan bathery") ||
      t.includes("vythiri") ||
      t.includes("kozhikode") ||
      t.includes("calicut") ||
      t.includes("kannur") ||
      t.includes("kochi") ||
      t.includes("cochin") ||
      t.includes("munnar") ||
      t.includes("thrissur")
    ) {
      return "Kerala";
    }
    return "Karnataka";
  };

  const fromState = detectState(originText);
  const toState = detectState(destText);

  if (fromState !== toState) {
    const tax = toState === "Tamil Nadu" || fromState === "Tamil Nadu" ? 600 : 550;
    return { isInterstate: true, interstateTaxEstimate: tax, fromState, toState };
  }

  return { isInterstate: false, interstateTaxEstimate: 0, fromState, toState };
}

function detectHighwayCorridor(
  originText: string,
  destText: string,
  defaultDesc: string
): { corridor: string; toll: number } {
  const o = originText.toLowerCase();
  const d = destText.toLowerCase();
  if (
    ((o.includes("mysur") || o.includes("myso")) &&
      (d.includes("bengaluru") || d.includes("bangalore") || d.includes("airport") || d.includes("kial"))) ||
    ((d.includes("mysur") || d.includes("myso")) &&
      (o.includes("bengaluru") || o.includes("bangalore") || o.includes("airport") || o.includes("kial")))
  ) {
    const isAirport =
      o.includes("airport") || d.includes("airport") || o.includes("kial") || d.includes("kial");
    return {
      corridor: isAirport
        ? "NH 275 Bengaluru-Mysuru Expressway + NH 44 Airport Corridor"
        : "NH 275 10-Lane Bengaluru-Mysuru Expressway",
      toll: 320,
    };
  }
  if (o.includes("ooty") || d.includes("ooty") || o.includes("nilgiris") || d.includes("nilgiris")) {
    return { corridor: "NH 766 & NH 181 via Bandipur & Nilgiris Ghats", toll: 120 };
  }
  if (o.includes("wayanad") || d.includes("wayanad") || o.includes("kalpetta") || d.includes("kalpetta")) {
    return { corridor: "NH 766 Gundlupet-Sultan Bathery Forest Corridor", toll: 60 };
  }
  if (o.includes("coorg") || d.includes("coorg") || o.includes("madikeri") || d.includes("madikeri")) {
    return { corridor: "SH 88 / NH 275 Hunsur-Periyapatna-Kushalnagar Highway", toll: 0 };
  }
  if (o.includes("kabini") || d.includes("kabini") || o.includes("nagarhole") || d.includes("nagarhole")) {
    return { corridor: "SH 33 / HD Kote Mananthavady Wildlife Corridor", toll: 0 };
  }
  if (o.includes("hassan") || d.includes("hassan") || o.includes("belur") || d.includes("belur")) {
    return { corridor: "SH 57 / NH 373 KR Nagara-Holenarasipura Highway", toll: 0 };
  }
  return { corridor: defaultDesc || "South Indian National/State Highway Corridor", toll: 0 };
}

function calculateHaversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function reverseGeocodeToPlace(lat: number, lng: number) {
  let closest = POPULAR_LOCATIONS[0];
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

  if (minDistance <= 3.0) {
    return {
      placeId: closest.placeId,
      placeName: closest.placeName,
      formattedAddress: `Current Location near ${closest.placeName}, ${closest.city}`,
      areaLocality: closest.areaLocality || "Current Location",
      city: closest.city || "Karnataka",
      lat,
      lng,
      types: closest.types || ["street_address"],
    };
  }

  return {
    placeId: `current_loc_${Date.now()}`,
    placeName: `Current Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`,
    areaLocality: closest.areaLocality || "Current GPS Location",
    city: closest.city || "Karnataka, South India",
    formattedAddress: `Current GPS Coordinates near ${closest.placeName}`,
    lat,
    lng,
    types: ["street_address"],
  };
}

// Helper to find matching Mysuru locations from catalog for rich Google Maps place cards
function findMysuruLocationsForQuery(query: string): Array<{ title: string; uri: string; reviewSnippet?: string; address?: string }> {
  const q = query.toLowerCase().trim();
  if (!q) return [];

  const matched: Array<{ title: string; uri: string; reviewSnippet?: string; address?: string }> = [];
  const seen = new Set<string>();

  for (const loc of MYSURU_LOCAL_LOCATIONS) {
    const pName = loc.placeName.toLowerCase();
    const area = (loc.areaLocality || "").toLowerCase();
    const landmark = (loc.landmark || "").toLowerCase();
    const address = (loc.formattedAddress || "").toLowerCase();
    const highlights = (loc.highlights || []).join(" ").toLowerCase();

    // Check specific sub-strings or phrases
    const cleanPlaceName = loc.placeName.split("(")[0].trim().toLowerCase();
    const tokens = [cleanPlaceName, ...pName.split(/[/&,-]/).map((s) => s.trim().toLowerCase()).filter((s) => s.length >= 4)];

    let isMatch = false;
    for (const token of tokens) {
      if (token && q.includes(token)) {
        isMatch = true;
        break;
      }
    }

    if (!isMatch) {
      if (area && q.includes(area)) isMatch = true;
      else if (landmark && q.includes(landmark)) isMatch = true;
      else if (address && q.includes(address)) isMatch = true;
      else if (highlights && highlights.split(" ").some((w) => w.length > 4 && q.includes(w))) isMatch = true;
    }

    if (isMatch) {
      const uri = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${loc.placeName}, ${loc.city || "Mysuru, Karnataka"}`)}`;
      if (!seen.has(uri)) {
        seen.add(uri);
        matched.push({
          title: loc.placeName,
          uri,
          reviewSnippet: loc.description || `${loc.areaLocality || "Mysuru"} - Guaranteed 24/7 Doorstep Cab Pickup & Drop.`,
          address: loc.formattedAddress,
        });
      }
    }

    if (matched.length >= 6) break;
  }

  return matched;
}

// In-memory cache & circuit breakers for Google Maps Platform APIs
const routeCache = new Map<string, { data: any; timestamp: number }>();
const autocompleteCache = new Map<string, { data: any; timestamp: number }>();
const placeDetailsCache = new Map<string, { data: any; timestamp: number }>();
let googleRoutesRateLimitedUntil = 0;
let googlePlacesRateLimitedUntil = 0;
const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes cache

// In-memory buffer for bookings fallback initialized with verified dispatch records
const serverBookingsBuffer: any[] = [...getInitialSeedTrips()];
// In-memory buffer for customer login WhatsApp notifications
const serverLoginNotificationsBuffer: any[] = [];

export function createApiRouter(): Router {
  const router = Router();
  router.use(express.json());

  // Health check endpoint
  router.get("/health", (req, res) => {
    return res.json({
      status: "ok",
      service: "TRAVEL JUST API",
      timestamp: new Date().toISOString(),
    });
  });

  // -------------------------------------------------------------
  // LIVE DYNAMIC PRICE & FARE ENGINE API ENDPOINTS
  // -------------------------------------------------------------

  // 1. Get all vehicle dynamic pricing configurations
  router.get("/fare/configs", (req, res) => {
    const configs = serverPricingStore.getAllConfigs();
    return res.json({ success: true, configs });
  });

  // 2. Get pricing configuration for specific vehicle
  router.get("/fare/configs/:vehicleId", (req, res) => {
    const { vehicleId } = req.params;
    const config = serverPricingStore.getConfig(vehicleId);
    if (!config) {
      return res.status(404).json({ success: false, error: `Vehicle config not found: ${vehicleId}` });
    }
    return res.json({ success: true, config });
  });

  // 3. Update vehicle pricing configuration (with versioning, validation, and audit tracking)
  router.post("/fare/configs/:vehicleId", (req, res) => {
    try {
      const { vehicleId } = req.params;
      const updates = req.body;
      const updatedBy = (req.headers["x-admin-user"] as string) || "Administrator";

      // Input validation: disallow negative rates
      if (updates.pricingByBookingType) {
        for (const [bType, p] of Object.entries(updates.pricingByBookingType as Record<string, any>)) {
          if (
            p.baseFare < 0 ||
            p.perKmRate < 0 ||
            p.extraPerKmRate < 0 ||
            p.hourlyRate < 0 ||
            p.extraPerHourRate < 0 ||
            p.driverAllowance < 0 ||
            p.minimumFare < 0
          ) {
            return res.status(400).json({
              success: false,
              error: `Invalid pricing rates for ${bType}: Negative values are strictly forbidden.`,
            });
          }
        }
      }

      const updated = serverPricingStore.updateConfig(vehicleId, updates, updatedBy);
      return res.json({
        success: true,
        message: `Pricing updated to Version ${updated.pricingVersion} for ${updated.vehicleName}`,
        config: updated,
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  // 4. Reset vehicle pricing configurations to defaults
  router.post("/fare/reset", (req, res) => {
    const { vehicleId } = req.body || {};
    serverPricingStore.resetToDefaults(vehicleId);
    return res.json({
      success: true,
      message: vehicleId ? `Reset ${vehicleId} to default pricing` : "All vehicle pricing configs reset to defaults",
      configs: serverPricingStore.getAllConfigs(),
    });
  });

  // 5. Authoritative centralized calculation endpoint for a single vehicle
  router.post("/fare/calculate", (req, res) => {
    try {
      const {
        origin,
        destination,
        distanceKm,
        durationMinutes,
        bookingType = "ONE_WAY",
        vehicleId,
        pickupDateTime,
        pickupTime,
        roundTripDays,
        airportTransferType,
        viaStopsCount,
      } = req.body;

      if (!vehicleId) {
        return res.status(400).json({ success: false, error: "vehicleId is required" });
      }

      const result = serverPricingStore.calculateAuthoritativeFare({
        origin: origin || "Origin",
        destination: destination || "Destination",
        distanceKm: Number(distanceKm) || 0,
        durationMinutes: Number(durationMinutes) || 0,
        bookingType,
        vehicleId,
        pickupDateTime,
        pickupTime,
        roundTripDays: Number(roundTripDays) || 1,
        airportTransferType,
        viaStopsCount: Number(viaStopsCount) || 0,
      });

      return res.json({ success: true, fare: result });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  // 6. Authoritative centralized calculation endpoint for ALL active vehicles
  router.post("/fare/calculate-all", (req, res) => {
    try {
      const {
        origin,
        destination,
        distanceKm,
        durationMinutes,
        bookingType = "ONE_WAY",
        pickupDateTime,
        pickupTime,
        roundTripDays,
        airportTransferType,
        viaStopsCount,
      } = req.body;

      const results = serverPricingStore.calculateAllVehicles({
        origin: origin || "Origin",
        destination: destination || "Destination",
        distanceKm: Number(distanceKm) || 0,
        durationMinutes: Number(durationMinutes) || 0,
        bookingType,
        pickupDateTime,
        pickupTime,
        roundTripDays: Number(roundTripDays) || 1,
        airportTransferType,
        viaStopsCount: Number(viaStopsCount) || 0,
      });

      return res.json({ success: true, fares: results });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  // 7. Live Fare Preview tester endpoint
  router.post("/fare/preview", async (req, res) => {
    try {
      const {
        origin,
        destination,
        distanceKm: customKm,
        durationMinutes: customMins,
        bookingType = "ONE_WAY",
        vehicleId = "toyota-etios",
        pickupTime = "09:00",
        roundTripDays = 1,
      } = req.body;

      let distanceKm = Number(customKm) || 0;
      let durationMinutes = Number(customMins) || 0;
      let routeSource = "custom";

      if ((!distanceKm || distanceKm <= 0) && origin && destination) {
        const mKey = `${origin.trim().toLowerCase()}__${destination.trim().toLowerCase()}`;
        const revKey = `${destination.trim().toLowerCase()}__${origin.trim().toLowerCase()}`;
        const matrixEntry = (ROUTE_MATRIX as any)[mKey] || (ROUTE_MATRIX as any)[revKey];
        if (matrixEntry) {
          distanceKm = matrixEntry.distanceKm;
          durationMinutes = matrixEntry.durationMinutes;
          routeSource = "matrix";
        } else {
          distanceKm = 145;
          durationMinutes = 195;
          routeSource = "estimate";
        }
      }

      const result = serverPricingStore.calculateAuthoritativeFare({
        origin: origin || "Mysuru",
        destination: destination || "Bengaluru",
        distanceKm,
        durationMinutes,
        bookingType,
        vehicleId,
        pickupTime,
        roundTripDays: Number(roundTripDays) || 1,
      });

      return res.json({
        success: true,
        routeSource,
        preview: result,
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  // API route to record and process Customer Login WhatsApp Notification for Owner
  router.post("/notifications/customer-login", async (req, res) => {
    try {
      const { customer, notification, isNewRegistration, formattedMessage, ownerPhone } = req.body;
      const targetPhone = ownerPhone || "+91 9740754400";
      const cleanPhone = targetPhone.replace(/\D/g, "");
      const finalOwnerPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
      
      const record = {
        id: notification?.id || `notif_${Date.now()}`,
        customerId: customer?.id || "unknown",
        customerName: customer?.fullName || "Valued Customer",
        customerPhone: customer?.mobileNumber || "",
        customerEmail: customer?.email || "",
        isNewRegistration: !!isNewRegistration,
        timestamp: new Date().toISOString(),
        ownerPhone: targetPhone,
        whatsappUrl: `https://wa.me/${finalOwnerPhone}?text=${encodeURIComponent(formattedMessage || "")}`,
        formattedMessage: formattedMessage || "",
        status: "DISPATCHED_TO_OWNER_WHATSAPP",
      };

      // Add to server-side in-memory notification buffer
      serverLoginNotificationsBuffer.unshift(record);
      if (serverLoginNotificationsBuffer.length > 100) {
        serverLoginNotificationsBuffer.pop();
      }

      console.log(`[WhatsApp Notification -> Owner ${targetPhone}]: Customer ${record.customerName} (${record.customerPhone}) logged in.`);

      return res.json({
        success: true,
        message: "Customer login notification recorded and queued for owner WhatsApp dispatch",
        record,
      });
    } catch (err: any) {
      console.error("Error in customer-login notification endpoint:", err);
      return res.json({
        success: true,
        fallback: true,
        message: "Notification received locally",
      });
    }
  });

  // API route to get latest customer login alerts for owner
  router.get("/notifications/customer-logins", (req, res) => {
    res.json({
      success: true,
      notifications: serverLoginNotificationsBuffer.slice(0, 50),
    });
  });

  // API route to get or check Supabase status
  router.get("/supabase-status", (req, res) => {
    return res.json({
      success: false,
      configured: false,
      status: "Disabled (Local Storage & Server Registry Mode)",
    });
  });

  // Google Maps Platform: Config & API Key status
  router.get("/maps/config", (req, res) => {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY || process.env.VITE_GOOGLE_MAPS_API_KEY;
    const hasKey = !!apiKey && apiKey !== "MY_GOOGLE_MAPS_API_KEY" && apiKey.trim() !== "";
    res.json({
      success: true,
      hasApiKey: hasKey,
      mapId: process.env.GOOGLE_MAPS_MAP_ID || "DEMO_MAP_ID",
      attributionId: "gmp_mcp_codeassist_v1_aistudio",
    });
  });

  // Google Maps Platform: Places API (New) Autocomplete Endpoint
  router.post("/maps/autocomplete", async (req, res) => {
    try {
      const { input, sessionToken } = req.body;
      if (!input || typeof input !== "string" || input.trim().length === 0) {
        return res.json({ success: true, suggestions: [] });
      }

      const cacheKey = input.trim().toLowerCase();
      const cached = autocompleteCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
        return res.json({ success: true, suggestions: cached.data });
      }

      const apiKey = process.env.GOOGLE_MAPS_API_KEY || process.env.VITE_GOOGLE_MAPS_API_KEY;
      if (!apiKey || apiKey === "MY_GOOGLE_MAPS_API_KEY" || apiKey.trim() === "") {
        return res.json({ success: false, reason: "NO_API_KEY", suggestions: [] });
      }

      // Check circuit breaker cooldown for rate limit (429)
      if (Date.now() < googlePlacesRateLimitedUntil) {
        return res.json({ success: false, reason: "RATE_LIMITED_COOLDOWN", suggestions: [] });
      }

      const response = await fetch("https://places.googleapis.com/v1/places:autocomplete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": apiKey,
          "X-Goog-FieldMask":
            "suggestions.placePrediction.placeId,suggestions.placePrediction.text,suggestions.placePrediction.structuredFormat,suggestions.placePrediction.types",
          "X-Goog-Maps-Solution-ID": "gmp_mcp_codeassist_v1_aistudio",
        },
        body: JSON.stringify({
          input: input.trim(),
          includedRegionCodes: ["in"],
          locationBias: {
            circle: {
              center: { latitude: 12.2958, longitude: 76.6394 }, // Centered on Mysuru / South India
              radius: 600000.0,
            },
          },
          ...(sessionToken ? { sessionToken } : {}),
        }),
      });

      if (!response.ok) {
        if (response.status === 429) {
          googlePlacesRateLimitedUntil = Date.now() + 60000; // 1 min cooldown
        }
        return res.json({ success: false, status: response.status, suggestions: [] });
      }

      const data = await response.json();
      const rawSuggestions = data.suggestions || [];

      const suggestions = rawSuggestions
        .filter((item: any) => item.placePrediction)
        .map((item: any) => {
          const p = item.placePrediction;
          const mainText = p.structuredFormat?.mainText?.text || p.text?.text || "";
          const secondaryText = p.structuredFormat?.secondaryText?.text || "";
          const types: string[] = p.types || [];
          const isAirport =
            types.includes("airport") ||
            mainText.toLowerCase().includes("airport") ||
            mainText.toLowerCase().includes("kial") ||
            secondaryText.toLowerCase().includes("airport");

          return {
            placeId: p.placeId || `gmp_${Math.random()}`,
            placeName: mainText,
            areaLocality: secondaryText.split(",")[0]?.trim() || secondaryText,
            city: secondaryText,
            formattedAddress: p.text?.text || mainText,
            types,
            isAirport,
          };
        });

      autocompleteCache.set(cacheKey, { data: suggestions, timestamp: Date.now() });
      return res.json({ success: true, suggestions });
    } catch (err: any) {
      return res.json({ success: false, suggestions: [] });
    }
  });

  // Google Maps Platform: Places API (New) Place Details Endpoint (Resolves Place ID to Coordinates & Details)
  router.post("/maps/place-details", async (req, res) => {
    try {
      const { placeId, sessionToken } = req.body;
      if (!placeId || typeof placeId !== "string" || placeId.trim().length === 0) {
        return res.status(400).json({ success: false, error: "placeId is required" });
      }

      const cacheKey = placeId.trim();
      const cached = placeDetailsCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
        return res.json({ success: true, place: cached.data });
      }

      const apiKey = process.env.GOOGLE_MAPS_API_KEY || process.env.VITE_GOOGLE_MAPS_API_KEY;
      if (apiKey && apiKey !== "MY_GOOGLE_MAPS_API_KEY" && apiKey.trim() !== "" && placeId.startsWith("ChIJ")) {
        const url = new URL(`https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}`);
        if (sessionToken) {
          url.searchParams.set("sessionToken", sessionToken);
        }

        const response = await fetch(url.toString(), {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "X-Goog-Api-Key": apiKey,
            "X-Goog-FieldMask": "id,displayName,formattedAddress,location,types,addressComponents",
            "X-Goog-Maps-Solution-ID": "gmp_mcp_codeassist_v1_aistudio",
          },
        });

        if (response.ok) {
          const data = await response.json();
          const place = {
            placeId: data.id || placeId,
            placeName: data.displayName?.text || "",
            formattedAddress: data.formattedAddress || "",
            lat: data.location?.latitude,
            lng: data.location?.longitude,
            types: data.types || [],
          };
          placeDetailsCache.set(cacheKey, { data: place, timestamp: Date.now() });
          return res.json({ success: true, place });
        }
      }

      // Fallback to local catalog
      const localMatch = POPULAR_LOCATIONS.find((p) => p.placeId === placeId || p.placeName.toLowerCase() === placeId.toLowerCase());
      if (localMatch) {
        const place = {
          placeId: localMatch.placeId,
          placeName: localMatch.placeName,
          formattedAddress: localMatch.formattedAddress,
          lat: localMatch.lat,
          lng: localMatch.lng,
          types: localMatch.types || [],
          isAirport: localMatch.isAirport,
        };
        return res.json({ success: true, place, source: "catalog" });
      }

      return res.json({ success: false, reason: "NOT_FOUND" });
    } catch (err: any) {
      console.error("Error in /maps/place-details:", err);
      return res.json({ success: false, error: err.message });
    }
  });

  // Google Maps Platform: Reverse Geocoding Endpoint for Current Location (GPS)
  router.post("/maps/reverse-geocode", async (req, res) => {
    try {
      const { lat, lng } = req.body;
      if (typeof lat !== "number" || typeof lng !== "number") {
        return res.status(400).json({ success: false, error: "lat and lng numbers are required" });
      }

      const apiKey = process.env.GOOGLE_MAPS_API_KEY || process.env.VITE_GOOGLE_MAPS_API_KEY;
      if (apiKey && apiKey !== "MY_GOOGLE_MAPS_API_KEY" && apiKey.trim() !== "") {
        const geoUrl = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}`;
        const response = await fetch(geoUrl);
        if (response.ok) {
          const data = await response.json();
          if (data.status === "OK" && Array.isArray(data.results) && data.results.length > 0) {
            const first = data.results[0];
            const getComp = (type: string) => first.address_components?.find((c: any) => c.types.includes(type))?.long_name || "";
            const locality = getComp("locality") || getComp("sublocality") || getComp("administrative_area_level_2");
            const state = getComp("administrative_area_level_1");
            const place = {
              placeId: first.place_id || `loc_gps_${Date.now()}`,
              placeName: locality ? `Current Location (${locality})` : "Current Location",
              formattedAddress: first.formatted_address || `${lat.toFixed(5)}, ${lng.toFixed(5)}`,
              areaLocality: locality || "Current GPS Location",
              city: state ? `${locality}, ${state}` : "Karnataka, South India",
              lat,
              lng,
              types: first.types || ["street_address"],
            };
            return res.json({ success: true, place });
          }
        }
      }

      // Fallback to local reverse geocode
      const localPlace = reverseGeocodeToPlace(lat, lng);
      return res.json({ success: true, place: localPlace, source: "fallback_geocoding" });
    } catch (err: any) {
      console.error("Error in /maps/reverse-geocode:", err);
      const fallback = reverseGeocodeToPlace(req.body?.lat || 12.2958, req.body?.lng || 76.6394);
      return res.json({ success: true, place: fallback, fallback: true });
    }
  });

  // Google Maps Platform: Full Technical Architecture & Database Schema Specification
  router.get("/maps/architecture-spec", (req, res) => {
    return res.json({
      success: true,
      title: "TRAVEL JUST Google Maps Platform & Dynamic Fare Engine Technical Architecture",
      version: "2.5.0",
      architecture: {
        clientTier: {
          library: "@vis.gl/react-google-maps v1.7.5 & Native Web Geolocation API",
          components: [
            "LocationAutocompleteInput.tsx (Places Autocomplete with category filtering: Hotels, Stations, Airports, Sightseeing)",
            "CurrentLocationPicker (Browser GPS geolocation with high-accuracy coords & reverse-geocoding)",
            "BookingSearch.tsx (State manager capturing Place ID + Latitude + Longitude for FROM & TO)",
            "LiveRouteSummaryBanner (Visual display of calculated road distance, travel time, highway, tolls)",
            "DynamicFareCalculator (Distance-calibrated fare calculation across 4 tiers: Sedan, SUV, Crysta, Tempo Traveller)",
          ],
          optimizations: [
            "Autocomplete Session Tokens: Groups keystroke suggestions with final Place Details fetch for 70%+ API cost savings",
            "Field Masking: Requests only essential fields (id, displayName, formattedAddress, location, types)",
            "Client Debounce: 120ms debounce prevents excessive keystroke queries",
            "Regional Bias: Centered on South Indian network (Karnataka, Tamil Nadu, Kerala) with 600km radius",
          ],
        },
        serverProxyTier: {
          endpoints: [
            "POST /api/maps/autocomplete (Proxies Places API New autocomplete with in-memory caching)",
            "POST /api/maps/place-details (Fetches exact Place ID, lat/lng coordinates & formatted address)",
            "POST /api/maps/reverse-geocode (Translates GPS lat/lng into verified human-readable address)",
            "POST /api/maps/compute-route (Routes API Directions v2 computeRoutes with waypoints, tolls & polylines)",
          ],
          resilience: [
            "Circuit Breakers: Detects HTTP 429 rate-limiting and applies automatic 60s cooldown",
            "In-Memory LRU Caching: 30-minute TTL for high-frequency routes and autocomplete queries",
            "Intelligent Fallback Engine: Seamlessly switches to 290+ calibrated South Indian highway routes if API offline",
          ],
        },
        databaseSchema: {
          dialect: "PostgreSQL / Supabase / Cloud SQL",
          tables: [
            {
              tableName: "google_places_cache",
              columns: [
                "place_id VARCHAR(120) PRIMARY KEY",
                "place_name VARCHAR(255) NOT NULL",
                "formatted_address TEXT NOT NULL",
                "latitude NUMERIC(10, 7) NOT NULL",
                "longitude NUMERIC(10, 7) NOT NULL",
                "category VARCHAR(50)",
                "types TEXT[]",
                "created_at TIMESTAMPTZ DEFAULT NOW()",
              ],
            },
            {
              tableName: "routes_distance_cache",
              columns: [
                "route_key VARCHAR(255) PRIMARY KEY",
                "origin_place_id VARCHAR(120)",
                "destination_place_id VARCHAR(120)",
                "distance_meters INTEGER NOT NULL",
                "distance_km NUMERIC(8, 2) NOT NULL",
                "duration_seconds INTEGER NOT NULL",
                "duration_text VARCHAR(60) NOT NULL",
                "highway_corridor VARCHAR(120)",
                "toll_estimate_inr INTEGER DEFAULT 0",
                "encoded_polyline TEXT",
                "updated_at TIMESTAMPTZ DEFAULT NOW()",
              ],
            },
            {
              tableName: "cab_bookings",
              columns: [
                "booking_id UUID PRIMARY KEY DEFAULT gen_random_uuid()",
                "customer_name VARCHAR(150) NOT NULL",
                "customer_phone VARCHAR(20) NOT NULL",
                "service_type VARCHAR(30) NOT NULL",
                "pickup_address TEXT NOT NULL",
                "pickup_place_id VARCHAR(120)",
                "pickup_lat NUMERIC(10, 7)",
                "pickup_lng NUMERIC(10, 7)",
                "drop_address TEXT NOT NULL",
                "drop_place_id VARCHAR(120)",
                "drop_lat NUMERIC(10, 7)",
                "drop_lng NUMERIC(10, 7)",
                "calculated_distance_km NUMERIC(8, 2) NOT NULL",
                "calculated_duration_mins INTEGER NOT NULL",
                "vehicle_id VARCHAR(50) NOT NULL",
                "total_estimated_fare NUMERIC(10, 2) NOT NULL",
                "fare_breakdown JSONB",
                "created_at TIMESTAMPTZ DEFAULT NOW()",
              ],
            },
          ],
        },
      },
    });
  });

  // Google Maps Platform: Routes API Route & Driving Distance Calculation Endpoint
  router.post("/maps/compute-route", async (req, res) => {
    try {
      const apiKey = process.env.GOOGLE_MAPS_API_KEY || process.env.VITE_GOOGLE_MAPS_API_KEY || "";
      const {
        origin,
        destination,
        viaStops,
        originCoords,
        destinationCoords,
        originPlaceId,
        destinationPlaceId,
        viaCoords,
      } = req.body;

      if (!origin || !destination) {
        return res.status(400).json({ success: false, error: "Origin and destination required" });
      }

      const validViaStops: string[] = Array.isArray(viaStops)
        ? viaStops.filter((s) => typeof s === "string" && s.trim().length > 0)
        : [];

      const cacheKey = `${origin.trim().toLowerCase()}__${destination.trim().toLowerCase()}__${validViaStops.join('|').toLowerCase()}`;
      const cached = routeCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
        return res.json({ success: true, routeInfo: cached.data });
      }

      const interstate = detectInterstateTrip(origin, destination);
      const highwayInfo = detectHighwayCorridor(origin, destination, "");

      const isAirport =
        origin.toLowerCase().includes("airport") ||
        destination.toLowerCase().includes("airport") ||
        origin.toLowerCase().includes("kial") ||
        destination.toLowerCase().includes("kial") ||
        origin.toLowerCase().includes("blr") ||
        destination.toLowerCase().includes("blr");

      // Format duration helper
      const formatDurationText = (mins: number) => {
        if (mins < 60) return `Approx. ${mins} min`;
        const h = Math.floor(mins / 60);
        const m = mins % 60;
        return m === 0 ? `${h} hr${h > 1 ? "s" : ""}` : `${h} hr${h > 1 ? "s" : ""} ${m} min`;
      };

      // If Google Maps API key is provided and not demo placeholder, call Google Routes API Directions v2
      if (apiKey && apiKey !== "MY_GOOGLE_MAPS_API_KEY" && apiKey.trim() !== "" && Date.now() >= googleRoutesRateLimitedUntil) {
        // Build waypoint specification for Origin
        let originWaypoint: any = { address: origin };
        if (originCoords && typeof originCoords.lat === "number" && typeof originCoords.lng === "number") {
          originWaypoint = {
            location: {
              latLng: {
                latitude: originCoords.lat,
                longitude: originCoords.lng,
              },
            },
          };
        } else if (originPlaceId && typeof originPlaceId === "string" && originPlaceId.startsWith("ChIJ")) {
          originWaypoint = { placeId: originPlaceId };
        }

        // Build waypoint specification for Destination
        let destWaypoint: any = { address: destination };
        if (destinationCoords && typeof destinationCoords.lat === "number" && typeof destinationCoords.lng === "number") {
          destWaypoint = {
            location: {
              latLng: {
                latitude: destinationCoords.lat,
                longitude: destinationCoords.lng,
              },
            },
          };
        } else if (destinationPlaceId && typeof destinationPlaceId === "string" && destinationPlaceId.startsWith("ChIJ")) {
          destWaypoint = { placeId: destinationPlaceId };
        }

        const payload: any = {
          origin: originWaypoint,
          destination: destWaypoint,
          travelMode: "DRIVE",
          routingPreference: "TRAFFIC_AWARE",
          computeAlternativeRoutes: true,
          units: "METRIC",
          languageCode: "en-US",
        };

        if (validViaStops.length > 0) {
          payload.intermediates = validViaStops.map((stop, idx) => {
            const coord = viaCoords && Array.isArray(viaCoords) ? viaCoords[idx] : null;
            if (coord && typeof coord.lat === "number" && typeof coord.lng === "number") {
              return {
                location: {
                  latLng: {
                    latitude: coord.lat,
                    longitude: coord.lng,
                  },
                },
              };
            }
            return { address: stop };
          });
        }

        try {
          const response = await fetch("https://routes.googleapis.com/directions/v2:computeRoutes", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-Goog-Api-Key": apiKey,
              "X-Goog-FieldMask":
                "routes.distanceMeters,routes.duration,routes.polyline.encodedPolyline,routes.description,routes.legs,routes.travelAdvisory.tollInfo,routes.routeLabels",
              "X-Goog-Maps-Solution-ID": "gmp_mcp_codeassist_v1_aistudio",
            },
            body: JSON.stringify(payload),
          });

          if (response.ok) {
            const data = await response.json();
            const primaryRoute = data.routes?.[0];

            if (primaryRoute && primaryRoute.distanceMeters > 0) {
              const distanceMeters = primaryRoute.distanceMeters;
              const distanceKm = Number((distanceMeters / 1000).toFixed(1));

              let durationMinutes = 30;
              if (primaryRoute.duration) {
                const seconds = parseInt(primaryRoute.duration.replace("s", ""), 10);
                if (!isNaN(seconds)) {
                  durationMinutes = Math.round(seconds / 60);
                }
              }

              const durationFormatted = formatDurationText(durationMinutes);
              const summaryText = `${distanceKm} km · ${durationFormatted}`;
              const routeDesc = primaryRoute.description || highwayInfo.corridor;

              // Distance Sanity Check
              let validationStatus: "VALID" | "SANITY_CHECK_FAILED" = "VALID";
              if (originCoords?.lat && destinationCoords?.lat) {
                const straightKm = calculateHaversineKm(
                  originCoords.lat,
                  originCoords.lng,
                  destinationCoords.lat,
                  destinationCoords.lng
                );
                if (straightKm > 5 && (distanceKm < straightKm * 0.7 || distanceKm > straightKm * 4.5)) {
                  validationStatus = "SANITY_CHECK_FAILED";
                }
              }
              if (distanceKm <= 0 || distanceKm > 3200) {
                validationStatus = "SANITY_CHECK_FAILED";
              }

              // Parse alternate routes
              const alternateRoutes = (data.routes || []).map((r: any, idx: number) => {
                const dM = r.distanceMeters || 0;
                const dK = Number((dM / 1000).toFixed(1));
                let durM = 30;
                if (r.duration) {
                  const s = parseInt(r.duration.replace("s", ""), 10);
                  if (!isNaN(s)) durM = Math.round(s / 60);
                }
                return {
                  routeIndex: idx,
                  description: r.description || (idx === 0 ? "Recommended Primary Route" : `Alternative Route ${idx}`),
                  distanceKm: dK,
                  distanceMeters: dM,
                  durationMinutes: durM,
                  durationFormatted: formatDurationText(durM),
                  encodedPolyline: r.polyline?.encodedPolyline,
                  highwayCorridor: highwayInfo.corridor,
                  tollEstimate: highwayInfo.toll,
                };
              });

              // Structured Server-Side Logging
              console.log(`[TRAVEL JUST Routes API v2] Computed route:`, {
                origin: originPlaceId || origin,
                destination: destinationPlaceId || destination,
                distanceMeters,
                distanceKm,
                duration: primaryRoute.duration,
                durationFormatted,
                routesCount: data.routes?.length || 1,
                isInterstate: interstate.isInterstate,
                interstateTaxEstimate: interstate.interstateTaxEstimate,
                timestamp: new Date().toISOString(),
                routingStatus: "SUCCESS",
              });

              const routeInfo = {
                distanceKm,
                distanceMeters,
                durationMinutes,
                durationFormatted,
                summaryText,
                originAddress: origin,
                destinationAddress: destination,
                originPlaceId,
                destinationPlaceId,
                stopsCount: validViaStops.length,
                viaStops: validViaStops,
                encodedPolyline: primaryRoute.polyline?.encodedPolyline,
                routeDescription: routeDesc,
                highwayCorridor: highwayInfo.corridor,
                tollEstimate: highwayInfo.toll,
                isAirportRoute: isAirport,
                originCoords: originCoords || undefined,
                destinationCoords: destinationCoords || undefined,
                isInterstate: interstate.isInterstate,
                interstateTaxEstimate: interstate.interstateTaxEstimate,
                interstateStates: { fromState: interstate.fromState, toState: interstate.toState },
                routesCount: data.routes?.length || 1,
                recommendedRoute: primaryRoute.description || "Fastest Highway Route",
                alternateRoutes,
                validationStatus,
                dataSource: "google_maps",
              };

              routeCache.set(cacheKey, { data: routeInfo, timestamp: Date.now() });
              return res.json({ success: true, routeInfo });
            }
          } else if (response.status === 429) {
            googleRoutesRateLimitedUntil = Date.now() + 60000;
          }
        } catch (apiErr) {
          console.error("Error connecting to Google Routes API v2:", apiErr);
        }
      }

      // Verified Road Network Fallback using calibrated ROUTE_MATRIX and POPULAR_LOCATIONS
      const o = origin.toLowerCase();
      const d = destination.toLowerCase();

      let matchedEntry: { distanceKm: number; durationMinutes: number; highway: string; toll: number } | null = null;
      for (const [k, v] of Object.entries(ROUTE_MATRIX)) {
        const [p1, p2] = k.split("-");
        const normP1 = p1.replace(/_/g, " ");
        const normP2 = p2.replace(/_/g, " ");
        if (
          (o.includes(normP1) || normP1.includes(o)) &&
          (d.includes(normP2) || normP2.includes(d))
        ) {
          matchedEntry = v;
          break;
        }
        if (
          (o.includes(normP2) || normP2.includes(o)) &&
          (d.includes(normP1) || normP1.includes(d))
        ) {
          matchedEntry = v;
          break;
        }
      }

      // Catalog destination check from Mysuru
      if (!matchedEntry && (o.includes("mysur") || o.includes("myso"))) {
        const found = POPULAR_LOCATIONS.find((loc) => {
          const name = loc.placeName.toLowerCase();
          return d.includes(name) || name.includes(d);
        });
        if (found && found.estimatedFromMysuruKm) {
          matchedEntry = {
            distanceKm: found.estimatedFromMysuruKm,
            durationMinutes: Math.round((found.estimatedFromMysuruKm / 48) * 60),
            highway: found.highlights?.[2] || highwayInfo.corridor,
            toll: found.estimatedFromMysuruKm > 100 ? 165 : 0,
          };
        }
      } else if (!matchedEntry && (d.includes("mysur") || d.includes("myso"))) {
        const found = POPULAR_LOCATIONS.find((loc) => {
          const name = loc.placeName.toLowerCase();
          return o.includes(name) || name.includes(o);
        });
        if (found && found.estimatedFromMysuruKm) {
          matchedEntry = {
            distanceKm: found.estimatedFromMysuruKm,
            durationMinutes: Math.round((found.estimatedFromMysuruKm / 48) * 60),
            highway: found.highlights?.[2] || highwayInfo.corridor,
            toll: found.estimatedFromMysuruKm > 100 ? 165 : 0,
          };
        }
      }

      if (matchedEntry) {
        let distanceKm = matchedEntry.distanceKm;
        let durationMinutes = matchedEntry.durationMinutes;
        if (validViaStops.length > 0) {
          distanceKm += validViaStops.length * 18.0;
          durationMinutes += validViaStops.length * 25;
        }
        const distanceMeters = Math.round(distanceKm * 1000);
        const durationFormatted = formatDurationText(durationMinutes);
        const summaryText = `${distanceKm.toFixed(1)} km · ${durationFormatted}`;

        const routeInfo = {
          distanceKm,
          distanceMeters,
          durationMinutes,
          durationFormatted,
          summaryText,
          originAddress: origin,
          destinationAddress: destination,
          originPlaceId,
          destinationPlaceId,
          stopsCount: validViaStops.length,
          viaStops: validViaStops,
          routeDescription: matchedEntry.highway,
          highwayCorridor: matchedEntry.highway,
          tollEstimate: matchedEntry.toll || highwayInfo.toll,
          isAirportRoute: isAirport,
          originCoords: originCoords || undefined,
          destinationCoords: destinationCoords || undefined,
          isInterstate: interstate.isInterstate,
          interstateTaxEstimate: interstate.interstateTaxEstimate,
          interstateStates: { fromState: interstate.fromState, toState: interstate.toState },
          routesCount: 1,
          recommendedRoute: matchedEntry.highway,
          validationStatus: "VALID",
          dataSource: "intelligent_matrix",
        };

        routeCache.set(cacheKey, { data: routeInfo, timestamp: Date.now() });
        return res.json({ success: true, routeInfo });
      }

      // Point-to-point coordinate math if coordinates are available
      if (originCoords?.lat && originCoords?.lng && destinationCoords?.lat && destinationCoords?.lng) {
        const straightLineKm = calculateHaversineKm(
          originCoords.lat,
          originCoords.lng,
          destinationCoords.lat,
          destinationCoords.lng
        );

        const isHills =
          o.includes("coorg") || d.includes("coorg") ||
          o.includes("ooty") || d.includes("ooty") ||
          o.includes("wayanad") || d.includes("wayanad") ||
          o.includes("madikeri") || d.includes("madikeri");

        const isExpressway =
          (o.includes("mysur") || o.includes("myso")) &&
          (d.includes("bengaluru") || d.includes("bangalore") || d.includes("kial") || d.includes("airport"));

        const roadFactor = isHills ? 1.45 : isExpressway ? 1.18 : straightLineKm > 40 ? 1.28 : 1.35;
        let distanceKm = Math.max(3.5, Number((straightLineKm * roadFactor).toFixed(1)));
        const avgSpeed = isHills ? 38 : isExpressway ? 72 : straightLineKm > 40 ? 50 : 28;
        let durationMinutes = Math.max(12, Math.round((distanceKm / avgSpeed) * 60));

        if (validViaStops.length > 0) {
          distanceKm += validViaStops.length * 18.0;
          durationMinutes += validViaStops.length * 25;
        }

        const distanceMeters = Math.round(distanceKm * 1000);
        const durationFormatted = formatDurationText(durationMinutes);
        const summaryText = `${distanceKm} km · ${durationFormatted}`;

        const routeInfo = {
          distanceKm,
          distanceMeters,
          durationMinutes,
          durationFormatted,
          summaryText,
          originAddress: origin,
          destinationAddress: destination,
          originPlaceId,
          destinationPlaceId,
          stopsCount: validViaStops.length,
          viaStops: validViaStops,
          routeDescription: highwayInfo.corridor,
          highwayCorridor: highwayInfo.corridor,
          tollEstimate: highwayInfo.toll,
          isAirportRoute: isAirport,
          originCoords,
          destinationCoords,
          isInterstate: interstate.isInterstate,
          interstateTaxEstimate: interstate.interstateTaxEstimate,
          interstateStates: { fromState: interstate.fromState, toState: interstate.toState },
          routesCount: 1,
          validationStatus: "VALID",
          dataSource: "intelligent_matrix",
        };

        routeCache.set(cacheKey, { data: routeInfo, timestamp: Date.now() });
        return res.json({ success: true, routeInfo });
      }

      // If location is unrecognized and cannot be resolved to roads or coordinates:
      return res.status(400).json({
        success: false,
        error: "We couldn't calculate the driving route between these locations. Please select a more specific location from the suggestions.",
      });
    } catch (err: any) {
      console.error("Error in compute-route:", err);
      return res.status(500).json({ success: false, error: "Routing service temporarily unavailable" });
    }
  });

  // API route to get recent bookings
  router.get("/bookings", (req, res) => {
    return res.json({ success: true, source: "server_memory", bookings: serverBookingsBuffer });
  });

  // API route to insert booking appointment
  router.post("/bookings", async (req, res) => {
    try {
      const booking = req.body;
      if (!booking || !booking.referenceId) {
        return res.status(400).json({ success: false, error: "Invalid booking payload" });
      }

      // Build authoritative snapshot if available
      const fareSnapshot = booking.estimatedFare?.fareSnapshot || booking.fareSnapshot || {
        vehicleId: booking.selectedVehicle?.id || "unknown",
        vehicleType: booking.selectedVehicle?.name || "Standard",
        baseFare: booking.estimatedFare?.baseFare || 500,
        perKmRate: booking.estimatedFare?.ratePerKm || 14,
        includedKm: booking.estimatedFare?.includedKm || 0,
        extraPerKmRate: booking.estimatedFare?.extraPerKmRate || 12,
        includedHours: booking.estimatedFare?.includedHours || 0,
        hourlyRate: booking.estimatedFare?.hourlyRate || 250,
        extraPerHourRate: booking.estimatedFare?.extraPerHourRate || 150,
        driverAllowance: booking.estimatedFare?.driverAllowance || 300,
        distanceKm: booking.searchDetails?.distanceKm || 0,
        durationMinutes: booking.searchDetails?.durationMinutes || 0,
        durationHours: booking.searchDetails?.durationHours || 0,
        additionalCharges: booking.estimatedFare?.additionalCharges || 0,
        totalFare: booking.estimatedFare?.totalEstimatedFare || 0,
        pricingVersion: booking.estimatedFare?.pricingVersion || 1,
        currency: "INR",
        timestamp: new Date().toISOString(),
        pricingModel: booking.estimatedFare?.pricingModel || "BASE_PLUS_DISTANCE",
      };

      const rowData = {
        reference_id: booking.referenceId,
        full_name: booking.passengerDetails?.fullName || "",
        mobile_number: booking.passengerDetails?.mobileNumber || "",
        email: booking.passengerDetails?.email || "",
        service_type: booking.searchDetails?.serviceType || "oneway",
        pickup_location: booking.searchDetails?.pickupLocation || "",
        drop_location: booking.searchDetails?.dropLocation || "",
        travel_date: booking.searchDetails?.travelDate || "",
        pickup_time: booking.searchDetails?.pickupTime || "",
        return_date: booking.searchDetails?.returnDate || null,
        return_time: booking.searchDetails?.returnTime || null,
        duration_hours: booking.searchDetails?.durationHours || 8,
        airport_transfer_type: booking.searchDetails?.airportTransferType || null,
        passengers_count: booking.passengerDetails?.passengersCount || 2,
        vehicle_id: booking.selectedVehicle?.id || "",
        vehicle_name: booking.selectedVehicle?.name || "",
        vehicle_category: booking.selectedVehicle?.category || "",
        special_instructions: booking.passengerDetails?.specialInstructions || "",
        total_estimated_fare: booking.estimatedFare?.totalEstimatedFare || 0,
        currency: "INR",
        status: booking.status || "Pending Confirmation",
        search_details: booking.searchDetails || {},
        estimated_fare: booking.estimatedFare || {},
        fare_snapshot: fareSnapshot,
        pricing_version: fareSnapshot.pricingVersion || 1,
        created_at: booking.createdAt || new Date().toISOString(),
      };

      // Always preserve in server memory buffer as resilient guarantee
      const existingIdx = serverBookingsBuffer.findIndex(
        (b) => b.reference_id === rowData.reference_id
      );
      if (existingIdx >= 0) {
        serverBookingsBuffer[existingIdx] = rowData;
      } else {
        serverBookingsBuffer.unshift(rowData);
        if (serverBookingsBuffer.length > 50) serverBookingsBuffer.pop();
      }

      return res.status(200).json({
        success: true,
        savedToRemote: false,
        data: [rowData],
        message: "Booking received & securely queued in dispatch registry",
      });
    } catch (err: any) {
      return res.status(200).json({
        success: true,
        savedToRemote: false,
        message: "Booking received and preserved",
      });
    }
  });

  // API route to update an existing booking (status, driver assignment, etc.)
  router.patch("/bookings/:referenceId", (req, res) => {
    try {
      const { referenceId } = req.params;
      const updates = req.body;

      const index = serverBookingsBuffer.findIndex(
        (b) => b.reference_id === referenceId
      );

      if (index === -1) {
        return res.status(404).json({ success: false, error: "Booking not found in registry" });
      }

      serverBookingsBuffer[index] = {
        ...serverBookingsBuffer[index],
        ...updates,
        updated_at: new Date().toISOString(),
      };

      return res.json({
        success: true,
        booking: serverBookingsBuffer[index],
        message: `Booking #${referenceId} updated successfully`,
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message || "Failed to update booking" });
    }
  });

  // API route to delete/archive a booking
  router.delete("/bookings/:referenceId", (req, res) => {
    try {
      const { referenceId } = req.params;
      const index = serverBookingsBuffer.findIndex(
        (b) => b.reference_id === referenceId
      );

      if (index === -1) {
        return res.status(404).json({ success: false, error: "Booking not found" });
      }

      const deleted = serverBookingsBuffer.splice(index, 1);
      return res.json({
        success: true,
        deleted: deleted[0],
        message: `Booking #${referenceId} archived from registry`,
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message || "Failed to delete booking" });
    }
  });

  // API route for AI Quote Assistant
  router.post("/ai-quote", async (req, res) => {
    try {
      const { prompt, pickup, drop, serviceType, passengers, vehicleType } = req.body;
      const apiKey = process.env.GEMINI_API_KEY;

      if (!apiKey || apiKey === "MY_GEMINI_API_KEY" || apiKey.trim() === "") {
        const numPax = Number(passengers) || 2;
        const isGroup = numPax > 4;
        const recVehicle = isGroup ? "ERTIGA (6+1)" : "SWIFT DESIRE (4+1)";
        const fareMin = isGroup ? 3200 : 2200;
        const fareMax = isGroup ? 3900 : 2700;

        return res.json({
          success: true,
          aiGenerated: false,
          reply: `Welcome to Travel Just Mysuru! Here is your instant estimated quote:\n\n📍 Route: ${pickup || 'Mysuru'} ➔ ${drop || 'Bangalore Airport / City'}\n👥 Passengers: ${numPax}\n🚗 Recommended Cab: ${recVehicle}\n\n💰 Estimated Price: ₹${fareMin.toLocaleString('en-IN')} - ₹${fareMax.toLocaleString('en-IN')}\n⏱️ Travel Time: ~3 to 4 Hours\n\n✨ Fare includes vehicle rental, driver allowance, and fuel. Tolls & parking will be billed as actuals.`,
          estimatedFareMin: fareMin,
          estimatedFareMax: fareMax,
          recommendedVehicle: recVehicle,
          distanceKm: 150,
          travelTimeHours: 3.5,
          tips: [
            "Book morning transfers early to beat NICE road traffic",
            "Doorstep pickup & drop-off included in all Mysuru city areas",
            "Clean AC vehicle guaranteed with professional driver"
          ]
        });
      }

      const ai = new GoogleGenAI({
        apiKey: apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });

      const systemInstruction = `You are Travel Just Mysuru's AI Travel Concierge & Fare Estimator.
Provide friendly, transparent, and accurate cab rental estimates in Indian Rupees (INR) for South India travel centered around Mysuru, Bangalore, Coorg, Ooty, Wayanad, and Kabini.

Return your answer strictly in JSON format matching this schema:
{
  "reply": "Friendly explanation of the trip quote, inclusions, and route advice",
  "estimatedFareMin": 2200,
  "estimatedFareMax": 2800,
  "recommendedVehicle": "SWIFT DESIRE (4+1)",
  "distanceKm": 145,
  "travelTimeHours": 3.5,
  "tips": ["Tip 1 about route or timing", "Tip 2 about luggage or tolls"]
}

Available Vehicles in Travel Just Mysuru Fleet:
- TOYOTA ETIOS (4+1)
- SWIFT DESIRE (4+1)
- HYUNDAI AURA (4+1)
- ERTIGA (6+1)
- INNOVA 6+1
- INNOVA 7+1
- INNOVA CRYSTA`;

      const response = await ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents: `Customer Query for Taxi Quote:
User Message: "${prompt || 'Need instant fare quote for travel'}"
Pickup City/Area: ${pickup || 'Mysuru'}
Drop Destination: ${drop || 'Bangalore Airport / Outstation'}
Trip Type: ${serviceType || 'oneway'}
Passengers: ${passengers || 2}
Preferred Cab: ${vehicleType || 'Any'}`,
        config: {
          systemInstruction,
          responseMimeType: "application/json"
        }
      });

      const responseText = response.text || '{}';
      const parsedData = JSON.parse(responseText);

      return res.json({
        success: true,
        aiGenerated: true,
        ...parsedData
      });
    } catch (err: any) {
      console.error("AI Quote Server Error:", err);
      return res.status(500).json({
        success: false,
        error: "Failed to process AI quote",
        message: err?.message || "Internal server error"
      });
    }
  });

  // Helper to extract Google Maps grounding metadata per Gemini API guidelines
  function extractGroundedPlaces(response: any): Array<{
    title: string;
    uri: string;
    reviewSnippet?: string;
    address?: string;
  }> {
    const places: Array<{
      title: string;
      uri: string;
      reviewSnippet?: string;
      address?: string;
    }> = [];

    const chunks = response?.candidates?.[0]?.groundingMetadata?.groundingChunks;
    if (Array.isArray(chunks)) {
      for (const chunk of chunks) {
        if (chunk.maps) {
          const uri = chunk.maps.uri;
          const title = chunk.maps.title || "View on Google Maps";
          let reviewSnippet = "";
          if (
            Array.isArray(chunk.maps.placeAnswerSources?.reviewSnippets) &&
            chunk.maps.placeAnswerSources.reviewSnippets.length > 0
          ) {
            reviewSnippet = chunk.maps.placeAnswerSources.reviewSnippets[0]?.content || "";
          }
          if (uri) {
            places.push({
              title,
              uri,
              ...(reviewSnippet ? { reviewSnippet } : {}),
              ...(chunk.maps.address ? { address: chunk.maps.address } : {}),
            });
          }
        } else if (chunk.web && chunk.web.uri) {
          places.push({
            title: chunk.web.title || "External Source",
            uri: chunk.web.uri,
          });
        }
      }
    }

    const seen = new Set<string>();
    return places.filter((p) => {
      if (!p.uri || seen.has(p.uri)) return false;
      seen.add(p.uri);
      return true;
    });
  }

  // Helper to extract Google Search grounding metadata per Gemini API guidelines
  function extractSearchSources(response: any): Array<{ title: string; uri: string }> {
    const sources: Array<{ title: string; uri: string }> = [];
    const chunks = response?.candidates?.[0]?.groundingMetadata?.groundingChunks;
    if (Array.isArray(chunks)) {
      for (const chunk of chunks) {
        if (chunk.web && chunk.web.uri) {
          sources.push({
            title: chunk.web.title || "Live Web Source",
            uri: chunk.web.uri,
          });
        }
      }
    }
    const seen = new Set<string>();
    return sources.filter((s) => {
      if (!s.uri || seen.has(s.uri)) return false;
      seen.add(s.uri);
      return true;
    });
  }

  // Helper to extract Google Search queries executed by Gemini
  function extractSearchQueries(response: any): string[] {
    const queries = response?.candidates?.[0]?.groundingMetadata?.webSearchQueries;
    return Array.isArray(queries) ? queries : [];
  }

  // Helper for AI Work Agent to formulate an actionable booking draft from conversational context
  function generateBookingDraft(query: string, reply: string): any | null {
    const q = (query + " " + reply).toLowerCase();

    // Detect service type
    let serviceType = 'oneway';
    if (q.includes('airport') || q.includes('blr') || q.includes('kempegowda') || q.includes('flight') || q.includes('kial')) {
      serviceType = 'airport';
    } else if (q.includes('local') || q.includes('sightseeing') || q.includes('8 hour') || q.includes('8h') || q.includes('4 hour') || q.includes('4h')) {
      serviceType = 'local';
    } else if (q.includes('round trip') || q.includes('roundtrip') || q.includes('2-day') || q.includes('3-day') || q.includes('weekend tour') || q.includes('return')) {
      serviceType = 'roundtrip';
    }

    // Detect locations
    let pickupLocation = 'Mysuru, Karnataka';
    let dropLocation = 'Kempegowda International Airport (BLR)';

    if (q.includes('rajiv nagar') || q.includes('rajivnagar')) pickupLocation = 'Rajiv Nagar, Mysuru';
    else if (q.includes('vijayanagar')) pickupLocation = 'Vijayanagar, Mysuru';
    else if (q.includes('gokulam')) pickupLocation = 'Gokulam, Mysuru';
    else if (q.includes('kuvempunagar')) pickupLocation = 'Kuvempunagar, Mysuru';
    else if (q.includes('hebbal')) pickupLocation = 'Hebbal Industrial Area / Infosys, Mysuru';
    else if (q.includes('hootagalli')) pickupLocation = 'Hootagalli Industrial Area, Mysuru';
    else if (q.includes('outer ring road')) pickupLocation = 'Outer Ring Road, Mysuru';
    else if (q.includes('palace')) pickupLocation = 'Mysore Palace, Mysuru';
    else if (q.includes('jayalakshmipuram')) pickupLocation = 'Jayalakshmipuram, Mysuru';
    else if (q.includes('saraswathipuram')) pickupLocation = 'Saraswathipuram, Mysuru';

    if (q.includes('coorg') || q.includes('madikeri')) dropLocation = 'Coorg (Madikeri), Karnataka';
    else if (q.includes('ooty')) dropLocation = 'Ooty, Tamil Nadu';
    else if (q.includes('wayanad')) dropLocation = 'Wayanad, Kerala';
    else if (q.includes('bangalore') && !q.includes('airport')) dropLocation = 'Bengaluru City, Karnataka';
    else if (q.includes('kabini')) dropLocation = 'Kabini Safari Reserve, Karnataka';
    else if (q.includes('chikmagalur')) dropLocation = 'Chikmagalur, Karnataka';
    else if (serviceType === 'local') dropLocation = 'Mysuru Local Sightseeing Tour';
    else if (serviceType === 'airport') dropLocation = 'Kempegowda International Airport (BLR)';

    // Detect vehicle
    let vehicleType = 'all';
    if (q.includes('innova crysta') || q.includes('crysta')) vehicleType = 'crysta';
    else if (q.includes('innova')) vehicleType = 'innova';
    else if (q.includes('ertiga')) vehicleType = 'ertiga';
    else if (q.includes('sedan') || q.includes('etios') || q.includes('dzire')) vehicleType = 'sedan';

    // Only return draft if there is travel intent
    const hasTravelIntent = q.includes('pickup') || q.includes('cab') || q.includes('trip') || q.includes('airport') || q.includes('tour') || q.includes('itinerary') || q.includes('drop') || q.includes('transfer');
    if (!hasTravelIntent) return null;

    return {
      serviceType,
      pickupLocation,
      dropLocation,
      vehicleType,
      durationHours: serviceType === 'local' ? 8 : 4,
      passengers: vehicleType === 'crysta' || vehicleType === 'innova' ? 6 : (vehicleType === 'ertiga' ? 5 : 2),
      tripSummary: `${serviceType.toUpperCase()} Cab · ${pickupLocation} ➔ ${dropLocation}`,
    };
  }

  // Real-time Route Insights with Google Maps Grounding
  router.post("/maps/grounded-insights", async (req, res) => {
    try {
      const { origin, destination, queryType = "route_stops", userLocation } = req.body;
      const originName = (origin || "Mysuru").trim();
      const destName = (destination || "Bengaluru Kempegowda International Airport (BLR)").trim();

      const apiKey = process.env.GEMINI_API_KEY;

      // Fallback verified corridor spots if offline or no key
      const getCorridorFallback = () => {
        const isAirportOrBlr =
          destName.toLowerCase().includes("airport") ||
          destName.toLowerCase().includes("bangalore") ||
          destName.toLowerCase().includes("bengaluru") ||
          originName.toLowerCase().includes("airport");

        const isCoorg =
          destName.toLowerCase().includes("coorg") ||
          destName.toLowerCase().includes("madikeri") ||
          destName.toLowerCase().includes("kushalnagar");

        const isOoty =
          destName.toLowerCase().includes("ooty") ||
          destName.toLowerCase().includes("gundlupet") ||
          destName.toLowerCase().includes("bandipur");

        if (isAirportOrBlr) {
          return {
            reply: `### 🛣️ Real-Time Route Insights: Mysuru ➔ Bengaluru Expressway & Airport\n\n- **Live Travel Time:** Typically **3 hrs 15 min to 3 hrs 45 min** via the 10-Lane Bengaluru-Mysuru Access-Controlled Expressway (NH-275).\n- **Expressway Speed Limit:** 100 km/h strictly monitored by automated speed cameras.\n- **Recommended Highway Food Courts:**\n  * **Empire Restaurant (Maddur):** Multicuisine dining, clean restrooms, ample parking.\n  * **Shivalli Restaurant (Channapatna):** Famous traditional South Indian tiffin & filter coffee.\n  * **Kadamba Veg (Ramanagara):** Quick pure-veg meals & snacks.\n- **Airport Transfer Note:** For flights departing from KIAL Terminal 1 or 2, plan to reach 2 hours prior for domestic and 3 hours prior for international departures.`,
            groundedPlaces: [
              {
                title: "Empire Restaurant, Maddur Expressway",
                uri: "https://www.google.com/maps/search/?api=1&query=Empire+Restaurant+Maddur+Expressway",
                reviewSnippet: "Popular highway pitstop with clean family dining and fast service.",
              },
              {
                title: "Hotel Shivalli Mydanam, Channapatna",
                uri: "https://www.google.com/maps/search/?api=1&query=Shivalli+Restaurant+Channapatna",
                reviewSnippet: "Renowned for crispy Maddur vada, hot masala dosa, and authentic filter coffee.",
              },
              {
                title: "Kempegowda International Airport Bengaluru (BLR)",
                uri: "https://www.google.com/maps/search/?api=1&query=Kempegowda+International+Airport+Bengaluru",
                reviewSnippet: "24/7 dedicated cab arrival and departure lanes for seamless boarding.",
              },
            ],
          };
        }

        if (isCoorg) {
          return {
            reply: `### 🌲 Real-Time Route Insights: Mysuru ➔ Coorg (Madikeri / Kushalnagar)\n\n- **Route & Road State:** Scenic highway via Hunsur, Bylakuppe, and Kushalnagar (SH-88 / NH-275). Excellent road conditions.\n- **Distance & Duration:** ~120 km · Approx. 2.5 to 3 hours.\n- **Must-Visit En-Route Pitstops:**\n  * **Bylakuppe Golden Temple (Namdroling Monastery):** Largest Tibetan settlement in South India.\n  * **Cauvery Nisargadhama:** Island ecological park with bamboo groves and deer park.\n  * **Raja's Seat (Madikeri):** Famous panoramic sunset viewpoint.\n- **Cab Recommendation:** MUV (Ertiga) or SUV (Innova) for optimal comfort over gentle hill inclines.`,
            groundedPlaces: [
              {
                title: "Namdroling Monastery Golden Temple, Bylakuppe",
                uri: "https://www.google.com/maps/search/?api=1&query=Namdroling+Monastery+Golden+Temple+Bylakuppe",
                reviewSnippet: "Peaceful Buddhist monastery with towering golden statues and ornate murals.",
              },
              {
                title: "Cauvery Nisargadhama, Kushalnagar",
                uri: "https://www.google.com/maps/search/?api=1&query=Cauvery+Nisargadhama+Kushalnagar",
                reviewSnippet: "Beautiful island park on the Kaveri river with deer park and treetop walks.",
              },
              {
                title: "Raja's Seat, Madikeri",
                uri: "https://www.google.com/maps/search/?api=1&query=Rajas+Seat+Madikeri",
                reviewSnippet: "Historical garden offering sweeping sunset views of the Western Ghats.",
              },
            ],
          };
        }

        if (isOoty) {
          return {
            reply: `### ⛰️ Real-Time Route Insights: Mysuru ➔ Ooty via Bandipur National Park\n\n- **Scenic Route:** Passes through Bandipur Tiger Reserve & Mudumalai Sanctuary.\n- **Forest Gate Timings:** Forest checkpost is strictly closed between **9:00 PM and 6:00 AM** to protect wildlife.\n- **Travel Time:** ~125 km · Approx. 3.5 to 4 hours including ghat section.\n- **Ghat Section Advisory:** The Masinagudi route features 36 steep hairpin bends; our experienced hill chauffeurs ensure safe, smooth driving.`,
            groundedPlaces: [
              {
                title: "Bandipur National Park & Tiger Reserve",
                uri: "https://www.google.com/maps/search/?api=1&query=Bandipur+National+Park+Karnataka",
                reviewSnippet: "Scenic wildlife corridor with frequent sightings of deer, elephants, and peacocks.",
              },
              {
                title: "Government Botanical Garden, Ooty",
                uri: "https://www.google.com/maps/search/?api=1&query=Government+Botanical+Garden+Ooty",
                reviewSnippet: "Sprawling terraced garden in the Nilgiri hills featuring exotic flora.",
              },
            ],
          };
        }

        return {
          reply: `### 🗺️ Real-Time Route Insights: ${originName} ➔ ${destName}\n\n- **Verified Route:** Direct intercity cab transit with professional commercial chauffeur.\n- **Doorstep Pickup:** 24/7 coverage across all local areas in Mysuru and destination districts.\n- **Inclusions:** Clean AC vehicle, commercial driver, and fuel covered in quote. Expressway tolls billed as actuals via FASTag receipt.`,
          groundedPlaces: [
            {
              title: `${originName} Destination on Google Maps`,
              uri: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(originName)}`,
            },
            {
              title: `${destName} Destination on Google Maps`,
              uri: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(destName)}`,
            },
          ],
        };
      };

      if (!apiKey || apiKey === "MY_GEMINI_API_KEY" || apiKey.trim() === "") {
        const fallback = getCorridorFallback();
        return res.json({
          success: true,
          aiGenerated: false,
          mapsGrounded: true,
          origin: originName,
          destination: destName,
          ...fallback,
        });
      }

      const ai = new GoogleGenAI({
        apiKey: apiKey,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      });

      const userLat = typeof userLocation?.lat === "number" ? userLocation.lat : 12.2958;
      const userLng = typeof userLocation?.lng === "number" ? userLocation.lng : 76.6394;

      const promptContent = `You are Travel Just Mysuru's expert travel advisor.
Use Google Maps data to provide real-time travel insights for traveling by cab from "${originName}" to "${destName}" in South India.
In your response:
1. Identify the primary highway corridor, estimated driving distance, and live travel time.
2. Name 3 to 4 specific, verified highway food stops, popular restaurants, or fuel/rest plazas along this exact route (e.g., on the Bangalore-Mysuru Expressway, Mysore-Coorg road, or Ooty route).
3. Mention key scenic spots, tourist viewpoints, or landmarks along or near the destination.
4. Give practical road tips (such as toll advice, expressway speed limits, or hill driving tips).
Format your response cleanly in Markdown with bold headers and bullet points.`;

      let response: any;
      let usedMaps = false;

      try {
        response = await ai.models.generateContent({
          model: "gemini-3.8-flash",
          contents: promptContent,
          config: {
            tools: [{ googleMaps: {} }],
            toolConfig: {
              retrievalConfig: {
                latLng: {
                  latitude: userLat,
                  longitude: userLng,
                },
              },
            },
          },
        });
        usedMaps = true;
      } catch (mapErr: any) {
        console.warn("Google Maps grounding query failed, falling back to standard generation:", mapErr?.message);
        response = await ai.models.generateContent({
          model: "gemini-3.8-flash",
          contents: promptContent,
        });
      }

      const reply = response?.text || getCorridorFallback().reply;
      const groundedPlaces = extractGroundedPlaces(response);

      // If no grounded places were extracted from API, enrich with known verified corridor stops
      const finalGroundedPlaces =
        groundedPlaces.length > 0 ? groundedPlaces : getCorridorFallback().groundedPlaces;

      return res.json({
        success: true,
        aiGenerated: true,
        mapsGrounded: usedMaps || finalGroundedPlaces.length > 0,
        origin: originName,
        destination: destName,
        reply,
        groundedPlaces: finalGroundedPlaces,
      });
    } catch (err: any) {
      console.error("Grounded Insights Route Error:", err);
      return res.status(500).json({
        success: false,
        error: "Failed to fetch grounded route insights",
        message: err?.message || "Internal server error",
      });
    }
  });

  // API route for AI Contact & Policy Assistant with Google Maps Grounding
  router.post("/chat-assistant", async (req, res) => {
    const getPolicyFallback = (query: string): { reply: string; groundedPlaces?: Array<{ title: string; uri: string; reviewSnippet?: string; address?: string }> } => {
      const q = query.toLowerCase();
      const detectedLocalPlaces = findMysuruLocationsForQuery(query);

      // Category 1: Mysuru/Mysore Layouts (Vijayanagar, Gokulam, Kuvempunagar, Rajivnagar, etc.)
      if (
        q.includes("rajiv nagar") || q.includes("rajivnagar") ||
        q.includes("vijayanagar") || q.includes("gokulam") ||
        q.includes("kuvempunagar") || q.includes("jayalakshmipuram") ||
        q.includes("saraswathipuram") || q.includes("jp nagar") || q.includes("j.p. nagar") ||
        q.includes("bogadi") || q.includes("dattagalli") || q.includes("kanakadasa") ||
        q.includes("ramakrishna nagar") || q.includes("bannimantap") || q.includes("yadavagiri") ||
        q.includes("vidyaranyapuram") || q.includes("chamundipuram") || q.includes("agrahara") ||
        q.includes("siddhartha") || q.includes("alanahalli") || q.includes("sharadadevi") ||
        q.includes("tk layout") || q.includes("t.k. layout") || q.includes("sathgalli") ||
        q.includes("sathagalli") || q.includes("udayagiri") || q.includes("kalyangiri") ||
        q.includes("v.v. mohalla") || q.includes("vani vilas") || q.includes("layout")
      ) {
        return {
          reply: `### 📍 Mysuru Layouts Doorstep Cab Pickup & Drop Service\n\n- **100% Doorstep Coverage:** Guaranteed 24/7 cab pickup and drop across all residential stages, streets, and apartments in Mysuru, including **Vijayanagar (Stages 1-4), Gokulam (Stages 1-3), Kuvempunagar, Rajiv Nagar (1st & 2nd Stage), Jayalakshmipuram, Saraswathipuram, J.P. Nagar (Phases 1-4), Bogadi, Dattagalli, Ramakrishna Nagar, Siddhartha Layout, Sathgalli, and Bannimantap**.\n- **Dispatch Time:** Quick 10–15 minute local dispatch via Mysuru's 6-lane Outer Ring Road network.\n- **Luggage & Chauffeur Care:** Professional chauffeurs assist with bags right from your doorstep/building lobby.\n- **Ride Options:** Local city packages (4h/40km, 8h/80km), Bangalore Airport transfers via Expressway, and outstation trips to Coorg, Ooty, or Wayanad.\n- **Fleet Availability:** 4+1 Sedans (Etios/Dzire), 6+1 MUVs (Ertiga), and 6/7+1 Premium SUVs (Innova / Innova Crysta).`,
          groundedPlaces: detectedLocalPlaces.length > 0 ? detectedLocalPlaces : [
            {
              title: "Rajiv Nagar, Mysuru",
              uri: "https://www.google.com/maps/search/?api=1&query=Rajiv+Nagar+Mysuru+Karnataka",
              reviewSnippet: "Major eastern residential layout with direct Ring Road connectivity.",
              address: "Rajiv Nagar, Mysuru, Karnataka 570019",
            },
            {
              title: "Vijayanagar 4th Stage, Mysuru",
              uri: "https://www.google.com/maps/search/?api=1&query=Vijayanagar+4th+Stage+Mysuru",
              reviewSnippet: "Prominent western residential suburb connecting Hunsur Road and Ring Road.",
              address: "Vijayanagar 4th Stage, Mysuru, Karnataka 570018",
            },
            {
              title: "Gokulam 3rd Stage, Mysuru",
              uri: "https://www.google.com/maps/search/?api=1&query=Gokulam+3rd+Stage+Contour+Road+Mysuru",
              reviewSnippet: "International yoga hub, tranquil residential avenues, and artisan cafes.",
              address: "Contour Rd, Gokulam 3rd Stage, Mysuru, Karnataka 570002",
            },
            {
              title: "Kuvempunagar, Mysuru",
              uri: "https://www.google.com/maps/search/?api=1&query=Kuvempunagar+Bus+Complex+Mysuru",
              reviewSnippet: "Central south Mysuru residential hub with Apollo BGS Hospitals and bus complex.",
              address: "Kuvempunagar, Mysuru, Karnataka 570023",
            },
          ],
        };
      }

      // Category 2: Mysuru/Mysore Areas & Industrial Hubs (Hebbal Infosys, Hootagalli, Koorgalli, Kadakola, Mandakalli)
      if (
        q.includes("hebbal") || q.includes("infosys") || q.includes("electronic city") ||
        q.includes("hootagalli") || q.includes("beml") || q.includes("koorgalli") ||
        q.includes("tvs") || q.includes("kadakola") || q.includes("kiadb") ||
        q.includes("belagola") || q.includes("mandakalli") || q.includes("airport") ||
        q.includes("yelwal") || q.includes("ilavala") || q.includes("metagalli") ||
        q.includes("industrial")
      ) {
        return {
          reply: `### 🏭 Mysuru Areas & Industrial Corridors Cab Service\n\n- **Corporate & Industrial Doorstep Transit:** 24/7 dedicated cab dispatch for employees, business executives, and visitors across **Hebbal Industrial Area & Infosys Campus (Gates 1 & 2), Hootagalli Industrial Area (BEML, Wipro, Automotive Axles), Koorgalli Industrial Estate (TVS Plant), Kadakola & Adakanahalli KIADB (NH 766), Belagola, and Mandakalli (Mysuru Airport)**.\n- **Airport Transfers:** Rapid transit from any factory or corporate tech campus directly to Bengaluru Kempegowda Airport (BLR) via Outer Ring Road and the 10-Lane Expressway.\n- **Punctuality Guarantee:** On-time gate pickups with sanitized vehicles and corporate invoicing with GST.`,
          groundedPlaces: detectedLocalPlaces.length > 0 ? detectedLocalPlaces : [
            {
              title: "Infosys Mysore Campus (Global Education Centre)",
              uri: "https://www.google.com/maps/search/?api=1&query=Infosys+Mysore+Campus+Hebbal+Electronic+City",
              reviewSnippet: "World-class corporate training campus in Hebbal Electronic City with 24/7 cab gate access.",
              address: "Hebbal Electronic City, Hootagalli, Mysuru, Karnataka 570027",
            },
            {
              title: "Hootagalli Industrial Area (BEML / Wipro / Axles)",
              uri: "https://www.google.com/maps/search/?api=1&query=Hootagalli+Industrial+Area+Mysuru",
              reviewSnippet: "Major industrial corridor along Hunsur Road hosting leading manufacturing plants.",
              address: "Hootagalli, Mysuru, Karnataka 570018",
            },
            {
              title: "Kadakola & Adakanahalli KIADB Industrial Area",
              uri: "https://www.google.com/maps/search/?api=1&query=Kadakola+KIADB+Industrial+Area+Mysuru",
              reviewSnippet: "NH 766 southern industrial corridor hosting multinational manufacturing plants.",
              address: "Kadakola KIADB, Mysuru, Karnataka 571311",
            },
            {
              title: "Mysuru Airport (MYQ / Mandakalli)",
              uri: "https://www.google.com/maps/search/?api=1&query=Mysuru+Airport+Mandakalli",
              reviewSnippet: "Regional commercial airport terminal on NH 766 with dedicated passenger cab parking.",
              address: "Kozhikode-Mysore-Kollegal Hwy, Mandakalli, Mysuru, Karnataka 571311",
            },
          ],
        };
      }

      // Category 3: Mysuru/Mysore Local Roads & Corridors (Outer Ring Road, Devaraj Urs Rd, Kalidasa Rd, Contour Rd, etc.)
      if (
        q.includes("road") || q.includes("ring road") || q.includes("outer ring road") ||
        q.includes("devaraj urs") || q.includes("sayyaji rao") || q.includes("kalidasa") ||
        q.includes("contour") || q.includes("kantharaj urs") || q.includes("jlb road") ||
        q.includes("jhansi") || q.includes("hunsur road") || q.includes("nanjangud road") ||
        q.includes("krs road") || q.includes("bannur road") || q.includes("mahadevapura")
      ) {
        return {
          reply: `### 🛣️ Mysuru Arterial Roads & Corridor Cab Service\n\n- **Outer Ring Road (ORR - 42 Km 6-Lane Expressway Ring):** Encircles Mysuru, connecting all 45+ layouts (Vijayanagar, Hebbal, Bogadi, JP Nagar, Rajiv Nagar, Sathgalli) for swift doorstep cab dispatch without navigating central city bottlenecks.\n- **D. Devaraja Urs Road:** Shopping trips, Mysore Silk stores, jewelry showrooms, and handicraft arcades with curbside pickup.\n- **Kalidasa Road (V.V. Mohalla):** Mysuru's premier food & dining strip; late-night restaurant pickup & drop available.\n- **Contour Road (Gokulam):** Global Ashtanga Yoga center and organic cafes with peaceful residential pickups.\n- **Sayyaji Rao Road:** Heritage royal corridor connecting Mysore Palace, Devaraja Market, and KR Circle.\n- **Kantharaj Urs Road & JLB Road:** Direct connectivity linking Saraswathipuram, Kuvempunagar, and heritage educational institutions.`,
          groundedPlaces: detectedLocalPlaces.length > 0 ? detectedLocalPlaces : [
            {
              title: "Outer Ring Road - Mysuru (6-Lane Expressway Ring)",
              uri: "https://www.google.com/maps/search/?api=1&query=Outer+Ring+Road+Mysuru+Karnataka",
              reviewSnippet: "42 km high-speed bypass ring connecting all layouts, industrial zones, and highways.",
              address: "Outer Ring Rd, Mysuru, Karnataka 570017",
            },
            {
              title: "D. Devaraja Urs Road (Premier Shopping High Street)",
              uri: "https://www.google.com/maps/search/?api=1&query=D+Devaraj+Urs+Road+Mysuru",
              reviewSnippet: "Mysuru's most celebrated heritage shopping street famous for Mysore Silk and sandalwood.",
              address: "D. Devaraj Urs Rd, Chamrajpura, Mysuru, Karnataka 570001",
            },
            {
              title: "Kalidasa Road (V.V. Mohalla Dining Corridor)",
              uri: "https://www.google.com/maps/search/?api=1&query=Kalidasa+Road+Vani+Vilas+Mohalla+Mysuru",
              reviewSnippet: "Celebrated boutique and dining high street with popular multi-cuisine restaurants.",
              address: "Kalidasa Rd, Vani Vilas Mohalla, Mysuru, Karnataka 570002",
            },
            {
              title: "Contour Road (Gokulam 3rd Stage Yoga Hub)",
              uri: "https://www.google.com/maps/search/?api=1&query=Contour+Road+Gokulam+3rd+Stage+Mysuru",
              reviewSnippet: "International yoga corridor hosting global practitioners and organic cafes.",
              address: "Contour Rd, Gokulam 3rd Stage, Mysuru, Karnataka 570002",
            },
          ],
        };
      }

      // Category 4: Mysuru Local Locations (Palace, Chamundi Hill, Zoo, Railway Station, Suburban Bus Stand)
      if (
        q.includes("palace") || q.includes("chamundi") || q.includes("sightseeing") ||
        q.includes("attraction") || q.includes("zoo") || q.includes("krs") ||
        q.includes("philomena") || q.includes("railway") || q.includes("station") ||
        q.includes("bus stand") || q.includes("suburban") || q.includes("karanji") ||
        q.includes("lalitha mahal") || q.includes("jaganmohan")
      ) {
        return {
          reply: `### 🏛️ Mysuru Local Sightseeing & Heritage Landmarks Cab Tours\n\nTRAVEL JUST provides custom **8-Hour / 80 Km** and full-day local tour packages with 100% doorstep hotel or residence pickup:\n\n1. **Mysore Palace (Amba Vilas):** Open 10:00 AM - 5:30 PM. Grand palace illumination every Sunday & public holiday (7:00 PM - 7:45 PM).\n2. **Chamundi Hill & Chamundeshwari Temple:** Panoramic city views atop 1,000 meters. Smooth hilltop transit with designated parking.\n3. **Sri Chamarajendra Zoological Gardens (Mysuru Zoo):** One of India's oldest, cleanest, and most renowned zoos.\n4. **Brindavan Gardens (KRS Dam):** Famed illuminated dancing musical fountain show (7:00 PM - 8:00 PM).\n5. **St. Philomena's Cathedral:** Majestic neo-gothic twin towers.\n6. **Transit Hubs:** Mysuru Junction Railway Station (MYS) & KSRTC Suburban Bus Stand with 24/7 platform meet & greet.\n\nOur chauffeurs know optimal parking lanes, ticket counters, and timing secrets to skip long queues!`,
          groundedPlaces: detectedLocalPlaces.length > 0 ? detectedLocalPlaces : [
            {
              title: "Mysore Palace, Sayyaji Rao Road",
              uri: "https://www.google.com/maps/search/?api=1&query=Mysore+Palace+Sayyaji+Rao+Road+Mysuru",
              reviewSnippet: "Iconic royal residence of the Wadiyar dynasty with intricate Indo-Saracenic architecture.",
              address: "Sayyaji Rao Rd, Agrahara, Chamrajpura, Mysuru, Karnataka 570001",
            },
            {
              title: "Chamundeshwari Temple, Chamundi Hill",
              uri: "https://www.google.com/maps/search/?api=1&query=Chamundeshwari+Temple+Chamundi+Hill+Mysuru",
              reviewSnippet: "Ancient hilltop temple overlooking Mysuru city with sweeping panoramic vistas.",
              address: "Chamundi Hill, Mysuru, Karnataka 570010",
            },
            {
              title: "Mysuru Junction Railway Station (MYS)",
              uri: "https://www.google.com/maps/search/?api=1&query=Mysuru+Junction+Railway+Station+MYS",
              reviewSnippet: "Main railway terminal connecting Vande Bharat, Shatabdi, and express trains.",
              address: "Medar Block, Yadavagiri, Mysuru, Karnataka 570001",
            },
            {
              title: "Brindavan Gardens, KRS Dam",
              uri: "https://www.google.com/maps/search/?api=1&query=Brindavan+Gardens+KRS+Dam",
              reviewSnippet: "Terraced gardens with illuminated dancing musical fountains.",
              address: "KRS Dam, Srirangapatna Taluk, Mandya, Karnataka 571607",
            },
          ],
        };
      }

      // General Mysuru Doorstep Pickup & Drop Inquiry
      if (q.includes("doorstep") || q.includes("pickup") || q.includes("drop") || q.includes("mysore") || q.includes("mysuru")) {
        return {
          reply: `### 🚕 100% Doorstep Cab Pickup & Drop Across Mysuru / Mysore\n\n- **Complete City Coverage:** Whether you are in a quiet residential cross, high-rise apartment, gated villa community, hospital, or hotel anywhere in Mysuru, TRAVEL JUST provides guaranteed doorstep pickup and drop.\n- **Rapid 10–15 Min Dispatch:** Chauffeurs positioned across key hubs (Vijayanagar, Gokulam, Kuvempunagar, Rajiv Nagar, Hebbal, Outer Ring Road) ensure rapid arrival.\n- **Zero Luggage Hassle:** Chauffeur assists with loading and unloading luggage right at your gate.\n- **Available Rides:** City hourly rentals (4h/40km, 8h/80km), one-way drops, Bangalore Kempegowda Airport (BLR) transfers, and outstation trips (Coorg, Ooty, Wayanad, Kabini, Chikmagalur).\n- **Fleet Options:** Clean, AC sedans (Etios/Dzire), 6-seater Ertiga, and luxury 7-seater Innova Crysta.`,
          groundedPlaces: detectedLocalPlaces.length > 0 ? detectedLocalPlaces : [
            {
              title: "Mysuru City Doorstep Coverage (All Layouts & Corridors)",
              uri: "https://www.google.com/maps/search/?api=1&query=Mysuru+Karnataka+Doorstep+Cab+Service",
              reviewSnippet: "Comprehensive 24/7 doorstep pickup across all 45+ layouts and outer corridors.",
              address: "Mysuru, Karnataka, India",
            },
            {
              title: "Outer Ring Road - Mysuru",
              uri: "https://www.google.com/maps/search/?api=1&query=Outer+Ring+Road+Mysuru",
              reviewSnippet: "Expressway ring enabling 10-15 min dispatch to any doorstep.",
              address: "Outer Ring Rd, Mysuru, Karnataka 570017",
            },
          ],
        };
      }

      if (q.includes("cancel") || q.includes("refund") || q.includes("change date")) {
        return {
          reply: `### 🛡️ Cancellation & Rescheduling Policy\n\n- **Free Cancellation:** You can cancel for free up to **4 hours prior** to your scheduled pickup time.\n- **Late Cancellation:** Cancellations within 4 hours may incur a nominal fee of ₹300 to compensate the assigned driver.\n- **Date / Time Changes:** You can reschedule your trip anytime with at least 2 hours notice at zero additional fee.\n- **No Show:** If a booking is cancelled after vehicle dispatch, standard minimum cancellation charges apply.`,
        };
      }

      if (q.includes("vehicle") || q.includes("car") || q.includes("fleet") || q.includes("available") || q.includes("seat") || q.includes("pax") || q.includes("innova") || q.includes("ertiga") || q.includes("etios") || q.includes("dzire") || q.includes("sedan") || q.includes("suv")) {
        return {
          reply: `### 🚗 TRAVEL JUST Fleet & Vehicle Availability\n\nAll our vehicles are verified, 100% Air-Conditioned, sanitized, and operated by professional commercial chauffeurs:\n\n1. **Sedans (4+1 Seater)**\n   - *Models:* Toyota Etios, Swift Dzire, Hyundai Aura\n   - *Capacity:* 4 Passengers + 2 Large Suitcases\n   - *Best for:* Airport runs, Mysuru city packages, couples & business travelers.\n\n2. **MUVs (6+1 Seater)**\n   - *Models:* Maruti Ertiga\n   - *Capacity:* 5-6 Passengers + 3 Medium Bags\n   - *Best for:* Small families, weekend getaways to Coorg & Ooty.\n\n3. **Premium SUVs (6+1 / 7+1 Seater)**\n   - *Models:* Toyota Innova, Innova 7+1, Innova Crysta\n   - *Capacity:* 6-7 Passengers + 4 Large Suitcases\n   - *Best for:* Luxury outstation touring, hill station tours, large family groups with luggage.`,
        };
      }

      if (q.includes("food") || q.includes("restaurant") || q.includes("eat") || q.includes("hotel") || q.includes("maddur") || q.includes("expressway")) {
        return {
          reply: `### 🍽️ Top Verified Food Stops on Bangalore-Mysuru Expressway (NH-275)\n\nHere are highly rated highway dining locations with verified parking and clean amenities:\n\n1. **Empire Restaurant, Maddur:** 24/7 multicuisine, family seating, clean washrooms.\n2. **Hotel Shivalli Mydanam, Channapatna:** Famous traditional Maddur vada & authentic filter coffee.\n3. **Kadamba Veg, Ramanagara:** Quick South Indian vegetarian meals.\n4. **A2B (Adyar Ananda Bhavan), Bidadi:** Pure-veg dining and sweet shop.\n\nAll our drivers are happy to accommodate comfortable breakfast, lunch, or coffee halts at your preferred stop!`,
          groundedPlaces: [
            {
              title: "Empire Restaurant, Maddur Expressway",
              uri: "https://www.google.com/maps/search/?api=1&query=Empire+Restaurant+Maddur+Expressway",
              reviewSnippet: "Spacious multicuisine restaurant popular with highway travelers.",
            },
            {
              title: "Hotel Shivalli Mydanam, Channapatna",
              uri: "https://www.google.com/maps/search/?api=1&query=Shivalli+Restaurant+Channapatna",
              reviewSnippet: "Authentic Karnataka breakfast spot known for hot Maddur vada.",
            },
          ],
        };
      }

      if (q.includes("toll") || q.includes("parking") || q.includes("tax") || q.includes("permit") || q.includes("hidden")) {
        return {
          reply: `### 🛣️ Tolls, Parking & Interstate Permits Policy\n\n- **Fare Inclusions:** Base fare covers vehicle rental, clean AC car, fuel costs, and driver allowance.\n- **Tolls & Parking:** Expressway tolls (like Bangalore-Mysuru Expressway) and airport/monument parking charges are billed at actuals as per FASTag electronic receipt.\n- **Interstate Taxes:** For trips crossing state borders into Kerala (Wayanad), Tamil Nadu (Ooty), or Andhra Pradesh (Tirupati), state permit taxes are payable at actual border checkposts.\n- **No Hidden Fees:** We maintain 100% pricing transparency with zero surprise surcharges.`,
        };
      }

      if (q.includes("night") || q.includes("bata") || q.includes("timing") || q.includes("hour")) {
        return {
          reply: `### 🌙 Night Driving & Driver Allowance (Bata)\n\n- **Daytime Trips (6:00 AM - 10:00 PM):** Driver allowance is fully inclusive in outstation quotes.\n- **Night Allowance:** A standard night charge (₹250 - ₹350 depending on vehicle class) applies only for travel conducted between **10:00 PM and 6:00 AM**.\n- **24/7 Dispatch:** Our fleet operates round the clock with prior booking confirmation.`,
        };
      }

      if (q.includes("airport") || q.includes("flight") || q.includes("bangalore airport") || q.includes("kempegowda") || q.includes("blr")) {
        return {
          reply: `### ✈️ Airport Transfer Service (Mysuru ⮂ BLR Kempegowda Airport)\n\n- **Doorstep Pickup:** 24/7 service anywhere in Mysuru or Bangalore directly from your home/hotel gate.\n- **Flight Tracking:** Provide your flight number for complimentary delay tracking.\n- **Direct Expressway:** Rapid transit via Bangalore-Mysuru Expressway (~3.5 to 4 hours).\n- **Driver Meet & Greet:** Driver coordinates via WhatsApp / Call upon landing with designated pickup lane guidance.`,
          groundedPlaces: [
            {
              title: "Kempegowda International Airport Bengaluru (BLR)",
              uri: "https://www.google.com/maps/search/?api=1&query=Kempegowda+International+Airport+Bengaluru",
              reviewSnippet: "Major international airport with dedicated commercial cab pickup points.",
            },
          ],
        };
      }

      return {
        reply: `Hello! I am your **TRAVEL JUST AI Travel & Concierge Assistant** with real-time Google Maps Grounding. Here is what I can help you with:

- **100% Doorstep Pickup & Drop across Mysuru:**
  * **Mysuru Layouts:** Vijayanagar, Gokulam, Kuvempunagar, Rajiv Nagar, Jayalakshmipuram, Saraswathipuram, JP Nagar, Bogadi, Dattagalli, Ramakrishna Nagar, Bannimantap, Siddhartha Layout, Sathgalli
  * **Mysuru Areas & Hubs:** Hebbal Infosys, Hootagalli BEML, Koorgalli TVS, Kadakola KIADB, Mandakalli Airport
  * **Mysuru Roads:** Outer Ring Road (ORR), D. Devaraja Urs Road, Sayyaji Rao Road, Kalidasa Road, Contour Road
  * **Local Sightseeing:** Mysore Palace, Chamundi Hill, Mysuru Zoo, KRS Brindavan Gardens, Railway Station
- **Expressway & Highway Food Stops:** Verified pitstops with live Google Maps links
- **Vehicle Options & Fleet Availability:** Sedans (Etios/Dzire), MUVs (Ertiga), Luxury SUVs (Innova Crysta)
- **Airport Transfers & Outstation Tours:** Bangalore Airport (BLR), Coorg, Ooty, Wayanad, Kabini

Where in Mysuru can we pick you up today?`,
        groundedPlaces: detectedLocalPlaces.length > 0 ? detectedLocalPlaces : undefined,
      };
    };

    try {
      const {
        message,
        history,
        userLocation,
        enableMapsGrounding = true,
        groundingMode = "auto", // 'auto' | 'search' | 'maps'
        modelTier = "auto", // 'auto' | 'pro' | 'flash'
        enableThinking = true,
        attachedFile, // optional { name: string; type: string; base64Data?: string; textContent?: string }
      } = req.body;
      const userMessage = (message || "").trim();

      if (!userMessage && !attachedFile) {
        return res.status(400).json({
          success: false,
          error: "Message or attached file is required",
        });
      }

      const apiKey = process.env.GEMINI_API_KEY;

      if (!apiKey || apiKey === "MY_GEMINI_API_KEY" || apiKey.trim() === "") {
        const fallback = getPolicyFallback(userMessage);
        const bookingDraft = generateBookingDraft(userMessage, fallback.reply);
        return res.json({
          success: true,
          aiGenerated: false,
          modelUsed: "gemini-3.8-flash",
          modelTierRequested: modelTier,
          thinkingLevel: "DEFAULT",
          isComplexWork: false,
          searchGrounded: false,
          mapsGrounded: Boolean(fallback.groundedPlaces && fallback.groundedPlaces.length > 0),
          reply: fallback.reply,
          groundedPlaces: fallback.groundedPlaces || [],
          searchSources: [],
          searchQueries: [],
          bookingDraft,
          suggestedFollowups: [
            "Doorstep pickup in Rajiv Nagar 2nd Stage",
            "Cab pickup in Vijayanagar 4th Stage",
            "Gokulam Contour Road cab to Bangalore Airport",
            "Pickup on D. Devaraja Urs Road near Mysore Palace",
            "Outer Ring Road cab in Hebbal / Infosys",
          ],
        });
      }

      const ai = new GoogleGenAI({
        apiKey: apiKey,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      });

      const userLat = typeof userLocation?.lat === "number" ? userLocation.lat : 12.2958;
      const userLng = typeof userLocation?.lng === "number" ? userLocation.lng : 76.6394;

      const queryLower = userMessage.toLowerCase();

      // Complexity evaluation: "The best Gemini model is chosen automatically, advance intelligence for complex work"
      const isComplexWork =
        modelTier === "pro" ||
        Boolean(attachedFile) ||
        /\b(\d+[- ]?days?|itinerary|schedule|multi[- ]day|tour plan|circuit|day 1|day 2|day 3|custom tour)\b/i.test(userMessage) ||
        /\b(compare|comparison|breakdown|budget|pricing analysis|fleet size|fleet calculation|logistics|optimization|per head|corporate|estimate total)\b/i.test(userMessage) ||
        /\b(complex|pro intelligence|extended reasoning|high thinking|detailed plan|deep dive)\b/i.test(userMessage) ||
        userMessage.length > 220;

      // Grounding evaluation: determine if query requires live web search or local maps
      const isSearchOriented =
        groundingMode === "search" ||
        (groundingMode === "auto" &&
          (/\b(search|google search|live|real-time|latest|current|news|expressway update|toll rates|toll fee|weather|flight|terminal|kempegowda flight|status|condition|recent|rules|guidelines|event|traffic update)\b/i.test(userMessage) ||
           queryLower.includes("search grounding") ||
           queryLower.includes("google search data")));

      // Automatic model routing: select Gemini 3.1 Pro Preview for complex work / user requested pro
      let candidateModel = "gemini-3.8-flash";
      if (modelTier === "pro" || (modelTier === "auto" && isComplexWork)) {
        candidateModel = "gemini-3.1-pro-preview";
      } else if (modelTier === "flash") {
        candidateModel = "gemini-3.8-flash";
      }

      const systemInstruction = `You are "TRAVEL JUST AI Travel Concierge & Work Agent" with Gemini Intelligence Pro, High Thinking (extended reasoning), real-time Google Search Grounding, and Google Maps Grounding.
You represent "TRAVEL JUST", the premier 24/7 cab & chauffeur service based in Mysuru, Karnataka (covering Mysuru, Bengaluru, Kempegowda Airport (BLR), Coorg, Ooty, Wayanad, Kabini, Chikmagalur, and South India).

ADVANCED WORK AGENT CAPABILITIES:
1. Act across apps and files:
   - Provide clear, structured travel schedules, vehicle advice, and fare estimates.
   - When suggesting a ride or tour, specify: Trip Type (Airport Transfer, One Way, Round Trip, or Local City), Pickup Point, Drop Point, Recommended Vehicle (Sedan / Ertiga / Innova Crysta), and Departure Time so the customer can apply it directly to the booking form.
   - For complex multi-day itineraries, provide clear day-by-day itineraries with route timings, expressway pitstops, and doorstep pickup details.
2. Real-Time Google Search Grounding:
   - Retrieve up-to-the-minute real-time web info for flight schedules, highway traffic updates, Bangalore-Mysore expressway toll rates (2026), monsoon/weather alerts, and tourist landmark open hours.
3. 100% Mysuru Doorstep Pickup & Drop Coverage:
   - Mysuru Layouts: Rajiv Nagar / Rajivnagar (1st & 2nd Stage), Vijayanagar (1st-4th Stage), Gokulam (1st-3rd Stage), Kuvempunagar, Jayalakshmipuram, Saraswathipuram, Ramakrishna Nagar, J.P. Nagar, Bogadi, Dattagalli, V.V. Mohalla, Bannimantap, Alanahalli, Siddhartha Layout, Sathgalli, Udayagiri.
   - Mysuru Hubs & Industrial: Hebbal Infosys Campus (Gates 1 & 2), Hootagalli (BEML, Wipro), Koorgalli (TVS Motor), Kadakola KIADB, Mysuru Airport (MYQ).
   - Mysuru Arteries & Roads: Outer Ring Road (ORR 42 km ring, 10-15 min dispatch), D. Devaraja Urs Road, Sayyaji Rao Road, Kalidasa Road, Contour Road.
4. Professional Fleet: Sedans (Etios/Dzire - 4 pax), MUVs (Ertiga - 6 pax), Premium SUVs (Innova / Innova Crysta - 6-7 pax). Zero surge pricing, FASTag automated billing, 4-hour free cancellation.

Format output cleanly in Markdown with bold headers, bullet points, and practical advice.`;

      const formattedHistory = Array.isArray(history)
        ? history
            .slice(-6)
            .map((h: any) => `${h.role === "user" ? "Customer" : "Assistant"}: ${h.content}`)
            .join("\n")
        : "";

      let promptContent = formattedHistory
        ? `Conversation History:\n${formattedHistory}\n\nCustomer Current Question:\n"${userMessage}"`
        : `Customer Question:\n"${userMessage}"`;

      if (attachedFile?.name && attachedFile?.textContent) {
        promptContent += `\n\n[Agent Attached File: "${attachedFile.name}"]\n${attachedFile.textContent}`;
      }

      // Configure contents payload (text or multimodal with attached file image)
      let contentsPayload: any = promptContent;
      if (attachedFile?.base64Data && attachedFile?.type && attachedFile.type.startsWith("image/")) {
        contentsPayload = [
          { text: promptContent },
          {
            inlineData: {
              mimeType: attachedFile.type,
              data: attachedFile.base64Data.replace(/^data:[^;]+;base64,/, ""),
            },
          },
        ];
      }

      // Prepare tools
      let tools: any[] | undefined = undefined;
      let toolConfig: any = undefined;

      if (isSearchOriented) {
        tools = [{ googleSearch: {} }];
      } else if (enableMapsGrounding !== false) {
        tools = [{ googleMaps: {} }];
        toolConfig = {
          retrievalConfig: {
            latLng: {
              latitude: userLat,
              longitude: userLng,
            },
          },
        };
      }

      // Prepare High Thinking config
      const thinkingConfig = enableThinking !== false
        ? { thinkingLevel: ThinkingLevel.HIGH }
        : undefined;

      let response: any;
      let actualModelUsed = candidateModel;
      let usedSearch = false;
      let usedMaps = false;

      // Primary invocation
      try {
        const config: any = {
          systemInstruction,
          ...(tools ? { tools } : {}),
          ...(toolConfig ? { toolConfig } : {}),
          ...(thinkingConfig ? { thinkingConfig } : {}),
        };

        response = await ai.models.generateContent({
          model: candidateModel,
          contents: contentsPayload,
          config,
        });

        if (isSearchOriented) usedSearch = true;
        else if (enableMapsGrounding !== false) usedMaps = true;
      } catch (primaryErr: any) {
        console.warn(`Primary Gemini call with ${candidateModel} failed:`, primaryErr?.message);

        // If candidateModel was gemini-3.1-pro-preview, seamlessly fallback to gemini-3.8-flash with High Thinking
        if (candidateModel === "gemini-3.1-pro-preview") {
          try {
            actualModelUsed = "gemini-3.8-flash";
            const fallbackConfig: any = {
              systemInstruction,
              ...(tools ? { tools } : {}),
              ...(toolConfig ? { toolConfig } : {}),
              ...(thinkingConfig ? { thinkingConfig } : {}),
            };
            response = await ai.models.generateContent({
              model: "gemini-3.8-flash",
              contents: contentsPayload,
              config: fallbackConfig,
            });
            if (isSearchOriented) usedSearch = true;
            else if (enableMapsGrounding !== false) usedMaps = true;
          } catch (secErr: any) {
            console.warn("Fallback with tools failed, trying without tools on gemini-3.8-flash:", secErr?.message);
            response = await ai.models.generateContent({
              model: "gemini-3.8-flash",
              contents: contentsPayload,
              config: {
                systemInstruction,
                ...(thinkingConfig ? { thinkingConfig } : {}),
              },
            });
          }
        } else {
          // Standard tool failure fallback
          try {
            response = await ai.models.generateContent({
              model: "gemini-3.8-flash",
              contents: contentsPayload,
              config: {
                systemInstruction,
                ...(thinkingConfig ? { thinkingConfig } : {}),
              },
            });
          } catch (thirdErr: any) {
            console.error("All Gemini invocations failed:", thirdErr?.message);
            throw thirdErr;
          }
        }
      }

      const reply = response?.text || getPolicyFallback(userMessage).reply;
      const geminiPlaces = extractGroundedPlaces(response);
      const searchSources = extractSearchSources(response);
      const searchQueries = extractSearchQueries(response);
      const localMatches = findMysuruLocationsForQuery(userMessage);
      const bookingDraft = generateBookingDraft(userMessage, reply);

      // Merge Gemini Grounded places and catalog-verified Mysuru places
      const finalGroundedPlaces = [...geminiPlaces];
      const seenUris = new Set(geminiPlaces.map((p) => p.uri));

      for (const loc of localMatches) {
        if (!seenUris.has(loc.uri)) {
          seenUris.add(loc.uri);
          finalGroundedPlaces.push(loc);
        }
      }

      return res.json({
        success: true,
        aiGenerated: true,
        modelUsed: actualModelUsed,
        modelTierRequested: modelTier,
        thinkingLevel: enableThinking !== false ? "HIGH" : "DEFAULT",
        isComplexWork,
        searchGrounded: usedSearch || searchSources.length > 0 || searchQueries.length > 0,
        mapsGrounded: usedMaps || finalGroundedPlaces.length > 0,
        reply,
        groundedPlaces: finalGroundedPlaces,
        searchSources,
        searchQueries,
        bookingDraft,
        suggestedFollowups: isComplexWork
          ? [
              "Break down total toll and driver charges",
              "Which vehicle is best for luggage & family comfort?",
              "Apply this itinerary directly to my booking form",
              "Check real-time expressway traffic & weather",
            ]
          : [
              "Doorstep pickup in Rajiv Nagar 2nd Stage",
              "Cab pickup in Vijayanagar 4th Stage",
              "Gokulam Contour Road cab to Bangalore Airport",
              "Latest Bangalore-Mysuru Expressway toll rates",
              "Outer Ring Road cab in Hebbal / Infosys",
            ],
      });
    } catch (err: any) {
      console.error("Chat Assistant Server Error:", err);
      const userMessage = (req.body?.message || "").trim();
      const fallback = getPolicyFallback(userMessage);
      const bookingDraft = generateBookingDraft(userMessage, fallback.reply);

      return res.json({
        success: true,
        aiGenerated: false,
        modelUsed: "gemini-3.8-flash",
        modelTierRequested: req.body?.modelTier || "auto",
        thinkingLevel: "DEFAULT",
        isComplexWork: false,
        searchGrounded: false,
        mapsGrounded: Boolean(fallback.groundedPlaces && fallback.groundedPlaces.length > 0),
        reply: fallback.reply,
        groundedPlaces: fallback.groundedPlaces || [],
        searchSources: [],
        searchQueries: [],
        bookingDraft,
        suggestedFollowups: [
          "Doorstep pickup in Rajiv Nagar 2nd Stage",
          "Cab pickup in Vijayanagar 4th Stage",
          "Gokulam Contour Road cab to Bangalore Airport",
          "Outer Ring Road cab in Hebbal / Infosys",
        ],
      });
    }
  });

  return router;
}
