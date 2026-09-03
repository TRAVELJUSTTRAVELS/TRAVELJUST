import React from 'react';
import { Compass, ShieldCheck, HeartHandshake, Car } from 'lucide-react';
import { siteConfig } from '../config/siteConfig';

export const AboutSection: React.FC = () => {
  return (
    <section id="about" className="py-16 md:py-24 bg-white relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left Text Box */}
          <div className="space-y-6">
            <span className="text-xs font-bold uppercase tracking-widest text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
              About TRAVEL JUST
            </span>

            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
              A Dedicated Partner in Modern Travel & Mobility
            </h2>

            <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
              At <strong className="text-slate-900">{siteConfig.businessName}</strong>, we believe every trip should begin with confidence and comfort. Built as a customer-centric transportation platform, we provide reliable rides across local travel, one-way drops, and round trips without complicated procedures or hidden costs.
            </p>

            <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
              Whether you need an executive sedan for corporate meetings, a comfortable SUV for family journeys, or a multi-seater vehicle for group travel, our focus remains steadfast: punctual pickup, immaculate vehicles, verified drivers, and transparent pricing.
            </p>

            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-800">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">Verified Drivers</h4>
                  <p className="text-xs text-slate-500">Safe & courteous</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-800">
                  <HeartHandshake className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">Transparent Fares</h4>
                  <p className="text-xs text-slate-500">Upfront estimates</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Vector Feature Box (No Photographs) */}
          <div className="bg-gradient-to-br from-emerald-900 to-emerald-950 text-white rounded-3xl p-8 sm:p-10 shadow-xl relative overflow-hidden space-y-6">
            <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-emerald-300">
              <Compass className="w-7 h-7" />
            </div>

            <h3 className="text-2xl font-bold">Our Core Commitments</h3>

            <ul className="space-y-4 text-xs sm:text-sm text-emerald-100/90">
              <li className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-emerald-800 text-emerald-300 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                  ✓
                </div>
                <span>
                  <strong className="text-white block">Simple & Intuitive Booking</strong>
                  Quick form completion with dynamic fare estimation and instant reference ID.
                </span>
              </li>

              <li className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-emerald-800 text-emerald-300 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                  ✓
                </div>
                <span>
                  <strong className="text-white block">Clean & Hygienic Fleet</strong>
                  Every vehicle undergoes regular cleaning and safety inspection before dispatch.
                </span>
              </li>

              <li className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-emerald-800 text-emerald-300 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                  ✓
                </div>
                <span>
                  <strong className="text-white block">Dedicated Dispatch Support</strong>
                  Human support standing by 24/7 to answer questions, handle updates, or coordinate timing.
                </span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
};
