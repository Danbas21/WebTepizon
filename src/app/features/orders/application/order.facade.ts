/**
 * Facade: OrderFacade
 * Punto de entrada único para todas las operaciones de Orders
 * Usa Signals de Angular 20 para estado reactivo
 */

import { Injectable, inject, signal, computed } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Observable } from 'rxjs';

// Domain
import { Order, OrderStatus } from '../../checkout/domain/order.model';
import {
  OrderTracking,
  OrderCancellation,
  OrderReturn,
  OrderFilters,
  OrderSortField,
  OrderStatistics,
  ReorderResult,
  CreateOrderCancellationDto,
  CreateOrderReturnDto,
  UpdateTrackingDto,
  OrderCarrier,
  CancellationReason,
  ReturnReason,
  ReturnStatus
} from '../domain/order-extensions.model';
import { OrderDomainService } from '../domain/order.domain.service';

// Use Cases - Management
import {
  CreateOrderUseCase,
  GetOrderUseCase,
  GetUserOrdersUseCase,
  GetFilteredOrdersUseCase,
  GetUserStatisticsUseCase,
  UpdateOrderStatusUseCase,
  ReorderUseCase,
  AddOrderNoteUseCase,
  SearchOrdersUseCase,
  GetOrdersByDateRangeUseCase,
  GetOrdersByStatusUseCase
} from './use-cases/order-management.use-cases';

// Use Cases - Tracking
import {
  GetOrderTrackingUseCase,
  WatchOrderTrackingUseCase,
  UpdateTrackingUseCase,
  UpdateShippingInfoUseCase,
  GenerateTrackingUrlUseCase
} from './use-cases/order-tracking.use-cases';

// Use Cases - Cancellation & Returns
import {
  CanCancelOrderUseCase,
  RequestCancellationUseCase,
  GetCancellationUseCase,
  ProcessCancellationUseCase,
  CanReturnOrderUseCase,
  RequestReturnUseCase,
  GetReturnUseCase,
  GetUserReturnsUseCase,
  UpdateReturnStatusUseCase,
  CalculateReturnRefundUseCase,
  GetReturnPolicyUseCase
} from './use-cases/order-cancellation-return.use-cases';

@Injectable({ providedIn: 'root' })
export class OrderFacade {
  // ========== USE CASES ==========
  
  // Management
  private readonly createOrderUC = inject(CreateOrderUseCase);
  private readonly getOrderUC = inject(GetOrderUseCase);
  private readonly getUserOrdersUC = inject(GetUserOrdersUseCase);
  private readonly getFilteredOrdersUC = inject(GetFilteredOrdersUseCase);
  private readonly getUserStatisticsUC = inject(GetUserStatisticsUseCase);
  private readonly updateOrderStatusUC = inject(UpdateOrderStatusUseCase);
  private readonly reorderUC = inject(ReorderUseCase);
  private readonly addOrderNoteUC = inject(AddOrderNoteUseCase);
  private readonly searchOrdersUC = inject(SearchOrdersUseCase);
  private readonly getOrdersByDateRangeUC = inject(GetOrdersByDateRangeUseCase);
  private readonly getOrdersByStatusUC = inject(GetOrdersByStatusUseCase);
  
  // Tracking
  private readonly getOrderTrackingUC = inject(GetOrderTrackingUseCase);
  private readonly watchOrderTrackingUC = inject(WatchOrderTrackingUseCase);
  private readonly updateTrackingUC = inject(UpdateTrackingUseCase);
  private readonly updateShippingInfoUC = inject(UpdateShippingInfoUseCase);
  private readonly generateTrackingUrlUC = inject(GenerateTrackingUrlUseCase);
  
  // Cancellation & Returns
  private readonly canCancelOrderUC = inject(CanCancelOrderUseCase);
  private readonly requestCancellationUC = inject(RequestCancellationUseCase);
  private readonly getCancellationUC = inject(GetCancellationUseCase);
  private readonly processCancellationUC = inject(ProcessCancellationUseCase);
  private readonly canReturnOrderUC = inject(CanReturnOrderUseCase);
  private readonly requestReturnUC = inject(RequestReturnUseCase);
  private readonly getReturnUC = inject(GetReturnUseCase);
  private readonly getUserReturnsUC = inject(GetUserReturnsUseCase);
  private readonly updateReturnStatusUC = inject(UpdateReturnStatusUseCase);
  private readonly calculateReturnRefundUC = inject(CalculateReturnRefundUseCase);
  private readonly getReturnPolicyUC = inject(GetReturnPolicyUseCase);

  // ========== STATE - SIGNALS ==========
  
  private readonly currentUserId = signal<string | null>(null);
  private readonly isLoading = signal<boolean>(false);
  private readonly error = signal<string | null>(null);
  private readonly currentFilters = signal<OrderFilters>({});
  private readonly currentSort = signal<{ field: OrderSortField; direction: 'asc' | 'desc' }>({
    field: OrderSortField.CREATED_AT,
    direction: 'desc'
  });

  // Orders Observable → Signal
  private readonly ordersObservable$ = computed(() => {
    const userId = this.currentUserId();
    const filters = this.currentFilters();
    const sort = this.currentSort();
    
    return userId 
      ? this.getFilteredOrdersUC.execute(userId, filters, sort.field, sort.direction)
      : null;
  });
  
  readonly orders = toSignal(
    this.ordersObservable$() || new Observable<Order[]>(),
    { initialValue: [] }
  );

  // Returns Observable → Signal
  private readonly returnsObservable$ = computed(() => {
    const userId = this.currentUserId();
    return userId ? this.getUserReturnsUC.execute(userId) : null;
  });
  
  readonly returns = toSignal(
    this.returnsObservable$() || new Observable<OrderReturn[]>(),
    { initialValue: [] }
  );

  // ========== COMPUTED SIGNALS ==========
  
  readonly hasOrders = computed(() => this.orders().length > 0);
  readonly ordersCount = computed(() => this.orders().length);
  
  // Órdenes por estado
  readonly pendingOrders = computed(() => 
    this.orders().filter(o => o.status === OrderStatus.PENDING_PAYMENT)
  );
  
  readonly activeOrders = computed(() => 
    this.orders().filter(o => 
      o.status === OrderStatus.PROCESSING ||
      o.status === OrderStatus.SHIPPED ||
      o.status === OrderStatus.IN_TRANSIT ||
      o.status === OrderStatus.OUT_FOR_DELIVERY
    )
  );
  
  readonly completedOrders = computed(() => 
    this.orders().filter(o => o.status === OrderStatus.DELIVERED)
  );
  
  readonly cancelledOrders = computed(() => 
    this.orders().filter(o => 
      o.status === OrderStatus.CANCELLED ||
      o.status === OrderStatus.REFUNDED
    )
  );

  // Returns
  readonly hasReturns = computed(() => this.returns().length > 0);
  readonly activeReturns = computed(() => 
    this.returns().filter(r => 
      r.status !== ReturnStatus.COMPLETED &&
      r.status !== ReturnStatus.REFUNDED &&
      r.status !== ReturnStatus.REJECTED
    )
  );

  // ========== INITIALIZATION ==========

  initialize(userId: string): void {
    this.currentUserId.set(userId);
    this.error.set(null);
  }

  reset(): void {
    this.currentUserId.set(null);
    this.error.set(null);
    this.isLoading.set(false);
    this.currentFilters.set({});
  }

  // ========== ORDER MANAGEMENT ==========

  async getOrder(orderId: string): Promise<Order | null> {
    this.isLoading.set(true);
    this.error.set(null);

    try {
      return await this.getOrderUC.execute(orderId);
    } catch (error: any) {
      this.error.set(error.message);
      throw error;
    } finally {
      this.isLoading.set(false);
    }
  }

  async getUserStatistics(): Promise<OrderStatistics | null> {
    const userId = this.currentUserId();
    if (!userId) return null;

    this.isLoading.set(true);
    this.error.set(null);

    try {
      return await this.getUserStatisticsUC.execute(userId);
    } catch (error: any) {
      this.error.set(error.message);
      throw error;
    } finally {
      this.isLoading.set(false);
    }
  }

  async reorder(orderId: string): Promise<ReorderResult> {
    const userId = this.currentUserId();
    if (!userId) throw new Error('Usuario no autenticado');

    this.isLoading.set(true);
    this.error.set(null);

    try {
      return await this.reorderUC.execute(userId, orderId);
    } catch (error: any) {
      this.error.set(error.message);
      throw error;
    } finally {
      this.isLoading.set(false);
    }
  }

  async addOrderNote(orderId: string, note: string): Promise<void> {
    this.isLoading.set(true);
    this.error.set(null);

    try {
      await this.addOrderNoteUC.execute(orderId, note);
    } catch (error: any) {
      this.error.set(error.message);
      throw error;
    } finally {
      this.isLoading.set(false);
    }
  }

  // ========== FILTERING & SORTING ==========

  setFilters(filters: OrderFilters): void {
    this.currentFilters.set(filters);
  }

  clearFilters(): void {
    this.currentFilters.set({});
  }

  setSorting(field: OrderSortField, direction: 'asc' | 'desc'): void {
    this.currentSort.set({ field, direction });
  }

  searchOrders(query: string): void {
    this.setFilters({ searchQuery: query });
  }

  filterByStatus(statuses: OrderStatus[]): void {
    this.setFilters({ status: statuses });
  }

  filterByDateRange(from: Date, to: Date): void {
    this.setFilters({ dateFrom: from, dateTo: to });
  }

  // ========== TRACKING ==========

  async getOrderTracking(orderId: string): Promise<OrderTracking | null> {
    this.isLoading.set(true);
    this.error.set(null);

    try {
      return await this.getOrderTrackingUC.execute(orderId);
    } catch (error: any) {
      this.error.set(error.message);
      throw error;
    } finally {
      this.isLoading.set(false);
    }
  }

  watchOrderTracking(orderId: string): Observable<OrderTracking | null> {
    return this.watchOrderTrackingUC.execute(orderId);
  }

  generateTrackingUrl(carrier: OrderCarrier, trackingNumber: string): string {
    return this.generateTrackingUrlUC.execute(carrier, trackingNumber);
  }

  // Admin only
  async updateTracking(orderId: string, dto: UpdateTrackingDto): Promise<void> {
    this.isLoading.set(true);
    this.error.set(null);

    try {
      await this.updateTrackingUC.execute(orderId, dto);
    } catch (error: any) {
      this.error.set(error.message);
      throw error;
    } finally {
      this.isLoading.set(false);
    }
  }

  // Admin only
  async updateShippingInfo(
    orderId: string,
    trackingNumber: string,
    carrier: OrderCarrier
  ): Promise<void> {
    this.isLoading.set(true);
    this.error.set(null);

    try {
      await this.updateShippingInfoUC.execute(orderId, trackingNumber, carrier);
    } catch (error: any) {
      this.error.set(error.message);
      throw error;
    } finally {
      this.isLoading.set(false);
    }
  }

  // ========== CANCELLATION ==========

  async canCancelOrder(orderId: string): Promise<{ canCancel: boolean; reason?: string }> {
    return this.canCancelOrderUC.execute(orderId);
  }

  async requestCancellation(dto: CreateOrderCancellationDto): Promise<OrderCancellation> {
    this.isLoading.set(true);
    this.error.set(null);

    try {
      return await this.requestCancellationUC.execute(dto);
    } catch (error: any) {
      this.error.set(error.message);
      throw error;
    } finally {
      this.isLoading.set(false);
    }
  }

  async getCancellation(orderId: string): Promise<OrderCancellation | null> {
    return this.getCancellationUC.execute(orderId);
  }

  // ========== RETURNS ==========

  async canReturnOrder(orderId: string): Promise<{ canReturn: boolean; reason?: string }> {
    return this.canReturnOrderUC.execute(orderId);
  }

  async requestReturn(dto: CreateOrderReturnDto): Promise<OrderReturn> {
    this.isLoading.set(true);
    this.error.set(null);

    try {
      return await this.requestReturnUC.execute(dto);
    } catch (error: any) {
      this.error.set(error.message);
      throw error;
    } finally {
      this.isLoading.set(false);
    }
  }

  async getReturn(returnId: string): Promise<OrderReturn | null> {
    return this.getReturnUC.execute(returnId);
  }

  async calculateReturnRefund(returnId: string) {
    return this.calculateReturnRefundUC.execute(returnId);
  }

  getReturnPolicy(): string {
    return this.getReturnPolicyUC.execute();
  }

  // ========== HELPERS ==========

  getStatusDescription(status: OrderStatus): string {
    return OrderDomainService.getStatusDescription(status);
  }

  getOrderSummary(order: Order): string {
    return OrderDomainService.generateOrderSummary(order);
  }

  // ========== GETTERS ==========
  
  getLoadingState = () => this.isLoading();
  getError = () => this.error();
  getCurrentUserId = () => this.currentUserId();
  getCurrentFilters = () => this.currentFilters();
  getCurrentSort = () => this.currentSort();
}
