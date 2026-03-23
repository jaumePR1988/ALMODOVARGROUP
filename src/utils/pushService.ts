import { getToken, isSupported, deleteToken } from 'firebase/messaging';
import { doc, getDoc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db, messaging } from '../firebase';

export const requestPushPermissions = async (userId: string) => {
    try {
        const supported = await isSupported();
        if (!supported) {
            console.log('[pushService] El navegador nativo no soporta notificaciones push.');
            return;
        }

        // Request permission built-in browser popup
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
            const token = await getToken(messaging, {
                // Genera o lee el token web push usando la clave VAPID por defecto
                // Para producción se recomienda usar una clave VAPID de los Firebase Project Settings (Cloud Messaging -> Web Push certs)
            });

            if (token) {
                console.log('[pushService] Token FCM obtenido correctamente:', token);
                await saveTokenToFirestore(userId, token);
            } else {
                console.log('[pushService] No se pudo obtener el token FCM.');
            }
        } else {
            console.log('[pushService] Permiso denegado por el usuario.');
        }
    } catch (error) {
        console.error('[pushService] Error solicitando permisos o token:', error);
    }
};

const saveTokenToFirestore = async (userId: string, token: string) => {
    try {
        const userRef = doc(db, 'users', userId);
        const userDoc = await getDoc(userRef);
        
        if (userDoc.exists()) {
            const data = userDoc.data();
            const existingTokens = data.fcmTokens || [];
            
            if (!existingTokens.includes(token)) {
                await updateDoc(userRef, {
                    fcmTokens: arrayUnion(token)
                });
                console.log('[pushService] Token FCM guardado en Firebase.');
            }
        }
    } catch (error) {
        console.error('[pushService] Error guardando token en Firestore:', error);
    }
};

export const removePushToken = async (userId: string) => {
    try {
        const supported = await isSupported();
        if (!supported) return;

        const currentToken = await getToken(messaging).catch(() => null);
        
        if (currentToken) {
            const userRef = doc(db, 'users', userId);
            await updateDoc(userRef, {
                fcmTokens: arrayRemove(currentToken)
            });
            console.log('[pushService] Token FCM eliminado de Firebase en Logout.');
            
            // Delete token locally
            await deleteToken(messaging);
        }
    } catch (error) {
        console.error('[pushService] Error eliminando push token en Logout:', error);
    }
};
