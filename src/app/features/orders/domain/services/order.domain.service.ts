/**
 * Servicio de Dominio: OrderDomainService
 * Contiene la lógica de negocio pura de Orders
 */

import { Order, OrderStatus, OrderEvent, OrderEventType } from '../../checkout/domain/order.model';
import {
  OrderCancellation,
  OrderReturn,
  CancellationReason,
  ReturnReason,
  OrderCarrier,
  ShippingStatus,
  ProductCondition,
  RefundMethod,
  ORDER_BUSINESS_RULES
} from './order-extensions.model';

export class OrderDomainService {
  // ========== ORDER STATUS VALIDATION ==========

  /**
   * Verifica si una orden puede ser cancelada
   */
  static canCancelOrder(order: Order): {
    canCancel: boolean;
    reason?: string;
  } {
    // Verificar si ya está cancelada
    if (order.status === OrderStatus.CANCELLED) {
      return {
        canCancel: false,
        reason: 'La orden ya está cancelada'
      };
    }

    // Verificar si ya fue entregada
    if (order.status === OrderStatus.DELIVERED) {
      return {
        canCancel: false,
        reason: 'No puedes cancelar una orden ya entregada. Solicita una devolución.'
      };
    }

    // Verificar estados permitidos
    if (!ORDER_BUSINESS_RULES.CANCELLABLE_STATUSES.includes(order.status as any)) {
      return {
        canCancel: false,
        reason: 'La orden ya está en proceso y no puede ser cancelada'
      };
    }

    // Verificar ventana de tiempo
    const hoursSinceOrder = this.getHoursSince(order.createdAt);
    if (hoursSinceOrder > ORDER_BUSINESS_RULES.CANCELLATION_WINDOW_HOURS) {
      return {
        canCancel: false,
        reason: `Solo puedes cancelar dentro de las primeras ${ORDER_BUSINESS_RULES.CANCELLATION_WINDOW_HOURS} horas`
      };
    }

    return { canCancel: true };
  }

  /**
   * Verifica si una orden puede ser devuelta
   */
  static canReturnOrder(order: Order): {
    canReturn: boolean;
    reason?: string;
  } {
    // Verificar si está entregada
    if (!ORDER_BUSINESS_RULES.RETURNABLE_STATUSES.includes(order.status as any)) {
      return {
        canReturn: false,
        reason: 'Solo puedes devolver órdenes que ya fueron entregadas'
      };
    }

    // Verificar si ya fue cancelada o reembolsada
    if (order.status === OrderStatus.CANCELLED || order.status === OrderStatus.REFUNDED) {
      return {
        canReturn: false,
        reason: 'Esta orden ya fue cancelada o reembolsada'
      };
    }

    // Verificar ventana de tiempo
    if (!order.deliveredAt) {
      return {
        canReturn: false,
        reason: 'La orden aún no ha sido entregada'
      };
    }

    const daysSinceDelivery = this.getDaysSince(order.deliveredAt);
    if (daysSinceDelivery > ORDER_BUSINESS_RULES.RETURN_WINDOW_DAYS) {
      return {
        canReturn: false,
        reason: `El período de devolución de ${ORDER_BUSINESS_RULES.RETURN_WINDOW_DAYS} días ha expirado`
      };
    }

    return { canReturn: true };
  }

  // ========== REFUND CALCULATIONS ==========

  /**
   * Calcula el monto de reembolso para una cancelación
   */
  static calculateCancellationRefund(order: Order): number {
    // Si la orden no fue pagada, no hay reembolso
    if (order.paymentStatus !== 'CAPTURED') {
      return 0;
    }

    // Reembolso completo para cancelaciones
    return order.totals.total;
  }

  /**
   * Calcula el monto de reembolso para una devolución
   */
  static calculateReturnRefund(
    order: Order,
    returnedItems: Array<{ orderItemId: string; quantity: number; condition: ProductCondition }>,
    reason: ReturnReason
  ): {
    refundAmount: number;
    breakdown: {
      itemsTotal: number;
      restockFee: number;
      shippingRefund: number;
      finalRefund: number;
    };
  } {
    // Calcular total de items devueltos
    let itemsTotal = 0;
    
    returnedItems.forEach(returnItem => {
      const orderItem = order.items.find(i => i.id === returnItem.orderItemId);
      if (orderItem) {
        const itemRefund = (orderItem.total / orderItem.quantity) * returnItem.quantity;
        itemsTotal += itemRefund;
      }
    });

    // Aplicar restock fee si es por cambio de opinión
    let restockFee = 0;
    if (reason === ReturnReason.CHANGED_MIND) {
      restockFee = itemsTotal * ORDER_BUSINESS_RULES.RESTOCK_FEE_PERCENTAGE;
    }

    // Reembolsar envío solo si es defecto o error
    let shippingRefund = 0;
    const refundableReasons = [
      ReturnReason.DEFECTIVE,
      ReturnReason.WRONG_ITEM,
      ReturnReason.NOT_AS_DESCRIBED,
      ReturnReason.DAMAGED_IN_SHIPPING
    ];
    
    if (refundableReasons.includes(reason)) {
      shippingRefund = order.totals.shippingCost;
    }

    const finalRefund = itemsTotal - restockFee + shippingRefund;

    return {
      refundAmount: Math.max(0, finalRefund),
      breakdown: {
        itemsTotal,
        restockFee,
        shippingRefund,
        finalRefund
      }
    };
  }

  /**
   * Determina si el envío de devolución es gratis
   */
  static isFreeReturnShipping(order: Order, reason: ReturnReason): boolean {
    // Envío gratis si el problema es del vendedor
    const freeReasons = [
      ReturnReason.DEFECTIVE,
      ReturnReason.WRONG_ITEM,
      ReturnReason.NOT_AS_DESCRIBED,
      ReturnReason.DAMAGED_IN_SHIPPING
    ];

    if (freeReasons.includes(reason)) {
      return true;
    }

    // Envío gratis si la orden superó el umbral
    return order.totals.total >= ORDER_BUSINESS_RULES.FREE_RETURN_SHIPPING_THRESHOLD;
  }

  // ========== ORDER EVENTS ==========

  /**
   * Crea un evento de orden
   */
  static createOrderEvent(
    type: OrderEventType,
    status: OrderStatus,
    message: string,
    metadata?: Record<string, any>
  ): Omit<OrderEvent, 'id'> {
    return {
      type,
      status,
      message,
      createdAt: new Date(),
      metadata
    };
  }

  /**
   * Genera mensaje descriptivo para un evento
   */
  static getEventMessage(type: OrderEventType, metadata?: Record<string, any>): string {
    switch (type) {
      case OrderEventType.CREATED:
        return 'Orden creada exitosamente';
      
      case OrderEventType.PAYMENT_RECEIVED:
        return 'Pago recibido y confirmado';
      
      case OrderEventType.PAYMENT_FAILED:
        return `Pago fallido: ${metadata?.reason || 'Error desconocido'}`;
      
      case OrderEventType.PROCESSING:
        return 'Orden en preparación';
      
      case OrderEventType.SHIPPED:
        return `Orden enviada con ${metadata?.carrier || 'transportista'}. Tracking: ${metadata?.trackingNumber || 'N/A'}`;
      
      case OrderEventType.IN_TRANSIT:
        return `En tránsito ${metadata?.location ? `- ${metadata.location}` : ''}`;
      
      case OrderEventType.OUT_FOR_DELIVERY:
        return 'En ruta de entrega';
      
      case OrderEventType.DELIVERED:
        return 'Orden entregada exitosamente';
      
      case OrderEventType.CANCELLED:
        return `Orden cancelada: ${metadata?.reason || 'Sin especificar'}`;
      
      case OrderEventType.REFUNDED:
        return `Reembolso procesado: $${metadata?.amount || 0} MXN`;
      
      case OrderEventType.NOTE_ADDED:
        return metadata?.note || 'Nota agregada';
      
      default:
        return 'Evento registrado';
    }
  }

  // ========== TRACKING ==========

  /**
   * Mapea ShippingStatus a OrderStatus
   */
  static mapShippingStatusToOrderStatus(shippingStatus: ShippingStatus): OrderStatus {
    switch (shippingStatus) {
      case ShippingStatus.LABEL_CREATED:
      case ShippingStatus.PICKED_UP:
        return OrderStatus.SHIPPED;
      
      case ShippingStatus.IN_TRANSIT:
        return OrderStatus.IN_TRANSIT;
      
      case ShippingStatus.OUT_FOR_DELIVERY:
        return OrderStatus.OUT_FOR_DELIVERY;
      
      case ShippingStatus.DELIVERED:
        return OrderStatus.DELIVERED;
      
      case ShippingStatus.RETURNED_TO_SENDER:
        return OrderStatus.CANCELLED;
      
      default:
        return OrderStatus.PROCESSING;
    }
  }

  /**
   * Genera URL de tracking según el carrier
   */
  static generateTrackingUrl(carrier: OrderCarrier, trackingNumber: string): string {
    const urls: Record<OrderCarrier, string> = {
      [OrderCarrier.DHL]: `https://www.dhl.com/mx-es/home/rastreo.html?tracking-id=${trackingNumber}`,
      [OrderCarrier.FEDEX]: `https://www.fedex.com/fedextrack/?trknbr=${trackingNumber}`,
      [OrderCarrier.ESTAFETA]: `https://www.estafeta.com/Rastreo/?wayBill=${trackingNumber}`,
      [OrderCarrier.REDPACK]: `https://www.redpack.com.mx/es/rastreo/?guias=${trackingNumber}`,
      [OrderCarrier.UPS]: `https://www.ups.com/track?tracknum=${trackingNumber}`,
      [OrderCarrier.PAQUETEXPRESS]: `https://www.paquetexpress.com.mx/rastreo/${trackingNumber}`,
      [OrderCarrier.MENSAJERIA_LOCAL]: '#',
      [OrderCarrier.OTHER]: '#'
    };

    return urls[carrier];
  }

  // ========== VALIDATION HELPERS ==========

  /**
   * Valida razón de cancelación
   */
  static isValidCancellationReason(reason: CancellationReason): boolean {
    return Object.values(CancellationReason).includes(reason);
  }

  /**
   * Valida razón de devolución
   */
  static isValidReturnReason(reason: ReturnReason): boolean {
    return Object.values(ReturnReason).includes(reason);
  }

  /**
   * Verifica si una devolución requiere fotos
   */
  static requiresPhotos(reason: ReturnReason): boolean {
    return [
      ReturnReason.DEFECTIVE,
      ReturnReason.DAMAGED_IN_SHIPPING,
      ReturnReason.NOT_AS_DESCRIBED,
      ReturnReason.QUALITY_ISSUE
    ].includes(reason);
  }

  // ========== DATE HELPERS ==========

  /**
   * Calcula horas desde una fecha
   */
  private static getHoursSince(date: Date): number {
    const now = new Date();
    const diffMs = now.getTime() - new Date(date).getTime();
    return diffMs / (1000 * 60 * 60);
  }

  /**
   * Calcula días desde una fecha
   */
  private static getDaysSince(date: Date): number {
    const now = new Date();
    const diffMs = now.getTime() - new Date(date).getTime();
    return diffMs / (1000 * 60 * 60 * 24);
  }

  /**
   * Estima fecha de reembolso
   */
  static estimateRefundDate(returnApprovedDate: Date): Date {
    const refundDate = new Date(returnApprovedDate);
    refundDate.setDate(refundDate.getDate() + ORDER_BUSINESS_RULES.REFUND_PROCESSING_DAYS);
    return refundDate;
  }

  // ========== ORDER SUMMARY ==========

  /**
   * Genera resumen de orden para notificaciones
   */
  static generateOrderSummary(order: Order): string {
    const items = order.items.length;
    const total = order.totals.total;
    return `${items} ${items === 1 ? 'artículo' : 'artículos'} • Total: $${total.toFixed(2)} MXN`;
  }

  /**
   * Genera descripción de estado legible
   */
  static getStatusDescription(status: OrderStatus): string {
    const descriptions: Record<OrderStatus, string> = {
      [OrderStatus.PENDING_PAYMENT]: 'Esperando pago',
      [OrderStatus.PAYMENT_FAILED]: 'Pago fallido',
      [OrderStatus.PAID]: 'Pago confirmado',
      [OrderStatus.PROCESSING]: 'En preparación',
      [OrderStatus.SHIPPED]: 'Enviado',
      [OrderStatus.IN_TRANSIT]: 'En tránsito',
      [OrderStatus.OUT_FOR_DELIVERY]: 'En ruta de entrega',
      [OrderStatus.DELIVERED]: 'Entregado',
      [OrderStatus.CANCELLED]: 'Cancelado',
      [OrderStatus.REFUNDED]: 'Reembolsado',
      [OrderStatus.PARTIALLY_REFUNDED]: 'Reembolsado parcialmente'
    };

    return descriptions[status] || status;
  }

  // ========== RETURN POLICY ==========

  /**
   * Verifica si un producto es elegible para devolución
   */
  static isProductReturnable(productCategory?: string): boolean {
    // Categorías no retornables
    const nonReturnableCategories = [
      'underwear',
      'swimwear',
      'cosmetics',
      'earrings',
      'digital-products',
      'gift-cards',
      'clearance',
      'final-sale'
    ];

    if (productCategory && nonReturnableCategories.includes(productCategory.toLowerCase())) {
      return false;
    }

    return true;
  }

  /**
   * Genera términos de devolución
   */
  static getReturnPolicy(): string {
    return `
Política de Devoluciones:
• Tienes ${ORDER_BUSINESS_RULES.RETURN_WINDOW_DAYS} días desde la entrega para solicitar una devolución
• Los artículos deben estar sin usar y en su empaque original
• Se aplicará un cargo de reposición del ${ORDER_BUSINESS_RULES.RESTOCK_FEE_PERCENTAGE * 100}% por cambio de opinión
• Envío de devolución gratis para productos defectuosos o errores de nuestra parte
• Reembolso procesado en ${ORDER_BUSINESS_RULES.REFUND_PROCESSING_DAYS} días hábiles
    `.trim();
  }
}
