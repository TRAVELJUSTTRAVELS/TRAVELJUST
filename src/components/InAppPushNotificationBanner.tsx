import React, { useState, useEffect } from 'react';
import {
  BellRing,
  X,
  Car,
  MapPin,
  Flag,
  CheckCircle2,
  ExternalLink,
  ChevronRight,
  Phone,
} from 'lucide-react';
import {
  PushNotificationPayload,
  setupPushNotificationListener,
} from '../services/pushNotificationService';

interface InAppPushNotificationBannerProps {
  onOpenRideDetails?: (referenceId: string) => void;
}

export const InAppPushNotificationBanner: React.FC<InAppPushNotificationBannerProps> = ({
  onOpenRideDetails,
}) => {
  const [activeNotification, setActiveNotification] =
    useState<PushNotificationPayload | null>(null);
  const [visible, setVisible] = useState<boolean>(false);

  useEffect(() => {
    const cleanup = setupPushNotificationListener((notification) => {
      setActiveNotification(notification);
      setVisible(true);

      // Auto-hide after 9 seconds
      const timer = setTimeout(() => {
        setVisible(false);
      }, 9000);

      return () => clearTimeout(timer);
    });

    return () => cleanup();
  }, []);

  if (!visible || !activeNotification) {
    return null;
  }

  const getStatusIcon = (status: string) => {
    if (status.includes('Assigned') || status.includes('Driver')) {
      return <Car className="w-5 h-5 text-emerald-400" />;
    }
    if (status.includes('Arrived')) {
      return <MapPin className="w-5 h-5 text-amber-400" />;
    }
    if (status.includes('Started') || status.includes('Progress')) {
      return <Flag className="w-5 h-5 text-sky-400" />;
    }
    if (status.includes('Completed')) {
      return <CheckCircle2 className="w-5 h-5 text-emerald-300" />;
    }
    return <BellRing className="w-5 h-5 text-emerald-400" />;
  };

  const getBorderColor = (status: string) => {
    if (status.includes('Arrived')) return 'border-amber-500/50 shadow-amber-900/30';
    if (status.includes('Started')) return 'border-sky-500/50 shadow-sky-900/30';
    return 'border-emerald-500/50 shadow-emerald-950/40';
  };

  const driver = activeNotification.driverDetails;

  return (
    <div
      id="in-app-push-banner-container"
      className="fixed top-4 right-4 z-[9999] max-w-sm sm:max-w-md w-full px-3 sm:px-0 pointer-events-auto animate-in slide-in-from-top-4 fade-in duration-300"
      role="alert"
    >
      <div
        className={`bg-slate-900/95 backdrop-blur-md text-white rounded-2xl p-4 border shadow-2xl ${getBorderColor(
          activeNotification.status
        )} relative overflow-hidden`}
      >
        {/* Glow Accent */}
        <div className="absolute top-0 right-0 w-28 h-28 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

        {/* Top Header */}
        <div className="flex items-start justify-between gap-3 relative z-10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0 shadow-xs">
              {getStatusIcon(activeNotification.status)}
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-800 text-emerald-400 px-2 py-0.5 rounded-full border border-slate-700">
                  TRAVEL JUST PUSH
                </span>
                {activeNotification.referenceId && (
                  <span className="text-[10px] font-mono text-slate-400">
                    #{activeNotification.referenceId}
                  </span>
                )}
              </div>
              <h4 className="text-xs sm:text-sm font-extrabold text-white mt-0.5">
                {activeNotification.title}
              </h4>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setVisible(false)}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Dismiss notification"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body Message */}
        <p className="text-xs text-slate-300 mt-2 leading-relaxed pl-10 relative z-10">
          {activeNotification.body}
        </p>

        {/* Driver Quick Badge if available */}
        {driver?.driverName && (
          <div className="mt-2.5 ml-10 p-2 rounded-xl bg-slate-800/80 border border-slate-700/80 text-xs flex items-center justify-between gap-2 relative z-10">
            <div>
              <span className="text-[11px] font-bold text-slate-200 block">
                {driver.driverName}
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                {driver.driverVehiclePlate || 'Cab Assigned'}
              </span>
            </div>
            {driver.driverPhone && (
              <a
                href={`tel:${driver.driverPhone}`}
                className="text-[11px] text-emerald-400 hover:text-emerald-300 flex items-center gap-1 bg-emerald-950/60 px-2 py-1 rounded-lg border border-emerald-500/30"
              >
                <Phone className="w-3 h-3" />
                <span>Call</span>
              </a>
            )}
          </div>
        )}

        {/* Footer Actions */}
        <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-xs relative z-10">
          <span className="text-[10px] text-slate-400">Just now</span>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setVisible(false)}
              className="text-[11px] text-slate-400 hover:text-white px-2 py-1 transition-colors cursor-pointer"
            >
              Dismiss
            </button>

            {onOpenRideDetails && (
              <button
                type="button"
                onClick={() => {
                  setVisible(false);
                  onOpenRideDetails(activeNotification.referenceId);
                }}
                className="text-[11px] font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 bg-emerald-950/60 hover:bg-emerald-900/60 border border-emerald-500/30 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
              >
                <span>Track Ride</span>
                <ChevronRight className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
