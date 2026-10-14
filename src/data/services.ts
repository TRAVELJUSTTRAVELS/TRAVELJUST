import { ServiceType } from '../types';

export interface ServiceDetail {
  type: ServiceType;
  title: string;
  buttonText?: string;
  badge: string;
  shortDescription: string;
  fullDescription: string;
  keyBenefits: string[];
  iconName: string;
  idealFor: string;
  packageTiers: string[];
  inclusions: string[];
  guidelines: string[];
  starterRateText: string;
}

export const servicesData: ServiceDetail[] = [
  {
    type: 'local',
    title: 'Local Travel',
    buttonText: 'Book Local Travel',
    badge: 'Hourly Packages',
    shortDescription: 'Convenient transportation for local travel, hourly rentals, and urban errands.',
    fullDescription: 'Flexible hourly packages designed for local transport requirements. Keep the vehicle and verified chauffeur at your disposal without worrying about multiple bookings, parking headaches, or surge pricing in peak hours.',
    keyBenefits: [
      'Hourly package options (4h/40km, 8h/80km, 12h/120km)',
      'Multiple stops permitted during active package',
      'Dedicated driver for the entire duration',
      'Parking & Toll charges extra',
    ],
    iconName: 'Clock',
    idealFor: 'Full-day errands, consecutive business meetings, hospital visits, or city sightseeing & shopping tours.',
    packageTiers: [
      'Half Day: 4 Hours / 40 km',
      'Standard: 8 Hours / 80 km',
      'Full Day: 12 Hours / 120 km',
    ],
    inclusions: [
      'Dedicated clean air-conditioned cab',
      'Professional chauffeur allowance included',
      'Unlimited stops within allocated hours & kms',
      'Live customer dispatch assistance',
    ],
    guidelines: [
      'Parking & municipal toll fees payable on actuals',
      'Extra km & extra hours billed transparently at base tariff',
      'Cab AC remains functional during stationary waiting',
    ],
    starterRateText: 'From ₹1,299',
  },
  {
    type: 'oneway',
    title: 'One Way Drop',
    buttonText: 'Book One Way',
    badge: 'Point-to-Point',
    shortDescription: 'Simple point-to-point transportation with flexible pickup scheduling.',
    fullDescription: 'Direct point-to-point ride service where you only pay for the one-way distance travelled. Say goodbye to paying return fares for single-direction journeys like Mysuru to Bengaluru, Kodagu, or Hassan.',
    keyBenefits: [
      'Pay only for one-way distance travelled',
      'No Multiple pickups / drops',
      'Parking, Toll, State Tax extra, if applicable',
      'If your Trip has Hill climbs, cab AC switched off.',
    ],
    iconName: 'ArrowRight',
    idealFor: 'Intercity relocations, airport drops, single-leg business travel, or weekend college & hometown visits.',
    packageTiers: [
      'Mysuru ⇄ Bengaluru Highway Express',
      'Mysuru ⇄ Coorg / Madikeri Hills',
      'Mysuru ⇄ Hassan / Mangaluru Corridor',
    ],
    inclusions: [
      'Clean commercial sedan or SUV of your choice',
      'Chauffeur fuel & one-way allowance',
      'Spacious boot luggage capacity',
      'Instant GST-compliant invoice download',
    ],
    guidelines: [
      'Expressway toll, state boundary permit & parking on actuals',
      'Point-to-point drop (single destination drop-off point)',
      'On steep ghat hill climbs, cab AC is temporarily switched off for engine safety',
    ],
    starterRateText: 'From ₹1,899',
  },
  {
    type: 'roundtrip',
    title: 'Round Trip',
    buttonText: 'Book Round Trip',
    badge: 'Outstation Return',
    shortDescription: 'Comfortable travel with planned departure and return journeys.',
    fullDescription: 'Complete return trip service where your assigned vehicle and experienced chauffeur remain dedicated exclusively to your group for the duration of the journey. Perfect for multi-day vacations, temple tours, and family holidays.',
    keyBenefits: [
      'Parking, Toll, State Tax extra, if applicable',
      'Custom departure and return timing',
      'For driving between 9:30 PM to 06:00 AM on any of the nights, additional charges will be applicable',
      'If your Trip has Hill climbs, cab AC switched off.',
    ],
    iconName: 'Repeat',
    idealFor: 'Weekend family getaways, temple pilgrimage circuits, hill-station holidays, and corporate outstation tours.',
    packageTiers: [
      'Same-Day Return (e.g., Srirangapatna, Somnathpur)',
      'Weekend Getaway (2 Days / 1 Night Coorg / Ooty / Wayanad)',
      'Extended Holiday (3 to 7 Days South India Circuit)',
    ],
    inclusions: [
      'Chauffeur onboard for daily sightseeing',
      'Sanitized AC vehicle with sanitized seats & clean interiors',
      'Flexible departure halts as requested',
      'Luggage carrier availability for group bags',
    ],
    guidelines: [
      'Toll, state taxes & parking charges on actuals',
      'Night driving allowance applies between 9:30 PM and 6:00 AM',
      'On steep hill-station climbs, cab AC switched off temporarily for vehicle safety',
    ],
    starterRateText: 'From ₹12.50 / km',
  },
  {
    type: 'airport',
    title: 'Airport Transfer',
    buttonText: 'Book Airport',
    badge: 'Airport Cabs',
    shortDescription: 'Reliable airport pickup and drop-off coordination with terminal guidance.',
    fullDescription: 'Punctual, stress-free transfers to and from airport terminals (Kempegowda International Airport Bengaluru BLR & Mysore Domestic Airport MYQ). Features real-time flight monitoring and driver meet-and-greet support.',
    keyBenefits: [
      'Coordinated pickup & terminal drop-off options',
      'Driver waiting assistance for flight arrivals',
      'The Airport entry charges, Toll, Parking. will be charged extra',
      'Flat-rate predictable pricing with zero hidden surcharges',
    ],
    iconName: 'Plane',
    idealFor: 'Early morning flights, international terminal arrivals, corporate delegates, and family airport drops.',
    packageTiers: [
      'Mysuru City ⇄ Bengaluru Airport (BLR T1 / T2)',
      'Mysuru City ⇄ Mysore Mandakalli Airport (MYQ)',
      'Door-to-Gate Direct Luggage Transfer',
    ],
    inclusions: [
      'Flight arrival time monitoring by dispatch team',
      'Driver contact details dispatched 2 hours prior',
      'Spacious boot space for international luggage check-ins',
      'Express corridor highway routing',
    ],
    guidelines: [
      'Airport parking, terminal pickup entry & toll charges billed on actuals',
      'Complimentary 45-minute waiting after confirmed flight touchdown',
      'Clean bottled water on request for airport journeys',
    ],
    starterRateText: 'From ₹2,499',
  },
];
