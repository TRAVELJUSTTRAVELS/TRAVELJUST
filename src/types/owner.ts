export type OwnerRole =
  | 'SUPER_ADMIN'
  | 'BOOKING_MANAGER'
  | 'FLEET_MANAGER'
  | 'ACCOUNTS'
  | 'COMMUNICATION_STAFF';

export type BookingLifecycleStatus =
  | 'NEW REQUEST'
  | 'UNDER REVIEW'
  | 'QUOTE / FARE UPDATED'
  | 'APPROVED'
  | 'PAYMENT PENDING'
  | 'CONFIRMED'
  | 'DRIVER/CAB ASSIGNED'
  | 'DRIVER EN ROUTE'
  | 'CUSTOMER PICKED UP'
  | 'TRIP IN PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED BY CUSTOMER'
  | 'CANCELLED BY OWNER'
  | 'REJECTED';

export type VehicleCategoryType =
  | 'Sedan (4+1)'
  | 'SUV (6+1)'
  | 'Innova'
  | 'Innova Crysta'
  | 'Tempo Traveller (12+1)';

export type VehicleOperationalStatus =
  | 'AVAILABLE'
  | 'BOOKED'
  | 'ASSIGNED'
  | 'ON TRIP'
  | 'MAINTENANCE'
  | 'INACTIVE';

export type ChauffeurOperationalStatus =
  | 'AVAILABLE'
  | 'ASSIGNED'
  | 'ON DUTY'
  | 'ON TRIP'
  | 'OFF DUTY'
  | 'UNAVAILABLE';

export interface VehicleRecord {
  id: string;
  registrationNumber: string;
  category: VehicleCategoryType;
  model: string;
  seatingCapacity: number;
  status: VehicleOperationalStatus;
  assignedChauffeurId?: string | null;
  assignedChauffeurName?: string | null;
  insuranceExpiry: string;
  permitExpiry: string;
  fitnessExpiry: string;
  lastServiceDate: string;
  notes?: string;
  createdAt: string;
}

export interface ChauffeurRecord {
  id: string;
  name: string;
  mobileNumber: string;
  licenseNumber: string;
  licenseExpiry: string;
  status: ChauffeurOperationalStatus;
  assignedVehicleId?: string | null;
  assignedVehiclePlate?: string | null;
  dutyStatus: 'ON_DUTY' | 'OFF_DUTY';
  rating: number;
  totalTripsCompleted: number;
  emergencyContact: string;
  notes?: string;
  createdAt: string;
}

export type WhatsAppRecipientRole = 'CUSTOMER' | 'FLEET_MANAGER' | 'DRIVER' | 'OWNER';
export type WhatsAppCategory =
  | 'CUSTOMER_LOGIN'
  | 'BOOKING_LIFECYCLE'
  | 'FLEET_MANAGER'
  | 'DRIVER_DISPATCH'
  | 'PAYMENTS'
  | 'SECURITY_ALERT';

export interface WhatsAppMessageRecord {
  id: string;
  sender: 'customer' | 'owner' | 'system' | 'driver' | 'fleet_manager';
  senderName: string;
  recipientPhone?: string;
  recipientRole?: WhatsAppRecipientRole;
  text: string;
  timestamp: string;
  status: 'queued' | 'sent' | 'delivered' | 'read' | 'failed';
  templateName?: string;
  category?: WhatsAppCategory;
  bookingId?: string;
  metadata?: Record<string, any>;
}

export interface WhatsAppConversationThread {
  id: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  lastMessageText: string;
  lastMessageTimestamp: string;
  unreadCount: number;
  category?: WhatsAppCategory;
  bookingId?: string;
  pickupLocation?: string;
  dropLocation?: string;
  serviceType?: string;
  messages: WhatsAppMessageRecord[];
}

export interface WhatsAppQueueItem {
  id: string;
  recipientPhone: string;
  recipientName: string;
  recipientRole: WhatsAppRecipientRole;
  category: WhatsAppCategory;
  templateName: string;
  renderedText: string;
  timestamp: string;
  status: 'PENDING' | 'SENT' | 'DELIVERED' | 'FAILED';
  bookingId?: string;
  attempts: number;
  lastAttemptAt?: string;
  directWhatsAppUrl: string;
}

export interface WhatsAppGatewaySettings {
  officialBusinessPhone: string; // "+91 9740754400"
  defaultOwnerNotificationPhone: string; // "+91 9740754400"
  fleetManagerNotificationPhone: string; // "+91 9740754400"
  provider: 'DIRECT_WHATSAPP_DEEPLINK' | 'WHATSAPP_CLOUD_API' | 'MOCK_GATEWAY';
  apiKey?: string;
  phoneNumberId?: string;
  wabaId?: string;
  autoSendCustomerLoginAlerts: boolean;
  autoSendBookingLifecycleAlerts: boolean;
  autoSendDriverAssignmentAlerts: boolean;
  autoSendPaymentReceipts: boolean;
  autoSendFleetManagerAlerts: boolean;
}

export interface PaymentRecord {
  id: string;
  bookingId: string;
  customerName: string;
  customerPhone: string;
  totalAmount: number;
  discountAmount: number;
  finalAmount: number;
  paidAmount: number;
  balanceAmount: number;
  status: 'PENDING' | 'PARTIAL' | 'PAID' | 'REFUNDED';
  paymentMethod: 'ONLINE_UPI' | 'CASH_TO_DRIVER' | 'BANK_TRANSFER' | 'CARD' | 'NOT_PAID';
  transactionRef?: string;
  paidAt?: string;
  updatedAt: string;
  notes?: string;
}

export interface DiscountRule {
  id: string;
  code: string;
  discountType: 'percentage' | 'fixed';
  value: number;
  applicableServices: string[];
  applicableVehicles: string[];
  minBookingValue: number;
  maxDiscount: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
  usageCount: number;
  notes?: string;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  actorEmail: string;
  actorRole: OwnerRole;
  action: string;
  entity: 'BOOKING' | 'FARE' | 'FLEET' | 'CHAUFFEUR' | 'DISCOUNT' | 'PAYMENT' | 'SEO' | 'SETTINGS';
  entityId?: string;
  bookingId?: string;
  previousValue?: any;
  newValue?: any;
  details: string;
}

export interface SiteOptimizerSettings {
  metaTitle: string;
  metaDescription: string;
  canonicalUrl: string;
  h1: string;
  robotsTxt: string;
  sitemapXmlUrl: string;
  localSeoDestinations: {
    city: string;
    route: string;
    title: string;
    description: string;
    keywords: string[];
  }[];
  schemas: {
    taxiService: boolean;
    localBusiness: boolean;
    faqPage: boolean;
  };
  performanceScores: {
    fcp: number;
    lcp: number;
    cls: number;
    fid: number;
    overall: number;
  };
  conversionStats: {
    bookingStarts: number;
    bookingCompletions: number;
    abandonedBookings: number;
    whatsAppClicks: number;
    phoneClicks: number;
  };
  lastUpdated: string;
  updatedBy: string;
  isPublished: boolean;
  version: number;
}

export interface NotificationItem {
  id: string;
  type: 'NEW_BOOKING' | 'STATUS_CHANGE' | 'PAYMENT' | 'FLEET' | 'DOCUMENT_EXPIRY' | 'WHATSAPP';
  title: string;
  message: string;
  bookingId?: string;
  timestamp: string;
  read: boolean;
}

export interface OwnerStaffUser {
  id: string;
  name: string;
  email: string;
  role: OwnerRole;
  active: boolean;
}
