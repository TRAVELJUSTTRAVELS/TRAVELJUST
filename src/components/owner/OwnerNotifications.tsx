import React, { useState, useEffect } from 'react';
import {
  Bell,
  CheckCheck,
  Clock,
  Car,
  CheckCircle2,
  AlertTriangle,
  MessageSquare,
  IndianRupee,
  RefreshCw,
} from 'lucide-react';
import { NotificationItem } from '../../types/owner';
import { ownerService } from '../../services/ownerService';

export const OwnerNotifications: React.FC = () => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadNotifications = async () => {
    setIsLoading(true);
    const data = await ownerService.getNotifications();
    setNotifications(data);
    setIsLoading(false);
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  const handleMarkRead = async (id: string) => {
    await ownerService.markNotificationRead(id);
    loadNotifications();
  };

  const handleMarkAllRead = async () => {
    await ownerService.markAllNotificationsRead();
    loadNotifications();
  };

  const getIcon = (type: NotificationItem['type']) => {
    switch (type) {
      case 'NEW_BOOKING':
        return <Car className="w-4 h-4 text-emerald-600" />;
      case 'PAYMENT':
        return <IndianRupee className="w-4 h-4 text-blue-600" />;
      case 'WHATSAPP':
        return <MessageSquare className="w-4 h-4 text-[#128C7E]" />;
      default:
        return <Bell className="w-4 h-4 text-slate-600" />;
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div className="flex items-center justify-between bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Notification Center</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time alerts for booking requests, chauffeur status, payments and customer communications.
          </p>
        </div>
        <button
          type="button"
          onClick={handleMarkAllRead}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs cursor-pointer"
        >
          <CheckCheck className="w-3.5 h-3.5" />
          <span>Mark All Read</span>
        </button>
      </div>

      {/* List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs divide-y divide-slate-100 overflow-hidden">
        {notifications.length === 0 ? (
          <div className="py-16 text-center text-slate-400 text-xs">
            <Bell className="w-8 h-8 mx-auto mb-2 text-slate-300" />
            <span>No notifications at this time</span>
          </div>
        ) : (
          notifications.map((n) => (
            <div
              key={n.id}
              className={`p-4 flex items-start justify-between gap-3 hover:bg-slate-50/70 transition-colors ${
                !n.read ? 'bg-emerald-50/40' : ''
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center shrink-0 mt-0.5">
                  {getIcon(n.type)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-slate-900">{n.title}</span>
                    {!n.read && (
                      <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>
                    )}
                  </div>
                  <p className="text-xs text-slate-600 mt-0.5">{n.message}</p>
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    {new Date(n.timestamp).toLocaleString()}
                  </span>
                </div>
              </div>

              {!n.read && (
                <button
                  type="button"
                  onClick={() => handleMarkRead(n.id)}
                  className="text-[11px] font-semibold text-emerald-700 hover:text-emerald-800 shrink-0 cursor-pointer"
                >
                  Mark read
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
