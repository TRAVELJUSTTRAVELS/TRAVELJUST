import {
  VehicleRecord,
  ChauffeurRecord,
  WhatsAppConversationThread,
  WhatsAppQueueItem,
  WhatsAppGatewaySettings,
  PaymentRecord,
  DiscountRule,
  AuditLogEntry,
  SiteOptimizerSettings,
  NotificationItem,
  BookingLifecycleStatus,
} from '../types/owner';

export interface OwnerDashboardStats {
  todayBookingsCount: number;
  pendingRequestsCount: number;
  confirmedBookingsCount: number;
  activeTripsCount: number;
  completedTripsCount: number;
  cancelledBookingsCount: number;
  totalRevenue: number;
  pendingPaymentsTotal: number;
  fleet: {
    totalVehicles: number;
    availableVehicles: number;
    assignedVehicles: number;
    maintenanceVehicles: number;
    totalChauffeurs: number;
    availableChauffeurs: number;
    onDutyChauffeurs: number;
    utilizationRate: number;
  };
  alerts: {
    unreadNotificationsCount: number;
    unreadWhatsAppCount: number;
    expiringDocumentsCount: number;
  };
  timestamp: string;
}

class OwnerService {
  // Stats
  async getDashboardStats(): Promise<OwnerDashboardStats | null> {
    try {
      const res = await fetch('/api/owner/stats');
      const json = await res.json();
      return json.success ? json.data : null;
    } catch (e) {
      console.warn('getDashboardStats failed:', e);
      return null;
    }
  }

  // Bookings
  async getBookings(filters?: {
    status?: string;
    service?: string;
    search?: string;
    date?: string;
    startDate?: string;
    endDate?: string;
    dateField?: 'travel' | 'created';
  }): Promise<any[]> {
    try {
      const params = new URLSearchParams();
      if (filters?.status) params.set('status', filters.status);
      if (filters?.service) params.set('service', filters.service);
      if (filters?.search) params.set('search', filters.search);
      if (filters?.date) params.set('date', filters.date);
      if (filters?.startDate) params.set('startDate', filters.startDate);
      if (filters?.endDate) params.set('endDate', filters.endDate);
      if (filters?.dateField) params.set('dateField', filters.dateField);

      const res = await fetch(`/api/owner/bookings?${params.toString()}`);
      const json = await res.json();
      return json.success ? json.bookings : [];
    } catch (e) {
      console.warn('getBookings failed:', e);
      return [];
    }
  }

  async updateBookingStatus(
    referenceId: string,
    status: BookingLifecycleStatus,
    note?: string,
    actorEmail = 'traveljustmysuru@gmail.com'
  ): Promise<boolean> {
    try {
      const res = await fetch(`/api/owner/bookings/${referenceId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, note, actorEmail }),
      });
      const json = await res.json();
      return Boolean(json.success);
    } catch (e) {
      console.warn('updateBookingStatus failed:', e);
      return false;
    }
  }

  async assignFleet(
    referenceId: string,
    vehicleId?: string,
    chauffeurId?: string,
    actorEmail = 'traveljustmysuru@gmail.com'
  ): Promise<boolean> {
    try {
      const res = await fetch(`/api/owner/bookings/${referenceId}/assign-fleet`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vehicleId, chauffeurId, actorEmail }),
      });
      const json = await res.json();
      return Boolean(json.success);
    } catch (e) {
      console.warn('assignFleet failed:', e);
      return false;
    }
  }

  async updateQuote(
    referenceId: string,
    updatedFare: number,
    reason?: string,
    actorEmail = 'traveljustmysuru@gmail.com'
  ): Promise<boolean> {
    try {
      const res = await fetch(`/api/owner/bookings/${referenceId}/quote`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ updatedFare, reason, actorEmail }),
      });
      const json = await res.json();
      return Boolean(json.success);
    } catch (e) {
      console.warn('updateQuote failed:', e);
      return false;
    }
  }

  // Vehicles
  async getVehicles(): Promise<VehicleRecord[]> {
    try {
      const res = await fetch('/api/fleet/vehicles');
      const json = await res.json();
      return json.success ? json.vehicles : [];
    } catch (e) {
      console.warn('getVehicles failed:', e);
      return [];
    }
  }

  async saveVehicle(veh: Partial<VehicleRecord>): Promise<VehicleRecord | null> {
    try {
      const isEdit = Boolean(veh.id);
      const url = isEdit ? `/api/fleet/vehicles/${veh.id}` : '/api/fleet/vehicles';
      const method = isEdit ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(veh),
      });
      const json = await res.json();
      return json.success ? json.vehicle : null;
    } catch (e) {
      console.warn('saveVehicle failed:', e);
      return null;
    }
  }

  async deleteVehicle(id: string): Promise<boolean> {
    try {
      const res = await fetch(`/api/fleet/vehicles/${id}`, { method: 'DELETE' });
      const json = await res.json();
      return Boolean(json.success);
    } catch (e) {
      console.warn('deleteVehicle failed:', e);
      return false;
    }
  }

  // Chauffeurs
  async getChauffeurs(): Promise<ChauffeurRecord[]> {
    try {
      const res = await fetch('/api/fleet/chauffeurs');
      const json = await res.json();
      return json.success ? json.chauffeurs : [];
    } catch (e) {
      console.warn('getChauffeurs failed:', e);
      return [];
    }
  }

  async saveChauffeur(chf: Partial<ChauffeurRecord>): Promise<ChauffeurRecord | null> {
    try {
      const isEdit = Boolean(chf.id);
      const url = isEdit ? `/api/fleet/chauffeurs/${chf.id}` : '/api/fleet/chauffeurs';
      const method = isEdit ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(chf),
      });
      const json = await res.json();
      return json.success ? json.chauffeur : null;
    } catch (e) {
      console.warn('saveChauffeur failed:', e);
      return null;
    }
  }

  // Check Availability
  async checkAvailability(pickupDate: string, returnDate?: string, vehicleCategory?: string) {
    try {
      const res = await fetch('/api/fleet/check-availability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pickupDate, returnDate, vehicleCategory }),
      });
      return await res.json();
    } catch (e) {
      console.warn('checkAvailability failed:', e);
      return null;
    }
  }

  // WhatsApp
  async getWhatsAppThreads(): Promise<WhatsAppConversationThread[]> {
    try {
      const res = await fetch('/api/whatsapp/threads');
      const json = await res.json();
      return json.success ? json.threads : [];
    } catch (e) {
      console.warn('getWhatsAppThreads failed:', e);
      return [];
    }
  }

  async sendWhatsAppMessage(
    threadId: string,
    text: string,
    templateName?: string,
    sender: 'owner' | 'system' | 'driver' | 'fleet_manager' = 'owner',
    category?: string
  ): Promise<boolean> {
    try {
      const res = await fetch('/api/whatsapp/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ threadId, text, sender, templateName, category }),
      });
      const json = await res.json();
      return Boolean(json.success);
    } catch (e) {
      console.warn('sendWhatsAppMessage failed:', e);
      return false;
    }
  }

  async getWhatsAppQueue(): Promise<WhatsAppQueueItem[]> {
    try {
      const res = await fetch('/api/whatsapp/queue');
      const json = await res.json();
      return json.success ? json.queue : [];
    } catch (e) {
      console.warn('getWhatsAppQueue failed:', e);
      return [];
    }
  }

  async enqueueWhatsApp(data: Partial<WhatsAppQueueItem>): Promise<WhatsAppQueueItem | null> {
    try {
      const res = await fetch('/api/whatsapp/queue/enqueue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      return json.success ? json.queueItem : null;
    } catch (e) {
      console.warn('enqueueWhatsApp failed:', e);
      return null;
    }
  }

  async clearWhatsAppQueue(): Promise<boolean> {
    try {
      const res = await fetch('/api/whatsapp/queue/clear', { method: 'POST' });
      const json = await res.json();
      return Boolean(json.success);
    } catch (e) {
      console.warn('clearWhatsAppQueue failed:', e);
      return false;
    }
  }

  async getWhatsAppGatewaySettings(): Promise<WhatsAppGatewaySettings | null> {
    try {
      const res = await fetch('/api/whatsapp/settings');
      const json = await res.json();
      return json.success ? json.settings : null;
    } catch (e) {
      console.warn('getWhatsAppGatewaySettings failed:', e);
      return null;
    }
  }

  async updateWhatsAppGatewaySettings(settings: Partial<WhatsAppGatewaySettings>): Promise<WhatsAppGatewaySettings | null> {
    try {
      const res = await fetch('/api/whatsapp/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      const json = await res.json();
      return json.success ? json.settings : null;
    } catch (e) {
      console.warn('updateWhatsAppGatewaySettings failed:', e);
      return null;
    }
  }

  async triggerWhatsAppEvent(payload: {
    eventType: 'CUSTOMER_LOGIN' | 'BOOKING_CREATED' | 'DRIVER_ASSIGNED' | 'PAYMENT_RECORDED';
    bookingData?: any;
    customerData?: any;
    driverData?: any;
    paymentData?: any;
  }): Promise<boolean> {
    try {
      const res = await fetch('/api/whatsapp/trigger-event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      return Boolean(json.success);
    } catch (e) {
      console.warn('triggerWhatsAppEvent failed:', e);
      return false;
    }
  }

  // Payments
  async getPayments(): Promise<PaymentRecord[]> {
    try {
      const res = await fetch('/api/payments');
      const json = await res.json();
      return json.success ? json.payments : [];
    } catch (e) {
      console.warn('getPayments failed:', e);
      return [];
    }
  }

  async recordPayment(payment: Partial<PaymentRecord>): Promise<PaymentRecord | null> {
    try {
      const res = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payment),
      });
      const json = await res.json();
      return json.success ? json.payment : null;
    } catch (e) {
      console.warn('recordPayment failed:', e);
      return null;
    }
  }

  // Discounts
  async getDiscounts(): Promise<DiscountRule[]> {
    try {
      const res = await fetch('/api/discounts');
      const json = await res.json();
      return json.success ? json.discounts : [];
    } catch (e) {
      console.warn('getDiscounts failed:', e);
      return [];
    }
  }

  async saveDiscount(rule: Partial<DiscountRule>): Promise<DiscountRule | null> {
    try {
      const res = await fetch('/api/discounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rule),
      });
      const json = await res.json();
      return json.success ? json.discount : null;
    } catch (e) {
      console.warn('saveDiscount failed:', e);
      return null;
    }
  }

  async deleteDiscount(id: string): Promise<boolean> {
    try {
      const res = await fetch(`/api/discounts/${id}`, { method: 'DELETE' });
      const json = await res.json();
      return Boolean(json.success);
    } catch (e) {
      console.warn('deleteDiscount failed:', e);
      return false;
    }
  }

  // Site Optimizer & SEO
  async getSiteOptimizer(): Promise<SiteOptimizerSettings | null> {
    try {
      const res = await fetch('/api/site-optimizer');
      const json = await res.json();
      return json.success ? json.settings : null;
    } catch (e) {
      console.warn('getSiteOptimizer failed:', e);
      return null;
    }
  }

  async saveSiteOptimizer(
    settings: Partial<SiteOptimizerSettings>,
    publish = true
  ): Promise<{ success: boolean; settings?: SiteOptimizerSettings; message?: string }> {
    try {
      const res = await fetch('/api/site-optimizer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings, publish }),
      });
      return await res.json();
    } catch (e) {
      console.warn('saveSiteOptimizer failed:', e);
      return { success: false, message: 'Network error saving SEO settings' };
    }
  }

  // Audit Logs
  async getAuditLogs(): Promise<AuditLogEntry[]> {
    try {
      const res = await fetch('/api/owner/audit-logs');
      const json = await res.json();
      return json.success ? json.logs : [];
    } catch (e) {
      console.warn('getAuditLogs failed:', e);
      return [];
    }
  }

  // Notifications
  async getNotifications(): Promise<NotificationItem[]> {
    try {
      const res = await fetch('/api/owner/notifications');
      const json = await res.json();
      return json.success ? json.notifications : [];
    } catch (e) {
      console.warn('getNotifications failed:', e);
      return [];
    }
  }

  async markNotificationRead(id: string): Promise<boolean> {
    try {
      const res = await fetch(`/api/owner/notifications/${id}/read`, { method: 'POST' });
      const json = await res.json();
      return Boolean(json.success);
    } catch (e) {
      return false;
    }
  }

  async markAllNotificationsRead(): Promise<boolean> {
    try {
      const res = await fetch('/api/owner/notifications/mark-all-read', { method: 'POST' });
      const json = await res.json();
      return Boolean(json.success);
    } catch (e) {
      return false;
    }
  }
}

export const ownerService = new OwnerService();
