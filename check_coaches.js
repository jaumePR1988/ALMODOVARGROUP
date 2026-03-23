const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs } = require('firebase/firestore');

const firebaseConfig = {
    apiKey: process.env.VITE_FIREBASE_API_KEY || "YOUR_API_KEY", // Note: The app uses a .env file, so we need to parse it
};
// Actually it's easier to just read the `coaches` from the actual project firebase config. 
// Let's use `firebase-tools` or write a quick node script that reads `.env` and connects.
