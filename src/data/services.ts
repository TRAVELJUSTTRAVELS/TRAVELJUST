import { ServiceType } from '../types';

export interface ServiceDetail {
  type: ServiceType;
  title: string;
  buttonText?: string;
  shortDescription: string;
  fullDescription: string;
  keyBenefits: string[];
  iconName: string;
  idealFor: string;
}

export const servicesData: ServiceDetail[] = [
  {
    type: 'local',
    title: 'Local Travel',
    buttonText: 'Book Local Travel',
    shortDescription: 'Convenient transportation for local travel, hourly rentals, and urban errands.',
    fullDescription: 'Flexible hourly packages designed for full-day or half-day local transport requirements. Keep the vehicle and driver at your disposal without worrying about re-booking or parking hassles.',
    keyBenefits: [
      'Hourly package options (4h/40km, 8h/80km, 12h/120km)',
      'Multiple stops permitted during active package',
      'Dedicated driver for the entire duration',
      'Parking & Toll charges extra',
    ],
    iconName: 'Clock',
    idealFor: 'Full-day errands, consecutive business meetings, or shopping tours.',
  },
  {
    type: 'oneway',
    title: 'One Way Drop',
    buttonText: 'Book One Way',
    shortDescription: 'Simple point-to-point transportation with flexible pickup scheduling.',
    fullDescription: 'Direct point-to-point ride service where you only pay for the single journey taken. Ideal for hassle-free transfers without return commitments.',
    keyBenefits: [
      'Pay only for one-way distance travelled',
      'No Multiple pickups / drops',
      'Parking, Toll, State Tax extra, if applicable',
      'If your Trip has Hill climbs, cab AC switched off.',
    ],
    iconName: 'ArrowRight',
    idealFor: 'Relocations, single-leg trips, or seamless point-to-point drop-offs.',
  },
  {
    type: 'roundtrip',
    title: 'Round Trip',
    shortDescription: 'Comfortable travel with planned departure and return journeys.',
    fullDescription: 'Complete return trip service where your assigned vehicle remains dedicated to your itinerary for the duration of the journey, ensuring consistent comfort and reliability.',
    keyBenefits: [
      'Parking, Toll, State Tax extra, if applicable',
      'Custom departure and return timing',
      'For driving between 9:30 PM to 06:00 AM on any of the nights, additional charges will be applicable',
      'If your Trip has Hill climbs, cab AC switched off.',
    ],
    iconName: 'Repeat',
    idealFor: 'Weekend family getaways, business day-trips, and return journeys.',
  },
  {
    type: 'airport',
    title: 'Airport Transfer',
    buttonText: 'Book Airport',
    shortDescription: 'Reliable airport pickup and drop-off coordination with terminal guidance.',
    fullDescription: 'Punctual, stress-free transfers to and from airport terminals. Features flight monitoring, driver meet-and-greet support, and luggage assistance.',
    keyBenefits: [
      'Coordinated pickup & terminal drop-off options',
      'Driver waiting assistance for flight arrivals',
      'The Airport entry charges, Toll, Parking. will be charged extra',
      'Flat-rate predictable pricing with zero hidden surcharges',
    ],
    iconName: 'Plane',
    idealFor: 'Early morning flights, international arrivals, and group terminal drops.',
  },
];
