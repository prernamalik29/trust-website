import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Firebase client SDK config — these values are intentionally public.
// Security is enforced via Firestore Security Rules on the server side.
const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY            || 'AIzaSyC-G2kBTJNlnfblwaFiEItDOhZ1Hwivpbg',
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN        || 'trust-website-5a814.firebaseapp.com',
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID         || 'trust-website-5a814',
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET     || 'trust-website-5a814.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '925990180836',
  appId:             import.meta.env.VITE_FIREBASE_APP_ID             || '1:925990180836:web:361209601e5077d2efd9f1',
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export default app;
