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
} from 'lucide-react';
import { CustomerUser, BookingRequest, BookingSearchState } from '../types';
import { getCustomerBookings, saveCustomerSession } from '../services/customerAuthService';
import { siteConfig } from '../config/siteConfig';

interface CustomerPortalModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: CustomerUser | null;
  onLogout: () => void;
  onUpdateCustomer: (updated: CustomerUser) => void;
  onRebookTrip: (search: Partial<BookingSearchState>, vehicleId?: string) => void;
  onBookNewRide: () => void;
}

export const CustomerPortalModal: React.FC<CustomerPortalModalProps> = ({
  isOpen,
  onClose,
  customer,
  onLogout,
  onUpdateCustomer,
  onRebookTrip,
  onBookNewRide,
}) => {
  const [activeTab, setActiveTab] = useState<'trips' | 'profile'>('trips');
  const [bookings, setBookings] = useState<BookingRequest[]>([]);
  const [isLoadingBookings, setIsLoadingBookings] = useState(false);

  // Profile Edit State
  const [editName, setEditName] = useState(customer?.fullName || '');
  const [editEmail, setEditEmail] = useState(customer?.email || '');
  const [editDefaultLocation, setEditDefaultLocation] = useState(customer?.defaultPickupLocation || '');
  const [saveSuccess, setSaveSuccess] = useState(false);

  const loadTrips = async () => {
    if (!customer?.mobileNumber) return;
    setIsLoadingBookings(true);
    try {
      const data = await getCustomerBookings(customer.mobileNumber);
      setBookings(data);
    } catch (e) {
      console.warn('Error loading customer trips:', e);
    } finally {
      setIsLoadingBookings(false);
    }
  };

  useEffect(() => {
    if (isOpen && customer) {
      setEditName(customer.fullName || '');
      setEditEmail(customer.email || '');
      setEditDefaultLocation(customer.defaultPickupLocation || '');
      setSaveSuccess(false);
      loadTrips();
    }
  }, [isOpen, customer]);

  if (!isOpen || !customer) return null;

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: CustomerUser = {
      ...customer,
      fullName: editName.trim() || customer.fullName,
      email: editEmail.trim(),
      defaultPickupLocation: editDefaultLocation.trim(),
    };
    saveCustomerSession(updated);
    onUpdateCustomer(updated);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const getStatusBadge = (status: BookingRequest['status']) => {
    switch (status) {
      case 'Confirmed':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'Driver Assigned':
        return 'bg-blue-100 text-blue-800 border-blue-300 animate-pulse';
      case 'Completed':
        return 'bg-slate-100 text-slate-700 border-slate-300';
      default:
        return 'bg-amber-100 text-amber-900 border-amber-300';
    }
  };

  const handleWhatsAppSupportForTrip = (trip: BookingRequest) => {
    const text = encodeURIComponent(
      `Hello TRAVEL JUST Support, I need assistance with my booking reference: ${trip.referenceId} (${trip.searchDetails.pickupLocation} to ${trip.searchDetails.dropLocation || 'Local Package'}).`
    );
    const phone = siteConfig.contact.whatsapp.replace(/\D/g, '');
    window.open(`https://wa.me/${phone}?text=${text}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
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
                  Passenger
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
              className="p-2 rounded-xl bg-white/10 hover:bg-red-500/20 text-slate-300 hover:text-red-300 transition-colors flex items-center gap-1.5 text-xs font-bold"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center transition-colors"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 bg-slate-50/80 shrink-0 px-6 pt-2">
          <button
            type="button"
            onClick={() => setActiveTab('trips')}
            className={`pb-3 px-4 text-xs font-extrabold tracking-wide uppercase transition-all flex items-center gap-2 ${
              activeTab === 'trips'
                ? 'border-b-2 border-emerald-700 text-emerald-900 font-black'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <Car className="w-4 h-4" />
            <span>My Bookings & Trips ({bookings.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className={`pb-3 px-4 text-xs font-extrabold tracking-wide uppercase transition-all flex items-center gap-2 ${
              activeTab === 'profile'
                ? 'border-b-2 border-emerald-700 text-emerald-900 font-black'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <User className="w-4 h-4" />
            <span>Profile Settings</span>
          </button>
        </div>

        {/* Modal Body with Scroll */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {activeTab === 'trips' ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-extrabold text-sm text-slate-900">
                    Your Trip History
                  </h4>
                  <p className="text-xs text-slate-500">
                    Track live dispatch status, rebook past rides, or contact support
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={loadTrips}
                    disabled={isLoadingBookings}
                    className="p-2 text-slate-500 hover:text-emerald-800 hover:bg-slate-100 rounded-xl transition-colors text-xs flex items-center gap-1 font-bold"
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
                    className="bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs py-2 px-3.5 rounded-xl shadow-xs transition-all flex items-center gap-1.5"
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
                    className="inline-flex items-center gap-2 bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-xs transition-all"
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

                        <div className="text-right">
                          <span className="font-extrabold text-sm text-slate-900">
                            ₹{Number(trip.estimatedFare?.totalEstimatedFare ?? 0).toLocaleString('en-IN')}
                          </span>
                          <span className="text-[10px] text-slate-500 block uppercase">
                            {trip.searchDetails.serviceType}
                          </span>
                        </div>
                      </div>

                      {/* Route & Timing */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        <div className="space-y-1.5">
                          <div className="flex items-start gap-2">
                            <MapPin className="w-3.5 h-3.5 text-emerald-700 shrink-0 mt-0.5" />
                            <div>
                              <span className="font-bold text-slate-900 block">
                                {trip.searchDetails.pickupLocation}
                              </span>
                              {trip.searchDetails.dropLocation && (
                                <span className="text-slate-500 text-[11px] block mt-0.5">
                                  To: <strong>{trip.searchDetails.dropLocation}</strong>
                                </span>
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
                                Driver: {trip.driverDetails.driverName}
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
                              <span>Call Driver</span>
                            </a>
                          )}
                        </div>
                      )}

                      {/* Actions Footer */}
                      <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => handleWhatsAppSupportForTrip(trip)}
                          className="text-[11px] font-bold text-emerald-800 hover:text-emerald-950 flex items-center gap-1 hover:underline"
                        >
                          <MessageSquare className="w-3 h-3 text-emerald-700" />
                          <span>Help on WhatsApp</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            onClose();
                            onRebookTrip(trip.searchDetails, trip.selectedVehicle.id);
                          }}
                          className="text-xs font-bold text-slate-800 hover:text-emerald-800 bg-slate-100 hover:bg-emerald-50 px-3 py-1.5 rounded-xl border border-slate-200 transition-colors flex items-center gap-1"
                        >
                          <RefreshCw className="w-3 h-3 text-slate-600" />
                          <span>Rebook This Trip</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <form onSubmit={handleSaveProfile} className="space-y-4 max-w-md mx-auto">
              <div className="text-center pb-2">
                <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-black text-2xl mx-auto mb-2 border border-emerald-200">
                  {customer.fullName.slice(0, 2).toUpperCase() || 'TJ'}
                </div>
                <h4 className="font-extrabold text-base text-slate-900">
                  {customer.fullName}
                </h4>
                <p className="text-xs text-slate-500">
                  Registered Customer Profile
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
                    onChange={(e) => setEditName(e.target.value)}
                    required
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 focus:border-emerald-600 rounded-xl text-sm font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Mobile Number (Fixed)
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
                  Mobile number is your account ID used for booking lookups.
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
                    onChange={(e) => setEditEmail(e.target.value)}
                    placeholder="For booking receipts"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 focus:border-emerald-600 rounded-xl text-sm font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Default / Home Pickup Address (Optional)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={editDefaultLocation}
                    onChange={(e) => setEditDefaultLocation(e.target.value)}
                    placeholder="e.g. Vijayanagar 2nd Stage, Mysuru"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 focus:border-emerald-600 rounded-xl text-sm font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
              </div>

              <div className="bg-emerald-50/80 border border-emerald-200/90 rounded-2xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-start gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                    <MessageSquare className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-extrabold text-slate-900">Login Alert & WhatsApp Notifications</span>
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                        Active
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 mt-0.5">
                      For safety & fast cab coordination, customer logins trigger an automatic notification to the TRAVEL JUST operators desk ({siteConfig.contact.phone}).
                    </p>
                  </div>
                </div>

                <a
                  href={`https://wa.me/${siteConfig.contact.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(`Hello TRAVEL JUST Operators Desk, I am ${customer.fullName} (${customer.mobileNumber}). I am currently logged into my account.`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-1.5 py-2 px-3 bg-white hover:bg-emerald-50 text-emerald-800 font-bold text-xs rounded-xl border border-emerald-300 shadow-xs transition-colors shrink-0"
                >
                  <MessageSquare className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Chat with Desk</span>
                </a>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-2.5 px-4 bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Save Profile Details</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
