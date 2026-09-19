import React, { useState, useEffect } from 'react';
import {
  X,
  Zap,
  LayoutDashboard,
  CalendarCheck2,
  Car,
  Users,
  Sliders,
  DollarSign,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
  Phone,
  MessageSquare,
  FileSpreadsheet,
  Plus,
  RefreshCw,
  ShieldCheck,
  ChevronRight,
  TrendingUp,
  MapPin,
  Calendar,
  Layers,
  ArrowRight,
  Send,
  LogOut,
  FileText,
  Compass,
  Trash2,
  Loader2,
} from 'lucide-react';
import { BookingRequest } from '../types';

export interface OwnerPortalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExitOwnerMode: () => void;
}

export interface FleetVehicle {
  id: string;
  regNumber: string;
  model: string;
  vehicleType: string;
  vehicleName: string;
  category: string;
  seatingCapacity: number;
  status: 'Available' | 'On Trip' | 'Maintenance' | 'Off Duty';
  driverAssigned: string;
  insuranceExpiry: string;
  permitExpiry: string;
  fastagId?: string;
}

export interface Chauffeur {
  id: string;
  name: string;
  phone: string;
  licenseNumber: string;
  assignedCab: string;
  status: 'Available' | 'On Trip' | 'Off Duty';
  rating: number;
  totalTrips: number;
  languages: string[];
}

export interface CustomerRecord {
  id: string;
  fullName: string;
  mobileNumber: string;
  email: string;
  createdAt: string;
  totalTripsCount: number;
  totalSpend: number;
  defaultPickupLocation?: string;
}

export interface CommRecord {
  id: string;
  type: string;
  recipient: string;
  subject: string;
  content: string;
  status: string;
  timestamp: string;
}

export interface AuditRecord {
  id: string;
  actor: string;
  action: string;
  details: string;
  timestamp: string;
}

export const OwnerPortalModal: React.FC<OwnerPortalModalProps> = ({
  isOpen,
  onClose,
  onExitOwnerMode,
}) => {
  const [activeTab, setActiveTab] = useState<
    'dashboard' | 'bookings' | 'fleet' | 'chauffeurs' | 'customers' | 'communications' | 'audit'
  >('dashboard');

  // Core Data Stores
  const [bookings, setBookings] = useState<BookingRequest[]>([]);
  const [fleet, setFleet] = useState<FleetVehicle[]>([]);
  const [chauffeurs, setChauffeurs] = useState<Chauffeur[]>([]);
  const [customers, setCustomers] = useState<CustomerRecord[]>([]);
  const [communications, setCommunications] = useState<CommRecord[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Filters & Selected State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedBooking, setSelectedBooking] = useState<BookingRequest | null>(null);

  // Modal Sub-States
  const [isAddingCab, setIsAddingCab] = useState(false);
  const [newCabData, setNewCabData] = useState({
    regNumber: '',
    vehicleType: 'sedan-4-1',
    model: 'Toyota Etios',
    vehicleName: 'Sedan (4+1)',
    category: 'Sedan',
    seatingCapacity: 4,
    driverAssigned: 'Unassigned',
  });

  const [isAddingChauffeur, setIsAddingChauffeur] = useState(false);
  const [newChauffeurData, setNewChauffeurData] = useState({
    name: '',
    phone: '',
    licenseNumber: '',
    assignedCab: 'Unassigned',
  });

  // Deletion Confirmation & Feedback States
  const [chauffeurToDelete, setChauffeurToDelete] = useState<{ id: string; name: string } | null>(null);
  const [isDeletingChauffeur, setIsDeletingChauffeur] = useState(false);

  const [vehicleToDelete, setVehicleToDelete] = useState<{ id: string; regNumber: string; model: string } | null>(null);
  const [isDeletingVehicle, setIsDeletingVehicle] = useState(false);

  const [bookingToDelete, setBookingToDelete] = useState<{ referenceId: string; passengerName: string } | null>(null);
  const [isDeletingBooking, setIsDeletingBooking] = useState(false);

  const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  const showFeedback = (text: string, type: 'success' | 'error' | 'info' = 'info') => {
    setFeedbackMessage({ text, type });
    setTimeout(() => {
      setFeedbackMessage((current) => (current?.text === text ? null : current));
    }, 4500);
  };

  const [customMsgModal, setCustomMsgModal] = useState<{
    isOpen: boolean;
    recipient: string;
    phone: string;
    type: 'passenger' | 'driver';
    bookingRef?: string;
  }>({
    isOpen: false,
    recipient: '',
    phone: '',
    type: 'passenger',
  });
  const [customMsgText, setCustomMsgText] = useState('');

  // Fetch all live data from server API
  const refreshAllData = async () => {
    setIsLoading(true);
    try {
      // 1. Fetch Bookings
      const bRes = await fetch('/api/bookings');
      if (bRes.ok) {
        const bData = await bRes.json();
        if (Array.isArray(bData.bookings)) {
          // Normalize server format to BookingRequest format if needed
          const normalized = bData.bookings.map((b: any) => ({
            referenceId: b.reference_id || b.referenceId,
            searchDetails: {
              serviceType: b.service_type || b.searchDetails?.serviceType || 'One Way Trip',
              pickupLocation: b.pickup_location || b.searchDetails?.pickupLocation || 'Mysuru',
              dropLocation: b.drop_location || b.searchDetails?.dropLocation || '',
              travelDate: b.travel_date || b.searchDetails?.travelDate || '',
              pickupTime: b.pickup_time || b.searchDetails?.pickupTime || '09:00 AM',
              distanceKm: b.distance_km || b.searchDetails?.distanceKm || 150,
            },
            passengerDetails: {
              fullName: b.full_name || b.passengerDetails?.fullName || 'Passenger',
              mobileNumber: b.mobile_number || b.passengerDetails?.mobileNumber || '',
              email: b.email || b.passengerDetails?.email || '',
              specialRequests: b.special_requests || b.passengerDetails?.specialRequests || '',
            },
            selectedVehicle: {
              id: b.vehicle_type || b.selectedVehicle?.id || 'sedan-4-1',
              name: b.vehicle_name || b.selectedVehicle?.name || 'Sedan (4+1)',
              type: b.vehicle_type || b.selectedVehicle?.type || 'Sedan',
              capacity: b.selectedVehicle?.capacity || '4 Passengers',
              luggage: b.selectedVehicle?.luggage || '2 Bags',
              pricePerKm: 13,
              baseFare: 0,
              features: ['AC', 'Fastag', 'Clean Cab'],
            },
            estimatedFare: {
              baseFare: b.base_fare || b.estimatedFare?.baseFare || 2500,
              distanceKm: b.distance_km || 150,
              totalEstimatedFare: b.total_estimated_fare || b.estimatedFare?.totalEstimatedFare || 2500,
              breakdown: [],
            },
            status: b.status || 'Requested',
            driverDetails: b.driverDetails,
            created_at: b.created_at,
          }));
          setBookings(normalized);
        }
      }

      // 2. Fetch Fleet
      const fRes = await fetch('/api/fleet');
      if (fRes.ok) {
        const fData = await fRes.json();
        if (Array.isArray(fData.fleet)) setFleet(fData.fleet);
      }

      // 3. Fetch Chauffeurs
      const cRes = await fetch('/api/chauffeurs');
      if (cRes.ok) {
        const cData = await cRes.json();
        if (Array.isArray(cData.chauffeurs)) setChauffeurs(cData.chauffeurs);
      }

      // 4. Fetch Customers
      const custRes = await fetch('/api/customers');
      if (custRes.ok) {
        const custData = await custRes.json();
        if (Array.isArray(custData.customers)) setCustomers(custData.customers);
      }

      // 5. Fetch Communications
      const commRes = await fetch('/api/communications');
      if (commRes.ok) {
        const commData = await commRes.json();
        if (Array.isArray(commData.communications)) setCommunications(commData.communications);
      }

      // 6. Fetch Audit Logs
      const auditRes = await fetch('/api/audit-logs');
      if (auditRes.ok) {
        const aData = await auditRes.json();
        if (Array.isArray(aData.auditLogs)) setAuditLogs(aData.auditLogs);
      }
    } catch (e) {
      console.warn('Error loading owner portal data:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      refreshAllData();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Key KPI Calculations
  const totalBookingsCount = bookings.length;
  const pendingCount = bookings.filter((b) => b.status === 'Requested' || b.status === 'Under Review').length;
  const confirmedCount = bookings.filter((b) => b.status === 'Confirmed').length;
  const assignedCount = bookings.filter((b) => b.status === 'Driver Assigned').length;
  const completedCount = bookings.filter((b) => b.status === 'Completed').length;
  const totalGrossRevenue = bookings.reduce(
    (sum, b) => sum + (Number(b.estimatedFare?.totalEstimatedFare) || 0),
    0
  );

  // Status Badge Helper
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Confirmed':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'Driver Assigned':
        return 'bg-blue-100 text-blue-800 border-blue-300 font-bold';
      case 'Completed':
        return 'bg-slate-100 text-slate-700 border-slate-300';
      case 'Cancelled':
      case 'Rejected':
        return 'bg-rose-100 text-rose-800 border-rose-300';
      case 'Under Review':
        return 'bg-purple-100 text-purple-800 border-purple-300';
      default:
        return 'bg-amber-100 text-amber-900 border-amber-300';
    }
  };

  // Status Transition Handler
  const handleUpdateStatus = async (referenceId: string, newStatus: string, note?: string) => {
    try {
      const res = await fetch(`/api/bookings/${referenceId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, note, actor: 'Business Owner' }),
      });
      if (res.ok) {
        setBookings((prev) =>
          prev.map((b) => (b.referenceId === referenceId ? { ...b, status: newStatus as any } : b))
        );
        if (selectedBooking && selectedBooking.referenceId === referenceId) {
          setSelectedBooking((prev) => (prev ? { ...prev, status: newStatus as any } : null));
        }
        refreshAllData();
      }
    } catch (e) {
      console.warn('Error updating booking status:', e);
    }
  };

  // Driver & Cab Assignment Handler
  const handleAssignChauffeurAndCab = async (
    referenceId: string,
    chauffeurId: string,
    cabId: string
  ) => {
    const ch = chauffeurs.find((c) => c.id === chauffeurId);
    const cb = fleet.find((f) => f.id === cabId);
    if (!ch || !cb) {
      showFeedback('Please select both a valid Chauffeur and a Fleet Cab.', 'error');
      return;
    }

    try {
      const res = await fetch(`/api/bookings/${referenceId}/assign`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chauffeurId: ch.id,
          chauffeurName: ch.name,
          chauffeurPhone: ch.phone,
          chauffeurLicense: ch.licenseNumber,
          cabId: cb.id,
          regNumber: cb.regNumber,
          vehicleType: cb.vehicleName,
          actor: 'Business Owner',
        }),
      });
      if (res.ok) {
        showFeedback(`Chauffeur ${ch.name} & Cab ${cb.regNumber} successfully assigned to #${referenceId}!`, 'success');
        refreshAllData();
        if (selectedBooking) {
          setSelectedBooking((prev) =>
            prev
              ? {
                  ...prev,
                  status: 'Driver Assigned',
                  driverDetails: {
                    driverName: ch.name,
                    driverPhone: ch.phone,
                    driverLicense: ch.licenseNumber,
                    driverVehiclePlate: cb.regNumber,
                    driverVehicleModel: cb.vehicleName,
                  },
                }
              : null
          );
        }
      }
    } catch (e: any) {
      showFeedback(`Assignment failed: ${e.message}`, 'error');
    }
  };

  // Add Cab
  const handleCreateCab = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCabData.regNumber.trim()) return;

    try {
      const res = await fetch('/api/fleet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCabData),
      });
      if (res.ok) {
        setIsAddingCab(false);
        setNewCabData({
          regNumber: '',
          vehicleType: 'sedan-4-1',
          model: 'Toyota Etios',
          vehicleName: 'Sedan (4+1)',
          category: 'Sedan',
          seatingCapacity: 4,
          driverAssigned: 'Unassigned',
        });
        showFeedback(`Cab ${newCabData.regNumber} successfully added to fleet.`, 'success');
        refreshAllData();
      }
    } catch (e: any) {
      showFeedback(`Error adding cab: ${e.message}`, 'error');
    }
  };

  // Add Chauffeur
  const handleCreateChauffeur = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChauffeurData.name.trim() || !newChauffeurData.phone.trim()) return;

    try {
      const res = await fetch('/api/chauffeurs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newChauffeurData),
      });
      if (res.ok) {
        setIsAddingChauffeur(false);
        const addedName = newChauffeurData.name;
        setNewChauffeurData({
          name: '',
          phone: '',
          licenseNumber: '',
          assignedCab: 'Unassigned',
        });
        showFeedback(`Chauffeur ${addedName} registered successfully.`, 'success');
        refreshAllData();
      }
    } catch (e: any) {
      showFeedback(`Error adding chauffeur: ${e.message}`, 'error');
    }
  };

  // Remove / Delete Chauffeur execution
  const executeDeleteChauffeur = async (chauffeurId: string, chauffeurName: string) => {
    setIsDeletingChauffeur(true);
    try {
      const res = await fetch(`/api/chauffeurs/${chauffeurId}`, {
        method: 'DELETE',
        headers: {
          'x-admin-user': 'Fleet Manager',
        },
      });
      if (res.ok) {
        setChauffeurs((prev) => prev.filter((c) => c.id !== chauffeurId));
        setChauffeurToDelete(null);
        showFeedback(`Chauffeur "${chauffeurName}" removed from registry.`, 'success');
        refreshAllData();
      } else {
        const data = await res.json().catch(() => ({}));
        showFeedback(`Failed to remove chauffeur: ${data.error || 'Server error'}`, 'error');
      }
    } catch (e: any) {
      showFeedback(`Error removing chauffeur: ${e.message}`, 'error');
    } finally {
      setIsDeletingChauffeur(false);
    }
  };

  // Remove / Delete Fleet Vehicle execution
  const executeDeleteVehicle = async (vehicleId: string, regNumber: string) => {
    setIsDeletingVehicle(true);
    try {
      const res = await fetch(`/api/fleet/${vehicleId}`, {
        method: 'DELETE',
        headers: {
          'x-admin-user': 'Fleet Manager',
        },
      });
      if (res.ok) {
        setFleet((prev) => prev.filter((v) => v.id !== vehicleId));
        setVehicleToDelete(null);
        showFeedback(`Vehicle "${regNumber}" removed from fleet registry.`, 'success');
        refreshAllData();
      } else {
        const data = await res.json().catch(() => ({}));
        showFeedback(`Failed to remove vehicle: ${data.error || 'Server error'}`, 'error');
      }
    } catch (e: any) {
      showFeedback(`Error removing vehicle: ${e.message}`, 'error');
    } finally {
      setIsDeletingVehicle(false);
    }
  };

  // Delete / Remove Booking execution
  const executeDeleteBooking = async (referenceId: string) => {
    setIsDeletingBooking(true);
    try {
      const res = await fetch(`/api/bookings/${referenceId}`, {
        method: 'DELETE',
        headers: {
          'x-admin-user': 'Fleet Manager',
        },
      });
      if (res.ok) {
        setBookings((prev) => prev.filter((b) => b.referenceId !== referenceId));
        if (selectedBooking?.referenceId === referenceId) {
          setSelectedBooking(null);
        }
        setBookingToDelete(null);
        showFeedback(`Booking #${referenceId} deleted from records.`, 'success');
        refreshAllData();
      } else {
        const data = await res.json().catch(() => ({}));
        showFeedback(`Failed to delete booking: ${data.error || 'Server error'}`, 'error');
      }
    } catch (e: any) {
      showFeedback(`Error deleting booking: ${e.message}`, 'error');
    } finally {
      setIsDeletingBooking(false);
    }
  };

  // Direct WhatsApp Dispatch Messenger
  const triggerWhatsAppDispatch = (
    phone: string,
    message: string
  ) => {
    const clean = phone.replace(/\D/g, '').slice(-10);
    const url = `https://wa.me/91${clean}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  // Export Bookings to CSV
  const handleExportCSV = () => {
    if (bookings.length === 0) {
      showFeedback('No bookings to export.', 'info');
      return;
    }

    const headers = [
      'Booking ID',
      'Date',
      'Time',
      'Service Type',
      'Passenger Name',
      'Passenger Phone',
      'Pickup Location',
      'Drop Location',
      'Vehicle Type',
      'Fare (INR)',
      'Status',
      'Assigned Chauffeur',
      'Assigned Cab Plate',
    ];

    const rows = bookings.map((b) => [
      b.referenceId,
      b.searchDetails.travelDate,
      b.searchDetails.pickupTime,
      b.searchDetails.serviceType,
      `"${b.passengerDetails.fullName.replace(/"/g, '""')}"`,
      b.passengerDetails.mobileNumber,
      `"${b.searchDetails.pickupLocation.replace(/"/g, '""')}"`,
      `"${(b.searchDetails.dropLocation || '').replace(/"/g, '""')}"`,
      b.selectedVehicle.name,
      b.estimatedFare?.totalEstimatedFare || 0,
      b.status,
      b.driverDetails?.driverName || 'Unassigned',
      b.driverDetails?.driverVehiclePlate || 'Unassigned',
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `TRAVEL_JUST_Bookings_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filtered Bookings
  const filteredBookings = bookings.filter((b) => {
    const matchesSearch =
      b.referenceId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.passengerDetails.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.passengerDetails.mobileNumber.includes(searchQuery) ||
      b.searchDetails.pickupLocation.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (b.searchDetails.dropLocation &&
        b.searchDetails.dropLocation.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus =
      statusFilter === 'ALL' || b.status.toLowerCase() === statusFilter.toLowerCase();

    return matchesSearch && matchesStatus;
  });

  return (
    <div
      id="owner-portal-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200"
    >
      <div
        id="owner-portal-dialog"
        className="relative w-full max-w-7xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[96vh] my-auto"
      >
        {/* Top Header Bar */}
        <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 text-white px-5 py-4 shrink-0 border-b border-emerald-800/40">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-400 shadow-md">
                <Car className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-black text-base sm:text-lg tracking-tight text-white">
                    TRAVEL JUST <span className="text-amber-400">OWNER & FLEET PORTAL</span>
                  </h2>
                  <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                    Owner Mode Active
                  </span>
                </div>
                <p className="text-xs text-slate-300">
                  Full Dispatch Operations, Dynamic Pricing Engines, Chauffeurs & Fleet Registry
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={refreshAllData}
                disabled={isLoading}
                className="p-2 text-slate-300 hover:text-white hover:bg-white/10 rounded-xl transition-colors text-xs flex items-center gap-1.5 font-bold cursor-pointer"
                title="Refresh All Data"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Refresh</span>
              </button>

              <button
                type="button"
                onClick={onExitOwnerMode}
                className="px-3 py-1.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
                title="Exit Owner Mode"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Exit Owner</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
                title="Close Portal View"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-1 mt-4 overflow-x-auto pb-1 text-xs border-t border-white/10 pt-3 scrollbar-none">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`px-3 py-2 rounded-xl font-bold flex items-center gap-1.5 whitespace-nowrap transition-colors cursor-pointer ${
                activeTab === 'dashboard'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-white/10'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Dashboard & KPIs</span>
            </button>

            <button
              onClick={() => setActiveTab('bookings')}
              className={`px-3 py-2 rounded-xl font-bold flex items-center gap-1.5 whitespace-nowrap transition-colors cursor-pointer ${
                activeTab === 'bookings'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-white/10'
              }`}
            >
              <CalendarCheck2 className="w-4 h-4" />
              <span>Bookings & Dispatch ({bookings.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('fleet')}
              className={`px-3 py-2 rounded-xl font-bold flex items-center gap-1.5 whitespace-nowrap transition-colors cursor-pointer ${
                activeTab === 'fleet'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-white/10'
              }`}
            >
              <Car className="w-4 h-4" />
              <span>Fleet Registry ({fleet.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('chauffeurs')}
              className={`px-3 py-2 rounded-xl font-bold flex items-center gap-1.5 whitespace-nowrap transition-colors cursor-pointer ${
                activeTab === 'chauffeurs'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-white/10'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Chauffeurs ({chauffeurs.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('customers')}
              className={`px-3 py-2 rounded-xl font-bold flex items-center gap-1.5 whitespace-nowrap transition-colors cursor-pointer ${
                activeTab === 'customers'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-white/10'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Customer Profiles</span>
            </button>

            <button
              onClick={() => setActiveTab('communications')}
              className={`px-3 py-2 rounded-xl font-bold flex items-center gap-1.5 whitespace-nowrap transition-colors cursor-pointer ${
                activeTab === 'communications'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-white/10'
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              <span>Message Logs</span>
            </button>

            <button
              onClick={() => setActiveTab('audit')}
              className={`px-3 py-2 rounded-xl font-bold flex items-center gap-1.5 whitespace-nowrap transition-colors cursor-pointer ${
                activeTab === 'audit'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-white/10'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Audit Log</span>
            </button>
          </div>
        </div>

        {/* Tab Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50">
          {/* Feedback & Error Notification Banner */}
          {feedbackMessage && (
            <div
              className={`mb-4 p-3.5 rounded-2xl flex items-center justify-between text-xs font-bold transition-all shadow-xs ${
                feedbackMessage.type === 'success'
                  ? 'bg-emerald-50 text-emerald-900 border border-emerald-300'
                  : feedbackMessage.type === 'error'
                  ? 'bg-rose-50 text-rose-900 border border-rose-300'
                  : 'bg-sky-50 text-sky-900 border border-sky-300'
              }`}
            >
              <div className="flex items-center gap-2.5">
                {feedbackMessage.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />}
                {feedbackMessage.type === 'error' && <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />}
                {feedbackMessage.type === 'info' && <AlertCircle className="w-4 h-4 text-sky-600 shrink-0" />}
                <span>{feedbackMessage.text}</span>
              </div>
              <button
                type="button"
                onClick={() => setFeedbackMessage(null)}
                className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer rounded-lg hover:bg-black/5"
                title="Dismiss"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* TAB 1: DASHBOARD */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              {/* Metric Cards Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                  <div className="flex items-center justify-between text-slate-500 mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider">Total Bookings</span>
                    <CalendarCheck2 className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div className="text-2xl font-black text-slate-900">{totalBookingsCount}</div>
                  <div className="text-[11px] text-emerald-700 font-semibold mt-1">Live active trips buffer</div>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-amber-200 shadow-xs bg-amber-50/30">
                  <div className="flex items-center justify-between text-amber-800 mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider">Pending Action</span>
                    <Clock className="w-4 h-4 text-amber-600" />
                  </div>
                  <div className="text-2xl font-black text-amber-950">{pendingCount}</div>
                  <div className="text-[11px] text-amber-700 font-semibold mt-1">Needs confirmation or cab</div>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-blue-200 shadow-xs bg-blue-50/30">
                  <div className="flex items-center justify-between text-blue-800 mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider">Chauffeur Assigned</span>
                    <Car className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="text-2xl font-black text-blue-950">{assignedCount}</div>
                  <div className="text-[11px] text-blue-700 font-semibold mt-1">Driver & plate dispatched</div>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-emerald-200 shadow-xs bg-emerald-50/30">
                  <div className="flex items-center justify-between text-emerald-800 mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider">Gross Booking Value</span>
                    <DollarSign className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div className="text-2xl font-black text-emerald-950">
                    ₹{totalGrossRevenue.toLocaleString('en-IN')}
                  </div>
                  <div className="text-[11px] text-emerald-700 font-semibold mt-1">Authoritative fare sum</div>
                </div>
              </div>

              {/* Quick Actions & Urgent Bookings */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-extrabold text-sm text-slate-900">Recent Booking Dispatches</h3>
                      <p className="text-xs text-slate-500">Quickly review and assign drivers to upcoming trips</p>
                    </div>
                    <button
                      onClick={() => setActiveTab('bookings')}
                      className="text-xs font-bold text-emerald-800 hover:text-emerald-950 flex items-center gap-1 cursor-pointer"
                    >
                      <span>View All ({bookings.length})</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="divide-y divide-slate-100">
                    {bookings.slice(0, 4).map((b) => (
                      <div key={b.referenceId} className="py-3 flex items-center justify-between gap-3 text-xs">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-slate-900 bg-slate-100 px-1.5 py-0.5 rounded">
                              #{b.referenceId}
                            </span>
                            <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${getStatusBadge(b.status)}`}>
                              {b.status}
                            </span>
                            <span className="text-slate-500 font-medium">{b.selectedVehicle.name}</span>
                          </div>
                          <p className="text-slate-700 font-medium">
                            {b.searchDetails.pickupLocation} ➔ {b.searchDetails.dropLocation || 'Local Package'}
                          </p>
                          <p className="text-[11px] text-slate-400">
                            {b.passengerDetails.fullName} ({b.passengerDetails.mobileNumber}) • {b.searchDetails.travelDate}
                          </p>
                        </div>

                        <div className="text-right shrink-0">
                          <div className="font-extrabold text-slate-900 text-sm">
                            ₹{Number(b.estimatedFare?.totalEstimatedFare || 0).toLocaleString('en-IN')}
                          </div>
                          <button
                            onClick={() => {
                              setSelectedBooking(b);
                              setActiveTab('bookings');
                            }}
                            className="mt-1 px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold rounded-lg transition-colors cursor-pointer"
                          >
                            Manage
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Fleet & Chauffeur Quick Overview */}
                <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
                  <h3 className="font-extrabold text-sm text-slate-900">Fleet Operations Health</h3>

                  <div className="space-y-3 text-xs">
                    <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                      <div className="flex items-center gap-2.5">
                        <Car className="w-4 h-4 text-emerald-600" />
                        <div>
                          <div className="font-bold text-slate-800">Commercial Cabs</div>
                          <div className="text-[11px] text-slate-500">Strictly 5 Allowed Vehicles</div>
                        </div>
                      </div>
                      <span className="font-black text-slate-900 text-sm">{fleet.length} Cabs</span>
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                      <div className="flex items-center gap-2.5">
                        <Users className="w-4 h-4 text-blue-600" />
                        <div>
                          <div className="font-bold text-slate-800">Verified Chauffeurs</div>
                          <div className="text-[11px] text-slate-500">Police verified & licensed</div>
                        </div>
                      </div>
                      <span className="font-black text-slate-900 text-sm">{chauffeurs.length} Drivers</span>
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                      <div className="flex items-center gap-2.5">
                        <Zap className="w-4 h-4 text-amber-500 fill-amber-500" />
                        <div>
                          <div className="font-bold text-slate-800">Authoritative Pricing Engines</div>
                          <div className="text-[11px] text-slate-500">Engine A + Engine B Active</div>
                        </div>
                      </div>
                      <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded text-[11px]">
                        Operational
                      </span>
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      onClick={() => setActiveTab('bookings')}
                      className="w-full py-2.5 bg-gradient-to-r from-emerald-800 to-teal-800 hover:from-emerald-900 hover:to-teal-900 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer"
                    >
                      <CalendarCheck2 className="w-3.5 h-3.5" />
                      <span>Manage Live Bookings & Dispatch</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: BOOKINGS MANAGEMENT */}
          {activeTab === 'bookings' && (
            <div className="space-y-4">
              {/* Controls Header */}
              <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200">
                <div className="flex items-center gap-2 flex-1 min-w-[240px]">
                  <Search className="w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by ID, passenger, phone, route..."
                    className="w-full text-xs font-medium focus:outline-none"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 focus:outline-none"
                  >
                    <option value="ALL">All Statuses</option>
                    <option value="Requested">Requested</option>
                    <option value="Confirmed">Confirmed</option>
                    <option value="Driver Assigned">Driver Assigned</option>
                    <option value="Completed">Completed</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>

                  <button
                    onClick={handleExportCSV}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
                    title="Export Bookings to CSV"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Export CSV</span>
                  </button>
                </div>
              </div>

              {/* Bookings Table / List */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-3">
                  {filteredBookings.length === 0 ? (
                    <div className="py-12 text-center bg-white rounded-2xl border border-slate-200 p-8 space-y-2">
                      <CalendarCheck2 className="w-8 h-8 text-slate-300 mx-auto" />
                      <p className="font-bold text-sm text-slate-700">No matching bookings found</p>
                      <p className="text-xs text-slate-400">Try adjusting your search query or status filter.</p>
                    </div>
                  ) : (
                    filteredBookings.map((b) => (
                      <div
                        key={b.referenceId}
                        onClick={() => setSelectedBooking(b)}
                        className={`bg-white border rounded-2xl p-4 shadow-xs hover:border-emerald-500 transition-all cursor-pointer space-y-3 ${
                          selectedBooking?.referenceId === b.referenceId
                            ? 'border-emerald-600 ring-2 ring-emerald-500/20'
                            : 'border-slate-200'
                        }`}
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-xs text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
                              #{b.referenceId}
                            </span>
                            <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border ${getStatusBadge(b.status)}`}>
                              {b.status}
                            </span>
                            <span className="text-xs font-semibold text-slate-600">
                              {b.selectedVehicle.name}
                            </span>
                          </div>

                          <div className="flex items-center gap-2.5">
                            <div className="font-black text-sm text-slate-900">
                              ₹{Number(b.estimatedFare?.totalEstimatedFare || 0).toLocaleString('en-IN')}
                            </div>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setBookingToDelete({ referenceId: b.referenceId, passengerName: b.passengerDetails.fullName });
                              }}
                              className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                              title={`Delete booking #${b.referenceId}`}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                          <div>
                            <span className="text-slate-400 block text-[10px] uppercase font-bold">Route</span>
                            <span className="font-bold text-slate-900">
                              {b.searchDetails.pickupLocation} ➔ {b.searchDetails.dropLocation || 'Local Package'}
                            </span>
                            <span className="text-[11px] text-slate-500 block">
                              {b.searchDetails.travelDate} at {b.searchDetails.pickupTime}
                            </span>
                          </div>

                          <div>
                            <span className="text-slate-400 block text-[10px] uppercase font-bold">Passenger</span>
                            <span className="font-bold text-slate-900">
                              {b.passengerDetails.fullName}
                            </span>
                            <span className="text-[11px] text-slate-500 block">
                              +91 {b.passengerDetails.mobileNumber}
                            </span>
                          </div>
                        </div>

                        {/* Assigned Driver details badge if present */}
                        {b.driverDetails?.driverName && (
                          <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl px-3 py-1.5 flex items-center justify-between text-xs text-emerald-950 font-medium">
                            <div className="flex items-center gap-2">
                              <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
                              <span>
                                Assigned: <strong>{b.driverDetails.driverName}</strong> ({b.driverDetails.driverVehiclePlate || 'Cab'})
                              </span>
                            </div>
                            <span className="text-[11px] text-emerald-700 font-bold">
                              {b.driverDetails.driverPhone}
                            </span>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>

                {/* Selected Booking Detail & Action Panel */}
                <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
                  {selectedBooking ? (
                    <>
                      <div className="border-b border-slate-100 pb-3">
                        <div className="flex items-center justify-between">
                          <span className="font-mono font-black text-sm text-slate-900">
                            #{selectedBooking.referenceId}
                          </span>
                          <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border ${getStatusBadge(selectedBooking.status)}`}>
                            {selectedBooking.status}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                          Service: <strong>{selectedBooking.searchDetails.serviceType}</strong>
                        </p>
                      </div>

                      {/* Route Details */}
                      <div className="space-y-2 text-xs">
                        <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">Itinerary</h4>
                        <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                          <div><strong>Pickup:</strong> {selectedBooking.searchDetails.pickupLocation}</div>
                          {selectedBooking.searchDetails.dropLocation && (
                            <div><strong>Drop:</strong> {selectedBooking.searchDetails.dropLocation}</div>
                          )}
                          <div><strong>Date:</strong> {selectedBooking.searchDetails.travelDate}</div>
                          <div><strong>Time:</strong> {selectedBooking.searchDetails.pickupTime}</div>
                          <div><strong>Estimated Distance:</strong> ~{selectedBooking.searchDetails.distanceKm || 150} km</div>
                        </div>
                      </div>

                      {/* Passenger Details */}
                      <div className="space-y-2 text-xs">
                        <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">Passenger</h4>
                        <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                          <div><strong>Name:</strong> {selectedBooking.passengerDetails.fullName}</div>
                          <div><strong>Phone:</strong> +91 {selectedBooking.passengerDetails.mobileNumber}</div>
                          {selectedBooking.passengerDetails.email && (
                            <div><strong>Email:</strong> {selectedBooking.passengerDetails.email}</div>
                          )}
                          {selectedBooking.passengerDetails.specialRequests && (
                            <div><strong>Note:</strong> {selectedBooking.passengerDetails.specialRequests}</div>
                          )}
                        </div>
                      </div>

                      {/* Fare Breakdown */}
                      <div className="space-y-2 text-xs">
                        <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">Total Fare</h4>
                        <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between text-emerald-950 font-extrabold text-sm">
                          <span>Authoritative Quote:</span>
                          <span>₹{Number(selectedBooking.estimatedFare?.totalEstimatedFare || 0).toLocaleString('en-IN')}</span>
                        </div>
                      </div>

                      {/* Status Transition Actions */}
                      <div className="space-y-2 pt-2 border-t border-slate-100">
                        <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">Update Status</h4>
                        <div className="grid grid-cols-2 gap-2 text-xs font-bold">
                          <button
                            onClick={() => handleUpdateStatus(selectedBooking.referenceId, 'Confirmed')}
                            className="p-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-xl border border-emerald-200 transition-colors cursor-pointer"
                          >
                            Mark Confirmed
                          </button>
                          <button
                            onClick={() => handleUpdateStatus(selectedBooking.referenceId, 'Completed')}
                            className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl border border-slate-200 transition-colors cursor-pointer"
                          >
                            Mark Completed
                          </button>
                          <button
                            onClick={() => handleUpdateStatus(selectedBooking.referenceId, 'Cancelled')}
                            className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-800 rounded-xl border border-rose-200 transition-colors cursor-pointer"
                          >
                            Cancel Booking
                          </button>
                          <button
                            onClick={() => handleUpdateStatus(selectedBooking.referenceId, 'Under Review')}
                            className="p-2 bg-purple-50 hover:bg-purple-100 text-purple-800 rounded-xl border border-purple-200 transition-colors cursor-pointer"
                          >
                            Under Review
                          </button>
                        </div>
                      </div>

                      {/* Assign Chauffeur & Cab Dropdown */}
                      <div className="space-y-2 pt-2 border-t border-slate-100 text-xs">
                        <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">Assign Chauffeur & Cab</h4>
                        
                        <div className="space-y-2">
                          <div>
                            <label className="text-[10px] text-slate-500 font-bold block mb-1">Select Chauffeur</label>
                            <select
                              id="assign-chauffeur-select"
                              className="w-full text-xs font-semibold p-2 bg-slate-50 border border-slate-200 rounded-xl"
                            >
                              {chauffeurs.map((c) => (
                                <option key={c.id} value={c.id}>
                                  {c.name} ({c.phone}) - {c.status}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="text-[10px] text-slate-500 font-bold block mb-1">Select Fleet Cab</label>
                            <select
                              id="assign-cab-select"
                              className="w-full text-xs font-semibold p-2 bg-slate-50 border border-slate-200 rounded-xl"
                            >
                              {fleet.map((f) => (
                                <option key={f.id} value={f.id}>
                                  {f.regNumber} • {f.vehicleName} ({f.status})
                                </option>
                              ))}
                            </select>
                          </div>

                          <button
                            onClick={() => {
                              const cEl = document.getElementById('assign-chauffeur-select') as HTMLSelectElement;
                              const fEl = document.getElementById('assign-cab-select') as HTMLSelectElement;
                              if (cEl && fEl) {
                                handleAssignChauffeurAndCab(selectedBooking.referenceId, cEl.value, fEl.value);
                              }
                            }}
                            className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                          >
                            <ShieldCheck className="w-3.5 h-3.5" />
                            <span>Confirm Driver & Cab Assignment</span>
                          </button>
                        </div>
                      </div>

                      {/* Direct WhatsApp Customer Notification */}
                      <div className="pt-2 border-t border-slate-100 space-y-2">
                        <button
                          onClick={() => {
                            const msg = `Hello ${selectedBooking.passengerDetails.fullName}, your booking #${selectedBooking.referenceId} with TRAVEL JUST is confirmed!\n\nRoute: ${selectedBooking.searchDetails.pickupLocation} to ${selectedBooking.searchDetails.dropLocation || 'Local Package'}\nDate: ${selectedBooking.searchDetails.travelDate} at ${selectedBooking.searchDetails.pickupTime}\nVehicle: ${selectedBooking.selectedVehicle.name}\nTotal Fare: ₹${selectedBooking.estimatedFare?.totalEstimatedFare}\n\nOur team is preparing your cab. For any questions, call us at +91 97407 54400.`;
                            triggerWhatsAppDispatch(selectedBooking.passengerDetails.mobileNumber, msg);
                          }}
                          className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span>Send WhatsApp to Passenger</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setBookingToDelete({ referenceId: selectedBooking.referenceId, passengerName: selectedBooking.passengerDetails.fullName })}
                          className="w-full py-2 bg-rose-50 hover:bg-rose-100 active:bg-rose-200 text-rose-700 hover:text-rose-800 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer border border-rose-200 shadow-xs hover:shadow-sm"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                          <span>Delete Booking Record</span>
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="py-16 text-center text-slate-400 space-y-2">
                      <CalendarCheck2 className="w-8 h-8 mx-auto text-slate-300" />
                      <p className="text-xs font-semibold">Select a booking from the list to view full details and assign drivers.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: FLEET REGISTRY */}
          {activeTab === 'fleet' && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200">
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900">Commercial Fleet Registry</h3>
                  <p className="text-xs text-slate-500">
                    Strictly authorized 5 fleet categories: Sedan (4+1), SUV (6+1), INNOVA, INNOVA CRYSTA, TEMPO TRAVELLER (12+1)
                  </p>
                </div>

                <button
                  onClick={() => setIsAddingCab(true)}
                  className="px-3.5 py-2 bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add New Cab</span>
                </button>
              </div>

              {/* Add Cab Form Modal */}
              {isAddingCab && (
                <div className="bg-white p-5 rounded-2xl border-2 border-emerald-500 shadow-md space-y-4 animate-in fade-in">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <h4 className="font-extrabold text-sm text-slate-900">Add Vehicle to Commercial Fleet</h4>
                    <button onClick={() => setIsAddingCab(false)} className="text-slate-400 hover:text-slate-600">
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <form onSubmit={handleCreateCab} className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Registration Plate *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. KA-09-EA-4455"
                        value={newCabData.regNumber}
                        onChange={(e) => setNewCabData({ ...newCabData, regNumber: e.target.value })}
                        className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl uppercase font-mono font-bold"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Authorized Vehicle Category *</label>
                      <select
                        value={newCabData.vehicleType}
                        onChange={(e) => {
                          const val = e.target.value;
                          let vName = 'Sedan (4+1)';
                          let cap = 4;
                          if (val === 'suv-6-1') { vName = 'SUV (6+1)'; cap = 6; }
                          if (val === 'innova') { vName = 'INNOVA'; cap = 7; }
                          if (val === 'innova-crysta') { vName = 'INNOVA CRYSTA'; cap = 7; }
                          if (val === 'tempo-traveller-12-1') { vName = 'TEMPO TRAVELLER (12+1)'; cap = 12; }
                          setNewCabData({ ...newCabData, vehicleType: val, vehicleName: vName, seatingCapacity: cap });
                        }}
                        className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                      >
                        <option value="sedan-4-1">Sedan (4+1)</option>
                        <option value="suv-6-1">SUV (6+1)</option>
                        <option value="innova">INNOVA</option>
                        <option value="innova-crysta">INNOVA CRYSTA</option>
                        <option value="tempo-traveller-12-1">TEMPO TRAVELLER (12+1)</option>
                      </select>
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Commercial Model Name</label>
                      <input
                        type="text"
                        placeholder="e.g. Toyota Etios Platinum"
                        value={newCabData.model}
                        onChange={(e) => setNewCabData({ ...newCabData, model: e.target.value })}
                        className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                      />
                    </div>

                    <div className="sm:col-span-3 flex justify-end gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => setIsAddingCab(false)}
                        className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl font-bold shadow-xs"
                      >
                        Save Cab to Registry
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Fleet Table */}
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                      <tr>
                        <th className="px-4 py-3">Registration Plate</th>
                        <th className="px-4 py-3">Category</th>
                        <th className="px-4 py-3">Model</th>
                        <th className="px-4 py-3">Seating</th>
                        <th className="px-4 py-3">Assigned Driver</th>
                        <th className="px-4 py-3">Permit & Insurance</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {fleet.map((v) => (
                        <tr key={v.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="px-4 py-3 font-mono font-bold text-slate-900">{v.regNumber}</td>
                          <td className="px-4 py-3 font-bold text-emerald-800">{v.vehicleName}</td>
                          <td className="px-4 py-3 text-slate-700">{v.model}</td>
                          <td className="px-4 py-3 text-slate-600 font-medium">{v.seatingCapacity} Seats</td>
                          <td className="px-4 py-3 text-slate-800 font-semibold">{v.driverAssigned || 'Unassigned'}</td>
                          <td className="px-4 py-3 text-slate-500 text-[11px]">
                            Permit: {v.permitExpiry} • Ins: {v.insuranceExpiry}
                          </td>
                          <td className="px-4 py-3">
                            <span className="bg-emerald-100 text-emerald-800 border border-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded-full">
                              {v.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <button
                              type="button"
                              onClick={() => setVehicleToDelete({ id: v.id, regNumber: v.regNumber, model: v.vehicleName })}
                              className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 active:bg-rose-200 text-rose-700 hover:text-rose-800 font-bold text-xs rounded-xl transition-all inline-flex items-center gap-1 cursor-pointer border border-rose-200 shadow-xs hover:shadow-sm"
                              title={`Remove vehicle ${v.regNumber}`}
                            >
                              <Trash2 className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                              <span className="text-[11px] font-bold">Remove</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: CHAUFFEURS */}
          {activeTab === 'chauffeurs' && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200">
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900">Professional Chauffeur Directory</h3>
                  <p className="text-xs text-slate-500">Uniformed, verified drivers with regional outstation expertise</p>
                </div>

                <button
                  onClick={() => setIsAddingChauffeur(true)}
                  className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shadow-sm hover:shadow-md ring-1 ring-emerald-500/30"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>Add Chauffeur</span>
                </button>
              </div>

              {/* Add Chauffeur Modal */}
              {isAddingChauffeur && (
                <div className="bg-white p-5 rounded-2xl border-2 border-emerald-500 shadow-md space-y-4 animate-in fade-in">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <h4 className="font-extrabold text-sm text-slate-900">Register New Professional Chauffeur</h4>
                    <button onClick={() => setIsAddingChauffeur(false)} className="text-slate-400 hover:text-slate-600">
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <form onSubmit={handleCreateChauffeur} className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Full Name *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Ramesh Kumar"
                        value={newChauffeurData.name}
                        onChange={(e) => setNewChauffeurData({ ...newChauffeurData, name: e.target.value })}
                        className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Mobile Number (+91) *</label>
                      <input
                        type="tel"
                        required
                        placeholder="e.g. 98451 22341"
                        value={newChauffeurData.phone}
                        onChange={(e) => setNewChauffeurData({ ...newChauffeurData, phone: e.target.value })}
                        className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Commercial DL Number</label>
                      <input
                        type="text"
                        placeholder="e.g. KA09-2015-0018"
                        value={newChauffeurData.licenseNumber}
                        onChange={(e) => setNewChauffeurData({ ...newChauffeurData, licenseNumber: e.target.value })}
                        className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                      />
                    </div>

                    <div className="sm:col-span-3 flex justify-end gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => setIsAddingChauffeur(false)}
                        className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl font-bold shadow-xs"
                      >
                        Save Chauffeur
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Chauffeurs List */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {chauffeurs.map((c) => (
                  <div key={c.id} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-800 font-extrabold flex items-center justify-center text-xs">
                          {c.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <h4 className="font-bold text-sm text-slate-900">{c.name}</h4>
                          <span className="text-[11px] text-slate-500">{c.licenseNumber}</span>
                        </div>
                      </div>

                      <span className="bg-emerald-100 text-emerald-800 border border-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded-full">
                        {c.status}
                      </span>
                    </div>

                    <div className="text-xs space-y-1 bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-slate-600">
                      <div><strong>Phone:</strong> {c.phone}</div>
                      <div><strong>Assigned Cab:</strong> {c.assignedCab}</div>
                      <div><strong>Trips Completed:</strong> {c.totalTrips} • <strong>Rating:</strong> {c.rating} ★</div>
                      {c.languages && <div><strong>Languages:</strong> {c.languages.join(', ')}</div>}
                    </div>

                    <div className="flex items-center justify-between gap-2 pt-1">
                      <a
                        href={`tel:${c.phone}`}
                        className="flex-1 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl text-center transition-colors flex items-center justify-center gap-1"
                      >
                        <Phone className="w-3 h-3 text-slate-600" />
                        <span>Call</span>
                      </a>

                      <button
                        type="button"
                        onClick={() => triggerWhatsAppDispatch(c.phone, `Hello ${c.name}, dispatch alert from TRAVEL JUST Fleet Manager.`)}
                        className="flex-1 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <MessageSquare className="w-3 h-3 text-emerald-700" />
                        <span>WhatsApp</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setChauffeurToDelete({ id: c.id, name: c.name })}
                        className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 active:bg-rose-200 text-rose-700 hover:text-rose-800 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer border border-rose-200 shadow-xs hover:shadow-sm"
                        title={`Remove chauffeur ${c.name}`}
                      >
                        <Trash2 className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                        <span className="text-[11px] font-bold">Remove</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 5: CUSTOMER PROFILES */}
          {activeTab === 'customers' && (
            <div className="space-y-4">
              <div className="bg-white p-4 rounded-2xl border border-slate-200">
                <h3 className="font-extrabold text-sm text-slate-900">Registered Customer Directory</h3>
                <p className="text-xs text-slate-500">Verified passengers with booking histories and contact channels</p>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                      <tr>
                        <th className="px-4 py-3">Customer Name</th>
                        <th className="px-4 py-3">Mobile Number</th>
                        <th className="px-4 py-3">Email</th>
                        <th className="px-4 py-3">Total Rides</th>
                        <th className="px-4 py-3">Default Pickup</th>
                        <th className="px-4 py-3">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {customers.map((c) => (
                        <tr key={c.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="px-4 py-3 font-bold text-slate-900">{c.fullName}</td>
                          <td className="px-4 py-3 font-mono font-semibold text-slate-700">+91 {c.mobileNumber}</td>
                          <td className="px-4 py-3 text-slate-500">{c.email || '—'}</td>
                          <td className="px-4 py-3 font-extrabold text-emerald-800">{c.totalTripsCount} trips</td>
                          <td className="px-4 py-3 text-slate-600">{c.defaultPickupLocation || 'Mysuru'}</td>
                          <td className="px-4 py-3">
                            <button
                              onClick={() => triggerWhatsAppDispatch(c.mobileNumber, `Hello ${c.fullName}, greetings from TRAVEL JUST Mysuru.`)}
                              className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-[11px] rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                            >
                              <MessageSquare className="w-3 h-3" />
                              <span>WhatsApp</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 7: MESSAGE LOGS */}
          {activeTab === 'communications' && (
            <div className="space-y-4">
              <div className="bg-white p-4 rounded-2xl border border-slate-200">
                <h3 className="font-extrabold text-sm text-slate-900">Communication Alerts Log</h3>
                <p className="text-xs text-slate-500">Real-time log of customer logins, OTPs, and dispatch alerts</p>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs divide-y divide-slate-100">
                {communications.map((comm) => (
                  <div key={comm.id} className="p-4 text-xs space-y-1 hover:bg-slate-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">{comm.subject}</span>
                        <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded">
                          {comm.type}
                        </span>
                      </div>
                      <span className="text-slate-400 text-[11px]">
                        {new Date(comm.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="text-slate-600">{comm.content}</p>
                    <div className="text-[11px] text-slate-400">Recipient: <strong>{comm.recipient}</strong></div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 8: AUDIT LOG */}
          {activeTab === 'audit' && (
            <div className="space-y-4">
              <div className="bg-white p-4 rounded-2xl border border-slate-200">
                <h3 className="font-extrabold text-sm text-slate-900">Operations & Audit Trail</h3>
                <p className="text-xs text-slate-500">Immutable chronological history of fare changes and status dispatches</p>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs divide-y divide-slate-100">
                {auditLogs.map((log) => (
                  <div key={log.id} className="p-4 text-xs space-y-1 hover:bg-slate-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-slate-900">{log.action}</span>
                        <span className="text-slate-500 text-[11px]">by {log.actor}</span>
                      </div>
                      <span className="text-slate-400 text-[11px]">
                        {new Date(log.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-slate-700 font-medium">{log.details}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Chauffeur Delete Confirmation Modal */}
        {chauffeurToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 animate-in fade-in">
            <div className="bg-white rounded-2xl max-w-sm w-full p-5 border border-slate-200 shadow-xl space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-extrabold text-sm text-slate-900">Remove Chauffeur?</h4>
                  <p className="text-xs text-slate-500">Remove from active fleet registry</p>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-700 leading-relaxed">
                Are you sure you want to remove <strong>{chauffeurToDelete.name}</strong> from the chauffeur roster? Any cab currently assigned to them will be set to Unassigned.
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  disabled={isDeletingChauffeur}
                  onClick={() => setChauffeurToDelete(null)}
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isDeletingChauffeur}
                  onClick={() => executeDeleteChauffeur(chauffeurToDelete.id, chauffeurToDelete.name)}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white rounded-xl font-bold text-xs transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-60"
                >
                  {isDeletingChauffeur ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="w-3.5 h-3.5" />
                  )}
                  <span>{isDeletingChauffeur ? 'Removing...' : 'Confirm Remove'}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Fleet Vehicle Delete Confirmation Modal */}
        {vehicleToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 animate-in fade-in">
            <div className="bg-white rounded-2xl max-w-sm w-full p-5 border border-slate-200 shadow-xl space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-extrabold text-sm text-slate-900">Remove Vehicle?</h4>
                  <p className="text-xs text-slate-500">Commercial fleet deregistration</p>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-700 leading-relaxed">
                Are you sure you want to remove vehicle <strong>{vehicleToDelete.regNumber}</strong> ({vehicleToDelete.model}) from the commercial fleet? Any chauffeur assigned to this cab will be unlinked.
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  disabled={isDeletingVehicle}
                  onClick={() => setVehicleToDelete(null)}
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isDeletingVehicle}
                  onClick={() => executeDeleteVehicle(vehicleToDelete.id, vehicleToDelete.regNumber)}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white rounded-xl font-bold text-xs transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-60"
                >
                  {isDeletingVehicle ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="w-3.5 h-3.5" />
                  )}
                  <span>{isDeletingVehicle ? 'Removing...' : 'Confirm Remove'}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Booking Delete Confirmation Modal */}
        {bookingToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 animate-in fade-in">
            <div className="bg-white rounded-2xl max-w-sm w-full p-5 border border-slate-200 shadow-xl space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-extrabold text-sm text-slate-900">Delete Booking?</h4>
                  <p className="text-xs text-slate-500">Permanent registry deletion</p>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-700 leading-relaxed">
                Are you sure you want to permanently delete booking <strong>#{bookingToDelete.referenceId}</strong> ({bookingToDelete.passengerName})? This action cannot be undone.
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  disabled={isDeletingBooking}
                  onClick={() => setBookingToDelete(null)}
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isDeletingBooking}
                  onClick={() => executeDeleteBooking(bookingToDelete.referenceId)}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white rounded-xl font-bold text-xs transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-60"
                >
                  {isDeletingBooking ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="w-3.5 h-3.5" />
                  )}
                  <span>{isDeletingBooking ? 'Deleting...' : 'Confirm Delete'}</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
