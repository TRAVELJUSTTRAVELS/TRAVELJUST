import React, { useState, useEffect } from 'react';
import { WifiOff, Phone, X } from 'lucide-react';
import { siteConfig } from '../config/siteConfig';

export const OfflineIndicator: React.FC = () => {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      setDismissed(false);
    };
    const handleOffline = () => {
      setIsOffline(true);
      setDismissed(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!isOffline || dismissed) return null;

  return (
    <aside
      id="pwa-offline-notification-banner"
      role="status"
      aria-live="polite"
      className="fixed top-0 left-0 right-0 z-50 bg-amber-500 text-slate-950 px-4 py-2 text-xs font-bold shadow-md flex items-center justify-between"
    >
      <div className="max-w-7xl mx-auto flex items-center gap-2 flex-1 justify-center">
        <WifiOff className="w-4 h-4 shrink-0 text-slate-950" />
        <span>
          Offline Mode Active • Saved routes and pricing available. For immediate offline booking, call:
        </span>
        <a
          href={`tel:${siteConfig.contact.phone.replace(/\s+/g, '')}`}
          className="inline-flex items-center gap-1 bg-slate-950 text-amber-400 px-2 py-0.5 rounded-full hover:bg-slate-900 transition-colors"
        >
          <Phone className="w-3 h-3" />
          <span>{siteConfig.contact.phone}</span>
        </a>
      </div>
      <button
        type="button"
        onClick={() => setDismissed(true)}
        className="p-1 hover:bg-amber-600 rounded text-slate-950 cursor-pointer"
        aria-label="Dismiss offline banner"
      >
        <X className="w-4 h-4" />
      </button>
    </aside>
  );
};
