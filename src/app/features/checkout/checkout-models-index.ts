/**
 * Checkout Module - Barrel Exports
 * Exporta todos los elementos públicos del módulo
 */

// Domain
export * from './domain/address.model';
export * from './domain/payment-method.model';
export * from './domain/shipping.model';
export * from './domain/order.model';
export * from './domain/checkout.model';
export * from './domain/checkout.repository.port';
export * from './domain/checkout.domain.service';

// Application - Use Cases
export * from './application/use-cases/address-management.use-cases';
export * from './application/use-cases/payment-management.use-cases';
export * from './application/use-cases/calculate-shipping.use-case';
export * from './application/use-cases/checkout-process.use-cases';

// Application - Facade
export * from './application/checkout.facade';

// Infrastructure
export * from './infrastructure/firebase-checkout.adapter';
export * from './infrastructure/checkout.repository.impl';
