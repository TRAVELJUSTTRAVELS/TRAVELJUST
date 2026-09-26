import React, { useState, useEffect, useMemo } from 'react';
import {
  Car,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Save,
  Tag,
  Percent,
  Eye,
  History,
  Check,
  X,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  Calculator,
  Compass,
  Plane,
  Clock,
  MapPin,
  Calendar,
  Layers,
  Fuel,
  Info,
  SlidersHorizontal,
  Minimize2,
} from 'lucide-react';
import {
  CentralizedFareConfig,
  DiscountType,
  FareCalculationResult,
  FareHistoryEntry,
  FareVehicleId,
  LocalPricing,
  OneWayCorridorId,
  OneWayFixedCorridorConfig,
  OneWayPricing,
  RoundTripPricing,
  AirportPricing,
  InterStateOneWayPricing,
  ServiceTypeCategory,
  FARE_VEHICLES_META,
  VehicleMetaInfo,
} from '../types/fareEngine';
import { fareService } from '../services/fareService';
import {
  calculateLocalFare,
  calculateOneWayFare,
  calculateRoundTripFare,
  calculateAirportFare,
  calculateInterStateFare,
  calculateMasterFare,
  DEFAULT_CENTRALIZED_FARE_CONFIG,
  DEFAULT_ONE_WAY_FIXED_CORRIDORS,
} from '../utils/centralFareEngine';

export type ActiveSection = 'LOCAL' | 'ONE_WAY' | 'ROUND_TRIP' | 'AIRPORT' | 'INTER_STATE_ONE_WAY' | 'PREVIEW' | 'HISTORY';

export interface AdvancedFareEngineProps {
  onClose?: () => void;
  onMinimize?: () => void;
  isOwner?: boolean;
  onFareSaved?: (config: CentralizedFareConfig) => void;
  initialSection?: ActiveSection;
}

export const AdvancedFareEngine: React.FC<AdvancedFareEngineProps> = ({
  onClose,
  onMinimize,
  isOwner = true,
  onFareSaved,
  initialSection = 'LOCAL',
}) => {
  // Centralized Configuration State
  const [activeSection, setActiveSection] = useState<ActiveSection>(initialSection);
  const [selectedVehicleId, setSelectedVehicleId] = useState<FareVehicleId>('sedan-4-1');

  // Working editable config copy
  const [config, setConfig] = useState<CentralizedFareConfig>(() =>
    fareService.getCentralizedConfigSync()
  );
  const [savedBaseline, setSavedBaseline] = useState<CentralizedFareConfig>(() =>
    fareService.getCentralizedConfigSync()
  );

  // Status & Feedback
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSavedTimestamp, setLastSavedTimestamp] = useState<string | null>(() => {
    return new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  });
  const [isContentMinimized, setIsContentMinimized] = useState<boolean>(false);
  const [autoSaveEnabled, setAutoSaveEnabled] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem('tj_fare_engine_autosave');
      if (stored !== null) return stored === 'true';
      return true; // Default to ON so user edits are saved automatically
    } catch {
      return true;
    }
  });

  // Modals & Confirmations
  const [showConfirmSaveModal, setShowConfirmSaveModal] = useState(false);
  const [showResetConfirmModal, setShowResetConfirmModal] = useState(false);
  const [showDiscountModal, setShowDiscountModal] = useState(false);
  const [showUnsavedPromptModal, setShowUnsavedPromptModal] = useState(false);

  // Discount modal state
  const [discountTargetService, setDiscountTargetService] = useState<ServiceTypeCategory | 'ALL'>('LOCAL');
  const [discountTargetVehicle, setDiscountTargetVehicle] = useState<FareVehicleId | 'ALL'>('ALL');
  const [discountType, setDiscountType] = useState<DiscountType>('PERCENTAGE');
  const [discountValue, setDiscountValue] = useState<number>(10);

  // Fare History State
  const [historyList, setHistoryList] = useState<FareHistoryEntry[]>(() =>
    fareService.getFareHistorySync()
  );

  // Preview Fare Tester State
  const [previewService, setPreviewService] = useState<ServiceTypeCategory>('LOCAL');
  const [previewVehicle, setPreviewVehicle] = useState<FareVehicleId>('sedan-4-1');
  const [previewFrom, setPreviewFrom] = useState('Mysore Palace');
  const [previewTo, setPreviewTo] = useState('Bangalore Airport (BLR)');
  const [previewDistanceKm, setPreviewDistanceKm] = useState<number>(185);
  const [previewHours, setPreviewHours] = useState<number>(8);
  const [previewDays, setPreviewDays] = useState<number>(2);

  // Load authoritative config on mount
  useEffect(() => {
    let isMounted = true;
    fareService.getCentralizedConfig().then((loaded) => {
      if (isMounted && loaded) {
        setConfig((curr) => {
          // If current state has already been modified by user since mount, keep their edits
          const isCurrBaseline = JSON.stringify(curr) === JSON.stringify(savedBaseline);
          return isCurrBaseline ? loaded : curr;
        });
        setSavedBaseline(JSON.parse(JSON.stringify(loaded)));
      }
    });
    setHistoryList(fareService.getFareHistorySync());
    return () => {
      isMounted = false;
    };
  }, []);

  // Detect unsaved changes
  const hasChanges = useMemo(() => {
    return JSON.stringify(config) !== JSON.stringify(savedBaseline);
  }, [config, savedBaseline]);

  // Changed items count / diff for confirmation dialog
  const changesSummary = useMemo(() => {
    const diffs: string[] = [];
    FARE_VEHICLES_META.forEach((vm) => {
      const vid = vm.id;
      // Local
      if (JSON.stringify(config.local[vid]) !== JSON.stringify(savedBaseline.local[vid])) {
        diffs.push(`Local — ${vm.name}`);
      }
      // One Way
      if (JSON.stringify(config.oneWay[vid]) !== JSON.stringify(savedBaseline.oneWay[vid])) {
        diffs.push(`One Way — ${vm.name}`);
      }
      // Round Trip
      if (JSON.stringify(config.roundTrip[vid]) !== JSON.stringify(savedBaseline.roundTrip[vid])) {
        diffs.push(`Round Trip — ${vm.name}`);
      }
      // Airport
      if (JSON.stringify(config.airport[vid]) !== JSON.stringify(savedBaseline.airport[vid])) {
        diffs.push(`Airport — ${vm.name}`);
      }
      // Inter-State One-Way
      if (
        config.interStateOneWay?.[vid] &&
        savedBaseline.interStateOneWay?.[vid] &&
        JSON.stringify(config.interStateOneWay[vid]) !== JSON.stringify(savedBaseline.interStateOneWay[vid])
      ) {
        diffs.push(`Inter-State — ${vm.name}`);
      }
    });

    if (
      JSON.stringify(config.fixedCorridors) !==
      JSON.stringify(savedBaseline.fixedCorridors)
    ) {
      diffs.push('One-Way Fixed Corridor Prices');
    }

    return diffs;
  }, [config, savedBaseline]);

  // Validation function
  const validateConfig = (target: CentralizedFareConfig = config): boolean => {
    setErrorMessage(null);
    for (const vm of FARE_VEHICLES_META) {
      const vid = vm.id;
      const l = target.local[vid];
      const ow = target.oneWay[vid];
      const rt = target.roundTrip[vid];
      const ap = target.airport[vid];
      const isOw = target.interStateOneWay?.[vid];

      if (!l || !ow || !rt || !ap) {
        setErrorMessage(`Missing configuration for ${vm.name}`);
        return false;
      }

      if (l.baseFare < 0 || l.perKmRate < 0 || l.perHourRate < 0 || l.driverAllowance < 0) {
        setErrorMessage(`Local rates for ${vm.name} cannot be negative.`);
        return false;
      }
      if (ow.baseFare < 0 || ow.perKmRate < 0 || ow.driverAllowance < 0) {
        setErrorMessage(`One-Way rates for ${vm.name} cannot be negative.`);
        return false;
      }
      if (rt.perKmRate < 0 || rt.driverAllowance < 0 || rt.dailyMinimumKm < 0) {
        setErrorMessage(`Round-Trip rates for ${vm.name} cannot be negative.`);
        return false;
      }
      if (ap.baseFare < 0 || ap.perKmRate < 0 || ap.driverAllowance < 0) {
        setErrorMessage(`Airport rates for ${vm.name} cannot be negative.`);
        return false;
      }
      if (isOw && (isOw.baseFare < 0 || isOw.perKmRate < 0 || isOw.driverAllowance < 0)) {
        setErrorMessage(`Inter-State One-Way rates for ${vm.name} cannot be negative.`);
        return false;
      }
    }
    return true;
  };

  // Field change handlers with safe number sanitization
  const handleLocalFieldChange = (
    vid: FareVehicleId,
    field: keyof LocalPricing,
    value: number | DiscountType
  ) => {
    const sanitized = typeof value === 'number' ? (isNaN(value) ? 0 : Math.max(0, value)) : value;
    setConfig((prev) => ({
      ...prev,
      local: {
        ...prev.local,
        [vid]: {
          ...prev.local[vid],
          [field]: sanitized,
        },
      },
    }));
  };

  const handleOneWayFieldChange = (
    vid: FareVehicleId,
    field: keyof OneWayPricing,
    value: number | DiscountType
  ) => {
    const sanitized = typeof value === 'number' ? (isNaN(value) ? 0 : Math.max(0, value)) : value;
    setConfig((prev) => ({
      ...prev,
      oneWay: {
        ...prev.oneWay,
        [vid]: {
          ...prev.oneWay[vid],
          [field]: sanitized,
        },
      },
    }));
  };

  const handleRoundTripFieldChange = (
    vid: FareVehicleId,
    field: keyof RoundTripPricing,
    value: number | DiscountType
  ) => {
    const sanitized = typeof value === 'number' ? (isNaN(value) ? 0 : Math.max(0, value)) : value;
    setConfig((prev) => ({
      ...prev,
      roundTrip: {
        ...prev.roundTrip,
        [vid]: {
          ...prev.roundTrip[vid],
          [field]: sanitized,
        },
      },
    }));
  };

  const handleAirportFieldChange = (
    vid: FareVehicleId,
    field: keyof AirportPricing,
    value: number | DiscountType
  ) => {
    const sanitized = typeof value === 'number' ? (isNaN(value) ? 0 : Math.max(0, value)) : value;
    setConfig((prev) => ({
      ...prev,
      airport: {
        ...prev.airport,
        [vid]: {
          ...prev.airport[vid],
          [field]: sanitized,
        },
      },
    }));
  };

  const handleInterStateFieldChange = (
    vid: FareVehicleId,
    field: keyof InterStateOneWayPricing,
    value: number | boolean | DiscountType
  ) => {
    let sanitized = value;
    if (typeof value === 'number') {
      sanitized = isNaN(value) ? 0 : Math.max(0, value);
    }
    setConfig((prev) => {
      const currentVehiclePricing =
        prev.interStateOneWay?.[vid] ||
        DEFAULT_CENTRALIZED_FARE_CONFIG.interStateOneWay[vid] ||
        DEFAULT_CENTRALIZED_FARE_CONFIG.interStateOneWay['sedan-4-1'];
      return {
        ...prev,
        interStateOneWay: {
          ...prev.interStateOneWay,
          [vid]: {
            ...currentVehiclePricing,
            [field]: sanitized,
          },
        },
      };
    });
  };

  const handleCorridorFieldChange = (
    corridorId: OneWayCorridorId,
    field: string,
    value: any
  ) => {
    setConfig((prev) => {
      const fixedCorridors = prev.fixedCorridors
        ? { ...prev.fixedCorridors }
        : { ...DEFAULT_ONE_WAY_FIXED_CORRIDORS };
      const currentCorridor = fixedCorridors[corridorId] || DEFAULT_ONE_WAY_FIXED_CORRIDORS[corridorId];
      fixedCorridors[corridorId] = {
        ...currentCorridor,
        [field]: value,
      };
      return {
        ...prev,
        fixedCorridors,
      };
    });
  };

  const handleCorridorRateChange = (
    corridorId: OneWayCorridorId,
    vehicleId: string,
    price: number
  ) => {
    const sanitized = isNaN(price) ? 0 : Math.max(0, price);
    setConfig((prev) => {
      const fixedCorridors = prev.fixedCorridors
        ? { ...prev.fixedCorridors }
        : { ...DEFAULT_ONE_WAY_FIXED_CORRIDORS };
      const currentCorridor = fixedCorridors[corridorId] || DEFAULT_ONE_WAY_FIXED_CORRIDORS[corridorId];
      fixedCorridors[corridorId] = {
        ...currentCorridor,
        rates: {
          ...currentCorridor.rates,
          [vehicleId]: sanitized,
        },
      };
      return {
        ...prev,
        fixedCorridors,
      };
    });
  };

  // Save Action - Saves and updates instantly across the entire application
  const handleExecuteSave = async (overrideConfig?: CentralizedFareConfig, isAuto = false) => {
    const targetConfig = overrideConfig || config;
    if (!validateConfig(targetConfig)) return;
    setIsSaving(true);
    setErrorMessage(null);
    try {
      const saved = await fareService.saveCentralizedConfig(targetConfig, 'Owner / Admin');
      setConfig(saved);
      setSavedBaseline(JSON.parse(JSON.stringify(saved)));
      setHistoryList(fareService.getFareHistorySync());
      setShowConfirmSaveModal(false);
      setShowUnsavedPromptModal(false);
      const timeStr = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      setLastSavedTimestamp(timeStr);
      setSaveSuccessMsg(
        isAuto
          ? `Auto-saved: Prices saved successfully and updated across all booking forms. (${timeStr})`
          : 'Prices saved successfully and updated across all booking forms.'
      );
      setTimeout(() => setSaveSuccessMsg(null), 4500);
      if (onFareSaved) {
        onFareSaved(saved);
      }
    } catch (e: any) {
      setErrorMessage(
        'Price update failed. Your previous prices are still active. Please try again.'
      );
    } finally {
      setIsSaving(false);
    }
  };

  // Close handler with unsaved changes protection
  const handleRequestClose = () => {
    if (hasChanges) {
      setShowUnsavedPromptModal(true);
    } else if (onClose) {
      onClose();
    }
  };

  // Auto-Save Effect: when autoSaveEnabled is true, debounces 750ms and saves automatically
  useEffect(() => {
    if (!autoSaveEnabled || !hasChanges || isSaving) return;
    const timer = setTimeout(() => {
      handleExecuteSave(config, true);
    }, 750);
    return () => clearTimeout(timer);
  }, [config, autoSaveEnabled, hasChanges, isSaving]);

  // Reset Action
  const handleExecuteReset = async () => {
    setIsSaving(true);
    setErrorMessage(null);
    try {
      const reset = await fareService.resetCentralizedConfig('Owner / Admin');
      setConfig(reset);
      setSavedBaseline(JSON.parse(JSON.stringify(reset)));
      setHistoryList(fareService.getFareHistorySync());
      setShowResetConfirmModal(false);
      const timeStr = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      setLastSavedTimestamp(timeStr);
      setSaveSuccessMsg('Fare & Price Engine restored to baseline defaults and updated instantly.');
      setTimeout(() => setSaveSuccessMsg(null), 4500);
      if (onFareSaved) {
        onFareSaved(reset);
      }
    } catch (e: any) {
      setErrorMessage(e?.message || 'Failed to reset configuration.');
    } finally {
      setIsSaving(false);
    }
  };

  // Toggle Auto-Save
  const handleToggleAutoSave = () => {
    const next = !autoSaveEnabled;
    setAutoSaveEnabled(next);
    try {
      localStorage.setItem('tj_fare_engine_autosave', String(next));
    } catch {
      // ignore
    }
  };

  // Discard Unsaved Changes
  const handleCancelChanges = () => {
    setConfig(JSON.parse(JSON.stringify(savedBaseline)));
    setErrorMessage(null);
  };

  // Apply Discount - Applies and saves instantly
  const handleApplyDiscount = () => {
    const updated = JSON.parse(JSON.stringify(config)) as CentralizedFareConfig;
    const vids: FareVehicleId[] =
      discountTargetVehicle === 'ALL'
        ? (['sedan-4-1', 'suv-6-1', 'innova', 'innova-crysta', 'tempo-traveller-12-1'] as FareVehicleId[])
        : [discountTargetVehicle];

    vids.forEach((vid) => {
      if (discountTargetService === 'ALL' || discountTargetService === 'LOCAL') {
        if (updated.local[vid]) {
          updated.local[vid].discountType = discountType;
          updated.local[vid].discountValue = Math.max(0, discountValue);
        }
      }
      if (discountTargetService === 'ALL' || discountTargetService === 'ONE_WAY') {
        if (updated.oneWay[vid]) {
          updated.oneWay[vid].discountType = discountType;
          updated.oneWay[vid].discountValue = Math.max(0, discountValue);
        }
      }
      if (discountTargetService === 'ALL' || discountTargetService === 'ROUND_TRIP') {
        if (updated.roundTrip[vid]) {
          updated.roundTrip[vid].discountType = discountType;
          updated.roundTrip[vid].discountValue = Math.max(0, discountValue);
        }
      }
      if (discountTargetService === 'ALL' || discountTargetService === 'AIRPORT') {
        if (updated.airport[vid]) {
          updated.airport[vid].discountType = discountType;
          updated.airport[vid].discountValue = Math.max(0, discountValue);
        }
      }
      if (discountTargetService === 'ALL' || discountTargetService === 'INTER_STATE_ONE_WAY') {
        if (updated.interStateOneWay?.[vid]) {
          updated.interStateOneWay[vid].discountType = discountType;
          updated.interStateOneWay[vid].discountValue = Math.max(0, discountValue);
        }
      }
    });

    setConfig(updated);
    setShowDiscountModal(false);
    // Instantly save and apply to entire application
    handleExecuteSave(updated);
  };

  // Preview Result Calculation using active working config
  const previewResult: FareCalculationResult = useMemo(() => {
    return calculateMasterFare({
      config,
      serviceType: previewService,
      vehicleId: previewVehicle,
      distanceKm: previewDistanceKm,
      durationHours: previewHours,
      roundTripDays: previewDays,
      fromState: 'Karnataka',
      toState: 'Tamil Nadu',
    });
  }, [config, previewService, previewVehicle, previewDistanceKm, previewHours, previewDays]);

  const activeVehicleMeta = FARE_VEHICLES_META.find((v) => v.id === selectedVehicleId) || FARE_VEHICLES_META[0];

  return (
    <div className="flex flex-col h-full bg-slate-50 text-slate-900">
      {/* Top Header Bar */}
      <div className="bg-white border-b border-slate-200 px-3 sm:px-4 py-2 flex flex-wrap items-center justify-between gap-2 shrink-0 shadow-2xs">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-emerald-700 text-white flex items-center justify-center shadow-xs shrink-0">
            <Calculator className="w-4 h-4 text-emerald-100" />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-xs sm:text-sm font-black text-slate-900 tracking-tight uppercase">
              FARE & PRICE ENGINE
            </h2>
            <span className="text-[9px] font-extrabold uppercase bg-emerald-100 text-emerald-900 border border-emerald-300 px-1.5 py-0.5 rounded leading-none">
              Single Source of Truth
            </span>
            <span className="text-[10px] font-bold text-slate-700 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded font-mono">
              Version: {config.versionCode || `2026-09-23-00${config.version || 1}`}
            </span>
            <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-300 px-1.5 py-0.5 rounded">
              Status: {config.status || 'ACTIVE'}
            </span>
            <span className="text-[10px] text-slate-500 hidden lg:inline">
              Last Updated: {config.lastUpdatedFormatted || (config.updatedAt ? new Date(config.updatedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Live')}
            </span>
          </div>
        </div>

        {/* Global Action Buttons */}
        <div className="flex flex-wrap items-center gap-1.5">
          {/* Auto-Save Toggle */}
          <button
            id="engine-autosave-toggle-btn"
            type="button"
            onClick={handleToggleAutoSave}
            className={`flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold transition-all cursor-pointer border ${
              autoSaveEnabled
                ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100 shadow-2xs'
                : 'bg-slate-100 text-slate-600 border-slate-300 hover:bg-slate-200'
            }`}
            title={autoSaveEnabled ? 'Auto-Save is ON: Changes save and update instantly' : 'Auto-Save is OFF: Click Save to update instantly'}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${autoSaveEnabled ? 'bg-emerald-600 animate-ping' : 'bg-slate-400'}`} />
            <span>Auto-Save: {autoSaveEnabled ? 'ON' : 'OFF'}</span>
          </button>

          {/* Add Discount Button */}
          <button
            id="engine-add-discount-btn"
            type="button"
            onClick={() => setShowDiscountModal(true)}
            className="flex items-center gap-1 px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-md font-bold text-[10px] shadow-2xs transition-colors cursor-pointer"
          >
            <Tag className="w-3 h-3 text-amber-700" />
            <span>DISCOUNT</span>
          </button>

          {/* Reset Button */}
          <button
            id="engine-reset-btn"
            type="button"
            onClick={() => setShowResetConfirmModal(true)}
            className="flex items-center gap-1 px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded-md font-bold text-[10px] transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3 h-3 text-slate-600" />
            <span>RESET</span>
          </button>

          {/* Cancel Unsaved Changes Button */}
          {hasChanges && (
            <button
              id="engine-cancel-btn"
              type="button"
              onClick={handleCancelChanges}
              className="flex items-center gap-1 px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300 rounded-md font-bold text-[10px] transition-colors cursor-pointer"
            >
              <X className="w-3 h-3 text-rose-600" />
              <span>CANCEL</span>
            </button>
          )}

          {/* Save Fare & Price Button - Authoritative persistence across website */}
          <button
            id="engine-save-btn"
            type="button"
            disabled={isSaving}
            onClick={() => handleExecuteSave()}
            className={`flex items-center gap-1.5 px-3.5 py-1 rounded-lg font-extrabold text-xs shadow-xs transition-all cursor-pointer ${
              hasChanges
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white ring-2 ring-emerald-400/50 animate-pulse'
                : isSaving
                ? 'bg-emerald-600 text-white cursor-wait'
                : 'bg-emerald-700 hover:bg-emerald-800 text-white'
            }`}
            title={
              hasChanges
                ? `Click to save ${changesSummary.length} modified rates and update all customer booking forms`
                : 'Prices are synchronized. Click to re-save at any time.'
            }
          >
            {isSaving ? (
              <>
                <RotateCcw className="w-3.5 h-3.5 animate-spin text-white" />
                <span>SAVING...</span>
              </>
            ) : hasChanges ? (
              <>
                <Save className="w-3.5 h-3.5 text-white" />
                <span>SAVE ({changesSummary.length})</span>
              </>
            ) : (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-200" />
                <span>SAVE</span>
              </>
            )}
          </button>

          {onMinimize && (
            <button
              id="engine-minimize-btn"
              type="button"
              onClick={onMinimize}
              className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
              title="Minimize to floating widget"
            >
              <Minimize2 className="w-3.5 h-3.5" />
            </button>
          )}

          {onClose && (
            <button
              id="engine-close-btn"
              type="button"
              onClick={handleRequestClose}
              className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors cursor-pointer ml-0.5"
              title="Close Panel"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Save Confirmation Banner with Synchronized Checkmarks */}
      {saveSuccessMsg && (
        <div className="bg-emerald-900 text-white px-3 sm:px-4 py-2.5 border-b border-emerald-700 shadow-xs shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0" />
              <span className="font-extrabold text-xs sm:text-sm text-emerald-100">
                {saveSuccessMsg}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-[11px] font-bold text-emerald-200">
              <span className="flex items-center gap-1 bg-emerald-800/90 px-2 py-0.5 rounded border border-emerald-600/70">
                <Check className="w-3 h-3 text-emerald-300" /> Price Saved Successfully
              </span>
              <span className="flex items-center gap-1 bg-emerald-800/90 px-2 py-0.5 rounded border border-emerald-600/70">
                <Check className="w-3 h-3 text-emerald-300" /> Active Pricing Updated
              </span>
              <span className="flex items-center gap-1 bg-emerald-800/90 px-2 py-0.5 rounded border border-emerald-600/70">
                <Check className="w-3 h-3 text-emerald-300" /> Booking Forms Synchronized
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3 text-right shrink-0">
            <div className="text-[11px] text-emerald-200 leading-tight">
              <div>Version: <strong className="text-white font-mono">{config.versionCode || `2026-09-23-00${config.version || 1}`}</strong></div>
              <div>Last Updated: <strong className="text-white">{config.lastUpdatedFormatted || lastSavedTimestamp || 'Just now'}</strong></div>
            </div>
            <button
              type="button"
              onClick={() => setSaveSuccessMsg(null)}
              className="text-emerald-300 hover:text-white p-1 rounded hover:bg-emerald-800/60 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {errorMessage && (
        <div className="bg-rose-700 text-white px-3 sm:px-4 py-2 border-b border-rose-800 flex items-center justify-between text-xs font-bold shadow-xs shrink-0 animate-in fade-in">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-200 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            className="text-rose-200 hover:text-white p-1 rounded hover:bg-rose-800/60 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Section Navigation Bar */}
      <div className="bg-white border-b border-slate-200 px-3 sm:px-4 py-1 flex flex-wrap items-center justify-between gap-1.5 shrink-0">
        <div className="flex items-center gap-1 overflow-x-auto py-0.5">
          <button
            id="tab-service-local"
            type="button"
            onClick={() => setActiveSection('LOCAL')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeSection === 'LOCAL'
                ? 'bg-emerald-800 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Clock className="w-3 h-3" />
            <span>LOCAL</span>
          </button>

          <button
            id="tab-service-oneway"
            type="button"
            onClick={() => setActiveSection('ONE_WAY')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeSection === 'ONE_WAY'
                ? 'bg-emerald-700 text-white shadow-md ring-2 ring-emerald-500/50'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <ArrowRight className="w-3.5 h-3.5" />
            <span>ONE WAY</span>
            <span
              className={`text-[9px] px-1.5 py-0.5 rounded font-black tracking-wide uppercase transition-colors ${
                activeSection === 'ONE_WAY'
                  ? 'bg-emerald-950/40 text-emerald-200'
                  : 'bg-emerald-100 text-emerald-800'
              }`}
            >
              Min KM
            </span>
          </button>

          <button
            id="tab-service-roundtrip"
            type="button"
            onClick={() => setActiveSection('ROUND_TRIP')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeSection === 'ROUND_TRIP'
                ? 'bg-emerald-800 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Compass className="w-3 h-3" />
            <span>ROUND TRIP</span>
          </button>

          <button
            id="tab-service-airport"
            type="button"
            onClick={() => setActiveSection('AIRPORT')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeSection === 'AIRPORT'
                ? 'bg-emerald-800 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Plane className="w-3 h-3" />
            <span>AIRPORT</span>
          </button>

          <button
            id="tab-service-interstate-oneway"
            type="button"
            onClick={() => setActiveSection('INTER_STATE_ONE_WAY')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeSection === 'INTER_STATE_ONE_WAY'
                ? 'bg-amber-800 text-white shadow-xs ring-1 ring-amber-700'
                : 'text-amber-950 bg-amber-50/80 border border-amber-300 hover:bg-amber-100'
            }`}
          >
            <MapPin className="w-3 h-3 text-amber-700" />
            <span>INTER-STATE ONE-WAY</span>
          </button>

          <div className="h-4 w-px bg-slate-200 mx-1" />

          {/* Fare History Tab */}
          <button
            id="tab-service-history"
            type="button"
            onClick={() => setActiveSection('HISTORY')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeSection === 'HISTORY'
                ? 'bg-slate-800 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <History className="w-3 h-3" />
            <span>FARE HISTORY</span>
            {historyList.length > 0 && (
              <span className="text-[9px] px-1 py-0.2 bg-slate-200 text-slate-800 rounded-full font-bold">
                {historyList.length}
              </span>
            )}
          </button>
        </div>

        {hasChanges ? (
          <button
            type="button"
            onClick={() => setShowConfirmSaveModal(true)}
            className="flex items-center gap-1 text-[11px] text-amber-900 font-bold bg-amber-50 hover:bg-amber-100 px-2 py-0.5 rounded-md border border-amber-300 transition-colors cursor-pointer"
            title="Click to review detailed changes before saving"
          >
            <Sparkles className="w-3 h-3 text-amber-600" />
            <span>Unsaved ({changesSummary.length}) · Review</span>
          </button>
        ) : lastSavedTimestamp ? (
          <div className="flex items-center gap-1 text-[10px] text-emerald-800 font-semibold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
            <Check className="w-3 h-3 text-emerald-600" />
            <span>Live ({lastSavedTimestamp})</span>
          </div>
        ) : null}
      </div>

      {/* Vehicle Category Selector (Active for pricing tabs) */}
      {activeSection !== 'PREVIEW' && activeSection !== 'HISTORY' && (
        <div className="bg-slate-100/90 border-b border-slate-200 px-3 sm:px-4 py-1 shrink-0 overflow-x-auto">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider shrink-0 mr-1">
              Vehicle:
            </span>
            {FARE_VEHICLES_META.map((vm) => {
              const isSelected = selectedVehicleId === vm.id;
              return (
                <button
                  key={vm.id}
                  id={`vehicle-tab-${vm.id}`}
                  type="button"
                  onClick={() => setSelectedVehicleId(vm.id)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer shrink-0 border ${
                    isSelected
                      ? 'bg-white text-emerald-950 border-emerald-600 shadow-2xs ring-1 ring-emerald-500'
                      : 'bg-white/60 text-slate-600 border-slate-200 hover:bg-white hover:text-slate-900'
                  }`}
                >
                  <Car className={`w-3 h-3 ${isSelected ? 'text-emerald-700' : 'text-slate-400'}`} />
                  <span>{vm.name}</span>
                  <span className="text-[9px] font-normal opacity-75">({vm.seats})</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div
        className={`flex-1 overflow-y-auto transition-all duration-300 ${
          isContentMinimized ? 'max-h-0 p-0 overflow-hidden opacity-0' : 'p-4 sm:p-6'
        }`}
      >
        {/* ======================================================== */}
        {/* 1. LOCAL PRICING SECTION */}
        {/* ======================================================== */}
        {activeSection === 'LOCAL' && (
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">
                      Local Pricing — {activeVehicleMeta.name}
                    </h3>
                    <p className="text-xs text-slate-500">
                      Standard hourly and kilometer charges with extra rates for local Mysore city rides
                    </p>
                  </div>
                </div>
                <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-blue-50 text-blue-800 border border-blue-200">
                  {activeVehicleMeta.models}
                </span>
              </div>

              {/* Editable Fields Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Base Fare */}
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Base Fare (₹)
                  </label>
                  <input
                    id="local-base-fare-input"
                    type="number"
                    min="0"
                    step="10"
                    value={config.local[selectedVehicleId]?.baseFare ?? 500}
                    onChange={(e) =>
                      handleLocalFieldChange(selectedVehicleId, 'baseFare', Number(e.target.value))
                    }
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">Starting package fare</p>
                </div>

                {/* Driver Allowance */}
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Driver Allowance (₹)
                  </label>
                  <input
                    id="local-driver-allowance-input"
                    type="number"
                    min="0"
                    step="50"
                    value={config.local[selectedVehicleId]?.driverAllowance ?? 300}
                    onChange={(e) =>
                      handleLocalFieldChange(
                        selectedVehicleId,
                        'driverAllowance',
                        Number(e.target.value)
                      )
                    }
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">Daily driver bata allowance</p>
                </div>

                {/* Per KM Rate */}
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Per KM Rate (₹/km)
                  </label>
                  <input
                    id="local-per-km-rate-input"
                    type="number"
                    min="0"
                    step="0.5"
                    value={config.local[selectedVehicleId]?.perKmRate ?? 14}
                    onChange={(e) =>
                      handleLocalFieldChange(selectedVehicleId, 'perKmRate', Number(e.target.value))
                    }
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">Standard rate per kilometer</p>
                </div>

                {/* Per Hour Rate */}
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Per Hour Rate (₹/hr)
                  </label>
                  <input
                    id="local-per-hour-rate-input"
                    type="number"
                    min="0"
                    step="10"
                    value={config.local[selectedVehicleId]?.perHourRate ?? 250}
                    onChange={(e) =>
                      handleLocalFieldChange(selectedVehicleId, 'perHourRate', Number(e.target.value))
                    }
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">Standard hourly package rate</p>
                </div>

                {/* Extra Per KM Rate */}
                <div className="bg-amber-50/60 p-3.5 rounded-xl border border-amber-200/80">
                  <label className="block text-xs font-bold text-amber-900 mb-1">
                    Extra Per KM Rate (₹/km)
                  </label>
                  <input
                    id="local-extra-per-km-input"
                    type="number"
                    min="0"
                    step="0.5"
                    value={config.local[selectedVehicleId]?.extraPerKmRate ?? 13}
                    onChange={(e) =>
                      handleLocalFieldChange(
                        selectedVehicleId,
                        'extraPerKmRate',
                        Number(e.target.value)
                      )
                    }
                    className="w-full px-3 py-2 bg-white border border-amber-300 rounded-lg text-sm font-bold text-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                  <p className="text-[11px] text-amber-800 mt-1">Applicable extra kilometer rate</p>
                </div>

                {/* Extra Per Hour Rate */}
                <div className="bg-amber-50/60 p-3.5 rounded-xl border border-amber-200/80">
                  <label className="block text-xs font-bold text-amber-900 mb-1">
                    Extra Per Hour Rate (₹/hr)
                  </label>
                  <input
                    id="local-extra-per-hour-input"
                    type="number"
                    min="0"
                    step="10"
                    value={config.local[selectedVehicleId]?.extraPerHourRate ?? 150}
                    onChange={(e) =>
                      handleLocalFieldChange(
                        selectedVehicleId,
                        'extraPerHourRate',
                        Number(e.target.value)
                      )
                    }
                    className="w-full px-3 py-2 bg-white border border-amber-300 rounded-lg text-sm font-bold text-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                  <p className="text-[11px] text-amber-800 mt-1">Applicable extra hourly rate</p>
                </div>

                {/* Discount */}
                <div className="bg-emerald-50/60 p-3.5 rounded-xl border border-emerald-200/80">
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-emerald-900">Discount</label>
                    <select
                      value={config.local[selectedVehicleId]?.discountType || 'NONE'}
                      onChange={(e) =>
                        handleLocalFieldChange(
                          selectedVehicleId,
                          'discountType',
                          e.target.value as DiscountType
                        )
                      }
                      className="text-[11px] font-bold bg-white border border-emerald-300 rounded px-1.5 py-0.5"
                    >
                      <option value="NONE">No Discount</option>
                      <option value="PERCENTAGE">Percent (%)</option>
                      <option value="FIXED">Fixed (₹)</option>
                    </select>
                  </div>
                  <input
                    id="local-discount-value-input"
                    type="number"
                    min="0"
                    step="1"
                    disabled={config.local[selectedVehicleId]?.discountType === 'NONE'}
                    value={config.local[selectedVehicleId]?.discountValue ?? 0}
                    onChange={(e) =>
                      handleLocalFieldChange(
                        selectedVehicleId,
                        'discountValue',
                        Number(e.target.value)
                      )
                    }
                    className="w-full px-3 py-2 bg-white border border-emerald-300 rounded-lg text-sm font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none disabled:bg-slate-100 disabled:text-slate-400"
                  />
                  <p className="text-[11px] text-emerald-800 mt-1">Deducted from local total</p>
                </div>
              </div>

              {/* Calculation Formula Display */}
              <div className="mt-5 p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 leading-relaxed font-mono">
                <span className="font-bold text-slate-800 font-sans">Formula: </span>
                LOCAL TOTAL = Base Fare + Driver Allowance + KM Charge + Hour Charge + Extra KM Charge + Extra Hour Charge - Discount
              </div>

              {/* Dedicated In-Card Save Bar */}
              <div className="mt-4 pt-3.5 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2.5 bg-slate-50/80 p-3 rounded-xl border">
                <div className="flex items-center gap-2">
                  {hasChanges ? (
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-900 bg-amber-100 border border-amber-300 px-2.5 py-1 rounded-lg">
                      <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                      Unsaved rates pending save
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-900 bg-emerald-100 border border-emerald-300 px-2.5 py-1 rounded-lg">
                      <Check className="w-3.5 h-3.5 text-emerald-700" />
                      {activeVehicleMeta.name} Local rates are live
                    </span>
                  )}
                  <span className="text-[11px] text-slate-500 hidden sm:inline">
                    {autoSaveEnabled ? '· Auto-Save ON' : '· Click to save'}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {hasChanges && (
                    <button
                      type="button"
                      onClick={handleCancelChanges}
                      className="px-3 py-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-200/70 rounded-lg transition-colors cursor-pointer"
                    >
                      Discard
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleExecuteSave()}
                    disabled={isSaving}
                    className="flex items-center gap-1.5 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 active:scale-95 text-white rounded-lg text-xs font-bold shadow-xs transition-all cursor-pointer"
                  >
                    {isSaving ? (
                      <>
                        <RotateCcw className="w-3.5 h-3.5 animate-spin" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-3.5 h-3.5" />
                        <span>Save {activeVehicleMeta.name} Rates Live</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* 2. ONE-WAY PRICING SECTION */}
        {/* ======================================================== */}
        {activeSection === 'ONE_WAY' && (
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
                    <ArrowRight className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">
                      One-Way Pricing — {activeVehicleMeta.name}
                    </h3>
                    <p className="text-xs text-slate-500">
                      Google Maps route distance calculation for point-to-point drop taxi
                    </p>
                  </div>
                </div>
                <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200">
                  {activeVehicleMeta.models}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Base Fare */}
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Base Fare (₹)
                  </label>
                  <input
                    id="oneway-base-fare-input"
                    type="number"
                    min="0"
                    step="50"
                    value={config.oneWay[selectedVehicleId]?.baseFare ?? 500}
                    onChange={(e) =>
                      handleOneWayFieldChange(selectedVehicleId, 'baseFare', Number(e.target.value))
                    }
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">Starting trip fee</p>
                </div>

                {/* Driver Allowance */}
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Driver Allowance (₹)
                  </label>
                  <input
                    id="oneway-driver-allowance-input"
                    type="number"
                    min="0"
                    step="50"
                    value={config.oneWay[selectedVehicleId]?.driverAllowance ?? 300}
                    onChange={(e) =>
                      handleOneWayFieldChange(
                        selectedVehicleId,
                        'driverAllowance',
                        Number(e.target.value)
                      )
                    }
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">Chauffeur allowance</p>
                </div>

                {/* Per KM Rate */}
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Per KM Rate (₹/km)
                  </label>
                  <input
                    id="oneway-per-km-rate-input"
                    type="number"
                    min="0"
                    step="0.5"
                    value={config.oneWay[selectedVehicleId]?.perKmRate ?? 14}
                    onChange={(e) =>
                      handleOneWayFieldChange(selectedVehicleId, 'perKmRate', Number(e.target.value))
                    }
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">Applied to route distance</p>
                </div>

                {/* Extra Per KM Rate */}
                <div className="bg-amber-50/60 p-3.5 rounded-xl border border-amber-200/80">
                  <label className="block text-xs font-bold text-amber-900 mb-1">
                    Extra Per KM Rate (₹/km)
                  </label>
                  <input
                    id="oneway-extra-per-km-input"
                    type="number"
                    min="0"
                    step="0.5"
                    value={config.oneWay[selectedVehicleId]?.extraPerKmRate ?? 13}
                    onChange={(e) =>
                      handleOneWayFieldChange(
                        selectedVehicleId,
                        'extraPerKmRate',
                        Number(e.target.value)
                      )
                    }
                    className="w-full px-3 py-2 bg-white border border-amber-300 rounded-lg text-sm font-bold text-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                  <p className="text-[11px] text-amber-800 mt-1">Applicable if threshold exceeded</p>
                </div>

                {/* Discount */}
                <div className="bg-emerald-50/60 p-3.5 rounded-xl border border-emerald-200/80">
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-emerald-900">Discount</label>
                    <select
                      value={config.oneWay[selectedVehicleId]?.discountType || 'NONE'}
                      onChange={(e) =>
                        handleOneWayFieldChange(
                          selectedVehicleId,
                          'discountType',
                          e.target.value as DiscountType
                        )
                      }
                      className="text-[11px] font-bold bg-white border border-emerald-300 rounded px-1.5 py-0.5"
                    >
                      <option value="NONE">No Discount</option>
                      <option value="PERCENTAGE">Percent (%)</option>
                      <option value="FIXED">Fixed (₹)</option>
                    </select>
                  </div>
                  <input
                    id="oneway-discount-value-input"
                    type="number"
                    min="0"
                    step="1"
                    disabled={config.oneWay[selectedVehicleId]?.discountType === 'NONE'}
                    value={config.oneWay[selectedVehicleId]?.discountValue ?? 0}
                    onChange={(e) =>
                      handleOneWayFieldChange(
                        selectedVehicleId,
                        'discountValue',
                        Number(e.target.value)
                      )
                    }
                    className="w-full px-3 py-2 bg-white border border-emerald-300 rounded-lg text-sm font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none disabled:bg-slate-100 disabled:text-slate-400"
                  />
                  <p className="text-[11px] text-emerald-800 mt-1">Deducted from one-way total</p>
                </div>

                {/* Minimum Billable KM (EXCLUSIVELY IN ONE WAY) */}
                <div className="bg-sky-50/70 p-3.5 rounded-xl border border-sky-200 sm:col-span-2 lg:col-span-3">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-2 pb-2 border-b border-sky-200/60">
                    <div className="flex items-center gap-2">
                      <label className="text-xs font-bold text-sky-950 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-sky-500" />
                        <span>Minimum Billable KM (One-Way Outstation Drop)</span>
                      </label>
                      <span className="text-[10px] bg-sky-200 text-sky-900 px-2 py-0.5 rounded-md font-extrabold uppercase">
                        One-Way Only
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        id="oneway-apply-all-min-km-btn"
                        onClick={() => {
                          const currentVal = config.oneWay[selectedVehicleId]?.minBillableKm ?? 0;
                          setConfig((prev) => {
                            const updatedOneWay = { ...prev.oneWay };
                            (Object.keys(updatedOneWay) as FareVehicleId[]).forEach((vKey) => {
                              updatedOneWay[vKey] = {
                                ...updatedOneWay[vKey],
                                minBillableKm: currentVal,
                              };
                            });
                            return { ...prev, oneWay: updatedOneWay };
                          });
                        }}
                        className="text-[11px] font-bold text-sky-700 hover:text-sky-900 bg-sky-100/80 hover:bg-sky-200 px-2.5 py-1 rounded-lg border border-sky-300 transition-colors cursor-pointer"
                        title="Copy this Minimum Billable KM to all vehicle categories for One-Way"
                      >
                        ⚡ Apply {config.oneWay[selectedVehicleId]?.minBillableKm ?? 0} km to All 5 Vehicles
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                    <div className="sm:col-span-4 relative">
                      <label className="block text-[11px] font-semibold text-sky-900 mb-1">
                        Minimum Distance Value:
                      </label>
                      <div className="relative">
                        <input
                          id="oneway-min-billable-km-input"
                          type="number"
                          min="0"
                          step="10"
                          value={config.oneWay[selectedVehicleId]?.minBillableKm ?? 0}
                          onChange={(e) =>
                            handleOneWayFieldChange(
                              selectedVehicleId,
                              'minBillableKm',
                              Number(e.target.value)
                            )
                          }
                          className="w-full pl-3 pr-10 py-2 bg-white border border-sky-300 rounded-lg text-sm font-bold text-slate-900 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                          placeholder="0 (Off)"
                        />
                        <span className="absolute right-3 top-2.5 text-xs font-bold text-sky-700">
                          KM
                        </span>
                      </div>
                    </div>

                    <div className="sm:col-span-8">
                      <label className="block text-[11px] font-semibold text-sky-900 mb-1">
                        Quick Preset Buttons:
                      </label>
                      <div className="flex flex-wrap items-center gap-1.5">
                        {[0, 100, 130, 150, 200, 250, 300].map((presetKm) => {
                          const isCurrent =
                            (config.oneWay[selectedVehicleId]?.minBillableKm ?? 0) === presetKm;
                          return (
                            <button
                              key={presetKm}
                              type="button"
                              id={`oneway-min-km-btn-${presetKm}`}
                              onClick={() =>
                                handleOneWayFieldChange(selectedVehicleId, 'minBillableKm', presetKm)
                              }
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer shadow-xs ${
                                isCurrent
                                  ? 'bg-sky-700 text-white ring-2 ring-sky-400'
                                  : 'bg-white text-sky-900 border border-sky-200 hover:bg-sky-100 hover:border-sky-300'
                              }`}
                            >
                              {presetKm === 0 ? 'Off (0 km)' : `${presetKm} km`}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  <p className="text-[11px] text-sky-900/90 mt-2.5 font-medium leading-normal bg-sky-100/60 p-2 rounded-lg border border-sky-200/50">
                    {(config.oneWay[selectedVehicleId]?.minBillableKm ?? 0) > 0 ? (
                      <span>
                        <strong className="text-sky-950 font-bold">Rule Active: </strong>
                        Any one-way trip under{' '}
                        <strong className="text-sky-950 underline font-bold">
                          {config.oneWay[selectedVehicleId].minBillableKm} km
                        </strong>{' '}
                        will be billed for the minimum{' '}
                        {config.oneWay[selectedVehicleId].minBillableKm} km distance at{' '}
                        ₹{config.oneWay[selectedVehicleId]?.perKmRate}/km. Trips longer than{' '}
                        {config.oneWay[selectedVehicleId].minBillableKm} km are billed for actual distance.
                      </span>
                    ) : (
                      <span>
                        <strong className="text-sky-950 font-bold">Rule Disabled (0 km): </strong>
                        Fares are billed strictly based on exact Google Maps road distance without any minimum billable distance.
                      </span>
                    )}
                  </p>
                </div>
              </div>

              <div className="mt-5 p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 leading-relaxed font-mono">
                <span className="font-bold text-slate-800 font-sans">Formula: </span>
                ONE-WAY TOTAL = Base Fare + Driver Allowance + (Max(Route Distance, Min Billable KM) * Per KM Rate) + Applicable Extra KM Charges - Discount
              </div>

              {/* Dedicated In-Card Save Bar */}
              <div className="mt-4 pt-3.5 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2.5 bg-slate-50/80 p-3 rounded-xl border">
                <div className="flex items-center gap-2">
                  {hasChanges ? (
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-900 bg-amber-100 border border-amber-300 px-2.5 py-1 rounded-lg">
                      <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                      Unsaved rates pending save
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-900 bg-emerald-100 border border-emerald-300 px-2.5 py-1 rounded-lg">
                      <Check className="w-3.5 h-3.5 text-emerald-700" />
                      {activeVehicleMeta.name} One-Way rates are live
                    </span>
                  )}
                  <span className="text-[11px] text-slate-500 hidden sm:inline">
                    {autoSaveEnabled ? '· Auto-Save ON' : '· Click to save'}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {hasChanges && (
                    <button
                      type="button"
                      onClick={handleCancelChanges}
                      className="px-3 py-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-200/70 rounded-lg transition-colors cursor-pointer"
                    >
                      Discard
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleExecuteSave()}
                    disabled={isSaving}
                    className="flex items-center gap-1.5 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 active:scale-95 text-white rounded-lg text-xs font-bold shadow-xs transition-all cursor-pointer"
                  >
                    {isSaving ? (
                      <>
                        <RotateCcw className="w-3.5 h-3.5 animate-spin" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-3.5 h-3.5" />
                        <span>Save {activeVehicleMeta.name} Rates Live</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* ======================================================== */}
            {/* ONE-WAY → FIXED CORRIDOR PRICES (SECTION 9 ADMIN CONTROL) */}
            {/* ======================================================== */}
            <div className="bg-white rounded-2xl border-2 border-emerald-500/30 p-5 shadow-xs space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-slate-100 gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold shadow-xs">
                    <MapPin className="w-5 h-5 text-emerald-700" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-extrabold text-slate-900 tracking-tight">
                        ONE-WAY → FIXED CORRIDOR PRICES
                      </h3>
                      <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-900 border border-emerald-300 px-2 py-0.5 rounded-full">
                        Strict Isolation
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Guaranteed point-to-point fixed pricing strictly for the 2 configured corridors. Independent from dynamic distance formulas.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
                    2 Dedicated Corridors
                  </span>
                </div>
              </div>

              {/* CORRIDORS LIST */}
              <div className="space-y-6">
                {(['MYSURU_KIA_AIRPORT', 'MYSURU_BENGALURU_CITY'] as OneWayCorridorId[]).map((cId) => {
                  const corridorData = config.fixedCorridors?.[cId] || DEFAULT_ONE_WAY_FIXED_CORRIDORS[cId];
                  const isCorridorActive = corridorData.active !== false;
                  const isBidirectional = corridorData.bidirectional !== false;

                  return (
                    <div
                      key={cId}
                      className={`p-4 sm:p-5 rounded-2xl border transition-all ${
                        isCorridorActive
                          ? 'bg-slate-50/70 border-slate-200'
                          : 'bg-slate-100/60 border-slate-300 opacity-75'
                      }`}
                    >
                      {/* Corridor Header */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 mb-4 border-b border-slate-200/80 gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[11px] font-extrabold uppercase px-2 py-0.5 rounded bg-emerald-700 text-white">
                              {cId === 'MYSURU_KIA_AIRPORT' ? 'Corridor 1' : 'Corridor 2'}
                            </span>
                            <h4 className="text-sm sm:text-base font-extrabold text-slate-900">
                              {corridorData.corridorName}
                            </h4>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-slate-600 flex-wrap">
                            <span>
                              <strong className="text-slate-700">From:</strong> {corridorData.fromLocation}
                            </span>
                            <span>•</span>
                            <span>
                              <strong className="text-slate-700">To:</strong> {corridorData.toLocation}
                            </span>
                            <span>•</span>
                            <span className="inline-flex items-center font-bold text-emerald-800 bg-emerald-100/70 px-2 py-0.5 rounded">
                              {corridorData.distanceLabel} (~{corridorData.referenceDistanceKm} km)
                            </span>
                          </div>
                        </div>

                        {/* Controls: Active & Bidirectional */}
                        <div className="flex items-center gap-2 shrink-0">
                          {/* Bidirectional toggle */}
                          <button
                            type="button"
                            onClick={() =>
                              handleCorridorFieldChange(cId, 'bidirectional', !isBidirectional)
                            }
                            className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-colors flex items-center gap-1.5 cursor-pointer ${
                              isBidirectional
                                ? 'bg-sky-50 text-sky-900 border-sky-300 hover:bg-sky-100'
                                : 'bg-slate-200 text-slate-700 border-slate-300 hover:bg-slate-300'
                            }`}
                            title="When enabled, identical fixed price applies in both directions"
                          >
                            <span className={`w-2 h-2 rounded-full ${isBidirectional ? 'bg-sky-600' : 'bg-slate-500'}`} />
                            <span>{isBidirectional ? 'Bidirectional (Both Ways)' : 'One-Way Outbound Only'}</span>
                          </button>

                          {/* Active / Inactive toggle */}
                          <button
                            type="button"
                            onClick={() =>
                              handleCorridorFieldChange(cId, 'active', !isCorridorActive)
                            }
                            className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-colors flex items-center gap-1.5 cursor-pointer ${
                              isCorridorActive
                                ? 'bg-emerald-50 text-emerald-900 border-emerald-300 hover:bg-emerald-100'
                                : 'bg-rose-50 text-rose-900 border-rose-300 hover:bg-rose-100'
                            }`}
                          >
                            <span className={`w-2 h-2 rounded-full ${isCorridorActive ? 'bg-emerald-600' : 'bg-rose-500'}`} />
                            <span>{isCorridorActive ? 'Corridor Active' : 'Inactive'}</span>
                          </button>
                        </div>
                      </div>

                      {/* Vehicle Category Fixed Price Inputs */}
                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-2.5">
                          Vehicle Fixed Prices (₹ Flat Rate)
                        </label>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          {[
                            { id: 'sedan-4-1', name: 'Sedan (4+1)', defaultPrice: cId === 'MYSURU_KIA_AIRPORT' ? 2899 : 2599 },
                            { id: 'suv-6-1', name: 'SUV (6+1)', defaultPrice: cId === 'MYSURU_KIA_AIRPORT' ? 3910 : 3519 },
                            { id: 'innova', name: 'INNOVA', defaultPrice: cId === 'MYSURU_KIA_AIRPORT' ? 4299 : 3799 },
                            { id: 'innova-crysta', name: 'INNOVA CRYSTA', defaultPrice: cId === 'MYSURU_KIA_AIRPORT' ? 4610 : 4119 },
                          ].map((v) => {
                            const currentRate = corridorData.rates[v.id as keyof typeof corridorData.rates] ?? v.defaultPrice;
                            return (
                              <div
                                key={v.id}
                                className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/20"
                              >
                                <span className="block text-[11px] font-bold text-slate-700 truncate">
                                  {v.name}
                                </span>
                                <div className="mt-1 relative flex items-center">
                                  <span className="absolute left-2.5 text-xs font-bold text-slate-400">₹</span>
                                  <input
                                    type="number"
                                    min="0"
                                    step="10"
                                    value={currentRate}
                                    onChange={(e) =>
                                      handleCorridorRateChange(cId, v.id, Number(e.target.value))
                                    }
                                    className="w-full pl-6 pr-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-extrabold text-slate-900 focus:bg-white focus:outline-none"
                                  />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Corridor Action & Save Bar */}
              <div className="pt-3 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2.5 bg-slate-50/80 p-3 rounded-xl border">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-700" />
                  <span className="text-xs text-slate-600">
                    Changes save to database & apply immediately to one-way bookings for these corridors.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleExecuteSave()}
                  disabled={isSaving}
                  className="flex items-center gap-1.5 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 active:scale-95 text-white rounded-lg text-xs font-bold shadow-xs transition-all cursor-pointer"
                >
                  {isSaving ? (
                    <>
                      <RotateCcw className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-3.5 h-3.5" />
                      <span>Save Fixed Corridor Rates Live</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* 3. ROUND-TRIP PRICING SECTION */}
        {/* ======================================================== */}
        {activeSection === 'ROUND_TRIP' && (
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center font-bold">
                    <Compass className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">
                      Round-Trip Pricing — {activeVehicleMeta.name}
                    </h3>
                    <p className="text-xs text-slate-500">
                      Multi-day outstation calculation with daily minimum km and driver bata
                    </p>
                  </div>
                </div>
                <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-purple-50 text-purple-800 border border-purple-200">
                  {activeVehicleMeta.models}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Per KM Rate */}
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Per KM Rate (₹/km)
                  </label>
                  <input
                    id="roundtrip-per-km-rate-input"
                    type="number"
                    min="0"
                    step="0.5"
                    value={config.roundTrip[selectedVehicleId]?.perKmRate ?? 13}
                    onChange={(e) =>
                      handleRoundTripFieldChange(
                        selectedVehicleId,
                        'perKmRate',
                        Number(e.target.value)
                      )
                    }
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">Charged on billable KM</p>
                </div>

                {/* Driver Allowance */}
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Driver Allowance (₹/day)
                  </label>
                  <input
                    id="roundtrip-driver-allowance-input"
                    type="number"
                    min="0"
                    step="50"
                    value={config.roundTrip[selectedVehicleId]?.driverAllowance ?? 300}
                    onChange={(e) =>
                      handleRoundTripFieldChange(
                        selectedVehicleId,
                        'driverAllowance',
                        Number(e.target.value)
                      )
                    }
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">Multiplied by travel days</p>
                </div>

                {/* Daily Minimum KM */}
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Daily Minimum KM
                  </label>
                  <input
                    id="roundtrip-daily-min-km-input"
                    type="number"
                    min="100"
                    step="10"
                    value={config.roundTrip[selectedVehicleId]?.dailyMinimumKm ?? 300}
                    onChange={(e) =>
                      handleRoundTripFieldChange(
                        selectedVehicleId,
                        'dailyMinimumKm',
                        Number(e.target.value)
                      )
                    }
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">Standard 300 km/day floor</p>
                </div>

                {/* Discount */}
                <div className="bg-emerald-50/60 p-3.5 rounded-xl border border-emerald-200/80">
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-emerald-900">Discount</label>
                    <select
                      value={config.roundTrip[selectedVehicleId]?.discountType || 'NONE'}
                      onChange={(e) =>
                        handleRoundTripFieldChange(
                          selectedVehicleId,
                          'discountType',
                          e.target.value as DiscountType
                        )
                      }
                      className="text-[11px] font-bold bg-white border border-emerald-300 rounded px-1.5 py-0.5"
                    >
                      <option value="NONE">No Discount</option>
                      <option value="PERCENTAGE">Percent (%)</option>
                      <option value="FIXED">Fixed (₹)</option>
                    </select>
                  </div>
                  <input
                    id="roundtrip-discount-value-input"
                    type="number"
                    min="0"
                    step="1"
                    disabled={config.roundTrip[selectedVehicleId]?.discountType === 'NONE'}
                    value={config.roundTrip[selectedVehicleId]?.discountValue ?? 0}
                    onChange={(e) =>
                      handleRoundTripFieldChange(
                        selectedVehicleId,
                        'discountValue',
                        Number(e.target.value)
                      )
                    }
                    className="w-full px-3 py-2 bg-white border border-emerald-300 rounded-lg text-sm font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none disabled:bg-slate-100 disabled:text-slate-400"
                  />
                  <p className="text-[11px] text-emerald-800 mt-1">Deducted from round-trip</p>
                </div>
              </div>

              <div className="mt-5 p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 leading-relaxed font-mono">
                <span className="font-bold text-slate-800 font-sans">Formula: </span>
                Billable KM = MAX(Actual Total KM, Daily Minimum KM * Number of Days)
                <br />
                ROUND-TRIP TOTAL = (Billable KM * Per KM Rate) + (Driver Allowance * Number of Days) - Discount
              </div>

              {/* Dedicated In-Card Save Bar */}
              <div className="mt-4 pt-3.5 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2.5 bg-slate-50/80 p-3 rounded-xl border">
                <div className="flex items-center gap-2">
                  {hasChanges ? (
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-900 bg-amber-100 border border-amber-300 px-2.5 py-1 rounded-lg">
                      <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                      Unsaved rates pending save
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-900 bg-emerald-100 border border-emerald-300 px-2.5 py-1 rounded-lg">
                      <Check className="w-3.5 h-3.5 text-emerald-700" />
                      {activeVehicleMeta.name} Round-Trip rates are live
                    </span>
                  )}
                  <span className="text-[11px] text-slate-500 hidden sm:inline">
                    {autoSaveEnabled ? '· Auto-Save ON' : '· Click to save'}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {hasChanges && (
                    <button
                      type="button"
                      onClick={handleCancelChanges}
                      className="px-3 py-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-200/70 rounded-lg transition-colors cursor-pointer"
                    >
                      Discard
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleExecuteSave()}
                    disabled={isSaving}
                    className="flex items-center gap-1.5 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 active:scale-95 text-white rounded-lg text-xs font-bold shadow-xs transition-all cursor-pointer"
                  >
                    {isSaving ? (
                      <>
                        <RotateCcw className="w-3.5 h-3.5 animate-spin" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-3.5 h-3.5" />
                        <span>Save {activeVehicleMeta.name} Rates Live</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* 4. AIRPORT PRICING SECTION */}
        {/* ======================================================== */}
        {activeSection === 'AIRPORT' && (
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
                    <Plane className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">
                      Airport Pricing — {activeVehicleMeta.name}
                    </h3>
                    <p className="text-xs text-slate-500">
                      Bengaluru KIAL (BLR) & Mysore Airport transfers (Pickups & Drop-offs)
                    </p>
                  </div>
                </div>
                <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-amber-50 text-amber-800 border border-amber-200">
                  {activeVehicleMeta.models}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Base Fare */}
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Base Fare (₹)
                  </label>
                  <input
                    id="airport-base-fare-input"
                    type="number"
                    min="0"
                    step="50"
                    value={config.airport[selectedVehicleId]?.baseFare ?? 699}
                    onChange={(e) =>
                      handleAirportFieldChange(selectedVehicleId, 'baseFare', Number(e.target.value))
                    }
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">Starting airport transfer fee</p>
                </div>

                {/* Driver Allowance */}
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Driver Allowance (₹)
                  </label>
                  <input
                    id="airport-driver-allowance-input"
                    type="number"
                    min="0"
                    step="50"
                    value={config.airport[selectedVehicleId]?.driverAllowance ?? 250}
                    onChange={(e) =>
                      handleAirportFieldChange(
                        selectedVehicleId,
                        'driverAllowance',
                        Number(e.target.value)
                      )
                    }
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">Airport driver bata allowance</p>
                </div>

                {/* Per KM Rate */}
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Per KM Rate (₹/km)
                  </label>
                  <input
                    id="airport-per-km-rate-input"
                    type="number"
                    min="0"
                    step="0.5"
                    value={config.airport[selectedVehicleId]?.perKmRate ?? 14}
                    onChange={(e) =>
                      handleAirportFieldChange(selectedVehicleId, 'perKmRate', Number(e.target.value))
                    }
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">Per KM route distance rate</p>
                </div>

                {/* Extra Per KM Rate */}
                <div className="bg-amber-50/60 p-3.5 rounded-xl border border-amber-200/80">
                  <label className="block text-xs font-bold text-amber-900 mb-1">
                    Extra Per KM Rate (₹/km)
                  </label>
                  <input
                    id="airport-extra-per-km-input"
                    type="number"
                    min="0"
                    step="0.5"
                    value={config.airport[selectedVehicleId]?.extraPerKmRate ?? 13}
                    onChange={(e) =>
                      handleAirportFieldChange(
                        selectedVehicleId,
                        'extraPerKmRate',
                        Number(e.target.value)
                      )
                    }
                    className="w-full px-3 py-2 bg-white border border-amber-300 rounded-lg text-sm font-bold text-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                  <p className="text-[11px] text-amber-800 mt-1">Applicable if threshold exceeded</p>
                </div>

                {/* Discount */}
                <div className="bg-emerald-50/60 p-3.5 rounded-xl border border-emerald-200/80">
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-emerald-900">Discount</label>
                    <select
                      value={config.airport[selectedVehicleId]?.discountType || 'NONE'}
                      onChange={(e) =>
                        handleAirportFieldChange(
                          selectedVehicleId,
                          'discountType',
                          e.target.value as DiscountType
                        )
                      }
                      className="text-[11px] font-bold bg-white border border-emerald-300 rounded px-1.5 py-0.5"
                    >
                      <option value="NONE">No Discount</option>
                      <option value="PERCENTAGE">Percent (%)</option>
                      <option value="FIXED">Fixed (₹)</option>
                    </select>
                  </div>
                  <input
                    id="airport-discount-value-input"
                    type="number"
                    min="0"
                    step="1"
                    disabled={config.airport[selectedVehicleId]?.discountType === 'NONE'}
                    value={config.airport[selectedVehicleId]?.discountValue ?? 0}
                    onChange={(e) =>
                      handleAirportFieldChange(
                        selectedVehicleId,
                        'discountValue',
                        Number(e.target.value)
                      )
                    }
                    className="w-full px-3 py-2 bg-white border border-emerald-300 rounded-lg text-sm font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none disabled:bg-slate-100 disabled:text-slate-400"
                  />
                  <p className="text-[11px] text-emerald-800 mt-1">Deducted from airport transfer total</p>
                </div>
              </div>

              <div className="mt-5 p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 leading-relaxed font-mono">
                <span className="font-bold text-slate-800 font-sans">Formula: </span>
                AIRPORT TOTAL = Base Fare + Driver Allowance + (Distance * Per KM Rate) + Applicable Extra KM Charges - Discount
              </div>

              {/* Dedicated In-Card Save Bar */}
              <div className="mt-4 pt-3.5 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2.5 bg-slate-50/80 p-3 rounded-xl border">
                <div className="flex items-center gap-2">
                  {hasChanges ? (
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-900 bg-amber-100 border border-amber-300 px-2.5 py-1 rounded-lg">
                      <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                      Unsaved rates pending save
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-900 bg-emerald-100 border border-emerald-300 px-2.5 py-1 rounded-lg">
                      <Check className="w-3.5 h-3.5 text-emerald-700" />
                      {activeVehicleMeta.name} Airport rates are live
                    </span>
                  )}
                  <span className="text-[11px] text-slate-500 hidden sm:inline">
                    {autoSaveEnabled ? '· Auto-Save ON' : '· Click to save'}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {hasChanges && (
                    <button
                      type="button"
                      onClick={handleCancelChanges}
                      className="px-3 py-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-200/70 rounded-lg transition-colors cursor-pointer"
                    >
                      Discard
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleExecuteSave()}
                    disabled={isSaving}
                    className="flex items-center gap-1.5 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 active:scale-95 text-white rounded-lg text-xs font-bold shadow-xs transition-all cursor-pointer"
                  >
                    {isSaving ? (
                      <>
                        <RotateCcw className="w-3.5 h-3.5 animate-spin" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-3.5 h-3.5" />
                        <span>Save {activeVehicleMeta.name} Rates Live</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* 4.5. INTER-STATE ONE-WAY PRICING SECTION */}
        {/* ======================================================== */}
        {activeSection === 'INTER_STATE_ONE_WAY' && (() => {
          const currentPricing =
            config.interStateOneWay?.[selectedVehicleId] ||
            DEFAULT_CENTRALIZED_FARE_CONFIG.interStateOneWay[selectedVehicleId] ||
            DEFAULT_CENTRALIZED_FARE_CONFIG.interStateOneWay['sedan-4-1'];

          const simResult = calculateInterStateFare(
            currentPricing,
            180,
            activeVehicleMeta,
            'Karnataka',
            'Tamil Nadu'
          );

          return (
            <div className="max-w-4xl mx-auto space-y-6">
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs">
                {/* Header */}
                <div className="flex flex-wrap items-center justify-between pb-4 border-b border-slate-100 mb-5 gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-900 flex items-center justify-center font-bold">
                      <MapPin className="w-5 h-5 text-amber-800" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-bold text-slate-900">
                          Inter-State One-Way — {activeVehicleMeta.name}
                        </h3>
                        <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300">
                          Cross-Border One-Way
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Exclusively for one-way journeys between two different Indian states (e.g., Karnataka → Tamil Nadu / Kerala / AP / Telangana)
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <label className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 cursor-pointer hover:bg-slate-100">
                      <input
                        type="checkbox"
                        checked={currentPricing.active ?? true}
                        onChange={(e) =>
                          handleInterStateFieldChange(selectedVehicleId, 'active', e.target.checked)
                        }
                        className="rounded text-amber-600 focus:ring-amber-500 h-3.5 w-3.5"
                      />
                      <span>Vehicle Active for Inter-State</span>
                    </label>
                    <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-amber-50 text-amber-900 border border-amber-200">
                      {activeVehicleMeta.models}
                    </span>
                  </div>
                </div>

                {/* Eligibility Banner */}
                <div className="mb-5 p-3 rounded-xl bg-amber-50/80 border border-amber-200/90 flex items-start gap-2.5 text-xs text-amber-950">
                  <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                  <div className="leading-relaxed">
                    <strong className="font-bold">Strict Fare Engine Eligibility:</strong> Automatically applies when <strong>Trip Type = ONE-WAY</strong> and <strong>Pickup State ≠ Drop State</strong> (e.g. Mysuru, KA → Ooty, TN). If Pickup & Drop states are the same, the normal One-Way engine is used.
                  </div>
                </div>

                {/* Pricing Fields Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Base Fare */}
                  <div className="bg-amber-50/60 p-3.5 rounded-xl border border-amber-200/80">
                    <label className="block text-xs font-bold text-amber-950 mb-1">
                      Inter-State Base Fare (₹)
                    </label>
                    <input
                      id="interstate-base-fare-input"
                      type="number"
                      min="0"
                      step="50"
                      value={currentPricing.baseFare ?? 500}
                      onChange={(e) =>
                        handleInterStateFieldChange(
                          selectedVehicleId,
                          'baseFare',
                          Number(e.target.value)
                        )
                      }
                      className="w-full px-3 py-2 bg-white border border-amber-300 rounded-lg text-sm font-bold text-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    />
                    <p className="text-[11px] text-amber-800 mt-1">Starting base fare for inter-state dispatch</p>
                  </div>

                  {/* Driver Allowance */}
                  <div className="bg-amber-50/60 p-3.5 rounded-xl border border-amber-200/80">
                    <label className="block text-xs font-bold text-amber-950 mb-1">
                      Driver Allowance (₹)
                    </label>
                    <input
                      id="interstate-driver-allowance-input"
                      type="number"
                      min="0"
                      step="50"
                      value={currentPricing.driverAllowance ?? 350}
                      onChange={(e) =>
                        handleInterStateFieldChange(
                          selectedVehicleId,
                          'driverAllowance',
                          Number(e.target.value)
                        )
                      }
                      className="w-full px-3 py-2 bg-white border border-amber-300 rounded-lg text-sm font-bold text-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    />
                    <p className="text-[11px] text-amber-800 mt-1">Outstation driver food & travel allowance</p>
                  </div>

                  {/* Per KM Rate */}
                  <div className="bg-amber-50/60 p-3.5 rounded-xl border border-amber-200/80">
                    <label className="block text-xs font-bold text-amber-950 mb-1">
                      Per KM Rate (₹/km)
                    </label>
                    <input
                      id="interstate-per-km-input"
                      type="number"
                      min="0"
                      step="0.5"
                      value={currentPricing.perKmRate ?? 14.5}
                      onChange={(e) =>
                        handleInterStateFieldChange(
                          selectedVehicleId,
                          'perKmRate',
                          Number(e.target.value)
                        )
                      }
                      className="w-full px-3 py-2 bg-white border border-amber-300 rounded-lg text-sm font-bold text-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    />
                    <p className="text-[11px] text-amber-800 mt-1">Tariff per kilometer for cross-border one-way</p>
                  </div>

                  {/* Extra Per KM Rate */}
                  <div className="bg-amber-50/60 p-3.5 rounded-xl border border-amber-200/80">
                    <label className="block text-xs font-bold text-amber-950 mb-1">
                      Extra Per KM Rate (₹/km)
                    </label>
                    <input
                      id="interstate-extra-per-km-input"
                      type="number"
                      min="0"
                      step="0.5"
                      value={currentPricing.extraPerKmRate ?? currentPricing.perKmRate ?? 14.5}
                      onChange={(e) =>
                        handleInterStateFieldChange(
                          selectedVehicleId,
                          'extraPerKmRate',
                          Number(e.target.value)
                        )
                      }
                      className="w-full px-3 py-2 bg-white border border-amber-300 rounded-lg text-sm font-bold text-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    />
                    <p className="text-[11px] text-amber-800 mt-1">Applicable rate beyond included KM allowance</p>
                  </div>

                  {/* Minimum Billable KM */}
                  <div className="bg-blue-50/60 p-3.5 rounded-xl border border-blue-200/80">
                    <label className="block text-xs font-bold text-blue-950 mb-1">
                      Minimum Billable KM
                    </label>
                    <input
                      id="interstate-min-billable-km-input"
                      type="number"
                      min="0"
                      step="10"
                      value={currentPricing.minimumBillableKm ?? 149}
                      onChange={(e) =>
                        handleInterStateFieldChange(
                          selectedVehicleId,
                          'minimumBillableKm',
                          Number(e.target.value)
                        )
                      }
                      className="w-full px-3 py-2 bg-white border border-blue-300 rounded-lg text-sm font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                    <p className="text-[11px] text-blue-800 mt-1">Rule: MAX(Actual Route Distance, Minimum KM)</p>
                  </div>

                  {/* Included Base KM */}
                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Included Base KM (Allowance)
                    </label>
                    <input
                      id="interstate-included-km-input"
                      type="number"
                      min="0"
                      step="10"
                      value={currentPricing.includedKm ?? 0}
                      onChange={(e) =>
                        handleInterStateFieldChange(
                          selectedVehicleId,
                          'includedKm',
                          Number(e.target.value)
                        )
                      }
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-bold text-slate-900 focus:ring-2 focus:ring-slate-500 focus:outline-none"
                    />
                    <p className="text-[11px] text-slate-500 mt-1">Set to 0 if all billable distance uses Per KM rate</p>
                  </div>

                  {/* Border Permit & State Tax */}
                  <div className="bg-amber-50/70 p-3.5 rounded-xl border border-amber-200/80">
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-bold text-amber-950">State Permit Charges (₹)</label>
                      <label className="flex items-center gap-1 text-[11px] font-semibold text-amber-900 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={currentPricing.includePermit ?? true}
                          onChange={(e) =>
                            handleInterStateFieldChange(
                              selectedVehicleId,
                              'includePermit',
                              e.target.checked
                            )
                          }
                          className="rounded text-amber-600 focus:ring-amber-500 h-3 w-3"
                        />
                        <span>Included in Total</span>
                      </label>
                    </div>
                    <input
                      id="interstate-state-permit-charges-input"
                      type="number"
                      min="0"
                      step="50"
                      value={currentPricing.permitStateTaxCharges ?? 600}
                      onChange={(e) =>
                        handleInterStateFieldChange(
                          selectedVehicleId,
                          'permitStateTaxCharges',
                          Number(e.target.value)
                        )
                      }
                      className="w-full px-3 py-2 bg-white border border-amber-300 rounded-lg text-sm font-bold text-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    />
                    <p className="text-[11px] text-amber-800 mt-1">Cross-state border commercial entry permit</p>
                  </div>

                  {/* Highway Toll Charges */}
                  <div className="bg-amber-50/70 p-3.5 rounded-xl border border-amber-200/80">
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-bold text-amber-950">Highway Toll Charges (₹)</label>
                      <label className="flex items-center gap-1 text-[11px] font-semibold text-amber-900 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={currentPricing.includeTolls ?? true}
                          onChange={(e) =>
                            handleInterStateFieldChange(
                              selectedVehicleId,
                              'includeTolls',
                              e.target.checked
                            )
                          }
                          className="rounded text-amber-600 focus:ring-amber-500 h-3 w-3"
                        />
                        <span>Included in Total</span>
                      </label>
                    </div>
                    <input
                      id="interstate-toll-charges-input"
                      type="number"
                      min="0"
                      step="50"
                      value={currentPricing.tollCharges ?? 150}
                      onChange={(e) =>
                        handleInterStateFieldChange(
                          selectedVehicleId,
                          'tollCharges',
                          Number(e.target.value)
                        )
                      }
                      className="w-full px-3 py-2 bg-white border border-amber-300 rounded-lg text-sm font-bold text-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    />
                    <p className="text-[11px] text-amber-800 mt-1">National Highway FASTag electronic tolls</p>
                  </div>

                  {/* State Entry & Municipal Taxes */}
                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-bold text-slate-800">State Entry Taxes (₹)</label>
                      <label className="flex items-center gap-1 text-[11px] font-semibold text-slate-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={currentPricing.includeStateEntry ?? true}
                          onChange={(e) =>
                            handleInterStateFieldChange(
                              selectedVehicleId,
                              'includeStateEntry',
                              e.target.checked
                            )
                          }
                          className="rounded text-slate-600 focus:ring-slate-500 h-3 w-3"
                        />
                        <span>Included</span>
                      </label>
                    </div>
                    <input
                      id="interstate-state-entry-input"
                      type="number"
                      min="0"
                      step="25"
                      value={currentPricing.stateEntryCharges ?? 150}
                      onChange={(e) =>
                        handleInterStateFieldChange(
                          selectedVehicleId,
                          'stateEntryCharges',
                          Number(e.target.value)
                        )
                      }
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-bold text-slate-900 focus:ring-2 focus:ring-slate-500 focus:outline-none"
                    />
                    <p className="text-[11px] text-slate-500 mt-1">Green tax / Hill council / Municipal cess</p>
                  </div>

                  {/* Parking & Other Charges */}
                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-bold text-slate-800">Other / Parking Charges (₹)</label>
                      <label className="flex items-center gap-1 text-[11px] font-semibold text-slate-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={currentPricing.includeOtherCharges ?? false}
                          onChange={(e) =>
                            handleInterStateFieldChange(
                              selectedVehicleId,
                              'includeOtherCharges',
                              e.target.checked
                            )
                          }
                          className="rounded text-slate-600 focus:ring-slate-500 h-3 w-3"
                        />
                        <span>Include</span>
                      </label>
                    </div>
                    <input
                      id="interstate-other-charges-input"
                      type="number"
                      min="0"
                      step="50"
                      value={currentPricing.otherCharges ?? 0}
                      onChange={(e) =>
                        handleInterStateFieldChange(
                          selectedVehicleId,
                          'otherCharges',
                          Number(e.target.value)
                        )
                      }
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-bold text-slate-900 focus:ring-2 focus:ring-slate-500 focus:outline-none"
                    />
                    <p className="text-[11px] text-slate-500 mt-1">Optional supplementary route charges</p>
                  </div>

                  {/* GST / Commercial Tax */}
                  <div className="bg-indigo-50/60 p-3.5 rounded-xl border border-indigo-200/80">
                    <label className="block text-xs font-bold text-indigo-950 mb-1">
                      GST / Tax (%)
                    </label>
                    <input
                      id="interstate-gst-input"
                      type="number"
                      min="0"
                      max="28"
                      step="1"
                      value={currentPricing.gstPercentage ?? 5}
                      onChange={(e) =>
                        handleInterStateFieldChange(
                          selectedVehicleId,
                          'gstPercentage',
                          Number(e.target.value)
                        )
                      }
                      className="w-full px-3 py-2 bg-white border border-indigo-300 rounded-lg text-sm font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                    <p className="text-[11px] text-indigo-800 mt-1">GST percentage on subtotal (0% - 28%)</p>
                  </div>

                  {/* Discount */}
                  <div className="bg-emerald-50/60 p-3.5 rounded-xl border border-emerald-200/80">
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-bold text-emerald-950">Promotional Discount</label>
                      <select
                        value={currentPricing.discountType || 'NONE'}
                        onChange={(e) =>
                          handleInterStateFieldChange(
                            selectedVehicleId,
                            'discountType',
                            e.target.value as DiscountType
                          )
                        }
                        className="text-[11px] font-bold bg-white border border-emerald-300 rounded px-1.5 py-0.5"
                      >
                        <option value="NONE">No Discount</option>
                        <option value="PERCENTAGE">Percent (%)</option>
                        <option value="FIXED">Fixed (₹)</option>
                      </select>
                    </div>
                    <input
                      id="interstate-discount-value-input"
                      type="number"
                      min="0"
                      step="1"
                      disabled={currentPricing.discountType === 'NONE'}
                      value={currentPricing.discountValue ?? 0}
                      onChange={(e) =>
                        handleInterStateFieldChange(
                          selectedVehicleId,
                          'discountValue',
                          Number(e.target.value)
                        )
                      }
                      className="w-full px-3 py-2 bg-white border border-emerald-300 rounded-lg text-sm font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none disabled:bg-slate-100 disabled:text-slate-400"
                    />
                    <p className="text-[11px] text-emerald-800 mt-1">Deducted from final inter-state fare</p>
                  </div>
                </div>

                {/* Calculation Formula & Simulation Card */}
                <div className="mt-5 p-4 bg-slate-900 text-white rounded-xl text-xs space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <div className="flex items-center gap-2">
                      <Calculator className="w-4 h-4 text-amber-400" />
                      <span className="font-bold text-white text-xs uppercase tracking-wider">
                        Live Simulation: Mysuru, Karnataka → Ooty, Tamil Nadu (180 KM route)
                      </span>
                    </div>
                    <span className="text-xs font-mono font-bold text-emerald-400">
                      Total: ₹{simResult.finalFare.toLocaleString('en-IN')}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                    <div className="bg-slate-800/80 p-2 rounded border border-slate-700">
                      <span className="text-slate-400 block text-[10px]">ROUTE & BILLABLE KM</span>
                      <span className="font-bold text-white">180 KM → <strong>{simResult.distanceKm} KM</strong></span>
                      <span className="text-[9px] text-amber-400 block">Min: {currentPricing.minimumBillableKm} KM</span>
                    </div>
                    <div className="bg-slate-800/80 p-2 rounded border border-slate-700">
                      <span className="text-slate-400 block text-[10px]">DISTANCE CHARGE</span>
                      <span className="font-bold text-white">₹{simResult.kmCharge}</span>
                      <span className="text-[9px] text-slate-400 block">@{currentPricing.perKmRate}/km</span>
                    </div>
                    <div className="bg-slate-800/80 p-2 rounded border border-slate-700">
                      <span className="text-slate-400 block text-[10px]">PERMIT & TOLLS</span>
                      <span className="font-bold text-white">₹{(currentPricing.includePermit ? currentPricing.permitStateTaxCharges : 0) + (currentPricing.includeTolls ? currentPricing.tollCharges : 0)}</span>
                      <span className="text-[9px] text-slate-400 block">Permit: ₹{currentPricing.permitStateTaxCharges}</span>
                    </div>
                    <div className="bg-slate-800/80 p-2 rounded border border-slate-700">
                      <span className="text-slate-400 block text-[10px]">DRIVER & TAXES</span>
                      <span className="font-bold text-white">₹{simResult.driverAllowance} + GST</span>
                      <span className="text-[9px] text-slate-400 block">Allowance: ₹{simResult.driverAllowance}</span>
                    </div>
                  </div>

                  <div className="text-[11px] text-slate-400 font-mono pt-1 border-t border-slate-800">
                    <span className="text-amber-400 font-bold font-sans">Formula: </span>
                    INTER-STATE TOTAL = Base Fare + (MAX(Distance, Min KM) × Per KM) + Driver Allowance + Tolls + Permit + Entry Taxes + GST - Discount
                  </div>
                </div>

                {/* Dedicated In-Card Save Bar */}
                <div className="mt-4 pt-3.5 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2.5 bg-slate-50/80 p-3 rounded-xl border">
                  <div className="flex items-center gap-2">
                    {hasChanges ? (
                      <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-900 bg-amber-100 border border-amber-300 px-2.5 py-1 rounded-lg">
                        <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                        Unsaved rates pending save
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-900 bg-emerald-100 border border-emerald-300 px-2.5 py-1 rounded-lg">
                        <Check className="w-3.5 h-3.5 text-emerald-700" />
                        {activeVehicleMeta.name} Inter-State One-Way rates are live
                      </span>
                    )}
                    <span className="text-[11px] text-slate-500 hidden sm:inline">
                      {autoSaveEnabled ? '· Auto-Save ON' : '· Click to save'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {hasChanges && (
                      <button
                        type="button"
                        onClick={handleCancelChanges}
                        className="px-3 py-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-200/70 rounded-lg transition-colors cursor-pointer"
                      >
                        Discard
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleExecuteSave()}
                      disabled={isSaving}
                      className="flex items-center gap-1.5 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 active:scale-95 text-white rounded-lg text-xs font-bold shadow-xs transition-all cursor-pointer"
                    >
                      {isSaving ? (
                        <>
                          <RotateCcw className="w-3.5 h-3.5 animate-spin" />
                          <span>Saving...</span>
                        </>
                      ) : (
                        <>
                          <Save className="w-3.5 h-3.5" />
                          <span>Save {activeVehicleMeta.name} Inter-State Rates Live</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Fleet-Wide Rate Matrix for All Vehicles */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs">
                <div className="flex flex-wrap items-center justify-between pb-3 border-b border-slate-100 mb-4 gap-2">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <SlidersHorizontal className="w-4 h-4 text-amber-700" />
                      <span>All Vehicles Inter-State One-Way Rate Matrix</span>
                    </h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Directly manage Base Fares, State Permit Charges, Minimum KM, and Per KM Rates across all 5 authorized fleet categories.
                    </p>
                  </div>
                  <span className="text-[11px] font-semibold text-amber-900 bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200">
                    Cross-Border One-Way Fleet
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold">
                        <th className="py-2.5 px-3">Vehicle</th>
                        <th className="py-2.5 px-3">Base Fare (₹)</th>
                        <th className="py-2.5 px-3">State Permit Charges (₹)</th>
                        <th className="py-2.5 px-3">Min. KM</th>
                        <th className="py-2.5 px-3">Per KM (₹)</th>
                        <th className="py-2.5 px-3">Driver Allowance (₹)</th>
                        <th className="py-2.5 px-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {FARE_VEHICLES_META.map((vm) => {
                        const vPricing =
                          config.interStateOneWay?.[vm.id] ||
                          DEFAULT_CENTRALIZED_FARE_CONFIG.interStateOneWay[vm.id] ||
                          DEFAULT_CENTRALIZED_FARE_CONFIG.interStateOneWay['sedan-4-1'];
                        const isCurrent = selectedVehicleId === vm.id;
                        return (
                          <tr
                            key={vm.id}
                            className={`hover:bg-amber-50/40 transition-colors ${
                              isCurrent ? 'bg-amber-50/70 font-semibold' : ''
                            }`}
                          >
                            <td className="py-2.5 px-3">
                              <div className="flex items-center gap-2">
                                <Car
                                  className={`w-3.5 h-3.5 ${
                                    isCurrent ? 'text-amber-700' : 'text-slate-400'
                                  }`}
                                />
                                <div>
                                  <span className="font-bold text-slate-900 block">{vm.name}</span>
                                  <span className="text-[10px] text-slate-500 font-normal">
                                    {vm.seats} · {vm.models}
                                  </span>
                                </div>
                              </div>
                            </td>
                            <td className="py-2 px-3">
                              <div className="flex items-center gap-1">
                                <span className="text-slate-400 text-xs">₹</span>
                                <input
                                  type="number"
                                  min="0"
                                  step="50"
                                  value={vPricing.baseFare ?? 500}
                                  onChange={(e) =>
                                    handleInterStateFieldChange(
                                      vm.id,
                                      'baseFare',
                                      Number(e.target.value)
                                    )
                                  }
                                  className="w-20 px-2 py-1 bg-white border border-slate-300 rounded text-xs font-bold text-slate-900 focus:ring-1 focus:ring-amber-500"
                                />
                              </div>
                            </td>
                            <td className="py-2 px-3">
                              <div className="flex items-center gap-1.5">
                                <span className="text-slate-400 text-xs">₹</span>
                                <input
                                  type="number"
                                  min="0"
                                  step="50"
                                  value={vPricing.permitStateTaxCharges ?? 350}
                                  onChange={(e) =>
                                    handleInterStateFieldChange(
                                      vm.id,
                                      'permitStateTaxCharges',
                                      Number(e.target.value)
                                    )
                                  }
                                  className="w-20 px-2 py-1 bg-white border border-slate-300 rounded text-xs font-bold text-slate-900 focus:ring-1 focus:ring-amber-500"
                                />
                                <label className="flex items-center gap-0.5 text-[10px] text-slate-600 font-normal cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={vPricing.includePermit ?? true}
                                    onChange={(e) =>
                                      handleInterStateFieldChange(
                                        vm.id,
                                        'includePermit',
                                        e.target.checked
                                      )
                                    }
                                    className="rounded text-amber-600 h-3 w-3"
                                  />
                                  <span>Incl.</span>
                                </label>
                              </div>
                            </td>
                            <td className="py-2 px-3">
                              <div className="flex items-center gap-1">
                                <input
                                  type="number"
                                  min="0"
                                  step="10"
                                  value={vPricing.minimumBillableKm ?? 149}
                                  onChange={(e) =>
                                    handleInterStateFieldChange(
                                      vm.id,
                                      'minimumBillableKm',
                                      Number(e.target.value)
                                    )
                                  }
                                  className="w-16 px-2 py-1 bg-white border border-slate-300 rounded text-xs font-bold text-slate-900 focus:ring-1 focus:ring-amber-500"
                                />
                                <span className="text-slate-500 text-[10px] font-normal">km</span>
                              </div>
                            </td>
                            <td className="py-2 px-3">
                              <div className="flex items-center gap-1">
                                <span className="text-slate-400 text-xs">₹</span>
                                <input
                                  type="number"
                                  min="0"
                                  step="0.5"
                                  value={vPricing.perKmRate ?? 14}
                                  onChange={(e) =>
                                    handleInterStateFieldChange(
                                      vm.id,
                                      'perKmRate',
                                      Number(e.target.value)
                                    )
                                  }
                                  className="w-16 px-2 py-1 bg-white border border-slate-300 rounded text-xs font-bold text-slate-900 focus:ring-1 focus:ring-amber-500"
                                />
                                <span className="text-slate-500 text-[10px] font-normal">/km</span>
                              </div>
                            </td>
                            <td className="py-2 px-3">
                              <div className="flex items-center gap-1">
                                <span className="text-slate-400 text-xs">₹</span>
                                <input
                                  type="number"
                                  min="0"
                                  step="50"
                                  value={vPricing.driverAllowance ?? 400}
                                  onChange={(e) =>
                                    handleInterStateFieldChange(
                                      vm.id,
                                      'driverAllowance',
                                      Number(e.target.value)
                                    )
                                  }
                                  className="w-18 px-2 py-1 bg-white border border-slate-300 rounded text-xs font-bold text-slate-900 focus:ring-1 focus:ring-amber-500"
                                />
                              </div>
                            </td>
                            <td className="py-2 px-3 text-right">
                              <button
                                type="button"
                                onClick={() => setSelectedVehicleId(vm.id)}
                                className={`px-2.5 py-1 rounded text-[11px] font-bold transition-all cursor-pointer ${
                                  isCurrent
                                    ? 'bg-amber-800 text-white shadow-2xs'
                                    : 'bg-slate-100 hover:bg-amber-100 text-slate-700 hover:text-amber-950'
                                }`}
                              >
                                {isCurrent ? 'Active Vehicle' : 'Select'}
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          );
        })()}

        {/* ======================================================== */}
        {/* 5. PREVIEW FARE TESTER */}
        {/* ======================================================== */}
        {activeSection === 'PREVIEW' && (
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs">
              <div className="flex items-center gap-3 pb-4 border-b border-slate-100 mb-5">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold">
                  <Eye className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Interactive Fare Preview Tester
                  </h3>
                  <p className="text-xs text-slate-500">
                    Simulate real journey inputs and inspect the exact authoritative fare breakdown before saving
                  </p>
                </div>
              </div>

              {/* Simulation Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Service Type
                  </label>
                  <select
                    id="preview-service-type"
                    value={previewService}
                    onChange={(e) => setPreviewService(e.target.value as ServiceTypeCategory)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="LOCAL">LOCAL</option>
                    <option value="ONE_WAY">ONE WAY</option>
                    <option value="ROUND_TRIP">ROUND TRIP</option>
                    <option value="AIRPORT">AIRPORT</option>
                    <option value="INTER_STATE_ONE_WAY">INTER-STATE ONE-WAY</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Vehicle Category
                  </label>
                  <select
                    id="preview-vehicle-select"
                    value={previewVehicle}
                    onChange={(e) => setPreviewVehicle(e.target.value as FareVehicleId)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500"
                  >
                    {FARE_VEHICLES_META.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.name} ({v.seats})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Distance (KM)
                  </label>
                  <input
                    id="preview-distance-input"
                    type="number"
                    min="1"
                    step="5"
                    value={previewDistanceKm}
                    onChange={(e) => setPreviewDistanceKm(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {previewService === 'LOCAL' && (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Duration (Hours)
                    </label>
                    <input
                      id="preview-hours-input"
                      type="number"
                      min="1"
                      step="1"
                      value={previewHours}
                      onChange={(e) => setPreviewHours(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                )}

                {previewService === 'ROUND_TRIP' && (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Number of Travel Days
                    </label>
                    <input
                      id="preview-days-input"
                      type="number"
                      min="1"
                      step="1"
                      value={previewDays}
                      onChange={(e) => setPreviewDays(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                )}
              </div>

              {/* Preview Result Card */}
              <div className="bg-gradient-to-br from-slate-900 via-slate-850 to-slate-900 text-white rounded-2xl p-5 border border-slate-700 shadow-md">
                <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-700/80 mb-4">
                  <div>
                    <span className="text-[11px] uppercase tracking-wider font-bold text-emerald-400">
                      Calculated Fare Summary
                    </span>
                    <h4 className="text-xl font-bold text-white mt-0.5">
                      {previewResult.vehicleName} — {previewResult.serviceType}
                    </h4>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-slate-400 block">FINAL BILLABLE FARE</span>
                    <span className="text-3xl font-black text-emerald-400">
                      ₹{previewResult.finalFare.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>

                {/* Breakdown Line Items */}
                <div className="space-y-2 mb-4">
                  {previewResult.breakdown.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between text-xs py-1 border-b border-slate-800 last:border-0"
                    >
                      <span className={item.amount < 0 ? 'text-emerald-400 font-bold' : 'text-slate-300'}>
                        {item.label}
                      </span>
                      <span
                        className={`font-mono font-bold ${
                          item.amount < 0 ? 'text-emerald-400' : 'text-white'
                        }`}
                      >
                        {item.amount < 0 ? `- ₹${Math.abs(item.amount)}` : `₹${item.amount}`}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Subtotal & Discount Overview */}
                <div className="pt-3 border-t border-slate-700/80 flex flex-wrap items-center justify-between text-xs text-slate-400">
                  <div>
                    Original Fare: <span className="text-slate-200 font-mono font-bold">₹{previewResult.originalFare}</span>
                    {previewResult.discountAmount > 0 && (
                      <span className="ml-3 text-emerald-400 font-bold">
                        Discount: -₹{previewResult.discountAmount} ({previewResult.discountLabel})
                      </span>
                    )}
                  </div>
                  <div className="text-slate-400">
                    Distance: <span className="text-white font-mono font-bold">{previewResult.distanceKm} KM</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* 6. FARE HISTORY SECTION */}
        {/* ======================================================== */}
        {activeSection === 'HISTORY' && (
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold">
                    <History className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">
                      Fare Version & Update History
                    </h3>
                    <p className="text-xs text-slate-500">
                      Authoritative audit logs of owner updates, discounts, and pricing modifications
                    </p>
                  </div>
                </div>
                <span className="text-xs font-bold text-slate-500">
                  {historyList.length} Entries Recorded
                </span>
              </div>

              {historyList.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">
                  No previous fare modification logs recorded yet.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 text-slate-600 border-b border-slate-200 font-bold uppercase tracking-wider text-[11px]">
                        <th className="py-2.5 px-3">Date & Time</th>
                        <th className="py-2.5 px-3">Owner / Admin</th>
                        <th className="py-2.5 px-3">Service</th>
                        <th className="py-2.5 px-3">Action</th>
                        <th className="py-2.5 px-3">Details / Notes</th>
                        <th className="py-2.5 px-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                      {historyList.map((entry) => (
                        <tr key={entry.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-3 px-3 whitespace-nowrap text-slate-500 font-mono text-[11px]">
                            {new Date(entry.timestamp).toLocaleString('en-IN', {
                              dateStyle: 'short',
                              timeStyle: 'short',
                            })}
                          </td>
                          <td className="py-3 px-3 font-bold text-slate-900">
                            {entry.user}
                          </td>
                          <td className="py-3 px-3 font-bold">
                            <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-800 text-[10px]">
                              {entry.serviceType}
                            </span>
                          </td>
                          <td className="py-3 px-3">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                entry.action === 'UPDATE'
                                  ? 'bg-emerald-100 text-emerald-900'
                                  : entry.action === 'RESET'
                                  ? 'bg-amber-100 text-amber-900'
                                  : 'bg-blue-100 text-blue-900'
                              }`}
                            >
                              {entry.action}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-slate-600">
                            {entry.notes || (typeof entry.newValue === 'string' ? entry.newValue : 'Fare update')}
                          </td>
                          <td className="py-3 px-3">
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>{entry.updateStatus}</span>
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* CONFIRM SAVE FARE & PRICE MODAL */}
      {/* ======================================================== */}
      {showConfirmSaveModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold shrink-0">
                <Save className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Confirm Save Fare & Price
                </h3>
                <p className="text-xs text-slate-500">
                  Update centralized fare engine for all customer & booking pages
                </p>
              </div>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs mb-5 space-y-2">
              <div className="font-bold text-slate-800">
                Modified Services ({changesSummary.length}):
              </div>
              <ul className="list-disc list-inside text-slate-600 space-y-0.5 max-h-36 overflow-y-auto">
                {changesSummary.map((diff, i) => (
                  <li key={i}>{diff}</li>
                ))}
              </ul>
              <div className="pt-2 border-t border-slate-200 text-[11px] text-slate-500">
                This will increment the system version to v{(config.version || 1) + 1} and record an entry in the Fare History.
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setShowConfirmSaveModal(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                Go Back / Edit
              </button>
              <button
                id="engine-confirm-save-submit-btn"
                type="button"
                disabled={isSaving}
                onClick={() => handleExecuteSave()}
                className="px-4 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-2"
              >
                <Check className="w-4 h-4" />
                <span>{isSaving ? 'Saving...' : 'Yes, Save & Apply'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* RESET CONFIRMATION MODAL */}
      {/* ======================================================== */}
      {showResetConfirmModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-900 flex items-center justify-center font-bold shrink-0">
                <RotateCcw className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Reset to Baseline Defaults?
                </h3>
                <p className="text-xs text-slate-500">
                  Restore standard factory rates for all services & vehicles
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 mb-5 leading-relaxed">
              Are you sure you want to restore the Fare & Price Engine to baseline default values? Any unsaved rate modifications will be replaced.
            </p>

            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setShowResetConfirmModal(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                id="engine-confirm-reset-submit-btn"
                type="button"
                disabled={isSaving}
                onClick={handleExecuteReset}
                className="px-4 py-2 text-xs font-bold text-white bg-amber-700 hover:bg-amber-800 rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                {isSaving ? 'Resetting...' : 'Yes, Restore Defaults'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* UNSAVED CHANGES PROTECTION MODAL */}
      {/* ======================================================== */}
      {showUnsavedPromptModal && (
        <div
          id="unsaved-changes-modal-backdrop"
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div
            id="unsaved-changes-modal-dialog"
            className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-amber-300 animate-in zoom-in-95 duration-150"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-11 h-11 rounded-xl bg-amber-100 text-amber-900 flex items-center justify-center font-bold shrink-0">
                <AlertTriangle className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  You have unsaved price changes. Save before leaving?
                </h3>
                <p className="text-xs text-slate-500">
                  Leaving now without saving will discard your modified rates.
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 mb-6 leading-relaxed bg-amber-50/80 p-3 rounded-xl border border-amber-200">
              You edited pricing for one or more vehicles or services. Choose an action below:
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-end gap-2.5">
              <button
                id="btn-unsaved-cancel"
                type="button"
                onClick={() => setShowUnsavedPromptModal(false)}
                className="w-full sm:w-auto px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer border border-slate-300"
              >
                CANCEL
              </button>
              <button
                id="btn-unsaved-discard"
                type="button"
                onClick={() => {
                  handleCancelChanges();
                  setShowUnsavedPromptModal(false);
                  if (onClose) onClose();
                }}
                className="w-full sm:w-auto px-4 py-2 text-xs font-bold text-rose-700 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer border border-rose-300"
              >
                DISCARD CHANGES
              </button>
              <button
                id="btn-unsaved-save"
                type="button"
                disabled={isSaving}
                onClick={async () => {
                  await handleExecuteSave();
                  setShowUnsavedPromptModal(false);
                  if (onClose) onClose();
                }}
                className="w-full sm:w-auto px-4 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{isSaving ? 'SAVING...' : 'SAVE CHANGES'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* ADD DISCOUNT MODAL */}
      {/* ======================================================== */}
      {showDiscountModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-900 flex items-center justify-center font-bold shrink-0">
                <Tag className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Configure Promotional Discount
                </h3>
                <p className="text-xs text-slate-500">
                  Apply discounts by service type and vehicle category
                </p>
              </div>
            </div>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Target Service
                </label>
                <select
                  id="discount-service-select"
                  value={discountTargetService}
                  onChange={(e) =>
                    setDiscountTargetService(e.target.value as ServiceTypeCategory | 'ALL')
                  }
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold text-slate-900"
                >
                  <option value="ALL">ALL SERVICES (Global)</option>
                  <option value="LOCAL">LOCAL ONLY</option>
                  <option value="ONE_WAY">ONE WAY ONLY</option>
                  <option value="ROUND_TRIP">ROUND TRIP ONLY</option>
                  <option value="AIRPORT">AIRPORT ONLY</option>
                  <option value="INTER_STATE_ONE_WAY">INTER-STATE ONE-WAY ONLY</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Target Vehicle Category
                </label>
                <select
                  id="discount-vehicle-select"
                  value={discountTargetVehicle}
                  onChange={(e) =>
                    setDiscountTargetVehicle(e.target.value as FareVehicleId | 'ALL')
                  }
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold text-slate-900"
                >
                  <option value="ALL">ALL FLEET CATEGORIES</option>
                  {FARE_VEHICLES_META.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Discount Type
                  </label>
                  <select
                    id="discount-type-select"
                    value={discountType}
                    onChange={(e) => setDiscountType(e.target.value as DiscountType)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold text-slate-900"
                  >
                    <option value="PERCENTAGE">Percentage (%)</option>
                    <option value="FIXED">Fixed Amount (₹)</option>
                    <option value="NONE">Clear / None</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Value {discountType === 'PERCENTAGE' ? '(%)' : '(₹)'}
                  </label>
                  <input
                    id="discount-value-input"
                    type="number"
                    min="0"
                    step="1"
                    disabled={discountType === 'NONE'}
                    value={discountValue}
                    onChange={(e) => setDiscountValue(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold text-slate-900 disabled:opacity-50"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setShowDiscountModal(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                id="apply-discount-confirm-btn"
                type="button"
                onClick={handleApplyDiscount}
                className="px-4 py-2 text-xs font-bold text-white bg-amber-700 hover:bg-amber-800 rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                Apply Discount
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Docked Save & Update Status Bar */}
      <div className="shrink-0 bg-slate-900 text-white px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-800 z-30">
        <div className="flex items-center gap-3">
          {hasChanges ? (
            <div className="flex items-center gap-2 text-amber-400 font-bold text-xs">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
              <span>Unsaved changes ({changesSummary.length} modified)</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
              <Check className="w-4 h-4 text-emerald-400" />
              <span>All fares saved & live across website {lastSavedTimestamp ? `(${lastSavedTimestamp})` : ''}</span>
            </div>
          )}
          <button
            type="button"
            onClick={handleToggleAutoSave}
            className={`text-[10px] font-bold px-2 py-0.5 rounded border transition-colors cursor-pointer ${
              autoSaveEnabled
                ? 'bg-emerald-950/80 border-emerald-600 text-emerald-300 hover:bg-emerald-900'
                : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
            }`}
            title="Toggle Auto-Save on every edit"
          >
            Auto-Save: {autoSaveEnabled ? 'ON' : 'OFF'}
          </button>
        </div>

        <div className="flex items-center gap-2">
          {hasChanges && (
            <button
              type="button"
              onClick={handleCancelChanges}
              className="px-3 py-1 text-xs font-bold text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            >
              Discard Changes
            </button>
          )}
          <button
            id="docked-save-all-btn"
            type="button"
            disabled={isSaving}
            onClick={() => handleExecuteSave()}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold shadow-xs transition-all cursor-pointer ${
              hasChanges
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white animate-pulse'
                : 'bg-emerald-700/90 hover:bg-emerald-600 text-white'
            }`}
          >
            {isSaving ? (
              <>
                <RotateCcw className="w-3.5 h-3.5 animate-spin" />
                <span>Saving & Updating...</span>
              </>
            ) : hasChanges ? (
              <>
                <Save className="w-3.5 h-3.5" />
                <span>Save All Changes Live ({changesSummary.length})</span>
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5" />
                <span>Save All Rates Live</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
