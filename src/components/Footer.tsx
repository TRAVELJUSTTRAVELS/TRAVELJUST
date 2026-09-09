import React from 'react';
import { Compass, ShieldCheck, Phone, Mail, Lock, Database, User, Car, Globe } from 'lucide-react';
import { siteConfig } from '../config/siteConfig';
import { CustomerUser } from '../types';

interface FooterProps {
  onOpenLegal: (type: 'privacy' | 'terms') => void;
  onBookRideClick: () => void;
  isOwner?: boolean;
  onOpenOwnerLogin?: () => void;
  customer?: CustomerUser | null;
  onOpenCustomerPortal?: () => void;
  onOpenPartnerDrawer?: () => void;
}

export const Footer: React.FC<FooterProps> = ({
  onOpenLegal,
  onBookRideClick,
  isOwner = false,
  onOpenOwnerLogin,
  customer = null,
  onOpenCustomerPortal,
  onOpenPartnerDrawer,
}) => {
  const currentYear = new Date().getFullYear();

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    const element = document.querySelector(href);
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
              <a href={`tel:${siteConfig.contact.phone.replace(/\s+/g, '')}`} className="flex items-center gap-1.5 hover:text-emerald-400 transition-colors">
                <Phone className="w-3.5 h-3.5 text-emerald-400" />
                <span>{siteConfig.contact.phone}</span>
              </a>
              <a href={`mailto:${siteConfig.contact.email}`} className="flex items-center gap-1.5 hover:text-emerald-400 transition-colors">
                <Mail className="w-3.5 h-3.5 text-emerald-400" />
                <span>{siteConfig.contact.email}</span>
              </a>
              <a href={siteConfig.siteUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 hover:text-emerald-400 transition-colors">
                <Globe className="w-3.5 h-3.5 text-emerald-400" />
                <span>www.traveljust.in</span>
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
                <a href="#popular-routes-section" onClick={(e) => handleNavClick(e, '#popular-routes-section')} className="hover:text-emerald-400 transition-colors text-slate-300 font-medium">
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
                <a href="#contact" onClick={(e) => handleNavClick(e, '#contact')} className="hover:text-emerald-400 transition-colors">
                  Contact & Support
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
              {isOwner && (
                <li>
                  <a href="#recent-trips" onClick={(e) => handleNavClick(e, '#recent-trips')} className="text-amber-400 hover:text-amber-300 font-semibold transition-colors flex items-center gap-1">
                    <Database className="w-3 h-3" />
                    <span>Live Dispatch Registry</span>
                  </a>
                </li>
              )}
              {onOpenPartnerDrawer && (
                <li>
                  <button
                    type="button"
                    onClick={onOpenPartnerDrawer}
                    className="text-emerald-400 hover:text-emerald-300 font-semibold transition-colors flex items-center gap-1.5 text-left cursor-pointer w-full"
                  >
                    <Car className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Attach Cab / Partner With Us</span>
                  </button>
                </li>
              )}
            </ul>
          </div>

          {/* Services Offered & Driver Partner Card */}
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

            {/* Driver Partner Callout Banner */}
            {onOpenPartnerDrawer && (
              <div className="bg-emerald-950/70 border border-emerald-800/80 rounded-2xl p-3.5 space-y-2.5">
                <div className="flex items-start gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-emerald-800 text-emerald-300 flex items-center justify-center shrink-0 mt-0.5">
                    <Car className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-white font-bold text-xs block">
                      Drive With TRAVEL JUST
                    </span>
                    <span className="text-[11px] text-emerald-200/80 leading-relaxed block">
                      Attach your commercial cab in Mysore, Bangalore & across Karnataka.
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={onOpenPartnerDrawer}
                  className="w-full bg-[#0a4d3c] hover:bg-[#07382c] text-emerald-300 border border-emerald-600/50 font-extrabold text-xs py-2 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <Car className="w-3.5 h-3.5" />
                  <span>Attach Your Cab / Partner</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Popular Outstation & Airport Taxi Keywords Directory for Local & Destination SEO */}
        <div className="pt-8 mt-8 border-t border-slate-800 space-y-4 text-xs text-slate-400">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <h5 className="font-bold text-white uppercase tracking-wider text-[11px]">
              Top Outstation & Airport Taxi Routes from Mysore
            </h5>
            <span className="text-[10px] text-emerald-400 font-medium">
              24/7 Doorstep Pickup • Verified Drivers • AC Cabs
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
            <div className="space-y-1.5">
              <span className="font-bold text-slate-300 block text-[11px]">Mysore ⇄ Bengaluru</span>
              <ul className="space-y-1 text-[11px] text-slate-400">
                <li><a href="#popular-routes-section" onClick={(e) => handleNavClick(e, '#popular-routes-section')} className="hover:text-emerald-300">Mysore to Bengaluru Taxi</a></li>
                <li><a href="#popular-routes-section" onClick={(e) => handleNavClick(e, '#popular-routes-section')} className="hover:text-emerald-300">Bengaluru to Mysore Cab</a></li>
                <li><a href="#popular-routes-section" onClick={(e) => handleNavClick(e, '#popular-routes-section')} className="hover:text-emerald-300">One Way Taxi Bangalore</a></li>
                <li><a href="#popular-routes-section" onClick={(e) => handleNavClick(e, '#popular-routes-section')} className="hover:text-emerald-300">Expressway Outstation Cab</a></li>
              </ul>
            </div>

            <div className="space-y-1.5">
              <span className="font-bold text-slate-300 block text-[11px]">Airport ⇄ Mysore</span>
              <ul className="space-y-1 text-[11px] text-slate-400">
                <li><a href="#popular-routes-section" onClick={(e) => handleNavClick(e, '#popular-routes-section')} className="hover:text-emerald-300">Mysore to BLR Airport Taxi</a></li>
                <li><a href="#popular-routes-section" onClick={(e) => handleNavClick(e, '#popular-routes-section')} className="hover:text-emerald-300">BLR Airport to Mysore Cab</a></li>
                <li><a href="#popular-routes-section" onClick={(e) => handleNavClick(e, '#popular-routes-section')} className="hover:text-emerald-300">KIAL T1 & T2 Terminal Drop</a></li>
                <li><a href="#popular-routes-section" onClick={(e) => handleNavClick(e, '#popular-routes-section')} className="hover:text-emerald-300">24/7 Flight Pickup Cab</a></li>
              </ul>
            </div>

            <div className="space-y-1.5">
              <span className="font-bold text-slate-300 block text-[11px]">Mysore ⇄ Coorg</span>
              <ul className="space-y-1 text-[11px] text-slate-400">
                <li><a href="#popular-routes-section" onClick={(e) => handleNavClick(e, '#popular-routes-section')} className="hover:text-emerald-300">Mysore to Coorg Taxi</a></li>
                <li><a href="#popular-routes-section" onClick={(e) => handleNavClick(e, '#popular-routes-section')} className="hover:text-emerald-300">Coorg (Madikeri) to Mysore</a></li>
                <li><a href="#popular-routes-section" onClick={(e) => handleNavClick(e, '#popular-routes-section')} className="hover:text-emerald-300">Coorg Tour Package Cab</a></li>
                <li><a href="#popular-routes-section" onClick={(e) => handleNavClick(e, '#popular-routes-section')} className="hover:text-emerald-300">Kushalnagar & Virajpet Cabs</a></li>
              </ul>
            </div>

            <div className="space-y-1.5">
              <span className="font-bold text-slate-300 block text-[11px]">Mysore ⇄ Ooty</span>
              <ul className="space-y-1 text-[11px] text-slate-400">
                <li><a href="#popular-routes-section" onClick={(e) => handleNavClick(e, '#popular-routes-section')} className="hover:text-emerald-300">Mysore to Ooty Taxi</a></li>
                <li><a href="#popular-routes-section" onClick={(e) => handleNavClick(e, '#popular-routes-section')} className="hover:text-emerald-300">Ooty to Mysore Return Cab</a></li>
                <li><a href="#popular-routes-section" onClick={(e) => handleNavClick(e, '#popular-routes-section')} className="hover:text-emerald-300">Bandipur Forest Corridor Cab</a></li>
                <li><a href="#popular-routes-section" onClick={(e) => handleNavClick(e, '#popular-routes-section')} className="hover:text-emerald-300">Ooty Sightseeing Package</a></li>
              </ul>
            </div>

            <div className="space-y-1.5">
              <span className="font-bold text-slate-300 block text-[11px]">Mysore ⇄ Wayanad</span>
              <ul className="space-y-1 text-[11px] text-slate-400">
                <li><a href="#popular-routes-section" onClick={(e) => handleNavClick(e, '#popular-routes-section')} className="hover:text-emerald-300">Mysore to Wayanad Taxi</a></li>
                <li><a href="#popular-routes-section" onClick={(e) => handleNavClick(e, '#popular-routes-section')} className="hover:text-emerald-300">Wayanad to Mysore Return</a></li>
                <li><a href="#popular-routes-section" onClick={(e) => handleNavClick(e, '#popular-routes-section')} className="hover:text-emerald-300">Sultan Bathery & Kalpetta Cab</a></li>
                <li><a href="#popular-routes-section" onClick={(e) => handleNavClick(e, '#popular-routes-section')} className="hover:text-emerald-300">Kerala Holiday Tour Package</a></li>
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500">
          <div>
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
              className="hover:text-slate-300 transition-colors"
            >
              Privacy Policy
            </button>
            <span>•</span>
            <button
              onClick={() => onOpenLegal('terms')}
              className="hover:text-slate-300 transition-colors"
            >
              Terms & Conditions
            </button>

            {/* Owner Access Link */}
            <span>•</span>
            {isOwner ? (
              <div className="flex items-center gap-3">
                <a
                  href="#recent-trips"
                  onClick={(e) => handleNavClick(e, '#recent-trips')}
                  className="flex items-center gap-1.5 text-amber-400 hover:text-amber-300 font-bold transition-colors"
                >
                  <Database className="w-3 h-3" />
                  <span>Dispatch Registry</span>
                </a>
              </div>
            ) : (
              <button
                type="button"
                onClick={onOpenOwnerLogin}
                className="flex items-center gap-1 text-slate-500 hover:text-slate-300 transition-colors"
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
