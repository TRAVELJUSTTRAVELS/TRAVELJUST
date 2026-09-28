import React, { useState, useEffect, useCallback } from 'react';
import {
  CheckCircle2,
  Sparkles,
  Clock,
  ArrowRight,
  User,
  MapPin,
  Film,
} from 'lucide-react';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { BookingSearch } from './components/BookingSearch';
import { SearchResults } from './components/SearchResults';
import { ServicesSection } from './components/ServicesSection';
import { FleetSection } from './components/FleetSection';
import { TopRoutesDirectorySection } from './components/TopRoutesDirectorySection';
import { WhyChooseUs } from './components/WhyChooseUs';
import { FAQSection } from './components/FAQSection';
import { Footer } from './components/Footer';
import { BookingModal } from './components/BookingModal';
import { OwnerAuthModal } from './components/OwnerAuthModal';
import { CustomerAuthModal } from './components/CustomerAuthModal';
import { MobileInstallBanner } from './components/MobileInstallBanner';
import { InAppPushNotificationBanner } from './components/InAppPushNotificationBanner';
import { ContactAIChat } from './components/ContactAIChat';
import { OfflineIndicator } from './components/OfflineIndicator';

// Code-split heavy modals to dramatically accelerate initial load time and optimize Core Web Vitals
const LegalModal = React.lazy(() => import('./components/LegalModal').then(m => ({ default: m.LegalModal })));
const CustomerPortalModal = React.lazy(() => import('./components/CustomerPortalModal').then(m => ({ default: m.CustomerPortalModal })));
const OwnerPortalModal = React.lazy(() => import('./components/OwnerPortalModal').then(m => ({ default: m.OwnerPortalModal })));
const FareEngineModal = React.lazy(() => import('./components/FareEngineModal').then(m => ({ default: m.FareEngineModal })));
const DriverPartnerDrawer = React.lazy(() => import('./components/DriverPartnerDrawer').then(m => ({ default: m.DriverPartnerDrawer })));
const DownloadAppModal = React.lazy(() => import('./components/DownloadAppModal').then(m => ({ default: m.DownloadAppModal })));
const TravelExpertPopupModal = React.lazy(() => import('./components/TravelExpertPopupModal').then(m => ({ default: m.TravelExpertPopupModal })));
const TravelStudioModal = React.lazy(() => import('./components/TravelStudioModal').then(m => ({ default: m.TravelStudioModal })));
const SiteOptimizerModal = React.lazy(() => import('./components/SiteOptimizerModal').then(m => ({ default: m.SiteOptimizerModal })));
import { saveSearchToServiceWorkerCache } from './services/searchCacheService';
import { calculateRouteDistance } from './services/googleMapsService';
import { getStoredCustomer, clearCustomerSession, saveCustomerSession } from './services/customerAuthService';
import { auth, signOut, onAuthStateChanged, syncUserProfile } from './lib/firebase';
import { calculateFare } from './utils/fareCalculator';
import { saveBookingToSupabase } from './services/supabaseService';
import { formatBookingConfirmationMessage, openWhatsAppChat } from './utils/whatsapp';
import { siteConfig } from './config/siteConfig';
import { fareService } from './services/fareService';
import {
  BookingSearchState,
  Vehicle,
  PricingConfig,
  ServiceType,
  BookingRequest,
  PassengerDetails,
  PlaceSuggestion,
  CustomerUser,
  BookingDraftPlan,
} from './types';
import { defaultPricingConfig } from './config/siteConfig';
import { vehiclesData } from './data/vehicles';
import { generateSchemaMarkup } from './utils/seo';

export default function App() {
  const [pricingConfig, setPricingConfig] = useState<PricingConfig>(() => {
    try {
      const saved = localStorage.getItem('tj_pricing_config');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.vehiclePricing) {
          Object.keys(defaultPricingConfig.vehiclePricing).forEach((vid) => {
            if (!parsed.vehiclePricing[vid]) {
              parsed.vehiclePricing[vid] = defaultPricingConfig.vehiclePricing[vid];
            }
          });
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Could not load saved pricing config:', e);
    }
    return defaultPricingConfig;
  });

  // Owner authentication state - Restricted to business owner only
  const [isOwner, setIsOwner] = useState<boolean>(() => {
    try {
      // Check query parameter ?owner=true or ?admin=true
      if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search);
        if (params.get('owner') === 'true' || params.get('admin') === 'true' || params.get('owner') === '1') {
          return true;
        }
      }
      return localStorage.getItem('tj_is_owner') === 'true';
    } catch {
      return false;
    }
  });

  // Customer authentication state
  const [customer, setCustomer] = useState<CustomerUser | null>(() => getStoredCustomer());
  const [customerPortalModalOpen, setCustomerPortalModalOpen] = useState(false);

  const [ownerAuthModalOpen, setOwnerAuthModalOpen] = useState(false);
  const [ownerPortalModalOpen, setOwnerPortalModalOpen] = useState(false);
  const [fareEngineModalOpen, setFareEngineModalOpen] = useState(false);
  const [fareEngineInitialMode, setFareEngineInitialMode] = useState<'SIMPLE' | 'ADVANCED'>('SIMPLE');
  const [fareUpdateTrigger, setFareUpdateTrigger] = useState(0);

  const handleOpenSimpleFareEngine = () => {
    setFareEngineInitialMode('SIMPLE');
    setFareEngineModalOpen(true);
  };

  const handleOpenAdvancedFareEngine = () => {
    setFareEngineInitialMode('ADVANCED');
    setFareEngineModalOpen(true);
  };

  const [searchState, setSearchState] = useState<BookingSearchState | null>(null);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [legalModalType, setLegalModalType] = useState<'privacy' | 'terms' | null>(null);
  const [partnerDrawerOpen, setPartnerDrawerOpen] = useState(false);
  const [downloadAppModalOpen, setDownloadAppModalOpen] = useState(false);
  const [customerAuthModalOpen, setCustomerAuthModalOpen] = useState(false);
  const [travelExpertModalOpen, setTravelExpertModalOpen] = useState(false);
  const [travelStudioModalOpen, setTravelStudioModalOpen] = useState(false);
  const [travelStudioInitialTab, setTravelStudioInitialTab] = useState<'video' | 'create-image' | 'edit-image'>('video');
  const [siteOptimizerModalOpen, setSiteOptimizerModalOpen] = useState(false);

  const handleOpenTravelStudio = (tab: 'video' | 'create-image' | 'edit-image' = 'video') => {
    setTravelStudioInitialTab(tab);
    setTravelStudioModalOpen(true);
  };

  const handleApplyBookingPlan = (plan: BookingDraftPlan) => {
    const today = new Date().toISOString().split('T')[0];
    const serviceType: ServiceType = (plan.serviceType as ServiceType) || 'airport';
    const draftState: BookingSearchState = {
      serviceType,
      pickupLocation: plan.pickupLocation || 'Mysuru, Karnataka',
      dropLocation: plan.dropLocation || 'Kempegowda International Airport (BLR)',
      travelDate: plan.travelDate || today,
      pickupDate: plan.travelDate || today,
      dropDate: today,
      returnDate: today,
      pickupTime: plan.pickupTime || '07:00 AM',
      durationHours: plan.durationHours || 8,
      airportTransferType: 'pickup',
      passengers: plan.passengers || 2,
      vehicleType: plan.vehicleType || 'all',
    };
    setSearchState(draftState);
    handleScrollToBookingSearch();
  };

  // Listen for Live Instant Fare & Price Engine updates across all tabs & components
  useEffect(() => {
    const applyLiveFareUpdate = (updatedConfig: any) => {
      setPricingConfig((prev) => {
        const next = fareService.syncCentralizedToSitePricingConfig(updatedConfig, prev);
        try {
          localStorage.setItem('tj_pricing_config', JSON.stringify(next));
        } catch (e) {
          // ignore
        }
        return next;
      });
      setFareUpdateTrigger((prev) => prev + 1);
    };

    // Initial sync from fareService centralized config
    const currentCentral = fareService.getCentralizedConfigSync();
    if (currentCentral) {
      applyLiveFareUpdate(currentCentral);
    }

    // Immediately fetch latest authoritative config from server/cloud (no-store cache)
    fareService.getCentralizedConfig().then((fresh) => {
      if (fresh) {
        applyLiveFareUpdate(fresh);
      }
    }).catch(() => {});

    // Subscribe to fareService directly
    const unsubscribe = fareService.subscribe(applyLiveFareUpdate);

    // Also listen to window custom event for cross-component triggers
    const windowListener = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail) {
        applyLiveFareUpdate(customEvent.detail);
      } else {
        const fresh = fareService.getCentralizedConfigSync();
        applyLiveFareUpdate(fresh);
      }
    };
    window.addEventListener('tj_fares_updated', windowListener);

    return () => {
      unsubscribe();
      window.removeEventListener('tj_fares_updated', windowListener);
    };
  }, []);

  // Synchronize Firebase Auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const profile = await syncUserProfile(firebaseUser);
          setCustomer((prev) => {
            if (prev && prev.id === firebaseUser.uid) return prev;
            const phoneDigits = firebaseUser.phoneNumber ? firebaseUser.phoneNumber.replace(/\D/g, '').slice(-10) : '';
            const cUser: CustomerUser = {
              id: firebaseUser.uid,
              fullName: firebaseUser.displayName || profile.displayName || prev?.fullName || 'Google Passenger',
              mobileNumber: phoneDigits || prev?.mobileNumber || '9876543210',
              email: firebaseUser.email || profile.email || prev?.email || undefined,
              createdAt: prev?.createdAt || new Date().toISOString(),
              lastLoginAt: new Date().toISOString(),
            };
            saveCustomerSession(cUser);
            return cUser;
          });
        } catch (err) {
          console.warn('Firebase profile sync error:', err);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  // Trigger 24x7 Travel Expert popup after 30 seconds of website opening
  useEffect(() => {
    try {
      if (sessionStorage.getItem('tj_travel_expert_dismissed') === 'true') {
        return;
      }
    } catch (e) {
      console.warn('Session storage inaccessible', e);
    }

    const timer = setTimeout(() => {
      // Show only if not in owner portal mode
      const isOwnerActive = localStorage.getItem('tj_is_owner') === 'true';
      if (!isOwnerActive) {
        setTravelExpertModalOpen(true);
      }
    }, 30000); // 30 seconds

    return () => clearTimeout(timer);
  }, []);

  // When app opens, ensure section#home is shown first
  useEffect(() => {
    if (typeof window !== 'undefined') {
      if ('scrollRestoration' in window.history) {
        window.history.scrollRestoration = 'manual';
      }
      if (window.location.hash && window.location.hash !== '#home') {
        try {
          window.history.replaceState(null, '', window.location.pathname);
        } catch {
          // ignore
        }
      }
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      const homeElem = document.getElementById('home');
      if (homeElem) {
        homeElem.scrollIntoView({ behavior: 'instant', block: 'start' });
      }
    }
  }, []);

  const handleCloseTravelExpertModal = () => {
    setTravelExpertModalOpen(false);
    try {
      sessionStorage.setItem('tj_travel_expert_dismissed', 'true');
    } catch (e) {
      console.warn('Could not store dismissal flag', e);
    }
  };

  const handleOwnerLoginSuccess = () => {
    setIsOwner(true);
    setOwnerPortalModalOpen(true);
    try {
      localStorage.setItem('tj_is_owner', 'true');
    } catch (e) {
      console.warn('Could not persist owner state:', e);
    }
  };

  const handleExitOwnerMode = () => {
    setIsOwner(false);
    setOwnerPortalModalOpen(false);
    try {
      localStorage.removeItem('tj_is_owner');
    } catch (e) {
      console.warn('Could not clear owner state:', e);
    }
  };

  const handleCustomerLogout = () => {
    signOut(auth).catch(() => {});
    clearCustomerSession();
    setCustomer(null);
    setCustomerPortalModalOpen(false);
  };

  const handleUpdateCustomerProfile = (updated: CustomerUser) => {
    setCustomer(updated);
  };

  // Inject Schema.org JSON-LD structured data for SEO
  useEffect(() => {
    const schemas = generateSchemaMarkup();
    const scriptTag = document.createElement('script');
    scriptTag.type = 'application/ld+json';
    scriptTag.text = JSON.stringify(schemas);
    document.head.appendChild(scriptTag);

    return () => {
      document.head.removeChild(scriptTag);
    };
  }, []);

  const handleSearchSubmit = useCallback((state: BookingSearchState) => {
    setSearchState(state);
    // Cache search details and pre-calculated fares to Service Worker Cache
    saveSearchToServiceWorkerCache(state, pricingConfig).catch((err) => {
      console.warn('Service Worker background search caching error:', err);
    });
    // Smooth scroll to search results
    setTimeout(() => {
      const resultsElem = document.getElementById('search-results-anchor');
      if (resultsElem) {
        resultsElem.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
  }, [pricingConfig]);

  const handleSelectCachedSearch = useCallback((cachedSearch: BookingSearchState) => {
    setSearchState(cachedSearch);
    setSelectedVehicle(null);
    setTimeout(() => {
      const resultsElem = document.getElementById('search-results-anchor');
      if (resultsElem) {
        resultsElem.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
  }, []);

  const handleCompleteBooking = useCallback((booking: BookingRequest) => {
    // If customer is logged in, link booking to customer account
    if (customer) {
      const updatedCustomer = {
        ...customer,
        totalTripsCount: (customer.totalTripsCount || 0) + 1,
      };
      setCustomer(updatedCustomer);
      saveCustomerSession(updatedCustomer);
    }
  }, [customer]);

  const handleDirectConfirmBooking = useCallback(
    (customSearch?: BookingSearchState, customVehicle?: Vehicle) => {
      const activeSearch = customSearch || searchState;
      const activeVehicle = customVehicle || selectedVehicle || vehiclesData[0];
      if (!activeSearch || !activeVehicle) return;

      const randomNum = Math.floor(10000 + Math.random() * 90000);
      const refId = `TJ-${randomNum}`;

      const fareEstimate = calculateFare(activeSearch, activeVehicle, pricingConfig);

      const passengerDetails: PassengerDetails = {
        fullName: customer?.fullName || 'Customer',
        mobileNumber: customer?.mobileNumber || '',
        email: customer?.email || '',
        specialInstructions: '',
      };

      const newBooking: BookingRequest = {
        referenceId: refId,
        searchDetails: activeSearch,
        selectedVehicle: activeVehicle,
        passengerDetails,
        estimatedFare: fareEstimate,
        createdAt: new Date().toISOString(),
        status: 'Pending Confirmation',
        fare_snapshot: fareEstimate.fareSnapshot,
        pricing_version: fareEstimate.pricingVersion,
      };

      // Save to Supabase and remote registry
      saveBookingToSupabase(newBooking)
        .then((res) => console.log('Booking recorded in database:', res))
        .catch((err) => console.warn('Booking save error:', err));

      handleCompleteBooking(newBooking);

      // Build message with exact 5 points and Call Fleet Desk
      const message = formatBookingConfirmationMessage({
        referenceId: refId,
        searchDetails: activeSearch,
        selectedVehicle: activeVehicle,
        passengerDetails,
        estimatedFare: fareEstimate,
      });

      // Send directly to customer on WhatsApp
      const targetPhone =
        customer?.mobileNumber && customer.mobileNumber.trim().length >= 10
          ? customer.mobileNumber
          : siteConfig.contact.whatsapp;
      openWhatsAppChat(message, targetPhone);

      // End booking session, dont open selected component
      setBookingModalOpen(false);
      setSearchState(null);
      setSelectedVehicle(null);

      // Scroll smoothly back to booking search widget
      setTimeout(() => {
        const widget = document.getElementById('travel-just-booking-widget');
        if (widget) {
          widget.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } else {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      }, 100);
    },
    [searchState, selectedVehicle, pricingConfig, customer, handleCompleteBooking]
  );

  const handleInstantConfirmBooking = useCallback(
    (state: BookingSearchState, preferredVehicleId?: string) => {
      const vehicle = preferredVehicleId
        ? vehiclesData.find((v) => v.id === preferredVehicleId) || vehiclesData[0]
        : vehiclesData[0];
      handleDirectConfirmBooking(state, vehicle);
    },
    [handleDirectConfirmBooking]
  );

  const handleResetSearch = useCallback(() => {
    setSearchState(null);
    setSelectedVehicle(null);
  }, []);

  const handleSelectServiceFromSection = (serviceType: ServiceType) => {
    const today = new Date().toISOString().split('T')[0];
    const defaultSearch: BookingSearchState = {
      serviceType,
      pickupLocation: '',
      dropLocation: '',
      travelDate: today,
      pickupDate: today,
      dropDate: today,
      returnDate: today,
      pickupTime: '07:00 AM',
      durationHours: 8,
      airportTransferType: 'pickup',
      passengers: 2,
      vehicleType: 'all',
    };
    setSearchState(defaultSearch);
    const searchElem = document.getElementById('booking-search-section');
    if (searchElem) {
      searchElem.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleSelectVehicleFromFleet = (vehicleId: string) => {
    const vehicle = vehiclesData.find((v) => v.id === vehicleId) || vehiclesData[0];
    setSelectedVehicle(vehicle);
    const today = new Date().toISOString().split('T')[0];
    const defaultServiceType =
      vehicle.suitableServices && !vehicle.suitableServices.includes('oneway')
        ? vehicle.suitableServices[0]
        : 'oneway';

    if (!searchState) {
      setSearchState({
        serviceType: defaultServiceType,
        pickupLocation: '',
        dropLocation: '',
        travelDate: today,
        pickupDate: today,
        dropDate: today,
        returnDate: today,
        pickupTime: '07:00 AM',
        durationHours: 8,
        airportTransferType: 'pickup',
        passengers: Math.min(2, vehicle.seatingCapacity),
        vehicleType: vehicle.id,
      });
    } else {
      const activeServiceType =
        vehicle.suitableServices && !vehicle.suitableServices.includes(searchState.serviceType)
          ? vehicle.suitableServices[0]
          : searchState.serviceType;

      setSearchState({
        ...searchState,
        serviceType: activeServiceType,
        vehicleType: vehicle.id,
      });
    }
    const searchElem = document.getElementById('booking-search-section');
    if (searchElem) {
      searchElem.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleScrollToBookingSearch = () => {
    const searchElem = document.getElementById('booking-search-section');
    if (searchElem) {
      searchElem.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleRebookTrip = async (
    pastSearch: Partial<BookingSearchState>,
    vehicleId?: string
  ) => {
    const today = new Date().toISOString().split('T')[0];
    const pickupLocation = pastSearch.pickupLocation || 'Mysuru';
    const dropLocation = pastSearch.dropLocation || '';
    const serviceType = pastSearch.serviceType || 'oneway';

    let calculatedRoute = pastSearch.routeInfo;
    if (!calculatedRoute && pickupLocation && dropLocation && serviceType !== 'local') {
      try {
        calculatedRoute = await calculateRouteDistance(pickupLocation, dropLocation);
      } catch (err) {
        console.warn('Rebook route calculation:', err);
      }
    }

    const rebookedState: BookingSearchState = {
      serviceType,
      pickupLocation,
      pickupLocationObj: pastSearch.pickupLocationObj,
      dropLocation,
      dropLocationObj: pastSearch.dropLocationObj,
      viaLocations: pastSearch.viaLocations || [],
      travelDate: today,
      pickupDate: today,
      dropDate: pastSearch.dropDate || today,
      returnDate: pastSearch.returnDate || today,
      pickupTime: pastSearch.pickupTime || '07:00 AM',
      durationHours: pastSearch.durationHours || 8,
      airportTransferType: pastSearch.airportTransferType || 'pickup',
      passengers: pastSearch.passengers || 2,
      vehicleType: vehicleId || pastSearch.vehicleType || 'all',
      routeInfo: calculatedRoute,
    };

    setSearchState(rebookedState);
    if (vehicleId) {
      const matched =
        vehiclesData.find((v) => v.id === vehicleId) ||
        (vehicleId === 'toyota-etios' || vehicleId === 'swift-desire'
          ? vehiclesData.find((v) => v.id === 'sedan-4-1')
          : undefined) ||
        (vehicleId === 'innova-6-1' || vehicleId === 'innova-7-1'
          ? vehiclesData.find((v) => v.id === 'innova')
          : undefined);
      if (matched) setSelectedVehicle(matched);
    }

    const resultsElem = document.getElementById('search-results-anchor');
    if (resultsElem) {
      resultsElem.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans antialiased selection:bg-emerald-800 selection:text-white flex flex-col">
      {/* Real-time PWA Offline Network Banner */}
      <OfflineIndicator />

      {/* Header with Customer & Owner access */}
      <Header
        isOwner={isOwner}
        onBookRideClick={handleScrollToBookingSearch}
        onOpenOwnerLogin={() => setOwnerAuthModalOpen(true)}
        onExitOwnerMode={handleExitOwnerMode}
        onOpenFareEngine={() => setOwnerPortalModalOpen(true)}
        onOpenSimpleFareEngine={handleOpenSimpleFareEngine}
        onOpenAdvancedFareEngine={handleOpenAdvancedFareEngine}
        onOpenLegal={(type) => setLegalModalType(type)}
        customer={customer}
        onOpenCustomerPortal={() => setCustomerPortalModalOpen(true)}
        onOpenPartnerDrawer={() => setPartnerDrawerOpen(true)}
        onOpenDownloadApp={() => setDownloadAppModalOpen(true)}
        onOpenCustomerAuth={() => setCustomerAuthModalOpen(true)}
        onCustomerLogout={handleCustomerLogout}
        onOpenTravelStudio={handleOpenTravelStudio}
        onOpenSiteOptimizer={() => setSiteOptimizerModalOpen(true)}
      />

      {/* Main Page Layout */}
      <main className="flex-1">
        {/* Hero Section */}
        <Hero
          onBookRideClick={handleScrollToBookingSearch}
          onGetQuoteClick={handleScrollToBookingSearch}
        />

        {/* Integrated Advanced Booking Search Section */}
        <section id="booking-search-section" className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto -mt-6 sm:-mt-10 relative z-30">
          <BookingSearch
            key={`search-${fareUpdateTrigger}`}
            initialState={searchState || undefined}
            pricingConfig={pricingConfig}
            onSearch={handleSearchSubmit}
            onConfirmBooking={handleInstantConfirmBooking}
            onReset={handleResetSearch}
          />
        </section>

        {/* Search Results Display Area */}
        <div id="search-results-anchor" className="scroll-mt-24">
          {searchState && (
            <section className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
              <SearchResults
                key={`results-${fareUpdateTrigger}`}
                searchDetails={searchState}
                pricingConfig={pricingConfig}
                selectedVehicle={selectedVehicle}
                onSelectVehicle={(vehicle) => setSelectedVehicle(vehicle)}
                onEditSearch={() => {
                  const searchElem = document.getElementById('booking-search-section');
                  if (searchElem) searchElem.scrollIntoView({ behavior: 'smooth' });
                }}
                onProceedToBooking={() => handleDirectConfirmBooking()}
                onClearSearch={handleResetSearch}
                onSelectCachedSearch={handleSelectCachedSearch}
              />
            </section>
          )}
        </div>

        {/* Services Section */}
        <ServicesSection onSelectService={handleSelectServiceFromSection} />

        {/* Fleet Section */}
        <FleetSection onSelectVehicleForBooking={handleSelectVehicleFromFleet} />

        {/* Top Outstation & Airport Taxi Routes Directory Section */}
        <TopRoutesDirectorySection />

        {/* AI Travel Concierge & Real-time Grounded Assistant Section - Visible ONLY in Owner Portal */}
        {isOwner && (
          <section id="ai-travel-concierge-section" className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto scroll-mt-20">
            <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider bg-[#032014] text-[#14CD03] border border-emerald-700/60 shadow-2xs">
                    Owner Portal Exclusive
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-900 border border-emerald-300">
                    Google Search & Maps Grounding
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider bg-purple-100 text-purple-900 border border-purple-300">
                    Veo Video & Gemini 3.1 Studio
                  </span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                  AI Travel Concierge & Creative Studio
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl">
                  Chat with our real-time assistant powered by Gemini 3.1 Pro, 3.5 Flash, and 3.1 Flash Lite. Verify 2026 expressway tolls, plan multi-day Karnataka trips, or generate cinematic Veo videos and travel imagery.
                </p>
              </div>

              <button
                type="button"
                onClick={() => handleOpenTravelStudio('video')}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-[#0a4d3c] to-[#07382c] hover:brightness-110 text-white font-extrabold text-xs sm:text-sm shadow-md transition-all cursor-pointer shrink-0"
              >
                <Film className="w-4 h-4 text-[#0ef10e]" />
                <span>Launch Travel Studio</span>
              </button>
            </div>

            <ContactAIChat
              onBookRideClick={handleScrollToBookingSearch}
              onApplyBookingPlan={handleApplyBookingPlan}
              onOpenTravelStudio={handleOpenTravelStudio}
            />
          </section>
        )}

        {/* Why Choose Us Section */}
        <WhyChooseUs onOpenPartnerDrawer={() => setPartnerDrawerOpen(true)} />

        {/* FAQ Section */}
        <FAQSection />
      </main>

      {/* Footer */}
      <Footer
        isOwner={isOwner}
        onOpenLegal={(type) => setLegalModalType(type)}
        onBookRideClick={handleScrollToBookingSearch}
        onOpenOwnerLogin={() => setOwnerAuthModalOpen(true)}
        onOpenFareEngine={() => setOwnerPortalModalOpen(true)}
        customer={customer}
        onOpenCustomerPortal={() => setCustomerPortalModalOpen(true)}
        onOpenPartnerDrawer={() => setPartnerDrawerOpen(true)}
        onOpenSiteOptimizer={() => setSiteOptimizerModalOpen(true)}
      />

      {/* Driver Partner / Vendor Fleet Onboarding Drawer */}
      <DriverPartnerDrawer
        isOpen={partnerDrawerOpen}
        onClose={() => setPartnerDrawerOpen(false)}
      />

      {/* Multi-step Booking Dialog Modal */}
      {bookingModalOpen && searchState && selectedVehicle && (
        <BookingModal
          isOpen={bookingModalOpen}
          onClose={() => setBookingModalOpen(false)}
          searchDetails={searchState}
          selectedVehicle={selectedVehicle}
          pricingConfig={pricingConfig}
          onCompleteBooking={handleCompleteBooking}
          customer={customer}
        />
      )}

      <React.Suspense fallback={null}>
        {/* Privacy Policy / Terms Modal */}
        {legalModalType && (
          <LegalModal
            type={legalModalType}
            onClose={() => setLegalModalType(null)}
          />
        )}

        {/* Customer Account & Trips Dashboard Portal */}
        {customerPortalModalOpen && (
          <CustomerPortalModal
            isOpen={customerPortalModalOpen}
            onClose={() => setCustomerPortalModalOpen(false)}
            customer={customer}
            onLogout={handleCustomerLogout}
            onUpdateCustomer={handleUpdateCustomerProfile}
            onRebookTrip={handleRebookTrip}
            onBookNewRide={handleScrollToBookingSearch}
          />
        )}

        {/* Download App Modal */}
        {downloadAppModalOpen && (
          <DownloadAppModal
            isOpen={downloadAppModalOpen}
            onClose={() => setDownloadAppModalOpen(false)}
          />
        )}

        {/* Driver Partner Drawer */}
        {partnerDrawerOpen && (
          <DriverPartnerDrawer
            isOpen={partnerDrawerOpen}
            onClose={() => setPartnerDrawerOpen(false)}
          />
        )}

        {/* Comprehensive Business Owner & Fleet Management Portal */}
        {isOwner && ownerPortalModalOpen && (
          <OwnerPortalModal
            isOpen={isOwner && ownerPortalModalOpen}
            onClose={() => setOwnerPortalModalOpen(false)}
            onExitOwnerMode={handleExitOwnerMode}
            onOpenFareEngine={handleOpenSimpleFareEngine}
            onOpenSimpleFareEngine={handleOpenSimpleFareEngine}
            onOpenAdvancedFareEngine={handleOpenAdvancedFareEngine}
            onOpenTravelStudio={handleOpenTravelStudio}
            onFareSaved={(updated) => {
              setPricingConfig((prev) => fareService.syncCentralizedToSitePricingConfig(updated, prev));
              setFareUpdateTrigger((c) => c + 1);
            }}
          />
        )}

        {/* Live Dynamic Fare Engine Modal (Accessible to Owner & Preview) */}
        {fareEngineModalOpen && (
          <FareEngineModal
            isOpen={fareEngineModalOpen}
            onClose={() => setFareEngineModalOpen(false)}
            isOwner={isOwner}
            initialMode={fareEngineInitialMode}
            onOpenOwnerAuth={() => setOwnerAuthModalOpen(true)}
            onFareSaved={(updated) => {
              setPricingConfig((prev) => fareService.syncCentralizedToSitePricingConfig(updated, prev));
              setFareUpdateTrigger((c) => c + 1);
            }}
          />
        )}

        {/* 24x7 Travel Expert Popup Modal (opens after 30 seconds) */}
        {travelExpertModalOpen && (
          <TravelExpertPopupModal
            isOpen={travelExpertModalOpen}
            onClose={handleCloseTravelExpertModal}
            phoneNumber="97407 54400"
          />
        )}

        {/* AI Creative Studio Modal (Veo 3.1 & Gemini Image Preview) */}
        {travelStudioModalOpen && (
          <TravelStudioModal
            isOpen={travelStudioModalOpen}
            onClose={() => setTravelStudioModalOpen(false)}
            initialTab={travelStudioInitialTab}
          />
        )}

        {/* Site Optimizer & WordPress Updates Hub Modal */}
        {siteOptimizerModalOpen && (
          <SiteOptimizerModal
            isOpen={siteOptimizerModalOpen}
            onClose={() => setSiteOptimizerModalOpen(false)}
            isOwner={isOwner}
          />
        )}
      </React.Suspense>

      {/* Owner Authentication Modal */}
      <OwnerAuthModal
        isOpen={ownerAuthModalOpen}
        onClose={() => setOwnerAuthModalOpen(false)}
        onSuccess={handleOwnerLoginSuccess}
      />

      {/* Customer Login / Register Modal */}
      <CustomerAuthModal
        isOpen={customerAuthModalOpen}
        onClose={() => setCustomerAuthModalOpen(false)}
        onSuccess={(loggedCustomer) => {
          setCustomer(loggedCustomer);
          setCustomerAuthModalOpen(false);
        }}
        onOpenOwnerLogin={() => {
          setCustomerAuthModalOpen(false);
          setOwnerAuthModalOpen(true);
        }}
        onOpenPartnerDrawer={() => {
          setCustomerAuthModalOpen(false);
          setPartnerDrawerOpen(true);
        }}
      />

      {/* Floating 1-Tap Mobile App Install Banner */}
      <MobileInstallBanner
        onOpenDetailedModal={() => setDownloadAppModalOpen(true)}
      />

      {/* Real-time Push Notification Alert Toast / Banner */}
      <InAppPushNotificationBanner
        onOpenRideDetails={() => {
          setCustomerPortalModalOpen(true);
        }}
      />
    </div>
  );
}
