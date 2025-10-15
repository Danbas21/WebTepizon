/**
 * Puerto: OrderRepositoryPort
 * Define el contrato para la persistencia de órdenes
 * Implementado por la capa de infraestructura
 */

import { Observable } from 'rxjs';
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
} from './order-extensions.model';

export abstract class OrderRepositoryPort {
  // ========== ORDER OPERATIONS ==========
  
  /**
   * Crea una nueva orden
   */
  abstract createOrder(dto: CreateOrderDto): Promise<Order>;
  
  /**
   * Obtiene una orden por ID
   */
  abstract getOrder(orderId: string): Promise<Order | null>;
  
  /**
   * Obtiene todas las órdenes del usuario
   */
  abstract getUserOrders(userId: string): Observable<Order[]>;
  
  /**
   * Obtiene órdenes filtradas
   */
  abstract getFilteredOrders(
    userId: string,
    filters: OrderFilters,
    sort: OrderSortOptions
  ): Observable<Order[]>;
  
  /**
   * Actualiza el estado de una orden
   */
  abstract updateOrderStatus(orderId: string, status: OrderStatus): Promise<void>;
  
  /**
   * Agrega un evento al timeline de la orden
   */
  abstract addOrderEvent(orderId: string, event: Omit<any, 'id'>): Promise<void>;
  
  // ========== TRACKING ==========
  
  /**
   * Obtiene información de tracking
   */
  abstract getOrderTracking(orderId: string): Promise<OrderTracking | null>;
  
  /**
   * Actualiza información de tracking
   */
  abstract updateTracking(orderId: string, dto: UpdateTrackingDto): Promise<void>;
  
  /**
   * Escucha cambios en tracking en tiempo real
   */
  abstract watchOrderTracking(orderId: string): Observable<OrderTracking | null>;
  
  // ========== CANCELLATION ==========
  
  /**
   * Solicita cancelación de orden
   */
  abstract requestCancellation(dto: CreateOrderCancellationDto): Promise<OrderCancellation>;
  
  /**
   * Obtiene información de cancelación
   */
  abstract getCancellation(orderId: string): Promise<OrderCancellation | null>;
  
  /**
   * Procesa una cancelación (aprueba/rechaza)
   */
  abstract processCancellation(
    cancellationId: string,
    approved: boolean,
    notes?: string
  ): Promise<void>;
  
  // ========== RETURNS ==========
  
  /**
   * Solicita devolución de orden
   */
  abstract requestReturn(dto: CreateOrderReturnDto): Promise<OrderReturn>;
  
  /**
   * Obtiene información de devolución
   */
  abstract getReturn(returnId: string): Promise<OrderReturn | null>;
  
  /**
   * Obtiene todas las devoluciones de un usuario
   */
  abstract getUserReturns(userId: string): Observable<OrderReturn[]>;
  
  /**
   * Actualiza el estado de una devolución
   */
  abstract updateReturnStatus(returnId: string, status: any): Promise<void>;
  
  // ========== REORDER ==========
  
  /**
   * Re-ordena una orden anterior
   */
  abstract reorder(userId: string, orderId: string): Promise<ReorderResult>;
  
  // ========== STATISTICS ==========
  
  /**
   * Obtiene estadísticas de órdenes del usuario
   */
  abstract getUserStatistics(userId: string): Promise<OrderStatistics>;
  
  // ========== ADMIN OPERATIONS ==========
  
  /**
   * Obtiene todas las órdenes (admin)
   */
  abstract getAllOrders(filters?: OrderFilters): Observable<Order[]>;
  
  /**
   * Actualiza información de envío
   */
  abstract updateShippingInfo(
    orderId: string,
    trackingNumber: string,
    carrier: string
  ): Promise<void>;
}
