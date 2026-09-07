import React, { useState } from 'react';
import {
  MapPin,
  Clock,
  Navigation,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  Sparkles,
  Car,
  Plane,
  ChevronDown,
  ChevronUp,
  Phone,
  MessageSquare,
  HelpCircle,
  TrendingUp,
} from 'lucide-react';
import { POPULAR_ROUTE_PAGES, RoutePageData } from '../data/popularRoutesData';
import { BookingSearchState, PlaceSuggestion, ServiceType } from '../types';
import { openWhatsAppChat } from '../utils/whatsapp';
import { siteConfig } from '../config/siteConfig';

interface PopularRoutesLandingSectionProps {
  onSelectRouteForBooking: (
    pickup: string,
    drop: string,
    serviceType: ServiceType,
    estimatedKm?: number
  ) => void;
}

export const PopularRoutesLandingSection: React.FC<PopularRoutesLandingSectionProps> = ({
  onSelectRouteForBooking,
}) => {
  const [selectedRouteId, setSelectedRouteId] = useState<string>('mysore-to-bengaluru');
  const [routeFilter, setRouteFilter] = useState<'all' | 'from-mysore' | 'to-mysore'>('all');
  const [expandedFaqId, setExpandedFaqId] = useState<string | null>(null);

  const filteredRoutes = POPULAR_ROUTE_PAGES.filter((route) => {
    if (routeFilter === 'from-mysore') {
      return route.id.startsWith('mysore-to-');
    }
    if (routeFilter === 'to-mysore') {
      return !route.id.startsWith('mysore-to-');
    }
    return true;
  });

  const activeRoute =
    filteredRoutes.find((r) => r.id === selectedRouteId) ||
    filteredRoutes[0] ||
    POPULAR_ROUTE_PAGES[0];

  const handleBookThisRoute = (route: RoutePageData) => {
    onSelectRouteForBooking(
      route.origin,
      route.destination,
      route.popularServiceType,
      route.distanceKm
    );
  };

  const handleWhatsAppInquiry = (route: RoutePageData) => {
    const text = `Hello TRAVEL JUST! I would like to check availability and book a cab for the ${route.title} (${route.distanceKm} km, ~${route.travelTime}).`;
    openWhatsAppChat(text, siteConfig.contact.whatsapp);
  };

  return (
    <section
      id="popular-routes-section"
      className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto"
      aria-label="Popular Outstation Cab Routes & Destination Guides"
    >
      {/* Section Header */}
      <div className="text-center max-w-3xl mx-auto mb-8 space-y-3">
        <div className="inline-flex items-center gap-2 bg-emerald-100/90 text-emerald-900 border border-emerald-200/80 px-3.5 py-1 rounded-full text-xs font-bold tracking-wide uppercase">
          <TrendingUp className="w-3.5 h-3.5 text-emerald-700" />
          <span>Top Outstation Cab Routes & Dedicated Destination Guides</span>
        </div>

        <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          Travel Just Outstation Taxi & Intercity Cab Hub
        </h2>

        <p className="text-base text-slate-600 font-normal leading-relaxed">
          Comprehensive route guides, transparent per-km fares, highway stopovers, pickup coverage areas, and 1-click instant booking for South India’s most requested taxi routes.
        </p>

        {/* Direction Filter Toggle */}
        <div className="flex items-center justify-center gap-2 pt-2">
          <button
            onClick={() => setRouteFilter('all')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
              routeFilter === 'all'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All 10 Routes
          </button>
          <button
            onClick={() => setRouteFilter('from-mysore')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
              routeFilter === 'from-mysore'
                ? 'bg-emerald-800 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            From Mysore (5)
          </button>
          <button
            onClick={() => setRouteFilter('to-mysore')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
              routeFilter === 'to-mysore'
                ? 'bg-emerald-800 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            To Mysore / Inbound (5)
          </button>
        </div>
      </div>

      {/* Route Selection Tabs - Balanced Multi-Column Layout */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 sm:gap-3 mb-8">
        {filteredRoutes.map((route) => {
          const isSelected = route.id === selectedRouteId;
          const isAirport = route.popularServiceType === 'airport';
          const routeShortName = route.title.split(' Taxi')[0];

          return (
            <button
              key={route.id}
              onClick={() => {
                setSelectedRouteId(route.id);
                setExpandedFaqId(null);
              }}
              className={`p-3.5 rounded-2xl text-left transition-all flex flex-col justify-between cursor-pointer border relative text-xs sm:text-sm ${
                isSelected
                  ? 'bg-emerald-800 text-white border-emerald-900 shadow-md ring-2 ring-emerald-800/20'
                  : 'bg-white hover:bg-slate-50 text-slate-800 border-slate-200 shadow-xs hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between w-full mb-2">
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                    isSelected ? 'bg-emerald-700/80 text-emerald-100' : 'bg-slate-100 text-emerald-800'
                  }`}
                >
                  {isAirport ? <Plane className="w-3.5 h-3.5" /> : <Car className="w-3.5 h-3.5" />}
                </div>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                    isSelected ? 'bg-emerald-700 text-emerald-100' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  ~{route.distanceKm} km
                </span>
              </div>

              <div className="font-bold tracking-tight line-clamp-1 leading-snug">
                {routeShortName}
              </div>

              <div className="mt-2 pt-2 border-t border-slate-100/30 flex items-center justify-between text-[11px]">
                <span className={isSelected ? 'text-emerald-200' : 'text-slate-500 font-medium'}>
                  Starts at
                </span>
                <span className={`font-extrabold ${isSelected ? 'text-white' : 'text-slate-900'}`}>
                  ₹{Number(route.startingFare?.sedan ?? 0).toLocaleString('en-IN')}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Active Route Deep-Dive Card */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Route Hero Banner */}
        <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 text-white p-6 sm:p-10 relative overflow-hidden">
          <div className="relative z-10 max-w-3xl space-y-3">
            <div className="inline-flex items-center gap-2 bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 px-3 py-1 rounded-full text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{activeRoute.heroBadge}</span>
            </div>

            <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              {activeRoute.headline}
            </h3>

            <p className="text-sm sm:text-base text-slate-300 font-normal leading-relaxed">
              {activeRoute.subheadline}
            </p>

            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4">
              <div className="bg-white/10 backdrop-blur-xs rounded-xl p-3 border border-white/10">
                <span className="text-[11px] text-slate-400 block font-medium">Distance</span>
                <span className="text-base font-bold text-emerald-300 flex items-center gap-1 mt-0.5">
                  <Navigation className="w-4 h-4" /> ~{activeRoute.distanceKm} km
                </span>
              </div>
              <div className="bg-white/10 backdrop-blur-xs rounded-xl p-3 border border-white/10">
                <span className="text-[11px] text-slate-400 block font-medium">Travel Time</span>
                <span className="text-base font-bold text-white flex items-center gap-1 mt-0.5">
                  <Clock className="w-4 h-4 text-slate-300" /> {activeRoute.travelTime.split(' via')[0]}
                </span>
              </div>
              <div className="bg-white/10 backdrop-blur-xs rounded-xl p-3 border border-white/10">
                <span className="text-[11px] text-slate-400 block font-medium">Starting From</span>
                <span className="text-base font-bold text-emerald-400 mt-0.5 block">
                  Rs. {Number(activeRoute.startingFare?.sedan ?? 0).toLocaleString('en-IN')}*
                </span>
              </div>
              <div className="bg-white/10 backdrop-blur-xs rounded-xl p-3 border border-white/10">
                <span className="text-[11px] text-slate-400 block font-medium">Service Format</span>
                <span className="text-base font-bold text-white capitalize mt-0.5 block">
                  {activeRoute.popularServiceType === 'oneway'
                    ? 'One Way & Round Trip'
                    : activeRoute.popularServiceType === 'airport'
                    ? '24/7 Airport Transfer'
                    : 'Holiday Round Trip'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Route Details Grid */}
        <div className="p-6 sm:p-10 space-y-10">
          {/* Overview Paragraph */}
          <div className="space-y-3">
            <h4 className="text-lg font-bold text-slate-900">Route Overview & Travel Experience</h4>
            <p className="text-sm text-slate-600 leading-relaxed font-normal">
              {activeRoute.overview}
            </p>
          </div>

          {/* 2-Column Highlights Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Column 1: Key Route Highlights */}
            <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 space-y-3">
              <h5 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                <span>Highway & Journey Highlights</span>
              </h5>
              <ul className="space-y-2 text-xs text-slate-600">
                {activeRoute.routeHighlights.map((point, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-emerald-700 font-bold">•</span>
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Column 2: Doorstep Pickup Coverage */}
            <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 space-y-3">
              <h5 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Navigation className="w-4 h-4 text-emerald-700" />
                <span>Doorstep Pickup Coverage</span>
              </h5>
              <ul className="space-y-2 text-xs text-slate-600">
                {activeRoute.pickupAreas.map((area, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-emerald-700 font-bold">•</span>
                    <span>{area}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Vehicle Fleet Indicative Pricing Table */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <h4 className="text-lg font-bold text-slate-900">
                Estimated Fares by Vehicle Type for this Route
              </h4>
              <span className="text-xs text-[#F54900] font-medium">
                *Note: Toll, parking, and state permit taxes charged as actuals. Driver allowance included.
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="border border-slate-200 rounded-2xl p-4 text-center hover:border-emerald-500 transition-colors bg-white">
                <span className="text-xs font-bold text-slate-500 block uppercase tracking-wide">
                  Sedan (Etios / Dzire)
                </span>
                <span className="text-xl font-extrabold text-slate-900 mt-1 block">
                  Rs. {Number(activeRoute.startingFare?.sedan ?? 0).toLocaleString('en-IN')}
                </span>
                <span className="text-[11px] text-emerald-700 font-semibold block mt-1">
                  4 Passengers • 2 Bags
                </span>
              </div>

              <div className="border border-slate-200 rounded-2xl p-4 text-center hover:border-emerald-500 transition-colors bg-white">
                <span className="text-xs font-bold text-slate-500 block uppercase tracking-wide">
                  Comfort SUV (Ertiga)
                </span>
                <span className="text-xl font-extrabold text-slate-900 mt-1 block">
                  Rs. {Number(activeRoute.startingFare?.suv ?? 0).toLocaleString('en-IN')}
                </span>
                <span className="text-[11px] text-emerald-700 font-semibold block mt-1">
                  6 Passengers • 3 Bags
                </span>
              </div>

              <div className="border border-emerald-200 bg-emerald-50/50 rounded-2xl p-4 text-center hover:border-emerald-500 transition-colors">
                <span className="text-xs font-bold text-emerald-900 block uppercase tracking-wide">
                  Premium (Innova Crysta)
                </span>
                <span className="text-xl font-extrabold text-emerald-950 mt-1 block">
                  Rs. {Number(activeRoute.startingFare?.innovaCrysta ?? 0).toLocaleString('en-IN')}
                </span>
                <span className="text-[11px] text-emerald-700 font-semibold block mt-1">
                  7 Passengers • 4 Bags
                </span>
              </div>

              <div className="border border-slate-200 rounded-2xl p-4 text-center hover:border-emerald-500 transition-colors bg-white">
                <span className="text-xs font-bold text-slate-500 block uppercase tracking-wide">
                  Group (Tempo Traveller)
                </span>
                <span className="text-xl font-extrabold text-slate-900 mt-1 block">
                  Rs. {Number(activeRoute.startingFare?.tempoTraveller ?? 0).toLocaleString('en-IN')}
                </span>
                <span className="text-[11px] text-emerald-700 font-semibold block mt-1">
                  12 Passengers • Large Boot
                </span>
              </div>
            </div>
          </div>

          {/* Action Call-to-Action Bar */}
          <div className="bg-slate-900 rounded-2xl p-6 sm:p-8 text-white flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="space-y-1 text-center sm:text-left">
              <h4 className="text-lg font-bold text-white">
                Ready to Book Your {activeRoute.title.split(' Taxi')[0]} Cab?
              </h4>
              <p className="text-xs sm:text-sm text-slate-300 font-normal">
                Instant confirmation, verified licensed drivers, and zero cancellation fee up to 2 hours before trip.
              </p>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => handleWhatsAppInquiry(activeRoute)}
                className="flex-1 sm:flex-none px-4 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-2 cursor-pointer border border-white/20"
              >
                <MessageSquare className="w-4 h-4 text-emerald-400" />
                <span>WhatsApp Quote</span>
              </button>

              <button
                type="button"
                onClick={() => handleBookThisRoute(activeRoute)}
                className="flex-1 sm:flex-none px-6 py-3 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-extrabold transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Book This Cab</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Route-Specific FAQs Accordion */}
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <h4 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-emerald-700" />
              <span>Frequently Asked Questions about {activeRoute.title}</span>
            </h4>

            <div className="space-y-2">
              {activeRoute.faqs.map((faq, idx) => {
                const isOpen = expandedFaqId === `faq-${idx}`;
                return (
                  <div
                    key={idx}
                    className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50/50"
                  >
                    <button
                      type="button"
                      onClick={() => setExpandedFaqId(isOpen ? null : `faq-${idx}`)}
                      className="w-full text-left p-4 flex items-center justify-between gap-4 font-semibold text-xs sm:text-sm text-slate-900 hover:bg-slate-100/80 transition-colors cursor-pointer"
                    >
                      <span>{faq.question}</span>
                      {isOpen ? (
                        <ChevronUp className="w-4 h-4 text-slate-500 shrink-0" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-slate-500 shrink-0" />
                      )}
                    </button>
                    {isOpen && (
                      <div className="p-4 pt-0 text-xs sm:text-sm text-slate-600 font-normal leading-relaxed border-t border-slate-100 bg-white">
                        {faq.answer}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
