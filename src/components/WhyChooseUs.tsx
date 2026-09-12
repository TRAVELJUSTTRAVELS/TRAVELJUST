import React from 'react';
import {
  CheckCircle2,
  ShieldCheck,
  Award,
  Users,
  Clock,
  Car,
  Headphones,
} from 'lucide-react';

interface WhyChooseUsProps {
  onOpenPartnerDrawer?: () => void;
}

export const WhyChooseUs: React.FC<WhyChooseUsProps> = () => {
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
    <section
      id="why-choose-us-section"
      className="py-16 md:py-24 text-white relative overflow-hidden"
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
      </div>
    </section>
  );
};
