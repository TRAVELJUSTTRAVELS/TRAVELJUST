import { DynamicAddOnOption, SelectedAddOn } from '../types/addOns';
import { ServiceType } from '../types';

export const FALLBACK_ADD_ONS: DynamicAddOnOption[] = [
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

class AddOnService {
  private cache: DynamicAddOnOption[] | null = null;
  private cacheTimestamp = 0;
  private readonly CACHE_TTL = 30000; // 30s cache

  /**
   * Fetch active add-ons for customer booking flow (filtered by service and vehicle)
   */
  async getAvailableAddOns(serviceType?: ServiceType, vehicleId?: string): Promise<DynamicAddOnOption[]> {
    try {
      const params = new URLSearchParams();
      if (serviceType) params.set('service', serviceType);
      if (vehicleId) params.set('vehicle', vehicleId);

      const res = await fetch(`/api/addons?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.addons) && json.addons.length > 0) {
          this.cache = json.addons;
          this.cacheTimestamp = Date.now();
          return json.addons;
        }
      }
    } catch (err) {
      console.warn('Could not fetch /api/addons from backend, using fallback cache:', err);
    }

    // Fallback if network offline or server starting
    return this.filterFallback(serviceType, vehicleId);
  }

  /**
   * Fetch all add-ons including disabled ones for the Owner Portal
   */
  async getOwnerAddOns(): Promise<DynamicAddOnOption[]> {
    try {
      const res = await fetch('/api/owner/addons');
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.addons)) {
          return json.addons;
        }
      }
    } catch (err) {
      console.warn('Could not fetch /api/owner/addons:', err);
    }
    return FALLBACK_ADD_ONS;
  }

  /**
   * Save or update an add-on from the Owner Portal
   */
  async saveAddOn(addon: Partial<DynamicAddOnOption>, actorEmail = 'traveljustmysuru@gmail.com'): Promise<DynamicAddOnOption | null> {
    try {
      const res = await fetch('/api/owner/addons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...addon, actorEmail }),
      });
      const json = await res.json();
      if (json.success) {
        this.cache = null; // bust cache
        return json.addon;
      }
    } catch (err) {
      console.warn('saveAddOn error:', err);
    }
    return null;
  }

  /**
   * Toggle active status of an add-on
   */
  async toggleAddOn(id: string, enabled: boolean, actorEmail = 'traveljustmysuru@gmail.com'): Promise<DynamicAddOnOption | null> {
    try {
      const res = await fetch(`/api/owner/addons/${id}/toggle`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled, actorEmail }),
      });
      const json = await res.json();
      if (json.success) {
        this.cache = null;
        return json.addon;
      }
    } catch (err) {
      console.warn('toggleAddOn error:', err);
    }
    return null;
  }

  /**
   * Delete an add-on
   */
  async deleteAddOn(id: string, actorEmail = 'traveljustmysuru@gmail.com'): Promise<boolean> {
    try {
      const res = await fetch(`/api/owner/addons/${id}?actorEmail=${encodeURIComponent(actorEmail)}`, {
        method: 'DELETE',
      });
      const json = await res.json();
      if (json.success) {
        this.cache = null;
        return true;
      }
    } catch (err) {
      console.warn('deleteAddOn error:', err);
    }
    return false;
  }

  /**
   * Helper to calculate total price for selected add-ons given trip duration or days
   */
  calculateAddOnsTotal(selectedAddOns: SelectedAddOn[], tripDays = 1): number {
    return selectedAddOns.reduce((sum, item) => {
      const multiplier = item.pricingType === 'per_day' ? Math.max(1, tripDays) : 1;
      return sum + item.unitPrice * item.quantity * multiplier;
    }, 0);
  }

  private filterFallback(serviceType?: ServiceType, vehicleId?: string): DynamicAddOnOption[] {
    return FALLBACK_ADD_ONS.filter((item) => {
      if (!item.enabled) return false;
      if (
        serviceType &&
        item.applicableServices.length > 0 &&
        !item.applicableServices.includes('all') &&
        !item.applicableServices.includes(serviceType)
      ) {
        return false;
      }
      if (
        vehicleId &&
        item.applicableVehicles &&
        item.applicableVehicles.length > 0 &&
        !item.applicableVehicles.includes('all') &&
        !item.applicableVehicles.includes(vehicleId)
      ) {
        return false;
      }
      return true;
    });
  }
}

export const addOnService = new AddOnService();
