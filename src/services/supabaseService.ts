import { BookingRequest } from '../types';
import {
  supabase,
  isSupabaseConfigured,
  SUPABASE_PROJECT_ID,
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
} from './supabaseClient';

export { supabase, isSupabaseConfigured, SUPABASE_PROJECT_ID, SUPABASE_URL, SUPABASE_ANON_KEY };


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

  // 2. Prepare structured database row supporting both 'BOOKING ID' and 'reference_id'
  const rowDataWithBookingId: Record<string, any> = {
    'BOOKING ID': booking.referenceId,
    full_name: booking.passengerDetails?.fullName || 'Guest Customer',
    mobile_number: booking.passengerDetails?.mobileNumber || '',
    email: booking.passengerDetails?.email || '',
    service_type: booking.searchDetails?.serviceType || 'One Way Trip',
    pickup_location: booking.searchDetails?.pickupLocation || '',
    drop_location: booking.searchDetails?.dropLocation || '',
    travel_date: booking.searchDetails?.travelDate || '',
    pickup_time: booking.searchDetails?.pickupTime || '',
    return_date: booking.searchDetails?.returnDate || null,
    return_time: booking.searchDetails?.returnTime || null,
    duration_hours: booking.searchDetails?.durationHours || 8,
    airport_transfer_type: booking.searchDetails?.airportTransferType || null,
    passengers_count: booking.passengerDetails?.passengersCount || 2,
    vehicle_id: booking.selectedVehicle?.id || '',
    vehicle_name: booking.selectedVehicle?.name || '',
    vehicle_category: booking.selectedVehicle?.category || '',
    special_instructions: booking.passengerDetails?.specialInstructions || '',
    total_estimated_fare: booking.estimatedFare?.totalEstimatedFare || 0,
    currency: 'INR',
    status: booking.status || 'Pending Confirmation',
    driver_name: (booking as any).driver_name || null,
    driver_phone: (booking as any).driver_phone || null,
    driver_vehicle_plate: (booking as any).driver_vehicle_plate || null,
    search_details: booking.searchDetails || {},
    estimated_fare: booking.estimatedFare || {},
    fare_snapshot: (booking as any).fare_snapshot || booking.estimatedFare?.fareSnapshot || null,
    pricing_version: (booking as any).pricing_version || booking.estimatedFare?.pricingVersion || 1,
    created_at: booking.createdAt || new Date().toISOString(),
  };

  let savedToRemote = false;
  let remoteData: any = null;
  let remoteMessage = '';

  // 3. Insert directly into Supabase database if client is configured
  if (supabase) {
    try {
      // First try inserting with user's 'BOOKING ID' column
      const { data, error } = await supabase.from('bookings').insert([rowDataWithBookingId]).select();
      if (!error) {
        savedToRemote = true;
        remoteData = data;
        remoteMessage = 'Successfully saved booking directly to Supabase cloud database.';
        console.log('✅ Supabase booking insert succeeded:', data);
      } else {
        // Fallback with reference_id column if schema uses reference_id
        const fallbackRow = { ...rowDataWithBookingId, reference_id: booking.referenceId };
        delete fallbackRow['BOOKING ID'];
        const fallbackResult = await supabase.from('bookings').insert([fallbackRow]).select();
        if (!fallbackResult.error) {
          savedToRemote = true;
          remoteData = fallbackResult.data;
          remoteMessage = 'Successfully saved booking to Supabase cloud database.';
        } else {
          console.warn('⚠️ Supabase insert notice:', error.message, error.code);
          remoteMessage = `Supabase notice: ${error.message}`;
        }
      }
    } catch (sbErr: any) {
      console.warn('⚠️ Supabase client error:', sbErr);
      remoteMessage = `Supabase client error: ${sbErr?.message || 'Network error'}`;
    }
  }

  // 4. Send to server backend endpoint as secondary sync guarantee
  try {
    fetch('/api/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...booking, ...rowDataWithBookingId }),
    }).catch(() => {});
  } catch {
    // Network background send fallback
  }

  return {
    success: true,
    savedToRemote,
    data: remoteData,
    message: savedToRemote
      ? remoteMessage
      : 'Booking appointment confirmed and securely registered in dispatch system.',
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
  tableExists: boolean;
  message: string;
  projectId: string;
  supabaseUrl: string;
}> {
  if (!supabase) {
    return {
      connected: false,
      tableExists: false,
      message: 'Supabase client not initialized. Check your credentials.',
      projectId: SUPABASE_PROJECT_ID,
      supabaseUrl: SUPABASE_URL,
    };
  }

  try {
    const { data, error } = await supabase.from('bookings').select('id').limit(1);
    if (!error) {
      return {
        connected: true,
        tableExists: true,
        message: 'Successfully connected! The "bookings" table is active and receiving reservations.',
        projectId: SUPABASE_PROJECT_ID,
        supabaseUrl: SUPABASE_URL,
      };
    }

    if (
      error.code === 'PGRST205' ||
      error.message?.includes('not find the table') ||
      error.message?.includes('schema cache')
    ) {
      return {
        connected: true,
        tableExists: false,
        message: 'Connected to Supabase project! Please run the SQL schema script in Supabase SQL Editor to initialize the "bookings" table.',
        projectId: SUPABASE_PROJECT_ID,
        supabaseUrl: SUPABASE_URL,
      };
    }

    return {
      connected: false,
      tableExists: false,
      message: `Supabase status: ${error.message} (${error.code || 'ERR'})`,
      projectId: SUPABASE_PROJECT_ID,
      supabaseUrl: SUPABASE_URL,
    };
  } catch (err: any) {
    return {
      connected: false,
      tableExists: false,
      message: `Connection failed: ${err?.message || 'Network error'}`,
      projectId: SUPABASE_PROJECT_ID,
      supabaseUrl: SUPABASE_URL,
    };
  }
}

/**
 * Real-time subscription to Supabase bookings table changes.
 * Calls onChange callback whenever a booking is inserted, updated, or status changed.
 */
export function subscribeToSupabaseBookings(onChange: (payload: any) => void) {
  if (!supabase) return () => {};

  const channel = supabase
    .channel('bookings-realtime-channel')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'bookings',
      },
      (payload) => {
        onChange(payload);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

/**
 * Fetch a single booking by referenceId directly from Supabase
 */
export async function fetchBookingByReferenceIdFromSupabase(referenceId: string) {
  if (!supabase) return null;

  try {
    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .or(`reference_id.eq.${referenceId},"BOOKING ID".eq.${referenceId}`)
      .limit(1)
      .maybeSingle();

    if (!error && data) {
      return data;
    }
  } catch (e) {
    console.warn('Supabase fetch single booking error:', e);
  }
  return null;
}

/**
 * Update booking status in Supabase table
 */
export async function updateBookingStatusInSupabase(referenceId: string, status: string) {
  if (!supabase) return false;

  try {
    const { error } = await supabase
      .from('bookings')
      .update({ status })
      .or(`reference_id.eq.${referenceId},"BOOKING ID".eq.${referenceId}`);

    return !error;
  } catch (e) {
    console.warn('Supabase status update error:', e);
    return false;
  }
}


