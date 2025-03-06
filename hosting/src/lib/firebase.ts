import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBPxNpjlx2UGD0j1tom8-i2GOlzUekigFc",
  authDomain: "balltalkbeta.firebaseapp.com",
  projectId: "balltalkbeta",
  storageBucket: "balltalkbeta.firebasestorage.app",
  messagingSenderId: "628814403087",
  appId: "1:628814403087:web:8fa13594e0608f5c2a357a",
  measurementId: "G-5EH47PRLZP"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);

// Log when Firebase is initialized
console.log('Firebase initialized successfully');

export { app, db, auth, storage };
