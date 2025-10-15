/**
 * Repository Implementation: WishlistRepositoryImpl
 * Implementa el puerto usando el FirebaseAdapter
 * Transforma datos entre la capa de infraestructura y dominio
 */

import { Injectable, inject } from '@angular/core';
import { Observable, map, from } from 'rxjs';
import { WishlistRepositoryPort } from '../domain/wishlist.repository.port';
import {
  Wishlist,
  WishlistSettings,
  ShareWishlistDto,
  WishlistAlert,
  WishlistError,
  WishlistErrorCode
} from '../domain/wishlist.model';
import {
  WishlistItem,
  CreateWishlistItemDto,
  UpdateWishlistItemDto
} from '../domain/wishlist-item.model';
import { WishlistDomainService } from '../domain/wishlist.domain.service';
import {
  FirebaseWishlistAdapter,
  WishlistDoc,
  WishlistItemDoc,
  WishlistAlertDoc
} from './firebase-wishlist.adapter';
import { Timestamp } from '@angular/fire/firestore';

@Injectable({ providedIn: 'root' })
export class WishlistRepositoryImpl extends WishlistRepositoryPort {
  private readonly adapter = inject(FirebaseWishlistAdapter);

  // ========== WISHLIST OPERATIONS ==========

  getWishlist(userId: string): Observable<Wishlist> {
    return from(this.adapter.getWishlist(userId)).pipe(
      map(doc => this.mapToWishlist(doc))
    );
  }

  watchWishlist(userId: string): Observable<Wishlist> {
    return this.adapter.watchWishlist(userId).pipe(
      map(doc => this.mapToWishlist(doc))
    );
  }

  async updateSettings(userId: string, settings: WishlistSettings): Promise<void> {
    await this.adapter.updateSettings(userId, settings);
  }

  async clearWishlist(userId: string): Promise<void> {
    await this.adapter.clearWishlist(userId);
  }

  // ========== ITEM OPERATIONS ==========

  async addItem(userId: string, dto: CreateWishlistItemDto): Promise<WishlistItem> {
    const itemDoc: Omit<WishlistItemDoc, 'id'> = {
      productId: dto.productId,
      variantId: dto.variantId,
      productSnapshot: dto.productSnapshot,
      variantSnapshot: dto.variantSnapshot,
      currentPrice: dto.currentPrice,
      originalPrice: dto.currentPrice,
      isAvailable: dto.isAvailable,
      isInStock: dto.isInStock,
      stockQuantity: dto.stockQuantity,
      priceAlertEnabled: dto.priceAlertEnabled ?? false,
      priceAlertThreshold: dto.priceAlertThreshold,
      stockAlertEnabled: dto.stockAlertEnabled ?? false,
      addedAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      lastCheckedAt: Timestamp.now(),
      notes: dto.notes,
      priority: dto.priority || 'MEDIUM'
    };

    const createdItem = await this.adapter.addItem(userId, itemDoc);
    return this.mapToWishlistItem(createdItem);
  }

  async removeItem(userId: string, itemId: string): Promise<void> {
    await this.adapter.removeItem(userId, itemId);
  }

  async updateItem(
    userId: string,
    itemId: string,
    updates: UpdateWishlistItemDto
  ): Promise<WishlistItem> {
    const updatedDoc = await this.adapter.updateItem(userId, itemId, updates as any);
    
    if (!updatedDoc) {
      throw new WishlistError(
        'Item no encontrado',
        WishlistErrorCode.ITEM_NOT_FOUND
      );
    }

    return this.mapToWishlistItem(updatedDoc);
  }

  async checkIfInWishlist(
    userId: string,
    productId: string,
    variantId?: string
  ): Promise<boolean> {
    return this.adapter.checkIfInWishlist(userId, productId, variantId);
  }

  async getItem(userId: string, itemId: string): Promise<WishlistItem | null> {
    const itemDoc = await this.adapter.getItem(userId, itemId);
    return itemDoc ? this.mapToWishlistItem(itemDoc) : null;
  }

  // ========== SHARE OPERATIONS ==========

  async generateShareToken(userId: string): Promise<ShareWishlistDto> {
    const shareToken = await this.adapter.generateShareToken(userId);
    const baseUrl = window.location.origin;
    
    return {
      shareUrl: `${baseUrl}/wishlist/shared/${shareToken}`,
      shareToken
    };
  }

  async getSharedWishlist(shareToken: string): Promise<Wishlist> {
    const doc = await this.adapter.getSharedWishlist(shareToken);
    
    if (!doc) {
      throw new WishlistError(
        'Wishlist compartida no encontrada o no disponible',
        WishlistErrorCode.INVALID_SHARE_TOKEN
      );
    }

    return this.mapToWishlist(doc);
  }

  async revokeShareToken(userId: string): Promise<void> {
    await this.adapter.revokeShareToken(userId);
  }

  // ========== SYNC & ALERTS ==========

  async syncPricesAndStock(userId: string): Promise<void> {
    // TODO: Implementar sincronización con el módulo de productos
    // Por ahora solo actualizamos el timestamp
    const wishlist = await this.adapter.getWishlist(userId);
    
    if (!wishlist) return;

    // Aquí se debe hacer:
    // 1. Obtener el producto actual de la BD
    // 2. Comparar precios y stock
    // 3. Generar alertas si hay cambios
    // 4. Actualizar los items con la nueva información

    console.log('[WishlistRepository] Sync not fully implemented yet');
  }

  async getAlerts(userId: string, unreadOnly?: boolean): Promise<WishlistAlert[]> {
    const alertDocs = await this.adapter.getAlerts(userId, unreadOnly);
    return alertDocs.map(doc => this.mapToWishlistAlert(doc));
  }

  async markAlertAsRead(userId: string, alertId: string): Promise<void> {
    await this.adapter.markAlertAsRead(alertId);
  }

  async markAllAlertsAsRead(userId: string): Promise<void> {
    await this.adapter.markAllAlertsAsRead(userId);
  }

  // ========== MAPPERS ==========

  private mapToWishlist(doc: WishlistDoc | null): Wishlist {
    if (!doc) {
      return this.createEmptyWishlist();
    }

    const items = doc.items.map(item => this.mapToWishlistItem(item));
    const stats = WishlistDomainService.calculateStats(items);

    return {
      id: doc.id,
      userId: doc.userId,
      items,
      stats,
      settings: doc.settings,
      createdAt: this.timestampToDate(doc.createdAt),
      updatedAt: this.timestampToDate(doc.updatedAt),
      lastSyncedAt: this.timestampToDate(doc.lastSyncedAt),
      isEmpty: items.length === 0
    };
  }

  private mapToWishlistItem(doc: WishlistItemDoc): WishlistItem {
    const priceChange = WishlistDomainService.calculatePriceChange(
      doc.originalPrice,
      doc.currentPrice
    );

    return {
      id: doc.id,
      productId: doc.productId,
      variantId: doc.variantId,
      productSnapshot: doc.productSnapshot,
      variantSnapshot: doc.variantSnapshot,
      currentPrice: doc.currentPrice,
      originalPrice: doc.originalPrice,
      priceChange,
      hasPriceDropped: doc.currentPrice < doc.originalPrice,
      isAvailable: doc.isAvailable,
      isInStock: doc.isInStock,
      stockQuantity: doc.stockQuantity,
      priceAlertEnabled: doc.priceAlertEnabled,
      priceAlertThreshold: doc.priceAlertThreshold,
      stockAlertEnabled: doc.stockAlertEnabled,
      addedAt: this.timestampToDate(doc.addedAt),
      updatedAt: this.timestampToDate(doc.updatedAt),
      lastCheckedAt: this.timestampToDate(doc.lastCheckedAt),
      notes: doc.notes,
      priority: doc.priority
    };
  }

  private mapToWishlistAlert(doc: WishlistAlertDoc): WishlistAlert {
    return {
      id: doc.id,
      wishlistItemId: doc.wishlistItemId,
      type: doc.type,
      message: doc.message,
      oldValue: doc.oldValue,
      newValue: doc.newValue,
      createdAt: this.timestampToDate(doc.createdAt),
      isRead: doc.isRead
    };
  }

  private timestampToDate(timestamp: Timestamp | Date): Date {
    if (timestamp instanceof Timestamp) {
      return timestamp.toDate();
    }
    return timestamp;
  }

  private createEmptyWishlist(): Wishlist {
    const now = new Date();
    return {
      id: '',
      userId: '',
      items: [],
      stats: {
        totalItems: 0,
        itemsWithPriceDrops: 0,
        itemsOutOfStock: 0,
        totalSavings: 0,
        averagePriceChange: 0
      },
      settings: {
        isPublic: false,
        notificationsEnabled: true,
        emailNotifications: false
      },
      createdAt: now,
      updatedAt: now,
      lastSyncedAt: now,
      isEmpty: true
    };
  }
}
