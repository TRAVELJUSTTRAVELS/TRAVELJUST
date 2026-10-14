import React from 'react';
import { Car, Compass, Phone, User, CalendarCheck } from 'lucide-react';
import { siteConfig } from '../config/siteConfig';
import { CustomerUser } from '../types';

interface MobileBottomNavProps {
  onBookClick?: () => void;
  onRoutesClick?: () => void;
  onAccountClick?: () => void;
  customer?: CustomerUser | null;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  onBookClick,
  onRoutesClick,
  onAccountClick,
  customer,
}) => {
  const handleScrollToBooking = () => {
    if (onBookClick) {
      onBookClick();
    } else {
      const el = document.getElementById('booking-search-section');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  const handleScrollToRoutes = () => {
    if (onRoutesClick) {
      onRoutesClick();
    } else {
      const el = document.getElementById('top-outstation-routes-section');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  return (
    <nav
      id="mobile-bottom-action-navigation"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200/90 dark:border-slate-800 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] dark:shadow-[0_-4px_20px_rgba(0,0,0,0.4)] pb-[env(safe-area-inset-bottom)] transition-all select-none"
      aria-label="Mobile Quick Navigation"
    >
      <div className="grid grid-cols-5 items-stretch h-16 max-w-lg mx-auto px-1">
        {/* Tab 1: Book Cab */}
        <button
          type="button"
          onClick={handleScrollToBooking}
          className="flex flex-col items-center justify-center py-1 text-emerald-800 dark:text-emerald-400 hover:text-emerald-950 active:scale-95 transition-transform cursor-pointer"
          aria-label="Book Cab"
        >
          <div className="w-8 h-8 rounded-full bg-emerald-100/80 dark:bg-emerald-900/40 flex items-center justify-center mb-0.5">
            <Car className="w-4 h-4 text-[#00A878] dark:text-emerald-400 stroke-[2.3]" />
          </div>
          <span className="text-[10px] font-bold tracking-tight text-slate-800 dark:text-slate-100">
            Book
          </span>
        </button>

        {/* Tab 2: Top Routes */}
        <button
          type="button"
          onClick={handleScrollToRoutes}
          className="flex flex-col items-center justify-center py-1 text-slate-600 dark:text-slate-300 hover:text-emerald-700 active:scale-95 transition-transform cursor-pointer"
          aria-label="Top Outstation Routes"
        >
          <div className="w-8 h-8 rounded-full flex items-center justify-center mb-0.5">
            <Compass className="w-4 h-4 text-slate-700 dark:text-slate-300 stroke-[2.2]" />
          </div>
          <span className="text-[10px] font-bold tracking-tight text-slate-700 dark:text-slate-300">
            Routes
          </span>
        </button>

        {/* Tab 3: WhatsApp Instant Support (Center Action) */}
        <a
          href="https://wa.me/919740754400?text=Hello%20TRAVEL%20JUST%2C%20I%20would%20like%20to%20inquire%20about%20booking%20a%20cab."
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-col items-center justify-center py-1 active:scale-95 transition-transform group"
          aria-label="Chat on WhatsApp"
        >
          <div className="w-9 h-9 rounded-full bg-[#25D366] text-white flex items-center justify-center shadow-md shadow-[#25D366]/30 mb-0.5 group-hover:scale-105 transition-transform">
            <svg
              className="w-4.5 h-4.5 fill-current"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
            </svg>
          </div>
          <span className="text-[10px] font-bold tracking-tight text-[#1da851] dark:text-[#25D366]">
            WhatsApp
          </span>
        </a>

        {/* Tab 4: Direct Phone Call */}
        <a
          href={`tel:${siteConfig.contact.phone.replace(/\s+/g, '')}`}
          className="flex flex-col items-center justify-center py-1 text-slate-700 dark:text-slate-300 hover:text-emerald-700 active:scale-95 transition-transform"
          aria-label={`Call ${siteConfig.contact.phone}`}
        >
          <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-0.5">
            <Phone className="w-4 h-4 text-[#00A878] dark:text-emerald-400 stroke-[2.3]" />
          </div>
          <span className="text-[10px] font-bold tracking-tight text-slate-800 dark:text-slate-200">
            Call 24/7
          </span>
        </a>

        {/* Tab 5: Account / Customer Portal */}
        <button
          type="button"
          onClick={onAccountClick}
          className="flex flex-col items-center justify-center py-1 text-slate-700 dark:text-slate-300 hover:text-emerald-700 active:scale-95 transition-transform cursor-pointer"
          aria-label={customer ? `Account (${customer.fullName})` : 'Login / My Trips'}
        >
          <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-0.5">
            {customer ? (
              <span className="text-[11px] font-black text-emerald-800 dark:text-emerald-300">
                {customer.fullName.slice(0, 2).toUpperCase() || 'TJ'}
              </span>
            ) : (
              <User className="w-4 h-4 text-slate-700 dark:text-slate-300 stroke-[2.2]" />
            )}
          </div>
          <span className="text-[10px] font-bold tracking-tight text-slate-800 dark:text-slate-200 truncate max-w-[55px]">
            {customer ? 'Trips' : 'Login'}
          </span>
        </button>
      </div>
    </nav>
  );
};
