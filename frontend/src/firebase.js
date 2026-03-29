// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCaxUr1ntuMYNlp_kck91SYLi74wFtuao0",
  authDomain: "devconnect-b8951.firebaseapp.com",
  projectId: "devconnect-b8951",
  storageBucket: "devconnect-b8951.firebasestorage.app",
  messagingSenderId: "227637822260",
  appId: "1:227637822260:web:5133963ff9ab7e163f1b61"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);