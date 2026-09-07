import React, { useState, useEffect } from 'react';
import {
  Car,
  Menu,
  X,
  Phone,
  MessageSquare,
  ChevronRight,
  Sliders,
  ShieldAlert,
  LogOut,
  Lock,
  Database,
  User,
  UserCheck,
} from 'lucide-react';
import { siteConfig } from '../config/siteConfig';
import { CustomerUser } from '../types';

interface HeaderProps {
  onBookRideClick: () => void;
  onOpenFareEngine?: () => void;
  onOpenLegal: (type: 'privacy' | 'terms') => void;
  isOwner?: boolean;
  onOpenOwnerLogin?: () => void;
  onExitOwnerMode?: () => void;
  customer?: CustomerUser | null;
  onOpenCustomerLogin?: () => void;
  onOpenCustomerPortal?: () => void;
  onOpenPartnerDrawer?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onBookRideClick,
  onOpenFareEngine,
  onOpenLegal,
  isOwner = false,
  onOpenOwnerLogin,
  onExitOwnerMode,
  customer = null,
  onOpenCustomerLogin,
  onOpenCustomerPortal,
  onOpenPartnerDrawer,
}) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = isOwner
    ? [
        { name: 'Home', href: '#home' },
        { name: 'Routes & Outstation', href: '#popular-routes-section' },
        { name: 'Services', href: '#services' },
        { name: 'Fleet', href: '#fleet' },
        { name: 'AI Concierge', href: '#contact' },
        { name: 'Live Dispatch', href: '#recent-trips' },
        { name: 'About', href: '#about' },
        { name: 'FAQ', href: '#faq' },
      ]
    : [
        { name: 'Home', href: '#home' },
        { name: 'Routes & Outstation', href: '#popular-routes-section' },
        { name: 'Services', href: '#services' },
        { name: 'Fleet', href: '#fleet' },
        { name: 'AI Concierge', href: '#contact' },
        { name: 'About', href: '#about' },
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

          {/* Desktop Navigation */}
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

          {/* Right Action CTA */}
          <div className="hidden md:flex items-center gap-2.5">
            {/* Price / Fare Engine & Dispatch - ONLY visible to OWNER */}
            {isOwner && (
              <div className="flex items-center gap-1.5 bg-amber-50/80 p-1 rounded-2xl border border-amber-200">
                {onOpenFareEngine && (
                  <button
                    onClick={onOpenFareEngine}
                    className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold text-xs px-3.5 py-2 rounded-xl transition-all duration-200 flex items-center gap-1.5 shadow-xs"
                    title="Open Owner Dynamic Price & Fare Engine"
                  >
                    <Sliders className="w-4 h-4 text-slate-950" />
                    <span>Price Engine</span>
                  </button>
                )}

                <a
                  href="#recent-trips"
                  onClick={(e) => handleNavClick(e, '#recent-trips')}
                  className="bg-slate-900 hover:bg-slate-800 text-amber-300 font-bold text-xs px-3 py-2 rounded-xl transition-colors flex items-center gap-1.5"
                  title="View Live Dispatch & Bookings Registry"
                >
                  <Database className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Dispatch Registry</span>
                </a>

                {onExitOwnerMode && (
                  <button
                    onClick={onExitOwnerMode}
                    className="p-2 text-slate-600 hover:text-red-700 hover:bg-red-50 rounded-xl transition-colors"
                    title="Exit Owner Mode"
                    aria-label="Exit Owner Mode"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            )}

            {/* Driver Partner / Fleet Attachment CTA */}
            {onOpenPartnerDrawer && (
              <button
                type="button"
                onClick={onOpenPartnerDrawer}
                className="hidden"
                title="Attach Your Cab / Drive With Us in Karnataka"
              >
                <Car className="w-3.5 h-3.5 text-emerald-700" />
                <span>Attach Cab / Partner</span>
              </button>
            )}

            {/* Customer Login / My Account Button */}
            {customer ? (
              <button
                type="button"
                onClick={onOpenCustomerPortal}
                className="bg-emerald-50 hover:bg-emerald-100 text-emerald-950 border border-emerald-200/80 font-bold text-xs px-3.5 py-2 rounded-xl transition-all duration-200 flex items-center gap-2 shadow-2xs"
                title="Customer Profile & My Trips"
              >
                <div className="w-6 h-6 rounded-full bg-emerald-800 text-white flex items-center justify-center text-[10px] font-black">
                  {customer.fullName.slice(0, 2).toUpperCase() || 'TJ'}
                </div>
                <div className="flex flex-col text-left">
                  <span className="leading-tight text-slate-900">{customer.fullName.split(' ')[0]}</span>
                  <span className="text-[10px] text-emerald-700 font-semibold leading-none">My Trips</span>
                </div>
              </button>
            ) : (
              onOpenCustomerLogin && (
                <button
                  type="button"
                  onClick={onOpenCustomerLogin}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs px-3.5 py-2.5 rounded-xl transition-colors flex items-center gap-1.5"
                  title="Customer Sign In / My Bookings"
                >
                  <User className="w-3.5 h-3.5 text-slate-600" />
                  <span>Customer Login</span>
                </button>
              )
            )}

            <button
              onClick={onBookRideClick}
              className="bg-emerald-800 hover:bg-emerald-900 text-white font-semibold text-sm px-5 py-2.5 rounded-xl shadow-sm hover:shadow transition-all duration-200 active:scale-[0.98] flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-emerald-600"
            >
              Book a Ride
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Mobile Hamburger & Controls */}
          <div className="flex items-center gap-2 md:hidden">
            {/* Customer Login / Profile Quick Icon on Mobile */}
            {customer ? (
              <button
                type="button"
                onClick={onOpenCustomerPortal}
                className="w-9 h-9 rounded-xl bg-emerald-100 border border-emerald-300 text-emerald-950 flex items-center justify-center font-black text-xs shadow-2xs"
                title="My Trips & Account"
                aria-label="My Trips"
              >
                {customer.fullName.slice(0, 2).toUpperCase() || 'TJ'}
              </button>
            ) : (
              onOpenCustomerLogin && (
                <button
                  type="button"
                  onClick={onOpenCustomerLogin}
                  className="p-2 text-slate-700 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors"
                  title="Customer Login"
                  aria-label="Customer Login"
                >
                  <User className="w-4 h-4" />
                </button>
              )
            )}

            {/* Price & Fare Engine - ONLY visible to OWNER on Mobile */}
            {isOwner && onOpenFareEngine && (
              <button
                onClick={onOpenFareEngine}
                className="p-2 text-slate-900 bg-amber-400 hover:bg-amber-500 rounded-xl border border-amber-500 shadow-xs"
                title="Owner Price & Fare Engine"
                aria-label="Price & Fare Engine"
              >
                <Sliders className="w-5 h-5 text-slate-950" />
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
          {/* Customer Account card on Mobile */}
          {customer ? (
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
          ) : (
            <div className="mb-3 p-3 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-slate-200 text-slate-700 flex items-center justify-center">
                  <User className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <span className="text-xs font-bold text-slate-900 block leading-tight">
                    Customer Account
                  </span>
                  <span className="text-[10px] text-slate-500">
                    Sign in for 1-click booking & receipts
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenCustomerLogin?.();
                }}
                className="text-xs font-bold text-white bg-emerald-800 hover:bg-emerald-900 px-3 py-1.5 rounded-xl transition-colors shadow-xs"
              >
                Login
              </button>
            </div>
          )}

          {/* If Owner Mode is active, show banner */}
          {isOwner && (
            <div className="mb-3 p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between">
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
                {onOpenFareEngine && (
                  <button
                    type="button"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      onOpenFareEngine();
                    }}
                    className="w-full text-left text-sm font-bold text-slate-900 bg-amber-100/70 hover:bg-amber-200/80 px-3 py-2.5 rounded-lg transition-colors flex items-center justify-between border border-amber-300/60"
                  >
                    <div className="flex items-center gap-2">
                      <Sliders className="w-4 h-4 text-slate-950" />
                      <span>Price & Fare Engine</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-amber-700" />
                  </button>
                )}

                <a
                  href="#recent-trips"
                  onClick={(e) => handleNavClick(e, '#recent-trips')}
                  className="w-full text-left text-sm font-bold text-amber-950 bg-amber-50 hover:bg-amber-100 px-3 py-2.5 rounded-lg transition-colors flex items-center justify-between border border-amber-200"
                >
                  <div className="flex items-center gap-2">
                    <Database className="w-4 h-4 text-emerald-700" />
                    <span>Live Dispatch & Bookings Registry</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-amber-700" />
                </a>
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-slate-100 space-y-3">
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
