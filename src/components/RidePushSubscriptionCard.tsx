import React, { useState, useEffect } from 'react';
import {
  Bell,
  BellRing,
  BellOff,
  CheckCircle2,
  ShieldCheck,
  Sparkles,
  Car,
  MapPin,
  Flag,
  Receipt,
  Play,
  Settings2,
  Check,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import {
  PushNotificationTopics,
  RidePushSubscription,
  getRidePushSubscription,
  subscribeToRidePushNotifications,
  unsubscribeFromRidePush,
  sendTestRidePushNotification,
  getNotificationPermission,
  isPushNotificationSupported,
} from '../services/pushNotificationService';

interface RidePushSubscriptionCardProps {
  referenceId: string;
  customerPhone?: string;
  customerEmail?: string;
  variant?: 'compact' | 'full';
  className?: string;
}

export const RidePushSubscriptionCard: React.FC<RidePushSubscriptionCardProps> = ({
  referenceId,
  customerPhone,
  customerEmail,
  variant = 'full',
  className = '',
}) => {
  const [isSupported, setIsSupported] = useState<boolean>(true);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [subscription, setSubscription] = useState<RidePushSubscription | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [testingStatus, setTestingStatus] = useState<string | null>(null);
  const [showPreferences, setShowPreferences] = useState<boolean>(false);
  const [testSentNotice, setTestSentNotice] = useState<string | null>(null);

  // Topic preferences state
  const [topics, setTopics] = useState<PushNotificationTopics>({
    driverAssigned: true,
    cabArrived: true,
    tripStarted: true,
    completed: true,
  });

  const loadState = () => {
    setIsSupported(isPushNotificationSupported());
    setPermission(getNotificationPermission());
    const existing = getRidePushSubscription(referenceId);
    setSubscription(existing);
    if (existing?.topics) {
      setTopics(existing.topics);
    }
  };

  useEffect(() => {
    loadState();

    const handleSubscriptionChanged = (e: Event) => {
      const custom = e as CustomEvent<{ referenceId: string; subscription: RidePushSubscription | null }>;
      if (custom.detail && custom.detail.referenceId === referenceId) {
        setSubscription(custom.detail.subscription);
        if (custom.detail.subscription?.topics) {
          setTopics(custom.detail.subscription.topics);
        }
      }
    };

    window.addEventListener('tj:push-subscription-changed', handleSubscriptionChanged);
    return () => {
      window.removeEventListener('tj:push-subscription-changed', handleSubscriptionChanged);
    };
  }, [referenceId]);

  const handleSubscribe = async () => {
    setLoading(true);
    try {
      const res = await subscribeToRidePushNotifications(referenceId, {
        customerPhone,
        customerEmail,
        topics,
      });
      setPermission(res.permission);
      const sub = getRidePushSubscription(referenceId);
      setSubscription(sub);
    } catch (err) {
      console.warn('Subscription failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUnsubscribe = async () => {
    setLoading(true);
    try {
      await unsubscribeFromRidePush(referenceId);
      setSubscription(null);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleTopic = (topicKey: keyof PushNotificationTopics) => {
    const updated = { ...topics, [topicKey]: !topics[topicKey] };
    setTopics(updated);
    if (subscription) {
      subscribeToRidePushNotifications(referenceId, {
        customerPhone,
        customerEmail,
        topics: updated,
      });
    }
  };

  const handleSendTestNotification = async (status: 'Driver Assigned' | 'Cab Arrived' | 'Trip Started' | 'Completed') => {
    setTestingStatus(status);
    setTestSentNotice(null);
    try {
      await sendTestRidePushNotification(referenceId, status);
      setTestSentNotice(`Sent: "${status}" update chime & notification.`);
      setTimeout(() => setTestSentNotice(null), 4000);
    } catch (err) {
      console.warn('Test notification failed:', err);
    } finally {
      setTestingStatus(null);
    }
  };

  const isSubscribed = !!subscription;

  // Compact variant for embedded lists (e.g. My Trips modal)
  if (variant === 'compact') {
    return (
      <div
        id={`push-sub-compact-${referenceId}`}
        className={`bg-slate-50 border border-slate-200 rounded-xl p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 text-xs ${className}`}
      >
        <div className="flex items-center gap-2.5">
          <div
            className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
              isSubscribed
                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                : 'bg-slate-200 text-slate-600'
            }`}
          >
            {isSubscribed ? <BellRing className="w-4 h-4 animate-bounce" /> : <Bell className="w-4 h-4" />}
          </div>
          <div>
            <div className="flex items-center gap-1.5 font-bold text-slate-800">
              <span>Push Updates</span>
              {isSubscribed ? (
                <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded font-semibold flex items-center gap-0.5">
                  <Check className="w-2.5 h-2.5" /> Subscribed
                </span>
              ) : (
                <span className="text-[10px] bg-slate-200 text-slate-600 px-1.5 py-0.2 rounded font-semibold">
                  Off
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500">
              {isSubscribed
                ? 'Alerts for Chauffeur Assigned, Cab Arrived & Trip Progress'
                : 'Receive live alerts when chauffeur is assigned or cab arrives'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
          {isSubscribed ? (
            <>
              <button
                type="button"
                onClick={() => handleSendTestNotification('Cab Arrived')}
                disabled={!!testingStatus}
                className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                title="Test notification"
              >
                <Play className="w-2.5 h-2.5 fill-emerald-800" />
                <span>Test Alert</span>
              </button>
              <button
                type="button"
                onClick={handleUnsubscribe}
                disabled={loading}
                className="text-[11px] text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
              >
                Turn off
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={handleSubscribe}
              disabled={loading}
              className="text-[11px] font-bold text-white bg-emerald-800 hover:bg-emerald-900 px-3 py-1.5 rounded-lg shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Bell className="w-3 h-3" />
              <span>Enable Push</span>
            </button>
          )}
        </div>
      </div>
    );
  }

  // Full Rich Variant (for Booking Confirmation screen)
  return (
    <div
      id={`push-sub-full-${referenceId}`}
      className={`bg-linear-to-br from-emerald-950 via-slate-900 to-slate-900 text-white rounded-2xl p-4 sm:p-5 border border-emerald-500/30 shadow-lg relative overflow-hidden ${className}`}
    >
      {/* Ambient background glow */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative z-10 pb-3 border-b border-slate-800">
        <div className="flex items-start gap-3">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
              isSubscribed
                ? 'bg-emerald-600/20 text-emerald-400 border-emerald-500/40 shadow-xs'
                : 'bg-slate-800 text-slate-400 border-slate-700'
            }`}
          >
            {isSubscribed ? (
              <BellRing className="w-5 h-5 text-emerald-300 animate-pulse" />
            ) : (
              <Bell className="w-5 h-5" />
            )}
          </div>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="text-sm sm:text-base font-bold text-white">
                Live Ride Push Notifications
              </h4>
              {isSubscribed ? (
                <span className="text-[11px] font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  Active for #{referenceId}
                </span>
              ) : (
                <span className="text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-400" />
                  Recommended
                </span>
              )}
            </div>
            <p className="text-xs text-slate-300 mt-0.5 leading-snug">
              Receive real-time instant alerts on your mobile/desktop when your chauffeur is assigned or arrives.
            </p>
          </div>
        </div>

        {/* Action Toggle Button */}
        <div className="shrink-0 self-start sm:self-center">
          {isSubscribed ? (
            <button
              id={`unsubscribe-push-btn-${referenceId}`}
              type="button"
              onClick={handleUnsubscribe}
              disabled={loading}
              className="text-xs font-semibold text-slate-300 hover:text-rose-300 bg-slate-800/80 hover:bg-slate-800 border border-slate-700 px-3 py-1.5 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <BellOff className="w-3.5 h-3.5" />
              <span>Unsubscribe</span>
            </button>
          ) : (
            <button
              id={`subscribe-push-btn-${referenceId}`}
              type="button"
              onClick={handleSubscribe}
              disabled={loading}
              className="text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] border border-emerald-400/40 px-4 py-2 rounded-xl shadow-md hover:shadow-emerald-500/20 transition-all flex items-center gap-2 cursor-pointer"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin text-white" />
              ) : (
                <Bell className="w-4 h-4" />
              )}
              <span>Subscribe to Push Alerts</span>
            </button>
          )}
        </div>
      </div>

      {/* Notice if permission is denied */}
      {permission === 'denied' && (
        <div className="mt-3 p-2.5 rounded-xl bg-amber-950/60 border border-amber-500/30 text-amber-200 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
          <span>
            Notifications are blocked in your browser settings. You can still test in-app alert chimes below.
          </span>
        </div>
      )}

      {/* Confirmation of test sent */}
      {testSentNotice && (
        <div className="mt-3 p-2.5 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-200 text-xs flex items-center gap-2 animate-in fade-in duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{testSentNotice}</span>
        </div>
      )}

      {/* Topics Grid */}
      <div className="mt-3.5 space-y-2 relative z-10">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span className="font-semibold uppercase tracking-wider text-[10px]">
            Notification Updates Covered
          </span>
          <button
            type="button"
            onClick={() => setShowPreferences((p) => !p)}
            className="text-[11px] text-emerald-400 hover:text-emerald-300 flex items-center gap-1 cursor-pointer"
          >
            <Settings2 className="w-3 h-3" />
            <span>{showPreferences ? 'Hide Topics' : 'Customize Topics'}</span>
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
          {/* Topic 1: Driver Assigned */}
          <div
            onClick={() => handleToggleTopic('driverAssigned')}
            className={`p-2.5 rounded-xl border transition-all cursor-pointer select-none ${
              topics.driverAssigned
                ? 'bg-slate-800/80 border-emerald-500/50 text-white'
                : 'bg-slate-900/50 border-slate-800 text-slate-400 opacity-60'
            }`}
          >
            <div className="flex items-center justify-between">
              <Car className="w-4 h-4 text-emerald-400" />
              <input
                type="checkbox"
                checked={topics.driverAssigned}
                onChange={() => {}}
                className="w-3.5 h-3.5 accent-emerald-500 rounded cursor-pointer"
              />
            </div>
            <div className="font-bold text-xs mt-1.5">Driver Assigned</div>
            <div className="text-[10px] text-slate-300 mt-0.5 leading-tight">
              Name, Plate & Phone
            </div>
          </div>

          {/* Topic 2: Cab Arrived */}
          <div
            onClick={() => handleToggleTopic('cabArrived')}
            className={`p-2.5 rounded-xl border transition-all cursor-pointer select-none ${
              topics.cabArrived
                ? 'bg-slate-800/80 border-emerald-500/50 text-white'
                : 'bg-slate-900/50 border-slate-800 text-slate-400 opacity-60'
            }`}
          >
            <div className="flex items-center justify-between">
              <MapPin className="w-4 h-4 text-emerald-400" />
              <input
                type="checkbox"
                checked={topics.cabArrived}
                onChange={() => {}}
                className="w-3.5 h-3.5 accent-emerald-500 rounded cursor-pointer"
              />
            </div>
            <div className="font-bold text-xs mt-1.5">Cab Arrived</div>
            <div className="text-[10px] text-slate-300 mt-0.5 leading-tight">
              At your pickup spot
            </div>
          </div>

          {/* Topic 3: Trip Started */}
          <div
            onClick={() => handleToggleTopic('tripStarted')}
            className={`p-2.5 rounded-xl border transition-all cursor-pointer select-none ${
              topics.tripStarted
                ? 'bg-slate-800/80 border-emerald-500/50 text-white'
                : 'bg-slate-900/50 border-slate-800 text-slate-400 opacity-60'
            }`}
          >
            <div className="flex items-center justify-between">
              <Flag className="w-4 h-4 text-emerald-400" />
              <input
                type="checkbox"
                checked={topics.tripStarted}
                onChange={() => {}}
                className="w-3.5 h-3.5 accent-emerald-500 rounded cursor-pointer"
              />
            </div>
            <div className="font-bold text-xs mt-1.5">Trip Started</div>
            <div className="text-[10px] text-slate-300 mt-0.5 leading-tight">
              Journey underway
            </div>
          </div>

          {/* Topic 4: Trip Completed */}
          <div
            onClick={() => handleToggleTopic('completed')}
            className={`p-2.5 rounded-xl border transition-all cursor-pointer select-none ${
              topics.completed
                ? 'bg-slate-800/80 border-emerald-500/50 text-white'
                : 'bg-slate-900/50 border-slate-800 text-slate-400 opacity-60'
            }`}
          >
            <div className="flex items-center justify-between">
              <Receipt className="w-4 h-4 text-emerald-400" />
              <input
                type="checkbox"
                checked={topics.completed}
                onChange={() => {}}
                className="w-3.5 h-3.5 accent-emerald-500 rounded cursor-pointer"
              />
            </div>
            <div className="font-bold text-xs mt-1.5">Completed</div>
            <div className="text-[10px] text-slate-300 mt-0.5 leading-tight">
              Drop & fare invoice
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Push Simulation Buttons */}
      <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 text-xs relative z-10">
        <div className="flex items-center gap-1.5 text-slate-400 text-[11px]">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span>PWA Service Worker Push Active</span>
        </div>

        <div className="flex items-center gap-2 flex-wrap self-stretch sm:self-auto">
          <span className="text-[11px] text-slate-400">Test Chime & Push:</span>
          <button
            type="button"
            onClick={() => handleSendTestNotification('Driver Assigned')}
            disabled={!!testingStatus}
            className="text-[11px] font-bold text-emerald-300 bg-emerald-900/50 hover:bg-emerald-800/70 border border-emerald-500/40 px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
            title="Test Driver Assigned Push"
          >
            <Car className="w-3 h-3" />
            <span>Driver Assigned</span>
          </button>
          <button
            type="button"
            onClick={() => handleSendTestNotification('Cab Arrived')}
            disabled={!!testingStatus}
            className="text-[11px] font-bold text-amber-300 bg-amber-900/40 hover:bg-amber-800/60 border border-amber-500/40 px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
            title="Test Cab Arrived Push"
          >
            <MapPin className="w-3 h-3" />
            <span>Cab Arrived</span>
          </button>
        </div>
      </div>
    </div>
  );
};
