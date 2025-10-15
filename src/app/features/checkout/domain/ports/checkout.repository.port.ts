/**
 * Puerto: CheckoutRepository
 * Define el contrato para la persistencia de checkout
 * Implementado por la capa de infraestructura
 */

import { Observable } from 'rxjs';
import { Address, CreateAddressDto, UpdateAddressDto } from './address.model';
import { PaymentMethod, CreatePaymentMethodDto, PaymentIntent, PaymentResult } from './payment-method.model';
import { ShippingCalculation, ShippingOption } from './shipping.model';
import { Order, CreateOrderDto } from './order.model';
import { CheckoutSession, UpdateCheckoutDto } from './checkout.model';

export abstract class CheckoutRepositoryPort {
  // ========== ADDRESS OPERATIONS ==========
  abstract getUserAddresses(userId: string): Observable<Address[]>;
  abstract getAddress(userId: string, addressId: string): Promise<Address | null>;
  abstract createAddress(userId: string, dto: CreateAddressDto): Promise<Address>;
  abstract updateAddress(userId: string, addressId: string, dto: UpdateAddressDto): Promise<Address>;
  abstract deleteAddress(userId: string, addressId: string): Promise<void>;
  abstract setDefaultAddress(userId: string, addressId: string): Promise<void>;
  abstract getDefaultAddress(userId: string): Promise<Address | null>;
  
  // ========== PAYMENT METHOD OPERATIONS ==========
  abstract getUserPaymentMethods(userId: string): Observable<PaymentMethod[]>;
  abstract getPaymentMethod(userId: string, methodId: string): Promise<PaymentMethod | null>;
  abstract createPaymentMethod(userId: string, dto: CreatePaymentMethodDto): Promise<PaymentMethod>;
  abstract deletePaymentMethod(userId: string, methodId: string): Promise<void>;
  abstract setDefaultPaymentMethod(userId: string, methodId: string): Promise<void>;
  abstract getDefaultPaymentMethod(userId: string): Promise<PaymentMethod | null>;
  
  // ========== SHIPPING OPERATIONS ==========
  abstract calculateShipping(
    userId: string,
    addressId: string,
    cartSubtotal: number
  ): Promise<ShippingCalculation>;
  abstract getShippingOptions(postalCode: string, state: string): Promise<ShippingOption[]>;
  
  // ========== PAYMENT PROCESSING ==========
  abstract createPaymentIntent(
    userId: string,
    amount: number,
    paymentMethodId: string,
    metadata?: Record<string, any>
  ): Promise<PaymentIntent>;
  abstract confirmPayment(paymentIntentId: string): Promise<PaymentResult>;
  abstract cancelPaymentIntent(paymentIntentId: string): Promise<void>;
  
  // ========== CHECKOUT SESSION ==========
  abstract getCheckoutSession(userId: string): Observable<CheckoutSession>;
  abstract createCheckoutSession(userId: string, cartId: string): Promise<CheckoutSession>;
  abstract updateCheckoutSession(userId: string, updates: UpdateCheckoutDto): Promise<CheckoutSession>;
  abstract clearCheckoutSession(userId: string): Promise<void>;
  
  // ========== ORDER OPERATIONS ==========
  abstract createOrder(dto: CreateOrderDto): Promise<Order>;
  abstract getOrder(userId: string, orderId: string): Promise<Order | null>;
  abstract getUserOrders(userId: string): Observable<Order[]>;
  
  // ========== STOCK VALIDATION ==========
  abstract validateCartStock(cartId: string): Promise<boolean>;
  abstract reduceStock(items: Array<{ productId: string; variantId?: string; quantity: number }>): Promise<void>;
}
