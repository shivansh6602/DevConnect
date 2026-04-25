// firebase.js (FINAL CLEAN)

import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyCaxUr1ntuMYNlp_kck91SYLi74wFtuao0",
  authDomain: "devconnect-b8951.firebaseapp.com",
  projectId: "devconnect-b8951",
  storageBucket: "devconnect-b8951.firebasestorage.app",
  messagingSenderId: "227637822260",
  appId: "1:227637822260:web:5133963ff9ab7e163f1b61"
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const storage = getStorage(app);