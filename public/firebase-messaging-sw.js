// Guía oficial Firebase v9+ para Service Workers:
// Importamos los scripts vía CDN porque el Service Worker no pasa por el bundler (Vite).
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js');

const firebaseConfig = {
    apiKey: "AIzaSyCxEzgd1B80JMr7wcQ-A4sCLA8-xQkBpf0",
    authDomain: "almodovar-box-2026.firebaseapp.com",
    projectId: "almodovar-box-2026",
    storageBucket: "almodovar-box-2026.firebasestorage.app",
    messagingSenderId: "1025260999524",
    appId: "1:1025260999524:web:174319ea259396248d6071"
};

firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
    console.log('[firebase-messaging-sw.js] Mensaje en background recibido.', payload);
    const notificationTitle = payload.notification.title;
    const notificationOptions = {
        body: payload.notification.body,
        icon: '/pwa-192x192.png',
        badge: '/pwa-192x192.png',
        data: payload.data
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
});
