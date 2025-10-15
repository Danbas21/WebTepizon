/**
 * Checkout Module Providers
 * Configuración de inyección de dependencias
 */

import { Provider } from '@angular/core';
import { CheckoutRepositoryPort } from './domain/checkout.repository.port';
import { CheckoutRepositoryImpl } from './infrastructure/checkout.repository.impl';

// Use Cases - Address
import {
  GetUserAddressesUseCase,
  CreateAddressUseCase,
  UpdateAddressUseCase,
  DeleteAddressUseCase,
  SetDefaultAddressUseCase,
  GetDefaultAddressUseCase
} from './application/use-cases/address-management.use-cases';

// Use Cases - Payment
import {
  GetUserPaymentMethodsUseCase,
  CreatePaymentMethodUseCase,
  DeletePaymentMethodUseCase,
  SetDefaultPaymentMethodUseCase,
  GetDefaultPaymentMethodUseCase,
  CreatePaymentIntentUseCase,
  ConfirmPaymentUseCase
} from './application/use-cases/payment-management.use-cases';

// Use Cases - Shipping
import {
  CalculateShippingUseCase,
  GetShippingOptionsUseCase
} from './application/use-cases/calculate-shipping.use-case';

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
} from './application/use-cases/checkout-process.use-cases';

/**
 * Providers del Checkout Module
 * Agregar a app.config.ts en el array de providers
 */
export const CHECKOUT_PROVIDERS: Provider[] = [
  // Repository
  {
    provide: CheckoutRepositoryPort,
    useClass: CheckoutRepositoryImpl
  },
  
  // Use Cases - Address
  GetUserAddressesUseCase,
  CreateAddressUseCase,
  UpdateAddressUseCase,
  DeleteAddressUseCase,
  SetDefaultAddressUseCase,
  GetDefaultAddressUseCase,
  
  // Use Cases - Payment
  GetUserPaymentMethodsUseCase,
  CreatePaymentMethodUseCase,
  DeletePaymentMethodUseCase,
  SetDefaultPaymentMethodUseCase,
  GetDefaultPaymentMethodUseCase,
  CreatePaymentIntentUseCase,
  ConfirmPaymentUseCase,
  
  // Use Cases - Shipping
  CalculateShippingUseCase,
  GetShippingOptionsUseCase,
  
  // Use Cases - Checkout
  GetCheckoutSessionUseCase,
  StartCheckoutUseCase,
  UpdateCheckoutSessionUseCase,
  ProceedToNextStepUseCase,
  GoToPreviousStepUseCase,
  CreateOrderUseCase,
  CancelCheckoutUseCase,
  ValidateCheckoutUseCase
  
  // Facade se registra automáticamente con providedIn: 'root'
];
