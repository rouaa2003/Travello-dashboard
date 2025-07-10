// src/firebase.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";


const firebaseConfig = {
  apiKey: "AIzaSyALoIzCBNDTMzYfMAy5BuaA1wvajy078tY",
  authDomain: "travelloproject-ebf9d.firebaseapp.com",
  projectId: "travelloproject-ebf9d",
  storageBucket: "travelloproject-ebf9d.firebasestorage.app",
  messagingSenderId: "458820222941",
  appId: "1:458820222941:web:47c3ffe5b006c3d6838034"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export Firestore instance
export const db = getFirestore(app);
