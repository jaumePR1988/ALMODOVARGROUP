import { db } from '../firebase';
import { collection, addDoc, serverTimestamp, writeBatch, doc } from 'firebase/firestore';

export type NotificationType = 'waitlist_success' | 'class_cancelled' | 'new_news' | 'system' | 'info' | 'message';

/**
 * Sends a notification to a single user.
 */
export const sendNotification = async (
    userId: string,
    type: NotificationType,
    title: string,
    message: string,
    relatedId?: string
) => {
    try {
        await addDoc(collection(db, 'user_notifications'), {
            userId,
            type,
            title,
            message,
            relatedId: relatedId || null,
            read: false,
            createdAt: serverTimestamp()
        });
    } catch (error) {
        console.error("Error sending notification:", error);
    }
};

/**
 * Sends a notification to multiple users (batched).
 * Firestore batches are limited to 500 operations.
 */
export const sendNotificationToMultiple = async (
    userIds: string[],
    type: NotificationType,
    title: string,
    message: string,
    relatedId?: string
) => {
    try {
        const batchSize = 500;
        for (let i = 0; i < userIds.length; i += batchSize) {
            const chunk = userIds.slice(i, i + batchSize);
            const batch = writeBatch(db);

            chunk.forEach(uid => {
                const ref = doc(collection(db, 'user_notifications'));
                batch.set(ref, {
                    userId: uid,
                    type,
                    title,
                    message,
                    relatedId: relatedId || null,
                    read: false,
                    createdAt: serverTimestamp()
                });
            });

            await batch.commit();
        }
    } catch (error) {
        console.error("Error batch sending notifications:", error);
    }
};
