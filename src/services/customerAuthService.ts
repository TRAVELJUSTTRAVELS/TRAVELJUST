import { CustomerUser, BookingRequest } from '../types';
import { notifyOwnerOnCustomerLogin } from '../utils/whatsapp';

const CUSTOMER_STORAGE_KEY = 'tj_customer_user';
const CUSTOMERS_LIST_KEY = 'tj_registered_customers';

export function getStoredCustomer(): CustomerUser | null {
  try {
    const data = localStorage.getItem(CUSTOMER_STORAGE_KEY);
    if (!data) return null;
    return JSON.parse(data);
  } catch (err) {
    console.warn('Error reading customer user session:', err);
    return null;
  }
}

export function saveCustomerSession(customer: CustomerUser): void {
  try {
    localStorage.setItem(CUSTOMER_STORAGE_KEY, JSON.stringify(customer));
    
    // Also save into customer registry
    const allCustomers: CustomerUser[] = JSON.parse(localStorage.getItem(CUSTOMERS_LIST_KEY) || '[]');
    const existingIndex = allCustomers.findIndex(
      (c) => c.mobileNumber.replace(/\D/g, '') === customer.mobileNumber.replace(/\D/g, '')
    );
    if (existingIndex >= 0) {
      allCustomers[existingIndex] = { ...allCustomers[existingIndex], ...customer };
    } else {
      allCustomers.push(customer);
    }
    localStorage.setItem(CUSTOMERS_LIST_KEY, JSON.stringify(allCustomers));
  } catch (err) {
    console.warn('Error saving customer session:', err);
  }
}

export function clearCustomerSession(): void {
  try {
    localStorage.removeItem(CUSTOMER_STORAGE_KEY);
  } catch (err) {
    console.warn('Error clearing customer session:', err);
  }
}

export function registerOrLoginCustomer(
  fullName: string,
  mobileNumber: string,
  email?: string,
  options?: { notifyOwner?: boolean; autoOpenWhatsApp?: boolean }
): CustomerUser {
  const cleanPhone = mobileNumber.trim();
  const cleanName = fullName.trim() || 'Valued Customer';
  
  const existingCustomer = findCustomerByPhone(cleanPhone);
  let customerResult: CustomerUser;
  let isNew = false;

  if (existingCustomer) {
    customerResult = {
      ...existingCustomer,
      fullName: cleanName || existingCustomer.fullName,
      email: email?.trim() || existingCustomer.email,
    };
    saveCustomerSession(customerResult);
  } else {
    isNew = true;
    customerResult = {
      id: `cust_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      fullName: cleanName,
      mobileNumber: cleanPhone,
      email: email?.trim() || '',
      createdAt: new Date().toISOString(),
      totalTripsCount: 0,
    };
    saveCustomerSession(customerResult);
  }

  // Automatically trigger Owner WhatsApp login notification unless explicitly disabled
  if (options?.notifyOwner !== false) {
    try {
      notifyOwnerOnCustomerLogin(customerResult, {
        isNewRegistration: isNew,
        autoOpenWhatsApp: options?.autoOpenWhatsApp,
      });
    } catch (e) {
      console.warn('Customer login owner notification warning:', e);
    }
  }

  return customerResult;
}


export function findCustomerByPhone(phone: string): CustomerUser | null {
  try {
    const rawTarget = phone.replace(/\D/g, '').slice(-10);
    if (!rawTarget) return null;
    const allCustomers: CustomerUser[] = JSON.parse(localStorage.getItem(CUSTOMERS_LIST_KEY) || '[]');
    return (
      allCustomers.find((c) => {
        const clean = c.mobileNumber.replace(/\D/g, '').slice(-10);
        return clean === rawTarget;
      }) || null
    );
  } catch {
    return null;
  }
}

/**
 * Loads all bookings associated with the specified customer (by phone number matching)
 */
export async function getCustomerBookings(customerPhone: string): Promise<BookingRequest[]> {
  const cleanPhone = customerPhone.replace(/\D/g, '').slice(-10);
  const results: BookingRequest[] = [];

  // 1. Read from localStorage all bookings
  try {
    const localBookings: BookingRequest[] = JSON.parse(localStorage.getItem('tj_all_bookings') || '[]');
    localBookings.forEach((b) => {
      const bPhone = (b.passengerDetails?.mobileNumber || '').replace(/\D/g, '').slice(-10);
      if (bPhone === cleanPhone || (cleanPhone.length >= 8 && bPhone.includes(cleanPhone))) {
        results.push(b);
      }
    });
  } catch (e) {
    console.warn('Error reading local customer bookings:', e);
  }

  // 2. Fetch from server API if online
  try {
    const res = await fetch('/api/bookings');
    if (res.ok) {
      const json = await res.json();
      const serverData = json.bookings;
      if (Array.isArray(serverData)) {
        serverData.forEach((row: any) => {
          const rowPhone = (row.passengerDetails?.mobileNumber || row.mobile_number || '').replace(/\D/g, '').slice(-10);
          if (rowPhone === cleanPhone || (cleanPhone.length >= 8 && rowPhone.includes(cleanPhone))) {
            const refId = row.referenceId || row.reference_id;
            const alreadyExists = results.some((r) => r.referenceId === refId);
            if (!alreadyExists) {
              if (row.referenceId && row.selectedVehicle && row.passengerDetails) {
                results.push(row as BookingRequest);
              } else {
                const bookingItem: BookingRequest = {
                  referenceId: row.reference_id || `TJ-${Date.now().toString(36).toUpperCase()}`,
                  createdAt: row.created_at || new Date().toISOString(),
                  status: row.status || 'Pending Confirmation',
                  selectedVehicle: {
                    id: row.vehicle_id || 'sedan_etios',
                    name: row.vehicle_name || 'Toyota Etios / Dzire',
                    category: row.vehicle_category || 'Sedan',
                    seatingCapacity: row.passengers_count || 4,
                    luggageCapacity: 3,
                    description: 'Spacious AC ride',
                    features: ['Clean AC', 'Verified Driver'],
                    suitableServices: ['local', 'oneway', 'roundtrip', 'airport'],
                    comfortLevel: 'Executive',
                    basePriceFactor: 1.0,
                  },
                  passengerDetails: {
                    fullName: row.full_name || 'Valued Passenger',
                    mobileNumber: row.mobile_number || cleanPhone,
                    email: row.email,
                    passengersCount: row.passengers_count || 2,
                    specialInstructions: row.special_instructions || '',
                  },
                  searchDetails: row.search_details || {
                    serviceType: row.service_type || 'oneway',
                    pickupLocation: row.pickup_location || 'Mysuru',
                    dropLocation: row.drop_location || '',
                    travelDate: row.travel_date || new Date().toISOString().split('T')[0],
                    pickupTime: row.pickup_time || '09:00',
                    returnDate: row.return_date,
                    durationHours: row.duration_hours || 8,
                    airportTransferType: row.airport_transfer_type || 'pickup',
                    passengers: row.passengers_count || 2,
                    vehicleType: row.vehicle_id || 'all',
                  },
                  estimatedFare: row.estimated_fare || {
                    estimatedDistanceKm: 0,
                    estimatedDurationHours: 0,
                    baseFareAmount: 0,
                    distanceFareAmount: 0,
                    durationFareAmount: 0,
                    passengerSurchargeAmount: 0,
                    airportSurchargeAmount: 0,
                    totalEstimatedFare: Number(row.total_estimated_fare) || 0,
                    breakdown: [],
                  },
                  driverDetails: row.driver_name
                    ? {
                        driverName: row.driver_name,
                        driverPhone: row.driver_phone,
                        driverVehiclePlate: row.driver_vehicle_plate,
                        assignedAt: row.driver_assigned_at,
                      }
                    : undefined,
                };
                results.push(bookingItem);
              }
            }
          }
        });
      }
    }
  } catch (serverErr) {
    console.warn('Error fetching server customer bookings:', serverErr);
  }

  // Sort by createdAt descending
  results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return results;
}
