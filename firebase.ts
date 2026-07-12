import { initializeApp } from "firebase/app";
import { getFirestore, initializeFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: (import.meta as any).env?.VITE_FIREBASE_API_KEY || "use your own api key here",
  authDomain: (import.meta as any).env?.VITE_FIREBASE_AUTH_DOMAIN || "studio-4901030288-6e618.firebaseapp.com",
  projectId: (import.meta as any).env?.VITE_FIREBASE_PROJECT_ID || "studio-4901030288-6e618",
  storageBucket: (import.meta as any).env?.VITE_FIREBASE_STORAGE_BUCKET || "studio-4901030288-6e618.firebasestorage.app",
  messagingSenderId: (import.meta as any).env?.VITE_FIREBASE_MESSAGING_SENDER_ID || "782545047998",
  appId: (import.meta as any).env?.VITE_FIREBASE_APP_ID || "1:782545047998:web:64c372d310b92d515f69ef"
};

const app = initializeApp(firebaseConfig);
export const db = initializeFirestore(app, { experimentalForceLongPolling: true });
export const auth = getAuth(app);
