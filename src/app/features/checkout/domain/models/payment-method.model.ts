/**
 * Modelo de dominio: PaymentMethod
 * Representa un método de pago del usuario
 */

export interface PaymentMethod {
  readonly id: string;
  readonly userId: string;
  readonly type: PaymentMethodType;
  
  // Información de la tarjeta (tokenizada)
  readonly cardLast4?: string;
  readonly cardBrand?: CardBrand;
  readonly cardExpiryMonth?: number;
  readonly cardExpiryYear?: number;
  readonly cardHolderName?: string;
  
  // Información de PayPal
  readonly paypalEmail?: string;
  
  // Token del payment gateway
  readonly providerToken?: string; // Stripe token, PayPal token, etc.
  readonly provider: PaymentProvider;
  
  // Configuración
  readonly isDefault: boolean;
  readonly label?: string; // "Tarjeta personal", "PayPal trabajo"
  
  // Metadata
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly lastUsedAt?: Date;
}

export enum PaymentMethodType {
  CARD = 'CARD',
  PAYPAL = 'PAYPAL',
  CASH_ON_DELIVERY = 'CASH_ON_DELIVERY', // Pago contra entrega
  BANK_TRANSFER = 'BANK_TRANSFER' // Transferencia bancaria
}

export enum CardBrand {
  VISA = 'VISA',
  MASTERCARD = 'MASTERCARD',
  AMEX = 'AMEX',
  DISCOVER = 'DISCOVER',
  UNKNOWN = 'UNKNOWN'
}

export enum PaymentProvider {
  STRIPE = 'STRIPE',
  PAYPAL = 'PAYPAL',
  CONEKTA = 'CONEKTA', // Popular en México
  OPENPAY = 'OPENPAY', // Popular en México
  MERCADOPAGO = 'MERCADOPAGO', // Popular en Latinoamérica
  NONE = 'NONE' // Para cash on delivery
}

export interface CreatePaymentMethodDto {
  type: PaymentMethodType;
  provider: PaymentProvider;
  
  // Para tarjetas
  cardToken?: string; // Token del payment gateway
  cardLast4?: string;
  cardBrand?: CardBrand;
  cardExpiryMonth?: number;
  cardExpiryYear?: number;
  cardHolderName?: string;
  
  // Para PayPal
  paypalEmail?: string;
  paypalToken?: string;
  
  isDefault?: boolean;
  label?: string;
}

export interface PaymentIntent {
  readonly id: string;
  readonly amount: number;
  readonly currency: string;
  readonly status: PaymentIntentStatus;
  readonly paymentMethodId: string;
  readonly orderId?: string;
  readonly clientSecret?: string; // Para Stripe
  readonly metadata?: Record<string, any>;
  readonly createdAt: Date;
}

export enum PaymentIntentStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  SUCCEEDED = 'SUCCEEDED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED'
}

export interface PaymentResult {
  success: boolean;
  paymentIntentId?: string;
  orderId?: string;
  transactionId?: string;
  errorMessage?: string;
  errorCode?: string;
}
