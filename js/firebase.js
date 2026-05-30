//authentication
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-firestore.js";

const firebaseConfig = { 
    apiKey: "AIzaSyC4Ze36Bk-upfxN_8C3mBI97farpv9VPmg",  
    authDomain: "zombie-survivor-game-7e297.firebaseapp.com",
    projectId: "zombie-survivor-game-7e297",
    storageBucket: "zombie-survivor-game-7e297.firebasestorage.app",
    messagingSenderId: "987035460836",
    appId: "1:987035460836:web:9d1e83b902339de1a338f1",
    measurementId: "G-TVWM0VTZT7"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);