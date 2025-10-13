// ===============================================
// CART CLEANUP FUNCTIONS
// File: functions/src/carts/cleanupExpiredCarts.ts
// ===============================================

import { onSchedule } from 'firebase-functions/v2/scheduler';
import * as functions from 'firebase-functions/v2';
import * as admin from 'firebase-admin';



/**
 * Scheduled function that runs daily at midnight
 * Deletes expired carts (older than 30 days)
 */
export const cleanupExpiredCarts = onSchedule('every day 00:00', async () => {
  const now = admin.firestore.Timestamp.now();

  try {
    // Find carts that have expired
    const expiredCartsSnapshot = await admin.firestore()
      .collection('carts')
      .where('expiresAt', '<', now)
      .limit(500) // Process in batches
      .get();

    if (expiredCartsSnapshot.empty) {
      functions.logger.info('No expired carts to delete');
      return;
    }

    // Delete in batch
    const batch = admin.firestore().batch();
    let deleteCount = 0;

    for (const doc of expiredCartsSnapshot.docs) {
      batch.delete(doc.ref);
      deleteCount++;
    }

    await batch.commit();

    functions.logger.info(`Deleted ${deleteCount} expired carts`);
  } catch (error) {
    functions.logger.error('Error in cleanupExpiredCarts:', error);
  }
});

