/**
 * Adapter: FirebaseOrderAdapter
 * Implementa la comunicación con Firestore para Orders
 * Versión simplificada - expandible
 */

import { Injectable, inject } from '@angular/core';
import {
  Firestore,
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
  Timestamp,
  writeBatch,
  arrayUnion
} from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { Order, OrderStatus } from '../../checkout/domain/order.model';

// ========== FIRESTORE DOCUMENTS ==========

export interface OrderDoc {
  id: string;
  orderNumber: string;
  userId: string;
  
  // Items
  items: any[];
  
  // Shipping
  shippingAddress: any;
  shippingOption: any;
  
  // Payment
  paymentMethod: any;
  paymentStatus: string;
  paymentIntentId?: string;
  transactionId?: string;
  
  // Totals
  totals: any;
  
  // Coupon
  appliedCoupon?: any;
  
  // Status
  status: OrderStatus;
  fulfillmentStatus: string;
  
  // Tracking
  trackingNumber?: string;
  trackingUrl?: string;
  carrier?: string;
  
  // Invoice
  invoice?: any;
  requiresInvoice: boolean;
  
  // Metadata
  notes?: string;
  customerNotes?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  paidAt?: Timestamp;
  shippedAt?: Timestamp;
  deliveredAt?: Timestamp;
  cancelledAt?: Timestamp;
  
  // Timeline
  timeline: any[];
}

export interface OrderTrackingDoc {
  orderId: string;
  trackingNumber: string;
  carrier: string;
  currentStatus: string;
  estimatedDelivery: Timestamp;
  currentLocation?: string;
  checkpoints: any[];
  lastUpdated: Timestamp;
}

export interface OrderCancellationDoc {
  orderId: string;
  requestedAt: Timestamp;
  requestedBy: string;
  reason: string;
  notes?: string;
  status: string;
  processedAt?: Timestamp;
  refundAmount?: number;
  refundedAt?: Timestamp;
}

export interface OrderReturnDoc {
  id: string;
  orderId: string;
  userId: string;
  items: any[];
  reason: string;
  notes?: string;
  photos?: string[];
  status: string;
  requestedAt: Timestamp;
  approvedAt?: Timestamp;
  rejectedAt?: Timestamp;
  completedAt?: Timestamp;
  refundAmount: number;
  refundMethod: string;
  returnShipping?: any;
}

@Injectable({ providedIn: 'root' })
export class FirebaseOrderAdapter {
  private readonly firestore = inject(Firestore);
  
  private readonly ORDERS_COLLECTION = 'orders';
  private readonly TRACKING_COLLECTION = 'order_tracking';
  private readonly CANCELLATIONS_COLLECTION = 'order_cancellations';
  private readonly RETURNS_COLLECTION = 'order_returns';

  // ========== ORDER OPERATIONS ==========

  /**
   * Crea una nueva orden
   */
  async createOrder(orderData: Omit<OrderDoc, 'id'>): Promise<OrderDoc> {
    const orderRef = doc(collection(this.firestore, this.ORDERS_COLLECTION));

    const newOrder: Omit<OrderDoc, 'id'> = {
      ...orderData,
      createdAt: serverTimestamp() as Timestamp,
      updatedAt: serverTimestamp() as Timestamp
    };

    await setDoc(orderRef, newOrder);

    return { id: orderRef.id, ...newOrder } as OrderDoc;
  }

  /**
   * Obtiene una orden por ID
   */
  async getOrder(orderId: string): Promise<OrderDoc | null> {
    const orderRef = doc(this.firestore, this.ORDERS_COLLECTION, orderId);
    const orderSnap = await getDoc(orderRef);

    if (!orderSnap.exists()) {
      return null;
    }

    return { id: orderSnap.id, ...orderSnap.data() } as OrderDoc;
  }

  /**
   * Obtiene todas las órdenes del usuario
   */
  watchUserOrders(userId: string): Observable<OrderDoc[]> {
    return new Observable(observer => {
      const q = query(
        collection(this.firestore, this.ORDERS_COLLECTION),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );

      const unsubscribe = onSnapshot(
        q,
        snapshot => {
          const orders = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as OrderDoc[];
          observer.next(orders);
        },
        error => observer.error(error)
      );

      return () => unsubscribe();
    });
  }

  /**
   * Actualiza el estado de una orden
   */
  async updateOrderStatus(orderId: string, status: OrderStatus): Promise<void> {
    const orderRef = doc(this.firestore, this.ORDERS_COLLECTION, orderId);
    
    const updates: any = {
      status,
      updatedAt: serverTimestamp()
    };

    // Actualizar timestamps específicos según el estado
    if (status === OrderStatus.SHIPPED && !updates.shippedAt) {
      updates.shippedAt = serverTimestamp();
    }
    if (status === OrderStatus.DELIVERED && !updates.deliveredAt) {
      updates.deliveredAt = serverTimestamp();
    }
    if (status === OrderStatus.CANCELLED && !updates.cancelledAt) {
      updates.cancelledAt = serverTimestamp();
    }

    await updateDoc(orderRef, updates);
  }

  /**
   * Agrega un evento al timeline
   */
  async addOrderEvent(orderId: string, event: any): Promise<void> {
    const orderRef = doc(this.firestore, this.ORDERS_COLLECTION, orderId);
    
    await updateDoc(orderRef, {
      timeline: arrayUnion({
        ...event,
        id: `evt_${Date.now()}`,
        createdAt: serverTimestamp()
      }),
      updatedAt: serverTimestamp()
    });
  }

  /**
   * Actualiza información de envío
   */
  async updateShippingInfo(
    orderId: string,
    trackingNumber: string,
    carrier: string
  ): Promise<void> {
    const orderRef = doc(this.firestore, this.ORDERS_COLLECTION, orderId);
    
    await updateDoc(orderRef, {
      trackingNumber,
      carrier,
      trackingUrl: '#', // Generar URL según carrier
      updatedAt: serverTimestamp()
    });
  }

  // ========== TRACKING OPERATIONS ==========

  /**
   * Crea o actualiza tracking
   */
  async upsertTracking(trackingData: Omit<OrderTrackingDoc, 'lastUpdated'>): Promise<void> {
    const trackingRef = doc(
      this.firestore,
      this.TRACKING_COLLECTION,
      trackingData.orderId
    );

    await setDoc(trackingRef, {
      ...trackingData,
      lastUpdated: serverTimestamp()
    }, { merge: true });
  }

  /**
   * Obtiene tracking de una orden
   */
  async getTracking(orderId: string): Promise<OrderTrackingDoc | null> {
    const trackingRef = doc(this.firestore, this.TRACKING_COLLECTION, orderId);
    const trackingSnap = await getDoc(trackingRef);

    if (!trackingSnap.exists()) {
      return null;
    }

    return trackingSnap.data() as OrderTrackingDoc;
  }

  /**
   * Observa tracking en tiempo real
   */
  watchTracking(orderId: string): Observable<OrderTrackingDoc | null> {
    return new Observable(observer => {
      const trackingRef = doc(this.firestore, this.TRACKING_COLLECTION, orderId);

      const unsubscribe = onSnapshot(
        trackingRef,
        snapshot => {
          if (snapshot.exists()) {
            observer.next(snapshot.data() as OrderTrackingDoc);
          } else {
            observer.next(null);
          }
        },
        error => observer.error(error)
      );

      return () => unsubscribe();
    });
  }

  // ========== CANCELLATION OPERATIONS ==========

  /**
   * Crea solicitud de cancelación
   */
  async createCancellation(
    cancellationData: Omit<OrderCancellationDoc, 'requestedAt'>
  ): Promise<OrderCancellationDoc> {
    const cancellationRef = doc(
      this.firestore,
      this.CANCELLATIONS_COLLECTION,
      cancellationData.orderId
    );

    const data: OrderCancellationDoc = {
      ...cancellationData,
      requestedAt: serverTimestamp() as Timestamp
    };

    await setDoc(cancellationRef, data);

    return data;
  }

  /**
   * Obtiene cancelación
   */
  async getCancellation(orderId: string): Promise<OrderCancellationDoc | null> {
    const cancellationRef = doc(this.firestore, this.CANCELLATIONS_COLLECTION, orderId);
    const cancellationSnap = await getDoc(cancellationRef);

    if (!cancellationSnap.exists()) {
      return null;
    }

    return cancellationSnap.data() as OrderCancellationDoc;
  }

  /**
   * Actualiza estado de cancelación
   */
  async updateCancellationStatus(
    orderId: string,
    status: string,
    refundAmount?: number
  ): Promise<void> {
    const cancellationRef = doc(this.firestore, this.CANCELLATIONS_COLLECTION, orderId);
    
    const updates: any = {
      status,
      processedAt: serverTimestamp()
    };

    if (refundAmount !== undefined) {
      updates.refundAmount = refundAmount;
      updates.refundedAt = serverTimestamp();
    }

    await updateDoc(cancellationRef, updates);
  }

  // ========== RETURN OPERATIONS ==========

  /**
   * Crea solicitud de devolución
   */
  async createReturn(
    returnData: Omit<OrderReturnDoc, 'id' | 'requestedAt'>
  ): Promise<OrderReturnDoc> {
    const returnRef = doc(collection(this.firestore, this.RETURNS_COLLECTION));

    const data: Omit<OrderReturnDoc, 'id'> = {
      ...returnData,
      requestedAt: serverTimestamp() as Timestamp
    };

    await setDoc(returnRef, data);

    return { id: returnRef.id, ...data } as OrderReturnDoc;
  }

  /**
   * Obtiene devolución
   */
  async getReturn(returnId: string): Promise<OrderReturnDoc | null> {
    const returnRef = doc(this.firestore, this.RETURNS_COLLECTION, returnId);
    const returnSnap = await getDoc(returnRef);

    if (!returnSnap.exists()) {
      return null;
    }

    return { id: returnSnap.id, ...returnSnap.data() } as OrderReturnDoc;
  }

  /**
   * Obtiene devoluciones del usuario
   */
  watchUserReturns(userId: string): Observable<OrderReturnDoc[]> {
    return new Observable(observer => {
      const q = query(
        collection(this.firestore, this.RETURNS_COLLECTION),
        where('userId', '==', userId),
        orderBy('requestedAt', 'desc')
      );

      const unsubscribe = onSnapshot(
        q,
        snapshot => {
          const returns = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as OrderReturnDoc[];
          observer.next(returns);
        },
        error => observer.error(error)
      );

      return () => unsubscribe();
    });
  }

  /**
   * Actualiza estado de devolución
   */
  async updateReturnStatus(returnId: string, status: string): Promise<void> {
    const returnRef = doc(this.firestore, this.RETURNS_COLLECTION, returnId);
    
    const updates: any = {
      status
    };

    // Actualizar timestamps según estado
    if (status === 'APPROVED') {
      updates.approvedAt = serverTimestamp();
    } else if (status === 'REJECTED') {
      updates.rejectedAt = serverTimestamp();
    } else if (status === 'COMPLETED' || status === 'REFUNDED') {
      updates.completedAt = serverTimestamp();
    }

    await updateDoc(returnRef, updates);
  }
}
