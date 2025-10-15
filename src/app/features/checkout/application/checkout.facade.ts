/**
 * Facade: CheckoutFacade
 * Punto de entrada único para todas las operaciones de Checkout
 * Usa Signals de Angular 20 para estado reactivo
 */

import { Injectable, inject, signal, computed } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Observable } from 'rxjs';

// Domain
import { Address, CreateAddressDto, UpdateAddressDto } from '../domain/address.model';
import { PaymentMethod, CreatePaymentMethodDto } from '../domain/payment-method.model';
import { ShippingCalculation } from '../domain/shipping.model';
import { CheckoutSession, CheckoutStep, CheckoutProgress } from '../domain/checkout.model';
import { Order } from '../domain/order.model';
import { CheckoutDomainService } from '../domain/checkout.domain.service';

// Use Cases - Address
import {
  GetUserAddressesUseCase,
  CreateAddressUseCase,
  UpdateAddressUseCase,
  DeleteAddressUseCase,
  SetDefaultAddressUseCase,
  GetDefaultAddressUseCase
} from './use-cases/address-management.use-cases';

// Use Cases - Payment
import {
  GetUserPaymentMethodsUseCase,
  CreatePaymentMethodUseCase,
  DeletePaymentMethodUseCase,
  SetDefaultPaymentMethodUseCase,
  GetDefaultPaymentMethodUseCase,
  CreatePaymentIntentUseCase,
  ConfirmPaymentUseCase
} from './use-cases/payment-management.use-cases';

// Use Cases - Shipping
import {
  CalculateShippingUseCase,
  GetShippingOptionsUseCase
} from './use-cases/calculate-shipping.use-case';

// Use Cases - Checkout
import {
  GetCheckoutSessionUseCase,
  StartCheckoutUseCase,
  UpdateCheckoutSessionUseCase,
  ProceedToNextStepUseCase,
  GoToPreviousStepUseCase,
  CreateOrderUseCase,
  CancelCheckoutUseCase,
  ValidateCheckoutUseCase
} from './use-cases/checkout-process.use-cases';

@Injectable({ providedIn: 'root' })
export class CheckoutFacade {
  // ========== USE CASES ==========
  
  // Address
  private readonly getUserAddressesUC = inject(GetUserAddressesUseCase);
  private readonly createAddressUC = inject(CreateAddressUseCase);
  private readonly updateAddressUC = inject(UpdateAddressUseCase);
  private readonly deleteAddressUC = inject(DeleteAddressUseCase);
  private readonly setDefaultAddressUC = inject(SetDefaultAddressUseCase);
  private readonly getDefaultAddressUC = inject(GetDefaultAddressUseCase);
  
  // Payment
  private readonly getUserPaymentMethodsUC = inject(GetUserPaymentMethodsUseCase);
  private readonly createPaymentMethodUC = inject(CreatePaymentMethodUseCase);
  private readonly deletePaymentMethodUC = inject(DeletePaymentMethodUseCase);
  private readonly setDefaultPaymentMethodUC = inject(SetDefaultPaymentMethodUseCase);
  private readonly getDefaultPaymentMethodUC = inject(GetDefaultPaymentMethodUseCase);
  private readonly createPaymentIntentUC = inject(CreatePaymentIntentUseCase);
  private readonly confirmPaymentUC = inject(ConfirmPaymentUseCase);
  
  // Shipping
  private readonly calculateShippingUC = inject(CalculateShippingUseCase);
  private readonly getShippingOptionsUC = inject(GetShippingOptionsUseCase);
  
  // Checkout
  private readonly getCheckoutSessionUC = inject(GetCheckoutSessionUseCase);
  private readonly startCheckoutUC = inject(StartCheckoutUseCase);
  private readonly updateCheckoutSessionUC = inject(UpdateCheckoutSessionUseCase);
  private readonly proceedToNextStepUC = inject(ProceedToNextStepUseCase);
  private readonly goToPreviousStepUC = inject(GoToPreviousStepUseCase);
  private readonly createOrderUC = inject(CreateOrderUseCase);
  private readonly cancelCheckoutUC = inject(CancelCheckoutUseCase);
  private readonly validateCheckoutUC = inject(ValidateCheckoutUseCase);

  // ========== STATE - SIGNALS ==========
  
  private readonly currentUserId = signal<string | null>(null);
  private readonly isLoading = signal<boolean>(false);
  private readonly error = signal<string | null>(null);

  // Addresses Observable → Signal
  private readonly addressesObservable$ = computed(() => {
    const userId = this.currentUserId();
    return userId ? this.getUserAddressesUC.execute(userId) : null;
  });
  readonly addresses = toSignal(
    this.addressesObservable$() || new Observable<Address[]>(),
    { initialValue: [] }
  );

  // Payment Methods Observable → Signal
  private readonly paymentMethodsObservable$ = computed(() => {
    const userId = this.currentUserId();
    return userId ? this.getUserPaymentMethodsUC.execute(userId) : null;
  });
  readonly paymentMethods = toSignal(
    this.paymentMethodsObservable$() || new Observable<PaymentMethod[]>(),
    { initialValue: [] }
  );

  // Checkout Session Observable → Signal
  private readonly checkoutSessionObservable$ = computed(() => {
    const userId = this.currentUserId();
    return userId ? this.getCheckoutSessionUC.execute(userId) : null;
  });
  readonly checkoutSession = toSignal(
    this.checkoutSessionObservable$() || new Observable<CheckoutSession>()
  );

  // ========== COMPUTED SIGNALS ==========
  
  // Addresses
  readonly hasAddresses = computed(() => this.addresses().length > 0);
  readonly defaultAddress = computed(() => 
    this.addresses().find(a => a.isDefault) || null
  );

  // Payment Methods
  readonly hasPaymentMethods = computed(() => this.paymentMethods().length > 0);
  readonly defaultPaymentMethod = computed(() => 
    this.paymentMethods().find(pm => pm.isDefault) || null
  );

  // Checkout Session
  readonly currentStep = computed(() => this.checkoutSession()?.currentStep);
  readonly selectedAddress = computed(() => this.checkoutSession()?.selectedAddress);
  readonly selectedShipping = computed(() => this.checkoutSession()?.selectedShippingOption);
  readonly selectedPayment = computed(() => this.checkoutSession()?.selectedPaymentMethod);
  readonly orderSummary = computed(() => this.checkoutSession()?.orderSummary);
  readonly canProceed = computed(() => this.checkoutSession()?.canProceed ?? false);
  readonly validations = computed(() => this.checkoutSession()?.validations);
  
  readonly progress = computed((): CheckoutProgress | null => {
    const session = this.checkoutSession();
    return session ? CheckoutDomainService.calculateProgress(session) : null;
  });

  // Steps
  readonly isShippingStep = computed(() => this.currentStep() === CheckoutStep.SHIPPING);
  readonly isPaymentStep = computed(() => this.currentStep() === CheckoutStep.PAYMENT);
  readonly isReviewStep = computed(() => this.currentStep() === CheckoutStep.REVIEW);

  // ========== INITIALIZATION ==========

  initialize(userId: string): void {
    this.currentUserId.set(userId);
    this.error.set(null);
  }

  reset(): void {
    this.currentUserId.set(null);
    this.error.set(null);
    this.isLoading.set(false);
  }

  // ========== ADDRESS OPERATIONS ==========

  async createAddress(dto: CreateAddressDto): Promise<Address> {
    const userId = this.currentUserId();
    if (!userId) throw new Error('Usuario no autenticado');

    this.isLoading.set(true);
    this.error.set(null);

    try {
      return await this.createAddressUC.execute(userId, dto);
    } catch (error: any) {
      this.error.set(error.message);
      throw error;
    } finally {
      this.isLoading.set(false);
    }
  }

  async updateAddress(addressId: string, dto: UpdateAddressDto): Promise<Address> {
    const userId = this.currentUserId();
    if (!userId) throw new Error('Usuario no autenticado');

    this.isLoading.set(true);
    this.error.set(null);

    try {
      return await this.updateAddressUC.execute(userId, addressId, dto);
    } catch (error: any) {
      this.error.set(error.message);
      throw error;
    } finally {
      this.isLoading.set(false);
    }
  }

  async deleteAddress(addressId: string): Promise<void> {
    const userId = this.currentUserId();
    if (!userId) return;

    this.isLoading.set(true);
    this.error.set(null);

    try {
      await this.deleteAddressUC.execute(userId, addressId);
    } catch (error: any) {
      this.error.set(error.message);
      throw error;
    } finally {
      this.isLoading.set(false);
    }
  }

  async setDefaultAddress(addressId: string): Promise<void> {
    const userId = this.currentUserId();
    if (!userId) return;

    this.isLoading.set(true);
    this.error.set(null);

    try {
      await this.setDefaultAddressUC.execute(userId, addressId);
    } catch (error: any) {
      this.error.set(error.message);
      throw error;
    } finally {
      this.isLoading.set(false);
    }
  }

  // ========== PAYMENT METHOD OPERATIONS ==========

  async createPaymentMethod(dto: CreatePaymentMethodDto): Promise<PaymentMethod> {
    const userId = this.currentUserId();
    if (!userId) throw new Error('Usuario no autenticado');

    this.isLoading.set(true);
    this.error.set(null);

    try {
      return await this.createPaymentMethodUC.execute(userId, dto);
    } catch (error: any) {
      this.error.set(error.message);
      throw error;
    } finally {
      this.isLoading.set(false);
    }
  }

  async deletePaymentMethod(methodId: string): Promise<void> {
    const userId = this.currentUserId();
    if (!userId) return;

    this.isLoading.set(true);
    this.error.set(null);

    try {
      await this.deletePaymentMethodUC.execute(userId, methodId);
    } catch (error: any) {
      this.error.set(error.message);
      throw error;
    } finally {
      this.isLoading.set(false);
    }
  }

  async setDefaultPaymentMethod(methodId: string): Promise<void> {
    const userId = this.currentUserId();
    if (!userId) return;

    this.isLoading.set(true);
    this.error.set(null);

    try {
      await this.setDefaultPaymentMethodUC.execute(userId, methodId);
    } catch (error: any) {
      this.error.set(error.message);
      throw error;
    } finally {
      this.isLoading.set(false);
    }
  }

  // ========== SHIPPING OPERATIONS ==========

  async calculateShipping(addressId: string, cartSubtotal: number): Promise<ShippingCalculation> {
    const userId = this.currentUserId();
    if (!userId) throw new Error('Usuario no autenticado');

    this.isLoading.set(true);
    this.error.set(null);

    try {
      return await this.calculateShippingUC.execute(userId, addressId, cartSubtotal);
    } catch (error: any) {
      this.error.set(error.message);
      throw error;
    } finally {
      this.isLoading.set(false);
    }
  }

  // ========== CHECKOUT OPERATIONS ==========

  async startCheckout(cartId: string): Promise<void> {
    const userId = this.currentUserId();
    if (!userId) throw new Error('Usuario no autenticado');

    this.isLoading.set(true);
    this.error.set(null);

    try {
      await this.startCheckoutUC.execute(userId, cartId);
    } catch (error: any) {
      this.error.set(error.message);
      throw error;
    } finally {
      this.isLoading.set(false);
    }
  }

  async selectAddress(addressId: string): Promise<void> {
    const userId = this.currentUserId();
    if (!userId) return;

    this.isLoading.set(true);
    this.error.set(null);

    try {
      await this.updateCheckoutSessionUC.execute(userId, { selectedAddressId: addressId });
    } catch (error: any) {
      this.error.set(error.message);
      throw error;
    } finally {
      this.isLoading.set(false);
    }
  }

  async selectShippingOption(optionId: string): Promise<void> {
    const userId = this.currentUserId();
    if (!userId) return;

    this.isLoading.set(true);
    this.error.set(null);

    try {
      await this.updateCheckoutSessionUC.execute(userId, { selectedShippingOptionId: optionId });
    } catch (error: any) {
      this.error.set(error.message);
      throw error;
    } finally {
      this.isLoading.set(false);
    }
  }

  async selectPaymentMethod(methodId: string): Promise<void> {
    const userId = this.currentUserId();
    if (!userId) return;

    this.isLoading.set(true);
    this.error.set(null);

    try {
      await this.updateCheckoutSessionUC.execute(userId, { selectedPaymentMethodId: methodId });
    } catch (error: any) {
      this.error.set(error.message);
      throw error;
    } finally {
      this.isLoading.set(false);
    }
  }

  async proceedToNextStep(): Promise<void> {
    const userId = this.currentUserId();
    if (!userId) return;

    this.isLoading.set(true);
    this.error.set(null);

    try {
      await this.proceedToNextStepUC.execute(userId);
    } catch (error: any) {
      this.error.set(error.message);
      throw error;
    } finally {
      this.isLoading.set(false);
    }
  }

  async goToPreviousStep(): Promise<void> {
    const userId = this.currentUserId();
    if (!userId) return;

    this.isLoading.set(true);
    this.error.set(null);

    try {
      await this.goToPreviousStepUC.execute(userId);
    } catch (error: any) {
      this.error.set(error.message);
      throw error;
    } finally {
      this.isLoading.set(false);
    }
  }

  async placeOrder(): Promise<Order> {
    const userId = this.currentUserId();
    if (!userId) throw new Error('Usuario no autenticado');

    this.isLoading.set(true);
    this.error.set(null);

    try {
      return await this.createOrderUC.execute(userId);
    } catch (error: any) {
      this.error.set(error.message);
      throw error;
    } finally {
      this.isLoading.set(false);
    }
  }

  async cancelCheckout(): Promise<void> {
    const userId = this.currentUserId();
    if (!userId) return;

    this.isLoading.set(true);
    this.error.set(null);

    try {
      await this.cancelCheckoutUC.execute(userId);
    } catch (error: any) {
      this.error.set(error.message);
      throw error;
    } finally {
      this.isLoading.set(false);
    }
  }

  // ========== GETTERS ==========
  
  getLoadingState = () => this.isLoading();
  getError = () => this.error();
  getCurrentUserId = () => this.currentUserId();
}
