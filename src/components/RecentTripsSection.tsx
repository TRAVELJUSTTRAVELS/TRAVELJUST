import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Calendar,
  Clock,
  MapPin,
  Car,
  User,
  Phone,
  ArrowRight,
  RefreshCw,
  Database,
  Check,
  Copy,
  ExternalLink,
  ShieldCheck,
  Sparkles,
  Search,
  Filter,
  ChevronRight,
  Eye,
  X,
  AlertCircle,
  FileText,
  RotateCcw,
  SlidersHorizontal,
  CalendarRange,
  Tag,
  Compass,
  Download,
  FileDown,
} from 'lucide-react';
import { supabase } from '../services/supabaseClient';
import { BookingSearchState, Vehicle, BookingRequest } from '../types';
import { vehiclesData } from '../data/vehicles';
import { generateTripInvoicePdf } from '../utils/generateInvoicePdf';

interface RecentTripsSectionProps {
  onRebookTrip?: (searchState: Partial<BookingSearchState>, vehicleId?: string) => void;
  onOpenBookingSearch?: () => void;
}

export interface DbBookingRecord {
  id?: string;
  reference_id: string;
  full_name: string;
  mobile_number: string;
  email: string;
  service_type: string;
  pickup_location: string;
  drop_location?: string;
  travel_date: string;
  pickup_time: string;
  return_date?: string;
  return_time?: string;
  duration_hours?: number;
  estimated_distance_km?: number;
  airport_transfer_type?: string;
  passengers_count?: number;
  vehicle_id?: string;
  vehicle_name?: string;
  vehicle_category?: string;
  special_instructions?: string;
  total_estimated_fare: number;
  currency?: string;
  status: string;
  driver_name?: string;
  driver_phone?: string;
  driver_vehicle_plate?: string;
  driver_assigned_at?: string;
  search_details?: any;
  estimated_fare?: any;
  created_at: string;
}

export const RecentTripsSection: React.FC<RecentTripsSectionProps> = ({
  onRebookTrip,
  onOpenBookingSearch,
}) => {
  const [trips, setTrips] = useState<DbBookingRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);
  const [dataSource, setDataSource] = useState<'supabase' | 'local'>('local');
  const [searchTerm, setSearchTerm] = useState('');
  const [serviceTypeFilter, setServiceTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'Pending Confirmation' | 'Confirmed' | 'Driver Assigned' | 'Completed'>('all');
  const [dateRangePreset, setDateRangePreset] = useState<'all' | 'today' | 'upcoming' | 'past_7_days' | 'past_30_days' | 'custom'>('all');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState<boolean>(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [selectedTripDetails, setSelectedTripDetails] = useState<DbBookingRecord | null>(null);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<string>('');
  const [realtimeNotification, setRealtimeNotification] = useState<string | null>(null);
  const [assigningDriverTripId, setAssigningDriverTripId] = useState<string | null>(null);
  const [downloadingInvoiceRef, setDownloadingInvoiceRef] = useState<string | null>(null);
  const [driverInput, setDriverInput] = useState({
    name: 'Suresh Kumar',
    phone: '+91 98450 12345',
    plate: 'KA 01 MJ 4492',
  });

  const fetchTrips = useCallback(async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    else setLoading(true);
    setErrorNotice(null);

    // 1. Try backend server API route first
    try {
      const res = await fetch('/api/bookings');
      if (res.ok) {
        const json = await res.json();
        if (json.bookings && Array.isArray(json.bookings) && json.bookings.length > 0) {
          setTrips(json.bookings);
          setDataSource(json.source === 'supabase' ? 'supabase' : 'local');
          setLoading(false);
          setRefreshing(false);
          setLastRefreshedAt(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
          return;
        }
      }
    } catch {
      // Backend check skipped, continue to client direct check
    }

    if (supabase) {
      try {
        // Query the last 20 bookings ordered by latest created_at
        const { data, error } = await supabase
          .from('bookings')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(20);

        if (!error && data && data.length > 0) {
          setTrips(data);
          setDataSource('supabase');
          return;
        }
      } catch {
        // Fallback quietly
      }
    }

    fallbackToLocalStorage();
  }, []);

  const fallbackToLocalStorage = () => {
    try {
      const stored = localStorage.getItem('tj_all_bookings');
      if (stored) {
        const localList: BookingRequest[] = JSON.parse(stored);
        const mapped: DbBookingRecord[] = localList.slice(0, 20).map((b) => ({
          reference_id: b.referenceId,
          full_name: b.passengerDetails.fullName,
          mobile_number: b.passengerDetails.mobileNumber,
          email: b.passengerDetails.email,
          service_type: b.searchDetails.serviceType,
          pickup_location: b.searchDetails.pickupLocation,
          drop_location: b.searchDetails.dropLocation,
          travel_date: b.searchDetails.travelDate,
          pickup_time: b.searchDetails.pickupTime,
          return_date: b.searchDetails.returnDate,
          return_time: b.searchDetails.returnTime,
          duration_hours: b.searchDetails.durationHours,
          airport_transfer_type: b.searchDetails.airportTransferType,
          passengers_count: b.passengerDetails.passengersCount,
          vehicle_id: b.selectedVehicle.id,
          vehicle_name: b.selectedVehicle.name,
          vehicle_category: b.selectedVehicle.category,
          special_instructions: b.passengerDetails.specialInstructions,
          total_estimated_fare: b.estimatedFare.totalEstimatedFare,
          currency: 'INR',
          status: b.status || 'Pending Confirmation',
          search_details: b.searchDetails,
          estimated_fare: b.estimatedFare,
          created_at: b.createdAt || new Date().toISOString(),
        }));
        setTrips(mapped);
        setDataSource('local');
      } else {
        setTrips([]);
      }
    } catch {
      setTrips([]);
    }
  };

  useEffect(() => {
    fetchTrips();

    if (!supabase) return;

    // Subscribe to realtime booking changes (INSERT, UPDATE, DELETE) via Supabase Realtime if configured
    try {
      const channel = supabase
        .channel('realtime:public:bookings')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'bookings' },
          (payload) => {
            if (payload.eventType === 'INSERT') {
              const newRecord = payload.new as DbBookingRecord;
              setTrips((prev) => {
                const exists = prev.some((t) => t.reference_id === newRecord.reference_id);
                if (exists) return prev;
                return [newRecord, ...prev.slice(0, 19)];
              });
              setDataSource('supabase');
              setRealtimeNotification(`New booking received: #${newRecord.reference_id}`);
              setTimeout(() => setRealtimeNotification(null), 4000);
            } else if (payload.eventType === 'UPDATE') {
              const updated = payload.new as DbBookingRecord;
              setTrips((prev) =>
                prev.map((t) => (t.reference_id === updated.reference_id ? updated : t))
              );
              setDataSource('supabase');
              if (updated.status === 'Driver Assigned') {
                setRealtimeNotification(
                  `Driver ${updated.driver_name || 'Assigned'} assigned to #${updated.reference_id}!`
                );
              } else {
                setRealtimeNotification(`Booking #${updated.reference_id} updated: ${updated.status}`);
              }
              setTimeout(() => setRealtimeNotification(null), 4500);
            } else if (payload.eventType === 'DELETE') {
              if (payload.old && payload.old.reference_id) {
                setTrips((prev) => prev.filter((t) => t.reference_id !== payload.old.reference_id));
              }
            }
          }
        )
        .subscribe();

      return () => {
        supabase?.removeChannel(channel);
      };
    } catch (e) {
      console.warn('Realtime channel subscription notice:', e);
    }
  }, [fetchTrips]);

  const handleCopyRef = (refId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(refId);
    setCopiedId(refId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleRebook = (trip: DbBookingRecord, e: React.MouseEvent) => {
    e.stopPropagation();
    if (onRebookTrip) {
      const searchPartial: Partial<BookingSearchState> = {
        serviceType: (trip.service_type as any) || 'oneway',
        pickupLocation: trip.pickup_location,
        dropLocation: trip.drop_location || '',
        travelDate: trip.travel_date || new Date().toISOString().split('T')[0],
        pickupTime: trip.pickup_time || '10:00',
        durationHours: trip.duration_hours || 8,
        passengers: trip.passengers_count || 2,
      };
      onRebookTrip(searchPartial, trip.vehicle_id);
    }
  };

  const getServiceLabel = (type: string) => {
    switch (type) {
      case 'oneway':
        return 'One-Way Trip';
      case 'roundtrip':
        return 'Round Trip';
      case 'local':
        return 'Hourly Rental';
      case 'airport':
        return 'Airport Transfer';
      default:
        return 'Cab Service';
    }
  };

  const getStatusBadge = (status: string, trip?: DbBookingRecord) => {
    if (status === 'Driver Assigned') {
      return (
        <span
          id={`status-driver-assigned-${trip?.reference_id || 'badge'}`}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-800 border border-indigo-200 shadow-2xs animate-pulse"
        >
          <Car className="w-3.5 h-3.5 text-indigo-600 animate-bounce" />
          <span>Driver Assigned</span>
        </span>
      );
    }
    if (status === 'Confirmed') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300/60">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
          Confirmed
        </span>
      );
    }
    if (status === 'Completed') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-800 border border-blue-300/60">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
          Completed
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-300/60">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
        Pending Confirmation
      </span>
    );
  };

  const formatDateTime = (isoString?: string) => {
    if (!isoString) return 'Recent';
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString('en-IN', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoString;
    }
  };

  const handleDownloadInvoice = (trip: DbBookingRecord, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      setDownloadingInvoiceRef(trip.reference_id);
      generateTripInvoicePdf(trip);
      setTimeout(() => {
        setDownloadingInvoiceRef(null);
      }, 800);
    } catch (err) {
      console.error('Failed to generate PDF invoice:', err);
      setDownloadingInvoiceRef(null);
    }
  };

  /**
   * Calculates progress percentage and remaining duration for an active/ongoing ride
   */
  const calculateTripRideProgress = (trip: DbBookingRecord) => {
    // Expected ride duration in minutes (based on service type / estimated distance / hourly rental)
    let totalDurationMinutes = 60; // default 1 hour
    if (trip.service_type === 'local' && trip.duration_hours) {
      totalDurationMinutes = trip.duration_hours * 60;
    } else if (trip.estimated_distance_km) {
      // Estimate ~40km/h average speed in city + buffer
      totalDurationMinutes = Math.max(30, Math.round((trip.estimated_distance_km / 35) * 60));
    } else {
      totalDurationMinutes = (trip.duration_hours || 2) * 60;
    }

    // Determine start timestamp
    const now = Date.now();
    let startTime = 0;

    if (trip.driver_assigned_at) {
      startTime = new Date(trip.driver_assigned_at).getTime();
    } else if (trip.travel_date && trip.pickup_time) {
      const datePart = trip.travel_date;
      const timePart = trip.pickup_time.length === 5 ? `${trip.pickup_time}:00` : trip.pickup_time;
      startTime = new Date(`${datePart}T${timePart}`).getTime();
    } else if (trip.created_at) {
      startTime = new Date(trip.created_at).getTime();
    }

    if (!startTime || isNaN(startTime)) {
      startTime = now - 25 * 60 * 1000; // fallback relative
    }

    const elapsedMinutes = Math.max(0, (now - startTime) / (1000 * 60));
    const totalMinutes = Math.max(15, totalDurationMinutes);

    let progressPercent = Math.min(100, Math.round((elapsedMinutes / totalMinutes) * 100));
    
    // For ongoing status indicators (Driver Assigned / Confirmed active), give realistic lively progress
    if (trip.status === 'Driver Assigned' && (progressPercent === 0 || progressPercent >= 100)) {
      // Show ongoing active progress (e.g. 42% on way)
      progressPercent = 45;
    } else if (trip.status === 'Confirmed' && progressPercent >= 100) {
      progressPercent = 80;
    }

    const remainingMinutes = Math.max(1, Math.round(totalMinutes * (1 - progressPercent / 100)));
    const remainingHours = Math.floor(remainingMinutes / 60);
    const remMins = remainingMinutes % 60;
    
    const remainingText =
      remainingHours > 0
        ? `${remainingHours}h ${remMins}m remaining`
        : `${remainingMinutes} mins remaining`;

    return {
      isOngoing: trip.status === 'Driver Assigned' || trip.status === 'Confirmed',
      progressPercent,
      remainingText,
      totalDurationMinutes: totalMinutes,
    };
  };

  const isTripInDateRange = (trip: DbBookingRecord) => {
    if (dateRangePreset === 'all' && !customStartDate && !customEndDate) {
      return true;
    }

    // Try travel_date (e.g. '2026-08-15') or created_at (ISO string)
    const tripDateStr = trip.travel_date || (trip.created_at ? trip.created_at.split('T')[0] : '');
    if (!tripDateStr) return true;

    const todayObj = new Date();
    todayObj.setHours(0, 0, 0, 0);
    const todayStr = todayObj.toISOString().split('T')[0];

    if (dateRangePreset === 'today') {
      return tripDateStr === todayStr;
    }

    if (dateRangePreset === 'upcoming') {
      return tripDateStr >= todayStr;
    }

    if (dateRangePreset === 'past_7_days') {
      const past7 = new Date(todayObj);
      past7.setDate(past7.getDate() - 7);
      const past7Str = past7.toISOString().split('T')[0];
      return tripDateStr >= past7Str && tripDateStr <= todayStr;
    }

    if (dateRangePreset === 'past_30_days') {
      const past30 = new Date(todayObj);
      past30.setDate(past30.getDate() - 30);
      const past30Str = past30.toISOString().split('T')[0];
      return tripDateStr >= past30Str && tripDateStr <= todayStr;
    }

    if (dateRangePreset === 'custom' || customStartDate || customEndDate) {
      if (customStartDate && tripDateStr < customStartDate) return false;
      if (customEndDate && tripDateStr > customEndDate) return false;
      return true;
    }

    return true;
  };

  const filteredTrips = useMemo(() => {
    return trips.filter((trip) => {
      const matchesSearch =
        !searchTerm ||
        trip.reference_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        trip.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        trip.pickup_location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        trip.drop_location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        trip.vehicle_name?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter === 'all' || trip.status === statusFilter;

      const matchesService =
        serviceTypeFilter === 'all' || trip.service_type === serviceTypeFilter;

      const matchesDate = isTripInDateRange(trip);

      return matchesSearch && matchesStatus && matchesService && matchesDate;
    });
  }, [trips, searchTerm, statusFilter, serviceTypeFilter, dateRangePreset, customStartDate, customEndDate]);

  const activeFiltersCount =
    (searchTerm ? 1 : 0) +
    (serviceTypeFilter !== 'all' ? 1 : 0) +
    (statusFilter !== 'all' ? 1 : 0) +
    (dateRangePreset !== 'all' || customStartDate || customEndDate ? 1 : 0);

  const resetAllFilters = () => {
    setSearchTerm('');
    setServiceTypeFilter('all');
    setStatusFilter('all');
    setDateRangePreset('all');
    setCustomStartDate('');
    setCustomEndDate('');
  };

  const totalFilteredFare = useMemo(() => {
    return filteredTrips.reduce((acc, curr) => acc + (Number(curr.total_estimated_fare) || 0), 0);
  }, [filteredTrips]);

  return (
    <section id="recent-trips" className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto scroll-mt-20 relative">
      {/* Real-time Subscriptions Floating Toast Notice */}
      {realtimeNotification && (
        <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-5 duration-300">
          <div className="bg-slate-900/95 text-white px-4 py-3 rounded-2xl shadow-2xl border border-emerald-500/40 flex items-center gap-3 backdrop-blur-md">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
            <div className="text-xs">
              <span className="font-bold text-emerald-300 block">Live Dispatch Sync:</span>
              <span className="text-slate-200">{realtimeNotification}</span>
            </div>
          </div>
        </div>
      )}

      {/* Section Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold mb-3 shadow-2xs">
            <Car className="w-3.5 h-3.5 text-emerald-700" />
            <span>Live Dispatch & Bookings Registry</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Recent Trips & Booking History
          </h2>
          <p className="text-slate-600 text-sm mt-1.5 max-w-2xl">
            Real-time feed of confirmed customer appointments, driver dispatches, and recent trip itineraries.
          </p>
        </div>

        {/* Action Controls & Realtime Status */}
        <div className="flex items-center gap-2.5 self-start md:self-auto">
          {lastRefreshedAt && (
            <span className="text-[11px] text-slate-500 font-medium hidden sm:inline-block">
              Updated: {lastRefreshedAt}
            </span>
          )}
          <button
            type="button"
            onClick={() => fetchTrips(true)}
            disabled={refreshing || loading}
            className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 hover:border-emerald-500 text-slate-700 hover:text-emerald-900 font-bold text-xs flex items-center gap-2 shadow-2xs transition-all active:scale-95 disabled:opacity-50"
            title="Fetch latest trips"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing || loading ? 'animate-spin text-emerald-700' : 'text-slate-500'}`} />
            <span>{refreshing ? 'Fetching...' : 'Refresh Trips'}</span>
          </button>
        </div>
      </div>

      {/* Advanced Filter Bar Container */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs mb-6 overflow-hidden">
        {/* Tier 1: Search & Primary Filters Row */}
        <div className="p-3.5 sm:p-4 border-b border-slate-100 flex flex-col lg:flex-row gap-3.5 items-start lg:items-center justify-between">
          {/* Search Input */}
          <div className="relative w-full lg:w-72 shrink-0">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by ID, route, passenger..."
              className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                title="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Service Type Filter Tabs */}
          <div className="flex items-center gap-1.5 w-full lg:w-auto overflow-x-auto pb-1 lg:pb-0 text-xs font-semibold scrollbar-thin">
            <span className="text-slate-400 text-xs mr-1 hidden sm:inline-flex items-center gap-1 shrink-0">
              <Car className="w-3.5 h-3.5 text-emerald-800" /> Service:
            </span>
            {[
              { id: 'all', label: 'All Services' },
              { id: 'oneway', label: 'One-Way' },
              { id: 'roundtrip', label: 'Round Trip' },
              { id: 'local', label: 'Hourly' },
              { id: 'airport', label: 'Airport' },
            ].map((st) => (
              <button
                key={st.id}
                type="button"
                onClick={() => setServiceTypeFilter(st.id)}
                className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-all text-xs ${
                  serviceTypeFilter === st.id
                    ? 'bg-emerald-900 text-white shadow-2xs font-bold'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {st.label}
              </button>
            ))}
          </div>

          {/* Toggle Advanced / Date Filters */}
          <div className="flex items-center gap-2 w-full lg:w-auto justify-between lg:justify-end">
            <button
              type="button"
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className={`px-3 py-1.5 rounded-lg border text-xs font-bold flex items-center gap-1.5 transition-all ${
                showAdvancedFilters || dateRangePreset !== 'all' || customStartDate || customEndDate
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                  : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              <CalendarRange className="w-3.5 h-3.5 text-emerald-700" />
              <span>Date Filter</span>
              {dateRangePreset !== 'all' && (
                <span className="w-2 h-2 rounded-full bg-emerald-600" />
              )}
            </button>

            {activeFiltersCount > 0 && (
              <button
                type="button"
                onClick={resetAllFilters}
                className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-rose-600 hover:bg-rose-50 flex items-center gap-1 transition-colors"
                title="Reset all applied filters"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>

        {/* Tier 2: Date Range Filter Bar (Always visible or toggled) */}
        <div className={`p-3.5 sm:p-4 bg-slate-50/70 border-b border-slate-100 transition-all ${showAdvancedFilters || dateRangePreset !== 'all' ? 'block' : 'hidden lg:block'}`}>
          <div className="flex flex-col md:flex-row gap-3 items-start md:items-center justify-between">
            {/* Date Presets */}
            <div className="flex items-center gap-1.5 flex-wrap text-xs font-medium">
              <span className="text-slate-500 text-xs mr-1 inline-flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" /> Date Range:
              </span>
              {[
                { id: 'all', label: 'All Dates' },
                { id: 'today', label: 'Today' },
                { id: 'upcoming', label: 'Upcoming' },
                { id: 'past_7_days', label: 'Last 7 Days' },
                { id: 'past_30_days', label: 'Last 30 Days' },
                { id: 'custom', label: 'Custom Range' },
              ].map((dp) => (
                <button
                  key={dp.id}
                  type="button"
                  onClick={() => {
                    setDateRangePreset(dp.id as any);
                    if (dp.id !== 'custom') {
                      setCustomStartDate('');
                      setCustomEndDate('');
                    }
                  }}
                  className={`px-2.5 py-1 rounded-lg text-xs transition-all ${
                    dateRangePreset === dp.id
                      ? 'bg-emerald-800 text-white font-bold shadow-2xs'
                      : 'bg-white border border-slate-200 text-slate-600 hover:border-slate-300'
                  }`}
                >
                  {dp.label}
                </button>
              ))}
            </div>

            {/* Custom Date Pickers (Shown if Custom or custom dates set) */}
            {(dateRangePreset === 'custom' || customStartDate || customEndDate) && (
              <div className="flex items-center gap-2 bg-white p-1.5 rounded-xl border border-slate-200 text-xs shadow-2xs">
                <div className="flex items-center gap-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400">From:</span>
                  <input
                    type="date"
                    value={customStartDate}
                    onChange={(e) => {
                      setCustomStartDate(e.target.value);
                      setDateRangePreset('custom');
                    }}
                    className="p-1 rounded bg-slate-50 border border-slate-200 text-slate-800 text-xs focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
                <ArrowRight className="w-3 h-3 text-slate-400" />
                <div className="flex items-center gap-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400">To:</span>
                  <input
                    type="date"
                    value={customEndDate}
                    onChange={(e) => {
                      setCustomEndDate(e.target.value);
                      setDateRangePreset('custom');
                    }}
                    className="p-1 rounded bg-slate-50 border border-slate-200 text-slate-800 text-xs focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
                {(customStartDate || customEndDate) && (
                  <button
                    type="button"
                    onClick={() => {
                      setCustomStartDate('');
                      setCustomEndDate('');
                      setDateRangePreset('all');
                    }}
                    className="p-1 text-slate-400 hover:text-slate-600"
                    title="Clear custom range"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Tier 3: Status Filters & Filter Summary Footer */}
        <div className="px-3.5 sm:px-4 py-2.5 bg-white flex flex-col sm:flex-row gap-2.5 items-start sm:items-center justify-between text-xs text-slate-500">
          {/* Status Filter Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-0.5 sm:pb-0">
            <span className="text-slate-400 text-xs mr-1 inline-flex items-center gap-1 shrink-0">
              <Filter className="w-3 h-3 text-slate-400" /> Status:
            </span>
            {(['all', 'Pending Confirmation', 'Confirmed', 'Driver Assigned', 'Completed'] as const).map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => setStatusFilter(status)}
                className={`px-2.5 py-0.5 rounded-full whitespace-nowrap text-[11px] transition-all flex items-center gap-1 ${
                  statusFilter === status
                    ? status === 'Driver Assigned'
                      ? 'bg-indigo-900 text-white font-bold'
                      : 'bg-slate-900 text-white font-bold'
                    : status === 'Driver Assigned'
                    ? 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-semibold border border-indigo-200'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {status === 'Driver Assigned' && <Car className="w-3 h-3 text-indigo-400" />}
                <span>{status === 'all' ? 'All Statuses' : status}</span>
              </button>
            ))}
          </div>

          {/* Results Counter & Estimated Revenue Stats */}
          <div className="flex items-center gap-3 text-xs shrink-0 self-end sm:self-auto font-medium">
            <span>
              Showing <strong className="text-slate-900">{filteredTrips.length}</strong> of{' '}
              <span className="text-slate-700">{trips.length}</span> trips
            </span>
            {filteredTrips.length > 0 && (
              <span className="hidden sm:inline-block text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md font-bold">
                Total: ₹{Number(totalFilteredFare ?? 0).toLocaleString('en-IN')}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Database Connection Notice Badge */}
      {dataSource === 'local' && (
        <div className="mb-6 p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs text-slate-700">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              Operating in secure local storage mode. All trip itineraries, driver dispatches, and recent bookings are saved in your dispatch registry.
            </span>
          </div>
        </div>
      )}


      {/* Trips Content Display */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div
              key={n}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs animate-pulse space-y-3"
            >
              <div className="flex justify-between items-center">
                <div className="h-4 w-24 bg-slate-200 rounded" />
                <div className="h-4 w-16 bg-slate-200 rounded-full" />
              </div>
              <div className="h-5 w-3/4 bg-slate-200 rounded" />
              <div className="h-4 w-1/2 bg-slate-200 rounded" />
              <div className="pt-3 border-t border-slate-100 flex justify-between">
                <div className="h-4 w-20 bg-slate-200 rounded" />
                <div className="h-4 w-16 bg-slate-200 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredTrips.length === 0 ? (
        <div className="bg-white rounded-3xl border border-dashed border-slate-300 p-10 text-center max-w-xl mx-auto shadow-2xs">
          <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-800 mx-auto mb-4 border border-emerald-100">
            {activeFiltersCount > 0 ? (
              <Filter className="w-7 h-7 text-emerald-700" />
            ) : (
              <Car className="w-7 h-7" />
            )}
          </div>
          <h3 className="font-extrabold text-lg text-slate-900 mb-1">
            {activeFiltersCount > 0 ? 'No matching trips found' : 'No booking activity yet'}
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 mb-6 leading-relaxed">
            {activeFiltersCount > 0
              ? 'No trips matched your selected date range, service type, or search query. Try broadening your criteria.'
              : 'Book your first cab ride using the search engine above. All confirmed details will automatically save and appear here in real time.'}
          </p>
          <div className="flex items-center justify-center gap-3">
            {activeFiltersCount > 0 ? (
              <button
                type="button"
                onClick={resetAllFilters}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm shadow-md transition-all active:scale-95"
              >
                <RotateCcw className="w-4 h-4" />
                Reset All Filters
              </button>
            ) : onOpenBookingSearch ? (
              <button
                type="button"
                onClick={onOpenBookingSearch}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs sm:text-sm shadow-md transition-all active:scale-95"
              >
                Book a Ride Now
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : null}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4.5">
          {filteredTrips.map((trip) => {
            const isCopied = copiedId === trip.reference_id;
            return (
              <div
                key={trip.reference_id || trip.id}
                className="bg-white rounded-2xl border border-slate-200/90 hover:border-emerald-400 p-5 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between group relative"
              >
                <div>
                  {/* Top Bar: Reference ID & Status */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <button
                      type="button"
                      onClick={(e) => handleCopyRef(trip.reference_id, e)}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-emerald-50 text-slate-800 hover:text-emerald-900 text-xs font-mono font-bold transition-colors group/btn"
                      title="Click to copy Reference ID"
                    >
                      <span>{trip.reference_id}</span>
                      {isCopied ? (
                        <Check className="w-3 h-3 text-emerald-600" />
                      ) : (
                        <Copy className="w-3 h-3 text-slate-400 group-hover/btn:text-emerald-700" />
                      )}
                    </button>
                    <div>{getStatusBadge(trip.status)}</div>
                  </div>

                  {/* Service Badge & Route */}
                  <div className="mb-3.5">
                    <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider block mb-1">
                      {getServiceLabel(trip.service_type)}
                    </span>
                    <div className="space-y-1 text-sm font-semibold text-slate-900">
                      <div className="flex items-start gap-2">
                        <MapPin className="w-4 h-4 text-emerald-800 shrink-0 mt-0.5" />
                        <span className="line-clamp-1">{trip.pickup_location}</span>
                      </div>
                      {trip.drop_location && (
                        <div className="flex items-start gap-2 text-slate-700 pl-0.5">
                          <ArrowRight className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-1" />
                          <span className="line-clamp-1">{trip.drop_location}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Driver Assigned Indicator & Details */}
                  {trip.status === 'Driver Assigned' && (
                    <div
                      id={`driver-assigned-box-${trip.reference_id}`}
                      className="mb-3.5 p-2.5 rounded-xl bg-indigo-50 border border-indigo-200/80 text-xs text-indigo-950 flex items-center justify-between gap-2 shadow-2xs animate-in fade-in duration-300"
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                          <User className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <span className="font-bold text-[11px] text-indigo-900 block leading-tight">
                            {trip.driver_name || 'Driver Assigned'}
                          </span>
                          <span className="text-[10px] text-indigo-600 font-medium">
                            {trip.driver_vehicle_plate || 'Plate No. Assigned'}
                          </span>
                        </div>
                      </div>
                      {trip.driver_phone && (
                        <a
                          href={`tel:${trip.driver_phone}`}
                          onClick={(e) => e.stopPropagation()}
                          className="px-2 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[10px] flex items-center gap-1 shadow-2xs transition-colors shrink-0"
                          title="Call Driver"
                        >
                          <Phone className="w-3 h-3" />
                          <span>Call</span>
                        </a>
                      )}
                    </div>
                  )}

                  {/* Date, Time & Passenger Details */}
                  <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl mb-3.5 border border-slate-100">
                    <div className="flex items-center gap-1.5 truncate">
                      <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{trip.travel_date}</span>
                    </div>
                    <div className="flex items-center gap-1.5 truncate">
                      <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{trip.pickup_time}</span>
                    </div>
                    <div className="flex items-center gap-1.5 truncate">
                      <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate font-medium">{trip.full_name}</span>
                    </div>
                    <div className="flex items-center gap-1.5 truncate">
                      <Car className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate font-medium">{trip.vehicle_name || 'Selected Cab'}</span>
                    </div>
                  </div>

                  {/* Ride Progress Bar for Ongoing / Active Rides */}
                  {(() => {
                    const rideProgress = calculateTripRideProgress(trip);
                    if (!rideProgress.isOngoing && trip.status !== 'Completed') return null;

                    return (
                      <div
                        id={`ride-progress-${trip.reference_id}`}
                        className="mb-3.5 p-2.5 rounded-xl bg-slate-900 text-white border border-slate-800 shadow-2xs"
                      >
                        <div className="flex items-center justify-between text-[11px] font-semibold mb-1.5">
                          <span className="text-emerald-400 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                            {trip.status === 'Completed' ? 'Ride Completed' : 'Ride in Progress'}
                          </span>
                          <span className="text-slate-300 font-mono text-[10px]">
                            {trip.status === 'Completed' ? '100%' : rideProgress.remainingText}
                          </span>
                        </div>

                        {/* Progress track */}
                        <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden relative">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              trip.status === 'Completed'
                                ? 'bg-emerald-500'
                                : 'bg-gradient-to-r from-emerald-500 via-teal-400 to-indigo-400 animate-pulse'
                            }`}
                            style={{
                              width: `${trip.status === 'Completed' ? 100 : rideProgress.progressPercent}%`,
                            }}
                          />
                        </div>

                        <div className="flex justify-between items-center text-[10px] text-slate-400 mt-1">
                          <span>Pickup</span>
                          <span className="font-medium text-slate-300">
                            {trip.status === 'Completed' ? 'Arrived' : `${rideProgress.progressPercent}% elapsed`}
                          </span>
                          <span>Destination</span>
                        </div>
                      </div>
                    );
                  })()}
                </div>

                {/* Bottom Bar: Estimated Fare & Action Buttons */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-medium">Estimated Fare</span>
                    <span className="font-black text-base text-slate-900 tracking-tight">
                      ₹{Number(trip.total_estimated_fare || 0).toLocaleString('en-IN')}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={(e) => handleDownloadInvoice(trip, e)}
                      disabled={downloadingInvoiceRef === trip.reference_id}
                      className="px-2.5 py-1.5 text-slate-700 hover:text-emerald-900 hover:bg-emerald-50 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors border border-slate-200 hover:border-emerald-300 active:scale-95"
                      title="Download PDF Booking Invoice & Summary"
                      aria-label={`Download PDF invoice for booking ${trip.reference_id}`}
                    >
                      {downloadingInvoiceRef === trip.reference_id ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-700" />
                      ) : (
                        <FileDown className="w-3.5 h-3.5 text-emerald-700" />
                      )}
                      <span className="hidden sm:inline">Invoice</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedTripDetails(trip)}
                      className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
                      title="View full trip breakdown"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Details</span>
                    </button>
                    {onRebookTrip && (
                      <button
                        type="button"
                        onClick={(e) => handleRebook(trip, e)}
                        className="px-3 py-1.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-2xs transition-all active:scale-95"
                        title="Prefill search form with this route"
                      >
                        Rebook
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Trip Details Modal Popup */}
      {selectedTripDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-800 text-white flex items-center justify-center font-bold">
                  <Car className="w-5 h-5 text-emerald-300" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900">
                    Booking Details & Dispatch Record
                  </h3>
                  <span className="text-xs font-mono text-emerald-800 font-bold">
                    #{selectedTripDetails.reference_id}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTripDetails(null)}
                className="p-2 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-200/60 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto text-xs sm:text-sm">
              {/* Status & Date */}
              <div className="flex items-center justify-between bg-emerald-50/70 p-3 rounded-xl border border-emerald-100">
                <span className="font-bold text-emerald-950">Status:</span>
                <div>{getStatusBadge(selectedTripDetails.status)}</div>
              </div>

              {/* Ride Progress Bar for Ongoing / Active Rides */}
              {(() => {
                const rideProgress = calculateTripRideProgress(selectedTripDetails);
                if (!rideProgress.isOngoing && selectedTripDetails.status !== 'Completed') return null;

                return (
                  <div className="p-3.5 rounded-xl bg-slate-900 text-white border border-slate-800 shadow-sm">
                    <div className="flex items-center justify-between text-xs font-semibold mb-1.5">
                      <span className="text-emerald-400 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                        {selectedTripDetails.status === 'Completed' ? 'Trip Completed' : 'Live Ride Progress'}
                      </span>
                      <span className="text-emerald-300 font-mono text-xs">
                        {selectedTripDetails.status === 'Completed' ? '100% Completed' : rideProgress.remainingText}
                      </span>
                    </div>

                    {/* Progress track */}
                    <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden my-2 relative">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          selectedTripDetails.status === 'Completed'
                            ? 'bg-emerald-500'
                            : 'bg-gradient-to-r from-emerald-500 via-teal-400 to-indigo-400 animate-pulse'
                        }`}
                        style={{
                          width: `${selectedTripDetails.status === 'Completed' ? 100 : rideProgress.progressPercent}%`,
                        }}
                      />
                    </div>

                    <div className="flex justify-between items-center text-[11px] text-slate-400">
                      <span className="truncate max-w-[120px]">{selectedTripDetails.pickup_location.split(',')[0]}</span>
                      <span className="font-bold text-slate-200">
                        {selectedTripDetails.status === 'Completed' ? 'Arrived at destination' : `${rideProgress.progressPercent}% of journey elapsed`}
                      </span>
                      <span className="truncate max-w-[120px] text-right">
                        {(selectedTripDetails.drop_location || 'Destination').split(',')[0]}
                      </span>
                    </div>
                  </div>
                );
              })()}

              {/* Passenger Info */}
              <div className="space-y-1.5 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <h4 className="font-bold text-slate-700 text-xs uppercase tracking-wider mb-1">
                  Passenger Contact
                </h4>
                <div className="flex justify-between text-slate-800">
                  <span className="text-slate-500">Name:</span>
                  <span className="font-semibold">{selectedTripDetails.full_name}</span>
                </div>
                <div className="flex justify-between text-slate-800">
                  <span className="text-slate-500">Phone:</span>
                  <span className="font-semibold">{selectedTripDetails.mobile_number}</span>
                </div>
                <div className="flex justify-between text-slate-800">
                  <span className="text-slate-500">Email:</span>
                  <span className="font-semibold">{selectedTripDetails.email}</span>
                </div>
                <div className="flex justify-between text-slate-800">
                  <span className="text-slate-500">Passengers:</span>
                  <span className="font-semibold">{selectedTripDetails.passengers_count || 2} Persons</span>
                </div>
              </div>

              {/* Itinerary Details */}
              <div className="space-y-2 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <h4 className="font-bold text-slate-700 text-xs uppercase tracking-wider mb-1">
                  Route & Schedule
                </h4>
                <div className="space-y-1">
                  <span className="text-xs text-slate-500 block">Pickup Location:</span>
                  <span className="font-semibold text-slate-900 block">{selectedTripDetails.pickup_location}</span>
                </div>
                {selectedTripDetails.drop_location && (
                  <div className="space-y-1 pt-1 border-t border-slate-200">
                    <span className="text-xs text-slate-500 block">Drop Location:</span>
                    <span className="font-semibold text-slate-900 block">{selectedTripDetails.drop_location}</span>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200 text-xs">
                  <div>
                    <span className="text-slate-500 block">Travel Date:</span>
                    <span className="font-semibold text-slate-800">{selectedTripDetails.travel_date}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Pickup Time:</span>
                    <span className="font-semibold text-slate-800">{selectedTripDetails.pickup_time}</span>
                  </div>
                </div>
              </div>

              {/* Vehicle & Fare */}
              <div className="bg-slate-900 text-white p-4 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-slate-400 block">Assigned Vehicle</span>
                  <span className="font-bold text-sm text-emerald-300">
                    {selectedTripDetails.vehicle_name} ({selectedTripDetails.vehicle_category || 'Sedan'})
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[11px] text-slate-400 block">Total Fare</span>
                  <span className="font-black text-lg text-white">
                    ₹{Number(selectedTripDetails.total_estimated_fare || 0).toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              {/* Driver Assigned Info inside Modal */}
              {selectedTripDetails.status === 'Driver Assigned' && (
                <div className="space-y-1.5 bg-indigo-50/80 p-3.5 rounded-xl border border-indigo-200">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-indigo-950 text-xs uppercase tracking-wider flex items-center gap-1.5">
                      <Car className="w-3.5 h-3.5 text-indigo-600" />
                      Assigned Driver & Vehicle
                    </h4>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-600 text-white">
                      Live Assigned
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-800 pt-1">
                    <span className="text-slate-500">Driver Name:</span>
                    <span className="font-semibold text-indigo-950">
                      {selectedTripDetails.driver_name || 'Designated Chauffeur'}
                    </span>
                  </div>
                  {selectedTripDetails.driver_phone && (
                    <div className="flex justify-between text-slate-800 items-center">
                      <span className="text-slate-500">Contact:</span>
                      <a
                        href={`tel:${selectedTripDetails.driver_phone}`}
                        className="font-semibold text-indigo-700 hover:underline flex items-center gap-1"
                      >
                        <Phone className="w-3 h-3 text-indigo-600" />
                        {selectedTripDetails.driver_phone}
                      </a>
                    </div>
                  )}
                  {selectedTripDetails.driver_vehicle_plate && (
                    <div className="flex justify-between text-slate-800">
                      <span className="text-slate-500">License Plate:</span>
                      <span className="font-mono font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-indigo-100">
                        {selectedTripDetails.driver_vehicle_plate}
                      </span>
                    </div>
                  )}
                  {selectedTripDetails.driver_assigned_at && (
                    <div className="text-[10px] text-slate-400 text-right pt-1">
                      Assigned at: {formatDateTime(selectedTripDetails.driver_assigned_at)}
                    </div>
                  )}
                </div>
              )}

              {/* Special Instructions */}
              {selectedTripDetails.special_instructions && (
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900">
                  <span className="font-bold block mb-0.5">Special Instructions:</span>
                  <p>{selectedTripDetails.special_instructions}</p>
                </div>
              )}

              {/* Created Timestamp */}
              <div className="text-[11px] text-slate-400 text-center pt-1">
                Recorded at: {formatDateTime(selectedTripDetails.created_at)}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
              <button
                type="button"
                onClick={(e) => handleDownloadInvoice(selectedTripDetails, e)}
                disabled={downloadingInvoiceRef === selectedTripDetails.reference_id}
                className="px-4 py-2 bg-white hover:bg-emerald-50 text-emerald-950 border border-slate-200 hover:border-emerald-300 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-colors shadow-2xs active:scale-95"
                title="Generate and download PDF Tax Invoice"
              >
                {downloadingInvoiceRef === selectedTripDetails.reference_id ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-700" />
                ) : (
                  <Download className="w-3.5 h-3.5 text-emerald-700" />
                )}
                <span>Download Invoice (PDF)</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedTripDetails(null)}
                  className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl font-bold text-xs transition-colors"
                >
                  Close
                </button>
                {onRebookTrip && (
                  <button
                    type="button"
                    onClick={(e) => {
                      handleRebook(selectedTripDetails, e);
                      setSelectedTripDetails(null);
                    }}
                    className="px-5 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 shadow transition-all"
                  >
                    Book This Route Again
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
