import React, { useState, useEffect } from 'react';
import {
  X,
  Sliders,
  Check,
  RotateCcw,
  Car,
  Calculator,
  Table,
  Zap,
  Clock,
  Sparkles,
  Info,
  ChevronRight,
  TrendingUp,
  MapPin,
  Calendar,
  Layers,
  Bell,
  MessageSquare,
  ExternalLink,
  Phone,
  User,
  ShieldCheck,
  RefreshCw,
  FileCheck,
  Building,
  Smartphone,
  Send,
} from 'lucide-react';
import { PricingConfig, VehiclePricingConfig, CustomerLoginNotification, DriverPartnerApplication, SmsDispatchRecord, SmsGatewayConfig } from '../types';
import { vehiclesData } from '../data/vehicles';
import { defaultPricingConfig, siteConfig } from '../config/siteConfig';
import { ROUND_TRIP_TIERS } from '../utils/fareCalculator';
import { getOwnerLoginNotifications, openWhatsAppChat } from '../utils/whatsapp';
import { getPartnerApplications, updatePartnerApplicationStatus, formatPartnerWhatsAppMessage } from '../services/driverPartnerService';
import { getLocalSmsDispatches, fetchSmsGatewayStatus, sendTestSms } from '../services/smsService';

interface PriceFareEngineDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  pricingConfig: PricingConfig;
  onUpdatePricing: (newConfig: PricingConfig) => void;
}

export const PriceFareEngineDrawer: React.FC<PriceFareEngineDrawerProps> = ({
  isOpen,
  onClose,
  pricingConfig,
  onUpdatePricing,
}) => {
  const [activeTab, setActiveTab] = useState<'vehicles' | 'matrix' | 'multiday' | 'simulator' | 'logins' | 'partners' | 'sms'>('vehicles');
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>(vehiclesData[0].id);
  const [copiedNotification, setCopiedNotification] = useState<string | null>(null);
  const [loginAlerts, setLoginAlerts] = useState<CustomerLoginNotification[]>([]);
  const [partnerApps, setPartnerApps] = useState<DriverPartnerApplication[]>([]);
  const [smsDispatches, setSmsDispatches] = useState<SmsDispatchRecord[]>([]);
  const [smsGatewayInfo, setSmsGatewayInfo] = useState<SmsGatewayConfig | null>(null);
  const [testMobileNumber, setTestMobileNumber] = useState<string>('');
  const [testCustomMessage, setTestCustomMessage] = useState<string>('');
  const [isSendingTestSms, setIsSendingTestSms] = useState<boolean>(false);
  const [testSmsFeedback, setTestSmsFeedback] = useState<{ success: boolean; message: string } | null>(null);

  const refreshSmsData = async () => {
    setSmsDispatches(getLocalSmsDispatches());
    try {
      const config = await fetchSmsGatewayStatus();
      setSmsGatewayInfo(config);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    if (isOpen) {
      setLoginAlerts(getOwnerLoginNotifications());
      setPartnerApps(getPartnerApplications());
      refreshSmsData();
    }
  }, [isOpen, activeTab]);

  const refreshLoginAlerts = () => {
    setLoginAlerts(getOwnerLoginNotifications());
  };

  const refreshPartnerApps = () => {
    setPartnerApps(getPartnerApplications());
  };

  const handleSendTestSms = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testMobileNumber.trim()) return;
    setIsSendingTestSms(true);
    setTestSmsFeedback(null);
    try {
      const res = await sendTestSms(
        testMobileNumber.trim(),
        testCustomMessage.trim() || undefined
      );
      if (res.success) {
        setTestSmsFeedback({
          success: true,
          message: `SMS dispatched successfully! Status: ${res.status.toUpperCase()} (${res.provider}).`,
        });
        refreshSmsData();
      } else {
        setTestSmsFeedback({
          success: false,
          message: res.error || 'Failed to dispatch test SMS.',
        });
      }
    } catch (err: any) {
      setTestSmsFeedback({
        success: false,
        message: err?.message || 'Network error sending test SMS.',
      });
    } finally {
      setIsSendingTestSms(false);
    }
  };

  const handlePartnerStatusChange = (id: string, status: DriverPartnerApplication['status']) => {
    const updated = updatePartnerApplicationStatus(id, status);
    setPartnerApps(updated);
  };

  // Local draft state for modifying rates
  const [draftConfig, setDraftConfig] = useState<PricingConfig>(pricingConfig);

  // Simulator state
  const [simServiceType, setSimServiceType] = useState<'oneway' | 'roundtrip' | 'local' | 'airport'>('oneway');
  const [simDistance, setSimDistance] = useState<number>(150);
  const [simRoundTripDays, setSimRoundTripDays] = useState<number>(1);
  const [simHours, setSimHours] = useState<number>(8);
  const [simIsNight, setSimIsNight] = useState<boolean>(false);

  if (!isOpen) return null;

  const currentVehicle = vehiclesData.find((v) => v.id === selectedVehicleId) || vehiclesData[0];
  const currentVPricing: VehiclePricingConfig = draftConfig.vehiclePricing?.[selectedVehicleId] || {
    vehicleId: selectedVehicleId,
    baseFare: Math.round(draftConfig.baseFare * currentVehicle.basePriceFactor),
    localPerKmRate: Number((12.0 * currentVehicle.basePriceFactor).toFixed(1)),
    localDriverAllowance: Math.round(250 * currentVehicle.basePriceFactor),
    oneWayPerKmRate: Number((13.5 * currentVehicle.basePriceFactor).toFixed(1)),
    oneWayDriverAllowance: Math.round(300 * currentVehicle.basePriceFactor),
    airportPerKmRate: Number((13.5 * currentVehicle.basePriceFactor).toFixed(1)),
    airportDriverAllowance: Math.round(250 * currentVehicle.basePriceFactor),
    perKmFare: Number((draftConfig.perKmFare * currentVehicle.basePriceFactor).toFixed(1)),
    perHourFare: Math.round(draftConfig.perHourFare * currentVehicle.basePriceFactor),
    driverAllowancePerDay: Math.round(350 * currentVehicle.basePriceFactor),
    airportBaseFare: Math.round(799 * currentVehicle.basePriceFactor),
    minKmPerDay: 250,
    nightChargePercentage: 10,
  };

  const handleUpdateCurrentVehicle = (field: keyof VehiclePricingConfig, value: number) => {
    const updatedVehiclePricing = {
      ...draftConfig.vehiclePricing,
      [selectedVehicleId]: {
        ...currentVPricing,
        [field]: value,
      },
    };

    const newConfig = {
      ...draftConfig,
      vehiclePricing: updatedVehiclePricing,
    };

    setDraftConfig(newConfig);
  };

  const handleApplyPreset = (presetName: string) => {
    let multiplier = 1.0;
    if (presetName === 'peak') multiplier = 1.15;
    if (presetName === 'discount') multiplier = 0.90;
    if (presetName === 'corporate') multiplier = 0.95;

    const updatedVehiclePricing: Record<string, VehiclePricingConfig> = {};
    
    Object.keys(defaultPricingConfig.vehiclePricing).forEach((vId) => {
      const def = defaultPricingConfig.vehiclePricing[vId];
      updatedVehiclePricing[vId] = {
        ...def,
        localPerKmRate: Number((def.localPerKmRate * multiplier).toFixed(1)),
        localDriverAllowance: Math.round(def.localDriverAllowance * multiplier),
        oneWayPerKmRate: Number((def.oneWayPerKmRate * multiplier).toFixed(1)),
        oneWayDriverAllowance: Math.round(def.oneWayDriverAllowance * multiplier),
        airportPerKmRate: Number((def.airportPerKmRate * multiplier).toFixed(1)),
        airportDriverAllowance: Math.round(def.airportDriverAllowance * multiplier),
        perKmFare: Number((def.perKmFare * multiplier).toFixed(1)),
        baseFare: Math.round(def.baseFare * multiplier),
        perHourFare: Math.round(def.perHourFare * multiplier),
        airportBaseFare: Math.round(def.airportBaseFare * multiplier),
        driverAllowancePerDay: Math.round(def.driverAllowancePerDay * multiplier),
      };
    });

    const newConfig = {
      ...draftConfig,
      vehiclePricing: updatedVehiclePricing,
    };

    setDraftConfig(newConfig);
    showNotice(`Applied "${presetName.toUpperCase()}" Preset to All Vehicles!`);
  };

  const handleResetToDefaults = () => {
    setDraftConfig(defaultPricingConfig);
    showNotice('Reset all vehicle rates to factory defaults.');
  };

  const handleSaveAndApply = () => {
    onUpdatePricing(draftConfig);
    showNotice('Rates Applied Live to Website!');
    setTimeout(() => {
      onClose();
    }, 600);
  };

  const showNotice = (msg: string) => {
    setCopiedNotification(msg);
    setTimeout(() => setCopiedNotification(null), 2500);
  };

  // Helper calculation for simulator / preview
  const calculateSimulatedFare = (vId: string) => {
    const v = vehiclesData.find((item) => item.id === vId) || vehiclesData[0];
    const vp = draftConfig.vehiclePricing?.[vId] || defaultPricingConfig.vehiclePricing[vId] || {
      baseFare: 300,
      localPerKmRate: 12,
      localDriverAllowance: 250,
      oneWayPerKmRate: 13.5,
      oneWayDriverAllowance: 300,
      airportPerKmRate: 13.5,
      airportDriverAllowance: 250,
      perKmFare: 12,
      perHourFare: 150,
      driverAllowancePerDay: 300,
      airportBaseFare: 699,
      minKmPerDay: 250,
      nightChargePercentage: 10,
    };

    let base = vp.baseFare;
    let distCharge = 0;
    let durCharge = 0;
    let airportCharge = 0;

    if (simServiceType === 'oneway') {
      const rate = vp.oneWayPerKmRate || vp.perKmFare;
      distCharge = simDistance * rate;
      durCharge = vp.oneWayDriverAllowance || 0;
    } else if (simServiceType === 'roundtrip') {
      const days = simRoundTripDays || 1;
      const minKm = days * 300;
      const billedKm = Math.max(simDistance * 2, minKm);
      distCharge = billedKm * vp.perKmFare;
      durCharge = days * vp.driverAllowancePerDay;
    } else if (simServiceType === 'local') {
      durCharge = simHours * vp.perHourFare + (vp.localDriverAllowance || 0);
      const includedKm = simHours * 10;
      if (simDistance > includedKm) {
        const rate = vp.localPerKmRate || vp.perKmFare;
        distCharge = (simDistance - includedKm) * rate;
      }
    } else if (simServiceType === 'airport') {
      const rate = vp.airportPerKmRate || vp.perKmFare;
      const calculated = Math.round(simDistance * rate);
      airportCharge = Math.max(vp.airportBaseFare, calculated);
      durCharge = vp.airportDriverAllowance || 0;
    }

    let subtotal = base + distCharge + durCharge + airportCharge;
    if (simIsNight) {
      subtotal += Math.round((subtotal * (vp.nightChargePercentage || 10)) / 100);
    }

    return Math.round(subtotal);
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-2xl h-full shadow-2xl border-l border-slate-200 flex flex-col justify-between overflow-hidden">
        {/* Header Bar */}
        <div className="p-5 sm:p-6 bg-slate-900 text-white border-b border-slate-800 shrink-0">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <Sliders className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-extrabold text-lg sm:text-xl text-white">
                    Dynamic Price & Fare Engine
                  </h3>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-bold text-[10px] uppercase">
                    Live
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Set unique Per KM, Base, and Hourly rates for each vehicle type
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
              aria-label="Close Fare Engine"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Toast Notice */}
          {copiedNotification && (
            <div className="mt-3 p-2 bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-semibold rounded-lg flex items-center gap-2 animate-in fade-in">
              <Check className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{copiedNotification}</span>
            </div>
          )}

          {/* Navigation Tabs */}
          <div className="flex items-center gap-1.5 mt-5 border-b border-slate-800 pb-0 overflow-x-auto">
            <button
              onClick={() => setActiveTab('vehicles')}
              className={`pb-3 px-2.5 text-xs sm:text-sm font-bold flex items-center gap-1.5 border-b-2 transition-all whitespace-nowrap ${
                activeTab === 'vehicles'
                  ? 'border-emerald-400 text-emerald-300'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Car className="w-4 h-4" />
              Vehicle Rates
            </button>
            <button
              onClick={() => setActiveTab('matrix')}
              className={`pb-3 px-2.5 text-xs sm:text-sm font-bold flex items-center gap-1.5 border-b-2 transition-all whitespace-nowrap ${
                activeTab === 'matrix'
                  ? 'border-emerald-400 text-emerald-300'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Table className="w-4 h-4" />
              Fleet Matrix
            </button>
            <button
              onClick={() => setActiveTab('multiday')}
              className={`pb-3 px-2.5 text-xs sm:text-sm font-bold flex items-center gap-1.5 border-b-2 transition-all whitespace-nowrap ${
                activeTab === 'multiday'
                  ? 'border-emerald-400 text-emerald-300'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Sparkles className="w-4 h-4 text-emerald-400" />
              Multi-Day Round Trip (1-10D)
            </button>
            <button
              onClick={() => setActiveTab('simulator')}
              className={`pb-3 px-2.5 text-xs sm:text-sm font-bold flex items-center gap-1.5 border-b-2 transition-all whitespace-nowrap ${
                activeTab === 'simulator'
                  ? 'border-emerald-400 text-emerald-300'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Calculator className="w-4 h-4" />
              Fare Simulator
            </button>
            <button
              onClick={() => {
                setActiveTab('logins');
                refreshLoginAlerts();
              }}
              className={`pb-3 px-2.5 text-xs sm:text-sm font-bold flex items-center gap-1.5 border-b-2 transition-all whitespace-nowrap relative ${
                activeTab === 'logins'
                  ? 'border-emerald-400 text-emerald-300'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <MessageSquare className="w-4 h-4 text-emerald-400" />
              <span>Customer Logins</span>
              {loginAlerts.length > 0 && (
                <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-extrabold bg-emerald-500 text-slate-950">
                  {loginAlerts.length}
                </span>
              )}
            </button>
            <button
              onClick={() => {
                setActiveTab('partners');
                refreshPartnerApps();
              }}
              className={`pb-3 px-2.5 text-xs sm:text-sm font-bold flex items-center gap-1.5 border-b-2 transition-all whitespace-nowrap relative ${
                activeTab === 'partners'
                  ? 'border-emerald-400 text-emerald-300'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Car className="w-4 h-4 text-amber-400" />
              <span>Cab Inquiries & Partners</span>
              {partnerApps.length > 0 && (
                <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-extrabold bg-amber-400 text-slate-950">
                  {partnerApps.length}
                </span>
              )}
            </button>
            <button
              onClick={() => {
                setActiveTab('sms');
                refreshSmsData();
              }}
              className={`pb-3 px-2.5 text-xs sm:text-sm font-bold flex items-center gap-1.5 border-b-2 transition-all whitespace-nowrap relative ${
                activeTab === 'sms'
                  ? 'border-emerald-400 text-emerald-300'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Smartphone className="w-4 h-4 text-sky-400" />
              <span>SMS Gateway</span>
              {smsDispatches.length > 0 && (
                <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-extrabold bg-sky-400 text-slate-950">
                  {smsDispatches.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6 bg-slate-50">
          {/* Quick Presets Bar */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-500" />
                Quick Rate Presets
              </span>
              <button
                onClick={handleResetToDefaults}
                className="text-xs font-semibold text-slate-500 hover:text-slate-800 flex items-center gap-1 transition-colors"
              >
                <RotateCcw className="w-3 h-3" /> Reset Defaults
              </button>
            </div>
            <div className="flex flex-wrap gap-2 pt-1">
              <button
                onClick={() => handleApplyPreset('standard')}
                className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors"
              >
                Standard Economy
              </button>
              <button
                onClick={() => handleApplyPreset('peak')}
                className="px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 font-semibold text-xs transition-colors flex items-center gap-1"
              >
                <TrendingUp className="w-3 h-3 text-amber-600" /> Peak Season (+15%)
              </button>
              <button
                onClick={() => handleApplyPreset('discount')}
                className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 font-semibold text-xs transition-colors"
              >
                Off-Peak Promo (-10%)
              </button>
              <button
                onClick={() => handleApplyPreset('corporate')}
                className="px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-200 font-semibold text-xs transition-colors"
              >
                Corporate Plan (-5%)
              </button>
            </div>
          </div>

          {/* TAB 1: VEHICLE-SPECIFIC RATE CUSTOMIZER */}
          {activeTab === 'vehicles' && (
            <div className="space-y-5">
              {/* Vehicle Horizontal Selector Pills */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Select Vehicle to Configure
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                  {vehiclesData.map((v) => {
                    const isSelected = v.id === selectedVehicleId;
                    const vRate = draftConfig.vehiclePricing?.[v.id]?.perKmFare || 12;
                    return (
                      <button
                        key={v.id}
                        onClick={() => setSelectedVehicleId(v.id)}
                        className={`p-3 rounded-2xl text-left border transition-all flex flex-col justify-between gap-1.5 ${
                          isSelected
                            ? 'bg-emerald-900 text-white border-emerald-900 shadow-md ring-2 ring-emerald-600/30'
                            : 'bg-white text-slate-800 border-slate-200 hover:border-emerald-500/50 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <Car className={`w-4 h-4 ${isSelected ? 'text-emerald-300' : 'text-slate-400'}`} />
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                            isSelected ? 'bg-emerald-800 text-emerald-200' : 'bg-slate-100 text-slate-600'
                          }`}>
                            {v.category.split(' ')[0]}
                          </span>
                        </div>
                        <span className="font-extrabold text-xs truncate block">
                          {v.name}
                        </span>
                        <div className="flex items-center justify-between text-[11px] pt-1 border-t border-current/10">
                          <span className="opacity-80">Rate:</span>
                          <span className="font-bold">₹{vRate}/km</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Selected Vehicle Configuration Card */}
              <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-xs space-y-6">
                <div className="flex items-start justify-between border-b border-slate-100 pb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-lg font-extrabold text-slate-900">
                        {currentVehicle.name}
                      </h4>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 text-xs font-bold">
                        {currentVehicle.comfortLevel}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {currentVehicle.seatingCapacity} Seater • {currentVehicle.category}
                    </p>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                      Effective Rate
                    </span>
                    <span className="text-xl font-extrabold text-emerald-800">
                      ₹{currentVPricing.perKmFare}
                      <span className="text-xs font-medium text-slate-500"> / km</span>
                    </span>
                  </div>
                </div>

                {/* Form Controls Categorized Sections */}
                <div className="space-y-6">
                  {/* SECTION 1: Local City Package Rates */}
                  <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 sm:p-5 space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs">
                          🏙️
                        </div>
                        <h5 className="font-extrabold text-sm text-slate-900">
                          Local City Package Rates
                        </h5>
                      </div>
                      <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60">
                        Hourly + Extra KM + Bata
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {/* Local Package Per KM Rate */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between items-center text-xs">
                          <label className="font-bold text-slate-700">
                            Extra KM Rate (Local Package)
                          </label>
                          <span className="font-extrabold text-emerald-800 bg-white px-2 py-0.5 rounded shadow-2xs">
                            ₹{currentVPricing.localPerKmRate || currentVPricing.perKmFare} / km
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="range"
                            min="8"
                            max="45"
                            step="0.5"
                            value={currentVPricing.localPerKmRate || currentVPricing.perKmFare}
                            onChange={(e) =>
                              handleUpdateCurrentVehicle('localPerKmRate', parseFloat(e.target.value))
                            }
                            className="flex-1 accent-emerald-800 h-2 bg-slate-200 rounded-lg cursor-pointer"
                          />
                          <input
                            type="number"
                            step="0.5"
                            value={currentVPricing.localPerKmRate || currentVPricing.perKmFare}
                            onChange={(e) =>
                              handleUpdateCurrentVehicle('localPerKmRate', parseFloat(e.target.value) || 0)
                            }
                            className="w-18 px-2 py-1 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 text-center"
                          />
                        </div>
                        <p className="text-[10px] text-slate-500">
                          Extra KM billing rate applied when local travel exceeds package km limit.
                        </p>
                      </div>

                      {/* Local Driver Allowance */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between items-center text-xs">
                          <label className="font-bold text-slate-700">
                            Local Driver Allowance
                          </label>
                          <span className="font-extrabold text-emerald-800 bg-white px-2 py-0.5 rounded shadow-2xs">
                            ₹{currentVPricing.localDriverAllowance || 0}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="range"
                            min="0"
                            max="800"
                            step="50"
                            value={currentVPricing.localDriverAllowance || 0}
                            onChange={(e) =>
                              handleUpdateCurrentVehicle('localDriverAllowance', parseInt(e.target.value, 10))
                            }
                            className="flex-1 accent-emerald-800 h-2 bg-slate-200 rounded-lg cursor-pointer"
                          />
                          <input
                            type="number"
                            step="50"
                            value={currentVPricing.localDriverAllowance || 0}
                            onChange={(e) =>
                              handleUpdateCurrentVehicle('localDriverAllowance', parseInt(e.target.value, 10) || 0)
                            }
                            className="w-18 px-2 py-1 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 text-center"
                          />
                        </div>
                        <p className="text-[10px] text-slate-500">
                          Local package driver allowance / duty bata per assignment.
                        </p>
                      </div>

                      {/* Hourly Rate */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between items-center text-xs">
                          <label className="font-bold text-slate-700">
                            Package Hourly Rate
                          </label>
                          <span className="font-extrabold text-emerald-800 bg-white px-2 py-0.5 rounded shadow-2xs">
                            ₹{currentVPricing.perHourFare} / hr
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="range"
                            min="100"
                            max="600"
                            step="10"
                            value={currentVPricing.perHourFare}
                            onChange={(e) =>
                              handleUpdateCurrentVehicle('perHourFare', parseInt(e.target.value, 10))
                            }
                            className="flex-1 accent-emerald-800 h-2 bg-slate-200 rounded-lg cursor-pointer"
                          />
                          <input
                            type="number"
                            value={currentVPricing.perHourFare}
                            onChange={(e) =>
                              handleUpdateCurrentVehicle('perHourFare', parseInt(e.target.value, 10) || 0)
                            }
                            className="w-18 px-2 py-1 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 text-center"
                          />
                        </div>
                        <p className="text-[10px] text-slate-500">
                          Calculates 4hr, 8hr, and 12hr city rental packages.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* SECTION 2: Outstation One-Way Drop Rates */}
                  <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 sm:p-5 space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs">
                          ➡️
                        </div>
                        <h5 className="font-extrabold text-sm text-slate-900">
                          One-Way Drop Rates
                        </h5>
                      </div>
                      <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60">
                        Point-to-Point Drop
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* One Way Per KM Rate */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between items-center text-xs">
                          <label className="font-bold text-slate-700">
                            One Way per KM Rate
                          </label>
                          <span className="font-extrabold text-emerald-800 bg-white px-2 py-0.5 rounded shadow-2xs">
                            ₹{currentVPricing.oneWayPerKmRate || currentVPricing.perKmFare} / km
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="range"
                            min="9"
                            max="45"
                            step="0.5"
                            value={currentVPricing.oneWayPerKmRate || currentVPricing.perKmFare}
                            onChange={(e) =>
                              handleUpdateCurrentVehicle('oneWayPerKmRate', parseFloat(e.target.value))
                            }
                            className="flex-1 accent-emerald-800 h-2 bg-slate-200 rounded-lg cursor-pointer"
                          />
                          <input
                            type="number"
                            step="0.5"
                            value={currentVPricing.oneWayPerKmRate || currentVPricing.perKmFare}
                            onChange={(e) =>
                              handleUpdateCurrentVehicle('oneWayPerKmRate', parseFloat(e.target.value) || 0)
                            }
                            className="w-18 px-2 py-1 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 text-center"
                          />
                        </div>
                        <p className="text-[10px] text-slate-500">
                          Dedicated per kilometre running tariff for one-way intercity drops.
                        </p>
                      </div>

                      {/* One Way Driver Allowance */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between items-center text-xs">
                          <label className="font-bold text-slate-700">
                            One Way Driver Allowance
                          </label>
                          <span className="font-extrabold text-emerald-800 bg-white px-2 py-0.5 rounded shadow-2xs">
                            ₹{currentVPricing.oneWayDriverAllowance || 0}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="range"
                            min="0"
                            max="1000"
                            step="50"
                            value={currentVPricing.oneWayDriverAllowance || 0}
                            onChange={(e) =>
                              handleUpdateCurrentVehicle('oneWayDriverAllowance', parseInt(e.target.value, 10))
                            }
                            className="flex-1 accent-emerald-800 h-2 bg-slate-200 rounded-lg cursor-pointer"
                          />
                          <input
                            type="number"
                            step="50"
                            value={currentVPricing.oneWayDriverAllowance || 0}
                            onChange={(e) =>
                              handleUpdateCurrentVehicle('oneWayDriverAllowance', parseInt(e.target.value, 10) || 0)
                            }
                            className="w-18 px-2 py-1 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 text-center"
                          />
                        </div>
                        <p className="text-[10px] text-slate-500">
                          One-way chauffeur allowance / meal bata for single leg outstation.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* SECTION 3: Airport Transfer Rates */}
                  <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 sm:p-5 space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs">
                          ✈️
                        </div>
                        <h5 className="font-extrabold text-sm text-slate-900">
                          Airport Transfer Rates
                        </h5>
                      </div>
                      <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60">
                        Airport Pickup & Drop
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {/* Airport Transfer per KM Rate */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between items-center text-xs">
                          <label className="font-bold text-slate-700">
                            Airport Transfer per KM Rate
                          </label>
                          <span className="font-extrabold text-emerald-800 bg-white px-2 py-0.5 rounded shadow-2xs">
                            ₹{currentVPricing.airportPerKmRate || currentVPricing.perKmFare} / km
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="range"
                            min="9"
                            max="45"
                            step="0.5"
                            value={currentVPricing.airportPerKmRate || currentVPricing.perKmFare}
                            onChange={(e) =>
                              handleUpdateCurrentVehicle('airportPerKmRate', parseFloat(e.target.value))
                            }
                            className="flex-1 accent-emerald-800 h-2 bg-slate-200 rounded-lg cursor-pointer"
                          />
                          <input
                            type="number"
                            step="0.5"
                            value={currentVPricing.airportPerKmRate || currentVPricing.perKmFare}
                            onChange={(e) =>
                              handleUpdateCurrentVehicle('airportPerKmRate', parseFloat(e.target.value) || 0)
                            }
                            className="w-18 px-2 py-1 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 text-center"
                          />
                        </div>
                        <p className="text-[10px] text-slate-500">
                          Distance running charge for airport corridor routes.
                        </p>
                      </div>

                      {/* Airport Transfer Driver Allowance */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between items-center text-xs">
                          <label className="font-bold text-slate-700">
                            Airport Transfer Driver Allowance
                          </label>
                          <span className="font-extrabold text-emerald-800 bg-white px-2 py-0.5 rounded shadow-2xs">
                            ₹{currentVPricing.airportDriverAllowance || 0}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="range"
                            min="0"
                            max="800"
                            step="50"
                            value={currentVPricing.airportDriverAllowance || 0}
                            onChange={(e) =>
                              handleUpdateCurrentVehicle('airportDriverAllowance', parseInt(e.target.value, 10))
                            }
                            className="flex-1 accent-emerald-800 h-2 bg-slate-200 rounded-lg cursor-pointer"
                          />
                          <input
                            type="number"
                            step="50"
                            value={currentVPricing.airportDriverAllowance || 0}
                            onChange={(e) =>
                              handleUpdateCurrentVehicle('airportDriverAllowance', parseInt(e.target.value, 10) || 0)
                            }
                            className="w-18 px-2 py-1 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 text-center"
                          />
                        </div>
                        <p className="text-[10px] text-slate-500">
                          Chauffeur airport terminal duty & parking assistance bata.
                        </p>
                      </div>

                      {/* Airport Base Corridor Minimum Fare */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between items-center text-xs">
                          <label className="font-bold text-slate-700">
                            Airport Base Min. Fare
                          </label>
                          <span className="font-extrabold text-emerald-800 bg-white px-2 py-0.5 rounded shadow-2xs">
                            ₹{currentVPricing.airportBaseFare}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="range"
                            min="400"
                            max="3500"
                            step="50"
                            value={currentVPricing.airportBaseFare}
                            onChange={(e) =>
                              handleUpdateCurrentVehicle('airportBaseFare', parseInt(e.target.value, 10))
                            }
                            className="flex-1 accent-emerald-800 h-2 bg-slate-200 rounded-lg cursor-pointer"
                          />
                          <input
                            type="number"
                            value={currentVPricing.airportBaseFare}
                            onChange={(e) =>
                              handleUpdateCurrentVehicle('airportBaseFare', parseInt(e.target.value, 10) || 0)
                            }
                            className="w-18 px-2 py-1 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 text-center"
                          />
                        </div>
                        <p className="text-[10px] text-slate-500">
                          Guaranteed baseline airport corridor trip minimum fare.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* SECTION 4: Roundtrip Outstation & General Base */}
                  <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 sm:p-5 space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs">
                          🔁
                        </div>
                        <h5 className="font-extrabold text-sm text-slate-900">
                          Round Trip & Base Dispatch Rules
                        </h5>
                      </div>
                      <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60">
                        Multi-Day Outstation
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {/* Roundtrip Per KM */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between items-center text-xs">
                          <label className="font-bold text-slate-700">
                            Roundtrip Per KM Rate
                          </label>
                          <span className="font-extrabold text-emerald-800 bg-white px-2 py-0.5 rounded shadow-2xs">
                            ₹{currentVPricing.perKmFare} / km
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="range"
                            min="9"
                            max="40"
                            step="0.5"
                            value={currentVPricing.perKmFare}
                            onChange={(e) =>
                              handleUpdateCurrentVehicle('perKmFare', parseFloat(e.target.value))
                            }
                            className="flex-1 accent-emerald-800 h-2 bg-slate-200 rounded-lg cursor-pointer"
                          />
                          <input
                            type="number"
                            step="0.5"
                            value={currentVPricing.perKmFare}
                            onChange={(e) =>
                              handleUpdateCurrentVehicle('perKmFare', parseFloat(e.target.value) || 0)
                            }
                            className="w-18 px-2 py-1 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 text-center"
                          />
                        </div>
                        <p className="text-[10px] text-slate-500">
                          Billed for outstation round trip mileage.
                        </p>
                      </div>

                      {/* Driver Day Allowance (Bata) */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between items-center text-xs">
                          <label className="font-bold text-slate-700">
                            Roundtrip Chauffeur Day Bata
                          </label>
                          <span className="font-extrabold text-emerald-800 bg-white px-2 py-0.5 rounded shadow-2xs">
                            ₹{currentVPricing.driverAllowancePerDay} / day
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="range"
                            min="200"
                            max="1000"
                            step="50"
                            value={currentVPricing.driverAllowancePerDay}
                            onChange={(e) =>
                              handleUpdateCurrentVehicle('driverAllowancePerDay', parseInt(e.target.value, 10))
                            }
                            className="flex-1 accent-emerald-800 h-2 bg-slate-200 rounded-lg cursor-pointer"
                          />
                          <input
                            type="number"
                            value={currentVPricing.driverAllowancePerDay}
                            onChange={(e) =>
                              handleUpdateCurrentVehicle('driverAllowancePerDay', parseInt(e.target.value, 10) || 0)
                            }
                            className="w-18 px-2 py-1 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 text-center"
                          />
                        </div>
                        <p className="text-[10px] text-slate-500">
                          Chauffeur daily lodging & food allowance.
                        </p>
                      </div>

                      {/* Base Starting Rate */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between items-center text-xs">
                          <label className="font-bold text-slate-700">
                            Base Dispatch Rate
                          </label>
                          <span className="font-extrabold text-emerald-800 bg-white px-2 py-0.5 rounded shadow-2xs">
                            ₹{currentVPricing.baseFare}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="range"
                            min="100"
                            max="2000"
                            step="50"
                            value={currentVPricing.baseFare}
                            onChange={(e) =>
                              handleUpdateCurrentVehicle('baseFare', parseInt(e.target.value, 10))
                            }
                            className="flex-1 accent-emerald-800 h-2 bg-slate-200 rounded-lg cursor-pointer"
                          />
                          <input
                            type="number"
                            value={currentVPricing.baseFare}
                            onChange={(e) =>
                              handleUpdateCurrentVehicle('baseFare', parseInt(e.target.value, 10) || 0)
                            }
                            className="w-18 px-2 py-1 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 text-center"
                          />
                        </div>
                        <p className="text-[10px] text-slate-500">
                          Initial flag-drop / base dispatch startup charge.
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-200">
                      {/* Minimum Billable KM / Day */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between items-center text-xs">
                          <label className="font-bold text-slate-700">
                            Min. Outstation Distance Rule
                          </label>
                          <span className="font-extrabold text-slate-900 bg-white px-2 py-0.5 rounded shadow-2xs">
                            {currentVPricing.minKmPerDay || 250} km / day
                          </span>
                        </div>
                        <select
                          value={currentVPricing.minKmPerDay || 250}
                          onChange={(e) =>
                            handleUpdateCurrentVehicle('minKmPerDay', parseInt(e.target.value, 10))
                          }
                          className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900"
                        >
                          <option value={200}>200 km / day</option>
                          <option value={250}>250 km / day (Standard)</option>
                          <option value={300}>300 km / day (Commercial)</option>
                          <option value={350}>350 km / day (Luxury)</option>
                        </select>
                      </div>

                      {/* Night Charge Percentage */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between items-center text-xs">
                          <label className="font-bold text-slate-700">
                            Night Travel Surcharge
                          </label>
                          <span className="font-extrabold text-slate-900 bg-white px-2 py-0.5 rounded shadow-2xs">
                            {currentVPricing.nightChargePercentage || 10}%
                          </span>
                        </div>
                        <select
                          value={currentVPricing.nightChargePercentage || 10}
                          onChange={(e) =>
                            handleUpdateCurrentVehicle('nightChargePercentage', parseInt(e.target.value, 10))
                          }
                          className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900"
                        >
                          <option value={5}>5% Surcharge</option>
                          <option value={10}>10% Standard Night Charge</option>
                          <option value={15}>15% Late Night Corridor</option>
                          <option value={20}>20% Peak Night Charge</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Live Output Preview for this Vehicle */}
                <div className="bg-slate-900 text-white rounded-2xl p-4 sm:p-5 space-y-3 shadow-lg">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                    <span className="flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-emerald-400" />
                      Dynamic Rates Live Breakdown for {currentVehicle.name}
                    </span>
                    <span className="text-emerald-400 text-[11px] bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-500/30">
                      Realtime Auto-Calculated
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center pt-1">
                    <div className="bg-slate-800/90 p-3 rounded-xl border border-slate-700">
                      <span className="text-[10px] text-slate-400 block uppercase font-bold">150 km One-Way</span>
                      <span className="font-extrabold text-sm sm:text-base text-emerald-400">
                        ₹{Math.round(currentVPricing.baseFare + 150 * (currentVPricing.oneWayPerKmRate || currentVPricing.perKmFare) + (currentVPricing.oneWayDriverAllowance || 0))}
                      </span>
                      <span className="text-[9px] text-slate-400 block mt-0.5">
                        ₹{currentVPricing.oneWayPerKmRate || currentVPricing.perKmFare}/km + ₹{currentVPricing.oneWayDriverAllowance || 0} Bata
                      </span>
                    </div>

                    <div className="bg-slate-800/90 p-3 rounded-xl border border-slate-700">
                      <span className="text-[10px] text-slate-400 block uppercase font-bold">8 Hr Local Pack</span>
                      <span className="font-extrabold text-sm sm:text-base text-emerald-400">
                        ₹{Math.round(currentVPricing.baseFare + 8 * currentVPricing.perHourFare + (currentVPricing.localDriverAllowance || 0))}
                      </span>
                      <span className="text-[9px] text-slate-400 block mt-0.5">
                        ₹{currentVPricing.perHourFare}/hr + ₹{currentVPricing.localDriverAllowance || 0} Bata
                      </span>
                    </div>

                    <div className="bg-slate-800/90 p-3 rounded-xl border border-slate-700">
                      <span className="text-[10px] text-slate-400 block uppercase font-bold">Airport Transfer</span>
                      <span className="font-extrabold text-sm sm:text-base text-emerald-400">
                        ₹{Math.round(currentVPricing.airportBaseFare + (currentVPricing.airportDriverAllowance || 0))}
                      </span>
                      <span className="text-[9px] text-slate-400 block mt-0.5">
                        ₹{currentVPricing.airportPerKmRate || currentVPricing.perKmFare}/km + ₹{currentVPricing.airportDriverAllowance || 0} Bata
                      </span>
                    </div>

                    <div className="bg-slate-800/90 p-3 rounded-xl border border-slate-700">
                      <span className="text-[10px] text-slate-400 block uppercase font-bold">300 km Roundtrip</span>
                      <span className="font-extrabold text-sm sm:text-base text-emerald-400">
                        ₹{Math.round(currentVPricing.baseFare + 300 * currentVPricing.perKmFare + currentVPricing.driverAllowancePerDay)}
                      </span>
                      <span className="text-[9px] text-slate-400 block mt-0.5">
                        ₹{currentVPricing.perKmFare}/km + ₹{currentVPricing.driverAllowancePerDay} Bata
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: FLEET RATE COMPARISON MATRIX */}
          {activeTab === 'matrix' && (
            <div className="space-y-4">
              <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs overflow-hidden">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h4 className="font-extrabold text-base text-slate-900">
                      Complete Fleet Rates Comparison
                    </h4>
                    <p className="text-xs text-slate-500">
                      Compare pricing across all categories side by side
                    </p>
                  </div>
                </div>

                <div className="overflow-x-auto -mx-5 px-5">
                  <table className="w-full text-left text-xs text-slate-700">
                    <thead className="bg-slate-100/80 text-slate-900 uppercase font-extrabold text-[10px] tracking-wider">
                      <tr>
                        <th className="py-3 px-3 rounded-l-xl">Vehicle</th>
                        <th className="py-3 px-3">Local Pkg (Per KM / Bata)</th>
                        <th className="py-3 px-3">One-Way (Per KM / Bata)</th>
                        <th className="py-3 px-3">Airport (Per KM / Bata / Base)</th>
                        <th className="py-3 px-3">Roundtrip (Per KM / Bata)</th>
                        <th className="py-3 px-3 rounded-r-xl text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {vehiclesData.map((v) => {
                        const vp = draftConfig.vehiclePricing?.[v.id] || defaultPricingConfig.vehiclePricing[v.id] || {
                          localPerKmRate: 12,
                          localDriverAllowance: 250,
                          oneWayPerKmRate: 13.5,
                          oneWayDriverAllowance: 300,
                          airportPerKmRate: 13.5,
                          airportDriverAllowance: 250,
                          perKmFare: 12,
                          perHourFare: 150,
                          airportBaseFare: 699,
                          driverAllowancePerDay: 300,
                          baseFare: 300,
                        };

                        return (
                          <tr key={v.id} className="hover:bg-emerald-50/40 transition-colors">
                            <td className="py-3 px-3 font-bold text-slate-900">
                              <div className="flex items-center gap-2">
                                <Car className="w-4 h-4 text-emerald-800" />
                                <div>
                                  <span>{v.name}</span>
                                  <span className="block text-[10px] text-slate-400 font-normal">
                                    {v.category} • {v.seatingCapacity} Pax
                                  </span>
                                </div>
                              </div>
                            </td>
                            <td className="py-3 px-3">
                              <span className="font-bold text-emerald-800">₹{vp.localPerKmRate || vp.perKmFare}/km</span>
                              <span className="block text-[10px] text-slate-500">₹{vp.localDriverAllowance || 0} Bata • ₹{vp.perHourFare}/hr</span>
                            </td>
                            <td className="py-3 px-3">
                              <span className="font-bold text-emerald-800">₹{vp.oneWayPerKmRate || vp.perKmFare}/km</span>
                              <span className="block text-[10px] text-slate-500">₹{vp.oneWayDriverAllowance || 0} Bata</span>
                            </td>
                            <td className="py-3 px-3">
                              <span className="font-bold text-emerald-800">₹{vp.airportPerKmRate || vp.perKmFare}/km</span>
                              <span className="block text-[10px] text-slate-500">₹{vp.airportDriverAllowance || 0} Bata • Base ₹{vp.airportBaseFare}</span>
                            </td>
                            <td className="py-3 px-3">
                              <span className="font-bold text-emerald-800">₹{vp.perKmFare}/km</span>
                              <span className="block text-[10px] text-slate-500">₹{vp.driverAllowancePerDay} Bata/Day (300 km/day rule)</span>
                            </td>
                            <td className="py-3 px-3 text-right">
                              <button
                                onClick={() => {
                                  setSelectedVehicleId(v.id);
                                  setActiveTab('vehicles');
                                }}
                                className="px-2.5 py-1 bg-emerald-800 text-white font-bold text-[11px] rounded-lg hover:bg-emerald-900 transition-colors"
                              >
                                Edit Rate
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
          )}

          {/* TAB: MULTI-DAY ROUND TRIP PRICING ENGINE MATRIX (1-10 DAYS) */}
          {activeTab === 'multiday' && (
            <div className="space-y-5">
              <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-emerald-950 text-white rounded-3xl p-5 sm:p-6 shadow-md border border-emerald-800/80 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-300">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-black text-base sm:text-lg text-white">
                      Round Trip Multi-Day Fare Engine Rules (1 to 10 Days)
                    </h4>
                    <p className="text-xs text-emerald-200/90">
                      Minimum 300 km included per day + daily driver allowance across all vehicle categories
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-2">
                  {ROUND_TRIP_TIERS.map((tier) => (
                    <div key={tier.days} className="bg-emerald-900/60 border border-emerald-700/60 rounded-xl p-2.5 text-center">
                      <span className="block font-black text-xs text-emerald-300">
                        {tier.days} Day{tier.days > 1 ? 's' : ''} Booking
                      </span>
                      <span className="block text-[11px] font-extrabold text-white mt-0.5">
                        {tier.includedMinKm.toLocaleString('en-IN')} km Included
                      </span>
                      <span className="block text-[10px] text-emerald-200/80">
                        + {tier.driverAllowanceDays} Day{tier.driverAllowanceDays > 1 ? 's' : ''} Driver Bata
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Complete Matrix Across Vehicles for Multi-Day Round Trips */}
              <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs overflow-hidden">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="font-extrabold text-base text-slate-900">
                      Multi-Day Base Package Fares by Vehicle
                    </h4>
                    <p className="text-xs text-slate-500">
                      Guaranteed minimum package rate = (Included Min KM × Per KM Rate) + (Days × Driver Allowance) + Base Fare
                    </p>
                  </div>
                </div>

                <div className="overflow-x-auto -mx-5 px-5">
                  <table className="w-full text-left text-xs text-slate-700">
                    <thead className="bg-slate-100 text-slate-900 uppercase font-extrabold text-[10px] tracking-wider">
                      <tr>
                        <th className="py-2.5 px-3 rounded-l-xl">Vehicle</th>
                        <th className="py-2.5 px-2 text-center">1 Day (300 km)</th>
                        <th className="py-2.5 px-2 text-center">2 Days (600 km)</th>
                        <th className="py-2.5 px-2 text-center">3 Days (900 km)</th>
                        <th className="py-2.5 px-2 text-center">4 Days (1200 km)</th>
                        <th className="py-2.5 px-2 text-center">5 Days (1500 km)</th>
                        <th className="py-2.5 px-2 text-center">6 Days (1800 km)</th>
                        <th className="py-2.5 px-2 text-center">7 Days (2100 km)</th>
                        <th className="py-2.5 px-2 text-center">8 Days (2400 km)</th>
                        <th className="py-2.5 px-2 text-center">9 Days (2700 km)</th>
                        <th className="py-2.5 px-2 text-center rounded-r-xl">10 Days (3000 km)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {vehiclesData.map((v) => {
                        const vp = draftConfig.vehiclePricing?.[v.id] || defaultPricingConfig.vehiclePricing[v.id];
                        const rate = vp.perKmFare;
                        const bata = vp.driverAllowancePerDay;
                        const base = vp.baseFare;

                        return (
                          <tr key={v.id} className="hover:bg-emerald-50/40 transition-colors">
                            <td className="py-3 px-3 font-bold text-slate-900 whitespace-nowrap">
                              <span className="block text-xs">{v.name}</span>
                              <span className="block text-[10px] text-slate-400 font-normal">₹{rate}/km + ₹{bata} Bata/Day</span>
                            </td>
                            {ROUND_TRIP_TIERS.map((tier) => {
                              const totalFare = Math.round(base + (tier.includedMinKm * rate) + (tier.driverAllowanceDays * bata));
                              return (
                                <td key={tier.days} className="py-3 px-2 text-center whitespace-nowrap">
                                  <span className="font-extrabold text-emerald-900 block">
                                    ₹{totalFare.toLocaleString('en-IN')}
                                  </span>
                                  <span className="text-[9px] text-slate-400 block">
                                    ₹{Math.round(totalFare / tier.days)}/day
                                  </span>
                                </td>
                              );
                            })}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: LIVE TRIP FARE SIMULATOR */}
          {activeTab === 'simulator' && (
            <div className="space-y-5">
              <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h4 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                    <Calculator className="w-5 h-5 text-emerald-800" />
                    Trip Fare Sandbox & Route Simulator
                  </h4>
                  <span className="text-xs text-slate-500 font-medium">
                    Test how current rates compute across all cabs
                  </span>
                </div>

                {/* Simulator Controls */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Service Type
                    </label>
                    <select
                      value={simServiceType}
                      onChange={(e: any) => setSimServiceType(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900"
                    >
                      <option value="oneway">Outstation One-Way Drop</option>
                      <option value="roundtrip">Outstation Round Trip (Multi-Day)</option>
                      <option value="local">Local City Package</option>
                      <option value="airport">Airport Transfer</option>
                    </select>
                  </div>

                  {simServiceType === 'local' ? (
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Package Duration (Hours)
                      </label>
                      <select
                        value={simHours}
                        onChange={(e) => setSimHours(parseInt(e.target.value, 10))}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900"
                      >
                        <option value={4}>4 Hours (40 km)</option>
                        <option value={8}>8 Hours (80 km)</option>
                        <option value={12}>12 Hours (120 km)</option>
                        <option value={24}>Full Day (24 Hours)</option>
                      </select>
                    </div>
                  ) : simServiceType === 'roundtrip' ? (
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Trip Duration ({simRoundTripDays} Day{simRoundTripDays > 1 ? 's' : ''} • {simRoundTripDays * 300} km min)
                      </label>
                      <select
                        value={simRoundTripDays}
                        onChange={(e) => setSimRoundTripDays(parseInt(e.target.value, 10))}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900"
                      >
                        {ROUND_TRIP_TIERS.map((tier) => (
                          <option key={tier.days} value={tier.days}>
                            {tier.days} Day{tier.days > 1 ? 's' : ''} Booking ({tier.includedMinKm} km min + {tier.driverAllowanceDays}D Bata)
                          </option>
                        ))}
                      </select>
                    </div>
                  ) : simServiceType !== 'airport' ? (
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Trip Distance ({simDistance} km)
                      </label>
                      <input
                        type="range"
                        min="30"
                        max="500"
                        step="10"
                        value={simDistance}
                        onChange={(e) => setSimDistance(parseInt(e.target.value, 10))}
                        className="w-full accent-emerald-800 mt-2"
                      />
                    </div>
                  ) : (
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Airport Transfer Type
                      </label>
                      <div className="text-xs font-bold text-emerald-800 pt-2">
                        Flat Corridor Fixed Rate
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Night Trip (10:00 PM - 06:00 AM)
                    </label>
                    <button
                      type="button"
                      onClick={() => setSimIsNight(!simIsNight)}
                      className={`w-full py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
                        simIsNight
                          ? 'bg-slate-900 text-emerald-300 border-slate-900 shadow-xs'
                          : 'bg-slate-50 text-slate-700 border-slate-300 hover:bg-slate-100'
                      }`}
                    >
                      {simIsNight ? '🌙 Night Surcharge Active' : '☀️ Day Ride (Standard)'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Simulation Result Cards Grid */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Calculated Fares Across Fleet:
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {vehiclesData.map((v) => {
                    const fare = calculateSimulatedFare(v.id);
                    const vp = draftConfig.vehiclePricing?.[v.id] || defaultPricingConfig.vehiclePricing[v.id];

                    let rateSubtext = `₹${vp.perKmFare}/km • ${v.seatingCapacity} Pax`;
                    if (simServiceType === 'oneway') {
                      rateSubtext = `₹${vp.oneWayPerKmRate || vp.perKmFare}/km + ₹${vp.oneWayDriverAllowance || 0} Bata`;
                    } else if (simServiceType === 'local') {
                      rateSubtext = `₹${vp.perHourFare}/hr + ₹${vp.localDriverAllowance || 0} Bata`;
                    } else if (simServiceType === 'airport') {
                      rateSubtext = `₹${vp.airportPerKmRate || vp.perKmFare}/km + ₹${vp.airportDriverAllowance || 0} Bata`;
                    } else if (simServiceType === 'roundtrip') {
                      rateSubtext = `₹${vp.perKmFare}/km + ₹${vp.driverAllowancePerDay} Bata/Day`;
                    }

                    return (
                      <div
                        key={v.id}
                        className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center justify-between shadow-2xs hover:border-emerald-600 transition-all"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-800 shrink-0">
                            <Car className="w-5 h-5" />
                          </div>
                          <div>
                            <span className="font-extrabold text-sm text-slate-900 block leading-tight">
                              {v.name}
                            </span>
                            <span className="text-[11px] text-slate-500 font-medium">
                              {rateSubtext}
                            </span>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="text-[10px] font-bold text-slate-400 uppercase block">
                            Simulated Fare
                          </span>
                          <span className="text-lg font-extrabold text-emerald-900">
                            ₹{fare.toLocaleString('en-IN')}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: Customer Logins & WhatsApp Alerts */}
          {activeTab === 'logins' && (
            <div className="space-y-5 animate-in fade-in duration-150">
              <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-2xs space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
                      <Bell className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                        <span>Customer Login Alerts</span>
                        <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full border border-emerald-200">
                          Owner WhatsApp Connected
                        </span>
                      </h4>
                      <p className="text-xs text-slate-500">
                        Live stream of customer sign-ins dispatched to Owner Desk ({siteConfig.contact.phone})
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={refreshLoginAlerts}
                    className="py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Refresh Stream</span>
                  </button>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex items-start gap-3 text-xs text-slate-600">
                  <ShieldCheck className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-slate-900 block mb-0.5">
                      Automated Customer Authentication Alerts
                    </span>
                    <span>
                      Whenever a customer enters their mobile number & verifies OTP, an instant formatted WhatsApp notification is constructed and dispatched to the owner's WhatsApp number (<strong>{siteConfig.contact.whatsapp}</strong>).
                    </span>
                  </div>
                </div>

                {loginAlerts.length === 0 ? (
                  <div className="py-12 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 p-8 space-y-3">
                    <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto">
                      <MessageSquare className="w-6 h-6" />
                    </div>
                    <h5 className="font-bold text-slate-800 text-sm">No login notifications recorded yet</h5>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto">
                      When customers sign in or create accounts on TRAVEL JUST, their activity alerts will appear here with 1-click WhatsApp reply buttons.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3 pt-1">
                    {loginAlerts.map((alert) => (
                      <div
                        key={alert.id}
                        className="bg-white border border-slate-200 hover:border-emerald-500 rounded-2xl p-4 shadow-2xs transition-all space-y-3"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-800 font-extrabold text-xs flex items-center justify-center">
                              <User className="w-4 h-4" />
                            </div>
                            <div>
                              <span className="font-extrabold text-sm text-slate-900 block leading-tight">
                                {alert.fullName}
                              </span>
                              <span className="text-[11px] text-slate-500 font-medium">
                                +91 {alert.mobileNumber.replace(/\D/g, '').slice(-10)} {alert.email ? `• ${alert.email}` : ''}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <span
                              className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border ${
                                alert.isNewRegistration
                                  ? 'bg-amber-50 text-amber-800 border-amber-200'
                                  : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              }`}
                            >
                              {alert.isNewRegistration ? '✨ New Account' : '🔑 Returning Sign-In'}
                            </span>
                            <span className="text-[11px] font-mono text-slate-400">
                              {alert.loginTime}
                            </span>
                          </div>
                        </div>

                        <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 text-[11px] text-slate-600 font-mono whitespace-pre-line leading-relaxed">
                          {alert.formattedMessage}
                        </div>

                        <div className="flex items-center justify-end gap-2 pt-1">
                          <a
                            href={alert.whatsappUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 py-1.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                            <span>Open in WhatsApp</span>
                            <ExternalLink className="w-3 h-3 opacity-80" />
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 6: Driver Partner & Vendor Onboarding Inquiries */}
          {activeTab === 'partners' && (
            <div className="space-y-5 animate-in fade-in duration-150">
              <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-2xs space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-900 flex items-center justify-center">
                      <Car className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                        <span>Fleet & Cab Attachment Inquiries</span>
                        <span className="text-xs bg-amber-100 text-amber-900 font-bold px-2 py-0.5 rounded-full border border-amber-200">
                          Karnataka Network
                        </span>
                      </h4>
                      <p className="text-xs text-slate-500">
                        Driver-partners & fleet vendors requesting to attach vehicles across Karnataka
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={refreshPartnerApps}
                    className="py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Refresh List</span>
                  </button>
                </div>

                <div className="bg-amber-50/60 border border-amber-200/80 rounded-2xl p-4 flex items-start gap-3 text-xs text-amber-950">
                  <Building className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block mb-0.5">
                      Fleet Expansion & Driver Onboarding Pipeline
                    </span>
                    <span>
                      Review applicant vehicle details, commercial permit status, and contact drivers directly to assign trips or expand your fleet in Bengaluru, Mysuru, Coorg, and beyond.
                    </span>
                  </div>
                </div>

                {partnerApps.length === 0 ? (
                  <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 space-y-2">
                    <Car className="w-8 h-8 text-slate-400 mx-auto" />
                    <p className="text-sm font-bold text-slate-600">No partner inquiries yet</p>
                    <p className="text-xs text-slate-400">
                      When drivers submit the "Attach Your Cab" drawer, their applications will appear here.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {partnerApps.map((app) => (
                      <div
                        key={app.id}
                        className="bg-white border border-slate-200 hover:border-slate-300 rounded-2xl p-4 shadow-xs space-y-3 transition-colors"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-2 border-b border-slate-100 pb-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                                {app.referenceId}
                              </span>
                              <h5 className="font-extrabold text-sm text-slate-900">{app.fullName}</h5>
                              <span className="text-xs text-slate-500 font-semibold">({app.city})</span>
                            </div>
                            <p className="text-xs text-slate-500 mt-1 flex items-center gap-3">
                              <span>Phone: <strong className="text-slate-800">{app.mobileNumber}</strong></span>
                              <span>•</span>
                              <span>Role: <strong className="text-slate-800 capitalize">{app.partnerType.replace(/_/g, ' ')}</strong></span>
                            </p>
                          </div>

                          <div className="flex items-center gap-2">
                            <select
                              value={app.status}
                              onChange={(e) => handlePartnerStatusChange(app.id, e.target.value as DriverPartnerApplication['status'])}
                              className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border outline-hidden cursor-pointer ${
                                app.status === 'Active Partner'
                                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                  : app.status === 'Verified'
                                  ? 'bg-blue-50 text-blue-800 border-blue-300'
                                  : app.status === 'Under Review'
                                  ? 'bg-amber-50 text-amber-800 border-amber-300'
                                  : 'bg-slate-100 text-slate-700 border-slate-300'
                              }`}
                            >
                              <option value="New Inquiry">New Inquiry</option>
                              <option value="Under Review">Under Review</option>
                              <option value="Verified">Verified</option>
                              <option value="Active Partner">Active Partner</option>
                            </select>
                          </div>
                        </div>

                        {/* Vehicle & Specs */}
                        <div className="flex flex-col sm:flex-row gap-3 bg-slate-50 p-3 rounded-xl">
                          {app.carImage && (
                            <div className="w-full sm:w-28 h-20 rounded-lg overflow-hidden bg-slate-200 shrink-0 border border-slate-300 relative group">
                              <img
                                src={app.carImage}
                                alt="Cab Photo"
                                className="w-full h-full object-cover"
                              />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[10px] font-bold">
                                Cab Photo
                              </div>
                            </div>
                          )}

                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs flex-1">
                            <div>
                              <span className="text-[10px] text-slate-400 uppercase font-bold block">Vehicle & Class</span>
                              <span className="font-bold text-slate-900 block truncate">{app.vehicleModel}</span>
                              <span className="text-[10px] font-black uppercase text-emerald-700 bg-emerald-100/70 px-1.5 py-0.2 rounded inline-block mt-0.5">
                                {app.vehicleCategory}
                              </span>
                            </div>
                            <div>
                              <span className="text-[10px] text-slate-400 uppercase font-bold block">Plate (Yellow Board)</span>
                              <span className="font-extrabold font-mono text-amber-900 bg-amber-100/60 px-1 rounded inline-block">{app.registrationNumber}</span>
                              <span className="text-[10px] text-slate-500 block mt-0.5">Year: {app.manufacturingYear}</span>
                            </div>
                            <div>
                              <span className="text-[10px] text-slate-400 uppercase font-bold block">Fuel & AC</span>
                              <span className="font-semibold text-slate-800 uppercase block">{app.fuelType}</span>
                              <span className="text-[10px] text-emerald-700 font-bold block mt-0.5">{app.hasAC ? '✓ Working AC' : 'Non-AC'}</span>
                            </div>
                            <div>
                              <span className="text-[10px] text-slate-400 uppercase font-bold block">Permit</span>
                              <span className="font-semibold text-slate-800 capitalize block">{app.permitType.replace(/_/g, ' ')}</span>
                            </div>
                          </div>
                        </div>

                        {/* Documents & Validity Checks */}
                        <div className="flex flex-wrap items-center gap-2 text-[10px]">
                          <span className={`px-2 py-0.5 rounded-md border font-bold ${app.documentsReady?.commercialDL ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-slate-50 text-slate-400 border-slate-200'}`}>
                            DL/Badge: {app.documentsReady?.commercialDL ? '✓ Ready' : 'Pending'}
                          </span>

                          <span className={`px-2 py-0.5 rounded-md border font-bold ${app.insuranceDetails?.validityDate ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : app.documentsReady?.rcAndInsurance ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-slate-50 text-slate-400 border-slate-200'}`}>
                            Insurance: {app.insuranceDetails?.validityDate ? `✓ Till ${app.insuranceDetails.validityDate}` : app.documentsReady?.rcAndInsurance ? '✓ Ready' : 'Pending'}
                          </span>

                          <span className={`px-2 py-0.5 rounded-md border font-bold ${app.fitnessDetails?.validityDate ? 'bg-blue-50 text-blue-800 border-blue-200' : app.documentsReady?.vehicleFitness ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-slate-50 text-slate-400 border-slate-200'}`}>
                            FC (Fitness): {app.fitnessDetails?.validityDate ? `✓ Till ${app.fitnessDetails.validityDate}` : app.documentsReady?.vehicleFitness ? '✓ Ready' : 'Pending'}
                          </span>

                          {app.carImage && (
                            <span className="px-2 py-0.5 rounded-md border font-bold bg-amber-50 text-amber-800 border-amber-200">
                              📷 Photo Attached
                            </span>
                          )}

                          {app.additionalNotes && (
                            <span className="text-slate-500 italic truncate max-w-xs ml-auto">
                              "{app.additionalNotes}"
                            </span>
                          )}
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center justify-end gap-2 pt-1">
                          <a
                            href={`tel:${app.mobileNumber.replace(/\s+/g, '')}`}
                            className="inline-flex items-center gap-1.5 py-1.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl transition-colors"
                          >
                            <Phone className="w-3.5 h-3.5 text-emerald-700" />
                            <span>Call Driver</span>
                          </a>

                          <button
                            type="button"
                            onClick={() => {
                              const msg = formatPartnerWhatsAppMessage(app);
                              openWhatsAppChat(msg, app.mobileNumber);
                            }}
                            className="inline-flex items-center gap-1.5 py-1.5 px-3 bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                            <span>WhatsApp Driver</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tab 7: SMS Gateway & Dispatches */}
          {activeTab === 'sms' && (
            <div className="space-y-6 animate-in fade-in">
              {/* Status Header */}
              <div className="p-5 bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-2xl shadow-sm border border-slate-700 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-sky-500/20 border border-sky-400/30 flex items-center justify-center text-sky-400">
                      <Smartphone className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-extrabold text-base text-white">Automated SMS Gateway</h4>
                        <span className={`px-2 py-0.5 rounded-full font-extrabold text-[10px] uppercase tracking-wider ${
                          smsGatewayInfo?.isLive ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
                        }`}>
                          {smsGatewayInfo?.provider || 'SIMULATED'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 mt-0.5">
                        Automatic trip confirmation delivery to customer mobile phones on booking
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={refreshSmsData}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold border border-slate-700 transition-colors"
                  >
                    <RefreshCw className="w-3.5 h-3.5 text-sky-400" />
                    <span>Refresh</span>
                  </button>
                </div>

                {/* Gateway Details Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 text-xs border-t border-slate-700/80">
                  <div className="p-2.5 bg-slate-800/60 rounded-xl">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Provider</span>
                    <span className="font-bold text-white uppercase text-sm mt-0.5 block">
                      {smsGatewayInfo?.provider || 'SIMULATED'}
                    </span>
                  </div>
                  <div className="p-2.5 bg-slate-800/60 rounded-xl">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Sender ID</span>
                    <span className="font-mono font-bold text-sky-400 text-sm mt-0.5 block">
                      {smsGatewayInfo?.senderId || 'TRVJST'}
                    </span>
                  </div>
                  <div className="p-2.5 bg-slate-800/60 rounded-xl">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Mode</span>
                    <span className="font-bold text-slate-200 text-sm mt-0.5 block">
                      {smsGatewayInfo?.isLive ? 'Production Live' : 'Dev / Simulated'}
                    </span>
                  </div>
                  <div className="p-2.5 bg-slate-800/60 rounded-xl">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Dispatches</span>
                    <span className="font-bold text-emerald-400 text-sm mt-0.5 block">
                      {smsDispatches.length} Total
                    </span>
                  </div>
                </div>
              </div>

              {/* Quick Test Console */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Send className="w-4 h-4 text-sky-700" />
                    <h5 className="font-extrabold text-slate-900 text-sm">Send Test Confirmation SMS</h5>
                  </div>
                  <span className="text-[10px] text-slate-500 font-medium">
                    Test live gateway or simulated dispatch
                  </span>
                </div>

                <form onSubmit={handleSendTestSms} className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">
                        Recipient Mobile Number <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="tel"
                        required
                        placeholder="+91 97407 54400 or 10 digits"
                        value={testMobileNumber}
                        onChange={(e) => setTestMobileNumber(e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-sky-600 focus:ring-1 focus:ring-sky-600 font-medium"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">
                        Optional Custom Message
                      </label>
                      <input
                        type="text"
                        placeholder="Leave blank for default trip confirmation format"
                        value={testCustomMessage}
                        onChange={(e) => setTestCustomMessage(e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-sky-600 focus:ring-1 focus:ring-sky-600"
                      />
                    </div>
                  </div>

                  {testSmsFeedback && (
                    <div className={`p-2.5 rounded-xl text-xs font-medium border flex items-center gap-2 ${
                      testSmsFeedback.success ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-red-50 text-red-800 border-red-200'
                    }`}>
                      <Check className="w-4 h-4 shrink-0" />
                      <span>{testSmsFeedback.message}</span>
                    </div>
                  )}

                  <div className="flex justify-end pt-1">
                    <button
                      type="submit"
                      disabled={isSendingTestSms || !testMobileNumber.trim()}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-sky-700 hover:bg-sky-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs disabled:opacity-50 cursor-pointer"
                    >
                      <Smartphone className={`w-3.5 h-3.5 ${isSendingTestSms ? 'animate-pulse' : ''}`} />
                      <span>{isSendingTestSms ? 'Dispatching...' : 'Dispatch Test SMS'}</span>
                    </button>
                  </div>
                </form>
              </div>

              {/* Dispatched SMS History */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h5 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                    <span>Recent Dispatched SMS History</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-sky-100 text-sky-800">
                      {smsDispatches.length}
                    </span>
                  </h5>
                  <span className="text-xs text-slate-500">Stored locally in browser & server memory</span>
                </div>

                {smsDispatches.length === 0 ? (
                  <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-slate-500 text-xs">
                    <Smartphone className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                    <p className="font-semibold">No SMS confirmations dispatched yet</p>
                    <p className="mt-1 text-slate-400">Complete a trip booking or use the test console above to trigger automated SMS dispatch.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {smsDispatches.map((record) => (
                      <div key={record.id} className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-2.5">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-extrabold text-xs text-slate-900 bg-slate-100 px-2 py-0.5 rounded-md">
                              {record.bookingRef}
                            </span>
                            <span className="text-xs font-bold text-slate-800">
                              {record.recipientName}
                            </span>
                            <span className="text-xs font-medium text-slate-500">
                              ({record.recipientPhone})
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] uppercase font-bold text-slate-400">
                              {record.provider}
                            </span>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              record.status === 'sent'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-sky-100 text-sky-800'
                            }`}>
                              {record.status === 'sent' ? '✓ Dispatched' : '✓ Simulated'}
                            </span>
                          </div>
                        </div>

                        {/* Message Preview */}
                        <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-mono whitespace-pre-wrap leading-relaxed">
                          {record.messageText}
                        </div>

                        <div className="flex items-center justify-between text-[10px] text-slate-400 pt-0.5">
                          <span>Length: {record.characterCount} chars ({record.partsCount} SMS part)</span>
                          <span>{new Date(record.timestamp).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 px-6 bg-white border-t border-slate-200 flex items-center justify-between shrink-0 shadow-lg">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-100 transition-colors"
          >
            Cancel
          </button>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleResetToDefaults}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors hidden sm:block"
            >
              Reset Defaults
            </button>
            <button
              type="button"
              onClick={handleSaveAndApply}
              className="bg-emerald-800 hover:bg-emerald-900 text-white font-extrabold text-xs sm:text-sm px-6 py-2.5 rounded-xl shadow-md flex items-center gap-2 transition-all active:scale-[0.98]"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              Save & Apply Live Rates
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
