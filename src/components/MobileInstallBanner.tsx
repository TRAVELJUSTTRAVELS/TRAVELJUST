import React, { useState, useEffect } from 'react';
import { Download, Smartphone, X, Apple, Check, Share } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface MobileInstallBannerProps {
  onOpenDetailedModal?: () => void;
}

export const MobileInstallBanner: React.FC<MobileInstallBannerProps> = ({ onOpenDetailedModal }) => {
  const { isInstalled, isInstallable, isIOS, isAndroid, install } = usePWAInstall();
  const [dismissed, setDismissed] = useState(false);
  const [showIOSPrompt, setShowIOSPrompt] = useState(false);

  useEffect(() => {
    // Check if user dismissed today
    const lastDismissed = localStorage.getItem('tj_pwa_banner_dismissed');
    if (lastDismissed) {
      const parsedTime = parseInt(lastDismissed, 10);
      // Suppress for 6 hours after dismiss
      if (Date.now() - parsedTime < 6 * 60 * 60 * 1000) {
        setDismissed(true);
      }
    }
  }, []);

  if (isInstalled || dismissed) {
    return null;
  }

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem('tj_pwa_banner_dismissed', Date.now().toString());
  };

  const handleInstallClick = async () => {
    if (isInstallable) {
      const success = await install();
      if (success) {
        setDismissed(true);
      }
    } else if (isIOS) {
      setShowIOSPrompt(true);
    } else if (onOpenDetailedModal) {
      onOpenDetailedModal();
    }
  };

  return (
    <>
      {/* Floating Bottom App Download Bar for Mobile */}
      <div
        id="mobile-install-banner"
        className="fixed bottom-3 left-3 right-3 z-45 sm:max-w-md sm:left-auto sm:right-4 bg-[#032014] text-white p-3 rounded-2xl shadow-2xl border border-emerald-700/60 backdrop-blur-md animate-in slide-in-from-bottom-3 duration-300"
      >
        <div className="flex items-center gap-3">
          {/* App Icon */}
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-700 to-emerald-950 border border-emerald-500/50 p-1 flex items-center justify-center shrink-0 shadow-sm">
            <img
              src="/pwa-192x192.png"
              alt="TRAVEL JUST"
              className="w-full h-full object-cover rounded-lg"
              onError={(e) => {
                // Fallback icon
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          </div>

          {/* Text Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-sm text-white truncate">
                TRAVEL JUST App
              </span>
              <span className="text-[9px] font-black bg-[#14CD03] text-slate-950 px-1.5 py-0.2 rounded tracking-wide">
                FASTEST
              </span>
            </div>
            <p className="text-[11px] text-emerald-200/80 truncate">
              Install for instant 1-tap booking & live cabs
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              id="banner-install-app-btn"
              type="button"
              onClick={handleInstallClick}
              className="flex items-center gap-1.5 bg-[#14CD03] hover:bg-[#12b703] active:bg-[#0fa002] text-slate-950 font-black text-xs px-3.5 py-2 rounded-xl shadow-md transition-all active:scale-95 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Install</span>
            </button>

            <button
              id="banner-close-btn"
              type="button"
              onClick={handleDismiss}
              className="p-1.5 text-emerald-300/70 hover:text-white rounded-lg hover:bg-emerald-900/50 transition-colors"
              aria-label="Dismiss app install banner"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* iOS Safari Guided Install Sheet */}
      {showIOSPrompt && (
        <div
          id="ios-install-modal-backdrop"
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in"
          onClick={() => setShowIOSPrompt(false)}
        >
          <div
            id="ios-install-modal-card"
            className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl text-slate-900 space-y-4 animate-in slide-in-from-bottom-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center">
                  <Apple className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-extrabold text-base text-slate-900">Install on iPhone</h4>
                  <p className="text-xs text-slate-500">Fast 2-step setup</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowIOSPrompt(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-700 bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center shrink-0 text-xs">
                  1
                </div>
                <p className="leading-relaxed pt-0.5">
                  Tap the Safari <strong>Share button</strong>{' '}
                  <span className="inline-block p-1 bg-white rounded border border-slate-200 align-middle">
                    <Share className="w-3.5 h-3.5 text-blue-600 inline" />
                  </span>{' '}
                  at the bottom bar.
                </p>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center shrink-0 text-xs">
                  2
                </div>
                <p className="leading-relaxed pt-0.5">
                  Scroll down and tap <strong>"Add to Home Screen"</strong> with the plus (+) icon.
                </p>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center shrink-0 text-xs">
                  3
                </div>
                <p className="leading-relaxed pt-0.5">
                  Tap <strong>Add</strong> in the top right. TRAVEL JUST icon is now on your home screen!
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowIOSPrompt(false)}
              className="w-full py-3 bg-[#032014] text-white font-bold text-xs rounded-xl hover:bg-emerald-950 transition-colors"
            >
              Got it, Done!
            </button>
          </div>
        </div>
      )}
    </>
  );
};
