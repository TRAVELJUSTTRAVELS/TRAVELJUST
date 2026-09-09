import {
  BookingTypeCategory,
  DynamicFareCalculationInput,
  DynamicFareCalculationResult,
  VehicleDynamicPricingConfig,
} from "../../types/dynamicPricing";
import {
  DEFAULT_VEHICLE_CONFIGS,
  calculateDynamicFare,
} from "../../utils/dynamicFareEngine";

class PricingStore {
  private configs: Map<string, VehicleDynamicPricingConfig>;

  constructor() {
    this.configs = new Map();
    // Initialize with default vehicle configurations
    for (const [key, cfg] of Object.entries(DEFAULT_VEHICLE_CONFIGS)) {
      this.configs.set(key, JSON.parse(JSON.stringify(cfg)));
    }
  }

  public getAllConfigs(): VehicleDynamicPricingConfig[] {
    return Array.from(this.configs.values());
  }

  public getConfig(vehicleId: string): VehicleDynamicPricingConfig | undefined {
    return this.configs.get(vehicleId);
  }

  public updateConfig(
    vehicleId: string,
    updates: Partial<VehicleDynamicPricingConfig>,
    updatedBy: string = "Administrator"
  ): VehicleDynamicPricingConfig {
    const existing = this.configs.get(vehicleId) || DEFAULT_VEHICLE_CONFIGS[vehicleId];
    if (!existing) {
      throw new Error(`Vehicle pricing configuration for ${vehicleId} not found`);
    }

    const newVersion = (existing.pricingVersion || 1) + 1;
    const now = new Date().toISOString();

    const merged: VehicleDynamicPricingConfig = {
      ...existing,
      ...updates,
      vehicleId,
      pricingVersion: newVersion,
      updatedAt: now,
      updatedBy: updatedBy || "Administrator",
      effectiveFrom: updates.effectiveFrom || now,
    };

    this.configs.set(vehicleId, merged);
    return merged;
  }

  public resetToDefaults(vehicleId?: string): void {
    if (vehicleId) {
      if (DEFAULT_VEHICLE_CONFIGS[vehicleId]) {
        this.configs.set(
          vehicleId,
          JSON.parse(JSON.stringify(DEFAULT_VEHICLE_CONFIGS[vehicleId]))
        );
      }
    } else {
      this.configs.clear();
      for (const [key, cfg] of Object.entries(DEFAULT_VEHICLE_CONFIGS)) {
        this.configs.set(key, JSON.parse(JSON.stringify(cfg)));
      }
    }
  }

  public calculateAuthoritativeFare(
    input: DynamicFareCalculationInput
  ): DynamicFareCalculationResult {
    const vehicleConfig = this.configs.get(input.vehicleId) || DEFAULT_VEHICLE_CONFIGS[input.vehicleId];
    return calculateDynamicFare({
      ...input,
      customPricingConfig: vehicleConfig,
    });
  }

  public calculateAllVehicles(
    input: Omit<DynamicFareCalculationInput, "vehicleId">
  ): Record<string, DynamicFareCalculationResult> {
    const results: Record<string, DynamicFareCalculationResult> = {};
    for (const [vehicleId, config] of this.configs.entries()) {
      if (config.active !== false) {
        results[vehicleId] = calculateDynamicFare({
          ...input,
          vehicleId,
          customPricingConfig: config,
        });
      }
    }
    return results;
  }
}

export const serverPricingStore = new PricingStore();
