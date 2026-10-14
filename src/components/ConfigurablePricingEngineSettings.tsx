import React, { useState } from 'react';
import {
  Sliders,
  Save,
  RotateCcw,
  CheckCircle2,
  Car,
  Clock,
  Compass,
  DollarSign,
  Info,
  ShieldCheck,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import {
  pricingConfig,
  getStoredPricingConfig,
  updateStoredPricingConfig,
  resetStoredPricingConfig,
  calculateEstimatedFare,
  FARE_DISCLAIMER,
} from '../config/pricingConfig';
import { vehiclesData } from '../data/vehicles';

interface ConfigurablePricingEngineSettingsProps {
  onSaved?: () => void;
}

export const ConfigurablePricingEngineSettings: React.FC<ConfigurablePricingEngineSettingsProps> = ({
  onSaved,
}) => {
  const [currentConfig, setCurrentConfig] = useState(() => getStoredPricingConfig());
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Live Simulation state
  const [testServiceType, setTestServiceType] = useState<'oneway' | 'local' | 'roundtrip' | 'airport'>('oneway');
  const [testVehicleId, setTestVehicleId] = useState<string>('sedan-4-1');
  const [testDistance, setTestDistance] = useState<number>(140);
  const [testDuration, setTestDuration] = useState<number>(3);
  const [testPassengers, setTestPassengers] = useState<number>(2);
  const [testWaitingHours, setTestWaitingHours] = useState<number>(0);
  const [testExtraStops, setTestExtraStops] = useState<number>(0);
  const [testIsNight, setTestIsNight] = useState<boolean>(false);

  const selectedVehicleObj = vehiclesData.find((v) => v.id === testVehicleId) || vehiclesData[0];

  const liveEstimate = calculateEstimatedFare({
    serviceType: testServiceType,
    vehicleType: selectedVehicleObj,
    distance: testDistance,
    duration: testDuration,
    passengerCount: testPassengers,
    waitingHours: testWaitingHours,
    extraStopsCount: testExtraStops,
    isNightTrip: testIsNight,
    config: currentConfig,
  });

  const handleFieldChange = (field: keyof typeof pricingConfig, value: number) => {
    setCurrentConfig((prev) => ({
      ...prev,
      [field]: isNaN(value) ? 0 : value,
    }));
  };

  const handleSave = () => {
    updateStoredPricingConfig(currentConfig);
    setSaveSuccess(true);
    if (onSaved) onSaved();
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleReset = () => {
    const res = resetStoredPricingConfig();
    setCurrentConfig(res);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  return (
    <div className="space-y-6 p-4 sm:p-6 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-800">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-900 dark:text-emerald-200 text-[10px] font-extrabold uppercase tracking-wider mb-1 border border-emerald-300 dark:border-emerald-700">
            <Sliders className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
            Configurable Pricing Engine
          </div>
          <h3 className="text-lg font-black text-slate-900 dark:text-slate-100">
            Administrator Fare Parameters
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Modify base rates, distance charges, hourly fees, and surcharges. Changes apply in real time to all search and booking estimates.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleReset}
            className="px-3 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Defaults</span>
          </button>

          <button
            type="button"
            onClick={handleSave}
            className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save & Apply</span>
          </button>
        </div>
      </div>

      {saveSuccess && (
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs text-emerald-800 dark:text-emerald-200 font-bold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Configurable pricing engine parameters updated and applied successfully!</span>
        </div>
      )}

      {/* Grid of the 8 Core Configurable Parameters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Base Fare */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-1.5">
          <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
            1. Base Fare (₹)
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">₹</span>
            <input
              type="number"
              min="0"
              value={currentConfig.baseFare}
              onChange={(e) => handleFieldChange('baseFare', parseFloat(e.target.value))}
              className="w-full pl-7 pr-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-bold text-slate-900 dark:text-slate-100 outline-none focus:border-emerald-600"
            />
          </div>
          <p className="text-[10px] text-slate-400">Starting flag-drop fee</p>
        </div>

        {/* 2. Per-Kilometer Fare */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-1.5">
          <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
            2. Per-KM Fare (₹/km)
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">₹</span>
            <input
              type="number"
              min="0"
              step="0.5"
              value={currentConfig.perKmFare}
              onChange={(e) => handleFieldChange('perKmFare', parseFloat(e.target.value))}
              className="w-full pl-7 pr-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-bold text-slate-900 dark:text-slate-100 outline-none focus:border-emerald-600"
            />
          </div>
          <p className="text-[10px] text-slate-400">Standard distance rate per km</p>
        </div>

        {/* 3. Per-Hour Fare */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-1.5">
          <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
            3. Per-Hour Fare (₹/hr)
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">₹</span>
            <input
              type="number"
              min="0"
              value={currentConfig.perHourFare}
              onChange={(e) => handleFieldChange('perHourFare', parseFloat(e.target.value))}
              className="w-full pl-7 pr-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-bold text-slate-900 dark:text-slate-100 outline-none focus:border-emerald-600"
            />
          </div>
          <p className="text-[10px] text-slate-400">Hourly city packages</p>
        </div>

        {/* 4. Airport Surcharge */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-1.5">
          <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
            4. Airport Surcharge (₹)
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">₹</span>
            <input
              type="number"
              min="0"
              value={currentConfig.airportSurcharge}
              onChange={(e) => handleFieldChange('airportSurcharge', parseFloat(e.target.value))}
              className="w-full pl-7 pr-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-bold text-slate-900 dark:text-slate-100 outline-none focus:border-emerald-600"
            />
          </div>
          <p className="text-[10px] text-slate-400">Terminal access & entry toll fee</p>
        </div>

        {/* 5. Waiting Charge */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-1.5">
          <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
            5. Waiting Charge (₹/hr)
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">₹</span>
            <input
              type="number"
              min="0"
              value={currentConfig.waitingCharge ?? currentConfig.waitingChargePerHour}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                handleFieldChange('waitingCharge', val);
                handleFieldChange('waitingChargePerHour', val);
              }}
              className="w-full pl-7 pr-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-bold text-slate-900 dark:text-slate-100 outline-none focus:border-emerald-600"
            />
          </div>
          <p className="text-[10px] text-slate-400">Charge per waiting hour</p>
        </div>

        {/* 6. Additional Passenger Charge */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-1.5">
          <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
            6. Extra Passenger Charge (₹)
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">₹</span>
            <input
              type="number"
              min="0"
              value={currentConfig.additionalPassengerCharge}
              onChange={(e) => handleFieldChange('additionalPassengerCharge', parseFloat(e.target.value))}
              className="w-full pl-7 pr-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-bold text-slate-900 dark:text-slate-100 outline-none focus:border-emerald-600"
            />
          </div>
          <p className="text-[10px] text-slate-400">Fee for passengers above standard seats</p>
        </div>

        {/* 7. Night Charge */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-1.5">
          <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
            7. Night Charge (₹)
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">₹</span>
            <input
              type="number"
              min="0"
              value={currentConfig.nightCharge}
              onChange={(e) => handleFieldChange('nightCharge', parseFloat(e.target.value))}
              className="w-full pl-7 pr-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-bold text-slate-900 dark:text-slate-100 outline-none focus:border-emerald-600"
            />
          </div>
          <p className="text-[10px] text-slate-400">Pickups between 10:00 PM and 6:00 AM</p>
        </div>

        {/* 8. Extra Stop Charge */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-1.5">
          <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
            8. Extra Stop Charge (₹)
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">₹</span>
            <input
              type="number"
              min="0"
              value={currentConfig.extraStopCharge}
              onChange={(e) => handleFieldChange('extraStopCharge', parseFloat(e.target.value))}
              className="w-full pl-7 pr-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-bold text-slate-900 dark:text-slate-100 outline-none focus:border-emerald-600"
            />
          </div>
          <p className="text-[10px] text-slate-400">Per intermediate via detour point</p>
        </div>
      </div>

      {/* Live Calculator Simulation & Formula Validation */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-600" />
            <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">
              Live Fare Calculation Simulator (calculateEstimatedFare)
            </h4>
          </div>
          <span className="text-[11px] font-mono text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950 px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
            Formula Verified
          </span>
        </div>

        {/* Simulation Controls */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 text-xs">
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Service Type</label>
            <select
              value={testServiceType}
              onChange={(e) => setTestServiceType(e.target.value as any)}
              className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-semibold text-slate-800 dark:text-slate-200"
            >
              <option value="oneway">One-Way</option>
              <option value="local">Local City</option>
              <option value="roundtrip">Round Trip</option>
              <option value="airport">Airport Transfer</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Vehicle</label>
            <select
              value={testVehicleId}
              onChange={(e) => setTestVehicleId(e.target.value)}
              className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-semibold text-slate-800 dark:text-slate-200"
            >
              {vehiclesData.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Distance (km)</label>
            <input
              type="number"
              min="10"
              value={testDistance}
              onChange={(e) => setTestDistance(Math.max(1, parseInt(e.target.value) || 0))}
              className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold text-slate-800 dark:text-slate-200"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Duration (hrs)</label>
            <input
              type="number"
              min="1"
              value={testDuration}
              onChange={(e) => setTestDuration(Math.max(1, parseInt(e.target.value) || 0))}
              className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold text-slate-800 dark:text-slate-200"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Passengers</label>
            <input
              type="number"
              min="1"
              max="20"
              value={testPassengers}
              onChange={(e) => setTestPassengers(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold text-slate-800 dark:text-slate-200"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Waiting (hrs)</label>
            <input
              type="number"
              min="0"
              value={testWaitingHours}
              onChange={(e) => setTestWaitingHours(Math.max(0, parseInt(e.target.value) || 0))}
              className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold text-slate-800 dark:text-slate-200"
            />
          </div>

          <div className="flex flex-col justify-end">
            <label className="flex items-center gap-2 text-[11px] font-bold text-slate-700 dark:text-slate-300 cursor-pointer pb-2">
              <input
                type="checkbox"
                checked={testIsNight}
                onChange={(e) => setTestIsNight(e.target.checked)}
                className="w-4 h-4 rounded text-emerald-600"
              />
              <span>Night Trip</span>
            </label>
          </div>
        </div>

        {/* Live Calculation Output Card */}
        <div className="p-4 bg-emerald-950 text-white rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 block">
              Estimated Fare (Simulated Output)
            </span>
            <div className="text-3xl font-black text-white mt-0.5">
              ₹{liveEstimate.totalEstimatedFare}
            </div>
            <p className="text-[11px] text-emerald-200 mt-1">
              {liveEstimate.breakdown.map((b) => `${b.label}: ₹${b.amount}`).join(' • ')}
            </p>
          </div>

          <div className="max-w-xs text-right text-[11px] text-slate-300">
            <span className="text-amber-400 font-bold block mb-0.5">Canonical Disclaimer:</span>
            <span className="italic leading-tight block">{liveEstimate.disclaimer || FARE_DISCLAIMER}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
