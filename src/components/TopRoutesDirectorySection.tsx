import React from 'react';
import { Compass, Phone, Mail, Globe, Star, Lock } from 'lucide-react';
import { siteConfig } from '../config/siteConfig';

interface TopRoutesDirectorySectionProps {
  onOpenLegal?: (type: 'privacy' | 'terms') => void;
  onOpenOwnerPortal?: () => void;
}

export const TopRoutesDirectorySection: React.FC<TopRoutesDirectorySectionProps> = ({
  onOpenLegal,
  onOpenOwnerPortal,
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

  const navLinks = [
    { name: 'Home', href: '#home' },
    { name: 'Popular Outstation Routes', href: '#popular-routes-section' },
    { name: 'Services', href: '#services' },
    { name: 'Fleet Showcase', href: '#fleet' },
    { name: 'About Us', href: '#why-choose-us-section' },
    { name: 'FAQ', href: '#faq' },
  ];

  const serviceItems = [
    { name: 'Local Travel Packages', badge: '4h / 8h / 12h' },
    { name: 'One Way Drop', badge: 'Point-to-Point' },
    { name: 'Round Trip Travel', badge: 'Outbound & Return' },
    { name: 'Airport Transfers', badge: 'Pickup & Drop' },
  ];

  return (
    <section
      id="top-routes-directory-section"
      className="bg-[#030712] text-slate-300 pt-16 pb-8 border-t border-slate-900 font-sans selection:bg-[#10b981] selection:text-white"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main 3-Column Layout exactly matching screenshot */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 lg:gap-14 pb-14">
          {/* Column 1: Brand, Tagline, Rating, Contact Details */}
          <div className="md:col-span-5 lg:col-span-5 space-y-5">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#005a3e] border border-emerald-500/30 flex items-center justify-center text-white shadow-md">
                <Compass className="w-5 h-5 text-[#22c55e]" />
              </div>
              <span className="font-extrabold text-2xl tracking-tight text-white">
                TRAVEL <span className="text-[#22c55e]">JUST</span>
              </span>
            </div>


            {/* Rating */}
            <div className="flex flex-wrap items-center gap-2 pt-1 text-sm">
              <div className="flex items-center text-[#f59e0b] gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-current stroke-none" />
                ))}
              </div>
              <span className="font-extrabold text-white text-sm">4.9/5 Rating</span>
              <span className="text-slate-500">·</span>
              <span className="text-[#22c55e] font-bold">1,420+</span>
              <span className="text-slate-300 text-sm">Verified Customer Reviews</span>
            </div>

            {/* Contact Details with Icons */}
            <div className="space-y-3 pt-2 text-sm text-slate-300">
              <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
                {/* Phone */}
                <a
                  href={`tel:${siteConfig.contact.phone.replace(/\s+/g, '')}`}
                  className="flex items-center gap-2 hover:text-white transition-colors group"
                >
                  <Phone className="w-4 h-4 text-[#22c55e] shrink-0" />
                  <span className="font-medium">{siteConfig.contact.phone}</span>
                </a>

                {/* WhatsApp */}
                <a
                  href={`https://wa.me/${siteConfig.contact.whatsapp.replace(/[^0-9]/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 hover:text-white transition-colors group"
                >
                  {/* WhatsApp style icon or green phone */}
                  <span className="w-4 h-4 rounded-full border border-[#22c55e] flex items-center justify-center text-[10px] text-[#22c55e] font-bold">
                    ✆
                  </span>
                  <span className="font-medium">{siteConfig.contact.whatsapp}</span>
                </a>

                {/* Email */}
                <a
                  href={`mailto:${siteConfig.contact.email}`}
                  className="flex items-center gap-2 hover:text-white transition-colors group"
                >
                  <Mail className="w-4 h-4 text-[#22c55e] shrink-0" />
                  <span className="font-medium">{siteConfig.contact.email}</span>
                </a>
              </div>

              {/* Website */}
              <div>
                <a
                  href="https://www.traveljust.in"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 hover:text-white transition-colors"
                >
                  <Globe className="w-4 h-4 text-[#22c55e] shrink-0" />
                  <span className="font-medium text-slate-300 hover:text-white">www.traveljust.in</span>
                </a>
              </div>
            </div>
          </div>

          {/* Column 2: NAVIGATION */}
          <div className="md:col-span-3 lg:col-span-3 md:pl-6 space-y-4">
            <h4 className="font-bold text-white text-base tracking-wider uppercase">
              NAVIGATION
            </h4>
            <ul className="space-y-3 text-sm">
              {navLinks.map((link) => (
                <li key={link.name}>
                  <a
                    href={link.href}
                    onClick={(e) => handleNavClick(e, link.href)}
                    className="text-slate-400 hover:text-white transition-colors block"
                  >
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: SERVICES */}
          <div className="md:col-span-4 lg:col-span-4 space-y-4">
            <h4 className="font-bold text-white text-base tracking-wider uppercase">
              SERVICES
            </h4>
            <ul className="space-y-3.5 text-sm">
              {serviceItems.map((service) => (
                <li
                  key={service.name}
                  className="flex items-center justify-between text-slate-400 hover:text-slate-200 transition-colors"
                >
                  <span>{service.name}</span>
                  <span className="text-[#22c55e] text-xs font-semibold pl-4">
                    {service.badge}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Separator Line */}
        <div className="border-t border-slate-900 pt-8" />

        {/* Bottom Bar: Copyright, Privacy Policy, Terms, Fleet Manager */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          <div className="text-[#f59e0b] font-medium">
            © {currentYear} TRAVEL JUST. All rights reserved.
          </div>

          <div className="flex flex-wrap items-center gap-5 sm:gap-6 text-xs">
            <button
              type="button"
              onClick={() => onOpenLegal?.('privacy')}
              className="text-[#f59e0b] hover:text-[#fbbf24] font-semibold transition-colors cursor-pointer"
            >
              Privacy Policy
            </button>

            <span className="text-slate-600 font-bold">•</span>

            <button
              type="button"
              onClick={() => onOpenLegal?.('terms')}
              className="text-[#f59e0b] hover:text-[#fbbf24] font-semibold transition-colors cursor-pointer"
            >
              Terms & Conditions
            </button>

            <span className="text-slate-600 font-bold">•</span>

            <button
              type="button"
              onClick={() => onOpenOwnerPortal?.()}
              className="text-slate-500 hover:text-slate-300 font-medium transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Lock className="w-3.5 h-3.5 text-slate-500" />
              <span>Fleet Manager / Owner Portal</span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
