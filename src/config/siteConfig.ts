import { SiteConfig, PricingConfig } from '../types';

export const siteConfig: SiteConfig = {
  businessName: 'TRAVEL JUST',
  tagline: 'JUST BOOK * JUST TRAVEL',
  description: 'Reliable rides for local travel, one-way drops, round trips, and airport transfers.',
  siteUrl: 'https://www.traveljust.in',
  contact: {
    phone: '+91 9740754400',
    whatsapp: '+91 9740754400',
    email: 'traveljustmysuru@gmail.com',
    businessHours: '24/7 Customer Support & Service',
  },
  socialProfiles: [
    { platform: 'Website', url: 'https://www.traveljust.in' },
    { platform: 'WhatsApp', url: 'https://wa.me/919740754400' },
    { platform: 'Customer Care', url: 'tel:+919740754400' },
  ],
};

export { pricingConfig, defaultPricingConfig, calculateEstimatedFare, FARE_DISCLAIMER } from './pricingConfig';

