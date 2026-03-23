"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkWeeklyOpening = exports.onNotificationCreated = exports.onReservationCancelled = void 0;
const functions = require("firebase-functions");
const admin = require("firebase-admin");
admin.initializeApp();
const db = admin.firestore();
// Trigger que salta cuando un documento de 'reservations' es ELIMINADO
exports.onReservationCancelled = functions.firestore
    .document('reservations/{reservationId}')
    .onDelete(async (snap, context) => {
    const deletedReservation = snap.data();
    const classId = deletedReservation.classId;
    const classDate = deletedReservation.classDate;
    if (!classId)
        return;
    console.log(`Reserva cancelada para la clase ${classId} el día ${classDate}. Revisando Waitlist...`);
    // ------------------------------------------------------------------------------------------ //
    // Módulo Arquitectónico: Waitlist Queue Leap & Push Notification (A implementar en Fase 6)
    // ------------------------------------------------------------------------------------------ //
    /*
    const waitlistRef = db.collection('waitlist')
        .where('classId', '==', classId)
        .where('classDate', '==', classDate)
        .orderBy('timestamp', 'asc')
        .limit(1);
    
    const snapshot = await waitlistRef.get();

    if (snapshot.empty) {
      console.log('Nadie apuntado en la lista de espera para este hueco.');
      return;
    }

    const nextUserDoc = snapshot.docs[0];
    const nextUser = nextUserDoc.data();

    // 1. Asegurar plaza temporalmente con estado "PENDING_RESPONSE"
    await nextUserDoc.ref.update({
        status: 'PENDING_RESPONSE',
        notifiedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // 2. Avisar mediante Notificación Push (FCM) al usuario seleccionado
    const userDoc = await db.collection('users').doc(nextUser.userId).get();
    const fcmToken = userDoc.data()?.fcmToken;

    if (fcmToken) {
      await admin.messaging().send({
        token: fcmToken,
        notification: {
          title: '¡Se ha liberado una plaza! 🏋️‍♂️',
          body: 'Tienes 15 minutos para aceptar tu hueco en clase.'
        }
      });
      console.log(`Push Notification enviada con éxito al usuario ${nextUser.userId}`);
    }

    // 3. TTL Cron Job gestionará los Timeout (si no aceptan, salta al siguiente).
    */
});
// ── FCM PUSH NOTIFICATIONS: Send Push when a notification is created ──
exports.onNotificationCreated = functions.firestore
    .document('notifications/{notificationId}')
    .onCreate(async (snap, context) => {
    const notificationData = snap.data();
    const userId = notificationData.userId;
    const title = notificationData.title || 'Nueva Notificación';
    const body = notificationData.message || '';
    if (!userId) {
        console.log('Skipping push, no userId provided.');
        return;
    }
    try {
        const userDoc = await db.collection('users').doc(userId).get();
        if (!userDoc.exists) {
            console.log(`User ${userId} not found.`);
            return;
        }
        const userData = userDoc.data();
        const fcmTokens = (userData === null || userData === void 0 ? void 0 : userData.fcmTokens) || [];
        if (fcmTokens.length === 0) {
            console.log(`User ${userId} has no registered FCM tokens.`);
            return;
        }
        console.log(`Sending push to ${fcmTokens.length} devices for user ${userId}.`);
        const payload = {
            notification: {
                title,
                body,
            },
            data: {
                notificationId: context.params.notificationId,
                type: notificationData.type || 'info',
            }
        };
        const response = await admin.messaging().sendMulticast(Object.assign({ tokens: fcmTokens }, payload));
        // Cleanup invalid or expired tokens
        if (response.failureCount > 0) {
            const failedTokens = [];
            response.responses.forEach((resp, idx) => {
                if (!resp.success) {
                    const error = resp.error;
                    if ((error === null || error === void 0 ? void 0 : error.code) === 'messaging/invalid-registration-token' ||
                        (error === null || error === void 0 ? void 0 : error.code) === 'messaging/registration-token-not-registered') {
                        failedTokens.push(fcmTokens[idx]);
                    }
                }
            });
            if (failedTokens.length > 0) {
                console.log(`Cleaning up ${failedTokens.length} invalid tokens for user ${userId}.`);
                await db.collection('users').doc(userId).update({
                    fcmTokens: admin.firestore.FieldValue.arrayRemove(...failedTokens)
                });
            }
        }
    }
    catch (error) {
        console.error('Error sending push notification:', error);
    }
});
// ── SCHEDULED PUBLISH: Check every 15 minutes if it is time to open the new week ──
exports.checkWeeklyOpening = functions.pubsub.schedule('every 15 minutes').onRun(async (context) => {
    var _a, _b, _c;
    try {
        const rulesDoc = await db.collection('settings').doc('reservationRules').get();
        if (!rulesDoc.exists)
            return;
        const data = rulesDoc.data();
        const unlockDayIndex = (_a = data === null || data === void 0 ? void 0 : data.unlockDayIndex) !== null && _a !== void 0 ? _a : 6; // Default Saturday
        const unlockTime = (_b = data === null || data === void 0 ? void 0 : data.unlockTime) !== null && _b !== void 0 ? _b : '10:00';
        // Obtener la hora actual en la zona horaria de España (Madrid)
        const now = new Date();
        const formatter = new Intl.DateTimeFormat('en-US', {
            timeZone: 'Europe/Madrid',
            weekday: 'short', year: 'numeric', month: 'short', day: '2-digit',
            hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
        });
        const parts = formatter.formatToParts(now);
        const getPart = (type) => { var _a; return (_a = parts.find(p => p.type === type)) === null || _a === void 0 ? void 0 : _a.value; };
        // Convertir el día de la semana (Sun-Sat) al índice (0=Dom, 1=Lun... 6=Sab)
        const weekdayMapping = {
            'Sun': 0, 'Mon': 1, 'Tue': 2, 'Wed': 3, 'Thu': 4, 'Fri': 5, 'Sat': 6
        };
        const currentDayIndex = weekdayMapping[getPart('weekday') || 'Sun'];
        const currentHour = parseInt(getPart('hour') || '0', 10);
        const currentMinute = parseInt(getPart('minute') || '0', 10);
        const targetHour = parseInt(unlockTime.split(':')[0], 10);
        const targetMinute = parseInt(unlockTime.split(':')[1], 10);
        // Convert current and target to total minutes for easier comparison
        const currentTotalMinutes = currentHour * 60 + currentMinute;
        const targetTotalMinutes = targetHour * 60 + targetMinute;
        // Comprobar si es el día y la hora configurada (dando un margen de 15 mins ya que corre cada 15 mins)
        if (currentDayIndex === unlockDayIndex &&
            currentTotalMinutes >= targetTotalMinutes &&
            currentTotalMinutes < targetTotalMinutes + 15) {
            // Check if we already sent it this week
            const lastPushDocRef = db.collection('settings').doc('lastGlobalPush');
            const lastPushDoc = await lastPushDocRef.get();
            const lastPushDate = (_c = lastPushDoc.data()) === null || _c === void 0 ? void 0 : _c.date;
            // Simple check: if the last push was today, we already sent it
            const todayStr = `${getPart('year')}-${getPart('month')}-${getPart('day')}`;
            if (lastPushDate === todayStr) {
                console.log('Weekly drop push already sent today.');
                return;
            }
            console.log('Time to open the week! Sending global push...');
            // Marcar como enviado hoy BBDD ANTES de enviar para evitar concurrencia
            await lastPushDocRef.set({ date: todayStr }, { merge: true });
            // Obtener todos los tokens de todos los usuarios
            const usersSnap = await db.collection('users').get();
            const allTokens = [];
            usersSnap.forEach(doc => {
                const uData = doc.data();
                if (uData.fcmTokens && Array.isArray(uData.fcmTokens)) {
                    allTokens.push(...uData.fcmTokens);
                }
            });
            if (allTokens.length > 0) {
                const payload = {
                    notification: {
                        title: '🔥 ¡Nuevas Clases Disponibles!',
                        body: 'La próxima semana ya está abierta. ¡Corre a reservar tus plazas antes de que se agoten!'
                    },
                    data: {
                        type: 'weekly_drop'
                    }
                };
                // FCM Multicast allows max 500 tokens per call, chunk them
                const chunkSize = 500;
                for (let i = 0; i < allTokens.length; i += chunkSize) {
                    const chunk = allTokens.slice(i, i + chunkSize);
                    await admin.messaging().sendMulticast(Object.assign({ tokens: chunk }, payload)).catch(err => console.error('Error in multicasts chunk:', err));
                }
                console.log(`Global push sent successfully to ${allTokens.length} devices.`);
            }
            else {
                console.log('No registered devices found for global push.');
            }
        }
    }
    catch (error) {
        console.error('Error checking weekly opening:', error);
    }
});
//# sourceMappingURL=index.js.map