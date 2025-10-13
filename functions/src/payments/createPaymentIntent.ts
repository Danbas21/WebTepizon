// ===============================================
// PAYMENT FUNCTIONS - STRIPE INTEGRATION (V2)
// File: functions/src/payments/createPaymentIntent.ts
// ===============================================

import { onCall, HttpsError, onRequest } from 'firebase-functions/v2/https';
import * as logger from 'firebase-functions/logger';
import * as admin from 'firebase-admin';
import Stripe from 'stripe';

import { STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET } from '../params';

interface CreatePaymentIntentRequest {
  amount: number;  // In cents (MXN)
  orderId: string;
  metadata?: Record<string, string>;
}

/**
 * Callable function to create a Stripe Payment Intent
 * Uses Cloud Functions v2 with Secret Manager
 */
export const createPaymentIntent = onCall<CreatePaymentIntentRequest>(
  {
    secrets: [STRIPE_SECRET_KEY],
    region: 'us-central1',
    memory: '256MiB',
  },
  async (request) => {
    const { auth, data } = request;

    // Validate authentication
    if (!auth) {
      throw new HttpsError('unauthenticated', 'User must be authenticated');
    }

    const { amount, orderId, metadata } = data;

    // Validate input
    if (!amount || amount <= 0) {
      throw new HttpsError('invalid-argument', 'Invalid amount');
    }

    if (!orderId) {
      throw new HttpsError('invalid-argument', 'Order ID is required');
    }

    try {
      // Initialize Stripe with secret from Secret Manager
      const stripe = new Stripe(STRIPE_SECRET_KEY.value(), {
        apiVersion: '2025-09-30.clover',
      });

      // Verify order exists and belongs to user
      const orderDoc = await admin.firestore()
        .collection('orders')
        .doc(orderId)
        .get();

      if (!orderDoc.exists) {
        throw new HttpsError('not-found', 'Order not found');
      }

      const order = orderDoc.data();
      if (order?.userId !== auth.uid) {
        throw new HttpsError('permission-denied', 'Not authorized');
      }

      // Create Payment Intent
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount), // Ensure integer
        currency: 'mxn',
        metadata: {
          orderId,
          userId: auth.uid,
          ...metadata,
        },
        // Enable automatic payment methods
        automatic_payment_methods: {
          enabled: true,
        },
      });

      // Update order with payment intent ID
      await orderDoc.ref.update({
        'paymentDetails.transactionId': paymentIntent.id,
        'paymentDetails.provider': 'STRIPE',
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      logger.info(
        `Payment Intent created: ${paymentIntent.id} for order ${orderId}`
      );

      return {
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
      };
    } catch (error: unknown) {
      logger.error('Error:', error);
      if (error instanceof HttpsError) {
        throw error;
      }
      throw new HttpsError('internal', 'An error occurred');
    }
  }
);

// ===============================================
// STRIPE WEBHOOK HANDLER (V2)
// File: functions/src/payments/handleStripeWebhook.ts
// ===============================================




/**
 * Webhook endpoint for Stripe events
 * Uses raw body for signature verification
 */
export const handleStripeWebhook = onRequest(
  {
    secrets: [STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET],
    region: 'us-central1',
  },
  async (req, res): Promise<void> => {
    const sig = req.headers['stripe-signature'];

    if (!sig) {
      res.status(400).send('Missing stripe-signature header');
      return;
    }

    let event: Stripe.Event;

    try {
      // Initialize Stripe
      const stripe = new Stripe(STRIPE_SECRET_KEY.value(), {
        apiVersion: '2025-09-30.clover',
      });

      // Verify webhook signature using raw body
      event = stripe.webhooks.constructEvent(
        req.rawBody,
        sig as string,
        STRIPE_WEBHOOK_SECRET.value()
      );
    } catch (error: unknown) {
      logger.error('Webhook signature verification failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(400).send(`Webhook Error: ${errorMessage}`);
      return;
    }

    // Handle the event
    try {
      switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentSuccess(event.data.object as Stripe.PaymentIntent);
        break;

      case 'payment_intent.payment_failed':
        await handlePaymentFailure(event.data.object as Stripe.PaymentIntent);
        break;

      case 'charge.refunded':
        await handleRefund(event.data.object as Stripe.Charge);
        break;

      default:
        logger.info(`Unhandled event type: ${event.type}`);
      }

      res.json({ received: true });
      return;
    } catch (error: unknown) {
      logger.error('Webhook signature verification failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).send(`Webhook Error: ${errorMessage}`);
      return;
    }
  }
);

/**
 * Handle successful payment
 */
async function handlePaymentSuccess(paymentIntent: Stripe.PaymentIntent): Promise<void> {
  const orderId = paymentIntent.metadata.orderId;

  if (!orderId) {
    logger.error('Order ID not found in payment intent metadata');
    return;
  }

  const orderRef = admin.firestore().collection('orders').doc(orderId);
  const orderDoc = await orderRef.get();

  if (!orderDoc.exists) {
    logger.error(`Order ${orderId} not found`);
    return;
  }

  const order = orderDoc.data();

  let last4: string | undefined;
  let brand: string | undefined;

  // Update order status
  await orderRef.update({
    paymentStatus: 'PAID',
    status: 'PROCESSING',
    'paymentDetails.paidAt': admin.firestore.FieldValue.serverTimestamp(),
    'paymentDetails.last4': last4 ?? null,
    'paymentDetails.brand': brand ?? null,
    statusHistory: admin.firestore.FieldValue.arrayUnion({
      status: 'PAID',
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      note: 'Payment successful',
      updatedBy: 'SYSTEM',
    }),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  // Reduce product stock
  for (const item of order?.items || []) {
    const productRef = admin.firestore().collection('products').doc(item.productId);
    await productRef.update({
      stock: admin.firestore.FieldValue.increment(-item.quantity),
      purchaseCount: admin.firestore.FieldValue.increment(item.quantity),
    });
  }

  // Send confirmation email
  await sendOrderConfirmationEmail(orderId, order?.userEmail);

  // Create notification
  await admin.firestore().collection('notifications').add({
    userId: order?.userId,
    type: 'ORDER_UPDATE',
    title: 'Pago Confirmado',
    message: `Tu pago de $${order?.total.amount.toFixed(2)} MXN ha sido confirmado.`,
    actionUrl: `/orders/${orderId}`,
    isRead: false,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  logger.info(`Payment successful for order ${orderId}`);
}

/**
 * Handle failed payment
 */
async function handlePaymentFailure(paymentIntent: Stripe.PaymentIntent): Promise<void> {
  const orderId = paymentIntent.metadata.orderId;

  if (!orderId) {
    return;
  }

  const orderRef = admin.firestore().collection('orders').doc(orderId);

  await orderRef.update({
    paymentStatus: 'FAILED',
    statusHistory: admin.firestore.FieldValue.arrayUnion({
      status: 'PAYMENT_FAILED',
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      note: 'Payment failed',
      updatedBy: 'SYSTEM',
    }),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  // Send failure notification
  const orderDoc = await orderRef.get();
  const order = orderDoc.data();

  await admin.firestore().collection('notifications').add({
    userId: order?.userId,
    type: 'ORDER_UPDATE',
    title: 'Error en el Pago',
    message: 'Hubo un problema con tu pago. Por favor intenta nuevamente.',
    actionUrl: `/orders/${orderId}`,
    isRead: false,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  logger.error(`Payment failed for order ${orderId}`);
}

/**
 * Handle refund
 */
async function handleRefund(charge: Stripe.Charge): Promise<void> {
  const orderId = charge.metadata.orderId;

  if (!orderId) {
    return;
  }

  await admin.firestore()
    .collection('orders')
    .doc(orderId)
    .update({
      paymentStatus: 'REFUNDED',
      status: 'REFUNDED',
      statusHistory: admin.firestore.FieldValue.arrayUnion({
        status: 'REFUNDED',
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        note: 'Payment refunded',
        updatedBy: 'SYSTEM',
      }),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

  logger.info(`Refund processed for order ${orderId}`);
}

/**
 * Send order confirmation email
 */
async function sendOrderConfirmationEmail(
  orderId: string,
  email: string
): Promise<void> {
  logger.info(`Sending confirmation email to ${email} for order ${orderId}`);
  // TODO: Implement actual email sending
}

// ===============================================
// PROCESS REFUND (V2)
// File: functions/src/payments/processRefund.ts
// ===============================================

interface ProcessRefundRequest {
  orderId: string;
  reason?: string;
}

/**
 * Callable function to process a refund
 */
export const processRefund = onCall<ProcessRefundRequest>(
  {
    secrets: [STRIPE_SECRET_KEY],
    region: 'us-central1',
  },
  async (request) => {
    const { auth, data } = request;

    if (!auth) {
      throw new HttpsError('unauthenticated', 'User must be authenticated');
    }

    const { orderId, reason } = data;

    try {
      // Initialize Stripe
      const stripe = new Stripe(STRIPE_SECRET_KEY.value(), {
        apiVersion: '2025-09-30.clover',
      });

      // Get order
      const orderDoc = await admin.firestore()
        .collection('orders')
        .doc(orderId)
        .get();

      if (!orderDoc.exists) {
        throw new HttpsError('not-found', 'Order not found');
      }

      const order = orderDoc.data();

      // Verify ownership or admin
      const userDoc = await admin.firestore()
        .collection('users')
        .doc(auth.uid)
        .get();

      const isAdmin = userDoc.data()?.role === 'ADMIN';
      const isOwner = order?.userId === auth.uid;

      if (!isAdmin && !isOwner) {
        throw new HttpsError('permission-denied', 'Not authorized');
      }

      // Verify order is eligible for refund
      if (order?.paymentStatus !== 'PAID') {
        throw new HttpsError('failed-precondition', 'Order not paid');
      }

      // Process refund with Stripe
      const paymentIntentId = order?.paymentDetails?.transactionId;

      if (!paymentIntentId) {
        throw new HttpsError('failed-precondition', 'No payment intent found');
      }

      const refund = await stripe.refunds.create({
        payment_intent: paymentIntentId,
        reason: 'requested_by_customer',
        metadata: {
          orderId,
          requestedBy: auth.uid,
          reason: reason || 'No reason provided',
        },
      });

      logger.info(`Refund created: ${refund.id} for order ${orderId}`);

      return {
        success: true,
        refundId: refund.id,
      };
    } catch (error: unknown) {
      logger.error('Error:', error);
      if (error instanceof HttpsError) {
        throw error;
      }
      throw new HttpsError('internal', 'An error occurred');
    }
  }
);