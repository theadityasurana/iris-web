import { initializeApp, getApps } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithCredential,
  initializeAuth,
  // @ts-ignore - getReactNativePersistence is available via React Native bundle resolution
  getReactNativePersistence,
} from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
let GoogleSignin: any = null;
try {
  GoogleSignin = require('@react-native-google-signin/google-signin').GoogleSignin;
} catch (e) {
  // Native module not available (Expo Go)  - Google Sign-In will be handled gracefully
}

const firebaseConfig = {
  apiKey: "AIzaSyChiUgVEE_-Qr24xG1cDMriELc7NbVwgzU",
  authDomain: "nextquark-1.firebaseapp.com",
  projectId: "nextquark-1",
  storageBucket: "nextquark-1.firebasestorage.app",
  messagingSenderId: "785222584965",
  appId: "1:785222584965:web:d802042cce0b7853b477ec",
  measurementId: "G-D43VQ8QGEH",
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const firebaseAuth =
  Platform.OS === 'web'
    ? getAuth(app)
    : initializeAuth(app, { persistence: getReactNativePersistence(AsyncStorage) });

// Web client ID from google-services.json (client_type: 3)
export const GOOGLE_WEB_CLIENT_ID =
  '785222584965-29ja5icef490gfc45qd5kjis2hjrdkpq.apps.googleusercontent.com';

if (GoogleSignin) {
  try {
    GoogleSignin.configure({
      webClientId: GOOGLE_WEB_CLIENT_ID,
      offlineAccess: false,
    });
  } catch (e) {
    // configure may fail if native module isn't linked
  }
}

/**
 * Native Google Sign-In → returns both Google ID token (for Supabase) and Firebase JWT
 */
export async function nativeGoogleSignIn(): Promise<{ googleIdToken: string; firebaseToken: string } | null> {
  if (!GoogleSignin) {
    throw new Error('Google Sign-In requires a custom development build. It is not available in Expo Go.');
  }

  await GoogleSignin.hasPlayServices();
  try { await GoogleSignin.signOut(); } catch (_) {}
  const response = await GoogleSignin.signIn();

  if (!response.data?.idToken) return null;

  const googleIdToken = response.data.idToken;

  const credential = GoogleAuthProvider.credential(googleIdToken);
  const result = await signInWithCredential(firebaseAuth, credential);
  const firebaseToken = await result.user.getIdToken();

  return { googleIdToken, firebaseToken };
}
