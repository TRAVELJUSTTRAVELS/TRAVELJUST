import React from 'react';
import { ArrowRight, ShieldCheck, IndianRupee, Award, CheckCircle2, Sparkles, Plane, Car } from 'lucide-react';

interface HeroProps {
  onBookRideClick: () => void;
  onGetQuoteClick: () => void;
}

export const Hero: React.FC<HeroProps> = ({ onBookRideClick, onGetQuoteClick }) => {
  return (
    <section
      id="home"
      className="relative pt-28 pb-12 md:pt-36 md:pb-16 bg-gradient-to-b from-emerald-50/60 via-slate-50/50 to-white overflow-hidden scroll-mt-0"
    >
      {/* Decorative subtle background grid elements */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#04785708_1px,transparent_1px),linear-gradient(to_bottom,#04785708_1px,transparent_1px)] bg-[size:3rem_3rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-4xl mx-auto">
          {/* Headline */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.12] mb-6">
            <span className="text-[#FE9A00]">Travel Made</span> <span className="text-[#0a4d3c]">Simple.</span>
          </h1>

          {/* Supporting Text */}
          <p className="text-lg sm:text-xl text-slate-600 font-medium leading-relaxed mb-8 max-w-2xl mx-auto">
            Reliable rides for local travel, one-way drops, round trips and airport transfers.
          </p>

          {/* Key Value Highlights Badges */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-6 border-t border-slate-200/80 max-w-4xl mx-auto">
            <div className="flex items-center justify-center gap-2 text-xs sm:text-sm font-semibold text-slate-700 bg-[#ECFDF5] py-2.5 px-3 rounded-lg border border-emerald-100 shadow-2xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-800 shrink-0" />
              <span>24/7 Service</span>
            </div>

            <div className="flex items-center justify-center gap-2 text-xs sm:text-sm font-semibold text-slate-700 bg-[#ECFDF5] py-2.5 px-3 rounded-lg border border-emerald-100 shadow-2xs">
              <IndianRupee className="w-4 h-4 text-emerald-800 shrink-0" />
              <span>Transparent Pricing</span>
            </div>

            <div className="flex items-center justify-center gap-2 text-xs sm:text-sm font-semibold text-slate-700 bg-[#ECFDF5] py-2.5 px-3 rounded-lg border border-emerald-100 shadow-2xs">
              <ShieldCheck className="w-4 h-4 text-emerald-800 shrink-0" />
              <span>Verified Drivers</span>
            </div>

            <div className="flex items-center justify-center gap-2 text-xs sm:text-sm font-semibold text-slate-700 bg-[#ECFDF5] py-2.5 px-3 rounded-lg border border-emerald-100 shadow-2xs">
              <Car className="w-4 h-4 text-emerald-800 shrink-0" />
              <span>Doorstep Pickup</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
