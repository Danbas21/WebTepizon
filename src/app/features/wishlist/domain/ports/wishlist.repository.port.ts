/**
 * Puerto: WishlistRepository
 * Define el contrato para la persistencia de wishlist
 * Implementado por la capa de infraestructura
 */

import { Observable } from 'rxjs';
import { 
  Wishlist, 
  WishlistSettings, 
  ShareWishlistDto,
  WishlistAlert 
} from './wishlist.model';
import { 
  WishlistItem, 
  CreateWishlistItemDto, 
  UpdateWishlistItemDto 
} from './wishlist-item.model';

export abstract class WishlistRepositoryPort {
  // Operaciones de Wishlist
  abstract getWishlist(userId: string): Observable<Wishlist>;
  abstract watchWishlist(userId: string): Observable<Wishlist>;
  abstract updateSettings(userId: string, settings: WishlistSettings): Promise<void>;
  abstract clearWishlist(userId: string): Promise<void>;
  
  // Operaciones de Items
  abstract addItem(userId: string, item: CreateWishlistItemDto): Promise<WishlistItem>;
  abstract removeItem(userId: string, itemId: string): Promise<void>;
  abstract updateItem(userId: string, itemId: string, updates: UpdateWishlistItemDto): Promise<WishlistItem>;
  abstract checkIfInWishlist(userId: string, productId: string, variantId?: string): Promise<boolean>;
  abstract getItem(userId: string, itemId: string): Promise<WishlistItem | null>;
  
  // Operaciones de compartir
  abstract generateShareToken(userId: string): Promise<ShareWishlistDto>;
  abstract getSharedWishlist(shareToken: string): Promise<Wishlist>;
  abstract revokeShareToken(userId: string): Promise<void>;
  
  // Sincronización y alertas
  abstract syncPricesAndStock(userId: string): Promise<void>;
  abstract getAlerts(userId: string, unreadOnly?: boolean): Promise<WishlistAlert[]>;
  abstract markAlertAsRead(userId: string, alertId: string): Promise<void>;
  abstract markAllAlertsAsRead(userId: string): Promise<void>;
}
