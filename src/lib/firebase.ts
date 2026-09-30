import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithCredential,
  signOut,
  onAuthStateChanged,
  type User,
} from 'firebase/auth';
import {
  initializeFirestore,
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

// Initialize Firestore strictly matching the Firebase Integration Skill specification
export const db = getFirestore(app, firebaseConfigJson.firestoreDatabaseId);

// Standardized Firestore Error Handling per Firebase Skill
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Connection test helper (called on-demand or during diagnostics)
export async function testFirestoreConnection(): Promise<boolean> {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return false;
  }
  try {
    const snap = await getDoc(doc(db, 'test', 'connection'));
    return snap.exists();
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    const errorCode = (error as { code?: string })?.code;
    if (
      errorMsg.includes('offline') ||
      errorCode === 'unavailable' ||
      errorMsg.includes('unavailable')
    ) {
      return false;
    }
    // Document does not exist or permission is normal on fresh projects
    return true;
  }
}

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

/**
 * Signs in using a Google ID token from Google Identity Services (GIS).
 * Bypasses auth/unauthorized-domain restrictions since token verification is cryptographic.
 */
export async function signInWithGoogleIdToken(idToken: string) {
  const credential = GoogleAuthProvider.credential(idToken);
  return await signInWithCredential(auth, credential);
}

export {
  signInWithPopup,
  signInWithCredential,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  type User,
};
