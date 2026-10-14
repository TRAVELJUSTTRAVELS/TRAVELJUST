import React, { useState, useEffect } from 'react';
import {
  Sliders,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Search,
  RefreshCw,
  X,
  Baby,
  Luggage,
  Heart,
  Sparkles,
  Car,
  ShieldCheck,
  Users,
  IndianRupee,
  Eye,
  Check,
  ToggleLeft,
  ToggleRight,
  HelpCircle,
} from 'lucide-react';
import { DynamicAddOnOption, AddOnCategory, AddOnPricingType } from '../../types/addOns';
import { addOnService } from '../../services/addOnService';

export const OwnerAddOns: React.FC = () => {
  const [addOns, setAddOns] = useState<DynamicAddOnOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'disabled'>('all');

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingAddOn, setEditingAddOn] = useState<Partial<DynamicAddOnOption> | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3500);
  };

  const loadData = async () => {
    setIsLoading(true);
    try {
      const data = await addOnService.getOwnerAddOns();
      setAddOns(data);
    } catch (err) {
      console.warn('Failed to load add-ons in owner portal:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenAddModal = () => {
    setEditingAddOn({
      id: '',
      name: '',
      shortLabel: '',
      category: 'comfort_amenity',
      description: '',
      price: 150,
      pricingType: 'per_trip',
      applicableServices: ['all'],
      maxQuantity: 1,
      enabled: true,
      isPopular: false,
      iconName: 'sparkles',
      badge: 'New',
    });
    setModalOpen(true);
  };

  const handleOpenEditModal = (item: DynamicAddOnOption) => {
    setEditingAddOn({ ...item });
    setModalOpen(true);
  };

  const handleSaveAddOn = async () => {
    if (!editingAddOn || !editingAddOn.name?.trim()) {
      showNotification('Please enter an Amenity / Add-on name', 'error');
      return;
    }

    setIsSaving(true);
    try {
      const res = await addOnService.saveAddOn(editingAddOn);
      if (res) {
        showNotification(`Amenity "${res.name}" saved and live on booking flow!`);
        setModalOpen(false);
        loadData();
      } else {
        showNotification('Failed to save amenity', 'error');
      }
    } catch (err) {
      showNotification('Save error', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggle = async (item: DynamicAddOnOption) => {
    const nextState = !item.enabled;
    const res = await addOnService.toggleAddOn(item.id, nextState);
    if (res) {
      showNotification(`"${item.name}" is now ${nextState ? 'Active (Live)' : 'Disabled'}`);
      setAddOns((prev) =>
        prev.map((a) => (a.id === item.id ? { ...a, enabled: nextState } : a))
      );
    }
  };

  const handleDelete = async (item: DynamicAddOnOption) => {
    if (window.confirm(`Are you sure you want to remove the amenity "${item.name}"?`)) {
      const ok = await addOnService.deleteAddOn(item.id);
      if (ok) {
        showNotification(`Amenity "${item.name}" deleted.`);
        setAddOns((prev) => prev.filter((a) => a.id !== item.id));
      }
    }
  };

  const handleQuickPriceChange = async (item: DynamicAddOnOption, delta: number) => {
    const newPrice = Math.max(0, item.price + delta);
    const updated = { ...item, price: newPrice };
    const res = await addOnService.saveAddOn(updated);
    if (res) {
      showNotification(`Price updated for "${item.name}" to ₹${newPrice}`);
      setAddOns((prev) =>
        prev.map((a) => (a.id === item.id ? { ...a, price: newPrice } : a))
      );
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

  const filteredAddOns = addOns.filter((addon) => {
    if (categoryFilter !== 'all' && addon.category !== categoryFilter) return false;
    if (statusFilter === 'active' && !addon.enabled) return false;
    if (statusFilter === 'disabled' && addon.enabled) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const match =
        addon.name.toLowerCase().includes(q) ||
        addon.description.toLowerCase().includes(q) ||
        addon.shortLabel?.toLowerCase().includes(q) ||
        addon.category.toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

  const activeCount = addOns.filter((a) => a.enabled).length;
  const freeCount = addOns.filter((a) => a.price === 0).length;
  const paidCount = addOns.filter((a) => a.price > 0).length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 animate-in fade-in duration-200">
      {/* Toast Notification */}
      {notification && (
        <div
          className={`fixed top-20 right-6 z-50 p-4 rounded-2xl shadow-xl flex items-center gap-3 border text-sm font-bold animate-in slide-in-from-top duration-200 ${
            notification.type === 'success'
              ? 'bg-emerald-900 text-white border-emerald-700'
              : 'bg-rose-900 text-white border-rose-700'
          }`}
        >
          {notification.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-[#0ef10e]" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-300" />
          )}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200 mb-1">
            <Sliders className="w-3.5 h-3.5 text-emerald-600" />
            <span>Owner & Fleet Management Portal</span>
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">
            Dynamic Add-on Services & Amenities
          </h2>
          <p className="text-sm text-slate-500 max-w-2xl">
            Configure, price, and customize optional amenities offered to customers during booking.
            Changes sync instantly to the live customer booking flow.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={loadData}
            title="Refresh Amenities"
            className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <button
            type="button"
            onClick={handleOpenAddModal}
            className="px-5 py-2.5 rounded-xl bg-[#0a4d3c] hover:bg-[#07382c] text-white text-xs sm:text-sm font-bold flex items-center gap-2 shadow-sm transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 text-[#0ef10e]" />
            <span>Add New Amenity</span>
          </button>
        </div>
      </div>

      {/* Stats Metric Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-400 block uppercase tracking-wider">
            Total Amenities
          </span>
          <span className="text-2xl font-black text-slate-900 mt-1 block">
            {addOns.length}
          </span>
          <span className="text-[11px] text-slate-500 mt-0.5 block">
            In system catalog
          </span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-bold text-emerald-600 block uppercase tracking-wider">
            Active / Live
          </span>
          <span className="text-2xl font-black text-emerald-700 mt-1 block">
            {activeCount}
          </span>
          <span className="text-[11px] text-emerald-600/80 mt-0.5 block">
            Offered in booking flow
          </span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-bold text-blue-600 block uppercase tracking-wider">
            Paid Add-ons
          </span>
          <span className="text-2xl font-black text-blue-700 mt-1 block">
            {paidCount}
          </span>
          <span className="text-[11px] text-blue-600/80 mt-0.5 block">
            Revenue generators
          </span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-bold text-purple-600 block uppercase tracking-wider">
            Complimentary Perks
          </span>
          <span className="text-2xl font-black text-purple-700 mt-1 block">
            {freeCount}
          </span>
          <span className="text-[11px] text-purple-600/80 mt-0.5 block">
            Zero cost (₹0) perks
          </span>
        </div>
      </div>

      {/* Controls & Filter Strip */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, luggage, driver language..."
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:bg-white transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl text-xs font-bold text-slate-600">
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                statusFilter === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'hover:text-slate-900'
              }`}
            >
              All ({addOns.length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('active')}
              className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                statusFilter === 'active' ? 'bg-white text-emerald-800 shadow-xs' : 'hover:text-slate-900'
              }`}
            >
              Active ({activeCount})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('disabled')}
              className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                statusFilter === 'disabled' ? 'bg-white text-slate-900 shadow-xs' : 'hover:text-slate-900'
              }`}
            >
              Disabled ({addOns.length - activeCount})
            </button>
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs pt-1 border-t border-slate-100">
          <span className="text-slate-400 font-bold mr-1 shrink-0">Category:</span>
          {[
            { id: 'all', label: 'All Categories' },
            { id: 'luggage', label: 'Extra Luggage' },
            { id: 'chauffeur_preference', label: 'Chauffeur Preferences' },
            { id: 'vehicle_requirement', label: 'Vehicle Specifics' },
            { id: 'comfort_amenity', label: 'Comfort Amenities' },
          ].map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setCategoryFilter(cat.id)}
              className={`px-3 py-1 rounded-lg font-bold whitespace-nowrap transition-all cursor-pointer ${
                categoryFilter === cat.id
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main List of Add-ons */}
      {filteredAddOns.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-3">
          <Sliders className="w-12 h-12 text-slate-300 mx-auto" />
          <h4 className="font-bold text-slate-800 text-lg">No Add-on Amenities Found</h4>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            {searchQuery
              ? `No amenities matched "${searchQuery}". Try a different search.`
              : 'Click "Add New Amenity" above to configure your first dynamic amenity option.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredAddOns.map((item) => (
            <div
              key={item.id}
              className={`bg-white rounded-2xl border transition-all duration-150 p-5 flex flex-col justify-between shadow-2xs ${
                item.enabled ? 'border-slate-200 hover:border-emerald-300' : 'border-slate-200/60 bg-slate-50/50 opacity-80'
              }`}
            >
              <div className="space-y-3">
                {/* Header row */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-2xs ${
                        item.enabled
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          : 'bg-slate-100 text-slate-400 border border-slate-200'
                      }`}
                    >
                      {getAddOnIcon(item.iconName, item.category)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-bold text-slate-900 text-sm">{item.name}</h4>
                        {item.badge && (
                          <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.2 rounded-md bg-emerald-100 text-emerald-800">
                            {item.badge}
                          </span>
                        )}
                        {item.isPopular && (
                          <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.2 rounded-md bg-amber-100 text-amber-800">
                            Popular
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-400 font-semibold block capitalize">
                        {item.category.replace('_', ' ')} • Max Qty: {item.maxQuantity}
                      </span>
                    </div>
                  </div>

                  {/* Active Toggle Switch */}
                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={`text-[11px] font-bold ${
                        item.enabled ? 'text-emerald-700' : 'text-slate-400'
                      }`}
                    >
                      {item.enabled ? 'Live' : 'Off'}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleToggle(item)}
                      className="cursor-pointer text-slate-400 hover:text-slate-600 transition-colors"
                      title={item.enabled ? 'Deactivate amenity' : 'Activate amenity'}
                    >
                      {item.enabled ? (
                        <ToggleRight className="w-7 h-7 text-emerald-600" />
                      ) : (
                        <ToggleLeft className="w-7 h-7 text-slate-300" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Description */}
                <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  {item.description}
                </p>

                {/* Service scope */}
                <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-medium">
                  <span className="font-bold text-slate-600">Applicable for:</span>
                  {item.applicableServices.includes('all') ? (
                    <span className="bg-slate-100 px-2 py-0.5 rounded-md text-slate-700 font-semibold">
                      All Services (Local, One-Way, Round-Trip, Airport)
                    </span>
                  ) : (
                    item.applicableServices.map((s) => (
                      <span
                        key={s}
                        className="bg-blue-50 text-blue-700 uppercase text-[10px] font-bold px-2 py-0.5 rounded-md"
                      >
                        {s}
                      </span>
                    ))
                  )}
                </div>
              </div>

              {/* Pricing & Management Row */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
                {/* Price Display & Quick Adjust */}
                <div className="flex items-center gap-2">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block -mb-0.5">
                      Customer Price
                    </span>
                    {item.price === 0 ? (
                      <span className="text-sm font-black text-emerald-700 uppercase">
                        Complimentary (₹0)
                      </span>
                    ) : (
                      <div className="flex items-baseline gap-1">
                        <span className="text-base font-black text-slate-900">
                          ₹{item.price}
                        </span>
                        <span className="text-[10px] text-slate-500 font-bold">
                          {item.pricingType === 'per_day' ? '/ day' : '/ trip'}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Quick +/- 50 buttons for paid add-ons */}
                  {item.price > 0 && (
                    <div className="flex items-center gap-1 pl-2">
                      <button
                        type="button"
                        onClick={() => handleQuickPriceChange(item, -50)}
                        title="Reduce price by ₹50"
                        className="px-1.5 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold cursor-pointer transition-colors"
                      >
                        -50
                      </button>
                      <button
                        type="button"
                        onClick={() => handleQuickPriceChange(item, 50)}
                        title="Increase price by ₹50"
                        className="px-1.5 py-0.5 rounded-md bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-[10px] font-bold cursor-pointer transition-colors"
                      >
                        +50
                      </button>
                    </div>
                  )}
                </div>

                {/* Edit & Delete Actions */}
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleOpenEditModal(item)}
                    className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
                    title="Edit amenity configuration & price"
                  >
                    <Edit2 className="w-3.5 h-3.5 text-slate-600" />
                    <span>Edit</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(item)}
                    className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 transition-colors cursor-pointer"
                    title="Delete amenity"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL: Add / Edit Amenity */}
      {modalOpen && editingAddOn && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-7 shadow-2xl border border-slate-100 space-y-4 my-8 relative overflow-hidden">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center font-bold">
                  <Sliders className="w-4 h-4 text-emerald-700" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900">
                    {editingAddOn.id ? 'Edit Amenity / Add-on' : 'Create New Amenity'}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Configured items will appear on the customer booking screen
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              {/* Name & Short Label */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Amenity Name *
                  </label>
                  <input
                    type="text"
                    value={editingAddOn.name || ''}
                    onChange={(e) =>
                      setEditingAddOn({ ...editingAddOn, name: e.target.value })
                    }
                    placeholder="e.g. Overhead Roof Luggage Carrier"
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 font-semibold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-700"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Short Label (Badge on mobile)
                  </label>
                  <input
                    type="text"
                    value={editingAddOn.shortLabel || ''}
                    onChange={(e) =>
                      setEditingAddOn({ ...editingAddOn, shortLabel: e.target.value })
                    }
                    placeholder="e.g. Roof Carrier"
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 font-semibold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-700"
                  />
                </div>
              </div>

              {/* Category & Icon */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Amenity Category
                  </label>
                  <select
                    value={editingAddOn.category || 'comfort_amenity'}
                    onChange={(e) =>
                      setEditingAddOn({
                        ...editingAddOn,
                        category: e.target.value as AddOnCategory,
                      })
                    }
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 font-semibold text-slate-800 focus:bg-white"
                  >
                    <option value="child_seat">Child Safety Seat</option>
                    <option value="luggage">Extra Luggage / Roof Carrier</option>
                    <option value="vehicle_requirement">Vehicle Specifics / Extra Space</option>
                    <option value="comfort_amenity">Comfort Amenities</option>
                    <option value="chauffeur_preference">Chauffeur Preference (Language, etc.)</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Icon Theme
                  </label>
                  <select
                    value={editingAddOn.iconName || 'sparkles'}
                    onChange={(e) =>
                      setEditingAddOn({
                        ...editingAddOn,
                        iconName: e.target.value as any,
                      })
                    }
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 font-semibold text-slate-800 focus:bg-white"
                  >
                    <option value="baby">Baby / Child Seat</option>
                    <option value="luggage">Luggage / Suitcase</option>
                    <option value="heart">Heart / Priority Care</option>
                    <option value="sparkles">Sparkles / Executive Feature</option>
                    <option value="shield">Shield / Safety & Protection</option>
                    <option value="users">Users / Chauffeur Language</option>
                    <option value="car">Car / Vehicle Feature</option>
                  </select>
                </div>
              </div>

              {/* Price & Pricing Type */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Price (₹ INR) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="10"
                    value={editingAddOn.price ?? 0}
                    onChange={(e) =>
                      setEditingAddOn({ ...editingAddOn, price: Number(e.target.value) })
                    }
                    placeholder="0 for Free"
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 font-black text-slate-900 text-sm focus:bg-white"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    Set 0 for complimentary
                  </span>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Pricing Mode
                  </label>
                  <select
                    value={editingAddOn.pricingType || 'per_trip'}
                    onChange={(e) =>
                      setEditingAddOn({
                        ...editingAddOn,
                        pricingType: e.target.value as AddOnPricingType,
                      })
                    }
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 font-semibold text-slate-800 focus:bg-white"
                  >
                    <option value="per_trip">Per Trip (Flat)</option>
                    <option value="per_day">Per Day (Multi-day tours)</option>
                    <option value="free">Complimentary (₹0)</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Max Quantity Per Booking
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={editingAddOn.maxQuantity || 1}
                    onChange={(e) =>
                      setEditingAddOn({
                        ...editingAddOn,
                        maxQuantity: Math.max(1, Number(e.target.value)),
                      })
                    }
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 font-bold text-slate-800 focus:bg-white"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    e.g. 1 or 2 per booking
                  </span>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Customer Description *
                </label>
                <textarea
                  rows={2}
                  value={editingAddOn.description || ''}
                  onChange={(e) =>
                    setEditingAddOn({ ...editingAddOn, description: e.target.value })
                  }
                  placeholder="Explain why this amenity is beneficial and how it is fulfilled (e.g. Sanitized car seat, verified chauffeur language, etc.)"
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 font-medium text-slate-800 focus:bg-white"
                />
              </div>

              {/* Badge & Popular Toggle */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Marketing Badge (Optional)
                  </label>
                  <input
                    type="text"
                    value={editingAddOn.badge || ''}
                    onChange={(e) =>
                      setEditingAddOn({ ...editingAddOn, badge: e.target.value })
                    }
                    placeholder="e.g. Family Essential, Extra Bags, Popular"
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 font-semibold text-slate-800"
                  />
                </div>

                <div className="flex items-center gap-4 pt-6">
                  <label className="inline-flex items-center gap-2 cursor-pointer font-bold text-slate-700">
                    <input
                      type="checkbox"
                      checked={Boolean(editingAddOn.enabled)}
                      onChange={(e) =>
                        setEditingAddOn({ ...editingAddOn, enabled: e.target.checked })
                      }
                      className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                    />
                    <span>Active in Booking Flow</span>
                  </label>

                  <label className="inline-flex items-center gap-2 cursor-pointer font-bold text-slate-700">
                    <input
                      type="checkbox"
                      checked={Boolean(editingAddOn.isPopular)}
                      onChange={(e) =>
                        setEditingAddOn({ ...editingAddOn, isPopular: e.target.checked })
                      }
                      className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                    />
                    <span>Highlight as Popular</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveAddOn}
                disabled={isSaving}
                className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 cursor-pointer disabled:opacity-60 flex items-center gap-2 shadow-sm"
              >
                <Check className="w-4 h-4 text-[#0ef10e]" />
                <span>{isSaving ? 'Saving...' : 'Save & Publish Amenity'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
