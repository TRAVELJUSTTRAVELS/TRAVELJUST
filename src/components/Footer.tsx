import React from 'react';
import { Compass, ShieldCheck, Phone, Mail, Lock, Database, User, Globe, Zap } from 'lucide-react';
import { siteConfig } from '../config/siteConfig';
import { CustomerUser } from '../types';

interface FooterProps {
  onOpenLegal: (type: 'privacy' | 'terms') => void;
  onBookRideClick: () => void;
  isOwner?: boolean;
  onOpenOwnerLogin?: () => void;
  onOpenFareEngine?: () => void;
  customer?: CustomerUser | null;
  onOpenCustomerPortal?: () => void;
  onOpenPartnerDrawer?: () => void;
  onOpenSiteOptimizer?: () => void;
}

export const Footer: React.FC<FooterProps> = ({
  onOpenLegal,
  onBookRideClick,
  isOwner = false,
  onOpenOwnerLogin,
  onOpenFareEngine,
  customer = null,
  onOpenCustomerPortal,
  onOpenPartnerDrawer,
  onOpenSiteOptimizer,
}) => {
  const currentYear = new Date().getFullYear();

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    let element = document.querySelector(href);
    if (!element && href === '#about') {
      element = document.querySelector('#why-choose-us-section') || document.querySelector('#about');
    }
    if (!element && (href === '#popular-routes-section' || href === '#top-routes-directory-section')) {
      element = document.querySelector('#popular-routes-section') || document.querySelector('#top-routes-directory-section');
    }
    if (element) {
      const headerOffset = 85;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.scrollY - headerOffset;
      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth',
      });
      if (window.history.pushState) {
        window.history.pushState(null, '', href);
      }
    }
  };

  return (
    <footer className="bg-slate-950 text-slate-400 text-xs border-t border-slate-800 pt-12 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 pb-12 border-b border-slate-800">
          {/* Brand Info */}
          <div className="lg:col-span-5 space-y-4">
            <div className="flex items-center gap-3 text-white">
              <div className="w-9 h-9 rounded-xl bg-emerald-800 flex items-center justify-center text-white">
                <Compass className="w-5 h-5" />
              </div>
              <span className="font-extrabold text-xl tracking-tight text-white">
                TRAVEL <span className="text-emerald-400">JUST</span>
              </span>
            </div>

            <p className="text-slate-400 text-xs leading-relaxed max-w-sm">
              {siteConfig.description} Reliable transportation for point-to-point drops, hourly local rentals, and return trips.
            </p>

            <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-slate-300 pt-1">
              <a
                href={`tel:${siteConfig.contact.phone.replace(/\s+/g, '')}`}
                className="group flex items-center gap-1.5 text-slate-300 dark:text-slate-300 hover:text-emerald-400 dark:hover:text-emerald-400 transition-colors font-medium"
              >
                <Phone className="w-3.5 h-3.5 text-emerald-400 dark:text-emerald-400 shrink-0 group-hover:scale-110 transition-transform" />
                <span className="text-slate-300 dark:text-slate-300 group-hover:text-emerald-400 dark:group-hover:text-emerald-300 transition-colors font-medium">
                  {siteConfig.contact.phone}
                </span>
              </a>
              <a
                href={`https://wa.me/${siteConfig.contact.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent('Hello TRAVEL JUST, I would like to inquire about taxi booking.')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-1.5 text-slate-300 dark:text-slate-300 hover:text-emerald-400 dark:hover:text-emerald-400 transition-colors font-medium"
              >
                <svg
                  className="w-3.5 h-3.5 fill-[#25D366] shrink-0 group-hover:scale-110 transition-transform"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-label="WhatsApp"
                >
                  <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91C2.13 13.66 2.59 15.36 3.45 16.86L2.05 22L7.3 20.62C8.75 21.41 10.38 21.83 12.04 21.83C17.5 21.83 21.95 17.38 21.95 11.92C21.95 9.27 20.92 6.78 19.05 4.91C17.18 3.03 14.69 2 12.04 2ZM12.05 20.16C10.57 20.16 9.12 19.76 7.85 19.01L7.55 18.83L4.43 19.65L5.26 16.61L5.06 16.29C4.24 14.99 3.8 13.47 3.8 11.91C3.8 7.37 7.5 3.67 12.05 3.67C14.25 3.67 16.31 4.53 17.87 6.09C19.42 7.65 20.28 9.72 20.28 11.92C20.28 16.46 16.58 20.16 12.05 20.16ZM16.57 14.39C16.32 14.27 15.1 13.67 14.87 13.58C14.65 13.5 14.48 13.46 14.32 13.7C14.15 13.95 13.68 14.51 13.53 14.67C13.39 14.84 13.24 14.86 12.99 14.74C12.75 14.61 11.96 14.35 11.02 13.52C10.29 12.87 9.8 12.07 9.66 11.82C9.51 11.58 9.64 11.44 9.77 11.32C9.88 11.21 10.02 11.03 10.14 10.89C10.26 10.74 10.3 10.64 10.38 10.48C10.47 10.31 10.42 10.17 10.36 10.05C10.3 9.93 9.81 8.72 9.6 8.22C9.4 7.73 9.2 7.8 9.05 7.79C8.91 7.78 8.74 7.78 8.58 7.78C8.41 7.78 8.14 7.84 7.91 8.09C7.69 8.33 7.05 8.93 7.05 10.15C7.05 11.37 7.94 12.55 8.06 12.71C8.19 12.88 9.81 15.38 12.3 16.45C12.89 16.71 13.35 16.86 13.71 16.98C14.31 17.17 14.85 17.14 15.28 17.08C15.77 17.01 16.78 16.47 16.99 15.88C17.2 15.29 17.2 14.78 17.14 14.67C17.07 14.57 16.92 14.51 16.67 14.39H16.57Z" />
                </svg>
                <span className="text-slate-300 dark:text-slate-300 group-hover:text-emerald-400 dark:group-hover:text-emerald-300 transition-colors font-medium">
                  {siteConfig.contact.whatsapp}
                </span>
              </a>
              <a
                href={`mailto:${siteConfig.contact.email}`}
                className="group flex items-center gap-1.5 text-slate-300 dark:text-slate-300 hover:text-emerald-400 dark:hover:text-emerald-400 transition-colors font-medium"
              >
                <Mail className="w-3.5 h-3.5 text-emerald-400 dark:text-emerald-400 shrink-0 group-hover:scale-110 transition-transform" />
                <span className="text-slate-300 dark:text-slate-300 group-hover:text-emerald-400 dark:group-hover:text-emerald-300 transition-colors font-medium">
                  {siteConfig.contact.email}
                </span>
              </a>
              <a
                href={siteConfig.siteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-1.5 text-slate-300 dark:text-slate-300 hover:text-emerald-400 dark:hover:text-emerald-400 transition-colors font-medium"
              >
                <Globe className="w-3.5 h-3.5 text-emerald-400 dark:text-emerald-400 shrink-0 group-hover:scale-110 transition-transform" />
                <span className="text-slate-300 dark:text-slate-300 group-hover:text-emerald-400 dark:group-hover:text-emerald-300 transition-colors font-medium">
                  www.traveljust.in
                </span>
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="lg:col-span-3 space-y-3">
            <h4 className="font-bold text-[#FFFFFF] text-xs uppercase tracking-wider">Navigation</h4>
            <ul className="space-y-2 font-medium">
              <li>
                <a href="#home" onClick={(e) => handleNavClick(e, '#home')} className="hover:text-emerald-400 transition-colors">
                  Home
                </a>
              </li>
              <li>
                <a
                  href="#popular-routes-section"
                  onClick={(e) => handleNavClick(e, '#popular-routes-section')}
                  className="hover:text-emerald-400 transition-colors"
                >
                  Popular Outstation Routes
                </a>
              </li>
              <li>
                <a href="#services" onClick={(e) => handleNavClick(e, '#services')} className="hover:text-emerald-400 transition-colors">
                  Services
                </a>
              </li>
              <li>
                <a href="#fleet" onClick={(e) => handleNavClick(e, '#fleet')} className="hover:text-emerald-400 transition-colors">
                  Fleet Showcase
                </a>
              </li>
              <li>
                <a href="#about" onClick={(e) => handleNavClick(e, '#about')} className="hover:text-emerald-400 transition-colors">
                  About Us
                </a>
              </li>
              <li>
                <a href="#faq" onClick={(e) => handleNavClick(e, '#faq')} className="hover:text-emerald-400 transition-colors">
                  FAQ
                </a>
              </li>
              {customer && (
                <li>
                  <button
                    type="button"
                    onClick={onOpenCustomerPortal}
                    className="text-emerald-400 hover:text-emerald-300 font-semibold transition-colors flex items-center gap-1.5 text-left cursor-pointer w-full"
                  >
                    <User className="w-3.5 h-3.5" />
                    <span>My Account & Trips</span>
                  </button>
                </li>
              )}
            </ul>
          </div>

          {/* Services Offered */}
          <div className="lg:col-span-4 space-y-4">
            <div className="space-y-3">
              <h4 className="font-bold text-white text-xs uppercase tracking-wider">Services</h4>
              <ul className="space-y-1.5 font-medium">
                <li className="flex items-center justify-between py-0.5">
                  <span>Local Travel Packages</span>
                  <span className="text-[10px] text-emerald-400 font-semibold">4h / 8h / 12h</span>
                </li>
                <li className="flex items-center justify-between py-0.5">
                  <span>One Way Drop</span>
                  <span className="text-[10px] text-emerald-400 font-semibold">Point-to-Point</span>
                </li>
                <li className="flex items-center justify-between py-0.5">
                  <span>Round Trip Travel</span>
                  <span className="text-[10px] text-emerald-400 font-semibold">Outbound & Return</span>
                </li>
                <li className="flex items-center justify-between py-0.5">
                  <span>Airport Transfers</span>
                  <span className="text-[10px] text-emerald-400 font-semibold">Pickup & Drop</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500">
          <div style={{ color: '#FE9A00' }} className="text-[#FE9A00]">
            © {currentYear} {siteConfig.businessName}. All rights reserved.
          </div>

          <div className="flex flex-wrap items-center gap-4">
            {/* Customer Account trigger */}
            {customer && (
              <>
                <button
                  type="button"
                  onClick={onOpenCustomerPortal}
                  className="text-emerald-400 hover:text-emerald-300 font-semibold transition-colors flex items-center gap-1"
                >
                  <User className="w-3 h-3" />
                  <span>My Account ({customer.fullName.split(' ')[0]})</span>
                </button>
                <span>•</span>
              </>
            )}
            <button
              onClick={() => onOpenLegal('privacy')}
              style={{ color: '#FE9A00' }}
              className="hover:text-amber-300 transition-colors"
            >
              Privacy Policy
            </button>
            <span>•</span>
            <button
              onClick={() => onOpenLegal('terms')}
              style={{ color: '#FE9A00' }}
              className="hover:text-amber-300 transition-colors"
            >
              Terms & Conditions
            </button>

            {/* Owner Access Link */}
            <span>•</span>
            {isOwner ? (
              <div className="flex items-center gap-3">
                {onOpenSiteOptimizer && (
                  <button
                    type="button"
                    onClick={onOpenSiteOptimizer}
                    className="flex items-center gap-1.5 text-amber-400 hover:text-amber-300 font-bold transition-colors cursor-pointer"
                    title="Site Optimizer, SEO & Automatic WordPress Updates (Owner Only)"
                  >
                    <Zap className="w-3 h-3 text-amber-400" />
                    <span>Site Optimizer & SEO</span>
                  </button>
                )}
                {onOpenFareEngine && (
                  <button
                    type="button"
                    id="footer-owner-portal-btn"
                    onClick={onOpenFareEngine}
                    className="flex items-center gap-1.5 text-emerald-400 hover:text-emerald-300 font-bold transition-colors cursor-pointer"
                    title="TRAVEL JUST Owner & Fleet Management Portal"
                  >
                    <Zap className="w-3 h-3 text-amber-400 fill-amber-400" />
                    <span>Owner & Fleet Management Portal</span>
                  </button>
                )}
              </div>
            ) : (
              <button
                type="button"
                onClick={onOpenOwnerLogin}
                className="flex items-center gap-1 text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
                title="Fleet Manager & Business Owner Login"
              >
                <Lock className="w-3 h-3" />
                <span>Fleet Manager / Owner Portal</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </footer>
  );
};
