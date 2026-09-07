import React, { useState, useEffect } from 'react';
import {
  CheckCircle2,
  Sliders,
  Sparkles,
  Clock,
  ArrowRight,
  User,
  MapPin,
} from 'lucide-react';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { BookingSearch } from './components/BookingSearch';
import { SearchResults } from './components/SearchResults';
import { ServicesSection } from './components/ServicesSection';
import { FleetSection } from './components/FleetSection';
import { WhyChooseUs } from './components/WhyChooseUs';
import { AboutSection } from './components/AboutSection';
import { ContactSection } from './components/ContactSection';
import { FAQSection } from './components/FAQSection';
import { RecentTripsSection } from './components/RecentTripsSection';
import { Footer } from './components/Footer';
import { BookingModal } from './components/BookingModal';
import { LegalModal } from './components/LegalModal';
import { OwnerAuthModal } from './components/OwnerAuthModal';
import { CustomerAuthModal } from './components/CustomerAuthModal';
import { CustomerPortalModal } from './components/CustomerPortalModal';
import { PriceFareEngineDrawer } from './components/PriceFareEngineDrawer';
import { PopularRoutesLandingSection } from './components/PopularRoutesLandingSection';
import { WhatsAppChatButton } from './components/WhatsAppChatButton';
import { DriverPartnerDrawer } from './components/DriverPartnerDrawer';
import { calculateRouteDistance } from './services/googleMapsService';
import { getStoredCustomer, clearCustomerSession, saveCustomerSession } from './services/customerAuthService';
import {
  BookingSearchState,
  Vehicle,
  PricingConfig,
  ServiceType,
  BookingRequest,
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
        if (parsed && parsed.vehiclePricing) return parsed;
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
  const [customerAuthModalOpen, setCustomerAuthModalOpen] = useState(false);
  const [customerPortalModalOpen, setCustomerPortalModalOpen] = useState(false);

  const [ownerAuthModalOpen, setOwnerAuthModalOpen] = useState(false);
  const [searchState, setSearchState] = useState<BookingSearchState | null>(null);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [legalModalType, setLegalModalType] = useState<'privacy' | 'terms' | null>(null);
  const [fareEngineOpen, setFareEngineOpen] = useState(false);
  const [partnerDrawerOpen, setPartnerDrawerOpen] = useState(false);

  const handleUpdatePricingConfig = (newConfig: PricingConfig) => {
    setPricingConfig(newConfig);
    try {
      localStorage.setItem('tj_pricing_config', JSON.stringify(newConfig));
    } catch (e) {
      console.warn('Could not save pricing config to localStorage:', e);
    }
  };

  const handleOwnerLoginSuccess = () => {
    setIsOwner(true);
    try {
      localStorage.setItem('tj_is_owner', 'true');
    } catch (e) {
      console.warn('Could not persist owner state:', e);
    }
    setFareEngineOpen(true);
  };

  const handleExitOwnerMode = () => {
    setIsOwner(false);
    setFareEngineOpen(false);
    try {
      localStorage.removeItem('tj_is_owner');
    } catch (e) {
      console.warn('Could not clear owner state:', e);
    }
  };

  const handleCustomerLoginSuccess = (cust: CustomerUser) => {
    setCustomer(cust);
  };

  const handleCustomerLogout = () => {
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

  const handleSearchSubmit = (state: BookingSearchState) => {
    setSearchState(state);
    // Smooth scroll to search results
    setTimeout(() => {
      const resultsElem = document.getElementById('search-results-anchor');
      if (resultsElem) {
        resultsElem.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
  };

  const handleInstantConfirmBooking = (state: BookingSearchState, vehicle: Vehicle) => {
    setSearchState(state);
    setSelectedVehicle(vehicle);
    setBookingModalOpen(true);
  };

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
      pickupTime: '09:00',
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

  const handleSelectVehicleFromFleet = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    const today = new Date().toISOString().split('T')[0];
    if (!searchState) {
      setSearchState({
        serviceType: 'oneway',
        pickupLocation: '',
        dropLocation: '',
        travelDate: today,
        pickupDate: today,
        dropDate: today,
        returnDate: today,
        pickupTime: '09:00',
        durationHours: 8,
        airportTransferType: 'pickup',
        passengers: Math.min(2, vehicle.seatingCapacity),
        vehicleType: vehicle.id,
      });
    } else {
      setSearchState({
        ...searchState,
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

  const handleApplyBookingPlan = (plan: BookingDraftPlan) => {
    const today = new Date().toISOString().split('T')[0];
    const sType = (plan.serviceType || 'oneway') as ServiceType;

    let matchedVehicleId = 'sedan';
    if (plan.vehicleType) {
      const vLower = plan.vehicleType.toLowerCase();
      if (vLower.includes('innova') || vLower.includes('crysta')) {
        matchedVehicleId = 'innova';
      } else if (vLower.includes('ertiga') || vLower.includes('muv')) {
        matchedVehicleId = 'ertiga';
      } else {
        matchedVehicleId = 'sedan';
      }
    }

    const vObj = vehiclesData.find((v) => v.id === matchedVehicleId) || vehiclesData[0];
    setSelectedVehicle(vObj);

    setSearchState({
      serviceType: sType,
      pickupLocation: plan.pickupLocation || 'Rajiv Nagar, Mysuru',
      dropLocation: plan.dropLocation || (sType === 'local' ? '' : 'Kempegowda International Airport (BLR)'),
      travelDate: today,
      pickupDate: today,
      dropDate: today,
      returnDate: today,
      pickupTime: '09:00',
      durationHours: plan.durationHours || 8,
      airportTransferType: 'pickup',
      passengers: plan.passengers || 2,
      vehicleType: matchedVehicleId,
    });

    handleScrollToBookingSearch();
  };

  const handleCompleteBooking = (booking: BookingRequest) => {
    // If customer is logged in, link booking to customer account
    if (customer) {
      const updatedCustomer = {
        ...customer,
        totalTripsCount: (customer.totalTripsCount || 0) + 1,
      };
      setCustomer(updatedCustomer);
      saveCustomerSession(updatedCustomer);
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
      pickupTime: pastSearch.pickupTime || '09:00',
      durationHours: pastSearch.durationHours || 8,
      airportTransferType: pastSearch.airportTransferType || 'pickup',
      passengers: pastSearch.passengers || 2,
      vehicleType: vehicleId || pastSearch.vehicleType || 'all',
      routeInfo: calculatedRoute,
    };

    setSearchState(rebookedState);
    if (vehicleId) {
      const matched = vehiclesData.find((v) => v.id === vehicleId);
      if (matched) setSelectedVehicle(matched);
    }

    const resultsElem = document.getElementById('search-results-anchor');
    if (resultsElem) {
      resultsElem.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleSelectRouteForBooking = async (
    pickup: string,
    drop: string,
    serviceType: ServiceType,
    estimatedKm?: number
  ) => {
    const today = new Date().toISOString().split('T')[0];
    let routeInfo = undefined;
    try {
      routeInfo = await calculateRouteDistance(pickup, drop);
    } catch {
      if (estimatedKm) {
        routeInfo = {
          distanceKm: estimatedKm,
          distanceText: `${estimatedKm} km`,
          durationMinutes: Math.round(estimatedKm * 1.2),
          durationText: `~${Math.round(estimatedKm / 50)} hrs`,
          originAddress: pickup,
          destinationAddress: drop,
          status: 'OK' as const,
        };
      }
    }

    const newSearch: BookingSearchState = {
      serviceType,
      pickupLocation: pickup,
      dropLocation: drop,
      travelDate: today,
      pickupDate: today,
      dropDate: today,
      returnDate: today,
      pickupTime: '08:30',
      durationHours: 8,
      airportTransferType: serviceType === 'airport' ? 'drop' : 'pickup',
      passengers: 2,
      vehicleType: 'all',
      routeInfo,
    };

    setSearchState(newSearch);
    setTimeout(() => {
      const resultsElem = document.getElementById('search-results-anchor');
      if (resultsElem) {
        resultsElem.scrollIntoView({ behavior: 'smooth' });
      } else {
        const searchElem = document.getElementById('booking-search-section');
        if (searchElem) searchElem.scrollIntoView({ behavior: 'smooth' });
      }
    }, 150);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans antialiased selection:bg-emerald-800 selection:text-white flex flex-col">
      {/* Header with Customer & Owner access */}
      <Header
        isOwner={isOwner}
        onBookRideClick={handleScrollToBookingSearch}
        onOpenFareEngine={isOwner ? () => setFareEngineOpen(true) : undefined}
        onOpenOwnerLogin={() => setOwnerAuthModalOpen(true)}
        onExitOwnerMode={handleExitOwnerMode}
        onOpenLegal={(type) => setLegalModalType(type)}
        customer={customer}
        onOpenCustomerLogin={() => setCustomerAuthModalOpen(true)}
        onOpenCustomerPortal={() => setCustomerPortalModalOpen(true)}
        onOpenPartnerDrawer={() => setPartnerDrawerOpen(true)}
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
            initialState={searchState || undefined}
            pricingConfig={pricingConfig}
            onOpenFareEngine={isOwner ? () => setFareEngineOpen(true) : undefined}
            onSearch={handleSearchSubmit}
            onConfirmBooking={handleInstantConfirmBooking}
            onReset={() => {
              setSearchState(null);
              setSelectedVehicle(null);
            }}
          />
        </section>

        {/* Search Results Display Area */}
        <div id="search-results-anchor" className="scroll-mt-24">
          {searchState && (
            <section className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
              <SearchResults
                searchDetails={searchState}
                pricingConfig={pricingConfig}
                selectedVehicle={selectedVehicle}
                onSelectVehicle={(vehicle) => setSelectedVehicle(vehicle)}
                onEditSearch={() => {
                  const searchElem = document.getElementById('booking-search-section');
                  if (searchElem) searchElem.scrollIntoView({ behavior: 'smooth' });
                }}
                onProceedToBooking={() => setBookingModalOpen(true)}
                onClearSearch={() => {
                  setSearchState(null);
                  setSelectedVehicle(null);
                }}
              />
            </section>
          )}
        </div>

        {/* Dedicated Popular Routes & Destination Guides for SEO */}
        <PopularRoutesLandingSection onSelectRouteForBooking={handleSelectRouteForBooking} />

        {/* Services Section */}
        <ServicesSection onSelectService={handleSelectServiceFromSection} />

        {/* Fleet Section */}
        <FleetSection onSelectVehicleForBooking={handleSelectVehicleFromFleet} />

        {/* Recent Trips & Bookings Activity Section - EXCLUSIVELY RESTRICTED TO OWNER */}
        {isOwner && (
          <RecentTripsSection
            onRebookTrip={handleRebookTrip}
            onOpenBookingSearch={handleScrollToBookingSearch}
          />
        )}

        {/* Why Choose Us Section */}
        <WhyChooseUs onOpenPartnerDrawer={() => setPartnerDrawerOpen(true)} />

        {/* About Section */}
        <AboutSection />

        {/* AI Travel Concierge & Contact Section */}
        <ContactSection
          onOpenBookingSearch={handleScrollToBookingSearch}
          onApplyBookingPlan={handleApplyBookingPlan}
        />

        {/* FAQ Section */}
        <FAQSection />
      </main>

      {/* Footer */}
      <Footer
        isOwner={isOwner}
        onOpenLegal={(type) => setLegalModalType(type)}
        onBookRideClick={handleScrollToBookingSearch}
        onOpenOwnerLogin={() => setOwnerAuthModalOpen(true)}
        onOpenFareEngine={isOwner ? () => setFareEngineOpen(true) : undefined}
        customer={customer}
        onOpenCustomerLogin={() => setCustomerAuthModalOpen(true)}
        onOpenCustomerPortal={() => setCustomerPortalModalOpen(true)}
        onOpenPartnerDrawer={() => setPartnerDrawerOpen(true)}
      />

      {/* Driver Partner / Vendor Fleet Onboarding Drawer */}
      <DriverPartnerDrawer
        isOpen={partnerDrawerOpen}
        onClose={() => setPartnerDrawerOpen(false)}
      />

      {/* Multi-step Booking Dialog Modal */}
      {searchState && selectedVehicle && (
        <BookingModal
          isOpen={bookingModalOpen}
          onClose={() => setBookingModalOpen(false)}
          searchDetails={searchState}
          selectedVehicle={selectedVehicle}
          pricingConfig={pricingConfig}
          onCompleteBooking={handleCompleteBooking}
          customer={customer}
          onOpenCustomerLogin={() => setCustomerAuthModalOpen(true)}
        />
      )}

      {/* Privacy Policy / Terms Modal */}
      <LegalModal
        type={legalModalType}
        onClose={() => setLegalModalType(null)}
      />

      {/* Customer Login / Registration Modal */}
      <CustomerAuthModal
        isOpen={customerAuthModalOpen}
        onClose={() => setCustomerAuthModalOpen(false)}
        onSuccess={handleCustomerLoginSuccess}
      />

      {/* Customer Account & Trips Dashboard Portal */}
      <CustomerPortalModal
        isOpen={customerPortalModalOpen}
        onClose={() => setCustomerPortalModalOpen(false)}
        customer={customer}
        onLogout={handleCustomerLogout}
        onUpdateCustomer={handleUpdateCustomerProfile}
        onRebookTrip={handleRebookTrip}
        onBookNewRide={handleScrollToBookingSearch}
      />

      {/* Owner Authentication Modal */}
      <OwnerAuthModal
        isOpen={ownerAuthModalOpen}
        onClose={() => setOwnerAuthModalOpen(false)}
        onSuccess={handleOwnerLoginSuccess}
      />

      {/* Price & Fare Engine Drawer - ONLY accessible in Owner Mode */}
      {isOwner && (
        <PriceFareEngineDrawer
          isOpen={fareEngineOpen}
          onClose={() => setFareEngineOpen(false)}
          pricingConfig={pricingConfig}
          onUpdatePricing={handleUpdatePricingConfig}
        />
      )}

      {/* Floating Draggable WhatsApp Button with Car Logo for Booking Confirmations & Customer Communication */}
      <WhatsAppChatButton searchState={searchState} />
    </div>
  );
}
