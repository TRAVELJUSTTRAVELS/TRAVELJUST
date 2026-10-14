import React, { useState, useEffect } from 'react';
import {
  Tag,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Calendar,
  IndianRupee,
  Percent,
  X,
  ShieldCheck,
} from 'lucide-react';
import { DiscountRule } from '../../types/owner';
import { ownerService } from '../../services/ownerService';

export const OwnerDiscounts: React.FC = () => {
  const [discounts, setDiscounts] = useState<DiscountRule[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<Partial<DiscountRule> | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  const loadDiscounts = async () => {
    const list = await ownerService.getDiscounts();
    setDiscounts(list);
  };

  useEffect(() => {
    loadDiscounts();
  }, []);

  const handleOpenAdd = () => {
    setEditingRule({
      id: '',
      code: '',
      discountType: 'percentage',
      value: 10,
      applicableServices: ['all'],
      applicableVehicles: ['all'],
      minBookingValue: 2000,
      maxDiscount: 300,
      startDate: '2025-01-01',
      endDate: '2027-12-31',
      isActive: true,
      usageCount: 0,
      notes: '',
    });
    setModalOpen(true);
  };

  const handleSaveDiscount = async () => {
    if (!editingRule || !editingRule.code) return;
    const saved = await ownerService.saveDiscount(editingRule);
    if (saved) {
      setNotification(`Discount code ${saved.code} saved successfully`);
      setModalOpen(false);
      loadDiscounts();
      setTimeout(() => setNotification(null), 3000);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Delete this promo discount rule?')) {
      await ownerService.deleteDiscount(id);
      loadDiscounts();
    }
  };

  const handleToggleActive = async (rule: DiscountRule) => {
    await ownerService.saveDiscount({ ...rule, isActive: !rule.isActive });
    loadDiscounts();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Discount & Promo Code Manager</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Centrally configured coupons applied consistently across customer booking forms.
          </p>
        </div>
        <button
          type="button"
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs cursor-pointer shadow-xs"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Create Promo Code</span>
        </button>
      </div>

      {notification && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {/* Discount Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {discounts.map((d) => (
          <div
            key={d.id}
            className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between">
                <div>
                  <span className="font-mono text-base font-black text-emerald-700 tracking-wider bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                    {d.code}
                  </span>
                  <p className="text-xs text-slate-600 font-medium mt-2">{d.notes || 'Promotional coupon'}</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleToggleActive(d)}
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full border cursor-pointer ${
                    d.isActive
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-slate-100 text-slate-500 border-slate-200'
                  }`}
                >
                  {d.isActive ? 'ACTIVE' : 'INACTIVE'}
                </button>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 space-y-1.5 text-xs text-slate-600">
                <div className="flex items-center justify-between">
                  <span>Benefit:</span>
                  <span className="font-bold text-slate-900">
                    {d.discountType === 'percentage' ? `${d.value}% Off (Max ₹${d.maxDiscount})` : `Flat ₹${d.value} Off`}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Min Booking Value:</span>
                  <span className="font-bold text-slate-800">₹{d.minBookingValue}</span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span>Applicable Services:</span>
                  <span className="font-semibold text-slate-700 uppercase">
                    {d.applicableServices.join(', ')}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span>Times Redeemed:</span>
                  <span className="font-semibold text-slate-500">{d.usageCount} bookings</span>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-end">
              <button
                type="button"
                onClick={() => handleDelete(d.id)}
                className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {modalOpen && editingRule && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm">Create New Promo Code</h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Coupon Code</label>
                <input
                  type="text"
                  placeholder="e.g. MYSURU10 or AIRPORT100"
                  value={editingRule.code || ''}
                  onChange={(e) => setEditingRule({ ...editingRule, code: e.target.value.toUpperCase() })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 font-mono font-bold uppercase"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Type</label>
                  <select
                    value={editingRule.discountType}
                    onChange={(e) => setEditingRule({ ...editingRule, discountType: e.target.value as any })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 font-semibold"
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Flat Amount (₹)</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Discount Value</label>
                  <input
                    type="number"
                    value={editingRule.value || 0}
                    onChange={(e) => setEditingRule({ ...editingRule, value: Number(e.target.value) })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Min Booking (₹)</label>
                  <input
                    type="number"
                    value={editingRule.minBookingValue || 0}
                    onChange={(e) => setEditingRule({ ...editingRule, minBookingValue: Number(e.target.value) })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Max Discount Cap (₹)</label>
                  <input
                    type="number"
                    value={editingRule.maxDiscount || 0}
                    onChange={(e) => setEditingRule({ ...editingRule, maxDiscount: Number(e.target.value) })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Description / Notes</label>
                <input
                  type="text"
                  placeholder="e.g. 10% instant discount on outstation cabs"
                  value={editingRule.notes || ''}
                  onChange={(e) => setEditingRule({ ...editingRule, notes: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveDiscount}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 cursor-pointer"
              >
                Save Promo Code
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
