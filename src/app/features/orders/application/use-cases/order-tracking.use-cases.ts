/**
 * Use Cases: Order Tracking
 * Gestión de seguimiento de envíos
 */

import { inject } from '@angular/core';
import { Observable } from 'rxjs';
import { OrderRepositoryPort } from '../../domain/order.repository.port';
import { OrderDomainService } from '../../domain/order.domain.service';
import { Order, OrderEventType } from '../../../checkout/domain/order.model';
import {
  OrderTracking,
  UpdateTrackingDto,
  OrderCarrier,
  ShippingStatus
} from '../../domain/order-extensions.model';

/**
 * Obtiene información de tracking
 */
export class GetOrderTrackingUseCase {
  private readonly repository = inject(OrderRepositoryPort);

  async execute(orderId: string): Promise<OrderTracking | null> {
    return this.repository.getOrderTracking(orderId);
  }
}

/**
 * Observa cambios en tracking en tiempo real
 */
export class WatchOrderTrackingUseCase {
  private readonly repository = inject(OrderRepositoryPort);

  execute(orderId: string): Observable<OrderTracking | null> {
    return this.repository.watchOrderTracking(orderId);
  }
}

/**
 * Actualiza información de tracking (Admin)
 */
export class UpdateTrackingUseCase {
  private readonly repository = inject(OrderRepositoryPort);

  async execute(orderId: string, dto: UpdateTrackingDto): Promise<void> {
    // Obtener la orden
    const order = await this.repository.getOrder(orderId);
    
    if (!order) {
      throw new Error('Orden no encontrada');
    }

    // Actualizar tracking
    await this.repository.updateTracking(orderId, dto);

    // Actualizar estado de la orden según el estado del envío
    const newOrderStatus = OrderDomainService.mapShippingStatusToOrderStatus(dto.status);
    
    if (newOrderStatus !== order.status) {
      await this.repository.updateOrderStatus(orderId, newOrderStatus);
    }

    // Agregar evento al timeline
    const message = this.getTrackingUpdateMessage(dto);
    const event = OrderDomainService.createOrderEvent(
      this.mapShippingStatusToEventType(dto.status),
      newOrderStatus,
      message,
      {
        trackingNumber: dto.trackingNumber,
        carrier: dto.carrier,
        location: dto.location
      }
    );

    await this.repository.addOrderEvent(orderId, event);
  }

  private getTrackingUpdateMessage(dto: UpdateTrackingDto): string {
    const statusMessages: Record<ShippingStatus, string> = {
      [ShippingStatus.LABEL_CREATED]: 'Etiqueta de envío creada',
      [ShippingStatus.PICKED_UP]: `Paquete recogido por ${dto.carrier}`,
      [ShippingStatus.IN_TRANSIT]: `En tránsito${dto.location ? ` - ${dto.location}` : ''}`,
      [ShippingStatus.OUT_FOR_DELIVERY]: 'En ruta de entrega',
      [ShippingStatus.DELIVERED]: 'Paquete entregado',
      [ShippingStatus.DELIVERY_ATTEMPTED]: 'Intento de entrega fallido',
      [ShippingStatus.EXCEPTION]: `Excepción en envío: ${dto.description || 'Ver detalles'}`,
      [ShippingStatus.RETURNED_TO_SENDER]: 'Paquete devuelto al remitente'
    };

    return statusMessages[dto.status] || dto.description || 'Actualización de tracking';
  }

  private mapShippingStatusToEventType(status: ShippingStatus): OrderEventType {
    switch (status) {
      case ShippingStatus.LABEL_CREATED:
      case ShippingStatus.PICKED_UP:
        return OrderEventType.SHIPPED;
      
      case ShippingStatus.IN_TRANSIT:
        return OrderEventType.IN_TRANSIT;
      
      case ShippingStatus.OUT_FOR_DELIVERY:
        return OrderEventType.OUT_FOR_DELIVERY;
      
      case ShippingStatus.DELIVERED:
        return OrderEventType.DELIVERED;
      
      default:
        return OrderEventType.NOTE_ADDED;
    }
  }
}

/**
 * Actualiza información de envío inicial (Admin)
 */
export class UpdateShippingInfoUseCase {
  private readonly repository = inject(OrderRepositoryPort);

  async execute(
    orderId: string,
    trackingNumber: string,
    carrier: OrderCarrier
  ): Promise<void> {
    // Obtener la orden
    const order = await this.repository.getOrder(orderId);
    
    if (!order) {
      throw new Error('Orden no encontrada');
    }

    // Actualizar información de envío
    await this.repository.updateShippingInfo(
      orderId,
      trackingNumber,
      carrier
    );

    // Crear tracking inicial
    const trackingDto: UpdateTrackingDto = {
      trackingNumber,
      carrier,
      status: ShippingStatus.LABEL_CREATED,
      description: 'Etiqueta de envío creada'
    };

    await this.repository.updateTracking(orderId, trackingDto);

    // Generar URL de tracking
    const trackingUrl = OrderDomainService.generateTrackingUrl(carrier, trackingNumber);

    // Agregar evento
    const event = OrderDomainService.createOrderEvent(
      OrderEventType.SHIPPED,
      order.status,
      `Orden enviada con ${carrier}. Número de rastreo: ${trackingNumber}`,
      {
        trackingNumber,
        carrier,
        trackingUrl
      }
    );

    await this.repository.addOrderEvent(orderId, event);
  }
}

/**
 * Genera URL de tracking
 */
export class GenerateTrackingUrlUseCase {
  execute(carrier: OrderCarrier, trackingNumber: string): string {
    return OrderDomainService.generateTrackingUrl(carrier, trackingNumber);
  }
}
