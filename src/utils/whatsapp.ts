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
  const days = estimatedFare.roundTripDays || searchDetails.roundTripDays || 1;
  const includedMinKm = estimatedFare.includedMinKm || (days * 300);

  const serviceLabel = 
    searchDetails.serviceType === 'airport' 
      ? `Airport ${searchDetails.airportTransferType === 'pickup' ? 'Pickup' : 'Drop'}`
      : searchDetails.serviceType === 'roundtrip'
      ? `Round Trip Outstation (${days} Day${days > 1 ? 's' : ''} Package • ${Number(includedMinKm ?? (days * 300)).toLocaleString('en-IN')} km Included Min + ${days} Day${days > 1 ? 's' : ''} Driver Bata)`
      : searchDetails.serviceType === 'local'
      ? `Local Package (${searchDetails.durationHours} Hours)`
      : 'One-Way Drop';

  const dropDateVal = searchDetails.dropDate || searchDetails.returnDate || searchDetails.travelDate;
  const dropDateInfo = searchDetails.serviceType === 'roundtrip' && dropDateVal
    ? `\n📅 *Return / Drop Date:* ${dropDateVal}`
    : '';

  const viaStopsInfo = searchDetails.viaLocations && searchDetails.viaLocations.length > 0
    ? `\n🛑 *Via Stops:* ${searchDetails.viaLocations.join(', ')}`
    : '';

  const notesInfo = passengerDetails.specialInstructions 
    ? `\n📝 *Notes:* ${passengerDetails.specialInstructions}`
    : '';

  return (
`🚕 *TRAVEL JUST - BOOKING CONFIRMATION REQUEST* 🚕
━━━━━━━━━━━━━━━━━━━━━━━━━━
🆔 *Booking Ref:* ${referenceId}
👤 *Passenger Name:* ${passengerDetails.fullName}
📱 *Mobile Number:* ${passengerDetails.mobileNumber}
👥 *No. of Passengers:* ${passengerDetails.passengersCount}

🚗 *Vehicle:* ${selectedVehicle.name} (${selectedVehicle.category})
🛣️ *Trip Type:* ${serviceLabel}
📍 *Pickup Location:* ${searchDetails.pickupLocation}
🏁 *Drop Location:* ${searchDetails.dropLocation}${viaStopsInfo}
📅 *Pickup Date:* ${searchDetails.pickupDate || searchDetails.travelDate}
⏰ *Pickup Time:* ${searchDetails.pickupTime || '09:00 AM'}${dropDateInfo}

💰 *Estimated Fare:* ₹${Number(estimatedFare?.totalEstimatedFare ?? 0).toLocaleString('en-IN')}${notesInfo}
━━━━━━━━━━━━━━━━━━━━━━━━━━
_Please confirm vehicle dispatch, driver contact details, and trip schedule._`
  );
}

/**
 * Builds a formatted WhatsApp message for customer login / registration alert sent to the owner
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
`🚕 *TRAVEL JUST - CUSTOMER ${isNew ? 'REGISTRATION' : 'LOGIN'} ALERT* 🔔
━━━━━━━━━━━━━━━━━━━━━━━━━━
👤 *Customer Name:* ${customer.fullName}
📱 *Mobile Number:* ${formattedPhone}
✉️ *Email Address:* ${customer.email || 'Not provided'}
⏰ *Login Timestamp:* ${timeStr}
🆔 *Customer Ref ID:* ${customer.id}
📊 *Completed/Saved Trips:* ${customer.totalTripsCount || 0} trip(s)
🔐 *Auth Event:* ${isNew ? '✨ New Account Created' : '🔑 Active Customer Sign-in'}
━━━━━━━━━━━━━━━━━━━━━━━━━━
_Notification dispatched automatically to TRAVEL JUST Owner Desk (${siteConfig.contact.phone})._`
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

