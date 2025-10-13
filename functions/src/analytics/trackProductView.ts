// ===============================================
// ANALYTICS FUNCTIONS
// File: functions/src/analytics/trackProductView.ts
// ===============================================


import * as functions from 'firebase-functions/v2';
import * as admin from 'firebase-admin';
import { onCall } from 'firebase-functions/v2/https';



interface TrackProductViewRequest {
  productId: string;
}

/**
   * Callable function to track product views
   */
export const trackProductView = onCall<TrackProductViewRequest>(
  async (request) => {
    const { data } = request;
    const { productId } = data;

    try {
      // Increment view count
      await admin.firestore()
        .collection('products')
        .doc(productId)
        .update({
          viewCount: admin.firestore.FieldValue.increment(1),
        });

      // Update daily analytics
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
      const analyticsRef = admin.firestore()
        .collection('analytics')
        .doc('products')
        .collection('daily')
        .doc(`${productId}_${today}`);

      await analyticsRef.set({
        productId,
        date: today,
        views: admin.firestore.FieldValue.increment(1),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      }, { merge: true });

      return { success: true };
    } catch (error: unknown) {
      const logger = functions.logger;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      // Don't throw error - analytics shouldn't break user experience
      logger.error('Error:', errorMessage);
      return { success: false, error: errorMessage };
    }
  }
);