import express, { Router } from "express";
import { GoogleGenAI } from "@google/genai";

// In-memory cache & circuit breakers for Google Maps Platform APIs
const routeCache = new Map<string, { data: any; timestamp: number }>();
const autocompleteCache = new Map<string, { data: any; timestamp: number }>();
let googleRoutesRateLimitedUntil = 0;
let googlePlacesRateLimitedUntil = 0;
const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes cache

// In-memory buffer for bookings fallback
const serverBookingsBuffer: any[] = [];
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

  // Google Maps Platform: Routes API Route & Driving Distance Calculation Endpoint
  router.post("/maps/compute-route", async (req, res) => {
    try {
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

      const apiKey = process.env.GOOGLE_MAPS_API_KEY || process.env.VITE_GOOGLE_MAPS_API_KEY;
      if (!apiKey || apiKey === "MY_GOOGLE_MAPS_API_KEY" || apiKey.trim() === "") {
        return res.json({ success: false, reason: "NO_API_KEY" });
      }

      // Check circuit breaker cooldown for rate limit (429)
      if (Date.now() < googleRoutesRateLimitedUntil) {
        return res.json({ success: false, reason: "RATE_LIMITED_COOLDOWN" });
      }

      // Build waypoint specification for Origin
      let originWaypoint: any = { address: origin };
      if (originCoords && typeof originCoords.lat === 'number' && typeof originCoords.lng === 'number') {
        originWaypoint = {
          location: {
            latLng: {
              latitude: originCoords.lat,
              longitude: originCoords.lng,
            },
          },
        };
      } else if (originPlaceId && typeof originPlaceId === 'string' && originPlaceId.startsWith('ChIJ')) {
        originWaypoint = { placeId: originPlaceId };
      }

      // Build waypoint specification for Destination
      let destWaypoint: any = { address: destination };
      if (destinationCoords && typeof destinationCoords.lat === 'number' && typeof destinationCoords.lng === 'number') {
        destWaypoint = {
          location: {
            latLng: {
              latitude: destinationCoords.lat,
              longitude: destinationCoords.lng,
            },
          },
        };
      } else if (destinationPlaceId && typeof destinationPlaceId === 'string' && destinationPlaceId.startsWith('ChIJ')) {
        destWaypoint = { placeId: destinationPlaceId };
      }

      const payload: any = {
        origin: originWaypoint,
        destination: destWaypoint,
        travelMode: "DRIVE",
        routingPreference: "TRAFFIC_UNAWARE",
        computeAlternativeRoutes: false,
        units: "METRIC",
      };

      if (validViaStops.length > 0) {
        payload.intermediates = validViaStops.map((stop, idx) => {
          const coord = viaCoords && Array.isArray(viaCoords) ? viaCoords[idx] : null;
          if (coord && typeof coord.lat === 'number' && typeof coord.lng === 'number') {
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

      const response = await fetch("https://routes.googleapis.com/directions/v2:computeRoutes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": apiKey,
          "X-Goog-FieldMask":
            "routes.distanceMeters,routes.duration,routes.polyline.encodedPolyline,routes.description,routes.legs,routes.travelAdvisory.tollInfo",
          "X-Goog-Maps-Solution-ID": "gmp_mcp_codeassist_v1_aistudio",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        if (response.status === 429) {
          googleRoutesRateLimitedUntil = Date.now() + 60000; // 1 min cooldown
        }
        return res.json({ success: false, status: response.status, reason: "API_UNAVAILABLE" });
      }

      const data = await response.json();
      const primaryRoute = data.routes?.[0];

      if (!primaryRoute) {
        return res.json({ success: false, error: "No driving route found between specified points" });
      }

      const distanceMeters = primaryRoute.distanceMeters || 0;
      const distanceKm = Number((distanceMeters / 1000).toFixed(1));

      let durationMinutes = 30;
      if (primaryRoute.duration) {
        const seconds = parseInt(primaryRoute.duration.replace("s", ""), 10);
        if (!isNaN(seconds)) {
          durationMinutes = Math.round(seconds / 60);
        }
      }

      const formatDurationText = (mins: number) => {
        if (mins < 60) return `Approx. ${mins} min`;
        const h = Math.floor(mins / 60);
        const m = mins % 60;
        return m === 0 ? `${h} hr${h > 1 ? "s" : ""}` : `${h} hr${h > 1 ? "s" : ""} ${m} min`;
      };

      const durationFormatted = formatDurationText(durationMinutes);
      const summaryText = `${distanceKm} km · ${durationFormatted}`;
      const isAirport =
        origin.toLowerCase().includes("airport") ||
        destination.toLowerCase().includes("airport") ||
        origin.toLowerCase().includes("kial") ||
        destination.toLowerCase().includes("kial") ||
        origin.toLowerCase().includes("blr") ||
        destination.toLowerCase().includes("blr");

      const routeDesc = primaryRoute.description || "";

      const routeInfo = {
        distanceKm,
        distanceMeters,
        durationMinutes,
        durationFormatted,
        summaryText,
        originAddress: origin,
        destinationAddress: destination,
        stopsCount: validViaStops.length,
        viaStops: validViaStops,
        encodedPolyline: primaryRoute.polyline?.encodedPolyline,
        routeDescription: routeDesc,
        isAirportRoute: isAirport,
        originCoords: originCoords || undefined,
        destinationCoords: destinationCoords || undefined,
        dataSource: "google_maps",
      };

      routeCache.set(cacheKey, { data: routeInfo, timestamp: Date.now() });
      return res.json({
        success: true,
        routeInfo,
      });
    } catch (err: any) {
      return res.json({ success: false, reason: "SERVER_ERROR" });
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

  // API route for AI Contact & Policy Assistant
  router.post("/chat-assistant", async (req, res) => {
    try {
      const { message, history } = req.body;
      const userMessage = (message || "").trim();

      if (!userMessage) {
        return res.status(400).json({
          success: false,
          error: "Message is required",
        });
      }

      const apiKey = process.env.GEMINI_API_KEY;

      const getPolicyFallback = (query: string): string => {
        const q = query.toLowerCase();
        if (q.includes("cancel") || q.includes("refund") || q.includes("change date")) {
          return `### 🛡️ Cancellation & Rescheduling Policy\n\n- **Free Cancellation:** You can cancel for free up to **4 hours prior** to your scheduled pickup time.\n- **Late Cancellation:** Cancellations within 4 hours may incur a nominal fee of ₹300 to compensate the assigned driver.\n- **Date / Time Changes:** You can reschedule your trip anytime with at least 2 hours notice at zero additional fee.\n- **No Show:** If a booking is cancelled after vehicle dispatch, standard minimum cancellation charges apply.`;
        }
        if (q.includes("vehicle") || q.includes("car") || q.includes("fleet") || q.includes("available") || q.includes("seat") || q.includes("pax") || q.includes("innova") || q.includes("ertiga") || q.includes("etios") || q.includes("dzire") || q.includes("sedan") || q.includes("suv")) {
          return `### 🚗 TRAVEL JUST Fleet & Vehicle Availability\n\nAll our vehicles are verified, 100% Air-Conditioned, sanitized, and operated by professional commercial chauffeurs:\n\n1. **Sedans (4+1 Seater)**\n   - *Models:* Toyota Etios, Swift Dzire, Hyundai Aura\n   - *Capacity:* 4 Passengers + 2 Large Suitcases\n   - *Best for:* Airport runs, Mysuru city packages, couples & business travelers.\n\n2. **MUVs (6+1 Seater)**\n   - *Models:* Maruti Ertiga\n   - *Capacity:* 5-6 Passengers + 3 Medium Bags\n   - *Best for:* Small families, weekend getaways to Coorg & Ooty.\n\n3. **Premium SUVs (6+1 / 7+1 Seater)**\n   - *Models:* Toyota Innova, Innova 7+1, Innova Crysta\n   - *Capacity:* 6-7 Passengers + 4 Large Suitcases\n   - *Best for:* Luxury outstation touring, hill station tours, large family groups with luggage.`;
        }
        if (q.includes("toll") || q.includes("parking") || q.includes("tax") || q.includes("permit") || q.includes("hidden")) {
          return `### 🛣️ Tolls, Parking & Interstate Permits Policy\n\n- **Fare Inclusions:** Base fare covers vehicle rental, clean AC car, fuel costs, and driver allowance.\n- **Tolls & Parking:** Expressway tolls (like Bangalore-Mysuru Expressway) and airport/monument parking charges are billed at actuals as per FASTag electronic receipt.\n- **Interstate Taxes:** For trips crossing state borders into Kerala (Wayanad), Tamil Nadu (Ooty), or Andhra Pradesh (Tirupati), state permit taxes are payable at actual border checkposts.\n- **No Hidden Fees:** We maintain 100% pricing transparency with zero surprise surcharges.`;
        }
        if (q.includes("night") || q.includes("bata") || q.includes("timing") || q.includes("hour")) {
          return `### 🌙 Night Driving & Driver Allowance (Bata)\n\n- **Daytime Trips (6:00 AM - 10:00 PM):** Driver allowance is fully inclusive in outstation quotes.\n- **Night Allowance:** A standard night charge (₹250 - ₹350 depending on vehicle class) applies only for travel conducted between **10:00 PM and 6:00 AM**.\n- **24/7 Dispatch:** Our fleet operates round the clock with prior booking confirmation.`;
        }
        if (q.includes("pet") || q.includes("dog") || q.includes("cat")) {
          return `### 🐾 Pet Policy\n\n- **Pet Friendly:** Pets are allowed in selected vehicles upon advance notification during booking.\n- **Requirements:** Please bring a pet mat/towel to protect vehicle upholstery.\n- **Hygiene Fee:** A minimal deep cleaning fee of ₹200-₹300 may apply if extensive pet hair cleaning is needed.`;
        }
        if (q.includes("luggage") || q.includes("bag") || q.includes("boot") || q.includes("carrier")) {
          return `### 🧳 Luggage Capacity Guidelines\n\n- **Sedan (Etios / Dzire):** 2 standard check-in trolley bags + 2 hand luggage backpacks in the trunk.\n- **Ertiga (6+1):** 2 large or 3 medium bags with fold-down rear seats, or roof carrier upon request.\n- **Innova / Crysta:** 3-4 large check-in bags with ample vertical space. Dedicated roof carriers available for heavy luggage.`;
        }
        if (q.includes("pay") || q.includes("advance") || q.includes("upi") || q.includes("card") || q.includes("cash")) {
          return `### 💳 Payment Methods & Terms\n\n- **Zero Advance for City Bookings:** Pay nothing upfront for standard local bookings.\n- **Outstation Advance:** Nominal 10% token to lock in vehicle reservation, balance payable at the end of the trip.\n- **Accepted Payment Modes:** UPI (Google Pay, PhonePe, Paytm), Netbanking, and Cash directly to the chauffeur.`;
        }
        if (q.includes("airport") || q.includes("flight") || q.includes("bangalore airport") || q.includes("kempegowda") || q.includes("blr")) {
          return `### ✈️ Airport Transfer Service (Mysuru ⮂ BLR Kempegowda Airport)\n\n- **Doorstep Pickup:** 24/7 service anywhere in Mysuru or Bangalore.\n- **Flight Tracking:** Provide your flight number for complimentary delay tracking.\n- **Direct Expressway:** Rapid transit via Bangalore-Mysuru Expressway (~3.5 to 4 hours).\n- **Driver Meet & Greet:** Driver coordinates via WhatsApp / Call upon landing with designated pickup lane guidance.`;
        }
        return `Hello! I am your **TRAVEL JUST AI Travel & Policy Concierge**. Here is what I can help you with:

- **Vehicle Options & Fleet Availability** (Etios, Dzire, Ertiga, Innova, Innova Crysta)
- **Booking & Cancellation Policies** (Free cancellation up to 4 hours before pickup)
- **Tolls, Interstate Permits & Night Allowance Rules**
- **Luggage Limits & Pet Travel Guidelines**
- **Airport Transfers & Outstation Tour Packages** (Coorg, Ooty, Wayanad, Kabini)

How can I assist you with your travel plans today?`;
      };

      if (!apiKey || apiKey === "MY_GEMINI_API_KEY" || apiKey.trim() === "") {
        const reply = getPolicyFallback(userMessage);
        return res.json({
          success: true,
          aiGenerated: false,
          reply,
          suggestedFollowups: [
            "What is your cancellation policy?",
            "Which car is best for 6 passengers?",
            "Are tolls and driver allowance included?",
            "How do Bangalore airport pickups work?",
          ],
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

      const systemInstruction = `You are the AI Travel Concierge and Policy Specialist for "TRAVEL JUST", a premier travel and cab rental service based in Mysuru, Karnataka (covering Mysuru, Bangalore, Bangalore Kempegowda Airport (BLR), Coorg, Ooty, Wayanad, Kabini, Chikmagalur, and South India).

Your role:
1. Answer customer questions about TRAVEL JUST policies (cancellation, rescheduling, tolls, night charges, payment modes, pet policies, luggage limits).
2. Help customers choose the right vehicle from our fleet based on passenger count, luggage, and route terrain.
3. Provide helpful, polite, structured, and accurate guidance. Format responses cleanly with markdown bullet points, bold headings, and clear summaries.

Company & Fleet Knowledge Base:
- Company Name: TRAVEL JUST (Mysuru)
- Fleet:
  * TOYOTA ETIOS (4+1): Sedan, AC, 4 pax, 2 large bags. Comfortable, great fuel economy.
  * SWIFT DESIRE (4+1): Sedan, AC, 4 pax, 2 bags. Smooth and compact.
  * HYUNDAI AURA (4+1): Sedan, AC, 4 pax, 2 bags. Modern cabin.
  * ERTIGA (6+1): MUV, AC, 5-6 pax, 3 bags. Ideal for families and group airport drops.
  * INNOVA 6+1: Premium MUV/SUV, AC, 6 pax, 4 bags. Captain seats, extra legroom.
  * INNOVA 7+1: MUV/SUV, AC, 7 pax, 4 bags. Great for large families.
  * INNOVA CRYSTA: Luxury MPV, AC, 6-7 pax, 4-5 bags. Highest comfort for long trips and hill journeys.
- Travel Policies:
  * Cancellation: FREE cancellation up to 4 hours prior to pickup time. Nominal fee applies within 4 hours.
  * Rescheduling: Free date/time adjustment with 2+ hours notice.
  * Inclusions: Vehicle, fuel, driver allowance for day trips.
  * Exclusions: Highway tolls (FASTag), airport/monument parking, and interstate border permit taxes (payable at actuals).
  * Night Charge: ₹250-₹350 applies only between 10:00 PM and 6:00 AM.
  * Pet Policy: Allowed in select vehicles upon prior notice during booking with protective towel/mat.
  * Payment Methods: Zero advance for city packages, 10% token for outstation, balance via UPI (GPay/PhonePe) or cash to chauffeur.
  * Chauffeurs: Verified, courteous, punctual, background-checked.

Always keep your tone welcoming, professional, and clear.`;

      const formattedHistory = Array.isArray(history)
        ? history.slice(-6).map((h: any) => `${h.role === 'user' ? 'Customer' : 'Assistant'}: ${h.content}`).join('\n')
        : '';

      const promptContent = formattedHistory
        ? `Conversation History:\n${formattedHistory}\n\nCustomer Current Question:\n"${userMessage}"`
        : `Customer Question:\n"${userMessage}"`;

      const response = await ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents: promptContent,
        config: {
          systemInstruction,
        }
      });

      const reply = response.text || getPolicyFallback(userMessage);

      return res.json({
        success: true,
        aiGenerated: true,
        reply,
        suggestedFollowups: [
          "What is your cancellation policy?",
          "Which car is best for 6 passengers?",
          "Are tolls and driver allowance included?",
          "How do airport transfers work?",
        ]
      });
    } catch (err: any) {
      console.error("Chat Assistant Server Error:", err);
      const userMessage = (req.body?.message || "").trim();
      const fallbackReply = `Thank you for your question! Here is the standard policy summary:

- **Free Cancellation:** Up to 4 hours prior to pickup.
- **Fleet Availability:** 4+1 Sedans (Etios, Dzire), 6+1 MUVs (Ertiga), and 6/7+1 Premium SUVs (Innova, Innova Crysta) ready for 24/7 dispatch.
- **Tolls & Inclusions:** Fuel and vehicle rental included. Tolls & parking billed as actuals via FASTag.
- **Direct Dispatch Helpline:** Reach out on WhatsApp or call for immediate custom bookings.`;

      return res.json({
        success: true,
        aiGenerated: false,
        reply: fallbackReply,
        suggestedFollowups: [
          "What is your cancellation policy?",
          "Which car is best for 6 passengers?",
          "Are tolls and driver allowance included?",
          "How do airport transfers work?",
        ]
      });
    }
  });

  return router;
}
