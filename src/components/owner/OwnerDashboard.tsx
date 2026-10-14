import React from 'react';
import {
  TrendingUp,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  Car,
  UserCheck,
  IndianRupee,
  MessageSquare,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  Sparkles,
  Plus,
  Users,
  Tag,
  FileText,
  Globe,
  Code2,
  Activity,
} from 'lucide-react';
import { OwnerDashboardStats } from '../../services/ownerService';

interface OwnerDashboardProps {
  stats: OwnerDashboardStats | null;
  onNavigateTab: (tab: string) => void;
  onRefresh: () => void;
  isLoading: boolean;
}

export const OwnerDashboard: React.FC<OwnerDashboardProps> = ({
  stats,
  onNavigateTab,
  onRefresh,
  isLoading,
}) => {
  return (
    <div className="space-y-6">
      {/* Top Banner / Welcome */}
      <div className="bg-gradient-to-r from-[#0a4d3c] via-[#07382c] to-slate-900 rounded-2xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-xs text-xs font-semibold text-[#0ef10e] mb-3">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>SINGLE SOURCE OF TRUTH • SECURE BACKEND ACTIVE</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              TRAVEL JUST Control Center
            </h1>
            <p className="text-slate-300 text-sm mt-1 max-w-xl">
              Live operational overview of bookings, fleet deployment, centralized WhatsApp communications, and backend fare engine.
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={onRefresh}
              disabled={isLoading}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs transition-colors cursor-pointer border border-white/10"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Refresh Stats</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigateTab('bookings')}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0ef10e] hover:bg-[#0cd80c] text-slate-950 font-bold text-xs transition-colors cursor-pointer shadow-md"
            >
              <span>Manage Bookings</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Workspace Quick Actions Bar */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-2xs">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[11px] font-black uppercase tracking-wider text-slate-500">
            Workspace Quick Actions
          </span>
          <span className="text-[10px] text-slate-400 font-semibold">
            One-Click Management Operations
          </span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
          <button
            type="button"
            onClick={() => onNavigateTab('bookings')}
            className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-emerald-50 hover:border-emerald-200 text-slate-800 hover:text-emerald-900 text-xs font-bold transition-all cursor-pointer group shadow-2xs"
          >
            <Plus className="w-3.5 h-3.5 text-emerald-600 group-hover:scale-110 transition-transform shrink-0" />
            <span className="truncate">New Booking</span>
          </button>

          <button
            type="button"
            onClick={() => onNavigateTab('customers')}
            className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-emerald-50 hover:border-emerald-200 text-slate-800 hover:text-emerald-900 text-xs font-bold transition-all cursor-pointer group shadow-2xs"
          >
            <Users className="w-3.5 h-3.5 text-blue-600 group-hover:scale-110 transition-transform shrink-0" />
            <span className="truncate">New Customer</span>
          </button>

          <button
            type="button"
            onClick={() => onNavigateTab('fleet')}
            className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-emerald-50 hover:border-emerald-200 text-slate-800 hover:text-emerald-900 text-xs font-bold transition-all cursor-pointer group shadow-2xs"
          >
            <Car className="w-3.5 h-3.5 text-indigo-600 group-hover:scale-110 transition-transform shrink-0" />
            <span className="truncate">Add Vehicle</span>
          </button>

          <button
            type="button"
            onClick={() => onNavigateTab('fleet')}
            className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-emerald-50 hover:border-emerald-200 text-slate-800 hover:text-emerald-900 text-xs font-bold transition-all cursor-pointer group shadow-2xs"
          >
            <UserCheck className="w-3.5 h-3.5 text-teal-600 group-hover:scale-110 transition-transform shrink-0" />
            <span className="truncate">Add Chauffeur</span>
          </button>

          <button
            type="button"
            onClick={() => onNavigateTab('fare-engine')}
            className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-emerald-50 hover:border-emerald-200 text-slate-800 hover:text-emerald-900 text-xs font-bold transition-all cursor-pointer group shadow-2xs"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-600 group-hover:scale-110 transition-transform shrink-0" />
            <span className="truncate">Update Fare</span>
          </button>

          <button
            type="button"
            onClick={() => onNavigateTab('discounts')}
            className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-emerald-50 hover:border-emerald-200 text-slate-800 hover:text-emerald-900 text-xs font-bold transition-all cursor-pointer group shadow-2xs"
          >
            <Tag className="w-3.5 h-3.5 text-rose-600 group-hover:scale-110 transition-transform shrink-0" />
            <span className="truncate">Create Discount</span>
          </button>

          <button
            type="button"
            onClick={() => onNavigateTab('whatsapp')}
            className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-emerald-50 hover:border-emerald-200 text-slate-800 hover:text-emerald-900 text-xs font-bold transition-all cursor-pointer group shadow-2xs"
          >
            <MessageSquare className="w-3.5 h-3.5 text-emerald-600 group-hover:scale-110 transition-transform shrink-0" />
            <span className="truncate">Open WhatsApp</span>
          </button>

          <button
            type="button"
            onClick={() => onNavigateTab('payments')}
            className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-emerald-50 hover:border-emerald-200 text-slate-800 hover:text-emerald-900 text-xs font-bold transition-all cursor-pointer group shadow-2xs"
          >
            <FileText className="w-3.5 h-3.5 text-cyan-600 group-hover:scale-110 transition-transform shrink-0" />
            <span className="truncate">Create Invoice</span>
          </button>

          <button
            type="button"
            onClick={() => onNavigateTab('payments')}
            className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-emerald-50 hover:border-emerald-200 text-slate-800 hover:text-emerald-900 text-xs font-bold transition-all cursor-pointer group shadow-2xs"
          >
            <IndianRupee className="w-3.5 h-3.5 text-emerald-700 group-hover:scale-110 transition-transform shrink-0" />
            <span className="truncate">View Payments</span>
          </button>

          <button
            type="button"
            onClick={() => onNavigateTab('site-optimizer')}
            className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-emerald-50 hover:border-emerald-200 text-slate-800 hover:text-emerald-900 text-xs font-bold transition-all cursor-pointer group shadow-2xs"
          >
            <Globe className="w-3.5 h-3.5 text-sky-600 group-hover:scale-110 transition-transform shrink-0" />
            <span className="truncate">Site Optimizer</span>
          </button>

          <button
            type="button"
            onClick={() => onNavigateTab('json-ld')}
            className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-emerald-50 hover:border-emerald-200 text-slate-800 hover:text-emerald-900 text-xs font-bold transition-all cursor-pointer group shadow-2xs"
          >
            <Code2 className="w-3.5 h-3.5 text-violet-600 group-hover:scale-110 transition-transform shrink-0" />
            <span className="truncate">JSON-LD Schema</span>
          </button>

          <button
            type="button"
            onClick={() => onNavigateTab('system-health')}
            className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-emerald-50 hover:border-emerald-200 text-slate-800 hover:text-emerald-900 text-xs font-bold transition-all cursor-pointer group shadow-2xs"
          >
            <Activity className="w-3.5 h-3.5 text-emerald-600 group-hover:scale-110 transition-transform shrink-0" />
            <span className="truncate">System Health</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {/* Card 1: Today's Bookings */}
        <div
          onClick={() => onNavigateTab('bookings')}
          className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-2xs hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Today's Bookings</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-slate-900">
              {stats?.todayBookingsCount ?? 0}
            </span>
            <span className="text-xs text-emerald-600 font-semibold">Active Today</span>
          </div>
        </div>

        {/* Card 2: Pending Requests */}
        <div
          onClick={() => onNavigateTab('bookings')}
          className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-2xs hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Pending Review</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-amber-600">
              {stats?.pendingRequestsCount ?? 0}
            </span>
            <span className="text-xs text-amber-700 font-semibold">Needs Approval</span>
          </div>
        </div>

        {/* Card 3: Fleet Status */}
        <div
          onClick={() => onNavigateTab('fleet')}
          className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-2xs hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Fleet Status</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Car className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-blue-700">
              {stats?.fleet.availableVehicles ?? 0}
              <span className="text-sm font-semibold text-slate-400"> / {stats?.fleet.totalVehicles ?? 0}</span>
            </span>
            <span className="text-xs text-blue-600 font-semibold">Available</span>
          </div>
          <div className="mt-1 flex items-center justify-between text-[11px] text-slate-500">
            <span>{stats?.fleet.onDutyChauffeurs ?? 0} Drivers Active</span>
            <span className="font-bold text-slate-700">{stats?.fleet.utilizationRate ?? 0}% In Use</span>
          </div>
        </div>

        {/* Card 4: Total Revenue */}
        <div
          onClick={() => onNavigateTab('payments')}
          className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-2xs hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Booked Value</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-[#0a4d3c] flex items-center justify-center group-hover:scale-110 transition-transform">
              <IndianRupee className="w-4 h-4 font-bold" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-[#0a4d3c]">
              ₹{(stats?.totalRevenue ?? 0).toLocaleString('en-IN')}
            </span>
          </div>
        </div>
      </div>

      {/* Fleet Utilization & Operations Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Fleet Availability Card */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Car className="w-4 h-4 text-emerald-600" />
              <span>Fleet Availability Status</span>
            </h3>
            <button
              type="button"
              onClick={() => onNavigateTab('fleet')}
              className="text-xs text-emerald-700 hover:text-emerald-800 font-semibold cursor-pointer"
            >
              View Fleet →
            </button>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-xs text-slate-600 font-medium">Available Vehicles</span>
              <span className="text-sm font-bold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                {stats?.fleet.availableVehicles ?? 0} / {stats?.fleet.totalVehicles ?? 0}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-xs text-slate-600 font-medium">Assigned / On Trip</span>
              <span className="text-sm font-bold text-blue-700 bg-blue-100 px-2.5 py-0.5 rounded-full">
                {stats?.fleet.assignedVehicles ?? 0}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-xs text-slate-600 font-medium">Vehicles in Maintenance</span>
              <span className="text-sm font-bold text-amber-700 bg-amber-100 px-2.5 py-0.5 rounded-full">
                {stats?.fleet.maintenanceVehicles ?? 0}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-xs text-slate-600 font-medium">Chauffeurs on Duty</span>
              <span className="text-sm font-bold text-slate-800 bg-slate-200 px-2.5 py-0.5 rounded-full">
                {stats?.fleet.onDutyChauffeurs ?? 0} / {stats?.fleet.totalChauffeurs ?? 0}
              </span>
            </div>
          </div>
        </div>

        {/* Centralized WhatsApp Communication Hub */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-emerald-600" />
              <span>WhatsApp Business Hub (+91 9740754400)</span>
            </h3>
            <button
              type="button"
              onClick={() => onNavigateTab('whatsapp')}
              className="text-xs text-emerald-700 hover:text-emerald-800 font-semibold cursor-pointer"
            >
              Open Chat →
            </button>
          </div>

          <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-100 mb-4">
            <p className="text-xs text-emerald-900 leading-relaxed">
              <strong>Centralized Communication:</strong> Customer Website and Owner Portal share the same unified WhatsApp Business number. Dispatch updates, driver allocations, and quotes are dispatched automatically.
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs py-2 border-b border-slate-100">
              <span className="text-slate-600">Pending Customer Messages</span>
              <span className="font-bold text-slate-900">{stats?.alerts.unreadWhatsAppCount ?? 0} unread</span>
            </div>
            <div className="flex items-center justify-between text-xs py-2 border-b border-slate-100">
              <span className="text-slate-600">Official Business Templates</span>
              <span className="font-bold text-emerald-700">14 Verified</span>
            </div>
            <div className="flex items-center justify-between text-xs py-2">
              <span className="text-slate-600">Automated Dispatch Notifications</span>
              <span className="font-bold text-emerald-700 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Active</span>
              </span>
            </div>
          </div>
        </div>

        {/* Centralized Fare & Price Engine Status */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              <span>Backend Fare Engine</span>
            </h3>
            <button
              type="button"
              onClick={() => onNavigateTab('fare-engine')}
              className="text-xs text-emerald-700 hover:text-emerald-800 font-semibold cursor-pointer"
            >
              Manage Fares →
            </button>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 mb-4">
            <p className="text-xs text-slate-600 leading-relaxed">
              <strong>Single Source of Pricing Truth:</strong> Customer forms read published fares directly. When you update and publish rates here, all website forms update instantly.
            </p>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between py-2 border-b border-slate-100">
              <span className="text-slate-600">Active Rate Cards</span>
              <span className="font-bold text-slate-900">5 Vehicles Configured</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-slate-100">
              <span className="text-slate-600">Interstate Corridors</span>
              <span className="font-bold text-slate-900">KA, TN, KL, AP, TS</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-slate-600">Publish Flow Enforcement</span>
              <span className="font-bold text-emerald-700">Strict Save & Publish</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
