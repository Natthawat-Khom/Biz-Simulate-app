import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getAnalytics, isSupported } from 'firebase/analytics';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyBfC7Oi93ZkI2BNDJPk7GA9LfUmqPCVLMo",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "biz-simulate-app.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "biz-simulate-app",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "biz-simulate-app.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "555087059519",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:555087059519:web:82982a6d5ff9adc55bf68a",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-HVF01DPRWE"
};

export const isFirebaseConfigured = true;

// Initialize Firebase App
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Firestore & Auth
export const db = getFirestore(app);
export const auth = getAuth(app);

// Initialize Analytics if supported in browser environment
export let analytics = null;
if (typeof window !== 'undefined') {
  isSupported().then((supported) => {
    if (supported) {
      analytics = getAnalytics(app);
    }
  }).catch((err) => {
    console.warn("Analytics initialization notice:", err);
  });
}

export default app;
