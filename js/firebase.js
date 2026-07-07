import { getFirestore } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyA3g4YCBt0XvSMu75VOKopPHrl8vAh2Fww",
  authDomain: "gunbatimi-cafe.firebaseapp.com",
  projectId: "gunbatimi-cafe",
  storageBucket: "gunbatimi-cafe.firebasestorage.app",
  messagingSenderId: "759950518508",
  appId: "1:759950518508:web:ac2329fa13cc8efad31dc9"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

export { auth, db };
