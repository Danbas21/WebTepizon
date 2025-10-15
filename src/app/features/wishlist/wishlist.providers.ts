/**
 * Wishlist Module Providers
 * Configuración de inyección de dependencias
 */

import { Provider } from '@angular/core';
import { WishlistRepositoryPort } from './domain/wishlist.repository.port';
import { WishlistRepositoryImpl } from './infrastructure/wishlist.repository.impl';

// Use Cases
import { AddToWishlistUseCase } from './application/use-cases/add-to-wishlist.use-case';
import { RemoveFromWishlistUseCase } from './application/use-cases/remove-from-wishlist.use-case';
import { GetWishlistUseCase } from './application/use-cases/get-wishlist.use-case';
import { MoveToCartUseCase } from './application/use-cases/move-to-cart.use-case';
import { CheckInWishlistUseCase } from './application/use-cases/check-in-wishlist.use-case';
import { ClearWishlistUseCase } from './application/use-cases/clear-wishlist.use-case';
import {
  UpdateWishlistItemUseCase,
  UpdateWishlistSettingsUseCase,
  ShareWishlistUseCase,
  GetSharedWishlistUseCase,
  RevokeShareAccessUseCase,
  SyncWishlistUseCase,
  GetWishlistAlertsUseCase,
  MarkAlertAsReadUseCase,
  MarkAllAlertsAsReadUseCase
} from './application/use-cases/wishlist-advanced.use-cases';

/**
 * Providers del Wishlist Module
 * Agregar a app.config.ts en el array de providers
 */
export const WISHLIST_PROVIDERS: Provider[] = [
  // Repository
  {
    provide: WishlistRepositoryPort,
    useClass: WishlistRepositoryImpl
  },
  
  // Use Cases
  AddToWishlistUseCase,
  RemoveFromWishlistUseCase,
  GetWishlistUseCase,
  MoveToCartUseCase,
  CheckInWishlistUseCase,
  ClearWishlistUseCase,
  UpdateWishlistItemUseCase,
  UpdateWishlistSettingsUseCase,
  ShareWishlistUseCase,
  GetSharedWishlistUseCase,
  RevokeShareAccessUseCase,
  SyncWishlistUseCase,
  GetWishlistAlertsUseCase,
  MarkAlertAsReadUseCase,
  MarkAllAlertsAsReadUseCase
  
  // Facade se registra automáticamente con providedIn: 'root'
];
