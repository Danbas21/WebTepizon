/**
 * Facade: WishlistFacade
 * Punto de entrada único para todas las operaciones de Wishlist
 * Usa Signals de Angular 20 para estado reactivo
 */

import { Injectable, inject, signal, computed, effect } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { 
  Wishlist, 
  WishlistSummary, 
  WishlistSettings,
  ShareWishlistDto,
  WishlistAlert
} from '../domain/wishlist.model';
import { 
  WishlistItem, 
  CreateWishlistItemDto, 
  UpdateWishlistItemDto 
} from '../domain/wishlist-item.model';
import { WishlistDomainService } from '../domain/wishlist.domain.service';

// Use Cases
import { AddToWishlistUseCase } from './use-cases/add-to-wishlist.use-case';
import { RemoveFromWishlistUseCase } from './use-cases/remove-from-wishlist.use-case';
import { GetWishlistUseCase } from './use-cases/get-wishlist.use-case';
import { MoveToCartUseCase } from './use-cases/move-to-cart.use-case';
import { CheckInWishlistUseCase } from './use-cases/check-in-wishlist.use-case';
import { ClearWishlistUseCase } from './use-cases/clear-wishlist.use-case';
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
} from './use-cases/wishlist-advanced.use-cases';

@Injectable({ providedIn: 'root' })
export class WishlistFacade {
  // Use Cases
  private readonly addToWishlistUC = inject(AddToWishlistUseCase);
  private readonly removeFromWishlistUC = inject(RemoveFromWishlistUseCase);
  private readonly getWishlistUC = inject(GetWishlistUseCase);
  private readonly moveToCartUC = inject(MoveToCartUseCase);
  private readonly checkInWishlistUC = inject(CheckInWishlistUseCase);
  private readonly clearWishlistUC = inject(ClearWishlistUseCase);
  private readonly updateItemUC = inject(UpdateWishlistItemUseCase);
  private readonly updateSettingsUC = inject(UpdateWishlistSettingsUseCase);
  private readonly shareWishlistUC = inject(ShareWishlistUseCase);
  private readonly getSharedWishlistUC = inject(GetSharedWishlistUseCase);
  private readonly revokeShareUC = inject(RevokeShareAccessUseCase);
  private readonly syncWishlistUC = inject(SyncWishlistUseCase);
  private readonly getAlertsUC = inject(GetWishlistAlertsUseCase);
  private readonly markAlertReadUC = inject(MarkAlertAsReadUseCase);
  private readonly markAllAlertsReadUC = inject(MarkAllAlertsAsReadUseCase);

  // State - Signals
  private readonly currentUserId = signal<string | null>(null);
  private readonly isLoading = signal<boolean>(false);
  private readonly error = signal<string | null>(null);

  // Wishlist Observable → Signal
  private readonly wishlistObservable$ = computed(() => {
    const userId = this.currentUserId();
    return userId ? this.getWishlistUC.watch(userId) : null;
  });

  readonly wishlist = toSignal(this.wishlistObservable$() || new Observable<Wishlist>());

  // Computed Signals
  readonly items = computed(() => this.wishlist()?.items || []);
  readonly isEmpty = computed(() => this.wishlist()?.isEmpty ?? true);
  readonly itemsCount = computed(() => this.items().length);
  readonly stats = computed(() => this.wishlist()?.stats);
  readonly summary = computed((): WishlistSummary | null => {
    const wl = this.wishlist();
    return wl ? WishlistDomainService.generateSummary(wl) : null;
  });

  // Items filtrados
  readonly availableItems = computed(() => 
    WishlistDomainService.filterByAvailability(this.items(), true)
  );
  readonly itemsWithPriceDrops = computed(() => 
    WishlistDomainService.filterByPriceDrops(this.items())
  );
  readonly sortedItems = computed(() => 
    WishlistDomainService.sortItems([...this.items()])
  );

  // Settings
  readonly settings = computed(() => this.wishlist()?.settings);
  readonly isPublic = computed(() => this.settings()?.isPublic ?? false);

  constructor() {
    // Effect para debugging (opcional, remover en producción)
    effect(() => {
      const count = this.itemsCount();
      console.log(`[WishlistFacade] Items count: ${count}`);
    });
  }

  /**
   * Inicializa el facade con el userId actual
   */
  initialize(userId: string): void {
    this.currentUserId.set(userId);
    this.error.set(null);
  }

  /**
   * Limpia el estado
   */
  reset(): void {
    this.currentUserId.set(null);
    this.error.set(null);
    this.isLoading.set(false);
  }

  // ========== OPERACIONES BÁSICAS ==========

  /**
   * Agrega un producto a la wishlist
   */
  async addToWishlist(dto: CreateWishlistItemDto): Promise<void> {
    const userId = this.currentUserId();
    if (!userId) {
      throw new Error('Usuario no autenticado');
    }

    this.isLoading.set(true);
    this.error.set(null);

    try {
      await this.addToWishlistUC.execute(userId, dto);
    } catch (error: any) {
      this.error.set(error.message);
      throw error;
    } finally {
      this.isLoading.set(false);
    }
  }

  /**
   * Remueve un item de la wishlist
   */
  async removeFromWishlist(itemId: string): Promise<void> {
    const userId = this.currentUserId();
    if (!userId) return;

    this.isLoading.set(true);
    this.error.set(null);

    try {
      await this.removeFromWishlistUC.execute(userId, itemId);
    } catch (error: any) {
      this.error.set(error.message);
      throw error;
    } finally {
      this.isLoading.set(false);
    }
  }

  /**
   * Mueve un item de wishlist a cart
   */
  async moveToCart(itemId: string, quantity: number = 1) {
    const userId = this.currentUserId();
    if (!userId) return null;

    this.isLoading.set(true);
    this.error.set(null);

    try {
      return await this.moveToCartUC.execute(userId, itemId, quantity);
    } catch (error: any) {
      this.error.set(error.message);
      throw error;
    } finally {
      this.isLoading.set(false);
    }
  }

  /**
   * Verifica si un producto está en la wishlist
   */
  async isInWishlist(productId: string, variantId?: string): Promise<boolean> {
    const userId = this.currentUserId();
    if (!userId) return false;

    try {
      return await this.checkInWishlistUC.execute(userId, productId, variantId);
    } catch (error) {
      return false;
    }
  }

  /**
   * Limpia toda la wishlist
   */
  async clearWishlist(): Promise<void> {
    const userId = this.currentUserId();
    if (!userId) return;

    this.isLoading.set(true);
    this.error.set(null);

    try {
      await this.clearWishlistUC.execute(userId);
    } catch (error: any) {
      this.error.set(error.message);
      throw error;
    } finally {
      this.isLoading.set(false);
    }
  }

  // ========== OPERACIONES AVANZADAS ==========

  /**
   * Actualiza un item (notas, prioridad, alertas)
   */
  async updateItem(itemId: string, updates: UpdateWishlistItemDto): Promise<void> {
    const userId = this.currentUserId();
    if (!userId) return;

    this.isLoading.set(true);
    this.error.set(null);

    try {
      await this.updateItemUC.execute(userId, itemId, updates);
    } catch (error: any) {
      this.error.set(error.message);
      throw error;
    } finally {
      this.isLoading.set(false);
    }
  }

  /**
   * Actualiza la configuración de la wishlist
   */
  async updateSettings(settings: WishlistSettings): Promise<void> {
    const userId = this.currentUserId();
    if (!userId) return;

    this.isLoading.set(true);
    this.error.set(null);

    try {
      await this.updateSettingsUC.execute(userId, settings);
    } catch (error: any) {
      this.error.set(error.message);
      throw error;
    } finally {
      this.isLoading.set(false);
    }
  }

  /**
   * Genera un link para compartir la wishlist
   */
  async shareWishlist(): Promise<ShareWishlistDto | null> {
    const userId = this.currentUserId();
    if (!userId) return null;

    this.isLoading.set(true);
    this.error.set(null);

    try {
      return await this.shareWishlistUC.execute(userId);
    } catch (error: any) {
      this.error.set(error.message);
      return null;
    } finally {
      this.isLoading.set(false);
    }
  }

  /**
   * Obtiene una wishlist compartida
   */
  async getSharedWishlist(shareToken: string): Promise<Wishlist | null> {
    this.isLoading.set(true);
    this.error.set(null);

    try {
      return await this.getSharedWishlistUC.execute(shareToken);
    } catch (error: any) {
      this.error.set(error.message);
      return null;
    } finally {
      this.isLoading.set(false);
    }
  }

  /**
   * Revoca el acceso compartido
   */
  async revokeShareAccess(): Promise<void> {
    const userId = this.currentUserId();
    if (!userId) return;

    this.isLoading.set(true);
    this.error.set(null);

    try {
      await this.revokeShareUC.execute(userId);
    } catch (error: any) {
      this.error.set(error.message);
      throw error;
    } finally {
      this.isLoading.set(false);
    }
  }

  /**
   * Sincroniza precios y stock
   */
  async syncWishlist(): Promise<void> {
    const userId = this.currentUserId();
    if (!userId) return;

    this.isLoading.set(true);
    this.error.set(null);

    try {
      await this.syncWishlistUC.execute(userId);
    } catch (error: any) {
      this.error.set(error.message);
      throw error;
    } finally {
      this.isLoading.set(false);
    }
  }

  /**
   * Obtiene las alertas
   */
  async getAlerts(unreadOnly: boolean = false): Promise<WishlistAlert[]> {
    const userId = this.currentUserId();
    if (!userId) return [];

    try {
      return await this.getAlertsUC.execute(userId, unreadOnly);
    } catch (error) {
      return [];
    }
  }

  /**
   * Marca una alerta como leída
   */
  async markAlertAsRead(alertId: string): Promise<void> {
    const userId = this.currentUserId();
    if (!userId) return;

    try {
      await this.markAlertReadUC.execute(userId, alertId);
    } catch (error: any) {
      this.error.set(error.message);
    }
  }

  /**
   * Marca todas las alertas como leídas
   */
  async markAllAlertsAsRead(): Promise<void> {
    const userId = this.currentUserId();
    if (!userId) return;

    try {
      await this.markAllAlertsReadUC.execute(userId);
    } catch (error: any) {
      this.error.set(error.message);
    }
  }

  // ========== GETTERS ==========

  getLoadingState = () => this.isLoading();
  getError = () => this.error();
  getCurrentUserId = () => this.currentUserId();
}
