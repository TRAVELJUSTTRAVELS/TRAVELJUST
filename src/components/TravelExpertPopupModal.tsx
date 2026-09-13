import React, { useEffect } from 'react';
import { X, Phone, MessageSquare } from 'lucide-react';
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
        className="relative w-full max-w-2xl rounded-3xl sm:rounded-[32px] bg-gradient-to-r from-[#d8edf9] via-[#e5f3fc] to-[#d3eaf8] p-6 sm:p-9 md:p-10 shadow-[0_25px_60px_-15px_rgba(14,116,144,0.35)] border border-sky-200/90 text-slate-900 animate-in zoom-in-95 duration-300"
      >
        {/* Top-Right Circular Close Button */}
        <button
          id="travel-expert-close-btn"
          type="button"
          onClick={onClose}
          aria-label="Close dialog"
          className="absolute -top-3 -right-3 sm:-top-3.5 sm:-right-3.5 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#b89552] hover:bg-[#a68342] active:scale-95 text-white flex items-center justify-center shadow-lg transition-transform duration-150 cursor-pointer border-2 border-white focus:outline-none focus:ring-2 focus:ring-[#b89552] focus:ring-offset-2"
        >
          <X className="w-5 h-5 text-white stroke-[2.5]" />
        </button>

        <div className="flex flex-col md:flex-row items-center justify-between gap-6 md:gap-8">
          {/* Left Text Content */}
          <div className="flex-1 text-center md:text-left">
            <span
              id="travel-expert-eyebrow"
              className="inline-block text-xs sm:text-sm font-bold tracking-[0.18em] text-[#ab8748] uppercase mb-1 sm:mb-2"
            >
              SAY HELLO TO,
            </span>

            <h2
              id="travel-expert-title"
              className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900 leading-tight"
            >
              <span>YOUR </span>
              <span className="text-[#b89552]">24×7</span>
              <span className="block mt-0.5 sm:mt-1">TRAVEL EXPERT</span>
            </h2>

            <p
              id="travel-expert-description"
              className="text-slate-600 font-medium text-sm sm:text-base mt-2.5 sm:mt-3 max-w-md"
            >
              Get expert advice for smarter travel plans!
            </p>
          </div>

          {/* Right Action Call Pill & WhatsApp Options */}
          <div className="flex flex-col sm:flex-row md:flex-col items-center gap-3 shrink-0 w-full md:w-auto">
            <a
              id="travel-expert-phone-call-btn"
              href={dialUrl}
              className="w-full sm:w-auto bg-white hover:bg-slate-50 active:scale-[0.98] text-slate-900 rounded-full px-6 sm:px-8 py-3.5 sm:py-4 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.12)] hover:shadow-[0_15px_30px_-5px_rgba(0,0,0,0.18)] border border-slate-100 flex items-center justify-center gap-3 transition-all duration-200 cursor-pointer group"
            >
              <Phone className="w-5 h-5 sm:w-6 sm:h-6 text-slate-900 fill-slate-900 shrink-0 group-hover:scale-110 transition-transform duration-200" />
              <span className="font-extrabold text-xl sm:text-2xl text-slate-900 tracking-tight whitespace-nowrap">
                {phoneNumber}
              </span>
            </a>

            <a
              id="travel-expert-whatsapp-btn"
              href={`https://wa.me/${siteConfig.contact.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent('Hello TRAVEL JUST, I would like to speak to a 24x7 travel expert for planning my ride.')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto bg-[#25D366] hover:bg-[#20bd5a] text-white rounded-full px-5 py-2.5 shadow-md flex items-center justify-center gap-2 font-bold text-xs sm:text-sm tracking-wide uppercase transition-all duration-200 cursor-pointer"
            >
              <MessageSquare className="w-4 h-4 fill-white" />
              <span>Chat on WhatsApp</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
