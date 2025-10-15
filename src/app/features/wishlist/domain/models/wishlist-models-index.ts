/**
 * Wishlist Module - Barrel Exports
 * Exporta todos los elementos públicos del módulo
 */

// Domain
export * from './domain/wishlist-item.model';
export * from './domain/wishlist.model';
export * from './domain/wishlist.repository.port';
export * from './domain/wishlist.domain.service';

// Application
export * from './application/use-cases/add-to-wishlist.use-case';
export * from './application/use-cases/remove-from-wishlist.use-case';
export * from './application/use-cases/get-wishlist.use-case';
export * from './application/use-cases/move-to-cart.use-case';
export * from './application/use-cases/check-in-wishlist.use-case';
export * from './application/use-cases/clear-wishlist.use-case';
export * from './application/use-cases/wishlist-advanced.use-cases';
export * from './application/wishlist.facade';

// Infrastructure
export * from './infrastructure/firebase-wishlist.adapter';
export * from './infrastructure/wishlist.repository.impl';
