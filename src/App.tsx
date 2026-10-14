import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { BookingSearch } from './components/BookingSearch';
import { SearchResults } from './components/SearchResults';
import { ServicesSection } from './components/ServicesSection';
import { FleetSection } from './components/FleetSection';
import { WhyChooseUs } from './components/WhyChooseUs';
import { FAQSection } from './components/FAQSection';
import { TopOutstationRoutesSection } from './components/TopOutstationRoutesSection';
import { Footer } from './components/Footer';
import { MobileBottomNav } from './components/MobileBottomNav';
import { BookingModal } from './components/BookingModal';
import { CustomerAuthModal } from './components/CustomerAuthModal';
import { InAppPushNotificationBanner } from './components/InAppPushNotificationBanner';
import { OfflineIndicator } from './components/OfflineIndicator';
import { ProgressBar } from './components/DynamicLoadingIndicator';
import { ThemeCustomizerModal } from './components/ThemeCustomizerModal';
import { BookingTrackerModal } from './components/BookingTrackerModal';

// Code-split heavy modals to accelerate load time and optimize Core Web Vitals
const LegalModal = React.lazy(() => import('./components/LegalModal').then(m => ({ default: m.LegalModal })));
const CustomerPortalModal = React.lazy(() => import('./components/CustomerPortalModal').then(m => ({ default: m.CustomerPortalModal })));
const DownloadAppModal = React.lazy(() => import('./components/DownloadAppModal').then(m => ({ default: m.DownloadAppModal })));


import { saveSearchToServiceWorkerCache } from './services/searchCacheService';
import { calculateRouteDistance } from './services/googleMapsService';
import { getStoredCustomer, clearCustomerSession, saveCustomerSession } from './services/customerAuthService';
import { auth, signOut, onAuthStateChanged, syncUserProfile, saveBookingToFirestore } from './lib/firebase';
import { calculateFare } from './utils/fareCalculator';
import { fareService } from './services/fareService';
import {
  BookingSearchState,
  Vehicle,
  PricingConfig,
  ServiceType,
  BookingRequest,
  PassengerDetails,
  CustomerUser,
  BookingDraftPlan,
  SelectedAddOn,
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

  useEffect(() => {
    const handlePricingUpdated = (e: Event) => {
      const customEvent = e as CustomEvent<PricingConfig>;
      if (customEvent.detail) {
        setPricingConfig(customEvent.detail);
      }
    };
    window.addEventListener('tj:pricing-config-updated', handlePricingUpdated);
    return () => window.removeEventListener('tj:pricing-config-updated', handlePricingUpdated);
  }, []);

  // Customer authentication state
  const [customer, setCustomer] = useState<CustomerUser | null>(() => getStoredCustomer());
  const [customerPortalModalOpen, setCustomerPortalModalOpen] = useState(false);
  const [customerPortalInitialTab, setCustomerPortalInitialTab] = useState<'trips' | 'saved' | 'profile'>('trips');

  const handleOpenCustomerPortal = (tab?: 'trips' | 'saved' | 'profile') => {
    setCustomerPortalInitialTab(tab || 'trips');
    setCustomerPortalModalOpen(true);
  };

  const [fareUpdateTrigger, setFareUpdateTrigger] = useState(0);

  const [searchState, setSearchState] = useState<BookingSearchState | null>(null);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [isConfirmingBooking, setIsConfirmingBooking] = useState<boolean>(false);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [selectedAddOns, setSelectedAddOns] = useState<SelectedAddOn[]>([]);
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [legalModalType, setLegalModalType] = useState<'privacy' | 'terms' | null>(null);
  const [downloadAppModalOpen, setDownloadAppModalOpen] = useState(false);
  const [customerAuthModalOpen, setCustomerAuthModalOpen] = useState(false);
  const [bookingTrackerOpen, setBookingTrackerOpen] = useState(false);
  const [trackingReferenceId, setTrackingReferenceId] = useState<string>('');

  const handleOpenTrackBooking = (referenceId?: string) => {
    if (referenceId) {
      setTrackingReferenceId(referenceId);
    }
    setBookingTrackerOpen(true);
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



  // When app opens, ensure section#home is shown first on customer site
  useEffect(() => {
    if (typeof window !== 'undefined') {
      if ('scrollRestoration' in window.history) {
        window.history.scrollRestoration = 'manual';
      }
      if (window.location.hash && window.location.hash !== '#home' && !window.location.hash.startsWith('#/')) {
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
    setIsSearching(true);
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
    // Dynamic loading completes and smoothly reveals results
    setTimeout(() => {
      setIsSearching(false);
    }, 600);
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

  const handleSelectSavedDestinationForBooking = useCallback((address: string, isDrop?: boolean) => {
    setSearchState((prev) => {
      const today = new Date().toISOString().split('T')[0];
      const base: BookingSearchState = prev || {
        serviceType: 'oneway',
        pickupLocation: 'Mysuru',
        dropLocation: '',
        travelDate: today,
        pickupDate: today,
        pickupTime: '07:00 AM',
        durationHours: 8,
        airportTransferType: 'pickup',
        passengers: 2,
        vehicleType: 'all',
      };
      if (isDrop) {
        return {
          ...base,
          dropLocation: address,
          dropLocationObj: {
            placeId: `saved_${Date.now()}`,
            placeName: address.split(',')[0].trim(),
            formattedAddress: address,
            areaLocality: address.split(',')[0].trim(),
            city: 'Mysuru',
            state: 'Karnataka',
          },
        };
      } else {
        return {
          ...base,
          pickupLocation: address,
          pickupLocationObj: {
            placeId: `saved_${Date.now()}`,
            placeName: address.split(',')[0].trim(),
            formattedAddress: address,
            areaLocality: address.split(',')[0].trim(),
            city: 'Mysuru',
            state: 'Karnataka',
          },
        };
      }
    });
    setFareUpdateTrigger((c) => c + 1);
    handleScrollToBookingSearch();
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
    async (customSearch?: BookingSearchState, customVehicle?: Vehicle, explicitCustomer?: CustomerUser | null) => {
      const activeCustomer = explicitCustomer !== undefined ? explicitCustomer : customer;
      // If customer is not logged in, prompt login form first
      if (!activeCustomer) {
        setCustomerAuthModalOpen(true);
        return;
      }

      const activeSearch = customSearch || searchState;
      const activeVehicle = customVehicle || selectedVehicle || vehiclesData[0];
      if (!activeSearch || !activeVehicle) return;

      setIsConfirmingBooking(true);
      try {
        const randomNum = Math.floor(10000 + Math.random() * 90000);
        const refId = `TJ-${randomNum}`;

        const baseFareEstimate = calculateFare(activeSearch, activeVehicle, pricingConfig);
        const addOnsTotal = selectedAddOns.reduce((sum, item) => sum + item.totalPrice, 0);
        const fareEstimate = addOnsTotal > 0 ? {
          ...baseFareEstimate,
          totalEstimatedFare: baseFareEstimate.totalEstimatedFare + addOnsTotal,
          breakdown: [
            ...baseFareEstimate.breakdown,
            { label: `Selected Add-ons & Amenities (${selectedAddOns.length})`, amount: addOnsTotal },
          ],
        } : baseFareEstimate;

        const passengerDetails: PassengerDetails = {
          fullName: activeCustomer.fullName || 'Customer',
          mobileNumber: activeCustomer.mobileNumber || '',
          email: activeCustomer.email || '',
          specialInstructions: selectedAddOns.length > 0
            ? `Requested Amenities: ${selectedAddOns.map((a) => `${a.quantity > 1 ? `${a.quantity}x ` : ''}${a.shortLabel || a.name}`).join(', ')}`
            : '',
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
          selectedAddOns,
          addOnsTotal,
        };

        // Sync booking to backend dispatch registry & Firestore
        await Promise.allSettled([
          fetch('/api/bookings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newBooking),
          }),
          saveBookingToFirestore({
            id: refId,
            userId: activeCustomer.id,
            customerName: passengerDetails.fullName,
            customerPhone: passengerDetails.mobileNumber,
            customerEmail: passengerDetails.email || undefined,
            tripType: activeSearch.serviceType,
            pickupLocation: activeSearch.pickupLocation,
            dropLocation: activeSearch.dropLocation,
            pickupDate: activeSearch.pickupDate || activeSearch.travelDate || '',
            pickupTime: activeSearch.pickupTime || '',
            vehicleType: activeVehicle.id,
            estimatedFare: fareEstimate.totalEstimatedFare,
            distanceKm: fareEstimate.exactDistanceKm || activeSearch.routeInfo?.distanceKm,
            status: 'PENDING',
            createdAt: new Date().toISOString(),
          }),
        ]);

        handleCompleteBooking(newBooking);
        // Open booking confirmation modal
        setBookingModalOpen(true);
      } catch (err) {
        console.warn('Booking confirmation submission error:', err);
      } finally {
        setIsConfirmingBooking(false);
      }
    },
    [searchState, selectedVehicle, pricingConfig, customer, handleCompleteBooking, selectedAddOns]
  );

  // Handles vehicle selection for all booking forms
  const handleSelectPreferredVehicle = useCallback(
    (vehicle: Vehicle) => {
      setSelectedVehicle(vehicle);

      // For non-login customers: show login form after selecting preferred vehicle
      if (!customer) {
        setCustomerAuthModalOpen(true);
      }
    },
    [customer]
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
    setSelectedAddOns([]);
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

  const handleSelectRouteFromDirectory = (routeConfig: Partial<BookingSearchState>) => {
    const today = new Date().toISOString().split('T')[0];
    const updatedState: BookingSearchState = {
      serviceType: routeConfig.serviceType || 'oneway',
      pickupLocation: routeConfig.pickupLocation || 'Bangalore, Karnataka',
      dropLocation: routeConfig.dropLocation || '',
      travelDate: routeConfig.travelDate || today,
      pickupDate: routeConfig.pickupDate || today,
      dropDate: routeConfig.dropDate || today,
      returnDate: routeConfig.returnDate || today,
      pickupTime: routeConfig.pickupTime || '07:00 AM',
      durationHours: routeConfig.durationHours || 8,
      airportTransferType: routeConfig.airportTransferType || 'drop',
      passengers: 2,
      vehicleType: 'all',
    };

    setSearchState(updatedState);
    const searchElem = document.getElementById('booking-search-section');
    if (searchElem) {
      searchElem.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleScrollToBookingSearch = () => {
    const searchElem = document.getElementById('booking-search-section');
    if (searchElem && searchElem.offsetHeight > 10) {
      searchElem.scrollIntoView({ behavior: 'smooth' });
    } else {
      const servicesElem = document.getElementById('services');
      if (servicesElem) {
        servicesElem.scrollIntoView({ behavior: 'smooth' });
      }
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
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans antialiased selection:bg-emerald-800 selection:text-white flex flex-col pb-16 md:pb-0">
      {/* Real-time PWA Offline Network Banner */}
      <OfflineIndicator />

      {/* Header */}
      <Header
        onBookRideClick={handleScrollToBookingSearch}
        onOpenLegal={(type) => setLegalModalType(type)}
        customer={customer}
        onOpenCustomerPortal={handleOpenCustomerPortal}
        onOpenDownloadApp={() => setDownloadAppModalOpen(true)}
        onOpenCustomerAuth={() => setCustomerAuthModalOpen(true)}
        onCustomerLogout={handleCustomerLogout}
        onOpenTrackBooking={() => handleOpenTrackBooking()}
      />

      {/* Global Dynamic Progress Indicator for Search & Booking Interactions */}
      <ProgressBar
        isLoading={isSearching || isConfirmingBooking}
        className="fixed top-0 left-0 right-0 z-50 rounded-none h-1 shadow-xs"
      />

      {/* Main Page Layout */}
      <main className="flex-1">
        {/* Hero Section */}
        <Hero
          onBookRideClick={handleScrollToBookingSearch}
          onGetQuoteClick={handleScrollToBookingSearch}
        />

        {/* Booking Search Section */}
        <section
          id="booking-search-section"
          className="relative empty:hidden mt-2 mb-8 sm:mb-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 z-30"
        >
          <BookingSearch
            initialState={searchState || undefined}
            onSearch={handleSearchSubmit}
            onConfirmBooking={handleInstantConfirmBooking}
            onReset={handleResetSearch}
            pricingConfig={pricingConfig}
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
                onSelectVehicle={handleSelectPreferredVehicle}
                isLoading={isSearching}
                onEditSearch={() => {
                  const searchElem = document.getElementById('booking-search-section');
                  if (searchElem) searchElem.scrollIntoView({ behavior: 'smooth' });
                }}
                onProceedToBooking={() => handleDirectConfirmBooking()}
                onClearSearch={handleResetSearch}
                onSelectCachedSearch={handleSelectCachedSearch}
                isSubmittingBooking={isConfirmingBooking}
                selectedAddOns={selectedAddOns}
                onAddOnsChange={setSelectedAddOns}
              />
            </section>
          )}
        </div>

        {/* Services Section */}
        <ServicesSection onSelectService={handleSelectServiceFromSection} />

        {/* Fleet Section */}
        <FleetSection onSelectVehicleForBooking={handleSelectVehicleFromFleet} />

        {/* Why Choose Us Section */}
        <WhyChooseUs />

        {/* TOP OUTSTATION & AIRPORT TAXI ROUTES SECTION (Recreated exactly from reference screenshot) */}
        <TopOutstationRoutesSection
          onSelectRoute={handleSelectRouteFromDirectory}
          onOpenBookingSearch={handleScrollToBookingSearch}
        />

        {/* FAQ Section */}
        <FAQSection />
      </main>

      {/* Footer */}
      <Footer
        onOpenLegal={(type) => setLegalModalType(type)}
        onBookRideClick={handleScrollToBookingSearch}
        customer={customer}
        onOpenCustomerPortal={() => setCustomerPortalModalOpen(true)}
        onOpenTrackBooking={() => handleOpenTrackBooking()}
      />

      {/* Mobile Priority Fixed Bottom Navigation Bar */}
      <MobileBottomNav
        onBookClick={handleScrollToBookingSearch}
        onRoutesClick={() => {
          const routesElem = document.getElementById('top-outstation-routes-section');
          if (routesElem) {
            routesElem.scrollIntoView({ behavior: 'smooth' });
          }
        }}
        onAccountClick={() => {
          if (customer) {
            handleOpenCustomerPortal('trips');
          } else {
            setCustomerAuthModalOpen(true);
          }
        }}
        customer={customer}
      />

      {/* Multi-step Booking Dialog Modal */}
      {bookingModalOpen && searchState && selectedVehicle && (
        <BookingModal
          isOpen={bookingModalOpen}
          onClose={() => {
            setBookingModalOpen(false);
            setSearchState(null);
            setSelectedVehicle(null);
            setSelectedAddOns([]);
          }}
          searchDetails={searchState}
          selectedVehicle={selectedVehicle}
          pricingConfig={pricingConfig}
          onCompleteBooking={handleCompleteBooking}
          customer={customer}
          onOpenTrackBooking={(refId) => handleOpenTrackBooking(refId)}
          selectedAddOns={selectedAddOns}
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
            initialTab={customerPortalInitialTab}
            onLogout={handleCustomerLogout}
            onUpdateCustomer={handleUpdateCustomerProfile}
            onRebookTrip={handleRebookTrip}
            onBookNewRide={handleScrollToBookingSearch}
            onOpenTrackBooking={(refId) => handleOpenTrackBooking(refId)}
            onSelectSavedDestinationForBooking={handleSelectSavedDestinationForBooking}
          />
        )}

        {/* Download App Modal */}
        {downloadAppModalOpen && (
          <DownloadAppModal
            isOpen={downloadAppModalOpen}
            onClose={() => setDownloadAppModalOpen(false)}
          />
        )}
      </React.Suspense>

      {/* Customer Login / Register Modal */}
      {customerAuthModalOpen && (
        <CustomerAuthModal
          isOpen={customerAuthModalOpen}
          onClose={() => setCustomerAuthModalOpen(false)}
          preferredVehicle={selectedVehicle}
          onSuccess={(loggedCustomer) => {
            setCustomer(loggedCustomer);
            setCustomerAuthModalOpen(false);
            setTimeout(() => {
              const confirmBtn =
                (selectedVehicle && document.getElementById(`btn-confirm-vehicle-${selectedVehicle.id}`)) ||
                document.querySelector('[id^="btn-confirm-vehicle-"]') ||
                document.getElementById('search-results-anchor');
              if (confirmBtn) {
                confirmBtn.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
              }
            }, 150);
          }}
        />
      )}

      {/* Real-time Push Notification Alert Toast / Banner */}
      <InAppPushNotificationBanner
        onOpenRideDetails={() => {
          setCustomerPortalModalOpen(true);
        }}
      />

      {/* Real-time Ride Status & Live GPS Vehicle Tracker Modal */}
      {bookingTrackerOpen && (
        <BookingTrackerModal
          isOpen={bookingTrackerOpen}
          onClose={() => setBookingTrackerOpen(false)}
          initialReferenceId={trackingReferenceId}
          onBookNewRide={handleScrollToBookingSearch}
        />
      )}

      {/* Global Theme & Visual Appearance Customizer Modal */}
      <ThemeCustomizerModal />
    </div>
  );
}
