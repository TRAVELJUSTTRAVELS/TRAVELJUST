import React, { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  Car,
  User,
  Calendar,
  Clock,
  MapPin,
  CheckCircle2,
  AlertCircle,
  MessageSquare,
  FileText,
  UserCheck,
  Edit3,
  IndianRupee,
  RefreshCw,
  Eye,
  X,
  ChevronRight,
  ShieldAlert,
  CalendarRange,
  RotateCcw,
  SlidersHorizontal,
  Layers,
  Loader2,
} from 'lucide-react';
import { BookingLifecycleStatus, VehicleRecord, ChauffeurRecord } from '../../types/owner';
import { DbBookingRecord } from '../../types';
import { ownerService } from '../../services/ownerService';
import { generateInvoicePDF } from '../../utils/generateInvoicePdf';
import { InvoicePreviewModal } from './InvoicePreviewModal';
import { ProgressBar } from '../DynamicLoadingIndicator';

interface OwnerBookingsProps {
  onNavigateTab: (tab: string) => void;
}

const ALL_STATUSES: BookingLifecycleStatus[] = [
  'NEW REQUEST',
  'UNDER REVIEW',
  'QUOTE / FARE UPDATED',
  'APPROVED',
  'PAYMENT PENDING',
  'CONFIRMED',
  'DRIVER/CAB ASSIGNED',
  'DRIVER EN ROUTE',
  'CUSTOMER PICKED UP',
  'TRIP IN PROGRESS',
  'COMPLETED',
  'CANCELLED BY CUSTOMER',
  'CANCELLED BY OWNER',
  'REJECTED',
];

export const OwnerBookings: React.FC<OwnerBookingsProps> = ({ onNavigateTab }) => {
  const [bookings, setBookings] = useState<any[]>([]);
  const [allBookings, setAllBookings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [serviceFilter, setServiceFilter] = useState('ALL');

  // Date range filter states
  const [datePreset, setDatePreset] = useState<'ALL' | 'TODAY' | 'TOMORROW' | 'WEEK' | 'MONTH' | 'CUSTOM'>('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [dateField, setDateField] = useState<'travel' | 'created'>('travel');

  // Modals state
  const [selectedBooking, setSelectedBooking] = useState<any | null>(null);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [quoteModalOpen, setQuoteModalOpen] = useState(false);
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [invoicePreviewModalOpen, setInvoicePreviewModalOpen] = useState(false);
  const [invoiceBooking, setInvoiceBooking] = useState<DbBookingRecord | null>(null);

  // Form states
  const [vehicles, setVehicles] = useState<VehicleRecord[]>([]);
  const [chauffeurs, setChauffeurs] = useState<ChauffeurRecord[]>([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState('');
  const [selectedChauffeurId, setSelectedChauffeurId] = useState('');
  const [newQuoteAmount, setNewQuoteAmount] = useState<number>(0);
  const [newQuoteReason, setNewQuoteReason] = useState('');
  const [newStatus, setNewStatus] = useState<BookingLifecycleStatus>('APPROVED');
  const [statusNote, setStatusNote] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);

  const fetchBookings = async () => {
    setIsLoading(true);
    try {
      const [filteredData, masterData] = await Promise.all([
        ownerService.getBookings({
          status: statusFilter !== 'ALL' ? statusFilter : undefined,
          service: serviceFilter !== 'ALL' ? serviceFilter : undefined,
          search: searchQuery.trim() || undefined,
          startDate: startDate || undefined,
          endDate: endDate || undefined,
          dateField,
        }),
        ownerService.getBookings(), // Fetch unfiltered master data for tab counts
      ]);
      setBookings(filteredData);
      setAllBookings(masterData);
    } catch (err) {
      console.error('Failed to fetch bookings:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDatePresetChange = (preset: 'ALL' | 'TODAY' | 'TOMORROW' | 'WEEK' | 'MONTH' | 'CUSTOM') => {
    setDatePreset(preset);
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    if (preset === 'ALL') {
      setStartDate('');
      setEndDate('');
    } else if (preset === 'TODAY') {
      setStartDate(todayStr);
      setEndDate(todayStr);
    } else if (preset === 'TOMORROW') {
      const tomorrow = new Date(today);
      tomorrow.setDate(today.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().split('T')[0];
      setStartDate(tomorrowStr);
      setEndDate(tomorrowStr);
    } else if (preset === 'WEEK') {
      const endWeek = new Date(today);
      endWeek.setDate(today.getDate() + 7);
      setStartDate(todayStr);
      setEndDate(endWeek.toISOString().split('T')[0]);
    } else if (preset === 'MONTH') {
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
      const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split('T')[0];
      setStartDate(firstDay);
      setEndDate(lastDay);
    }
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setStatusFilter('ALL');
    setServiceFilter('ALL');
    setDatePreset('ALL');
    setStartDate('');
    setEndDate('');
    setDateField('travel');
  };

  const hasActiveFilters =
    statusFilter !== 'ALL' ||
    serviceFilter !== 'ALL' ||
    Boolean(searchQuery.trim()) ||
    Boolean(startDate) ||
    Boolean(endDate);

  useEffect(() => {
    fetchBookings();
  }, [statusFilter, serviceFilter, startDate, endDate, dateField]);

  useEffect(() => {
    ownerService.getVehicles().then((v) => setVehicles(v));
    ownerService.getChauffeurs().then((c) => setChauffeurs(c));
  }, []);

  const handleOpenAssignModal = (b: any) => {
    setSelectedBooking(b);
    setSelectedVehicleId(b.driverDetails?.driverVehiclePlate || '');
    setSelectedChauffeurId(b.driverDetails?.driverId || '');
    setAssignModalOpen(true);
  };

  const handleOpenQuoteModal = (b: any) => {
    setSelectedBooking(b);
    setNewQuoteAmount(Number(b.total_estimated_fare) || 0);
    setNewQuoteReason('');
    setQuoteModalOpen(true);
  };

  const handleOpenStatusModal = (b: any) => {
    setSelectedBooking(b);
    setNewStatus(b.status as BookingLifecycleStatus || 'UNDER REVIEW');
    setStatusNote('');
    setStatusModalOpen(true);
  };

  const handleSaveAssignment = async () => {
    if (!selectedBooking) return;
    setIsProcessing(true);
    const ok = await ownerService.assignFleet(
      selectedBooking.reference_id,
      selectedVehicleId || undefined,
      selectedChauffeurId || undefined
    );
    setIsProcessing(false);
    if (ok) {
      setActionSuccessMessage(`Vehicle and Chauffeur assigned to #${selectedBooking.reference_id}`);
      setAssignModalOpen(false);
      fetchBookings();
      setTimeout(() => setActionSuccessMessage(null), 3000);
    }
  };

  const handleSaveQuote = async () => {
    if (!selectedBooking) return;
    setIsProcessing(true);
    const ok = await ownerService.updateQuote(
      selectedBooking.reference_id,
      newQuoteAmount,
      newQuoteReason
    );
    setIsProcessing(false);
    if (ok) {
      setActionSuccessMessage(`Quote updated to ₹${newQuoteAmount} for #${selectedBooking.reference_id}`);
      setQuoteModalOpen(false);
      fetchBookings();
      setTimeout(() => setActionSuccessMessage(null), 3000);
    }
  };

  const handleSaveStatus = async () => {
    if (!selectedBooking) return;
    setIsProcessing(true);
    const ok = await ownerService.updateBookingStatus(
      selectedBooking.reference_id,
      newStatus,
      statusNote
    );
    setIsProcessing(false);
    if (ok) {
      setActionSuccessMessage(`Status updated to "${newStatus}" for #${selectedBooking.reference_id}`);
      setStatusModalOpen(false);
      fetchBookings();
      setTimeout(() => setActionSuccessMessage(null), 3000);
    }
  };

  const createBookingRecord = (b: any): DbBookingRecord => {
    return {
      reference_id: b.reference_id || 'TJ-BK-001',
      full_name: b.full_name || 'Customer',
      mobile_number: b.mobile_number || '',
      email: b.email || 'traveljustmysuru@gmail.com',
      service_type: b.service_type || 'OUTSTATION',
      pickup_location: b.pickup_location || 'Mysuru',
      drop_location: b.drop_location || 'Destination',
      travel_date: b.travel_date || new Date().toISOString().split('T')[0],
      pickup_time: b.pickup_time || '08:00 AM',
      return_date: b.return_date,
      return_time: b.return_time,
      duration_hours: b.duration_hours || b.search_details?.durationHours,
      estimated_distance_km: Number(b.estimated_distance_km || b.search_details?.distanceKm || b.estimatedFare?.estimatedDistanceKm || 0) || undefined,
      passengers_count: b.passengers_count || 1,
      vehicle_id: b.vehicle_id,
      vehicle_name: b.vehicle_name || 'Standard Cab',
      vehicle_category: b.vehicle_category,
      total_estimated_fare: Number(b.total_estimated_fare) || 0,
      base_fare: Number(b.base_fare || b.estimated_fare?.baseFareAmount || Math.round(Number(b.total_estimated_fare || 0) * 0.85)),
      discount_amount: Number(b.discount_amount || b.estimated_fare?.discountAmount || b.discountAmount || 0),
      discount_label: b.discount_label || b.estimated_fare?.discountLabel || b.discountLabel || (b.discount_amount ? 'Promo Offer' : undefined),
      tax_amount: Number(b.tax_amount || Math.round(Number(b.total_estimated_fare || 0) * 0.05)),
      toll_amount: Number(b.toll_amount || b.estimated_fare?.tollEstimate || 0),
      driver_allowance: Number(b.driver_allowance || b.estimated_fare?.driverAllowanceAmount || 0),
      driver_name: b.driver_name,
      driver_phone: b.driver_phone,
      driver_vehicle_plate: b.driver_vehicle_plate,
      status: b.status || 'CONFIRMED',
      special_instructions: b.special_instructions,
      created_at: b.created_at || new Date().toISOString(),
    };
  };

  const handleOpenInvoicePreview = (b: any) => {
    const bookingRecord = createBookingRecord(b);
    setInvoiceBooking(bookingRecord);
    setInvoicePreviewModalOpen(true);
  };

  const handleDownloadInvoice = (b: any) => {
    const bookingRecord = createBookingRecord(b);
    generateInvoicePDF(bookingRecord);
  };

  const getStatusBadge = (status: string) => {
    const s = (status || '').toUpperCase();
    if (s.includes('CONFIRM') || s.includes('APPROV') || s.includes('COMPLET')) {
      return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    }
    if (s.includes('PENDING') || s.includes('REQUEST') || s.includes('REVIEW')) {
      return 'bg-amber-100 text-amber-800 border-amber-200';
    }
    if (s.includes('ASSIGN') || s.includes('ROUTE') || s.includes('PROGRESS')) {
      return 'bg-blue-100 text-blue-800 border-blue-200';
    }
    if (s.includes('CANCEL') || s.includes('REJECT')) {
      return 'bg-rose-100 text-rose-800 border-rose-200';
    }
    return 'bg-slate-100 text-slate-700 border-slate-200';
  };

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Booking Management</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Single authoritative dispatch ledger. Approve, modify quotes, assign fleet, and communicate via WhatsApp.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={fetchBookings}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs cursor-pointer transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {actionSuccessMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2 animate-in fade-in duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{actionSuccessMessage}</span>
        </div>
      )}

      {/* Quick Status Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {[
          { label: 'All Bookings', value: 'ALL', count: allBookings.length, color: 'text-slate-700 bg-slate-100 hover:bg-slate-200' },
          { label: 'Pending', value: 'PENDING', count: allBookings.filter(b => (b.status || '').toUpperCase().includes('PENDING') || (b.status || '').toUpperCase().includes('REQUEST') || (b.status || '').toUpperCase().includes('REVIEW')).length, color: 'text-amber-800 bg-amber-50 hover:bg-amber-100 border-amber-200' },
          { label: 'Approved', value: 'APPROVED', count: allBookings.filter(b => (b.status || '').toUpperCase().includes('APPROV') || (b.status || '').toUpperCase().includes('CONFIRM') || (b.status || '').toUpperCase().includes('ASSIGN')).length, color: 'text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border-emerald-200' },
          { label: 'Active Trips', value: 'ACTIVE', count: allBookings.filter(b => (b.status || '').toUpperCase().includes('ROUTE') || (b.status || '').toUpperCase().includes('PROGRESS') || (b.status || '').toUpperCase().includes('PICKED UP')).length, color: 'text-blue-800 bg-blue-50 hover:bg-blue-100 border-blue-200' },
          { label: 'Completed', value: 'COMPLETED', count: allBookings.filter(b => (b.status || '').toUpperCase().includes('COMPLET')).length, color: 'text-emerald-900 bg-emerald-100/60 hover:bg-emerald-100 border-emerald-300' },
          { label: 'Cancelled', value: 'CANCELLED', count: allBookings.filter(b => (b.status || '').toUpperCase().includes('CANCEL') || (b.status || '').toUpperCase().includes('REJECT')).length, color: 'text-rose-800 bg-rose-50 hover:bg-rose-100 border-rose-200' },
        ].map((tab) => {
          const isActive = statusFilter === tab.value;
          return (
            <button
              key={tab.value}
              type="button"
              onClick={() => setStatusFilter(tab.value)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 border ${
                isActive
                  ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                  : `${tab.color} border-slate-200/80`
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
                  isActive ? 'bg-white/20 text-white' : 'bg-black/5 text-slate-700'
                }`}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Comprehensive Filter Panel */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3.5">
        {/* Row 1: Search, Status, Service, Date Preset */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search ID, passenger, phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchBookings()}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
            />
          </div>

          {/* Status Filter Dropdown */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold text-slate-700 cursor-pointer"
            >
              <optgroup label="Summary Groups">
                <option value="ALL">All Statuses ({ALL_STATUSES.length})</option>
                <option value="PENDING">Pending (Action Needed)</option>
                <option value="APPROVED">Approved & Confirmed</option>
                <option value="ACTIVE">Active (In Transit / En Route)</option>
                <option value="COMPLETED">Completed</option>
                <option value="CANCELLED">Cancelled / Rejected</option>
              </optgroup>
              <optgroup label="Granular Lifecycle Status">
                {ALL_STATUSES.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </optgroup>
            </select>
          </div>

          {/* Service Type Filter */}
          <div>
            <select
              value={serviceFilter}
              onChange={(e) => setServiceFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold text-slate-700 cursor-pointer"
            >
              <option value="ALL">All Services</option>
              <option value="oneway">One Way Taxi</option>
              <option value="roundtrip">Round Trip</option>
              <option value="local">Local Mysore Sightseeing</option>
              <option value="airport">Airport Transfer (KIAL)</option>
              <option value="interstate">Inter-State One Way</option>
            </select>
          </div>

          {/* Date Range Preset Selector */}
          <div>
            <select
              value={datePreset}
              onChange={(e) => handleDatePresetChange(e.target.value as any)}
              className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold text-slate-700 cursor-pointer"
            >
              <option value="ALL">All Dates (Any Time)</option>
              <option value="TODAY">Today's Bookings</option>
              <option value="TOMORROW">Tomorrow's Departures</option>
              <option value="WEEK">Next 7 Days</option>
              <option value="MONTH">This Month</option>
              <option value="CUSTOM">Custom Date Range...</option>
            </select>
          </div>
        </div>

        {/* Row 2: Date Range Details (Start Date, End Date, Date Basis, Reset) */}
        <div className="pt-2 border-t border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
              <CalendarRange className="w-3.5 h-3.5 text-emerald-600" />
              <span>Date Range:</span>
            </span>

            <div className="flex items-center gap-1.5">
              <label className="text-[11px] text-slate-400 font-medium">From:</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setDatePreset('CUSTOM');
                  setStartDate(e.target.value);
                }}
                className="px-2.5 py-1 text-xs rounded-lg bg-slate-50 border border-slate-200 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium text-slate-800"
              />
            </div>

            <div className="flex items-center gap-1.5">
              <label className="text-[11px] text-slate-400 font-medium">To:</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setDatePreset('CUSTOM');
                  setEndDate(e.target.value);
                }}
                className="px-2.5 py-1 text-xs rounded-lg bg-slate-50 border border-slate-200 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium text-slate-800"
              />
            </div>

            {/* Filter Date Basis (Travel Date vs Created Date) */}
            <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-[11px]">
              <button
                type="button"
                onClick={() => setDateField('travel')}
                className={`px-2 py-0.5 rounded-md font-bold transition-all cursor-pointer ${
                  dateField === 'travel'
                    ? 'bg-white text-emerald-900 shadow-2xs font-bold'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Travel Date
              </button>
              <button
                type="button"
                onClick={() => setDateField('created')}
                className={`px-2 py-0.5 rounded-md font-bold transition-all cursor-pointer ${
                  dateField === 'created'
                    ? 'bg-white text-emerald-900 shadow-2xs font-bold'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Booking Date
              </button>
            </div>
          </div>

          {/* Action buttons (Apply / Reset) */}
          <div className="flex items-center gap-2 self-end md:self-auto">
            <button
              type="button"
              onClick={handleResetFilters}
              title="Reset all filters to default"
              className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer flex items-center gap-1 border border-slate-200"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
              <span>Reset</span>
            </button>
            <button
              type="button"
              onClick={fetchBookings}
              className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-all cursor-pointer shadow-2xs"
            >
              Apply Filter
            </button>
          </div>
        </div>

        {/* Active Filters Summary Strip */}
        <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-slate-500 font-medium">
              Showing <strong className="text-slate-900 font-bold">{bookings.length}</strong> of{' '}
              <strong className="text-slate-700">{allBookings.length}</strong> bookings
            </span>

            {statusFilter !== 'ALL' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px] font-semibold">
                <span>Status: {statusFilter}</span>
                <button
                  type="button"
                  onClick={() => setStatusFilter('ALL')}
                  className="hover:text-emerald-950 cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {serviceFilter !== 'ALL' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 text-blue-800 border border-blue-200 text-[11px] font-semibold">
                <span>Service: {serviceFilter.toUpperCase()}</span>
                <button
                  type="button"
                  onClick={() => setServiceFilter('ALL')}
                  className="hover:text-blue-950 cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {(startDate || endDate) && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-purple-50 text-purple-800 border border-purple-200 text-[11px] font-semibold">
                <span>
                  Date ({dateField === 'travel' ? 'Travel' : 'Created'}): {startDate || 'Any'} ➔ {endDate || 'Any'}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setDatePreset('ALL');
                    setStartDate('');
                    setEndDate('');
                  }}
                  className="hover:text-purple-950 cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {searchQuery.trim() && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 border border-slate-300 text-[11px] font-semibold">
                <span>Search: "{searchQuery}"</span>
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    fetchBookings();
                  }}
                  className="hover:text-slate-950 cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
          </div>

          {(statusFilter !== 'ALL' || serviceFilter !== 'ALL' || startDate || endDate || searchQuery.trim()) && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="text-[11px] text-rose-600 hover:text-rose-800 font-bold hover:underline cursor-pointer"
            >
              Clear all filters
            </button>
          )}
        </div>
      </div>

      {/* Bookings Table / Cards */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        {isLoading ? (
          <div className="py-16 text-center text-slate-500 text-xs">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-emerald-600 mb-2" />
            <span>Loading live dispatch bookings from centralized backend...</span>
          </div>
        ) : bookings.length === 0 ? (
          <div className="py-16 text-center text-slate-500 text-xs space-y-2">
            <Car className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="font-bold text-slate-700 text-sm">No bookings match the selected filters</p>
            <p className="text-slate-400 max-w-sm mx-auto">
              Try adjusting the status group, service type, date range, or keyword search.
            </p>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold hover:bg-emerald-100 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset All Filters</span>
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="p-3.5 pl-5">Booking ID</th>
                  <th className="p-3.5">Customer</th>
                  <th className="p-3.5">Trip Details</th>
                  <th className="p-3.5">Vehicle</th>
                  <th className="p-3.5">Fare</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5">Chauffeur</th>
                  <th className="p-3.5 pr-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
                {bookings.map((b) => (
                  <tr key={b.reference_id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="p-3.5 pl-5 font-bold text-slate-900 whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => handleOpenInvoicePreview(b)}
                        title="Click to view formatted invoice & receipt"
                        className="text-emerald-700 hover:text-emerald-950 font-bold hover:underline cursor-pointer block text-left"
                      >
                        #{b.reference_id}
                      </button>
                      <span className="block text-[10px] text-slate-400 font-normal">
                        {b.created_at ? new Date(b.created_at).toLocaleDateString() : ''}
                      </span>
                    </td>
                    <td className="p-3.5 whitespace-nowrap">
                      <div className="font-bold text-slate-900">{b.full_name || 'Passenger'}</div>
                      <div className="text-[11px] text-slate-500">{b.mobile_number}</div>
                    </td>
                    <td className="p-3.5 max-w-[240px]">
                      <div className="font-semibold text-slate-800 truncate" title={b.pickup_location}>
                        From: {b.pickup_location}
                      </div>
                      <div className="text-[11px] text-slate-500 truncate" title={b.drop_location}>
                        To: {b.drop_location}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        {b.travel_date} • {b.pickup_time} ({b.service_type?.toUpperCase()})
                      </div>
                    </td>
                    <td className="p-3.5 whitespace-nowrap">
                      <span className="font-bold text-slate-900 block">{b.vehicle_name || 'Cab'}</span>
                      <span className="text-[10px] text-slate-400 uppercase">{b.vehicle_id}</span>
                      {((b.selected_add_ons && b.selected_add_ons.length > 0) || (b.search_details?.selectedAddOns?.length > 0)) && (
                        <div className="flex flex-wrap items-center gap-1 mt-1 max-w-[200px]">
                          {(b.selected_add_ons || b.search_details?.selectedAddOns || []).map((addon: any, idx: number) => (
                            <span
                              key={idx}
                              className="text-[9px] font-extrabold px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-800 border border-emerald-200"
                              title={addon.name}
                            >
                              ★ {addon.quantity > 1 ? `${addon.quantity}x ` : ''}{addon.shortLabel || addon.name}
                            </span>
                          ))}
                        </div>
                      )}
                    </td>
                    <td className="p-3.5 whitespace-nowrap">
                      <span className="font-black text-slate-900 block">
                        ₹{(Number(b.total_estimated_fare) || 0).toLocaleString('en-IN')}
                      </span>
                    </td>
                    <td className="p-3.5 whitespace-nowrap">
                      <span
                        className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold border ${getStatusBadge(
                          b.status
                        )}`}
                      >
                        {b.status || 'NEW REQUEST'}
                      </span>
                    </td>
                    <td className="p-3.5 whitespace-nowrap">
                      {b.driver_name ? (
                        <div>
                          <span className="font-bold text-slate-900 block">{b.driver_name}</span>
                          <span className="text-[10px] text-slate-500">{b.driver_vehicle_plate}</span>
                        </div>
                      ) : (
                        <span className="text-[11px] text-amber-600 font-semibold italic">Unassigned</span>
                      )}
                    </td>
                    <td className="p-3.5 pr-5 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenStatusModal(b)}
                          title="Update Status"
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenAssignModal(b)}
                          title="Assign Fleet & Chauffeur"
                          className="p-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 transition-colors cursor-pointer"
                        >
                          <UserCheck className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenQuoteModal(b)}
                          title="Update Quote / Fare"
                          className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 transition-colors cursor-pointer"
                        >
                          <IndianRupee className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenInvoicePreview(b)}
                          title="View Invoice & Receipt Preview"
                          className="px-2.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-850 text-[11px] font-bold border border-emerald-200 transition-colors cursor-pointer inline-flex items-center gap-1 shadow-2xs"
                        >
                          <FileText className="w-3.5 h-3.5 text-emerald-600" />
                          <span>View Invoice</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => onNavigateTab('whatsapp')}
                          title="Open WhatsApp Thread"
                          className="p-1.5 rounded-lg bg-[#25D366]/10 hover:bg-[#25D366]/20 text-[#128C7E] transition-colors cursor-pointer"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL 1: Assign Fleet & Chauffeur */}
      {assignModalOpen && selectedBooking && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="relative bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4 animate-in zoom-in-95 duration-150 overflow-hidden">
            <ProgressBar isLoading={isProcessing} className="absolute top-0 left-0 right-0 z-30 rounded-none h-1" />
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-emerald-600" />
                <span>Assign Fleet to #{selectedBooking.reference_id}</span>
              </h3>
              <button
                type="button"
                onClick={() => setAssignModalOpen(false)}
                disabled={isProcessing}
                className="text-slate-400 hover:text-slate-600 cursor-pointer disabled:opacity-50"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <fieldset disabled={isProcessing} className="space-y-3 text-xs border-0 p-0 m-0 min-w-0">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Select Available Vehicle</label>
                <select
                  value={selectedVehicleId}
                  onChange={(e) => setSelectedVehicleId(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 font-semibold text-slate-800 disabled:opacity-60"
                >
                  <option value="">-- Choose Vehicle --</option>
                  {vehicles.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.registrationNumber} • {v.model} ({v.category}) [{v.status}]
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Select Verified Chauffeur</label>
                <select
                  value={selectedChauffeurId}
                  onChange={(e) => setSelectedChauffeurId(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 font-semibold text-slate-800 disabled:opacity-60"
                >
                  <option value="">-- Choose Chauffeur --</option>
                  {chauffeurs.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} • {c.mobileNumber} (Rating: {c.rating}★) [{c.dutyStatus}]
                    </option>
                  ))}
                </select>
              </div>

              {((selectedBooking.selected_add_ons && selectedBooking.selected_add_ons.length > 0) ||
                (selectedBooking.search_details?.selectedAddOns && selectedBooking.search_details.selectedAddOns.length > 0)) && (
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-[11px] leading-relaxed space-y-1">
                  <span className="font-bold flex items-center gap-1 text-amber-850">
                    <span>⚠️ Pre-trip Amenities Required for Vehicle:</span>
                  </span>
                  <div className="flex flex-wrap gap-1 pt-0.5">
                    {(selectedBooking.selected_add_ons || selectedBooking.search_details?.selectedAddOns || []).map((a: any, idx: number) => (
                      <span key={idx} className="font-extrabold px-2 py-0.5 rounded-md bg-white border border-amber-300 text-amber-950 text-[10px]">
                        {a.quantity > 1 ? `${a.quantity}x ` : ''}{a.name || a.shortLabel}
                      </span>
                    ))}
                  </div>
                  <p className="text-[10px] text-amber-750">
                    Verify that the assigned chauffeur equips and verifies these amenities before departing to pickup.
                  </p>
                </div>
              )}

              <div className="p-3 rounded-xl bg-blue-50 text-blue-900 text-[11px] leading-relaxed">
                Assigning will automatically update booking status to <strong>DRIVER/CAB ASSIGNED</strong>, notify the customer via WhatsApp, and record this in the audit log.
              </div>
            </fieldset>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setAssignModalOpen(false)}
                disabled={isProcessing}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveAssignment}
                disabled={isProcessing}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 cursor-pointer disabled:opacity-60 flex items-center gap-1.5"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                    <span>Saving Assignment...</span>
                  </>
                ) : (
                  <span>Confirm Assignment</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Modify Quote / Fare */}
      {quoteModalOpen && selectedBooking && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="relative bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4 animate-in zoom-in-95 duration-150 overflow-hidden">
            <ProgressBar isLoading={isProcessing} className="absolute top-0 left-0 right-0 z-30 rounded-none h-1" />
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <IndianRupee className="w-4 h-4 text-emerald-600" />
                <span>Update Quote for #{selectedBooking.reference_id}</span>
              </h3>
              <button
                type="button"
                onClick={() => setQuoteModalOpen(false)}
                disabled={isProcessing}
                className="text-slate-400 hover:text-slate-600 cursor-pointer disabled:opacity-50"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <fieldset disabled={isProcessing} className="space-y-3 text-xs border-0 p-0 m-0 min-w-0">
              <div>
                <label className="font-bold text-slate-700 block mb-1">New Total Fare (₹ INR)</label>
                <input
                  type="number"
                  value={newQuoteAmount}
                  onChange={(e) => setNewQuoteAmount(Number(e.target.value))}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 font-black text-lg text-slate-900 disabled:opacity-60"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Reason for Quote Update</label>
                <textarea
                  rows={2}
                  value={newQuoteReason}
                  onChange={(e) => setNewQuoteReason(e.target.value)}
                  placeholder="e.g. Extra sightseeing stops added, parking & night halt included"
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 font-medium text-slate-800 disabled:opacity-60"
                />
              </div>
            </fieldset>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setQuoteModalOpen(false)}
                disabled={isProcessing}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveQuote}
                disabled={isProcessing}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 cursor-pointer disabled:opacity-60 flex items-center gap-1.5"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                    <span>Updating Quote...</span>
                  </>
                ) : (
                  <span>Update & Notify Customer</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Update Lifecycle Status */}
      {statusModalOpen && selectedBooking && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="relative bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4 animate-in zoom-in-95 duration-150 overflow-hidden">
            <ProgressBar isLoading={isProcessing} className="absolute top-0 left-0 right-0 z-30 rounded-none h-1" />
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-emerald-600" />
                <span>Transition Status for #{selectedBooking.reference_id}</span>
              </h3>
              <button
                type="button"
                onClick={() => setStatusModalOpen(false)}
                disabled={isProcessing}
                className="text-slate-400 hover:text-slate-600 cursor-pointer disabled:opacity-50"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <fieldset disabled={isProcessing} className="space-y-3 text-xs border-0 p-0 m-0 min-w-0">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Standard Lifecycle Status</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as BookingLifecycleStatus)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 font-bold text-slate-900 disabled:opacity-60"
                >
                  {ALL_STATUSES.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Status Note / Internal Remarks</label>
                <textarea
                  rows={2}
                  value={statusNote}
                  onChange={(e) => setStatusNote(e.target.value)}
                  placeholder="Optional internal remark or message to log with transition..."
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 font-medium text-slate-800 disabled:opacity-60"
                />
              </div>
            </fieldset>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setStatusModalOpen(false)}
                disabled={isProcessing}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveStatus}
                disabled={isProcessing}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 cursor-pointer disabled:opacity-60 flex items-center gap-1.5"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                    <span>Applying Transition...</span>
                  </>
                ) : (
                  <span>Apply Transition</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: Professional Tax Invoice & Receipt Preview */}
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
