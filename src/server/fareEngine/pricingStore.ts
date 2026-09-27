import fs from "fs";
import path from "path";
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
  CentralizedFareConfig,
  FareVehicleId,
} from "../../types/fareEngine";
import {
  DEFAULT_CENTRALIZED_FARE_CONFIG,
  calculateMasterFare,
} from "../../utils/centralFareEngine";

const CACHE_FILE_PATH = path.resolve(process.cwd(), ".fare_centralized_config.json");

class PricingStore {
  private configs: Map<string, VehicleDynamicPricingConfig>;
  private centralizedConfig: CentralizedFareConfig;
  private statePairRules: StatePairPricingRule[];
  private auditLogs: FareAuditLogEntry[];
  private distanceRounding: DistanceRoundingRule;
  private activeEngine: FareEngineType;

  constructor() {
    this.configs = new Map();
    this.distanceRounding = "NEAREST_1";
    this.activeEngine = "ENGINE_A";
    this.statePairRules = JSON.parse(JSON.stringify(DEFAULT_STATE_PAIR_RULES));

    const loadedFromFile = this.loadConfigFromFile();
    if (loadedFromFile) {
      this.centralizedConfig = loadedFromFile;
    } else {
      this.centralizedConfig = JSON.parse(JSON.stringify(DEFAULT_CENTRALIZED_FARE_CONFIG));
    }

    this.auditLogs = [
      {
        id: "audit_init_1",
        timestamp: "2026-03-01T00:00:00.000Z",
        user: "System Initializer",
        action: "INITIALIZE",
        vehicleId: "all",
        summary: "Live Advanced Fare & Price Engine initialized as single source of truth.",
      },
    ];

    // Initialize with default vehicle configurations
    for (const [key, cfg] of Object.entries(DEFAULT_VEHICLE_CONFIGS)) {
      this.configs.set(key, JSON.parse(JSON.stringify(cfg)));
    }
    this.syncCentralizedToConfigs();
  }

  private loadConfigFromFile(): CentralizedFareConfig | null {
    try {
      if (fs.existsSync(CACHE_FILE_PATH)) {
        const raw = fs.readFileSync(CACHE_FILE_PATH, "utf-8");
        const parsed = JSON.parse(raw);
        if (parsed && parsed.local && parsed.oneWay && parsed.roundTrip && parsed.airport) {
          if (parsed.local['suv-6-1'] && (parsed.local['suv-6-1'].extraPerKmRate === 156 || parsed.local['suv-6-1'].extraPerKmRate > 100)) {
            parsed.local['suv-6-1'].extraPerKmRate = 16;
            this.saveConfigToFile(parsed);
          }
          return parsed;
        }
      }
    } catch (e) {
      console.warn("Could not read cached fare config from disk:", e);
    }
    return null;
  }

  private saveConfigToFile(config: CentralizedFareConfig) {
    try {
      fs.writeFileSync(CACHE_FILE_PATH, JSON.stringify(config, null, 2), "utf-8");
    } catch (e) {
      console.warn("Could not save cached fare config to disk:", e);
    }
  }

  private syncCentralizedToConfigs() {
    const fleetIds: FareVehicleId[] = [
      'sedan-4-1',
      'suv-6-1',
      'innova',
      'innova-crysta',
      'tempo-traveller-12-1',
    ];

    fleetIds.forEach((vid) => {
      const existing = this.configs.get(vid);
      if (existing) {
        const local = this.centralizedConfig.local[vid];
        const oneWay = this.centralizedConfig.oneWay[vid];
        const roundTrip = this.centralizedConfig.roundTrip[vid];
        const airport = this.centralizedConfig.airport[vid];

        if (local && existing.pricingByBookingType.LOCAL) {
          existing.pricingByBookingType.LOCAL.baseFare = local.baseFare;
          existing.pricingByBookingType.LOCAL.driverAllowance = local.driverAllowance;
          existing.pricingByBookingType.LOCAL.perKmRate = local.perKmRate;
          existing.pricingByBookingType.LOCAL.hourlyRate = local.perHourRate;
          existing.pricingByBookingType.LOCAL.extraPerKmRate = local.extraPerKmRate;
          existing.pricingByBookingType.LOCAL.extraPerHourRate = local.extraPerHourRate;
          existing.pricingByBookingType.LOCAL.includedKm = local.includedKm;
          existing.pricingByBookingType.LOCAL.includedHours = local.includedHours;
          existing.pricingByBookingType.LOCAL.discountType = local.discountType;
          existing.pricingByBookingType.LOCAL.discountValue = local.discountValue;
        }

        if (oneWay && existing.pricingByBookingType.ONE_WAY) {
          existing.pricingByBookingType.ONE_WAY.baseFare = oneWay.baseFare;
          existing.pricingByBookingType.ONE_WAY.driverAllowance = oneWay.driverAllowance;
          existing.pricingByBookingType.ONE_WAY.perKmRate = oneWay.perKmRate;
          existing.pricingByBookingType.ONE_WAY.extraPerKmRate = oneWay.extraPerKmRate;
          existing.pricingByBookingType.ONE_WAY.includedKm = oneWay.includedKm;
          existing.pricingByBookingType.ONE_WAY.discountType = oneWay.discountType;
          existing.pricingByBookingType.ONE_WAY.discountValue = oneWay.discountValue;
        }

        if (roundTrip && existing.pricingByBookingType.ROUND_TRIP) {
          existing.pricingByBookingType.ROUND_TRIP.driverAllowance = roundTrip.driverAllowance;
          existing.pricingByBookingType.ROUND_TRIP.perKmRate = roundTrip.perKmRate;
          existing.pricingByBookingType.ROUND_TRIP.dailyMinimumKm = roundTrip.dailyMinimumKm;
          existing.pricingByBookingType.ROUND_TRIP.includedKm = roundTrip.dailyMinimumKm;
          existing.pricingByBookingType.ROUND_TRIP.discountType = roundTrip.discountType;
          existing.pricingByBookingType.ROUND_TRIP.discountValue = roundTrip.discountValue;
        }

        if (airport && existing.pricingByBookingType.AIRPORT_TRANSFER) {
          existing.pricingByBookingType.AIRPORT_TRANSFER.baseFare = airport.baseFare;
          existing.pricingByBookingType.AIRPORT_TRANSFER.driverAllowance = airport.driverAllowance;
          existing.pricingByBookingType.AIRPORT_TRANSFER.perKmRate = airport.perKmRate;
          existing.pricingByBookingType.AIRPORT_TRANSFER.extraPerKmRate = airport.extraPerKmRate;
          existing.pricingByBookingType.AIRPORT_TRANSFER.discountType = airport.discountType;
          existing.pricingByBookingType.AIRPORT_TRANSFER.discountValue = airport.discountValue;
        }

        this.configs.set(vid, existing);
      }
    });

    if (this.centralizedConfig.interStateOneWay) {
      try {
        const { serverInterStateStore } = require("./interstateOneWayStore");
        fleetIds.forEach((vid) => {
          const isow = this.centralizedConfig.interStateOneWay?.[vid];
          if (isow && serverInterStateStore) {
            serverInterStateStore.updateRate(
              vid,
              {
                baseFare: isow.baseFare,
                perKmRate: isow.perKmRate,
                extraPerKmRate: isow.extraPerKmRate,
                driverAllowance: isow.driverAllowance,
                minimumKm: isow.minimumBillableKm || 149,
              },
              "Fare Engine Sync"
            );
          }
        });
      } catch (e) {
        // ignore
      }
    }
  }

  public getCentralizedConfig(): CentralizedFareConfig {
    return JSON.parse(JSON.stringify(this.centralizedConfig));
  }

  public updateCentralizedConfig(
    updated: CentralizedFareConfig,
    updatedBy: string = "Administrator"
  ): CentralizedFareConfig {
    const newVersion = (this.centralizedConfig.version || 1) + 1;
    const now = new Date().toISOString();
    const todayStr = now.slice(0, 10);
    const versionCode = updated.versionCode || `${todayStr}-${String(newVersion).padStart(3, '0')}`;
    const dateFormatted = new Date().toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
    const timeFormatted = new Date().toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
    });

    this.centralizedConfig = {
      ...updated,
      version: newVersion,
      versionCode,
      status: 'ACTIVE',
      lastUpdatedFormatted: `${dateFormatted}, ${timeFormatted}`,
      updatedAt: now,
      updatedBy: updatedBy || "Administrator",
    };

    this.syncCentralizedToConfigs();
    this.saveConfigToFile(this.centralizedConfig);

    this.addAuditLog({
      user: updatedBy,
      action: "UPDATE_CONFIG",
      vehicleId: "all",
      pricingVersion: newVersion,
      summary: `Centralized Fare & Price Engine updated to Version ${versionCode}`,
      changes: updated,
    });

    return this.getCentralizedConfig();
  }

  public resetCentralizedConfig(
    updatedBy: string = "Administrator"
  ): CentralizedFareConfig {
    this.centralizedConfig = JSON.parse(JSON.stringify(DEFAULT_CENTRALIZED_FARE_CONFIG));
    this.syncCentralizedToConfigs();
    this.saveConfigToFile(this.centralizedConfig);

    this.addAuditLog({
      user: updatedBy,
      action: "RESET_ALL",
      vehicleId: "all",
      summary: `Restored Fare & Price Engine to baseline default values`,
    });

    return this.getCentralizedConfig();
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

  public clearAuditLogs(): void {
    this.auditLogs = [];
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

    const resolvedInput: DynamicFareCalculationInput = {
      ...input,
      customPricingConfig: vehicleConfig,
      statePairRules: input.statePairRules || this.statePairRules,
      distanceRounding: input.distanceRounding || this.distanceRounding,
    };

    return calculateDynamicFare(resolvedInput);
  }

  public calculateDualFare(
    input: DynamicFareCalculationInput
  ): DualEngineFareComparison {
    const authoritative = this.calculateAuthoritativeFare(input);
    return {
      engineA: authoritative,
      engineB: authoritative,
      activeEngine: "ENGINE_A",
      recommendedEngine: "ENGINE_A",
      metrics: {
        distanceMeters: Math.round(authoritative.distanceKm * 1000),
        distanceKm: authoritative.distanceKm,
        durationSeconds: authoritative.durationMinutes * 60,
        durationMinutes: authoritative.durationMinutes,
        durationFormatted: authoritative.durationFormatted,
        tollEstimate: authoritative.tolls || 0,
      },
      fareDifference: 0,
      percentageDifference: 0,
      summary: "Authoritative Centralized Fare Engine is active.",
    };
  }

  public calculateDualAllVehicles(
    input: Omit<DynamicFareCalculationInput, "vehicleId">
  ): DualEngineVehicleComparison[] {
    const all = this.calculateAllVehicles(input);
    return Object.values(all).map((res) => ({
      vehicleId: res.vehicleId,
      vehicleName: res.vehicleName,
      engineAFare: res.totalFare,
      engineBFare: res.totalFare,
      difference: 0,
      engineAResult: res,
      engineBResult: res,
    }));
  }

  public calculateAllVehicles(
    input: Omit<DynamicFareCalculationInput, "vehicleId">
  ): Record<string, DynamicFareCalculationResult> {
    const results: Record<string, DynamicFareCalculationResult> = {};
    for (const [vehicleId, config] of this.configs.entries()) {
      if (config.active !== false) {
        const vInput = {
          ...input,
          vehicleId,
          customPricingConfig: config,
          statePairRules: input.statePairRules || this.statePairRules,
          distanceRounding: input.distanceRounding || this.distanceRounding,
        };
        results[vehicleId] = calculateDynamicFare(vInput);
      }
    }
    return results;
  }
}

export const serverPricingStore = new PricingStore();
