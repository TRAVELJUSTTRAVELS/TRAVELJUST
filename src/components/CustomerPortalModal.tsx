import React, { useState, useEffect } from 'react';
import {
  User,
  Phone,
  Mail,
  X,
  Car,
  Calendar,
  Clock,
  MapPin,
  FileText,
  MessageSquare,
  CheckCircle2,
  RefreshCw,
  LogOut,
  ChevronRight,
  ShieldCheck,
  Download,
  AlertCircle,
  Sparkles,
  ArrowRight,
  Navigation,
  Loader2,
  Bookmark,
  Star,
  Trash2,
  Plus,
  Home,
  Briefcase,
  Plane,
} from 'lucide-react';
import { CustomerUser, BookingRequest, BookingSearchState } from '../types';
import { getCustomerBookings, saveCustomerSession } from '../services/customerAuthService';
import { fetchUserBookingsFromFirestore } from '../lib/firebase';
import { siteConfig } from '../config/siteConfig';
import { vehiclesData } from '../data/vehicles';
import { RidePushSubscriptionCard } from './RidePushSubscriptionCard';
import { ProgressBar } from './DynamicLoadingIndicator';
import { createGoogleCalendarTripEvent } from '../services/googleCalendarService';
import {
  getSavedDestinations,
  saveDestination,
  deleteSavedDestination,
  clearAllSavedDestinations,
  SavedDestination,
  DestinationTag,
} from '../services/savedDestinationsService';

interface CustomerPortalModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: CustomerUser | null;
  onLogout: () => void;
  onUpdateCustomer: (updated: CustomerUser) => void;
  onRebookTrip: (search: Partial<BookingSearchState>, vehicleId?: string) => void;
  onBookNewRide: () => void;
  onOpenTrackBooking?: (referenceId: string) => void;
  onSelectSavedDestinationForBooking?: (address: string, isDrop?: boolean) => void;
  initialTab?: 'trips' | 'saved' | 'profile';
}

export const CustomerPortalModal: React.FC<CustomerPortalModalProps> = ({
  isOpen,
  onClose,
  customer,
  onLogout,
  onUpdateCustomer,
  onRebookTrip,
  onBookNewRide,
  onOpenTrackBooking,
  onSelectSavedDestinationForBooking,
  initialTab = 'trips',
}) => {
  const [activeTab, setActiveTab] = useState<'trips' | 'saved' | 'profile'>(initialTab);
  const [bookings, setBookings] = useState<BookingRequest[]>([]);
  const [isLoadingBookings, setIsLoadingBookings] = useState(false);

  // Saved Destinations State
  const [savedList, setSavedList] = useState<SavedDestination[]>([]);
  const [newDestLabel, setNewDestLabel] = useState('');
  const [newDestAddress, setNewDestAddress] = useState('');
  const [newDestTag, setNewDestTag] = useState<DestinationTag>('favorite');
  const [isAddingSaved, setIsAddingSaved] = useState(false);
  const [savedSuccessMsg, setSavedSuccessMsg] = useState<string | null>(null);

  // Profile Edit State
  const [editName, setEditName] = useState(customer?.fullName || '');
  const [editEmail, setEditEmail] = useState(customer?.email || '');
  const [editDefaultLocation, setEditDefaultLocation] = useState(customer?.defaultPickupLocation || '');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  const loadTrips = async () => {
    if (!customer?.mobileNumber && !customer?.id) return;
    setIsLoadingBookings(true);
    try {
      const localBookings = customer.mobileNumber ? await getCustomerBookings(customer.mobileNumber) : [];
      let firestoreRecords: any[] = [];
      if (customer.id) {
        firestoreRecords = await fetchUserBookingsFromFirestore(customer.id);
      }
      
      // Combine and deduplicate by referenceId
      const seenIds = new Set(localBookings.map((b) => b.referenceId));
      const merged = [...localBookings];

      for (const rec of firestoreRecords) {
        if (!seenIds.has(rec.id)) {
          seenIds.add(rec.id);
          const matchedVehicle = vehiclesData.find((v) => v.id === rec.vehicleType) || vehiclesData[0];
          merged.push({
            referenceId: rec.id,
            searchDetails: {
              serviceType: (rec.tripType as any) || 'oneway',
              pickupLocation: rec.pickupLocation,
              dropLocation: rec.dropLocation,
              pickupDate: rec.pickupDate,
              pickupTime: rec.pickupTime,
              travelDate: rec.pickupDate,
              durationHours: 8,
              airportTransferType: 'pickup',
              passengers: 1,
              vehicleType: matchedVehicle.id,
            },
            selectedVehicle: matchedVehicle,
            passengerDetails: {
              fullName: rec.customerName || customer.fullName,
              mobileNumber: rec.customerPhone || customer.mobileNumber,
              email: rec.customerEmail || customer.email || '',
            },
            estimatedFare: {
              estimatedDistanceKm: rec.distanceKm || 50,
              exactDistanceKm: rec.distanceKm,
              estimatedDurationHours: 1,
              baseFareAmount: rec.estimatedFare || 2500,
              distanceFareAmount: rec.estimatedFare || 2500,
              durationFareAmount: 0,
              passengerSurchargeAmount: 0,
              airportSurchargeAmount: 0,
              totalEstimatedFare: rec.estimatedFare || 2500,
              breakdown: [],
            },
            createdAt: rec.createdAt,
            status: rec.status === 'CONFIRMED' ? 'Confirmed' : rec.status === 'COMPLETED' ? 'Completed' : 'Pending Confirmation',
          });
        }
      }

      setBookings(merged);
    } catch (e) {
      console.warn('Error loading customer trips:', e);
    } finally {
      setIsLoadingBookings(false);
    }
  };

  const refreshSavedDestinations = () => {
    setSavedList(getSavedDestinations(customer?.id));
  };

  useEffect(() => {
    if (isOpen && customer) {
      if (initialTab) {
        setActiveTab(initialTab);
      }
      setEditName(customer.fullName || '');
      setEditEmail(customer.email || '');
      setEditDefaultLocation(customer.defaultPickupLocation || '');
      setSaveSuccess(false);
      loadTrips();
      refreshSavedDestinations();
    }
  }, [isOpen, customer, initialTab]);

  if (!isOpen || !customer) return null;

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSavingProfile) return;
    setIsSavingProfile(true);
    try {
      const updated: CustomerUser = {
        ...customer,
        fullName: editName.trim() || customer.fullName,
        email: editEmail.trim(),
        defaultPickupLocation: editDefaultLocation.trim(),
      };
      await new Promise((resolve) => setTimeout(resolve, 450));
      saveCustomerSession(updated);
      onUpdateCustomer(updated);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleAddSavedDestination = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDestAddress.trim()) return;

    saveDestination(
      {
        label: newDestLabel.trim() || newDestAddress.trim(),
        placeName: newDestAddress.trim(),
        formattedAddress: newDestAddress.trim(),
        tag: newDestTag,
      },
      customer.id
    );

    setNewDestLabel('');
    setNewDestAddress('');
    setIsAddingSaved(false);
    refreshSavedDestinations();
    showToast('Destination saved to your account!');
  };

  const handleQuickBookmark = (placeAddress: string, label: string, tag: DestinationTag = 'favorite') => {
    if (!placeAddress) return;
    saveDestination(
      {
        label,
        placeName: placeAddress,
        formattedAddress: placeAddress,
        tag,
      },
      customer.id
    );
    refreshSavedDestinations();
    showToast(`Saved "${label}" to destinations!`);
  };

  const handleDeleteSaved = (id: string) => {
    deleteSavedDestination(id, customer?.id);
    refreshSavedDestinations();
    showToast('Destination deleted successfully');
  };

  const handleClearAllSaved = () => {
    if (window.confirm('Are you sure you want to delete all saved destinations?')) {
      clearAllSavedDestinations(customer?.id);
      refreshSavedDestinations();
      showToast('All saved destinations deleted');
    }
  };

  const showToast = (msg: string) => {
    setSavedSuccessMsg(msg);
    setTimeout(() => setSavedSuccessMsg(null), 3000);
  };

  const getStatusBadge = (status: BookingRequest['status']) => {
    switch (status) {
      case 'Confirmed':
      case 'Approved':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'Driver Assigned':
      case 'Chauffeur Assigned':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'In Progress':
      case 'Driver En Route':
        return 'bg-amber-100 text-amber-900 border-amber-300 animate-pulse';
      case 'Completed':
        return 'bg-slate-100 text-slate-700 border-slate-300';
      default:
        return 'bg-amber-100 text-amber-900 border-amber-300';
    }
  };

  const getTagIcon = (tag: DestinationTag) => {
    switch (tag) {
      case 'home':
        return <Home className="w-3.5 h-3.5 text-blue-600" />;
      case 'work':
        return <Briefcase className="w-3.5 h-3.5 text-indigo-600" />;
      case 'airport':
        return <Plane className="w-3.5 h-3.5 text-emerald-600" />;
      default:
        return <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
        <ProgressBar
          isLoading={isLoadingBookings || isSavingProfile}
          className="absolute top-0 left-0 right-0 z-40 rounded-none h-1"
        />
        
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-950 via-emerald-900 to-slate-900 text-white p-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-300 font-bold text-lg">
              {customer.fullName.slice(0, 2).toUpperCase() || 'TJ'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-lg text-white">
                  {customer.fullName}
                </h3>
                <span className="text-[10px] bg-emerald-400/20 text-emerald-300 border border-emerald-300/30 px-2 py-0.5 rounded-full font-bold uppercase">
                  Passenger Portal
                </span>
              </div>
              <p className="text-xs text-emerald-200/80 mt-0.5 flex items-center gap-2">
                <span>+91 {customer.mobileNumber}</span>
                {customer.email && (
                  <>
                    <span>•</span>
                    <span>{customer.email}</span>
                  </>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onLogout}
              className="p-2 rounded-xl bg-white/10 hover:bg-red-500/20 text-slate-300 hover:text-red-300 transition-colors flex items-center gap-1.5 text-xs font-bold cursor-pointer"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tab Navigation: Trips | Saved Destinations | Profile */}
        <div className="flex border-b border-slate-200 bg-slate-50/80 shrink-0 px-4 sm:px-6 pt-2 overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => setActiveTab('trips')}
            className={`pb-3 px-3 sm:px-4 text-xs font-extrabold tracking-wide uppercase transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'trips'
                ? 'border-b-2 border-emerald-700 text-emerald-900 font-black'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <Car className="w-4 h-4" />
            <span>My Bookings ({bookings.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('saved')}
            className={`pb-3 px-3 sm:px-4 text-xs font-extrabold tracking-wide uppercase transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'saved'
                ? 'border-b-2 border-emerald-700 text-emerald-900 font-black'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <Bookmark className="w-4 h-4 text-amber-600" />
            <span>Saved Destinations ({savedList.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className={`pb-3 px-3 sm:px-4 text-xs font-extrabold tracking-wide uppercase transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'profile'
                ? 'border-b-2 border-emerald-700 text-emerald-900 font-black'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <User className="w-4 h-4" />
            <span>Profile Settings</span>
          </button>
        </div>

        {/* Toast alert */}
        {savedSuccessMsg && (
          <div className="bg-emerald-800 text-white text-xs font-bold py-2 px-4 text-center animate-in fade-in flex items-center justify-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>{savedSuccessMsg}</span>
          </div>
        )}

        {/* Modal Body with Scroll */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4">
          
          {/* TAB 1: TRIPS */}
          {activeTab === 'trips' && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h4 className="font-extrabold text-sm text-slate-900">
                    Your Trip History
                  </h4>
                  <p className="text-xs text-slate-500">
                    Live dispatch status tracker, chauffeur details, and 1-click rebooking
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={loadTrips}
                    disabled={isLoadingBookings}
                    className="p-2 text-slate-500 hover:text-emerald-800 hover:bg-slate-100 rounded-xl transition-colors text-xs flex items-center gap-1 font-bold cursor-pointer"
                    title="Refresh Trips"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isLoadingBookings ? 'animate-spin' : ''}`} />
                    <span>Refresh</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onBookNewRide();
                    }}
                    className="bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs py-2 px-3.5 rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>+ Book New Ride</span>
                  </button>
                </div>
              </div>

              {isLoadingBookings ? (
                <div className="py-12 text-center text-slate-400 space-y-2">
                  <RefreshCw className="w-8 h-8 animate-spin mx-auto text-emerald-700" />
                  <p className="text-xs font-semibold">Loading your bookings...</p>
                </div>
              ) : bookings.length === 0 ? (
                <div className="py-12 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 p-8 space-y-3">
                  <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto">
                    <Car className="w-6 h-6" />
                  </div>
                  <h5 className="font-bold text-slate-800 text-sm">No bookings found yet</h5>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    When you book a cab or outstation ride with TRAVEL JUST, your trip details and live status will appear here.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onBookNewRide();
                    }}
                    className="inline-flex items-center gap-2 bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-xs transition-all cursor-pointer"
                  >
                    <span>Book Your First Ride</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {bookings.map((trip) => (
                    <div
                      key={trip.referenceId}
                      className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs hover:border-emerald-500/50 transition-all space-y-3"
                    >
                      {/* Top status & Ref */}
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-xs text-slate-800 bg-slate-100 px-2 py-0.5 rounded">
                            #{trip.referenceId}
                          </span>
                          <span
                            className={`text-[11px] font-extrabold px-2.5 py-0.5 rounded-full border ${getStatusBadge(
                              trip.status
                            )}`}
                          >
                            {trip.status}
                          </span>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <span className="font-extrabold text-sm text-slate-900">
                              ₹{Number(trip.estimatedFare?.totalEstimatedFare ?? 0).toLocaleString('en-IN')}
                            </span>
                            <span className="text-[10px] text-slate-500 block uppercase">
                              {trip.searchDetails.serviceType}
                            </span>
                          </div>

                          {/* Track Live Status Button */}
                          <button
                            type="button"
                            onClick={() => {
                              onClose();
                              onOpenTrackBooking?.(trip.referenceId);
                            }}
                            className="px-3 py-1.5 bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs rounded-xl shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
                            title="Track Live Chauffeur & Status on Map"
                          >
                            <Navigation className="w-3.5 h-3.5 text-emerald-300" />
                            <span>Track Live</span>
                          </button>
                        </div>
                      </div>

                      {/* Route & Timing */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        <div className="space-y-2">
                          <div className="flex items-start gap-2">
                            <MapPin className="w-3.5 h-3.5 text-emerald-700 shrink-0 mt-0.5" />
                            <div className="flex-1">
                              <span className="font-bold text-slate-900 block">
                                {trip.searchDetails.pickupLocation}
                              </span>
                              {/* Save Pickup Location Button */}
                              <button
                                type="button"
                                onClick={() => {
                                  const name = trip.searchDetails.pickupLocation.split(',')[0].trim() || 'Pickup Location';
                                  handleQuickBookmark(trip.searchDetails.pickupLocation, name, 'favorite');
                                }}
                                className="text-[11px] font-bold text-emerald-800 hover:text-emerald-950 inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-md bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-colors cursor-pointer"
                                title="Save pickup location to your Saved Destinations"
                              >
                                <Bookmark className="w-3 h-3 text-amber-500 fill-amber-500" />
                                <span>Save Pickup Location</span>
                              </button>

                              {trip.searchDetails.dropLocation && (
                                <div className="mt-1 pt-1 border-t border-slate-100">
                                  <span className="text-slate-500 text-[11px] block">
                                    To: <strong>{trip.searchDetails.dropLocation}</strong>
                                  </span>
                                  {/* Save Drop-off Location Button */}
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const name = trip.searchDetails.dropLocation!.split(',')[0].trim() || 'Drop-off Location';
                                      handleQuickBookmark(trip.searchDetails.dropLocation!, name, 'favorite');
                                    }}
                                    className="text-[11px] font-bold text-emerald-800 hover:text-emerald-950 inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-md bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-colors cursor-pointer"
                                    title="Save drop-off location to your Saved Destinations"
                                  >
                                    <Bookmark className="w-3 h-3 text-amber-500 fill-amber-500" />
                                    <span>Save Drop-off Location</span>
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="space-y-1 text-slate-600 bg-slate-50/80 p-2.5 rounded-xl border border-slate-100">
                          <div className="flex items-center gap-2 font-medium">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                            <span>Date: {trip.searchDetails.travelDate}</span>
                          </div>
                          <div className="flex items-center gap-2 font-medium">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            <span>Time: {trip.searchDetails.pickupTime}</span>
                          </div>
                          <div className="flex items-center gap-2 font-bold text-slate-800">
                            <Car className="w-3.5 h-3.5 text-emerald-700" />
                            <span>{trip.selectedVehicle.name}</span>
                          </div>
                        </div>
                      </div>

                      {/* Driver Details if Assigned */}
                      {trip.driverDetails && trip.driverDetails.driverName && (
                        <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-2.5 flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
                            <div>
                              <span className="font-bold text-emerald-950">
                                Chauffeur: {trip.driverDetails.driverName}
                              </span>
                              {trip.driverDetails.driverVehiclePlate && (
                                <span className="text-[11px] text-emerald-800 block">
                                  Plate: {trip.driverDetails.driverVehiclePlate}
                                </span>
                              )}
                            </div>
                          </div>

                          {trip.driverDetails.driverPhone && (
                            <a
                              href={`tel:${trip.driverDetails.driverPhone}`}
                              className="px-3 py-1 bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-[11px] rounded-lg transition-colors flex items-center gap-1"
                            >
                              <Phone className="w-3 h-3" />
                              <span>Call Chauffeur</span>
                            </a>
                          )}
                        </div>
                      )}

                      {/* Push Notification Card */}
                      <RidePushSubscriptionCard
                        referenceId={trip.referenceId}
                        customerPhone={trip.passengerDetails?.mobileNumber}
                        variant="compact"
                      />

                      {/* Actions Footer */}
                      <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-100">
                        <button
                          type="button"
                          onClick={() => {
                            onClose();
                            onOpenTrackBooking?.(trip.referenceId);
                          }}
                          className="text-xs font-bold text-emerald-800 hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <Navigation className="w-3.5 h-3.5" />
                          <span>View Live Tracking Details →</span>
                        </button>

                        <div className="flex items-center gap-2 flex-wrap">
                          <button
                            type="button"
                            onClick={async () => {
                              try {
                                const pad = (n: number) => String(n).padStart(2, '0');
                                const travelDateStr = trip.searchDetails.pickupDate || trip.searchDetails.travelDate || new Date().toISOString().split('T')[0];
                                const timeStr = trip.searchDetails.pickupTime || '07:00 AM';
                                let hours = 7;
                                let minutes = 0;
                                const timeMatch = timeStr.match(/(\d+):(\d+)\s*(AM|PM)?/i);
                                if (timeMatch) {
                                  hours = parseInt(timeMatch[1], 10);
                                  minutes = parseInt(timeMatch[2], 10);
                                  const meridiem = (timeMatch[3] || '').toUpperCase();
                                  if (meridiem === 'PM' && hours < 12) hours += 12;
                                  if (meridiem === 'AM' && hours === 12) hours = 0;
                                }
                                const startIso = `${travelDateStr}T${pad(hours)}:${pad(minutes)}:00`;
                                const durationHours = trip.searchDetails.durationHours || 3;
                                const endIso = `${travelDateStr}T${pad((hours + durationHours) % 24)}:${pad(minutes)}:00`;

                                const res = await createGoogleCalendarTripEvent({
                                  summary: `TRAVEL JUST: ${trip.searchDetails.pickupLocation} → ${trip.searchDetails.dropLocation || 'Local Package'} (#${trip.referenceId})`,
                                  description: `Vehicle: ${trip.selectedVehicle.name}\nEstimated Fare: ₹${trip.estimatedFare.totalEstimatedFare}\nBooking: ${trip.referenceId}`,
                                  location: `${trip.searchDetails.pickupLocation}, Mysuru / Karnataka`,
                                  startDateTime: startIso,
                                  endDateTime: endIso,
                                  attendees: customer?.email ? [customer.email] : undefined,
                                  referenceId: trip.referenceId,
                                });
                                setSavedSuccessMsg(`Added trip #${trip.referenceId} to Google Calendar!`);
                                setTimeout(() => setSavedSuccessMsg(null), 3500);
                                if (res.htmlLink) {
                                  window.open(res.htmlLink, '_blank');
                                }
                              } catch (err: any) {
                                alert(`Calendar Sync Notice: ${err?.message || 'Could not add event to Google Calendar'}`);
                              }
                            }}
                            className="text-xs font-bold text-blue-800 hover:text-blue-950 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-xl border border-blue-200 transition-colors flex items-center gap-1 cursor-pointer"
                            title="Add scheduled cab pickup to your Google Calendar"
                          >
                            <Calendar className="w-3.5 h-3.5 text-blue-600" />
                            <span>Add to Calendar</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              onClose();
                              onRebookTrip(trip.searchDetails, trip.selectedVehicle.id);
                            }}
                            className="text-xs font-bold text-slate-800 hover:text-emerald-800 bg-slate-100 hover:bg-emerald-50 px-3 py-1.5 rounded-xl border border-slate-200 transition-colors flex items-center gap-1 cursor-pointer"
                          >
                            <RefreshCw className="w-3 h-3 text-slate-600" />
                            <span>Rebook Trip</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: SAVED DESTINATIONS */}
          {activeTab === 'saved' && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h4 className="font-extrabold text-sm text-slate-900">
                    Saved Destinations
                  </h4>
                  <p className="text-xs text-slate-500">
                    Manage your saved pickup & drop-off locations. Use them for fast 1-click bookings.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {savedList.length > 0 && (
                    <button
                      type="button"
                      onClick={handleClearAllSaved}
                      className="px-3 py-2 text-slate-500 hover:text-red-600 hover:bg-red-50 border border-slate-200 hover:border-red-200 font-bold text-xs rounded-xl transition-all flex items-center gap-1 cursor-pointer"
                      title="Delete all saved destinations"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete All</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setIsAddingSaved((prev) => !prev)}
                    className="px-3.5 py-2 bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{isAddingSaved ? 'Cancel' : 'Add New Place'}</span>
                  </button>
                </div>
              </div>

              {/* Add New Destination Form */}
              {isAddingSaved && (
                <form
                  onSubmit={handleAddSavedDestination}
                  className="bg-slate-50 border border-emerald-200 rounded-2xl p-4 space-y-3 animate-in fade-in"
                >
                  <span className="font-bold text-xs text-emerald-900 block">
                    Save a New Location
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Label / Name
                      </label>
                      <input
                        type="text"
                        value={newDestLabel}
                        onChange={(e) => setNewDestLabel(e.target.value)}
                        placeholder="e.g. Home, Office, Grand Hotel"
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Category Tag
                      </label>
                      <select
                        value={newDestTag}
                        onChange={(e) => setNewDestTag(e.target.value as DestinationTag)}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                      >
                        <option value="home">Home</option>
                        <option value="work">Work / Office</option>
                        <option value="airport">Airport</option>
                        <option value="favorite">Favorite / Sightseeing</option>
                        <option value="hotel">Hotel / Resort</option>
                        <option value="other">Other</option>
                      </select>
                    </div>

                    <div className="sm:col-span-3">
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Exact Address or Place Name
                      </label>
                      <input
                        type="text"
                        value={newDestAddress}
                        onChange={(e) => setNewDestAddress(e.target.value)}
                        placeholder="e.g. Vijayanagar 2nd Stage, Mysuru or KIAL Airport"
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                        required
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setIsAddingSaved(false)}
                      className="px-3 py-1.5 text-slate-600 hover:bg-slate-200 font-bold text-xs rounded-xl"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs rounded-xl shadow-xs"
                    >
                      Save Location
                    </button>
                  </div>
                </form>
              )}

              {/* Empty state */}
              {savedList.length === 0 && (
                <div className="py-10 px-4 text-center bg-slate-50/80 rounded-2xl border border-dashed border-slate-200 space-y-3">
                  <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto">
                    <Bookmark className="w-6 h-6 text-emerald-700" />
                  </div>
                  <h5 className="font-bold text-slate-800 text-sm">No saved destinations yet</h5>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    Save pickup and drop-off locations directly from your Trip History or manually enter them above to use them for 1-click booking.
                  </p>
                  <button
                    type="button"
                    onClick={() => setIsAddingSaved(true)}
                    className="inline-flex items-center gap-1.5 bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs px-4 py-2 rounded-xl shadow-xs transition-all cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Add Your First Location</span>
                  </button>
                </div>
              )}

              {/* Destinations List */}
              {savedList.length > 0 && (
                <div className="space-y-2">
                  {savedList.map((dest) => (
                    <div
                      key={dest.id}
                      className="bg-white border border-slate-200/90 rounded-2xl p-3.5 flex flex-wrap sm:flex-nowrap items-center justify-between gap-3 hover:border-emerald-400 transition-colors shadow-2xs group"
                    >
                      <div className="flex items-start gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center shrink-0 shadow-2xs mt-0.5">
                          {getTagIcon(dest.tag)}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-xs sm:text-sm text-slate-900 truncate">
                              {dest.label}
                            </span>
                            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md shrink-0">
                              {dest.tag}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5 line-clamp-1 truncate">
                            {dest.formattedAddress}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 ml-auto">
                        {/* Book Pickup */}
                        <button
                          type="button"
                          onClick={() => {
                            onClose();
                            onSelectSavedDestinationForBooking?.(dest.formattedAddress, false);
                          }}
                          className="px-3 py-1.5 bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs rounded-xl shadow-2xs transition-all flex items-center gap-1 cursor-pointer"
                          title="Book cab with this as pickup location"
                        >
                          <span>Book Pickup</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>

                        {/* Book Drop */}
                        <button
                          type="button"
                          onClick={() => {
                            onClose();
                            onSelectSavedDestinationForBooking?.(dest.formattedAddress, true);
                          }}
                          className="px-2.5 py-1.5 bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-900 font-bold text-xs rounded-xl border border-slate-200 transition-all flex items-center gap-1 cursor-pointer"
                          title="Book cab with this as drop-off location"
                        >
                          <span>Set Drop</span>
                        </button>

                        {/* Delete */}
                        <button
                          type="button"
                          onClick={() => handleDeleteSaved(dest.id)}
                          className="px-2.5 py-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 border border-slate-200 hover:border-red-200 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer"
                          title="Delete saved destination"
                          aria-label={`Delete ${dest.label}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Delete</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: PROFILE SETTINGS */}
          {activeTab === 'profile' && (
            <form onSubmit={handleSaveProfile} className="space-y-4 max-w-md mx-auto">
              <fieldset disabled={isSavingProfile} className="space-y-4 border-0 p-0 m-0 min-w-0">
                <div className="text-center pb-2">
                  <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-black text-2xl mx-auto mb-2 border border-emerald-200">
                    {customer.fullName.slice(0, 2).toUpperCase() || 'TJ'}
                  </div>
                  <h4 className="font-extrabold text-base text-slate-900">
                    {customer.fullName}
                  </h4>
                  <p className="text-xs text-slate-500">
                    Registered Passenger Profile
                  </p>
                </div>

                {saveSuccess && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-bold flex items-center gap-2 animate-in fade-in">
                    <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                    <span>Profile details updated successfully!</span>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Full Name
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <User className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      value={editName}
                      disabled={isSavingProfile}
                      onChange={(e) => setEditName(e.target.value)}
                      required
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 focus:border-emerald-600 rounded-xl text-sm font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 disabled:opacity-60"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Mobile Number (Account ID)
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 font-bold text-xs">
                      +91
                    </div>
                    <input
                      type="text"
                      value={customer.mobileNumber}
                      disabled
                      className="w-full pl-12 pr-4 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-sm font-bold text-slate-600 cursor-not-allowed"
                    />
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Mobile number is linked to your booking dispatch history.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Email Address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input
                      type="email"
                      value={editEmail}
                      disabled={isSavingProfile}
                      onChange={(e) => setEditEmail(e.target.value)}
                      placeholder="For digital receipts & trip updates"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 focus:border-emerald-600 rounded-xl text-sm font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 disabled:opacity-60"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Default Home / Porch Pickup Address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <MapPin className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      value={editDefaultLocation}
                      disabled={isSavingProfile}
                      onChange={(e) => setEditDefaultLocation(e.target.value)}
                      placeholder="e.g. Vijayanagar 2nd Stage, Mysuru"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 focus:border-emerald-600 rounded-xl text-sm font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 disabled:opacity-60"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isSavingProfile}
                    className="w-full py-2.5 px-4 bg-emerald-800 hover:bg-emerald-900 active:bg-emerald-950 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {isSavingProfile ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-white" />
                        <span>Saving Profile Details...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Save Profile Details</span>
                      </>
                    )}
                  </button>
                </div>
              </fieldset>
            </form>
          )}

        </div>
      </div>
    </div>
  );
};
