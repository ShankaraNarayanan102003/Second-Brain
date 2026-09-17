import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';

export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyD1SNXzu6XbpGFeGWK5v_sB7i8oX82RqmY',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'shan-second-brain.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'shan-second-brain',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'shan-second-brain.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '438822684403',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:438822684403:web:28ef46be76db2ff2bed986',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || 'G-NYZDRFV4HF'
};

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let googleProvider: GoogleAuthProvider | null = null;

try {
  if (!getApps().length) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApps()[0];
  }
  auth = getAuth(app);
  db = getFirestore(app);
  googleProvider = new GoogleAuthProvider();
  googleProvider.setCustomParameters({
    prompt: 'select_account'
  });
} catch (error) {
  console.warn('Firebase initialization notice:', error);
}

export { app, auth, db, googleProvider };

