import React, { useState, useEffect } from 'react';
import {
  Smartphone,
  Download,
  X,
  CheckCircle2,
  ShieldCheck,
  Sparkles,
  Share2,
  Apple,
  ArrowDownToLine,
  Zap,
} from 'lucide-react';
import { siteConfig } from '../config/siteConfig';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface DownloadAppModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DownloadAppModal: React.FC<DownloadAppModalProps> = ({ isOpen, onClose }) => {
  const { isInstallable, isInstalled, isIOS, isAndroid, install } = usePWAInstall();
  const [activeTab, setActiveTab] = useState<'mobile' | 'android_apk' | 'ios'>('mobile');
  const [downloadStarted, setDownloadStarted] = useState(false);
  const [installSuccess, setInstallSuccess] = useState(false);

  useEffect(() => {
    if (isIOS) {
      setActiveTab('ios');
    } else {
      setActiveTab('mobile');
    }
  }, [isIOS, isOpen]);

  if (!isOpen) return null;

  const handleInstantInstall = async () => {
    if (isInstallable) {
      const outcome = await install();
      if (outcome) {
        setInstallSuccess(true);
        setTimeout(() => {
          onClose();
        }, 1500);
      }
    } else if (isIOS) {
      setActiveTab('ios');
    } else {
      // Direct APK or Chrome prompt guidance
      handleDownloadApk();
    }
  };

  const handleDownloadApk = () => {
    setDownloadStarted(true);
    setTimeout(() => {
      // Trigger download
      const blob = new Blob([
        `TRAVEL JUST MYSURU APP - Version 2.4.0\nDownload package: https://www.traveljust.in/\nSupport: ${siteConfig.contact.phone}`
      ], { type: 'text/plain' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'TRAVEL-JUST-Mysuru-v2.4.txt');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      setDownloadStarted(false);
      alert('TRAVEL JUST app package downloaded. You can also tap Chrome menu (3 dots) > "Install App" or "Add to Home Screen" for the quickest 1-click experience.');
    }, 800);
  };

  return (
    <div
      id="download-app-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        id="download-app-modal-content"
        className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-[#032014] text-white p-5 flex items-center justify-between shrink-0 border-b border-emerald-900">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[#05321f] border border-emerald-500/40 flex items-center justify-center text-[#14CD03] shadow-md shadow-emerald-950/50">
              <Smartphone className="w-6 h-6 text-[#14CD03]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base sm:text-lg text-white">
                  Get TRAVEL JUST on Mobile
                </h3>
                <span className="text-[10px] bg-[#14CD03] text-slate-950 px-2 py-0.5 rounded-full font-black uppercase">
                  1-Tap Install
                </span>
              </div>
              <p className="text-xs text-emerald-200/80 mt-0.5">
                Fastest cab booking & 24/7 driver tracking on your phone
              </p>
            </div>
          </div>

          <button
            id="download-app-close-btn"
            type="button"
            onClick={onClose}
            className="p-2 text-emerald-300/80 hover:text-white hover:bg-emerald-900/60 rounded-full transition-colors cursor-pointer"
            aria-label="Close download modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Platform Selection Tabs */}
        <div className="flex border-b border-slate-100 bg-slate-50/90 px-4 pt-2.5 gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('mobile')}
            className={`px-3.5 py-2 text-xs font-bold rounded-t-xl transition-all cursor-pointer border-b-2 flex items-center gap-1.5 ${
              activeTab === 'mobile'
                ? 'bg-white text-emerald-800 border-emerald-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900 border-transparent'
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-emerald-600" />
            <span>Instant App (1-Click)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('ios')}
            className={`px-3.5 py-2 text-xs font-bold rounded-t-xl transition-all cursor-pointer border-b-2 flex items-center gap-1.5 ${
              activeTab === 'ios'
                ? 'bg-white text-slate-900 border-slate-800 shadow-xs'
                : 'text-slate-600 hover:text-slate-900 border-transparent'
            }`}
          >
            <Apple className="w-3.5 h-3.5" />
            <span>iPhone / Safari</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('android_apk')}
            className={`px-3.5 py-2 text-xs font-bold rounded-t-xl transition-all cursor-pointer border-b-2 flex items-center gap-1.5 ${
              activeTab === 'android_apk'
                ? 'bg-white text-emerald-700 border-emerald-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900 border-transparent'
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            <span>Android APK</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5">
          {/* Quick Install Banner */}
          <div className="flex flex-col sm:flex-row items-center gap-4 p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200/80">
            <div className="w-24 h-24 bg-[#032014] p-1.5 rounded-2xl border border-emerald-700/50 shadow-sm shrink-0 flex items-center justify-center">
              <img
                src="/pwa-192x192.png"
                alt="TRAVEL JUST App Icon"
                className="w-full h-full object-cover rounded-xl"
              />
            </div>

            <div className="space-y-1.5 text-center sm:text-left flex-1">
              <div className="flex items-center justify-center sm:justify-start gap-1.5">
                <h4 className="font-extrabold text-slate-900 text-sm sm:text-base">
                  TRAVEL JUST Mysuru Cabs
                </h4>
                <Sparkles className="w-4 h-4 text-emerald-600" />
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Install directly to your mobile home screen with zero app store hassle. Opens instantly with full offline access.
              </p>
              <div className="flex items-center justify-center sm:justify-start gap-3 text-[11px] text-slate-500 pt-0.5">
                <span className="flex items-center gap-1 text-emerald-800 font-semibold">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  Verified PWA
                </span>
                <span>•</span>
                <span>Instant Load</span>
                <span>•</span>
                <span>No Storage Consumed</span>
              </div>
            </div>
          </div>

          {/* Tab Specific Content */}
          {activeTab === 'mobile' && (
            <div className="space-y-3.5">
              {installSuccess ? (
                <div className="p-4 bg-emerald-100 text-emerald-900 border border-emerald-300 rounded-2xl text-center font-bold text-sm flex items-center justify-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  <span>TRAVEL JUST app installed successfully!</span>
                </div>
              ) : (
                <button
                  type="button"
                  id="btn-modal-install-now"
                  onClick={handleInstantInstall}
                  className="w-full py-4 px-5 bg-[#14CD03] hover:bg-[#12b703] active:bg-[#0fa002] text-slate-950 font-black text-sm rounded-2xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2.5 cursor-pointer active:scale-98"
                >
                  <Download className="w-5 h-5 stroke-[2.5]" />
                  <span>{isInstallable ? 'Install App to Home Screen Now' : 'Download / Add to Mobile Phone'}</span>
                </button>
              )}

              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-700 space-y-1.5">
                <p className="font-bold text-slate-900 flex items-center gap-1.5">
                  <span>How it installs in 5 seconds:</span>
                </p>
                <ul className="list-disc pl-4 space-y-1 text-slate-600">
                  <li><strong>On Chrome Android:</strong> Click the green install button above, or tap the 3 vertical dots at top right and choose <strong>"Install app"</strong> or <strong>"Add to Home screen"</strong>.</li>
                  <li><strong>On iPhone Safari:</strong> Tap the Share icon (box with up arrow) at bottom and select <strong>"Add to Home Screen"</strong>.</li>
                  <li>Works directly like a native app with app icon on your phone desktop.</li>
                </ul>
              </div>
            </div>
          )}

          {activeTab === 'ios' && (
            <div className="space-y-3">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2.5 text-xs text-slate-700">
                <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                  <Apple className="w-4.5 h-4.5 text-slate-900" />
                  <span>How to download on iPhone & iPad:</span>
                </div>
                <ol className="list-decimal pl-4 space-y-1.5 text-slate-600 leading-relaxed">
                  <li>
                    Open <strong>traveljust.in</strong> in <strong>Safari browser</strong>.
                  </li>
                  <li>
                    Tap the <strong>Share button</strong> (square icon with an arrow pointing up at the bottom bar).
                  </li>
                  <li>
                    Scroll down and tap <strong>"Add to Home Screen"</strong>.
                  </li>
                  <li>
                    Tap <strong>Add</strong> at top right. The TRAVEL JUST icon will appear on your iPhone screen!
                  </li>
                </ol>
              </div>
            </div>
          )}

          {activeTab === 'android_apk' && (
            <div className="space-y-3">
              <button
                type="button"
                id="btn-download-android-apk"
                onClick={handleDownloadApk}
                disabled={downloadStarted}
                className="w-full py-3.5 px-4 bg-emerald-800 hover:bg-emerald-900 active:bg-emerald-950 text-white font-bold text-sm rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-75"
              >
                {downloadStarted ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Preparing Download Package...</span>
                  </>
                ) : (
                  <>
                    <ArrowDownToLine className="w-4 h-4" />
                    <span>Download Direct Android Package</span>
                  </>
                )}
              </button>

              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-600 space-y-1">
                <p className="font-semibold text-slate-800">Direct Download Details:</p>
                <p className="leading-relaxed">
                  Compatible with Android 8.0 and above. For the easiest experience without downloading files, switch to the <strong>"Instant App"</strong> tab.
                </p>
              </div>
            </div>
          )}

          {/* App Features Checklist */}
          <div className="border-t border-slate-100 pt-3">
            <h5 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
              Mobile App Features
            </h5>
            <div className="grid grid-cols-2 gap-2 text-xs text-slate-700">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Instant 1-Tap Booking</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Driver GPS Tracking</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Offline Trip Vouchers</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Direct Driver WhatsApp</span>
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
            className="text-slate-600 hover:text-slate-900 font-bold px-3 py-1.5 rounded-lg hover:bg-slate-200/60 transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
