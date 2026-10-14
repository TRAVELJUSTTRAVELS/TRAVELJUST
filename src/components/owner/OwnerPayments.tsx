import React, { useState, useEffect } from 'react';
import {
  IndianRupee,
  Search,
  CheckCircle2,
  Clock,
  FileText,
  Plus,
  RefreshCw,
  X,
  CreditCard,
  AlertCircle,
} from 'lucide-react';
import { PaymentRecord } from '../../types/owner';
import { DbBookingRecord } from '../../types';
import { ownerService } from '../../services/ownerService';
import { generateInvoicePDF } from '../../utils/generateInvoicePdf';
import { InvoicePreviewModal } from './InvoicePreviewModal';

export const OwnerPayments: React.FC = () => {
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modal
  const [payModalOpen, setPayModalOpen] = useState(false);
  const [editingPayment, setEditingPayment] = useState<Partial<PaymentRecord> | null>(null);
  const [invoicePreviewModalOpen, setInvoicePreviewModalOpen] = useState(false);
  const [invoiceBooking, setInvoiceBooking] = useState<DbBookingRecord | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    const [pList, bList] = await Promise.all([
      ownerService.getPayments(),
      ownerService.getBookings(),
    ]);
    setPayments(pList);
    setBookings(bList);
    setIsLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenRecordPayment = (b?: any) => {
    const total = b ? Number(b.total_estimated_fare) || 0 : 0;
    setEditingPayment({
      bookingId: b ? b.reference_id : '',
      customerName: b ? b.full_name : '',
      customerPhone: b ? b.mobile_number : '',
      totalAmount: total,
      discountAmount: 0,
      paidAmount: total,
      paymentMethod: 'ONLINE_UPI',
      transactionRef: `UPI-${Date.now().toString().slice(-6)}`,
      notes: 'Payment confirmed via UPI',
    });
    setPayModalOpen(true);
  };

  const handleSavePayment = async () => {
    if (!editingPayment) return;
    await ownerService.recordPayment(editingPayment);
    setPayModalOpen(false);
    loadData();
  };

  const createPaymentInvoiceRecord = (p: PaymentRecord): DbBookingRecord => {
    const matched = bookings.find((b) => b.reference_id === p.bookingId);
    return {
      reference_id: p.bookingId || 'TJ-BK-001',
      full_name: p.customerName || 'Customer',
      mobile_number: p.customerPhone || '',
      email: matched?.email || 'traveljustmysuru@gmail.com',
      service_type: matched?.service_type || 'OUTSTATION',
      pickup_location: matched?.pickup_location || 'Mysuru',
      drop_location: matched?.drop_location || 'Destination',
      travel_date: matched?.travel_date || new Date().toISOString().split('T')[0],
      pickup_time: matched?.pickup_time || '08:00 AM',
      return_date: matched?.return_date,
      return_time: matched?.return_time,
      duration_hours: matched?.duration_hours,
      estimated_distance_km: matched?.estimated_distance_km,
      passengers_count: matched?.passengers_count,
      vehicle_id: matched?.vehicle_id,
      vehicle_name: matched?.vehicle_name || 'Fleet Cab',
      vehicle_category: matched?.vehicle_category,
      total_estimated_fare: p.finalAmount || 0,
      base_fare: Math.round((p.finalAmount || 0) * 0.85),
      discount_amount: p.discountAmount || 0,
      discount_label: p.discountAmount > 0 ? 'Promo Discount' : undefined,
      tax_amount: Math.round((p.finalAmount || 0) * 0.05),
      toll_amount: matched?.toll_amount || 0,
      driver_allowance: matched?.driver_allowance || 0,
      driver_name: matched?.driver_name,
      driver_phone: matched?.driver_phone,
      driver_vehicle_plate: matched?.driver_vehicle_plate,
      status: p.status === 'PAID' ? 'CONFIRMED' : 'PAYMENT PENDING',
      special_instructions: matched?.special_instructions,
      created_at: p.paidAt || p.updatedAt || new Date().toISOString(),
    };
  };

  const handleOpenInvoicePreview = (p: PaymentRecord) => {
    const invoiceRecord = createPaymentInvoiceRecord(p);
    setInvoiceBooking(invoiceRecord);
    setInvoicePreviewModalOpen(true);
  };

  const handleDownloadInvoice = (p: PaymentRecord) => {
    const invoiceRecord = createPaymentInvoiceRecord(p);
    generateInvoicePDF(invoiceRecord);
  };

  const filteredPayments = payments.filter((p) => {
    if (statusFilter !== 'ALL' && p.status !== statusFilter) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return p.bookingId.toLowerCase().includes(q) || p.customerName.toLowerCase().includes(q) || p.customerPhone.includes(q);
  });

  const totalCollected = payments.reduce((sum, p) => sum + (Number(p.paidAmount) || 0), 0);
  const totalPending = payments.reduce((sum, p) => sum + (Number(p.balanceAmount) || 0), 0);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Payments & Invoicing Ledger</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Centralized revenue tracker, payment collections, outstanding balances, and official PDF invoice receipts.
          </p>
        </div>
        <button
          type="button"
          onClick={() => handleOpenRecordPayment()}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs cursor-pointer shadow-xs"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Record Payment</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Collected</span>
          <p className="text-2xl font-black text-emerald-700 mt-1">₹{totalCollected.toLocaleString('en-IN')}</p>
        </div>
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Pending Balances</span>
          <p className="text-2xl font-black text-amber-600 mt-1">₹{totalPending.toLocaleString('en-IN')}</p>
        </div>
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Transactions</span>
          <p className="text-2xl font-black text-slate-900 mt-1">{payments.length} Records</p>
        </div>
      </div>

      {/* Filter and Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative min-w-[240px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search by Booking ID, customer..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:outline-none"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 font-semibold"
          >
            <option value="ALL">All Payment Statuses</option>
            <option value="PAID">PAID</option>
            <option value="PARTIAL">PARTIAL</option>
            <option value="PENDING">PENDING</option>
            <option value="REFUNDED">REFUNDED</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="p-3.5 pl-5">Booking ID</th>
                <th className="p-3.5">Customer</th>
                <th className="p-3.5">Total / Discount</th>
                <th className="p-3.5">Paid</th>
                <th className="p-3.5">Balance</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5">Method</th>
                <th className="p-3.5 pr-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {filteredPayments.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50/60">
                  <td className="p-3.5 pl-5 font-bold text-slate-900 font-mono">
                    <button
                      type="button"
                      onClick={() => handleOpenInvoicePreview(p)}
                      title="View formatted invoice preview"
                      className="text-emerald-700 hover:text-emerald-950 hover:underline cursor-pointer font-bold font-mono text-left"
                    >
                      #{p.bookingId}
                    </button>
                  </td>
                  <td className="p-3.5">
                    <span className="font-bold text-slate-900 block">{p.customerName}</span>
                    <span className="text-[11px] text-slate-400">{p.customerPhone}</span>
                  </td>
                  <td className="p-3.5">
                    <span className="font-bold text-slate-900">₹{p.finalAmount}</span>
                    {p.discountAmount > 0 && (
                      <span className="text-[10px] text-emerald-600 block">(-₹{p.discountAmount} promo)</span>
                    )}
                  </td>
                  <td className="p-3.5 font-bold text-emerald-700">₹{p.paidAmount}</td>
                  <td className="p-3.5 font-bold text-amber-600">₹{p.balanceAmount}</td>
                  <td className="p-3.5">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        p.status === 'PAID'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : p.status === 'PARTIAL'
                          ? 'bg-blue-50 text-blue-700 border-blue-200'
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}
                    >
                      {p.status}
                    </span>
                  </td>
                  <td className="p-3.5 text-slate-500 font-mono text-[11px]">{p.paymentMethod}</td>
                  <td className="p-3.5 pr-5 text-right">
                    <button
                      type="button"
                      onClick={() => handleOpenInvoicePreview(p)}
                      title="View Formatted Invoice Preview"
                      className="px-2.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-850 text-[11px] font-bold border border-emerald-200 transition-colors cursor-pointer inline-flex items-center gap-1 shadow-2xs"
                    >
                      <FileText className="w-3.5 h-3.5 text-emerald-600" />
                      <span>View Invoice</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payment Modal */}
      {payModalOpen && editingPayment && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm">Record Payment Transaction</h3>
              <button
                type="button"
                onClick={() => setPayModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Booking Reference ID</label>
                <input
                  type="text"
                  placeholder="e.g. TJ-12345"
                  value={editingPayment.bookingId || ''}
                  onChange={(e) => setEditingPayment({ ...editingPayment, bookingId: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 font-mono font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Total Amount (₹)</label>
                  <input
                    type="number"
                    value={editingPayment.totalAmount || 0}
                    onChange={(e) => setEditingPayment({ ...editingPayment, totalAmount: Number(e.target.value) })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 font-bold"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Amount Paid (₹)</label>
                  <input
                    type="number"
                    value={editingPayment.paidAmount || 0}
                    onChange={(e) => setEditingPayment({ ...editingPayment, paidAmount: Number(e.target.value) })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 font-bold text-emerald-700"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Payment Method</label>
                <select
                  value={editingPayment.paymentMethod}
                  onChange={(e) => setEditingPayment({ ...editingPayment, paymentMethod: e.target.value as any })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 font-semibold"
                >
                  <option value="ONLINE_UPI">ONLINE UPI (GPay / PhonePe / Paytm)</option>
                  <option value="CASH_TO_DRIVER">CASH TO CHAUFFEUR</option>
                  <option value="BANK_TRANSFER">NEFT / RTGS / IMPS</option>
                  <option value="CARD">CREDIT / DEBIT CARD</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Transaction Ref / UPI UTR</label>
                <input
                  type="text"
                  placeholder="UPI transaction reference"
                  value={editingPayment.transactionRef || ''}
                  onChange={(e) => setEditingPayment({ ...editingPayment, transactionRef: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 font-mono"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setPayModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSavePayment}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 cursor-pointer"
              >
                Save Payment & Update Ledger
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Professional Tax Invoice & Receipt Preview */}
      <InvoicePreviewModal
        isOpen={invoicePreviewModalOpen}
        onClose={() => {
          setInvoicePreviewModalOpen(false);
          setInvoiceBooking(null);
        }}
        booking={invoiceBooking}
      />
    </div>
  );
};
