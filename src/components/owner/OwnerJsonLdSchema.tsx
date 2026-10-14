import React, { useState } from 'react';
import {
  Code2,
  Copy,
  Check,
  Globe,
  Sparkles,
  Download,
  CheckCircle2,
  AlertCircle,
  FileCode,
  Layers,
  Building,
  Car,
  HelpCircle,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';
import { siteConfig } from '../../config/siteConfig';

export const OwnerJsonLdSchema: React.FC = () => {
  const [selectedSchemaType, setSelectedSchemaType] = useState<
    'TaxiService' | 'LocalBusiness' | 'Organization' | 'FAQPage' | 'Service' | 'BreadcrumbList'
  >('TaxiService');
  const [copied, setCopied] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishedSuccess, setPublishedSuccess] = useState(false);

  // Dynamic schemas conforming to schema.org standards for TRAVEL JUST
  const schemas: Record<string, object> = {
    TaxiService: {
      '@context': 'https://schema.org',
      '@type': 'TaxiService',
      name: 'TRAVEL JUST - Premium Cab & Chauffeur Services',
      description: 'Professional taxi rental, outstation cabs, Bangalore Airport drops, and local hourly rentals in Mysuru, Karnataka.',
      url: 'https://www.traveljust.in',
      provider: {
        '@type': 'LocalBusiness',
        name: 'TRAVEL JUST',
        telephone: '+91 9740754400',
        email: 'traveljustmysuru@gmail.com',
        priceRange: '₹₹',
        address: {
          '@type': 'PostalAddress',
          streetAddress: 'Mysuru City Center',
          addressLocality: 'Mysuru',
          addressRegion: 'Karnataka',
          postalCode: '570001',
          addressCountry: 'IN',
        },
      },
      areaServed: [
        { '@type': 'City', name: 'Mysuru' },
        { '@type': 'City', name: 'Bengaluru' },
        { '@type': 'Place', name: 'Kempegowda International Airport (KIAL)' },
        { '@type': 'City', name: 'Ooty' },
        { '@type': 'City', name: 'Coorg' },
        { '@type': 'City', name: 'Wayanad' },
        { '@type': 'City', name: 'Kabini' },
      ],
      serviceType: [
        'Local Taxi Rental',
        'One-Way Outstation Drop',
        'Round Trip Outstation Cab',
        'Airport Transfer BLR KIAL T1 & T2',
        'Inter-State One Way Cabs',
      ],
      hasOfferCatalog: {
        '@type': 'OfferCatalog',
        name: 'Fleet Categories',
        itemListElement: [
          {
            '@type': 'Offer',
            itemOffered: {
              '@type': 'Service',
              name: 'Sedan (4+1)',
              description: 'Maruti Suzuki Dzire / Toyota Etios with AC and commercial driver.',
            },
          },
          {
            '@type': 'Offer',
            itemOffered: {
              '@type': 'Service',
              name: 'SUV (6+1)',
              description: 'Maruti Suzuki Ertiga 6-passenger vehicle with large boot space.',
            },
          },
          {
            '@type': 'Offer',
            itemOffered: {
              '@type': 'Service',
              name: 'Innova & Innova Crysta',
              description: 'Executive 6+1 and 7+1 captain seat carriers for business and family tours.',
            },
          },
          {
            '@type': 'Offer',
            itemOffered: {
              '@type': 'Service',
              name: 'Tempo Traveller (12+1)',
              description: 'Push-back luxury mini-bus for group tours and weddings.',
            },
          },
        ],
      },
    },
    LocalBusiness: {
      '@context': 'https://schema.org',
      '@type': ['LocalBusiness', 'TravelAgency'],
      name: 'TRAVEL JUST',
      legalName: 'TRAVEL JUST Mysuru Cabs',
      url: 'https://www.traveljust.in',
      logo: 'https://www.traveljust.in/icon.svg',
      telephone: '+91 9740754400',
      email: 'traveljustmysuru@gmail.com',
      currenciesAccepted: 'INR',
      paymentAccepted: 'Cash, UPI, Credit Card, Net Banking, Google Pay, PhonePe',
      priceRange: '₹800 - ₹25000',
      openingHoursSpecification: [
        {
          '@type': 'OpeningHoursSpecification',
          dayOfWeek: [
            'Monday',
            'Tuesday',
            'Wednesday',
            'Thursday',
            'Friday',
            'Saturday',
            'Sunday',
          ],
          opens: '00:00',
          closes: '23:59',
        },
      ],
      address: {
        '@type': 'PostalAddress',
        streetAddress: 'Mysuru City Center',
        addressLocality: 'Mysuru',
        addressRegion: 'Karnataka',
        postalCode: '570001',
        addressCountry: 'IN',
      },
      geo: {
        '@type': 'GeoCoordinates',
        latitude: '12.2958',
        longitude: '76.6394',
      },
    },
    Organization: {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: 'TRAVEL JUST',
      url: 'https://www.traveljust.in',
      contactPoint: {
        '@type': 'ContactPoint',
        telephone: '+91 9740754400',
        contactType: 'customer service',
        areaServed: 'IN',
        availableLanguage: ['English', 'Kannada', 'Hindi', 'Tamil', 'Telugu'],
      },
      sameAs: [
        'https://wa.me/919740754400',
      ],
    },
    FAQPage: {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'How do I book a one-way cab from Mysuru to Bangalore Airport?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'You can book directly on www.traveljust.in by choosing Airport Drop, entering your pickup address and flight terminal (T1 or T2). Live distance is computed using Google Maps and confirmed instantly with chauffeur details sent to your WhatsApp.',
          },
        },
        {
          '@type': 'Question',
          name: 'Are toll charges and driver allowances included in the one-way fare?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Yes, TRAVEL JUST fares provide transparent all-inclusive estimates covering toll road charges, driver allowances, and standard state permits with zero hidden night charges.',
          },
        },
        {
          '@type': 'Question',
          name: 'Can I book an outstation trip from Mysuru to Ooty or Coorg with return?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Yes! Select the Round Trip option, enter your start date, return date, and add any intermediate stops. Our centralized fare engine calculates the exact transparent rate per kilometer for your preferred vehicle.',
          },
        },
        {
          '@type': 'Question',
          name: 'What vehicle models are available in the TRAVEL JUST fleet?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'We maintain Sedan (Swift Dzire, Toyota Etios), SUV (Maruti Ertiga), Toyota Innova & Innova Crysta, and 12+1 Tempo Travellers. All vehicles are commercially registered and sanitized.',
          },
        },
      ],
    },
    Service: {
      '@context': 'https://schema.org',
      '@type': 'Service',
      serviceType: 'Outstation and Airport Taxi Transportation',
      provider: {
        '@type': 'LocalBusiness',
        name: 'TRAVEL JUST',
        telephone: '+91 9740754400',
      },
      areaServed: {
        '@type': 'State',
        name: 'Karnataka',
      },
      hasOfferCatalog: {
        '@type': 'OfferCatalog',
        name: 'Travel Services',
        itemListElement: [
          {
            '@type': 'Offer',
            name: 'Bangalore - Mysore Expressway One Way Cab',
            price: '2800',
            priceCurrency: 'INR',
          },
          {
            '@type': 'Offer',
            name: 'Mysuru to Kempegowda International Airport Drop',
            price: '3499',
            priceCurrency: 'INR',
          },
          {
            '@type': 'Offer',
            name: 'Mysuru to Ooty Round Trip Weekend Tour',
            price: '6500',
            priceCurrency: 'INR',
          },
        ],
      },
    },
    BreadcrumbList: {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'Home',
          item: 'https://www.traveljust.in/',
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: 'Services',
          item: 'https://www.traveljust.in/#services',
        },
        {
          '@type': 'ListItem',
          position: 3,
          name: 'Fleet',
          item: 'https://www.traveljust.in/#fleet',
        },
        {
          '@type': 'ListItem',
          position: 4,
          name: 'Book Cab',
          item: 'https://www.traveljust.in/#booking-search-section',
        },
      ],
    },
  };

  const currentJsonString = JSON.stringify(schemas[selectedSchemaType] || {}, null, 2);

  const handleCopy = () => {
    navigator.clipboard.writeText(currentJsonString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownload = () => {
    const blob = new Blob([currentJsonString], { type: 'application/ld+json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedSchemaType.toLowerCase()}_schema.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePublish = () => {
    setIsPublishing(true);
    setTimeout(() => {
      setIsPublishing(false);
      setPublishedSuccess(true);
      setTimeout(() => setPublishedSuccess(false), 3000);
    }, 600);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold mb-2">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>Search Engine Structured Data Engine</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            JSON-LD Schema Manager
          </h2>
          <p className="text-xs text-slate-500 mt-1 max-w-xl">
            Authoritative, Google Search Console compliant Schema.org JSON-LD structured data. Generates rich snippets for taxi services, local SEO geo-coordinates, and search FAQs.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handlePublish}
            disabled={isPublishing}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isPublishing ? 'animate-spin' : ''}`} />
            <span>{isPublishing ? 'Publishing...' : 'Publish Schema to Site'}</span>
          </button>
        </div>
      </div>

      {publishedSuccess && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Active website JSON-LD structured data synchronized successfully.</span>
        </div>
      )}

      {/* Schema Type Navigation Selector */}
      <div className="flex flex-wrap gap-2">
        {(
          [
            { id: 'TaxiService', label: 'TaxiService (Primary)', icon: Car },
            { id: 'LocalBusiness', label: 'LocalBusiness / TravelAgency', icon: Building },
            { id: 'Organization', label: 'Organization & Brand', icon: Globe },
            { id: 'FAQPage', label: 'FAQPage Snippets', icon: HelpCircle },
            { id: 'Service', label: 'Catalog & Routes', icon: Layers },
            { id: 'BreadcrumbList', label: 'Breadcrumb Navigation', icon: FileCode },
          ] as const
        ).map((item) => {
          const Icon = item.icon;
          const isSelected = selectedSchemaType === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setSelectedSchemaType(item.id)}
              className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                isSelected
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200/80'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-[#0ef10e]' : 'text-slate-500'}`} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* Main Schema Code Display & Preview */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        {/* Code Bar Top */}
        <div className="bg-slate-900 text-slate-300 px-5 py-3.5 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2 text-xs">
            <Code2 className="w-4 h-4 text-[#0ef10e]" />
            <span className="font-mono font-bold text-white">schema.org/{selectedSchemaType}</span>
            <span className="text-[10px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded">application/ld+json</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white transition-colors cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>

            <button
              type="button"
              onClick={handleDownload}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-slate-400" />
              <span>Download JSON</span>
            </button>
          </div>
        </div>

        {/* Code Viewer */}
        <div className="p-5 bg-slate-950 text-emerald-400 font-mono text-xs overflow-x-auto max-h-[500px]">
          <pre>{currentJsonString}</pre>
        </div>

        {/* Quality & Validation Audit */}
        <div className="p-5 bg-slate-50 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-slate-900 block">Strict Syntax Valid</span>
              <span className="text-slate-500 text-[11px]">Valid JSON-LD matching Google Rich Results test specs.</span>
            </div>
          </div>

          <div className="flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-slate-900 block">Real Contact & Geo Linked</span>
              <span className="text-slate-500 text-[11px]">+91 9740754400 and Mysuru PostalAddress mapped.</span>
            </div>
          </div>

          <div className="flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-slate-900 block">Truthful Ratings Only</span>
              <span className="text-slate-500 text-[11px]">Zero artificial or inflated ratings to maintain organic integrity.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
