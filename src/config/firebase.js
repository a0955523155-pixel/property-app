// src/config/firebase.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyAxELFGabX9RUTrns_OaHsM6RQI1W1uEP4",
  authDomain: "dacheng-special-account.firebaseapp.com",
  projectId: "dacheng-special-account",
  storageBucket: "dacheng-special-account.firebasestorage.app",
  messagingSenderId: "957257517706",
  appId: "1:957257517706:web:1f7c92d5306cff22f3fb73",
  measurementId: "G-9KN37FLNWF"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);