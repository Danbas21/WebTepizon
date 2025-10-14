// ===============================================
// PRODUCT FUNCTIONS
// File: functions/src/products/onProductUpdated.ts
// ===============================================

import * as functions from 'firebase-functions/v2';
import * as admin from 'firebase-admin';
import { onDocumentUpdated } from 'firebase-functions/v2/firestore';

interface WishlistItem {
  productId: string;
  priceDropNotification: boolean;
}

interface Product {
  stock: number;
  name: string;
  images: { url: string }[];
  price: { amount: number };
  lowStockThreshold: number;
  categoryId: string;
  slug: string;
}

/**
 * Triggered when a product is updated
 * Handles low stock notifications and price drop alerts
 */
export const onProductUpdated = onDocumentUpdated(
  'products/{productId}',
  async (event) => {
    const beforeData = event.data?.before.data();
    const afterData = event.data?.after.data();
    const productId = event.params.productId;

    if (!beforeData || !afterData) {
      return;
    }

    try {
      // Check for low stock
      if (afterData.stock <= afterData.lowStockThreshold &&
        beforeData.stock > afterData.lowStockThreshold) {
        await handleLowStock(productId, afterData as Product);
      }

      // Check for price drop
      if (afterData.price.amount < beforeData.price.amount) {
        await handlePriceDrop(productId, afterData as Product, beforeData.price.amount);
      }

      // Update category product count (denormalized data)
      if (beforeData.categoryId !== afterData.categoryId) {
        await updateCategoryProductCount(beforeData.categoryId, afterData.categoryId);
      }
    } catch (error) {
      functions.logger.error('Error in onProductUpdated:', error);
    }
  }
);

/**
 * Handle low stock alert
 */
async function handleLowStock(productId: string, product: Product): Promise<void> {

  functions.logger.warn(
    `Low stock alert for product ${productId}: ${product.stock} units`
  );

  // Send notification to admins
  const adminsSnapshot = await admin.firestore()
    .collection('users')
    .where('role', '==', 'ADMIN')
    .get();

  const batch = admin.firestore().batch();

  for (const adminDoc of adminsSnapshot.docs) {
    const notificationRef = admin
      .firestore()
      .collection('notifications')
      .doc();


    batch.set(notificationRef, {
      userId: adminDoc.id,
      type: 'BACK_IN_STOCK',
      title: 'Inventario Bajo',
      message: `${product.name} tiene solo ${product.stock} unidades disponibles`,
      actionUrl: `/admin/products/${productId}`,
      imageUrl: product.images[0]?.url,
      isRead: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  }

  await batch.commit();
}

/**
 * Handle price drop notifications
 */
async function handlePriceDrop(
  productId: string,
  product: { name: string; slug: string; price: { amount: number; }; images: { url: string; }[] },
  oldPrice: number
): Promise<void> {
  // Find users who have this product in wishlist with price drop notifications enabled
  const wishlistsSnapshot = await admin.firestore()
    .collection('wishlists')
    .get();

  const batch = admin.firestore().batch();
  let notificationCount = 0;

  for (const wishlistDoc of wishlistsSnapshot.docs) {
    const wishlist = wishlistDoc.data();
    const wishlistItem = wishlist.items?.find(
      (item: WishlistItem) => item.productId === productId && item.priceDropNotification
    );

    if (wishlistItem) {
      const notificationRef = admin.firestore().collection('notifications').doc();
      const discount = ((oldPrice - product.price.amount) / oldPrice * 100).toFixed(0);

      batch.set(notificationRef, {
        userId: wishlist.userId,
        type: 'PRICE_DROP',
        title: '¡Bajó de Precio!',
        message: `${product.name} ahora tiene ${discount}% de descuento`,
        actionUrl: `/products/${product.slug}`,
        imageUrl: product.images[0]?.url,
        isRead: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      notificationCount++;
    }
  }

  if (notificationCount > 0) {
    await batch.commit();
    functions.logger.info(`Sent ${notificationCount} price drop notifications for ${productId}`);
  }
}

/**
 * Update category product counts
 */
async function updateCategoryProductCount(
  oldCategoryId: string,
  newCategoryId: string
): Promise<void> {
  const batch = admin.firestore().batch();

  // Decrement old category
  const oldCategoryRef = admin.firestore().collection('categories').doc(oldCategoryId);
  batch.update(oldCategoryRef, {
    productCount: admin.firestore.FieldValue.increment(-1),
  });

  // Increment new category
  const newCategoryRef = admin.firestore().collection('categories').doc(newCategoryId);
  batch.update(newCategoryRef, {
    productCount: admin.firestore.FieldValue.increment(1),
  });

  await batch.commit();
}

