import fs from 'fs';
import path from 'path';
import {
  VehicleRecord,
  ChauffeurRecord,
  WhatsAppConversationThread,
  WhatsAppMessageRecord,
  WhatsAppQueueItem,
  WhatsAppGatewaySettings,
  PaymentRecord,
  DiscountRule,
  AuditLogEntry,
  SiteOptimizerSettings,
  NotificationItem,
  BookingLifecycleStatus,
  OwnerRole,
} from '../types/owner';
import { DynamicAddOnOption } from '../types/addOns';

// In-memory singletons backed by local snapshot file for persistence across server restarts
const OWNER_STORAGE_FILE = path.join(process.cwd(), '.owner_portal_data.json');

// Initial seed vehicles
const DEFAULT_VEHICLES: VehicleRecord[] = [
  {
    id: 'veh-01',
    registrationNumber: 'KA-09-EA-4401',
    category: 'Sedan (4+1)',
    model: 'Maruti Suzuki Dzire (White)',
    seatingCapacity: 4,
    status: 'AVAILABLE',
    assignedChauffeurId: 'chf-01',
    assignedChauffeurName: 'Ramesh Gowda',
    insuranceExpiry: '2027-04-15',
    permitExpiry: '2028-06-30',
    fitnessExpiry: '2027-08-20',
    lastServiceDate: '2026-09-10',
    notes: 'Primary airport transfer vehicle, AC verified.',
    createdAt: '2025-01-10T10:00:00Z',
  },
  {
    id: 'veh-02',
    registrationNumber: 'KA-09-MC-8812',
    category: 'SUV (6+1)',
    model: 'Maruti Ertiga ZXi+ (Silver)',
    seatingCapacity: 6,
    status: 'AVAILABLE',
    assignedChauffeurId: 'chf-02',
    assignedChauffeurName: 'Suresh Kumar',
    insuranceExpiry: '2027-03-22',
    permitExpiry: '2028-01-15',
    fitnessExpiry: '2027-05-10',
    lastServiceDate: '2026-08-28',
    notes: 'Ideal for Coorg, Wayanad & Ooty hill station tours.',
    createdAt: '2025-02-14T10:00:00Z',
  },
  {
    id: 'veh-03',
    registrationNumber: 'KA-09-TR-9900',
    category: 'Innova Crysta',
    model: 'Toyota Innova Crysta 2.4 VX (Super White)',
    seatingCapacity: 7,
    status: 'AVAILABLE',
    assignedChauffeurId: 'chf-03',
    assignedChauffeurName: 'Mahesh Nayak',
    insuranceExpiry: '2027-09-30',
    permitExpiry: '2028-11-20',
    fitnessExpiry: '2027-10-15',
    lastServiceDate: '2026-09-18',
    notes: 'Premium executive & corporate outstation travel.',
    createdAt: '2025-03-01T10:00:00Z',
  },
  {
    id: 'veh-04',
    registrationNumber: 'KA-09-IN-5521',
    category: 'Innova',
    model: 'Toyota Innova 2.5V (Silver Metallic)',
    seatingCapacity: 7,
    status: 'AVAILABLE',
    assignedChauffeurId: null,
    insuranceExpiry: '2026-12-10',
    permitExpiry: '2027-05-18',
    fitnessExpiry: '2026-11-25',
    lastServiceDate: '2026-09-01',
    notes: 'Reliable family outstation corridor workhorse.',
    createdAt: '2025-04-12T10:00:00Z',
  },
  {
    id: 'veh-05',
    registrationNumber: 'KA-09-FB-1200',
    category: 'Tempo Traveller (12+1)',
    model: 'Force Traveller 3350 Luxury (12-Seater Pushback)',
    seatingCapacity: 12,
    status: 'AVAILABLE',
    assignedChauffeurId: 'chf-04',
    assignedChauffeurName: 'Girish Prasad',
    insuranceExpiry: '2027-07-15',
    permitExpiry: '2028-08-30',
    fitnessExpiry: '2027-06-25',
    lastServiceDate: '2026-09-05',
    notes: 'Large family weddings, pilgrimage and corporate retreats.',
    createdAt: '2025-05-05T10:00:00Z',
  },
];

// Initial seed chauffeurs
const DEFAULT_CHAUFFEURS: ChauffeurRecord[] = [
  {
    id: 'chf-01',
    name: 'Ramesh Gowda',
    mobileNumber: '+91 98451 22340',
    licenseNumber: 'KA09 20120004581',
    licenseExpiry: '2030-05-20',
    status: 'AVAILABLE',
    assignedVehicleId: 'veh-01',
    assignedVehiclePlate: 'KA-09-EA-4401',
    dutyStatus: 'ON_DUTY',
    rating: 4.9,
    totalTripsCompleted: 480,
    emergencyContact: '+91 94480 11920',
    notes: 'Speaks Kannada, English, Hindi. KIAL Expressway specialist.',
    createdAt: '2025-01-10T10:00:00Z',
  },
  {
    id: 'chf-02',
    name: 'Suresh Kumar',
    mobileNumber: '+91 97412 88901',
    licenseNumber: 'KA09 20150008892',
    licenseExpiry: '2029-11-14',
    status: 'AVAILABLE',
    assignedVehicleId: 'veh-02',
    assignedVehiclePlate: 'KA-09-MC-8812',
    dutyStatus: 'ON_DUTY',
    rating: 4.8,
    totalTripsCompleted: 350,
    emergencyContact: '+91 98860 33412',
    notes: 'Hill station route expert (Ooty 36 Hairpin bends, Coorg, Wayanad).',
    createdAt: '2025-02-14T10:00:00Z',
  },
  {
    id: 'chf-03',
    name: 'Mahesh Nayak',
    mobileNumber: '+91 99004 55123',
    licenseNumber: 'KA09 20100003124',
    licenseExpiry: '2031-02-18',
    status: 'AVAILABLE',
    assignedVehicleId: 'veh-03',
    assignedVehiclePlate: 'KA-09-TR-9900',
    dutyStatus: 'ON_DUTY',
    rating: 5.0,
    totalTripsCompleted: 620,
    emergencyContact: '+91 98440 99811',
    notes: 'Senior chauffeur, VIP protocol & interstate corridor expert.',
    createdAt: '2025-03-01T10:00:00Z',
  },
  {
    id: 'chf-04',
    name: 'Girish Prasad',
    mobileNumber: '+91 96112 44789',
    licenseNumber: 'KA09 20160009941',
    licenseExpiry: '2028-09-30',
    status: 'AVAILABLE',
    assignedVehicleId: 'veh-05',
    assignedVehiclePlate: 'KA-09-FB-1200',
    dutyStatus: 'ON_DUTY',
    rating: 4.9,
    totalTripsCompleted: 290,
    emergencyContact: '+91 99720 55102',
    notes: 'Heavy passenger commercial vehicle certified, courteous conduct.',
    createdAt: '2025-05-05T10:00:00Z',
  },
];

// Initial seed discounts
const DEFAULT_DISCOUNTS: DiscountRule[] = [
  {
    id: 'disc-01',
    code: 'AIRPORT100',
    discountType: 'fixed',
    value: 100,
    applicableServices: ['airport'],
    applicableVehicles: ['sedan', 'suv', 'crysta'],
    minBookingValue: 2000,
    maxDiscount: 100,
    startDate: '2025-01-01',
    endDate: '2027-12-31',
    isActive: true,
    usageCount: 142,
    notes: 'Flat ₹100 off on Bengaluru KIAL Airport transfers',
  },
  {
    id: 'disc-02',
    code: 'MYSURU10',
    discountType: 'percentage',
    value: 10,
    applicableServices: ['roundtrip', 'outstation', 'local'],
    applicableVehicles: ['sedan', 'suv', 'crysta', 'tempo'],
    minBookingValue: 2500,
    maxDiscount: 350,
    startDate: '2025-01-01',
    endDate: '2027-12-31',
    isActive: true,
    usageCount: 88,
    notes: '10% instant discount up to ₹350 on Mysore tours',
  },
  {
    id: 'disc-03',
    code: 'FESTIVE250',
    discountType: 'fixed',
    value: 250,
    applicableServices: ['oneway', 'roundtrip'],
    applicableVehicles: ['crysta', 'tempo'],
    minBookingValue: 4000,
    maxDiscount: 250,
    startDate: '2025-01-01',
    endDate: '2027-12-31',
    isActive: true,
    usageCount: 65,
    notes: 'Special festival group booking discount',
  },
];

// Initial seed Add-Ons & Amenities
const DEFAULT_ADD_ONS: DynamicAddOnOption[] = [
  {
    id: 'addon-luggage-carrier',
    name: 'Overhead Roof Luggage Carrier & All-Weather Tarp',
    shortLabel: 'Roof Luggage Carrier',
    category: 'luggage',
    description: 'Heavy-duty rooftop luggage carrier with waterproof tarp cover and safety ratchet straps. Perfect for extra suitcases, boxes, or bulky holiday luggage.',
    price: 350,
    pricingType: 'per_trip',
    applicableServices: ['oneway', 'roundtrip', 'airport'],
    maxQuantity: 1,
    enabled: true,
    isPopular: true,
    iconName: 'luggage',
    badge: 'Extra Baggage',
    sortOrder: 1,
    updatedAt: '2026-10-12T00:00:00Z',
  },
  {
    id: 'addon-multilingual-chauffeur',
    name: 'Multi-lingual Chauffeur Preference (English / Hindi / Kannada)',
    shortLabel: 'Chauffeur Language',
    category: 'chauffeur_preference',
    description: 'Verified chauffeur fluent in your preferred language for easy route coordination, local tourism tips, and polite communication.',
    price: 0,
    pricingType: 'free',
    applicableServices: ['all'],
    maxQuantity: 1,
    enabled: true,
    isPopular: false,
    iconName: 'users',
    badge: 'Complimentary',
    sortOrder: 2,
    updatedAt: '2026-10-12T00:00:00Z',
  },
];

// Initial seed Site Optimizer & SEO settings
const DEFAULT_SITE_OPTIMIZER: SiteOptimizerSettings = {
  metaTitle: 'TRAVEL JUST Mysuru | Reliable Taxi & Cab Booking Service Mysore',
  metaDescription: 'Book reliable taxi service in Mysore. One way cab, round trip, airport transfer to Bengaluru KIAL Airport T1/T2, Coorg, Ooty & Wayanad. Fixed fares, 24x7 service.',
  canonicalUrl: 'https://www.traveljust.in/',
  h1: 'Best Taxi Service in Mysore — Guaranteed On-Time Pickups',
  robotsTxt: 'User-agent: *\nAllow: /\n\nSitemap: https://www.traveljust.in/sitemap.xml\nHost: https://www.traveljust.in',
  sitemapXmlUrl: 'https://www.traveljust.in/sitemap.xml',
  localSeoDestinations: [
    {
      city: 'Mysuru',
      route: '/mysore-local-sightseeing-taxi',
      title: 'Mysore Local Sightseeing & City Taxi Service',
      description: 'Explore Mysore Palace, Chamundi Hill, Brindavan Gardens & Zoo with clean air-conditioned cabs and polite chauffeurs.',
      keywords: ['mysore taxi', 'mysore local sightseeing cab', 'mysore travel agency'],
    },
    {
      city: 'Bengaluru Airport',
      route: '/mysore-to-bangalore-airport-taxi',
      title: 'Mysore to Bangalore Airport (BLR KIAL) Taxi Service',
      description: 'Non-stop expressway cabs from Mysore to Kempegowda International Airport Terminal 1 & 2. 2.5 hours travel time, zero surge.',
      keywords: ['mysore to bangalore airport taxi', 'mysore to kial cab', 'mysore airport drop'],
    },
    {
      city: 'Coorg (Madikeri)',
      route: '/mysore-to-coorg-taxi',
      title: 'Mysore to Coorg Taxi & Holiday Tour Packages',
      description: 'Comfortable sedans and SUVs for scenic travel to Madikeri, Abbey Falls, Raja Seat and coffee plantations.',
      keywords: ['mysore to coorg taxi', 'coorg cab package', 'mysore to madikeri cab'],
    },
    {
      city: 'Ooty',
      route: '/mysore-to-ooty-taxi',
      title: 'Mysore to Ooty Taxi via Bandipur & Mudumalai',
      description: 'Experienced hill-station chauffeurs navigating the 36 hairpin bends safely. Botanical Gardens, Doddabetta & tea estates.',
      keywords: ['mysore to ooty taxi', 'mysore to ooty cab', 'bandipur forest safari cab'],
    },
    {
      city: 'Wayanad',
      route: '/mysore-to-wayanad-taxi',
      title: 'Mysore to Wayanad Taxi via Muthanga Wildlife',
      description: 'Travel through misty Kerala Western Ghats. Banasura Sagar, Chembra Peak & Edakkal Caves.',
      keywords: ['mysore to wayanad cab', 'mysore kerala interstate taxi'],
    },
    {
      city: 'Kabini',
      route: '/mysore-to-kabini-taxi',
      title: 'Mysore to Kabini River & Jungle Lodge Safari Taxi',
      description: 'Direct safari resort transfers to Kabini, Nagarhole National Park and HD Kote backwaters.',
      keywords: ['mysore to kabini cab', 'kabini jungle resort taxi'],
    },
  ],
  schemas: {
    taxiService: true,
    localBusiness: true,
    faqPage: true,
  },
  performanceScores: {
    fcp: 0.8,
    lcp: 1.4,
    cls: 0.02,
    fid: 12,
    overall: 96,
  },
  conversionStats: {
    bookingStarts: 412,
    bookingCompletions: 284,
    abandonedBookings: 128,
    whatsAppClicks: 650,
    phoneClicks: 490,
  },
  lastUpdated: '2026-10-03T10:00:00Z',
  updatedBy: 'traveljustmysuru@gmail.com',
  isPublished: true,
  version: 3,
};

// Initial seed WhatsApp threads
const DEFAULT_WHATSAPP_THREADS: WhatsAppConversationThread[] = [
  {
    id: 'wa-thread-01',
    customerId: 'cust-9740754400',
    customerName: 'Anand Kumar',
    customerPhone: '+91 98451 22340',
    lastMessageText: 'Thank you! Chauffeur Ramesh arrived on time at Gokulam.',
    lastMessageTimestamp: '2026-10-03T09:45:00Z',
    unreadCount: 0,
    bookingId: 'TJ-82194',
    pickupLocation: 'Gokulam 3rd Stage, Mysuru',
    dropLocation: 'Kempegowda International Airport Terminal 1 (BLR)',
    serviceType: 'AIRPORT',
    messages: [
      {
        id: 'msg-01',
        sender: 'system',
        senderName: 'TRAVEL JUST Business (+91 9740754400)',
        text: 'Namaskara Anand Ji! Your airport transfer request #TJ-82194 has been received. Our dispatch team is reviewing your pickup.',
        timestamp: '2026-10-03T08:00:00Z',
        status: 'read',
        templateName: 'booking_request_received',
        bookingId: 'TJ-82194',
      },
      {
        id: 'msg-02',
        sender: 'owner',
        senderName: 'Travel Just Dispatcher',
        text: 'Cab & Chauffeur Confirmed: Maruti Dzire (KA-09-EA-4401) driven by Ramesh Gowda (+91 98451 22340). Driver will report 15 mins prior.',
        timestamp: '2026-10-03T08:15:00Z',
        status: 'read',
        templateName: 'chauffeur_assigned',
        bookingId: 'TJ-82194',
      },
      {
        id: 'msg-03',
        sender: 'customer',
        senderName: 'Anand Kumar',
        text: 'Thank you! Chauffeur Ramesh arrived on time at Gokulam.',
        timestamp: '2026-10-03T09:45:00Z',
        status: 'read',
        bookingId: 'TJ-82194',
      },
    ],
  },
  {
    id: 'wa-thread-02',
    customerId: 'cust-9988112233',
    customerName: 'Priya Sharma',
    customerPhone: '+91 99881 12233',
    lastMessageText: 'Can we add an extra stop at Bylakuppe Golden Temple on way to Coorg?',
    lastMessageTimestamp: '2026-10-03T09:10:00Z',
    unreadCount: 1,
    bookingId: 'TJ-51042',
    pickupLocation: 'Vijayanagar 2nd Stage, Mysuru',
    dropLocation: 'Madikeri, Coorg, Karnataka',
    serviceType: 'ROUNDTRIP',
    messages: [
      {
        id: 'msg-04',
        sender: 'system',
        senderName: 'TRAVEL JUST Business (+91 9740754400)',
        text: 'Booking Confirmation: Your 2-Day Coorg Roundtrip #TJ-51042 is confirmed for Ertiga SUV (KA-09-MC-8812). Total Estimated Fare: ₹6,500.',
        timestamp: '2026-10-03T08:30:00Z',
        status: 'read',
        templateName: 'booking_confirmed',
        bookingId: 'TJ-51042',
      },
      {
        id: 'msg-05',
        sender: 'customer',
        senderName: 'Priya Sharma',
        text: 'Can we add an extra stop at Bylakuppe Golden Temple on way to Coorg?',
        timestamp: '2026-10-03T09:10:00Z',
        status: 'delivered',
        bookingId: 'TJ-51042',
      },
    ],
  },
];

// In-Memory Master Store
class OwnerDataStore {
  private vehicles: VehicleRecord[] = [...DEFAULT_VEHICLES];
  private chauffeurs: ChauffeurRecord[] = [...DEFAULT_CHAUFFEURS];
  private discounts: DiscountRule[] = [...DEFAULT_DISCOUNTS];
  private addOns: DynamicAddOnOption[] = [...DEFAULT_ADD_ONS];
  private siteOptimizer: SiteOptimizerSettings = { ...DEFAULT_SITE_OPTIMIZER };
  private whatsAppThreads: WhatsAppConversationThread[] = [...DEFAULT_WHATSAPP_THREADS];
  private whatsAppQueue: WhatsAppQueueItem[] = [];
  private whatsAppGatewaySettings: WhatsAppGatewaySettings = {
    officialBusinessPhone: '+91 9740754400',
    defaultOwnerNotificationPhone: '+91 9740754400',
    fleetManagerNotificationPhone: '+91 9740754400',
    provider: 'DIRECT_WHATSAPP_DEEPLINK',
    autoSendCustomerLoginAlerts: true,
    autoSendBookingLifecycleAlerts: true,
    autoSendDriverAssignmentAlerts: true,
    autoSendPaymentReceipts: true,
    autoSendFleetManagerAlerts: true,
  };
  private payments: PaymentRecord[] = [];
  private auditLogs: AuditLogEntry[] = [];
  private notifications: NotificationItem[] = [];

  constructor() {
    this.loadFromDisk();
    if (this.auditLogs.length === 0) {
      this.recordAuditLog(
        'traveljustmysuru@gmail.com',
        'SUPER_ADMIN',
        'INITIALIZE_PORTAL',
        'SETTINGS',
        'SYSTEM',
        null,
        { version: '2.0.0' },
        'TRAVEL JUST Two-Portal Architecture initialized successfully with single source of truth.'
      );
    }
  }

  private loadFromDisk() {
    try {
      if (fs.existsSync(OWNER_STORAGE_FILE)) {
        const raw = fs.readFileSync(OWNER_STORAGE_FILE, 'utf8');
        const data = JSON.parse(raw);
        if (data.vehicles?.length) this.vehicles = data.vehicles;
        if (data.chauffeurs?.length) this.chauffeurs = data.chauffeurs;
        if (data.discounts?.length) this.discounts = data.discounts;
        if (data.addOns?.length) {
          this.addOns = data.addOns.filter(
            (a: any) =>
              !/pet/i.test(a.id || a.name || '') &&
              !/mineral\s*water|refreshment/i.test(a.id || a.name || '') &&
              !/wheelchair|senior/i.test(a.id || a.name || '') &&
              !/child[-_\s]*seat/i.test(a.id || a.name || '') &&
              !/silent[-_\s]*work|quiet[-_\s]*cabin|fast[-_\s]*charger/i.test(a.id || a.name || '')
          );
        }
        if (data.siteOptimizer) this.siteOptimizer = data.siteOptimizer;
        if (data.whatsAppThreads?.length) this.whatsAppThreads = data.whatsAppThreads;
        if (data.whatsAppQueue?.length) this.whatsAppQueue = data.whatsAppQueue;
        if (data.whatsAppGatewaySettings) this.whatsAppGatewaySettings = { ...this.whatsAppGatewaySettings, ...data.whatsAppGatewaySettings };
        if (data.payments?.length) this.payments = data.payments;
        if (data.auditLogs?.length) this.auditLogs = data.auditLogs;
        if (data.notifications?.length) this.notifications = data.notifications;
      }
    } catch (e) {
      console.warn('Could not load owner storage file, using defaults:', e);
    }
  }

  private saveToDisk() {
    try {
      const data = {
        vehicles: this.vehicles,
        chauffeurs: this.chauffeurs,
        discounts: this.discounts,
        addOns: this.addOns,
        siteOptimizer: this.siteOptimizer,
        whatsAppThreads: this.whatsAppThreads,
        whatsAppQueue: this.whatsAppQueue,
        whatsAppGatewaySettings: this.whatsAppGatewaySettings,
        payments: this.payments,
        auditLogs: this.auditLogs,
        notifications: this.notifications,
        savedAt: new Date().toISOString(),
      };
      fs.writeFileSync(OWNER_STORAGE_FILE, JSON.stringify(data, null, 2), 'utf8');
    } catch (e) {
      console.warn('Could not persist owner storage file:', e);
    }
  }

  // --- VEHICLES ---
  public getVehicles(): VehicleRecord[] {
    return [...this.vehicles];
  }

  public getVehicle(id: string): VehicleRecord | undefined {
    return this.vehicles.find((v) => v.id === id);
  }

  public saveVehicle(veh: VehicleRecord, actorEmail = 'traveljustmysuru@gmail.com'): VehicleRecord {
    const idx = this.vehicles.findIndex((v) => v.id === veh.id);
    const prev = idx >= 0 ? this.vehicles[idx] : null;
    if (idx >= 0) {
      this.vehicles[idx] = { ...veh };
    } else {
      this.vehicles.unshift({ ...veh });
    }
    this.recordAuditLog(
      actorEmail,
      'FLEET_MANAGER',
      prev ? 'UPDATE_VEHICLE' : 'CREATE_VEHICLE',
      'FLEET',
      veh.id,
      prev,
      veh,
      `${prev ? 'Updated' : 'Added'} vehicle ${veh.registrationNumber} (${veh.model})`
    );
    this.saveToDisk();
    return veh;
  }

  public updateVehicleStatus(id: string, status: any, actorEmail = 'traveljustmysuru@gmail.com'): boolean {
    const veh = this.vehicles.find((v) => v.id === id);
    if (!veh) return false;
    const prevStatus = veh.status;
    veh.status = status;
    this.recordAuditLog(
      actorEmail,
      'FLEET_MANAGER',
      'CHANGE_VEHICLE_STATUS',
      'FLEET',
      id,
      { status: prevStatus },
      { status },
      `Changed vehicle ${veh.registrationNumber} status to ${status}`
    );
    this.saveToDisk();
    return true;
  }

  public deleteVehicle(id: string, actorEmail = 'traveljustmysuru@gmail.com'): boolean {
    const idx = this.vehicles.findIndex((v) => v.id === id);
    if (idx === 0 || idx > 0) {
      const removed = this.vehicles.splice(idx, 1)[0];
      this.recordAuditLog(
        actorEmail,
        'FLEET_MANAGER',
        'DELETE_VEHICLE',
        'FLEET',
        id,
        removed,
        null,
        `Deleted vehicle ${removed.registrationNumber}`
      );
      this.saveToDisk();
      return true;
    }
    return false;
  }

  // --- CHAUFFEURS ---
  public getChauffeurs(): ChauffeurRecord[] {
    return [...this.chauffeurs];
  }

  public getChauffeur(id: string): ChauffeurRecord | undefined {
    return this.chauffeurs.find((c) => c.id === id);
  }

  public saveChauffeur(chf: ChauffeurRecord, actorEmail = 'traveljustmysuru@gmail.com'): ChauffeurRecord {
    const idx = this.chauffeurs.findIndex((c) => c.id === chf.id);
    const prev = idx >= 0 ? this.chauffeurs[idx] : null;
    if (idx >= 0) {
      this.chauffeurs[idx] = { ...chf };
    } else {
      this.chauffeurs.unshift({ ...chf });
    }
    this.recordAuditLog(
      actorEmail,
      'FLEET_MANAGER',
      prev ? 'UPDATE_CHAUFFEUR' : 'CREATE_CHAUFFEUR',
      'CHAUFFEUR',
      chf.id,
      prev,
      chf,
      `${prev ? 'Updated' : 'Added'} chauffeur ${chf.name} (${chf.mobileNumber})`
    );
    this.saveToDisk();
    return chf;
  }

  public updateChauffeurStatus(id: string, status: any, actorEmail = 'traveljustmysuru@gmail.com'): boolean {
    const chf = this.chauffeurs.find((c) => c.id === id);
    if (!chf) return false;
    const prevStatus = chf.status;
    chf.status = status;
    this.recordAuditLog(
      actorEmail,
      'FLEET_MANAGER',
      'CHANGE_CHAUFFEUR_STATUS',
      'CHAUFFEUR',
      id,
      { status: prevStatus },
      { status },
      `Changed chauffeur ${chf.name} status to ${status}`
    );
    this.saveToDisk();
    return true;
  }

  // Check Availability: checks both vehicles and chauffeurs for a trip window
  public checkFleetAvailability(pickupDate: string, returnDate?: string, vehicleCategory?: string) {
    const availableVehicles = this.vehicles.filter((v) => {
      if (v.status === 'MAINTENANCE' || v.status === 'INACTIVE') return false;
      if (vehicleCategory && vehicleCategory !== 'all') {
        const cat = vehicleCategory.toLowerCase();
        if (cat === 'sedan' && !v.category.toLowerCase().includes('sedan')) return false;
        if (cat === 'suv' && !v.category.toLowerCase().includes('suv')) return false;
        if (cat === 'innova' && (!v.category.toLowerCase().includes('innova') || v.category.toLowerCase().includes('crysta'))) return false;
        if (cat === 'crysta' && !v.category.toLowerCase().includes('crysta')) return false;
        if (cat === 'tempo' && !v.category.toLowerCase().includes('tempo')) return false;
      }
      return true;
    });

    const availableChauffeurs = this.chauffeurs.filter((c) => {
      return c.dutyStatus === 'ON_DUTY' && (c.status === 'AVAILABLE' || c.status === 'ASSIGNED');
    });

    return {
      availableVehicles,
      availableChauffeurs,
      totalVehicles: this.vehicles.length,
      totalChauffeurs: this.chauffeurs.length,
      isAvailable: availableVehicles.length > 0 && availableChauffeurs.length > 0,
      checkedAt: new Date().toISOString(),
    };
  }

  // --- DISCOUNTS ---
  public getDiscounts(): DiscountRule[] {
    return [...this.discounts];
  }

  public saveDiscount(rule: DiscountRule, actorEmail = 'traveljustmysuru@gmail.com'): DiscountRule {
    const idx = this.discounts.findIndex((d) => d.id === rule.id || d.code.toUpperCase() === rule.code.toUpperCase());
    const prev = idx >= 0 ? this.discounts[idx] : null;
    if (idx >= 0) {
      this.discounts[idx] = { ...rule };
    } else {
      this.discounts.unshift({ ...rule });
    }
    this.recordAuditLog(
      actorEmail,
      'SUPER_ADMIN',
      prev ? 'UPDATE_DISCOUNT' : 'CREATE_DISCOUNT',
      'DISCOUNT',
      rule.id,
      prev,
      rule,
      `${prev ? 'Updated' : 'Created'} promo discount code ${rule.code}`
    );
    this.saveToDisk();
    return rule;
  }

  public deleteDiscount(id: string, actorEmail = 'traveljustmysuru@gmail.com'): boolean {
    const idx = this.discounts.findIndex((d) => d.id === id);
    if (idx >= 0) {
      const removed = this.discounts.splice(idx, 1)[0];
      this.recordAuditLog(
        actorEmail,
        'SUPER_ADMIN',
        'DELETE_DISCOUNT',
        'DISCOUNT',
        id,
        removed,
        null,
        `Deleted promo discount code ${removed.code}`
      );
      this.saveToDisk();
      return true;
    }
    return false;
  }

  public validateDiscount(code: string, serviceType: string, vehicleId: string, fareAmount: number) {
    const rule = this.discounts.find(
      (d) => d.code.toUpperCase() === code.trim().toUpperCase() && d.isActive
    );
    if (!rule) {
      return { valid: false, error: 'Invalid or expired coupon code' };
    }
    if (fareAmount < rule.minBookingValue) {
      return { valid: false, error: `Minimum booking value of ₹${rule.minBookingValue} required for ${rule.code}` };
    }
    if (rule.applicableServices.length > 0 && !rule.applicableServices.includes('all') && !rule.applicableServices.includes(serviceType)) {
      return { valid: false, error: `Coupon ${rule.code} is not valid for ${serviceType.toUpperCase()} trips` };
    }

    let discountAmount = 0;
    if (rule.discountType === 'percentage') {
      discountAmount = Math.min((fareAmount * rule.value) / 100, rule.maxDiscount);
    } else {
      discountAmount = Math.min(rule.value, fareAmount);
    }
    discountAmount = Math.round(discountAmount);

    return {
      valid: true,
      code: rule.code,
      discountAmount,
      finalFare: Math.max(0, fareAmount - discountAmount),
      rule,
    };
  }

  // --- DYNAMIC ADD-ONS & AMENITIES ---
  public getAddOns(): DynamicAddOnOption[] {
    return [...this.addOns];
  }

  public getEnabledAddOns(serviceType?: string, vehicleId?: string): DynamicAddOnOption[] {
    return this.addOns.filter((item) => {
      if (!item.enabled) return false;
      if (serviceType && item.applicableServices.length > 0 && !item.applicableServices.includes('all') && !item.applicableServices.includes(serviceType as any)) {
        return false;
      }
      if (vehicleId && item.applicableVehicles && item.applicableVehicles.length > 0 && !item.applicableVehicles.includes('all') && !item.applicableVehicles.includes(vehicleId)) {
        return false;
      }
      return true;
    });
  }

  public saveAddOn(addon: DynamicAddOnOption, actorEmail = 'traveljustmysuru@gmail.com'): DynamicAddOnOption {
    const idx = this.addOns.findIndex((a) => a.id === addon.id);
    const prev = idx >= 0 ? this.addOns[idx] : null;
    const toSave: DynamicAddOnOption = {
      ...addon,
      price: Math.max(0, Number(addon.price) || 0),
      maxQuantity: Math.max(1, Number(addon.maxQuantity) || 1),
      updatedAt: new Date().toISOString(),
    };

    if (idx >= 0) {
      this.addOns[idx] = toSave;
    } else {
      this.addOns.push(toSave);
    }

    this.recordAuditLog(
      actorEmail,
      'FLEET_MANAGER',
      prev ? 'UPDATE_ADDON' : 'CREATE_ADDON',
      'SETTINGS' as any,
      toSave.id,
      prev,
      toSave,
      `${prev ? 'Updated' : 'Created'} add-on amenity "${toSave.name}" (Price: ₹${toSave.price})`
    );
    this.saveToDisk();
    return toSave;
  }

  public deleteAddOn(id: string, actorEmail = 'traveljustmysuru@gmail.com'): boolean {
    const idx = this.addOns.findIndex((a) => a.id === id);
    if (idx >= 0) {
      const removed = this.addOns.splice(idx, 1)[0];
      this.recordAuditLog(
        actorEmail,
        'FLEET_MANAGER',
        'DELETE_ADDON',
        'SETTINGS' as any,
        id,
        removed,
        null,
        `Deleted add-on amenity "${removed.name}"`
      );
      this.saveToDisk();
      return true;
    }
    return false;
  }

  public toggleAddOn(id: string, enabled?: boolean, actorEmail = 'traveljustmysuru@gmail.com'): DynamicAddOnOption | null {
    const addon = this.addOns.find((a) => a.id === id);
    if (!addon) return null;
    const prev = addon.enabled;
    addon.enabled = enabled !== undefined ? enabled : !addon.enabled;
    addon.updatedAt = new Date().toISOString();
    this.recordAuditLog(
      actorEmail,
      'FLEET_MANAGER',
      'TOGGLE_ADDON',
      'SETTINGS' as any,
      id,
      { enabled: prev },
      { enabled: addon.enabled },
      `Toggled add-on "${addon.name}" to ${addon.enabled ? 'Active' : 'Disabled'}`
    );
    this.saveToDisk();
    return addon;
  }

  // --- SITE OPTIMIZER & SEO ---
  public getSiteOptimizer(): SiteOptimizerSettings {
    return { ...this.siteOptimizer };
  }

  public saveSiteOptimizer(settings: Partial<SiteOptimizerSettings>, actorEmail = 'traveljustmysuru@gmail.com', publish = true): SiteOptimizerSettings {
    const prev = { ...this.siteOptimizer };
    this.siteOptimizer = {
      ...this.siteOptimizer,
      ...settings,
      lastUpdated: new Date().toISOString(),
      updatedBy: actorEmail,
      isPublished: publish,
      version: this.siteOptimizer.version + 1,
    };
    this.recordAuditLog(
      actorEmail,
      'SUPER_ADMIN',
      publish ? 'PUBLISH_SITE_OPTIMIZER' : 'SAVE_SITE_OPTIMIZER',
      'SEO',
      'SEO_CONFIG',
      prev,
      this.siteOptimizer,
      `${publish ? 'Published' : 'Saved draft'} Site Optimizer settings v${this.siteOptimizer.version}`
    );
    this.saveToDisk();
    return this.siteOptimizer;
  }

  public trackConversionEvent(type: 'bookingStart' | 'bookingCompletion' | 'abandoned' | 'whatsAppClick' | 'phoneClick') {
    if (type === 'bookingStart') this.siteOptimizer.conversionStats.bookingStarts += 1;
    if (type === 'bookingCompletion') this.siteOptimizer.conversionStats.bookingCompletions += 1;
    if (type === 'abandoned') this.siteOptimizer.conversionStats.abandonedBookings += 1;
    if (type === 'whatsAppClick') this.siteOptimizer.conversionStats.whatsAppClicks += 1;
    if (type === 'phoneClick') this.siteOptimizer.conversionStats.phoneClicks += 1;
    this.saveToDisk();
  }

  // --- WHATSAPP COMMUNICATION CENTER (+91 9740754400) ---
  public getWhatsAppThreads(): WhatsAppConversationThread[] {
    return [...this.whatsAppThreads];
  }

  public getWhatsAppThread(threadId: string): WhatsAppConversationThread | undefined {
    return this.whatsAppThreads.find((t) => t.id === threadId);
  }

  public sendWhatsAppMessage(
    threadId: string,
    text: string,
    sender: 'owner' | 'system' | 'customer' | 'driver' | 'fleet_manager' = 'owner',
    templateName?: string,
    actorName = 'TRAVEL JUST Business (+91 9740754400)',
    category?: any,
    metadata?: Record<string, any>
  ): WhatsAppMessageRecord {
    let thread = this.whatsAppThreads.find((t) => t.id === threadId);
    if (!thread) {
      thread = {
        id: threadId,
        customerId: `cust-${Date.now()}`,
        customerName: 'Customer',
        customerPhone: '+91 9740754400',
        lastMessageText: text,
        lastMessageTimestamp: new Date().toISOString(),
        unreadCount: 0,
        category: category || 'BOOKING_LIFECYCLE',
        messages: [],
      };
      this.whatsAppThreads.unshift(thread);
    }

    const message: WhatsAppMessageRecord = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      sender,
      senderName: sender === 'owner' ? 'Travel Just Dispatcher' : actorName,
      text,
      timestamp: new Date().toISOString(),
      status: 'sent',
      templateName,
      category: category || thread.category || 'BOOKING_LIFECYCLE',
      bookingId: thread.bookingId,
      metadata,
    };

    thread.messages.push(message);
    thread.lastMessageText = text;
    thread.lastMessageTimestamp = message.timestamp;
    if (category) thread.category = category;

    if (sender === 'customer') {
      thread.unreadCount += 1;
      this.addNotification({
        type: 'WHATSAPP',
        title: `New WhatsApp message from ${thread.customerName}`,
        message: text.substring(0, 80),
        bookingId: thread.bookingId,
      });
    }

    this.saveToDisk();
    return message;
  }

  public getWhatsAppQueue(): WhatsAppQueueItem[] {
    return [...this.whatsAppQueue];
  }

  public enqueueWhatsAppNotification(item: Omit<WhatsAppQueueItem, 'id' | 'timestamp' | 'attempts' | 'status' | 'directWhatsAppUrl'>): WhatsAppQueueItem {
    const cleanDigits = item.recipientPhone.replace(/\D/g, '');
    const phone = cleanDigits.length === 10 ? `91${cleanDigits}` : cleanDigits;
    const directWhatsAppUrl = `https://wa.me/${phone}?text=${encodeURIComponent(item.renderedText)}`;

    const queueItem: WhatsAppQueueItem = {
      id: `wq-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      ...item,
      timestamp: new Date().toISOString(),
      status: 'SENT', // Dispatched into gateway pipeline
      attempts: 1,
      lastAttemptAt: new Date().toISOString(),
      directWhatsAppUrl,
    };

    this.whatsAppQueue.unshift(queueItem);
    if (this.whatsAppQueue.length > 200) {
      this.whatsAppQueue.pop();
    }

    // Also auto-append into linked WhatsApp thread if customer recipient
    if (item.recipientRole === 'CUSTOMER' && item.bookingId) {
      const thread = this.whatsAppThreads.find((t) => t.bookingId === item.bookingId || t.customerPhone.includes(cleanDigits.slice(-10)));
      if (thread) {
        thread.messages.push({
          id: `msg-${queueItem.id}`,
          sender: 'system',
          senderName: 'TRAVEL JUST WhatsApp Engine (+91 9740754400)',
          text: item.renderedText,
          timestamp: queueItem.timestamp,
          status: 'sent',
          templateName: item.templateName,
          category: item.category,
          bookingId: item.bookingId,
        });
        thread.lastMessageText = item.renderedText;
        thread.lastMessageTimestamp = queueItem.timestamp;
      }
    }

    this.saveToDisk();
    return queueItem;
  }

  public updateMessageStatusFromWebhook(
    messageIdOrRef: string,
    newStatus: 'delivered' | 'read' | 'failed' | 'sent',
    recipientPhone?: string,
    timestamp?: string
  ): { updatedMessages: number; updatedBookings: string[] } {
    let updatedCount = 0;
    const affectedBookings = new Set<string>();

    // 1. Update queue items
    for (const q of this.whatsAppQueue) {
      if (
        q.id === messageIdOrRef ||
        (q.bookingId && messageIdOrRef.includes(q.bookingId)) ||
        (recipientPhone && q.recipientPhone.includes(recipientPhone.replace(/\D/g, '').slice(-10)))
      ) {
        q.status = newStatus.toUpperCase() as any;
        q.lastAttemptAt = timestamp || new Date().toISOString();
        if (q.bookingId) affectedBookings.add(q.bookingId);
      }
    }

    // 2. Update thread messages
    for (const t of this.whatsAppThreads) {
      for (const m of t.messages) {
        if (
          m.id === messageIdOrRef ||
          (m.bookingId && messageIdOrRef.includes(m.bookingId)) ||
          (m.metadata?.wamid && m.metadata.wamid === messageIdOrRef)
        ) {
          m.status = newStatus;
          updatedCount++;
          if (m.bookingId) affectedBookings.add(m.bookingId);
        }
      }
    }

    this.saveToDisk();
    return {
      updatedMessages: updatedCount,
      updatedBookings: Array.from(affectedBookings),
    };
  }

  public clearWhatsAppQueue(): void {
    this.whatsAppQueue = [];
    this.saveToDisk();
  }

  public getWhatsAppGatewaySettings(): WhatsAppGatewaySettings {
    return { ...this.whatsAppGatewaySettings };
  }

  public updateWhatsAppGatewaySettings(settings: Partial<WhatsAppGatewaySettings>): WhatsAppGatewaySettings {
    this.whatsAppGatewaySettings = {
      ...this.whatsAppGatewaySettings,
      ...settings,
    };
    this.saveToDisk();
    return this.whatsAppGatewaySettings;
  }

  public createOrLinkWhatsAppBookingThread(
    bookingId: string,
    customerName: string,
    customerPhone: string,
    pickupLocation: string,
    dropLocation: string,
    serviceType: string
  ): WhatsAppConversationThread {
    let thread = this.whatsAppThreads.find(
      (t) => t.bookingId === bookingId || t.customerPhone === customerPhone
    );
    if (!thread) {
      thread = {
        id: `wa-${bookingId || Date.now()}`,
        customerId: `cust-${customerPhone.replace(/\D/g, '')}`,
        customerName,
        customerPhone,
        bookingId,
        pickupLocation,
        dropLocation,
        serviceType,
        category: 'BOOKING_LIFECYCLE',
        lastMessageText: `Booking #${bookingId} initiated`,
        lastMessageTimestamp: new Date().toISOString(),
        unreadCount: 0,
        messages: [],
      };
      this.whatsAppThreads.unshift(thread);
    } else {
      thread.bookingId = bookingId;
      thread.pickupLocation = pickupLocation;
      thread.dropLocation = dropLocation;
      thread.serviceType = serviceType;
    }
    this.saveToDisk();
    return thread;
  }

  // --- PAYMENTS & INVOICES ---
  public getPayments(): PaymentRecord[] {
    return [...this.payments];
  }

  public recordPayment(payment: Partial<PaymentRecord>, actorEmail = 'traveljustmysuru@gmail.com'): PaymentRecord {
    const id = payment.id || `pay-${Date.now()}`;
    const total = payment.totalAmount || 0;
    const discount = payment.discountAmount || 0;
    const finalAmount = total - discount;
    const paid = payment.paidAmount || 0;
    const balance = Math.max(0, finalAmount - paid);

    const fullRecord: PaymentRecord = {
      id,
      bookingId: payment.bookingId || '',
      customerName: payment.customerName || 'Customer',
      customerPhone: payment.customerPhone || '',
      totalAmount: total,
      discountAmount: discount,
      finalAmount,
      paidAmount: paid,
      balanceAmount: balance,
      status: balance <= 0 ? 'PAID' : paid > 0 ? 'PARTIAL' : 'PENDING',
      paymentMethod: payment.paymentMethod || 'ONLINE_UPI',
      transactionRef: payment.transactionRef || `UPI-${Date.now().toString().slice(-6)}`,
      paidAt: paid > 0 ? new Date().toISOString() : undefined,
      updatedAt: new Date().toISOString(),
      notes: payment.notes || '',
    };

    const idx = this.payments.findIndex((p) => p.id === id || p.bookingId === fullRecord.bookingId);
    if (idx >= 0) {
      this.payments[idx] = fullRecord;
    } else {
      this.payments.unshift(fullRecord);
    }

    this.recordAuditLog(
      actorEmail,
      'ACCOUNTS',
      'RECORD_PAYMENT',
      'PAYMENT',
      id,
      null,
      fullRecord,
      `Recorded payment of ₹${paid} for booking #${fullRecord.bookingId} (Balance: ₹${balance})`
    );

    this.saveToDisk();
    return fullRecord;
  }

  // --- NOTIFICATIONS & AUDIT LOGS ---
  public getNotifications(): NotificationItem[] {
    return [...this.notifications];
  }

  public addNotification(item: Omit<NotificationItem, 'id' | 'timestamp' | 'read'>): NotificationItem {
    const notif: NotificationItem = {
      ...item,
      id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      read: false,
    };
    this.notifications.unshift(notif);
    if (this.notifications.length > 100) this.notifications.pop();
    this.saveToDisk();
    return notif;
  }

  public markNotificationRead(id: string): boolean {
    const n = this.notifications.find((item) => item.id === id);
    if (n) {
      n.read = true;
      this.saveToDisk();
      return true;
    }
    return false;
  }

  public markAllNotificationsRead(): void {
    this.notifications.forEach((n) => (n.read = true));
    this.saveToDisk();
  }

  public getAuditLogs(): AuditLogEntry[] {
    return [...this.auditLogs];
  }

  public recordAuditLog(
    actorEmail: string,
    actorRole: OwnerRole,
    action: string,
    entity: AuditLogEntry['entity'],
    entityId: string | undefined,
    previousValue: any,
    newValue: any,
    details: string,
    bookingId?: string
  ): AuditLogEntry {
    const entry: AuditLogEntry = {
      id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString(),
      actorEmail,
      actorRole,
      action,
      entity,
      entityId,
      bookingId,
      previousValue,
      newValue,
      details,
    };
    this.auditLogs.unshift(entry);
    if (this.auditLogs.length > 500) this.auditLogs.pop();
    this.saveToDisk();
    return entry;
  }
}

export const ownerDataStore = new OwnerDataStore();
