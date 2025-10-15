/**
 * Orders Module - Barrel Exports
 * Exporta todos los elementos públicos del módulo
 */

// Domain
export * from './domain/order-extensions.model';
export * from './domain/order.repository.port';
export * from './domain/order.domain.service';

// Re-export Order models from Checkout
export * from '../checkout/domain/order.model';

// Application - Use Cases
export * from './application/use-cases/order-management.use-cases';
export * from './application/use-cases/order-tracking.use-cases';
export * from './application/use-cases/order-cancellation-return.use-cases';

// Application - Facade
export * from './application/order.facade';

// Infrastructure
export * from './infrastructure/firebase-order.adapter';
export * from './infrastructure/order.repository.impl';
