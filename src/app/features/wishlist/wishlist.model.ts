/**
 * Modelo de dominio: Wishlist
 * Representa la lista completa de deseos de un usuario
 */

import { WishlistItem } from './wishlist-item.model';

export interface Wishlist {
  readonly id: string;
  readonly userId: string;
  readonly items: readonly WishlistItem[];
  
  // Estadísticas
  readonly stats: {
    readonly totalItems: number;
    readonly itemsWithPriceDrops: number;
    readonly itemsOutOfStock: number;
    readonly totalSavings: number; // Ahorros por bajas de precio
    readonly averagePriceChange: number; // % promedio de cambio
  };
  
  // Configuración de la wishlist
  readonly settings: {
    readonly isPublic: boolean;
    readonly shareToken?: string; // Token para compartir
    readonly notificationsEnabled: boolean;
    readonly emailNotifications: boolean;
  };
  
  // Metadata
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly lastSyncedAt: Date;
  readonly isEmpty: boolean;
}

export interface WishlistSummary {
  readonly totalItems: number;
  readonly itemsWithPriceDrops: number;
  readonly itemsOutOfStock: number;
  readonly totalSavings: number;
  readonly hasUnreadAlerts: boolean;
}

export interface ShareWishlistDto {
  readonly shareUrl: string;
  readonly shareToken: string;
  readonly expiresAt?: Date;
}

export interface WishlistSettings {
  isPublic?: boolean;
  notificationsEnabled?: boolean;
  emailNotifications?: boolean;
}

export interface WishlistAlert {
  readonly id: string;
  readonly wishlistItemId: string;
  readonly type: 'PRICE_DROP' | 'BACK_IN_STOCK' | 'LOW_STOCK' | 'PRICE_INCREASE';
  readonly message: string;
  readonly oldValue?: number;
  readonly newValue?: number;
  readonly createdAt: Date;
  readonly isRead: boolean;
}

// Errores específicos del dominio
export class WishlistError extends Error {
  constructor(message: string, public readonly code: WishlistErrorCode) {
    super(message);
    this.name = 'WishlistError';
  }
}

export enum WishlistErrorCode {
  ITEM_ALREADY_EXISTS = 'ITEM_ALREADY_EXISTS',
  ITEM_NOT_FOUND = 'ITEM_NOT_FOUND',
  WISHLIST_FULL = 'WISHLIST_FULL',
  PRODUCT_NOT_AVAILABLE = 'PRODUCT_NOT_AVAILABLE',
  INVALID_SHARE_TOKEN = 'INVALID_SHARE_TOKEN',
  UNAUTHORIZED = 'UNAUTHORIZED',
  SYNC_FAILED = 'SYNC_FAILED'
}
