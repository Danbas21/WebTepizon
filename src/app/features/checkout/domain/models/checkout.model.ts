/**
 * Modelo de dominio: Checkout
 * Representa el estado completo del proceso de checkout
 */

import { Address } from './address.model';
import { PaymentMethod } from './payment-method.model';
import { ShippingCalculation, ShippingOption } from './shipping.model';

export interface CheckoutSession {
  readonly id: string;
  readonly userId: string;
  readonly cartId: string;
  
  // Estado del checkout
  readonly currentStep: CheckoutStep;
  readonly completedSteps: readonly CheckoutStep[];
  readonly canProceed: boolean;
  
  // Información seleccionada
  readonly selectedAddress?: Address;
  readonly selectedShippingOption?: ShippingOption;
  readonly selectedPaymentMethod?: PaymentMethod;
  
  // Cálculos
  readonly shippingCalculation?: ShippingCalculation;
  readonly orderSummary: CheckoutOrderSummary;
  
  // Validaciones
  readonly validations: CheckoutValidations;
  
  // Facturación
  readonly requiresInvoice: boolean;
  readonly invoiceData?: InvoiceData;
  
  // Metadata
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly expiresAt: Date; // Sesión expira después de X tiempo
}

export enum CheckoutStep {
  SHIPPING = 'SHIPPING',
  PAYMENT = 'PAYMENT',
  REVIEW = 'REVIEW'
}

export interface CheckoutOrderSummary {
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
  
  // Información adicional
  readonly currency: string;
  readonly hasDiscounts: boolean;
  readonly qualifiesForFreeShipping: boolean;
}

export interface CheckoutValidations {
  readonly hasValidCart: boolean;
  readonly hasValidAddress: boolean;
  readonly hasValidShipping: boolean;
  readonly hasValidPayment: boolean;
  readonly hasStockAvailable: boolean;
  readonly canPlaceOrder: boolean;
  readonly errors: readonly CheckoutError[];
  readonly warnings: readonly CheckoutWarning[];
}

export interface CheckoutError {
  readonly code: CheckoutErrorCode;
  readonly message: string;
  readonly field?: string;
  readonly step?: CheckoutStep;
}

export interface CheckoutWarning {
  readonly code: string;
  readonly message: string;
  readonly step?: CheckoutStep;
}

export enum CheckoutErrorCode {
  EMPTY_CART = 'EMPTY_CART',
  INVALID_ADDRESS = 'INVALID_ADDRESS',
  INVALID_SHIPPING = 'INVALID_SHIPPING',
  INVALID_PAYMENT = 'INVALID_PAYMENT',
  INSUFFICIENT_STOCK = 'INSUFFICIENT_STOCK',
  INVALID_COUPON = 'INVALID_COUPON',
  PAYMENT_FAILED = 'PAYMENT_FAILED',
  SHIPPING_NOT_AVAILABLE = 'SHIPPING_NOT_AVAILABLE',
  SESSION_EXPIRED = 'SESSION_EXPIRED',
  PRICE_CHANGED = 'PRICE_CHANGED',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

export interface InvoiceData {
  readonly rfc: string;
  readonly businessName: string;
  readonly email: string;
  readonly fiscalAddress: {
    readonly street: string;
    readonly exteriorNumber: string;
    readonly interiorNumber?: string;
    readonly neighborhood: string;
    readonly city: string;
    readonly state: string;
    readonly postalCode: string;
  };
  readonly cfdiUse: CFDIUse;
}

export enum CFDIUse {
  G01 = 'G01', // Adquisición de mercancías
  G03 = 'G03', // Gastos en general
  I01 = 'I01', // Construcciones
  I02 = 'I02', // Mobiliario y equipo de oficina
  I03 = 'I03', // Equipo de transporte
  I04 = 'I04', // Equipo de computo
  I05 = 'I05', // Dados, troqueles, moldes
  I06 = 'I06', // Comunicaciones telefónicas
  I07 = 'I07', // Comunicaciones satelitales
  I08 = 'I08', // Otra maquinaria y equipo
  D01 = 'D01', // Honorarios médicos
  D02 = 'D02', // Gastos médicos
  D03 = 'D03', // Gastos funerales
  D04 = 'D04', // Donativos
  D05 = 'D05', // Intereses reales
  D06 = 'D06', // Aportaciones voluntarias
  D07 = 'D07', // Primas por seguros de gastos médicos
  D08 = 'D08', // Gastos de transportación escolar
  D09 = 'D09', // Depósitos en cuentas
  D10 = 'D10', // Pagos por servicios educativos
  P01 = 'P01'  // Por definir
}

export interface CheckoutProgress {
  readonly currentStep: CheckoutStep;
  readonly totalSteps: number;
  readonly completedSteps: number;
  readonly percentageComplete: number;
  readonly nextStep?: CheckoutStep;
  readonly previousStep?: CheckoutStep;
}

export interface UpdateCheckoutDto {
  step?: CheckoutStep;
  selectedAddressId?: string;
  selectedShippingOptionId?: string;
  selectedPaymentMethodId?: string;
  requiresInvoice?: boolean;
  invoiceData?: InvoiceData;
}

// Errores específicos del dominio
export class CheckoutError extends Error {
  constructor(
    message: string, 
    public readonly code: CheckoutErrorCode,
    public readonly step?: CheckoutStep
  ) {
    super(message);
    this.name = 'CheckoutError';
  }
}
