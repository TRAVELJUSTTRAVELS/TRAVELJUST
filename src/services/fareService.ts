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
  detectIndianState,
} from '../utils/dynamicFareEngine';
import {
  CentralizedFareConfig,
  FareCalculationResult,
  FareHistoryEntry,
  FareVehicleId,
  ServiceTypeCategory,
} from '../types/fareEngine';
import {
  DEFAULT_CENTRALIZED_FARE_CONFIG,
  calculateInterStateFare,
  calculateMasterFare,
  getVehicleMeta,
} from '../utils/centralFareEngine';
import { PricingConfig } from '../types';
import { defaultPricingConfig } from '../config/siteConfig';
import { saveFareConfigToFirestore, fetchFareConfigFromFirestore } from '../lib/firebase';

const LOCAL_STORAGE_KEY = 'tj_dynamic_pricing_configs_v1';
const STATE_PAIRS_KEY = 'tj_state_pair_rules_v1';
const SETTINGS_KEY = 'tj_fare_settings_v1';
const CENTRALIZED_CONFIG_KEY = 'tj_centralized_fare_config_v3';
const FARE_HISTORY_KEY = 'tj_fare_history_v2';

const ALLOWED_FLEET_IDS = ['sedan-4-1', 'suv-6-1', 'innova', 'innova-crysta', 'tempo-traveller-12-1'];

class FareService {
  private memoryConfigs: Record<string, VehicleDynamicPricingConfig>;
  private memoryCentralizedConfig: CentralizedFareConfig;
  private memoryFareHistory: FareHistoryEntry[];
  private memoryStatePairs: StatePairPricingRule[];
  private memoryRounding: DistanceRoundingRule;
  private listeners: Array<(config: CentralizedFareConfig) => void> = [];

  constructor() {
    this.memoryConfigs = this.loadInitialConfigs();
    this.memoryCentralizedConfig = this.loadInitialCentralizedConfig();
    this.memoryFareHistory = this.loadInitialFareHistory();
    this.memoryStatePairs = this.loadInitialStatePairs();
    this.memoryRounding = this.loadInitialRounding();
    this.syncCentralizedToMemoryConfigs(this.memoryCentralizedConfig);
  }

  public subscribe(callback: (config: CentralizedFareConfig) => void): () => void {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter((cb) => cb !== callback);
    };
  }

  private notifyListeners(config: CentralizedFareConfig) {
    this.listeners.forEach((cb) => {
      try {
        cb(config);
      } catch (e) {
        console.error('Error notifying fareService subscriber:', e);
      }
    });

    if (typeof window !== 'undefined') {
      try {
        window.dispatchEvent(new CustomEvent('tj_fares_updated', { detail: config }));
      } catch (e) {
        // ignore
      }
    }
  }

  public syncCentralizedToSitePricingConfig(
    centralized: CentralizedFareConfig,
    baseConfig: PricingConfig = defaultPricingConfig
  ): PricingConfig {
    const updated: PricingConfig = JSON.parse(JSON.stringify(baseConfig));
    const vids: FareVehicleId[] = ['sedan-4-1', 'suv-6-1', 'innova', 'innova-crysta', 'tempo-traveller-12-1'];

    vids.forEach((vid) => {
      if (!updated.vehiclePricing[vid]) {
        updated.vehiclePricing[vid] = {
          vehicleId: vid,
          baseFare: 500,
          localPerKmRate: 13,
          localDriverAllowance: 300,
          oneWayPerKmRate: 13,
          oneWayDriverAllowance: 300,
          airportPerKmRate: 13,
          airportDriverAllowance: 250,
          perKmFare: 13,
          perHourFare: 200,
          driverAllowancePerDay: 300,
          airportBaseFare: 699,
        };
      }

      const target = updated.vehiclePricing[vid];
      const local = centralized.local[vid];
      const oneWay = centralized.oneWay[vid];
      const roundTrip = centralized.roundTrip[vid];
      const airport = centralized.airport[vid];

      if (local) {
        target.localPerKmRate = local.perKmRate;
        target.localDriverAllowance = local.driverAllowance;
        target.perHourFare = local.perHourRate;
      }
      if (oneWay) {
        target.oneWayPerKmRate = oneWay.perKmRate;
        target.oneWayDriverAllowance = oneWay.driverAllowance;
        target.baseFare = oneWay.baseFare;
      }
      if (roundTrip) {
        target.perKmFare = roundTrip.perKmRate;
        target.driverAllowancePerDay = roundTrip.driverAllowance;
        target.minKmPerDay = roundTrip.dailyMinimumKm;
      }
      if (airport) {
        target.airportPerKmRate = airport.perKmRate;
        target.airportDriverAllowance = airport.driverAllowance;
        target.airportBaseFare = airport.baseFare;
      }

      if (vid === 'sedan-4-1') {
        if (updated.vehiclePricing['toyota-etios']) {
          Object.assign(updated.vehiclePricing['toyota-etios'], target, { vehicleId: 'toyota-etios' });
        }
        if (updated.vehiclePricing['swift-desire']) {
          Object.assign(updated.vehiclePricing['swift-desire'], target, { vehicleId: 'swift-desire' });
        }
      }

      if (vid === 'suv-6-1') {
        if (updated.vehiclePricing['ertiga']) {
          Object.assign(updated.vehiclePricing['ertiga'], target, { vehicleId: 'ertiga' });
        }
      }

      if (vid === 'innova-crysta') {
        if (updated.vehiclePricing['innova-crysta-7-1']) {
          Object.assign(updated.vehiclePricing['innova-crysta-7-1'], target, { vehicleId: 'innova-crysta-7-1' });
        }
      }

      if (vid === 'tempo-traveller-12-1') {
        if (updated.vehiclePricing['tempo-traveller']) {
          Object.assign(updated.vehiclePricing['tempo-traveller'], target, { vehicleId: 'tempo-traveller' });
        }
        if (updated.vehiclePricing['tempo-traveller-14-1']) {
          Object.assign(updated.vehiclePricing['tempo-traveller-14-1'], target, { vehicleId: 'tempo-traveller-14-1' });
        }
      }
    });

    if (centralized.oneWay['sedan-4-1']?.perKmRate) {
      updated.perKmFare = centralized.oneWay['sedan-4-1'].perKmRate;
    } else if (centralized.local['sedan-4-1']?.perKmRate) {
      updated.perKmFare = centralized.local['sedan-4-1'].perKmRate;
    }

    return updated;
  }

  private loadInitialCentralizedConfig(): CentralizedFareConfig {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        // Clean out legacy v1 and v2 config keys to delete outdated data
        window.localStorage.removeItem('tj_centralized_fare_config_v1');
        window.localStorage.removeItem('tj_centralized_fare_config_v2');

        const stored = window.localStorage.getItem(CENTRALIZED_CONFIG_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (
            parsed &&
            typeof parsed.version === 'number' &&
            parsed.version >= 3 &&
            parsed.local &&
            parsed.oneWay &&
            parsed.roundTrip &&
            parsed.airport
          ) {
            if (!parsed.interStateOneWay) {
              parsed.interStateOneWay = JSON.parse(JSON.stringify(DEFAULT_CENTRALIZED_FARE_CONFIG.interStateOneWay));
            }
            if (!parsed.fixedCorridors) {
              parsed.fixedCorridors = JSON.parse(JSON.stringify(DEFAULT_CENTRALIZED_FARE_CONFIG.fixedCorridors));
            } else {
              parsed.fixedCorridors.MYSURU_KIA_AIRPORT =
                parsed.fixedCorridors.MYSURU_KIA_AIRPORT ||
                JSON.parse(JSON.stringify(DEFAULT_CENTRALIZED_FARE_CONFIG.fixedCorridors!.MYSURU_KIA_AIRPORT));
              parsed.fixedCorridors.MYSURU_BENGALURU_CITY =
                parsed.fixedCorridors.MYSURU_BENGALURU_CITY ||
                JSON.parse(JSON.stringify(DEFAULT_CENTRALIZED_FARE_CONFIG.fixedCorridors!.MYSURU_BENGALURU_CITY));
            }
            return parsed;
          }
        }
      }
    } catch (e) {
      // ignore
    }
    const fresh = JSON.parse(JSON.stringify(DEFAULT_CENTRALIZED_FARE_CONFIG));
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        window.localStorage.setItem(CENTRALIZED_CONFIG_KEY, JSON.stringify(fresh));
      } catch (e) {
        // ignore
      }
    }
    return fresh;
  }

  private loadInitialFareHistory(): FareHistoryEntry[] {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const stored = window.localStorage.getItem(FARE_HISTORY_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed;
          }
        }
      }
    } catch (e) {
      // ignore
    }
    return [
      {
        id: 'hist_init_1',
        timestamp: new Date().toISOString(),
        user: 'Owner / Administrator',
        serviceType: 'GLOBAL',
        action: 'INITIALIZE',
        updateStatus: 'ACTIVE',
        notes: 'Centralized Fare & Price Engine baseline active for all fleet categories.',
      },
    ];
  }

  public syncCentralizedToMemoryConfigs(centralized: CentralizedFareConfig) {
    const fleetIds: FareVehicleId[] = [
      'sedan-4-1',
      'suv-6-1',
      'innova',
      'innova-crysta',
      'tempo-traveller-12-1',
    ];

    fleetIds.forEach((vid) => {
      const existing = this.memoryConfigs[vid];
      if (existing) {
        const local = centralized.local[vid];
        const oneWay = centralized.oneWay[vid];
        const roundTrip = centralized.roundTrip[vid];
        const airport = centralized.airport[vid];

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
          existing.pricingByBookingType.ONE_WAY.minimumKm = oneWay.minBillableKm || 0;
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
      }
    });

    // Sync vehicle aliases
    if (this.memoryConfigs['toyota-etios'] && this.memoryConfigs['sedan-4-1']) {
      this.memoryConfigs['toyota-etios'].pricingByBookingType = JSON.parse(
        JSON.stringify(this.memoryConfigs['sedan-4-1'].pricingByBookingType)
      );
    }
    if (this.memoryConfigs['swift-desire'] && this.memoryConfigs['sedan-4-1']) {
      this.memoryConfigs['swift-desire'].pricingByBookingType = JSON.parse(
        JSON.stringify(this.memoryConfigs['sedan-4-1'].pricingByBookingType)
      );
    }
    if (this.memoryConfigs['ertiga'] && this.memoryConfigs['suv-6-1']) {
      this.memoryConfigs['ertiga'].pricingByBookingType = JSON.parse(
        JSON.stringify(this.memoryConfigs['suv-6-1'].pricingByBookingType)
      );
    }
    if (this.memoryConfigs['innova-crysta-7-1'] && this.memoryConfigs['innova-crysta']) {
      this.memoryConfigs['innova-crysta-7-1'].pricingByBookingType = JSON.parse(
        JSON.stringify(this.memoryConfigs['innova-crysta'].pricingByBookingType)
      );
    }

    this.saveToStorage(this.memoryConfigs);
  }

  public getCentralizedConfigSync(): CentralizedFareConfig {
    return JSON.parse(JSON.stringify(this.memoryCentralizedConfig));
  }

  public async getCentralizedConfig(): Promise<CentralizedFareConfig> {
    try {
      const res = await fetch('/api/fare/centralized-config', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.config) {
          this.memoryCentralizedConfig = data.config;
          this.syncCentralizedToMemoryConfigs(data.config);
          if (typeof window !== 'undefined' && window.localStorage) {
            window.localStorage.setItem(CENTRALIZED_CONFIG_KEY, JSON.stringify(data.config));
            try {
              const syncedSite = this.syncCentralizedToSitePricingConfig(data.config);
              window.localStorage.setItem('tj_pricing_config', JSON.stringify(syncedSite));
            } catch {}
          }
          this.notifyListeners(data.config);
          return data.config;
        }
      }
    } catch (e) {
      // fallback to Firestore or local storage
    }

    try {
      const cloudConfig = await fetchFareConfigFromFirestore();
      if (cloudConfig && cloudConfig.local && cloudConfig.oneWay) {
        this.memoryCentralizedConfig = cloudConfig;
        this.syncCentralizedToMemoryConfigs(cloudConfig);
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.setItem(CENTRALIZED_CONFIG_KEY, JSON.stringify(cloudConfig));
          try {
            const syncedSite = this.syncCentralizedToSitePricingConfig(cloudConfig);
            window.localStorage.setItem('tj_pricing_config', JSON.stringify(syncedSite));
          } catch {}
        }
        this.notifyListeners(cloudConfig);
        return cloudConfig;
      }
    } catch (err) {
      // ignore
    }

    return this.getCentralizedConfigSync();
  }

  public async saveCentralizedConfig(
    config: CentralizedFareConfig,
    updatedBy: string = 'Owner'
  ): Promise<CentralizedFareConfig> {
    // 1. Strict Validation of entered pricing values
    if (!config || !config.local || !config.oneWay || !config.roundTrip || !config.airport) {
      throw new Error('Price update failed. Missing core pricing categories. Your previous prices are still active.');
    }

    const vehicleIds: FareVehicleId[] = ['sedan-4-1', 'suv-6-1', 'innova', 'innova-crysta', 'tempo-traveller-12-1'];
    for (const vid of vehicleIds) {
      const l = config.local?.[vid];
      const ow = config.oneWay?.[vid];
      const rt = config.roundTrip?.[vid];
      const ap = config.airport?.[vid];

      if (!l || !ow || !rt || !ap) {
        throw new Error(`Price update failed. Missing rates for vehicle ${vid}. Your previous prices are still active.`);
      }

      if (
        isNaN(l.baseFare) || l.baseFare < 0 ||
        isNaN(l.perKmRate) || l.perKmRate < 0 ||
        isNaN(l.driverAllowance) || l.driverAllowance < 0 ||
        isNaN(ow.perKmRate) || ow.perKmRate < 0 ||
        isNaN(rt.perKmRate) || rt.perKmRate < 0 ||
        isNaN(ap.perKmRate) || ap.perKmRate < 0
      ) {
        throw new Error('Price update failed. Rates cannot be negative or invalid numbers. Your previous prices are still active.');
      }
    }

    const previousConfig = JSON.parse(JSON.stringify(this.memoryCentralizedConfig));
    const newVersion = (previousConfig.version || 1) + 1;
    const now = new Date().toISOString();
    const todayStr = now.slice(0, 10);
    const versionCode = `${todayStr}-${String(newVersion).padStart(3, '0')}`;
    const dateFormatted = new Date().toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
    const timeFormatted = new Date().toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
    });

    const updated: CentralizedFareConfig = {
      ...config,
      version: newVersion,
      versionCode,
      status: 'ACTIVE',
      lastUpdatedFormatted: `${dateFormatted}, ${timeFormatted}`,
      updatedAt: now,
      updatedBy,
    };

    // 2. Compute comprehensive Price Change Audit Logs
    const auditEntries: Omit<FareHistoryEntry, 'id' | 'timestamp'>[] = [];
    const vehicleNames: Record<FareVehicleId, string> = {
      'sedan-4-1': 'SEDAN (4+1)',
      'suv-6-1': 'SUV (6+1)',
      'innova': 'INNOVA',
      'innova-crysta': 'INNOVA CRYSTA',
      'tempo-traveller-12-1': 'TEMPO TRAVELLER (12+1)',
    };

    for (const vid of vehicleIds) {
      const vName = vehicleNames[vid];

      // LOCAL checks
      const prevL = previousConfig.local?.[vid];
      const curL = updated.local?.[vid];
      if (prevL && curL) {
        if (prevL.baseFare !== curL.baseFare) {
          auditEntries.push({
            user: updatedBy,
            serviceType: 'LOCAL',
            vehicleId: vid,
            vehicleName: vName,
            fareCategory: 'LOCAL — Base Fare',
            field: 'Base Fare',
            previousPrice: prevL.baseFare,
            newPrice: curL.baseFare,
            action: 'UPDATE',
            previousValue: `₹${prevL.baseFare}`,
            newValue: `₹${curL.baseFare}`,
            updateStatus: 'SUCCESS',
            saveStatus: 'SUCCESS',
            pricingVersion: versionCode,
            notes: `${vName} Local Base Fare updated: ₹${prevL.baseFare} ➔ ₹${curL.baseFare}`,
          });
        }
        if (prevL.perKmRate !== curL.perKmRate) {
          auditEntries.push({
            user: updatedBy,
            serviceType: 'LOCAL',
            vehicleId: vid,
            vehicleName: vName,
            fareCategory: 'LOCAL — Per KM Rate',
            field: 'Per KM Rate',
            previousPrice: prevL.perKmRate,
            newPrice: curL.perKmRate,
            action: 'UPDATE',
            previousValue: `₹${prevL.perKmRate}/km`,
            newValue: `₹${curL.perKmRate}/km`,
            updateStatus: 'SUCCESS',
            saveStatus: 'SUCCESS',
            pricingVersion: versionCode,
            notes: `${vName} Local Per KM updated: ₹${prevL.perKmRate}/km ➔ ₹${curL.perKmRate}/km`,
          });
        }
        if (prevL.extraPerKmRate !== curL.extraPerKmRate) {
          auditEntries.push({
            user: updatedBy,
            serviceType: 'LOCAL',
            vehicleId: vid,
            vehicleName: vName,
            fareCategory: 'LOCAL — Extra Per KM Rate',
            field: 'Extra Per KM Rate',
            previousPrice: prevL.extraPerKmRate,
            newPrice: curL.extraPerKmRate,
            action: 'UPDATE',
            previousValue: `₹${prevL.extraPerKmRate}/km`,
            newValue: `₹${curL.extraPerKmRate}/km`,
            updateStatus: 'SUCCESS',
            saveStatus: 'SUCCESS',
            pricingVersion: versionCode,
            notes: `${vName} Local Extra Per KM updated: ₹${prevL.extraPerKmRate}/km ➔ ₹${curL.extraPerKmRate}/km`,
          });
        }
        if (prevL.driverAllowance !== curL.driverAllowance) {
          auditEntries.push({
            user: updatedBy,
            serviceType: 'LOCAL',
            vehicleId: vid,
            vehicleName: vName,
            fareCategory: 'LOCAL — Driver Allowance',
            field: 'Driver Allowance',
            previousPrice: prevL.driverAllowance,
            newPrice: curL.driverAllowance,
            action: 'UPDATE',
            previousValue: `₹${prevL.driverAllowance}`,
            newValue: `₹${curL.driverAllowance}`,
            updateStatus: 'SUCCESS',
            saveStatus: 'SUCCESS',
            pricingVersion: versionCode,
            notes: `${vName} Local Driver Allowance updated: ₹${prevL.driverAllowance} ➔ ₹${curL.driverAllowance}`,
          });
        }
      }

      // ONE_WAY checks
      const prevOW = previousConfig.oneWay?.[vid];
      const curOW = updated.oneWay?.[vid];
      if (prevOW && curOW) {
        if (prevOW.perKmRate !== curOW.perKmRate) {
          auditEntries.push({
            user: updatedBy,
            serviceType: 'ONE_WAY',
            vehicleId: vid,
            vehicleName: vName,
            fareCategory: 'ONE WAY — Per KM Rate',
            field: 'Per KM Rate',
            previousPrice: prevOW.perKmRate,
            newPrice: curOW.perKmRate,
            action: 'UPDATE',
            previousValue: `₹${prevOW.perKmRate}/km`,
            newValue: `₹${curOW.perKmRate}/km`,
            updateStatus: 'SUCCESS',
            saveStatus: 'SUCCESS',
            pricingVersion: versionCode,
            notes: `${vName} One-Way Per KM Rate updated: ₹${prevOW.perKmRate}/km ➔ ₹${curOW.perKmRate}/km`,
          });
        }
        if (prevOW.extraPerKmRate !== curOW.extraPerKmRate) {
          auditEntries.push({
            user: updatedBy,
            serviceType: 'ONE_WAY',
            vehicleId: vid,
            vehicleName: vName,
            fareCategory: 'ONE WAY — Extra Per KM Rate',
            field: 'Extra Per KM Rate',
            previousPrice: prevOW.extraPerKmRate,
            newPrice: curOW.extraPerKmRate,
            action: 'UPDATE',
            previousValue: `₹${prevOW.extraPerKmRate}/km`,
            newValue: `₹${curOW.extraPerKmRate}/km`,
            updateStatus: 'SUCCESS',
            saveStatus: 'SUCCESS',
            pricingVersion: versionCode,
            notes: `${vName} One-Way Extra Per KM updated: ₹${prevOW.extraPerKmRate}/km ➔ ₹${curOW.extraPerKmRate}/km`,
          });
        }
        if (prevOW.baseFare !== curOW.baseFare) {
          auditEntries.push({
            user: updatedBy,
            serviceType: 'ONE_WAY',
            vehicleId: vid,
            vehicleName: vName,
            fareCategory: 'ONE WAY — Base Fare',
            field: 'Base Fare',
            previousPrice: prevOW.baseFare,
            newPrice: curOW.baseFare,
            action: 'UPDATE',
            previousValue: `₹${prevOW.baseFare}`,
            newValue: `₹${curOW.baseFare}`,
            updateStatus: 'SUCCESS',
            saveStatus: 'SUCCESS',
            pricingVersion: versionCode,
            notes: `${vName} One-Way Base Fare updated: ₹${prevOW.baseFare} ➔ ₹${curOW.baseFare}`,
          });
        }
        if (prevOW.driverAllowance !== curOW.driverAllowance) {
          auditEntries.push({
            user: updatedBy,
            serviceType: 'ONE_WAY',
            vehicleId: vid,
            vehicleName: vName,
            fareCategory: 'ONE WAY — Driver Allowance',
            field: 'Driver Allowance',
            previousPrice: prevOW.driverAllowance,
            newPrice: curOW.driverAllowance,
            action: 'UPDATE',
            previousValue: `₹${prevOW.driverAllowance}`,
            newValue: `₹${curOW.driverAllowance}`,
            updateStatus: 'SUCCESS',
            saveStatus: 'SUCCESS',
            pricingVersion: versionCode,
            notes: `${vName} One-Way Driver Allowance updated: ₹${prevOW.driverAllowance} ➔ ₹${curOW.driverAllowance}`,
          });
        }
      }

      // ROUND_TRIP checks
      const prevRT = previousConfig.roundTrip?.[vid];
      const curRT = updated.roundTrip?.[vid];
      if (prevRT && curRT) {
        if (prevRT.perKmRate !== curRT.perKmRate) {
          auditEntries.push({
            user: updatedBy,
            serviceType: 'ROUND_TRIP',
            vehicleId: vid,
            vehicleName: vName,
            fareCategory: 'ROUND TRIP — Per KM Rate',
            field: 'Per KM Rate',
            previousPrice: prevRT.perKmRate,
            newPrice: curRT.perKmRate,
            action: 'UPDATE',
            previousValue: `₹${prevRT.perKmRate}/km`,
            newValue: `₹${curRT.perKmRate}/km`,
            updateStatus: 'SUCCESS',
            saveStatus: 'SUCCESS',
            pricingVersion: versionCode,
            notes: `${vName} Round Trip Per KM Rate updated: ₹${prevRT.perKmRate}/km ➔ ₹${curRT.perKmRate}/km`,
          });
        }
        if (prevRT.driverAllowance !== curRT.driverAllowance) {
          auditEntries.push({
            user: updatedBy,
            serviceType: 'ROUND_TRIP',
            vehicleId: vid,
            vehicleName: vName,
            fareCategory: 'ROUND TRIP — Driver Allowance',
            field: 'Driver Allowance',
            previousPrice: prevRT.driverAllowance,
            newPrice: curRT.driverAllowance,
            action: 'UPDATE',
            previousValue: `₹${prevRT.driverAllowance}/day`,
            newValue: `₹${curRT.driverAllowance}/day`,
            updateStatus: 'SUCCESS',
            saveStatus: 'SUCCESS',
            pricingVersion: versionCode,
            notes: `${vName} Round Trip Driver Allowance updated: ₹${prevRT.driverAllowance}/day ➔ ₹${curRT.driverAllowance}/day`,
          });
        }
      }

      // AIRPORT checks
      const prevAP = previousConfig.airport?.[vid];
      const curAP = updated.airport?.[vid];
      if (prevAP && curAP) {
        if (prevAP.baseFare !== curAP.baseFare) {
          auditEntries.push({
            user: updatedBy,
            serviceType: 'AIRPORT',
            vehicleId: vid,
            vehicleName: vName,
            fareCategory: 'AIRPORT — Base Fare',
            field: 'Base Fare',
            previousPrice: prevAP.baseFare,
            newPrice: curAP.baseFare,
            action: 'UPDATE',
            previousValue: `₹${prevAP.baseFare}`,
            newValue: `₹${curAP.baseFare}`,
            updateStatus: 'SUCCESS',
            saveStatus: 'SUCCESS',
            pricingVersion: versionCode,
            notes: `${vName} Airport Base Fare updated: ₹${prevAP.baseFare} ➔ ₹${curAP.baseFare}`,
          });
        }
        if (prevAP.perKmRate !== curAP.perKmRate) {
          auditEntries.push({
            user: updatedBy,
            serviceType: 'AIRPORT',
            vehicleId: vid,
            vehicleName: vName,
            fareCategory: 'AIRPORT — Per KM Rate',
            field: 'Per KM Rate',
            previousPrice: prevAP.perKmRate,
            newPrice: curAP.perKmRate,
            action: 'UPDATE',
            previousValue: `₹${prevAP.perKmRate}/km`,
            newValue: `₹${curAP.perKmRate}/km`,
            updateStatus: 'SUCCESS',
            saveStatus: 'SUCCESS',
            pricingVersion: versionCode,
            notes: `${vName} Airport Per KM updated: ₹${prevAP.perKmRate}/km ➔ ₹${curAP.perKmRate}/km`,
          });
        }
      }

      // INTER_STATE_ONE_WAY checks
      const prevIS = previousConfig.interStateOneWay?.[vid];
      const curIS = updated.interStateOneWay?.[vid];
      if (prevIS && curIS) {
        if (prevIS.perKmRate !== curIS.perKmRate) {
          auditEntries.push({
            user: updatedBy,
            serviceType: 'INTER_STATE_ONE_WAY',
            vehicleId: vid,
            vehicleName: vName,
            fareCategory: 'INTER-STATE ONE-WAY — Per KM Rate',
            field: 'Per KM Rate',
            previousPrice: prevIS.perKmRate,
            newPrice: curIS.perKmRate,
            action: 'UPDATE',
            previousValue: `₹${prevIS.perKmRate}/km`,
            newValue: `₹${curIS.perKmRate}/km`,
            updateStatus: 'SUCCESS',
            saveStatus: 'SUCCESS',
            pricingVersion: versionCode,
            notes: `${vName} Inter-State Per KM Rate updated: ₹${prevIS.perKmRate}/km ➔ ₹${curIS.perKmRate}/km`,
          });
        }
      }
    }

    if (auditEntries.length === 0) {
      auditEntries.push({
        user: updatedBy,
        serviceType: 'GLOBAL',
        action: 'UPDATE',
        fareCategory: 'All Services & Fleet Categories',
        previousValue: `Version ${previousConfig.versionCode || previousConfig.version}`,
        newValue: `Version ${versionCode}`,
        updateStatus: 'SUCCESS',
        saveStatus: 'SUCCESS',
        pricingVersion: versionCode,
        notes: `Pricing version ${versionCode} published and synchronized across all booking forms.`,
      });
    }

    // Prepend all audit entries to history
    auditEntries.forEach((entry) => this.addFareHistoryEntry(entry));

    // 3. Update active memory and synchronize all vehicle dynamic configs
    this.memoryCentralizedConfig = updated;
    this.syncCentralizedToMemoryConfigs(updated);

    // 4. Save to persistent browser storage
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(CENTRALIZED_CONFIG_KEY, JSON.stringify(updated));
      try {
        const syncedSite = this.syncCentralizedToSitePricingConfig(updated);
        window.localStorage.setItem('tj_pricing_config', JSON.stringify(syncedSite));
      } catch (e) {
        // ignore
      }
    }

    // 5. Broadcast to all active forms & listeners immediately
    this.notifyListeners(updated);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('tj_fares_updated', { detail: updated }));
    }

    // 6. Persist to Cloud Firestore for permanent cross-device & cross-session consistency
    saveFareConfigToFirestore(updated).catch((err) => {
      console.warn('Firestore fareConfig save error:', err);
    });

    // 7. Persist to server disk store
    try {
      await fetch('/api/fare/centralized-config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-user': updatedBy,
        },
        body: JSON.stringify(updated),
      });
    } catch (e) {
      console.warn('Backend centralized config update failed, cached locally & in Firestore:', e);
    }

    return updated;
  }

  public async resetCentralizedConfig(updatedBy: string = 'Owner'): Promise<CentralizedFareConfig> {
    const reset = JSON.parse(JSON.stringify(DEFAULT_CENTRALIZED_FARE_CONFIG));
    this.memoryCentralizedConfig = reset;
    this.syncCentralizedToMemoryConfigs(reset);

    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(CENTRALIZED_CONFIG_KEY, JSON.stringify(reset));
    }

    // Immediately notify all active app subscribers of live fare reset
    this.notifyListeners(reset);

    this.addFareHistoryEntry({
      user: updatedBy,
      serviceType: 'GLOBAL',
      action: 'RESET',
      updateStatus: 'SUCCESS',
      notes: `Restored Fare & Price Engine to baseline default values.`,
    });

    try {
      await fetch('/api/fare/centralized-config/reset', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-user': updatedBy,
        },
      });
    } catch (e) {
      console.warn('Backend centralized config reset failed, cached locally:', e);
    }

    return reset;
  }

  public getFareHistorySync(): FareHistoryEntry[] {
    return [...this.memoryFareHistory];
  }

  public addFareHistoryEntry(entry: Omit<FareHistoryEntry, 'id' | 'timestamp'>): void {
    const newEntry: FareHistoryEntry = {
      ...entry,
      id: `hist_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      timestamp: new Date().toISOString(),
    };
    this.memoryFareHistory = [newEntry, ...this.memoryFareHistory].slice(0, 50);

    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        window.localStorage.setItem(FARE_HISTORY_KEY, JSON.stringify(this.memoryFareHistory));
      } catch (e) {
        // ignore
      }
    }
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

    // Sync vehicle changes to Centralized Fare & Price Engine (Single Source of Truth)
    try {
      const targetVid: FareVehicleId =
        vehicleId === 'sedan-4-1' || vehicleId === 'toyota-etios' || vehicleId === 'swift-desire'
          ? 'sedan-4-1'
          : vehicleId === 'suv-6-1' || vehicleId === 'ertiga' || vehicleId === 'suv'
          ? 'suv-6-1'
          : vehicleId === 'innova' || vehicleId === 'innova-6-1' || vehicleId === 'innova-7-1'
          ? 'innova'
          : vehicleId === 'innova-crysta' || vehicleId === 'innova-crysta-7-1'
          ? 'innova-crysta'
          : vehicleId === 'tempo-traveller-12-1' || vehicleId === 'tempo-traveller' || vehicleId === 'tempo-traveller-14-1'
          ? 'tempo-traveller-12-1'
          : (vehicleId as FareVehicleId);

      const central = JSON.parse(JSON.stringify(this.memoryCentralizedConfig)) as CentralizedFareConfig;
      if (central && central.local && central.local[targetVid] && localUpdated.pricingByBookingType) {
        const pb = localUpdated.pricingByBookingType;
        if (pb.LOCAL) {
          central.local[targetVid].baseFare = pb.LOCAL.baseFare;
          central.local[targetVid].perKmRate = pb.LOCAL.perKmRate;
          central.local[targetVid].driverAllowance = pb.LOCAL.driverAllowance;
          central.local[targetVid].perHourRate = pb.LOCAL.hourlyRate;
          central.local[targetVid].extraPerKmRate = pb.LOCAL.extraPerKmRate || pb.LOCAL.perKmRate;
          central.local[targetVid].extraPerHourRate = pb.LOCAL.extraPerHourRate || 150;
        }
        if (pb.ONE_WAY) {
          central.oneWay[targetVid].baseFare = pb.ONE_WAY.baseFare;
          central.oneWay[targetVid].perKmRate = pb.ONE_WAY.perKmRate;
          central.oneWay[targetVid].driverAllowance = pb.ONE_WAY.driverAllowance;
          central.oneWay[targetVid].extraPerKmRate = pb.ONE_WAY.extraPerKmRate || pb.ONE_WAY.perKmRate;
        }
        if (pb.ROUND_TRIP) {
          central.roundTrip[targetVid].perKmRate = pb.ROUND_TRIP.perKmRate;
          central.roundTrip[targetVid].driverAllowance = pb.ROUND_TRIP.driverAllowance;
          central.roundTrip[targetVid].dailyMinimumKm = pb.ROUND_TRIP.dailyMinimumKm || 300;
        }
        if (pb.AIRPORT_TRANSFER) {
          central.airport[targetVid].baseFare = pb.AIRPORT_TRANSFER.baseFare;
          central.airport[targetVid].perKmRate = pb.AIRPORT_TRANSFER.perKmRate;
          central.airport[targetVid].driverAllowance = pb.AIRPORT_TRANSFER.driverAllowance;
          central.airport[targetVid].extraPerKmRate = pb.AIRPORT_TRANSFER.extraPerKmRate || pb.AIRPORT_TRANSFER.perKmRate;
        }

        this.memoryCentralizedConfig = central;
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.setItem(CENTRALIZED_CONFIG_KEY, JSON.stringify(central));
        }
        this.notifyListeners(central);
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('tj_fares_updated', { detail: central }));
        }
      }
    } catch (e) {
      console.warn('Could not sync individual vehicle update to centralized engine:', e);
    }

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
   * Delete and purge all fare engine price data, cached configs, and storage overrides
   */
  public async clearAllPriceData(): Promise<void> {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(LOCAL_STORAGE_KEY);
        window.localStorage.removeItem(STATE_PAIRS_KEY);
        window.localStorage.removeItem(SETTINGS_KEY);
        window.localStorage.removeItem('tj_active_fare_engine');
        window.localStorage.removeItem('tj_fare_audit_logs_v1');
        window.localStorage.removeItem('tj_pricing_config');
        window.localStorage.removeItem('tj_custom_pricing');
        window.localStorage.removeItem('tj_test_data');
        window.localStorage.removeItem('tj_temp_fares');
      }
    } catch (e) {
      // ignore
    }
    this.memoryConfigs = JSON.parse(JSON.stringify(DEFAULT_VEHICLE_CONFIGS));
    this.memoryStatePairs = JSON.parse(JSON.stringify(DEFAULT_STATE_PAIR_RULES));
    this.memoryRounding = 'NEAREST_1';

    try {
      await fetch('/api/fare/clear-all', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (e) {
      // ignore
    }
  }

  /**
   * Purge unnecessary test data, mock communications, and stale logs
   */
  public async purgeUnnecessaryData(): Promise<void> {
    await this.clearAllPriceData();
    try {
      await fetch('/api/system/purge-unnecessary-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (e) {
      // ignore
    }
  }

  /**
   * Automatic State Detection Helper
   * Detects origin and destination states from address text or details
   */
  public detectTripState(
    origin?: string,
    destination?: string,
    originDetails?: any,
    destinationDetails?: any,
    explicitOriginState?: string,
    explicitDestState?: string
  ): {
    originState: string;
    destinationState: string;
    isInterState: boolean;
  } {
    const originState = (
      explicitOriginState ||
      detectIndianState(origin, originDetails) ||
      'Karnataka'
    ).trim();

    const destinationState = (
      explicitDestState ||
      detectIndianState(destination, destinationDetails) ||
      originState
    ).trim();

    const isInterState =
      Boolean(originState && destinationState) &&
      originState.toLowerCase() !== destinationState.toLowerCase();

    return {
      originState,
      destinationState,
      isInterState,
    };
  }

  /**
   * Evaluates if the trip requires the 'INTER-STATE ONE-WAY' fare engine
   * Rule: IF One-Way trip AND Origin State != Destination State, THEN activate the 'INTER-STATE ONE-WAY' fare engine.
   */
  public isInterStateOneWay(
    tripType: string,
    origin?: string,
    destination?: string,
    originDetails?: any,
    destinationDetails?: any,
    originState?: string,
    destinationState?: string
  ): boolean {
    const normalizedType = (tripType || '').toUpperCase().replace(/[\s-]/g, '_');
    const isOneWay =
      normalizedType === 'ONE_WAY' ||
      normalizedType === 'ONEWAY' ||
      normalizedType === 'OUTSTATION_ONEWAY' ||
      normalizedType === 'INTER_STATE_ONE_WAY';

    if (!isOneWay) return false;

    const stateInfo = this.detectTripState(
      origin,
      destination,
      originDetails,
      destinationDetails,
      originState,
      destinationState
    );

    return stateInfo.isInterState;
  }

  /**
   * Determines the active fare engine name based on trip parameters and automatic state detection.
   * Rule: IF One-Way trip AND Origin State != Destination State, THEN activate the 'INTER-STATE ONE-WAY' fare engine.
   */
  public determineActiveFareEngine(
    tripType: string,
    origin?: string,
    destination?: string,
    originDetails?: any,
    destinationDetails?: any,
    originState?: string,
    destinationState?: string
  ): 'INTER-STATE ONE-WAY' | 'ONE-WAY' | 'LOCAL' | 'ROUND_TRIP' | 'AIRPORT_TRANSFER' {
    const normalizedType = (tripType || '').toUpperCase().replace(/[\s-]/g, '_');

    if (normalizedType === 'LOCAL' || normalizedType === 'HOURLY') {
      return 'LOCAL';
    }
    if (normalizedType === 'ROUND_TRIP' || normalizedType === 'ROUNDTRIP') {
      return 'ROUND_TRIP';
    }
    if (normalizedType === 'AIRPORT' || normalizedType === 'AIRPORT_TRANSFER') {
      return 'AIRPORT_TRANSFER';
    }

    if (
      this.isInterStateOneWay(
        tripType,
        origin,
        destination,
        originDetails,
        destinationDetails,
        originState,
        destinationState
      )
    ) {
      return 'INTER-STATE ONE-WAY';
    }

    return 'ONE-WAY';
  }

  /**
   * Calculate authoritative fare with backend or offline fallback.
   * Enforces automatic state detection rule:
   * IF One-Way trip AND Origin State != Destination State, THEN activate the 'INTER-STATE ONE-WAY' fare engine.
   */
  public async calculateFare(
    input: DynamicFareCalculationInput
  ): Promise<DynamicFareCalculationResult> {
    const stateInfo = this.detectTripState(
      input.origin,
      input.destination,
      input.originDetails,
      input.destinationDetails,
      input.originState,
      input.destinationState
    );

    const isOneWay =
      input.bookingType === 'ONE_WAY' ||
      (input.bookingType as string) === 'oneway' ||
      (input.bookingType as string) === 'OUTSTATION_ONEWAY' ||
      (input.bookingType as string) === 'INTER_STATE_ONE_WAY';

    // AUTOMATIC STATE DETECTION RULE:
    // IF One-Way trip AND Origin State != Destination State, THEN activate the 'INTER-STATE ONE-WAY' fare engine.
    const shouldActivateInterStateOneWay = isOneWay && stateInfo.isInterState;

    if (shouldActivateInterStateOneWay) {
      // 1. Try backend authoritative calculation with INTER_STATE_ONE_WAY active
      try {
        const res = await fetch('/api/fare/calculate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...input,
            bookingType: 'INTER_STATE_ONE_WAY',
            tripType: 'INTER_STATE_ONE_WAY',
            originState: stateInfo.originState,
            destinationState: stateInfo.destinationState,
            isInterState: true,
          }),
        });
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.fare) {
            return {
              ...data.fare,
              originState: stateInfo.originState,
              destinationState: stateInfo.destinationState,
              isInterState: true,
              routeCategory: 'INTER_STATE',
              pricingModel: 'INTER_STATE_ONE_WAY',
              engineName: 'INTER-STATE ONE-WAY',
              interStateAppliedRule: `INTER-STATE ONE-WAY (${stateInfo.originState} → ${stateInfo.destinationState})`,
            };
          }
        }
      } catch (err) {
        // Fallback to local centralized Inter-State One-Way engine
      }

      // 2. Local fallback calculation using centralized Inter-State One-Way engine
      const centralized = this.getCentralizedConfigSync();
      const vId = (input.vehicleId || 'sedan-4-1') as FareVehicleId;
      const isPricing =
        centralized.interStateOneWay?.[vId] ||
        DEFAULT_CENTRALIZED_FARE_CONFIG.interStateOneWay[vId] ||
        DEFAULT_CENTRALIZED_FARE_CONFIG.interStateOneWay['sedan-4-1'];

      const vehicleMeta = getVehicleMeta(input.vehicleId);
      const isCalc = calculateInterStateFare(
        isPricing,
        input.distanceKm,
        vehicleMeta,
        stateInfo.originState,
        stateInfo.destinationState
      );

      const tollEstimate = isPricing.includeTolls ? isPricing.tollCharges : 0;
      const permitEstimate = isPricing.includePermit ? isPricing.permitStateTaxCharges : 0;
      const stateEntryEstimate = isPricing.includeStateEntry ? isPricing.stateEntryCharges : 0;
      const otherCharges = isPricing.includeOtherCharges ? isPricing.otherCharges : 0;

      const durationMinutes =
        input.durationMinutes || (input.distanceKm > 0 ? (input.distanceKm / 45) * 60 : 180);

      const dynamicResult: DynamicFareCalculationResult = {
        distanceKm: isCalc.distanceKm,
        durationMinutes: Math.round(durationMinutes),
        durationHours: Math.round((durationMinutes / 60) * 10) / 10,
        durationFormatted: `${Math.floor(durationMinutes / 60)}h ${Math.round(durationMinutes % 60)}m`,
        vehicleId: input.vehicleId,
        vehicleName: vehicleMeta.name,
        vehicleCategory: vehicleMeta.code,
        pricingVersion: centralized.version || 2,
        pricingModel: 'INTER_STATE_ONE_WAY',
        baseFare: isCalc.baseFare,
        includedKm: isPricing.includedKm || 0,
        billableKm: isCalc.distanceKm,
        distanceFare: isCalc.kmCharge,
        extraDistanceFare: isCalc.extraKmCharge,
        includedHours: 0,
        billableHours: 0,
        hourlyFare: 0,
        extraHourFare: 0,
        driverAllowance: isCalc.driverAllowance,
        interStateCharge: permitEstimate + stateEntryEstimate,
        routeCategory: 'INTER_STATE',
        originState: stateInfo.originState,
        destinationState: stateInfo.destinationState,
        isInterState: true,
        interStateAppliedRule: `INTER-STATE ONE-WAY (${stateInfo.originState} → ${stateInfo.destinationState})`,
        distanceRoundingApplied: input.distanceRounding || this.memoryRounding,
        nightCharge: 0,
        taxes: 0,
        tolls: tollEstimate,
        parking: 0,
        permits: permitEstimate,
        additionalCharges: tollEstimate + permitEstimate + stateEntryEstimate + otherCharges,
        subtotal: isCalc.originalFare,
        discountType:
          isPricing.discountType === 'PERCENTAGE'
            ? 'PERCENTAGE'
            : isPricing.discountType === 'FIXED'
            ? 'FIXED'
            : 'NONE',
        discountValue: isPricing.discountValue,
        discountAmount: isCalc.discountAmount > 0 ? isCalc.discountAmount : 0,
        discountLabel: isCalc.discountLabel,
        originalFare: isCalc.originalFare,
        minimumFareApplied: isCalc.distanceKm < isPricing.minimumBillableKm,
        unroundedFare: isCalc.finalFare,
        totalFare: isCalc.finalFare,
        currency: 'INR',
        fareBreakdown: isCalc.breakdown.map((b) => ({
          label: b.label,
          amount: b.amount,
          detail: b.type,
        })),
        timestamp: new Date().toISOString(),
        engineType: 'ENGINE_A',
        engineName: 'INTER-STATE ONE-WAY',
        engineDescription:
          'Activated via Automatic State Detection: One-Way trip with Origin State != Destination State',
        fareSnapshot: {
          vehicleId: input.vehicleId,
          vehicleType: vehicleMeta.name,
          engineType: 'ENGINE_A',
          baseFare: isCalc.baseFare,
          perKmRate: isPricing.perKmRate,
          includedKm: isPricing.includedKm || 0,
          extraPerKmRate: isPricing.extraPerKmRate,
          includedHours: 0,
          hourlyRate: 0,
          extraPerHourRate: 0,
          driverAllowance: isCalc.driverAllowance,
          distanceKm: isCalc.distanceKm,
          durationMinutes: Math.round(durationMinutes),
          durationHours: Math.round((durationMinutes / 60) * 10) / 10,
          additionalCharges: tollEstimate + permitEstimate + stateEntryEstimate + otherCharges,
          subtotal: isCalc.originalFare,
          discountType:
            isPricing.discountType === 'PERCENTAGE'
              ? 'PERCENTAGE'
              : isPricing.discountType === 'FIXED'
              ? 'FIXED'
              : 'NONE',
          discountValue: isPricing.discountValue,
          discountAmount: isCalc.discountAmount,
          originalFare: isCalc.originalFare,
          totalFare: isCalc.finalFare,
          pricingVersion: centralized.version || 2,
          currency: 'INR',
          timestamp: new Date().toISOString(),
          pricingModel: 'INTER_STATE_ONE_WAY',
          routeCategory: 'INTER_STATE',
          originState: stateInfo.originState,
          destinationState: stateInfo.destinationState,
          interStateCharge: permitEstimate + stateEntryEstimate,
          interStateRate: isPricing.perKmRate,
          interStateAppliedRule: `INTER-STATE ONE-WAY (${stateInfo.originState} → ${stateInfo.destinationState})`,
        },
      };

      return dynamicResult;
    }

    try {
      const res = await fetch('/api/fare/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...input,
          originState: stateInfo.originState,
          destinationState: stateInfo.destinationState,
        }),
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
      originState: stateInfo.originState,
      destinationState: stateInfo.destinationState,
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
   * Automatically enforces:
   * IF One-Way trip AND Origin State != Destination State, THEN activate the 'INTER-STATE ONE-WAY' fare engine.
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
    originState?: string;
    destinationState?: string;
  }): Promise<DynamicFareCalculationResult> {
    const isOneWay =
      params.bookingType === 'ONE_WAY' ||
      (params.bookingType as string) === 'oneway' ||
      (params.bookingType as string) === 'OUTSTATION_ONEWAY' ||
      (params.bookingType as string) === 'INTER_STATE_ONE_WAY';

    const stateInfo = this.detectTripState(
      params.origin,
      params.destination,
      undefined,
      undefined,
      params.originState,
      params.destinationState
    );

    // AUTOMATIC STATE DETECTION RULE:
    // IF One-Way trip AND Origin State != Destination State, THEN activate the 'INTER-STATE ONE-WAY' fare engine.
    if (isOneWay && stateInfo.isInterState) {
      return this.calculateFare({
        origin: params.origin,
        destination: params.destination,
        distanceKm: params.distanceKm || 140,
        durationMinutes: params.durationMinutes || 180,
        bookingType: 'ONE_WAY',
        vehicleId: params.vehicleId,
        pickupTime: params.pickupTime,
        roundTripDays: params.roundTripDays || 1,
        originState: stateInfo.originState,
        destinationState: stateInfo.destinationState,
      });
    }

    try {
      const res = await fetch('/api/fare/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...params,
          originState: stateInfo.originState,
          destinationState: stateInfo.destinationState,
        }),
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
      originState: stateInfo.originState,
      destinationState: stateInfo.destinationState,
    });
  }

  /**
   * Master Calculation Dispatcher with automatic state detection rule:
   * IF One-Way trip AND Origin State != Destination State, THEN activate the 'INTER-STATE ONE-WAY' fare engine.
   */
  public calculateMasterFare(params: {
    config?: CentralizedFareConfig;
    serviceType: ServiceTypeCategory;
    vehicleId: string;
    distanceKm: number;
    durationHours?: number;
    roundTripDays?: number;
    fromState?: string;
    toState?: string;
    origin?: string;
    destination?: string;
  }): FareCalculationResult {
    const config = params.config || this.getCentralizedConfigSync();
    let serviceType = params.serviceType;
    let fromState = params.fromState;
    let toState = params.toState;

    if (params.origin || params.destination || fromState || toState) {
      const stateInfo = this.detectTripState(
        params.origin,
        params.destination,
        undefined,
        undefined,
        fromState,
        toState
      );
      fromState = stateInfo.originState;
      toState = stateInfo.destinationState;

      // AUTOMATIC STATE DETECTION RULE:
      // IF One-Way trip AND Origin State != Destination State, THEN activate the 'INTER-STATE ONE-WAY' fare engine.
      if (serviceType === 'ONE_WAY' && stateInfo.isInterState) {
        serviceType = 'INTER_STATE_ONE_WAY';
      }
    }

    return calculateMasterFare({
      config,
      serviceType,
      vehicleId: params.vehicleId,
      distanceKm: params.distanceKm,
      durationHours: params.durationHours,
      roundTripDays: params.roundTripDays,
      fromState,
      toState,
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

export const isInterStateOneWay = fareService.isInterStateOneWay.bind(fareService);
export const determineActiveFareEngine = fareService.determineActiveFareEngine.bind(fareService);
export const detectTripState = fareService.detectTripState.bind(fareService);
