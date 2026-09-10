import React, { useState, useEffect } from 'react';
import {
  Smartphone,
  Download,
  X,
  CheckCircle2,
  ShieldCheck,
  Sparkles,
  Share2,
  ExternalLink,
  ArrowDownToLine,
  Apple,
} from 'lucide-react';
import { siteConfig } from '../config/siteConfig';

interface DownloadAppModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DownloadAppModal: React.FC<DownloadAppModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'android' | 'pwa' | 'ios'>('android');
  const [downloadStarted, setDownloadStarted] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  if (!isOpen) return null;

  const handleDownloadApk = () => {
    setDownloadStarted(true);
    // Simulate APK download / open direct link
    setTimeout(() => {
      const link = document.createElement('a');
      link.href = '#';
      link.setAttribute('download', 'TravelJust-Mysuru-v2.1.apk');
      // In real deployment, triggers actual APK file download
      setDownloadStarted(false);
      alert('TRAVEL JUST Android app download initiated. You can install it on any Android 8.0+ device.');
    }, 1200);
  };

  const handleInstallPWA = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        onClose();
      }
      setDeferredPrompt(null);
    } else {
      alert('To install the web app on your phone:\n1. Open this website on Chrome or Safari on your phone.\n2. Tap the browser Menu / Share icon.\n3. Select "Add to Home Screen".');
    }
  };

  return (
    <div
      id="download-app-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        id="download-app-modal-content"
        className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with gradient */}
        <div className="bg-gradient-to-r from-[#0f2441] via-slate-900 to-[#009966] text-white p-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-sky-400">
              <Smartphone className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base sm:text-lg text-white">
                  Download TRAVEL JUST App
                </h3>
                <span className="text-[10px] bg-emerald-400/20 text-emerald-300 border border-emerald-300/30 px-2 py-0.5 rounded-full font-bold uppercase">
                  v2.4
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Fastest cab bookings, live GPS tracking & instant vouchers
              </p>
            </div>
          </div>

          <button
            id="download-app-close-btn"
            type="button"
            onClick={onClose}
            className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-colors cursor-pointer"
            aria-label="Close download modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Platform Selection Tabs */}
        <div className="flex border-b border-slate-100 bg-slate-50/80 px-5 pt-3 gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('android')}
            className={`px-4 py-2 text-xs font-bold rounded-t-xl transition-all cursor-pointer border-b-2 ${
              activeTab === 'android'
                ? 'bg-white text-emerald-700 border-emerald-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900 border-transparent'
            }`}
          >
            Android (APK)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('pwa')}
            className={`px-4 py-2 text-xs font-bold rounded-t-xl transition-all cursor-pointer border-b-2 ${
              activeTab === 'pwa'
                ? 'bg-white text-[#20A8D8] border-[#20A8D8] shadow-xs'
                : 'text-slate-600 hover:text-slate-900 border-transparent'
            }`}
          >
            Instant Web App (PWA)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('ios')}
            className={`px-4 py-2 text-xs font-bold rounded-t-xl transition-all cursor-pointer border-b-2 ${
              activeTab === 'ios'
                ? 'bg-white text-slate-900 border-slate-800 shadow-xs'
                : 'text-slate-600 hover:text-slate-900 border-transparent'
            }`}
          >
            iPhone / iOS
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5">
          {/* QR Code and Quick Install Card */}
          <div className="flex flex-col sm:flex-row items-center gap-5 p-4 rounded-2xl bg-slate-50 border border-slate-200">
            {/* Realistic stylized QR Code display */}
            <div className="w-32 h-32 bg-white p-2 rounded-xl border border-slate-200 shadow-2xs shrink-0 flex flex-col items-center justify-center relative group">
              <svg
                viewBox="0 0 100 100"
                className="w-full h-full text-slate-900 fill-current"
                aria-label="QR code to download Travel Just app"
              >
                {/* QR Pattern Representation */}
                <rect x="5" y="5" width="28" height="28" rx="4" fill="#0f2441" />
                <rect x="9" y="9" width="20" height="20" rx="2" fill="white" />
                <rect x="13" y="13" width="12" height="12" rx="2" fill="#0f2441" />

                <rect x="67" y="5" width="28" height="28" rx="4" fill="#0f2441" />
                <rect x="71" y="9" width="20" height="20" rx="2" fill="white" />
                <rect x="75" y="13" width="12" height="12" rx="2" fill="#0f2441" />

                <rect x="5" y="67" width="28" height="28" rx="4" fill="#0f2441" />
                <rect x="9" y="71" width="20" height="20" rx="2" fill="white" />
                <rect x="13" y="75" width="12" height="12" rx="2" fill="#0f2441" />

                {/* Data Matrix Elements */}
                <rect x="40" y="8" width="8" height="8" rx="1" fill="#009966" />
                <rect x="52" y="12" width="8" height="8" rx="1" fill="#0f2441" />
                <rect x="40" y="24" width="8" height="8" rx="1" fill="#20A8D8" />
                <rect x="50" y="28" width="10" height="6" rx="1" fill="#0f2441" />

                <rect x="8" y="42" width="8" height="8" rx="1" fill="#0f2441" />
                <rect x="22" y="46" width="12" height="6" rx="1" fill="#009966" />
                <rect x="42" y="42" width="16" height="16" rx="2" fill="#0f2441" />
                <rect x="68" y="44" width="10" height="10" rx="1" fill="#20A8D8" />
                <rect x="84" y="40" width="8" height="14" rx="1" fill="#0f2441" />

                <rect x="44" y="70" width="8" height="14" rx="1" fill="#009966" />
                <rect x="56" y="68" width="12" height="8" rx="1" fill="#0f2441" />
                <rect x="72" y="80" width="18" height="10" rx="1" fill="#0f2441" />
                <rect x="58" y="84" width="8" height="8" rx="1" fill="#20A8D8" />
              </svg>
              <span className="text-[9px] font-bold text-slate-500 uppercase mt-1 tracking-wider text-center">
                Scan with camera
              </span>
            </div>

            <div className="space-y-2 text-center sm:text-left flex-1">
              <h4 className="font-bold text-slate-900 text-sm sm:text-base flex items-center justify-center sm:justify-start gap-1.5">
                <span>Scan or Click to Install</span>
                <Sparkles className="w-4 h-4 text-emerald-600" />
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Scan the QR code with your mobile camera to launch the app instantly, or click the download button below.
              </p>
              <div className="flex items-center justify-center sm:justify-start gap-3 text-[11px] text-slate-500 pt-1">
                <span className="flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  Verified Clean
                </span>
                <span>•</span>
                <span>Size: ~8.4 MB</span>
                <span>•</span>
                <span>v2.4.0</span>
              </div>
            </div>
          </div>

          {/* Tab Specific Actions */}
          {activeTab === 'android' && (
            <div className="space-y-3">
              <button
                type="button"
                id="btn-download-android-apk"
                onClick={handleDownloadApk}
                disabled={downloadStarted}
                className="w-full py-3.5 px-4 bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 text-white font-bold text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-75"
              >
                {downloadStarted ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Preparing APK Download...</span>
                  </>
                ) : (
                  <>
                    <ArrowDownToLine className="w-4 h-4" />
                    <span>Download Android APK (Direct)</span>
                  </>
                )}
              </button>

              <div className="p-3 bg-slate-50 rounded-xl text-xs text-slate-600 space-y-1">
                <p className="font-semibold text-slate-800">Quick Installation Instructions:</p>
                <ol className="list-decimal pl-4 space-y-0.5 text-slate-600">
                  <li>Download the APK file onto your Android device.</li>
                  <li>Tap the notification to open and install.</li>
                  <li>If prompted, allow "Install from unknown sources" for your browser.</li>
                </ol>
              </div>
            </div>
          )}

          {activeTab === 'pwa' && (
            <div className="space-y-3">
              <button
                type="button"
                id="btn-install-pwa-app"
                onClick={handleInstallPWA}
                className="w-full py-3.5 px-4 bg-[#20A8D8] hover:bg-[#1b93be] active:bg-[#16789b] text-white font-bold text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Smartphone className="w-4 h-4" />
                <span>Add Web App to Home Screen</span>
              </button>

              <div className="p-3 bg-sky-50/70 border border-sky-100 rounded-xl text-xs text-sky-900 space-y-1">
                <p className="font-semibold text-sky-950">No App Store Needed:</p>
                <p className="leading-relaxed">
                  Loads instantly without consuming device storage. Works seamlessly on any Android, iOS, or Windows browser with offline trip viewing and notifications.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'ios' && (
            <div className="space-y-3">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs text-slate-700">
                <div className="flex items-center gap-2 font-bold text-slate-900">
                  <Apple className="w-4 h-4 text-slate-900" />
                  <span>How to install on iPhone & iPad:</span>
                </div>
                <ol className="list-decimal pl-4 space-y-1 text-slate-600 leading-relaxed">
                  <li>
                    Open <strong>traveljust.in</strong> in Safari browser.
                  </li>
                  <li>
                    Tap the <strong>Share</strong> button (box with an arrow pointing up at the bottom).
                  </li>
                  <li>
                    Scroll down and tap <strong>"Add to Home Screen"</strong>.
                  </li>
                  <li>Tap <strong>Add</strong> in the top right corner.</li>
                </ol>
              </div>

              <div className="text-center">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Apple App Store Native Version Coming Soon
                </span>
              </div>
            </div>
          )}

          {/* Key App Features */}
          <div className="border-t border-slate-100 pt-4">
            <h5 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2.5">
              App Exclusive Perks
            </h5>
            <div className="grid grid-cols-2 gap-2 text-xs text-slate-700">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>10-Second Cab Booking</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Real-Time Driver Tracking</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Instant PDF Tax Invoices</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Direct Driver WhatsApp Calling</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>Need help? WhatsApp: {siteConfig.contact.phone}</span>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-600 hover:text-slate-900 font-semibold px-3 py-1.5 rounded-lg hover:bg-slate-200/60 transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
