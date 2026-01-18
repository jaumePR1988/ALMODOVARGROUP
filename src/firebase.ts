import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyCxEzgd1B80JMr7wcQ-A4sCLA8-xQkBpf0",
    authDomain: "almodovar-box-2026.firebaseapp.com",
    projectId: "almodovar-box-2026",
    storageBucket: "almodovar-box-2026.firebasestorage.app",
    messagingSenderId: "1025260999524",
    appId: "1:1025260999524:web:174319ea259396248d6071"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Services
export const db = getFirestore(app);
export const auth = getAuth(app);

export default app;
