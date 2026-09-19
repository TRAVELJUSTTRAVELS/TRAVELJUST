import React, { useState, useEffect } from 'react';
import {
  X,
  Zap,
  Calculator,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Car,
  MapPin,
  Clock,
  ArrowRight,
  TrendingUp,
  FileCheck2,
  Building2,
  Percent,
  Layers,
  Save,
  RotateCcw,
  Sliders,
  Sparkles,
  Compass,
} from 'lucide-react';
import { DEFAULT_VEHICLE_CONFIGS } from '../utils/dynamicFareEngine';
import { fareService } from '../services/fareService';
import { InterStateFareEngineTab } from './InterStateFareEngineTab';
import { DualEngineBenchmarkTab } from './DualEngineBenchmarkTab';
import {
  DistanceRoundingRule,
  FareAuditLogEntry,
  StatePairPricingRule,
  VehicleDynamicPricingConfig,
} from '../types/dynamicPricing';

interface FareEngineModalProps {
  isOpen: boolean;
  onClose: () => void;
  isOwner?: boolean;
}

const ALLOWED_VEHICLES_LIST: Array<{ id: string; name: string }> = [
  { id: 'sedan-4-1', name: 'Sedan (4+1)' },
  { id: 'suv-6-1', name: 'SUV (6+1)' },
  { id: 'innova', name: 'INNOVA' },
  { id: 'innova-crysta', name: 'INNOVA CRYSTA' },
  { id: 'tempo-traveller-12-1', name: 'TEMPO TRAVELLER (12+1)' },
];

interface TestResultItem {
  testId: string;
  category: string;
  title: string;
  input: any;
  passed: boolean;
  expected: string;
  actual: string;
  durationMs: number;
}

interface TestSuiteReport {
  total: number;
  passed: number;
  failed: number;
  passRate: number;
  durationMs: number;
  timestamp: string;
  results: TestResultItem[];
}

export const FareEngineModal: React.FC<FareEngineModalProps> = ({
  isOpen,
  onClose,
  isOwner = false,
}) => {
  // Enforce strictly: LIVE DYNAMIC FARE ENGINE show only in owner portal
  if (!isOpen || !isOwner) return null;

  const [activeTab, setActiveTab] = useState<
    'dual-engines' | 'simulator' | 'vehicles' | 'categories' | 'interstate' | 'charges' | 'audit' | 'tests'
  >('dual-engines');

  // Interactive Simulator State
  const [tripType, setTripType] = useState<'ONE_WAY' | 'ROUND_TRIP' | 'LOCAL' | 'AIRPORT_TRANSFER'>('ONE_WAY');
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('sedan-4-1');
  const [origin, setOrigin] = useState<string>('Mysuru Palace, Mysuru');
  const [destination, setDestination] = useState<string>('Ooty (Udhagamandalam), Tamil Nadu');
  const [distanceKm, setDistanceKm] = useState<number>(125);
  const [durationMinutes, setDurationMinutes] = useState<number>(180);
  const [roundTripDays, setRoundTripDays] = useState<number>(1);
  const [pickupTime, setPickupTime] = useState<string>('10:00');
  const [airportType, setAirportType] = useState<'pickup' | 'drop'>('pickup');
  const [localHours, setLocalHours] = useState<number>(8);
  const [stops, setStops] = useState<string[]>([]);
  const [calculating, setCalculating] = useState<boolean>(false);
  const [calculationResult, setCalculationResult] = useState<any>(null);
  const [calcError, setCalcError] = useState<string | null>(null);

  // Vehicle configs state
  const [vehicleConfigs, setVehicleConfigs] = useState<Record<string, VehicleDynamicPricingConfig>>(DEFAULT_VEHICLE_CONFIGS);
  const [editingVehicleId, setEditingVehicleId] = useState<string>('sedan-4-1');
  const [savingVehicle, setSavingVehicle] = useState<boolean>(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  // Inter-State State Pairs
  const [statePairs, setStatePairs] = useState<StatePairPricingRule[]>([]);
  const [loadingPairs, setLoadingPairs] = useState<boolean>(false);

  // Distance Rounding & Settings
  const [distanceRounding, setDistanceRounding] = useState<DistanceRoundingRule>('NEAREST_1');
  const [savingSettings, setSavingSettings] = useState<boolean>(false);

  // Audit Logs
  const [auditLogs, setAuditLogs] = useState<FareAuditLogEntry[]>([]);
  const [loadingAudit, setLoadingAudit] = useState<boolean>(false);

  // Automated Test Suite State
  const [runningTests, setRunningTests] = useState<boolean>(false);
  const [testReport, setTestReport] = useState<TestSuiteReport | null>(null);

  // Quick route presets for instant testing
  const ROUTE_PRESETS = [
    {
      label: 'Mysuru → Ooty (Inter-State TN)',
      origin: 'Mysuru Palace, Mysuru',
      destination: 'Ooty (Udhagamandalam), Tamil Nadu',
      distanceKm: 125,
      durationMinutes: 210,
      tripType: 'ONE_WAY' as const,
    },
    {
      label: 'Mysuru → Wayanad (Inter-State KL)',
      origin: 'Mysuru Railway Station, Karnataka',
      destination: 'Kalpetta, Wayanad, Kerala',
      distanceKm: 120,
      durationMinutes: 180,
      tripType: 'ONE_WAY' as const,
    },
    {
      label: 'Mysuru → Bengaluru (Expressway One-Way)',
      origin: 'Mysuru City Center',
      destination: 'MG Road, Bengaluru',
      distanceKm: 145,
      durationMinutes: 180,
      tripType: 'ONE_WAY' as const,
    },
    {
      label: 'Mysuru → Bengaluru Round-Trip (Same Day)',
      origin: 'Mysuru City Center',
      destination: 'Bengaluru Commercial Hub',
      distanceKm: 145,
      durationMinutes: 180,
      tripType: 'ROUND_TRIP' as const,
      roundTripDays: 1,
    },
    {
      label: 'BLR Airport → Mysuru (Expressway Drop)',
      origin: 'Kempegowda Int. Airport Bengaluru',
      destination: 'Mysuru City Center',
      distanceKm: 180,
      durationMinutes: 190,
      tripType: 'AIRPORT_TRANSFER' as const,
      airportType: 'drop' as const,
    },
    {
      label: 'Mysuru Full-Day Local (8 Hr / 80 Km)',
      origin: 'Mysuru Palace Area',
      destination: 'Local Sightseeing Mysuru',
      distanceKm: 80,
      durationMinutes: 480,
      tripType: 'LOCAL' as const,
      localHours: 8,
    },
  ];

  // Perform authoritative live fare calculation
  const runLiveCalculation = async () => {
    setCalculating(true);
    setCalcError(null);
    try {
      const res = await fetch('/api/fare/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          origin,
          destination,
          tripType,
          vehicleId: selectedVehicleId,
          distanceKm,
          durationMinutes: tripType === 'LOCAL' ? localHours * 60 : durationMinutes,
          roundTripDays,
          pickupTime,
          airportTransferType: airportType,
          viaStopsCount: stops.length,
          distanceRounding,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Authoritative fare calculation failed');
      }
      setCalculationResult(data);
    } catch (err: any) {
      setCalcError(err.message || 'Error communicating with authoritative Fare Engine');
    } finally {
      setCalculating(false);
    }
  };

  // Run calculation whenever primary inputs change
  useEffect(() => {
    runLiveCalculation();
  }, [tripType, selectedVehicleId, distanceKm, durationMinutes, roundTripDays, pickupTime, airportType, localHours, stops.length, distanceRounding]);

  // Load configs & settings on mount
  useEffect(() => {
    loadVehicleConfigs();
    loadStatePairs();
    loadSettings();
  }, []);

  const loadVehicleConfigs = async () => {
    try {
      const configs = await fareService.getConfigs();
      const map: Record<string, VehicleDynamicPricingConfig> = {};
      configs.forEach((c) => {
        map[c.vehicleId] = c;
      });
      const filtered: Record<string, VehicleDynamicPricingConfig> = {};
      ALLOWED_VEHICLES_LIST.forEach(({ id, name }) => {
        if (map[id]) {
          filtered[id] = { ...map[id], vehicleName: name };
        } else if (DEFAULT_VEHICLE_CONFIGS[id]) {
          filtered[id] = { ...DEFAULT_VEHICLE_CONFIGS[id], vehicleName: name };
        }
      });
      setVehicleConfigs(filtered);
    } catch (e) {
      console.warn('Failed loading vehicle configs:', e);
    }
  };

  const loadStatePairs = async () => {
    setLoadingPairs(true);
    try {
      const pairs = await fareService.getStatePairRules();
      setStatePairs(pairs);
    } catch (e) {
      console.warn('Failed loading state pairs:', e);
    } finally {
      setLoadingPairs(false);
    }
  };

  const loadSettings = async () => {
    try {
      const s = await fareService.getSettings();
      if (s?.distanceRounding) setDistanceRounding(s.distanceRounding);
    } catch (e) {
      // fallback
    }
  };

  const loadAuditLogs = async () => {
    setLoadingAudit(true);
    try {
      const logs = await fareService.getAuditLogs();
      setAuditLogs(logs);
    } catch (e) {
      console.warn('Failed loading audit logs:', e);
    } finally {
      setLoadingAudit(false);
    }
  };

  const executeAutomatedTests = async () => {
    setRunningTests(true);
    try {
      const res = await fetch('/api/fare/run-tests');
      const data = await res.json();
      if (data.success && data.report) {
        setTestReport(data.report);
      }
    } catch (e) {
      console.error('Error running fare engine tests:', e);
    } finally {
      setRunningTests(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'tests' && !testReport) {
      executeAutomatedTests();
    } else if (activeTab === 'audit') {
      loadAuditLogs();
    }
  }, [activeTab]);

  const handleUpdateVehicleField = (
    bookingTypeKey: 'ONE_WAY' | 'ROUND_TRIP' | 'LOCAL' | 'AIRPORT_TRANSFER',
    field: string,
    val: number
  ) => {
    const current = vehicleConfigs[editingVehicleId] || DEFAULT_VEHICLE_CONFIGS[editingVehicleId];
    if (!current) return;

    const updated = JSON.parse(JSON.stringify(current));
    if (!updated.pricingByBookingType[bookingTypeKey]) {
      updated.pricingByBookingType[bookingTypeKey] = {};
    }
    updated.pricingByBookingType[bookingTypeKey][field] = val;

    setVehicleConfigs((prev) => ({
      ...prev,
      [editingVehicleId]: updated,
    }));
  };

  const handleSaveVehicleConfig = async () => {
    setSavingVehicle(true);
    setSaveSuccessMsg(null);
    try {
      const current = vehicleConfigs[editingVehicleId];
      await fareService.updateConfig(editingVehicleId, current, 'Owner Portal Administrator');
      setSaveSuccessMsg(`Vehicle pricing rules for ${current.vehicleName} updated & version bumped!`);
      setTimeout(() => setSaveSuccessMsg(null), 4000);
      runLiveCalculation();
    } catch (e: any) {
      alert(`Save error: ${e.message}`);
    } finally {
      setSavingVehicle(false);
    }
  };

  const handleResetVehicleDefaults = async () => {
    if (confirm(`Reset ${vehicleConfigs[editingVehicleId]?.vehicleName || 'vehicle'} pricing to authoritative factory defaults?`)) {
      await fareService.resetToDefaults(editingVehicleId);
      await loadVehicleConfigs();
      runLiveCalculation();
      alert('Vehicle rates reset to factory defaults.');
    }
  };

  const handleSaveRounding = async (rule: DistanceRoundingRule) => {
    setSavingSettings(true);
    setDistanceRounding(rule);
    try {
      await fareService.updateSettings({ distanceRounding: rule }, 'Owner Portal Administrator');
    } catch (e) {
      console.warn('Failed saving rounding setting:', e);
    } finally {
      setSavingSettings(false);
    }
  };

  const addStop = () => {
    setStops((prev) => [...prev, `Intermediate Stop ${prev.length + 1}`]);
  };

  const removeStop = (idx: number) => {
    setStops((prev) => prev.filter((_, i) => i !== idx));
  };

  return (
    <div
      id="owner-live-fare-engine-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200"
    >
      <div
        id="owner-live-fare-engine-modal-dialog"
        className="relative w-full max-w-6xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[94vh] my-auto"
      >
        {/* Modern Clean Light Header */}
        <div className="bg-white border-b border-slate-200 p-4 sm:p-5 shrink-0">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700 shadow-xs shrink-0">
                <Zap className="w-5 h-5 fill-emerald-600 text-emerald-600" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-200 uppercase tracking-wider">
                    Owner Portal Exclusive
                  </span>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200">
                    Single Source of Truth
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono hidden md:inline">
                    Version: TJ-2026-09-001
                  </span>
                </div>
                <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight mt-0.5">
                  TRAVEL JUST LIVE DYNAMIC FARE ENGINE
                </h2>
                <p className="text-xs text-slate-500 hidden sm:block">
                  Authoritative multi-tiered pricing, Google Maps driving metrics, vehicle rule cards, and inter-state matrix.
                </p>
              </div>
            </div>

            <button
              id="close-live-fare-engine-modal-btn"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer shrink-0 border border-transparent hover:border-slate-200"
              title="Close Fare Engine Console"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Clean Light Tabs Navigation with Small Action Buttons */}
          <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-slate-100 overflow-x-auto scrollbar-none">
            <button
              id="tab-btn-dual-engines"
              onClick={() => setActiveTab('dual-engines')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                activeTab === 'dual-engines'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <Zap className="w-3.5 h-3.5 fill-current" />
              <span>Dual Engines A & B</span>
            </button>

            <button
              id="tab-btn-simulator"
              onClick={() => setActiveTab('simulator')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                activeTab === 'simulator'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <Calculator className="w-3.5 h-3.5" />
              <span>Live Simulator</span>
            </button>

            <button
              id="tab-btn-vehicles"
              onClick={() => setActiveTab('vehicles')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                activeTab === 'vehicles'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <Car className="w-3.5 h-3.5" />
              <span>Vehicles & Rate Cards</span>
            </button>

            <button
              id="tab-btn-categories"
              onClick={() => setActiveTab('categories')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                activeTab === 'categories'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Trip Categories</span>
            </button>

            <button
              id="tab-btn-interstate"
              onClick={() => setActiveTab('interstate')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                activeTab === 'interstate'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              <span>Inter-State One-Way</span>
            </button>

            <button
              id="tab-btn-charges"
              onClick={() => setActiveTab('charges')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                activeTab === 'charges'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <Percent className="w-3.5 h-3.5" />
              <span>Taxes & Surcharges</span>
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50 space-y-6">
          {/* TAB 0: DUAL ENGINES A & B BENCHMARK & SWITCHER */}
          {activeTab === 'dual-engines' && (
            <DualEngineBenchmarkTab
              onEngineChanged={() => {
                runLiveCalculation();
              }}
            />
          )}

          {/* TAB 1: LIVE SIMULATOR */}
          {activeTab === 'simulator' && (
            <div className="space-y-5">
              {/* Presets Bar */}
              <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2">
                  Authoritative Test Route Presets:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {ROUTE_PRESETS.map((p, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setOrigin(p.origin);
                        setDestination(p.destination);
                        setDistanceKm(p.distanceKm);
                        setDurationMinutes(p.durationMinutes);
                        setTripType(p.tripType);
                        if (p.roundTripDays) setRoundTripDays(p.roundTripDays);
                        if (p.airportType) setAirportType(p.airportType);
                        if (p.localHours) setLocalHours(p.localHours);
                      }}
                      className="px-2.5 py-1 text-xs font-medium rounded-md bg-slate-100 hover:bg-emerald-50 hover:text-emerald-800 text-slate-700 border border-slate-200 transition-colors cursor-pointer"
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Form Grid & Results */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                {/* Inputs Column */}
                <div className="lg:col-span-6 bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                      Trip Parameters
                    </h3>
                    <span className="text-[11px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      Live Dynamic Validation
                    </span>
                  </div>

                  {/* Trip Category */}
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      Trip Category (Single Source of Truth)
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                      {(
                        [
                          { key: 'ONE_WAY', label: 'One Way' },
                          { key: 'ROUND_TRIP', label: 'Round Trip' },
                          { key: 'LOCAL', label: 'Local City' },
                          { key: 'AIRPORT_TRANSFER', label: 'Airport' },
                        ] as const
                      ).map((item) => (
                        <button
                          key={item.key}
                          type="button"
                          onClick={() => setTripType(item.key)}
                          className={`py-1.5 px-2 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                            tripType === item.key
                              ? 'bg-emerald-50 border-emerald-600 text-emerald-800 shadow-xs'
                              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Vehicle Selector */}
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      Vehicle Type
                    </label>
                    <select
                      value={selectedVehicleId}
                      onChange={(e) => setSelectedVehicleId(e.target.value)}
                      className="w-full text-xs p-2 bg-white border border-slate-300 rounded-lg text-slate-900 font-medium focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                    >
                      {ALLOWED_VEHICLES_LIST.map((v) => (
                        <option key={v.id} value={v.id}>
                          {v.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Origin & Destination */}
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1">
                        FROM (Pickup Location)
                      </label>
                      <div className="relative">
                        <MapPin className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-emerald-600" />
                        <input
                          type="text"
                          value={origin}
                          onChange={(e) => setOrigin(e.target.value)}
                          className="w-full text-xs pl-8 pr-2.5 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 font-medium focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                          placeholder="Origin Place / Landmark"
                        />
                      </div>
                    </div>

                    {tripType !== 'LOCAL' && (
                      <div>
                        <label className="text-xs font-semibold text-slate-700 block mb-1">
                          TO (Destination)
                        </label>
                        <div className="relative">
                          <MapPin className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-red-500" />
                          <input
                            type="text"
                            value={destination}
                            onChange={(e) => setDestination(e.target.value)}
                            className="w-full text-xs pl-8 pr-2.5 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 font-medium focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                            placeholder="Destination Place / Landmark"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Multiple Stops (+ Add Stop) */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-semibold text-slate-700">
                        Via Stops (+ Add Stop)
                      </label>
                      <button
                        type="button"
                        onClick={addStop}
                        className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 cursor-pointer"
                      >
                        + Add Stop
                      </button>
                    </div>
                    {stops.length > 0 && (
                      <div className="space-y-1.5">
                        {stops.map((stop, idx) => (
                          <div key={idx} className="flex items-center gap-2">
                            <input
                              type="text"
                              value={stop}
                              onChange={(e) => {
                                const newStops = [...stops];
                                newStops[idx] = e.target.value;
                                setStops(newStops);
                              }}
                              className="flex-1 text-xs p-1.5 bg-slate-50 border border-slate-300 rounded-md text-slate-800"
                            />
                            <button
                              type="button"
                              onClick={() => removeStop(idx)}
                              className="text-xs text-red-600 hover:text-red-700 p-1 cursor-pointer"
                              title="Remove stop"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Dynamic Fields depending on Trip Type */}
                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1">
                        Google Maps Distance (KM)
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={distanceKm}
                        onChange={(e) => setDistanceKm(Number(e.target.value) || 0)}
                        className="w-full text-xs p-2 bg-white border border-slate-300 rounded-lg text-slate-900 font-medium"
                      />
                    </div>

                    {tripType === 'LOCAL' ? (
                      <div>
                        <label className="text-xs font-semibold text-slate-700 block mb-1">
                          Package Duration (Hours)
                        </label>
                        <select
                          value={localHours}
                          onChange={(e) => setLocalHours(Number(e.target.value))}
                          className="w-full text-xs p-2 bg-white border border-slate-300 rounded-lg text-slate-900 font-medium"
                        >
                          <option value="4">4 Hours / 40 KM Half Day</option>
                          <option value="8">8 Hours / 80 KM Full Day</option>
                          <option value="12">12 Hours / 120 KM Extended (15% Off)</option>
                        </select>
                      </div>
                    ) : tripType === 'ROUND_TRIP' ? (
                      <div>
                        <label className="text-xs font-semibold text-slate-700 block mb-1">
                          Round-Trip Duration (Days)
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="15"
                          value={roundTripDays}
                          onChange={(e) => setRoundTripDays(Number(e.target.value) || 1)}
                          className="w-full text-xs p-2 bg-white border border-slate-300 rounded-lg text-slate-900 font-medium"
                        />
                      </div>
                    ) : tripType === 'AIRPORT_TRANSFER' ? (
                      <div>
                        <label className="text-xs font-semibold text-slate-700 block mb-1">
                          Transfer Direction
                        </label>
                        <select
                          value={airportType}
                          onChange={(e) => setAirportType(e.target.value as any)}
                          className="w-full text-xs p-2 bg-white border border-slate-300 rounded-lg text-slate-900 font-medium"
                        >
                          <option value="pickup">Airport Pickup (Arrival)</option>
                          <option value="drop">Airport Drop (Departure)</option>
                        </select>
                      </div>
                    ) : (
                      <div>
                        <label className="text-xs font-semibold text-slate-700 block mb-1">
                          Est. Duration (Minutes)
                        </label>
                        <input
                          type="number"
                          min="10"
                          value={durationMinutes}
                          onChange={(e) => setDurationMinutes(Number(e.target.value) || 0)}
                          className="w-full text-xs p-2 bg-white border border-slate-300 rounded-lg text-slate-900 font-medium"
                        />
                      </div>
                    )}
                  </div>

                  {/* Pickup Time for Night Surcharge detection */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1">
                        Pickup Time (Night Surge check)
                      </label>
                      <input
                        type="time"
                        value={pickupTime}
                        onChange={(e) => setPickupTime(e.target.value)}
                        className="w-full text-xs p-2 bg-white border border-slate-300 rounded-lg text-slate-900 font-medium"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1">
                        Rounding Rule
                      </label>
                      <select
                        value={distanceRounding}
                        onChange={(e) => handleSaveRounding(e.target.value as any)}
                        className="w-full text-xs p-2 bg-white border border-slate-300 rounded-lg text-slate-900 font-medium"
                      >
                        <option value="EXACT">Exact (0.1 KM)</option>
                        <option value="NEAREST_1">Nearest 1 KM</option>
                        <option value="NEAREST_5">Nearest 5 KM</option>
                      </select>
                    </div>
                  </div>

                  {/* Action Button */}
                  <button
                    type="button"
                    onClick={runLiveCalculation}
                    disabled={calculating}
                    className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer active:scale-98 disabled:opacity-50"
                  >
                    {calculating ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Calculating live fare…</span>
                      </>
                    ) : (
                      <>
                        <Zap className="w-3.5 h-3.5 fill-white" />
                        <span>Recalculate Authoritative Fare</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Live Transparent Breakdown Output Column */}
                <div className="lg:col-span-6 space-y-4">
                  {calcError && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-800 text-xs flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                      <span>{calcError}</span>
                    </div>
                  )}

                  {calculationResult && calculationResult.fare ? (
                    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
                      {/* Quote Hero Card */}
                      <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50/40 border border-emerald-200 flex items-center justify-between">
                        <div>
                          <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider block">
                            Authoritative Live Fare
                          </span>
                          <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-0.5">
                            ₹{calculationResult.fare.finalFare?.toLocaleString('en-IN') || 0}
                          </div>
                          <span className="text-[11px] text-slate-600">
                            {calculationResult.routeType === 'INTERSTATE'
                              ? 'Inter-State Journey (Taxes Included)'
                              : 'Intra-State Journey (Clear Pricing)'}
                          </span>
                        </div>

                        <div className="text-right space-y-1">
                          <span className="inline-block text-[11px] font-bold px-2 py-0.5 rounded bg-emerald-600 text-white shadow-2xs">
                            {calculationResult.vehicle?.name || selectedVehicleId}
                          </span>
                          <div className="text-[11px] text-slate-500 font-medium">
                            {calculationResult.distanceKm} KM • {calculationResult.durationMinutes} Min
                          </div>
                        </div>
                      </div>

                      {/* Transparent Line-by-Line Breakdown */}
                      <div className="space-y-2 text-xs border-t border-slate-100 pt-3">
                        <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                          Authoritative Fare Breakdown
                        </h4>

                        <div className="flex justify-between py-1 border-b border-slate-100 text-slate-600">
                          <span>Base Fare:</span>
                          <span className="font-bold text-slate-900">
                            ₹{calculationResult.fare.baseFare?.toLocaleString('en-IN') || 0}
                          </span>
                        </div>

                        <div className="flex justify-between py-1 border-b border-slate-100 text-slate-600">
                          <span>Chargeable Distance:</span>
                          <span className="font-bold text-slate-900">
                            {calculationResult.fare.chargeableKm || calculationResult.distanceKm} KM @ ₹
                            {calculationResult.fare.perKmRate || 0}/km
                          </span>
                        </div>

                        <div className="flex justify-between py-1 border-b border-slate-100 text-slate-600">
                          <span>Distance Charge:</span>
                          <span className="font-bold text-slate-900">
                            ₹{(calculationResult.fare.distanceCharge || calculationResult.fare.distanceFare || 0).toLocaleString('en-IN')}
                          </span>
                        </div>

                        {(calculationResult.fare.extraKmCharge > 0 || calculationResult.fare.extraDistanceFare > 0) && (
                          <div className="flex justify-between py-1 border-b border-slate-100 text-slate-600">
                            <span>Extra KM Charges ({calculationResult.fare.extraKm} KM):</span>
                            <span className="font-bold text-slate-900">
                              ₹{(calculationResult.fare.extraKmCharge || calculationResult.fare.extraDistanceFare || 0).toLocaleString('en-IN')}
                            </span>
                          </div>
                        )}

                        {calculationResult.fare.driverAllowance > 0 && (
                          <div className="flex justify-between py-1 border-b border-slate-100 text-slate-600">
                            <span>Driver Allowance (Bata):</span>
                            <span className="font-bold text-slate-900">
                              ₹{calculationResult.fare.driverAllowance?.toLocaleString('en-IN')}
                            </span>
                          </div>
                        )}

                        {calculationResult.fare.additionalCharges > 0 && (
                          <div className="flex justify-between py-1 border-b border-slate-100 text-slate-600">
                            <span>Tolls, Permits & Surcharges:</span>
                            <span className="font-bold text-slate-900">
                              ₹{calculationResult.fare.additionalCharges?.toLocaleString('en-IN')}
                            </span>
                          </div>
                        )}

                        {calculationResult.fare.tax > 0 && (
                          <div className="flex justify-between py-1 border-b border-slate-100 text-slate-600">
                            <span>Applicable Taxes (GST):</span>
                            <span className="font-bold text-slate-900">
                              ₹{calculationResult.fare.tax?.toLocaleString('en-IN')}
                            </span>
                          </div>
                        )}

                        <div className="flex justify-between py-2 text-sm font-black text-slate-900 border-t border-slate-200">
                          <span>Total Customer Fare:</span>
                          <span className="text-emerald-700">
                            ₹{calculationResult.fare.finalFare?.toLocaleString('en-IN') || 0}
                          </span>
                        </div>
                      </div>

                      {/* Snapshot Meta */}
                      <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-[11px] text-slate-500 font-mono space-y-1">
                        <div>Snapshot ID: {calculationResult.fareSnapshot?.timestamp ? `SNAP_${new Date(calculationResult.fareSnapshot.timestamp).getTime()}` : 'IMMUTABLE_LIVE'}</div>
                        <div>Pricing Version: {calculationResult.pricingVersion || 'TJ-2026-09-001'}</div>
                        <div>Currency: {calculationResult.currency || 'INR (₹)'}</div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-10 bg-white rounded-xl border border-slate-200 text-center text-slate-400">
                      <Calculator className="w-8 h-8 mx-auto mb-2 opacity-40" />
                      <p className="text-xs">Adjust parameters to simulate live fare breakdown.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: VEHICLES & RATE CARDS */}
          {activeTab === 'vehicles' && (
            <div className="space-y-4">
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Fleet Rate Cards & Rules Manager
                  </h3>
                  <p className="text-xs text-slate-500">
                    Live editable rates per vehicle type. All updates are version-tracked in the audit log.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleResetVehicleDefaults}
                    className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reset Defaults</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleSaveVehicleConfig}
                    disabled={savingVehicle}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>{savingVehicle ? 'Saving…' : 'Save Changes'}</span>
                  </button>
                </div>
              </div>

              {saveSuccessMsg && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-semibold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>{saveSuccessMsg}</span>
                </div>
              )}

              {/* Vehicle Select Tabs */}
              <div className="flex gap-1.5 overflow-x-auto pb-1">
                {ALLOWED_VEHICLES_LIST.map(({ id, name }) => {
                  const cfg = vehicleConfigs[id] || DEFAULT_VEHICLE_CONFIGS[id];
                  if (!cfg) return null;
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setEditingVehicleId(id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                        editingVehicleId === id
                          ? 'bg-slate-900 text-white shadow-xs'
                          : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {name}
                    </button>
                  );
                })}
              </div>

              {/* Vehicle Editing Table */}
              {vehicleConfigs[editingVehicleId] && (
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div>
                      <h4 className="text-sm font-black text-slate-900">
                        {vehicleConfigs[editingVehicleId].vehicleName} Configuration
                      </h4>
                      <span className="text-[11px] text-slate-500">
                        Version v{vehicleConfigs[editingVehicleId].pricingVersion || 1} • Last Updated: {vehicleConfigs[editingVehicleId].updatedAt?.substring(0, 10) || 'Active'}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
                    {/* One Way Rules */}
                    <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5">
                      <div className="font-bold text-slate-900 flex items-center justify-between">
                        <span>One-Way Pricing</span>
                        <span className="text-[10px] bg-slate-200 text-slate-800 px-1.5 py-0.5 rounded">Point-to-Point</span>
                      </div>
                      <div>
                        <label className="text-slate-600 block mb-1">Base Fare (₹):</label>
                        <input
                          type="number"
                          value={vehicleConfigs[editingVehicleId].pricingByBookingType?.ONE_WAY?.baseFare || 0}
                          onChange={(e) => handleUpdateVehicleField('ONE_WAY', 'baseFare', Number(e.target.value))}
                          className="w-full p-1.5 bg-white border border-slate-300 rounded text-slate-900 font-bold"
                        />
                      </div>
                      <div>
                        <label className="text-slate-600 block mb-1">Per KM Rate (₹/km):</label>
                        <input
                          type="number"
                          value={vehicleConfigs[editingVehicleId].pricingByBookingType?.ONE_WAY?.perKmRate || 0}
                          onChange={(e) => handleUpdateVehicleField('ONE_WAY', 'perKmRate', Number(e.target.value))}
                          className="w-full p-1.5 bg-white border border-slate-300 rounded text-slate-900 font-bold"
                        />
                      </div>
                      <div>
                        <label className="text-slate-600 block mb-1">Inter-State Flat Tax (₹):</label>
                        <input
                          type="number"
                          value={vehicleConfigs[editingVehicleId].pricingByBookingType?.ONE_WAY?.interStateCharge || 500}
                          onChange={(e) => handleUpdateVehicleField('ONE_WAY', 'interStateCharge', Number(e.target.value))}
                          className="w-full p-1.5 bg-white border border-slate-300 rounded text-slate-900 font-bold"
                        />
                      </div>
                    </div>

                    {/* Round Trip Rules */}
                    <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5">
                      <div className="font-bold text-slate-900 flex items-center justify-between">
                        <span>Round-Trip Pricing</span>
                        <span className="text-[10px] bg-slate-200 text-slate-800 px-1.5 py-0.5 rounded">Multi-Day</span>
                      </div>
                      <div>
                        <label className="text-slate-600 block mb-1">Per KM Rate (₹/km):</label>
                        <input
                          type="number"
                          value={vehicleConfigs[editingVehicleId].pricingByBookingType?.ROUND_TRIP?.perKmRate || 0}
                          onChange={(e) => handleUpdateVehicleField('ROUND_TRIP', 'perKmRate', Number(e.target.value))}
                          className="w-full p-1.5 bg-white border border-slate-300 rounded text-slate-900 font-bold"
                        />
                      </div>
                      <div>
                        <label className="text-slate-600 block mb-1">Daily Minimum KM:</label>
                        <input
                          type="number"
                          value={vehicleConfigs[editingVehicleId].pricingByBookingType?.ROUND_TRIP?.minimumKm || 250}
                          onChange={(e) => handleUpdateVehicleField('ROUND_TRIP', 'minimumKm', Number(e.target.value))}
                          className="w-full p-1.5 bg-white border border-slate-300 rounded text-slate-900 font-bold"
                        />
                      </div>
                      <div>
                        <label className="text-slate-600 block mb-1">Driver Allowance (₹/day):</label>
                        <input
                          type="number"
                          value={vehicleConfigs[editingVehicleId].pricingByBookingType?.ROUND_TRIP?.driverAllowance || 300}
                          onChange={(e) => handleUpdateVehicleField('ROUND_TRIP', 'driverAllowance', Number(e.target.value))}
                          className="w-full p-1.5 bg-white border border-slate-300 rounded text-slate-900 font-bold"
                        />
                      </div>
                    </div>

                    {/* Local Rules */}
                    <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5">
                      <div className="font-bold text-slate-900 flex items-center justify-between">
                        <span>Local City Rules</span>
                        <span className="text-[10px] bg-slate-200 text-slate-800 px-1.5 py-0.5 rounded">Hourly Only</span>
                      </div>
                      <div>
                        <label className="text-slate-600 block mb-1">Local Minimum Base Fare (₹):</label>
                        <input
                          type="number"
                          value={vehicleConfigs[editingVehicleId].pricingByBookingType?.LOCAL?.minimumFare || 1500}
                          onChange={(e) => handleUpdateVehicleField('LOCAL', 'minimumFare', Number(e.target.value))}
                          className="w-full p-1.5 bg-white border border-slate-300 rounded text-slate-900 font-bold"
                        />
                      </div>
                      <div>
                        <label className="text-slate-600 block mb-1">Extra Per KM Rate (₹/km):</label>
                        <input
                          type="number"
                          value={vehicleConfigs[editingVehicleId].pricingByBookingType?.LOCAL?.extraPerKmRate || 13}
                          onChange={(e) => handleUpdateVehicleField('LOCAL', 'extraPerKmRate', Number(e.target.value))}
                          className="w-full p-1.5 bg-white border border-slate-300 rounded text-slate-900 font-bold"
                        />
                      </div>
                      <div>
                        <label className="text-slate-600 block mb-1">Extra Per Hour Rate (₹/hr):</label>
                        <input
                          type="number"
                          value={vehicleConfigs[editingVehicleId].pricingByBookingType?.LOCAL?.extraPerHourRate || 150}
                          onChange={(e) => handleUpdateVehicleField('LOCAL', 'extraPerHourRate', Number(e.target.value))}
                          className="w-full p-1.5 bg-white border border-slate-300 rounded text-slate-900 font-bold"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: TRIP CATEGORIES */}
          {activeTab === 'categories' && (
            <div className="space-y-4">
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
                <h3 className="text-sm font-bold text-slate-900 mb-1">
                  Trip Category Pricing Engines & Business Logic
                </h3>
                <p className="text-xs text-slate-500">
                  TRAVEL JUST enforces 4 distinct calculation engines. Hourly rates are strictly restricted to Local.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                    <h4 className="text-xs font-bold text-slate-900">1. LOCAL (City Package)</h4>
                  </div>
                  <p className="text-xs text-slate-600">
                    Supports 4-hour, 8-hour, and 12-hour city packages. Extra hours and extra KM rates are strictly applied only in Local bookings.
                  </p>
                  <div className="text-[11px] bg-slate-50 p-2.5 rounded border border-slate-200 font-mono text-slate-700">
                    Fare = Package Rate + (Extra Hours × Hourly Rate) + (Extra KM × Extra KM Rate)
                  </div>
                </div>

                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                    <h4 className="text-xs font-bold text-slate-900">2. ONE WAY (Point-to-Point)</h4>
                  </div>
                  <p className="text-xs text-slate-600">
                    Authoritative Google Maps driving distance without straight-line approximations or returning multipliers.
                  </p>
                  <div className="text-[11px] bg-slate-50 p-2.5 rounded border border-slate-200 font-mono text-slate-700">
                    Fare = Base Fare + MAX(Google Maps KM, Min KM) × Per KM Rate + Border Permits
                  </div>
                </div>

                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-purple-500"></span>
                    <h4 className="text-xs font-bold text-slate-900">3. ROUND TRIP (Same & Multi-Day)</h4>
                  </div>
                  <p className="text-xs text-slate-600">
                    Calculates billable distance as max of total route distance or (days × daily minimum KM, typically 250-300 km/day). Includes daily driver allowance.
                  </p>
                  <div className="text-[11px] bg-slate-50 p-2.5 rounded border border-slate-200 font-mono text-slate-700">
                    Fare = MAX(Route KM, Days × Min KM/day) × Round Trip Rate + (Days × Bata)
                  </div>
                </div>

                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                    <h4 className="text-xs font-bold text-slate-900">4. AIRPORT TRANSFER (BLR KIAL)</h4>
                  </div>
                  <p className="text-xs text-slate-600">
                    Authoritative BLR Airport expressway corridor. Covers flight pickup/drop, toll handling (NH 275 & NH 44), and airport parking.
                  </p>
                  <div className="text-[11px] bg-slate-50 p-2.5 rounded border border-slate-200 font-mono text-slate-700">
                    Fare = Airport Base Fare + (Distance KM × Airport Rate) + FASTag Expressway Toll
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: INTER-STATE ONE-WAY ENGINE */}
          {activeTab === 'interstate' && (
            <InterStateFareEngineTab />
          )}

          {/* TAB 5: TAXES, SURCHARGES & ROUNDING */}
          {activeTab === 'charges' && (
            <div className="space-y-4">
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
                <h3 className="text-sm font-bold text-slate-900 mb-1">
                  Taxes, Surcharges & Rounding Rules
                </h3>
                <p className="text-xs text-slate-500">
                  Manage expressway toll policies, night driver surcharges, GST, and distance rounding.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-2">
                  <h4 className="text-xs font-bold text-slate-900">Expressway Tolls</h4>
                  <p className="text-xs text-slate-600">
                    NH 275 Bengaluru-Mysuru 10-Lane Expressway toll is billed at ₹320 (FASTag actuals).
                  </p>
                  <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 inline-block">
                    FASTag Electronic Actuals
                  </span>
                </div>

                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-2">
                  <h4 className="text-xs font-bold text-slate-900">Night Surcharge</h4>
                  <p className="text-xs text-slate-600">
                    Applies for trips starting between 10:00 PM and 06:00 AM. Typically ₹250 fixed or 10%.
                  </p>
                  <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 inline-block">
                    10:00 PM – 06:00 AM
                  </span>
                </div>

                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-2">
                  <h4 className="text-xs font-bold text-slate-900">Distance Rounding Rule</h4>
                  <p className="text-xs text-slate-600">
                    Current policy: <strong className="text-slate-900">{distanceRounding}</strong>
                  </p>
                  <div className="flex gap-1 pt-1">
                    {(['EXACT', 'NEAREST_1', 'NEAREST_5'] as const).map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => handleSaveRounding(r)}
                        className={`text-[11px] font-bold px-2 py-1 rounded border transition-all cursor-pointer ${
                          distanceRounding === r
                            ? 'bg-slate-900 text-white'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        {r === 'EXACT' ? 'Exact KM' : r === 'NEAREST_1' ? 'Nearest 1 KM' : 'Nearest 5 KM'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: AUDIT TRAIL */}
          {activeTab === 'audit' && (
            <div className="space-y-4">
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 mb-1">
                    Pricing Audit Trail & Version Control
                  </h3>
                  <p className="text-xs text-slate-500">
                    Immutable history of all rate modifications, version increments, and engine configurations.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={loadAuditLogs}
                  className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loadingAudit ? 'animate-spin' : ''}`} />
                  <span>Refresh Logs</span>
                </button>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-100 text-slate-700 uppercase text-[10px] font-bold border-b border-slate-200">
                    <tr>
                      <th className="p-3">Timestamp</th>
                      <th className="p-3">User</th>
                      <th className="p-3">Action</th>
                      <th className="p-3">Summary</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {auditLogs.length > 0 ? (
                      auditLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-slate-50">
                          <td className="p-3 text-slate-500 font-mono text-[11px]">
                            {log.timestamp ? new Date(log.timestamp).toLocaleString('en-IN') : 'N/A'}
                          </td>
                          <td className="p-3 font-semibold text-slate-800">{log.user || log.adminUser || 'Owner'}</td>
                          <td className="p-3">
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-200 text-slate-800">
                              {log.action || 'UPDATE'}
                            </span>
                          </td>
                          <td className="p-3 text-slate-600">{log.summary}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="p-6 text-center text-slate-400">
                          {loadingAudit ? 'Loading audit trail…' : 'No audit entries recorded yet.'}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 7: AUTOMATED TESTS */}
          {activeTab === 'tests' && (
            <div className="space-y-4">
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 mb-1">
                    Automated Fare Engine Verification Suite
                  </h3>
                  <p className="text-xs text-slate-500">
                    Comprehensive tests covering Local, One Way, Round Trip, Airport Transfer, Inter-State, and Error protection.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={executeAutomatedTests}
                  disabled={runningTests}
                  className="px-3 py-1.5 bg-slate-900 hover:bg-black text-white rounded-lg text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer active:scale-95 disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${runningTests ? 'animate-spin' : ''}`} />
                  <span>{runningTests ? 'Running Suite…' : 'Run All Tests'}</span>
                </button>
              </div>

              {testReport && (
                <>
                  {/* Summary Bar */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
                      <span className="text-[11px] text-slate-500 uppercase font-bold block">Pass Rate</span>
                      <div className="text-xl font-black text-emerald-700 mt-0.5">{testReport.passRate}%</div>
                    </div>
                    <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
                      <span className="text-[11px] text-slate-500 uppercase font-bold block">Passed Tests</span>
                      <div className="text-xl font-black text-emerald-700 mt-0.5">{testReport.passed}</div>
                    </div>
                    <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
                      <span className="text-[11px] text-slate-500 uppercase font-bold block">Failed Tests</span>
                      <div className="text-xl font-black text-slate-900 mt-0.5">{testReport.failed}</div>
                    </div>
                    <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
                      <span className="text-[11px] text-slate-500 uppercase font-bold block">Duration</span>
                      <div className="text-xl font-black text-slate-900 mt-0.5">{testReport.durationMs} ms</div>
                    </div>
                  </div>

                  {/* Results List */}
                  <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs divide-y divide-slate-100">
                    {testReport.results.map((t) => (
                      <div key={t.testId} className="p-3.5 flex items-start justify-between gap-3 hover:bg-slate-50 text-xs">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-[10px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                              {t.testId}
                            </span>
                            <span className="font-bold text-slate-900">{t.title}</span>
                            <span className="text-[10px] text-slate-500 font-medium px-1.5 py-0.5 bg-slate-50 border rounded">
                              {t.category}
                            </span>
                          </div>
                          <div className="text-slate-500 text-[11px]">
                            Expected: <span className="text-slate-700 font-medium">{t.expected}</span>
                          </div>
                          <div className="text-slate-600 text-[11px]">
                            Actual: <span className="font-semibold text-slate-900">{t.actual}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-[10px] text-slate-400 font-mono">{t.durationMs}ms</span>
                          {t.passed ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              PASS
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-red-700 bg-red-50 px-2 py-0.5 rounded-md border border-red-200">
                              <AlertTriangle className="w-3 h-3 text-red-600" />
                              FAIL
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-white border-t border-slate-200 p-3 sm:p-4 px-6 flex items-center justify-between text-xs text-slate-500 shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>TRAVEL JUST AUTHORITATIVE FARE ENGINE • 100% LIVE SYNCED</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg font-semibold cursor-pointer"
          >
            Close Console
          </button>
        </div>
      </div>
    </div>
  );
};
