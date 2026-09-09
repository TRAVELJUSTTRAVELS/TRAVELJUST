import {
  BookingTypeCategory,
  DynamicFareCalculationInput,
  DynamicFareCalculationResult,
  VehicleDynamicPricingConfig,
} from '../types/dynamicPricing';
import {
  DEFAULT_VEHICLE_CONFIGS,
  calculateDynamicFare,
} from '../utils/dynamicFareEngine';

const LOCAL_STORAGE_KEY = 'tj_dynamic_pricing_configs_v1';

class FareService {
  private memoryConfigs: Record<string, VehicleDynamicPricingConfig>;

  constructor() {
    this.memoryConfigs = this.loadInitialConfigs();
  }

  private loadInitialConfigs(): Record<string, VehicleDynamicPricingConfig> {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && typeof parsed === 'object') {
          return { ...DEFAULT_VEHICLE_CONFIGS, ...parsed };
        }
      }
    } catch (e) {
      console.warn('Could not read pricing from localStorage:', e);
    }
    return { ...DEFAULT_VEHICLE_CONFIGS };
  }

  private saveToStorage(configs: Record<string, VehicleDynamicPricingConfig>): void {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(configs));
    } catch (e) {
      console.warn('Could not save pricing to localStorage:', e);
    }
  }

  /**
   * Fetch all vehicle configurations from backend (with local fallback)
   */
  public async getConfigs(): Promise<VehicleDynamicPricingConfig[]> {
    try {
      const res = await fetch('/api/fare/configs');
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.configs)) {
          const newMap: Record<string, VehicleDynamicPricingConfig> = {};
          data.configs.forEach((cfg: VehicleDynamicPricingConfig) => {
            newMap[cfg.vehicleId] = cfg;
          });
          this.memoryConfigs = { ...this.memoryConfigs, ...newMap };
          this.saveToStorage(this.memoryConfigs);
          return data.configs;
        }
      }
    } catch (err) {
      console.warn('Backend fare configs fetch failed, using local cache:', err);
    }
    return Object.values(this.memoryConfigs);
  }

  /**
   * Get cached configuration for a vehicle
   */
  public getConfigSync(vehicleId: string): VehicleDynamicPricingConfig {
    return this.memoryConfigs[vehicleId] || DEFAULT_VEHICLE_CONFIGS[vehicleId] || DEFAULT_VEHICLE_CONFIGS['toyota-etios'];
  }

  /**
   * Update configuration for a vehicle on backend (authoritative)
   */
  public async updateConfig(
    vehicleId: string,
    updates: Partial<VehicleDynamicPricingConfig>,
    updatedBy = 'TRAVEL JUST Administrator'
  ): Promise<VehicleDynamicPricingConfig> {
    const existing = this.getConfigSync(vehicleId);
    const newVersion = (existing.pricingVersion || 1) + 1;
    const now = new Date().toISOString();

    const localUpdated: VehicleDynamicPricingConfig = {
      ...existing,
      ...updates,
      vehicleId,
      pricingVersion: newVersion,
      updatedAt: now,
      updatedBy,
      effectiveFrom: updates.effectiveFrom || now,
    };

    // Update memory & local storage immediately
    this.memoryConfigs[vehicleId] = localUpdated;
    this.saveToStorage(this.memoryConfigs);

    try {
      const res = await fetch(`/api/fare/configs/${vehicleId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-user': updatedBy,
        },
        body: JSON.stringify(updates),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.config) {
          this.memoryConfigs[vehicleId] = data.config;
          this.saveToStorage(this.memoryConfigs);
          return data.config;
        }
      }
    } catch (err) {
      console.warn('Could not persist pricing update to backend:', err);
    }

    return localUpdated;
  }

  /**
   * Reset vehicle pricing to default values
   */
  public async resetToDefaults(vehicleId?: string): Promise<VehicleDynamicPricingConfig[]> {
    if (vehicleId) {
      if (DEFAULT_VEHICLE_CONFIGS[vehicleId]) {
        this.memoryConfigs[vehicleId] = JSON.parse(JSON.stringify(DEFAULT_VEHICLE_CONFIGS[vehicleId]));
      }
    } else {
      this.memoryConfigs = JSON.parse(JSON.stringify(DEFAULT_VEHICLE_CONFIGS));
    }
    this.saveToStorage(this.memoryConfigs);

    try {
      await fetch('/api/fare/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vehicleId }),
      });
    } catch (e) {
      console.warn('Backend fare reset failed:', e);
    }

    return Object.values(this.memoryConfigs);
  }

  /**
   * Calculate authoritative fare with backend or offline fallback
   */
  public async calculateFare(
    input: DynamicFareCalculationInput
  ): Promise<DynamicFareCalculationResult> {
    try {
      const res = await fetch('/api/fare/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.fare) {
          return data.fare;
        }
      }
    } catch (err) {
      // Offline / fallback to local engine
    }

    const config = this.getConfigSync(input.vehicleId);
    return calculateDynamicFare({
      ...input,
      customPricingConfig: config,
    });
  }

  /**
   * Live preview fare tester
   */
  public async previewFare(params: {
    origin: string;
    destination: string;
    distanceKm?: number;
    durationMinutes?: number;
    bookingType: BookingTypeCategory;
    vehicleId: string;
    pickupTime?: string;
    roundTripDays?: number;
  }): Promise<DynamicFareCalculationResult> {
    try {
      const res = await fetch('/api/fare/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.preview) {
          return data.preview;
        }
      }
    } catch (e) {
      // fallback
    }

    const config = this.getConfigSync(params.vehicleId);
    return calculateDynamicFare({
      origin: params.origin,
      destination: params.destination,
      distanceKm: params.distanceKm || 140,
      durationMinutes: params.durationMinutes || 180,
      bookingType: params.bookingType,
      vehicleId: params.vehicleId,
      pickupTime: params.pickupTime,
      roundTripDays: params.roundTripDays || 1,
      customPricingConfig: config,
    });
  }
}

export const fareService = new FareService();
