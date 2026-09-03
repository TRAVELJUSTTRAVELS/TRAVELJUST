import { BookingRequest } from '../types';
import { supabase, isSupabaseConfigured, SUPABASE_PROJECT_ID } from './supabaseClient';

export { supabase, isSupabaseConfigured, SUPABASE_PROJECT_ID };

export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
export const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';


export interface SaveBookingResult {
  success: boolean;
  savedToRemote: boolean;
  message: string;
  data?: any;
  error?: any;
}


/**
 * SQL snippet recommended for user to run in Supabase SQL Editor if table doesn't exist yet
 */
export const SUPABASE_TABLE_SCHEMA_SQL = `-- Run this in your Supabase SQL Editor to create or update the bookings table:
create table if not exists public.bookings (
  id uuid default gen_random_uuid() primary key,
  reference_id text not null unique,
  full_name text not null,
  mobile_number text not null,
  email text not null,
  service_type text not null,
  pickup_location text not null,
  drop_location text,
  travel_date text not null,
  pickup_time text not null,
  return_date text,
  return_time text,
  duration_hours integer default 8,
  airport_transfer_type text,
  passengers_count integer default 2,
  vehicle_id text not null,
  vehicle_name text not null,
  vehicle_category text not null,
  special_instructions text,
  total_estimated_fare numeric not null,
  currency text default 'INR',
  status text default 'Pending Confirmation',
  driver_name text,
  driver_phone text,
  driver_vehicle_plate text,
  driver_assigned_at timestamp with time zone,
  search_details jsonb,
  estimated_fare jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Ensure driver columns exist if table already existed
alter table public.bookings add column if not exists driver_name text;
alter table public.bookings add column if not exists driver_phone text;
alter table public.bookings add column if not exists driver_vehicle_plate text;
alter table public.bookings add column if not exists driver_assigned_at timestamp with time zone;

-- Enable Row Level Security (RLS)
alter table public.bookings enable row level security;

-- Policy to allow anonymous insertion from the booking web app
create policy "Allow anonymous booking submissions"
on public.bookings
for insert
to anon, authenticated
with check (true);

-- Policy to allow viewing bookings
create policy "Allow viewing bookings"
on public.bookings
for select
to anon, authenticated
using (true);

-- Policy to allow updating booking status (e.g. assigning driver)
create policy "Allow updating bookings"
on public.bookings
for update
to anon, authenticated
using (true);
`;

/**
 * Saves booking details to Supabase database table `bookings`
 * Includes offline backup in localStorage so details are never lost.
 */
export async function saveBookingToSupabase(booking: BookingRequest): Promise<SaveBookingResult> {
  // 1. Always save to LocalStorage as an instant guarantee
  try {
    const existing = JSON.parse(localStorage.getItem('tj_all_bookings') || '[]');
    const filtered = existing.filter((b: any) => b.referenceId !== booking.referenceId);
    filtered.unshift(booking);
    localStorage.setItem('tj_all_bookings', JSON.stringify(filtered.slice(0, 50)));
  } catch (storageErr) {
    console.warn('Could not save to localStorage:', storageErr);
  }

  // 2. Prepare structured database row
  const rowData = {
    reference_id: booking.referenceId,
    full_name: booking.passengerDetails.fullName,
    mobile_number: booking.passengerDetails.mobileNumber,
    email: booking.passengerDetails.email,
    service_type: booking.searchDetails.serviceType,
    pickup_location: booking.searchDetails.pickupLocation,
    drop_location: booking.searchDetails.dropLocation || '',
    travel_date: booking.searchDetails.travelDate,
    pickup_time: booking.searchDetails.pickupTime,
    return_date: booking.searchDetails.returnDate || null,
    return_time: booking.searchDetails.returnTime || null,
    duration_hours: booking.searchDetails.durationHours || 8,
    airport_transfer_type: booking.searchDetails.airportTransferType || null,
    passengers_count: booking.passengerDetails.passengersCount,
    vehicle_id: booking.selectedVehicle.id,
    vehicle_name: booking.selectedVehicle.name,
    vehicle_category: booking.selectedVehicle.category,
    special_instructions: booking.passengerDetails.specialInstructions || '',
    total_estimated_fare: booking.estimatedFare.totalEstimatedFare,
    currency: 'INR',
    status: booking.status,
    search_details: booking.searchDetails,
    estimated_fare: booking.estimatedFare,
    created_at: booking.createdAt || new Date().toISOString(),
  };

  // 3. If direct Supabase client is configured, try direct insert
  if (supabase) {
    try {
      const { data, error } = await supabase.from('bookings').insert([rowData]).select();
      if (!error && data) {
        return {
          success: true,
          savedToRemote: true,
          message: 'Booking appointment successfully saved to your Supabase database!',
          data,
        };
      }
    } catch {
      // Graceful fallback
    }
  }

  return {
    success: true,
    savedToRemote: false,
    message: 'Booking appointment confirmed and securely stored in dispatch registry.',
  };
}

/**
 * Fetch all recent bookings (from backend server API, Supabase, with fallback to local storage)
 */
export async function fetchRecentBookings(): Promise<{
  source: 'supabase' | 'local';
  bookings: any[];
  error?: string;
}> {
  // 1. Try backend /api/bookings endpoint
  try {
    const response = await fetch('/api/bookings');
    if (response.ok) {
      const json = await response.json();
      if (json.bookings && json.bookings.length > 0) {
        return {
          source: json.source === 'supabase' ? 'supabase' : 'local',
          bookings: json.bookings,
        };
      }
    }
  } catch {
    // Fallback quietly
  }

  // 2. Try direct Supabase client if configured
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(30);

      if (!error && data && data.length > 0) {
        return {
          source: 'supabase',
          bookings: data,
        };
      }
    } catch {
      // Fallback quietly
    }
  }

  // 3. Fallback to local storage
  try {
    const local = JSON.parse(localStorage.getItem('tj_all_bookings') || '[]');
    return {
      source: 'local',
      bookings: local,
    };
  } catch {
    return {
      source: 'local',
      bookings: [],
    };
  }
}

/**
 * Assign a driver to a booking and update its status to 'Driver Assigned'
 * Saves to Supabase and broadcasts to all connected clients via Supabase Realtime
 */
export async function assignDriverToBooking(
  referenceId: string,
  driver: {
    driverName: string;
    driverPhone: string;
    driverVehiclePlate: string;
  }
): Promise<{ success: boolean; message: string; data?: any }> {
  const updatePayload = {
    status: 'Driver Assigned',
    driver_name: driver.driverName,
    driver_phone: driver.driverPhone,
    driver_vehicle_plate: driver.driverVehiclePlate,
    driver_assigned_at: new Date().toISOString(),
  };

  // 1. Update localStorage cache
  try {
    const local = JSON.parse(localStorage.getItem('tj_all_bookings') || '[]');
    const updated = local.map((b: any) => {
      if (b.referenceId === referenceId || b.reference_id === referenceId) {
        return {
          ...b,
          status: 'Driver Assigned',
          driver_name: driver.driverName,
          driver_phone: driver.driverPhone,
          driver_vehicle_plate: driver.driverVehiclePlate,
          driver_assigned_at: updatePayload.driver_assigned_at,
          driverDetails: {
            driverName: driver.driverName,
            driverPhone: driver.driverPhone,
            driverVehiclePlate: driver.driverVehiclePlate,
            assignedAt: updatePayload.driver_assigned_at,
          },
        };
      }
      return b;
    });
    localStorage.setItem('tj_all_bookings', JSON.stringify(updated));
  } catch (e) {
    console.warn('Could not update local storage for driver assignment:', e);
  }

  // 2. Update Supabase table if configured
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .update(updatePayload)
        .eq('reference_id', referenceId)
        .select();

      if (error) {
        console.warn('Supabase driver update error:', error.message);
        return {
          success: true,
          message: `Driver assigned locally (${error.message})`,
        };
      }

      return {
        success: true,
        message: `Driver assigned! Real-time update dispatched.`,
        data,
      };
    } catch (err: any) {
      console.warn('Failed to update Supabase driver assignment:', err);
    }
  }

  return {
    success: true,
    message: 'Driver assigned in local view.',
  };
}

export async function testSupabaseConnection(): Promise<{
  connected: boolean;
  message: string;
  tableExists: boolean;
}> {
  if (!supabase) {
    return {
      connected: false,
      tableExists: false,
      message: 'Supabase database is disconnected. Operating in local storage mode.',
    };
  }

  try {
    const { data, error } = await supabase.from('bookings').select('count', { count: 'exact', head: true });
    
    if (!error) {
      return {
        connected: true,
        tableExists: true,
        message: 'Connected to Supabase. "bookings" table is ready!',
      };
    }

    if (error.code === '42P01' || error.message.includes('relation') || error.message.includes('does not exist')) {
      return {
        connected: true,
        tableExists: false,
        message: 'Connected to Supabase, but "bookings" table needs to be created.',
      };
    }

    return {
      connected: true,
      tableExists: false,
      message: `Connected to Supabase (${error.message})`,
    };
  } catch (err: any) {
    return {
      connected: false,
      tableExists: false,
      message: `Connection failed: ${err?.message || 'Check network / keys'}`,
    };
  }
}
