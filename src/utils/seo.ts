import { siteConfig } from '../config/siteConfig';
import { faqsData } from '../data/faqs';
import { POPULAR_ROUTE_PAGES } from '../data/popularRoutesData';

export function generateSchemaMarkup() {
  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'TaxiService',
    name: siteConfig.businessName,
    alternateName: ['TRAVEL JUST Taxi Service Mysore', 'Travel Agency in Mysore - TRAVEL JUST'],
    url: siteConfig.siteUrl,
    logo: `${siteConfig.siteUrl}/logo.png`,
    description:
      'Premier travel agency and taxi booking service in Mysore offering one way taxi, round trip cabs, airport transfer to Bengaluru KIAL Airport, Coorg, Ooty, and Wayanad.',
    telephone: siteConfig.contact.phone,
    email: siteConfig.contact.email,
    priceRange: '₹₹',
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
    areaServed: [
      { '@type': 'City', name: 'Mysuru' },
      { '@type': 'City', name: 'Bengaluru' },
      { '@type': 'City', name: 'Madikeri' },
      { '@type': 'City', name: 'Ooty' },
      { '@type': 'City', name: 'Wayanad' },
      { '@type': 'City', name: 'Mandya' },
    ],
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
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'Customer Support & Dispatch',
      telephone: siteConfig.contact.phone,
      email: siteConfig.contact.email,
      availableLanguage: ['English', 'Kannada', 'Hindi', 'Tamil', 'Malayalam'],
    },
  };

  const websiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'TRAVEL JUST - Travel Agency & Taxi Booking in Mysore',
    url: siteConfig.siteUrl,
    description:
      'Book online taxi in Mysore for Bengaluru, Coorg, Ooty, Wayanad, and Kempegowda Airport. Instant quotes, verified drivers & transparent fares.',
    potentialAction: {
      '@type': 'SearchAction',
      target: `${siteConfig.siteUrl}/?search={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  };

  const servicesSchema = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    serviceType: 'Outstation Taxi, Local Cab & Airport Transfer Service',
    provider: {
      '@type': 'TaxiService',
      name: siteConfig.businessName,
    },
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: 'Mysore Cab Booking & Tour Packages',
      itemListElement: [
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: 'Mysore to Bengaluru Taxi & Cab Booking',
            description: 'One way and round trip cab service via 10-Lane Expressway.',
          },
        },
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: 'Mysore to Coorg Taxi & Sightseeing Tour Package',
            description: 'Madikeri, Kushalnagar, Golden Temple and coffee plantation taxi.',
          },
        },
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: 'Mysore to Ooty Taxi & Nilgiris Tour Package',
            description: 'Bandipur forest corridor and 36 hairpin bends with expert ghat drivers.',
          },
        },
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: 'Mysore to Wayanad Taxi & Kerala Holiday Cab',
            description: 'Muthanga forest, Sultan Bathery, Edakkal caves, and Banasura dam tour.',
          },
        },
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: 'Mysore to Bengaluru Airport Taxi (Kempegowda BLR / KIAL T1 & T2)',
            description: '24/7 punctual airport pickup and drop with flight tracking.',
          },
        },
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: 'Local Taxi Booking Mysore (8hr/80km & Sightseeing)',
            description: 'Mysore Palace, Chamundi Hill, Brindavan Gardens local sightseeing cabs.',
          },
        },
      ],
    },
  };

  // Aggregate all FAQs from generic and route-specific lists
  const allFaqItems = [
    ...faqsData.map((f) => ({ question: f.question, answer: f.answer })),
    ...POPULAR_ROUTE_PAGES.flatMap((route) => route.faqs),
  ];

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: allFaqItems.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };

  return [organizationSchema, websiteSchema, servicesSchema, faqSchema];
}
