import { PlaceSuggestion } from '../types';

export type DestinationTag = 'home' | 'work' | 'airport' | 'favorite' | 'hotel' | 'other';

export interface SavedDestination {
  id: string;
  label: string; // e.g. "Home", "Office", "Mysuru Palace", "BLR Airport"
  tag: DestinationTag;
  placeName: string;
  formattedAddress: string;
  city?: string;
  placeObj?: PlaceSuggestion;
  createdAt: string;
}

const STORAGE_KEY_PREFIX = 'tj_saved_destinations_';
const listeners: Array<() => void> = [];

export function getSavedDestinations(customerId?: string): SavedDestination[] {
  const key = `${STORAGE_KEY_PREFIX}${customerId || 'guest'}`;
  try {
    const raw = localStorage.getItem(key);
    if (raw !== null) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('Error reading saved destinations:', err);
  }

  // By default, start with an empty list so users only see locations they save from booking history or manually enter
  return [];
}

export function saveDestination(
  dest: {
    label: string;
    tag?: DestinationTag;
    placeName: string;
    formattedAddress?: string;
    city?: string;
    placeObj?: PlaceSuggestion;
  },
  customerId?: string
): SavedDestination {
  const current = getSavedDestinations(customerId);
  const key = `${STORAGE_KEY_PREFIX}${customerId || 'guest'}`;

  // Check if identical address already saved
  const existingIndex = current.findIndex(
    (d) =>
      d.placeName.toLowerCase() === dest.placeName.toLowerCase() ||
      (dest.formattedAddress && d.formattedAddress.toLowerCase() === dest.formattedAddress.toLowerCase())
  );

  const newEntry: SavedDestination = {
    id: existingIndex >= 0 ? current[existingIndex].id : `saved_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    label: dest.label.trim() || dest.placeName,
    tag: dest.tag || 'favorite',
    placeName: dest.placeName.trim(),
    formattedAddress: dest.formattedAddress?.trim() || dest.placeName.trim(),
    city: dest.city || dest.placeObj?.city || 'Mysuru',
    placeObj: dest.placeObj,
    createdAt: new Date().toISOString(),
  };

  let updatedList: SavedDestination[];
  if (existingIndex >= 0) {
    updatedList = [...current];
    updatedList[existingIndex] = newEntry;
  } else {
    updatedList = [newEntry, ...current];
  }

  try {
    localStorage.setItem(key, JSON.stringify(updatedList));
  } catch (e) {
    console.warn('Error saving destination to localStorage:', e);
  }

  notifyListeners();
  return newEntry;
}

export function deleteSavedDestination(id: string, customerId?: string): boolean {
  const current = getSavedDestinations(customerId);
  const key = `${STORAGE_KEY_PREFIX}${customerId || 'guest'}`;
  const filtered = current.filter((d) => d.id !== id);

  try {
    localStorage.setItem(key, JSON.stringify(filtered));
    notifyListeners();
    return true;
  } catch {
    return false;
  }
}

export function clearAllSavedDestinations(customerId?: string): boolean {
  const key = `${STORAGE_KEY_PREFIX}${customerId || 'guest'}`;
  try {
    localStorage.setItem(key, JSON.stringify([]));
    notifyListeners();
    return true;
  } catch {
    return false;
  }
}

export function subscribeToSavedDestinations(cb: () => void): () => void {
  listeners.push(cb);
  return () => {
    const idx = listeners.indexOf(cb);
    if (idx >= 0) listeners.splice(idx, 1);
  };
}

function notifyListeners() {
  listeners.forEach((fn) => {
    try {
      fn();
    } catch (e) {
      console.warn('Saved destinations listener error:', e);
    }
  });
}
