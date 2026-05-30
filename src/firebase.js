// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBDJ05hxbI4hkiAOGu9FMJuWykDbx5LtF0",
  authDomain: "dobro-spienje.firebaseapp.com",
  projectId: "dobro-spienje",
  storageBucket: "dobro-spienje.firebasestorage.app",
  messagingSenderId: "553680058242",
  appId: "1:553680058242:web:49b72eaa9cb35e7e74019b",
  databaseURL: "https://dobro-spienje-default-rtdb.europe-west1.firebasedatabase.app/"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
