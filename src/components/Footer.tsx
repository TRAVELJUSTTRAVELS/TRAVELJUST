import React from 'react';
import { Compass, Phone, Mail, Globe } from 'lucide-react';
import { siteConfig } from '../config/siteConfig';
import { CustomerUser } from '../types';

interface FooterProps {
  onOpenLegal?: (type: 'privacy' | 'terms') => void;
  onBookRideClick?: () => void;
  customer?: CustomerUser | null;
  onOpenCustomerPortal?: () => void;
  onOpenTrackBooking?: () => void;
}

export const Footer: React.FC<FooterProps> = ({
  onOpenLegal,
}) => {
  const currentYear = new Date().getFullYear();

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    let element = document.querySelector(href);
    if (!element && href === '#about') {
      element = document.querySelector('#why-choose-us-section') || document.querySelector('#about');
    }
    if (!element && (href === '#popular-routes-section' || href === '#top-routes-directory-section')) {
      element = document.querySelector('#top-outstation-routes-section') || document.querySelector('#services');
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
    { name: 'Popular Outstation Routes', href: '#top-outstation-routes-section' },
    { name: 'Services', href: '#services' },
    { name: 'Fleet Showcase', href: '#fleet' },
    { name: 'About Us', href: '#why-choose-us-section' },
    { name: 'FAQ', href: '#faq' },
  ];

  const servicesList = [
    { name: 'Local Travel Packages', badge: '4h / 8h / 12h' },
    { name: 'One Way Drop', badge: 'Point-to-Point' },
    { name: 'Round Trip Travel', badge: 'Outbound & Return' },
    { name: 'Airport Transfers', badge: 'Pickup & Drop' },
  ];

  return (
    <footer
      className="w-full font-sans relative border-t border-[#103A2C] transition-colors"
      style={{
        backgroundColor: '#03251B',
        backgroundImage:
          'linear-gradient(to right, #103A2C 1px, transparent 1px), linear-gradient(to bottom, #123D2E 1px, transparent 1px)',
        backgroundSize: '64px 64px',
      }}
      aria-label="Site Footer"
    >
      <div className="w-full pt-14 pb-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-10 lg:gap-14 pb-12">
            {/* Column 1: Brand Info, Slogan, Description, Rating, Contact Details */}
            <div className="md:col-span-5 lg:col-span-5 space-y-4">
              {/* Logo */}
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[#04291F] border border-[#103A2C] flex items-center justify-center text-[#12C998] shadow-xs">
                  <Compass className="w-5 h-5 sm:w-5.5 sm:h-5.5" />
                </div>
                <span className="font-black text-2xl sm:text-[26px] tracking-tight text-[#F5F7F6] leading-none">
                  TRAVEL <span className="text-[#12C998]">JUST</span>
                </span>
              </div>

              {/* Slogan */}
              <div className="text-[#12C998] text-xs font-bold tracking-widest uppercase">
                JUST BOOK * JUST TRAVEL.
              </div>

              {/* Tagline / Description */}
              <p className="text-[#91A99F] text-xs sm:text-[13px] leading-relaxed max-w-sm pt-0.5">
                Reliable rides for local travel, one-way drops, round trips, and airport transfers. Reliable transportation for point-to-point drops, hourly local rentals, and return trips.
              </p>



              {/* Contact Details with Icons */}
              <div className="space-y-2.5 pt-2 text-sm text-[#F5F7F6]">
                <div className="flex flex-wrap items-center gap-x-5 gap-y-2.5 text-xs sm:text-sm">
                  {/* Phone */}
                  <a
                    href={`tel:${siteConfig.contact.phone.replace(/\s+/g, '')}`}
                    className="flex items-center gap-2 text-[#F5F7F6] hover:text-[#12C998] transition-colors"
                  >
                    <Phone className="w-4 h-4 text-[#12C998] shrink-0" />
                    <span className="font-medium">{siteConfig.contact.phone}</span>
                  </a>

                  {/* WhatsApp */}
                  <a
                    href="https://wa.me/919740754400"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-[#F5F7F6] hover:text-[#12C998] transition-colors"
                  >
                    <svg
                      className="w-4 h-4 text-[#12C998] shrink-0"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      aria-hidden="true"
                    >
                      <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
                    </svg>
                    <span className="font-medium">{siteConfig.contact.whatsapp}</span>
                  </a>

                  {/* Email */}
                  <a
                    href="mailto:traveljustmysuru@gmail.com"
                    className="flex items-center gap-2 text-[#F5F7F6] hover:text-[#12C998] transition-colors"
                  >
                    <Mail className="w-4 h-4 text-[#12C998] shrink-0" />
                    <span className="font-medium">traveljustmysuru@gmail.com</span>
                  </a>
                </div>

                {/* Website */}
                <div className="pt-0.5">
                  <a
                    href="https://www.traveljust.in"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-[#F5F7F6] hover:text-[#12C998] transition-colors text-xs sm:text-sm"
                  >
                    <Globe className="w-4 h-4 text-[#12C998] shrink-0" />
                    <span className="font-medium">www.traveljust.in</span>
                  </a>
                </div>
              </div>
            </div>

            {/* Column 2: NAVIGATION */}
            <div className="md:col-span-3 lg:col-span-3 md:pl-6 space-y-3.5">
              <h4 className="font-extrabold text-[#F5F7F6] text-sm sm:text-base tracking-wider uppercase">
                NAVIGATION
              </h4>
              <ul className="space-y-2.5 text-xs sm:text-sm">
                {navLinks.map((link) => (
                  <li key={link.name}>
                    <a
                      href={link.href}
                      onClick={(e) => handleNavClick(e, link.href)}
                      className="text-[#91A99F] hover:text-[#F5F7F6] transition-colors block"
                    >
                      {link.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Column 3: SERVICES */}
            <div className="md:col-span-4 lg:col-span-4 space-y-3.5">
              <h4 className="font-extrabold text-[#F5F7F6] text-sm sm:text-base tracking-wider uppercase">
                SERVICES
              </h4>
              <ul className="space-y-3 text-xs sm:text-sm">
                {servicesList.map((service) => (
                  <li
                    key={service.name}
                    className="flex items-center justify-between text-[#91A99F] hover:text-[#F5F7F6] transition-colors"
                  >
                    <span>{service.name}</span>
                    <span className="text-[#12C998] text-xs sm:text-[13px] font-semibold pl-4">
                      {service.badge}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Separator Line */}
          <div className="border-t border-[#103A2C] pt-6" />

          {/* Bottom Bar: Copyright on left, Policies on right in amber-yellow #D99524 */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs sm:text-sm">
            <div className="text-[#D99524] font-normal">
              &copy; {currentYear} TRAVEL JUST. All rights reserved.
            </div>

            <div className="flex flex-wrap items-center gap-4 sm:gap-5 text-xs sm:text-sm">
              <button
                type="button"
                onClick={() => onOpenLegal?.('privacy')}
                className="text-[#D99524] hover:underline font-medium transition-colors cursor-pointer"
              >
                Privacy Policy
              </button>

              <span className="text-[#103A2C] font-bold">•</span>

              <button
                type="button"
                onClick={() => onOpenLegal?.('terms')}
                className="text-[#D99524] hover:underline font-medium transition-colors cursor-pointer"
              >
                Terms &amp; Conditions
              </button>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
