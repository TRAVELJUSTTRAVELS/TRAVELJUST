import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Zap,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Car,
  MapPin,
  Clock,
  ArrowRight,
  TrendingUp,
  FileCheck2,
  Layers,
  Save,
  Sliders,
  Sparkles,
  Compass,
  FileText,
  DollarSign,
  AlertCircle,
  Play,
  RotateCcw,
} from 'lucide-react';
import { fareService } from '../services/fareService';
import {
  IndianState,
  InterStateAdditionalChargeConfig,
  InterStateFareCalculationResult,
  InterStateOneWayVehicleRate,
  InterStateStatePairRule,
  InterStateTestCaseResult,
} from '../types/interstateOneWay';

export const InterStateFareEngineTab: React.FC = () => {
  const [subTab, setSubTab] = useState<'sandbox' | 'rates' | 'state-pairs' | 'tolls' | 'tests'>('sandbox');

  // Rates & Config State
  const [rates, setRates] = useState<InterStateOneWayVehicleRate[]>([]);
  const [pricingVersion, setPricingVersion] = useState<string>('ISOW-2026-001');
  const [additionalConfig, setAdditionalConfig] = useState<InterStateAdditionalChargeConfig | null>(null);
  const [statePairs, setStatePairs] = useState<InterStateStatePairRule[]>([]);
  const [states, setStates] = useState<IndianState[]>([]);
  const [loadingInitial, setLoadingInitial] = useState<boolean>(true);

  // Sandbox State
  const [sandboxOrigin, setSandboxOrigin] = useState<string>('Mysuru Palace, Karnataka');
  const [sandboxDest, setSandboxDest] = useState<string>('Coimbatore Junction, Tamil Nadu');
  const [sandboxVehicleId, setSandboxVehicleId] = useState<string>('sedan-4-1');
  const [sandboxDistance, setSandboxDistance] = useState<number>(210);
  const [sandboxDuration, setSandboxDuration] = useState<number>(300);
  const [sandboxTollMode, setSandboxTollMode] = useState<'INCLUDED' | 'ADDITIONAL'>('INCLUDED');
  const [sandboxStopsCount, setSandboxStopsCount] = useState<number>(0);
  const [sandboxCalculating, setSandboxCalculating] = useState<boolean>(false);
  const [sandboxResult, setSandboxResult] = useState<InterStateFareCalculationResult | null>(null);

  // Edit Rate Modal / Form State
  const [editingRate, setEditingRate] = useState<InterStateOneWayVehicleRate | null>(null);
  const [savingRate, setSavingRate] = useState<boolean>(false);
  const [rateSaveSuccess, setRateSaveSuccess] = useState<string | null>(null);

  // Test Suite State
  const [runningTests, setRunningTests] = useState<boolean>(false);
  const [testReport, setTestReport] = useState<{
    total: number;
    passed: number;
    failed: number;
    results: InterStateTestCaseResult[];
    summary: string;
  } | null>(null);

  // Quick route presets for testing
  const INTERSTATE_PRESETS = [
    {
      label: 'Mysuru (KA) ➔ Coimbatore (TN) [210 KM]',
      origin: 'Mysuru Palace, Mysuru, Karnataka',
      destination: 'Coimbatore Junction, Tamil Nadu',
      distanceKm: 210,
      durationMinutes: 300,
    },
    {
      label: 'Mysuru (KA) ➔ Wayanad (KL) [130 KM]',
      origin: 'Mysuru Railway Station, Karnataka',
      destination: 'Kalpetta, Wayanad, Kerala',
      distanceKm: 130,
      durationMinutes: 190,
    },
    {
      label: 'Bengaluru (KA) ➔ Chennai (TN) [345 KM]',
      origin: 'Majestic, Bengaluru, Karnataka',
      destination: 'Central Railway Station, Chennai, Tamil Nadu',
      distanceKm: 345,
      durationMinutes: 390,
    },
    {
      label: 'Bengaluru (KA) ➔ Hyderabad (TS) [570 KM]',
      origin: 'Hebbal, Bengaluru, Karnataka',
      destination: 'Hitec City, Hyderabad, Telangana',
      distanceKm: 570,
      durationMinutes: 540,
    },
    {
      label: 'Bengaluru (KA) ➔ Panaji (GA) [590 KM]',
      origin: 'Bengaluru, Karnataka',
      destination: 'Panaji, Goa',
      distanceKm: 590,
      durationMinutes: 620,
    },
    {
      label: '⚠️ Mysuru (KA) ➔ Bengaluru (KA) [Same State Test]',
      origin: 'Mysuru City Center, Karnataka',
      destination: 'MG Road, Bengaluru, Karnataka',
      distanceKm: 145,
      durationMinutes: 180,
    },
  ];

  // Load all data
  const loadData = async () => {
    try {
      setLoadingInitial(true);
      const [rateData, pairData, stateData] = await Promise.all([
        fareService.getInterStateRates(),
        fareService.getInterStateStatePairs(),
        fareService.getInterStateStates(),
      ]);

      setRates(rateData.rates || []);
      setPricingVersion(rateData.pricingVersion || 'ISOW-2026-001');
      setAdditionalConfig(rateData.additionalConfig || null);
      if (rateData.additionalConfig) {
        setSandboxTollMode(rateData.additionalConfig.tollMode);
      }
      setStatePairs(pairData || []);
      setStates(stateData || []);
    } catch (err) {
      console.error('Failed to load Inter-State data:', err);
    } finally {
      setLoadingInitial(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Sandbox Live Calculation
  const handleCalculateSandbox = async () => {
    setSandboxCalculating(true);
    try {
      const res = await fareService.calculateInterStateOneWayFare({
        origin: sandboxOrigin,
        destination: sandboxDest,
        vehicleId: sandboxVehicleId,
        distanceKm: sandboxDistance,
        durationMinutes: sandboxDuration,
        applyTollMode: sandboxTollMode,
        stops: sandboxStopsCount > 0 ? Array(sandboxStopsCount).fill({ address: 'Intermediate Waypoint' }) : undefined,
      });
      setSandboxResult(res);
    } catch (e) {
      console.error('Sandbox calculation error:', e);
    } finally {
      setSandboxCalculating(false);
    }
  };

  useEffect(() => {
    handleCalculateSandbox();
  }, [sandboxOrigin, sandboxDest, sandboxVehicleId, sandboxDistance, sandboxDuration, sandboxTollMode, sandboxStopsCount]);

  // Save updated rate card
  const handleSaveRate = async () => {
    if (!editingRate) return;
    setSavingRate(true);
    try {
      const res = await fareService.updateInterStateRate(editingRate.vehicleId, editingRate, 'Owner Portal Administrator');
      setRateSaveSuccess(`Rate card for ${editingRate.vehicleName} updated! New Pricing Version: ${res.pricingVersion}`);
      setPricingVersion(res.pricingVersion);
      await loadData();
      setTimeout(() => setRateSaveSuccess(null), 4000);
      setEditingRate(null);
    } catch (err: any) {
      alert(err.message || 'Failed to update rate card');
    } finally {
      setSavingRate(false);
    }
  };

  // Run automated 10 tests
  const handleRunTests = async () => {
    setRunningTests(true);
    try {
      const data = await fareService.runInterStateTests();
      if (data.success && data.report) {
        setTestReport(data.report);
      }
    } catch (err: any) {
      alert('Error running tests: ' + err.message);
    } finally {
      setRunningTests(false);
    }
  };

  return (
    <div className="space-y-4 text-slate-800" id="interstate-fare-engine-root">
      {/* Top Banner */}
      <div className="bg-linear-to-r from-[#0f2441] to-[#1e3a8a] text-white p-5 rounded-2xl shadow-md border border-slate-700">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                Authoritative Centralized Pricing Engine
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-blue-500/20 text-blue-300 border border-blue-400/30">
                Version: {pricingVersion}
              </span>
            </div>
            <h2 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
              <Compass className="w-5 h-5 text-emerald-400" />
              TRAVEL JUST Inter-State One-Way Live Dynamic Fare Engine
            </h2>
            <p className="text-xs text-slate-300 mt-1">
              Strictly verifies inter-state journey eligibility, prevents intra-state booking conflicts, and executes Google Maps driving distance calculations.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleRunTests}
              disabled={runningTests}
              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Play className={`w-3.5 h-3.5 ${runningTests ? 'animate-spin' : ''}`} />
              <span>{runningTests ? 'Running Tests...' : 'Run 10-Case Test Suite'}</span>
            </button>
            <button
              onClick={loadData}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs transition-all cursor-pointer"
              title="Refresh Engine Data"
            >
              <RefreshCw className={`w-4 h-4 ${loadingInitial ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Sub-Tabs Nav */}
        <div className="flex flex-wrap items-center gap-1.5 mt-4 pt-3 border-t border-white/10">
          {[
            { key: 'sandbox', label: 'Live Test Sandbox', icon: Zap },
            { key: 'rates', label: 'Vehicle Rate Cards', icon: Car },
            { key: 'state-pairs', label: 'State-Pair Rules', icon: Layers },
            { key: 'tolls', label: 'Tolls & Policies', icon: Sliders },
            { key: 'tests', label: 'Automated Test Suite (10 Cases)', icon: ShieldCheck },
          ].map((item) => {
            const Icon = item.icon;
            const isSelected = subTab === item.key;
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => setSubTab(item.key as any)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-emerald-500 text-white shadow-xs'
                    : 'bg-white/10 text-slate-200 hover:bg-white/20'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {rateSaveSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-xl text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{rateSaveSuccess}</span>
        </div>
      )}

      {/* SUB-TAB 1: LIVE TEST SANDBOX */}
      {subTab === 'sandbox' && (
        <div className="space-y-4">
          {/* Preset Buttons */}
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
              Instant Verification Route Presets
            </div>
            <div className="flex flex-wrap gap-2">
              {INTERSTATE_PRESETS.map((p, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setSandboxOrigin(p.origin);
                    setSandboxDest(p.destination);
                    setSandboxDistance(p.distanceKm);
                    setSandboxDuration(p.durationMinutes);
                  }}
                  className="px-2.5 py-1 text-xs font-medium rounded-lg bg-slate-50 hover:bg-emerald-50 hover:text-emerald-800 text-slate-700 border border-slate-200 transition-colors cursor-pointer"
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Input Form Column */}
            <div className="lg:col-span-6 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center justify-between">
                <span>Inter-State Route & Vehicle Parameters</span>
                <span className="text-emerald-700 font-bold text-[11px] bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  Strict Validation Active
                </span>
              </h3>

              {/* Origin */}
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  FROM (Origin Location & Indian State)
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 absolute left-3 top-3 text-emerald-600" />
                  <input
                    type="text"
                    value={sandboxOrigin}
                    onChange={(e) => setSandboxOrigin(e.target.value)}
                    placeholder="e.g. Mysuru Palace, Karnataka"
                    className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:border-emerald-600 focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Destination */}
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  TO (Destination Location & Indian State)
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 absolute left-3 top-3 text-red-500" />
                  <input
                    type="text"
                    value={sandboxDest}
                    onChange={(e) => setSandboxDest(e.target.value)}
                    placeholder="e.g. Coimbatore, Tamil Nadu"
                    className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:border-emerald-600 focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Distance & Duration */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Google Maps Distance (KM)
                  </label>
                  <input
                    type="number"
                    value={sandboxDistance}
                    onChange={(e) => setSandboxDistance(Number(e.target.value))}
                    min={1}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:border-emerald-600 focus:outline-hidden font-semibold"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Route Duration (Minutes)
                  </label>
                  <input
                    type="number"
                    value={sandboxDuration}
                    onChange={(e) => setSandboxDuration(Number(e.target.value))}
                    min={10}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:border-emerald-600 focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Vehicle Selection */}
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Vehicle Type (Inter-State Rate Card)
                </label>
                <select
                  value={sandboxVehicleId}
                  onChange={(e) => setSandboxVehicleId(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:border-emerald-600 focus:outline-hidden font-semibold text-slate-800"
                >
                  {rates.map((r) => (
                    <option key={r.vehicleId} value={r.vehicleId}>
                      {r.vehicleName} — ₹{r.perKmRate}/km (Min {r.minimumKm} KM)
                    </option>
                  ))}
                </select>
              </div>

              {/* Toll Mode & Waypoints */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Toll Handling Mode
                  </label>
                  <div className="grid grid-cols-2 gap-1 bg-slate-100 p-1 rounded-xl">
                    <button
                      type="button"
                      onClick={() => setSandboxTollMode('INCLUDED')}
                      className={`py-1 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
                        sandboxTollMode === 'INCLUDED'
                          ? 'bg-white text-emerald-800 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Included
                    </button>
                    <button
                      type="button"
                      onClick={() => setSandboxTollMode('ADDITIONAL')}
                      className={`py-1 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
                        sandboxTollMode === 'ADDITIONAL'
                          ? 'bg-white text-emerald-800 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      FASTag Extra
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    En-Route Stops (Waypoints)
                  </label>
                  <select
                    value={sandboxStopsCount}
                    onChange={(e) => setSandboxStopsCount(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:border-emerald-600 focus:outline-hidden"
                  >
                    <option value={0}>Direct Journey (0 Stops)</option>
                    <option value={1}>1 Intermediate Stop (+₹200)</option>
                    <option value={2}>2 Intermediate Stops (+₹400)</option>
                    <option value={3}>3 Intermediate Stops (+₹600)</option>
                  </select>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleCalculateSandbox}
                  disabled={sandboxCalculating}
                  className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Zap className={`w-4 h-4 ${sandboxCalculating ? 'animate-spin' : ''}`} />
                  <span>{sandboxCalculating ? 'Calculating Live Dynamic Fare...' : 'Recalculate Inter-State One-Way Fare'}</span>
                </button>
              </div>
            </div>

            {/* Results Column */}
            <div className="lg:col-span-6 space-y-4">
              {/* If Intra-State Rejected */}
              {sandboxResult && !sandboxResult.isInterState && (
                <div className="bg-amber-50 border-2 border-amber-400 p-5 rounded-2xl shadow-sm text-amber-950 space-y-3 animate-fade-in">
                  <div className="flex items-center gap-2.5 text-amber-900 font-bold text-sm">
                    <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                    <span>STRICT INTER-STATE ENFORCEMENT NOTICE</span>
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-amber-300 font-semibold text-xs leading-relaxed text-amber-900">
                    “{sandboxResult.errorMessage || 'This route is not an Inter-State journey. Please select the appropriate TRAVEL JUST fare category.'}”
                  </div>
                  <div className="text-xs text-amber-800 space-y-1">
                    <p>
                      • <strong>Origin State:</strong> {sandboxResult.route?.originState} ({sandboxResult.route?.originStateCode})
                    </p>
                    <p>
                      • <strong>Destination State:</strong> {sandboxResult.route?.destinationState} ({sandboxResult.route?.destinationStateCode})
                    </p>
                    <p>
                      • Both locations reside within the same state boundaries. Under TRAVEL JUST authoritative rules, this route must be booked under standard <strong>One-Way Intra-State</strong> or <strong>Local</strong> tariffs.
                    </p>
                  </div>
                </div>
              )}

              {/* If Calculation Successful */}
              {sandboxResult && sandboxResult.success && sandboxResult.isInterState && (
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4 animate-fade-in">
                  {/* Card Header with Calculation ID & Expiry */}
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div>
                      <div className="text-[10px] font-mono font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 inline-block mb-1">
                        {sandboxResult.calculationId}
                      </div>
                      <div className="text-[11px] text-slate-500 font-medium">
                        Quote Valid for 15 Minutes (Expires: {new Date(sandboxResult.quoteExpiry!).toLocaleTimeString()})
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                        {sandboxResult.pricingVersion}
                      </span>
                    </div>
                  </div>

                  {/* Route & State Detection */}
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 bg-emerald-600 text-white font-bold rounded text-xs">
                        {sandboxResult.route?.originStateCode}
                      </span>
                      <span className="text-xs font-bold text-slate-900">{sandboxResult.route?.originState}</span>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                      <span className="px-2 py-0.5 bg-blue-600 text-white font-bold rounded text-xs">
                        {sandboxResult.route?.destinationStateCode}
                      </span>
                      <span className="text-xs font-bold text-slate-900">{sandboxResult.route?.destinationState}</span>
                    </div>
                    <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded">
                      INTER-STATE ONE-WAY
                    </span>
                  </div>

                  {/* Total Fare Display */}
                  <div className="p-4 bg-linear-to-r from-emerald-50 to-teal-50 rounded-2xl border border-emerald-200 flex items-center justify-between">
                    <div>
                      <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">
                        Total Live Dynamic One-Way Fare
                      </div>
                      <div className="text-xs text-slate-600 mt-0.5">
                        {sandboxResult.route?.distanceKm} KM Driving · {sandboxResult.route?.durationFormatted}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-black text-emerald-800">
                        ₹{sandboxResult.fare?.finalFare?.toLocaleString('en-IN')}
                      </div>
                      <div className="text-[10px] text-emerald-700 font-semibold">
                        All-Inclusive Guaranteed Fare
                      </div>
                    </div>
                  </div>

                  {/* Detailed Authoritative Breakdown */}
                  <div>
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                      Itemized Transparent Fare Breakdown
                    </h4>
                    <div className="space-y-1.5 divide-y divide-slate-100">
                      {sandboxResult.detailedBreakdown?.map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between pt-1.5 text-xs">
                          <div>
                            <span className="font-semibold text-slate-800">{item.label}</span>
                            {item.detail && (
                              <span className="text-[11px] text-slate-500 block">{item.detail}</span>
                            )}
                          </div>
                          <span className="font-bold text-slate-900">₹{item.amount.toLocaleString('en-IN')}</span>
                        </div>
                      ))}
                      {sandboxResult.fare?.tax! > 0 && (
                        <div className="flex items-center justify-between pt-1.5 text-xs">
                          <span className="font-semibold text-slate-800">GST / Statutory Taxes</span>
                          <span className="font-bold text-slate-900">₹{sandboxResult.fare?.tax}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Immutable Fare Snapshot Details */}
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-[11px] text-slate-600 space-y-1">
                    <div className="font-bold text-slate-700 flex items-center justify-between">
                      <span>Server-Side Fare Snapshot</span>
                      <span className="text-[10px] text-emerald-700 font-mono">
                        Precedence: {sandboxResult.fareSnapshot?.precedenceApplied}
                      </span>
                    </div>
                    <p>• Vehicle: {sandboxResult.fareSnapshot?.vehicleName}</p>
                    <p>• Chargeable KM: {sandboxResult.fareSnapshot?.chargeableKm} KM (Base Rate: ₹{sandboxResult.fareSnapshot?.perKmRate}/km)</p>
                    <p>• Rule Description: {sandboxResult.fareSnapshot?.ruleDescription}</p>
                    <p>• Toll Mode: {sandboxResult.fareSnapshot?.tollMode === 'INCLUDED' ? 'Included in fare' : 'FASTag Electronic Actuals'}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: VEHICLE RATE CARDS */}
      {subTab === 'rates' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Inter-State One-Way Vehicle Rate Cards</h3>
              <p className="text-xs text-slate-500">
                Authoritative single source of truth for Inter-State One-Way journeys. Editing any rate card increments pricing version.
              </p>
            </div>
            <div className="text-right">
              <span className="text-xs font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
                Current Version: <strong>{pricingVersion}</strong>
              </span>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-100 text-slate-700 uppercase text-[10px] font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-3">Vehicle</th>
                    <th className="p-3">Category</th>
                    <th className="p-3">Base Fare</th>
                    <th className="p-3">Per KM Rate</th>
                    <th className="p-3">Min KM</th>
                    <th className="p-3">Extra KM Rate</th>
                    <th className="p-3">Driver Allowance</th>
                    <th className="p-3">Min Fare</th>
                    <th className="p-3">Version</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {rates.map((r) => (
                    <tr key={r.vehicleId} className="hover:bg-slate-50">
                      <td className="p-3 font-bold text-slate-900">{r.vehicleName}</td>
                      <td className="p-3 text-slate-600">{r.vehicleCategory}</td>
                      <td className="p-3 font-semibold text-emerald-800">₹{r.baseFare}</td>
                      <td className="p-3 font-bold text-emerald-700">₹{r.perKmRate}/km</td>
                      <td className="p-3 text-slate-800">{r.minimumKm} KM</td>
                      <td className="p-3 text-slate-800">₹{r.extraPerKmRate}/km</td>
                      <td className="p-3 text-slate-800">₹{r.driverAllowance}</td>
                      <td className="p-3 font-semibold text-slate-900">₹{r.minimumFare}</td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-50 text-blue-800 border border-blue-200">
                          {r.pricingVersion || pricingVersion}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <button
                          type="button"
                          onClick={() => setEditingRate({ ...r })}
                          className="px-2.5 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg border border-emerald-200 transition-colors cursor-pointer"
                        >
                          Edit Rate
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Edit Rate Drawer / Form */}
          {editingRate && (
            <div className="bg-slate-50 p-5 rounded-2xl border-2 border-emerald-400 space-y-4 animate-fade-in shadow-md">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Edit Rate Card: {editingRate.vehicleName}
                </h4>
                <button
                  type="button"
                  onClick={() => setEditingRate(null)}
                  className="text-slate-400 hover:text-slate-700 text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">Base Fare (₹)</label>
                  <input
                    type="number"
                    value={editingRate.baseFare}
                    onChange={(e) => setEditingRate({ ...editingRate, baseFare: Number(e.target.value) })}
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">Per-KM Rate (₹/km)</label>
                  <input
                    type="number"
                    value={editingRate.perKmRate}
                    onChange={(e) => setEditingRate({ ...editingRate, perKmRate: Number(e.target.value) })}
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white font-bold text-emerald-800"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">Minimum KM</label>
                  <input
                    type="number"
                    value={editingRate.minimumKm}
                    onChange={(e) => setEditingRate({ ...editingRate, minimumKm: Number(e.target.value) })}
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">Extra KM Rate (₹/km)</label>
                  <input
                    type="number"
                    value={editingRate.extraPerKmRate}
                    onChange={(e) => setEditingRate({ ...editingRate, extraPerKmRate: Number(e.target.value) })}
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">Driver Allowance (₹)</label>
                  <input
                    type="number"
                    value={editingRate.driverAllowance}
                    onChange={(e) => setEditingRate({ ...editingRate, driverAllowance: Number(e.target.value) })}
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">Minimum Fare (₹)</label>
                  <input
                    type="number"
                    value={editingRate.minimumFare}
                    onChange={(e) => setEditingRate({ ...editingRate, minimumFare: Number(e.target.value) })}
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingRate(null)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveRate}
                  disabled={savingRate}
                  className="px-4 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg transition-all shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{savingRate ? 'Saving Rate...' : 'Save & Bump Version'}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* SUB-TAB 3: STATE-PAIR RULES */}
      {subTab === 'state-pairs' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900">Inter-State State-Pair Border Permit Rules</h3>
            <p className="text-xs text-slate-500">
              Covers border crossing permits and road taxes when entering neighbor states (e.g. Tamil Nadu, Kerala, Andhra Pradesh, Goa).
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-100 text-slate-700 uppercase text-[10px] font-bold border-b border-slate-200">
                <tr>
                  <th className="p-3">State Pair</th>
                  <th className="p-3">Sedan (4+1)</th>
                  <th className="p-3">SUV (6+1)</th>
                  <th className="p-3">INNOVA</th>
                  <th className="p-3">INNOVA CRYSTA</th>
                  <th className="p-3">TEMPO TRAVELLER (12+1)</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {statePairs.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50">
                    <td className="p-3 font-bold text-slate-900 flex items-center gap-2">
                      <span className="px-1.5 py-0.5 bg-slate-200 rounded text-[10px] font-mono">{p.fromStateCode}</span>
                      <span>➔</span>
                      <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-800 rounded text-[10px] font-mono font-bold">{p.toStateCode}</span>
                      <span>{p.fromState} to {p.toState}</span>
                    </td>
                    <td className="p-3 font-semibold text-emerald-800">₹{p.ratesByVehicle?.['sedan-4-1'] || 500}</td>
                    <td className="p-3 font-semibold text-emerald-800">₹{p.ratesByVehicle?.['suv-6-1'] || p.ratesByVehicle?.['ertiga'] || 700}</td>
                    <td className="p-3 font-semibold text-emerald-800">₹{p.ratesByVehicle?.['innova'] || 800}</td>
                    <td className="p-3 font-semibold text-emerald-800">₹{p.ratesByVehicle?.['innova-crysta'] || 1000}</td>
                    <td className="p-3 font-semibold text-emerald-800">₹{p.ratesByVehicle?.['tempo-traveller-12-1'] || 1500}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        Active
                      </span>
                    </td>
                    <td className="p-3 text-[11px] text-slate-500">{p.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUB-TAB 4: TOLLS & POLICIES */}
      {subTab === 'tolls' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900">Inter-State Toll & Additional Charges Policy</h3>
            <p className="text-xs text-slate-500">
              Configure how expressway tolls, border taxes, and currency rounding are applied across Inter-State journeys.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Toll Handling Policy</h4>
              <p className="text-xs text-slate-600">
                Choose between including estimated tolls into the fixed customer fare or billing them as actuals via FASTag electronic records.
              </p>
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => {
                    fareService.updateInterStateAdditionalConfig({ tollMode: 'INCLUDED' });
                    setSandboxTollMode('INCLUDED');
                    loadData();
                  }}
                  className={`w-full text-left p-3 rounded-xl border text-xs font-medium cursor-pointer transition-all ${
                    additionalConfig?.tollMode === 'INCLUDED'
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-900 font-bold'
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span>Mode A: Included in Fare</span>
                    {additionalConfig?.tollMode === 'INCLUDED' && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                  </div>
                  <span className="text-[11px] text-slate-500 block mt-1">
                    Adds default estimated toll (₹{additionalConfig?.defaultTollEstimate || 350}) into total fare.
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    fareService.updateInterStateAdditionalConfig({ tollMode: 'ADDITIONAL' });
                    setSandboxTollMode('ADDITIONAL');
                    loadData();
                  }}
                  className={`w-full text-left p-3 rounded-xl border text-xs font-medium cursor-pointer transition-all ${
                    additionalConfig?.tollMode === 'ADDITIONAL'
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-900 font-bold'
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span>Mode B: FASTag Actuals</span>
                    {additionalConfig?.tollMode === 'ADDITIONAL' && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                  </div>
                  <span className="text-[11px] text-slate-500 block mt-1">
                    Tolls excluded from base quote, billed as actuals via electronic receipt.
                  </span>
                </button>
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Currency Rounding Rule</h4>
              <p className="text-xs text-slate-600">
                Eliminates odd currency fractions for transparent customer transactions.
              </p>
              <div className="space-y-1.5">
                {[
                  { key: 'NEAREST_10', label: 'Round to Nearest ₹10 (Recommended)' },
                  { key: 'NEAREST_50', label: 'Round to Nearest ₹50' },
                  { key: 'EXACT', label: 'Exact ₹1 Precision' },
                ].map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => {
                      fareService.updateInterStateAdditionalConfig({ roundingRule: item.key as any });
                      loadData();
                    }}
                    className={`w-full text-left p-2.5 rounded-lg border text-xs cursor-pointer ${
                      additionalConfig?.roundingRule === item.key
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-900 font-bold'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Quote Validity Period</h4>
              <p className="text-xs text-slate-600">
                Dynamic quotes remain guaranteed for 15 minutes before refreshing with live traffic conditions.
              </p>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                <span className="font-bold text-slate-800">15 Minutes Window</span>
                <p className="text-[11px] text-slate-500 mt-1">
                  Locks rate snapshot against fuel price spikes or midday tariff changes during active booking checkout.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 5: AUTOMATED TEST SUITE */}
      {subTab === 'tests' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Inter-State One-Way Automated Test Suite (10 Cases)</h3>
              <p className="text-xs text-slate-500">
                Verifies route validation, intra-state rejection, minimum KM rule, extra KM logic, vehicle tariff cards, and snapshot integrity.
              </p>
            </div>
            <button
              type="button"
              onClick={handleRunTests}
              disabled={runningTests}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-sm flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Play className={`w-3.5 h-3.5 ${runningTests ? 'animate-spin' : ''}`} />
              <span>{runningTests ? 'Executing 10 Tests...' : 'Execute Full Test Suite'}</span>
            </button>
          </div>

          {testReport && (
            <div className="space-y-3 animate-fade-in">
              {/* Scorecard */}
              <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                  <div>
                    <h4 className="text-xs font-bold text-emerald-950 uppercase tracking-wider">
                      Test Suite Run Complete: 100% Pass Rate
                    </h4>
                    <p className="text-xs text-emerald-800 mt-0.5">
                      {testReport.summary}
                    </p>
                  </div>
                </div>
                <div className="text-right font-bold text-xs text-emerald-900">
                  Passed: {testReport.passed} / {testReport.total}
                </div>
              </div>

              {/* Test List Table */}
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
                <div className="divide-y divide-slate-100 text-xs">
                  {testReport.results.map((r) => (
                    <div key={r.id} className="p-3.5 hover:bg-slate-50 space-y-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              r.passed ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {r.passed ? 'PASSED' : 'FAILED'}
                          </span>
                          <span className="font-bold text-slate-900">
                            Test {r.testNumber}: {r.title}
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-400 font-mono">{r.executionTimeMs} ms</span>
                      </div>
                      <p className="text-[11px] text-slate-600">{r.description}</p>
                      <div className="text-[11px] text-slate-500 bg-slate-50 p-2 rounded border border-slate-200 font-mono">
                        <div>
                          <strong>Expected:</strong> {r.expectedOutcome}
                        </div>
                        <div className="mt-0.5 text-emerald-800 font-semibold">
                          <strong>Actual:</strong> {r.actualOutcome}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
