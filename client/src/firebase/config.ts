import { initializeApp, FirebaseApp } from 'firebase/app';
import { Auth, getAuth } from 'firebase/auth';
import { Firestore, getFirestore } from 'firebase/firestore';

interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  measurementId: string;
}

const firebaseConfig: FirebaseConfig = {
  apiKey: process.env['REACT_APP_FIREBASE_API_KEY'] || "AIzaSyD_XSYIaZF2l5FIVrwLn0TxwHGx2vk1w30",
  authDomain: process.env['REACT_APP_FIREBASE_AUTH_DOMAIN'] || "daanarx-a.firebaseapp.com",
  projectId: process.env['REACT_APP_FIREBASE_PROJECT_ID'] || "daanarx-a",
  storageBucket: process.env['REACT_APP_FIREBASE_STORAGE_BUCKET'] || "daanarx-a.firebasestorage.app",
  messagingSenderId: process.env['REACT_APP_FIREBASE_MESSAGING_SENDER_ID'] || "82771122027",
  appId: process.env['REACT_APP_FIREBASE_APP_ID'] || "1:82771122027:web:6dd919fc4e8a199c899e2e",
  measurementId: process.env['REACT_APP_FIREBASE_MEASUREMENT_ID'] || "G-0JH1LWE1RQ"
};

// Initialize Firebase
const app: FirebaseApp = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth: Auth = getAuth(app);
export const db: Firestore = getFirestore(app);

export default app;

