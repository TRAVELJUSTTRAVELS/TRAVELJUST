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
  Tablet,
  Monitor,
  QrCode,
  Check,
  Compass,
  Bell,
  Wifi,
  ExternalLink,
} from 'lucide-react';
import { siteConfig } from '../config/siteConfig';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface DownloadAppModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DownloadAppModal: React.FC<DownloadAppModalProps> = ({ isOpen, onClose }) => {
  const {
    isInstallable,
    isInstalled,
    isIOS,
    isAndroid,
    isTablet,
    isDesktop,
    platformName,
    install,
  } = usePWAInstall();

  const [activeTab, setActiveTab] = useState<'android' | 'ios' | 'tablet' | 'desktop' | 'qr'>('android');
  const [downloadStarted, setDownloadStarted] = useState(false);
  const [installSuccess, setInstallSuccess] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    if (isTablet) {
      setActiveTab('tablet');
    } else if (isIOS) {
      setActiveTab('ios');
    } else if (isAndroid) {
      setActiveTab('android');
    } else if (isDesktop) {
      setActiveTab('desktop');
    } else {
      setActiveTab('android');
    }
  }, [isOpen, isTablet, isIOS, isAndroid, isDesktop]);

  if (!isOpen) return null;

  const handleInstantInstall = async () => {
    if (isInstallable) {
      const outcome = await install();
      if (outcome) {
        setInstallSuccess(true);
        setTimeout(() => {
          onClose();
        }, 1800);
      }
    } else if (isIOS) {
      setActiveTab('ios');
    } else {
      handleDownloadApk();
    }
  };

  const handleDownloadApk = () => {
    setDownloadStarted(true);
    setTimeout(() => {
      const blob = new Blob(
        [
          `TRAVEL JUST MYSURU APP - Version 2.5.0\n` +
          `Official PWA & Mobile Package: ${siteConfig.siteUrl}\n` +
          `Support 24/7: ${siteConfig.contact.phone}\n` +
          `WhatsApp: ${siteConfig.contact.whatsapp}\n\n` +
          `How to install on Android:\n` +
          `1. Open ${siteConfig.siteUrl} in Chrome\n` +
          `2. Tap 3 dots at top right > "Install App" or "Add to Home Screen"\n` +
          `3. Enjoy instant taxi booking with live driver tracking!`
        ],
        { type: 'text/plain' }
      );
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'TRAVEL-JUST-Mysuru-v2.5.txt');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      setDownloadStarted(false);
    }, 600);
  };

  const handleCopyLink = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(siteConfig.siteUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  return (
    <div
      id="download-app-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        id="download-app-modal-content"
        className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-[#032014] text-white p-4 sm:p-5 flex items-center justify-between shrink-0 border-b border-emerald-900">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[#05321f] border border-emerald-500/40 flex items-center justify-center text-[#14CD03] shadow-md shadow-emerald-950/50 shrink-0">
              <Smartphone className="w-6 h-6 text-[#14CD03]" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-extrabold text-base sm:text-lg text-white">
                  TRAVEL JUST Omni-App
                </h3>
                <span className="text-[10px] bg-[#14CD03] text-slate-950 px-2 py-0.5 rounded-full font-black uppercase tracking-wide">
                  Universal App
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-emerald-200/90 mt-0.5">
                <span>Optimized for Android, iOS, Tablets & Web</span>
                <span className="text-emerald-400">•</span>
                <span className="bg-emerald-900/80 text-emerald-300 px-1.5 py-0.5 rounded text-[10px] font-bold">
                  {platformName}
                </span>
              </div>
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

        {/* Platform Selection Navigation Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-50/90 px-3 pt-2 gap-1.5 overflow-x-auto scrollbar-none">
          {/* Android */}
          <button
            type="button"
            onClick={() => setActiveTab('android')}
            className={`px-3 py-2 text-xs font-bold rounded-t-xl transition-all cursor-pointer border-b-2 flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'android'
                ? 'bg-white text-emerald-800 border-emerald-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900 border-transparent'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5 text-emerald-600" />
            <span>Android App</span>
            {isAndroid && !isTablet && (
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            )}
          </button>

          {/* iOS / iPhone */}
          <button
            type="button"
            onClick={() => setActiveTab('ios')}
            className={`px-3 py-2 text-xs font-bold rounded-t-xl transition-all cursor-pointer border-b-2 flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'ios'
                ? 'bg-white text-slate-900 border-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900 border-transparent'
            }`}
          >
            <Apple className="w-3.5 h-3.5" />
            <span>iPhone / iOS</span>
            {isIOS && !isTablet && (
              <span className="w-1.5 h-1.5 rounded-full bg-slate-900" />
            )}
          </button>

          {/* Tablet (iPad & Android Tablets) */}
          <button
            type="button"
            onClick={() => setActiveTab('tablet')}
            className={`px-3 py-2 text-xs font-bold rounded-t-xl transition-all cursor-pointer border-b-2 flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'tablet'
                ? 'bg-white text-emerald-800 border-emerald-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900 border-transparent'
            }`}
          >
            <Tablet className="w-3.5 h-3.5 text-emerald-600" />
            <span>iPad & Tablets</span>
            {isTablet && (
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            )}
          </button>

          {/* Desktop & Web */}
          <button
            type="button"
            onClick={() => setActiveTab('desktop')}
            className={`px-3 py-2 text-xs font-bold rounded-t-xl transition-all cursor-pointer border-b-2 flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'desktop'
                ? 'bg-white text-slate-800 border-slate-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900 border-transparent'
            }`}
          >
            <Monitor className="w-3.5 h-3.5" />
            <span>Desktop Web</span>
          </button>

          {/* QR Code */}
          <button
            type="button"
            onClick={() => setActiveTab('qr')}
            className={`px-3 py-2 text-xs font-bold rounded-t-xl transition-all cursor-pointer border-b-2 flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'qr'
                ? 'bg-white text-emerald-800 border-emerald-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900 border-transparent'
            }`}
          >
            <QrCode className="w-3.5 h-3.5 text-emerald-600" />
            <span>Scan QR</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4">
          {/* Universal Verified PWA Banner */}
          <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-emerald-50/80 border border-emerald-200/90">
            <div className="w-14 h-14 bg-[#032014] p-1 rounded-xl border border-emerald-700/50 shadow-xs shrink-0 flex items-center justify-center">
              <img
                src="/pwa-192x192.png"
                alt="TRAVEL JUST App Icon"
                className="w-full h-full object-cover rounded-lg"
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <h4 className="font-extrabold text-slate-900 text-sm truncate">
                  TRAVEL JUST Mysuru Cabs
                </h4>
                <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
              </div>
              <p className="text-xs text-slate-600 truncate">
                Zero app store downloads • Instant 1-tap booking • Real-time GPS fares
              </p>
              <div className="flex items-center gap-2 text-[10px] text-slate-500 font-medium pt-1">
                <span className="text-emerald-700 font-bold flex items-center gap-0.5">
                  <ShieldCheck className="w-3 h-3 text-emerald-600" />
                  Official PWA
                </span>
                <span>•</span>
                <span>Works Offline</span>
                <span>•</span>
                <span>Zero Storage Bloat</span>
              </div>
            </div>
          </div>

          {/* TAB 1: ANDROID APP */}
          {activeTab === 'android' && (
            <div className="space-y-3.5">
              {installSuccess ? (
                <div className="p-4 bg-emerald-100 text-emerald-900 border border-emerald-300 rounded-2xl text-center font-bold text-sm flex items-center justify-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  <span>TRAVEL JUST App Installed to your Android device!</span>
                </div>
              ) : (
                <button
                  type="button"
                  id="btn-android-install-now"
                  onClick={handleInstantInstall}
                  className="w-full py-3.5 px-4 bg-[#14CD03] hover:bg-[#12b703] active:bg-[#0fa002] text-slate-950 font-black text-sm rounded-2xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                >
                  <Download className="w-4 h-4 stroke-[2.5]" />
                  <span>{isInstallable ? 'Install Android App Now (1-Tap)' : 'Add TRAVEL JUST to Android Home Screen'}</span>
                </button>
              )}

              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-700 space-y-2">
                <p className="font-bold text-slate-900 flex items-center gap-1.5">
                  <Smartphone className="w-4 h-4 text-emerald-600" />
                  <span>How to install on Chrome or Samsung Internet:</span>
                </p>
                <ol className="list-decimal pl-4 space-y-1 text-slate-600">
                  <li>Tap the green <strong>"Install Android App"</strong> button above.</li>
                  <li>Or tap the <strong>3 vertical dots</strong> (menu) in Chrome at top right.</li>
                  <li>Select <strong>"Install App"</strong> or <strong>"Add to Home screen"</strong>.</li>
                  <li>A native icon appears on your home screen and app drawer with instant launch!</li>
                </ol>
              </div>

              <div className="flex items-center justify-between p-3 bg-emerald-950 text-white rounded-2xl text-xs">
                <div className="flex items-center gap-2">
                  <ArrowDownToLine className="w-4 h-4 text-[#14CD03]" />
                  <span>Prefer direct offline package?</span>
                </div>
                <button
                  type="button"
                  onClick={handleDownloadApk}
                  disabled={downloadStarted}
                  className="bg-emerald-800 hover:bg-emerald-700 px-3 py-1.5 rounded-xl font-bold text-emerald-200 hover:text-white text-xs cursor-pointer transition-colors"
                >
                  {downloadStarted ? 'Downloading...' : 'Get Package'}
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: IOS / IPHONE */}
          {activeTab === 'ios' && (
            <div className="space-y-3.5">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3 text-xs text-slate-700">
                <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                  <Apple className="w-4.5 h-4.5 text-slate-900" />
                  <span>Install on iPhone in 3 simple steps:</span>
                </div>
                <div className="space-y-2.5">
                  <div className="flex items-start gap-2.5 p-2 rounded-xl bg-white border border-slate-200/80">
                    <span className="w-5 h-5 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-[11px] shrink-0">1</span>
                    <p className="text-slate-700 leading-relaxed">
                      Open <strong>traveljust.in</strong> in <strong>Safari</strong> on your iPhone.
                    </p>
                  </div>
                  <div className="flex items-start gap-2.5 p-2 rounded-xl bg-white border border-slate-200/80">
                    <span className="w-5 h-5 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-[11px] shrink-0">2</span>
                    <p className="text-slate-700 leading-relaxed">
                      Tap the <strong>Share</strong> button <Share2 className="w-3.5 h-3.5 inline text-blue-600 mx-1" /> at the bottom of the screen.
                    </p>
                  </div>
                  <div className="flex items-start gap-2.5 p-2 rounded-xl bg-white border border-slate-200/80">
                    <span className="w-5 h-5 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-[11px] shrink-0">3</span>
                    <p className="text-slate-700 leading-relaxed">
                      Scroll down and tap <strong>"Add to Home Screen"</strong>, then tap <strong>Add</strong> at top right.
                    </p>
                  </div>
                </div>
                <p className="text-[11px] text-slate-500 pt-1">
                  Once added, TRAVEL JUST opens in standalone full-screen mode like a native iOS app from the App Store.
                </p>
              </div>
            </div>
          )}

          {/* TAB 3: TABLET (iPAD & ANDROID TABLETS) */}
          {activeTab === 'tablet' && (
            <div className="space-y-3.5">
              <div className="p-4 bg-emerald-50/70 border border-emerald-200/80 rounded-2xl space-y-2 text-xs">
                <div className="flex items-center gap-2 font-bold text-emerald-950 text-sm">
                  <Tablet className="w-4 h-4 text-emerald-700" />
                  <span>Optimized for iPad & Android Tablet Displays</span>
                </div>
                <p className="text-slate-700 leading-relaxed">
                  TRAVEL JUST is engineered to take advantage of larger tablet screens in both landscape and portrait orientations:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  <div className="p-2.5 bg-white rounded-xl border border-emerald-100 flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span className="text-slate-700">Multi-column vehicle comparisons with instant fare previews</span>
                  </div>
                  <div className="p-2.5 bg-white rounded-xl border border-emerald-100 flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span className="text-slate-700">Split-screen multitasking support (Stage Manager & Split View)</span>
                  </div>
                  <div className="p-2.5 bg-white rounded-xl border border-emerald-100 flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span className="text-slate-700">Comfortable touch targets for rapid route entry and booking</span>
                  </div>
                  <div className="p-2.5 bg-white rounded-xl border border-emerald-100 flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span className="text-slate-700">High DPI retina rendering for crystal clear map and route graphics</span>
                  </div>
                </div>
              </div>

              {isInstallable && (
                <button
                  type="button"
                  onClick={handleInstantInstall}
                  className="w-full py-3 px-4 bg-[#14CD03] hover:bg-[#12b703] text-slate-950 font-black text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Install Tablet App to Home Screen</span>
                </button>
              )}
            </div>
          )}

          {/* TAB 4: DESKTOP & WEB */}
          {activeTab === 'desktop' && (
            <div className="space-y-3.5">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2 text-xs text-slate-700">
                <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                  <Monitor className="w-4 h-4 text-slate-800" />
                  <span>Install on Windows PC, Mac or Chromebook</span>
                </div>
                <p className="text-slate-600 leading-relaxed">
                  Install TRAVEL JUST as a standalone desktop application in Google Chrome or Microsoft Edge:
                </p>
                <div className="space-y-1.5 pl-2 text-slate-700 font-medium">
                  <p>1. Look for the <strong>Install</strong> icon <Download className="w-3.5 h-3.5 inline mx-1 text-emerald-600" /> in the browser address bar (right side).</p>
                  <p>2. Click <strong>Install</strong> to launch TRAVEL JUST in its own dedicated, fast desktop window.</p>
                  <p>3. Pin it to your Windows Taskbar or macOS Dock for 1-click launch anytime.</p>
                </div>
              </div>

              {isInstallable && (
                <button
                  type="button"
                  onClick={handleInstantInstall}
                  className="w-full py-3 px-4 bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Install Desktop App</span>
                </button>
              )}
            </div>
          )}

          {/* TAB 5: SCAN QR CODE */}
          {activeTab === 'qr' && (
            <div className="space-y-3 text-center">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col items-center space-y-3">
                <div className="p-3 bg-white rounded-2xl shadow-sm border border-slate-200 inline-block">
                  {/* Clean SVG QR Code Representation */}
                  <svg
                    className="w-40 h-40"
                    viewBox="0 0 100 100"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    {/* Background */}
                    <rect width="100" height="100" fill="white" rx="4" />
                    {/* Corner 1 */}
                    <rect x="10" y="10" width="26" height="26" rx="3" fill="#032014" />
                    <rect x="14" y="14" width="18" height="18" rx="2" fill="white" />
                    <rect x="18" y="18" width="10" height="10" rx="1" fill="#032014" />
                    {/* Corner 2 */}
                    <rect x="64" y="10" width="26" height="26" rx="3" fill="#032014" />
                    <rect x="68" y="14" width="18" height="18" rx="2" fill="white" />
                    <rect x="72" y="18" width="10" height="10" rx="1" fill="#032014" />
                    {/* Corner 3 */}
                    <rect x="10" y="64" width="26" height="26" rx="3" fill="#032014" />
                    <rect x="14" y="68" width="18" height="18" rx="2" fill="white" />
                    <rect x="18" y="72" width="10" height="10" rx="1" fill="#032014" />
                    {/* Data Pattern */}
                    <rect x="42" y="12" width="6" height="6" fill="#14CD03" />
                    <rect x="52" y="12" width="6" height="6" fill="#032014" />
                    <rect x="42" y="24" width="6" height="6" fill="#032014" />
                    <rect x="52" y="24" width="6" height="6" fill="#14CD03" />
                    <rect x="12" y="42" width="6" height="6" fill="#032014" />
                    <rect x="24" y="42" width="6" height="6" fill="#14CD03" />
                    <rect x="42" y="42" width="16" height="16" rx="2" fill="#032014" />
                    <rect x="46" y="46" width="8" height="8" rx="1" fill="#14CD03" />
                    <rect x="64" y="42" width="6" height="6" fill="#032014" />
                    <rect x="76" y="42" width="6" height="6" fill="#14CD03" />
                    <rect x="88" y="42" width="6" height="6" fill="#032014" />
                    <rect x="42" y="64" width="6" height="6" fill="#14CD03" />
                    <rect x="52" y="64" width="6" height="6" fill="#032014" />
                    <rect x="64" y="64" width="6" height="6" fill="#032014" />
                    <rect x="76" y="64" width="6" height="6" fill="#14CD03" />
                    <rect x="42" y="76" width="6" height="6" fill="#032014" />
                    <rect x="52" y="76" width="6" height="6" fill="#14CD03" />
                    <rect x="64" y="76" width="6" height="6" fill="#14CD03" />
                    <rect x="76" y="76" width="6" height="6" fill="#032014" />
                    <rect x="88" y="76" width="6" height="6" fill="#14CD03" />
                  </svg>
                </div>
                <div className="space-y-1">
                  <p className="font-bold text-slate-900 text-xs">
                    Scan with any smartphone or tablet camera
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Instantly opens TRAVEL JUST on your Android phone, iPhone, or iPad
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold transition-colors cursor-pointer"
                >
                  {copiedLink ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-700" />
                      <span>Link Copied!</span>
                    </>
                  ) : (
                    <>
                      <Share2 className="w-3.5 h-3.5" />
                      <span>Copy App URL</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Omni-App Features Highlights */}
          <div className="border-t border-slate-200 pt-3">
            <h5 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
              Cross-Platform App Features
            </h5>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] text-slate-700 font-medium">
              <div className="p-2 rounded-xl bg-slate-50 border border-slate-100 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Instant Booking</span>
              </div>
              <div className="p-2 rounded-xl bg-slate-50 border border-slate-100 flex items-center gap-1.5">
                <Wifi className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Offline Cached</span>
              </div>
              <div className="p-2 rounded-xl bg-slate-50 border border-slate-100 flex items-center gap-1.5">
                <Bell className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Push Alerts</span>
              </div>
              <div className="p-2 rounded-xl bg-slate-50 border border-slate-100 flex items-center gap-1.5">
                <ExternalLink className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>WhatsApp Sync</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3.5 sm:p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 shrink-0">
          <span>24/7 Helpline: {siteConfig.contact.phone}</span>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-600 hover:text-slate-900 font-bold px-3 py-1.5 rounded-lg hover:bg-slate-200 transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
