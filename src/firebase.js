// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAxELFGabX9RUTrns_OaHsM6RQI1W1uEP4",
  authDomain: "dacheng-special-account.firebaseapp.com",
  projectId: "dacheng-special-account",
  storageBucket: "dacheng-special-account.firebasestorage.app",
  messagingSenderId: "957257517706",
  appId: "1:957257517706:web:1f7c92d5306cff22f3fb73",
  measurementId: "G-9KN37FLNWF"
};

// 初始化 Firebase
const app = initializeApp(firebaseConfig);

// ⚠️ 關鍵修正：加上 'export' 讓 App.jsx 可以讀取到 db
export const db = getFirestore(app);