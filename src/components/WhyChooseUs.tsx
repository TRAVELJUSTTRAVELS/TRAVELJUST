import React from 'react';
import {
  CheckCircle2,
  ShieldCheck,
  Award,
  Users,
  Clock,
  Car,
  Headphones,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';

interface WhyChooseUsProps {
  onOpenPartnerDrawer?: () => void;
}

export const WhyChooseUs: React.FC<WhyChooseUsProps> = ({ onOpenPartnerDrawer }) => {
  const highlights = [
    {
      title: 'Easy Booking',
      description: 'Streamlined online form allowing quick service type selection, instant fare estimates, and request confirmation.',
      icon: <CheckCircle2 className="w-5 h-5" />,
    },
    {
      title: 'Professional Drivers',
      description: 'Courteous, experienced drivers oriented toward punctuality, passenger safety, and smooth navigation.',
      icon: <ShieldCheck className="w-5 h-5" />,
    },
    {
      title: 'Comfortable Vehicles',
      description: 'Clean, well-maintained fleet featuring air conditioning, plush interiors, and ample luggage space.',
      icon: <Car className="w-5 h-5" />,
    },
    {
      title: 'Transparent Pricing',
      description: 'Clear fare calculation breakdown with no surprise hidden charges or unexpected end-of-trip extras.',
      icon: <Award className="w-5 h-5" />,
    },
    {
      title: 'Flexible Travel Options',
      description: 'Versatile options tailored for hourly local rentals, single-way drops, and multi-day roundtrips.',
      icon: <Clock className="w-5 h-5" />,
    },
    {
      title: 'Reliable Service',
      description: 'Dependable scheduling and proactive coordination to keep your travel itinerary on track.',
      icon: <Users className="w-5 h-5" />,
    },
    {
      title: 'Quick Customer Support',
      description: '24/7 assistance via phone and WhatsApp for booking changes, special inquiries, or immediate help.',
      icon: <Headphones className="w-5 h-5" />,
    },
  ];

  return (
    <section className="py-16 md:py-24 bg-emerald-950 text-white relative overflow-hidden">
      {/* Decorative background grid pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:3rem_3rem] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs font-bold uppercase tracking-widest text-emerald-300 bg-emerald-900/80 px-3 py-1 rounded-full border border-emerald-800">
            Why TRAVEL JUST
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mt-3">
            Designed for Peace of Mind
          </h2>
          <p className="text-base sm:text-lg text-emerald-100/80 mt-2">
            Every feature of our service is tailored around convenience, vehicle quality, and straightforward passenger care.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {highlights.map((item) => (
            <div
              key={item.title}
              className="bg-emerald-900/50 backdrop-blur-xs p-6 rounded-2xl border border-emerald-800/80 hover:border-emerald-600 transition-colors"
            >
              <div className="w-10 h-10 rounded-xl bg-emerald-800 text-emerald-300 flex items-center justify-center mb-4">
                {item.icon}
              </div>
              <h3 className="font-bold text-lg text-white mb-2">{item.title}</h3>
              <p className="text-xs sm:text-sm text-emerald-100/70 leading-relaxed">
                {item.description}
              </p>
            </div>
          ))}
        </div>

        {/* Fleet Expansion & Driver Partner Callout */}
        {onOpenPartnerDrawer && (
          <div className="mt-12 bg-gradient-to-r from-emerald-900/90 via-slate-900 to-emerald-900/90 border border-emerald-500/40 rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl relative overflow-hidden">
            <div className="space-y-2 text-center md:text-left z-10">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#0ef10e]/15 border border-[#0ef10e]/40 text-[#0ef10e] text-xs font-black uppercase tracking-wider">
                <Car className="w-3.5 h-3.5" />
                <span>Fleet Expansion Across Karnataka</span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                Own a Commercial Cab? Partner with TRAVEL JUST
              </h3>
              <p className="text-sm text-emerald-100/80 max-w-2xl leading-relaxed">
                Attach your Sedan, Ertiga, Innova Crysta, or Tempo Traveller for regular Mysore ⇄ Bangalore Expressway trips, airport transfers, and outstation tours. Zero signup fees and transparent payouts.
              </p>
            </div>

            <div className="shrink-0 z-10">
              <button
                type="button"
                onClick={onOpenPartnerDrawer}
                className="bg-[#0ef10e] hover:bg-[#0cd30c] text-slate-950 font-black text-sm px-6 py-3.5 rounded-2xl shadow-lg shadow-[#0ef10e]/20 flex items-center gap-2.5 transition-all transform hover:scale-[1.03] active:scale-[0.98] cursor-pointer"
              >
                <Car className="w-4 h-4 text-slate-950 stroke-[2.5]" />
                <span>Attach Your Cab / Partner With Us</span>
                <ArrowRight className="w-4 h-4 stroke-[2.5]" />
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
