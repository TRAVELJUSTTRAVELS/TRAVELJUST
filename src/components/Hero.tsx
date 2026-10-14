import React from 'react';
import {
  CircleCheck,
  IndianRupee,
  ShieldCheck,
  Car,
} from 'lucide-react';

interface HeroProps {
  onBookRideClick?: () => void;
  onGetQuoteClick?: () => void;
}

export const Hero: React.FC<HeroProps> = () => {
  return (
    <section
      id="home"
      className="relative pt-24 sm:pt-28 pb-4 sm:pb-6 bg-white dark:bg-slate-950 overflow-hidden scroll-mt-0 transition-colors"
    >
      <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center pt-2 sm:pt-4 pb-2 z-10">
        {/* Main Heading: Travel Made in vivid orange (#FE9A00) + Simple. in deep green (#0a4d3c) */}
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.15] max-w-3xl mx-auto font-sans">
          <span className="text-[#FE9A00]">Travel Made</span>{' '}
          <span className="text-[#0a4d3c] dark:text-emerald-400">Simple.</span>
        </h1>

        {/* Hero description: dark navy text, two-line desktop wrapping */}
        <p className="mt-3.5 sm:mt-4 text-base sm:text-lg text-slate-800 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed font-medium">
          Reliable rides for local travel, one-way drops, round trips and airport transfers.
        </p>

        {/* Hero service benefits: 4 equally sized pale mint-green cards in 1 row on desktop */}
        <div className="mt-7 grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 max-w-4xl mx-auto">
          {/* Card 1: 24/7 Service */}
          <div className="flex items-center justify-center gap-2.5 px-4 py-3 rounded-2xl bg-[#D0F9E5] dark:bg-emerald-950/40 border border-[#B8F4D8]/60 dark:border-emerald-800/60 shadow-2xs">
            <CircleCheck className="w-5 h-5 text-[#00825B] dark:text-emerald-400 shrink-0 stroke-[2.2]" />
            <span className="text-xs sm:text-sm lg:text-[15px] font-bold text-[#17375E] dark:text-emerald-100 whitespace-nowrap">
              24/7 Service
            </span>
          </div>

          {/* Card 2: Transparent Pricing */}
          <div className="flex items-center justify-center gap-2.5 px-4 py-3 rounded-2xl bg-[#D0F9E5] dark:bg-emerald-950/40 border border-[#B8F4D8]/60 dark:border-emerald-800/60 shadow-2xs">
            <IndianRupee className="w-5 h-5 text-[#00825B] dark:text-emerald-400 shrink-0 stroke-[2.2]" />
            <span className="text-xs sm:text-sm lg:text-[15px] font-bold text-[#17375E] dark:text-emerald-100 whitespace-nowrap">
              Transparent Pricing
            </span>
          </div>

          {/* Card 3: Verified Drivers */}
          <div className="flex items-center justify-center gap-2.5 px-4 py-3 rounded-2xl bg-[#D0F9E5] dark:bg-emerald-950/40 border border-[#B8F4D8]/60 dark:border-emerald-800/60 shadow-2xs">
            <ShieldCheck className="w-5 h-5 text-[#00825B] dark:text-emerald-400 shrink-0 stroke-[2.2]" />
            <span className="text-xs sm:text-sm lg:text-[15px] font-bold text-[#17375E] dark:text-emerald-100 whitespace-nowrap">
              Verified Drivers
            </span>
          </div>

          {/* Card 4: Doorstep Pickup (matched to user reference image with Car icon and mint background) */}
          <div className="flex items-center justify-center gap-2.5 px-4 py-3 rounded-2xl bg-[#D0F9E5] dark:bg-emerald-950/40 border border-[#B8F4D8]/60 dark:border-emerald-800/60 shadow-2xs">
            <Car className="w-5 h-5 text-[#00825B] dark:text-emerald-400 shrink-0 stroke-[2.2]" />
            <span className="text-xs sm:text-sm lg:text-[15px] font-bold text-[#17375E] dark:text-emerald-100 whitespace-nowrap">
              Doorstep Pickup
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};

