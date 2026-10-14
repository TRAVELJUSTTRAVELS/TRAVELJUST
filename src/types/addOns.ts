import { ServiceType } from './index';

export type AddOnCategory =
  | 'child_seat'
  | 'luggage'
  | 'vehicle_requirement'
  | 'comfort_amenity'
  | 'chauffeur_preference';

export type AddOnPricingType = 'per_trip' | 'per_day' | 'free';

export interface DynamicAddOnOption {
  id: string;
  name: string;
  shortLabel: string;
  category: AddOnCategory;
  description: string;
  price: number; // in INR (0 for free/complimentary)
  pricingType: AddOnPricingType;
  applicableServices: (ServiceType | 'all')[];
  applicableVehicles?: string[]; // 'all' or specific vehicle IDs
  maxQuantity: number;
  enabled: boolean;
  isPopular?: boolean;
  iconName?: 'baby' | 'luggage' | 'shield' | 'car' | 'sparkles' | 'users' | 'heart' | 'wheelchair' | 'coffee';
  badge?: string;
  sortOrder?: number;
  updatedAt?: string;
}

export interface SelectedAddOn {
  addOnId: string;
  name: string;
  shortLabel?: string;
  category: AddOnCategory;
  quantity: number;
  unitPrice: number;
  pricingType: AddOnPricingType;
  totalPrice: number;
}
