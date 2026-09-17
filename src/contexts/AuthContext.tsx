import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  updateProfile,
  signInWithPhoneNumber,
  RecaptchaVerifier,
  signOut, 
  type User,
  type ConfirmationResult
} from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db, googleProvider } from '../config/firebase';
import type { UserProfile } from '../types';

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  error: string | null;
  clearError: () => void;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, pass: string) => Promise<void>;
  signUpWithEmail: (email: string, pass: string, name?: string) => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
  sendPhoneOtp: (phoneNumber: string, containerId: string) => Promise<boolean>;
  verifyPhoneOtp: (otpCode: string) => Promise<void>;
  signOutUser: () => Promise<void>;
  continueAsGuest: () => void;
  isGuest: boolean;
  phoneConfirmationWaiting: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const GUEST_PROFILE: UserProfile = {
  uid: 'guest_user',
  email: 'guest@secondbrain.local',
  displayName: 'Guest Architect',
  photoURL: null,
  isAnonymous: true
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isGuest, setIsGuest] = useState(() => {
    try {
      return localStorage.getItem('sb_guest_session') === 'true';
    } catch {
      return false;
    }
  });

  const [user, setUser] = useState<UserProfile | null>(() => {
    try {
      if (localStorage.getItem('sb_guest_session') === 'true') {
        return GUEST_PROFILE;
      }
    } catch {
      // ignore
    }
    return null;
  });

  const [loading, setLoading] = useState(() => {
    // If guest session is already stored, we are immediately ready
    try {
      if (localStorage.getItem('sb_guest_session') === 'true') {
        return false;
      }
    } catch {
      // ignore
    }
    return true;
  });
  const [error, setError] = useState<string | null>(null);
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);

  const clearError = () => setError(null);

  // Sync user profile to Firestore (background, non-blocking)
  const recordUserInFirestore = async (fbUser: User) => {
    if (!db) return;
    try {
      const userRef = doc(db, 'users', fbUser.uid);
      await setDoc(userRef, {
        uid: fbUser.uid,
        email: fbUser.email || null,
        displayName: fbUser.displayName || null,
        phoneNumber: fbUser.phoneNumber || null,
        photoURL: fbUser.photoURL || null,
        lastLoginAt: serverTimestamp()
      }, { merge: true });
    } catch (err) {
      console.warn('Firestore user sync notification (rules or offline):', err);
    }
  };

  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }

    // Safety timeout: Ensure loading never hangs indefinitely in iframes/network lag
    const safetyTimer = setTimeout(() => {
      setLoading(false);
    }, 1200);

    let unsubscribe = () => {};

    try {
      unsubscribe = onAuthStateChanged(
        auth,
        (firebaseUser: User | null) => {
          clearTimeout(safetyTimer);
          if (firebaseUser) {
            const profile: UserProfile = {
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              displayName: firebaseUser.displayName,
              photoURL: firebaseUser.photoURL,
              isAnonymous: firebaseUser.isAnonymous
            };
            setUser(profile);
            setIsGuest(false);
            try {
              localStorage.removeItem('sb_guest_session');
            } catch {
              // ignore
            }
            // Non-blocking fire-and-forget sync
            recordUserInFirestore(firebaseUser).catch((err) => {
              console.warn('Background user record warning:', err);
            });
          } else {
            // If already a guest session, do not wipe it
            try {
              const savedGuest = localStorage.getItem('sb_guest_session') === 'true';
              if (!savedGuest) {
                setUser(null);
              }
            } catch {
              setUser(null);
            }
          }
          setLoading(false);
        },
        (err) => {
          clearTimeout(safetyTimer);
          console.warn('Auth state subscription warning:', err);
          setError(err.message);
          setLoading(false);
        }
      );
    } catch (e) {
      clearTimeout(safetyTimer);
      console.warn('Failed to listen to auth state change:', e);
      setLoading(false);
    }

    return () => {
      clearTimeout(safetyTimer);
      unsubscribe();
    };
  }, []);

  const parseAuthError = (err: unknown, fallbackMessage: string): string => {
    const authError = err as { code?: string; message?: string };
    console.error('Firebase Auth Error:', authError);

    switch (authError.code) {
      case 'auth/configuration-not-found':
        return 'Provider is not enabled in Firebase Console for project "shan-second-brain". Please enable it under Build > Authentication > Sign-in method.';
      case 'auth/user-not-found':
      case 'auth/wrong-password':
      case 'auth/invalid-credential':
        return 'Invalid email or password. Please verify your credentials.';
      case 'auth/email-already-in-use':
        return 'An account with this email address already exists.';
      case 'auth/weak-password':
        return 'Password is too weak. Please use at least 6 characters.';
      case 'auth/invalid-phone-number':
        return 'Invalid phone number format. Please include country code (e.g. +1... or +91...).';
      case 'auth/invalid-verification-code':
        return 'Invalid verification code. Please check the SMS and try again.';
      case 'auth/code-expired':
        return 'SMS code has expired. Please request a new verification code.';
      case 'auth/popup-blocked':
        return 'Sign-in popup was blocked by your browser. Please allow popups or use preview mode.';
      case 'auth/cancelled-popup-request':
      case 'auth/popup-closed-by-user':
        return 'Sign-in window was closed before completing.';
      case 'auth/unauthorized-domain':
        return `Domain (${window.location.hostname}) is not yet authorized in Firebase Console > Authentication > Settings > Authorized domains.`;
      case 'auth/too-many-requests':
        return 'Too many requests. Please wait a few moments before trying again.';
      default:
        return authError.message || fallbackMessage;
    }
  };

  // 1. Google Sign-In
  const signInWithGoogle = async () => {
    clearError();
    if (!auth || !googleProvider) {
      setError('Firebase authentication is not initialized.');
      return;
    }

    try {
      setLoading(true);
      await signInWithPopup(auth, googleProvider);
    } catch (err: unknown) {
      setError(parseAuthError(err, 'Failed to sign in with Google.'));
    } finally {
      setLoading(false);
    }
  };

  // 2. Email / Password Sign-In
  const signInWithEmail = async (email: string, pass: string) => {
    clearError();
    if (!auth) {
      setError('Firebase auth is not initialized.');
      return;
    }
    try {
      setLoading(true);
      await signInWithEmailAndPassword(auth, email.trim(), pass);
    } catch (err: unknown) {
      setError(parseAuthError(err, 'Failed to sign in with email.'));
    } finally {
      setLoading(false);
    }
  };

  // 3. Email / Password Registration
  const signUpWithEmail = async (email: string, pass: string, name?: string) => {
    clearError();
    if (!auth) {
      setError('Firebase auth is not initialized.');
      return;
    }
    try {
      setLoading(true);
      const cred = await createUserWithEmailAndPassword(auth, email.trim(), pass);
      if (name && cred.user) {
        await updateProfile(cred.user, { displayName: name.trim() });
      }
    } catch (err: unknown) {
      setError(parseAuthError(err, 'Failed to register account.'));
    } finally {
      setLoading(false);
    }
  };

  // 4. Password Reset
  const sendPasswordReset = async (email: string) => {
    clearError();
    if (!auth) {
      setError('Firebase auth is not initialized.');
      return;
    }
    try {
      setLoading(true);
      await sendPasswordResetEmail(auth, email.trim());
    } catch (err: unknown) {
      setError(parseAuthError(err, 'Failed to send password reset email.'));
    } finally {
      setLoading(false);
    }
  };

  // 5. Phone Authentication: Send OTP
  const sendPhoneOtp = async (phoneNumber: string, containerId: string): Promise<boolean> => {
    clearError();
    if (!auth) {
      setError('Firebase auth is not initialized.');
      return false;
    }
    try {
      setLoading(true);
      // Clean up previous reCAPTCHA if exists on window
      const win = window as unknown as { recaptchaVerifier?: RecaptchaVerifier };
      if (!win.recaptchaVerifier) {
        win.recaptchaVerifier = new RecaptchaVerifier(auth, containerId, {
          size: 'invisible'
        });
      }

      const confirmation = await signInWithPhoneNumber(
        auth, 
        phoneNumber.trim(), 
        win.recaptchaVerifier
      );
      setConfirmationResult(confirmation);
      return true;
    } catch (err: unknown) {
      setError(parseAuthError(err, 'Failed to send phone verification SMS.'));
      return false;
    } finally {
      setLoading(false);
    }
  };

  // 6. Phone Authentication: Confirm OTP
  const verifyPhoneOtp = async (otpCode: string) => {
    clearError();
    if (!confirmationResult) {
      setError('No pending phone verification. Please request an SMS code first.');
      return;
    }
    try {
      setLoading(true);
      await confirmationResult.confirm(otpCode.trim());
      setConfirmationResult(null);
    } catch (err: unknown) {
      setError(parseAuthError(err, 'Invalid or expired SMS code.'));
    } finally {
      setLoading(false);
    }
  };

  // Sign out
  const signOutUser = async () => {
    clearError();
    if (isGuest) {
      setIsGuest(false);
      localStorage.removeItem('sb_guest_session');
      setUser(null);
      return;
    }

    if (auth) {
      try {
        await signOut(auth);
      } catch (err: unknown) {
        setError(parseAuthError(err, 'Failed to sign out.'));
      }
    }
    setUser(null);
  };

  const continueAsGuest = () => {
    setIsGuest(true);
    localStorage.setItem('sb_guest_session', 'true');
    setUser({
      uid: 'guest_user',
      email: 'guest@secondbrain.local',
      displayName: 'Guest Architect',
      photoURL: null,
      isAnonymous: true
    });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        clearError,
        signInWithGoogle,
        signInWithEmail,
        signUpWithEmail,
        sendPasswordReset,
        sendPhoneOtp,
        verifyPhoneOtp,
        signOutUser,
        continueAsGuest,
        isGuest: isGuest || (user?.isAnonymous ?? false),
        phoneConfirmationWaiting: !!confirmationResult
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
