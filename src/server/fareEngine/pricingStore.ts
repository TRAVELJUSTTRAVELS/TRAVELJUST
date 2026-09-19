import {
  BookingTypeCategory,
  DistanceRoundingRule,
  DualEngineFareComparison,
  DualEngineVehicleComparison,
  DynamicFareCalculationInput,
  DynamicFareCalculationResult,
  FareAuditLogEntry,
  FareEngineType,
  StatePairPricingRule,
  VehicleDynamicPricingConfig,
} from "../../types/dynamicPricing";
import {
  DEFAULT_STATE_PAIR_RULES,
  DEFAULT_VEHICLE_CONFIGS,
  calculateDynamicFare,
} from "../../utils/dynamicFareEngine";
import {
  calculateEngineAFare,
  calculateEngineBFare,
  calculateDualEngineFare,
  calculateDualEngineAllVehicles,
} from "../../utils/dualFareEngine";

class PricingStore {
  private configs: Map<string, VehicleDynamicPricingConfig>;
  private statePairRules: StatePairPricingRule[];
  private auditLogs: FareAuditLogEntry[];
  private distanceRounding: DistanceRoundingRule;
  private activeEngine: FareEngineType;

  constructor() {
    this.configs = new Map();
    this.distanceRounding = "NEAREST_1";
    this.activeEngine = "ENGINE_A";
    this.statePairRules = JSON.parse(JSON.stringify(DEFAULT_STATE_PAIR_RULES));
    this.auditLogs = [
      {
        id: "audit_init_1",
        timestamp: "2026-03-01T00:00:00.000Z",
        user: "System Initializer",
        action: "INITIALIZE",
        vehicleId: "all",
        summary: "Live Dynamic Price & Fare Engine initialized with centralized 20-step calculation and ONE-WAY Inter-State rules.",
      },
    ];

    // Initialize with default vehicle configurations
    for (const [key, cfg] of Object.entries(DEFAULT_VEHICLE_CONFIGS)) {
      this.configs.set(key, JSON.parse(JSON.stringify(cfg)));
    }
  }

  public getAllConfigs(): VehicleDynamicPricingConfig[] {
    return Array.from(this.configs.values());
  }

  public getConfig(vehicleId: string): VehicleDynamicPricingConfig | undefined {
    return (
      this.configs.get(vehicleId) ||
      (vehicleId === 'ertiga' || vehicleId === 'suv' ? this.configs.get('suv-6-1') : undefined) ||
      (vehicleId === 'toyota-etios' || vehicleId === 'swift-desire' ? this.configs.get('sedan-4-1') : undefined) ||
      (vehicleId === 'tempo-traveller' || vehicleId === 'tempo-traveller-14-1' ? this.configs.get('tempo-traveller-12-1') : undefined) ||
      (vehicleId === 'innova-6-1' || vehicleId === 'innova-7-1' ? this.configs.get('innova') : undefined)
    );
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

    // Record audit log
    this.addAuditLog({
      user: updatedBy,
      action: "UPDATE_CONFIG",
      vehicleId,
      pricingVersion: newVersion,
      summary: `Updated pricing for ${merged.vehicleName} to Version ${newVersion}`,
      changes: updates,
    });

    return merged;
  }

  public resetToDefaults(vehicleId?: string, user = "Administrator"): void {
    if (vehicleId) {
      if (DEFAULT_VEHICLE_CONFIGS[vehicleId]) {
        this.configs.set(
          vehicleId,
          JSON.parse(JSON.stringify(DEFAULT_VEHICLE_CONFIGS[vehicleId]))
        );
        this.addAuditLog({
          user,
          action: "RESET",
          vehicleId,
          summary: `Reset pricing for ${vehicleId} to factory defaults`,
        });
      }
    } else {
      this.configs.clear();
      for (const [key, cfg] of Object.entries(DEFAULT_VEHICLE_CONFIGS)) {
        this.configs.set(key, JSON.parse(JSON.stringify(cfg)));
      }
      this.statePairRules = JSON.parse(JSON.stringify(DEFAULT_STATE_PAIR_RULES));
      this.addAuditLog({
        user,
        action: "RESET",
        vehicleId: "all",
        summary: "Reset all vehicle pricing and state-pair rules to factory defaults",
      });
    }
  }

  // State Pair Rules
  public getStatePairRules(): StatePairPricingRule[] {
    return this.statePairRules;
  }

  public saveStatePairRule(rule: StatePairPricingRule, user = "Administrator"): StatePairPricingRule {
    const existingIdx = this.statePairRules.findIndex((r) => r.id === rule.id);
    const updatedRule: StatePairPricingRule = {
      ...rule,
      updatedAt: new Date().toISOString(),
    };

    if (existingIdx >= 0) {
      this.statePairRules[existingIdx] = updatedRule;
      this.addAuditLog({
        user,
        action: "UPDATE_STATE_PAIR",
        summary: `Updated Inter-State pair rule: ${rule.fromState} ➔ ${rule.toState}`,
        changes: rule,
      });
    } else {
      const newRule: StatePairPricingRule = {
        ...updatedRule,
        id: rule.id || `sp_${Date.now()}`,
      };
      this.statePairRules.push(newRule);
      this.addAuditLog({
        user,
        action: "ADD_STATE_PAIR",
        summary: `Added new Inter-State pair rule: ${rule.fromState} ➔ ${rule.toState}`,
        changes: newRule,
      });
      return newRule;
    }

    return updatedRule;
  }

  public deleteStatePairRule(id: string, user = "Administrator"): boolean {
    const idx = this.statePairRules.findIndex((r) => r.id === id);
    if (idx >= 0) {
      const removed = this.statePairRules.splice(idx, 1)[0];
      this.addAuditLog({
        user,
        action: "DELETE_STATE_PAIR",
        summary: `Deleted Inter-State pair rule: ${removed.fromState} ➔ ${removed.toState}`,
      });
      return true;
    }
    return false;
  }

  // Audit Logs
  public getAuditLogs(): FareAuditLogEntry[] {
    return [...this.auditLogs].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }

  public addAuditLog(entry: Omit<FareAuditLogEntry, "id" | "timestamp">): void {
    const log: FareAuditLogEntry = {
      ...entry,
      id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
    };
    this.auditLogs.unshift(log);
    // Keep max 200 logs
    if (this.auditLogs.length > 200) {
      this.auditLogs.pop();
    }
  }

  // Distance Rounding Setting
  public getDistanceRounding(): DistanceRoundingRule {
    return this.distanceRounding;
  }

  public setDistanceRounding(rule: DistanceRoundingRule, user = "Administrator"): void {
    this.distanceRounding = rule;
    this.addAuditLog({
      user,
      action: "UPDATE_SETTINGS",
      summary: `Changed distance rounding setting to: ${rule}`,
      changes: { distanceRounding: rule },
    });
  }

  public getActiveEngine(): FareEngineType {
    return this.activeEngine;
  }

  public setActiveEngine(engine: FareEngineType, user = "Administrator"): void {
    const prev = this.activeEngine;
    this.activeEngine = engine;
    this.addAuditLog({
      user,
      action: "UPDATE_ACTIVE_ENGINE",
      summary: `Switched active dynamic fare engine from ${prev} to ${engine}`,
      changes: { previous: prev, active: engine },
    });
  }

  public calculateAuthoritativeFare(
    input: DynamicFareCalculationInput
  ): DynamicFareCalculationResult {
    const vehicleConfig =
      this.configs.get(input.vehicleId) ||
      DEFAULT_VEHICLE_CONFIGS[input.vehicleId] ||
      (input.vehicleId === "innova-6-1" || input.vehicleId === "innova-7-1"
        ? this.configs.get("innova") || DEFAULT_VEHICLE_CONFIGS["innova"]
        : undefined) ||
      this.configs.get("sedan-4-1") ||
      DEFAULT_VEHICLE_CONFIGS["sedan-4-1"];

    const engineToUse = input.engineType || this.activeEngine;
    const resolvedInput: DynamicFareCalculationInput = {
      ...input,
      customPricingConfig: vehicleConfig,
      statePairRules: input.statePairRules || this.statePairRules,
      distanceRounding: input.distanceRounding || this.distanceRounding,
    };

    if (engineToUse === "ENGINE_B") {
      return calculateEngineBFare(resolvedInput);
    }
    return calculateEngineAFare(resolvedInput);
  }

  public calculateDualFare(
    input: DynamicFareCalculationInput
  ): DualEngineFareComparison {
    const vehicleConfig =
      this.configs.get(input.vehicleId) ||
      DEFAULT_VEHICLE_CONFIGS[input.vehicleId] ||
      (input.vehicleId === "innova-6-1" || input.vehicleId === "innova-7-1"
        ? this.configs.get("innova") || DEFAULT_VEHICLE_CONFIGS["innova"]
        : undefined) ||
      this.configs.get("sedan-4-1") ||
      DEFAULT_VEHICLE_CONFIGS["sedan-4-1"];

    return calculateDualEngineFare({
      ...input,
      customPricingConfig: vehicleConfig,
      statePairRules: input.statePairRules || this.statePairRules,
      distanceRounding: input.distanceRounding || this.distanceRounding,
    });
  }

  public calculateDualAllVehicles(
    input: Omit<DynamicFareCalculationInput, "vehicleId">
  ): DualEngineVehicleComparison[] {
    return calculateDualEngineAllVehicles({
      ...input,
      statePairRules: input.statePairRules || this.statePairRules,
      distanceRounding: input.distanceRounding || this.distanceRounding,
    });
  }

  public calculateAllVehicles(
    input: Omit<DynamicFareCalculationInput, "vehicleId">
  ): Record<string, DynamicFareCalculationResult> {
    const results: Record<string, DynamicFareCalculationResult> = {};
    for (const [vehicleId, config] of this.configs.entries()) {
      if (config.active !== false) {
        const engineToUse = input.engineType || this.activeEngine;
        const vInput = {
          ...input,
          vehicleId,
          customPricingConfig: config,
          statePairRules: input.statePairRules || this.statePairRules,
          distanceRounding: input.distanceRounding || this.distanceRounding,
        };
        results[vehicleId] = engineToUse === "ENGINE_B"
          ? calculateEngineBFare(vInput)
          : calculateEngineAFare(vInput);
      }
    }
    return results;
  }
}

export const serverPricingStore = new PricingStore();
