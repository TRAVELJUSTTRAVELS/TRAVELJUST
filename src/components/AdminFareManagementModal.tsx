import React, { useState, useEffect } from 'react';
import {
  X,
  Sliders,
  Settings,
  Calculator,
  RefreshCw,
  Check,
  AlertCircle,
  ShieldCheck,
  Zap,
  MapPin,
  Clock,
  Car,
  ChevronRight,
  Info,
  DollarSign,
  TrendingUp,
  Moon,
  Calendar,
  Lock,
  Power,
  RotateCcw,
} from 'lucide-react';
import {
  BookingTypeCategory,
  PricingModel,
  RoundingRule,
  TimeRoundingMethod,
  PolicyType,
  NightChargeType,
  VehicleBookingPricing,
  VehicleDynamicPricingConfig,
  DynamicFareCalculationResult,
} from '../types/dynamicPricing';
import { fareService } from '../services/fareService';
import { DEFAULT_VEHICLE_CONFIGS } from '../utils/dynamicFareEngine';

interface AdminFareManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPricingUpdated?: () => void;
}

const VEHICLE_TABS: Array<{ id: string; name: string; category: string; defaultCapacity: string }> = [
  { id: 'toyota-etios', name: 'TOYOTA ETIOS (4+1)', category: 'Sedan', defaultCapacity: '4+1 Seater' },
  { id: 'swift-desire', name: 'SWIFT DESIRE (4+1)', category: 'Sedan', defaultCapacity: '4+1 Seater' },
  { id: 'ertiga', name: 'ERTIGA (6+1)', category: 'MUV / SUV', defaultCapacity: '6+1 Seater' },
  { id: 'innova-6-1', name: 'INNOVA 6+1', category: 'Innova', defaultCapacity: '6+1 Seater' },
  { id: 'innova-7-1', name: 'INNOVA 7+1', category: 'Innova', defaultCapacity: '7+1 Seater' },
  { id: 'innova-crysta', name: 'INNOVA CRYSTA', category: 'Innova Crysta', defaultCapacity: '6+1 Premium' },
  { id: 'tempo-traveller-12-1', name: 'TEMPO TRAVELLER (12+1)', category: 'Tempo', defaultCapacity: '12+1 Seater' },
];

const BOOKING_TYPES: Array<{ id: BookingTypeCategory; label: string; desc: string }> = [
  { id: 'ONE_WAY', label: 'One-Way Drop', desc: 'Point-to-point intercity & outstation drops' },
  { id: 'ROUND_TRIP', label: 'Round Trip', desc: 'Multi-day outstation (daily km allowance)' },
  { id: 'LOCAL', label: 'Local City', desc: 'Hourly package with included km & duration' },
  { id: 'AIRPORT_TRANSFER', label: 'Airport Transfer', desc: 'BLR / KIAL & regional airport corridors' },
  { id: 'OUTSTATION', label: 'Outstation', desc: 'Extended multi-destination tourism routes' },
];

export const AdminFareManagementModal: React.FC<AdminFareManagementModalProps> = ({
  isOpen,
  onClose,
  onPricingUpdated,
}) => {
  const [activeVehicleId, setActiveVehicleId] = useState<string>('toyota-etios');
  const [activeBookingType, setActiveBookingType] = useState<BookingTypeCategory>('ONE_WAY');
  const [mode, setMode] = useState<'MODERATE' | 'ADVANCED'>('MODERATE');
  
  // All configs indexed by vehicleId
  const [configs, setConfigs] = useState<Record<string, VehicleDynamicPricingConfig>>({});
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveStatus, setSaveStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Live Fare Preview Tester state
  const [testerFrom, setTesterFrom] = useState<string>('Mysuru Suburban Bus Stand');
  const [testerTo, setTesterTo] = useState<string>('Kempegowda International Airport (BLR)');
  const [testerCustomKm, setTesterCustomKm] = useState<number>(185);
  const [testerCustomMins, setTesterCustomMins] = useState<number>(210);
  const [testerPickupTime, setTesterPickupTime] = useState<string>('09:00');
  const [testerDays, setTesterDays] = useState<number>(1);
  const [isTesting, setIsTesting] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<DynamicFareCalculationResult | null>(null);

  // Load configs on open
  useEffect(() => {
    if (isOpen) {
      loadConfigs();
    }
  }, [isOpen]);

  const loadConfigs = async () => {
    setIsLoading(true);
    try {
      const list = await fareService.getConfigs();
      const map: Record<string, VehicleDynamicPricingConfig> = {};
      list.forEach((cfg) => {
        map[cfg.vehicleId] = JSON.parse(JSON.stringify(cfg));
      });
      // Merge with defaults if missing
      for (const [vId, defaultCfg] of Object.entries(DEFAULT_VEHICLE_CONFIGS)) {
        if (!map[vId]) {
          map[vId] = JSON.parse(JSON.stringify(defaultCfg));
        }
      }
      setConfigs(map);
    } catch (e) {
      console.error('Failed to load fare configs:', e);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  const currentConfig: VehicleDynamicPricingConfig =
    configs[activeVehicleId] || DEFAULT_VEHICLE_CONFIGS[activeVehicleId] || DEFAULT_VEHICLE_CONFIGS['toyota-etios'];

  const currentPricing: VehicleBookingPricing =
    currentConfig.pricingByBookingType?.[activeBookingType] ||
    DEFAULT_VEHICLE_CONFIGS['toyota-etios'].pricingByBookingType.ONE_WAY;

  // Handle updates to current vehicle pricing values
  const handlePricingFieldChange = <K extends keyof VehicleBookingPricing>(
    field: K,
    value: VehicleBookingPricing[K]
  ) => {
    setSaveStatus(null);
    setConfigs((prev) => {
      const existing = prev[activeVehicleId] || currentConfig;
      const updatedPricingByBooking = {
        ...existing.pricingByBookingType,
        [activeBookingType]: {
          ...existing.pricingByBookingType[activeBookingType],
          [field]: value,
        },
      };

      return {
        ...prev,
        [activeVehicleId]: {
          ...existing,
          pricingByBookingType: updatedPricingByBooking,
        },
      };
    });
  };

  // Handle vehicle root config field updates
  const handleRootConfigChange = <K extends keyof VehicleDynamicPricingConfig>(
    field: K,
    value: VehicleDynamicPricingConfig[K]
  ) => {
    setSaveStatus(null);
    setConfigs((prev) => {
      const existing = prev[activeVehicleId] || currentConfig;
      return {
        ...prev,
        [activeVehicleId]: {
          ...existing,
          [field]: value,
        },
      };
    });
  };

  // Handle night config field updates
  const handleNightConfigChange = (field: string, value: any) => {
    setSaveStatus(null);
    setConfigs((prev) => {
      const existing = prev[activeVehicleId] || currentConfig;
      return {
        ...prev,
        [activeVehicleId]: {
          ...existing,
          nightConfig: {
            ...existing.nightConfig,
            [field]: value,
          },
        },
      };
    });
  };

  // Save current vehicle pricing
  const handleSaveCurrentVehicle = async () => {
    setIsSaving(true);
    setSaveStatus(null);

    // Validate no negative values
    const pricing = currentConfig.pricingByBookingType[activeBookingType];
    if (
      pricing.baseFare < 0 ||
      pricing.perKmRate < 0 ||
      pricing.extraPerKmRate < 0 ||
      pricing.hourlyRate < 0 ||
      pricing.extraPerHourRate < 0 ||
      pricing.driverAllowance < 0 ||
      pricing.minimumFare < 0
    ) {
      setSaveStatus({
        type: 'error',
        message: 'Validation error: Rates and fares cannot be negative numbers.',
      });
      setIsSaving(false);
      return;
    }

    try {
      const updated = await fareService.updateConfig(activeVehicleId, currentConfig);
      setConfigs((prev) => ({
        ...prev,
        [activeVehicleId]: updated,
      }));
      setSaveStatus({
        type: 'success',
        message: `Saved & Published Version ${updated.pricingVersion} for ${currentConfig.vehicleName}!`,
      });
      if (onPricingUpdated) onPricingUpdated();
    } catch (e: any) {
      setSaveStatus({
        type: 'error',
        message: e.message || 'Failed to persist pricing configuration.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Toggle vehicle availability
  const handleToggleActive = async () => {
    const newActiveState = !currentConfig.active;
    handleRootConfigChange('active', newActiveState);
    try {
      await fareService.updateConfig(activeVehicleId, { active: newActiveState });
      setSaveStatus({
        type: 'success',
        message: `${currentConfig.vehicleName} is now ${newActiveState ? 'ACTIVE' : 'DISABLED'}.`,
      });
      if (onPricingUpdated) onPricingUpdated();
    } catch (e) {
      console.error(e);
    }
  };

  // Reset current vehicle or all vehicles
  const handleResetVehicle = async () => {
    if (!confirm(`Reset ${currentConfig.vehicleName} pricing configuration to factory defaults?`)) {
      return;
    }
    setIsSaving(true);
    try {
      const refreshed = await fareService.resetToDefaults(activeVehicleId);
      const map: Record<string, VehicleDynamicPricingConfig> = {};
      refreshed.forEach((c) => (map[c.vehicleId] = c));
      setConfigs(map);
      setSaveStatus({
        type: 'success',
        message: `${currentConfig.vehicleName} reset to official base rates.`,
      });
      if (onPricingUpdated) onPricingUpdated();
    } catch (e: any) {
      setSaveStatus({ type: 'error', message: e.message });
    } finally {
      setIsSaving(false);
    }
  };

  // Run live fare preview test
  const handleRunTester = async () => {
    setIsTesting(true);
    try {
      const res = await fareService.previewFare({
        origin: testerFrom,
        destination: testerTo,
        distanceKm: testerCustomKm,
        durationMinutes: testerCustomMins,
        bookingType: activeBookingType,
        vehicleId: activeVehicleId,
        pickupTime: testerPickupTime,
        roundTripDays: testerDays,
      });
      setTestResult(res);
    } catch (e) {
      console.error('Test calculation failed:', e);
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div
      id="admin-fare-engine-modal-overlay"
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-150"
    >
      <div
        id="admin-fare-engine-modal"
        className="relative bg-white w-full max-w-6xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[94vh]"
      >
        {/* Top Header Bar */}
        <div className="bg-slate-50 border-b border-slate-200 px-5 py-3.5 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shadow-xs">
              <Calculator className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900 leading-none">
                  Live Dynamic Price & Fare Engine
                </h2>
                <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider border border-emerald-300">
                  Backend Authoritative
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Centralized live fare calculation driven by Google Maps driving metrics & independent vehicle rules
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Mode Toggle: Moderate vs Advanced */}
            <div className="inline-flex rounded-lg border border-slate-300 bg-white p-0.5 shadow-2xs">
              <button
                type="button"
                id="btn-fare-mode-moderate"
                onClick={() => setMode('MODERATE')}
                className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
                  mode === 'MODERATE'
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Moderate Mode
              </button>
              <button
                type="button"
                id="btn-fare-mode-advanced"
                onClick={() => setMode('ADVANCED')}
                className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
                  mode === 'ADVANCED'
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Advanced Mode
              </button>
            </div>

            <button
              type="button"
              id="btn-close-fare-modal"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/70 transition-colors"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Status Notification */}
        {saveStatus && (
          <div
            className={`px-5 py-2 text-xs flex items-center gap-2 border-b ${
              saveStatus.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : 'bg-red-50 text-red-800 border-red-200'
            }`}
          >
            {saveStatus.type === 'success' ? (
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            )}
            <span className="font-medium">{saveStatus.message}</span>
          </div>
        )}

        {/* Vehicle Selection Tabs (Clean Light-colour interface, no vehicle images) */}
        <div className="bg-slate-100/80 border-b border-slate-200 px-4 pt-2.5 flex items-center gap-1.5 overflow-x-auto shrink-0">
          {VEHICLE_TABS.map((tab) => {
            const isSelected = activeVehicleId === tab.id;
            const cfg = configs[tab.id];
            const isActive = cfg?.active !== false;

            return (
              <button
                key={tab.id}
                id={`vehicle-tab-${tab.id}`}
                type="button"
                onClick={() => {
                  setActiveVehicleId(tab.id);
                  setSaveStatus(null);
                }}
                className={`group relative px-3 py-2 rounded-t-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-2 border-t border-x ${
                  isSelected
                    ? 'bg-white text-emerald-900 border-slate-200 -mb-px shadow-2xs font-extrabold'
                    : 'bg-slate-200/60 hover:bg-slate-200 text-slate-600 border-transparent hover:text-slate-900'
                }`}
              >
                <div
                  className={`w-2 h-2 rounded-full ${
                    isActive ? 'bg-emerald-500' : 'bg-red-400'
                  }`}
                  title={isActive ? 'Vehicle active' : 'Vehicle disabled'}
                />
                <span>{tab.name}</span>
                <span className="text-[10px] font-normal text-slate-400">
                  v{cfg?.pricingVersion || 1}
                </span>
              </button>
            );
          })}
        </div>

        {/* Sub-header Bar: Vehicle Overview & Actions */}
        <div className="bg-white border-b border-slate-200 px-5 py-2.5 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <span className="font-extrabold text-sm text-slate-900">
              {currentConfig.vehicleName}
            </span>
            <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded border border-slate-200">
              {currentConfig.vehicleCategory}
            </span>
            <span className="text-xs text-slate-400 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              Ver: <strong className="text-slate-700">v{currentConfig.pricingVersion}</strong> ·
              Effective: {new Date(currentConfig.effectiveFrom || Date.now()).toLocaleDateString('en-IN')}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Enable/Disable Small Button */}
            <button
              type="button"
              id="btn-toggle-vehicle-active"
              onClick={handleToggleActive}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md border flex items-center gap-1 transition-colors ${
                currentConfig.active
                  ? 'border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                  : 'border-red-300 bg-red-50 text-red-700 hover:bg-red-100'
              }`}
            >
              <Power className="w-3 h-3" />
              <span>{currentConfig.active ? 'Active' : 'Disabled'}</span>
            </button>

            {/* Reset to Factory Defaults Small Button */}
            <button
              type="button"
              id="btn-reset-vehicle"
              onClick={handleResetVehicle}
              className="px-2.5 py-1 text-xs font-semibold rounded-md border border-slate-300 text-slate-600 hover:bg-slate-100 flex items-center gap-1 transition-colors"
              title="Reset to factory baseline rates"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset</span>
            </button>

            {/* Save & Publish Small Button */}
            <button
              type="button"
              id="btn-save-vehicle-fare"
              onClick={handleSaveCurrentVehicle}
              disabled={isSaving}
              className="px-3 py-1 text-xs font-bold rounded-md bg-emerald-700 hover:bg-emerald-800 text-white shadow-xs flex items-center gap-1.5 transition-colors disabled:opacity-50"
            >
              <Check className="w-3 h-3" />
              <span>{isSaving ? 'Saving...' : 'Save & Publish'}</span>
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="overflow-y-auto flex-1 p-5 space-y-5 bg-slate-50/50">
          {/* Booking Type Pill Selector */}
          <div className="bg-white p-2 rounded-xl border border-slate-200 shadow-2xs">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2 pb-1.5">
              Select Booking Type Service Rule
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
              {BOOKING_TYPES.map((bt) => {
                const isSelected = activeBookingType === bt.id;
                return (
                  <button
                    key={bt.id}
                    type="button"
                    id={`booking-type-${bt.id}`}
                    onClick={() => setActiveBookingType(bt.id)}
                    className={`text-left p-2 rounded-lg border transition-all ${
                      isSelected
                        ? 'border-emerald-600 bg-emerald-50/70 text-emerald-950 shadow-2xs ring-1 ring-emerald-500'
                        : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="text-xs font-bold">{bt.label}</div>
                    <div className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">{bt.desc}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Core Pricing Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Column 1: Core Base & KM Rates */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                  Distance & Base Rates
                </span>
                <span className="text-[10px] text-slate-400">INR (₹)</span>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Base Fare (Starting Charge)
                </label>
                <div className="relative">
                  <span className="absolute left-2.5 top-1.5 text-xs font-bold text-slate-400">₹</span>
                  <input
                    type="number"
                    min="0"
                    step="10"
                    id="input-base-fare"
                    value={currentPricing.baseFare}
                    onChange={(e) => handlePricingFieldChange('baseFare', Number(e.target.value) || 0)}
                    className="w-full pl-7 pr-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-0.5">Applied at start of journey</p>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Per KM Rate
                </label>
                <div className="relative">
                  <span className="absolute left-2.5 top-1.5 text-xs font-bold text-slate-400">₹</span>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    id="input-per-km-rate"
                    value={currentPricing.perKmRate}
                    onChange={(e) => handlePricingFieldChange('perKmRate', Number(e.target.value) || 0)}
                    className="w-full pl-7 pr-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-0.5">Charge per standard Google road km</p>
              </div>

              {mode === 'ADVANCED' && (
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Included KM (Package / Tier)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="10"
                    id="input-included-km"
                    value={currentPricing.includedKm}
                    onChange={(e) => handlePricingFieldChange('includedKm', Number(e.target.value) || 0)}
                    className="w-full px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    0 = all km charged at Per KM rate
                  </p>
                </div>
              )}

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Extra Per KM Rate
                </label>
                <div className="relative">
                  <span className="absolute left-2.5 top-1.5 text-xs font-bold text-slate-400">₹</span>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    id="input-extra-per-km"
                    value={currentPricing.extraPerKmRate}
                    onChange={(e) => handlePricingFieldChange('extraPerKmRate', Number(e.target.value) || 0)}
                    className="w-full pl-7 pr-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-0.5">Applied when distance exceeds included KM</p>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Minimum Fare Guarantee
                </label>
                <div className="relative">
                  <span className="absolute left-2.5 top-1.5 text-xs font-bold text-slate-400">₹</span>
                  <input
                    type="number"
                    min="0"
                    step="50"
                    id="input-minimum-fare"
                    value={currentPricing.minimumFare}
                    onChange={(e) => handlePricingFieldChange('minimumFare', Number(e.target.value) || 0)}
                    className="w-full pl-7 pr-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-0.5">Floor rate: final fare will never fall below this</p>
              </div>
            </div>

            {/* Column 2: Duration, Hourly & Driver Allowance */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-emerald-600" />
                  Time & Driver Allowance
                </span>
                <span className="text-[10px] text-slate-400">Chauffeur</span>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Driver Allowance (Bata)
                </label>
                <div className="relative">
                  <span className="absolute left-2.5 top-1.5 text-xs font-bold text-slate-400">₹</span>
                  <input
                    type="number"
                    min="0"
                    step="50"
                    id="input-driver-allowance"
                    value={currentPricing.driverAllowance}
                    onChange={(e) => handlePricingFieldChange('driverAllowance', Number(e.target.value) || 0)}
                    className="w-full pl-7 pr-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  {activeBookingType === 'ROUND_TRIP'
                    ? 'Per-day allowance (multiplied by trip days)'
                    : 'Fixed trip allowance'}
                </p>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Hourly Rate (City / Package)
                </label>
                <div className="relative">
                  <span className="absolute left-2.5 top-1.5 text-xs font-bold text-slate-400">₹</span>
                  <input
                    type="number"
                    min="0"
                    step="25"
                    id="input-hourly-rate"
                    value={currentPricing.hourlyRate}
                    onChange={(e) => handlePricingFieldChange('hourlyRate', Number(e.target.value) || 0)}
                    className="w-full pl-7 pr-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-0.5">Applied in time-based pricing models</p>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Extra Per Hour Rate
                </label>
                <div className="relative">
                  <span className="absolute left-2.5 top-1.5 text-xs font-bold text-slate-400">₹</span>
                  <input
                    type="number"
                    min="0"
                    step="25"
                    id="input-extra-per-hour"
                    value={currentPricing.extraPerHourRate}
                    onChange={(e) => handlePricingFieldChange('extraPerHourRate', Number(e.target.value) || 0)}
                    className="w-full pl-7 pr-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-0.5">Overtime rate beyond included package duration</p>
              </div>

              {mode === 'ADVANCED' && (
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Included Package Hours
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    id="input-included-hours"
                    value={currentPricing.includedHours}
                    onChange={(e) => handlePricingFieldChange('includedHours', Number(e.target.value) || 0)}
                    className="w-full px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                  <p className="text-[10px] text-slate-400 mt-0.5">e.g. 8 hours for standard local package</p>
                </div>
              )}

              {mode === 'ADVANCED' && (
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Time Rounding Method
                  </label>
                  <select
                    id="select-time-rounding"
                    value={currentPricing.timeRounding || 'BLOCK_30_MIN'}
                    onChange={(e) => handlePricingFieldChange('timeRounding', e.target.value as TimeRoundingMethod)}
                    className="w-full px-2.5 py-1.5 text-xs font-semibold rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="EXACT">EXACT (Exact minutes)</option>
                    <option value="BLOCK_30_MIN">30-MINUTE BLOCK (Ceil to next 0.5 hr)</option>
                    <option value="BLOCK_1_HOUR">1-HOUR BLOCK (Ceil to next 1.0 hr)</option>
                    <option value="ROUND_UP">ROUND UP</option>
                    <option value="ROUND_DOWN">ROUND DOWN</option>
                  </select>
                </div>
              )}
            </div>

            {/* Column 3: Advanced Pricing Model, Night Charge, Rounding & Policies */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  Rules & Surcharges
                </span>
                <span className="text-[10px] text-slate-400">Policies</span>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Pricing Model
                </label>
                <select
                  id="select-pricing-model"
                  value={currentPricing.pricingModel || 'BASE_PLUS_DISTANCE'}
                  onChange={(e) => handlePricingFieldChange('pricingModel', e.target.value as PricingModel)}
                  className="w-full px-2.5 py-1.5 text-xs font-semibold rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="BASE_PLUS_DISTANCE">BASE_PLUS_DISTANCE (Base + Per KM)</option>
                  <option value="DISTANCE_ONLY">DISTANCE_ONLY (Strictly Per KM)</option>
                  <option value="DISTANCE_AND_TIME">DISTANCE_AND_TIME (Distance + Duration)</option>
                  <option value="BASE_PLUS_TIME">BASE_PLUS_TIME (Base + Hourly)</option>
                  <option value="TIME_ONLY">TIME_ONLY (Strictly Hourly)</option>
                </select>
                <p className="text-[10px] text-slate-400 mt-0.5">Controls which variables generate customer charges</p>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Currency Rounding Rule
                </label>
                <select
                  id="select-rounding-rule"
                  value={currentConfig.roundingRule || 'NEAREST_10'}
                  onChange={(e) => handleRootConfigChange('roundingRule', e.target.value as RoundingRule)}
                  className="w-full px-2.5 py-1.5 text-xs font-semibold rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="NEAREST_10">Nearest ₹10 (Standard)</option>
                  <option value="NEAREST_1">Nearest ₹1 (Exact Rupee)</option>
                  <option value="NEAREST_50">Nearest ₹50 (Clean 50s)</option>
                  <option value="EXACT">Exact (No rounding)</option>
                </select>
              </div>

              {/* Night Charge Configuration */}
              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-800 flex items-center gap-1">
                    <Moon className="w-3 h-3 text-indigo-600" />
                    Night Travel Surcharge
                  </span>
                  <label className="flex items-center gap-1 text-[11px] font-medium text-slate-600 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={currentConfig.nightConfig?.enabled}
                      onChange={(e) => handleNightConfigChange('enabled', e.target.checked)}
                      className="rounded text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>Active</span>
                  </label>
                </div>

                {currentConfig.nightConfig?.enabled && (
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-500">Type</label>
                      <select
                        value={currentConfig.nightConfig.chargeType}
                        onChange={(e) => handleNightConfigChange('chargeType', e.target.value as NightChargeType)}
                        className="w-full p-1 text-xs border border-slate-300 rounded"
                      >
                        <option value="PERCENTAGE">Percentage (%)</option>
                        <option value="FIXED">Fixed Amount (₹)</option>
                        <option value="PER_KM">Per KM Surcharge</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-500">Amount / %</label>
                      <input
                        type="number"
                        min="0"
                        value={currentConfig.nightConfig.amount}
                        onChange={(e) => handleNightConfigChange('amount', Number(e.target.value) || 0)}
                        className="w-full p-1 text-xs border border-slate-300 rounded font-bold"
                      />
                    </div>
                    <div className="col-span-2 text-[10px] text-slate-400">
                      Window: {currentConfig.nightConfig.startHour}:00 PM to 0{currentConfig.nightConfig.endHour}:00 AM
                    </div>
                  </div>
                )}
              </div>

              {/* Toll & Parking Policy */}
              {mode === 'ADVANCED' && (
                <div className="space-y-2 pt-1">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-0.5">
                      Toll Handling Policy
                    </label>
                    <select
                      value={currentPricing.tollPolicy}
                      onChange={(e) => handlePricingFieldChange('tollPolicy', e.target.value as PolicyType)}
                      className="w-full px-2 py-1 text-xs border border-slate-300 rounded"
                    >
                      <option value="AT_ACTUALS">AT ACTUALS (Customer pays FASTag at toll gate)</option>
                      <option value="INCLUDED">INCLUDED (Absorbed in vehicle rate)</option>
                      <option value="EXCLUDED">EXCLUDED (Not included)</option>
                      <option value="FIXED_ESTIMATE">FIXED ESTIMATE (Added to total)</option>
                    </select>
                  </div>
                  {currentPricing.tollPolicy === 'FIXED_ESTIMATE' && (
                    <input
                      type="number"
                      placeholder="Fixed Toll Amount (₹)"
                      value={currentPricing.tollFixedAmount || 0}
                      onChange={(e) => handlePricingFieldChange('tollFixedAmount', Number(e.target.value) || 0)}
                      className="w-full px-2 py-1 text-xs border border-slate-300 rounded"
                    />
                  )}
                </div>
              )}
            </div>
          </div>

          {/* LIVE FARE PREVIEW TESTER (Built-in Verification Panel) */}
          <div className="bg-white rounded-xl border border-slate-300 p-4 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-emerald-600 text-white flex items-center justify-center">
                  <Zap className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-900">
                    Live Fare Preview Tester
                  </h3>
                  <p className="text-[10px] text-slate-500">
                    Verify live dynamic engine calculations against real Google road metrics before customer booking
                  </p>
                </div>
              </div>

              <button
                type="button"
                id="btn-run-tester"
                onClick={handleRunTester}
                disabled={isTesting}
                className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-lg shadow-xs flex items-center gap-1.5 transition-colors disabled:opacity-50"
              >
                <Calculator className="w-3.5 h-3.5" />
                <span>{isTesting ? 'Computing...' : 'Test Fare'}</span>
              </button>
            </div>

            {/* Quick Route Buttons */}
            <div className="flex flex-wrap items-center gap-1.5 text-xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Quick Corridors:
              </span>
              <button
                type="button"
                onClick={() => {
                  setTesterFrom('Mysuru Palace, Mysuru');
                  setTesterTo('Kempegowda International Airport (BLR)');
                  setTesterCustomKm(185);
                  setTesterCustomMins(210);
                }}
                className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-medium border border-slate-200 transition-colors"
              >
                Mysuru ⇄ BLR Airport (185 km)
              </button>
              <button
                type="button"
                onClick={() => {
                  setTesterFrom('Mysuru Suburban Bus Stand');
                  setTesterTo('Madikeri, Coorg');
                  setTesterCustomKm(118);
                  setTesterCustomMins(160);
                }}
                className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-medium border border-slate-200 transition-colors"
              >
                Mysuru ⇄ Coorg (118 km)
              </button>
              <button
                type="button"
                onClick={() => {
                  setTesterFrom('Mysuru City Center');
                  setTesterTo('Ooty Botanical Gardens');
                  setTesterCustomKm(125);
                  setTesterCustomMins(190);
                }}
                className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-medium border border-slate-200 transition-colors"
              >
                Mysuru ⇄ Ooty (125 km)
              </button>
            </div>

            {/* Tester Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
              <div>
                <label className="block text-[10px] font-bold text-slate-600 mb-0.5">FROM Location</label>
                <input
                  type="text"
                  value={testerFrom}
                  onChange={(e) => setTesterFrom(e.target.value)}
                  className="w-full px-2.5 py-1 text-xs border border-slate-300 rounded-md"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-600 mb-0.5">TO Location</label>
                <input
                  type="text"
                  value={testerTo}
                  onChange={(e) => setTesterTo(e.target.value)}
                  className="w-full px-2.5 py-1 text-xs border border-slate-300 rounded-md"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Distance (KM)</label>
                <input
                  type="number"
                  value={testerCustomKm}
                  onChange={(e) => setTesterCustomKm(Number(e.target.value) || 0)}
                  className="w-full px-2.5 py-1 text-xs border border-slate-300 rounded-md font-bold"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Pickup Time</label>
                <input
                  type="time"
                  value={testerPickupTime}
                  onChange={(e) => setTesterPickupTime(e.target.value)}
                  className="w-full px-2.5 py-1 text-xs border border-slate-300 rounded-md"
                />
              </div>
            </div>

            {/* Test Result Display Card */}
            {testResult && (
              <div className="p-3.5 bg-emerald-50/60 rounded-xl border border-emerald-300 space-y-3 animate-in fade-in">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-emerald-200 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-sm text-slate-900">
                      Calculated Fare:
                    </span>
                    <span className="text-xl font-black text-emerald-800">
                      ₹{testResult.totalFare.toLocaleString('en-IN')}
                    </span>
                    {testResult.minimumFareApplied && (
                      <span className="bg-amber-100 text-amber-900 text-[10px] font-bold px-2 py-0.5 rounded border border-amber-300">
                        Minimum Fare Applied
                      </span>
                    )}
                  </div>

                  <div className="text-xs text-slate-600 flex items-center gap-3">
                    <span>
                      Road Distance: <strong>{testResult.distanceKm} km</strong>
                    </span>
                    <span>
                      Drive Time: <strong>{testResult.durationFormatted}</strong>
                    </span>
                    <span>
                      Model: <code className="text-[10px] bg-white px-1 py-0.5 rounded border">{testResult.pricingModel}</code>
                    </span>
                  </div>
                </div>

                {/* Breakdown Items */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  {testResult.fareBreakdown.map((item, idx) => (
                    <div key={idx} className="bg-white p-2 rounded-lg border border-emerald-200/60 shadow-2xs">
                      <div className="text-[10px] text-slate-500 font-medium truncate">{item.label}</div>
                      <div className="font-bold text-slate-900 mt-0.5">
                        ₹{item.amount.toLocaleString('en-IN')}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Audit Snapshot JSON preview */}
                <div className="text-[10px] text-slate-500 flex items-center justify-between pt-1">
                  <span>
                    Immutable Snapshot Ready · Version {testResult.pricingVersion} · Rounding: {currentConfig.roundingRule}
                  </span>
                  <span className="font-mono text-[9px] text-slate-400">
                    Audit Token: TJ-FARE-{testResult.vehicleId}-{Date.now().toString().slice(-6)}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer Bar */}
        <div className="bg-slate-50 border-t border-slate-200 px-5 py-3 flex items-center justify-between shrink-0">
          <span className="text-xs text-slate-500">
            TRAVEL JUST Dispatch Security · Confirmed bookings preserve their historical fare snapshot.
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 transition-colors"
            >
              Close
            </button>
            <button
              type="button"
              onClick={handleSaveCurrentVehicle}
              disabled={isSaving}
              className="px-4 py-1.5 text-xs font-bold rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white shadow-xs transition-colors disabled:opacity-50 flex items-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5" />
              <span>{isSaving ? 'Saving...' : 'Save & Publish Rates'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
