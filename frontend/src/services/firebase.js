// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from "firebase/auth";
import { getAnalytics } from "firebase/analytics";

// Your web app's Firebase configuration with built-in default for smart-sales-ai-3f399
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDxNGP8qUf2UP1SlYYG76OPfKSq9tqOWAE",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "smart-sales-ai-3f399.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "smart-sales-ai-3f399",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "smart-sales-ai-3f399.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "532092098670",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:532092098670:web:22736137c26d61c370ae7f",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-S5V6TFJ759"
};

let app = null;
let auth = null;
let googleProvider = null;
let analytics = null;

try {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  googleProvider = new GoogleAuthProvider();
  googleProvider.setCustomParameters({ prompt: 'select_account' });
  console.log('[Auth Flow] Firebase initialized successfully with project:', firebaseConfig.projectId);

  if (typeof window !== 'undefined') {
    try {
      analytics = getAnalytics(app);
    } catch (err) {
      console.warn("[Auth Flow] Firebase Analytics unavailable:", err);
    }
  }
} catch (err) {
  console.error("[Auth Flow] Firebase initialization error:", err);
}

export { auth, googleProvider, signInWithPopup, signOut, onAuthStateChanged, analytics };
