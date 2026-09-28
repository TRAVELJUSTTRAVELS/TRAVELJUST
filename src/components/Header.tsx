import React, { useState, useEffect, useRef } from 'react';
import {
  Car,
  Menu,
  X,
  Phone,
  MessageSquare,
  ChevronRight,
  ChevronDown,
  ShieldAlert,
  LogOut,
  Lock,
  Database,
  User,
  UserCheck,
  Smartphone,
  Zap,
  Sliders,
  Film,
  Sparkles,
} from 'lucide-react';
import { siteConfig } from '../config/siteConfig';
import { CustomerUser } from '../types';

interface HeaderProps {
  onBookRideClick: () => void;
  onOpenLegal: (type: 'privacy' | 'terms') => void;
  isOwner?: boolean;
  onOpenOwnerLogin?: () => void;
  onExitOwnerMode?: () => void;
  onOpenFareEngine?: () => void;
  onOpenSimpleFareEngine?: () => void;
  onOpenAdvancedFareEngine?: () => void;
  customer?: CustomerUser | null;
  onOpenCustomerPortal?: () => void;
  onOpenPartnerDrawer?: () => void;
  onOpenDownloadApp?: () => void;
  onOpenCustomerAuth?: () => void;
  onCustomerLogout?: () => void;
  onOpenTravelStudio?: (initialTab?: 'video' | 'create-image' | 'edit-image') => void;
  onOpenSiteOptimizer?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onBookRideClick,
  onOpenLegal,
  isOwner = false,
  onOpenOwnerLogin,
  onExitOwnerMode,
  onOpenFareEngine,
  onOpenSimpleFareEngine,
  onOpenAdvancedFareEngine,
  customer = null,
  onOpenCustomerPortal,
  onOpenPartnerDrawer,
  onOpenDownloadApp,
  onOpenCustomerAuth,
  onCustomerLogout,
  onOpenTravelStudio,
  onOpenSiteOptimizer,
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

  // Navigation links are visible strictly in owner portal
  const navLinks = isOwner
    ? [
        { name: 'Home', href: '#home' },
        { name: 'Services', href: '#services' },
        { name: 'Fleet', href: '#fleet' },
        { name: 'FAQ', href: '#faq' },
      ]
    : [];

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
                  TRAVEL <span className="text-[#F54900]">JUST</span>
                </span>
                {isOwner && (
                  <span className="bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider">
                    Owner
                  </span>
                )}
              </div>
              <span className="text-[10px] font-bold text-[#14CD03] tracking-wider uppercase mt-0.5">
                JUST BOOK * JUST TRAVEL
              </span>
            </div>
          </a>

          {/* Desktop Navigation - visible only in owner portal */}
          {isOwner && navLinks.length > 0 && (
            <nav className="hidden md:flex items-center gap-6" aria-label="Main Navigation">
              {navLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  onClick={(e) => handleNavClick(e, link.href)}
                  className="text-sm font-medium text-slate-700 hover:text-emerald-800 transition-colors py-1 focus:outline-none focus:ring-2 focus:ring-emerald-600 rounded"
                >
                  {link.name}
                </a>
              ))}
            </nav>
          )}

          {/* Right Action CTA */}
          <div className="hidden md:flex items-center gap-2.5">
            {/* Customer CTA Buttons - Shown ONLY for Customers (hidden in Owner Portal) */}
            {!isOwner && (
              <>
                {/* Download App Button (White Pill with Blue Smartphone Icon) */}
                <button
                  id="desktop-download-app-btn"
                  type="button"
                  onClick={onOpenDownloadApp}
                  className="flex items-center gap-2 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-900 border border-slate-200/90 hover:border-slate-300 rounded-xl font-bold text-sm shadow-2xs hover:shadow-xs transition-all duration-150 cursor-pointer select-none"
                  title="Download TRAVEL JUST Mobile App"
                >
                  <Smartphone className="w-4 h-4 text-[#14CD03] shrink-0" />
                  <span>Download App</span>
                </button>

            {/* Customer Login Button with Circular Avatar Icon */}
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
                className="flex items-center gap-2 pl-1.5 pr-3 py-1 bg-white hover:bg-slate-50 active:bg-slate-100 text-slate-800 border border-slate-200/90 hover:border-slate-300 rounded-full text-sm font-semibold shadow-2xs hover:shadow-xs transition-all duration-150 active:scale-[0.98] cursor-pointer select-none"
                title={customer ? `Signed in as ${customer.fullName}` : 'Customer Login'}
                aria-expanded={accountDropdownOpen}
                aria-haspopup="true"
              >
                {/* Circular Avatar Icon matching reference design */}
                <div className="w-8 h-8 rounded-full bg-[#EEEEEE] border border-slate-200/80 flex items-center justify-center shrink-0 overflow-hidden text-[#14CD03]">
                  {customer ? (
                    <span className="font-bold text-xs text-slate-800">
                      {customer.fullName.slice(0, 2).toUpperCase() || 'TJ'}
                    </span>
                  ) : (
                    <svg
                      viewBox="0 0 32 32"
                      className="w-5 h-5 fill-current"
                      aria-hidden="true"
                    >
                      <circle cx="16" cy="10.5" r="4.5" />
                      <path d="M7.5 25.5c0-4.2 3.8-7.5 8.5-7.5s8.5 3.3 8.5 7.5c0 1.4-1.1 2.5-2.5 2.5h-12c-1.4 0-2.5-1.1-2.5-2.5z" />
                    </svg>
                  )}
                </div>

                <span className="truncate max-w-[130px] text-slate-900 font-bold text-xs sm:text-sm">
                  {customer ? customer.fullName : 'Customer Login'}
                </span>

                <ChevronDown
                  className={`w-3.5 h-3.5 text-slate-400 shrink-0 transition-transform duration-200 ${
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
                            onOpenCustomerPortal?.();
                          }}
                          className="w-full text-left px-4 py-2.5 font-semibold text-slate-700 hover:bg-slate-50 hover:text-emerald-800 flex items-center justify-between cursor-pointer"
                        >
                          <span>My Trips & Bookings</span>
                          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setAccountDropdownOpen(false);
                            onBookRideClick?.();
                          }}
                          className="w-full text-left px-4 py-2.5 font-semibold text-slate-700 hover:bg-slate-50 hover:text-emerald-800 flex items-center justify-between cursor-pointer"
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

                      {/* Login action */}
                    </>
                  )}
                </div>
              )}
            </div>
              </>
            )}

            {/* Owner Mode Actions - ONLY visible to OWNER in Owner Portal mode */}
            {isOwner && (
              <div className="flex items-center gap-2">
                {/* Site Optimizer & WordPress Core Updates - Owner Exclusive */}
                <button
                  id="header-site-optimizer-btn"
                  type="button"
                  onClick={onOpenSiteOptimizer}
                  className="flex items-center gap-1.5 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-[#006045] border border-emerald-300 rounded-xl font-bold text-sm shadow-2xs hover:shadow-xs transition-all duration-150 cursor-pointer select-none"
                  title="Site Optimizer, SEO & Automatic WordPress Core Updates (Owner Only)"
                >
                  <Sparkles className="w-4 h-4 text-[#FE9A00] shrink-0" />
                  <span>Site Optimizer</span>
                </button>

                {/* Fare & Price Engine Button - Shown ONLY in Owner Portal mode */}
                <button
                  id="header-fare-price-engine-btn"
                  type="button"
                  onClick={() => {
                    (onOpenSimpleFareEngine || onOpenFareEngine)?.();
                  }}
                  className="flex items-center gap-2 px-3.5 py-2 bg-[#032014] hover:bg-[#073826] active:bg-[#0a4832] text-white border border-emerald-700/60 hover:border-emerald-500 rounded-xl font-bold text-sm shadow-2xs hover:shadow-xs transition-all duration-150 cursor-pointer select-none active:scale-[0.98]"
                  title="Live Dynamic Fare & Price Engine (Owner Portal)"
                >
                  <Zap className="w-4 h-4 text-[#14CD03] fill-[#14CD03]/30 shrink-0" />
                  <span>Fare & Price Engine</span>
                </button>
                {onExitOwnerMode && (
                  <button
                    type="button"
                    onClick={onExitOwnerMode}
                    className="px-2.5 py-2 text-slate-600 hover:text-red-700 hover:bg-red-50 bg-white border border-slate-200/90 hover:border-slate-300 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-bold shadow-2xs"
                    title="Exit Owner Mode"
                    aria-label="Exit Owner Mode"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Exit</span>
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Mobile Hamburger & Controls */}
          <div className="flex items-center gap-1.5 md:hidden">
            {/* Quick Mobile Owner Controls - Shown ONLY in Owner Mode / Portal */}
            {isOwner && (
              <>
                <button
                  type="button"
                  id="mobile-quick-optimizer-btn"
                  onClick={onOpenSiteOptimizer}
                  className="flex items-center gap-1 px-2.5 py-1.5 bg-emerald-50 text-[#006045] border border-emerald-300 rounded-xl text-xs font-bold shadow-2xs active:scale-95 transition-all cursor-pointer"
                  title="Site Optimizer & WordPress (Owner Only)"
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#FE9A00]" />
                  <span className="text-[11px] font-bold">SEO</span>
                </button>

                <button
                  type="button"
                  id="mobile-quick-fare-engine-btn"
                  onClick={() => (onOpenSimpleFareEngine || onOpenFareEngine)?.()}
                  className="flex items-center gap-1 px-2.5 py-1.5 bg-[#032014] text-[#14CD03] border border-emerald-800 rounded-xl text-xs font-extrabold shadow-2xs active:scale-95 transition-all cursor-pointer"
                  title="Dynamic Fare & Price Engine (Owner Mode)"
                >
                  <Zap className="w-3.5 h-3.5 text-[#14CD03] fill-[#14CD03]/30" />
                  <span className="text-[11px] text-white">Fare Engine</span>
                </button>
              </>
            )}

            {/* Quick Mobile App Install / Download Icon Button - Shown to Customers */}
            {!isOwner && (
              <button
                type="button"
                id="mobile-quick-download-btn"
                onClick={onOpenDownloadApp}
                className="flex items-center gap-1 px-2.5 py-1.5 bg-white text-slate-800 border border-slate-200 rounded-xl text-xs font-bold shadow-2xs active:scale-95 transition-all"
                title="Download / Install Mobile App"
              >
                <Smartphone className="w-3.5 h-3.5 text-[#14CD03]" />
                <span className="text-[11px] text-slate-800">App</span>
              </button>
            )}

            {/* Customer Profile Quick Icon on Mobile if logged in */}
            {customer && (
              <button
                type="button"
                onClick={onOpenCustomerPortal}
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
          {/* Customer Account card on Mobile if logged in */}
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

          {/* If Owner Mode is active, show banner */}
          {isOwner && (
            <div className="mb-3 space-y-2">
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-amber-700" />
                  <span className="text-xs font-bold text-amber-900">Owner Mode Active</span>
                </div>
                {onExitOwnerMode && (
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      onExitOwnerMode();
                    }}
                    className="text-xs font-bold text-red-700 hover:underline"
                  >
                    Exit Mode
                  </button>
                )}
              </div>
            </div>
          )}

          {isOwner && navLinks.length > 0 && (
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
          )}

          <div className="flex flex-col gap-1 py-1">
            {onOpenPartnerDrawer && (
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenPartnerDrawer();
                }}
                className="text-left text-base font-bold text-emerald-950 bg-emerald-50 hover:bg-emerald-100 px-3 py-2.5 rounded-lg transition-colors flex items-center justify-between border border-emerald-200 mt-1"
              >
                <div className="flex items-center gap-2">
                  <Car className="w-4 h-4 text-emerald-700" />
                  <span>Attach Your Cab / Partner</span>
                </div>
                <span className="text-[10px] uppercase font-black bg-emerald-600 text-white px-2 py-0.5 rounded-md">
                  Drive With Us
                </span>
              </button>
            )}

            {/* In mobile nav: only show Owner tools if Owner */}
            {isOwner && (
              <div className="space-y-1.5 mt-2 pt-2 border-t border-amber-200">
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenSiteOptimizer?.();
                  }}
                  className="w-full text-left text-xs font-bold text-[#006045] bg-emerald-50 hover:bg-emerald-100 px-3 py-2.5 rounded-lg transition-colors flex items-center justify-between border border-emerald-300 cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#FE9A00]" />
                    <span>Site Optimizer & WordPress</span>
                  </div>
                  <span className="text-[10px] uppercase font-black bg-[#006045] text-white px-2 py-0.5 rounded-md">
                    Owner Pro
                  </span>
                </button>

                {onExitOwnerMode && (
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      onExitOwnerMode();
                    }}
                    className="w-full text-left text-xs font-bold text-red-700 bg-red-50 hover:bg-red-100 px-3 py-2.5 rounded-lg transition-colors flex items-center justify-between border border-red-200 cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <LogOut className="w-4 h-4 text-red-700" />
                      <span>Exit Owner Mode</span>
                    </div>
                  </button>
                )}
              </div>
            )}
          </div>

          {!isOwner && (
            <div className="pt-3 border-t border-slate-100 space-y-2">
              {/* Mobile Download App Button */}
              <button
                id="mobile-download-app-btn"
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenDownloadApp?.();
                }}
                className="w-full flex items-center justify-between px-3.5 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-900 border border-slate-200 rounded-xl font-bold text-sm cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <Smartphone className="w-4 h-4 text-[#14CD03]" />
                  <span>Download App</span>
                </div>
                <span className="text-[10px] uppercase font-bold bg-emerald-100 text-emerald-900 px-2 py-0.5 rounded">
                  Android & iOS
                </span>
              </button>

              {/* Mobile Login / Account Button */}
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
                  <span>{customer ? customer.fullName : 'Customer Login'}</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>
            </div>
          )}

          {/* Fare & Price Engine & Owner Tools in Mobile Menu - ONLY in Owner Portal mode */}
          {isOwner && (
            <div className="space-y-2">
              <div className="p-3 bg-gradient-to-r from-emerald-950 via-slate-900 to-emerald-950 rounded-2xl border border-emerald-800/60 space-y-2 text-white shadow-xs">
                <div className="text-[11px] font-bold text-emerald-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-[#14CD03] fill-[#14CD03]/30" />
                  <span>Centralized Pricing Console</span>
                </div>
                <button
                  type="button"
                  id="mobile-fare-price-engine-btn"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    (onOpenSimpleFareEngine || onOpenFareEngine)?.();
                  }}
                  className="w-full py-2.5 px-3.5 bg-emerald-600 hover:bg-emerald-500 text-slate-950 rounded-xl text-xs font-black flex items-center justify-between cursor-pointer shadow-xs active:scale-[0.98] transition-all"
                >
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 fill-slate-950 text-slate-900" />
                    <span>Fare & Price Engine</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-900" />
                </button>
              </div>

              {/* Travel Studio Button in Mobile Menu - Owner Portal Only */}
              <button
                type="button"
                id="mobile-travel-studio-btn"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenTravelStudio?.('video');
                }}
                className="w-full flex items-center justify-between px-3.5 py-2.5 bg-[#032014] hover:bg-[#073826] text-white border border-emerald-700/60 rounded-2xl font-bold text-xs cursor-pointer shadow-2xs"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-xl bg-emerald-900/80 flex items-center justify-center text-[#14CD03] shrink-0 border border-emerald-700/60">
                    <Film className="w-4 h-4" />
                  </div>
                  <div className="text-left">
                    <span className="block leading-tight font-extrabold text-white">Travel Studio (AI Media)</span>
                    <span className="text-[10px] text-emerald-300 font-semibold">Veo Videos & Gemini Destination Art</span>
                  </div>
                </div>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-[#14CD03] text-[#032014]">
                  Owner
                </span>
              </button>
            </div>
          )}

          {/* Owner Quick Access in Mobile Menu */}
          {isOwner && (
            <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 space-y-2">
              <div className="text-[11px] font-bold text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-600 fill-amber-600" />
                <span>Authoritative Pricing</span>
              </div>
              <button
                type="button"
                id="mobile-fare-engine-btn"
                onClick={() => {
                  setMobileMenuOpen(false);
                  (onOpenFareEngine || onOpenSimpleFareEngine || onOpenAdvancedFareEngine)?.();
                }}
                className="w-full py-2 px-3 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <Zap className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
                <span>FARE & PRICE ENGINE</span>
              </button>
            </div>
          )}

          <div className="pt-2 space-y-3">
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onBookRideClick();
              }}
              className="w-full bg-emerald-800 hover:bg-emerald-900 text-white font-semibold py-3 px-4 rounded-xl shadow text-center flex items-center justify-center gap-2 text-base"
            >
              Book a Ride Now
              <ChevronRight className="w-5 h-5" />
            </button>

            <div className="bg-emerald-50/70 p-3.5 rounded-xl border border-emerald-100 flex items-center justify-between text-xs text-emerald-900">
              <div className="flex items-center gap-2 font-medium">
                <Phone className="w-4 h-4 text-emerald-800" />
                <span>Support: {siteConfig.contact.phone}</span>
              </div>
              <div className="flex items-center gap-2 font-medium">
                <MessageSquare className="w-4 h-4 text-emerald-800" />
                <span>WhatsApp Available</span>
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
