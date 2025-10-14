
// ===============================================
// UPDATE ORDER STATUS
// File: functions/src/orders/updateOrderStatus.ts


// ===============================================

import * as functions from 'firebase-functions/v2';
import * as admin from 'firebase-admin';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { onSchedule } from 'firebase-functions/v2/scheduler';
interface UpdateOrderStatusRequest {
  orderId: string;
  status: string;
  note?: string;
}

/**
 * Callable function to update order status
 * Can be called by admin or automatically by system
 */
export const updateOrderStatus = onCall<UpdateOrderStatusRequest>(
  async (request) => {
    const { auth, data } = request;

    if (!auth) {
      throw new HttpsError('unauthenticated', 'User must be authenticated');
    }

    const { orderId, status, note } = data;

    try {
      // Get order
      const orderRef = admin.firestore().collection('orders').doc(orderId);
      const orderDoc = await orderRef.get();

      if (!orderDoc.exists) {
        throw new HttpsError('not-found', 'Order not found');
      }

      const order = orderDoc.data();

      // Check permissions
      const userDoc = await admin.firestore()
        .collection('users')
        .doc(auth.uid)
        .get();

      const isAdmin = userDoc.data()?.role === 'ADMIN';
      const isOwner = order?.userId === auth.uid;

      // Only admin can change to most statuses
      // Users can only mark as DELIVERED
      if (!isAdmin && status !== 'DELIVERED') {
        throw new HttpsError('permission-denied', 'Not authorized');
      }

      if (status === 'DELIVERED' && !isOwner) {
        throw new HttpsError('permission-denied', 'Only order owner can confirm delivery');
      }

      // Validate status transition
      const validTransitions: Record<string, string[]> = {
        'PENDING_PAYMENT': ['PAID', 'CANCELLED'],
        'PAID': ['PROCESSING', 'CANCELLED'],
        'PROCESSING': ['SHIPPED', 'CANCELLED'],
        'SHIPPED': ['OUT_FOR_DELIVERY', 'DELIVERED'],
        'OUT_FOR_DELIVERY': ['DELIVERED'],
        'DELIVERED': ['RETURN_REQUESTED'],
        'RETURN_REQUESTED': ['RETURNED', 'DELIVERED'],
      };

      const currentStatus = order?.status;
      if (!validTransitions[currentStatus]?.includes(status)) {
        throw new HttpsError(
          'failed-precondition',
          `Invalid status transition from ${currentStatus} to ${status}`
        );
      }

      // Update order
      await orderRef.update({
        status,
        statusHistory: admin.firestore.FieldValue.arrayUnion({
          status,
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
          note: note || `Status changed to ${status}`,
          updatedBy: isAdmin ? 'ADMIN' : 'USER',
        }),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        ...(status === 'DELIVERED' && {
          actualDeliveryDate: admin.firestore.FieldValue.serverTimestamp(),
        }),
      });

      // Send notification
      const statusMessages: Record<string, string> = {
        'PAID': 'Tu pago ha sido confirmado',
        'PROCESSING': 'Tu orden está siendo procesada',
        'SHIPPED': 'Tu orden ha sido enviada',
        'OUT_FOR_DELIVERY': 'Tu orden está en camino',
        'DELIVERED': 'Tu orden ha sido entregada',
        'CANCELLED': 'Tu orden ha sido cancelada',
        'REFUNDED': 'Tu orden ha sido reembolsada',
      };

      await admin.firestore().collection('notifications').add({
        userId: order?.userId,
        type: 'ORDER_UPDATE',
        title: 'Actualización de Orden',
        message: statusMessages[status] || 'El estado de tu orden ha cambiado',
        actionUrl: `/orders/${orderId}`,
        isRead: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      functions.logger.info(
        `Order ${orderId} status updated to ${status} by ${isAdmin ? 'admin' : 'user'}`
      );

      return { success: true, newStatus: status };
    } catch (error: unknown) {
      functions.logger.error('Error:', error);
      if (error instanceof HttpsError) {
        throw error;
      }
      throw new HttpsError('internal', 'An error occurred');
    }
  }
);

// ===============================================
// SCHEDULE ORDER AUTO-UPDATES
// File: functions/src/orders/scheduleOrderUpdates.ts
// ===============================================



/**
 * Scheduled function that runs every hour
 * Auto-updates orders that have passed their delivery deadline
 */
export const scheduleOrderUpdates = onSchedule('every 1 hours', async () => {
  const now = admin.firestore.Timestamp.now();
  const twentyFourHoursAgo = new Date(now.toMillis() - 24 * 60 * 60 * 1000);

  try {
    // Find paid orders older than 24 hours that are still in PAID status
    const ordersSnapshot = await admin.firestore()
      .collection('orders')
      .where('status', '==', 'PAID')
      .where('createdAt', '<', admin.firestore.Timestamp.fromDate(twentyFourHoursAgo))
      .get();

    const batch = admin.firestore().batch();
    let updateCount = 0;

    for (const doc of ordersSnapshot.docs) {
      batch.update(doc.ref, {
        status: 'SHIPPED',
        statusHistory: admin.firestore.FieldValue.arrayUnion({
          status: 'SHIPPED',
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
          note: 'Auto-updated after 24 hours',
          updatedBy: 'SYSTEM',
        }),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      updateCount++;
    }

    if (updateCount > 0) {
      await batch.commit();
      functions.logger.info(`Auto-updated ${updateCount} orders to SHIPPED status`);
    }
  } catch (error) {
    functions.logger.error('Error in scheduleOrderUpdates:', error);
  }
});