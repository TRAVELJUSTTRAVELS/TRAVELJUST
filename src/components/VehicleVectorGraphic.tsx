import React from 'react';

interface VehicleVectorGraphicProps {
  vehicleId: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Ultra-Sharp High Definition Vector Automotive Artwork.
 * Rendered using mathematical SVG paths with geometric precision,
 * ensuring flawless infinite resolution on 4K, 5K, Retina, and OLED displays.
 */
export const VehicleVectorGraphic: React.FC<VehicleVectorGraphicProps> = ({
  vehicleId,
  className = '',
  size = 'md',
}) => {
  const normalizedId = vehicleId.toLowerCase();

  // Size dimensions
  const dimensions = {
    sm: { width: 56, height: 38 },
    md: { width: 84, height: 54 },
    lg: { width: 120, height: 76 },
  }[size];

  // 1. SEDAN (4+1) - Sleek Executive Aerodynamic Profile
  if (normalizedId.includes('sedan') || normalizedId.includes('etios') || normalizedId.includes('dzire')) {
    return (
      <svg
        viewBox="0 0 100 50"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        shapeRendering="geometricPrecision"
        textRendering="geometricPrecision"
        style={{ imageRendering: '-webkit-optimize-contrast' }}
        className={`shrink-0 select-none ${className}`}
        width={dimensions.width}
        height={dimensions.height}
        aria-label="Sedan 4+1 High Definition Silhouette"
      >
        <defs>
          <linearGradient id="sedanBodyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#047857" />
            <stop offset="50%" stopColor="#065f46" />
            <stop offset="100%" stopColor="#022c22" />
          </linearGradient>
          <linearGradient id="sedanGlassGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#93c5fd" stopOpacity="0.85" />
            <stop offset="100%" stopColor="#1e3a8a" stopOpacity="0.95" />
          </linearGradient>
          <linearGradient id="rimGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f8fafc" />
            <stop offset="100%" stopColor="#94a3b8" />
          </linearGradient>
        </defs>

        {/* Ground shadow */}
        <ellipse cx="50" cy="46" rx="42" ry="2.5" fill="#0f172a" fillOpacity="0.18" />

        {/* Main Body Contours */}
        <path
          d="M 6 36 L 11 36 C 12 32 16 29 21 29 C 26 29 30 32 31 36 L 69 36 C 70 32 74 29 79 29 C 84 29 88 32 89 36 L 94 36 C 96 36 98 34 97 31 L 93 25 C 92 23 89 22 84 21 L 69 20 L 53 11 C 51 9.8 48 9.5 44 9.5 L 30 9.5 C 26 9.5 22 12 19 16 L 10 23 L 4 25 C 2 26 1 28 1 31 L 1 34 C 1 35.5 3 36 6 36 Z"
          fill="url(#sedanBodyGrad)"
        />

        {/* Cabin Glass - High Definition Reflection */}
        <path
          d="M 23 16 L 31 11.5 L 48 11.5 L 48 20 L 19.5 20 Z"
          fill="url(#sedanGlassGrad)"
        />
        <path
          d="M 50.5 11.5 L 67 20 L 50.5 20 Z"
          fill="url(#sedanGlassGrad)"
        />
        {/* Subtle pillar separator */}
        <rect x="48.5" y="11" width="1.8" height="9" fill="#065f46" />

        {/* Headlight & Taillight Accents */}
        <path d="M 94 25 L 97 27 L 95 30 L 92 29 Z" fill="#38bdf8" />
        <path d="M 1 28 L 4 28 L 3 32 L 1 32 Z" fill="#ef4444" />

        {/* Chrome Door Line & Handle */}
        <line x1="32" y1="23" x2="66" y2="23" stroke="#10b981" strokeWidth="0.75" strokeOpacity="0.8" />
        <rect x="37" y="24" width="4" height="1" rx="0.5" fill="#e2e8f0" />
        <rect x="54" y="24" width="4" height="1" rx="0.5" fill="#e2e8f0" />

        {/* Front Wheel */}
        <circle cx="79" cy="36" r="8" fill="#1e293b" />
        <circle cx="79" cy="36" r="5" fill="url(#rimGrad)" />
        <circle cx="79" cy="36" r="2.2" fill="#0f172a" />
        {/* Rear Wheel */}
        <circle cx="21" cy="36" r="8" fill="#1e293b" />
        <circle cx="21" cy="36" r="5" fill="url(#rimGrad)" />
        <circle cx="21" cy="36" r="2.2" fill="#0f172a" />
      </svg>
    );
  }

  // 2. SUV (6+1) - Modern Sturdy High-Roof Crossover Silhouette
  if (normalizedId.includes('suv') || normalizedId.includes('ertiga')) {
    return (
      <svg
        viewBox="0 0 100 50"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        shapeRendering="geometricPrecision"
        textRendering="geometricPrecision"
        style={{ imageRendering: '-webkit-optimize-contrast' }}
        className={`shrink-0 select-none ${className}`}
        width={dimensions.width}
        height={dimensions.height}
        aria-label="SUV 6+1 High Definition Silhouette"
      >
        <defs>
          <linearGradient id="suvBodyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#047857" />
            <stop offset="60%" stopColor="#064e3b" />
            <stop offset="100%" stopColor="#022c22" />
          </linearGradient>
          <linearGradient id="suvGlassGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#a5f3fc" stopOpacity="0.85" />
            <stop offset="100%" stopColor="#0369a1" stopOpacity="0.95" />
          </linearGradient>
          <linearGradient id="suvRimGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="#64748b" />
          </linearGradient>
        </defs>

        {/* Shadow */}
        <ellipse cx="50" cy="46.5" rx="43" ry="2.8" fill="#0f172a" fillOpacity="0.2" />

        {/* Roof Rails */}
        <path d="M 28 6 L 68 6" stroke="#94a3b8" strokeWidth="1.6" strokeLinecap="round" />
        <path d="M 33 6 L 33 8 M 63 6 L 63 8" stroke="#64748b" strokeWidth="1.2" />

        {/* Main Body */}
        <path
          d="M 5 36 L 10 36 C 11 31 16 28 21.5 28 C 27 28 31 31 32 36 L 68 36 C 69 31 74 28 79.5 28 C 85 28 89 31 90 36 L 95 36 C 97 36 98.5 33.5 97.5 30.5 L 94 22 C 92.5 19.5 89 18.5 83 18 L 73 17 L 61 8 C 59 7 55 6.5 48 6.5 L 24 6.5 C 19 6.5 15 10 13 15 L 8 23 L 3 25 C 1 26 0 28 0 31 L 0 33 C 0 35 2 36 5 36 Z"
          fill="url(#suvBodyGrad)"
        />

        {/* Side Windows: Front, Middle, Rear Quarter */}
        <path d="M 21 16 L 27 8.5 L 44 8.5 L 44 17 L 17 17 Z" fill="url(#suvGlassGrad)" />
        <path d="M 46 8.5 L 61 8.5 L 61 17 L 46 17 Z" fill="url(#suvGlassGrad)" />
        <path d="M 63 8.5 L 71 17 L 63 17 Z" fill="url(#suvGlassGrad)" />

        {/* Chrome Accent Line */}
        <line x1="28" y1="21" x2="72" y2="21" stroke="#34d399" strokeWidth="0.8" strokeOpacity="0.75" />

        {/* Headlights & Tail Lights */}
        <polygon points="94,22 97.5,24 95,28 91,26" fill="#38bdf8" />
        <polygon points="0,27 3,27 2,32 0,32" fill="#ef4444" />

        {/* Wheels */}
        <circle cx="79.5" cy="36" r="8.5" fill="#0f172a" />
        <circle cx="79.5" cy="36" r="5.2" fill="url(#suvRimGrad)" />
        <circle cx="79.5" cy="36" r="2.2" fill="#0f172a" />

        <circle cx="21.5" cy="36" r="8.5" fill="#0f172a" />
        <circle cx="21.5" cy="36" r="5.2" fill="url(#suvRimGrad)" />
        <circle cx="21.5" cy="36" r="2.2" fill="#0f172a" />
      </svg>
    );
  }

  // 3. INNOVA CRYSTA - Executive Luxury Tourer Profile
  if (normalizedId.includes('crysta')) {
    return (
      <svg
        viewBox="0 0 100 50"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        shapeRendering="geometricPrecision"
        textRendering="geometricPrecision"
        style={{ imageRendering: '-webkit-optimize-contrast' }}
        className={`shrink-0 select-none ${className}`}
        width={dimensions.width}
        height={dimensions.height}
        aria-label="Innova Crysta Luxury High Definition Silhouette"
      >
        <defs>
          <linearGradient id="crystaBodyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#065f46" />
            <stop offset="45%" stopColor="#047857" />
            <stop offset="100%" stopColor="#022c22" />
          </linearGradient>
          <linearGradient id="crystaGlassGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#67e8f9" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#0e7490" stopOpacity="0.95" />
          </linearGradient>
          <linearGradient id="crystaChrome" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#e2e8f0" />
            <stop offset="50%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="#94a3b8" />
          </linearGradient>
        </defs>

        {/* Shadow */}
        <ellipse cx="50" cy="46.5" rx="44" ry="3" fill="#0f172a" fillOpacity="0.22" />

        {/* Rear Spoiler */}
        <path d="M 6 6 L 12 6 L 10 9 L 5 9 Z" fill="#047857" />

        {/* Main Sleek Body */}
        <path
          d="M 5 36.5 L 10 36.5 C 11 31.5 16 28 22 28 C 28 28 32 31.5 33 36.5 L 68 36.5 C 69 31.5 74 28 80 28 C 86 28 90 31.5 91 36.5 L 96 36.5 C 98 36.5 99 34 98 31 L 94 20 C 92 17.5 88 16.5 82 16 L 71 15 L 56 6.5 C 53 5.5 48 5 42 5 L 15 5 C 10 5 7 8 5 13 L 2 24 C 0.5 26 0 28 0 31 L 0 34 C 0 35.8 2 36.5 5 36.5 Z"
          fill="url(#crystaBodyGrad)"
        />

        {/* Executive Tint Windows with Chrome Garnish */}
        <path d="M 18 14.5 L 25 7.5 L 43 7.5 L 43 15.5 L 14.5 15.5 Z" fill="url(#crystaGlassGrad)" />
        <path d="M 45 7.5 L 60 7.5 L 60 15.5 L 45 15.5 Z" fill="url(#crystaGlassGrad)" />
        <path d="M 62 7.5 L 70 15.5 L 62 15.5 Z" fill="url(#crystaGlassGrad)" />
        {/* Chrome Window Underline */}
        <line x1="14" y1="16.2" x2="71" y2="16.2" stroke="url(#crystaChrome)" strokeWidth="1" />

        {/* Projector LED Headlamps */}
        <polygon points="93,19 98.5,21 96,26 90.5,24" fill="#38bdf8" />
        <circle cx="95" cy="22" r="1.2" fill="#ffffff" />
        {/* LED Taillight */}
        <polygon points="0,26 3,26 2,32 0,32" fill="#f43f5e" />

        {/* Alloy Diamond-Cut Wheels */}
        <circle cx="80" cy="36.5" r="8.5" fill="#0f172a" />
        <circle cx="80" cy="36.5" r="5.5" fill="url(#crystaChrome)" />
        <circle cx="80" cy="36.5" r="2.2" fill="#022c22" />

        <circle cx="22" cy="36.5" r="8.5" fill="#0f172a" />
        <circle cx="22" cy="36.5" r="5.5" fill="url(#crystaChrome)" />
        <circle cx="22" cy="36.5" r="2.2" fill="#022c22" />
      </svg>
    );
  }

  // 4. INNOVA (Classic) - Sturdy Toyota Tourer Silhouette
  if (normalizedId.includes('innova')) {
    return (
      <svg
        viewBox="0 0 100 50"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        shapeRendering="geometricPrecision"
        textRendering="geometricPrecision"
        style={{ imageRendering: '-webkit-optimize-contrast' }}
        className={`shrink-0 select-none ${className}`}
        width={dimensions.width}
        height={dimensions.height}
        aria-label="Innova Tourer High Definition Silhouette"
      >
        <defs>
          <linearGradient id="innovaBodyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#047857" />
            <stop offset="50%" stopColor="#064e3b" />
            <stop offset="100%" stopColor="#022c22" />
          </linearGradient>
          <linearGradient id="innovaGlassGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#bae6fd" stopOpacity="0.85" />
            <stop offset="100%" stopColor="#0284c7" stopOpacity="0.95" />
          </linearGradient>
        </defs>

        <ellipse cx="50" cy="46.5" rx="43" ry="2.8" fill="#0f172a" fillOpacity="0.2" />

        {/* Body */}
        <path
          d="M 5 36.5 L 10 36.5 C 11 31.5 16 28 22 28 C 28 28 32 31.5 33 36.5 L 68 36.5 C 69 31.5 74 28 80 28 C 86 28 90 31.5 91 36.5 L 95.5 36.5 C 97.5 36.5 98.5 34 97.5 31 L 93.5 21 C 91.5 18.5 88 17.5 82 17 L 70 16 L 56 7 C 53 6 48 5.5 42 5.5 L 17 5.5 C 12 5.5 9 8.5 7 14 L 3 24 C 1 26 0 28 0 31 L 0 34 C 0 35.8 2 36.5 5 36.5 Z"
          fill="url(#innovaBodyGrad)"
        />

        {/* Glass Windows */}
        <path d="M 19 15 L 26 8 L 43 8 L 43 16 L 15 16 Z" fill="url(#innovaGlassGrad)" />
        <path d="M 45 8 L 59 8 L 59 16 L 45 16 Z" fill="url(#innovaGlassGrad)" />
        <path d="M 61 8 L 69 16 L 61 16 Z" fill="url(#innovaGlassGrad)" />

        {/* Lights */}
        <polygon points="93,20 97.5,22 95,27 90,25" fill="#38bdf8" />
        <polygon points="0,26 3,26 2,32 0,32" fill="#ef4444" />

        {/* Wheels */}
        <circle cx="80" cy="36.5" r="8.5" fill="#0f172a" />
        <circle cx="80" cy="36.5" r="5" fill="#cbd5e1" />
        <circle cx="80" cy="36.5" r="2.2" fill="#0f172a" />

        <circle cx="22" cy="36.5" r="8.5" fill="#0f172a" />
        <circle cx="22" cy="36.5" r="5" fill="#cbd5e1" />
        <circle cx="22" cy="36.5" r="2.2" fill="#0f172a" />
      </svg>
    );
  }

  // 5. TEMPO TRAVELLER (12+1) - Spacious High-Roof Force Tourer
  if (normalizedId.includes('tempo') || normalizedId.includes('traveller')) {
    return (
      <svg
        viewBox="0 0 100 50"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        shapeRendering="geometricPrecision"
        textRendering="geometricPrecision"
        style={{ imageRendering: '-webkit-optimize-contrast' }}
        className={`shrink-0 select-none ${className}`}
        width={dimensions.width}
        height={dimensions.height}
        aria-label="Tempo Traveller 12+1 High Definition Silhouette"
      >
        <defs>
          <linearGradient id="tempoBodyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#047857" />
            <stop offset="50%" stopColor="#065f46" />
            <stop offset="100%" stopColor="#022c22" />
          </linearGradient>
          <linearGradient id="tempoGlassGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#bae6fd" stopOpacity="0.85" />
            <stop offset="100%" stopColor="#0369a1" stopOpacity="0.95" />
          </linearGradient>
        </defs>

        {/* Shadow */}
        <ellipse cx="50" cy="47" rx="46" ry="3" fill="#0f172a" fillOpacity="0.22" />

        {/* Van Body */}
        <path
          d="M 4 37 L 9 37 C 10 32 15 28.5 21 28.5 C 27 28.5 31 32 32 37 L 69 37 C 70 32 75 28.5 81 28.5 C 87 28.5 91 32 92 37 L 96 37 C 98 37 99 35 99 32 L 98 22 C 97 18 94 15 89 14 L 81 13 L 73 5 C 71 3.5 68 3 62 3 L 8 3 C 4 3 2 6 2 11 L 1 31 C 1 35 2 37 4 37 Z"
          fill="url(#tempoBodyGrad)"
        />

        {/* Large Panoramic Passenger Windows */}
        <rect x="7" y="7" width="14" height="11" rx="1.5" fill="url(#tempoGlassGrad)" />
        <rect x="23" y="7" width="14" height="11" rx="1.5" fill="url(#tempoGlassGrad)" />
        <rect x="39" y="7" width="14" height="11" rx="1.5" fill="url(#tempoGlassGrad)" />
        <rect x="55" y="7" width="14" height="11" rx="1.5" fill="url(#tempoGlassGrad)" />
        {/* Front Windshield Angle */}
        <path d="M 71 7 L 85 14 L 71 18 Z" fill="url(#tempoGlassGrad)" />

        {/* Livery Gold/White Stripe */}
        <line x1="5" y1="23" x2="88" y2="23" stroke="#fcd34d" strokeWidth="1" strokeOpacity="0.9" />

        {/* Headlights & Tail Lights */}
        <rect x="94" y="24" width="4" height="5" rx="1" fill="#38bdf8" />
        <rect x="1" y="24" width="2" height="6" rx="0.5" fill="#ef4444" />

        {/* Commercial Tourer Wheels */}
        <circle cx="81" cy="37" r="8.5" fill="#0f172a" />
        <circle cx="81" cy="37" r="4.8" fill="#e2e8f0" />
        <circle cx="81" cy="37" r="2" fill="#0f172a" />

        <circle cx="21" cy="37" r="8.5" fill="#0f172a" />
        <circle cx="21" cy="37" r="4.8" fill="#e2e8f0" />
        <circle cx="21" cy="37" r="2" fill="#0f172a" />
      </svg>
    );
  }

  // Fallback Modern Cab Vector
  return (
    <svg
      viewBox="0 0 100 50"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      shapeRendering="geometricPrecision"
      textRendering="geometricPrecision"
      className={`shrink-0 select-none ${className}`}
      width={dimensions.width}
      height={dimensions.height}
    >
      <ellipse cx="50" cy="46" rx="42" ry="2.5" fill="#0f172a" fillOpacity="0.18" />
      <path
        d="M 6 36 L 11 36 C 12 32 16 29 21 29 C 26 29 30 32 31 36 L 69 36 C 70 32 74 29 79 29 C 84 29 88 32 89 36 L 94 36 C 96 36 98 34 97 31 L 93 25 C 92 23 89 22 84 21 L 69 20 L 53 11 C 51 9.8 48 9.5 44 9.5 L 30 9.5 C 26 9.5 22 12 19 16 L 10 23 L 4 25 C 2 26 1 28 1 31 L 1 34 C 1 35.5 3 36 6 36 Z"
        fill="#047857"
      />
      <circle cx="79" cy="36" r="8" fill="#1e293b" />
      <circle cx="21" cy="36" r="8" fill="#1e293b" />
    </svg>
  );
};
