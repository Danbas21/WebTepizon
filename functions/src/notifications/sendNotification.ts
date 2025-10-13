import * as functions from 'firebase-functions/v2';
import * as admin from 'firebase-admin';
import { onCall, HttpsError } from 'firebase-functions/v2/https';


interface SendNotificationRequest {
  userId: string;
  type: string;
  title: string;
  message: string;
  actionUrl?: string;
  imageUrl?: string;
}

/**
 * Callable function to send a notification to a user
 * Restricted to admins only
 */
export const sendNotification = onCall<SendNotificationRequest>(
  async (request) => {
    const { auth, data } = request;

    if (!auth) {
      throw new HttpsError('unauthenticated', 'User must be authenticated');
    }

    // Verify user is admin
    const userDoc = await admin.firestore()
      .collection('users')
      .doc(auth.uid)
      .get();

    if (userDoc.data()?.role !== 'ADMIN') {
      throw new HttpsError('permission-denied', 'Only admins can send notifications');
    }

    const { userId, type, title, message, actionUrl, imageUrl } = data;

    try {
      await admin.firestore().collection('notifications').add({
        userId,
        type,
        title,
        message,
        actionUrl: actionUrl || null,
        imageUrl: imageUrl || null,
        isRead: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      functions.logger.info(`Notification sent to user ${userId}`);

      return { success: true };
    } catch (error: unknown) {
      functions.logger.error('Error sending notification:', error);
      throw new HttpsError('internal', 'Failed to send notification');
    }
  }
);