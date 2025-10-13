// ===============================================
// CLOUD FUNCTIONS V2 - INDEX (Sin beforeCreate)
// File: functions/src/index.ts
// ===============================================

import * as admin from 'firebase-admin';
import { setGlobalOptions } from 'firebase-functions/v2';

// Initialize Firebase Admin
admin.initializeApp();

// Set global options for v2 functions
setGlobalOptions({
  region: 'us-central1',
  maxInstances: 10,
  timeoutSeconds: 60,
  memory: '256MiB',
});

// ============= EXPORT ALL FUNCTIONS =============

// Authentication (v1 API para triggers no bloqueantes)
export { onUserCreated, updateLastLogin } from './auth/onUserCreated';


// Payments (Stripe) - v2 API
export {
  createPaymentIntent,
  handleStripeWebhook,
  processRefund
} from './payments/createPaymentIntent';

// Orders - v2 API
export {
  onOrderCreated
} from './orders/onOrderCreated';

export {
  updateOrderStatus,
  scheduleOrderUpdates
} from './orders/updateOrderStatus';

// Products - v2 API
export { onProductUpdated } from './products/onProductUpdated';

// Cart - v2 API
export { cleanupExpiredCarts } from './carts/cleanupExpiredCarts';

// Notifications - v2 API
export { sendNotification } from './notifications/sendNotification';

// Analytics - v2 API
export { trackProductView } from './analytics/trackProductView';