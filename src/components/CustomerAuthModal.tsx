import React from 'react';
import { CustomerUser } from '../types';

export interface CustomerAuthModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  onSuccess?: (customer: CustomerUser) => void;
}

export const CustomerAuthModal: React.FC<CustomerAuthModalProps> = () => {
  return null;
};
