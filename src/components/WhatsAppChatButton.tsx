import React from 'react';
import { BookingSearchState, Vehicle, PricingConfig } from '../types';
import { defaultPricingConfig } from '../config/siteConfig';
import { WhatsAppFloatingEnquiryButton } from './WhatsAppFloatingEnquiryButton';

export interface WhatsAppChatButtonProps {
  searchState?: BookingSearchState | null;
  selectedVehicle?: Vehicle | null;
  pricingConfig?: PricingConfig;
  onEditBooking?: () => void;
  onSelectVehicle?: (vehicle: Vehicle) => void;
}

/**
 * Intelligent Booking-to-WhatsApp Floating Enquiry Button for TRAVEL JUST
 */
export const WhatsAppChatButton: React.FC<WhatsAppChatButtonProps> = ({
  searchState = null,
  selectedVehicle = null,
  pricingConfig = defaultPricingConfig,
  onEditBooking,
  onSelectVehicle,
}) => {
  return (
    <WhatsAppFloatingEnquiryButton
      searchState={searchState}
      selectedVehicle={selectedVehicle}
      pricingConfig={pricingConfig}
      onEditBooking={onEditBooking}
      onSelectVehicle={onSelectVehicle}
    />
  );
};

export { WhatsAppFloatingEnquiryButton };
