// ===============================================
// ORDER MANAGEMENT FUNCTIONS
// File: functions/src/orders/onOrderCreated.ts
// ===============================================

import * as functions from 'firebase-functions/v2';
import * as admin from 'firebase-admin';
import { onDocumentCreated } from 'firebase-functions/v2/firestore';


interface Order {
  userId: string;
  items: {
    productId: string;
    quantity: number;
    productImage: string;
  }[];
  status: string;
}


/**
 * Triggered when a new order is created
 * Generates order number and initializes status
 */
export const onOrderCreated = onDocumentCreated(
  'orders/{orderId}',
  async (event) => {
    const snapshot = event.data;
    if (!snapshot) {
      return;
    }

    const order = snapshot.data();
    const orderId = event.params.orderId;

    try {
      // Generate order number
      const orderNumber = await generateOrderNumber();

      // Calculate estimated delivery date (12 hours for in-stock items)
      const estimatedDelivery = new Date();
      const hasStock = await checkStockAvailability(order.items);

      if (hasStock) {
        estimatedDelivery.setHours(estimatedDelivery.getHours() + 12);
      } else {
        estimatedDelivery.setDate(estimatedDelivery.getDate() + 5); // 5 days
      }

      // Update order with generated data
      await snapshot.ref.update({
        orderNumber,
        estimatedDeliveryDate: admin.firestore.Timestamp.fromDate(estimatedDelivery),
        statusHistory: [{
          status: order.status,
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
          note: 'Order created',
          updatedBy: 'SYSTEM',
        }],
      });

      // Send order created notification
      await admin.firestore().collection('notifications').add({
        userId: order.userId,
        type: 'ORDER_UPDATE',
        title: 'Orden Creada',
        message: `Tu orden ${orderNumber} ha sido creada exitosamente.`,
        actionUrl: `/orders/${orderId}`,
        imageUrl: order.items[0]?.productImage,
        isRead: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      functions.logger.info(`Order ${orderNumber} created for user ${order.userId}`);
    } catch (error) {
      functions.logger.error('Error in onOrderCreated:', error);
    }
  }
);

/**
 * Generate unique order number
 */
async function generateOrderNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const counterRef = admin.firestore()
    .collection('counters')
    .doc('orders');

  // Use transaction to ensure uniqueness
  const orderNumber = await admin.firestore().runTransaction(async (transaction) => {
    const counterDoc = await transaction.get(counterRef);

    let count = 1;
    if (counterDoc.exists) {
      count = (counterDoc.data()?.count || 0) + 1;
    }

    transaction.set(counterRef, { count, year }, { merge: true });

    // Format: ORD-2025-001234
    return `ORD-${year}-${count.toString().padStart(6, '0')}`;
  });

  return orderNumber;
}

/**
 * Check if all items are in stock
 */
async function checkStockAvailability(items: Order['items']): Promise<boolean> {
  for (const item of items) {
    const productDoc = await admin.firestore()
      .collection('products')
      .doc(item.productId)
      .get();

    if (!productDoc.exists) {
      return false;
    }

    const product = productDoc.data();
    if ((product?.stock || 0) < item.quantity) {
      return false;
    }
  }

  return true;
}
