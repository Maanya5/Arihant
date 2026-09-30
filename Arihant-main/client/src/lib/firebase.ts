import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyAPEx-7q1jR4mcddkwIl50ZkYtQbqvnOVU",
  authDomain: "arihant-o1745.firebaseapp.com",
  projectId: "arihant-o1745",
  storageBucket: "arihant-o1745.firebasestorage.app",
  messagingSenderId: "1032620979078",
  appId: "1:1032620979078:web:55676352793b7d1315b207",
  measurementId: "G-TQ3RXK2J3S"
};

// Initialize Firebase
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

export { auth, googleProvider };
