import { db } from '../firebase';
import { collection, addDoc, serverTimestamp, writeBatch, doc, getDocs, query, where, getDoc } from 'firebase/firestore';

// ── Notification Types ──────────────────────────────────────────
export type NotificationType =
    | 'booking_confirmed'
    | 'booking_cancelled'
    | 'waitlist_joined'
    | 'waitlist_invited'
    | 'waitlist_expired'
    | 'waitlist_confirmed'
    | 'class_full'
    | 'class_vacancy'
    | 'info'
    | 'system';

// Map types to the simple UI categories used in Notifications.tsx
const typeToUICategory = (type: NotificationType): 'info' | 'waitlist' | 'alert' => {
    switch (type) {
        case 'booking_confirmed':
        case 'waitlist_confirmed':
        case 'class_full':
            return 'info';
        case 'waitlist_joined':
        case 'waitlist_invited':
            return 'waitlist';
        case 'booking_cancelled':
        case 'waitlist_expired':
        case 'class_vacancy':
            return 'alert';
        default:
            return 'info';
    }
};

// ── Core: Send to single user ───────────────────────────────────
export const sendNotification = async (
    userId: string,
    type: NotificationType,
    title: string,
    message: string,
    actionUrl?: string
) => {
    try {
        await addDoc(collection(db, 'notifications'), {
            userId,
            type: typeToUICategory(type),
            notificationType: type,
            title,
            message,
            read: false,
            createdAt: serverTimestamp(),
            actionUrl: actionUrl || null
        });
    } catch (error) {
        console.error('[NotificationService] Error sending:', error);
    }
};

// ── Core: Send to multiple users (batched) ──────────────────────
export const sendNotificationToMultiple = async (
    userIds: string[],
    type: NotificationType,
    title: string,
    message: string,
    actionUrl?: string
) => {
    if (userIds.length === 0) return;
    try {
        const batchSize = 500;
        for (let i = 0; i < userIds.length; i += batchSize) {
            const chunk = userIds.slice(i, i + batchSize);
            const batch = writeBatch(db);

            chunk.forEach(uid => {
                const ref = doc(collection(db, 'notifications'));
                batch.set(ref, {
                    userId: uid,
                    type: typeToUICategory(type),
                    notificationType: type,
                    title,
                    message,
                    read: false,
                    createdAt: serverTimestamp(),
                    actionUrl: actionUrl || null
                });
            });

            await batch.commit();
        }
    } catch (error) {
        console.error('[NotificationService] Error batch sending:', error);
    }
};

// ── Helper: Get all admin user IDs ──────────────────────────────
export const getAdminIds = async (): Promise<string[]> => {
    try {
        const q = query(collection(db, 'users'), where('role', '==', 'admin'));
        const snap = await getDocs(q);
        return snap.docs.map(d => d.id);
    } catch (error) {
        console.error('[NotificationService] Error fetching admins:', error);
        return [];
    }
};

// ── Helper: Get coach ID for a specific class ───────────────────
export const getCoachIdForClass = async (classId: string): Promise<string | null> => {
    try {
        const classDoc = await getDoc(doc(db, 'classes', classId));
        if (classDoc.exists()) {
            return classDoc.data().coachId || null;
        }
        return null;
    } catch (error) {
        console.error('[NotificationService] Error fetching coach for class:', error);
        return null;
    }
};

// ── Helper: Get current attendee count for a class on a date ────
export const getClassAttendeeCount = async (classId: string, classDate: string): Promise<number> => {
    try {
        const q = query(
            collection(db, 'reservations'),
            where('classId', '==', classId),
            where('classDate', '==', classDate),
            where('status', '==', 'active')
        );
        const snap = await getDocs(q);
        return snap.size;
    } catch (error) {
        console.error('[NotificationService] Error counting attendees:', error);
        return 0;
    }
};

// ── High-level: Notify booking confirmed ────────────────────────
export const notifyBookingConfirmed = async (
    userId: string,
    className: string,
    classDate: string,
    classTime: string
) => {
    const dateFormatted = new Date(classDate + 'T00:00:00').toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });

    await sendNotification(
        userId,
        'booking_confirmed',
        '✅ Reserva Confirmada',
        `Tu plaza en ${className} el ${dateFormatted} a las ${classTime} está confirmada.`
    );
};

// ── High-level: Notify booking cancelled ────────────────────────
export const notifyBookingCancelled = async (
    userId: string,
    className: string,
    classDate: string,
    refunded: boolean
) => {
    const dateFormatted = new Date(classDate + 'T00:00:00').toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });

    await sendNotification(
        userId,
        'booking_cancelled',
        '❌ Reserva Cancelada',
        `Tu reserva en ${className} el ${dateFormatted} ha sido cancelada. ${refunded ? 'Crédito devuelto.' : 'Sin devolución (menos de 1h).'}`
    );
};

// ── High-level: Notify coach about a cancellation ───────────────
export const notifyCoachCancellation = async (
    coachId: string,
    userName: string,
    className: string,
    classDate: string
) => {
    const dateFormatted = new Date(classDate + 'T00:00:00').toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });

    await sendNotification(
        coachId,
        'class_vacancy',
        '🔄 Baja en tu Clase',
        `${userName} ha cancelado su plaza en ${className} el ${dateFormatted}.`
    );
};

// ── High-level: Notify admin about a cancellation ───────────────
export const notifyAdminCancellation = async (
    userName: string,
    className: string,
    classDate: string,
    currentAttendees: number,
    capacity: number
) => {
    const dateFormatted = new Date(classDate + 'T00:00:00').toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
    const adminIds = await getAdminIds();

    await sendNotificationToMultiple(
        adminIds,
        'class_vacancy',
        '🔄 Baja Registrada',
        `${userName} ha cancelado en ${className} el ${dateFormatted}. Plazas: ${currentAttendees}/${capacity}.`
    );
};

// ── High-level: Notify class full ───────────────────────────────
export const notifyClassFull = async (
    classId: string,
    className: string,
    classDate: string,
    capacity: number,
    category?: string
) => {
    const dateFormatted = new Date(classDate + 'T00:00:00').toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });

    // Notify coach
    const coachId = await getCoachIdForClass(classId);
    if (coachId) {
        await sendNotification(
            coachId,
            'class_full',
            '🔥 Clase Completa',
            `${className} el ${dateFormatted} ha llegado al aforo máximo (${capacity}/${capacity}).`
        );
    }

    // Notify admins
    const adminIds = await getAdminIds();
    const modoTag = category ? ` (${category})` : '';
    await sendNotificationToMultiple(
        adminIds,
        'class_full',
        '🔥 Clase al Completo',
        `${className}${modoTag} el ${dateFormatted} está llena (${capacity}/${capacity}).`
    );
};

// ── High-level: Notify waitlist joined ──────────────────────────
export const notifyWaitlistJoined = async (
    userId: string,
    className: string,
    classDate: string,
    position?: number
) => {
    const dateFormatted = new Date(classDate + 'T00:00:00').toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
    const positionText = position ? ` Tu posición actual es la ${position}ª.` : '';

    await sendNotification(
        userId,
        'waitlist_joined',
        '⏳ Lista de Espera',
        `Estás en lista de espera para ${className} el ${dateFormatted}.${positionText} Te avisaremos si se libera una plaza.`
    );
};

// ── High-level: Notify waitlist confirmed (coach + admin) ───────
export const notifyWaitlistConfirmed = async (
    classId: string,
    userName: string,
    className: string,
    classDate: string
) => {
    const dateFormatted = new Date(classDate + 'T00:00:00').toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });

    // Notify coach
    const coachId = await getCoachIdForClass(classId);
    if (coachId) {
        await sendNotification(
            coachId,
            'waitlist_confirmed',
            '📋 Entrada por Waitlist',
            `${userName} ha confirmado su plaza desde la lista de espera en ${className} el ${dateFormatted}.`
        );
    }

    // Notify admins
    const adminIds = await getAdminIds();
    await sendNotificationToMultiple(
        adminIds,
        'waitlist_confirmed',
        '📋 Waitlist Cubierta',
        `${userName} ha ocupado la plaza liberada en ${className} el ${dateFormatted} desde la lista de espera.`
    );
};
