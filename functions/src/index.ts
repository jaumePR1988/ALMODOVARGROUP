import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

admin.initializeApp();
const db = admin.firestore();

// Trigger que salta cuando un documento de 'reservations' es ELIMINADO
export const onReservationCancelled = functions.firestore
  .document('reservations/{reservationId}')
  .onDelete(async (snap, context) => {
    const deletedReservation = snap.data();
    const classId = deletedReservation.classId;
    const classDate = deletedReservation.classDate;

    if (!classId) return;

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
