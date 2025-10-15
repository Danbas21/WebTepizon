/**
 * Repository Implementation: CheckoutRepositoryImpl
 * Implementa el puerto usando el FirebaseAdapter
 * Versión simplificada enfocada en addresses y payment methods
 */

import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { CheckoutRepositoryPort } from '../domain/checkout.repository.port';
import { 
  Address, 
  CreateAddressDto, 
  UpdateAddressDto,
  AddressType 
} from '../domain/address.model';
import { 
  PaymentMethod,
  CreatePaymentMethodDto,
  PaymentMethodType,
  PaymentProvider,
  PaymentIntent,
  PaymentResult
} from '../domain/payment-method.model';
import { ShippingCalculation, ShippingOption } from '../domain/shipping.model';
import { CheckoutSession, UpdateCheckoutDto, CheckoutStep } from '../domain/checkout.model';
import { Order, CreateOrderDto } from '../domain/order.model';
import { CheckoutDomainService } from '../domain/checkout.domain.service';
import {
  FirebaseCheckoutAdapter,
  AddressDoc,
  PaymentMethodDoc
} from './firebase-checkout.adapter';
import { Timestamp } from '@angular/fire/firestore';

@Injectable({ providedIn: 'root' })
export class CheckoutRepositoryImpl extends CheckoutRepositoryPort {
  private readonly adapter = inject(FirebaseCheckoutAdapter);

  // ========== ADDRESS OPERATIONS ==========

  getUserAddresses(userId: string): Observable<Address[]> {
    return this.adapter.watchUserAddresses(userId).pipe(
      map(docs => docs.map(doc => this.mapToAddress(doc)))
    );
  }

  async getAddress(userId: string, addressId: string): Promise<Address | null> {
    const doc = await this.adapter.getAddress(addressId);
    return doc ? this.mapToAddress(doc) : null;
  }

  async createAddress(userId: string, dto: CreateAddressDto): Promise<Address> {
    const addressDoc: Omit<AddressDoc, 'id' | 'userId' | 'createdAt' | 'updatedAt'> = {
      fullName: dto.fullName,
      phoneNumber: dto.phoneNumber,
      email: dto.email,
      street: dto.street,
      exteriorNumber: dto.exteriorNumber,
      interiorNumber: dto.interiorNumber,
      neighborhood: dto.neighborhood,
      city: dto.city,
      state: dto.state,
      postalCode: dto.postalCode,
      country: dto.country || 'México',
      references: dto.references,
      additionalInfo: dto.additionalInfo,
      isDefault: dto.isDefault ?? false,
      label: dto.label,
      type: (dto.type as AddressType) || 'HOME'
    };

    const created = await this.adapter.createAddress(userId, addressDoc);
    return this.mapToAddress(created);
  }

  async updateAddress(userId: string, addressId: string, dto: UpdateAddressDto): Promise<Address> {
    await this.adapter.updateAddress(addressId, dto as any);
    const updated = await this.adapter.getAddress(addressId);
    return this.mapToAddress(updated!);
  }

  async deleteAddress(userId: string, addressId: string): Promise<void> {
    await this.adapter.deleteAddress(addressId);
  }

  async setDefaultAddress(userId: string, addressId: string): Promise<void> {
    await this.adapter.setDefaultAddress(userId, addressId);
  }

  async getDefaultAddress(userId: string): Promise<Address | null> {
    // Obtener todas y filtrar la default
    const addresses = await new Promise<Address[]>((resolve) => {
      this.getUserAddresses(userId).subscribe(addrs => resolve(addrs));
    });
    return addresses.find(a => a.isDefault) || null;
  }

  // ========== PAYMENT METHOD OPERATIONS ==========

  getUserPaymentMethods(userId: string): Observable<PaymentMethod[]> {
    return this.adapter.watchUserPaymentMethods(userId).pipe(
      map(docs => docs.map(doc => this.mapToPaymentMethod(doc)))
    );
  }

  async getPaymentMethod(userId: string, methodId: string): Promise<PaymentMethod | null> {
    const doc = await this.adapter.getPaymentMethod(methodId);
    return doc ? this.mapToPaymentMethod(doc) : null;
  }

  async createPaymentMethod(userId: string, dto: CreatePaymentMethodDto): Promise<PaymentMethod> {
    const methodDoc: Omit<PaymentMethodDoc, 'id' | 'userId' | 'createdAt' | 'updatedAt'> = {
      type: dto.type as any,
      provider: dto.provider,
      cardLast4: dto.cardLast4,
      cardBrand: dto.cardBrand,
      cardExpiryMonth: dto.cardExpiryMonth,
      cardExpiryYear: dto.cardExpiryYear,
      cardHolderName: dto.cardHolderName,
      paypalEmail: dto.paypalEmail,
      providerToken: dto.cardToken || dto.paypalToken,
      isDefault: dto.isDefault ?? false,
      label: dto.label
    };

    const created = await this.adapter.createPaymentMethod(userId, methodDoc);
    return this.mapToPaymentMethod(created);
  }

  async deletePaymentMethod(userId: string, methodId: string): Promise<void> {
    await this.adapter.deletePaymentMethod(methodId);
  }

  async setDefaultPaymentMethod(userId: string, methodId: string): Promise<void> {
    await this.adapter.setDefaultPaymentMethod(userId, methodId);
  }

  async getDefaultPaymentMethod(userId: string): Promise<PaymentMethod | null> {
    const methods = await new Promise<PaymentMethod[]>((resolve) => {
      this.getUserPaymentMethods(userId).subscribe(methods => resolve(methods));
    });
    return methods.find(m => m.isDefault) || null;
  }

  // ========== SHIPPING OPERATIONS ==========

  async calculateShipping(
    userId: string,
    addressId: string,
    cartSubtotal: number
  ): Promise<ShippingCalculation> {
    const address = await this.getAddress(userId, addressId);
    if (!address) {
      throw new Error('Dirección no encontrada');
    }

    const options = CheckoutDomainService.calculateShippingOptions(
      address.state,
      address.postalCode,
      cartSubtotal
    );

    return {
      addressId: address.id,
      postalCode: address.postalCode,
      state: address.state,
      city: address.city,
      options,
      cartSubtotal,
      qualifiesForFreeShipping: cartSubtotal >= 500,
      freeShippingThreshold: 500,
      amountUntilFreeShipping: Math.max(0, 500 - cartSubtotal)
    };
  }

  async getShippingOptions(postalCode: string, state: string): Promise<ShippingOption[]> {
    return CheckoutDomainService.calculateShippingOptions(state, postalCode, 0);
  }

  // ========== PAYMENT PROCESSING (STUB) ==========

  async createPaymentIntent(
    userId: string,
    amount: number,
    paymentMethodId: string,
    metadata?: Record<string, any>
  ): Promise<PaymentIntent> {
    // TODO: Implementar integración real con Stripe/PayPal
    console.log('[CheckoutRepository] Payment intent creation (stub)');
    
    return {
      id: `pi_${Date.now()}`,
      amount,
      currency: 'MXN',
      status: 'PENDING',
      paymentMethodId,
      metadata,
      createdAt: new Date()
    };
  }

  async confirmPayment(paymentIntentId: string): Promise<PaymentResult> {
    // TODO: Implementar confirmación real con payment gateway
    console.log('[CheckoutRepository] Payment confirmation (stub)');
    
    return {
      success: true,
      paymentIntentId,
      transactionId: `txn_${Date.now()}`
    };
  }

  async cancelPaymentIntent(paymentIntentId: string): Promise<void> {
    console.log('[CheckoutRepository] Payment cancellation (stub)');
  }

  // ========== CHECKOUT SESSION (STUB) ==========

  getCheckoutSession(userId: string): Observable<CheckoutSession> {
    // TODO: Implementar gestión real de sesión
    console.log('[CheckoutRepository] Checkout session (stub)');
    
    return new Observable(observer => {
      observer.next(this.createEmptyCheckoutSession(userId));
    });
  }

  async createCheckoutSession(userId: string, cartId: string): Promise<CheckoutSession> {
    console.log('[CheckoutRepository] Create checkout session (stub)');
    return this.createEmptyCheckoutSession(userId, cartId);
  }

  async updateCheckoutSession(userId: string, updates: UpdateCheckoutDto): Promise<CheckoutSession> {
    console.log('[CheckoutRepository] Update checkout session (stub)');
    return this.createEmptyCheckoutSession(userId);
  }

  async clearCheckoutSession(userId: string): Promise<void> {
    console.log('[CheckoutRepository] Clear checkout session (stub)');
  }

  // ========== ORDER OPERATIONS (STUB) ==========

  async createOrder(dto: CreateOrderDto): Promise<Order> {
    console.log('[CheckoutRepository] Create order (stub) - Will be implemented in Orders Module');
    throw new Error('Order creation will be implemented in Orders Module');
  }

  async getOrder(userId: string, orderId: string): Promise<Order | null> {
    console.log('[CheckoutRepository] Get order (stub)');
    return null;
  }

  getUserOrders(userId: string): Observable<Order[]> {
    console.log('[CheckoutRepository] Get user orders (stub)');
    return new Observable(observer => observer.next([]));
  }

  // ========== STOCK VALIDATION (STUB) ==========

  async validateCartStock(cartId: string): Promise<boolean> {
    // TODO: Integrar con Cart Module para validar stock
    console.log('[CheckoutRepository] Validate cart stock (stub)');
    return true;
  }

  async reduceStock(items: Array<{ productId: string; variantId?: string; quantity: number }>): Promise<void> {
    // TODO: Integrar con Catalog Module para reducir stock
    console.log('[CheckoutRepository] Reduce stock (stub)');
  }

  // ========== MAPPERS ==========

  private mapToAddress(doc: AddressDoc): Address {
    return {
      id: doc.id,
      userId: doc.userId,
      fullName: doc.fullName,
      phoneNumber: doc.phoneNumber,
      email: doc.email,
      street: doc.street,
      exteriorNumber: doc.exteriorNumber,
      interiorNumber: doc.interiorNumber,
      neighborhood: doc.neighborhood,
      city: doc.city,
      state: doc.state,
      postalCode: doc.postalCode,
      country: doc.country,
      references: doc.references,
      additionalInfo: doc.additionalInfo,
      isDefault: doc.isDefault,
      label: doc.label,
      type: doc.type as AddressType,
      createdAt: this.timestampToDate(doc.createdAt),
      updatedAt: this.timestampToDate(doc.updatedAt),
      lastUsedAt: doc.lastUsedAt ? this.timestampToDate(doc.lastUsedAt) : undefined
    };
  }

  private mapToPaymentMethod(doc: PaymentMethodDoc): PaymentMethod {
    return {
      id: doc.id,
      userId: doc.userId,
      type: doc.type as PaymentMethodType,
      provider: doc.provider as PaymentProvider,
      cardLast4: doc.cardLast4,
      cardBrand: doc.cardBrand as any,
      cardExpiryMonth: doc.cardExpiryMonth,
      cardExpiryYear: doc.cardExpiryYear,
      cardHolderName: doc.cardHolderName,
      paypalEmail: doc.paypalEmail,
      providerToken: doc.providerToken,
      isDefault: doc.isDefault,
      label: doc.label,
      createdAt: this.timestampToDate(doc.createdAt),
      updatedAt: this.timestampToDate(doc.updatedAt),
      lastUsedAt: doc.lastUsedAt ? this.timestampToDate(doc.lastUsedAt) : undefined
    };
  }

  private timestampToDate(timestamp: Timestamp | Date): Date {
    if (timestamp instanceof Timestamp) {
      return timestamp.toDate();
    }
    return timestamp;
  }

  private createEmptyCheckoutSession(userId: string, cartId: string = ''): CheckoutSession {
    const now = new Date();
    const expiry = new Date(now.getTime() + 2 * 60 * 60 * 1000); // 2 hours

    return {
      id: `checkout_${Date.now()}`,
      userId,
      cartId,
      currentStep: CheckoutStep.SHIPPING,
      completedSteps: [],
      canProceed: false,
      orderSummary: {
        itemsCount: 0,
        itemsQuantity: 0,
        subtotal: 0,
        itemsDiscount: 0,
        couponDiscount: 0,
        totalDiscount: 0,
        shippingCost: 0,
        taxRate: 0.16,
        tax: 0,
        total: 0,
        currency: 'MXN',
        hasDiscounts: false,
        qualifiesForFreeShipping: false
      },
      validations: {
        hasValidCart: false,
        hasValidAddress: false,
        hasValidShipping: false,
        hasValidPayment: false,
        hasStockAvailable: true,
        canPlaceOrder: false,
        errors: [],
        warnings: []
      },
      requiresInvoice: false,
      createdAt: now,
      updatedAt: now,
      expiresAt: expiry
    };
  }
}
