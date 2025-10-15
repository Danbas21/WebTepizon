/**
 * Use Cases adicionales para Wishlist
 * Funcionalidades avanzadas: actualizar, compartir, sincronizar
 */

import { inject } from '@angular/core';
import { WishlistRepositoryPort } from '../../domain/wishlist.repository.port';
import { 
  WishlistSettings, 
  ShareWishlistDto,
  WishlistAlert 
} from '../../domain/wishlist.model';
import { UpdateWishlistItemDto, WishlistItem } from '../../domain/wishlist-item.model';

/**
 * Actualiza un item de la wishlist (notas, prioridad, alertas)
 */
export class UpdateWishlistItemUseCase {
  private readonly repository = inject(WishlistRepositoryPort);

  async execute(
    userId: string, 
    itemId: string, 
    updates: UpdateWishlistItemDto
  ): Promise<WishlistItem> {
    return this.repository.updateItem(userId, itemId, updates);
  }
}

/**
 * Actualiza la configuración de la wishlist
 */
export class UpdateWishlistSettingsUseCase {
  private readonly repository = inject(WishlistRepositoryPort);

  async execute(userId: string, settings: WishlistSettings): Promise<void> {
    await this.repository.updateSettings(userId, settings);
  }
}

/**
 * Genera un token para compartir la wishlist
 */
export class ShareWishlistUseCase {
  private readonly repository = inject(WishlistRepositoryPort);

  async execute(userId: string): Promise<ShareWishlistDto> {
    return this.repository.generateShareToken(userId);
  }
}

/**
 * Obtiene una wishlist compartida mediante su token
 */
export class GetSharedWishlistUseCase {
  private readonly repository = inject(WishlistRepositoryPort);

  async execute(shareToken: string) {
    return this.repository.getSharedWishlist(shareToken);
  }
}

/**
 * Revoca el acceso compartido de la wishlist
 */
export class RevokeShareAccessUseCase {
  private readonly repository = inject(WishlistRepositoryPort);

  async execute(userId: string): Promise<void> {
    await this.repository.revokeShareToken(userId);
  }
}

/**
 * Sincroniza precios y stock de los items
 */
export class SyncWishlistUseCase {
  private readonly repository = inject(WishlistRepositoryPort);

  async execute(userId: string): Promise<void> {
    await this.repository.syncPricesAndStock(userId);
  }
}

/**
 * Obtiene las alertas de la wishlist
 */
export class GetWishlistAlertsUseCase {
  private readonly repository = inject(WishlistRepositoryPort);

  async execute(userId: string, unreadOnly: boolean = false): Promise<WishlistAlert[]> {
    return this.repository.getAlerts(userId, unreadOnly);
  }
}

/**
 * Marca una alerta como leída
 */
export class MarkAlertAsReadUseCase {
  private readonly repository = inject(WishlistRepositoryPort);

  async execute(userId: string, alertId: string): Promise<void> {
    await this.repository.markAlertAsRead(userId, alertId);
  }
}

/**
 * Marca todas las alertas como leídas
 */
export class MarkAllAlertsAsReadUseCase {
  private readonly repository = inject(WishlistRepositoryPort);

  async execute(userId: string): Promise<void> {
    await this.repository.markAllAlertsAsRead(userId);
  }
}
