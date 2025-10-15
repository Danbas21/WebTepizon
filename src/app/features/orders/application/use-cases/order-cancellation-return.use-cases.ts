/**
 * Use Cases: Order Cancellation & Returns
 * Gestión de cancelaciones y devoluciones de órdenes
 */

import { inject } from '@angular/core';
import { Observable } from 'rxjs';
import { OrderRepositoryPort } from '../../domain/order.repository.port';
import { OrderDomainService } from '../../domain/order.domain.service';
import { OrderStatus, OrderEventType } from '../../../checkout/domain/order.model';
import {
  OrderCancellation,
  OrderReturn,
  CreateOrderCancellationDto,
  CreateOrderReturnDto,
  CancellationStatus,
  ReturnStatus
} from '../../domain/order-extensions.model';

// ========== CANCELLATION ==========

/**
 * Verifica si una orden puede ser cancelada
 */
export class CanCancelOrderUseCase {
  private readonly repository = inject(OrderRepositoryPort);

  async execute(orderId: string): Promise<{ canCancel: boolean; reason?: string }> {
    const order = await this.repository.getOrder(orderId);
    
    if (!order) {
      return {
        canCancel: false,
        reason: 'Orden no encontrada'
      };
    }

    return OrderDomainService.canCancelOrder(order);
  }
}

/**
 * Solicita cancelación de una orden
 */
export class RequestCancellationUseCase {
  private readonly repository = inject(OrderRepositoryPort);

  async execute(dto: CreateOrderCancellationDto): Promise<OrderCancellation> {
    // Verificar que la orden existe y puede ser cancelada
    const order = await this.repository.getOrder(dto.orderId);
    
    if (!order) {
      throw new Error('Orden no encontrada');
    }

    const canCancel = OrderDomainService.canCancelOrder(order);
    
    if (!canCancel.canCancel) {
      throw new Error(canCancel.reason || 'No se puede cancelar esta orden');
    }

    // Validar razón de cancelación
    if (!OrderDomainService.isValidCancellationReason(dto.reason)) {
      throw new Error('Razón de cancelación inválida');
    }

    // Crear solicitud de cancelación
    const cancellation = await this.repository.requestCancellation(dto);

    // Agregar evento
    const event = OrderDomainService.createOrderEvent(
      OrderEventType.CANCELLED,
      OrderStatus.CANCELLED,
      `Solicitud de cancelación: ${dto.reason}`,
      {
        reason: dto.reason,
        notes: dto.notes
      }
    );

    await this.repository.addOrderEvent(dto.orderId, event);

    return cancellation;
  }
}

/**
 * Obtiene información de cancelación
 */
export class GetCancellationUseCase {
  private readonly repository = inject(OrderRepositoryPort);

  async execute(orderId: string): Promise<OrderCancellation | null> {
    return this.repository.getCancellation(orderId);
  }
}

/**
 * Procesa una cancelación (Admin)
 */
export class ProcessCancellationUseCase {
  private readonly repository = inject(OrderRepositoryPort);

  async execute(
    cancellationId: string,
    approved: boolean,
    adminNotes?: string
  ): Promise<void> {
    // Obtener la cancelación
    const cancellation = await this.repository.getCancellation(cancellationId);
    
    if (!cancellation) {
      throw new Error('Cancelación no encontrada');
    }

    if (cancellation.status !== CancellationStatus.PENDING) {
      throw new Error('Esta cancelación ya fue procesada');
    }

    // Procesar cancelación
    await this.repository.processCancellation(cancellationId, approved, adminNotes);

    // Si fue aprobada, actualizar estado de la orden y calcular reembolso
    if (approved) {
      const order = await this.repository.getOrder(cancellation.orderId);
      
      if (order) {
        await this.repository.updateOrderStatus(cancellation.orderId, OrderStatus.CANCELLED);

        const refundAmount = OrderDomainService.calculateCancellationRefund(order);

        const event = OrderDomainService.createOrderEvent(
          OrderEventType.REFUNDED,
          OrderStatus.REFUNDED,
          `Cancelación aprobada. Reembolso de $${refundAmount.toFixed(2)} MXN procesado`,
          {
            refundAmount,
            adminNotes
          }
        );

        await this.repository.addOrderEvent(cancellation.orderId, event);
      }
    } else {
      // Si fue rechazada
      const event = OrderDomainService.createOrderEvent(
        OrderEventType.NOTE_ADDED,
        OrderStatus.PROCESSING,
        `Solicitud de cancelación rechazada: ${adminNotes || 'Sin especificar'}`,
        {
          adminNotes
        }
      );

      await this.repository.addOrderEvent(cancellation.orderId, event);
    }
  }
}

// ========== RETURNS ==========

/**
 * Verifica si una orden puede ser devuelta
 */
export class CanReturnOrderUseCase {
  private readonly repository = inject(OrderRepositoryPort);

  async execute(orderId: string): Promise<{ canReturn: boolean; reason?: string }> {
    const order = await this.repository.getOrder(orderId);
    
    if (!order) {
      return {
        canReturn: false,
        reason: 'Orden no encontrada'
      };
    }

    return OrderDomainService.canReturnOrder(order);
  }
}

/**
 * Solicita devolución de una orden
 */
export class RequestReturnUseCase {
  private readonly repository = inject(OrderRepositoryPort);

  async execute(dto: CreateOrderReturnDto): Promise<OrderReturn> {
    // Verificar que la orden existe y puede ser devuelta
    const order = await this.repository.getOrder(dto.orderId);
    
    if (!order) {
      throw new Error('Orden no encontrada');
    }

    const canReturn = OrderDomainService.canReturnOrder(order);
    
    if (!canReturn.canReturn) {
      throw new Error(canReturn.reason || 'No se puede devolver esta orden');
    }

    // Validar razón de devolución
    if (!OrderDomainService.isValidReturnReason(dto.reason)) {
      throw new Error('Razón de devolución inválida');
    }

    // Verificar que se proporcionaron fotos si son requeridas
    const requiresPhotos = OrderDomainService.requiresPhotos(dto.reason);
    if (requiresPhotos && (!dto.photos || dto.photos.length === 0)) {
      throw new Error('Se requieren fotos para este tipo de devolución');
    }

    // Validar que los items existen en la orden
    for (const item of dto.items) {
      const orderItem = order.items.find(oi => oi.id === item.orderItemId);
      if (!orderItem) {
        throw new Error(`Item no encontrado en la orden: ${item.orderItemId}`);
      }
      if (item.quantity > orderItem.quantity) {
        throw new Error(`Cantidad inválida para item: ${orderItem.name}`);
      }
    }

    // Crear solicitud de devolución
    const returnRequest = await this.repository.requestReturn(dto);

    // Agregar evento
    const event = OrderDomainService.createOrderEvent(
      OrderEventType.NOTE_ADDED,
      order.status,
      `Solicitud de devolución: ${dto.reason}`,
      {
        reason: dto.reason,
        items: dto.items.length,
        notes: dto.notes
      }
    );

    await this.repository.addOrderEvent(dto.orderId, event);

    return returnRequest;
  }
}

/**
 * Obtiene información de una devolución
 */
export class GetReturnUseCase {
  private readonly repository = inject(OrderRepositoryPort);

  async execute(returnId: string): Promise<OrderReturn | null> {
    return this.repository.getReturn(returnId);
  }
}

/**
 * Obtiene todas las devoluciones de un usuario
 */
export class GetUserReturnsUseCase {
  private readonly repository = inject(OrderRepositoryPort);

  execute(userId: string): Observable<OrderReturn[]> {
    return this.repository.getUserReturns(userId);
  }
}

/**
 * Actualiza el estado de una devolución (Admin)
 */
export class UpdateReturnStatusUseCase {
  private readonly repository = inject(OrderRepositoryPort);

  async execute(
    returnId: string,
    newStatus: ReturnStatus,
    notes?: string
  ): Promise<void> {
    const returnRequest = await this.repository.getReturn(returnId);
    
    if (!returnRequest) {
      throw new Error('Devolución no encontrada');
    }

    await this.repository.updateReturnStatus(returnId, newStatus);

    // Agregar evento a la orden
    const message = this.getReturnStatusMessage(newStatus, notes);
    
    const event = OrderDomainService.createOrderEvent(
      OrderEventType.NOTE_ADDED,
      OrderStatus.DELIVERED, // La orden sigue siendo delivered
      message,
      {
        returnStatus: newStatus,
        notes
      }
    );

    await this.repository.addOrderEvent(returnRequest.orderId, event);

    // Si fue completada y reembolsada
    if (newStatus === ReturnStatus.REFUNDED) {
      const refundEvent = OrderDomainService.createOrderEvent(
        OrderEventType.REFUNDED,
        OrderStatus.PARTIALLY_REFUNDED,
        `Reembolso de devolución procesado: $${returnRequest.refundAmount.toFixed(2)} MXN`,
        {
          returnId,
          refundAmount: returnRequest.refundAmount
        }
      );

      await this.repository.addOrderEvent(returnRequest.orderId, refundEvent);
    }
  }

  private getReturnStatusMessage(status: ReturnStatus, notes?: string): string {
    const messages: Record<ReturnStatus, string> = {
      [ReturnStatus.REQUESTED]: 'Devolución solicitada',
      [ReturnStatus.PENDING_APPROVAL]: 'Devolución pendiente de aprobación',
      [ReturnStatus.APPROVED]: 'Devolución aprobada',
      [ReturnStatus.REJECTED]: `Devolución rechazada${notes ? `: ${notes}` : ''}`,
      [ReturnStatus.SHIPPING_LABEL_SENT]: 'Etiqueta de devolución enviada',
      [ReturnStatus.IN_TRANSIT]: 'Devolución en tránsito',
      [ReturnStatus.RECEIVED]: 'Devolución recibida',
      [ReturnStatus.INSPECTING]: 'Inspeccionando productos devueltos',
      [ReturnStatus.COMPLETED]: 'Devolución completada',
      [ReturnStatus.REFUNDED]: 'Reembolso procesado'
    };

    return messages[status];
  }
}

/**
 * Calcula reembolso de devolución
 */
export class CalculateReturnRefundUseCase {
  private readonly repository = inject(OrderRepositoryPort);

  async execute(returnId: string): Promise<{
    refundAmount: number;
    breakdown: {
      itemsTotal: number;
      restockFee: number;
      shippingRefund: number;
      finalRefund: number;
    };
  }> {
    const returnRequest = await this.repository.getReturn(returnId);
    
    if (!returnRequest) {
      throw new Error('Devolución no encontrada');
    }

    const order = await this.repository.getOrder(returnRequest.orderId);
    
    if (!order) {
      throw new Error('Orden no encontrada');
    }

    return OrderDomainService.calculateReturnRefund(
      order,
      returnRequest.items.map(item => ({
        orderItemId: item.orderItemId,
        quantity: item.quantity,
        condition: item.condition
      })),
      returnRequest.reason
    );
  }
}

/**
 * Obtiene política de devoluciones
 */
export class GetReturnPolicyUseCase {
  execute(): string {
    return OrderDomainService.getReturnPolicy();
  }
}
