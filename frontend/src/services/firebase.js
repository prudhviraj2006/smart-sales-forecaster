// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from "firebase/auth";
import { getAnalytics } from "firebase/analytics";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDxNGP8qUf2UP1SlYYG76OPfKSq9tqOWAE",
  authDomain: "smart-sales-ai-3f399.firebaseapp.com",
  projectId: "smart-sales-ai-3f399",
  storageBucket: "smart-sales-ai-3f399.firebasestorage.app",
  messagingSenderId: "532092098670",
  appId: "1:532092098670:web:22736137c26d61c370ae7f",
  measurementId: "G-S5V6TFJ759"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();
const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;

export { auth, googleProvider, signInWithPopup, signOut, onAuthStateChanged };
