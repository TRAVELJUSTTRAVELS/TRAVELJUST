import { GoogleGenAI } from '@google/genai';
import { fetchBookingByReference, mapStatusToStage } from './bookingTrackingService';
import { vehiclesData } from '../data/vehicles';

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  bookingCard?: {
    referenceId: string;
    status: string;
    serviceType: string;
    pickupLocation: string;
    dropLocation?: string;
    travelDate: string;
    pickupTime: string;
    fare: number;
    vehicleName: string;
    driverName?: string;
    driverPhone?: string;
    driverPlate?: string;
  };
  suggestedAction?: {
    label: string;
    type: 'track_ride' | 'book_ride' | 'view_fleet' | 'call_support';
    data?: any;
  };
}

const SYSTEM_INSTRUCTION = `You are the TRAVEL JUST Intelligent Concierge, the official AI travel assistant for TRAVEL JUST — Mysuru's premier verified chauffeur taxi and outstation tour company.

YOUR PURPOSE:
Assist travelers visiting Mysuru, Coorg, Ooty, Wayanad, Kabini, and Bengaluru Airport with destination tips, day trips, transparent fare calculations, and booking status lookups.

CORE COMPANY FACTS & OPERATIONAL POLICIES:
1. Base City: Mysuru (Mysore), Karnataka, India. 24/7 Helpline: +91 97407 54400.
2. Services Offered:
   - One-Way Drops: Point-to-point drops (Mysuru ⇄ BLR Airport, Mysuru ⇄ Bengaluru, Ooty, Coorg). Pay only for one-way distance!
   - Outstation Return Trips: Multi-day holiday packages to Coorg (Madikeri), Ooty, Wayanad, Chikmagalur, Kabini safari with verified chauffeur.
   - Hourly Local City Rentals: 4 Hours / 40 KM, 8 Hours / 80 KM, 12 Hours / 120 KM for Mysuru sightseeing.
   - Airport Transfers: Dedicated pickup & drop to Kempegowda International Airport Bengaluru (KIAL / BLR) and Mysore Airport (MYQ) with flight tracking.
3. Fleet:
   - Sedan (4+1): Toyota Etios / Maruti Dzire (Executive comfort, 4 passengers, 2 trolley bags)
   - SUV (6+1): Maruti Ertiga (Family comfort, 5-6 passengers, 3 bags)
   - Toyota Innova (6+1): Robust highway SUV, Ghat roads & hills ready (6 passengers, 4 bags)
   - Toyota Innova Crysta (6+1): Executive luxury, rear AC vents, leather seating
   - Tempo Traveller (12+1): Group tours & pilgrimages (12 passengers, high luggage boot)
4. Pricing Policy:
   - Zero hidden surge multipliers. Rates are locked upon booking.
   - Tolls, state permits, and parking are billed transparently on actuals.
   - 100% sanitized, commercial yellow-board vehicles with police-verified courteous chauffeurs.

CRITICAL OPERATIONAL ACCURACY RULE:
- When a user asks about their booking status (e.g. "Status of TJ-12345" or "Where is my cab?"), you MUST rely ONLY on verified booking records provided in your context.
- DO NOT invent or fabricate booking confirmations, fictional driver names, or false vehicle assignments. If no booking reference is found, politely ask the user for their 7-character booking ID (e.g. TJ-12345) or mobile number.
- Always be courteous, concise, welcoming, and helpful with authentic local Karnataka travel knowledge.`;

export async function askTravelAssistant(
  userQuery: string,
  history: ChatMessage[],
  customerPhone?: string
): Promise<ChatMessage> {
  const queryLower = userQuery.toLowerCase().trim();
  const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  // 1. Check if the user is asking about a specific booking reference (e.g., TJ-10821, TJ10821, or reference numbers)
  const refMatch = userQuery.match(/TJ-?\d{4,6}/i);
  let resolvedBookingCard: any = undefined;
  let operationalContext = '';

  if (refMatch) {
    const rawRef = refMatch[0].toUpperCase();
    const formattedRef = rawRef.startsWith('TJ-') ? rawRef : `TJ-${rawRef.replace('TJ', '')}`;
    const booking = await fetchBookingByReference(formattedRef);

    if (booking) {
      const { stage } = mapStatusToStage(booking.status);
      resolvedBookingCard = {
        referenceId: booking.referenceId,
        status: booking.status,
        serviceType: booking.searchDetails.serviceType,
        pickupLocation: booking.searchDetails.pickupLocation,
        dropLocation: booking.searchDetails.dropLocation,
        travelDate: booking.searchDetails.travelDate,
        pickupTime: booking.searchDetails.pickupTime,
        fare: booking.estimatedFare?.totalEstimatedFare || 0,
        vehicleName: booking.selectedVehicle?.name || 'Assigned Vehicle',
        driverName: booking.driverDetails?.driverName,
        driverPhone: booking.driverDetails?.driverPhone,
        driverPlate: booking.driverDetails?.driverVehiclePlate,
      };

      operationalContext = `[VERIFIED BOOKING FOUND IN BACKEND]:
Reference: ${booking.referenceId}
Status: ${booking.status} (Stage: ${stage})
Customer: ${booking.passengerDetails.fullName} (${booking.passengerDetails.mobileNumber})
Service: ${booking.searchDetails.serviceType}
Pickup: ${booking.searchDetails.pickupLocation}
Drop: ${booking.searchDetails.dropLocation || 'Local Package'}
Date & Time: ${booking.searchDetails.travelDate} at ${booking.searchDetails.pickupTime}
Vehicle: ${booking.selectedVehicle?.name}
Fare: ₹${booking.estimatedFare?.totalEstimatedFare}
Driver Assigned: ${booking.driverDetails?.driverName || 'Will be allocated 2 hours prior'}
Driver Phone: ${booking.driverDetails?.driverPhone || 'N/A'}
Plate: ${booking.driverDetails?.driverVehiclePlate || 'N/A'}`;
    } else {
      operationalContext = `[BOOKING LOOKUP RESULT]: Reference "${formattedRef}" was searched in the dispatch database but no record was found. Please inform the user gently and invite them to check their booking confirmation SMS or call the 24/7 dispatch desk at +91 97407 54400.`;
    }
  }

  // 2. Call Gemini API using @google/genai SDK
  try {
    const ai = new GoogleGenAI();
    
    // Build conversation context
    const conversationContents: any[] = [];
    
    // Add brief past history
    for (const msg of history.slice(-4)) {
      conversationContents.push({
        role: msg.sender === 'user' ? 'user' : 'model',
        parts: [{ text: msg.text }],
      });
    }

    const currentPrompt = operationalContext
      ? `${operationalContext}\n\nCustomer query: ${userQuery}`
      : userQuery;

    conversationContents.push({
      role: 'user',
      parts: [{ text: currentPrompt }],
    });

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: conversationContents,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.6,
      },
    });

    const text = response.text || "I am here to assist with all your Mysuru and South India cab booking needs. How may I help you today?";

    let suggestedAction: any = undefined;
    if (resolvedBookingCard) {
      suggestedAction = {
        label: `Track Ride #${resolvedBookingCard.referenceId} Live`,
        type: 'track_ride',
        data: resolvedBookingCard.referenceId,
      };
    } else if (queryLower.includes('book') || queryLower.includes('cab') || queryLower.includes('quote') || queryLower.includes('cost')) {
      suggestedAction = {
        label: 'Book a Ride Now',
        type: 'book_ride',
      };
    } else if (queryLower.includes('car') || queryLower.includes('fleet') || queryLower.includes('vehicle') || queryLower.includes('innova')) {
      suggestedAction = {
        label: 'Explore Our Fleet',
        type: 'view_fleet',
      };
    }

    return {
      id: `bot_${Date.now()}`,
      sender: 'assistant',
      text,
      timestamp,
      bookingCard: resolvedBookingCard,
      suggestedAction,
    };
  } catch (err) {
    console.warn('Gemini Assistant API execution fallback:', err);
    // Intelligent local fallback if API key quota or network is offline
    return getIntelligentFallbackResponse(userQuery, resolvedBookingCard, timestamp);
  }
}

function getIntelligentFallbackResponse(
  query: string,
  bookingCard: any,
  timestamp: string
): ChatMessage {
  const q = query.toLowerCase();

  if (bookingCard) {
    return {
      id: `bot_${Date.now()}`,
      sender: 'assistant',
      text: `Your booking **#${bookingCard.referenceId}** is currently **${bookingCard.status}**.\n\n` +
        `• **Route**: ${bookingCard.pickupLocation} → ${bookingCard.dropLocation || 'Local Package'}\n` +
        `• **Schedule**: ${bookingCard.travelDate} at ${bookingCard.pickupTime}\n` +
        `• **Vehicle**: ${bookingCard.vehicleName}\n` +
        `• **Fare**: ₹${bookingCard.fare.toLocaleString('en-IN')}\n\n` +
        (bookingCard.driverName ? `• **Chauffeur**: ${bookingCard.driverName} (${bookingCard.driverPlate || 'Yellow Board'})\n\n` : `Your chauffeur will be assigned in advance with live SMS tracking.\n\n`) +
        `You can monitor the live GPS vehicle location using the Live Ride Tracker below.`,
      timestamp,
      bookingCard,
      suggestedAction: {
        label: `Track Ride #${bookingCard.referenceId} Live`,
        type: 'track_ride',
        data: bookingCard.referenceId,
      },
    };
  }

  if (q.includes('airport') || q.includes('blr') || q.includes('bangalore airport')) {
    return {
      id: `bot_${Date.now()}`,
      sender: 'assistant',
      text: `**TRAVEL JUST Mysuru ⇄ Bengaluru Kempegowda Airport (BLR) Transfers**:\n\n` +
        `• **Distance**: Approx. 180 KM via the 10-Lane Bengaluru-Mysuru Expressway.\n` +
        `• **Travel Time**: ~2 hours 45 minutes to 3 hours.\n` +
        `• **Sedan (Etios/Dzire)**: Upfront fixed tariff starting at ₹2,899.\n` +
        `• **Innova / Crysta**: Perfect for flight luggage and families starting at ₹3,999.\n\n` +
        `We provide guaranteed on-time doorstep pickup in Mysuru and dedicated flight tracking for terminal arrivals.`,
      timestamp,
      suggestedAction: {
        label: 'Book Airport Cab',
        type: 'book_ride',
      },
    };
  }

  if (q.includes('coorg') || q.includes('madikeri') || q.includes('ooty') || q.includes('wayanad')) {
    const dest = q.includes('ooty') ? 'Ooty' : q.includes('wayanad') ? 'Wayanad' : 'Coorg';
    return {
      id: `bot_${Date.now()}`,
      sender: 'assistant',
      text: `**Planning a Trip from Mysuru to ${dest}**:\n\n` +
        `• **Distance**: ${dest === 'Coorg' ? '120 KM (~2.5 hrs)' : dest === 'Ooty' ? '125 KM via Bandipur Forest (~3.5 hrs)' : '140 KM (~3.5 hrs)'}.\n` +
        `• **Recommended Vehicle**: Toyota Innova or SUV (6+1) — excellent for mountain ghat curves and family luggage.\n` +
        `• **Scenic Highlights**: ${dest === 'Coorg' ? 'Abbey Falls, Raja Seat, Dubare Elephant Camp & Namdroling Monastery' : dest === 'Ooty' ? 'Bandipur safari corridor, Pykara Lake, Botanical Garden & Doddabetta Peak' : 'Banasura Sagar Dam, Edakkal Caves & Chembra Peak'}.\n\n` +
        `Both One-Way drops and Round-Trip multi-day packages are available with our experienced hill-road chauffeurs.`,
      timestamp,
      suggestedAction: {
        label: `Book Cab to ${dest}`,
        type: 'book_ride',
      },
    };
  }

  return {
    id: `bot_${Date.now()}`,
    sender: 'assistant',
    text: `Hello! I am the TRAVEL JUST Intelligent Concierge. I can help you with:\n\n` +
      `1. **Tracking Your Booking**: Enter your booking ID (e.g., *TJ-10821*) to see live chauffeur status and vehicle arrival.\n` +
      `2. **Airport & Outstation Cabs**: Fares and travel duration to Bangalore Airport, Coorg, Ooty, or Wayanad.\n` +
      `3. **Mysuru Local Sightseeing**: Hourly packages (4h/40km, 8h/80km) for Mysore Palace, Chamundi Hills & KRS.\n` +
      `4. **Fleet Guidance**: Selecting the best vehicle for your passenger count and luggage.\n\n` +
      `How can I assist your voyage today?`,
    timestamp,
    suggestedAction: {
      label: 'Book a New Ride',
      type: 'book_ride',
    },
  };
}
