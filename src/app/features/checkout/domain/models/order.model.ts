/**
 * Modelo de dominio: Order
 * Representa una orden de compra completada
 */

export interface Order {
  readonly id: string;
  readonly orderNumber: string; // Número de orden visible (e.g., "ORD-2025-00123")
  readonly userId: string;
  
  // Items de la orden
  readonly items: readonly OrderItem[];
  
  // Información de envío
  readonly shippingAddress: OrderAddress;
  readonly shippingOption: OrderShippingOption;
  
  // Información de pago
  readonly paymentMethod: OrderPaymentMethod;
  readonly paymentStatus: PaymentStatus;
  readonly paymentIntentId?: string;
  readonly transactionId?: string;
  
  // Totales
  readonly totals: OrderTotals;
  
  // Cupón aplicado
  readonly appliedCoupon?: OrderCoupon;
  
  // Estados
  readonly status: OrderStatus;
  readonly fulfillmentStatus: FulfillmentStatus;
  
  // Tracking
  readonly trackingNumber?: string;
  readonly trackingUrl?: string;
  readonly carrier?: string;
  
  // Facturación
  readonly invoice?: OrderInvoice;
  readonly requiresInvoice: boolean;
  
  // Metadata
  readonly notes?: string;
  readonly customerNotes?: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly paidAt?: Date;
  readonly shippedAt?: Date;
  readonly deliveredAt?: Date;
  readonly cancelledAt?: Date;
  
  // Timeline de eventos
  readonly timeline: readonly OrderEvent[];
}

export interface OrderItem {
  readonly id: string;
  readonly productId: string;
  readonly variantId?: string;
  readonly sku: string;
  readonly name: string;
  readonly brand: string;
  readonly image: string;
  readonly slug: string;
  readonly quantity: number;
  readonly unitPrice: number;
  readonly subtotal: number;
  readonly discount: number;
  readonly total: number;
  
  // Snapshot de variante
  readonly size?: string;
  readonly color?: string;
  
  // Fulfillment
  readonly status: OrderItemStatus;
  readonly returnRequested: boolean;
  readonly returnedAt?: Date;
}

export interface OrderAddress {
  readonly fullName: string;
  readonly phoneNumber: string;
  readonly email?: string;
  readonly street: string;
  readonly exteriorNumber: string;
  readonly interiorNumber?: string;
  readonly neighborhood: string;
  readonly city: string;
  readonly state: string;
  readonly postalCode: string;
  readonly country: string;
  readonly references?: string;
}

export interface OrderShippingOption {
  readonly type: string;
  readonly name: string;
  readonly cost: number;
  readonly estimatedDays: number;
  readonly carrier?: string;
}

export interface OrderPaymentMethod {
  readonly type: string;
  readonly cardLast4?: string;
  readonly cardBrand?: string;
  readonly provider: string;
}

export interface OrderTotals {
  readonly itemsCount: number;
  readonly itemsQuantity: number;
  readonly subtotal: number;
  readonly itemsDiscount: number;
  readonly couponDiscount: number;
  readonly totalDiscount: number;
  readonly shippingCost: number;
  readonly taxRate: number;
  readonly tax: number;
  readonly total: number;
}

export interface OrderCoupon {
  readonly code: string;
  readonly type: string;
  readonly value: number;
  readonly discountAmount: number;
}

export interface OrderInvoice {
  readonly rfc: string;
  readonly businessName: string;
  readonly fiscalAddress: OrderAddress;
  readonly cfdiUse: string; // Uso de CFDI
  readonly invoiceUrl?: string;
  readonly invoiceNumber?: string;
  readonly issuedAt?: Date;
}

export interface OrderEvent {
  readonly id: string;
  readonly type: OrderEventType;
  readonly status: OrderStatus;
  readonly message: string;
  readonly createdAt: Date;
  readonly createdBy?: string;
  readonly metadata?: Record<string, any>;
}

export enum OrderStatus {
  PENDING_PAYMENT = 'PENDING_PAYMENT',
  PAYMENT_FAILED = 'PAYMENT_FAILED',
  PAID = 'PAID',
  PROCESSING = 'PROCESSING',
  SHIPPED = 'SHIPPED',
  IN_TRANSIT = 'IN_TRANSIT',
  OUT_FOR_DELIVERY = 'OUT_FOR_DELIVERY',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
  REFUNDED = 'REFUNDED',
  PARTIALLY_REFUNDED = 'PARTIALLY_REFUNDED'
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  AUTHORIZED = 'AUTHORIZED',
  CAPTURED = 'CAPTURED',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
  PARTIALLY_REFUNDED = 'PARTIALLY_REFUNDED'
}

export enum FulfillmentStatus {
  UNFULFILLED = 'UNFULFILLED',
  PARTIALLY_FULFILLED = 'PARTIALLY_FULFILLED',
  FULFILLED = 'FULFILLED',
  RETURNED = 'RETURNED',
  PARTIALLY_RETURNED = 'PARTIALLY_RETURNED'
}

export enum OrderItemStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  SHIPPED = 'SHIPPED',
  DELIVERED = 'DELIVERED',
  RETURNED = 'RETURNED',
  CANCELLED = 'CANCELLED'
}

export enum OrderEventType {
  CREATED = 'CREATED',
  PAYMENT_RECEIVED = 'PAYMENT_RECEIVED',
  PAYMENT_FAILED = 'PAYMENT_FAILED',
  PROCESSING = 'PROCESSING',
  SHIPPED = 'SHIPPED',
  IN_TRANSIT = 'IN_TRANSIT',
  OUT_FOR_DELIVERY = 'OUT_FOR_DELIVERY',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
  REFUNDED = 'REFUNDED',
  NOTE_ADDED = 'NOTE_ADDED'
}

export interface CreateOrderDto {
  userId: string;
  cartId: string;
  shippingAddressId: string;
  shippingOptionId: string;
  paymentMethodId: string;
  requiresInvoice?: boolean;
  invoice?: OrderInvoice;
  customerNotes?: string;
}

export interface OrderSummary {
  readonly orderNumber: string;
  readonly total: number;
  readonly status: OrderStatus;
  readonly itemsCount: number;
  readonly createdAt: Date;
  readonly estimatedDelivery?: Date;
}
