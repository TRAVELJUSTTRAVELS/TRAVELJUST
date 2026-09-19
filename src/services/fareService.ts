import {
  BookingTypeCategory,
  DistanceRoundingRule,
  DynamicFareCalculationInput,
  DynamicFareCalculationResult,
  FareAuditLogEntry,
  StatePairPricingRule,
  VehicleDynamicPricingConfig,
} from '../types/dynamicPricing';
import {
  IndianState,
  InterStateAdditionalChargeConfig,
  InterStateFareCalculationInput,
  InterStateFareCalculationResult,
  InterStateOneWayVehicleRate,
  InterStateStatePairRule,
} from '../types/interstateOneWay';
import {
  DEFAULT_STATE_PAIR_RULES,
  DEFAULT_VEHICLE_CONFIGS,
  calculateDynamicFare,
} from '../utils/dynamicFareEngine';

const LOCAL_STORAGE_KEY = 'tj_dynamic_pricing_configs_v1';
const STATE_PAIRS_KEY = 'tj_state_pair_rules_v1';
const SETTINGS_KEY = 'tj_fare_settings_v1';

const ALLOWED_FLEET_IDS = ['sedan-4-1', 'suv-6-1', 'innova', 'innova-crysta', 'tempo-traveller-12-1'];

class FareService {
  private memoryConfigs: Record<string, VehicleDynamicPricingConfig>;
  private memoryStatePairs: StatePairPricingRule[];
  private memoryRounding: DistanceRoundingRule;

  constructor() {
    this.memoryConfigs = this.loadInitialConfigs();
    this.memoryStatePairs = this.loadInitialStatePairs();
    this.memoryRounding = this.loadInitialRounding();
  }

  private loadInitialRounding(): DistanceRoundingRule {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const stored = window.localStorage.getItem(SETTINGS_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed?.distanceRounding) return parsed.distanceRounding;
        }
      }
    } catch (e) {
      // fallback
    }
    return 'NEAREST_1';
  }

  private loadInitialStatePairs(): StatePairPricingRule[] {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const stored = window.localStorage.getItem(STATE_PAIRS_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      }
    } catch (e) {
      // fallback
    }
    return JSON.parse(JSON.stringify(DEFAULT_STATE_PAIR_RULES));
  }

  private loadInitialConfigs(): Record<string, VehicleDynamicPricingConfig> {
    try {
      if (typeof window !== 'undefined' && typeof window.localStorage !== 'undefined') {
        const stored = window.localStorage.getItem(LOCAL_STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed && typeof parsed === 'object') {
            if (parsed['ertiga'] && !parsed['suv-6-1']) {
              parsed['suv-6-1'] = {
                ...parsed['ertiga'],
                vehicleId: 'suv-6-1',
                vehicleName: 'SUV (6+1)',
                vehicleCategory: 'SUV (6+1)',
              };
            }

            const cleaned: Record<string, VehicleDynamicPricingConfig> = {};
            ALLOWED_FLEET_IDS.forEach((id) => {
              if (parsed[id]) {
                cleaned[id] = parsed[id];
              } else if (DEFAULT_VEHICLE_CONFIGS[id]) {
                cleaned[id] = DEFAULT_VEHICLE_CONFIGS[id];
              }
            });

            if (cleaned['sedan-4-1']) cleaned['sedan-4-1'].vehicleName = 'Sedan (4+1)';
            if (cleaned['suv-6-1']) cleaned['suv-6-1'].vehicleName = 'SUV (6+1)';
            if (cleaned['innova']) cleaned['innova'].vehicleName = 'INNOVA';
            if (cleaned['innova-crysta']) cleaned['innova-crysta'].vehicleName = 'INNOVA CRYSTA';
            if (cleaned['tempo-traveller-12-1']) cleaned['tempo-traveller-12-1'].vehicleName = 'TEMPO TRAVELLER (12+1)';

            // Ensure non-LOCAL booking types do not have lingering hourly rates
            const nonLocalTypes: BookingTypeCategory[] = ['ONE_WAY', 'ROUND_TRIP', 'AIRPORT_TRANSFER', 'OUTSTATION'];
            Object.values(cleaned).forEach((cfg: any) => {
              if (cfg && cfg.pricingByBookingType) {
                nonLocalTypes.forEach((bt) => {
                  if (cfg.pricingByBookingType[bt]) {
                    cfg.pricingByBookingType[bt].hourlyRate = 0;
                    cfg.pricingByBookingType[bt].extraPerHourRate = 0;
                    cfg.pricingByBookingType[bt].includedHours = 0;
                  }
                });
              }
            });
            this.saveToStorage(cleaned);
            return cleaned;
          }
        }
      }
    } catch (e) {
      console.warn('Could not read pricing from localStorage:', e);
    }
    return { ...DEFAULT_VEHICLE_CONFIGS };
  }

  private saveToStorage(configs: Record<string, VehicleDynamicPricingConfig>): void {
    try {
      if (typeof window !== 'undefined' && typeof window.localStorage !== 'undefined') {
        window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(configs));
      }
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
            if (ALLOWED_FLEET_IDS.includes(cfg.vehicleId)) {
              newMap[cfg.vehicleId] = cfg;
            }
          });
          this.memoryConfigs = { ...this.memoryConfigs, ...newMap };
          this.saveToStorage(this.memoryConfigs);
          return Object.values(this.memoryConfigs);
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
    return (
      this.memoryConfigs[vehicleId] ||
      DEFAULT_VEHICLE_CONFIGS[vehicleId] ||
      (vehicleId === 'ertiga' || vehicleId === 'suv'
        ? this.memoryConfigs['suv-6-1'] || DEFAULT_VEHICLE_CONFIGS['suv-6-1']
        : undefined) ||
      (vehicleId === 'toyota-etios' || vehicleId === 'swift-desire'
        ? this.memoryConfigs['sedan-4-1'] || DEFAULT_VEHICLE_CONFIGS['sedan-4-1']
        : undefined) ||
      (vehicleId === 'tempo-traveller' || vehicleId === 'tempo-traveller-14-1'
        ? this.memoryConfigs['tempo-traveller-12-1'] || DEFAULT_VEHICLE_CONFIGS['tempo-traveller-12-1']
        : undefined) ||
      (vehicleId === 'innova-6-1' || vehicleId === 'innova-7-1'
        ? this.memoryConfigs['innova'] || DEFAULT_VEHICLE_CONFIGS['innova']
        : undefined) ||
      DEFAULT_VEHICLE_CONFIGS['sedan-4-1']
    );
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
      statePairRules: input.statePairRules || this.memoryStatePairs,
      distanceRounding: input.distanceRounding || this.memoryRounding,
    });
  }

  /**
   * Get Inter-State Pair Pricing Rules
   */
  public async getStatePairRules(): Promise<StatePairPricingRule[]> {
    try {
      const res = await fetch('/api/fare/state-pairs');
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.rules)) {
          this.memoryStatePairs = data.rules;
          if (typeof window !== 'undefined' && window.localStorage) {
            window.localStorage.setItem(STATE_PAIRS_KEY, JSON.stringify(data.rules));
          }
          return data.rules;
        }
      }
    } catch (e) {
      console.warn('Could not fetch state pairs from server, using cache');
    }
    return this.memoryStatePairs;
  }

  /**
   * Save (create or update) State Pair Rule
   */
  public async saveStatePairRule(
    rule: StatePairPricingRule,
    adminUser = 'TRAVEL JUST Administrator'
  ): Promise<StatePairPricingRule> {
    const idx = this.memoryStatePairs.findIndex((r) => r.id === rule.id);
    const updated = { ...rule, updatedAt: new Date().toISOString() };
    if (idx >= 0) {
      this.memoryStatePairs[idx] = updated;
    } else {
      this.memoryStatePairs.push(updated);
    }

    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(STATE_PAIRS_KEY, JSON.stringify(this.memoryStatePairs));
    }

    try {
      const res = await fetch('/api/fare/state-pairs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-user': adminUser,
        },
        body: JSON.stringify(rule),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.rule) {
          return data.rule;
        }
      }
    } catch (e) {
      console.warn('Backend save state pair failed:', e);
    }

    return updated;
  }

  /**
   * Delete State Pair Rule
   */
  public async deleteStatePairRule(
    id: string,
    adminUser = 'TRAVEL JUST Administrator'
  ): Promise<boolean> {
    this.memoryStatePairs = this.memoryStatePairs.filter((r) => r.id !== id);
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(STATE_PAIRS_KEY, JSON.stringify(this.memoryStatePairs));
    }

    try {
      const res = await fetch(`/api/fare/state-pairs/${id}`, {
        method: 'DELETE',
        headers: { 'x-admin-user': adminUser },
      });
      if (res.ok) {
        const data = await res.json();
        return data.success;
      }
    } catch (e) {
      console.warn('Backend delete state pair failed:', e);
    }
    return true;
  }

  /**
   * Get Audit Logs
   */
  public async getAuditLogs(): Promise<FareAuditLogEntry[]> {
    try {
      const res = await fetch('/api/fare/audit-logs');
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.logs)) {
          return data.logs;
        }
      }
    } catch (e) {
      console.warn('Backend audit logs fetch failed:', e);
    }
    return [];
  }

  /**
   * Get Settings
   */
  public async getSettings(): Promise<{ distanceRounding: DistanceRoundingRule }> {
    try {
      const res = await fetch('/api/fare/settings');
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.settings) {
          this.memoryRounding = data.settings.distanceRounding;
          return data.settings;
        }
      }
    } catch (e) {
      // fallback
    }
    return { distanceRounding: this.memoryRounding };
  }

  /**
   * Update Settings
   */
  public async updateSettings(
    settings: { distanceRounding: DistanceRoundingRule },
    adminUser = 'TRAVEL JUST Administrator'
  ): Promise<void> {
    this.memoryRounding = settings.distanceRounding;
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    }
    try {
      await fetch('/api/fare/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-user': adminUser,
        },
        body: JSON.stringify(settings),
      });
    } catch (e) {
      console.warn('Backend settings update failed:', e);
    }
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
      statePairRules: this.memoryStatePairs,
      distanceRounding: this.memoryRounding,
    });
  }

  // =========================================================================
  // INTER-STATE ONE-WAY FARE ENGINE CLIENT METHODS
  // =========================================================================

  /**
   * Authoritative calculation for Inter-State One-Way journeys
   */
  public async calculateInterStateOneWayFare(
    input: InterStateFareCalculationInput
  ): Promise<InterStateFareCalculationResult> {
    try {
      const res = await fetch('/api/fare/interstate-oneway/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      if (res.ok) {
        return await res.json();
      }
      const errData = await res.json().catch(() => ({}));
      return {
        success: false,
        error: errData.error || 'SERVER_ERROR',
        errorMessage: errData.errorMessage || 'Unable to calculate Inter-State fare.',
        isInterState: false,
        currency: 'INR',
      };
    } catch (e: any) {
      return {
        success: false,
        error: 'NETWORK_ERROR',
        errorMessage: e?.message || 'Network communication error.',
        isInterState: false,
        currency: 'INR',
      };
    }
  }

  /**
   * Fetch Inter-State One-Way rates and configuration
   */
  public async getInterStateRates(): Promise<{
    pricingVersion: string;
    rates: InterStateOneWayVehicleRate[];
    additionalConfig: InterStateAdditionalChargeConfig;
    statesCount: number;
  }> {
    const res = await fetch('/api/fare/interstate-oneway/rates');
    if (!res.ok) throw new Error('Failed to fetch Inter-State rates');
    return await res.json();
  }

  /**
   * Update Inter-State One-Way rate for vehicle
   */
  public async updateInterStateRate(
    vehicleId: string,
    updates: Partial<InterStateOneWayVehicleRate>,
    adminUser = 'Administrator'
  ): Promise<any> {
    const res = await fetch(`/api/fare/interstate-oneway/rates/${vehicleId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-user': adminUser,
      },
      body: JSON.stringify(updates),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to update Inter-State vehicle rate');
    }
    return await res.json();
  }

  /**
   * Fetch state-pair rules
   */
  public async getInterStateStatePairs(): Promise<InterStateStatePairRule[]> {
    const res = await fetch('/api/fare/interstate-oneway/state-pairs');
    if (!res.ok) throw new Error('Failed to fetch state pairs');
    const data = await res.json();
    return data.statePairs || [];
  }

  /**
   * Save or update state-pair rule
   */
  public async saveInterStateStatePair(
    rule: InterStateStatePairRule,
    adminUser = 'Administrator'
  ): Promise<any> {
    const res = await fetch('/api/fare/interstate-oneway/state-pairs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-user': adminUser,
      },
      body: JSON.stringify(rule),
    });
    if (!res.ok) throw new Error('Failed to save state pair rule');
    return await res.json();
  }

  /**
   * Update additional configuration (Toll mode, parking, etc.)
   */
  public async updateInterStateAdditionalConfig(
    updates: Partial<InterStateAdditionalChargeConfig>,
    adminUser = 'Administrator'
  ): Promise<any> {
    const res = await fetch('/api/fare/interstate-oneway/additional-config', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-user': adminUser,
      },
      body: JSON.stringify(updates),
    });
    if (!res.ok) throw new Error('Failed to update additional config');
    return await res.json();
  }

  /**
   * Fetch all 28 states + 8 UTs
   */
  public async getInterStateStates(): Promise<IndianState[]> {
    const res = await fetch('/api/fare/interstate-oneway/states');
    if (!res.ok) throw new Error('Failed to fetch Indian states');
    const data = await res.json();
    return data.states || [];
  }

  /**
   * Run the 10 automated test cases for Inter-State One-Way
   */
  public async runInterStateTests(): Promise<any> {
    const res = await fetch('/api/fare/interstate-oneway/run-tests');
    if (!res.ok) throw new Error('Failed to run Inter-State tests');
    return await res.json();
  }
}

export const fareService = new FareService();
