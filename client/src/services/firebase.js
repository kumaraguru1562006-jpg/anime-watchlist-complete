import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup,
  setPersistence,
  browserLocalPersistence
} from 'firebase/auth';

// Firebase configuration from environment variables or safe default configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyDemoAnimeKeyForPersistentAuth2026',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'anisphere-anime-watchlist.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'anisphere-anime-watchlist',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'anisphere-anime-watchlist.appspot.com',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '1029384756',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:1029384756:web:9a8b7c6d5e4f3a2b1',
};

let app;
let auth;
let isRealFirebase = false;

try {
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
  auth = getAuth(app);
  // Ensure authentication state persists in localStorage across browser sessions/reloads
  setPersistence(auth, browserLocalPersistence).catch(() => {});
  isRealFirebase = true;
} catch (err) {
  console.warn('Firebase initialized with local persistent emulation fallback:', err.message);
  isRealFirebase = false;
}

const googleProvider = new GoogleAuthProvider();

/**
 * Sign in existing user with Email & Password
 */
export const firebaseSignIn = async (email, password) => {
  const cleanEmail = email.toLowerCase().trim();

  if (isRealFirebase && import.meta.env.VITE_FIREBASE_API_KEY) {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, cleanEmail, password);
      return {
        uid: userCredential.user.uid,
        email: userCredential.user.email,
        displayName: userCredential.user.displayName || cleanEmail.split('@')[0],
        photoURL: userCredential.user.photoURL,
      };
    } catch (err) {
      console.warn('Firebase direct auth error, falling back to local persistent auth:', err.code, err.message);
      // If user not found and password provided, fall through or throw friendly message
      if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
        throw new Error('Invalid email or password. Please check your credentials or create an account.');
      }
      throw err;
    }
  }

  // Persistent Local Fallback: allows testing & running without mandatory GCP/Firebase console setup
  const localUsersKey = 'anisphere_firebase_local_users';
  const existingUsers = JSON.parse(localStorage.getItem(localUsersKey) || '{}');
  const user = existingUsers[cleanEmail];

  if (!user) {
    // Automatically register if first time with this email
    const newUser = {
      uid: `firebase_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      email: cleanEmail,
      displayName: cleanEmail.split('@')[0],
      photoURL: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(cleanEmail)}&backgroundColor=020617`,
      passwordHash: password, // local demo
      createdAt: new Date().toISOString(),
    };
    existingUsers[cleanEmail] = newUser;
    localStorage.setItem(localUsersKey, JSON.stringify(existingUsers));
    return newUser;
  }

  return user;
};

/**
 * Register new user with Email, Password & Display Name
 */
export const firebaseSignUp = async (email, password, displayName) => {
  const cleanEmail = email.toLowerCase().trim();
  const name = displayName?.trim() || cleanEmail.split('@')[0];
  const photo = `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(cleanEmail)}&backgroundColor=020617`;

  if (isRealFirebase && import.meta.env.VITE_FIREBASE_API_KEY) {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, cleanEmail, password);
      await updateProfile(userCredential.user, {
        displayName: name,
        photoURL: photo,
      });
      return {
        uid: userCredential.user.uid,
        email: userCredential.user.email,
        displayName: name,
        photoURL: photo,
      };
    } catch (err) {
      console.warn('Firebase direct signup error:', err.message);
      if (err.code === 'auth/email-already-in-use') {
        throw new Error('This email address is already registered. Please sign in instead.');
      }
      if (err.code === 'auth/weak-password') {
        throw new Error('Password should be at least 6 characters.');
      }
      throw err;
    }
  }

  // Local persistent registration
  const localUsersKey = 'anisphere_firebase_local_users';
  const existingUsers = JSON.parse(localStorage.getItem(localUsersKey) || '{}');

  const newUser = {
    uid: `firebase_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    email: cleanEmail,
    displayName: name,
    photoURL: photo,
    createdAt: new Date().toISOString(),
  };

  existingUsers[cleanEmail] = newUser;
  localStorage.setItem(localUsersKey, JSON.stringify(existingUsers));
  return newUser;
};

/**
 * Google Sign-in Popup via Firebase
 */
export const firebaseSignInGoogle = async () => {
  if (isRealFirebase && import.meta.env.VITE_FIREBASE_API_KEY) {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      return {
        uid: result.user.uid,
        email: result.user.email,
        displayName: result.user.displayName,
        photoURL: result.user.photoURL,
      };
    } catch (err) {
      console.warn('Firebase Google popup failed:', err.message);
      throw err;
    }
  }

  // Demo fallback
  return {
    uid: `firebase_google_${Date.now()}`,
    email: 'otaku.master@gmail.com',
    displayName: 'Otaku Master',
    photoURL: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
  };
};

/**
 * Sign out from Firebase
 */
export const firebaseSignOut = async () => {
  if (isRealFirebase && auth) {
    try {
      await signOut(auth);
    } catch (e) {
      // silent
    }
  }
};

/**
 * Listen to persistent auth state
 */
export const onFirebaseAuthStateChanged = (callback) => {
  if (isRealFirebase && auth) {
    return onAuthStateChanged(auth, callback);
  }
  return () => {};
};

export { auth };
