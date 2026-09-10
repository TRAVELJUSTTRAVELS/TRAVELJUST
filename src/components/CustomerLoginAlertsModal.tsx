import React, { useState, useEffect } from 'react';
import {
  X,
  MessageSquare,
  ExternalLink,
  RefreshCw,
  User,
  Phone,
  Mail,
  Clock,
  CheckCircle2,
  ShieldAlert,
  Send,
  UserPlus,
  LogIn,
} from 'lucide-react';
import { CustomerLoginNotification } from '../types';
import {
  getOwnerLoginNotifications,
  openWhatsAppChat,
} from '../utils/whatsapp';
import { siteConfig } from '../config/siteConfig';

interface CustomerLoginAlertsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CustomerLoginAlertsModal: React.FC<CustomerLoginAlertsModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [notifications, setNotifications] = useState<CustomerLoginNotification[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadNotifications = async () => {
    setIsRefreshing(true);
    try {
      // Load local buffer
      const local = getOwnerLoginNotifications();

      // Attempt server sync
      try {
        const res = await fetch('/api/notifications/customer-logins');
        if (res.ok) {
          const data = await res.json();
          if (data?.notifications && Array.isArray(data.notifications) && data.notifications.length > 0) {
            // Merge unique
            const map = new Map<string, CustomerLoginNotification>();
            local.forEach((n) => map.set(n.id, n));
            data.notifications.forEach((item: any) => {
              if (!map.has(item.id)) {
                map.set(item.id, {
                  id: item.id,
                  customerId: item.customerId,
                  fullName: item.customerName,
                  mobileNumber: item.customerPhone,
                  email: item.customerEmail,
                  loginTime: new Date(item.timestamp).toLocaleString('en-IN', {
                    timeZone: 'Asia/Kolkata',
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: true,
                  }),
                  isNewRegistration: !!item.isNewRegistration,
                  whatsappDispatched: true,
                  ownerWhatsappNumber: item.ownerPhone || siteConfig.contact.whatsapp,
                  formattedMessage: item.formattedMessage || '',
                  whatsappUrl: item.whatsappUrl || '',
                });
              }
            });
            setNotifications(Array.from(map.values()));
            setIsRefreshing(false);
            return;
          }
        }
      } catch (err) {
        // Fallback to local
      }

      setNotifications(local);
    } catch (e) {
      console.warn('Error loading notifications:', e);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadNotifications();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      id="customer-login-alerts-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        id="customer-login-alerts-modal-card"
        className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[88vh] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-[#0f2441] via-slate-900 to-[#009966] text-white p-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-emerald-300">
              <MessageSquare className="w-5 h-5 fill-emerald-300/30" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base sm:text-lg text-white">
                  Customer Login WhatsApp Alerts
                </h3>
                <span className="bg-emerald-500/30 border border-emerald-400/40 text-emerald-200 font-bold px-2 py-0.5 rounded-full text-[10px] tracking-wider uppercase">
                  Fleet Manager Direct
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Real-time record of all new customer registrations & existing customer sign-in notifications sent to Fleet Manager (+91 97407 54400).
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="refresh-login-alerts-btn"
              type="button"
              onClick={loadNotifications}
              disabled={isRefreshing}
              className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition-all cursor-pointer disabled:opacity-50"
              title="Refresh alerts"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
            <button
              id="close-login-alerts-btn"
              type="button"
              onClick={onClose}
              className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-colors cursor-pointer"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Fleet Manager Dispatch Target Banner */}
        <div className="bg-emerald-50/90 border-b border-emerald-200/80 px-6 py-2.5 flex items-center justify-between text-xs text-emerald-950 shrink-0">
          <div className="flex items-center gap-2 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-600 animate-ping" />
            <span>
              Target WhatsApp: <strong>{siteConfig.contact.whatsapp}</strong> (Fleet Manager Desk)
            </span>
          </div>
          <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md">
            Strict Dispatch Enabled
          </span>
        </div>

        {/* Notifications List */}
        <div className="p-6 overflow-y-auto flex-1 space-y-3.5 divide-y divide-slate-100">
          {notifications.length === 0 ? (
            <div className="py-12 text-center text-slate-400 space-y-2">
              <MessageSquare className="w-10 h-10 mx-auto text-slate-300" />
              <p className="text-sm font-semibold text-slate-700">No Customer Login Alerts Recorded Yet</p>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Whenever any new customer registers or an existing customer signs in, their details will automatically appear here and be dispatched via WhatsApp.
              </p>
            </div>
          ) : (
            notifications.map((notif) => (
              <div
                key={notif.id}
                className="pt-3.5 first:pt-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`inline-flex items-center gap-1 font-bold text-[11px] px-2.5 py-0.5 rounded-full ${
                        notif.isNewRegistration
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : 'bg-indigo-100 text-indigo-800 border border-indigo-300'
                      }`}
                    >
                      {notif.isNewRegistration ? (
                        <>
                          <UserPlus className="w-3 h-3" />
                          <span>New Customer Registration</span>
                        </>
                      ) : (
                        <>
                          <LogIn className="w-3 h-3" />
                          <span>Existing Customer Login</span>
                        </>
                      )}
                    </span>

                    <span className="text-[11px] text-slate-400 flex items-center gap-1 font-medium">
                      <Clock className="w-3 h-3" />
                      {notif.loginTime}
                    </span>
                  </div>

                  <div className="flex items-center gap-4 flex-wrap text-xs">
                    <div className="flex items-center gap-1.5 text-slate-900 font-bold">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      <span>{notif.fullName}</span>
                    </div>

                    <div className="flex items-center gap-1.5 text-slate-700 font-mono font-semibold">
                      <Phone className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{notif.mobileNumber}</span>
                    </div>

                    {notif.email && (
                      <div className="flex items-center gap-1.5 text-slate-500">
                        <Mail className="w-3.5 h-3.5 text-slate-400" />
                        <span>{notif.email}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => openWhatsAppChat(notif.formattedMessage, siteConfig.contact.whatsapp)}
                    className="px-3 py-1.5 bg-[#25D366] hover:bg-[#20bd5a] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-all active:scale-95 cursor-pointer"
                    title="Open alert in WhatsApp"
                  >
                    <MessageSquare className="w-3.5 h-3.5 fill-white" />
                    <span>WhatsApp Alert</span>
                    <ExternalLink className="w-3 h-3 opacity-80" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-50 border-t border-slate-200 px-6 py-3.5 flex items-center justify-between text-xs text-slate-600 shrink-0">
          <span>
            Total Login Alerts: <strong>{notifications.length}</strong>
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-xl transition-all cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
