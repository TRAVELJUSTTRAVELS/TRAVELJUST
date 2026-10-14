import { BookingRequest, BookingSearchState, Vehicle, PassengerDetails, FareEstimate } from '../types';
import { siteConfig } from '../config/siteConfig';

export interface WhatsAppTemplatesConfig {
  bookingConfirmation: string;
  fleetDispatch: string;
  updatedAt?: string;
  lastEditedBy?: string;
}

export const DEFAULT_BOOKING_CONFIRMATION_TEMPLATE = `🚕 *TRAVEL JUST - BOOKING CONFIRMATION* 🔔
━━━━━━━━━━━━━━━━━━━━━━━━━━
1. *Booking Request Received*
2. *Booking Reference ID:* {{reference_id}}
3. *Booking Details:*
   • *Trip Type:* {{trip_type}}
   • *Pickup:* {{pickup_location}}
   • *Drop:* {{drop_location}}
   • *Via Stops:* {{via_stops}}
   • *Pickup Date:* {{travel_date}}
   • *Pickup Time:* {{pickup_time}}
   • *Return Date:* {{return_date}}
   • *Return Time:* {{return_time}}
   • *Vehicle:* {{vehicle_name}} ({{vehicle_category}})
   • *Est. Distance:* {{distance}}
   • *Est. Duration:* {{duration}}
   • *Estimated Fare:* ₹{{estimated_fare}}
4. *You receive Chauffeur Details & Cab details on WhatsApp.*
5. *Cab arrives at your pickup point at scheduled time.*

━━━━━━━━━━━━━━━━━━━━━━━━━━
📞 *Call Fleet Desk: {{fleet_phone}}*
🌐 *Website: {{website_url}}*`;

export const DEFAULT_FLEET_DISPATCH_TEMPLATE = `🚕 *TRAVEL JUST - FLEET DISPATCH ORDER* 🔔
━━━━━━━━━━━━━━━━━━━━━━━━━━
Hello {{driver_name}}, trip dispatch details for TRAVEL JUST Booking #{{reference_id}}:

📋 *Trip Details:*
• *Service Mode:* {{trip_type}}
• *Pickup Location:* {{pickup_location}}
• *Drop Location:* {{drop_location}}
• *Scheduled Date & Time:* {{travel_date}} at {{pickup_time}}
• *Return Info:* {{return_date}} {{return_time}}
• *Passenger Name:* {{customer_name}}
• *Passenger Phone:* +91 {{customer_phone}}
• *Assigned Vehicle:* {{cab_plate}} ({{cab_model}})
• *Trip Fare:* ₹{{estimated_fare}}
• *Passenger Notes:* "{{special_instructions}}"

━━━━━━━━━━━━━━━━━━━━━━━━━━
⚡ *Chauffeur Duty:* Please confirm arrival 15 minutes before scheduled pickup.
📞 *Dispatch Desk: {{fleet_phone}}*`;

export const WHATSAPP_TEMPLATE_VARIABLES: Array<{
  tag: string;
  label: string;
  description: string;
  example: string;
  category: 'booking' | 'route' | 'passenger' | 'chauffeur' | 'system';
}> = [
  { tag: '{{reference_id}}', label: 'Booking Ref ID', description: 'Unique booking code', example: 'TJ-2609-8812', category: 'booking' },
  { tag: '{{trip_type}}', label: 'Trip Type', description: 'One Way, Round Trip, Local, Airport', example: 'ONE WAY', category: 'booking' },
  { tag: '{{estimated_fare}}', label: 'Estimated Fare', description: 'Calculated fare in INR', example: '4,850', category: 'booking' },
  { tag: '{{vehicle_name}}', label: 'Vehicle Name', description: 'e.g. Innova Crysta, Dzire', example: 'Toyota Innova Crysta', category: 'booking' },
  { tag: '{{vehicle_category}}', label: 'Vehicle Category', description: 'e.g. Prime SUV, Sedan', example: 'Prime SUV', category: 'booking' },

  { tag: '{{pickup_location}}', label: 'Pickup Location', description: 'Pickup address or landmark', example: 'Gokulam 3rd Stage, Mysuru', category: 'route' },
  { tag: '{{drop_location}}', label: 'Drop Location', description: 'Destination address', example: 'Kempegowda International Airport (BLR)', category: 'route' },
  { tag: '{{via_stops}}', label: 'Via Stops', description: 'Intermediate stops or "None"', example: 'Mandya -> Channapatna', category: 'route' },
  { tag: '{{travel_date}}', label: 'Travel Date', description: 'Pickup travel date', example: '28 Sep 2026', category: 'route' },
  { tag: '{{pickup_time}}', label: 'Pickup Time', description: 'Scheduled pickup time', example: '05:00 AM', category: 'route' },
  { tag: '{{return_date}}', label: 'Return Date', description: 'Return date for round trips', example: '30 Sep 2026', category: 'route' },
  { tag: '{{return_time}}', label: 'Return Time', description: 'Return time for round trips', example: '08:00 PM', category: 'route' },
  { tag: '{{distance}}', label: 'Distance', description: 'Route distance in KM', example: '185 KM', category: 'route' },
  { tag: '{{duration}}', label: 'Duration', description: 'Estimated driving duration', example: '3 hr 30 min', category: 'route' },

  { tag: '{{customer_name}}', label: 'Passenger Name', description: 'Customer full name', example: 'Dr. Arvind Rao', category: 'passenger' },
  { tag: '{{customer_phone}}', label: 'Passenger Phone', description: '10-digit mobile number', example: '9845012345', category: 'passenger' },
  { tag: '{{customer_email}}', label: 'Passenger Email', description: 'Customer email address', example: 'arvind.rao@gmail.com', category: 'passenger' },
  { tag: '{{special_instructions}}', label: 'Special Instructions', description: 'Customer notes or requests', example: 'AC on throughout trip', category: 'passenger' },

  { tag: '{{driver_name}}', label: 'Driver Name', description: 'Assigned chauffeur name', example: 'Ramesh Kumar', category: 'chauffeur' },
  { tag: '{{driver_phone}}', label: 'Driver Phone', description: 'Chauffeur mobile number', example: '+91 98451 22341', category: 'chauffeur' },
  { tag: '{{cab_plate}}', label: 'Cab Plate No.', description: 'Vehicle registration plate', example: 'KA-09-MC-8819', category: 'chauffeur' },
  { tag: '{{cab_model}}', label: 'Cab Model', description: 'Assigned car make & model', example: 'Innova Crysta', category: 'chauffeur' },

  { tag: '{{fleet_phone}}', label: 'Fleet Desk Phone', description: 'TRAVEL JUST official hotline', example: '+91 97407 54400', category: 'system' },
  { tag: '{{website_url}}', label: 'Website URL', description: 'Official portal link', example: 'https://www.traveljust.in', category: 'system' },
];

const LOCAL_STORAGE_TEMPLATES_KEY = 'tj_custom_whatsapp_templates';

/**
 * Loads customized WhatsApp templates from localStorage or default configuration
 */
export function getWhatsAppTemplates(): WhatsAppTemplatesConfig {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_TEMPLATES_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        bookingConfirmation: parsed.bookingConfirmation || DEFAULT_BOOKING_CONFIRMATION_TEMPLATE,
        fleetDispatch: parsed.fleetDispatch || DEFAULT_FLEET_DISPATCH_TEMPLATE,
        updatedAt: parsed.updatedAt,
        lastEditedBy: parsed.lastEditedBy,
      };
    }
  } catch (e) {
    console.warn('Error reading WhatsApp templates from localStorage:', e);
  }

  return {
    bookingConfirmation: DEFAULT_BOOKING_CONFIRMATION_TEMPLATE,
    fleetDispatch: DEFAULT_FLEET_DISPATCH_TEMPLATE,
  };
}

/**
 * Saves customized templates to localStorage and optional backend sync
 */
export function saveWhatsAppTemplates(config: Partial<WhatsAppTemplatesConfig>): WhatsAppTemplatesConfig {
  const current = getWhatsAppTemplates();
  const updated: WhatsAppTemplatesConfig = {
    bookingConfirmation: config.bookingConfirmation !== undefined ? config.bookingConfirmation : current.bookingConfirmation,
    fleetDispatch: config.fleetDispatch !== undefined ? config.fleetDispatch : current.fleetDispatch,
    updatedAt: new Date().toISOString(),
    lastEditedBy: config.lastEditedBy || 'TRAVEL JUST Fleet Admin',
  };

  try {
    localStorage.setItem(LOCAL_STORAGE_TEMPLATES_KEY, JSON.stringify(updated));
  } catch (e) {
    console.warn('Error writing WhatsApp templates to localStorage:', e);
  }

  // Sync to server API in background
  try {
    fetch('/api/whatsapp-templates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updated),
    }).catch(() => {
      // offline fallback
    });
  } catch {
    // non-blocking
  }

  return updated;
}

/**
 * Resets WhatsApp templates back to factory default TRAVEL JUST templates
 */
export function resetWhatsAppTemplates(): WhatsAppTemplatesConfig {
  const defaults: WhatsAppTemplatesConfig = {
    bookingConfirmation: DEFAULT_BOOKING_CONFIRMATION_TEMPLATE,
    fleetDispatch: DEFAULT_FLEET_DISPATCH_TEMPLATE,
    updatedAt: new Date().toISOString(),
    lastEditedBy: 'System Default Reset',
  };

  try {
    localStorage.setItem(LOCAL_STORAGE_TEMPLATES_KEY, JSON.stringify(defaults));
  } catch (e) {
    console.warn('Error resetting WhatsApp templates:', e);
  }

  try {
    fetch('/api/whatsapp-templates/reset', { method: 'POST' }).catch(() => {});
  } catch {}

  return defaults;
}

/**
 * Replaces placeholders like {{reference_id}} in a template with actual values
 */
export function renderWhatsAppTemplate(template: string, vars: Record<string, string | number | undefined>): string {
  let result = template;
  
  // Replace each defined variable
  for (const [key, val] of Object.entries(vars)) {
    const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
    result = result.replace(regex, val !== undefined && val !== null ? String(val).trim() : '');
  }

  // Clean up any un-replaced optional variable patterns
  result = result.replace(/\{\{[a-zA-Z0-9_]+\}\}/g, '');

  // Remove redundant multiple empty lines (preserve double newlines for paragraph spacing)
  result = result.replace(/\n{3,}/g, '\n\n').trim();

  return result;
}

/**
 * Helper to build variable dictionary from a BookingRequest or BookingWhatsAppPayload
 */
export function buildTemplateVariables(payload: {
  referenceId: string;
  searchDetails: BookingSearchState;
  selectedVehicle?: Vehicle;
  passengerDetails: PassengerDetails;
  estimatedFare?: FareEstimate | number;
  driverDetails?: {
    driverName?: string;
    driverPhone?: string;
    driverVehiclePlate?: string;
    driverVehicleModel?: string;
  };
}): Record<string, string | number> {
  const { referenceId, searchDetails, selectedVehicle, passengerDetails, estimatedFare, driverDetails } = payload;

  let tripType = 'ONE WAY';
  if (searchDetails.serviceType === 'roundtrip') tripType = 'ROUND TRIP';
  else if (searchDetails.serviceType === 'local') tripType = 'LOCAL CITY';
  else if (searchDetails.serviceType === 'airport') tripType = 'AIRPORT TRANSFER';

  const pickupLocation = searchDetails.pickupLocation || 'Mysuru';
  const dropLocation = searchDetails.serviceType === 'local'
    ? 'Local City Package'
    : searchDetails.dropLocation || (searchDetails.airportTransferType === 'pickup' ? 'Mysuru' : 'Bangalore Airport');

  const validStops = (searchDetails.viaLocations || []).filter((s) => s && s.trim().length > 0);
  const viaStops = validStops.length > 0 ? validStops.join(' -> ') : 'None';

  const travelDate = searchDetails.pickupDate || searchDetails.travelDate || 'Today';
  const pickupTime = searchDetails.pickupTime || '07:00 AM';
  const returnDate = searchDetails.returnDate || '';
  const returnTime = searchDetails.returnTime || '';

  const fareNum = typeof estimatedFare === 'number'
    ? estimatedFare
    : Number(estimatedFare?.totalEstimatedFare || 0);
  const fareFormatted = fareNum > 0 ? fareNum.toLocaleString('en-IN') : 'To be confirmed';

  const distanceKm = typeof estimatedFare === 'object' && estimatedFare?.exactDistanceKm
    ? `${Math.round(estimatedFare.exactDistanceKm)} KM`
    : searchDetails.routeInfo?.distanceKm
    ? `${Math.round(searchDetails.routeInfo.distanceKm)} KM`
    : 'As per route';

  const durationStr = searchDetails.routeInfo?.durationText ||
    searchDetails.routeInfo?.durationFormatted ||
    (searchDetails.routeInfo?.durationMinutes ? `${Math.floor(searchDetails.routeInfo.durationMinutes / 60)} hr ${searchDetails.routeInfo.durationMinutes % 60} min` : 'Standard drive');

  const cleanCustPhone = (passengerDetails.mobileNumber || '').replace(/\D/g, '').slice(-10);

  return {
    reference_id: referenceId,
    trip_type: tripType,
    pickup_location: pickupLocation,
    drop_location: dropLocation,
    via_stops: viaStops,
    travel_date: travelDate,
    pickup_time: pickupTime,
    return_date: returnDate,
    return_time: returnTime,
    vehicle_name: selectedVehicle?.name || 'Fleet Cab',
    vehicle_category: selectedVehicle?.category || 'Standard',
    distance: distanceKm,
    duration: durationStr,
    estimated_fare: fareFormatted,
    customer_name: passengerDetails.fullName || 'Guest Customer',
    customer_phone: cleanCustPhone,
    customer_email: passengerDetails.email || '',
    special_instructions: passengerDetails.specialInstructions || passengerDetails.specialRequests || 'None',
    driver_name: driverDetails?.driverName || 'Assigned Chauffeur',
    driver_phone: driverDetails?.driverPhone || '',
    cab_plate: driverDetails?.driverVehiclePlate || 'Cab',
    cab_model: driverDetails?.driverVehicleModel || selectedVehicle?.name || 'Cab',
    fleet_phone: siteConfig.contact.phone || '+91 97407 54400',
    website_url: 'https://www.traveljust.in',
  };
}

/**
 * Returns realistic sample datasets for interactive preview in the template editor
 */
export function getSampleBookingPreview(type: 'oneway' | 'roundtrip' | 'airport' = 'oneway') {
  if (type === 'roundtrip') {
    return {
      reference_id: 'TJ-2609-9140',
      trip_type: 'ROUND TRIP',
      pickup_location: 'Vijayanagar 2nd Stage, Mysuru',
      drop_location: 'Ooty Botanical Gardens, Tamil Nadu',
      via_stops: 'Bandipur Tiger Reserve -> Gudalur',
      travel_date: '10 Oct 2026',
      pickup_time: '06:00 AM',
      return_date: '12 Oct 2026',
      return_time: '07:30 PM',
      vehicle_name: 'Toyota Innova Crysta',
      vehicle_category: 'Prime SUV',
      distance: '360 KM',
      duration: '4 hr 45 min each way',
      estimated_fare: '11,400',
      customer_name: 'Pooja Hegde',
      customer_phone: '9741029384',
      customer_email: 'pooja.hegde@infosys.com',
      special_instructions: 'Family trip with luggage carrier, child seat requested.',
      driver_name: 'Manjunath Swamy',
      driver_phone: '+91 94480 34129',
      cab_plate: 'KA-09-AA-2041',
      cab_model: 'Innova Crysta 2.4 VX',
      fleet_phone: '+91 97407 54400',
      website_url: 'https://www.traveljust.in',
    };
  }

  if (type === 'airport') {
    return {
      reference_id: 'TJ-2609-7731',
      trip_type: 'AIRPORT TRANSFER',
      pickup_location: 'Jayalakshmipuram, Mysuru',
      drop_location: 'Kempegowda International Airport (BLR), Bengaluru',
      via_stops: 'None (Express Highway Tollway)',
      travel_date: '05 Oct 2026',
      pickup_time: '03:30 AM',
      return_date: '',
      return_time: '',
      vehicle_name: 'Maruti Suzuki Dzire',
      vehicle_category: 'AC Sedan',
      distance: '185 KM',
      duration: '3 hr 15 min',
      estimated_fare: '3,850',
      customer_name: 'Suresh Menon',
      customer_phone: '9845211098',
      customer_email: 'suresh.menon@wipro.com',
      special_instructions: 'Early flight at 08:30 AM. Timely pickup is critical.',
      driver_name: 'Siddaraju M.',
      driver_phone: '+91 98801 54321',
      cab_plate: 'KA-09-B-7712',
      cab_model: 'Swift Dzire Tour',
      fleet_phone: '+91 97407 54400',
      website_url: 'https://www.traveljust.in',
    };
  }

  // Default One Way
  return {
    reference_id: 'TJ-2609-8812',
    trip_type: 'ONE WAY',
    pickup_location: 'Gokulam 3rd Stage, Mysuru',
    drop_location: 'Kempegowda International Airport (BLR), Bengaluru',
    via_stops: 'Mandya -> Channapatna',
    travel_date: '28 Sep 2026',
    pickup_time: '05:00 AM',
    return_date: '',
    return_time: '',
    vehicle_name: 'Toyota Innova Crysta',
    vehicle_category: 'Prime SUV',
    distance: '185 KM',
    duration: '3 hr 30 min',
    estimated_fare: '4,850',
    customer_name: 'Dr. Arvind Rao',
    customer_phone: '9845012345',
    customer_email: 'arvind.rao@gmail.com',
    special_instructions: 'Keep AC on throughout, trunk space needed for 3 large suitcases.',
    driver_name: 'Ramesh Kumar',
    driver_phone: '+91 98451 22341',
    cab_plate: 'KA-09-MC-8819',
    cab_model: 'Toyota Innova Crysta',
    fleet_phone: '+91 97407 54400',
    website_url: 'https://www.traveljust.in',
  };
}
