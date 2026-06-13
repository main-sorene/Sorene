import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { Auth, getAuth, GoogleAuthProvider } from "firebase/auth";
import { FirebaseStorage, getStorage } from "firebase/storage";
import { Firestore, getFirestore } from "firebase/firestore";
import { Analytics, getAnalytics, isSupported } from "firebase/analytics";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

let app: FirebaseApp | undefined;
let auth: Auth | undefined;
let storage: FirebaseStorage | undefined;
let db: Firestore | undefined;
let provider: GoogleAuthProvider | undefined;
let analytics: Analytics | undefined;

function initializeFirebase() {
  if (typeof window === "undefined") return;
  if (!firebaseConfig.apiKey) {
    console.warn(
      "Firebase API key is not set. Please add your Firebase config to .env.local",
    );
    return;
  }

  try {
    app = getApps().length ? getApp() : initializeApp(firebaseConfig);
    auth = getAuth(app);
    storage = getStorage(app);
    db = getFirestore(app);
    provider = new GoogleAuthProvider();
    provider.setCustomParameters({
      prompt: "select_account",
    });
    // Initialise Analytics only when supported (requires measurementId)
    if (firebaseConfig.measurementId) {
      isSupported().then((supported) => {
        if (supported && app) analytics = getAnalytics(app);
      });
    }
  } catch (error) {
    console.error("Firebase initialization failed:", error);
  }
}

initializeFirebase();

export { app, auth, provider, storage, db, analytics };
