import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyA_BtDdU1w8O2Q9hdpkIjNE4r_WOJ48Dk4",
  authDomain: "viral-c349c.firebaseapp.com",
  projectId: "viral-c349c",
  storageBucket: "viral-c349c.firebasestorage.app",
  messagingSenderId: "942005736898",
  appId: "1:942005736898:web:66315a2a6af4c3e311725b",
  measurementId: "G-ZENEX53EF2"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

