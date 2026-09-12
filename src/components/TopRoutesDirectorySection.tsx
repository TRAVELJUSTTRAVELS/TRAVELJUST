import React from 'react';
import { Compass } from 'lucide-react';

interface TopRoutesDirectorySectionProps {
  onSelectRoute?: (routeQuery: string) => void;
}

export const TopRoutesDirectorySection: React.FC<TopRoutesDirectorySectionProps> = () => {
  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, targetId: string) => {
    e.preventDefault();
    const targetElement = document.querySelector(targetId);
    if (targetElement) {
      targetElement.scrollIntoView({ behavior: 'smooth' });
    } else {
      const searchElem = document.getElementById('booking-search-section');
      if (searchElem) {
        searchElem.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  return (
    <section
      id="top-routes-directory-section"
      className="py-14 sm:py-16 text-slate-200 border-t border-[#073322] relative overflow-hidden"
      style={{
        backgroundColor: '#032014',
        backgroundImage: `
          linear-gradient(to right, rgba(16, 185, 129, 0.08) 1px, transparent 1px),
          linear-gradient(to bottom, rgba(16, 185, 129, 0.08) 1px, transparent 1px)
        `,
        backgroundSize: '48px 48px',
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-[#0a462e]">
            <div>
              <h3
                id="top-routes-heading"
                className="font-bold text-white uppercase tracking-wider text-sm sm:text-base flex items-center gap-2.5"
              >
                <Compass className="w-5 h-5 text-emerald-400 shrink-0" />
                <span>Top Outstation & Airport Taxi Routes</span>
              </h3>
              <p className="text-xs text-emerald-200/70 mt-1">
                Explore popular outstation packages, airport drops, and sightseeing cab routes.
              </p>
            </div>
            <span className="inline-flex items-center gap-1.5 text-xs text-emerald-300 font-semibold bg-[#05321f]/90 border border-emerald-700/60 px-3 py-1 rounded-full w-fit shadow-xs">
              24/7 Doorstep Pickup • Verified Drivers • AC Cabs
            </span>
          </div>

          {/* 4-Column Directory Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-6 pt-2">
            {/* Column 1: Bengaluru / BLR Airport */}
            <div className="space-y-2">
              <span id="route-col-bengaluru-heading" className="font-bold text-white block text-xs tracking-wide">
                Bengaluru / BLR Airport T1 & T2
              </span>
              <ul id="routes-destinations-bengaluru-list" className="space-y-1.5 text-xs text-emerald-100/70">
                <li><a href="#popular-routes-section" onClick={(e) => handleNavClick(e, '#popular-routes-section')} className="hover:text-emerald-300 transition-colors">One way Drops / Out station Packages</a></li>
                <li><a href="#popular-routes-section" onClick={(e) => handleNavClick(e, '#popular-routes-section')} className="hover:text-emerald-300 transition-colors">Mysore</a></li>
                <li><a href="#popular-routes-section" onClick={(e) => handleNavClick(e, '#popular-routes-section')} className="hover:text-emerald-300 transition-colors">Coorg</a></li>
                <li><a href="#popular-routes-section" onClick={(e) => handleNavClick(e, '#popular-routes-section')} className="hover:text-emerald-300 transition-colors">Kabini</a></li>
                <li><a href="#popular-routes-section" onClick={(e) => handleNavClick(e, '#popular-routes-section')} className="hover:text-emerald-300 transition-colors">Hassan</a></li>
                <li><a href="#popular-routes-section" onClick={(e) => handleNavClick(e, '#popular-routes-section')} className="hover:text-emerald-300 transition-colors">Chikkamagaluru</a></li>
                <li><a href="#popular-routes-section" onClick={(e) => handleNavClick(e, '#popular-routes-section')} className="hover:text-emerald-300 transition-colors">Ooty</a></li>
                <li><a href="#popular-routes-section" onClick={(e) => handleNavClick(e, '#popular-routes-section')} className="hover:text-emerald-300 transition-colors">Wayanad</a></li>
              </ul>
            </div>

            {/* Column 2: Mysore */}
            <div className="space-y-2">
              <span id="route-col-mysore-heading" className="font-bold text-white block text-xs tracking-wide">
                Mysore
              </span>
              <ul id="routes-destinations-mysore-list" className="space-y-1.5 text-xs text-emerald-100/70">
                <li><a href="#popular-routes-section" onClick={(e) => handleNavClick(e, '#popular-routes-section')} className="hover:text-emerald-300 transition-colors">Mysore Sightseeing Package</a></li>
                <li><a href="#popular-routes-section" onClick={(e) => handleNavClick(e, '#popular-routes-section')} className="hover:text-emerald-300 transition-colors">One way Drops / Out station Packages</a></li>
                <li><a href="#popular-routes-section" onClick={(e) => handleNavClick(e, '#popular-routes-section')} className="hover:text-emerald-300 transition-colors">Bengaluru / BLR Airport T1 & T2</a></li>
                <li><a href="#popular-routes-section" onClick={(e) => handleNavClick(e, '#popular-routes-section')} className="hover:text-emerald-300 transition-colors">Coorg</a></li>
                <li><a href="#popular-routes-section" onClick={(e) => handleNavClick(e, '#popular-routes-section')} className="hover:text-emerald-300 transition-colors">Kabini</a></li>
                <li><a href="#popular-routes-section" onClick={(e) => handleNavClick(e, '#popular-routes-section')} className="hover:text-emerald-300 transition-colors">Hassan</a></li>
                <li><a href="#popular-routes-section" onClick={(e) => handleNavClick(e, '#popular-routes-section')} className="hover:text-emerald-300 transition-colors">Chikkamagaluru</a></li>
                <li><a href="#popular-routes-section" onClick={(e) => handleNavClick(e, '#popular-routes-section')} className="hover:text-emerald-300 transition-colors">Ooty</a></li>
                <li><a href="#popular-routes-section" onClick={(e) => handleNavClick(e, '#popular-routes-section')} className="hover:text-emerald-300 transition-colors">Wayanad</a></li>
              </ul>
            </div>

            {/* Column 3: Coorg (Madikeri) */}
            <div className="space-y-2">
              <span id="route-col-coorg-heading" className="font-bold text-white block text-xs tracking-wide">
                Coorg (Madikeri)
              </span>
              <ul id="routes-destinations-coorg-list" className="space-y-1.5 text-xs text-emerald-100/70">
                <li><a href="#popular-routes-section" onClick={(e) => handleNavClick(e, '#popular-routes-section')} className="hover:text-emerald-300 transition-colors">One way Drops</a></li>
                <li><a href="#popular-routes-section" onClick={(e) => handleNavClick(e, '#popular-routes-section')} className="hover:text-emerald-300 transition-colors">Bengaluru / BLR Airport T1 & T2</a></li>
                <li><a href="#popular-routes-section" onClick={(e) => handleNavClick(e, '#popular-routes-section')} className="hover:text-emerald-300 transition-colors">Mysore</a></li>
                <li><a href="#popular-routes-section" onClick={(e) => handleNavClick(e, '#popular-routes-section')} className="hover:text-emerald-300 transition-colors">Kabini</a></li>
                <li><a href="#popular-routes-section" onClick={(e) => handleNavClick(e, '#popular-routes-section')} className="hover:text-emerald-300 transition-colors">Hassan</a></li>
                <li><a href="#popular-routes-section" onClick={(e) => handleNavClick(e, '#popular-routes-section')} className="hover:text-emerald-300 transition-colors">Chikkamagaluru</a></li>
                <li><a href="#popular-routes-section" onClick={(e) => handleNavClick(e, '#popular-routes-section')} className="hover:text-emerald-300 transition-colors">Ooty</a></li>
                <li><a href="#popular-routes-section" onClick={(e) => handleNavClick(e, '#popular-routes-section')} className="hover:text-emerald-300 transition-colors">Wayanad</a></li>
              </ul>
            </div>

            {/* Column 4: Ooty */}
            <div className="space-y-2">
              <span id="route-col-ooty-heading" className="font-bold text-white block text-xs tracking-wide">
                Ooty
              </span>
              <ul id="routes-destinations-ooty-list" className="space-y-1.5 text-xs text-emerald-100/70">
                <li><a href="#popular-routes-section" onClick={(e) => handleNavClick(e, '#popular-routes-section')} className="hover:text-emerald-300 transition-colors">One way Drops</a></li>
                <li><a href="#popular-routes-section" onClick={(e) => handleNavClick(e, '#popular-routes-section')} className="hover:text-emerald-300 transition-colors">Bengaluru / BLR Airport T1 & T2</a></li>
                <li><a href="#popular-routes-section" onClick={(e) => handleNavClick(e, '#popular-routes-section')} className="hover:text-emerald-300 transition-colors">Mysore</a></li>
                <li><a href="#popular-routes-section" onClick={(e) => handleNavClick(e, '#popular-routes-section')} className="hover:text-emerald-300 transition-colors">Coorg (Madikeri)</a></li>
                <li><a href="#popular-routes-section" onClick={(e) => handleNavClick(e, '#popular-routes-section')} className="hover:text-emerald-300 transition-colors">Coimbatore</a></li>
                <li><a href="#popular-routes-section" onClick={(e) => handleNavClick(e, '#popular-routes-section')} className="hover:text-emerald-300 transition-colors">Wayanad</a></li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
