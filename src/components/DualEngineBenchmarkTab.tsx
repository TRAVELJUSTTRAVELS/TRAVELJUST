import React, { useState, useEffect } from 'react';
import {
  Zap,
  MapPin,
  Clock,
  Compass,
  ArrowRight,
  TrendingUp,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Car,
  Sliders,
  DollarSign,
  Mountain,
  Navigation,
  Check,
  Layers,
  Sparkles,
  Info,
} from 'lucide-react';
import {
  calculateDualEngineFare,
  calculateDualEngineAllVehicles,
  getActiveFareEngine,
  setActiveFareEngine,
  TARGET_VEHICLES,
  extractDrivingMetrics,
  detectGhatTerrain,
} from '../utils/dualFareEngine';
import {
  BookingTypeCategory,
  DualEngineFareComparison,
  DualEngineVehicleComparison,
  FareEngineType,
  GoogleMapsDrivingMetrics,
} from '../types/dynamicPricing';
import { detectIndianState } from '../utils/dynamicFareEngine';

interface DualEngineBenchmarkTabProps {
  onEngineChanged?: (engine: FareEngineType) => void;
}

export const DualEngineBenchmarkTab: React.FC<DualEngineBenchmarkTabProps> = ({
  onEngineChanged,
}) => {
  // Jurisdiction & Booking Type selection
  const [jurisdiction, setJurisdiction] = useState<'INTRA_STATE' | 'INTER_STATE'>('INTRA_STATE');
  const [intraStateTripType, setIntraStateTripType] = useState<'LOCAL' | 'ONE_WAY' | 'ROUND_TRIP' | 'AIRPORT_TRANSFER'>('ONE_WAY');

  // Active platform engine
  const [activeEngine, setActiveEngineState] = useState<FareEngineType>(getActiveFareEngine());
  const [updatingEngine, setUpdatingEngine] = useState<boolean>(false);

  // Route parameters
  const [origin, setOrigin] = useState<string>('Mysuru Palace, Mysuru, Karnataka');
  const [destination, setDestination] = useState<string>('Bengaluru City Center, Karnataka');
  const [distanceKm, setDistanceKm] = useState<number>(145);
  const [durationMinutes, setDurationMinutes] = useState<number>(180);
  const [roundTripDays, setRoundTripDays] = useState<number>(1);
  const [localHours, setLocalHours] = useState<number>(8);
  const [pickupTime, setPickupTime] = useState<string>('09:00');
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('sedan-4-1');

  // Google Maps API status & metrics
  const [isFetchingGoogleRoute, setIsFetchingGoogleRoute] = useState<boolean>(false);
  const [googleRouteSuccess, setGoogleRouteSuccess] = useState<boolean>(false);
  const [routeError, setRouteError] = useState<string | null>(null);
  const [drivingMetrics, setDrivingMetrics] = useState<GoogleMapsDrivingMetrics | null>(null);

  // Results
  const [comparison, setComparison] = useState<DualEngineFareComparison | null>(null);
  const [allVehicleComparisons, setAllVehicleComparisons] = useState<DualEngineVehicleComparison[]>([]);

  // Effective booking type
  const effectiveBookingType: BookingTypeCategory =
    jurisdiction === 'INTER_STATE' ? 'ONE_WAY' : intraStateTripType;

  // Preset quick route scenarios
  const QUICK_SCENARIOS = [
    {
      title: '1 State · ONEWAY: Mysuru → Bengaluru',
      jurisdiction: 'INTRA_STATE' as const,
      tripType: 'ONE_WAY' as const,
      origin: 'Mysuru Palace, Mysuru, Karnataka',
      destination: 'MG Road, Bengaluru, Karnataka',
      dist: 145,
      dur: 165,
    },
    {
      title: '1 State · LOCAL: Mysuru 8h/80km',
      jurisdiction: 'INTRA_STATE' as const,
      tripType: 'LOCAL' as const,
      origin: 'Mysuru City Center, Karnataka',
      destination: 'Chamundi Hill & Palace Tour',
      dist: 80,
      dur: 480,
      hours: 8,
    },
    {
      title: '1 State · ROUND TRIP: Mysuru ⇄ Coorg (2 Days)',
      jurisdiction: 'INTRA_STATE' as const,
      tripType: 'ROUND_TRIP' as const,
      origin: 'Mysuru, Karnataka',
      destination: 'Madikeri, Coorg, Karnataka',
      dist: 120,
      dur: 190,
      days: 2,
    },
    {
      title: '1 State · AIRPORT: BLR Airport → Mysuru',
      jurisdiction: 'INTRA_STATE' as const,
      tripType: 'AIRPORT_TRANSFER' as const,
      origin: 'Kempegowda Int. Airport Bengaluru (BLR)',
      destination: 'Mysuru City Center, Karnataka',
      dist: 185,
      dur: 200,
    },
    {
      title: '2 Inter-State · ONE WAY: Mysuru (KA) → Ooty (TN)',
      jurisdiction: 'INTER_STATE' as const,
      tripType: 'ONE_WAY' as const,
      origin: 'Mysuru, Karnataka',
      destination: 'Ooty (Udhagamandalam), Tamil Nadu',
      dist: 125,
      dur: 210,
    },
    {
      title: '2 Inter-State · ONE WAY: Bengaluru (KA) → Wayanad (KL)',
      jurisdiction: 'INTER_STATE' as const,
      tripType: 'ONE_WAY' as const,
      origin: 'Bengaluru, Karnataka',
      destination: 'Kalpetta, Wayanad, Kerala',
      dist: 280,
      dur: 380,
    },
  ];

  // Recalculate fares
  const recalculateFares = () => {
    const metrics = extractDrivingMetrics(origin, destination, distanceKm, durationMinutes);
    setDrivingMetrics(metrics);

    const comp = calculateDualEngineFare({
      origin,
      destination,
      distanceKm,
      durationMinutes: effectiveBookingType === 'LOCAL' ? localHours * 60 : durationMinutes,
      bookingType: effectiveBookingType,
      vehicleId: selectedVehicleId,
      roundTripDays,
      pickupTime,
    });
    setComparison(comp);

    const allVehs = calculateDualEngineAllVehicles({
      origin,
      destination,
      distanceKm,
      durationMinutes: effectiveBookingType === 'LOCAL' ? localHours * 60 : durationMinutes,
      bookingType: effectiveBookingType,
      roundTripDays,
      pickupTime,
    });
    setAllVehicleComparisons(allVehs);
  };

  useEffect(() => {
    recalculateFares();
  }, [
    jurisdiction,
    intraStateTripType,
    origin,
    destination,
    distanceKm,
    durationMinutes,
    roundTripDays,
    localHours,
    pickupTime,
    selectedVehicleId,
  ]);

  // Handle switching active engine
  const handleSwitchActiveEngine = async (engine: FareEngineType) => {
    setUpdatingEngine(true);
    try {
      setActiveFareEngine(engine);
      setActiveEngineState(engine);
      // Sync with server
      await fetch('/api/fare/active-engine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ engine }),
      });
      if (onEngineChanged) {
        onEngineChanged(engine);
      }
      recalculateFares();
    } catch (e) {
      console.warn('Failed syncing active engine with server:', e);
    } finally {
      setUpdatingEngine(false);
    }
  };

  // Fetch live route with Google Maps Routes API (Directions v2)
  const fetchLiveGoogleMapsRoute = async () => {
    if (!origin || !destination) {
      setRouteError('Please enter both origin and destination.');
      return;
    }

    setIsFetchingGoogleRoute(true);
    setRouteError(null);
    setGoogleRouteSuccess(false);

    try {
      const res = await fetch('/api/maps/compute-route', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          origin,
          destination,
          tripType: effectiveBookingType,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success || !data.routeInfo) {
        throw new Error(data.error || 'Failed to compute route via Google Maps');
      }

      const info = data.routeInfo;
      const km = info.distanceKm || (info.distanceMeters ? info.distanceMeters / 1000 : distanceKm);
      const mins = info.durationMinutes || (info.durationSeconds ? Math.round(info.durationSeconds / 60) : durationMinutes);

      setDistanceKm(Number(km.toFixed(1)));
      setDurationMinutes(Math.round(mins));
      setGoogleRouteSuccess(true);

      // Auto-detect inter-state vs intra-state
      const origState = detectIndianState(origin);
      const destState = detectIndianState(destination);
      if (origState && destState && origState.toLowerCase().trim() !== destState.toLowerCase().trim()) {
        setJurisdiction('INTER_STATE');
      } else {
        setJurisdiction('INTRA_STATE');
      }
    } catch (err: any) {
      setRouteError(err.message || 'Google Maps Routes API request failed');
    } finally {
      setIsFetchingGoogleRoute(false);
    }
  };

  const isGhat = detectGhatTerrain(origin, destination);
  const detectedOriginState = detectIndianState(origin);
  const detectedDestState = detectIndianState(destination);
  const isInterStateDetected = detectedOriginState.toLowerCase().trim() !== detectedDestState.toLowerCase().trim();

  return (
    <div className="space-y-6">
      {/* Dynamic Price & Fare Engines A & B Master Banner */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 text-white rounded-2xl p-5 sm:p-6 shadow-xl border border-slate-700/60">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold border border-emerald-500/40 flex items-center gap-1.5">
                <Sparkles className="w-3 h-3" />
                Dual Engine Architecture
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-semibold border border-indigo-500/40 flex items-center gap-1.5">
                <Navigation className="w-3 h-3" />
                Google Maps Routes API Driven
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-xs font-semibold border border-amber-500/40">
                Active: {activeEngine === 'ENGINE_A' ? 'Engine A (Commercial Slab)' : 'Engine B (Route Dynamic)'}
              </span>
            </div>
            <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              <Zap className="w-6 h-6 text-emerald-400 fill-emerald-400" />
              Dynamic Price & Fare Engines: Engine A vs Engine B
            </h3>
            <p className="text-sm text-slate-300 max-w-3xl leading-relaxed">
              Compare and toggle between <strong>Engine A (Standard Commercial Slab Engine)</strong> and <strong>Engine B (Live Route & Traffic Dynamic Engine)</strong> across 1 State trips (Local, Oneway, Round Trip, Airport) and 2 Inter-State (One Way only) routes with all 5 mandatory vehicle price rules.
            </p>
          </div>

          {/* Global Active Engine Switcher */}
          <div className="bg-slate-900/90 border border-slate-700 rounded-xl p-3 flex flex-col gap-2 shrink-0 w-full sm:w-auto">
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Set Platform Active Fare Engine:
            </div>
            <div className="inline-flex rounded-lg p-1 bg-slate-800 border border-slate-700">
              <button
                id="select-active-engine-a"
                onClick={() => handleSwitchActiveEngine('ENGINE_A')}
                disabled={updatingEngine}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                  activeEngine === 'ENGINE_A'
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
                }`}
              >
                {activeEngine === 'ENGINE_A' && <Check className="w-3.5 h-3.5" />}
                Engine A: Commercial Slab
              </button>
              <button
                id="select-active-engine-b"
                onClick={() => handleSwitchActiveEngine('ENGINE_B')}
                disabled={updatingEngine}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                  activeEngine === 'ENGINE_B'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
                }`}
              >
                {activeEngine === 'ENGINE_B' && <Check className="w-3.5 h-3.5" />}
                Engine B: Route Dynamic
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Scope Matrix Selector (1 State vs 2 Inter-State) */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Operational Jurisdiction</span>
            <h4 className="text-base font-bold text-slate-900">1. State vs 2. Inter-State Trips</h4>
          </div>

          <div className="inline-flex rounded-lg p-1 bg-slate-100 border border-slate-200">
            <button
              id="jurisdiction-btn-intrastate"
              onClick={() => setJurisdiction('INTRA_STATE')}
              className={`px-3.5 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                jurisdiction === 'INTRA_STATE'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
              }`}
            >
              1. State (Local, Oneway, Round Trip, Airport)
            </button>
            <button
              id="jurisdiction-btn-interstate"
              onClick={() => setJurisdiction('INTER_STATE')}
              className={`px-3.5 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                jurisdiction === 'INTER_STATE'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
              }`}
            >
              2. Inter-State (ONE WAY ONLY)
            </button>
          </div>
        </div>

        {/* 1 State Trip Types */}
        {jurisdiction === 'INTRA_STATE' ? (
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="text-xs font-semibold text-slate-600 mr-2">Trip Types (1 State):</span>
            {(
              [
                { id: 'LOCAL', label: 'LOCAL', desc: '4h/40km, 8h/80km, 12h/120km' },
                { id: 'ONE_WAY', label: 'ONEWAY', desc: 'Point to point drop' },
                { id: 'ROUND_TRIP', label: 'ROUND TRIP', desc: '300 km/day min guarantee' },
                { id: 'AIRPORT_TRANSFER', label: 'AIRPORT', desc: 'Pickup & drop with expressway toll' },
              ] as const
            ).map((t) => (
              <button
                key={t.id}
                onClick={() => setIntraStateTripType(t.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  intraStateTripType === t.id
                    ? 'bg-emerald-100 text-emerald-900 border border-emerald-400 font-bold'
                    : 'bg-slate-50 text-slate-700 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                <span>{t.label}</span>
                <span className="text-[10px] opacity-75 font-normal">({t.desc})</span>
              </button>
            ))}
          </div>
        ) : (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-900 flex items-center gap-2">
            <Info className="w-4 h-4 text-amber-600 shrink-0" />
            <div>
              <strong>Strict Directive Applied:</strong> Inter-State pricing is <strong>strictly for ONE WAY only</strong> (One state to another state, e.g. Karnataka to Tamil Nadu/Kerala/Andhra Pradesh). Inter-State applies empty cab return-haul amortization, commercial state border entry tax, and outstation chauffeur allowance.
            </div>
          </div>
        )}

        {/* Quick Scenario Buttons */}
        <div className="flex items-center gap-2 overflow-x-auto pt-2 pb-1 scrollbar-none">
          <span className="text-xs font-semibold text-slate-500 shrink-0">Quick Routes:</span>
          {QUICK_SCENARIOS.map((sc, idx) => (
            <button
              key={idx}
              onClick={() => {
                setJurisdiction(sc.jurisdiction);
                if (sc.jurisdiction === 'INTRA_STATE') {
                  setIntraStateTripType(sc.tripType);
                }
                setOrigin(sc.origin);
                setDestination(sc.destination);
                setDistanceKm(sc.dist);
                setDurationMinutes(sc.dur);
                if (sc.days) setRoundTripDays(sc.days);
                if (sc.hours) setLocalHours(sc.hours);
              }}
              className="px-2.5 py-1 rounded-md text-[11px] font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 shrink-0 transition-colors cursor-pointer"
            >
              {sc.title}
            </button>
          ))}
        </div>
      </div>

      {/* Google Maps Driving Route Inputs & Computation */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600">
              <MapPin className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900">Google Maps Driving Metrics Input</h4>
              <p className="text-xs text-slate-500">Real-time driving distance, highway duration, live traffic factor & ghat elevation</p>
            </div>
          </div>

          <button
            id="compute-gmaps-routes-btn"
            onClick={fetchLiveGoogleMapsRoute}
            disabled={isFetchingGoogleRoute}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer shadow-xs disabled:opacity-50"
          >
            {isFetchingGoogleRoute ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Navigation className="w-3.5 h-3.5" />
            )}
            <span>{isFetchingGoogleRoute ? 'Querying Google Maps...' : 'Fetch Google Maps Route'}</span>
          </button>
        </div>

        {routeError && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-lg flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{routeError}</span>
          </div>
        )}

        {googleRouteSuccess && (
          <div className="p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-lg flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Google Maps Routes API (Directions v2) successfully returned live highway metrics and terrain classification.</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Origin Location</label>
            <input
              type="text"
              value={origin}
              onChange={(e) => setOrigin(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              placeholder="e.g. Mysuru Palace, Karnataka"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Destination Location</label>
            <input
              type="text"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              placeholder="e.g. Ooty, Tamil Nadu"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Driving Distance (Km)
            </label>
            <input
              type="number"
              value={distanceKm}
              onChange={(e) => setDistanceKm(Math.max(1, Number(e.target.value)))}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Driving Duration (Minutes)
            </label>
            <input
              type="number"
              value={durationMinutes}
              onChange={(e) => setDurationMinutes(Math.max(1, Number(e.target.value)))}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Live Route Intelligence Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5">
            <span className="text-[10px] uppercase font-bold text-slate-500">Route Metric</span>
            <div className="text-sm font-bold text-slate-900 font-mono mt-0.5">
              {distanceKm} km · {Math.floor(durationMinutes / 60)}h {durationMinutes % 60}m
            </div>
          </div>

          <div className={`border rounded-lg p-2.5 ${isInterStateDetected ? 'bg-amber-50 border-amber-200 text-amber-900' : 'bg-emerald-50 border-emerald-200 text-emerald-900'}`}>
            <span className="text-[10px] uppercase font-bold opacity-75">Jurisdiction</span>
            <div className="text-sm font-bold mt-0.5 flex items-center gap-1">
              <Compass className="w-3.5 h-3.5" />
              {isInterStateDetected ? `${detectedOriginState} → ${detectedDestState}` : `Intra-State (${detectedOriginState})`}
            </div>
          </div>

          <div className={`border rounded-lg p-2.5 ${isGhat ? 'bg-indigo-50 border-indigo-200 text-indigo-900' : 'bg-slate-50 border-slate-200 text-slate-700'}`}>
            <span className="text-[10px] uppercase font-bold opacity-75">Terrain Detection</span>
            <div className="text-sm font-bold mt-0.5 flex items-center gap-1">
              <Mountain className="w-3.5 h-3.5" />
              {isGhat ? 'Ghat / Hill Section (1.15x)' : 'Plains / Highway (1.0x)'}
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5">
            <span className="text-[10px] uppercase font-bold text-slate-500">Selected Vehicle</span>
            <select
              value={selectedVehicleId}
              onChange={(e) => setSelectedVehicleId(e.target.value)}
              className="w-full text-xs font-bold text-slate-900 bg-transparent focus:outline-none cursor-pointer mt-0.5"
            >
              {TARGET_VEHICLES.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Side-by-Side Engine A vs Engine B Live Breakdown */}
      {comparison && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* ENGINE A CARD */}
          <div className={`rounded-xl border-2 p-5 transition-all shadow-sm ${
            activeEngine === 'ENGINE_A'
              ? 'bg-emerald-50/40 border-emerald-500 ring-4 ring-emerald-500/10'
              : 'bg-white border-slate-200'
          }`}>
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-sm">
                  A
                </div>
                <div>
                  <h4 className="text-base font-bold text-slate-900">Engine A: Commercial Slab Engine</h4>
                  <p className="text-xs text-slate-500">Standard commercial slabs, tiered km rates & predictable allowances</p>
                </div>
              </div>
              {activeEngine === 'ENGINE_A' ? (
                <span className="px-2.5 py-1 bg-emerald-600 text-white text-[11px] font-bold rounded-full flex items-center gap-1">
                  <Check className="w-3 h-3" /> ACTIVE
                </span>
              ) : (
                <button
                  onClick={() => handleSwitchActiveEngine('ENGINE_A')}
                  className="px-2.5 py-1 bg-slate-100 hover:bg-emerald-100 text-slate-700 hover:text-emerald-800 text-[11px] font-bold rounded-md transition-colors cursor-pointer border border-slate-200"
                >
                  Set Active
                </button>
              )}
            </div>

            <div className="mt-4 flex items-baseline justify-between">
              <div>
                <span className="text-xs text-slate-500">Authoritative Fare</span>
                <div className="text-3xl font-extrabold text-emerald-800 tracking-tight font-mono">
                  ₹{comparison.engineA.totalFare.toLocaleString('en-IN')}
                </div>
              </div>
              <div className="text-right text-xs text-slate-500">
                <div>Model: <span className="font-semibold text-slate-800">{comparison.engineA.pricingModel}</span></div>
                <div>Billable Distance: <span className="font-semibold text-slate-800">{comparison.engineA.billableKm} km</span></div>
              </div>
            </div>

            {/* Breakdown Items */}
            <div className="mt-4 space-y-1.5 border-t border-slate-100 pt-3">
              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Itemized Commercial Slab Breakdown:
              </div>
              {comparison.engineA.fareBreakdown.map((item, i) => (
                <div key={i} className="flex items-center justify-between text-xs py-1 border-b border-slate-50">
                  <div className="text-slate-700">
                    <span>{item.label}</span>
                    {item.detail && <div className="text-[10px] text-slate-400">{item.detail}</div>}
                  </div>
                  <div className="font-mono font-bold text-slate-900">₹{item.amount.toLocaleString('en-IN')}</div>
                </div>
              ))}
            </div>
          </div>

          {/* ENGINE B CARD */}
          <div className={`rounded-xl border-2 p-5 transition-all shadow-sm ${
            activeEngine === 'ENGINE_B'
              ? 'bg-indigo-50/40 border-indigo-500 ring-4 ring-indigo-500/10'
              : 'bg-white border-slate-200'
          }`}>
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-sm">
                  B
                </div>
                <div>
                  <h4 className="text-base font-bold text-slate-900">Engine B: Live Route Dynamic Engine</h4>
                  <p className="text-xs text-slate-500">Traffic-aware duration, ghat terrain index & empty return amortization</p>
                </div>
              </div>
              {activeEngine === 'ENGINE_B' ? (
                <span className="px-2.5 py-1 bg-indigo-600 text-white text-[11px] font-bold rounded-full flex items-center gap-1">
                  <Check className="w-3 h-3" /> ACTIVE
                </span>
              ) : (
                <button
                  onClick={() => handleSwitchActiveEngine('ENGINE_B')}
                  className="px-2.5 py-1 bg-slate-100 hover:bg-indigo-100 text-slate-700 hover:text-indigo-800 text-[11px] font-bold rounded-md transition-colors cursor-pointer border border-slate-200"
                >
                  Set Active
                </button>
              )}
            </div>

            <div className="mt-4 flex items-baseline justify-between">
              <div>
                <span className="text-xs text-slate-500">Authoritative Fare</span>
                <div className="text-3xl font-extrabold text-indigo-800 tracking-tight font-mono">
                  ₹{comparison.engineB.totalFare.toLocaleString('en-IN')}
                </div>
              </div>
              <div className="text-right text-xs text-slate-500">
                <div>Model: <span className="font-semibold text-slate-800">{comparison.engineB.pricingModel}</span></div>
                <div>Route Multiplier: <span className="font-semibold text-indigo-700">{isGhat ? '1.15x (Ghat)' : '1.0x (Standard)'}</span></div>
              </div>
            </div>

            {/* Breakdown Items */}
            <div className="mt-4 space-y-1.5 border-t border-slate-100 pt-3">
              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Itemized Live Route Dynamic Breakdown:
              </div>
              {comparison.engineB.fareBreakdown.map((item, i) => (
                <div key={i} className="flex items-center justify-between text-xs py-1 border-b border-slate-50">
                  <div className="text-slate-700">
                    <span>{item.label}</span>
                    {item.detail && <div className="text-[10px] text-slate-400">{item.detail}</div>}
                  </div>
                  <div className="font-mono font-bold text-slate-900">₹{item.amount.toLocaleString('en-IN')}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 5 Vehicle Comparative Price Rules Matrix Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h4 className="text-sm sm:text-base font-bold text-slate-900">
              5 Target Vehicles Dynamic Price Rules Matrix
            </h4>
            <p className="text-xs text-slate-500">
              Side-by-side fare calculation comparison across Sedan (4+1), SUV (6+1), INNOVA, INNOVA CRYSTA, and TEMPO TRAVELL(12+1)
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">For route:</span>
            <span className="px-2 py-0.5 bg-slate-200 text-slate-800 rounded font-mono text-xs font-semibold">
              {distanceKm} km
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 text-slate-700 font-semibold uppercase text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="p-3.5">Vehicle Type</th>
                <th className="p-3.5">Capacity</th>
                <th className="p-3.5 text-emerald-800">Engine A Fare (Slab)</th>
                <th className="p-3.5 text-indigo-800">Engine B Fare (Dynamic)</th>
                <th className="p-3.5">Difference (₹ / %)</th>
                <th className="p-3.5">Engine B Enhancements</th>
                <th className="p-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {allVehicleComparisons.map((v) => {
                const diff = v.engineBFare - v.engineAFare;
                const pct = v.engineAFare > 0 ? ((diff / v.engineAFare) * 100).toFixed(1) : '0';
                const isSelected = selectedVehicleId === v.vehicleId;
                const vehInfo = TARGET_VEHICLES.find((t) => t.id === v.vehicleId);

                return (
                  <tr
                    key={v.vehicleId}
                    onClick={() => setSelectedVehicleId(v.vehicleId)}
                    className={`hover:bg-slate-50/80 transition-colors cursor-pointer ${
                      isSelected ? 'bg-indigo-50/30 font-medium' : ''
                    }`}
                  >
                    <td className="p-3.5">
                      <div className="flex items-center gap-2">
                        <Car className={`w-4 h-4 ${isSelected ? 'text-indigo-600' : 'text-slate-400'}`} />
                        <div>
                          <span className="font-bold text-slate-900 text-xs">{v.vehicleName}</span>
                          <div className="text-[10px] text-slate-400">{vehInfo?.category}</div>
                        </div>
                      </div>
                    </td>

                    <td className="p-3.5 text-slate-600">
                      <span className="px-2 py-0.5 bg-slate-100 rounded text-[11px] font-medium">
                        {vehInfo?.capacity}
                      </span>
                    </td>

                    <td className="p-3.5 font-mono font-bold text-emerald-800 text-sm">
                      ₹{v.engineAFare.toLocaleString('en-IN')}
                    </td>

                    <td className="p-3.5 font-mono font-bold text-indigo-800 text-sm">
                      ₹{v.engineBFare.toLocaleString('en-IN')}
                    </td>

                    <td className="p-3.5 font-mono">
                      <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                        diff > 0
                          ? 'bg-indigo-50 text-indigo-800 border border-indigo-200'
                          : diff < 0
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          : 'bg-slate-100 text-slate-600'
                      }`}>
                        {diff > 0 ? `+₹${diff}` : diff < 0 ? `-₹${Math.abs(diff)}` : '₹0'} ({diff > 0 ? `+${pct}%` : `${pct}%`})
                      </span>
                    </td>

                    <td className="p-3.5 text-slate-600">
                      <div className="text-[11px]">
                        {jurisdiction === 'INTER_STATE' ? (
                          <span className="text-amber-800 font-semibold">Return Haul + Border Entry</span>
                        ) : isGhat ? (
                          <span className="text-indigo-700 font-semibold">Ghat Gradient + Hairpin Buffer</span>
                        ) : (
                          <span>Live Traffic Congestion Index</span>
                        )}
                      </div>
                    </td>

                    <td className="p-3.5 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedVehicleId(v.vehicleId);
                        }}
                        className={`px-2.5 py-1 rounded text-xs font-semibold transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-indigo-600 text-white'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                        }`}
                      >
                        {isSelected ? 'Inspecting' : 'Inspect'}
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
};
