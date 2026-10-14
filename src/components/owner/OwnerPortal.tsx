import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  CalendarCheck2,
  Users,
  Sparkles,
  Car,
  MessageSquare,
  CreditCard,
  Tag,
  Globe,
  BarChart3,
  Bell,
  ShieldAlert,
  Sliders,
  LogOut,
  ExternalLink,
  ChevronRight,
  Menu,
  X,
  ShieldCheck,
  CheckCircle2,
  Code2,
  Activity,
} from 'lucide-react';
import { OwnerRole } from '../../types/owner';
import { ownerService, OwnerDashboardStats } from '../../services/ownerService';
import { OwnerDashboard } from './OwnerDashboard';
import { OwnerBookings } from './OwnerBookings';
import { OwnerCustomers } from './OwnerCustomers';
import { OwnerFareEngine } from './OwnerFareEngine';
import { OwnerFleet } from './OwnerFleet';
import { OwnerWhatsAppCenter } from './OwnerWhatsAppCenter';
import { OwnerPayments } from './OwnerPayments';
import { OwnerDiscounts } from './OwnerDiscounts';
import { OwnerSiteOptimizer } from './OwnerSiteOptimizer';
import { OwnerJsonLdSchema } from './OwnerJsonLdSchema';
import { OwnerSystemHealth } from './OwnerSystemHealth';
import { OwnerReports } from './OwnerReports';
import { OwnerNotifications } from './OwnerNotifications';
import { OwnerAuditLogs } from './OwnerAuditLogs';
import { OwnerAddOns } from './OwnerAddOns';
import { CentralizedFareConfig } from '../../types/fareEngine';

interface OwnerPortalProps {
  onBackToCustomerWebsite: () => void;
  onFareSaved?: (config: CentralizedFareConfig) => void;
}

export type OwnerTab =
  | 'dashboard'
  | 'bookings'
  | 'customers'
  | 'fare-engine'
  | 'fleet'
  | 'addons'
  | 'whatsapp'
  | 'payments'
  | 'discounts'
  | 'site-optimizer'
  | 'json-ld'
  | 'system-health'
  | 'reports'
  | 'notifications'
  | 'audit-logs';

export const OwnerPortal: React.FC<OwnerPortalProps> = ({
  onBackToCustomerWebsite,
  onFareSaved,
}) => {
  const [activeTab, setActiveTab] = useState<OwnerTab>('dashboard');
  const [currentRole, setCurrentRole] = useState<OwnerRole>('SUPER_ADMIN');
  const [stats, setStats] = useState<OwnerDashboardStats | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const fetchStats = async () => {
    setIsLoadingStats(true);
    const data = await ownerService.getDashboardStats();
    setStats(data);
    setIsLoadingStats(false);
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 30000); // 30s auto-refresh
    return () => clearInterval(interval);
  }, []);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, badge: null },
    { id: 'bookings', label: 'Bookings Management', icon: CalendarCheck2, badge: stats?.pendingRequestsCount ? `${stats.pendingRequestsCount}` : null },
    { id: 'customers', label: 'Customers', icon: Users, badge: null },
    { id: 'fare-engine', label: 'Fare & Price Engine', icon: Sparkles, badge: 'Live' },
    { id: 'fleet', label: 'Fleet & Chauffeurs', icon: Car, badge: null },
    { id: 'addons', label: 'Amenities & Add-Ons', icon: Sliders, badge: 'Config' },
    { id: 'whatsapp', label: 'WhatsApp Hub', icon: MessageSquare, badge: stats?.alerts.unreadWhatsAppCount ? `${stats.alerts.unreadWhatsAppCount}` : null },
    { id: 'payments', label: 'Payments & Invoices', icon: CreditCard, badge: null },
    { id: 'discounts', label: 'Discounts & Coupons', icon: Tag, badge: null },
    { id: 'site-optimizer', label: 'Site Optimizer (SEO)', icon: Globe, badge: 'v3' },
    { id: 'json-ld', label: 'JSON-LD Schema', icon: Code2, badge: 'Valid' },
    { id: 'system-health', label: 'System Health & Uptime', icon: Activity, badge: 'Live' },
    { id: 'reports', label: 'Reports & Analytics', icon: BarChart3, badge: null },
    { id: 'notifications', label: 'Notifications', icon: Bell, badge: stats?.alerts.unreadNotificationsCount ? `${stats.alerts.unreadNotificationsCount}` : null },
    { id: 'audit-logs', label: 'Audit Logs', icon: ShieldAlert, badge: null },
  ];

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans text-slate-900 selection:bg-[#0ef10e] selection:text-slate-950">
      {/* Top Navigation Bar */}
      <header className="bg-slate-900 text-white sticky top-0 z-40 border-b border-slate-800 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 cursor-pointer"
            >
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#0a4d3c] flex items-center justify-center text-[#0ef10e] font-black shadow-md border border-[#0ef10e]/30">
                <Car className="w-5 h-5 text-[#0ef10e]" />
              </div>
              <div>
                <span className="font-extrabold text-base tracking-tight text-white flex items-center gap-2">
                  <span>TRAVEL JUST</span>
                  <span className="text-[10px] font-black uppercase tracking-widest text-[#0ef10e] bg-white/10 px-2 py-0.5 rounded-md">
                    OWNER PORTAL
                  </span>
                </span>
                <span className="text-[11px] text-slate-400 block -mt-0.5">
                  Single Secure Backend Architecture
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 sm:gap-4">
            {/* Live Backend Badge */}
            <div className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-[#0ef10e] animate-pulse"></span>
              <span>Firestore & Dispatch Synchronized</span>
            </div>

            {/* Role Badge / Switcher */}
            <div className="hidden md:flex items-center gap-2 bg-slate-800/80 px-2.5 py-1 rounded-xl border border-slate-700 text-xs">
              <span className="text-slate-400 font-medium">Role:</span>
              <select
                value={currentRole}
                onChange={(e) => setCurrentRole(e.target.value as OwnerRole)}
                className="bg-transparent text-white font-bold focus:outline-none cursor-pointer text-xs"
              >
                <option value="SUPER_ADMIN" className="bg-slate-800 text-white">SUPER ADMIN / OWNER</option>
                <option value="BOOKING_MANAGER" className="bg-slate-800 text-white">BOOKING MANAGER</option>
                <option value="FLEET_MANAGER" className="bg-slate-800 text-white">FLEET MANAGER</option>
                <option value="ACCOUNTS" className="bg-slate-800 text-white">ACCOUNTS</option>
                <option value="COMMUNICATION_STAFF" className="bg-slate-800 text-white">COMMUNICATION STAFF</option>
              </select>
            </div>

            {/* Back to Customer Website Button */}
            <button
              type="button"
              onClick={onBackToCustomerWebsite}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-colors cursor-pointer border border-white/10"
            >
              <span>← Customer Website</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Body with Sidebar */}
      <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 flex gap-6">
        {/* Sidebar Navigation */}
        <aside
          className={`fixed inset-y-0 left-0 z-30 w-64 bg-white border-r border-slate-200 transform transition-transform duration-200 ease-in-out lg:relative lg:translate-x-0 lg:w-64 lg:rounded-2xl lg:border lg:shadow-2xs lg:block ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="p-4 flex flex-col h-full justify-between">
            <div className="space-y-1">
              <div className="p-3 bg-slate-50 rounded-xl mb-3 border border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 block uppercase">Logged in as</span>
                <span className="font-extrabold text-xs text-slate-900 block truncate">
                  traveljustmysuru@gmail.com
                </span>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md inline-block mt-1">
                  {currentRole}
                </span>
              </div>

              <div className="space-y-0.5 overflow-y-auto max-h-[calc(100vh-260px)]">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        setActiveTab(item.id as OwnerTab);
                        setSidebarOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        isActive
                          ? 'bg-[#0a4d3c] text-white shadow-xs'
                          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className={`w-4 h-4 ${isActive ? 'text-[#0ef10e]' : 'text-slate-400'}`} />
                        <span>{item.label}</span>
                      </div>
                      {item.badge && (
                        <span
                          className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded-full ${
                            isActive
                              ? 'bg-[#0ef10e] text-slate-950'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={onBackToCustomerWebsite}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Exit to Live Website</span>
              </button>
            </div>
          </div>
        </aside>

        {/* Content Area */}
        <main className="flex-1 min-w-0">
          {activeTab === 'dashboard' && (
            <OwnerDashboard
              stats={stats}
              onNavigateTab={(tab) => setActiveTab(tab as OwnerTab)}
              onRefresh={fetchStats}
              isLoading={isLoadingStats}
            />
          )}

          {activeTab === 'bookings' && (
            <OwnerBookings
              onNavigateTab={(tab) => setActiveTab(tab as OwnerTab)}
            />
          )}

          {activeTab === 'customers' && <OwnerCustomers />}

          {activeTab === 'fare-engine' && (
            <OwnerFareEngine
              onFareSaved={(cfg) => {
                fetchStats();
                if (onFareSaved) onFareSaved(cfg);
              }}
            />
          )}

          {activeTab === 'fleet' && <OwnerFleet />}

          {activeTab === 'addons' && <OwnerAddOns />}

          {activeTab === 'whatsapp' && <OwnerWhatsAppCenter />}

          {activeTab === 'payments' && <OwnerPayments />}

          {activeTab === 'discounts' && <OwnerDiscounts />}

          {activeTab === 'site-optimizer' && <OwnerSiteOptimizer />}

          {activeTab === 'json-ld' && <OwnerJsonLdSchema />}

          {activeTab === 'system-health' && <OwnerSystemHealth />}

          {activeTab === 'reports' && <OwnerReports />}

          {activeTab === 'notifications' && <OwnerNotifications />}

          {activeTab === 'audit-logs' && <OwnerAuditLogs />}
        </main>
      </div>
    </div>
  );
};
