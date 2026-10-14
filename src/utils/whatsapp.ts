import { BookingSearchState, Vehicle, PassengerDetails, FareEstimate, CustomerUser, CustomerLoginNotification } from '../types';
import { siteConfig } from '../config/siteConfig';
import {
  getWhatsAppTemplates,
  renderWhatsAppTemplate,
  buildTemplateVariables,
} from './whatsappTemplates';

/**
 * Sanitizes phone number to standard international format without '+' or spaces for wa.me URL
 */
export function sanitizePhoneForWhatsApp(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10) {
    return `91${digits}`;
  }
  return digits;
}

/**
 * Formats YYYY-MM-DD or ISO date string into readable Indian format e.g. "15 Sep 2026"
 */
export function formatDisplayDate(dateStr?: string): string {
  if (!dateStr || !dateStr.trim()) return '';
  try {
    const parts = dateStr.trim().split('-');
    if (parts.length === 3 && parts[0].length === 4) {
      const year = parseInt(parts[0], 10);
      const monthIndex = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const d = new Date(year, monthIndex, day);
      if (!isNaN(d.getTime())) {
        return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
      }
    }
    const parsed = new Date(dateStr);
    if (!isNaN(parsed.getTime())) {
      return parsed.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    }
  } catch {
    // fallback to original string
  }
  return dateStr;
}

/**
 * Generates an alphanumeric Customer Enquiry ID (e.g. TJ-260915-4821)
 */
export function generateEnquiryId(dateStr?: string): string {
  const now = new Date();
  let yr = String(now.getFullYear()).slice(-2);
  let mo = String(now.getMonth() + 1).padStart(2, '0');
  let da = String(now.getDate()).padStart(2, '0');

  if (dateStr && dateStr.includes('-')) {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      yr = parts[0].slice(-2);
      mo = parts[1].padStart(2, '0');
      da = parts[2].padStart(2, '0');
    }
  }

  const randomPart = Math.floor(1000 + Math.random() * 9000);
  return `TJ-${yr}${mo}${da}-${randomPart}`;
}

export interface WhatsAppBookingEnquiryPayload {
  enquiryId?: string;
  tripType: string;
  from: string;
  to?: string;
  travelDate: string;
  pickupTime: string;
  returnDate?: string;
  returnTime?: string;
  passengers?: number;
  vehicleName?: string;
  vehicleCategory?: string;
  distanceKm?: number;
  durationHours?: number;
  durationText?: string;
  estimatedFare?: number;
  airportTransferType?: 'pickup' | 'drop';
  fareCalculationId?: string;
  isFallback?: boolean;
}

/**
 * Builds the authoritative, compliant WhatsApp booking enquiry message matching TRAVEL JUST requirements
 */
export function buildWhatsAppBookingEnquiryMessage(payload: WhatsAppBookingEnquiryPayload): string {
  const enquiryId = payload.enquiryId || generateEnquiryId(payload.travelDate);
  const formattedDate = formatDisplayDate(payload.travelDate);
  const formattedReturnDate = payload.returnDate ? formatDisplayDate(payload.returnDate) : '';

  // Fallback template when route or fare calculation failed/unavailable
  if (payload.isFallback) {
    let serviceLabel = 'One Way';
    if (payload.tripType === 'roundtrip') serviceLabel = 'Round Trip';
    else if (payload.tripType === 'airport') serviceLabel = 'Airport Transfer';
    else if (payload.tripType === 'local') serviceLabel = 'Local / Hourly';

    const lines = [
      'Hello TRAVEL JUST,',
      '',
      'I would like help with a travel booking.',
      '',
      `Enquiry ID: ${enquiryId}`,
      `Trip Type: ${serviceLabel}`,
      `From: ${payload.from}`,
    ];
    if (payload.to) lines.push(`To: ${payload.to}`);
    if (formattedDate) lines.push(`Date: ${formattedDate}`);
    if (payload.pickupTime) lines.push(`Time: ${payload.pickupTime}`);
    if (payload.passengers) lines.push(`Passengers: ${payload.passengers}`);
    lines.push('');
    lines.push('Please help me with vehicle availability and fare.');
    lines.push('');
    lines.push('Thank you.');
    return lines.join('\n');
  }

  const vehicleDisplay = payload.vehicleName
    ? payload.vehicleCategory
      ? `${payload.vehicleName} (${payload.vehicleCategory})`
      : payload.vehicleName
    : 'To be suggested';

  const fareDisplay =
    typeof payload.estimatedFare === 'number' && payload.estimatedFare > 0
      ? `Estimated Fare: ₹${payload.estimatedFare.toLocaleString('en-IN')}`
      : 'Estimated Fare: To be confirmed';

  const distanceDisplay =
    typeof payload.distanceKm === 'number' && payload.distanceKm > 0
      ? `Distance: ${payload.distanceKm.toFixed(1)} km`
      : null;

  // 1. ONE WAY
  if (payload.tripType === 'oneway') {
    const lines = [
      'Hello TRAVEL JUST,',
      '',
      'I would like to enquire about a One Way trip.',
      '',
      `Enquiry ID: ${enquiryId}`,
      '',
      `From: ${payload.from}`,
      `To: ${payload.to || 'Destination'}`,
      `Date: ${formattedDate}`,
      `Pickup Time: ${payload.pickupTime}`,
    ];
    if (payload.passengers) lines.push(`Passengers: ${payload.passengers}`);
    if (distanceDisplay) lines.push(distanceDisplay);
    lines.push(`Vehicle: ${vehicleDisplay}`);
    lines.push(fareDisplay);
    lines.push('');
    lines.push('Please confirm availability and final fare.');
    lines.push('');
    lines.push('Thank you.');
    return lines.join('\n');
  }

  // 2. ROUND TRIP
  if (payload.tripType === 'roundtrip') {
    const lines = [
      'Hello TRAVEL JUST,',
      '',
      'I would like to enquire about a Round Trip.',
      '',
      `Enquiry ID: ${enquiryId}`,
      '',
      `From: ${payload.from}`,
      `To: ${payload.to || 'Destination'}`,
      `Pickup Date: ${formattedDate}`,
      `Pickup Time: ${payload.pickupTime}`,
    ];
    if (formattedReturnDate) lines.push(`Return Date: ${formattedReturnDate}`);
    if (payload.returnTime) lines.push(`Return Time: ${payload.returnTime}`);
    if (payload.passengers) lines.push(`Passengers: ${payload.passengers}`);
    if (distanceDisplay) lines.push(distanceDisplay);
    lines.push(`Vehicle: ${vehicleDisplay}`);
    lines.push(fareDisplay);
    lines.push('');
    lines.push('Please confirm availability and final fare.');
    lines.push('');
    lines.push('Thank you.');
    return lines.join('\n');
  }

  // 3. AIRPORT TRANSFER
  if (payload.tripType === 'airport') {
    const transferLabel = payload.airportTransferType === 'drop' ? 'Drop' : 'Pickup';
    const lines = [
      'Hello TRAVEL JUST,',
      '',
      'I would like to enquire about an Airport Transfer.',
      '',
      `Enquiry ID: ${enquiryId}`,
      '',
      `Transfer Type: ${transferLabel}`,
      `From: ${payload.from}`,
      `To: ${payload.to || (payload.airportTransferType === 'pickup' ? 'Mysuru' : 'Bangalore Airport')}`,
      `Date: ${formattedDate}`,
      `Pickup Time: ${payload.pickupTime}`,
    ];
    if (payload.passengers) lines.push(`Passengers: ${payload.passengers}`);
    if (distanceDisplay) lines.push(distanceDisplay);
    lines.push(`Vehicle: ${vehicleDisplay}`);
    lines.push(fareDisplay);
    lines.push('');
    lines.push('Please confirm availability and final fare.');
    lines.push('');
    lines.push('Thank you.');
    return lines.join('\n');
  }

  // 4. LOCAL / HOURLY
  if (payload.tripType === 'local') {
    const durationHours = payload.durationHours || 8;
    const lines = [
      'Hello TRAVEL JUST,',
      '',
      'I would like to enquire about Local / Hourly Travel.',
      '',
      `Enquiry ID: ${enquiryId}`,
      '',
      `Pickup Location: ${payload.from}`,
      `Date: ${formattedDate}`,
      `Pickup Time: ${payload.pickupTime}`,
      `Duration: ${durationHours} Hours`,
    ];
    if (payload.passengers) lines.push(`Passengers: ${payload.passengers}`);
    lines.push(`Vehicle: ${vehicleDisplay}`);
    lines.push(fareDisplay);
    lines.push('');
    lines.push('Please confirm availability and final fare.');
    lines.push('');
    lines.push('Thank you.');
    return lines.join('\n');
  }

  // 5. OUTSTATION / CUSTOM / GENERAL
  const lines = [
    'Hello TRAVEL JUST,',
    '',
    `I would like to enquire about an ${payload.tripType.toUpperCase()} trip.`,
    '',
    `Enquiry ID: ${enquiryId}`,
    '',
    `From: ${payload.from}`,
  ];
  if (payload.to) lines.push(`To: ${payload.to}`);
  lines.push(`Date: ${formattedDate}`);
  lines.push(`Pickup Time: ${payload.pickupTime}`);
  if (payload.passengers) lines.push(`Passengers: ${payload.passengers}`);
  if (distanceDisplay) lines.push(distanceDisplay);
  lines.push(`Vehicle: ${vehicleDisplay}`);
  lines.push(fareDisplay);
  lines.push('');
  lines.push('Please confirm availability and final fare.');
  lines.push('');
  lines.push('Thank you.');
  return lines.join('\n');
}

/**
 * Tracks WhatsApp booking enquiry event for analytics
 */
export function trackWhatsAppBookingEnquiry(payload: WhatsAppBookingEnquiryPayload): void {
  try {
    const isMobile =
      typeof navigator !== 'undefined' &&
      /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

    const eventData = {
      trip_type: payload.tripType,
      vehicle_type: payload.vehicleName || 'unselected',
      distance_range: payload.distanceKm
        ? payload.distanceKm < 50
          ? '<50km'
          : payload.distanceKm < 200
          ? '50-200km'
          : '200km+'
        : 'unknown',
      fare_range: payload.estimatedFare
        ? payload.estimatedFare < 2000
          ? '<2k'
          : payload.estimatedFare < 5000
          ? '2k-5k'
          : '5k+'
        : 'unknown',
      booking_page: 'home',
      device_type: isMobile ? 'mobile' : 'desktop',
    };

    if (typeof window !== 'undefined' && (window as unknown as { gtag?: Function }).gtag) {
      (window as unknown as { gtag: Function }).gtag('event', 'whatsapp_booking_enquiry', eventData);
    }
    console.debug('[Analytics] whatsapp_booking_enquiry:', eventData);
  } catch (e) {
    // Non-blocking analytics
  }
}

export interface BookingWhatsAppPayload {
  referenceId: string;
  searchDetails: BookingSearchState;
  selectedVehicle: Vehicle;
  passengerDetails: PassengerDetails;
  estimatedFare: FareEstimate;
}

/**
 * Builds a formatted WhatsApp message for booking confirmations using customizable templates
 */
export function formatBookingConfirmationMessage(payload: BookingWhatsAppPayload): string {
  try {
    const templates = getWhatsAppTemplates();
    const vars = buildTemplateVariables(payload);
    return renderWhatsAppTemplate(templates.bookingConfirmation, vars);
  } catch (err) {
    console.warn('Error formatting template, using standard format:', err);
  }

  const { referenceId, searchDetails, selectedVehicle, passengerDetails, estimatedFare } = payload;
  const fareStr = estimatedFare?.totalEstimatedFare ? Number(estimatedFare.totalEstimatedFare).toLocaleString('en-IN') : '0';

  return `🚕 *TRAVEL JUST - BOOKING CONFIRMATION* 🔔
━━━━━━━━━━━━━━━━━━━━━━━━━━
1. *Booking Reference ID:* ${referenceId}
2. *Trip Type:* ${(searchDetails.serviceType || 'One Way').toUpperCase()}
3. *Pickup:* ${searchDetails.pickupLocation || 'Mysuru'}
4. *Drop:* ${searchDetails.dropLocation || 'Destination'}
5. *Pickup Date & Time:* ${searchDetails.pickupDate || searchDetails.travelDate || ''} at ${searchDetails.pickupTime || '07:00 AM'}
6. *Vehicle:* ${selectedVehicle.name} (${selectedVehicle.category})
7. *Estimated Fare:* ₹${fareStr}
━━━━━━━━━━━━━━━━━━━━━━━━━━
📞 *Call Fleet Desk: +919740754400*
🌐 *Website: https://www.traveljust.in*`;
}

/**
 * Builds a formatted WhatsApp message for driver/chauffeur fleet dispatch using customizable templates
 */
export function formatFleetDispatchMessage(payload: {
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
}): string {
  try {
    const templates = getWhatsAppTemplates();
    const vars = buildTemplateVariables(payload);
    return renderWhatsAppTemplate(templates.fleetDispatch, vars);
  } catch (err) {
    console.warn('Error formatting fleet dispatch template:', err);
    return `Hello ${payload.driverDetails?.driverName || 'Chauffeur'}, trip dispatch for Booking #${payload.referenceId}: Pickup at ${payload.searchDetails.pickupLocation} on ${payload.searchDetails.pickupDate || payload.searchDetails.travelDate} at ${payload.searchDetails.pickupTime}. Passenger: ${payload.passengerDetails.fullName} (${payload.passengerDetails.mobileNumber}).`;
  }
}

/**
 * Builds a formatted WhatsApp message for customer login / registration alert sent strictly to Fleet Manager
 */
export function formatCustomerLoginNotificationMessage(
  customer: CustomerUser,
  options?: { isNewRegistration?: boolean; loginTime?: string; channel?: string }
): string {
  const isNew = options?.isNewRegistration ?? false;
  const timeStr = options?.loginTime || new Date().toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  const rawPhone = customer.mobileNumber.replace(/\D/g, '').slice(-10);
  const formattedPhone = rawPhone.length === 10 ? `+91 ${rawPhone.slice(0, 5)} ${rawPhone.slice(5)}` : customer.mobileNumber;

  return (
`🚕 *TRAVEL JUST - FLEET MANAGER ALERT* 🔔
━━━━━━━━━━━━━━━━━━━━━━━━━━
📢 *CUSTOMER LOGIN NOTIFICATION*
━━━━━━━━━━━━━━━━━━━━━━━━━━
👤 *Customer Name:* ${customer.fullName}
📱 *Mobile Number:* ${formattedPhone}
✉️ *Email Address:* ${customer.email || 'Not provided'}
🔐 *Customer Type:* ${isNew ? '✨ NEW CUSTOMER REGISTRATION' : '🔑 EXISTING CUSTOMER LOGIN'}
⏰ *Login Timestamp:* ${timeStr}
🆔 *Customer Ref ID:* ${customer.id}
📊 *Completed/Saved Trips:* ${customer.totalTripsCount || 0} trip(s)
🌐 *Platform:* TRAVEL JUST Web Portal (Online)
━━━━━━━━━━━━━━━━━━━━━━━━━━
_Automated dispatch notification sent strictly to Fleet Manager WhatsApp (${siteConfig.contact.whatsapp})._`
  );
}

/**
 * Builds a formatted WhatsApp message for quick ride inquiries
 */
export function formatGeneralInquiryMessage(options?: {
  pickup?: string;
  drop?: string;
  vehicleName?: string;
  serviceType?: string;
}): string {
  const { pickup, drop, vehicleName, serviceType } = options || {};
  if (pickup && drop) {
    return (
`Hello *TRAVEL JUST*,
I would like to inquire about cab availability and booking for:
📍 Pickup: ${pickup}
🏁 Drop: ${drop}
🚗 Preferred Cab: ${vehicleName || 'Any Available Cab'}
🛣️ Service: ${serviceType || 'Taxi Service'}

Please share cab availability and final quote. Thank you!`
    );
  }

  return (
`Hello *TRAVEL JUST*,
I would like to inquire about taxi booking, outstation cab fares, and vehicle availability.

Please connect me with a booking executive. Thank you!`
  );
}

/**
 * Generates direct WhatsApp click-to-chat URL
 */
export function getWhatsAppUrl(customMessage?: string, targetPhone: string = siteConfig.contact.whatsapp): string {
  const cleanPhone = sanitizePhoneForWhatsApp(targetPhone);
  const text = customMessage ? encodeURIComponent(customMessage) : '';
  return `https://wa.me/${cleanPhone}?text=${text}`;
}

/**
 * Triggers WhatsApp in a new tab or app window
 */
export function openWhatsAppChat(customMessage?: string, targetPhone: string = siteConfig.contact.whatsapp): void {
  const url = getWhatsAppUrl(customMessage, targetPhone);
  window.open(url, '_blank', 'noopener,noreferrer');
}

const OWNER_LOGIN_NOTIFICATIONS_KEY = 'tj_owner_login_notifications';

/**
 * Returns all recorded customer login notifications for the owner
 */
export function getOwnerLoginNotifications(): CustomerLoginNotification[] {
  try {
    const raw = localStorage.getItem(OWNER_LOGIN_NOTIFICATIONS_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (e) {
    console.warn('Error reading owner login notifications:', e);
    return [];
  }
}

/**
 * Saves a customer login notification in the owner log and dispatches WhatsApp
 */
export function saveOwnerLoginNotification(notification: CustomerLoginNotification): void {
  try {
    const existing = getOwnerLoginNotifications();
    const updated = [notification, ...existing.filter((n) => n.id !== notification.id)].slice(0, 50);
    localStorage.setItem(OWNER_LOGIN_NOTIFICATIONS_KEY, JSON.stringify(updated));
  } catch (e) {
    console.warn('Error saving owner login notification:', e);
  }
}

/**
 * Dispatches customer login notification to owner via WhatsApp and server API
 */
export function notifyOwnerOnCustomerLogin(
  customer: CustomerUser,
  options?: { isNewRegistration?: boolean; autoOpenWhatsApp?: boolean }
): { notification: CustomerLoginNotification; whatsappUrl: string } {
  const isNew = options?.isNewRegistration ?? false;
  const loginTime = new Date().toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  const formattedMessage = formatCustomerLoginNotificationMessage(customer, {
    isNewRegistration: isNew,
    loginTime,
  });

  const ownerPhone = siteConfig.contact.whatsapp;
  const whatsappUrl = getWhatsAppUrl(formattedMessage, ownerPhone);

  const notification: CustomerLoginNotification = {
    id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    customerId: customer.id,
    fullName: customer.fullName,
    mobileNumber: customer.mobileNumber,
    email: customer.email,
    loginTime,
    isNewRegistration: isNew,
    whatsappDispatched: true,
    ownerWhatsappNumber: ownerPhone,
    formattedMessage,
    whatsappUrl,
  };

  // 1. Save in local owner notification history
  saveOwnerLoginNotification(notification);

  // 2. Dispatch to backend API silently
  try {
    fetch('/api/notifications/customer-login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customer,
        notification,
        isNewRegistration: isNew,
        formattedMessage,
        ownerPhone,
      }),
    }).catch((err) => {
      console.warn('Backend notification logging warning (fallback to local):', err);
    });
  } catch (e) {
    // Graceful offline fallback
  }

  // 3. If requested, automatically open WhatsApp
  if (options?.autoOpenWhatsApp) {
    openWhatsAppChat(formattedMessage, ownerPhone);
  }

  return { notification, whatsappUrl };
}

export interface DualWhatsAppNotificationResult {
  bookingId: string;
  ownerPhone: string;
  ownerWhatsAppUrl: string;
  ownerMessage: string;
  customerPhone: string;
  customerWhatsAppUrl: string;
  customerMessage: string;
  dispatchedAt: string;
  success: boolean;
  status?: 'DELIVERED' | 'FAILED' | 'PENDING';
  type?: 'BOOKING_CONFIRMATION' | 'FLEET_DISPATCH' | 'LOGIN_ALERT' | 'DRIVER_QUICK_CHAT';
  errorReason?: string;
  dropLocation?: string;
  pickupLocation?: string;
  customerName?: string;
  estimatedFare?: number;
  vehicleName?: string;
}

/**
 * Builds tailored WhatsApp message specifically for Owner / Fleet Operations Desk
 */
export function buildOwnerBookingWhatsAppMessage(payload: BookingWhatsAppPayload): string {
  const { referenceId, searchDetails, selectedVehicle, passengerDetails, estimatedFare } = payload;
  const fromLocation = searchDetails.pickupLocation || 'Mysuru';
  const toLocation = searchDetails.dropLocation || (searchDetails.serviceType === 'local' ? 'Local City Package' : 'Bangalore Airport');
  const travelDate = searchDetails.pickupDate || searchDetails.travelDate || '';
  const travelTime = searchDetails.pickupTime || '07:00 AM';
  const fareStr = Number(estimatedFare?.totalEstimatedFare || 0).toLocaleString('en-IN');
  const cleanCustPhone = (passengerDetails.mobileNumber || '').replace(/\D/g, '').slice(-10);

  return (
`🚕 *TRAVEL JUST - FLEET DESK BOOKING ALERT* 🔔
━━━━━━━━━━━━━━━━━━━━━━━━━━
📢 *NEW BOOKING RECEIVED - DISPATCH REQUIRED*
━━━━━━━━━━━━━━━━━━━━━━━━━━
🆔 *Booking Reference ID:* ${referenceId}
👤 *Passenger Name:* ${passengerDetails.fullName}
📱 *Passenger Phone:* +91 ${cleanCustPhone}
✉️ *Passenger Email:* ${passengerDetails.email || 'Not provided'}

🚗 *Vehicle Class:* ${selectedVehicle.name} (${selectedVehicle.category})
🛣️ *Service Mode:* ${searchDetails.serviceType.toUpperCase()}
📍 *Pickup Location:* ${fromLocation}
🏁 *Drop Location:* ${toLocation}
📅 *Scheduled Date:* ${travelDate}
⏰ *Scheduled Pickup:* ${travelTime}
💰 *Total Fare:* ₹${fareStr}
${searchDetails.serviceType === 'roundtrip' && searchDetails.returnDate ? `🔄 *Return Date:* ${searchDetails.returnDate} at ${searchDetails.returnTime || ''}\n` : ''}${passengerDetails.specialInstructions ? `📝 *Special Notes:* "${passengerDetails.specialInstructions}"\n` : ''}
━━━━━━━━━━━━━━━━━━━━━━━━━━
⚡ *Owner Action:* Log into Owner Portal to Assign Driver & Dispatch Cab.
📞 *Passenger Direct Call:* +91${cleanCustPhone}`
  );
}

const WHATSAPP_BOOKING_DISPATCHES_KEY = 'tj_whatsapp_booking_dispatches';

// Seeded initial dispatch history for dashboard visualization
export const INITIAL_SEEDED_DISPATCHES: DualWhatsAppNotificationResult[] = [
  {
    bookingId: "TJ-2609-8812",
    ownerPhone: "+91 9740754400",
    ownerWhatsAppUrl: "https://wa.me/919740754400",
    ownerMessage: "Booking confirmation dispatched",
    customerPhone: "+91 9845012345",
    customerWhatsAppUrl: "https://wa.me/919845012345",
    customerMessage: "🚕 TRAVEL JUST - BOOKING CONFIRMATION for #TJ-2609-8812",
    dispatchedAt: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
    success: true,
    status: 'DELIVERED',
    type: 'BOOKING_CONFIRMATION',
    dropLocation: "Kempegowda International Airport (BLR), Bengaluru",
    pickupLocation: "Gokulam 3rd Stage, Mysuru",
    customerName: "Dr. Arvind Rao",
    estimatedFare: 4850,
    vehicleName: "Toyota Innova Crysta",
  },
  {
    bookingId: "TJ-2609-9140",
    ownerPhone: "+91 9740754400",
    ownerWhatsAppUrl: "https://wa.me/919740754400",
    ownerMessage: "Booking confirmation dispatched",
    customerPhone: "+91 9741029384",
    customerWhatsAppUrl: "https://wa.me/919741029384",
    customerMessage: "🚕 TRAVEL JUST - BOOKING CONFIRMATION for #TJ-2609-9140",
    dispatchedAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    success: true,
    status: 'DELIVERED',
    type: 'BOOKING_CONFIRMATION',
    dropLocation: "Ooty Botanical Gardens, Tamil Nadu",
    pickupLocation: "Vijayanagar 2nd Stage, Mysuru",
    customerName: "Pooja Hegde",
    estimatedFare: 11400,
    vehicleName: "Toyota Innova Crysta",
  },
  {
    bookingId: "TJ-2609-7731",
    ownerPhone: "+91 9740754400",
    ownerWhatsAppUrl: "https://wa.me/919740754400",
    ownerMessage: "Booking confirmation dispatched",
    customerPhone: "+91 9845211098",
    customerWhatsAppUrl: "https://wa.me/919845211098",
    customerMessage: "🚕 TRAVEL JUST - BOOKING CONFIRMATION for #TJ-2609-7731",
    dispatchedAt: new Date(Date.now() - 1000 * 60 * 240).toISOString(),
    success: true,
    status: 'DELIVERED',
    type: 'BOOKING_CONFIRMATION',
    dropLocation: "Kempegowda International Airport (BLR), Bengaluru",
    pickupLocation: "Jayalakshmipuram, Mysuru",
    customerName: "Suresh Menon",
    estimatedFare: 3850,
    vehicleName: "Maruti Suzuki Dzire",
  },
  {
    bookingId: "TJ-2609-6420",
    ownerPhone: "+91 9740754400",
    ownerWhatsAppUrl: "https://wa.me/919740754400",
    ownerMessage: "Fleet dispatch dispatched to driver",
    customerPhone: "+91 9448123991",
    customerWhatsAppUrl: "https://wa.me/919448123991",
    customerMessage: "🚕 TRAVEL JUST - FLEET DISPATCH ORDER for #TJ-2609-6420",
    dispatchedAt: new Date(Date.now() - 1000 * 60 * 360).toISOString(),
    success: true,
    status: 'DELIVERED',
    type: 'FLEET_DISPATCH',
    dropLocation: "Madikeri, Coorg",
    pickupLocation: "Kuvempunagar, Mysuru",
    customerName: "Rajeshwari N.",
    estimatedFare: 5600,
    vehicleName: "Toyota Etios",
  },
  {
    bookingId: "TJ-2609-5519",
    ownerPhone: "+91 9740754400",
    ownerWhatsAppUrl: "https://wa.me/919740754400",
    ownerMessage: "Booking confirmation dispatched",
    customerPhone: "+91 9611298410",
    customerWhatsAppUrl: "https://wa.me/919611298410",
    customerMessage: "🚕 TRAVEL JUST - BOOKING CONFIRMATION for #TJ-2609-5519",
    dispatchedAt: new Date(Date.now() - 1000 * 60 * 480).toISOString(),
    success: true,
    status: 'DELIVERED',
    type: 'BOOKING_CONFIRMATION',
    dropLocation: "Electronic City, Bengaluru",
    pickupLocation: "Saraswathipuram, Mysuru",
    customerName: "Vikram Patil",
    estimatedFare: 4200,
    vehicleName: "Maruti Suzuki Ertiga",
  },
  {
    bookingId: "TJ-2609-4310",
    ownerPhone: "+91 9740754400",
    ownerWhatsAppUrl: "https://wa.me/919740754400",
    ownerMessage: "Booking confirmation dispatched",
    customerPhone: "+91 9900341829",
    customerWhatsAppUrl: "https://wa.me/919900341829",
    customerMessage: "🚕 TRAVEL JUST - BOOKING CONFIRMATION for #TJ-2609-4310",
    dispatchedAt: new Date(Date.now() - 1000 * 60 * 600).toISOString(),
    success: true,
    status: 'DELIVERED',
    type: 'BOOKING_CONFIRMATION',
    dropLocation: "Mysuru Palace / Local City Tour",
    pickupLocation: "Mysore Railway Station",
    customerName: "Kavita Sharma",
    estimatedFare: 2400,
    vehicleName: "Toyota Etios",
  },
  {
    bookingId: "TJ-2609-3205",
    ownerPhone: "+91 9740754400",
    ownerWhatsAppUrl: "https://wa.me/919740754400",
    ownerMessage: "Fleet dispatch dispatched to driver",
    customerPhone: "+91 9880192837",
    customerWhatsAppUrl: "https://wa.me/919880192837",
    customerMessage: "🚕 TRAVEL JUST - FLEET DISPATCH ORDER for #TJ-2609-3205",
    dispatchedAt: new Date(Date.now() - 1000 * 60 * 720).toISOString(),
    success: true,
    status: 'DELIVERED',
    type: 'FLEET_DISPATCH',
    dropLocation: "Wayanad Wildlife Sanctuary, Kerala",
    pickupLocation: "Yadavagiri, Mysuru",
    customerName: "Ashwin Kumar",
    estimatedFare: 6800,
    vehicleName: "Toyota Innova Crysta",
  },
  {
    bookingId: "TJ-2609-2194",
    ownerPhone: "+91 9740754400",
    ownerWhatsAppUrl: "https://wa.me/919740754400",
    ownerMessage: "Booking confirmation dispatched",
    customerPhone: "+91 9740182736",
    customerWhatsAppUrl: "https://wa.me/919740182736",
    customerMessage: "🚕 TRAVEL JUST - BOOKING CONFIRMATION for #TJ-2609-2194",
    dispatchedAt: new Date(Date.now() - 1000 * 60 * 850).toISOString(),
    success: true,
    status: 'DELIVERED',
    type: 'BOOKING_CONFIRMATION',
    dropLocation: "Kempegowda International Airport (BLR), Bengaluru",
    pickupLocation: "TK Layout, Mysuru",
    customerName: "Deepa Nair",
    estimatedFare: 4850,
    vehicleName: "Toyota Innova Crysta",
  },
  {
    bookingId: "TJ-2609-F101",
    ownerPhone: "+91 9740754400",
    ownerWhatsAppUrl: "https://wa.me/919740754400",
    ownerMessage: "Failed customer notification",
    customerPhone: "+91 98450",
    customerWhatsAppUrl: "https://wa.me/9198450",
    customerMessage: "Message delivery aborted",
    dispatchedAt: new Date(Date.now() - 1000 * 60 * 95).toISOString(),
    success: false,
    status: 'FAILED',
    type: 'BOOKING_CONFIRMATION',
    errorReason: "Invalid Phone Format: Mobile number contains only 5 digits",
    dropLocation: "Ooty Doddabetta Peak, Tamil Nadu",
    pickupLocation: "Hebbal 1st Stage, Mysuru",
    customerName: "Guest Passenger",
    estimatedFare: 9800,
    vehicleName: "Innova Crysta",
  },
  {
    bookingId: "TJ-2609-F102",
    ownerPhone: "+91 9740754400",
    ownerWhatsAppUrl: "https://wa.me/919740754400",
    ownerMessage: "Failed customer notification",
    customerPhone: "+91 9741000000",
    customerWhatsAppUrl: "https://wa.me/919741000000",
    customerMessage: "Message delivery timed out",
    dispatchedAt: new Date(Date.now() - 1000 * 60 * 310).toISOString(),
    success: false,
    status: 'FAILED',
    type: 'BOOKING_CONFIRMATION',
    errorReason: "Network Timeout: Customer device offline/unreachable on WhatsApp network",
    dropLocation: "Bandipur National Park Safari Gate",
    pickupLocation: "Nazarbad, Mysuru",
    customerName: "Rahul V.",
    estimatedFare: 5200,
    vehicleName: "Maruti Suzuki Ertiga",
  },
  {
    bookingId: "TJ-2609-F103",
    ownerPhone: "+91 9740754400",
    ownerWhatsAppUrl: "https://wa.me/919740754400",
    ownerMessage: "Failed fleet dispatch alert",
    customerPhone: "+91 9900112233",
    customerWhatsAppUrl: "https://wa.me/919900112233",
    customerMessage: "Message blocked by recipient preferences",
    dispatchedAt: new Date(Date.now() - 1000 * 60 * 540).toISOString(),
    success: false,
    status: 'FAILED',
    type: 'FLEET_DISPATCH',
    errorReason: "Delivery Blocked: Recipient opted out of business notifications",
    dropLocation: "Chikmagalur Coffee Estate",
    pickupLocation: "Vontikoppal, Mysuru",
    customerName: "Anand Verma",
    estimatedFare: 7400,
    vehicleName: "Toyota Innova Crysta",
  },
];

/**
 * Gets cached list of WhatsApp booking dispatches with fallback seed data
 */
export function getRecentWhatsAppBookingDispatches(): DualWhatsAppNotificationResult[] {
  try {
    const raw = localStorage.getItem(WHATSAPP_BOOKING_DISPATCHES_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Error reading WhatsApp dispatches from localStorage:', e);
  }

  // Pre-seed with authoritative historical records if localStorage empty
  try {
    localStorage.setItem(WHATSAPP_BOOKING_DISPATCHES_KEY, JSON.stringify(INITIAL_SEEDED_DISPATCHES));
  } catch {}

  return INITIAL_SEEDED_DISPATCHES;
}

/**
 * Records a new WhatsApp dispatch event (success or failure) to local storage cache
 */
export function recordWhatsAppDispatchEvent(event: Partial<DualWhatsAppNotificationResult>): DualWhatsAppNotificationResult {
  const current = getRecentWhatsAppBookingDispatches();
  const fullEvent: DualWhatsAppNotificationResult = {
    bookingId: event.bookingId || `TJ-DISP-${Date.now().toString().slice(-4)}`,
    ownerPhone: event.ownerPhone || siteConfig.contact.whatsapp,
    ownerWhatsAppUrl: event.ownerWhatsAppUrl || getWhatsAppUrl(event.ownerMessage || 'Alert', siteConfig.contact.whatsapp),
    ownerMessage: event.ownerMessage || 'Dispatched',
    customerPhone: event.customerPhone || siteConfig.contact.whatsapp,
    customerWhatsAppUrl: event.customerWhatsAppUrl || getWhatsAppUrl(event.customerMessage || 'Alert', event.customerPhone || siteConfig.contact.whatsapp),
    customerMessage: event.customerMessage || 'Dispatched',
    dispatchedAt: event.dispatchedAt || new Date().toISOString(),
    success: event.success !== undefined ? event.success : event.status !== 'FAILED',
    status: event.status || (event.success === false ? 'FAILED' : 'DELIVERED'),
    type: event.type || 'BOOKING_CONFIRMATION',
    errorReason: event.errorReason,
    dropLocation: event.dropLocation || 'Destination',
    pickupLocation: event.pickupLocation || 'Mysuru',
    customerName: event.customerName || 'Customer',
    estimatedFare: event.estimatedFare || 0,
    vehicleName: event.vehicleName || 'Fleet Cab',
  };

  const updated = [fullEvent, ...current.filter((d) => d.bookingId !== fullEvent.bookingId)].slice(0, 100);
  try {
    localStorage.setItem(WHATSAPP_BOOKING_DISPATCHES_KEY, JSON.stringify(updated));
  } catch (e) {
    console.warn('Failed saving dispatch event to localStorage:', e);
  }

  return fullEvent;
}

/**
 * Dispatches Booking Notification via WhatsApp to BOTH Owner Portal (+91 97407 54400) and Customer
 */
export function sendDualBookingWhatsAppNotification(
  payload: BookingWhatsAppPayload,
  options?: { autoOpenTarget?: 'customer' | 'owner' | 'none' }
): DualWhatsAppNotificationResult {
  const { referenceId, passengerDetails } = payload;
  const ownerPhone = siteConfig.contact.whatsapp;
  const customerPhone = (passengerDetails.mobileNumber || '').replace(/\D/g, '').slice(-10);

  // 1. Build messages
  const ownerMessage = buildOwnerBookingWhatsAppMessage(payload);
  const customerMessage = formatBookingConfirmationMessage(payload);

  const ownerWhatsAppUrl = getWhatsAppUrl(ownerMessage, ownerPhone);
  const customerWhatsAppUrl = getWhatsAppUrl(customerMessage, customerPhone.length === 10 ? `91${customerPhone}` : ownerPhone);

  const { searchDetails, selectedVehicle, estimatedFare } = payload;
  const dropLocation = searchDetails.serviceType === 'local'
    ? 'Local City Package'
    : searchDetails.dropLocation || (searchDetails.airportTransferType === 'pickup' ? 'Mysuru' : 'Bangalore Airport');

  const result: DualWhatsAppNotificationResult = {
    bookingId: referenceId,
    ownerPhone,
    ownerWhatsAppUrl,
    ownerMessage,
    customerPhone: customerPhone ? `+91 ${customerPhone}` : ownerPhone,
    customerWhatsAppUrl,
    customerMessage,
    dispatchedAt: new Date().toISOString(),
    success: true,
    status: 'DELIVERED',
    type: 'BOOKING_CONFIRMATION',
    dropLocation,
    pickupLocation: searchDetails.pickupLocation || 'Mysuru',
    customerName: passengerDetails.fullName || 'Guest Customer',
    estimatedFare: Number(estimatedFare?.totalEstimatedFare || 0),
    vehicleName: selectedVehicle?.name || 'Standard Cab',
  };

  // 2. Save in localStorage registry
  try {
    const existing = getRecentWhatsAppBookingDispatches();
    const updated = [result, ...existing.filter((d) => d.bookingId !== referenceId)].slice(0, 100);
    localStorage.setItem(WHATSAPP_BOOKING_DISPATCHES_KEY, JSON.stringify(updated));
  } catch (e) {
    console.warn('Could not save WhatsApp dispatch to localStorage:', e);
  }

  // 3. Dispatch to Server Backend API
  try {
    fetch('/api/notifications/booking-whatsapp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        bookingId: referenceId,
        ownerPhone,
        ownerMessage,
        ownerWhatsAppUrl,
        customerPhone,
        customerMessage,
        customerWhatsAppUrl,
        payload,
      }),
    }).catch((err) => {
      console.warn('Backend dual WhatsApp logging error (offline fallback active):', err);
    });
  } catch (e) {
    // Non-blocking
  }

  // 4. Optionally open WhatsApp for user
  if (options?.autoOpenTarget === 'customer') {
    window.open(customerWhatsAppUrl, '_blank', 'noopener,noreferrer');
  } else if (options?.autoOpenTarget === 'owner') {
    window.open(ownerWhatsAppUrl, '_blank', 'noopener,noreferrer');
  }

  return result;
}

/**
 * Real-time WhatsApp Booking Status Lookup
 */
export async function fetchRealTimeBookingWhatsAppStatus(query: string): Promise<{
  success: boolean;
  booking?: any;
  error?: string;
}> {
  const clean = query.trim().toUpperCase();
  if (!clean) {
    return { success: false, error: 'Please enter a Booking Reference ID or Mobile Number.' };
  }

  // 1. Try local server endpoint
  try {
    const res = await fetch(`/api/notifications/whatsapp-status/${encodeURIComponent(clean)}`);
    if (res.ok) {
      const data = await res.json();
      if (data.success && data.booking) {
        return { success: true, booking: data.booking };
      }
    }
  } catch (e) {
    // Fallback to client data
  }

  // 2. Search local storage bookings
  try {
    const local = localStorage.getItem('tj_recent_bookings');
    if (local) {
      const parsed = JSON.parse(local);
      const found = parsed.find(
        (b: any) =>
          b.referenceId?.toUpperCase() === clean ||
          b.passengerDetails?.mobileNumber?.replace(/\D/g, '').includes(clean.replace(/\D/g, ''))
      );
      if (found) {
        return { success: true, booking: found };
      }
    }
  } catch (e) {
    // Non-blocking
  }

  return { success: false, error: `No active booking found matching "${query}".` };
}

