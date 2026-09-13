import { BookingSearchState, Vehicle, PassengerDetails, FareEstimate, CustomerUser, CustomerLoginNotification } from '../types';
import { siteConfig } from '../config/siteConfig';

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
 * Builds a formatted WhatsApp message for booking confirmations and dispatch communication
 */
export function formatBookingConfirmationMessage(payload: BookingWhatsAppPayload): string {
  const { referenceId, searchDetails, selectedVehicle, passengerDetails, estimatedFare } = payload;

  let tripTypeFormatted = 'ONE WAY';
  if (searchDetails.serviceType === 'roundtrip') {
    tripTypeFormatted = 'ROUND TRIP';
  } else if (searchDetails.serviceType === 'local') {
    tripTypeFormatted = 'LOCAL';
  } else if (searchDetails.serviceType === 'airport') {
    tripTypeFormatted = 'AIRPORT';
  }

  const fromLocation = searchDetails.pickupLocation || 'Mysuru';
  const toLocation =
    searchDetails.serviceType === 'local'
      ? 'Local City Coverage'
      : searchDetails.dropLocation || (searchDetails.airportTransferType === 'pickup' ? 'Mysuru' : 'Bangalore Airport');

  const validStops = (searchDetails.viaLocations || []).filter((s) => s && s.trim().length > 0);
  const stopsText = validStops.length > 0 ? validStops.join(' -> ') : 'None';

  const pickupDate = searchDetails.pickupDate || searchDetails.travelDate || '';
  const pickupTime = searchDetails.pickupTime || '07:00 AM';

  const returnDate =
    searchDetails.serviceType === 'roundtrip'
      ? searchDetails.returnDate || searchDetails.dropDate || ''
      : undefined;
  const returnTime =
    searchDetails.serviceType === 'roundtrip'
      ? searchDetails.returnTime || searchDetails.pickupTime || ''
      : undefined;

  const distanceKmVal = estimatedFare.exactDistanceKm || searchDetails.routeInfo?.distanceKm;
  const distanceStr = distanceKmVal ? `${Math.round(distanceKmVal)} KM` : (searchDetails.routeInfo?.distanceKm ? `${Math.round(searchDetails.routeInfo.distanceKm)} KM` : 'As per Google Maps');

  const durationStr =
    searchDetails.routeInfo?.durationText ||
    searchDetails.routeInfo?.durationFormatted ||
    (searchDetails.routeInfo?.durationMinutes
      ? `${Math.floor(searchDetails.routeInfo.durationMinutes / 60)} hr ${searchDetails.routeInfo.durationMinutes % 60} min`
      : 'Standard driving time');

  const fareStr = estimatedFare?.totalEstimatedFare
    ? `${Number(estimatedFare.totalEstimatedFare).toLocaleString('en-IN')}`
    : '0';
  const fareDiscountNote = (estimatedFare?.discountPercentage && estimatedFare?.originalFare)
    ? ` (${estimatedFare.discountPercentage}% OFF applied, was ₹${Number(estimatedFare.originalFare).toLocaleString('en-IN')})`
    : '';

  const custName = passengerDetails?.fullName?.trim() || 'Guest Customer';
  const custMobile = passengerDetails?.mobileNumber?.trim() || 'Direct WhatsApp';
  const specialRequest = passengerDetails?.specialInstructions?.trim() || 'None';

  const lines = [
    '🚕 *TRAVEL JUST - BOOKING CONFIRMATION* 🔔',
    '━━━━━━━━━━━━━━━━━━━━━━━━━━',
    '1. *Booking Request Received*',
    `2. *Booking Reference ID:* ${referenceId}`,
    '3. *Booking Details:*',
    `   • *Trip Type:* ${tripTypeFormatted}`,
    `   • *Pickup:* ${fromLocation}`,
    `   • *Drop:* ${toLocation}`,
  ];

  if (stopsText && stopsText !== 'None') {
    lines.push(`   • *Via Stops:* ${stopsText}`);
  }

  lines.push(
    `   • *Pickup Date:* ${pickupDate}`,
    `   • *Pickup Time:* ${pickupTime}`
  );

  if (returnDate !== undefined) {
    lines.push(`   • *Return Date:* ${returnDate}`);
  }
  if (returnTime !== undefined) {
    lines.push(`   • *Return Time:* ${returnTime}`);
  }

  lines.push(
    `   • *Vehicle:* ${selectedVehicle.name} (${selectedVehicle.category})`,
    `   • *Est. Distance:* ${distanceStr}`,
    `   • *Est. Duration:* ${durationStr}`,
    `   • *Estimated Fare:* ₹${fareStr}${fareDiscountNote}`,
    '4. *You receive Chauffeur Details & Cab details on WhatsApp.*',
    '5. *Cab arrives at your pickup point at scheduled time.*',
    '',
    '━━━━━━━━━━━━━━━━━━━━━━━━━━',
    '📞 *Call Fleet Desk: +919740754400*',
    '🌐 *Website: https://www.traveljust.in*'
  );

  return lines.join('\n');
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

