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
  Trash2,
  Send,
  Share2,
  FileSpreadsheet,
  Lock,
  Unlock,
} from 'lucide-react';
import { supabase } from '../services/supabaseClient';
import { BookingSearchState, Vehicle, BookingRequest } from '../types';
import { vehiclesData } from '../data/vehicles';
import { generateTripInvoicePdf } from '../utils/generateInvoicePdf';
import { VERIFIED_CHAUFFEURS, VerifiedChauffeur, getInitialSeedTrips } from '../data/seedTrips';

export interface RecentTripsSectionProps {
  onRebookTrip?: (searchState: Partial<BookingSearchState>, vehicleId?: string) => void;
  onOpenBookingSearch?: () => void;
  isOwner?: boolean;
  onOpenOwnerLogin?: () => void;
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
  updated_at?: string;
}

export const RecentTripsSection: React.FC<RecentTripsSectionProps> = ({
  onRebookTrip,
  onOpenBookingSearch,
  isOwner = false,
  onOpenOwnerLogin,
}) => {
  const [trips, setTrips] = useState<DbBookingRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);
  const [dataSource, setDataSource] = useState<'server' | 'supabase' | 'local'>('server');
  const [searchTerm, setSearchTerm] = useState('');
  const [serviceTypeFilter, setServiceTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'Pending Confirmation' | 'Confirmed' | 'Driver Assigned' | 'Completed' | 'Cancelled'>('all');
  const [dateRangePreset, setDateRangePreset] = useState<'all' | 'today' | 'upcoming' | 'past_7_days' | 'past_30_days' | 'custom'>('all');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState<boolean>(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [selectedTripDetails, setSelectedTripDetails] = useState<DbBookingRecord | null>(null);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<string>('');
  const [realtimeNotification, setRealtimeNotification] = useState<string | null>(null);
  const [downloadingInvoiceRef, setDownloadingInvoiceRef] = useState<string | null>(null);

  // Dedicated Delete / Remove booking state
  const [tripToDelete, setTripToDelete] = useState<DbBookingRecord | null>(null);
  const [deleteReason, setDeleteReason] = useState<string>('Duplicate or test booking inquiry');
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [deleteNotice, setDeleteNotice] = useState<string | null>(null);
  
  // Driver assignment modal & status modal state
  const [assigningTrip, setAssigningTrip] = useState<DbBookingRecord | null>(null);
  const [statusUpdatingTrip, setStatusUpdatingTrip] = useState<DbBookingRecord | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [selectedChauffeurId, setSelectedChauffeurId] = useState<string>(VERIFIED_CHAUFFEURS[0].id);
  const [customDriverName, setCustomDriverName] = useState(VERIFIED_CHAUFFEURS[0].name);
  const [customDriverPhone, setCustomDriverPhone] = useState(VERIFIED_CHAUFFEURS[0].phone);
  const [customDriverPlate, setCustomDriverPlate] = useState(VERIFIED_CHAUFFEURS[0].plateNumber);
  const [assignNotice, setAssignNotice] = useState<string | null>(null);

  const maskPhone = (phone?: string) => {
    if (!phone) return '••••••••••';
    const clean = phone.trim();
    if (clean.length <= 5) return '••••••';
    const prefix = clean.slice(0, 7);
    const suffix = clean.slice(-2);
    return `${prefix} •••• ${suffix}`;
  };

  const maskEmail = (email?: string) => {
    if (!email || !email.includes('@')) return '•••••••';
    const [user, domain] = email.split('@');
    const maskedUser = user.length > 2 ? `${user.slice(0, 2)}•••` : `${user}••`;
    return `${maskedUser}@${domain}`;
  };

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
          setDataSource('server');
          setLoading(false);
          setRefreshing(false);
          setLastRefreshedAt(
            new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
          );
          return;
        }
      }
    } catch {
      // Backend check skipped, continue to client direct check
    }

    // 2. Direct Supabase check if configured
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('bookings')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(30);

        if (!error && data && data.length > 0) {
          setTrips(data);
          setDataSource('supabase');
          setLoading(false);
          setRefreshing(false);
          setLastRefreshedAt(
            new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
          );
          return;
        }
      } catch {
        // Fallback quietly
      }
    }

    // 3. Fallback to LocalStorage or verified seed data
    fallbackToLocalStorage();
    setLoading(false);
    setRefreshing(false);
    setLastRefreshedAt(
      new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    );
  }, []);

  const fallbackToLocalStorage = () => {
    try {
      const stored = localStorage.getItem('tj_all_bookings');
      if (stored) {
        const localList = JSON.parse(stored);
        if (Array.isArray(localList) && localList.length > 0) {
          const mapped: DbBookingRecord[] = localList.slice(0, 30).map((b: any) => ({
            reference_id: b.reference_id || b.referenceId,
            full_name: b.full_name || b.passengerDetails?.fullName || 'Traveler',
            mobile_number: b.mobile_number || b.passengerDetails?.mobileNumber || '',
            email: b.email || b.passengerDetails?.email || '',
            service_type: b.service_type || b.searchDetails?.serviceType || 'oneway',
            pickup_location: b.pickup_location || b.searchDetails?.pickupLocation || '',
            drop_location: b.drop_location || b.searchDetails?.dropLocation || '',
            travel_date: b.travel_date || b.searchDetails?.travelDate || '',
            pickup_time: b.pickup_time || b.searchDetails?.pickupTime || '',
            return_date: b.return_date || b.searchDetails?.returnDate,
            return_time: b.return_time || b.searchDetails?.returnTime,
            duration_hours: b.duration_hours || b.searchDetails?.durationHours,
            estimated_distance_km: b.estimated_distance_km || b.searchDetails?.routeInfo?.distanceKm,
            airport_transfer_type: b.airport_transfer_type || b.searchDetails?.airportTransferType,
            passengers_count: b.passengers_count || b.passengerDetails?.passengersCount || 2,
            vehicle_id: b.vehicle_id || b.selectedVehicle?.id,
            vehicle_name: b.vehicle_name || b.selectedVehicle?.name || 'Cab',
            vehicle_category: b.vehicle_category || b.selectedVehicle?.category,
            special_instructions: b.special_instructions || b.passengerDetails?.specialInstructions,
            total_estimated_fare: b.total_estimated_fare || b.estimatedFare?.totalEstimatedFare || 0,
            currency: 'INR',
            status: b.status || 'Pending Confirmation',
            driver_name: b.driver_name,
            driver_phone: b.driver_phone,
            driver_vehicle_plate: b.driver_vehicle_plate,
            driver_assigned_at: b.driver_assigned_at,
            search_details: b.search_details || b.searchDetails,
            estimated_fare: b.estimated_fare || b.estimatedFare,
            created_at: b.created_at || b.createdAt || new Date().toISOString(),
          }));
          setTrips(mapped);
          setDataSource('local');
          return;
        }
      }

      // If nothing in localStorage, seed with verified realistic dispatches
      const seed = getInitialSeedTrips();
      setTrips(seed);
      setDataSource('local');
      try {
        localStorage.setItem('tj_all_bookings', JSON.stringify(seed));
      } catch {}
    } catch {
      const seed = getInitialSeedTrips();
      setTrips(seed);
      setDataSource('local');
    }
  };

  useEffect(() => {
    fetchTrips();

    if (!supabase) return;

    try {
      const channel = supabase
        .channel('realtime:public:bookings')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'bookings' },
          (payload) => {
            if (payload.eventType === 'INSERT') {
              const newRow = payload.new as DbBookingRecord;
              setTrips((prev) => [newRow, ...prev.filter((t) => t.reference_id !== newRow.reference_id)]);
              setRealtimeNotification(`New Booking #${newRow.reference_id} received for ${newRow.service_type}`);
              setTimeout(() => setRealtimeNotification(null), 6000);
            } else if (payload.eventType === 'UPDATE') {
              const updatedRow = payload.new as DbBookingRecord;
              setTrips((prev) =>
                prev.map((t) => (t.reference_id === updatedRow.reference_id ? updatedRow : t))
              );
              setRealtimeNotification(`Trip #${updatedRow.reference_id} updated: ${updatedRow.status}`);
              setTimeout(() => setRealtimeNotification(null), 5000);
            } else if (payload.eventType === 'DELETE') {
              const deletedRow = payload.old as DbBookingRecord;
              setTrips((prev) => prev.filter((t) => t.reference_id !== deletedRow.reference_id));
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    } catch {
      // Ignored
    }
  }, [fetchTrips]);

  const handleCopyRef = (refId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    navigator.clipboard.writeText(refId);
    setCopiedId(refId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleRebook = (trip: DbBookingRecord, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!onRebookTrip) return;

    const partialSearch: Partial<BookingSearchState> = {
      pickupLocation: trip.pickup_location,
      dropLocation: trip.drop_location || '',
      serviceType: (trip.service_type as any) || 'oneway',
      durationHours: trip.duration_hours || 8,
      airportTransferType: (trip.airport_transfer_type as any) || 'drop',
    };

    onRebookTrip(partialSearch, trip.vehicle_id);
  };

  const getServiceLabel = (serviceType: string) => {
    switch (serviceType) {
      case 'oneway':
        return 'One-Way Outstation';
      case 'roundtrip':
        return 'Round Trip Tour';
      case 'local':
        return 'Local Hourly Rental';
      case 'airport':
        return 'Airport Transfer';
      default:
        return 'Cab Booking';
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
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300/60">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
          Confirmed
        </span>
      );
    }
    if (status === 'Completed') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-100 text-blue-800 border border-blue-300/60">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
          Completed
        </span>
      );
    }
    if (status === 'Cancelled') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-300/60">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-600" />
          Cancelled
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-300/60">
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
    let totalDurationMinutes = 60;
    if (trip.service_type === 'local' && trip.duration_hours) {
      totalDurationMinutes = trip.duration_hours * 60;
    } else if (trip.estimated_distance_km) {
      totalDurationMinutes = Math.max(30, Math.round((trip.estimated_distance_km / 38) * 60));
    } else {
      totalDurationMinutes = (trip.duration_hours || 2) * 60;
    }

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
      startTime = now - 25 * 60 * 1000;
    }

    const elapsedMinutes = Math.max(0, (now - startTime) / (1000 * 60));
    const totalMinutes = Math.max(15, totalDurationMinutes);

    let progressPercent = Math.min(100, Math.round((elapsedMinutes / totalMinutes) * 100));

    if (trip.status === 'Driver Assigned' && (progressPercent === 0 || progressPercent >= 100)) {
      progressPercent = 48;
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

  // --- DRIVER ASSIGNMENT & STATUS UPDATE LOGIC ---

  const handleOpenAssignModal = (trip: DbBookingRecord, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setAssigningTrip(trip);
    setAssignNotice(null);
    // Preset with first chauffeur or existing
    if (trip.driver_name) {
      setCustomDriverName(trip.driver_name);
      setCustomDriverPhone(trip.driver_phone || '+91 98450 12345');
      setCustomDriverPlate(trip.driver_vehicle_plate || 'KA 09 MJ 4492');
    } else {
      const defaultChauffeur = VERIFIED_CHAUFFEURS[0];
      setSelectedChauffeurId(defaultChauffeur.id);
      setCustomDriverName(defaultChauffeur.name);
      setCustomDriverPhone(defaultChauffeur.phone);
      setCustomDriverPlate(defaultChauffeur.plateNumber);
    }
  };

  const handleSelectChauffeurPreset = (chauffeur: VerifiedChauffeur) => {
    setSelectedChauffeurId(chauffeur.id);
    setCustomDriverName(chauffeur.name);
    setCustomDriverPhone(chauffeur.phone);
    setCustomDriverPlate(chauffeur.plateNumber);
  };

  const handleConfirmDriverAssignment = async () => {
    if (!assigningTrip) return;
    setIsUpdatingStatus(true);
    const nowIso = new Date().toISOString();

    const updates = {
      status: 'Driver Assigned',
      driver_name: customDriverName.trim(),
      driver_phone: customDriverPhone.trim(),
      driver_vehicle_plate: customDriverPlate.trim().toUpperCase(),
      driver_assigned_at: nowIso,
    };

    // 1. Optimistically update local state
    const updatedTrips = trips.map((t) =>
      t.reference_id === assigningTrip.reference_id ? { ...t, ...updates } : t
    );
    setTrips(updatedTrips);
    if (selectedTripDetails?.reference_id === assigningTrip.reference_id) {
      setSelectedTripDetails({ ...selectedTripDetails, ...updates });
    }

    // 2. Persist in localStorage
    try {
      localStorage.setItem('tj_all_bookings', JSON.stringify(updatedTrips));
    } catch {}

    // 3. Persist via backend API
    try {
      await fetch(`/api/bookings/${encodeURIComponent(assigningTrip.reference_id)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
    } catch (apiErr) {
      console.warn('Backend update failed:', apiErr);
    }

    setIsUpdatingStatus(false);
    setAssignNotice(`Driver ${customDriverName} successfully assigned to #${assigningTrip.reference_id}!`);
    setTimeout(() => {
      setAssigningTrip(null);
      setAssignNotice(null);
    }, 1200);
  };

  const handleQuickStatusChange = async (trip: DbBookingRecord, newStatus: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const updates: Partial<DbBookingRecord> = { status: newStatus };

    const updatedTrips = trips.map((t) =>
      t.reference_id === trip.reference_id ? { ...t, ...updates } : t
    );
    setTrips(updatedTrips);
    if (selectedTripDetails?.reference_id === trip.reference_id) {
      setSelectedTripDetails({ ...selectedTripDetails, ...updates });
    }

    try {
      localStorage.setItem('tj_all_bookings', JSON.stringify(updatedTrips));
    } catch {}

    try {
      await fetch(`/api/bookings/${encodeURIComponent(trip.reference_id)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
    } catch {}
  };

  const handleOpenDeleteModal = (trip: DbBookingRecord, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setTripToDelete(trip);
    setDeleteReason(
      trip.status === 'Pending Confirmation'
        ? 'Duplicate or test booking inquiry'
        : 'Inquiry cancelled by fleet manager'
    );
  };

  const handleDeleteTrip = (trip: DbBookingRecord, e?: React.MouseEvent) => {
    handleOpenDeleteModal(trip, e);
  };

  const executeDeleteTrip = async (
    trip: DbBookingRecord,
    notifyWhatsApp: boolean = false,
    reason: string = 'Booking inquiry cancelled'
  ) => {
    setIsDeleting(true);
    try {
      if (notifyWhatsApp && trip.mobile_number) {
        const cleanPhone = trip.mobile_number.replace(/[^0-9]/g, '');
        const targetPhone = cleanPhone.startsWith('91') ? cleanPhone : `91${cleanPhone}`;
        const msg = `*TRAVEL JUST MYSURU - BOOKING UPDATE*
Booking Ref: #${trip.reference_id}
Passenger: ${trip.full_name}
Route: ${trip.pickup_location} ➔ ${trip.drop_location || 'Local Mysuru'}
Travel Date: ${trip.travel_date} at ${trip.pickup_time}

Your booking request has been cancelled/removed from the dispatch registry (${reason}). We apologize for any inconvenience caused.

For immediate cab arrangements, custom outstation packages, or urgent dispatches, please call Travel Just 24/7 Mysuru Desk at +91 97407 54400.`;
        window.open(`https://wa.me/${targetPhone}?text=${encodeURIComponent(msg)}`, '_blank');
      }

      const filtered = trips.filter((t) => t.reference_id !== trip.reference_id);
      setTrips(filtered);

      if (selectedTripDetails?.reference_id === trip.reference_id) {
        setSelectedTripDetails(null);
      }
      setTripToDelete(null);

      // 1. Local storage sync
      try {
        localStorage.setItem('tj_all_bookings', JSON.stringify(filtered));
      } catch {}

      // 2. Server API sync
      try {
        await fetch(`/api/bookings/${encodeURIComponent(trip.reference_id)}`, {
          method: 'DELETE',
        });
      } catch {}

      // 3. Supabase sync if present
      if (supabase) {
        try {
          await supabase.from('bookings').delete().eq('reference_id', trip.reference_id);
        } catch (err) {
          console.warn('Supabase delete error:', err);
        }
      }

      setDeleteNotice(
        `Booking #${trip.reference_id} (${trip.full_name}) successfully removed from registry.`
      );
      setTimeout(() => {
        setDeleteNotice(null);
      }, 4500);
    } catch (err) {
      console.error('Error removing booking:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDispatchDriverWhatsApp = (
    trip: DbBookingRecord,
    driver = {
      name: trip.driver_name || customDriverName,
      phone: trip.driver_phone || customDriverPhone,
      plate: trip.driver_vehicle_plate || customDriverPlate,
    }
  ) => {
    const cleanPhone = driver.phone.replace(/[^0-9]/g, '');
    const targetPhone = cleanPhone.startsWith('91') ? cleanPhone : `91${cleanPhone}`;
    const text = encodeURIComponent(
      `🚖 *TRAVEL JUST MYSURU - DRIVER TRIP DISPATCH*\n` +
      `----------------------------------------\n` +
      `*Booking Ref:* #${trip.reference_id}\n` +
      `*Assigned Driver:* ${driver.name}\n` +
      `*Cab Plate:* ${driver.plate}\n` +
      `*Vehicle:* ${trip.vehicle_name || 'Designated Cab'}\n` +
      `*Passenger Name:* ${trip.full_name}\n` +
      `*Passenger Phone:* ${trip.mobile_number}\n` +
      `*Service Type:* ${getServiceLabel(trip.service_type)}\n` +
      `*Pickup Date & Time:* ${trip.travel_date} at ${trip.pickup_time}\n` +
      `*Pickup Address:* ${trip.pickup_location}\n` +
      (trip.drop_location ? `*Drop Destination:* ${trip.drop_location}\n` : '') +
      (trip.duration_hours ? `*Rental Package:* ${trip.duration_hours} Hours\n` : '') +
      `*Total Fare:* ₹${Number(trip.total_estimated_fare).toLocaleString('en-IN')}\n` +
      (trip.special_instructions ? `*Special Notes:* ${trip.special_instructions}\n` : '') +
      `----------------------------------------\n` +
      `*Pickup Navigation Link:*\nhttps://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
        trip.pickup_location
      )}\n\n` +
      `_Please arrive 10 minutes prior to pickup in clean uniform with AC verified._`
    );
    window.open(`https://wa.me/${targetPhone}?text=${text}`, '_blank');
  };

  const handleNotifyCustomerWhatsApp = (trip: DbBookingRecord, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const cleanPhone = trip.mobile_number.replace(/[^0-9]/g, '');
    const targetPhone = cleanPhone.startsWith('91') ? cleanPhone : `91${cleanPhone}`;
    const text = encodeURIComponent(
      `🚖 *TRAVEL JUST MYSURU - BOOKING CONFIRMATION*\n` +
      `----------------------------------------\n` +
      `Dear *${trip.full_name}*,\n` +
      `Your cab booking *#${trip.reference_id}* has been confirmed by Travel Just Mysuru Dispatch.\n\n` +
      `*Trip Details:*\n` +
      `• *Pickup Address:* ${trip.pickup_location}\n` +
      (trip.drop_location ? `• *Destination:* ${trip.drop_location}\n` : '') +
      `• *Date & Time:* ${trip.travel_date} at ${trip.pickup_time}\n` +
      `• *Vehicle:* ${trip.vehicle_name || 'Assigned Cab'}\n` +
      (trip.driver_name ? `• *Assigned Chauffeur:* ${trip.driver_name} (${trip.driver_phone || ''})\n` : '') +
      (trip.driver_vehicle_plate ? `• *Cab License Plate:* ${trip.driver_vehicle_plate}\n` : '') +
      `• *Total Estimated Fare:* ₹${Number(trip.total_estimated_fare).toLocaleString('en-IN')}\n` +
      `----------------------------------------\n` +
      `For 24/7 instant dispatch assistance: +91 98451 23456.\n` +
      `Thank you for traveling with Travel Just Mysuru!`
    );
    window.open(`https://wa.me/${targetPhone}?text=${text}`, '_blank');
  };

  const handleExportCsv = () => {
    const headers = [
      'Reference ID',
      'Passenger Name',
      'Phone Number',
      'Service Type',
      'Pickup Location',
      'Drop Location',
      'Travel Date',
      'Pickup Time',
      'Vehicle',
      'Total Fare (INR)',
      'Status',
      'Driver Name',
      'Driver Phone',
      'Vehicle Plate',
      'Recorded At',
    ];
    const rows = filteredTrips.map((t) => [
      t.reference_id,
      `"${t.full_name.replace(/"/g, '""')}"`,
      `"${isOwner ? t.mobile_number : maskPhone(t.mobile_number)}"`,
      `"${t.service_type}"`,
      `"${(t.pickup_location || '').replace(/"/g, '""')}"`,
      `"${(t.drop_location || '').replace(/"/g, '""')}"`,
      t.travel_date,
      t.pickup_time,
      `"${(t.vehicle_name || '').replace(/"/g, '""')}"`,
      t.total_estimated_fare,
      t.status,
      `"${(t.driver_name || '').replace(/"/g, '""')}"`,
      `"${(t.driver_phone || '').replace(/"/g, '""')}"`,
      `"${(t.driver_vehicle_plate || '').replace(/"/g, '""')}"`,
      t.created_at,
    ]);
    const csvContent =
      'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `TravelJust_Live_Dispatch_Registry_${new Date().toISOString().split('T')[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // --- FILTERING & METRICS ---

  const isTripInDateRange = (trip: DbBookingRecord) => {
    if (dateRangePreset === 'all' && !customStartDate && !customEndDate) {
      return true;
    }
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
      const q = searchTerm.toLowerCase().trim();
      const matchesSearch =
        !q ||
        trip.reference_id?.toLowerCase().includes(q) ||
        trip.full_name?.toLowerCase().includes(q) ||
        trip.mobile_number?.toLowerCase().includes(q) ||
        trip.pickup_location?.toLowerCase().includes(q) ||
        trip.drop_location?.toLowerCase().includes(q) ||
        trip.vehicle_name?.toLowerCase().includes(q) ||
        trip.driver_name?.toLowerCase().includes(q) ||
        trip.driver_vehicle_plate?.toLowerCase().includes(q);

      const matchesStatus = statusFilter === 'all' || trip.status === statusFilter;
      const matchesService = serviceTypeFilter === 'all' || trip.service_type === serviceTypeFilter;
      const matchesDate = isTripInDateRange(trip);

      return matchesSearch && matchesStatus && matchesService && matchesDate;
    });
  }, [trips, searchTerm, statusFilter, serviceTypeFilter, dateRangePreset, customStartDate, customEndDate]);

  // Operational KPI Metrics
  const metrics = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    const onRoadCount = trips.filter(
      (t) => t.status === 'Driver Assigned' || t.status === 'Confirmed'
    ).length;
    const todayDispatchesCount = trips.filter((t) => t.travel_date === todayStr).length;
    const completedCount = trips.filter((t) => t.status === 'Completed').length;
    const pendingCount = trips.filter((t) => t.status === 'Pending Confirmation').length;
    const totalVolume = trips.reduce(
      (acc, curr) => acc + (Number(curr.total_estimated_fare) || 0),
      0
    );

    return {
      onRoadCount,
      todayDispatchesCount,
      completedCount,
      pendingCount,
      totalVolume,
    };
  }, [trips]);

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

  // Restrict completely: Visible only for Fleet Manager & Owner portal login; hidden from customer visibility
  if (!isOwner) {
    return null;
  }

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

      {/* Section Header with Ops Badge & Owner Mode Indicators */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold shadow-2xs">
              <Car className="w-3.5 h-3.5 text-emerald-700" />
              <span>Live Dispatch & Bookings Registry</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            </div>

            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-900 text-xs font-bold shadow-2xs">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
              <span>Fleet Manager Portal (Full Dispatch Control)</span>
            </span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            24/7 Mysuru Fleet Dispatch Registry
          </h2>
          <p className="text-slate-600 text-sm mt-1.5 max-w-2xl">
            Real-time tracking of active cabs, airport runs via NH 275 Expressway, and heritage outstation tours.
            Fleet Manager & Owner authorized view with driver assignment and dispatch control.
          </p>
        </div>

        {/* Action Controls: Refresh, Export & Add Ride */}
        <div className="flex items-center flex-wrap gap-2">
          {isOwner && (
            <button
              type="button"
              onClick={handleExportCsv}
              className="px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-2xs active:scale-95"
              title="Export filtered dispatches as CSV spreadsheet"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-700" />
              <span>Export CSV</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => fetchTrips(true)}
            disabled={refreshing}
            className="px-3.5 py-2 bg-white hover:bg-emerald-50 text-emerald-950 border border-slate-200 hover:border-emerald-300 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-2xs active:scale-95 disabled:opacity-50"
            title="Refresh Registry"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-emerald-700 ${refreshing ? 'animate-spin' : ''}`} />
            <span>{refreshing ? 'Syncing...' : 'Sync Registry'}</span>
          </button>

          {onOpenBookingSearch && (
            <button
              type="button"
              onClick={onOpenBookingSearch}
              className="px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow transition-all active:scale-95"
            >
              <Car className="w-3.5 h-3.5" />
              <span>Book New Cab</span>
            </button>
          )}
        </div>
      </div>

      {/* Operations KPI Metric Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-2xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-700 shrink-0">
            <Car className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xl font-black text-slate-900 leading-none">{metrics.onRoadCount}</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            </div>
            <span className="text-[11px] text-slate-500 font-medium mt-0.5 block">Cabs On-Road Now</span>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-2xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-700 shrink-0">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xl font-black text-slate-900 leading-none">{metrics.todayDispatchesCount}</span>
            <span className="text-[11px] text-slate-500 font-medium mt-0.5 block">Today&apos;s Dispatches</span>
          </div>
        </div>

        <button
          type="button"
          onClick={() =>
            setStatusFilter((prev) => (prev === 'Pending Confirmation' ? 'all' : 'Pending Confirmation'))
          }
          className={`p-3.5 rounded-2xl border text-left transition-all flex items-center gap-3 cursor-pointer ${
            statusFilter === 'Pending Confirmation'
              ? 'bg-amber-100/90 border-amber-400 ring-2 ring-amber-400/40 shadow-xs'
              : metrics.pendingCount > 0
              ? 'bg-amber-50/80 border-amber-200 hover:bg-amber-100/70 shadow-2xs'
              : 'bg-white border-slate-200 shadow-2xs hover:bg-slate-50'
          }`}
          title="Click to toggle filter for Pending Confirmation bookings"
        >
          <div className="w-10 h-10 rounded-xl bg-amber-100 border border-amber-200 flex items-center justify-center text-amber-800 shrink-0">
            <Clock className={`w-5 h-5 ${metrics.pendingCount > 0 ? 'animate-pulse' : ''}`} />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xl font-black text-slate-900 leading-none">{metrics.pendingCount}</span>
              {metrics.pendingCount > 0 && (
                <span className="text-[10px] font-bold bg-amber-600 text-white px-1.5 py-0.2 rounded-full">
                  Action Required
                </span>
              )}
            </div>
            <span className="text-[11px] text-slate-600 font-medium mt-0.5 block">
              Pending Confirmation
            </span>
          </div>
        </button>

        <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-2xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-700 shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xl font-black text-slate-900 leading-none">{metrics.completedCount}</span>
            <span className="text-[11px] text-slate-500 font-medium mt-0.5 block">Trips Completed</span>
          </div>
        </div>
      </div>

      {/* Search & "Track My Booking" Quick-Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs mb-6 space-y-3">
        <div className="flex flex-col sm:flex-row gap-2">
          {/* Main search input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Track booking by Ref ID (e.g. TJ-8921), phone number, passenger, or city..."
              className="w-full pl-9 pr-8 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 focus:bg-white transition-all font-medium"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded-full"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Toggle Advanced Filters Button */}
          <button
            type="button"
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border transition-all ${
              showAdvancedFilters || activeFiltersCount > 0
                ? 'bg-emerald-50 text-emerald-900 border-emerald-200 shadow-2xs'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Filters</span>
            {activeFiltersCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-emerald-800 text-white text-[10px] flex items-center justify-center ml-0.5">
                {activeFiltersCount}
              </span>
            )}
          </button>
        </div>

        {/* Quick Service Type Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1 shrink-0">
            Corridor:
          </span>
          {[
            { id: 'all', label: 'All Services' },
            { id: 'airport', label: 'Airport (BLR T1/T2)' },
            { id: 'oneway', label: 'One-Way Outstation' },
            { id: 'roundtrip', label: 'Round Trip Tour' },
            { id: 'local', label: 'Mysuru City 8h/80km' },
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setServiceTypeFilter(item.id)}
              className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition-all ${
                serviceTypeFilter === item.id
                  ? 'bg-emerald-800 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Quick Status Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs pt-2 border-t border-slate-100">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1 shrink-0">
            Status:
          </span>
          {[
            { id: 'all', label: 'All Statuses', count: trips.length },
            {
              id: 'Pending Confirmation',
              label: 'Pending Confirmation',
              count: metrics.pendingCount,
              alert: metrics.pendingCount > 0,
            },
            {
              id: 'Driver Assigned',
              label: 'Driver Assigned',
              count: trips.filter((t) => t.status === 'Driver Assigned').length,
            },
            {
              id: 'Confirmed',
              label: 'Confirmed',
              count: trips.filter((t) => t.status === 'Confirmed').length,
            },
            {
              id: 'Completed',
              label: 'Completed',
              count: metrics.completedCount,
            },
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setStatusFilter(item.id as any)}
              className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                statusFilter === item.id
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : item.alert
                  ? 'bg-amber-100 text-amber-900 hover:bg-amber-200 border border-amber-300'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <span>{item.label}</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                  statusFilter === item.id
                    ? 'bg-white/20 text-white'
                    : item.alert
                    ? 'bg-amber-600 text-white'
                    : 'bg-slate-200 text-slate-700'
                }`}
              >
                {item.count}
              </span>
            </button>
          ))}
        </div>

        {/* Advanced Filters Expandable Drawer */}
        {showAdvancedFilters && (
          <div className="pt-3 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs animate-in fade-in duration-150">
            {/* Status Filter */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">Dispatch Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              >
                <option value="all">All Statuses</option>
                <option value="Driver Assigned">Driver Assigned (En Route)</option>
                <option value="Confirmed">Confirmed</option>
                <option value="Pending Confirmation">Pending Confirmation</option>
                <option value="Completed">Completed</option>
              </select>
            </div>

            {/* Date Range Preset */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">Travel Date</label>
              <select
                value={dateRangePreset}
                onChange={(e) => setDateRangePreset(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              >
                <option value="all">All Dates</option>
                <option value="today">Today&apos;s Rides</option>
                <option value="upcoming">Upcoming Rides</option>
                <option value="past_7_days">Last 7 Days</option>
                <option value="past_30_days">Last 30 Days</option>
                <option value="custom">Custom Date Range</option>
              </select>
            </div>

            {/* Reset Filters */}
            <div className="flex items-end">
              <button
                type="button"
                onClick={resetAllFilters}
                className="w-full py-2 px-3 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 font-bold flex items-center justify-center gap-1 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset All Filters</span>
              </button>
            </div>
          </div>
        )}

        {/* Sync Info Bar */}
        <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
          <span>
            Showing <strong className="text-slate-700 font-bold">{filteredTrips.length}</strong> of{' '}
            <strong className="text-slate-700 font-bold">{trips.length}</strong> dispatch records
          </span>
          {lastRefreshedAt && <span>Synced at {lastRefreshedAt}</span>}
        </div>
      </div>

      {/* Pending Confirmation Queue Alert & Action Banner */}
      {statusFilter === 'Pending Confirmation' && (
        <div className="mb-6 p-4 rounded-2xl bg-amber-50/90 border border-amber-200 text-xs text-amber-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-200/80 text-amber-900 flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <span className="font-bold text-sm block text-amber-950">
                {filteredTrips.length} Booking{filteredTrips.length === 1 ? '' : 's'} Awaiting Fleet Confirmation
              </span>
              <span className="text-amber-800 text-[11px]">
                Review incoming requests. Assign a verified chauffeur to confirm, or click <strong>&quot;Remove Pending&quot;</strong> on any card to delete duplicate, spam, or unserviceable inquiries.
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={resetAllFilters}
            className="px-3 py-1.5 rounded-xl bg-white hover:bg-amber-100/60 text-amber-900 border border-amber-300 font-bold text-xs shrink-0 self-start sm:self-auto transition-colors"
          >
            Show All Bookings
          </button>
        </div>
      )}

      {/* Main Trip Cards Grid */}
      {loading ? (
        <div className="py-16 text-center">
          <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin mx-auto mb-3" />
          <p className="text-sm font-semibold text-slate-600">Connecting to Mysuru Dispatch Registry...</p>
        </div>
      ) : filteredTrips.length === 0 ? (
        <div className="py-16 text-center bg-white rounded-3xl border border-slate-200 shadow-2xs p-8">
          <Car className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-900 mb-1">No matching dispatch records found</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto mb-4">
            Try adjusting your search criteria or reset filters to see all fleet bookings.
          </p>
          <button
            type="button"
            onClick={resetAllFilters}
            className="px-4 py-2 bg-emerald-800 text-white text-xs font-bold rounded-xl shadow-xs"
          >
            Show All Dispatches
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredTrips.map((trip) => {
            const isCopied = copiedId === trip.reference_id;
            const isSearchedMatch =
              searchTerm &&
              (trip.reference_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                trip.mobile_number.includes(searchTerm));

            return (
              <div
                key={trip.reference_id}
                className={`bg-white rounded-2xl border transition-all duration-200 hover:shadow-md p-5 flex flex-col justify-between relative overflow-hidden ${
                  isSearchedMatch
                    ? 'border-emerald-500 ring-2 ring-emerald-500/20'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                {/* Search Match Highlight Tag */}
                {isSearchedMatch && (
                  <div className="absolute top-0 right-0 bg-emerald-700 text-white text-[9px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-bl-lg shadow-xs">
                    Match Found
                  </div>
                )}

                <div>
                  {/* Top Bar: Reference ID & Status */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <button
                      type="button"
                      onClick={(e) => handleCopyRef(trip.reference_id, e)}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-emerald-50 text-slate-800 hover:text-emerald-900 text-xs font-mono font-bold transition-colors"
                      title="Click to copy Reference ID"
                    >
                      <span>{trip.reference_id}</span>
                      {isCopied ? (
                        <Check className="w-3 h-3 text-emerald-600" />
                      ) : (
                        <Copy className="w-3 h-3 text-slate-400" />
                      )}
                    </button>
                    <div>{getStatusBadge(trip.status, trip)}</div>
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

                  {/* Driver Assigned Indicator & Quick Details */}
                  {trip.status === 'Driver Assigned' && (
                    <div
                      id={`driver-assigned-box-${trip.reference_id}`}
                      className="mb-3.5 p-2.5 rounded-xl bg-indigo-50 border border-indigo-200/80 text-xs text-indigo-950 flex items-center justify-between gap-2 shadow-2xs"
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                          <User className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <span className="font-bold text-[11px] text-indigo-900 block leading-tight">
                            {trip.driver_name || 'Assigned Chauffeur'}
                          </span>
                          <span className="text-[10px] text-indigo-600 font-mono font-medium">
                            {trip.driver_vehicle_plate || 'KA 09 Assigned'}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        {trip.driver_phone && (
                          <a
                            href={`tel:${trip.driver_phone}`}
                            onClick={(e) => e.stopPropagation()}
                            className="px-2 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[10px] flex items-center gap-1 shadow-2xs transition-colors"
                            title="Call Chauffeur"
                          >
                            <Phone className="w-3 h-3" />
                            <span>Call</span>
                          </a>
                        )}
                        {isOwner && (
                          <button
                            type="button"
                            onClick={(e) => handleOpenAssignModal(trip, e)}
                            className="px-2 py-1 rounded-lg bg-white border border-indigo-200 text-indigo-800 hover:bg-indigo-100 font-bold text-[10px]"
                            title="Re-assign Chauffeur"
                          >
                            Change
                          </button>
                        )}
                      </div>
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

                  {/* Ride Progress Bar for Active / Ongoing Rides */}
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

                  {/* Owner Controls Bar (Visible exclusively to logged-in Fleet Manager) */}
                  {isOwner && (
                    <div className="mb-3.5 p-2.5 rounded-xl bg-slate-100 border border-slate-200 text-xs space-y-2">
                      <div className="flex items-center justify-between text-[11px] font-bold text-slate-700">
                        <span className="flex items-center gap-1">
                          <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
                          Fleet Manager Actions
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={(e) => handleNotifyCustomerWhatsApp(trip, e)}
                            className="px-2 py-0.5 rounded bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] flex items-center gap-1 transition-colors"
                            title="Send WhatsApp update to passenger"
                          >
                            <Send className="w-2.5 h-2.5" />
                            <span>WhatsApp Pax</span>
                          </button>
                        </div>
                      </div>

                      {/* Quick Status & Assign Buttons */}
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {trip.status !== 'Driver Assigned' && (
                          <button
                            type="button"
                            onClick={(e) => handleOpenAssignModal(trip, e)}
                            className="px-2.5 py-1 rounded-lg bg-indigo-700 hover:bg-indigo-800 text-white font-bold text-[11px] flex items-center gap-1 shadow-2xs"
                          >
                            <Car className="w-3 h-3" />
                            <span>Assign Chauffeur</span>
                          </button>
                        )}

                        <select
                          value={trip.status}
                          onChange={(e) => handleQuickStatusChange(trip, e.target.value)}
                          className="px-2 py-1 rounded-lg border border-slate-300 bg-white font-bold text-[11px] text-slate-800 focus:outline-none"
                        >
                          <option value="Pending Confirmation">Pending</option>
                          <option value="Confirmed">Confirmed</option>
                          <option value="Driver Assigned">Driver Assigned</option>
                          <option value="Completed">Completed</option>
                          <option value="Cancelled">Cancelled</option>
                        </select>

                        {trip.status === 'Pending Confirmation' ? (
                          <button
                            type="button"
                            onClick={(e) => handleOpenDeleteModal(trip, e)}
                            className="px-2 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-[11px] flex items-center gap-1 transition-colors ml-auto shadow-2xs"
                            title="Delete or remove this pending confirmation booking inquiry"
                          >
                            <Trash2 className="w-3 h-3 text-rose-600" />
                            <span>Remove Pending</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={(e) => handleOpenDeleteModal(trip, e)}
                            className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors ml-auto"
                            title="Delete / Archive from registry"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  )}
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

      {/* Driver Assignment Modal */}
      {assigningTrip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-indigo-50/70">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-700 text-white flex items-center justify-center font-bold">
                  <Car className="w-5 h-5 text-indigo-200" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900">
                    Assign Fleet Chauffeur
                  </h3>
                  <span className="text-xs font-mono text-indigo-800 font-bold">
                    Trip #{assigningTrip.reference_id} ({assigningTrip.full_name})
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setAssigningTrip(null)}
                className="p-2 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-200/60 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto text-xs sm:text-sm">
              {assignNotice && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 font-bold flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>{assignNotice}</span>
                </div>
              )}

              {/* Trip Summary Quick Card */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1 text-xs">
                <div className="flex justify-between font-bold text-slate-900">
                  <span>{assigningTrip.pickup_location.split(',')[0]} → {(assigningTrip.drop_location || 'Local').split(',')[0]}</span>
                  <span>₹{Number(assigningTrip.total_estimated_fare).toLocaleString('en-IN')}</span>
                </div>
                <div className="text-slate-500">
                  {assigningTrip.travel_date} at {assigningTrip.pickup_time} • {assigningTrip.vehicle_name}
                </div>
              </div>

              {/* Quick Select Verified Chauffeur Preset */}
              <div>
                <label className="block font-bold text-slate-700 mb-2">
                  Select Verified Mysuru Fleet Chauffeur:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {VERIFIED_CHAUFFEURS.map((chauffeur) => {
                    const isSelected = selectedChauffeurId === chauffeur.id;
                    return (
                      <button
                        key={chauffeur.id}
                        type="button"
                        onClick={() => handleSelectChauffeurPreset(chauffeur)}
                        className={`p-2.5 rounded-xl border text-left transition-all flex flex-col justify-between ${
                          isSelected
                            ? 'bg-indigo-50 border-indigo-500 ring-2 ring-indigo-500/20'
                            : 'bg-white border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900 text-xs">{chauffeur.name}</span>
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                            ★ {chauffeur.rating}
                          </span>
                        </div>
                        <span className="text-[11px] font-mono text-slate-600 mt-1">
                          {chauffeur.plateNumber}
                        </span>
                        <span className="text-[10px] text-slate-400 truncate">
                          {chauffeur.vehicleModel}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Custom Driver Input Fields */}
              <div className="space-y-3 pt-2 border-t border-slate-200">
                <h4 className="font-bold text-slate-700 text-xs uppercase tracking-wider">
                  Chauffeur & Vehicle Credentials:
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-600 text-xs font-semibold mb-1">Chauffeur Name</label>
                    <input
                      type="text"
                      value={customDriverName}
                      onChange={(e) => setCustomDriverName(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900 text-xs focus:ring-2 focus:ring-indigo-500/20"
                      placeholder="e.g. Suresh Kumar"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 text-xs font-semibold mb-1">Mobile Contact</label>
                    <input
                      type="text"
                      value={customDriverPhone}
                      onChange={(e) => setCustomDriverPhone(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900 text-xs focus:ring-2 focus:ring-indigo-500/20"
                      placeholder="+91 98450 12345"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-600 text-xs font-semibold mb-1">Cab License Registration (Plate No.)</label>
                  <input
                    type="text"
                    value={customDriverPlate}
                    onChange={(e) => setCustomDriverPlate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900 font-mono font-bold text-xs focus:ring-2 focus:ring-indigo-500/20"
                    placeholder="e.g. KA 09 MJ 4492"
                  />
                </div>
              </div>

              {/* Instant WhatsApp Driver Trip Briefing Trigger */}
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center justify-between gap-2">
                <div className="text-xs">
                  <span className="font-bold text-emerald-950 block">Instant WhatsApp Briefing:</span>
                  <span className="text-emerald-800 text-[11px]">
                    Auto-sends GPS pickup link and passenger details directly to driver.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    handleDispatchDriverWhatsApp(assigningTrip, {
                      name: customDriverName,
                      phone: customDriverPhone,
                      plate: customDriverPlate,
                    })
                  }
                  className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold shrink-0 flex items-center gap-1"
                >
                  <Send className="w-3 h-3" />
                  <span>Send WhatsApp</span>
                </button>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setAssigningTrip(null)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl font-bold text-xs transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDriverAssignment}
                disabled={isUpdatingStatus || !customDriverName || !customDriverPlate}
                className="px-5 py-2 bg-indigo-700 hover:bg-indigo-800 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 shadow transition-all disabled:opacity-50"
              >
                {isUpdatingStatus ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Check className="w-3.5 h-3.5" />
                )}
                <span>Confirm & Update Registry</span>
              </button>
            </div>
          </div>
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
                        {selectedTripDetails.status === 'Completed' ? 'Arrived at destination' : `${rideProgress.progressPercent}% elapsed`}
                      </span>
                      <span className="truncate max-w-[120px] text-right">
                        {(selectedTripDetails.drop_location || 'Destination').split(',')[0]}
                      </span>
                    </div>
                  </div>
                );
              })()}

              {/* Passenger Info (Full for owner, masked for customer) */}
              <div className="space-y-1.5 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <h4 className="font-bold text-slate-700 text-xs uppercase tracking-wider mb-1">
                  Passenger Contact
                </h4>
                <div className="flex justify-between text-slate-800">
                  <span className="text-slate-500">Name:</span>
                  <span className="font-semibold">{selectedTripDetails.full_name}</span>
                </div>
                <div className="flex justify-between text-slate-800 items-center">
                  <span className="text-slate-500">Phone:</span>
                  <span className="font-semibold">
                    {isOwner ? selectedTripDetails.mobile_number : maskPhone(selectedTripDetails.mobile_number)}
                  </span>
                </div>
                <div className="flex justify-between text-slate-800">
                  <span className="text-slate-500">Email:</span>
                  <span className="font-semibold">
                    {isOwner ? selectedTripDetails.email : maskEmail(selectedTripDetails.email)}
                  </span>
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
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={(e) => handleDownloadInvoice(selectedTripDetails, e)}
                  disabled={downloadingInvoiceRef === selectedTripDetails.reference_id}
                  className="px-3.5 py-2 bg-white hover:bg-emerald-50 text-emerald-950 border border-slate-200 hover:border-emerald-300 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-colors shadow-2xs active:scale-95"
                  title="Generate and download PDF Tax Invoice"
                >
                  {downloadingInvoiceRef === selectedTripDetails.reference_id ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-700" />
                  ) : (
                    <Download className="w-3.5 h-3.5 text-emerald-700" />
                  )}
                  <span>Download Invoice (PDF)</span>
                </button>

                {isOwner && (
                  <button
                    type="button"
                    onClick={(e) => handleOpenDeleteModal(selectedTripDetails, e)}
                    className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-colors shadow-2xs"
                    title="Delete or remove this booking from registry"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                    <span>
                      {selectedTripDetails.status === 'Pending Confirmation'
                        ? 'Remove Pending Booking'
                        : 'Delete Booking'}
                    </span>
                  </button>
                )}
              </div>

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

      {/* Dedicated Delete / Remove Booking Confirmation Modal */}
      {tripToDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={() => !isDeleting && setTripToDelete(null)}
        >
          <div
            className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-rose-50/70">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-rose-100 border border-rose-200 text-rose-700 flex items-center justify-center shrink-0">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900 leading-tight">
                    {tripToDelete.status === 'Pending Confirmation'
                      ? 'Remove Pending Booking Inquiry'
                      : 'Remove Booking from Registry'}
                  </h3>
                  <p className="text-xs text-rose-800 font-medium">
                    Fleet Manager & Owner Portal Control
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setTripToDelete(null)}
                disabled={isDeleting}
                className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4">
              {/* Trip Summary Card */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-black text-slate-900">
                    Booking #{tripToDelete.reference_id}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                      tripToDelete.status === 'Pending Confirmation'
                        ? 'bg-amber-100 text-amber-900 border border-amber-300'
                        : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {tripToDelete.status}
                  </span>
                </div>

                <div className="text-slate-700 font-medium space-y-1 pt-1 border-t border-slate-200/60">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Passenger:</span>
                    <span className="font-bold text-slate-900">{tripToDelete.full_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Phone:</span>
                    <span className="font-mono text-slate-900">{tripToDelete.mobile_number}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Route:</span>
                    <span className="font-bold text-slate-800 text-right truncate max-w-[240px]">
                      {tripToDelete.pickup_location} ➔ {tripToDelete.drop_location || 'Local Mysuru'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Date & Time:</span>
                    <span className="text-slate-800">
                      {tripToDelete.travel_date} at {tripToDelete.pickup_time}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Vehicle / Fare:</span>
                    <span className="font-bold text-emerald-800">
                      {tripToDelete.vehicle_name} (₹{tripToDelete.total_estimated_fare})
                    </span>
                  </div>
                </div>
              </div>

              {/* Removal Reason Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Reason for Deletion / Removal:
                </label>
                <select
                  value={deleteReason}
                  onChange={(e) => setDeleteReason(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-400"
                >
                  <option value="Duplicate or test booking inquiry">
                    Duplicate or test booking inquiry
                  </option>
                  <option value="Customer requested cancellation / changed plans">
                    Customer requested cancellation / changed plans
                  </option>
                  <option value="No cabs available for requested date/time slot">
                    No cabs available for requested date/time slot
                  </option>
                  <option value="Unreachable contact or invalid phone number">
                    Unreachable contact or invalid phone number
                  </option>
                  <option value="Fare negotiation not agreed / customized package expired">
                    Fare negotiation not agreed / customized package expired
                  </option>
                  <option value="Other fleet operational reason">
                    Other fleet operational reason
                  </option>
                </select>
              </div>

              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-[11px] text-amber-900 leading-relaxed">
                <strong>Fleet Manager Notice:</strong> Deleting will remove this booking record from the live dispatch buffer and local registry. You can choose to notify the customer on WhatsApp prior to removal.
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setTripToDelete(null)}
                disabled={isDeleting}
                className="w-full sm:w-auto px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl font-bold text-xs transition-colors"
              >
                Keep Booking
              </button>

              <button
                type="button"
                onClick={() => executeDeleteTrip(tripToDelete, true, deleteReason)}
                disabled={isDeleting}
                className="w-full sm:w-auto px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow transition-colors"
                title="Send cancellation note via WhatsApp and remove"
              >
                <Send className="w-3.5 h-3.5" />
                <span>WhatsApp & Remove</span>
              </button>

              <button
                type="button"
                onClick={() => executeDeleteTrip(tripToDelete, false, deleteReason)}
                disabled={isDeleting}
                className="w-full sm:w-auto px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow transition-colors"
                title="Remove immediately without WhatsApp notification"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{isDeleting ? 'Removing...' : 'Delete Permanently'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Deletion Notice Toast */}
      {deleteNotice && (
        <div className="fixed bottom-6 right-6 z-50 p-4 rounded-2xl bg-slate-900 text-white text-xs font-semibold shadow-2xl flex items-center gap-2.5 border border-slate-800 animate-in slide-in-from-bottom-5 duration-200">
          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{deleteNotice}</span>
        </div>
      )}
    </section>
  );
};
