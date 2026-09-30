import React from 'react';
import {
  CheckCircle2,
  ShieldCheck,
  Award,
  Users,
  Clock,
  Car,
  Headphones,
  Star,
  Sparkles,
} from 'lucide-react';
import { AnimatedCounter } from './AnimatedCounter';

interface WhyChooseUsProps {
  onOpenPartnerDrawer?: () => void;
}

export const WhyChooseUs: React.FC<WhyChooseUsProps> = () => {
  const highlights = [
    {
      title: 'Easy Instant Booking',
      tag: 'Zero Hassle',
      description: 'Streamlined online form allowing quick service type selection, instant transparent fare estimates, and booking confirmation.',
      icon: <CheckCircle2 className="w-5 h-5" />,
    },
    {
      title: 'Verified Chauffeurs',
      tag: 'Hill & Ghat Experts',
      description: 'Courteous, verified drivers specialized in hill driving across Ooty, Coorg, and Wayanad ghat roads with maximum passenger safety.',
      icon: <ShieldCheck className="w-5 h-5" />,
    },
    {
      title: 'Pristine Sanitized Fleet',
      tag: 'Comfort First',
      description: 'Clean, well-maintained sedans, SUVs, and luxury coaches featuring powerful AC, plush seating, and generous luggage capacity.',
      icon: <Car className="w-5 h-5" />,
    },
    {
      title: 'Transparent Flat Pricing',
      tag: 'No Hidden Extras',
      description: 'Clear fare calculation breakdown with no surprise hidden fees, arbitrary peak charges, or unexpected end-of-trip extras.',
      icon: <Award className="w-5 h-5" />,
    },
    {
      title: 'Zero Surge Guarantee',
      tag: '100% Price Lock',
      description: 'Never pay 1.5x or 2x peak surge rates during rush hours, weekends, or monsoon rains. Book with confidence 24/7.',
      icon: <Sparkles className="w-5 h-5" />,
    },
    {
      title: 'Versatile Travel Modes',
      tag: 'Custom Itineraries',
      description: 'Customizable options tailored for hourly local city packages, one-way highway drops, and multi-day roundtrips.',
      icon: <Clock className="w-5 h-5" />,
    },
    {
      title: 'On-Time Flight Guarantee',
      tag: 'Punctual Dispatch',
      description: 'Dependable scheduling and proactive flight tracking coordination to ensure you never miss a flight or train connection.',
      icon: <Users className="w-5 h-5" />,
    },
    {
      title: '24/7 Live Support Desk',
      tag: 'Instant Assistance',
      description: '24/7 human dispatch assistance via phone and WhatsApp for immediate quotes, route changes, or emergency driver assistance.',
      icon: <Headphones className="w-5 h-5" />,
    },
  ];

  return (
    <section
      id="about"
      className="py-16 md:py-24 text-white relative overflow-hidden scroll-mt-20"
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
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-700/80 text-xs font-semibold text-emerald-200 mb-3 shadow-2xs">
            <div className="flex items-center text-amber-400">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-3 h-3 fill-amber-400 text-amber-400" />
              ))}
            </div>
            <span className="font-extrabold text-white">4.9/5 Rating</span>
            <span className="text-emerald-500">·</span>
            <span>
              <AnimatedCounter target={1420} suffix="+" className="font-bold text-emerald-300" /> Verified Rider Reviews
            </span>
          </div>
          <br className="hidden sm:inline" />
          <span className="text-xs font-bold uppercase tracking-widest text-emerald-300 bg-emerald-900/80 px-3 py-1 rounded-full border border-emerald-800 inline-block mt-1">
            Why TRAVEL JUST
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mt-3">
            Superb Features for Complete Peace of Mind
          </h2>
          <p className="text-base sm:text-lg text-emerald-100/80 mt-2">
            Every feature of our service is tailored around premium vehicle quality, chauffeur safety, and transparent pricing.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {highlights.map((item) => (
            <div
              key={item.title}
              className="group bg-emerald-900/50 hover:bg-emerald-900/80 backdrop-blur-xs p-6 rounded-2xl border border-emerald-800/80 hover:border-emerald-500 transition-all duration-300 shadow-sm hover:shadow-emerald-950/50 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-emerald-800 group-hover:bg-emerald-700 text-emerald-300 group-hover:text-emerald-100 flex items-center justify-center transition-colors">
                    {item.icon}
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-700/60 text-emerald-300">
                    {item.tag}
                  </span>
                </div>
                <h3 className="font-bold text-base sm:text-lg text-white mb-2 group-hover:text-emerald-200 transition-colors">
                  {item.title}
                </h3>
                <p className="text-xs sm:text-sm text-emerald-100/70 leading-relaxed">
                  {item.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
