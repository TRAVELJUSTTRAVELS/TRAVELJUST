import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  type User,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDocFromServer,
  collection,
  setDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
} from 'firebase/firestore';
import firebaseConfigJson from '../../firebase-applet-config.json';

const firebaseConfig = {
  apiKey: firebaseConfigJson.apiKey,
  authDomain: firebaseConfigJson.authDomain,
  projectId: firebaseConfigJson.projectId,
  storageBucket: firebaseConfigJson.storageBucket,
  messagingSenderId: firebaseConfigJson.messagingSenderId,
  appId: firebaseConfigJson.appId,
};

// Initialize Firebase App
export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Auth
export const auth = getAuth(app);
export const googleAuthProvider = new GoogleAuthProvider();
googleAuthProvider.setCustomParameters({ prompt: 'select_account' });

// Initialize Firestore
const databaseId = firebaseConfigJson.firestoreDatabaseId || undefined;
export const db = databaseId ? getFirestore(app, databaseId) : getFirestore(app);

// Connection test on boot (mandatory Firebase skill check)
export async function testFirestoreConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firestore offline / check configuration:', error.message);
      return false;
    }
    // Document does not exist or permission is normal on new projects
    return true;
  }
}

// Kick off test connection
testFirestoreConnection();

// User Profile helper
export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  phoneNumber?: string | null;
  role: 'customer' | 'owner' | 'admin';
  createdAt?: string;
  lastLoginAt?: string;
}

export async function syncUserProfile(user: User): Promise<UserProfile> {
  const isOwnerEmail = user.email?.toLowerCase() === 'traveljustmysuru@gmail.com';
  const role: 'customer' | 'owner' | 'admin' = isOwnerEmail ? 'owner' : 'customer';

  const userRef = doc(db, 'users', user.uid);
  let existingProfile: UserProfile | null = null;

  try {
    const snap = await getDoc(userRef);
    if (snap.exists()) {
      existingProfile = snap.data() as UserProfile;
    }
  } catch (err) {
    console.warn('Could not read user profile from firestore:', err);
  }

  const profile: UserProfile = {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName || user.email?.split('@')[0] || 'Travel Just Guest',
    photoURL: user.photoURL,
    phoneNumber: user.phoneNumber || existingProfile?.phoneNumber || null,
    role: isOwnerEmail ? 'owner' : existingProfile?.role || role,
    createdAt: existingProfile?.createdAt || new Date().toISOString(),
    lastLoginAt: new Date().toISOString(),
  };

  try {
    await setDoc(userRef, profile, { merge: true });
  } catch (err) {
    console.warn('Could not save user profile to firestore:', err);
  }

  return profile;
}

// User Bookings persistence in Firestore
export interface SavedBookingRecord {
  id: string;
  userId?: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  tripType: string;
  pickupLocation: string;
  dropLocation: string;
  pickupDate: string;
  pickupTime: string;
  vehicleType: string;
  estimatedFare: number;
  distanceKm?: number;
  status: 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';
  createdAt: string;
  notes?: string;
}

export async function saveBookingToFirestore(booking: SavedBookingRecord): Promise<boolean> {
  try {
    const bookingDoc = doc(db, 'bookings', booking.id);
    await setDoc(bookingDoc, {
      ...booking,
      createdAt: booking.createdAt || new Date().toISOString(),
    });

    if (booking.userId) {
      const userBookingDoc = doc(db, 'users', booking.userId, 'bookings', booking.id);
      await setDoc(userBookingDoc, {
        ...booking,
        createdAt: booking.createdAt || new Date().toISOString(),
      });
    }
    return true;
  } catch (error) {
    console.error('Error saving booking to Firestore:', error);
    return false;
  }
}

export async function fetchUserBookingsFromFirestore(userId: string): Promise<SavedBookingRecord[]> {
  try {
    const q = query(
      collection(db, 'users', userId, 'bookings'),
      orderBy('createdAt', 'desc'),
      limit(20)
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => d.data() as SavedBookingRecord);
  } catch (error) {
    console.warn('Could not fetch user bookings from Firestore subcollection, checking main collection:', error);
    try {
      const q = query(
        collection(db, 'bookings'),
        where('userId', '==', userId),
        limit(20)
      );
      const snap = await getDocs(q);
      return snap.docs.map((d) => d.data() as SavedBookingRecord);
    } catch (e2) {
      console.warn('Could not fetch bookings from main collection:', e2);
      return [];
    }
  }
}

export async function saveFareConfigToFirestore(config: any): Promise<boolean> {
  try {
    const configDoc = doc(db, 'settings', 'fareConfig');
    await setDoc(configDoc, {
      ...config,
      updatedAt: new Date().toISOString(),
    }, { merge: true });
    return true;
  } catch (error) {
    console.warn('Could not save fareConfig to Firestore:', error);
    return false;
  }
}

export async function fetchFareConfigFromFirestore(): Promise<any | null> {
  try {
    const configDoc = doc(db, 'settings', 'fareConfig');
    const snap = await getDoc(configDoc);
    if (snap.exists()) {
      return snap.data();
    }
    return null;
  } catch (error) {
    console.warn('Could not fetch fareConfig from Firestore:', error);
    return null;
  }
}

export { signInWithPopup, signOut, onAuthStateChanged, type User };
