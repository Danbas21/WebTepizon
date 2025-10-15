/**
 * Repository Implementation: OrderRepositoryImpl
 * Implementa el puerto usando el FirebaseAdapter
 * Versión completa pero preparada para extensión
 */

import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { OrderRepositoryPort } from '../domain/order.repository.port';
import { Order, CreateOrderDto, OrderStatus } from '../../checkout/domain/order.model';
import {
  OrderTracking,
  OrderCancellation,
  OrderReturn,
  OrderFilters,
  OrderSortOptions,
  OrderStatistics,
  ReorderResult,
  CreateOrderCancellationDto,
  CreateOrderReturnDto,
  UpdateTrackingDto
} from '../domain/order-extensions.model';
import { OrderDomainService } from '../domain/order.domain.service';
import {
  FirebaseOrderAdapter,
  OrderDoc,
  OrderTrackingDoc,
  OrderCancellationDoc,
  OrderReturnDoc
} from './firebase-order.adapter';
import { Timestamp } from '@angular/fire/firestore';

@Injectable({ providedIn: 'root' })
export class OrderRepositoryImpl extends OrderRepositoryPort {
  private readonly adapter = inject(FirebaseOrderAdapter);

  // ========== ORDER OPERATIONS ==========

  async createOrder(dto: CreateOrderDto): Promise<Order> {
    // Generar número de orden
    const orderNumber = OrderDomainService.generateOrderNumber();

    // Construir documento de orden
    const orderDoc: Omit<OrderDoc, 'id'> = {
      orderNumber,
      userId: dto.userId,
      items: [], // TODO: Mapear desde cart
      shippingAddress: {}, // TODO: Obtener de addressId
      shippingOption: {}, // TODO: Obtener de shippingOptionId
      paymentMethod: {}, // TODO: Obtener de paymentMethodId
      paymentStatus: 'PENDING',
      totals: {
        itemsCount: 0,
        itemsQuantity: 0,
        subtotal: 0,
        itemsDiscount: 0,
        couponDiscount: 0,
        totalDiscount: 0,
        shippingCost: 0,
        taxRate: 0.16,
        tax: 0,
        total: 0
      },
      status: OrderStatus.PENDING_PAYMENT,
      fulfillmentStatus: 'UNFULFILLED',
      requiresInvoice: dto.requiresInvoice || false,
      invoice: dto.invoice,
      customerNotes: dto.customerNotes,
      timeline: []
    } as any;

    const created = await this.adapter.createOrder(orderDoc);
    return this.mapToOrder(created);
  }

  async getOrder(orderId: string): Promise<Order | null> {
    const doc = await this.adapter.getOrder(orderId);
    return doc ? this.mapToOrder(doc) : null;
  }

  getUserOrders(userId: string): Observable<Order[]> {
    return this.adapter.watchUserOrders(userId).pipe(
      map(docs => docs.map(doc => this.mapToOrder(doc)))
    );
  }

  getFilteredOrders(
    userId: string,
    filters: OrderFilters,
    sort: OrderSortOptions
  ): Observable<Order[]> {
    // Por ahora, obtener todas y filtrar en memoria
    // TODO: Implementar queries complejos en Firestore
    return this.getUserOrders(userId).pipe(
      map(orders => {
        let filtered = [...orders];

        // Filtrar por estado
        if (filters.status && filters.status.length > 0) {
          filtered = filtered.filter(o => filters.status!.includes(o.status));
        }

        // Filtrar por fecha
        if (filters.dateFrom) {
          filtered = filtered.filter(o => 
            o.createdAt >= filters.dateFrom!
          );
        }
        if (filters.dateTo) {
          filtered = filtered.filter(o => 
            o.createdAt <= filters.dateTo!
          );
        }

        // Filtrar por monto
        if (filters.minAmount !== undefined) {
          filtered = filtered.filter(o => 
            o.totals.total >= filters.minAmount!
          );
        }
        if (filters.maxAmount !== undefined) {
          filtered = filtered.filter(o => 
            o.totals.total <= filters.maxAmount!
          );
        }

        // Filtrar por búsqueda
        if (filters.searchQuery) {
          const query = filters.searchQuery.toLowerCase();
          filtered = filtered.filter(o =>
            o.orderNumber.toLowerCase().includes(query) ||
            o.items.some(item => item.name.toLowerCase().includes(query))
          );
        }

        // Ordenar
        filtered.sort((a, b) => {
          let aValue: any;
          let bValue: any;

          switch (sort.field) {
            case 'CREATED_AT':
              aValue = a.createdAt.getTime();
              bValue = b.createdAt.getTime();
              break;
            case 'TOTAL':
              aValue = a.totals.total;
              bValue = b.totals.total;
              break;
            case 'ORDER_NUMBER':
              aValue = a.orderNumber;
              bValue = b.orderNumber;
              break;
            case 'STATUS':
              aValue = a.status;
              bValue = b.status;
              break;
            default:
              return 0;
          }

          if (sort.direction === 'asc') {
            return aValue > bValue ? 1 : -1;
          } else {
            return aValue < bValue ? 1 : -1;
          }
        });

        return filtered;
      })
    );
  }

  async updateOrderStatus(orderId: string, status: OrderStatus): Promise<void> {
    await this.adapter.updateOrderStatus(orderId, status);
  }

  async addOrderEvent(orderId: string, event: any): Promise<void> {
    await this.adapter.addOrderEvent(orderId, event);
  }

  // ========== TRACKING ==========

  async getOrderTracking(orderId: string): Promise<OrderTracking | null> {
    const doc = await this.adapter.getTracking(orderId);
    return doc ? this.mapToTracking(doc) : null;
  }

  async updateTracking(orderId: string, dto: UpdateTrackingDto): Promise<void> {
    const tracking: Omit<OrderTrackingDoc, 'lastUpdated'> = {
      orderId,
      trackingNumber: dto.trackingNumber,
      carrier: dto.carrier,
      currentStatus: dto.status,
      estimatedDelivery: Timestamp.now(), // TODO: Calcular fecha estimada
      currentLocation: dto.location,
      checkpoints: [] // TODO: Agregar checkpoint
    };

    await this.adapter.upsertTracking(tracking);
  }

  watchOrderTracking(orderId: string): Observable<OrderTracking | null> {
    return this.adapter.watchTracking(orderId).pipe(
      map(doc => doc ? this.mapToTracking(doc) : null)
    );
  }

  // ========== CANCELLATION ==========

  async requestCancellation(dto: CreateOrderCancellationDto): Promise<OrderCancellation> {
    const cancellationDoc: Omit<OrderCancellationDoc, 'requestedAt'> = {
      orderId: dto.orderId,
      requestedBy: '', // TODO: Get from auth
      reason: dto.reason,
      notes: dto.notes,
      status: 'PENDING'
    };

    const created = await this.adapter.createCancellation(cancellationDoc);
    return this.mapToCancellation(created);
  }

  async getCancellation(orderId: string): Promise<OrderCancellation | null> {
    const doc = await this.adapter.getCancellation(orderId);
    return doc ? this.mapToCancellation(doc) : null;
  }

  async processCancellation(
    cancellationId: string,
    approved: boolean,
    notes?: string
  ): Promise<void> {
    const status = approved ? 'APPROVED' : 'REJECTED';
    await this.adapter.updateCancellationStatus(cancellationId, status);
  }

  // ========== RETURNS ==========

  async requestReturn(dto: CreateOrderReturnDto): Promise<OrderReturn> {
    const returnDoc: Omit<OrderReturnDoc, 'id' | 'requestedAt'> = {
      orderId: dto.orderId,
      userId: '', // TODO: Get from auth
      items: dto.items,
      reason: dto.reason,
      notes: dto.notes,
      photos: dto.photos,
      status: 'REQUESTED',
      refundAmount: 0, // Calcular
      refundMethod: 'ORIGINAL_PAYMENT'
    };

    const created = await this.adapter.createReturn(returnDoc);
    return this.mapToReturn(created);
  }

  async getReturn(returnId: string): Promise<OrderReturn | null> {
    const doc = await this.adapter.getReturn(returnId);
    return doc ? this.mapToReturn(doc) : null;
  }

  getUserReturns(userId: string): Observable<OrderReturn[]> {
    return this.adapter.watchUserReturns(userId).pipe(
      map(docs => docs.map(doc => this.mapToReturn(doc)))
    );
  }

  async updateReturnStatus(returnId: string, status: any): Promise<void> {
    await this.adapter.updateReturnStatus(returnId, status);
  }

  // ========== REORDER ==========

  async reorder(userId: string, orderId: string): Promise<ReorderResult> {
    // TODO: Implementar lógica de reorden
    // 1. Obtener orden
    // 2. Verificar disponibilidad de productos
    // 3. Agregar al carrito
    console.log('[OrderRepository] Reorder (stub)');
    
    return {
      success: true,
      cartId: 'cart_123',
      unavailableItems: []
    };
  }

  // ========== STATISTICS ==========

  async getUserStatistics(userId: string): Promise<OrderStatistics> {
    const orders = await new Promise<Order[]>((resolve) => {
      this.getUserOrders(userId).subscribe(orders => resolve(orders));
    });

    const totalOrders = orders.length;
    const totalSpent = orders.reduce((sum, o) => sum + o.totals.total, 0);
    const averageOrderValue = totalOrders > 0 ? totalSpent / totalOrders : 0;

    const ordersByStatus: Record<OrderStatus, number> = {} as any;
    Object.values(OrderStatus).forEach(status => {
      ordersByStatus[status] = orders.filter(o => o.status === status).length;
    });

    return {
      totalOrders,
      totalSpent,
      averageOrderValue,
      ordersByStatus,
      mostOrderedProducts: []
    };
  }

  // ========== ADMIN ==========

  getAllOrders(filters?: OrderFilters): Observable<Order[]> {
    // TODO: Implementar query admin
    console.log('[OrderRepository] Get all orders (admin stub)');
    return new Observable(observer => observer.next([]));
  }

  async updateShippingInfo(
    orderId: string,
    trackingNumber: string,
    carrier: string
  ): Promise<void> {
    await this.adapter.updateShippingInfo(orderId, trackingNumber, carrier);
  }

  // ========== MAPPERS ==========

  private mapToOrder(doc: OrderDoc): Order {
    return {
      id: doc.id,
      orderNumber: doc.orderNumber,
      userId: doc.userId,
      items: doc.items || [],
      shippingAddress: doc.shippingAddress || {} as any,
      shippingOption: doc.shippingOption || {} as any,
      paymentMethod: doc.paymentMethod || {} as any,
      paymentStatus: doc.paymentStatus as any,
      paymentIntentId: doc.paymentIntentId,
      transactionId: doc.transactionId,
      totals: doc.totals,
      appliedCoupon: doc.appliedCoupon,
      status: doc.status,
      fulfillmentStatus: doc.fulfillmentStatus as any,
      trackingNumber: doc.trackingNumber,
      trackingUrl: doc.trackingUrl,
      carrier: doc.carrier,
      invoice: doc.invoice,
      requiresInvoice: doc.requiresInvoice,
      notes: doc.notes,
      customerNotes: doc.customerNotes,
      createdAt: this.timestampToDate(doc.createdAt),
      updatedAt: this.timestampToDate(doc.updatedAt),
      paidAt: doc.paidAt ? this.timestampToDate(doc.paidAt) : undefined,
      shippedAt: doc.shippedAt ? this.timestampToDate(doc.shippedAt) : undefined,
      deliveredAt: doc.deliveredAt ? this.timestampToDate(doc.deliveredAt) : undefined,
      cancelledAt: doc.cancelledAt ? this.timestampToDate(doc.cancelledAt) : undefined,
      timeline: doc.timeline || []
    };
  }

  private mapToTracking(doc: OrderTrackingDoc): OrderTracking {
    return {
      orderId: doc.orderId,
      trackingNumber: doc.trackingNumber,
      carrier: doc.carrier as any,
      currentStatus: doc.currentStatus as any,
      estimatedDelivery: this.timestampToDate(doc.estimatedDelivery),
      currentLocation: doc.currentLocation,
      checkpoints: doc.checkpoints || [],
      lastUpdated: this.timestampToDate(doc.lastUpdated)
    };
  }

  private mapToCancellation(doc: OrderCancellationDoc): OrderCancellation {
    return {
      orderId: doc.orderId,
      requestedAt: this.timestampToDate(doc.requestedAt),
      requestedBy: doc.requestedBy,
      reason: doc.reason as any,
      notes: doc.notes,
      status: doc.status as any,
      processedAt: doc.processedAt ? this.timestampToDate(doc.processedAt) : undefined,
      refundAmount: doc.refundAmount,
      refundedAt: doc.refundedAt ? this.timestampToDate(doc.refundedAt) : undefined
    };
  }

  private mapToReturn(doc: OrderReturnDoc): OrderReturn {
    return {
      id: doc.id,
      orderId: doc.orderId,
      userId: doc.userId,
      items: doc.items,
      reason: doc.reason as any,
      notes: doc.notes,
      photos: doc.photos,
      status: doc.status as any,
      requestedAt: this.timestampToDate(doc.requestedAt),
      approvedAt: doc.approvedAt ? this.timestampToDate(doc.approvedAt) : undefined,
      rejectedAt: doc.rejectedAt ? this.timestampToDate(doc.rejectedAt) : undefined,
      completedAt: doc.completedAt ? this.timestampToDate(doc.completedAt) : undefined,
      refundAmount: doc.refundAmount,
      refundMethod: doc.refundMethod as any,
      returnShipping: doc.returnShipping
    };
  }

  private timestampToDate(timestamp: Timestamp | Date): Date {
    if (timestamp instanceof Timestamp) {
      return timestamp.toDate();
    }
    return timestamp;
  }
}
