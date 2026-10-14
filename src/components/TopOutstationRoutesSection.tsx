import React from 'react';
import { BookingSearchState } from '../types';

interface TopOutstationRoutesSectionProps {
  onSelectRoute?: (routeConfig: Partial<BookingSearchState>) => void;
  onOpenBookingSearch?: () => void;
}

export const TopOutstationRoutesSection: React.FC<TopOutstationRoutesSectionProps> = ({
  onSelectRoute,
  onOpenBookingSearch,
}) => {
  // Handler for route item clicks connecting to the booking engine
  const handleItemClick = (
    columnHeading: string,
    itemLabel: string
  ) => {
    const today = new Date().toISOString().split('T')[0];

    // Case 1: "One way Drops" or "One way Drops / Out station Packages"
    if (
      itemLabel === 'One way Drops' ||
      itemLabel === 'One way Drops / Out station Packages'
    ) {
      let pickup = 'Bangalore, Karnataka';
      if (columnHeading.includes('Mysore')) {
        pickup = 'Mysuru, Karnataka';
      } else if (columnHeading.includes('Coorg')) {
        pickup = 'Madikeri, Coorg, Karnataka';
      } else if (columnHeading.includes('Ooty')) {
        pickup = 'Ooty, Tamil Nadu';
      }

      onSelectRoute?.({
        serviceType: 'oneway',
        pickupLocation: pickup,
        dropLocation: '',
        travelDate: today,
        pickupDate: today,
        pickupTime: '07:00 AM',
      });
      return;
    }

    // Case 2: "Mysore Sightseeing Package"
    if (itemLabel === 'Mysore Sightseeing Package') {
      onSelectRoute?.({
        serviceType: 'local',
        pickupLocation: 'Mysuru, Karnataka',
        durationHours: 8,
        travelDate: today,
        pickupDate: today,
        pickupTime: '09:00 AM',
      });
      return;
    }

    // Case 3: Bengaluru / BLR Airport T1 & T2 selection
    if (itemLabel === 'Bengaluru / BLR Airport T1 & T2') {
      let city = 'Mysuru, Karnataka';
      if (columnHeading.includes('Coorg')) {
        city = 'Madikeri, Coorg, Karnataka';
      } else if (columnHeading.includes('Ooty')) {
        city = 'Ooty, Tamil Nadu';
      }

      onSelectRoute?.({
        serviceType: 'airport',
        airportTransferType: 'drop',
        pickupLocation: city,
        dropLocation: 'Bengaluru Kempegowda Airport (BLR)',
        travelDate: today,
        pickupDate: today,
        pickupTime: '06:00 AM',
      });
      return;
    }

    // Case 4: Specific destination city clicked within a column
    let origin = 'Bangalore, Karnataka';
    if (columnHeading === 'Bengaluru / BLR Airport T1 & T2') {
      origin = 'Bangalore, Karnataka';
    } else if (columnHeading === 'Mysore') {
      origin = 'Mysuru, Karnataka';
    } else if (columnHeading === 'Coorg (Madikeri)') {
      origin = 'Madikeri, Coorg, Karnataka';
    } else if (columnHeading === 'Ooty') {
      origin = 'Ooty, Tamil Nadu';
    }

    let destination = itemLabel;
    if (itemLabel === 'Mysore') destination = 'Mysuru, Karnataka';
    else if (itemLabel === 'Coorg' || itemLabel === 'Coorg (Madikeri)') destination = 'Madikeri, Coorg, Karnataka';
    else if (itemLabel === 'Kabini') destination = 'Kabini, Karnataka';
    else if (itemLabel === 'Hassan') destination = 'Hassan, Karnataka';
    else if (itemLabel === 'Chikkamagaluru') destination = 'Chikmagalur, Karnataka';
    else if (itemLabel === 'Ooty') destination = 'Ooty, Tamil Nadu';
    else if (itemLabel === 'Kodaikanal') destination = 'Kodaikanal, Tamil Nadu';
    else if (itemLabel === 'Wayanad') destination = 'Wayanad, Kerala';
    else if (itemLabel === 'Coimbatore') destination = 'Coimbatore, Tamil Nadu';

    onSelectRoute?.({
      serviceType: 'oneway',
      pickupLocation: origin,
      dropLocation: destination,
      travelDate: today,
      pickupDate: today,
      pickupTime: '07:00 AM',
    });
  };

  const columns = [
    {
      heading: 'Bengaluru / BLR Airport T1 & T2',
      items: [
        'One way Drops / Out station Packages',
        'Mysore',
        'Coorg',
        'Kabini',
        'Hassan',
        'Chikkamagaluru',
        'Ooty',
        'Kodaikanal',
        'Wayanad',
      ],
    },
    {
      heading: 'Mysore',
      items: [
        'Mysore Sightseeing Package',
        'One way Drops / Out station Packages',
        'Bengaluru / BLR Airport T1 & T2',
        'Coorg',
        'Kabini',
        'Hassan',
        'Chikkamagaluru',
        'Ooty',
        'Wayanad',
      ],
    },
    {
      heading: 'Coorg (Madikeri)',
      items: [
        'One way Drops',
        'Bengaluru / BLR Airport T1 & T2',
        'Mysore',
        'Kabini',
        'Hassan',
        'Chikkamagaluru',
        'Ooty',
        'Wayanad',
      ],
    },
    {
      heading: 'Ooty',
      items: [
        'One way Drops',
        'Bengaluru / BLR Airport T1 & T2',
        'Mysore',
        'Coorg (Madikeri)',
        'Coimbatore',
        'Wayanad',
      ],
    },
  ];

  return (
    <section
      id="top-outstation-routes-section"
      className="w-full relative transition-colors duration-200 border-t border-[#124331] dark:border-[#103B2D] scroll-mt-20 overflow-hidden bg-[#002218] dark:bg-[#002218]"
      style={{
        backgroundImage:
          'linear-gradient(to right, rgba(16, 59, 45, 0.45) 1px, transparent 1px), linear-gradient(to bottom, rgba(16, 59, 45, 0.45) 1px, transparent 1px)',
        backgroundSize: '100px 100px',
      }}
      aria-label="Top Outstation and Airport Taxi Routes"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 py-14 sm:py-16 lg:py-20 relative z-10">
        {/* Top Header Row */}
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6 pb-6">
          {/* Left Title & Subtitle */}
          <div className="space-y-2 max-w-4xl">
            <div className="flex items-center gap-3.5 sm:gap-4">
              {/* Compass icon: circular teal-green outline matching screenshot (38-42px) */}
              <div
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-full border-2 border-[#21C99A] flex items-center justify-center shrink-0 text-[#21C99A]"
                aria-hidden="true"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="w-5 h-5 sm:w-6 sm:h-6"
                >
                  <circle cx="12" cy="12" r="10" />
                  <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" fill="currentColor" fillOpacity="0.15" />
                </svg>
              </div>

              {/* Main Heading: white/light gray bold uppercase */}
              <h2 className="text-2xl sm:text-3xl lg:text-[34px] font-bold sm:font-extrabold text-[#F5F8F6] tracking-wide uppercase leading-tight font-sans">
                TOP OUTSTATION &amp; AIRPORT TAXI ROUTES
              </h2>
            </div>

            {/* Subtitle: muted mint-green */}
            <p className="text-base sm:text-lg lg:text-[20px] text-[#8CBCA7] font-normal leading-relaxed pl-12 sm:pl-14">
              Explore popular outstation packages, airport drops, and sightseeing cab routes.
            </p>
          </div>

          {/* Right Service Badge: amber-yellow text on dark green pill with thin border */}
          <div className="self-start lg:self-auto shrink-0 pl-12 lg:pl-0 pt-1 lg:pt-0">
            <span
              className="inline-flex items-center px-5 sm:px-6 py-2.5 sm:py-3 rounded-full border border-[#10583F] bg-[#063D2D] text-[#F4A51C] text-xs sm:text-sm lg:text-[15px] font-semibold tracking-wide shadow-2xs select-none"
            >
              24/7 Doorstep Pickup • Verified Drivers • AC Cabs
            </span>
          </div>
        </div>

        {/* Thin green horizontal divider (1px low contrast #124331) */}
        <div className="border-t border-[#124331] my-8 sm:my-10" />

        {/* Four-Column Destination Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-10 xl:gap-12">
          {columns.map((col) => (
            <div key={col.heading} className="space-y-4">
              {/* Column Heading: white/light gray */}
              <h3 className="font-bold sm:font-extrabold text-[#F0F5F2] text-base sm:text-lg lg:text-[20px] tracking-tight leading-snug">
                {col.heading}
              </h3>

              {/* Route Destination Items */}
              <ul className="space-y-2.5 sm:space-y-3" role="list">
                {col.items.map((item, idx) => (
                  <li key={`${col.heading}-${idx}`}>
                    <button
                      type="button"
                      onClick={() => handleItemClick(col.heading, item)}
                      className="text-left w-full text-[#91BBA7] hover:text-[#B8E4D0] focus:text-[#B8E4D0] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F4A51C] focus-visible:ring-offset-2 focus-visible:ring-offset-[#002218] rounded text-sm sm:text-base lg:text-[17px] font-normal leading-relaxed transition-colors duration-150 cursor-pointer block select-none group"
                      title={`Book taxi route: ${col.heading} ➔ ${item}`}
                    >
                      <span className="group-hover:translate-x-0.5 inline-block transition-transform duration-150">
                        {item}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
