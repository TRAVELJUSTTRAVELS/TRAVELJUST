import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithCredential,
  signOut,
  onAuthStateChanged,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  PhoneAuthProvider,
  type ConfirmationResult,
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
googleAuthProvider.addScope('https://www.googleapis.com/auth/calendar.events');
googleAuthProvider.setCustomParameters({ prompt: 'select_account' });

/**
 * Creates or retrieves an application RecaptchaVerifier for Firebase Phone Auth.
 * Supports invisible or visible container verification.
 */
export function setupRecaptcha(
  containerOrButtonId: string | HTMLElement,
  size: 'invisible' | 'normal' = 'invisible',
  onVerify?: () => void,
  onExpire?: () => void
): RecaptchaVerifier {
  if (typeof window === 'undefined') {
    throw new Error('RecaptchaVerifier must be called in a browser environment');
  }

  // Clear existing verifier if stored on window
  const win = window as any;
  if (win.recaptchaVerifier) {
    try {
      win.recaptchaVerifier.clear();
    } catch {
      // Ignore cleanup error
    }
  }

  const verifier = new RecaptchaVerifier(auth, containerOrButtonId, {
    size,
    callback: () => {
      if (onVerify) onVerify();
    },
    'expired-callback': () => {
      if (onExpire) onExpire();
    },
  });

  win.recaptchaVerifier = verifier;
  return verifier;
}

/**
 * Initiates phone OTP sending via Firebase Phone Authentication.
 * Expects phone with country code e.g. "+919740754400"
 */
export async function sendFirebasePhoneOtp(
  phoneNumberWithCountryCode: string,
  verifier: RecaptchaVerifier
): Promise<ConfirmationResult> {
  return await signInWithPhoneNumber(auth, phoneNumberWithCountryCode, verifier);
}

// Initialize Firestore with forced long-polling to prevent proxy/streaming timeout warnings
const databaseId = (firebaseConfigJson as { firestoreDatabaseId?: string }).firestoreDatabaseId;
export const db = (() => {
  try {
    return initializeFirestore(
      app,
      {
        experimentalForceLongPolling: true,
      },
      databaseId
    );
  } catch {
    return getFirestore(app, databaseId);
  }
})();

// Validate Connection to Firestore on initial boot per Firebase Skill constraint
async function testConnection() {
  try {
    await Promise.race([
      getDocFromServer(doc(db, 'test', 'connection')),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Connection check timeout')), 4000)),
    ]);
  } catch (error) {
    if (error instanceof Error && (error.message.includes('the client is offline') || error.message.includes('timeout'))) {
      console.warn('Firestore offline notice: running in local client persistence mode.');
    }
  }
}
// Run connection test non-blockingly
testConnection().catch(() => {});

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
    const snap = await getDocFromServer(doc(db, 'test', 'connection'));
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

/**
 * Removes undefined fields from an object so Firestore setDoc does not throw
 * "Unsupported field value: undefined" errors.
 */
function cleanFirestoreData<T extends Record<string, any>>(data: T): Partial<T> {
  const cleaned: Record<string, any> = {};
  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined) {
      cleaned[key] = value;
    }
  }
  return cleaned as Partial<T>;
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
    email: user.email ?? null,
    displayName: user.displayName || user.email?.split('@')[0] || 'Travel Just Guest',
    photoURL: user.photoURL ?? null,
    phoneNumber: user.phoneNumber || existingProfile?.phoneNumber || null,
    role: isOwnerEmail ? 'owner' : existingProfile?.role || role,
    createdAt: existingProfile?.createdAt || new Date().toISOString(),
    lastLoginAt: new Date().toISOString(),
  };

  try {
    await setDoc(userRef, cleanFirestoreData(profile), { merge: true });
  } catch (err) {
    console.warn('Could not save user profile to firestore:', err);
  }

  return profile;
}

// User Bookings persistence in Firestore
export interface SavedBookingRecord {
  id: string;
  userId?: string | null;
  customerName: string;
  customerPhone: string;
  customerEmail?: string | null;
  tripType: string;
  pickupLocation: string;
  dropLocation: string;
  pickupDate: string;
  pickupTime: string;
  vehicleType: string;
  estimatedFare: number;
  distanceKm?: number | null;
  status: 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';
  createdAt: string;
  notes?: string | null;
}

export async function saveBookingToFirestore(booking: SavedBookingRecord): Promise<boolean> {
  try {
    const payload = cleanFirestoreData({
      ...booking,
      userId: booking.userId ?? null,
      customerEmail: booking.customerEmail ?? null,
      distanceKm: booking.distanceKm ?? null,
      notes: booking.notes ?? null,
      createdAt: booking.createdAt || new Date().toISOString(),
    });

    const bookingDoc = doc(db, 'bookings', booking.id);
    await setDoc(bookingDoc, payload);

    if (booking.userId) {
      const userBookingDoc = doc(db, 'users', booking.userId, 'bookings', booking.id);
      await setDoc(userBookingDoc, payload);
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
 * Signs in using Google Popup Auth.
 * Automatically provisions or updates user profile in Firestore.
 */
export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleAuthProvider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    const user = result.user;
    await syncUserProfile(user);
    return { user, credential };
  } catch (error) {
    console.error("Error signing in with Google:", error);
    throw error;
  }
};

/**
 * Signs in using a Google ID token from Google Identity Services (GIS).
 * Bypasses auth/unauthorized-domain restrictions since token verification is cryptographic.
 */
export async function signInWithGoogleIdToken(idToken: string) {
  const credential = GoogleAuthProvider.credential(idToken);
  return await signInWithCredential(auth, credential);
}

/**
 * Subscribes to real-time Firebase Auth state changes.
 * Returns an unsubscribe callback for clean component unmounting.
 */
export function subscribeToAuthState(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, (user) => {
    if (user) {
      console.log('User is active:', user.uid);
    } else {
      console.log('No user signed in.');
    }
    callback(user);
  });
}

/**
 * Signs out the current authenticated user from Firebase Auth.
 */
export const logoutUser = async (): Promise<void> => {
  try {
    await signOut(auth);
    console.log("Logged out successfully");
  } catch (error) {
    console.error("Error logging out:", error);
    throw error;
  }
};

export {
  signInWithPopup,
  signInWithCredential,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  PhoneAuthProvider,
  type ConfirmationResult,
  type User,
};
