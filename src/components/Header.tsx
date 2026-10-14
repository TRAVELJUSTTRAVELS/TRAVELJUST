import React, { useState, useEffect, useRef } from 'react';
import {
  Car,
  Menu,
  X,
  Phone,
  ChevronRight,
  ChevronDown,
  LogOut,
  Smartphone,
  Navigation,
  Bookmark,
} from 'lucide-react';
import { siteConfig } from '../config/siteConfig';
import { CustomerUser } from '../types';
import { ThemeToggle } from './ThemeToggle';

interface HeaderProps {
  onBookRideClick: () => void;
  onOpenLegal: (type: 'privacy' | 'terms') => void;
  customer?: CustomerUser | null;
  onOpenCustomerPortal?: (tab?: 'trips' | 'saved' | 'profile') => void;
  onOpenDownloadApp?: () => void;
  onOpenCustomerAuth?: () => void;
  onCustomerLogout?: () => void;
  onOpenTrackBooking?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onBookRideClick,
  onOpenLegal,
  customer = null,
  onOpenCustomerPortal,
  onOpenDownloadApp,
  onOpenCustomerAuth,
  onCustomerLogout,
  onOpenTrackBooking,
}) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [accountDropdownOpen, setAccountDropdownOpen] = useState(false);
  const accountDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        accountDropdownRef.current &&
        !accountDropdownRef.current.contains(event.target as Node)
      ) {
        setAccountDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const navLinks = [
    { name: 'Home', href: '#home' },
    { name: 'Services', href: '#services' },
    { name: 'Fleet', href: '#fleet' },
    { name: 'FAQ', href: '#faq' },
  ];

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    setMobileMenuOpen(false);
    const element = document.querySelector(href);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-40 transition-all duration-250 ${
        isScrolled
          ? 'bg-white/95 backdrop-blur-md shadow-sm py-3 border-b border-emerald-900/10'
          : 'bg-white py-4 border-b border-slate-100'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <a
            href="#home"
            onClick={(e) => handleNavClick(e, '#home')}
            className="flex items-center gap-3 group focus:outline-none focus:ring-2 focus:ring-emerald-600 rounded-lg p-1"
            aria-label="TRAVEL JUST Home"
          >
            <div className="w-10 h-10 rounded-xl bg-[#0a4d3c] flex items-center justify-center text-[#0ef10e] shadow-md shadow-[#0a4d3c]/20 group-hover:bg-[#07382c] transition-colors">
              <Car className="w-6 h-6 stroke-[2.2] text-[#0ef10e]" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-xl tracking-tight text-slate-900 leading-none">
                  TRAVEL <span className="text-[#FE9A00]">JUST</span>
                </span>
              </div>
              <span className="text-[10px] font-bold text-[#14CD03] tracking-wider uppercase mt-0.5">
                JUST BOOK * JUST TRAVEL
              </span>
            </div>
          </a>

          {/* Desktop Navigation */}
          <nav className="hidden items-center gap-6" aria-label="Main Navigation">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                onClick={(e) => handleNavClick(e, link.href)}
                className="hidden text-sm font-medium text-slate-700 hover:text-emerald-800 transition-colors py-1 focus:outline-none focus:ring-2 focus:ring-emerald-600 rounded"
              >
                {link.name}
              </a>
            ))}
          </nav>

          {/* Right Action CTA */}
          <div className="hidden md:flex items-center gap-2.5">
            {/* Download App Button */}
            <button
              id="desktop-download-app-btn"
              type="button"
              onClick={onOpenDownloadApp}
              className="h-10 flex items-center justify-center gap-2 px-3.5 py-2 bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 hover:text-slate-900 dark:text-slate-200 dark:hover:text-white border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 rounded-xl font-semibold text-sm shadow-2xs hover:shadow-xs transition-all active:scale-95 cursor-pointer select-none"
              title="Download TRAVEL JUST Mobile App"
            >
              <Smartphone className="w-4 h-4 text-[#14CD03] shrink-0" />
              <span>App</span>
            </button>

            {/* Customer Login Button with Avatar */}
            <div className="relative" ref={accountDropdownRef}>
              <button
                id="desktop-login-account-btn"
                type="button"
                onClick={() => {
                  if (customer) {
                    setAccountDropdownOpen((prev) => !prev);
                  } else {
                    onOpenCustomerAuth?.();
                  }
                }}
                className="h-10 flex items-center gap-2 pl-2 pr-3.5 py-1.5 bg-white hover:bg-slate-50 active:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700 hover:border-slate-300 rounded-xl text-sm font-semibold shadow-2xs hover:shadow-xs transition-all active:scale-95 cursor-pointer select-none"
                title={customer ? `Signed in as ${customer.fullName}` : 'Login'}
                aria-expanded={accountDropdownOpen}
                aria-haspopup="true"
              >
                <div className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0 overflow-hidden">
                  {customer ? (
                    <span className="font-bold text-xs text-emerald-800 dark:text-emerald-300">
                      {customer.fullName.slice(0, 2).toUpperCase() || 'TJ'}
                    </span>
                  ) : (
                    <svg
                      viewBox="0 0 32 32"
                      className="w-4 h-4 fill-current text-[#14CD03]"
                      aria-hidden="true"
                    >
                      <circle cx="16" cy="10.5" r="4.5" />
                      <path d="M7.5 25.5c0-4.2 3.8-7.5 8.5-7.5s8.5 3.3 8.5 7.5c0 1.4-1.1 2.5-2.5 2.5h-12c-1.4 0-2.5-1.1-2.5-2.5z" />
                    </svg>
                  )}
                </div>

                <span className="truncate max-w-[130px] text-slate-900 dark:text-slate-100 font-bold text-sm">
                  {customer ? customer.fullName : 'Login'}
                </span>

                <ChevronDown
                  className={`w-3.5 h-3.5 text-slate-600 dark:text-slate-400 shrink-0 transition-transform duration-200 ${
                    accountDropdownOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {/* Account Dropdown Menu */}
              {accountDropdownOpen && (
                <div
                  id="desktop-account-dropdown-menu"
                  className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in zoom-in-95 duration-150"
                >
                  {customer ? (
                    <>
                      <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/80">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-[#4D8BF5]/15 text-[#4D8BF5] font-bold text-xs flex items-center justify-center">
                            {customer.fullName.slice(0, 2).toUpperCase() || 'TJ'}
                          </div>
                          <div className="overflow-hidden">
                            <p className="text-xs font-bold text-slate-900 truncate">
                              {customer.fullName}
                            </p>
                            <p className="text-[11px] text-slate-500 truncate">
                              +91 {customer.mobileNumber}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="py-1 text-xs">
                        <button
                          type="button"
                          onClick={() => {
                            setAccountDropdownOpen(false);
                            onOpenCustomerPortal?.('trips');
                          }}
                          className="w-full text-left px-4 py-2 font-semibold text-slate-700 hover:bg-slate-50 hover:text-emerald-800 flex items-center justify-between cursor-pointer"
                        >
                          <span>My Trips & Bookings</span>
                          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setAccountDropdownOpen(false);
                            onOpenTrackBooking?.();
                          }}
                          className="w-full text-left px-4 py-2 font-semibold text-slate-700 hover:bg-slate-50 hover:text-emerald-800 flex items-center justify-between cursor-pointer"
                        >
                          <span className="flex items-center gap-1.5">
                            <Navigation className="w-3.5 h-3.5 text-emerald-700" />
                            <span>Track Booking Status</span>
                          </span>
                          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setAccountDropdownOpen(false);
                            onOpenCustomerPortal?.('saved');
                          }}
                          className="w-full text-left px-4 py-2 font-semibold text-slate-700 hover:bg-slate-50 hover:text-emerald-800 flex items-center justify-between cursor-pointer"
                        >
                          <span className="flex items-center gap-1.5">
                            <Bookmark className="w-3.5 h-3.5 text-amber-500" />
                            <span>Saved Destinations</span>
                          </span>
                          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setAccountDropdownOpen(false);
                            onBookRideClick?.();
                          }}
                          className="w-full text-left px-4 py-2 font-semibold text-slate-700 hover:bg-slate-50 hover:text-emerald-800 flex items-center justify-between cursor-pointer"
                        >
                          <span>Book a New Ride</span>
                          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                        </button>
                      </div>

                      <div className="border-t border-slate-100 pt-1">
                        <button
                          type="button"
                          onClick={() => {
                            setAccountDropdownOpen(false);
                            onCustomerLogout?.();
                          }}
                          className="w-full text-left px-4 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 flex items-center gap-2 cursor-pointer"
                        >
                          <LogOut className="w-3.5 h-3.5" />
                          <span>Sign Out</span>
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="px-4 py-2.5 border-b border-slate-100 bg-slate-50/50">
                        <p className="text-xs font-bold text-slate-900">Welcome to TRAVEL JUST</p>
                        <p className="text-[11px] text-slate-500">Sign in to track trips & invoices</p>
                      </div>

                      <div className="py-1">
                        <button
                          type="button"
                          onClick={() => {
                            setAccountDropdownOpen(false);
                            onOpenTrackBooking?.();
                          }}
                          className="w-full text-left px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-emerald-800 flex items-center justify-between cursor-pointer"
                        >
                          <span className="flex items-center gap-1.5">
                            <Navigation className="w-3.5 h-3.5 text-emerald-700" />
                            <span>Track Ride by Reference ID</span>
                          </span>
                          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                        </button>

                        <button
                          type="button"
                          id="dropdown-login-btn"
                          onClick={() => {
                            setAccountDropdownOpen(false);
                            onOpenCustomerAuth?.();
                          }}
                          className="w-full text-left px-4 py-2.5 text-xs font-bold text-[#4D8BF5] hover:bg-sky-50 flex items-center justify-between cursor-pointer"
                        >
                          <span>Login or Sign Up with OTP</span>
                          <ChevronRight className="w-3.5 h-3.5 text-[#4D8BF5]" />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>



            {/* Dark Mode Theme Toggle for Desktop */}
            <ThemeToggle variant="button" />
          </div>

          {/* Mobile Hamburger & Controls */}
          <div className="flex items-center gap-1.5 md:hidden">
            <ThemeToggle variant="button" showCustomizerButton={false} className="shrink-0" />

            <button
              type="button"
              id="mobile-quick-download-btn"
              onClick={onOpenDownloadApp}
              className="h-9 flex items-center justify-center gap-1.5 px-3 bg-white hover:bg-slate-50 active:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-900 hover:text-slate-950 dark:text-slate-100 dark:hover:text-white border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 rounded-xl text-xs font-semibold shadow-2xs hover:shadow-xs transition-all active:scale-95 cursor-pointer select-none"
              title="Download / Install Mobile App"
            >
              <Smartphone className="w-3.5 h-3.5 text-slate-900 dark:text-slate-100 shrink-0" />
              <span className="text-xs font-semibold text-slate-900 dark:text-slate-100">App</span>
            </button>

            {customer && (
              <button
                type="button"
                onClick={() => onOpenCustomerPortal?.()}
                className="w-9 h-9 rounded-xl bg-emerald-100 border border-emerald-300 text-emerald-950 flex items-center justify-center font-black text-xs shadow-2xs"
                title="My Trips & Account"
                aria-label="My Trips"
              >
                {customer.fullName.slice(0, 2).toUpperCase() || 'TJ'}
              </button>
            )}

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-600"
              aria-expanded={mobileMenuOpen}
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6 text-slate-900" /> : <Menu className="w-6 h-6 text-slate-900" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-100 bg-white px-4 pt-3 pb-6 shadow-xl animate-in slide-in-from-top-2 duration-200">
          {customer && (
            <div className="mb-3 p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-800 text-white flex items-center justify-center font-bold text-sm">
                  {customer.fullName.slice(0, 2).toUpperCase() || 'TJ'}
                </div>
                <div>
                  <h4 className="font-bold text-xs text-emerald-950 leading-tight">
                    {customer.fullName}
                  </h4>
                  <p className="text-[11px] text-emerald-700 mt-0.5">
                    +91 {customer.mobileNumber}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenCustomerPortal?.();
                }}
                className="text-xs font-bold text-emerald-900 bg-white border border-emerald-300 px-3 py-1.5 rounded-xl shadow-2xs"
              >
                My Trips
              </button>
            </div>
          )}

          <div className="flex flex-col gap-1 py-2">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                onClick={(e) => handleNavClick(e, link.href)}
                className="text-base font-medium text-slate-800 hover:text-emerald-800 hover:bg-emerald-50/60 px-3 py-2.5 rounded-lg transition-colors flex items-center justify-between"
              >
                {link.name}
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </a>
            ))}
          </div>

          <div className="pt-3 border-t border-slate-100 space-y-2">
            {/* Mobile Track Ride Live Button */}
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenTrackBooking?.();
              }}
              className="w-full flex items-center justify-between px-3.5 py-2.5 bg-emerald-50 text-emerald-950 border border-emerald-200/80 rounded-xl font-bold text-xs cursor-pointer shadow-2xs active:scale-98"
            >
              <div className="flex items-center gap-2">
                <Navigation className="w-4 h-4 text-emerald-700" />
                <span>Track Ride by Booking ID</span>
              </div>
              <ChevronRight className="w-4 h-4 text-emerald-600" />
            </button>



            <button
              id="mobile-login-account-btn"
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                if (customer) {
                  onOpenCustomerPortal?.();
                } else {
                  onOpenCustomerAuth?.();
                }
              }}
              className="w-full flex items-center justify-between px-3 py-2 bg-white hover:bg-slate-50 text-slate-900 border border-slate-200/90 rounded-full font-bold text-sm cursor-pointer shadow-2xs"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-full bg-[#EEEEEE] border border-slate-200/80 flex items-center justify-center shrink-0 text-[#757575]">
                  {customer ? (
                    <span className="font-bold text-xs text-slate-800">
                      {customer.fullName.slice(0, 2).toUpperCase() || 'TJ'}
                    </span>
                  ) : (
                    <svg viewBox="0 0 32 32" className="w-4.5 h-4.5 fill-current" aria-hidden="true">
                      <circle cx="16" cy="10.5" r="4.5" />
                      <path d="M7.5 25.5c0-4.2 3.8-7.5 8.5-7.5s8.5 3.3 8.5 7.5c0 1.4-1.1 2.5-2.5 2.5h-12c-1.4 0-2.5-1.1-2.5-2.5z" />
                    </svg>
                  )}
                </div>
                <span>{customer ? customer.fullName : 'Login'}</span>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </button>
          </div>

          <div className="pt-2 space-y-3">
            <div className="bg-emerald-50/70 p-3.5 rounded-xl border border-emerald-100 flex items-center justify-between text-xs text-emerald-900">
              <div className="flex items-center gap-2 font-medium">
                <Phone className="w-4 h-4 text-emerald-800" />
                <span>24/7 Helpline: {siteConfig.contact.phone}</span>
              </div>
            </div>

            <div className="flex justify-center gap-4 text-xs text-slate-500 pt-2">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenLegal('privacy');
                }}
                className="hover:underline"
              >
                Privacy Policy
              </button>
              <span>•</span>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenLegal('terms');
                }}
                className="hover:underline"
              >
                Terms & Conditions
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
