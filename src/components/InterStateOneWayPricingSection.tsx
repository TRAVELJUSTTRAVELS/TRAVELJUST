import React, { useState, useEffect, useMemo } from 'react';
import {
  Car,
  MapPin,
  Save,
  RotateCcw,
  Check,
  AlertTriangle,
  Info,
  Sparkles,
  Calculator,
  Compass,
  ArrowRight,
  ShieldCheck,
  Zap,
  Sliders,
  CheckCircle2,
  Table,
  LayoutGrid,
  RefreshCw,
} from 'lucide-react';
import {
  CentralizedFareConfig,
  InterStateOneWayPricing,
  FareVehicleId,
  FARE_VEHICLES_META,
  VehicleMetaInfo,
} from '../types/fareEngine';
import { fareService } from '../services/fareService';
import {
  DEFAULT_CENTRALIZED_FARE_CONFIG,
  calculateInterStateFare,
} from '../utils/centralFareEngine';

interface InterStateOneWayPricingSectionProps {
  isOwner?: boolean;
  onFareSaved?: (config: CentralizedFareConfig) => void;
  onSwitchToCentralized?: () => void;
}

const PRESET_ROUTES = [
  {
    name: 'Mysuru (KA) → Coimbatore (TN)',
    origin: 'Mysuru, Karnataka',
    destination: 'Coimbatore, Tamil Nadu',
    distanceKm: 210,
    originState: 'Karnataka',
    destinationState: 'Tamil Nadu',
  },
  {
    name: 'Mysuru (KA) → Wayanad (KL)',
    origin: 'Mysuru, Karnataka',
    destination: 'Wayanad, Kerala',
    distanceKm: 140,
    originState: 'Karnataka',
    destinationState: 'Kerala',
  },
  {
    name: 'Bengaluru (KA) → Chennai (TN)',
    origin: 'Bengaluru, Karnataka',
    destination: 'Chennai, Tamil Nadu',
    distanceKm: 345,
    originState: 'Karnataka',
    destinationState: 'Tamil Nadu',
  },
  {
    name: 'Mysuru (KA) → Ooty (TN)',
    origin: 'Mysuru, Karnataka',
    destination: 'Ooty, Tamil Nadu',
    distanceKm: 160,
    originState: 'Karnataka',
    destinationState: 'Tamil Nadu',
  },
];

export const InterStateOneWayPricingSection: React.FC<InterStateOneWayPricingSectionProps> = ({
  isOwner = true,
  onFareSaved,
  onSwitchToCentralized,
}) => {
  // Load initial config from fareService or defaults
  const [fullConfig, setFullConfig] = useState<CentralizedFareConfig>(() => {
    return fareService.getCentralizedConfigSync() || DEFAULT_CENTRALIZED_FARE_CONFIG;
  });

  const [ratesByVehicle, setRatesByVehicle] = useState<Record<FareVehicleId, InterStateOneWayPricing>>(() => {
    const initial = fareService.getCentralizedConfigSync()?.interStateOneWay || DEFAULT_CENTRALIZED_FARE_CONFIG.interStateOneWay;
    return JSON.parse(JSON.stringify(initial));
  });

  const [selectedVehicleId, setSelectedVehicleId] = useState<FareVehicleId>('sedan-4-1');
  const [viewLayout, setViewLayout] = useState<'MATRIX' | 'CARDS'>('MATRIX');
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  // Simulation test route state
  const [simDistanceKm, setSimDistanceKm] = useState<number>(210);
  const [simOrigin, setSimOrigin] = useState<string>('Mysuru, Karnataka');
  const [simDest, setSimDest] = useState<string>('Coimbatore, Tamil Nadu');
  const [simOriginState, setSimOriginState] = useState<string>('Karnataka');
  const [simDestState, setSimDestState] = useState<string>('Tamil Nadu');

  // Handle single field change for a specific vehicle category
  const handleFieldChange = (
    vehId: FareVehicleId,
    field: keyof InterStateOneWayPricing,
    value: any
  ) => {
    setRatesByVehicle((prev) => {
      const current = prev[vehId] || DEFAULT_CENTRALIZED_FARE_CONFIG.interStateOneWay[vehId];
      return {
        ...prev,
        [vehId]: {
          ...current,
          [field]: value,
        },
      };
    });
    setHasChanges(true);
  };

  // Bulk update minimum billable KM across all vehicle categories
  const handleBulkSetMinKm = (newMinKm: number) => {
    setRatesByVehicle((prev) => {
      const updated = { ...prev };
      FARE_VEHICLES_META.forEach((v) => {
        const current = updated[v.id as FareVehicleId] || DEFAULT_CENTRALIZED_FARE_CONFIG.interStateOneWay[v.id as FareVehicleId];
        updated[v.id as FareVehicleId] = {
          ...current,
          minimumBillableKm: newMinKm,
        };
      });
      return updated;
    });
    setHasChanges(true);
  };

  // Bulk adjust per-km rate by percentage (+5%, +10%, etc.)
  const handleBulkAdjustPerKm = (pctChange: number) => {
    setRatesByVehicle((prev) => {
      const updated = { ...prev };
      FARE_VEHICLES_META.forEach((v) => {
        const current = updated[v.id as FareVehicleId] || DEFAULT_CENTRALIZED_FARE_CONFIG.interStateOneWay[v.id as FareVehicleId];
        const newRate = Math.round((current.perKmRate * (1 + pctChange / 100)) * 2) / 2; // round to nearest 0.5
        updated[v.id as FareVehicleId] = {
          ...current,
          perKmRate: newRate,
        };
      });
      return updated;
    });
    setHasChanges(true);
  };

  // Reset to saved or default rates
  const handleResetToBaseline = () => {
    const baseline = fareService.getCentralizedConfigSync()?.interStateOneWay || DEFAULT_CENTRALIZED_FARE_CONFIG.interStateOneWay;
    setRatesByVehicle(JSON.parse(JSON.stringify(baseline)));
    setHasChanges(false);
  };

  // Save changes
  const handleSaveRates = async () => {
    setIsSaving(true);
    try {
      const updatedCentralized: CentralizedFareConfig = {
        ...fullConfig,
        interStateOneWay: ratesByVehicle,
        updatedAt: new Date().toISOString(),
        updatedBy: 'Owner Portal (Inter-State One-Way Config)',
      };

      // Persist in Centralized Config
      const savedConfig = await fareService.saveCentralizedConfig(
        updatedCentralized,
        'Owner Portal'
      );

      // Also persist to independent vehicle rate endpoints if available
      for (const vMeta of FARE_VEHICLES_META) {
        const vId = vMeta.id as FareVehicleId;
        const vRates = ratesByVehicle[vId];
        if (vRates) {
          try {
            await fareService.updateInterStateRate(
              vId,
              {
                vehicleId: vId,
                vehicleName: vMeta.name,
                baseFare: vRates.baseFare,
                perKmRate: vRates.perKmRate,
                minimumKm: vRates.minimumBillableKm,
                extraPerKmRate: vRates.extraPerKmRate,
                driverAllowance: vRates.driverAllowance,
                active: vRates.active,
              },
              'Owner Portal'
            );
          } catch {
            // Silently continue if backend sub-endpoint is offline
          }
        }
      }

      setFullConfig(savedConfig);
      setHasChanges(false);
      setSaveSuccessMsg('Inter-State One-Way pricing saved & active across all booking flows!');
      if (onFareSaved) {
        onFareSaved(savedConfig);
      }
      setTimeout(() => setSaveSuccessMsg(null), 4500);
    } catch (err: any) {
      alert(`Failed to save Inter-State pricing: ${err?.message || 'Unknown error'}`);
    } finally {
      setIsSaving(false);
    }
  };

  // Selected vehicle metadata
  const activeVehicleMeta = useMemo(() => {
    return (
      FARE_VEHICLES_META.find((v) => v.id === selectedVehicleId) ||
      FARE_VEHICLES_META[0]
    );
  }, [selectedVehicleId]);

  return (
    <div
      id="interstate-oneway-pricing-section"
      className="flex-1 flex flex-col min-h-0 bg-slate-50 overflow-y-auto p-4 sm:p-6 space-y-6"
    >
      {/* Top Banner & Mode Information */}
      <div
        id="interstate-hero-banner"
        className="bg-linear-to-r from-slate-900 via-amber-950 to-slate-900 text-white rounded-2xl p-5 sm:p-6 shadow-md border border-amber-900/50"
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-amber-400 text-slate-950 shadow-xs">
                Dedicated Fare Engine
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-white/10 text-amber-200 border border-amber-400/20">
                Rule: ONE-WAY & Origin State ≠ Destination State
              </span>
              {hasChanges && (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-rose-500 text-white animate-pulse">
                  Unsaved Changes
                </span>
              )}
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
              <Compass className="w-6 h-6 text-amber-400" />
              Inter-State One-Way Configuration Sub-Section
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-3xl leading-relaxed">
              Configure independent <strong>Base Fares</strong>, <strong>Per-KM Rates</strong>, and <strong>State Permit Charges</strong> for each vehicle category in the &apos;INTER-STATE ONE-WAY&apos; trip category.
              This engine is automatically triggered when a customer books a one-way trip crossing state borders (e.g., Karnataka ➔ Tamil Nadu, Kerala, AP, Telangana).
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {onSwitchToCentralized && (
              <button
                id="interstate-switch-centralized-btn"
                type="button"
                onClick={onSwitchToCentralized}
                className="px-3.5 py-2 text-xs font-bold text-slate-200 bg-white/10 hover:bg-white/15 rounded-xl border border-white/10 transition-colors cursor-pointer"
              >
                View Multi-Service Engine
              </button>
            )}
            <button
              id="interstate-header-save-btn"
              type="button"
              onClick={handleSaveRates}
              disabled={isSaving || !hasChanges}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold shadow-md transition-all cursor-pointer ${
                hasChanges
                  ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 ring-2 ring-amber-300'
                  : 'bg-white/10 text-slate-400 cursor-not-allowed border border-white/5'
              }`}
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Saving Changes...' : 'Save & Publish Rates'}</span>
            </button>
          </div>
        </div>

        {/* Success Alert Toast */}
        {saveSuccessMsg && (
          <div
            id="interstate-save-success-toast"
            className="mt-4 p-3 bg-emerald-950/80 border border-emerald-500/50 rounded-xl text-emerald-200 text-xs font-semibold flex items-center justify-between animate-in fade-in duration-200"
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>{saveSuccessMsg}</span>
            </div>
            <button
              type="button"
              onClick={() => setSaveSuccessMsg(null)}
              className="text-emerald-400 hover:text-white text-xs font-bold px-2 py-0.5"
            >
              Dismiss
            </button>
          </div>
        )}
      </div>

      {/* Control Bar: Bulk Actions & Layout Switcher */}
      <div
        id="interstate-control-bar"
        className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 shadow-2xs"
      >
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5 mr-1">
            <Sliders className="w-3.5 h-3.5 text-amber-600" />
            Quick Bulk Set Min KM:
          </span>
          <button
            id="bulk-min-km-149-btn"
            type="button"
            onClick={() => handleBulkSetMinKm(149)}
            className="px-2.5 py-1 text-xs font-bold bg-amber-100 text-amber-950 hover:bg-amber-200 rounded-lg border border-amber-300 transition-colors cursor-pointer"
          >
            All 149 KM
          </button>
          <button
            id="bulk-min-km-250-btn"
            type="button"
            onClick={() => handleBulkSetMinKm(250)}
            className="px-2.5 py-1 text-xs font-bold bg-slate-100 hover:bg-amber-100 hover:text-amber-900 text-slate-700 rounded-lg border border-slate-200 transition-colors cursor-pointer"
          >
            All 250 KM
          </button>
          <button
            id="bulk-min-km-300-btn"
            type="button"
            onClick={() => handleBulkSetMinKm(300)}
            className="px-2.5 py-1 text-xs font-bold bg-slate-100 hover:bg-amber-100 hover:text-amber-900 text-slate-700 rounded-lg border border-slate-200 transition-colors cursor-pointer"
          >
            All 300 KM
          </button>
          <button
            id="bulk-min-km-350-btn"
            type="button"
            onClick={() => handleBulkSetMinKm(350)}
            className="px-2.5 py-1 text-xs font-bold bg-slate-100 hover:bg-amber-100 hover:text-amber-900 text-slate-700 rounded-lg border border-slate-200 transition-colors cursor-pointer"
          >
            All 350 KM
          </button>

          <div className="h-4 w-px bg-slate-200 mx-1 hidden sm:block" />

          <button
            id="bulk-per-km-plus-5-btn"
            type="button"
            onClick={() => handleBulkAdjustPerKm(5)}
            className="px-2.5 py-1 text-xs font-bold bg-slate-100 hover:bg-emerald-100 hover:text-emerald-900 text-slate-700 rounded-lg border border-slate-200 transition-colors cursor-pointer"
            title="Increase per-km rates across all vehicles by 5%"
          >
            +5% Per-KM
          </button>
          <button
            id="bulk-per-km-plus-10-btn"
            type="button"
            onClick={() => handleBulkAdjustPerKm(10)}
            className="px-2.5 py-1 text-xs font-bold bg-slate-100 hover:bg-emerald-100 hover:text-emerald-900 text-slate-700 rounded-lg border border-slate-200 transition-colors cursor-pointer"
            title="Increase per-km rates across all vehicles by 10%"
          >
            +10% Per-KM
          </button>
        </div>

        <div className="flex items-center gap-2">
          {hasChanges && (
            <button
              id="interstate-reset-rates-btn"
              type="button"
              onClick={handleResetToBaseline}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          )}

          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
            <button
              id="interstate-view-matrix-btn"
              type="button"
              onClick={() => setViewLayout('MATRIX')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                viewLayout === 'MATRIX'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Table className="w-3.5 h-3.5" />
              <span>Matrix View</span>
            </button>
            <button
              id="interstate-view-cards-btn"
              type="button"
              onClick={() => setViewLayout('CARDS')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                viewLayout === 'CARDS'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Cards View</span>
            </button>
          </div>
        </div>
      </div>

      {/* SECTION 1: VEHICLE CATEGORY PRICING (Matrix View) */}
      {viewLayout === 'MATRIX' && (
        <div
          id="interstate-matrix-view-container"
          className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden"
        >
          <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-slate-50/50">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Car className="w-4 h-4 text-amber-600" />
                Vehicle Category Rate Matrix (Independent Base Fares, Per-KM & Minimum KM)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Each vehicle category operates independently. Edit rates directly below to instantly configure cross-border tariffs.
              </p>
            </div>
            <span className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-amber-50 text-amber-900 border border-amber-200">
              5 Fleet Categories
            </span>
          </div>

          <div className="overflow-x-auto">
            <table id="interstate-rate-table" className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100/75 border-b border-slate-200 text-slate-700 font-bold text-[11px] uppercase tracking-wider">
                  <th className="py-3 px-4">Vehicle Category</th>
                  <th className="py-3 px-3 text-center">Status</th>
                  <th className="py-3 px-3">
                    <span className="text-amber-950 font-extrabold">Base Fare (₹)</span>
                  </th>
                  <th className="py-3 px-3">
                    <span className="text-amber-950 font-extrabold">Per-KM Rate (₹/km)</span>
                  </th>
                  <th className="py-3 px-3">
                    <span className="text-emerald-950 font-extrabold">State Permit Charges (₹)</span>
                  </th>
                  <th className="py-3 px-3">
                    <span className="text-blue-950 font-extrabold">Minimum KM</span>
                  </th>
                  <th className="py-3 px-3">Driver Allw (₹)</th>
                  <th className="py-3 px-3">Extra KM (₹)</th>
                  <th className="py-3 px-4 text-right">Sample (250 KM)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {FARE_VEHICLES_META.map((vMeta) => {
                  const vehId = vMeta.id as FareVehicleId;
                  const currentPricing =
                    ratesByVehicle[vehId] ||
                    DEFAULT_CENTRALIZED_FARE_CONFIG.interStateOneWay[vehId] ||
                    DEFAULT_CENTRALIZED_FARE_CONFIG.interStateOneWay['sedan-4-1'];

                  // 250 KM sample calculation
                  const sampleSim = calculateInterStateFare(
                    currentPricing,
                    250,
                    vMeta,
                    'Karnataka',
                    'Tamil Nadu'
                  );

                  return (
                    <tr
                      key={vehId}
                      id={`interstate-row-${vehId}`}
                      className="hover:bg-amber-50/30 transition-colors"
                    >
                      {/* Vehicle Identity */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                          <span>{vMeta.name}</span>
                        </div>
                        <div className="text-[11px] text-slate-500">{vMeta.models}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          {vMeta.seats} · {vMeta.luggage}
                        </div>
                      </td>

                      {/* Active Status */}
                      <td className="py-3 px-3 text-center">
                        <label className="inline-flex items-center cursor-pointer">
                          <input
                            id={`interstate-active-${vehId}`}
                            type="checkbox"
                            checked={currentPricing.active ?? true}
                            onChange={(e) =>
                              handleFieldChange(vehId, 'active', e.target.checked)
                            }
                            className="rounded text-amber-600 focus:ring-amber-500 h-4 w-4"
                          />
                        </label>
                      </td>

                      {/* Independent Base Fare */}
                      <td className="py-3 px-3">
                        <div className="relative">
                          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">
                            ₹
                          </span>
                          <input
                            id={`interstate-base-fare-input-${vehId}`}
                            type="number"
                            min="0"
                            step="50"
                            value={currentPricing.baseFare}
                            onChange={(e) =>
                              handleFieldChange(vehId, 'baseFare', Number(e.target.value))
                            }
                            className="w-24 pl-6 pr-2 py-1.5 bg-amber-50/50 border border-amber-300 rounded-lg text-xs font-bold text-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                          />
                        </div>
                      </td>

                      {/* Independent Per-KM Rate */}
                      <td className="py-3 px-3">
                        <div className="relative">
                          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">
                            ₹
                          </span>
                          <input
                            id={`interstate-per-km-input-${vehId}`}
                            type="number"
                            min="0"
                            step="0.5"
                            value={currentPricing.perKmRate}
                            onChange={(e) =>
                              handleFieldChange(vehId, 'perKmRate', Number(e.target.value))
                            }
                            className="w-24 pl-6 pr-2 py-1.5 bg-amber-50/50 border border-amber-300 rounded-lg text-xs font-bold text-amber-950 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                          />
                        </div>
                      </td>

                      {/* Independent State Permit Charges */}
                      <td className="py-3 px-3">
                        <div className="relative">
                          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-emerald-800 text-[11px] font-bold">
                            ₹
                          </span>
                          <input
                            id={`interstate-state-permit-charges-input-${vehId}`}
                            type="number"
                            min="0"
                            step="50"
                            value={currentPricing.permitStateTaxCharges ?? 600}
                            onChange={(e) =>
                              handleFieldChange(vehId, 'permitStateTaxCharges', Number(e.target.value))
                            }
                            className="w-24 pl-6 pr-2 py-1.5 bg-emerald-50/50 border border-emerald-300 rounded-lg text-xs font-bold text-emerald-950 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                          />
                        </div>
                      </td>

                      {/* Independent Minimum KM */}
                      <td className="py-3 px-3">
                        <div className="relative">
                          <input
                            id={`interstate-min-km-input-${vehId}`}
                            type="number"
                            min="0"
                            step="10"
                            value={currentPricing.minimumBillableKm}
                            onChange={(e) =>
                              handleFieldChange(vehId, 'minimumBillableKm', Number(e.target.value))
                            }
                            className="w-24 px-2.5 py-1.5 bg-blue-50/60 border border-blue-300 rounded-lg text-xs font-bold text-blue-950 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                          />
                          <span className="text-[10px] text-blue-800 ml-1 font-semibold">KM</span>
                        </div>
                      </td>

                      {/* Driver Allowance */}
                      <td className="py-3 px-3">
                        <input
                          id={`interstate-driver-allowance-input-${vehId}`}
                          type="number"
                          min="0"
                          step="50"
                          value={currentPricing.driverAllowance}
                          onChange={(e) =>
                            handleFieldChange(vehId, 'driverAllowance', Number(e.target.value))
                          }
                          className="w-20 px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-slate-500 focus:outline-none"
                        />
                      </td>

                      {/* Extra KM Rate */}
                      <td className="py-3 px-3">
                        <input
                          id={`interstate-extra-km-input-${vehId}`}
                          type="number"
                          min="0"
                          step="0.5"
                          value={currentPricing.extraPerKmRate ?? currentPricing.perKmRate}
                          onChange={(e) =>
                            handleFieldChange(vehId, 'extraPerKmRate', Number(e.target.value))
                          }
                          className="w-20 px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-slate-500 focus:outline-none"
                        />
                      </td>

                      {/* 250 KM Calculated Sample Fare */}
                      <td className="py-3 px-4 text-right">
                        <div className="font-extrabold text-sm text-slate-900">
                          ₹{sampleSim.finalFare.toLocaleString('en-IN')}
                        </div>
                        <div className="text-[10px] text-slate-500">
                          ₹{sampleSim.kmCharge} km + ₹{currentPricing.baseFare} base
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SECTION 2: VEHICLE CATEGORY PRICING (Card Grid View) */}
      {viewLayout === 'CARDS' && (
        <div id="interstate-cards-view-container" className="space-y-4">
          {/* Vehicle selector pills */}
          <div className="flex flex-wrap items-center gap-2 bg-white p-3 rounded-xl border border-slate-200">
            {FARE_VEHICLES_META.map((vMeta) => (
              <button
                key={vMeta.id}
                id={`interstate-card-tab-${vMeta.id}`}
                type="button"
                onClick={() => setSelectedVehicleId(vMeta.id as FareVehicleId)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  selectedVehicleId === vMeta.id
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <Car className="w-3.5 h-3.5" />
                <span>{vMeta.name}</span>
              </button>
            ))}
          </div>

          {/* Active Vehicle Detailed Card */}
          {(() => {
            const currentPricing =
              ratesByVehicle[selectedVehicleId] ||
              DEFAULT_CENTRALIZED_FARE_CONFIG.interStateOneWay[selectedVehicleId] ||
              DEFAULT_CENTRALIZED_FARE_CONFIG.interStateOneWay['sedan-4-1'];

            const sampleSim = calculateInterStateFare(
              currentPricing,
              simDistanceKm,
              activeVehicleMeta,
              simOriginState,
              simDestState
            );

            return (
              <div
                id={`interstate-detail-card-${selectedVehicleId}`}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-5"
              >
                {/* Header */}
                <div className="flex flex-wrap items-center justify-between pb-4 border-b border-slate-100 gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-base font-bold text-slate-900">
                        {activeVehicleMeta.name} — Inter-State Pricing
                      </h4>
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300">
                        {activeVehicleMeta.code}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {activeVehicleMeta.models} ({activeVehicleMeta.seats}, {activeVehicleMeta.luggage})
                    </p>
                  </div>

                  <label className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 cursor-pointer hover:bg-slate-100">
                    <input
                      type="checkbox"
                      checked={currentPricing.active ?? true}
                      onChange={(e) =>
                        handleFieldChange(selectedVehicleId, 'active', e.target.checked)
                      }
                      className="rounded text-amber-600 focus:ring-amber-500 h-3.5 w-3.5"
                    />
                    <span>Active for Inter-State Trips</span>
                  </label>
                </div>

                {/* 3 Key Independent Controls Grid: Base Fare, Per-KM Rate, State Permit Charges */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Independent Base Fare */}
                  <div
                    id={`interstate-card-base-fare-${selectedVehicleId}`}
                    className="bg-amber-50/70 p-4 rounded-xl border border-amber-200/90 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-amber-950">
                        Base Fare (₹)
                      </label>
                      <span className="text-[10px] font-bold text-amber-800">Dispatch Fee</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          handleFieldChange(
                            selectedVehicleId,
                            'baseFare',
                            Math.max(0, currentPricing.baseFare - 50)
                          )
                        }
                        className="w-8 h-8 rounded-lg bg-white border border-amber-300 font-bold text-amber-900 hover:bg-amber-100 cursor-pointer flex items-center justify-center"
                      >
                        -
                      </button>
                      <input
                        id={`interstate-card-base-fare-input-${selectedVehicleId}`}
                        type="number"
                        min="0"
                        step="50"
                        value={currentPricing.baseFare}
                        onChange={(e) =>
                          handleFieldChange(
                            selectedVehicleId,
                            'baseFare',
                            Number(e.target.value)
                          )
                        }
                        className="flex-1 px-3 py-2 bg-white border border-amber-300 rounded-lg text-sm font-bold text-slate-900 text-center focus:ring-2 focus:ring-amber-500 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          handleFieldChange(
                            selectedVehicleId,
                            'baseFare',
                            currentPricing.baseFare + 50
                          )
                        }
                        className="w-8 h-8 rounded-lg bg-white border border-amber-300 font-bold text-amber-900 hover:bg-amber-100 cursor-pointer flex items-center justify-center"
                      >
                        +
                      </button>
                    </div>
                    <p className="text-[11px] text-amber-800">Starting minimum base dispatch charge</p>
                  </div>

                  {/* Independent Per-KM Rate */}
                  <div
                    id={`interstate-card-per-km-${selectedVehicleId}`}
                    className="bg-amber-50/70 p-4 rounded-xl border border-amber-200/90 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-amber-950">
                        Per-KM Rate (₹/km)
                      </label>
                      <span className="text-[10px] font-bold text-amber-800">Distance Tariff</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          handleFieldChange(
                            selectedVehicleId,
                            'perKmRate',
                            Math.max(1, currentPricing.perKmRate - 0.5)
                          )
                        }
                        className="w-8 h-8 rounded-lg bg-white border border-amber-300 font-bold text-amber-900 hover:bg-amber-100 cursor-pointer flex items-center justify-center"
                      >
                        -
                      </button>
                      <input
                        id={`interstate-card-per-km-input-${selectedVehicleId}`}
                        type="number"
                        min="0"
                        step="0.5"
                        value={currentPricing.perKmRate}
                        onChange={(e) =>
                          handleFieldChange(
                            selectedVehicleId,
                            'perKmRate',
                            Number(e.target.value)
                          )
                        }
                        className="flex-1 px-3 py-2 bg-white border border-amber-300 rounded-lg text-sm font-bold text-amber-950 text-center focus:ring-2 focus:ring-amber-500 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          handleFieldChange(
                            selectedVehicleId,
                            'perKmRate',
                            currentPricing.perKmRate + 0.5
                          )
                        }
                        className="w-8 h-8 rounded-lg bg-white border border-amber-300 font-bold text-amber-900 hover:bg-amber-100 cursor-pointer flex items-center justify-center"
                      >
                        +
                      </button>
                    </div>
                    <p className="text-[11px] text-amber-800">Standard distance rate per kilometer</p>
                  </div>

                  {/* Independent State Permit Charges */}
                  <div
                    id={`interstate-card-state-permit-charges-${selectedVehicleId}`}
                    className="bg-emerald-50/70 p-4 rounded-xl border border-emerald-200/90 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-emerald-950">
                        State Permit Charges (₹)
                      </label>
                      <label className="flex items-center gap-1 text-[10px] font-bold text-emerald-800 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={currentPricing.includePermit ?? true}
                          onChange={(e) =>
                            handleFieldChange(
                              selectedVehicleId,
                              'includePermit',
                              e.target.checked
                            )
                          }
                          className="rounded text-emerald-600 focus:ring-emerald-500 h-3 w-3"
                        />
                        <span>Included in Total</span>
                      </label>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          handleFieldChange(
                            selectedVehicleId,
                            'permitStateTaxCharges',
                            Math.max(0, (currentPricing.permitStateTaxCharges ?? 600) - 50)
                          )
                        }
                        className="w-8 h-8 rounded-lg bg-white border border-emerald-300 font-bold text-emerald-900 hover:bg-emerald-100 cursor-pointer flex items-center justify-center"
                      >
                        -
                      </button>
                      <input
                        id={`interstate-card-state-permit-charges-input-${selectedVehicleId}`}
                        type="number"
                        min="0"
                        step="50"
                        value={currentPricing.permitStateTaxCharges ?? 600}
                        onChange={(e) =>
                          handleFieldChange(
                            selectedVehicleId,
                            'permitStateTaxCharges',
                            Number(e.target.value)
                          )
                        }
                        className="flex-1 px-3 py-2 bg-white border border-emerald-300 rounded-lg text-sm font-bold text-emerald-950 text-center focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          handleFieldChange(
                            selectedVehicleId,
                            'permitStateTaxCharges',
                            (currentPricing.permitStateTaxCharges ?? 600) + 50
                          )
                        }
                        className="w-8 h-8 rounded-lg bg-white border border-emerald-300 font-bold text-emerald-900 hover:bg-emerald-100 cursor-pointer flex items-center justify-center"
                      >
                        +
                      </button>
                    </div>
                    <p className="text-[11px] text-emerald-800">Cross-state border commercial entry permit</p>
                  </div>
                </div>

                {/* Additional parameters row: Minimum KM, Driver Allowance, Extra KM, Tolls */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                  <div className="bg-blue-50/70 p-3 rounded-xl border border-blue-200">
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[11px] font-bold text-blue-950">
                        Minimum Billable KM
                      </label>
                      <span className="text-[9px] font-bold text-blue-800">Floor</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <input
                        id={`interstate-card-min-km-input-${selectedVehicleId}`}
                        type="number"
                        min="0"
                        step="10"
                        value={currentPricing.minimumBillableKm}
                        onChange={(e) =>
                          handleFieldChange(
                            selectedVehicleId,
                            'minimumBillableKm',
                            Number(e.target.value)
                          )
                        }
                        className="w-full px-2.5 py-1.5 bg-white border border-blue-300 rounded-lg text-xs font-bold text-blue-950 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                      <span className="text-[10px] text-blue-800 font-bold">KM</span>
                    </div>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Driver Allowance (₹)
                    </label>
                    <input
                      id={`interstate-card-driver-allowance-input-${selectedVehicleId}`}
                      type="number"
                      step="50"
                      value={currentPricing.driverAllowance}
                      onChange={(e) =>
                        handleFieldChange(
                          selectedVehicleId,
                          'driverAllowance',
                          Number(e.target.value)
                        )
                      }
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-900"
                    />
                  </div>

                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Extra Per-KM Rate (₹)
                    </label>
                    <input
                      id={`interstate-card-extra-km-input-${selectedVehicleId}`}
                      type="number"
                      step="0.5"
                      value={currentPricing.extraPerKmRate ?? currentPricing.perKmRate}
                      onChange={(e) =>
                        handleFieldChange(
                          selectedVehicleId,
                          'extraPerKmRate',
                          Number(e.target.value)
                        )
                      }
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-900"
                    />
                  </div>

                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Highway FASTag Tolls (₹)
                    </label>
                    <input
                      id={`interstate-card-toll-charges-input-${selectedVehicleId}`}
                      type="number"
                      step="50"
                      value={currentPricing.tollCharges ?? 150}
                      onChange={(e) =>
                        handleFieldChange(
                          selectedVehicleId,
                          'tollCharges',
                          Number(e.target.value)
                        )
                      }
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-900"
                    />
                  </div>
                </div>

                {/* Live Formula Preview Box */}
                <div className="bg-slate-900 text-white rounded-xl p-4 text-xs space-y-2">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <span className="font-bold text-amber-400">
                      Live Formula: {activeVehicleMeta.name} ({simDistanceKm} KM route)
                    </span>
                    <span className="font-bold text-base text-emerald-400 font-mono">
                      Total: ₹{sampleSim.finalFare.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] pt-1">
                    <div>
                      <span className="text-slate-400 block text-[10px]">BILLABLE DISTANCE</span>
                      <span className="font-bold">{sampleSim.distanceKm} KM</span>
                      <span className="text-[10px] text-amber-400 block">Min: {currentPricing.minimumBillableKm} KM</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">DISTANCE CHARGE</span>
                      <span className="font-bold">₹{sampleSim.kmCharge}</span>
                      <span className="text-[10px] text-slate-400 block">@{currentPricing.perKmRate}/km</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">BASE & ALLOWANCE</span>
                      <span className="font-bold">₹{currentPricing.baseFare + sampleSim.driverAllowance}</span>
                      <span className="text-[10px] text-slate-400 block">Base ₹{currentPricing.baseFare} + Allw ₹{sampleSim.driverAllowance}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">PERMITS & TAXES</span>
                      <span className="font-bold">₹{(currentPricing.includePermit ? currentPricing.permitStateTaxCharges : 0) + (currentPricing.includeTolls ? currentPricing.tollCharges : 0)}</span>
                      <span className="text-[10px] text-slate-400 block">Permit: ₹{currentPricing.permitStateTaxCharges}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* SECTION 3: LIVE CROSS-BORDER ROUTE TESTER & SIMULATOR */}
      <div
        id="interstate-simulator-box"
        className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4"
      >
        <div className="flex flex-wrap items-center justify-between pb-3 border-b border-slate-100 gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-900 flex items-center justify-center font-bold">
              <Calculator className="w-4 h-4 text-amber-800" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Interactive Cross-Border Route Simulator
              </h3>
              <p className="text-xs text-slate-500">
                Test how the configured base fares, per-km rates, and minimum km bill customers on real inter-state routes.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-bold text-slate-500 mr-1">Presets:</span>
            {PRESET_ROUTES.map((p, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setSimDistanceKm(p.distanceKm);
                  setSimOrigin(p.origin);
                  setSimDest(p.destination);
                  setSimOriginState(p.originState);
                  setSimDestState(p.destinationState);
                }}
                className={`text-[11px] font-bold px-2 py-1 rounded-md transition-colors cursor-pointer border ${
                  simDistanceKm === p.distanceKm
                    ? 'bg-amber-100 text-amber-900 border-amber-300'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {p.name.split('→')[1].trim()} ({p.distanceKm} km)
              </button>
            ))}
          </div>
        </div>

        {/* Inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">
              Origin (State 1)
            </label>
            <input
              type="text"
              value={simOrigin}
              onChange={(e) => setSimOrigin(e.target.value)}
              className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
            />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">
              Destination (State 2)
            </label>
            <input
              type="text"
              value={simDest}
              onChange={(e) => setSimDest(e.target.value)}
              className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
            />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">
              Route Distance (KM)
            </label>
            <input
              type="number"
              min="1"
              value={simDistanceKm}
              onChange={(e) => setSimDistanceKm(Math.max(1, Number(e.target.value)))}
              className="w-full px-3 py-1.5 text-xs font-bold bg-amber-50/60 border border-amber-300 rounded-lg text-amber-950"
            />
          </div>
        </div>

        {/* All Fleet Calculated Results Comparison */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-2">
          {FARE_VEHICLES_META.map((vMeta) => {
            const vehId = vMeta.id as FareVehicleId;
            const currentPricing =
              ratesByVehicle[vehId] ||
              DEFAULT_CENTRALIZED_FARE_CONFIG.interStateOneWay[vehId] ||
              DEFAULT_CENTRALIZED_FARE_CONFIG.interStateOneWay['sedan-4-1'];

            const sim = calculateInterStateFare(
              currentPricing,
              simDistanceKm,
              vMeta,
              simOriginState,
              simDestState
            );

            const isMinKmApplied = simDistanceKm < currentPricing.minimumBillableKm;

            return (
              <div
                key={vehId}
                className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1.5 text-xs relative hover:border-amber-400 transition-colors"
              >
                <div className="font-bold text-slate-900 flex items-center justify-between">
                  <span>{vMeta.code}</span>
                  {isMinKmApplied ? (
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-900 border border-blue-200">
                      Floor KM
                    </span>
                  ) : (
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-900 border border-emerald-200">
                      Actual KM
                    </span>
                  )}
                </div>

                <div className="text-[11px] text-slate-500">
                  {vMeta.models}
                </div>

                <div className="pt-2 border-t border-slate-200">
                  <div className="text-base font-extrabold text-slate-900">
                    ₹{sim.finalFare.toLocaleString('en-IN')}
                  </div>
                  <div className="text-[10px] text-slate-500 space-y-0.5 mt-1">
                    <div>
                      Billable: <strong>{sim.distanceKm} KM</strong> (@₹{currentPricing.perKmRate})
                    </div>
                    <div>
                      Base: <strong>₹{currentPricing.baseFare}</strong>
                    </div>
                    <div>
                      Allw + Permit: <strong>₹{sim.driverAllowance + (currentPricing.permitStateTaxCharges ?? 0)}</strong>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Floating Bottom Sticky Bar for Easy Saving */}
      <div
        id="interstate-bottom-save-bar"
        className="sticky bottom-0 bg-white/95 backdrop-blur-md p-4 rounded-xl border border-slate-200 shadow-lg flex flex-wrap items-center justify-between gap-3"
      >
        <div className="flex items-center gap-2">
          {hasChanges ? (
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-900 bg-amber-50 border border-amber-300 px-3 py-1.5 rounded-lg">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
              Unsaved Rate Changes Detected
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-900 bg-emerald-50 border border-emerald-300 px-3 py-1.5 rounded-lg">
              <Check className="w-4 h-4 text-emerald-700" />
              All Inter-State One-Way rates are synchronized & live
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            id="interstate-bottom-reset-btn"
            type="button"
            onClick={handleResetToBaseline}
            disabled={!hasChanges}
            className="px-3 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 disabled:opacity-40 cursor-pointer"
          >
            Revert
          </button>
          <button
            id="interstate-bottom-save-btn"
            type="button"
            onClick={handleSaveRates}
            disabled={isSaving || !hasChanges}
            className="flex items-center gap-1.5 px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl shadow-md transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Saving Changes...' : 'Save & Publish Rates'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
