import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getAnalytics } from 'firebase/analytics';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBWoyifcTTOI1NA1S0tkAVwO1JZ45gwij0",
  authDomain: "web-quizz-bcn.firebaseapp.com",
  projectId: "web-quizz-bcn",
  storageBucket: "web-quizz-bcn.firebasestorage.app",
  messagingSenderId: "408708530141",
  appId: "1:408708530141:web:e5fc85bae689fa843e4034",
  measurementId: "G-QG8Y75WW42"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore Database
export const db = getFirestore(app);

// Initialize Firebase Authentication
export const auth = getAuth(app);

// Initialize Analytics (optional)
export const analytics = getAnalytics(app);

export default app;
