import { GoogleAuthProvider, signInWithPopup, User } from 'firebase/auth';
import { auth } from '../lib/firebase';

export interface CalendarEventPayload {
  summary: string;
  description: string;
  location: string;
  startDateTime: string; // ISO 8601 string or YYYY-MM-DDTHH:mm:ss
  endDateTime: string;   // ISO 8601 string or YYYY-MM-DDTHH:mm:ss
  attendees?: string[];
  referenceId: string;
}

export interface CalendarEventResult {
  id: string;
  htmlLink: string;
  summary: string;
  start: { dateTime?: string; date?: string };
  end: { dateTime?: string; date?: string };
}

// In-memory cache for OAuth access token
let cachedCalendarAccessToken: string | null = null;
const CALENDAR_SCOPE = 'https://www.googleapis.com/auth/calendar.events';

/**
 * Retrieves the cached in-memory access token or requests it using Firebase GoogleAuthProvider popup
 */
export async function getCalendarAccessToken(): Promise<string | null> {
  if (cachedCalendarAccessToken) {
    return cachedCalendarAccessToken;
  }

  try {
    const provider = new GoogleAuthProvider();
    provider.addScope(CALENDAR_SCOPE);
    provider.setCustomParameters({ prompt: 'consent' });

    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);

    if (credential?.accessToken) {
      cachedCalendarAccessToken = credential.accessToken;
      return cachedCalendarAccessToken;
    }
    return null;
  } catch (error) {
    console.error('Failed to obtain Google Calendar access token:', error);
    throw error;
  }
}

/**
 * Clears the in-memory access token on sign-out
 */
export function clearCalendarToken(): void {
  cachedCalendarAccessToken = null;
}

/**
 * Creates a Google Calendar trip event for a confirmed booking
 */
export async function createGoogleCalendarTripEvent(
  event: CalendarEventPayload
): Promise<CalendarEventResult> {
  const token = await getCalendarAccessToken();
  if (!token) {
    throw new Error('Could not obtain Google Calendar authorization token.');
  }

  // Ensure dates are formatted as ISO string with timezone
  const startIso = new Date(event.startDateTime).toISOString();
  const endIso = new Date(event.endDateTime).toISOString();

  const body: any = {
    summary: event.summary,
    description: `${event.description}\n\nBooking Reference: ${event.referenceId}\nTRAVEL JUST Mysuru 24/7 Helpline: +91 97407 54400`,
    location: event.location,
    start: {
      dateTime: startIso,
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Kolkata',
    },
    end: {
      dateTime: endIso,
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Kolkata',
    },
    reminders: {
      useDefault: false,
      overrides: [
        { method: 'popup', minutes: 120 }, // 2 hours before pickup
        { method: 'popup', minutes: 30 },  // 30 mins before pickup
      ],
    },
  };

  if (event.attendees && event.attendees.length > 0) {
    body.attendees = event.attendees.map((email) => ({ email }));
  }

  const response = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `Google Calendar API error (${response.status})`);
  }

  const data = await response.json();
  return data as CalendarEventResult;
}

/**
 * Lists upcoming Google Calendar events for TRAVEL JUST bookings
 */
export async function listGoogleCalendarTripEvents(): Promise<CalendarEventResult[]> {
  const token = await getCalendarAccessToken();
  if (!token) {
    throw new Error('Not authenticated with Google Calendar.');
  }

  const now = new Date().toISOString();
  const url = new URL('https://www.googleapis.com/calendar/v3/calendars/primary/events');
  url.searchParams.set('timeMin', now);
  url.searchParams.set('q', 'TRAVEL JUST');
  url.searchParams.set('singleEvents', 'true');
  url.searchParams.set('orderBy', 'startTime');
  url.searchParams.set('maxResults', '15');

  const response = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `Failed to fetch calendar events (${response.status})`);
  }

  const data = await response.json();
  return (data.items || []) as CalendarEventResult[];
}

/**
 * Removes or cancels a Google Calendar trip event (with user confirmation guard)
 */
export async function deleteGoogleCalendarTripEvent(eventId: string): Promise<boolean> {
  const token = await getCalendarAccessToken();
  if (!token) {
    throw new Error('Not authenticated with Google Calendar.');
  }

  const response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok && response.status !== 404) {
    throw new Error(`Failed to delete calendar event (${response.status})`);
  }

  return true;
}
