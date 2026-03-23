import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";

const firebaseConfig = {
    apiKey: process.env.VITE_FIREBASE_API_KEY,
    authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function run() {
    const usersSnap = await getDocs(collection(db, 'users'));
    console.log('USERS:');
    usersSnap.forEach(u => console.log(u.id, u.data().email, u.data().role));

    const classesSnap = await getDocs(collection(db, 'classes'));
    console.log('\nCLASSES:');
    classesSnap.forEach(c => console.log(c.id, c.data().title, c.data().coachId, c.data().coachName));
    process.exit(0);
}

run();
