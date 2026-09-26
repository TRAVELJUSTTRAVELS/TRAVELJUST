import React, { useState, useMemo } from 'react';
import {
  Car,
  CheckCircle2,
  DollarSign,
  Info,
  RefreshCw,
  Save,
  Sliders,
  Zap,
  ArrowRight,
  TrendingUp,
  Clock,
  RotateCcw,
  Plane,
  Compass,
  Tag,
  Percent,
  Edit3,
  AlertTriangle,
  Eye,
  Check,
  X,
  ShieldCheck,
  Sparkles,
  Copy,
  Download,
  Flame,
  Share2,
} from 'lucide-react';
import {
  VehicleDynamicPricingConfig,
  BookingTypeCategory,
  VehicleBookingPricing,
} from '../types/dynamicPricing';
import { calculateDynamicFare } from '../utils/dynamicFareEngine';

export interface SimpleVehicleMeta {
  id: string;
  name: string;
  models: string;
  seats: string;
  luggage: string;
  badgeColor: string;
  accentBg: string;
  accentBorder: string;
  accentText: string;
}

export const SIMPLE_VEHICLES_LIST: SimpleVehicleMeta[] = [
  {
    id: 'sedan-4-1',
    name: 'SEDAN (4+1)',
    models: 'Toyota Etios, Swift Dzire',
    seats: '4+1 Seater',
    luggage: '2 Medium Bags',
    badgeColor: 'bg-blue-50 text-blue-800 border-blue-200',
    accentBg: 'bg-blue-50/50',
    accentBorder: 'border-blue-200',
    accentText: 'text-blue-700',
  },
  {
    id: 'suv-6-1',
    name: 'SUV (6+1)',
    models: 'Maruti Ertiga',
    seats: '6+1 Seater',
    luggage: '3 Bags',
    badgeColor: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    accentBg: 'bg-emerald-50/50',
    accentBorder: 'border-emerald-200',
    accentText: 'text-emerald-700',
  },
  {
    id: 'innova',
    name: 'INNOVA',
    models: 'Toyota Innova (Standard)',
    seats: '6+1 / 7+1 Seater',
    luggage: '4 Large Bags',
    badgeColor: 'bg-amber-50 text-amber-800 border-amber-200',
    accentBg: 'bg-amber-50/50',
    accentBorder: 'border-amber-200',
    accentText: 'text-amber-700',
  },
  {
    id: 'innova-crysta',
    name: 'INNOVA CRYSTA',
    models: 'Toyota Innova Crysta (Luxury)',
    seats: '6+1 / 7+1 Seater',
    luggage: '4 Large Bags',
    badgeColor: 'bg-purple-50 text-purple-800 border-purple-200',
    accentBg: 'bg-purple-50/50',
    accentBorder: 'border-purple-200',
    accentText: 'text-purple-700',
  },
  {
    id: 'tempo-traveller-12-1',
    name: 'TEMPO TRAVELLER (12+1)',
    models: 'Force Urbania / Traveller',
    seats: '12+1 Seater',
    luggage: '8-10 Bags',
    badgeColor: 'bg-rose-50 text-rose-800 border-rose-200',
    accentBg: 'bg-rose-50/50',
    accentBorder: 'border-rose-200',
    accentText: 'text-rose-700',
  },
];

export type SimpleTripType = 'LOCAL' | 'ONE_WAY' | 'ROUND_TRIP' | 'AIRPORT';

interface SimpleFareEngineViewProps {
  vehicleConfigs: Record<string, VehicleDynamicPricingConfig>;
  isOwner?: boolean;
  onOpenOwnerAuth?: () => void;
  onUpdateVehicleField?: (
    vehicleId: string,
    bookingType: 'ONE_WAY' | 'ROUND_TRIP' | 'LOCAL' | 'AIRPORT_TRANSFER',
    field: string,
    val: any
  ) => void;
  onUpdateVehicleConfig?: (
    vehicleId: string,
    updatedConfig: VehicleDynamicPricingConfig
  ) => void;
  onSaveAll: () => Promise<void>;
  onResetVehicle: (vehicleId: string) => Promise<void>;
  onSwitchToAdvanced?: () => void;
  saving?: boolean;
  saveSuccessMsg?: string | null;
}

export const SimpleFareEngineView: React.FC<SimpleFareEngineViewProps> = ({
  vehicleConfigs,
  isOwner = false,
  onOpenOwnerAuth,
  onUpdateVehicleField,
  onUpdateVehicleConfig,
  onSaveAll,
  onResetVehicle,
  onSwitchToAdvanced,
  saving = false,
  saveSuccessMsg = null,
}) => {
  const [selectedTripType, setSelectedTripType] = useState<SimpleTripType>('ONE_WAY');
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('sedan-4-1');
  const [viewMode, setViewMode] = useState<'CARDS' | 'TABLE'>('CARDS');

  // Working draft state to support "SAVE DRAFT" and "PUBLISH FARE" workflow
  const [draftConfigs, setDraftConfigs] = useState<Record<string, VehicleDynamicPricingConfig>>(vehicleConfigs);
  const [hasDraftChanges, setHasDraftChanges] = useState(false);
  const [draftSavedToast, setDraftSavedToast] = useState<string | null>(null);
  const [copiedRateCardToast, setCopiedRateCardToast] = useState(false);
  const [activeSurge, setActiveSurge] = useState<number>(1.0);

  // Protected action helper
  const handleProtectedAction = (action: () => void) => {
    if (!isOwner && onOpenOwnerAuth) {
      onOpenOwnerAuth();
      return;
    }
    action();
  };

  // Sync draftConfigs whenever vehicleConfigs updates from outside
  React.useEffect(() => {
    setDraftConfigs(vehicleConfigs);
  }, [vehicleConfigs]);

  // Edit Fare Modal State
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingVehicleId, setEditingVehicleId] = useState<string | null>(null);
  const [editingCategory, setEditingCategory] = useState<BookingTypeCategory>('ONE_WAY');
  const [editFormData, setEditFormData] = useState<Partial<VehicleBookingPricing>>({});

  // Discount Modal State
  const [discountModalOpen, setDiscountModalOpen] = useState(false);
  const [discountType, setDiscountType] = useState<'PERCENTAGE' | 'FIXED'>('PERCENTAGE');
  const [discountValue, setDiscountValue] = useState<number>(10);
  const [discountCategoryScope, setDiscountCategoryScope] = useState<string>('ALL');
  const [discountVehicleScope, setDiscountVehicleScope] = useState<string>('ALL');

  // Publish Preview Modal State
  const [previewModalOpen, setPreviewModalOpen] = useState(false);

  // Test Simulator Inputs inside Simple View
  const [testDistanceKm, setTestDistanceKm] = useState<number>(140);
  const [testDays, setTestDays] = useState<number>(2);
  const [testLocalHours, setTestLocalHours] = useState<number>(8);

  // Map internal booking type key
  const internalBookingKey: BookingTypeCategory = useMemo(() => {
    switch (selectedTripType) {
      case 'LOCAL':
        return 'LOCAL';
      case 'ONE_WAY':
        return 'ONE_WAY';
      case 'ROUND_TRIP':
        return 'ROUND_TRIP';
      case 'AIRPORT':
        return 'AIRPORT_TRANSFER';
    }
  }, [selectedTripType]);

  // Handle single field update
  const handleFieldChange = (
    vehId: string,
    bookingType: BookingTypeCategory,
    field: string,
    val: any
  ) => {
    setDraftConfigs((prev) => {
      const existing = prev[vehId] || vehicleConfigs[vehId];
      const existingPricing = existing?.pricingByBookingType?.[bookingType] || {};
      const updatedPricing = {
        ...existingPricing,
        [field]: val,
      };

      const updated = {
        ...existing,
        pricingByBookingType: {
          ...existing.pricingByBookingType,
          [bookingType]: updatedPricing,
        },
      };

      // Notify parent immediately if callback provided
      onUpdateVehicleField?.(vehId, bookingType as any, field, val);
      onUpdateVehicleConfig?.(vehId, updated);

      return {
        ...prev,
        [vehId]: updated,
      };
    });
    setHasDraftChanges(true);
  };

  // Open Edit Fare Modal for a specific vehicle and booking category
  const openEditFareModal = (vehId: string, category: BookingTypeCategory) => {
    handleProtectedAction(() => {
      setEditingVehicleId(vehId);
      setEditingCategory(category);
      const cfg = draftConfigs[vehId] || vehicleConfigs[vehId];
      const pricing = (cfg?.pricingByBookingType?.[category] || {}) as Partial<VehicleBookingPricing>;
      setEditFormData({
        baseFare: pricing.baseFare ?? 500,
        driverAllowance: pricing.driverAllowance ?? 300,
        perKmRate: pricing.perKmRate ?? 14,
        hourlyRate: pricing.hourlyRate ?? 150,
        perHourRate: pricing.perHourRate ?? pricing.hourlyRate ?? 150,
        extraPerKmRate: pricing.extraPerKmRate ?? 14,
        extraPerHourRate: pricing.extraPerHourRate ?? 150,
        minimumKm: pricing.minimumKm ?? (category === 'ROUND_TRIP' ? 300 : 0),
        minimumHours: pricing.minimumHours ?? (category === 'LOCAL' ? 8 : 0),
        dailyMinimumKm: pricing.dailyMinimumKm ?? (category === 'ROUND_TRIP' ? 300 : 0),
        discountType: pricing.discountType ?? 'NONE',
        discountValue: pricing.discountValue ?? 0,
        active: pricing.active !== false,
      });
      setEditModalOpen(true);
    });
  };

  // Save Edit Fare Modal changes
  const handleSaveEditModal = () => {
    if (!editingVehicleId) return;

    setDraftConfigs((prev) => {
      const existing = prev[editingVehicleId] || vehicleConfigs[editingVehicleId];
      const existingPricing = existing?.pricingByBookingType?.[editingCategory] || {};
      const updatedPricing: VehicleBookingPricing = {
        ...existingPricing,
        ...editFormData,
      } as VehicleBookingPricing;

      const updated: VehicleDynamicPricingConfig = {
        ...existing,
        pricingByBookingType: {
          ...existing.pricingByBookingType,
          [editingCategory]: updatedPricing,
        },
      };

      onUpdateVehicleConfig?.(editingVehicleId, updated);

      return {
        ...prev,
        [editingVehicleId]: updated,
      };
    });

    setHasDraftChanges(true);
    setEditModalOpen(false);
  };

  // Apply Promotional Discount to vehicles
  const handleApplyDiscount = () => {
    const targetVehicles =
      discountVehicleScope === 'ALL'
        ? SIMPLE_VEHICLES_LIST.map((v) => v.id)
        : [discountVehicleScope];

    const targetCategories: BookingTypeCategory[] =
      discountCategoryScope === 'ALL'
        ? ['LOCAL', 'ONE_WAY', 'ROUND_TRIP', 'AIRPORT_TRANSFER']
        : [discountCategoryScope as BookingTypeCategory];

    setDraftConfigs((prev) => {
      const next = { ...prev };

      targetVehicles.forEach((vehId) => {
        const existing = next[vehId] || vehicleConfigs[vehId];
        if (!existing) return;

        const updatedPricingByBookingType = { ...existing.pricingByBookingType };

        targetCategories.forEach((cat) => {
          const currentCategoryPricing = updatedPricingByBookingType[cat] || {};
          updatedPricingByBookingType[cat] = {
            ...currentCategoryPricing,
            discountType: discountType,
            discountValue: discountValue,
          } as VehicleBookingPricing;
        });

        const updatedConfig: VehicleDynamicPricingConfig = {
          ...existing,
          pricingByBookingType: updatedPricingByBookingType,
        };

        next[vehId] = updatedConfig;
        onUpdateVehicleConfig?.(vehId, updatedConfig);
      });

      return next;
    });

    setHasDraftChanges(true);
    setDiscountModalOpen(false);
    setDraftSavedToast(
      `Applied ${discountType === 'PERCENTAGE' ? `${discountValue}%` : `₹${discountValue}`} discount to selected rate cards!`
    );
    setTimeout(() => setDraftSavedToast(null), 3500);
  };

  // Save Draft locally
  const handleSaveDraft = () => {
    try {
      localStorage.setItem('travel_just_draft_fare_configs', JSON.stringify(draftConfigs));
      setHasDraftChanges(false);
      setDraftSavedToast('Draft fare configurations saved locally.');
      setTimeout(() => setDraftSavedToast(null), 3000);
    } catch (e) {
      console.warn('Failed to save draft to localStorage', e);
    }
  };

  // Confirm Publish from Preview Modal
  const handleConfirmPublish = async () => {
    setPreviewModalOpen(false);
    await onSaveAll();
    setHasDraftChanges(false);
  };

  // WhatsApp / SMS Shareable Rate Card Copy
  const handleCopyRateCard = () => {
    const tripNames: Record<SimpleTripType, string> = {
      LOCAL: 'LOCAL CITY PACKAGES (8h/80km)',
      ONE_WAY: 'ONE WAY OUTSTATION (Point-to-Point)',
      ROUND_TRIP: 'ROUND TRIP OUTSTATION',
      AIRPORT: 'AIRPORT TRANSFER (BLR / MYQ)',
    };

    let text = `🚕 *TRAVEL JUST (Mysuru) – OFFICIAL RATE CARD*\n`;
    text += `📋 Service: *${tripNames[selectedTripType]}*\n`;
    text += `━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;

    SIMPLE_VEHICLES_LIST.forEach((veh) => {
      const cfg = draftConfigs[veh.id] || vehicleConfigs[veh.id];
      const pricing = cfg?.pricingByBookingType?.[internalBookingKey] || ({} as any);
      const kmRate = pricing.extraPerKmRate ?? pricing.perKmRate ?? 14;
      const base = pricing.baseFare ?? 500;
      const driver = pricing.driverAllowance ?? 300;

      text += `🚗 *${veh.name}* (${veh.seats})\n`;
      if (selectedTripType === 'LOCAL') {
        text += `   • Package: ₹${base} (${pricing.minimumHours || 8}h / ${pricing.minimumKm || 80}km)\n`;
        text += `   • Extra KM: ₹${kmRate}/km | Extra Hr: ₹${pricing.extraPerHourRate || 150}/hr\n`;
      } else if (selectedTripType === 'ROUND_TRIP') {
        text += `   • Rate: ₹${kmRate}/km (Min ${pricing.dailyMinimumKm || 300} km/day)\n`;
        text += `   • Driver Allowance: ₹${driver}/day\n`;
      } else {
        text += `   • Rate: ₹${kmRate}/km | Base: ₹${base}\n`;
        text += `   • Driver Allowance: ₹${driver}\n`;
      }
      text += `\n`;
    });

    text += `━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    text += `ℹ️ Tolls, Parking & Inter-state permits extra as per actual toll receipts.\n`;
    text += `📞 Instant 24x7 Booking: +91 97407 54400\n`;
    text += `🌐 Book Online: traveljustmysuru.com`;

    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).then(() => {
        setCopiedRateCardToast(true);
        setTimeout(() => setCopiedRateCardToast(false), 3500);
      });
    }
  };

  // 1-Click Bulk Rate Adjustment (+₹1, -₹1, +5%, -5%) across all 5 vehicles
  const handleBulkAdjustRates = (deltaKm: number, percentDelta: number = 0) => {
    handleProtectedAction(() => {
      setDraftConfigs((prev) => {
        const next = { ...prev };
        SIMPLE_VEHICLES_LIST.forEach((veh) => {
          const existing = next[veh.id] || vehicleConfigs[veh.id];
          if (!existing) return;
          const existingPricing: any = existing.pricingByBookingType?.[internalBookingKey] || {};
          let newKmRate = existingPricing.extraPerKmRate ?? existingPricing.perKmRate ?? 14;
          let newBaseFare = existingPricing.baseFare ?? 500;

          if (percentDelta !== 0) {
            newKmRate = Math.max(5, Math.round(newKmRate * (1 + percentDelta / 100) * 10) / 10);
            newBaseFare = Math.max(100, Math.round(newBaseFare * (1 + percentDelta / 100) / 10) * 10);
          } else {
            newKmRate = Math.max(5, Math.round((newKmRate + deltaKm) * 10) / 10);
          }

          const updatedPricing = {
            ...existingPricing,
            extraPerKmRate: newKmRate,
            perKmRate: newKmRate,
            baseFare: newBaseFare,
          };

          next[veh.id] = {
            ...existing,
            pricingByBookingType: {
              ...existing.pricingByBookingType,
              [internalBookingKey]: updatedPricing,
            },
          };

          onUpdateVehicleField?.(veh.id, internalBookingKey as any, 'extraPerKmRate', newKmRate);
          onUpdateVehicleField?.(veh.id, internalBookingKey as any, 'perKmRate', newKmRate);
          onUpdateVehicleConfig?.(veh.id, next[veh.id]);
        });
        return next;
      });

      setHasDraftChanges(true);
      setDraftSavedToast(
        percentDelta !== 0
          ? `Adjusted all 5 vehicle rates by ${percentDelta > 0 ? '+' : ''}${percentDelta}% for ${selectedTripType}!`
          : `Adjusted all 5 vehicle rates by ${deltaKm > 0 ? '+' : ''}₹${Math.abs(deltaKm)}/km for ${selectedTripType}!`
      );
      setTimeout(() => setDraftSavedToast(null), 3000);
    });
  };

  // Surge Multiplier Presets (1.0x, 1.10x, 1.25x)
  const handleApplySurgePreset = (multiplier: number) => {
    handleProtectedAction(() => {
      setActiveSurge(multiplier);
      setDraftConfigs((prev) => {
        const next = { ...prev };
        SIMPLE_VEHICLES_LIST.forEach((veh) => {
          const existing = next[veh.id] || vehicleConfigs[veh.id];
          if (!existing) return;
          const existingPricing: any = existing.pricingByBookingType?.[internalBookingKey] || {};
          const baseRate = existingPricing.extraPerKmRate ?? existingPricing.perKmRate ?? 14;
          const adjustedRate = Math.round(baseRate * multiplier * 10) / 10;

          const updatedPricing = {
            ...existingPricing,
            surgeMultiplier: multiplier,
            extraPerKmRate: adjustedRate,
            perKmRate: adjustedRate,
          };

          next[veh.id] = {
            ...existing,
            pricingByBookingType: {
              ...existing.pricingByBookingType,
              [internalBookingKey]: updatedPricing,
            },
          };

          onUpdateVehicleConfig?.(veh.id, next[veh.id]);
        });
        return next;
      });
      setHasDraftChanges(true);
      setDraftSavedToast(`Demand surge multiplier applied: ${multiplier}x!`);
      setTimeout(() => setDraftSavedToast(null), 3000);
    });
  };

  // Export JSON Config
  const handleExportConfigJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(draftConfigs, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `travel-just-fare-config-${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Compute live price quotes across ALL 5 vehicles for the test simulator
  const comparisonQuotes = useMemo(() => {
    return SIMPLE_VEHICLES_LIST.map((veh) => {
      const cfg = draftConfigs[veh.id] || vehicleConfigs[veh.id];
      if (!cfg) {
        return {
          ...veh,
          totalFare: 0,
          breakdown: null,
          effectivePerKm: 0,
          effectiveBaseFare: 0,
          driverAllowance: 0,
          discountAmount: 0,
        };
      }

      try {
        const result = calculateDynamicFare({
          origin: 'Mysuru City',
          destination: selectedTripType === 'AIRPORT' ? 'Bengaluru Airport (BLR)' : 'Bangalore City',
          distanceKm: testDistanceKm,
          durationMinutes: selectedTripType === 'LOCAL' ? testLocalHours * 60 : testDistanceKm * 1.5,
          bookingType: internalBookingKey,
          vehicleId: veh.id,
          roundTripDays: testDays,
          pickupTime: '10:00',
          airportTransferType: 'drop',
          customPricingConfig: cfg,
        });

        return {
          ...veh,
          totalFare: result.totalFare,
          breakdown: result.fareBreakdown,
          effectivePerKm: result.fareSnapshot.perKmRate || (cfg?.pricingByBookingType?.[internalBookingKey]?.perKmRate ?? 0),
          effectiveBaseFare: result.baseFare,
          driverAllowance: result.driverAllowance,
          discountAmount: result.discountAmount || 0,
        };
      } catch (e) {
        return {
          ...veh,
          totalFare: 0,
          breakdown: null,
          effectivePerKm: 0,
          effectiveBaseFare: 0,
          driverAllowance: 0,
          discountAmount: 0,
        };
      }
    });
  }, [draftConfigs, vehicleConfigs, selectedTripType, internalBookingKey, testDistanceKm, testDays, testLocalHours]);

  // Calculate live preview for edit modal
  const editModalPreviewFare = useMemo(() => {
    if (!editingVehicleId) return null;
    const baseCfg = draftConfigs[editingVehicleId] || vehicleConfigs[editingVehicleId];
    if (!baseCfg) return null;

    const simulatedPricing: VehicleBookingPricing = {
      ...(baseCfg.pricingByBookingType?.[editingCategory] || {}),
      ...editFormData,
    } as VehicleBookingPricing;

    const simulatedConfig: VehicleDynamicPricingConfig = {
      ...baseCfg,
      pricingByBookingType: {
        ...baseCfg.pricingByBookingType,
        [editingCategory]: simulatedPricing,
      },
    };

    try {
      return calculateDynamicFare({
        origin: 'Mysuru',
        destination: editingCategory === 'AIRPORT_TRANSFER' ? 'BLR Airport' : 'Bengaluru',
        distanceKm: editingCategory === 'LOCAL' ? 80 : 150,
        durationMinutes: editingCategory === 'LOCAL' ? 8 * 60 : 180,
        bookingType: editingCategory,
        vehicleId: editingVehicleId,
        roundTripDays: editingCategory === 'ROUND_TRIP' ? 2 : 1,
        customPricingConfig: simulatedConfig,
      });
    } catch {
      return null;
    }
  }, [editingVehicleId, editingCategory, editFormData, draftConfigs, vehicleConfigs]);

  return (
    <div className="space-y-6">
      {/* Top Banner: Centralized Real-Time Dynamic Fare Engine */}
      <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-emerald-900 text-white p-5 rounded-2xl border border-emerald-700/40 shadow-sm relative overflow-hidden">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 bg-emerald-500/30 border border-emerald-400/40 text-emerald-300 font-black text-[11px] rounded-full uppercase tracking-wider flex items-center gap-1">
                <Zap className="w-3 h-3 fill-current" />
                CENTRALIZED DYNAMIC FARE ENGINE
              </span>
              <span className="text-xs text-amber-300 font-bold bg-amber-500/20 px-2.5 py-0.5 rounded-full border border-amber-400/30">
                5 Vehicles • 4 Services • Database-Driven
              </span>
              {hasDraftChanges && (
                <span className="text-xs text-rose-300 font-bold bg-rose-500/20 px-2 py-0.5 rounded-full border border-rose-400/30 animate-pulse">
                  Unpublished Changes
                </span>
              )}
            </div>
            <h2 className="text-lg sm:text-xl font-black tracking-tight text-white mt-1.5">
              Owner Pricing & Rate Card Management
            </h2>
            <p className="text-xs text-slate-300 max-w-2xl mt-1">
              Changes published here immediately update live prices across website booking pages, mobile apps, customer checkout, invoices, and quote calculations.
            </p>
          </div>

          {/* Action Toolbar: + ADD DISCOUNT, SAVE DRAFT, PUBLISH FARE */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {/* + ADD DISCOUNT Button */}
            <button
              id="owner-add-discount-btn"
              type="button"
              onClick={() => handleProtectedAction(() => setDiscountModalOpen(true))}
              className="px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
              title="Add promotional discount percentage or fixed cut"
            >
              <Tag className="w-3.5 h-3.5" />
              <span>+ ADD DISCOUNT</span>
            </button>

            {/* SAVE DRAFT Button */}
            <button
              id="owner-save-draft-btn"
              type="button"
              onClick={() => handleProtectedAction(handleSaveDraft)}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
              title="Save changes to local draft"
            >
              <Save className="w-3.5 h-3.5 text-slate-400" />
              <span>SAVE DRAFT</span>
            </button>

            {/* PUBLISH FARE Button */}
            <button
              id="owner-publish-fare-btn"
              type="button"
              onClick={() => handleProtectedAction(() => setPreviewModalOpen(true))}
              disabled={saving}
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs rounded-xl transition-all shadow-md flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              title="Preview and publish updated fares live to server"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{saving ? 'Publishing...' : 'PUBLISH FARE'}</span>
            </button>

            {onSwitchToAdvanced && (
              <button
                type="button"
                onClick={onSwitchToAdvanced}
                className="px-3 py-2 bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-200 border border-indigo-500/40 font-bold text-xs rounded-xl transition-all flex items-center gap-1 cursor-pointer"
                title="Open Advanced Simulator & Audit Matrix"
              >
                <Sliders className="w-3.5 h-3.5 text-indigo-300" />
                <span>Advanced</span>
              </button>
            )}
          </div>
        </div>

        {/* Feedback Notifications */}
        {(saveSuccessMsg || draftSavedToast) && (
          <div className="mt-3 p-3 bg-emerald-500/20 border border-emerald-400 text-emerald-100 text-xs font-bold rounded-xl flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{saveSuccessMsg || draftSavedToast}</span>
          </div>
        )}
      </div>

      {/* Step 1: Booking Category Tabs (LOCAL, ONE WAY, ROUND TRIP, AIRPORT TRANSFER) */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider block">
              Step 1: Choose Service Category
            </span>
            <h3 className="text-sm font-black text-slate-900">
              Select Booking Service to Configure Rate Cards
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setViewMode('CARDS')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-colors ${
                viewMode === 'CARDS'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Cards View
            </button>
            <button
              type="button"
              onClick={() => setViewMode('TABLE')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-colors ${
                viewMode === 'TABLE'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Master Matrix
            </button>
          </div>
        </div>

        {/* 4 Distinct Service Category Tabs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-3.5">
          <button
            type="button"
            onClick={() => setSelectedTripType('LOCAL')}
            className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
              selectedTripType === 'LOCAL'
                ? 'bg-emerald-50 border-emerald-600 text-emerald-950 ring-2 ring-emerald-500/20 shadow-xs'
                : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-black uppercase tracking-wider">LOCAL</span>
              <Clock className={`w-4 h-4 ${selectedTripType === 'LOCAL' ? 'text-emerald-600' : 'text-slate-400'}`} />
            </div>
            <p className="text-[11px] text-slate-500 leading-snug">
              City packages (8h/80km) with hourly & extra KM rates.
            </p>
          </button>

          <button
            type="button"
            onClick={() => setSelectedTripType('ONE_WAY')}
            className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
              selectedTripType === 'ONE_WAY'
                ? 'bg-emerald-50 border-emerald-600 text-emerald-950 ring-2 ring-emerald-500/20 shadow-xs'
                : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-black uppercase tracking-wider">ONE WAY</span>
              <Compass className={`w-4 h-4 ${selectedTripType === 'ONE_WAY' ? 'text-emerald-600' : 'text-slate-400'}`} />
            </div>
            <p className="text-[11px] text-slate-500 leading-snug">
              Point-to-point drop pricing per KM with base fare & driver allowance.
            </p>
          </button>

          <button
            type="button"
            onClick={() => setSelectedTripType('ROUND_TRIP')}
            className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
              selectedTripType === 'ROUND_TRIP'
                ? 'bg-emerald-50 border-emerald-600 text-emerald-950 ring-2 ring-emerald-500/20 shadow-xs'
                : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-black uppercase tracking-wider">ROUND TRIP</span>
              <RotateCcw className={`w-4 h-4 ${selectedTripType === 'ROUND_TRIP' ? 'text-emerald-600' : 'text-slate-400'}`} />
            </div>
            <p className="text-[11px] text-slate-500 leading-snug">
              Outstation with daily minimum km (e.g. 300 km/day) & daily allowance.
            </p>
          </button>

          <button
            type="button"
            onClick={() => setSelectedTripType('AIRPORT')}
            className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
              selectedTripType === 'AIRPORT'
                ? 'bg-emerald-50 border-emerald-600 text-emerald-950 ring-2 ring-emerald-500/20 shadow-xs'
                : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-black uppercase tracking-wider">AIRPORT TRANSFER</span>
              <Plane className={`w-4 h-4 ${selectedTripType === 'AIRPORT' ? 'text-emerald-600' : 'text-slate-400'}`} />
            </div>
            <p className="text-[11px] text-slate-500 leading-snug">
              Airport pickup & drop transfers with base fare & per-KM rate.
            </p>
          </button>
        </div>
      </div>

      {/* Real-Time Quick Features: Share Rate Card, 1-Click Bulk Adjuster & Demand Multiplier */}
      <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2.5 pb-2.5 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-900 rounded-md text-[11px] font-black uppercase tracking-wider">
              Live Operations
            </span>
            <span className="text-xs font-bold text-slate-700">
              Quick Adjusters, Demand Multiplier & Rate Card Sharing
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Copy WhatsApp Rate Card */}
            <button
              type="button"
              id="copy-whatsapp-rate-card-btn"
              onClick={handleCopyRateCard}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs ${
                copiedRateCardToast
                  ? 'bg-emerald-600 text-white'
                  : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-300'
              }`}
              title="Copy formatted customer WhatsApp / SMS quote sheet for this category"
            >
              {copiedRateCardToast ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedRateCardToast ? 'Rate Card Copied!' : 'Copy Rate Card (WhatsApp)'}</span>
            </button>

            {/* Export JSON Config */}
            <button
              type="button"
              id="export-fare-config-btn"
              onClick={handleExportConfigJson}
              className="px-2.5 py-1.5 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Export complete pricing database as backup JSON"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span className="hidden sm:inline">Export JSON</span>
            </button>
          </div>
        </div>

        {/* 2 Sub-panels: 1-Click Rate Adjuster & Demand Surge Multiplier */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 pt-1">
          {/* 1-Click Bulk Adjuster */}
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <span className="text-xs font-black text-slate-800 block">⚡ Bulk Rate Adjuster</span>
              <span className="text-[11px] text-slate-500">Apply to all 5 vehicles for {selectedTripType.replace('_', ' ')}</span>
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                type="button"
                onClick={() => handleBulkAdjustRates(1)}
                className="px-2.5 py-1 bg-white hover:bg-emerald-50 text-emerald-800 border border-slate-200 hover:border-emerald-300 rounded-lg text-xs font-bold cursor-pointer transition-colors shadow-2xs"
                title="Add ₹1/km to all 5 vehicles"
              >
                +₹1/km
              </button>
              <button
                type="button"
                onClick={() => handleBulkAdjustRates(-1)}
                className="px-2.5 py-1 bg-white hover:bg-amber-50 text-amber-800 border border-slate-200 hover:border-amber-300 rounded-lg text-xs font-bold cursor-pointer transition-colors shadow-2xs"
                title="Subtract ₹1/km from all 5 vehicles"
              >
                -₹1/km
              </button>
              <button
                type="button"
                onClick={() => handleBulkAdjustRates(0, 5)}
                className="px-2.5 py-1 bg-white hover:bg-emerald-50 text-emerald-800 border border-slate-200 hover:border-emerald-300 rounded-lg text-xs font-bold cursor-pointer transition-colors shadow-2xs"
                title="Increase rates by 5% (fuel / high demand)"
              >
                +5% Fuel
              </button>
              <button
                type="button"
                onClick={() => handleBulkAdjustRates(0, -5)}
                className="px-2.5 py-1 bg-white hover:bg-rose-50 text-rose-800 border border-slate-200 hover:border-rose-300 rounded-lg text-xs font-bold cursor-pointer transition-colors shadow-2xs"
                title="Discount rates by 5% promotional cut"
              >
                -5% Promo
              </button>
            </div>
          </div>

          {/* Surge & Demand Multiplier */}
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <Flame className="w-4 h-4 text-amber-600 shrink-0" />
              <div>
                <span className="text-xs font-black text-slate-800 block">Demand Surge Multiplier</span>
                <span className="text-[11px] text-slate-500">Active: <strong>{activeSurge}x</strong> pricing</span>
              </div>
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              {[
                { label: '1.0x Normal', val: 1.0 },
                { label: '1.10x Weekend', val: 1.1 },
                { label: '1.25x Peak Festive', val: 1.25 },
              ].map((preset) => (
                <button
                  key={preset.val}
                  type="button"
                  onClick={() => handleApplySurgePreset(preset.val)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    activeSurge === preset.val
                      ? 'bg-amber-600 text-white shadow-2xs'
                      : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Step 2: Cards View - 5 Authoritative Vehicle Rate Cards */}
      {viewMode === 'CARDS' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider block">
                Step 2: Vehicle Fare Cards for {selectedTripType.replace('_', ' ')}
              </span>
              <h3 className="text-sm font-black text-slate-900">
                5 Authoritative Vehicle Categories (Independent Dynamic Pricing)
              </h3>
            </div>
            <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg">
              Click EDIT FARE on any vehicle to modify rates
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {SIMPLE_VEHICLES_LIST.map((veh) => {
              const cfg = draftConfigs[veh.id] || vehicleConfigs[veh.id];
              const pricing = cfg?.pricingByBookingType?.[internalBookingKey] || ({} as any);
              const isActive = pricing.active !== false;
              const hasDiscount =
                pricing.discountType &&
                pricing.discountType !== 'NONE' &&
                (pricing.discountValue || 0) > 0;

              return (
                <div
                  key={veh.id}
                  className={`bg-white rounded-2xl border p-4 shadow-xs flex flex-col justify-between transition-all relative ${
                    selectedVehicleId === veh.id
                      ? 'border-emerald-600 ring-2 ring-emerald-500/20 bg-emerald-50/10'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                  onClick={() => setSelectedVehicleId(veh.id)}
                >
                  <div>
                    {/* Top Badges */}
                    <div className="flex items-start justify-between gap-1 mb-2">
                      <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${veh.badgeColor}`}>
                        {veh.seats}
                      </span>
                      <div className="flex items-center gap-1">
                        <span
                          className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-md uppercase tracking-wider ${
                            isActive
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          {isActive ? 'Active' : 'Disabled'}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onResetVehicle(veh.id);
                          }}
                          title="Reset vehicle to defaults"
                          className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded transition-colors cursor-pointer"
                        >
                          <RefreshCw className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    <h4 className="font-black text-sm text-slate-900 tracking-tight leading-snug">
                      {veh.name}
                    </h4>
                    <p className="text-[11px] text-slate-500 truncate mb-3">
                      {veh.models}
                    </p>

                    {/* Rate Highlight Card */}
                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 mb-3 flex items-center justify-between">
                      <span className="text-xs text-slate-500 font-semibold">Per KM Rate:</span>
                      <span className="text-base font-black text-emerald-800">
                        ₹{pricing.perKmRate || 0}
                        <span className="text-xs font-semibold text-slate-400">/km</span>
                      </span>
                    </div>

                    {/* Key Fare Parameters Summary */}
                    <div className="space-y-1.5 text-xs text-slate-600 bg-slate-50/60 p-2.5 rounded-xl border border-slate-100 mb-3">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Base Fare:</span>
                        <span className="font-bold text-slate-900">₹{pricing.baseFare ?? 500}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Driver Allowance:</span>
                        <span className="font-bold text-slate-900">₹{pricing.driverAllowance ?? 300}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Extra Per KM:</span>
                        <span className="font-bold text-slate-900">₹{pricing.extraPerKmRate ?? pricing.perKmRate ?? 14}/km</span>
                      </div>

                      {selectedTripType === 'LOCAL' && (
                        <>
                          <div className="flex justify-between">
                            <span className="text-slate-500">Extra Hour:</span>
                            <span className="font-bold text-slate-900">₹{pricing.extraPerHourRate ?? 150}/hr</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">Package:</span>
                            <span className="font-bold text-slate-900">{pricing.minimumHours ?? 8}h / {pricing.minimumKm ?? 80}km</span>
                          </div>
                        </>
                      )}

                      {selectedTripType === 'ROUND_TRIP' && (
                        <div className="flex justify-between">
                          <span className="text-slate-500">Daily Min KM:</span>
                          <span className="font-bold text-slate-900">{pricing.dailyMinimumKm ?? pricing.minimumKm ?? 300} km/day</span>
                        </div>
                      )}

                      {hasDiscount && (
                        <div className="flex justify-between pt-1 border-t border-slate-200/60 text-amber-700 font-extrabold">
                          <span className="flex items-center gap-1">
                            <Tag className="w-3 h-3" /> Discount:
                          </span>
                          <span>
                            {pricing.discountType === 'PERCENTAGE'
                              ? `${pricing.discountValue}% OFF`
                              : `₹${pricing.discountValue} OFF`}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Prominent EDIT FARE Button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        openEditFareModal(veh.id, internalBookingKey);
                      }}
                      className="w-full py-2 px-3 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-black rounded-xl transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>EDIT FARE</span>
                    </button>
                  </div>

                  <div className="pt-2.5 mt-3 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500 font-medium">
                    <span>Luggage: {veh.luggage}</span>
                    <span className="font-bold text-emerald-700">Authoritative</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Step 2 (Alternative): Master Table Matrix View */}
      {viewMode === 'TABLE' && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-black text-slate-900">
                Complete Vehicle Rate Card Matrix (All Vehicles vs All Booking Types)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Side-by-side comparison of Per KM rates, Base Fares, and Minimums across all categories.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setDiscountModalOpen(true)}
              className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-lg flex items-center gap-1 cursor-pointer"
            >
              <Tag className="w-3 h-3" />
              <span>+ Add Discount</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-extrabold border-b border-slate-200">
                  <th className="p-3.5">Vehicle Category</th>
                  <th className="p-3.5">Capacity</th>
                  <th className="p-3.5">LOCAL (8h/80km)</th>
                  <th className="p-3.5">ONE WAY (Per KM)</th>
                  <th className="p-3.5">ROUND TRIP (Per KM)</th>
                  <th className="p-3.5">AIRPORT TRANSFER</th>
                  <th className="p-3.5">Driver Allowance</th>
                  <th className="p-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {SIMPLE_VEHICLES_LIST.map((veh) => {
                  const cfg = draftConfigs[veh.id] || vehicleConfigs[veh.id];
                  const local = cfg?.pricingByBookingType?.LOCAL || ({} as any);
                  const oneway = cfg?.pricingByBookingType?.ONE_WAY || ({} as any);
                  const roundtrip = cfg?.pricingByBookingType?.ROUND_TRIP || ({} as any);
                  const airport = cfg?.pricingByBookingType?.AIRPORT_TRANSFER || ({} as any);

                  return (
                    <tr key={veh.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3.5">
                        <div className="font-black text-slate-900">{veh.name}</div>
                        <div className="text-[11px] text-slate-500">{veh.models}</div>
                      </td>
                      <td className="p-3.5">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${veh.badgeColor}`}>
                          {veh.seats}
                        </span>
                      </td>
                      <td className="p-3.5">
                        <div className="font-bold text-slate-900">₹{local.perKmRate || 14}/km</div>
                        <div className="text-[11px] text-slate-500">Base: ₹{local.baseFare || 500}</div>
                      </td>
                      <td className="p-3.5">
                        <div className="font-bold text-emerald-700">₹{oneway.perKmRate || 14}/km</div>
                        <div className="text-[11px] text-slate-500">Base: ₹{oneway.baseFare || 500}</div>
                      </td>
                      <td className="p-3.5">
                        <div className="font-bold text-blue-700">₹{roundtrip.perKmRate || 13}/km</div>
                        <div className="text-[11px] text-slate-500">Min: {roundtrip.dailyMinimumKm || roundtrip.minimumKm || 300} km/day</div>
                      </td>
                      <td className="p-3.5">
                        <div className="font-bold text-purple-700">₹{airport.perKmRate || 14}/km</div>
                        <div className="text-[11px] text-slate-500">Base: ₹{airport.baseFare || 699}</div>
                      </td>
                      <td className="p-3.5">
                        <div className="font-bold text-slate-800">₹{oneway.driverAllowance || 300}/day</div>
                      </td>
                      <td className="p-3.5 text-right">
                        <button
                          type="button"
                          onClick={() => openEditFareModal(veh.id, internalBookingKey)}
                          className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-lg font-bold text-xs cursor-pointer"
                        >
                          Edit
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Step 3: Live Customer Quote Verification & Test Simulator */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider block">
              Step 3: Customer Fare Calculation Simulator
            </span>
            <h3 className="text-sm font-black text-slate-900">
              Live Fare Calculation Across All 5 Vehicles (Deterministic Centralized Engine)
            </h3>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
              <span>Distance:</span>
              <input
                type="number"
                min="10"
                max="1000"
                step="10"
                value={testDistanceKm}
                onChange={(e) => setTestDistanceKm(Math.max(1, parseFloat(e.target.value) || 10))}
                className="w-20 px-2 py-1 bg-slate-100 border border-slate-300 rounded-lg text-center font-black text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <span>km</span>
            </div>

            {selectedTripType === 'ROUND_TRIP' && (
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                <span>Days:</span>
                <input
                  type="number"
                  min="1"
                  max="14"
                  value={testDays}
                  onChange={(e) => setTestDays(Math.max(1, parseInt(e.target.value, 10) || 1))}
                  className="w-16 px-2 py-1 bg-slate-100 border border-slate-300 rounded-lg text-center font-black text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            )}

            {selectedTripType === 'LOCAL' && (
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                <span>Hours:</span>
                <input
                  type="number"
                  min="4"
                  max="24"
                  value={testLocalHours}
                  onChange={(e) => setTestLocalHours(Math.max(1, parseInt(e.target.value, 10) || 4))}
                  className="w-16 px-2 py-1 bg-slate-100 border border-slate-300 rounded-lg text-center font-black text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            )}
          </div>
        </div>

        {/* 5 Comparison Quote Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3.5">
          {comparisonQuotes.map((q, idx) => (
            <div
              key={q.id}
              className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-emerald-500/40 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between text-[11px] font-extrabold text-slate-500 mb-1">
                  <span>{q.seats}</span>
                  <span className="text-slate-400">Rank #{idx + 1}</span>
                </div>
                <h5 className="font-black text-xs text-slate-900 truncate">
                  {q.name}
                </h5>

                {/* Big Calculated Price Tag */}
                <div className="my-2.5 text-center bg-white p-2.5 rounded-xl border border-slate-100 shadow-2xs">
                  <span className="text-xl font-black text-emerald-800">
                    ₹{q.totalFare?.toLocaleString('en-IN') || '—'}
                  </span>
                  <span className="block text-[10px] text-slate-400 font-semibold mt-0.5">
                    Total Estimated Trip Fare
                  </span>
                </div>

                {/* Cost Breakdown items */}
                {q.breakdown && (
                  <div className="space-y-1 text-[11px] text-slate-600 pt-1 border-t border-slate-200/60">
                    <div className="flex justify-between">
                      <span>Rate:</span>
                      <span className="font-bold text-slate-900">₹{q.effectivePerKm}/km</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Base Fare:</span>
                      <span className="font-bold text-slate-900">₹{q.effectiveBaseFare}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Driver Bata:</span>
                      <span className="font-bold text-slate-900">₹{q.driverAllowance}</span>
                    </div>
                    {q.discountAmount > 0 && (
                      <div className="flex justify-between text-amber-700 font-bold">
                        <span>Discount:</span>
                        <span>-₹{q.discountAmount}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="pt-2 mt-2 text-[10px] text-center font-bold text-emerald-700 bg-emerald-50 py-1 rounded-lg">
                Deterministic Calculation
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* MODAL 1: EDIT FARE MODAL (for Vehicle & Category) */}
      {editModalOpen && editingVehicleId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 border border-slate-200 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 border border-emerald-200">
                  <Edit3 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-base text-slate-900">
                    Edit Fare – {SIMPLE_VEHICLES_LIST.find((v) => v.id === editingVehicleId)?.name}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Category: <span className="font-bold text-emerald-700">{editingCategory.replace('_', ' ')}</span>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              {/* Per KM Rate */}
              <div>
                <label className="text-[11px] font-extrabold text-slate-700 block mb-1">
                  Per KM Rate (₹/km) *
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="5"
                    max="100"
                    step="0.5"
                    value={editFormData.perKmRate ?? 14}
                    onChange={(e) =>
                      setEditFormData((p) => ({ ...p, perKmRate: parseFloat(e.target.value) || 0 }))
                    }
                    className="w-full px-3 py-2 text-xs font-bold text-slate-900 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                  <span className="absolute right-3 top-2 text-slate-400 font-bold">₹/km</span>
                </div>
              </div>

              {/* Base Fare */}
              <div>
                <label className="text-[11px] font-extrabold text-slate-700 block mb-1">
                  Base Fare (₹)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    max="5000"
                    step="50"
                    value={editFormData.baseFare ?? 500}
                    onChange={(e) =>
                      setEditFormData((p) => ({ ...p, baseFare: parseFloat(e.target.value) || 0 }))
                    }
                    className="w-full px-3 py-2 text-xs font-bold text-slate-900 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                  <span className="absolute right-3 top-2 text-slate-400 font-bold">₹</span>
                </div>
              </div>

              {/* Driver Allowance */}
              <div>
                <label className="text-[11px] font-extrabold text-slate-700 block mb-1">
                  Driver Allowance (₹/day)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    max="3000"
                    step="50"
                    value={editFormData.driverAllowance ?? 300}
                    onChange={(e) =>
                      setEditFormData((p) => ({ ...p, driverAllowance: parseFloat(e.target.value) || 0 }))
                    }
                    className="w-full px-3 py-2 text-xs font-bold text-slate-900 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                  <span className="absolute right-3 top-2 text-slate-400 font-bold">₹</span>
                </div>
              </div>

              {/* Extra Per KM Rate */}
              <div>
                <label className="text-[11px] font-extrabold text-slate-700 block mb-1">
                  Extra Per KM Rate (₹/km)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="5"
                    max="100"
                    step="0.5"
                    value={editFormData.extraPerKmRate ?? editFormData.perKmRate ?? 14}
                    onChange={(e) =>
                      setEditFormData((p) => ({ ...p, extraPerKmRate: parseFloat(e.target.value) || 0 }))
                    }
                    className="w-full px-3 py-2 text-xs font-bold text-slate-900 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                  <span className="absolute right-3 top-2 text-slate-400 font-bold">₹/km</span>
                </div>
              </div>

              {/* Minimum KM / Daily Minimum KM */}
              <div>
                <label className="text-[11px] font-extrabold text-slate-700 block mb-1">
                  {editingCategory === 'ROUND_TRIP' ? 'Daily Minimum KM (km/day)' : 'Minimum KM (km)'}
                </label>
                <input
                  type="number"
                  min="0"
                  max="1000"
                  step="10"
                  value={
                    editingCategory === 'ROUND_TRIP'
                      ? editFormData.dailyMinimumKm ?? editFormData.minimumKm ?? 300
                      : editFormData.minimumKm ?? 0
                  }
                  onChange={(e) => {
                    const val = parseFloat(e.target.value) || 0;
                    setEditFormData((p) => ({
                      ...p,
                      minimumKm: val,
                      dailyMinimumKm: editingCategory === 'ROUND_TRIP' ? val : p.dailyMinimumKm,
                    }));
                  }}
                  className="w-full px-3 py-2 text-xs font-bold text-slate-900 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              {/* LOCAL SPECIFIC: Per Hour & Extra Hour Rate */}
              {editingCategory === 'LOCAL' && (
                <>
                  <div>
                    <label className="text-[11px] font-extrabold text-slate-700 block mb-1">
                      Per Hour Rate (₹/hr)
                    </label>
                    <input
                      type="number"
                      min="50"
                      max="1000"
                      step="25"
                      value={editFormData.perHourRate ?? 150}
                      onChange={(e) =>
                        setEditFormData((p) => ({ ...p, perHourRate: parseFloat(e.target.value) || 0 }))
                      }
                      className="w-full px-3 py-2 text-xs font-bold text-slate-900 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-extrabold text-slate-700 block mb-1">
                      Extra Hour Rate (₹/hr)
                    </label>
                    <input
                      type="number"
                      min="50"
                      max="1000"
                      step="25"
                      value={editFormData.extraPerHourRate ?? 150}
                      onChange={(e) =>
                        setEditFormData((p) => ({ ...p, extraPerHourRate: parseFloat(e.target.value) || 0 }))
                      }
                      className="w-full px-3 py-2 text-xs font-bold text-slate-900 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-extrabold text-slate-700 block mb-1">
                      Included Minimum Hours (Package)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="24"
                      value={editFormData.minimumHours ?? 8}
                      onChange={(e) =>
                        setEditFormData((p) => ({ ...p, minimumHours: parseFloat(e.target.value) || 8 }))
                      }
                      className="w-full px-3 py-2 text-xs font-bold text-slate-900 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                    />
                  </div>
                </>
              )}

              {/* Discount Controls */}
              <div>
                <label className="text-[11px] font-extrabold text-slate-700 block mb-1">
                  Discount Type
                </label>
                <select
                  value={editFormData.discountType ?? 'NONE'}
                  onChange={(e) =>
                    setEditFormData((p) => ({
                      ...p,
                      discountType: e.target.value as any,
                    }))
                  }
                  className="w-full px-3 py-2 text-xs font-bold text-slate-900 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                >
                  <option value="NONE">No Discount</option>
                  <option value="PERCENTAGE">Percentage (%)</option>
                  <option value="FIXED">Fixed Amount (₹)</option>
                </select>
              </div>

              {editFormData.discountType && editFormData.discountType !== 'NONE' && (
                <div>
                  <label className="text-[11px] font-extrabold text-slate-700 block mb-1">
                    Discount Value {editFormData.discountType === 'PERCENTAGE' ? '(%)' : '(₹)'}
                  </label>
                  <input
                    type="number"
                    min="0"
                    max={editFormData.discountType === 'PERCENTAGE' ? 90 : 5000}
                    value={editFormData.discountValue ?? 0}
                    onChange={(e) =>
                      setEditFormData((p) => ({ ...p, discountValue: parseFloat(e.target.value) || 0 }))
                    }
                    className="w-full px-3 py-2 text-xs font-bold text-slate-900 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
              )}

              {/* Active Toggle Switch */}
              <div className="sm:col-span-2 flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div>
                  <span className="font-extrabold text-slate-900 text-xs block">
                    Active on Website & Mobile App
                  </span>
                  <span className="text-[11px] text-slate-500">
                    When active, customers can book this vehicle for {editingCategory.replace('_', ' ')} trips.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setEditFormData((p) => ({ ...p, active: !(p.active !== false) }))
                  }
                  className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                    editFormData.active !== false ? 'bg-emerald-600' : 'bg-slate-300'
                  }`}
                >
                  <span
                    className={`block w-5 h-5 rounded-full bg-white shadow-md transform transition-transform absolute top-0.5 ${
                      editFormData.active !== false ? 'translate-x-6.5' : 'translate-x-0.5'
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Live Instant Preview of Sample Trip */}
            {editModalPreviewFare && (
              <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-2xl flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">
                    Instant Calculation Test (Sample Route)
                  </span>
                  <span className="text-xs text-emerald-950 font-medium">
                    Calculated for {editModalPreviewFare.distanceKm} km trip
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-lg font-black text-emerald-900">
                    ₹{editModalPreviewFare.totalFare.toLocaleString('en-IN')}
                  </span>
                  <span className="block text-[10px] text-emerald-700 font-semibold">
                    Includes all rules & discounts
                  </span>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setEditModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveEditModal}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-sm flex items-center gap-1.5 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>Save Changes</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: + ADD DISCOUNT MODAL */}
      {discountModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 border border-slate-200 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
                  <Tag className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-sm text-slate-900">Add Promotional Discount</h3>
                  <p className="text-[11px] text-slate-500">Configure promotional discount across categories</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDiscountModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              {/* Discount Type */}
              <div>
                <label className="text-[11px] font-extrabold text-slate-700 block mb-1">
                  Discount Type
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setDiscountType('PERCENTAGE')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer ${
                      discountType === 'PERCENTAGE'
                        ? 'bg-amber-500 text-slate-950 border-amber-600 font-black'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <Percent className="w-3.5 h-3.5" />
                    <span>Percentage (%)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setDiscountType('FIXED')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer ${
                      discountType === 'FIXED'
                        ? 'bg-amber-500 text-slate-950 border-amber-600 font-black'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <DollarSign className="w-3.5 h-3.5" />
                    <span>Fixed (₹)</span>
                  </button>
                </div>
              </div>

              {/* Discount Value */}
              <div>
                <label className="text-[11px] font-extrabold text-slate-700 block mb-1">
                  Discount Value {discountType === 'PERCENTAGE' ? '(%)' : '(₹)'}
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    max={discountType === 'PERCENTAGE' ? 90 : 10000}
                    step={discountType === 'PERCENTAGE' ? 1 : 50}
                    value={discountValue}
                    onChange={(e) => setDiscountValue(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 text-xs font-bold text-slate-900 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none"
                  />
                  <span className="absolute right-3 top-2 text-slate-400 font-bold">
                    {discountType === 'PERCENTAGE' ? '%' : '₹'}
                  </span>
                </div>
              </div>

              {/* Applicable Service Category */}
              <div>
                <label className="text-[11px] font-extrabold text-slate-700 block mb-1">
                  Applicable Category
                </label>
                <select
                  value={discountCategoryScope}
                  onChange={(e) => setDiscountCategoryScope(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-bold text-slate-900 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none"
                >
                  <option value="ALL">All Categories (Local, One Way, Round Trip, Airport)</option>
                  <option value="LOCAL">LOCAL Only</option>
                  <option value="ONE_WAY">ONE WAY Only</option>
                  <option value="ROUND_TRIP">ROUND TRIP Only</option>
                  <option value="AIRPORT_TRANSFER">AIRPORT TRANSFER Only</option>
                </select>
              </div>

              {/* Applicable Vehicles */}
              <div>
                <label className="text-[11px] font-extrabold text-slate-700 block mb-1">
                  Applicable Vehicle
                </label>
                <select
                  value={discountVehicleScope}
                  onChange={(e) => setDiscountVehicleScope(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-bold text-slate-900 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none"
                >
                  <option value="ALL">All 5 Vehicle Categories</option>
                  {SIMPLE_VEHICLES_LIST.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setDiscountModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleApplyDiscount}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl shadow-sm flex items-center gap-1.5 cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Apply Discount</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: FARE PREVIEW MODAL (Side-by-side comparison before Publishing) */}
      {previewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 border border-slate-200 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                  <Eye className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-base text-slate-900">FARE PREVIEW (Live Synchronization)</h3>
                  <p className="text-xs text-slate-500">
                    Review sample route comparison before publishing to live booking pages
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPreviewModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Side-by-side Table Comparison */}
            <div className="border border-slate-200 rounded-2xl overflow-hidden text-xs">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-extrabold border-b border-slate-200">
                    <th className="p-3">Vehicle</th>
                    <th className="p-3">Service</th>
                    <th className="p-3">Current Fare (150km)</th>
                    <th className="p-3">New Fare (150km)</th>
                    <th className="p-3">Difference</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {SIMPLE_VEHICLES_LIST.map((veh) => {
                    const originalCfg = vehicleConfigs[veh.id];
                    const draftCfg = draftConfigs[veh.id] || originalCfg;

                    let origFare = 0;
                    let newFare = 0;

                    try {
                      origFare = calculateDynamicFare({
                        origin: 'Mysuru',
                        destination: 'Bengaluru',
                        distanceKm: 150,
                        durationMinutes: 180,
                        bookingType: internalBookingKey,
                        vehicleId: veh.id,
                        roundTripDays: 2,
                        customPricingConfig: originalCfg,
                      }).totalFare;
                    } catch {}

                    try {
                      newFare = calculateDynamicFare({
                        origin: 'Mysuru',
                        destination: 'Bengaluru',
                        distanceKm: 150,
                        durationMinutes: 180,
                        bookingType: internalBookingKey,
                        vehicleId: veh.id,
                        roundTripDays: 2,
                        customPricingConfig: draftCfg,
                      }).totalFare;
                    } catch {}

                    const diff = newFare - origFare;
                    const pct = origFare > 0 ? Math.round((diff / origFare) * 100) : 0;

                    return (
                      <tr key={veh.id} className="hover:bg-slate-50">
                        <td className="p-3">
                          <span className="font-bold text-slate-900">{veh.name}</span>
                        </td>
                        <td className="p-3 text-slate-600">{selectedTripType.replace('_', ' ')}</td>
                        <td className="p-3 font-semibold text-slate-600">₹{origFare.toLocaleString('en-IN')}</td>
                        <td className="p-3 font-black text-emerald-800">₹{newFare.toLocaleString('en-IN')}</td>
                        <td className="p-3">
                          {diff === 0 ? (
                            <span className="text-slate-400">No Change</span>
                          ) : (
                            <span
                              className={`font-black ${
                                diff > 0 ? 'text-amber-600' : 'text-emerald-700'
                              }`}
                            >
                              {diff > 0 ? `+₹${diff} (+${pct}%)` : `-₹${Math.abs(diff)} (${pct}%)`}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-600 space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-slate-900">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Publishing Confirmation Guarantee:</span>
              </div>
              <p className="text-[11px] text-slate-500">
                1. Increments pricing version to prevent stale cache conflicts.<br />
                2. Automatically writes an authoritative entry to the Fare Audit Log.<br />
                3. Existing confirmed customer bookings remain locked and unaffected.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setPreviewModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmPublish}
                disabled={saving}
                className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs rounded-xl shadow-md flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4" />
                <span>{saving ? 'Publishing Fares...' : 'Publish Fare'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
