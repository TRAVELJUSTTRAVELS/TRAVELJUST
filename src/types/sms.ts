import { BookingSearchState, Vehicle, PassengerDetails, FareEstimate, BookingRequest } from './index';

export type SmsProvider = 'fast2sms' | 'msg91' | 'twilio' | 'custom_webhook' | 'simulated';

export interface SmsGatewayConfig {
  provider: SmsProvider;
  isConfigured: boolean;
  isLive?: boolean;
  senderId: string;
  dltTemplateId?: string;
  hasApiKey: boolean;
  statusMessage: string;
}

export interface SmsDispatchRecord {
  id: string;
  bookingRef: string;
  recipientPhone: string;
  recipientName: string;
  messageText: string;
  characterCount: number;
  partsCount: number;
  provider: SmsProvider;
  status: 'sent' | 'delivered' | 'simulated' | 'failed';
  timestamp: string;
  gatewayMessageId?: string;
  errorMessage?: string;
}

export interface SendSmsConfirmationPayload {
  bookingRef: string;
  passengerDetails: PassengerDetails;
  searchDetails: BookingSearchState;
  selectedVehicle: Vehicle;
  estimatedFare: FareEstimate;
  customPhone?: string;
}

export interface SmsApiResponse {
  success: boolean;
  status: 'sent' | 'delivered' | 'simulated' | 'failed';
  record: SmsDispatchRecord;
  message: string;
  provider: SmsProvider;
  warning?: string;
  error?: string;
}
