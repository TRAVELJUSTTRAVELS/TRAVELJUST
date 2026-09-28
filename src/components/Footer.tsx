import React from 'react';
import { Compass, ShieldCheck, Phone, Mail, Lock, Database, User, Globe, MessageSquare, Zap } from 'lucide-react';
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
              <a
                href={`https://wa.me/${siteConfig.contact.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent('Hello TRAVEL JUST, I would like to inquire about taxi booking.')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-[#25D366] hover:text-[#20bd5a] transition-colors font-bold"
              >
                <MessageSquare className="w-3.5 h-3.5 text-[#25D366]" />
                <span>WhatsApp: {siteConfig.contact.whatsapp}</span>
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
