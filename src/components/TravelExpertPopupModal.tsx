import React, { useEffect } from 'react';
import { X, Phone } from 'lucide-react';
import { siteConfig } from '../config/siteConfig';

interface TravelExpertPopupModalProps {
  isOpen: boolean;
  onClose: () => void;
  phoneNumber?: string;
}

export const TravelExpertPopupModal: React.FC<TravelExpertPopupModalProps> = ({
  isOpen,
  onClose,
  phoneNumber = '97407 54400',
}) => {
  // Close on Escape key press
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const cleanDigits = phoneNumber.replace(/[^0-9+]/g, '');
  const dialUrl = cleanDigits.startsWith('+') ? `tel:${cleanDigits}` : `tel:+91${cleanDigits}`;

  return (
    <div
      id="travel-expert-popup-backdrop"
      className="fixed inset-0 z-[70] flex items-center justify-center p-4 sm:p-6 bg-slate-950/65 backdrop-blur-xs animate-in fade-in duration-300"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="travel-expert-title"
    >
      {/* Popup Card */}
      <div
        id="travel-expert-popup-card"
        className="relative w-full max-w-lg rounded-2xl sm:rounded-3xl bg-gradient-to-br from-slate-950 via-emerald-950 to-slate-900 p-4 sm:p-5 md:p-6 shadow-[0_15px_40px_-10px_rgba(5,150,105,0.35)] border border-emerald-500/30 text-white animate-in zoom-in-95 duration-300 backdrop-blur-xl"
      >
        {/* Top-Right Circular Close Button */}
        <button
          id="travel-expert-close-btn"
          type="button"
          onClick={onClose}
          aria-label="Close dialog"
          className="absolute -top-2.5 -right-2.5 w-8 h-8 rounded-full bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-slate-950 flex items-center justify-center shadow-lg transition-all duration-200 cursor-pointer border-2 border-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-400"
        >
          <X className="w-4 h-4 text-slate-950 stroke-[2.5]" />
        </button>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-3.5 sm:gap-4">
          {/* Left Text Content */}
          <div className="flex-1 text-center sm:text-left">
            <h2
              id="travel-expert-title"
              className="text-base sm:text-lg md:text-xl font-black tracking-tight text-white leading-snug"
            >
              <span>CONNECT WITH </span>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-amber-200 to-emerald-300">
                24×7
              </span>{' '}
              <span>CONCIERGE</span>
            </h2>

            <p
              id="travel-expert-description"
              className="text-emerald-100/80 font-normal text-xs mt-1 max-w-xs sm:max-w-sm leading-relaxed"
            >
              For Instant Bookings, cab pricing, and personalized outstation trip planning!
            </p>
          </div>

          {/* Right Action Call Pill */}
          <div className="shrink-0 w-full sm:w-auto">
            <a
              id="travel-expert-phone-call-btn"
              href={dialUrl}
              className="w-full sm:w-auto bg-gradient-to-r from-amber-400 via-amber-300 to-amber-400 hover:from-amber-300 hover:to-amber-200 active:scale-[0.98] text-slate-950 rounded-xl px-4 py-2 sm:px-4.5 sm:py-2.5 shadow-md border border-amber-200/60 flex items-center justify-center gap-2.5 transition-all duration-200 cursor-pointer group"
            >
              <div className="w-7 h-7 rounded-lg bg-slate-950/10 flex items-center justify-center group-hover:bg-slate-950/20 transition-colors">
                <Phone className="w-3.5 h-3.5 text-slate-950 fill-slate-950 shrink-0 group-hover:scale-110 transition-transform duration-200" />
              </div>
              <div className="flex flex-col items-start">
                <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-800/80">Call Helpline</span>
                <span className="font-black text-sm sm:text-base text-slate-950 tracking-tight whitespace-nowrap">
                  {phoneNumber}
                </span>
              </div>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
