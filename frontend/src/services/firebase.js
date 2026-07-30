// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from "firebase/auth";
import { getAnalytics } from "firebase/analytics";

// Your web app's Firebase configuration read from environment variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "smart-sales-ai-3f399.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "smart-sales-ai-3f399",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "smart-sales-ai-3f399.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "532092098670",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:532092098670:web:22736137c26d61c370ae7f",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-S5V6TFJ759"
};

// Gracefully initialize Firebase — if the API key is missing/empty (e.g. on
// GitHub Pages where env vars are not injected), skip initialization so the
// rest of the React app can still render without auth.
let app = null;
let auth = null;
let googleProvider = null;
let analytics = null;

const hasValidApiKey = firebaseConfig.apiKey && firebaseConfig.apiKey.length > 0;

if (hasValidApiKey) {
  try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    googleProvider = new GoogleAuthProvider();

    if (typeof window !== 'undefined') {
      try {
        analytics = getAnalytics(app);
      } catch (err) {
        console.warn("Firebase Analytics disabled or unavailable:", err);
      }
    }
  } catch (err) {
    console.warn("Firebase initialization failed:", err);
  }
} else {
  console.warn(
    "Firebase API key not configured. Auth features will be disabled. " +
    "Set VITE_FIREBASE_API_KEY in your environment to enable authentication."
  );
}

export { auth, googleProvider, signInWithPopup, signOut, onAuthStateChanged, analytics };
