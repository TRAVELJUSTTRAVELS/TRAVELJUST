import React, { useState, useEffect } from 'react';
import {
  Baby,
  Luggage,
  Heart,
  Sparkles,
  Car,
  ShieldCheck,
  Users,
  Check,
  Plus,
  Minus,
  Info,
  Sliders,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { DynamicAddOnOption, SelectedAddOn, AddOnCategory } from '../types/addOns';
import { ServiceType } from '../types';
import { addOnService } from '../services/addOnService';

interface BookingAddOnsSelectorProps {
  serviceType: ServiceType;
  vehicleId?: string;
  selectedAddOns: SelectedAddOn[];
  onChange: (selected: SelectedAddOn[]) => void;
  tripDays?: number;
  className?: string;
}

export const BookingAddOnsSelector: React.FC<BookingAddOnsSelectorProps> = ({
  serviceType,
  vehicleId,
  selectedAddOns,
  onChange,
  tripDays = 1,
  className = '',
}) => {
  const [availableAddOns, setAvailableAddOns] = useState<DynamicAddOnOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>('all');
  const [isExpanded, setIsExpanded] = useState(true);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    addOnService
      .getAvailableAddOns(serviceType, vehicleId)
      .then((data) => {
        if (isMounted) {
          setAvailableAddOns(data);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        console.warn('Failed to load add-ons:', err);
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [serviceType, vehicleId]);

  const handleToggleAddOn = (addon: DynamicAddOnOption) => {
    const existingIndex = selectedAddOns.findIndex((s) => s.addOnId === addon.id);
    if (existingIndex >= 0) {
      // Remove
      const next = selectedAddOns.filter((s) => s.addOnId !== addon.id);
      onChange(next);
    } else {
      // Add with quantity 1
      const multiplier = addon.pricingType === 'per_day' ? Math.max(1, tripDays) : 1;
      const newItem: SelectedAddOn = {
        addOnId: addon.id,
        name: addon.name,
        shortLabel: addon.shortLabel,
        category: addon.category,
        quantity: 1,
        unitPrice: addon.price,
        pricingType: addon.pricingType,
        totalPrice: addon.price * multiplier,
      };
      onChange([...selectedAddOns, newItem]);
    }
  };

  const handleUpdateQuantity = (addonId: string, delta: number, maxQty: number) => {
    const existing = selectedAddOns.find((s) => s.addOnId === addonId);
    if (!existing) return;

    const newQty = existing.quantity + delta;
    if (newQty <= 0) {
      // Remove
      onChange(selectedAddOns.filter((s) => s.addOnId !== addonId));
    } else if (newQty <= maxQty) {
      const multiplier = existing.pricingType === 'per_day' ? Math.max(1, tripDays) : 1;
      const updated = selectedAddOns.map((s) =>
        s.addOnId === addonId
          ? {
              ...s,
              quantity: newQty,
              totalPrice: s.unitPrice * newQty * multiplier,
            }
          : s
      );
      onChange(updated);
    }
  };

  const getAddOnIcon = (iconName?: string, category?: AddOnCategory) => {
    const iconClass = 'w-4 h-4 stroke-[2.2]';
    if (iconName === 'baby' || category === 'child_seat') return <Baby className={iconClass} />;
    if (iconName === 'luggage' || category === 'luggage') return <Luggage className={iconClass} />;
    if (iconName === 'heart' || category === 'vehicle_requirement') return <Heart className={iconClass} />;
    if (iconName === 'sparkles' || category === 'comfort_amenity') return <Sparkles className={iconClass} />;
    if (iconName === 'users' || category === 'chauffeur_preference') return <Users className={iconClass} />;
    if (iconName === 'car') return <Car className={iconClass} />;
    return <ShieldCheck className={iconClass} />;
  };

  const filteredAddOns = availableAddOns.filter((addon) => {
    if (activeCategoryFilter === 'all') return true;
    if (activeCategoryFilter === 'free') return addon.price === 0;
    if (activeCategoryFilter === 'luggage') return addon.category === 'luggage';
    if (activeCategoryFilter === 'chauffeur') return addon.category === 'chauffeur_preference';
    if (activeCategoryFilter === 'comfort') return addon.category === 'comfort_amenity';
    if (activeCategoryFilter === 'vehicle') return addon.category === 'vehicle_requirement';
    return true;
  });

  const totalAddOnsCost = selectedAddOns.reduce((sum, item) => sum + item.totalPrice, 0);

  if (availableAddOns.length === 0 && !isLoading) {
    return null;
  }

  return (
    <div
      id="booking-dynamic-addons-section"
      className={`bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-xs overflow-hidden transition-all duration-200 ${className}`}
    >
      {/* Header with expand toggle */}
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className="p-4 sm:p-5 bg-gradient-to-r from-emerald-900/90 via-[#006045] to-emerald-950 text-white flex items-center justify-between cursor-pointer select-none"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-xs border border-white/20 flex items-center justify-center shrink-0 text-[#0ef10e]">
            <Sliders className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="font-extrabold text-base sm:text-lg text-white tracking-tight">
                Trip Add-ons & Amenities
              </h4>
              <span className="text-[10px] font-black uppercase tracking-wider bg-[#0ef10e] text-slate-950 px-2 py-0.5 rounded-full shadow-2xs">
                Customizable
              </span>
              {selectedAddOns.length > 0 && (
                <span className="text-[11px] font-bold bg-white/20 text-white px-2 py-0.5 rounded-full">
                  {selectedAddOns.length} Selected ({totalAddOnsCost === 0 ? 'Complimentary' : `+₹${totalAddOnsCost}`})
                </span>
              )}
            </div>
            <p className="text-xs text-emerald-100/90 mt-0.5">
              Select rooftop luggage arrangements, vehicle specifics, or chauffeur preferences
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            className="p-2 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Toggle section"
          >
            {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="p-4 sm:p-6 space-y-4">
          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
            <button
              type="button"
              onClick={() => setActiveCategoryFilter('all')}
              className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer ${
                activeCategoryFilter === 'all'
                  ? 'bg-emerald-800 text-white shadow-2xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              All Amenities ({availableAddOns.length})
            </button>
            {availableAddOns.some((a) => a.category === 'luggage') && (
              <button
                type="button"
                onClick={() => setActiveCategoryFilter('luggage')}
                className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer ${
                  activeCategoryFilter === 'luggage'
                    ? 'bg-emerald-800 text-white shadow-2xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                Extra Luggage
              </button>
            )}
            {availableAddOns.some((a) => a.category === 'chauffeur_preference') && (
              <button
                type="button"
                onClick={() => setActiveCategoryFilter('chauffeur')}
                className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer ${
                  activeCategoryFilter === 'chauffeur'
                    ? 'bg-emerald-800 text-white shadow-2xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                Chauffeur Preferences
              </button>
            )}
            {availableAddOns.some((a) => a.category === 'vehicle_requirement') && (
              <button
                type="button"
                onClick={() => setActiveCategoryFilter('vehicle')}
                className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer ${
                  activeCategoryFilter === 'vehicle'
                    ? 'bg-emerald-800 text-white shadow-2xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                Vehicle Specifics
              </button>
            )}
            {availableAddOns.some((a) => a.category === 'comfort_amenity') && (
              <button
                type="button"
                onClick={() => setActiveCategoryFilter('comfort')}
                className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer ${
                  activeCategoryFilter === 'comfort'
                    ? 'bg-emerald-800 text-white shadow-2xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                Comfort Amenities
              </button>
            )}
            {availableAddOns.some((a) => a.price === 0) && (
              <button
                type="button"
                onClick={() => setActiveCategoryFilter('free')}
                className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer ${
                  activeCategoryFilter === 'free'
                    ? 'bg-emerald-800 text-white shadow-2xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                Complimentary (₹0)
              </button>
            )}
          </div>

          {/* Add-ons Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-3.5">
            {filteredAddOns.map((addon) => {
              const selectedItem = selectedAddOns.find((s) => s.addOnId === addon.id);
              const isSelected = Boolean(selectedItem);
              const isFree = addon.price === 0;

              return (
                <div
                  key={addon.id}
                  className={`relative p-3.5 sm:p-4 rounded-2xl border transition-all duration-150 flex flex-col justify-between ${
                    isSelected
                      ? 'bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-500 dark:border-emerald-600 shadow-xs ring-1 ring-emerald-500/30'
                      : 'bg-slate-50/70 dark:bg-slate-800/60 border-slate-200/90 dark:border-slate-700/80 hover:border-slate-300 dark:hover:border-slate-600'
                  }`}
                >
                  <div className="space-y-2">
                    {/* Top Row: Icon + Badge + Pricing */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                            isSelected
                              ? 'bg-emerald-700 text-white shadow-xs'
                              : 'bg-white dark:bg-slate-700 text-emerald-800 dark:text-emerald-300 border border-slate-200 dark:border-slate-600'
                          }`}
                        >
                          {getAddOnIcon(addon.iconName, addon.category)}
                        </div>
                        <div>
                          <h5 className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm leading-snug">
                            {addon.name}
                          </h5>
                          {addon.badge && (
                            <span className="inline-block text-[10px] font-extrabold uppercase tracking-wider text-emerald-700 dark:text-emerald-300 bg-emerald-100/70 dark:bg-emerald-900/60 px-1.5 py-0.2 rounded-md mt-0.5">
                              {addon.badge}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Price Pill */}
                      <div className="text-right shrink-0">
                        {isFree ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-black bg-emerald-100 text-emerald-900 dark:bg-emerald-900 dark:text-emerald-100 uppercase tracking-wider">
                            Free
                          </span>
                        ) : (
                          <div className="space-y-0.2">
                            <span className="font-black text-sm text-slate-900 dark:text-white">
                              ₹{addon.price}
                            </span>
                            <span className="text-[10px] text-slate-500 dark:text-slate-400 block -mt-0.5">
                              {addon.pricingType === 'per_day' ? '/ day' : '/ trip'}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Description */}
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed pl-10 pr-2">
                      {addon.description}
                    </p>
                  </div>

                  {/* Bottom Action Row */}
                  <div className="mt-3 pt-2.5 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between gap-2">
                    {/* Quantity Stepper (if selected and maxQuantity > 1) */}
                    {isSelected && addon.maxQuantity > 1 ? (
                      <div className="flex items-center gap-1.5 bg-white dark:bg-slate-700 rounded-xl border border-slate-200 dark:border-slate-600 p-0.5 shadow-2xs">
                        <button
                          type="button"
                          onClick={() => handleUpdateQuantity(addon.id, -1, addon.maxQuantity)}
                          className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-slate-600 hover:bg-slate-200 text-slate-700 dark:text-slate-200 flex items-center justify-center cursor-pointer transition-colors"
                          aria-label="Decrease quantity"
                        >
                          <Minus className="w-3 h-3 stroke-[2.5]" />
                        </button>
                        <span className="text-xs font-black px-1.5 min-w-[20px] text-center text-slate-900 dark:text-white">
                          {selectedItem?.quantity || 1}
                        </span>
                        <button
                          type="button"
                          disabled={(selectedItem?.quantity || 1) >= addon.maxQuantity}
                          onClick={() => handleUpdateQuantity(addon.id, 1, addon.maxQuantity)}
                          className="w-6 h-6 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white flex items-center justify-center cursor-pointer transition-colors"
                          aria-label="Increase quantity"
                        >
                          <Plus className="w-3 h-3 stroke-[2.5]" />
                        </button>
                        <span className="text-[10px] text-slate-400 pl-1 pr-1 font-semibold">
                          (max {addon.maxQuantity})
                        </span>
                      </div>
                    ) : (
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                        {isSelected ? 'Amenity included with cab' : 'Optional configuration'}
                      </span>
                    )}

                    {/* Select / Deselect Button */}
                    <button
                      type="button"
                      onClick={() => handleToggleAddOn(addon)}
                      className={`px-3.5 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-emerald-700 hover:bg-emerald-800 text-white shadow-2xs'
                          : 'bg-white dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600'
                      }`}
                    >
                      {isSelected ? (
                        <>
                          <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                          <span>Added</span>
                        </>
                      ) : (
                        <>
                          <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                          <span>Add to Trip</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Bottom Summary Bar if add-ons selected */}
          {selectedAddOns.length > 0 && (
            <div className="p-3.5 sm:p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in duration-150">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-emerald-700 text-white flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
                </div>
                <div>
                  <div className="text-xs font-bold text-emerald-950 dark:text-emerald-100">
                    Selected Amenities: {selectedAddOns.map((s) => `${s.quantity > 1 ? `${s.quantity}x ` : ''}${s.shortLabel || s.name}`).join(' • ')}
                  </div>
                  <div className="text-[11px] text-emerald-800 dark:text-emerald-300">
                    The chauffeur and fleet manager will prepare the cab accordingly prior to reporting.
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-emerald-800 dark:text-emerald-300 block">
                    Add-ons Subtotal
                  </span>
                  <span className="text-sm font-black text-emerald-950 dark:text-emerald-100">
                    {totalAddOnsCost === 0 ? 'Complimentary' : `+₹${totalAddOnsCost.toLocaleString('en-IN')}`}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => onChange([])}
                  className="text-xs text-rose-600 hover:text-rose-700 font-bold underline cursor-pointer"
                >
                  Clear All
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
