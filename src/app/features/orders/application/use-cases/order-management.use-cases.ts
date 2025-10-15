/**
 * Use Cases: Order Management
 * Operaciones básicas de gestión de órdenes
 */

import { inject } from '@angular/core';
import { Observable } from 'rxjs';
import { OrderRepositoryPort } from '../../domain/order.repository.port';
import { OrderDomainService } from '../../domain/order.domain.service';
import { Order, CreateOrderDto, OrderStatus, OrderEventType } from '../../../checkout/domain/order.model';
import {
  OrderFilters,
  OrderSortOptions,
  OrderSortField,
  OrderStatistics,
  ReorderResult
} from '../../domain/order-extensions.model';

/**
 * Crea una nueva orden
 */
export class CreateOrderUseCase {
  private readonly repository = inject(OrderRepositoryPort);

  async execute(dto: CreateOrderDto): Promise<Order> {
    // Crear la orden
    const order = await this.repository.createOrder(dto);

    // Agregar evento inicial
    const event = OrderDomainService.createOrderEvent(
      OrderEventType.CREATED,
      OrderStatus.PENDING_PAYMENT,
      'Orden creada exitosamente'
    );

    await this.repository.addOrderEvent(order.id, event);

    return order;
  }
}

/**
 * Obtiene una orden por ID
 */
export class GetOrderUseCase {
  private readonly repository = inject(OrderRepositoryPort);

  async execute(orderId: string): Promise<Order | null> {
    return this.repository.getOrder(orderId);
  }
}

/**
 * Obtiene todas las órdenes de un usuario
 */
export class GetUserOrdersUseCase {
  private readonly repository = inject(OrderRepositoryPort);

  execute(userId: string): Observable<Order[]> {
    return this.repository.getUserOrders(userId);
  }
}

/**
 * Obtiene órdenes filtradas y ordenadas
 */
export class GetFilteredOrdersUseCase {
  private readonly repository = inject(OrderRepositoryPort);

  execute(
    userId: string,
    filters: OrderFilters = {},
    sortField: OrderSortField = OrderSortField.CREATED_AT,
    sortDirection: 'asc' | 'desc' = 'desc'
  ): Observable<Order[]> {
    const sort: OrderSortOptions = {
      field: sortField,
      direction: sortDirection
    };

    return this.repository.getFilteredOrders(userId, filters, sort);
  }
}

/**
 * Obtiene estadísticas de órdenes del usuario
 */
export class GetUserStatisticsUseCase {
  private readonly repository = inject(OrderRepositoryPort);

  async execute(userId: string): Promise<OrderStatistics> {
    return this.repository.getUserStatistics(userId);
  }
}

/**
 * Actualiza el estado de una orden
 */
export class UpdateOrderStatusUseCase {
  private readonly repository = inject(OrderRepositoryPort);

  async execute(orderId: string, newStatus: OrderStatus, notes?: string): Promise<void> {
    await this.repository.updateOrderStatus(orderId, newStatus);

    // Agregar evento al timeline
    const message = OrderDomainService.getEventMessage(
      this.mapStatusToEventType(newStatus),
      { notes }
    );

    const event = OrderDomainService.createOrderEvent(
      this.mapStatusToEventType(newStatus),
      newStatus,
      message
    );

    await this.repository.addOrderEvent(orderId, event);
  }

  private mapStatusToEventType(status: OrderStatus): OrderEventType {
    const mapping: Partial<Record<OrderStatus, OrderEventType>> = {
      [OrderStatus.PROCESSING]: OrderEventType.PROCESSING,
      [OrderStatus.SHIPPED]: OrderEventType.SHIPPED,
      [OrderStatus.IN_TRANSIT]: OrderEventType.IN_TRANSIT,
      [OrderStatus.OUT_FOR_DELIVERY]: OrderEventType.OUT_FOR_DELIVERY,
      [OrderStatus.DELIVERED]: OrderEventType.DELIVERED,
      [OrderStatus.CANCELLED]: OrderEventType.CANCELLED,
      [OrderStatus.REFUNDED]: OrderEventType.REFUNDED
    };

    return mapping[status] || OrderEventType.NOTE_ADDED;
  }
}

/**
 * Re-ordena una orden anterior
 */
export class ReorderUseCase {
  private readonly repository = inject(OrderRepositoryPort);

  async execute(userId: string, orderId: string): Promise<ReorderResult> {
    // Verificar que la orden existe
    const order = await this.repository.getOrder(orderId);
    
    if (!order) {
      throw new Error('Orden no encontrada');
    }

    // Verificar que es del usuario correcto
    if (order.userId !== userId) {
      throw new Error('No tienes permiso para re-ordenar esta orden');
    }

    // Ejecutar reorden
    return this.repository.reorder(userId, orderId);
  }
}

/**
 * Agrega una nota a la orden
 */
export class AddOrderNoteUseCase {
  private readonly repository = inject(OrderRepositoryPort);

  async execute(orderId: string, note: string): Promise<void> {
    const order = await this.repository.getOrder(orderId);
    
    if (!order) {
      throw new Error('Orden no encontrada');
    }

    const event = OrderDomainService.createOrderEvent(
      OrderEventType.NOTE_ADDED,
      order.status,
      note,
      { note }
    );

    await this.repository.addOrderEvent(orderId, event);
  }
}

/**
 * Busca órdenes por número de orden o query
 */
export class SearchOrdersUseCase {
  private readonly repository = inject(OrderRepositoryPort);

  execute(userId: string, searchQuery: string): Observable<Order[]> {
    const filters: OrderFilters = {
      searchQuery
    };

    const sort: OrderSortOptions = {
      field: OrderSortField.CREATED_AT,
      direction: 'desc'
    };

    return this.repository.getFilteredOrders(userId, filters, sort);
  }
}

/**
 * Obtiene órdenes por rango de fechas
 */
export class GetOrdersByDateRangeUseCase {
  private readonly repository = inject(OrderRepositoryPort);

  execute(userId: string, dateFrom: Date, dateTo: Date): Observable<Order[]> {
    const filters: OrderFilters = {
      dateFrom,
      dateTo
    };

    const sort: OrderSortOptions = {
      field: OrderSortField.CREATED_AT,
      direction: 'desc'
    };

    return this.repository.getFilteredOrders(userId, filters, sort);
  }
}

/**
 * Obtiene órdenes por estado
 */
export class GetOrdersByStatusUseCase {
  private readonly repository = inject(OrderRepositoryPort);

  execute(userId: string, statuses: OrderStatus[]): Observable<Order[]> {
    const filters: OrderFilters = {
      status: statuses
    };

    const sort: OrderSortOptions = {
      field: OrderSortField.CREATED_AT,
      direction: 'desc'
    };

    return this.repository.getFilteredOrders(userId, filters, sort);
  }
}
