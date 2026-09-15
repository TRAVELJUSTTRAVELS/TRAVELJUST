import React, { useState, useEffect, useCallback } from 'react';
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
import { TopRoutesDirectorySection } from './components/TopRoutesDirectorySection';
import { WhyChooseUs } from './components/WhyChooseUs';
import { FAQSection } from './components/FAQSection';
import { RecentTripsSection } from './components/RecentTripsSection';
import { Footer } from './components/Footer';
import { BookingModal } from './components/BookingModal';
import { LegalModal } from './components/LegalModal';
import { OwnerAuthModal } from './components/OwnerAuthModal';
import { CustomerPortalModal } from './components/CustomerPortalModal';
import { AdminFareManagementModal } from './components/AdminFareManagementModal';
import { DriverPartnerDrawer } from './components/DriverPartnerDrawer';
import { DownloadAppModal } from './components/DownloadAppModal';
import { CustomerAuthModal } from './components/CustomerAuthModal';
import { TravelExpertPopupModal } from './components/TravelExpertPopupModal';
import { MobileInstallBanner } from './components/MobileInstallBanner';
import { calculateRouteDistance } from './services/googleMapsService';
import { getStoredCustomer, clearCustomerSession, saveCustomerSession } from './services/customerAuthService';
import { calculateFare } from './utils/fareCalculator';
import { saveBookingToSupabase } from './services/supabaseService';
import { formatBookingConfirmationMessage, openWhatsAppChat } from './utils/whatsapp';
import { siteConfig } from './config/siteConfig';
import {
  BookingSearchState,
  Vehicle,
  PricingConfig,
  ServiceType,
  BookingRequest,
  PassengerDetails,
  PlaceSuggestion,
  CustomerUser,
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
          if (!parsed.vehiclePricing['sedan-4-1']) {
            parsed.vehiclePricing['sedan-4-1'] = defaultPricingConfig.vehiclePricing['sedan-4-1'];
          }
          if (!parsed.vehiclePricing['innova']) {
            parsed.vehiclePricing['innova'] = defaultPricingConfig.vehiclePricing['innova'];
          }
          if (parsed.vehiclePricing['sedan-4-1']?.localPerKmRate === 12) {
            parsed.vehiclePricing['sedan-4-1'].localPerKmRate = 13.0;
            parsed.vehiclePricing['sedan-4-1'].perKmFare = 13.0;
          }
          if (parsed.vehiclePricing['toyota-etios']?.localPerKmRate === 12) {
            parsed.vehiclePricing['toyota-etios'].localPerKmRate = 13.0;
            parsed.vehiclePricing['toyota-etios'].perKmFare = 13.0;
          }
          if (parsed.vehiclePricing['swift-desire']?.localPerKmRate === 12) {
            parsed.vehiclePricing['swift-desire'].localPerKmRate = 13.0;
            parsed.vehiclePricing['swift-desire'].perKmFare = 13.0;
          }
          if (parsed.perKmFare === 12) {
            parsed.perKmFare = 13.0;
          }
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
  const [adminFareModalOpen, setAdminFareModalOpen] = useState(false);
  const [fareUpdateTrigger, setFareUpdateTrigger] = useState(0);
  const [searchState, setSearchState] = useState<BookingSearchState | null>(null);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [legalModalType, setLegalModalType] = useState<'privacy' | 'terms' | null>(null);
  const [partnerDrawerOpen, setPartnerDrawerOpen] = useState(false);
  const [downloadAppModalOpen, setDownloadAppModalOpen] = useState(false);
  const [customerAuthModalOpen, setCustomerAuthModalOpen] = useState(false);
  const [travelExpertModalOpen, setTravelExpertModalOpen] = useState(false);

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
    try {
      localStorage.setItem('tj_is_owner', 'true');
    } catch (e) {
      console.warn('Could not persist owner state:', e);
    }
  };

  const handleExitOwnerMode = () => {
    setIsOwner(false);
    try {
      localStorage.removeItem('tj_is_owner');
    } catch (e) {
      console.warn('Could not clear owner state:', e);
    }
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

  const handleSearchSubmit = useCallback((state: BookingSearchState) => {
    setSearchState(state);
    // Smooth scroll to search results
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

  const handleSelectVehicleFromFleet = (vehicleId: string) => {
    const vehicle = vehiclesData.find((v) => v.id === vehicleId) || vehiclesData[0];
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
      {/* Header with Customer & Owner access */}
      <Header
        isOwner={isOwner}
        onBookRideClick={handleScrollToBookingSearch}
        onOpenOwnerLogin={() => setOwnerAuthModalOpen(true)}
        onExitOwnerMode={handleExitOwnerMode}
        onOpenLegal={(type) => setLegalModalType(type)}
        customer={customer}
        onOpenCustomerPortal={() => setCustomerPortalModalOpen(true)}
        onOpenPartnerDrawer={() => setPartnerDrawerOpen(true)}
        onOpenFareEngine={() => setAdminFareModalOpen(true)}
        onOpenDownloadApp={() => setDownloadAppModalOpen(true)}
        onOpenCustomerAuth={() => setCustomerAuthModalOpen(true)}
        onCustomerLogout={handleCustomerLogout}
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

        {/* Live Dispatch & Bookings Registry Section - EXCLUSIVELY VISIBLE FOR FLEET MANAGER & OWNER PORTAL ONLY */}
        {isOwner && (
          <RecentTripsSection
            onRebookTrip={handleRebookTrip}
            onOpenBookingSearch={handleScrollToBookingSearch}
            isOwner={isOwner}
            onOpenOwnerLogin={() => setOwnerAuthModalOpen(true)}
          />
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
        customer={customer}
        onOpenCustomerPortal={() => setCustomerPortalModalOpen(true)}
        onOpenPartnerDrawer={() => setPartnerDrawerOpen(true)}
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

      {/* Privacy Policy / Terms Modal */}
      <LegalModal
        type={legalModalType}
        onClose={() => setLegalModalType(null)}
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

      {/* Owner Dynamic Price & Fare Engine Modal */}
      <AdminFareManagementModal
        isOpen={adminFareModalOpen}
        onClose={() => setAdminFareModalOpen(false)}
        onPricingUpdated={() => setFareUpdateTrigger((prev) => prev + 1)}
      />

      {/* Download App Modal */}
      <DownloadAppModal
        isOpen={downloadAppModalOpen}
        onClose={() => setDownloadAppModalOpen(false)}
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

      {/* 24x7 Travel Expert Popup Modal (opens after 30 seconds) */}
      <TravelExpertPopupModal
        isOpen={travelExpertModalOpen}
        onClose={handleCloseTravelExpertModal}
        phoneNumber="97407 54400"
      />

      {/* Floating 1-Tap Mobile App Install Banner */}
      <MobileInstallBanner
        onOpenDetailedModal={() => setDownloadAppModalOpen(true)}
      />
    </div>
  );
}
