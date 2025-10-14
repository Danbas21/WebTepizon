/**
 * Cart Facade
 * 
 * Simplifica el uso de los use cases de carrito para la capa de presentación.
 * Expone un API simple usando Signals de Angular 20 para reactividad.
 * 
 * @pattern Facade (Gang of Four)
 * @layer Application
 */

import { Injectable, inject, signal, computed } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';

import { Cart, createCart, isInCart, getItemQuantity } from '../domain/models/cart.model';
import { CartItem } from '../domain/models/cart-item.model';
import { Coupon } from '../domain/models/coupon.model';
import { CartDomainService } from '../domain/services/cart.domain.service';
import { CartRepositoryPort } from '../domain/ports/cart.repository.port';

import { AddToCartUseCase } from './use-cases/add-to-cart.use-case';
import {
  RemoveFromCartUseCase,
  UpdateQuantityUseCase,
  ApplyCouponUseCase,
  SyncCartUseCase,
  ValidateStockUseCase,
} from './use-cases/cart-use-cases';

/**
 * Facade de carrito
 * 
 * Proporciona una API simple y reactiva para la UI:
 * - Signals para estado reactivo
 * - Métodos asíncronos para operaciones
 * - Computed signals para datos derivados
 */
@Injectable({
  providedIn: 'root',
})
export class CartFacade {
  // Inyección de dependencias
  private readonly repository = inject(CartRepositoryPort);
  private readonly domainService = inject(CartDomainService);
  private readonly addToCartUseCase = inject(AddToCartUseCase);
  private readonly removeFromCartUseCase = inject(RemoveFromCartUseCase);
  private readonly updateQuantityUseCase = inject(UpdateQuantityUseCase);
  private readonly applyCouponUseCase = inject(ApplyCouponUseCase);
  private readonly syncCartUseCase = inject(SyncCartUseCase);
  private readonly validateStockUseCase = inject(ValidateStockUseCase);

  // ==================== SIGNALS - STATE ====================

  /**
   * Carrito actual
   */
  readonly cart = signal<Cart>(createCart());

  /**
   * ID del usuario actual (null = guest)
   */
  readonly currentUserId = signal<string | null>(null);

  /**
   * Estado de carga
   */
  readonly isLoading = signal(false);

  /**
   * Error actual
   */
  readonly error = signal<string | null>(null);

  /**
   * Toast/mensaje temporal
   */
  readonly toast = signal<string | null>(null);

  /**
   * Drawer abierto/cerrado
   */
  readonly isDrawerOpen = signal(false);

  // ==================== COMPUTED SIGNALS ====================

  /**
   * Items del carrito
   */
  readonly items = computed(() => this.cart().items);

  /**
   * Número de items
   */
  readonly itemsCount = computed(() => this.cart().totals.itemsCount);

  /**
   * Cantidad total de productos
   */
  readonly itemsQuantity = computed(() => this.cart().totals.itemsQuantity);

  /**
   * Carrito vacío
   */
  readonly isEmpty = computed(() => this.cart().isEmpty);

  /**
   * Subtotal
   */
  readonly subtotal = computed(() => this.cart().totals.subtotal);

  /**
   * Descuento total
   */
  readonly discount = computed(() => this.cart().totals.totalDiscount);

  /**
   * Impuesto
   */
  readonly tax = computed(() => this.cart().totals.tax);

  /**
   * Envío
   */
  readonly shipping = computed(() => this.cart().totals.shippingCost);

  /**
   * Total
   */
  readonly total = computed(() => this.cart().totals.total);

  /**
   * Cupón aplicado
   */
  readonly appliedCoupon = computed(() => this.cart().appliedCoupon);

  /**
   * Tiene cupón
   */
  readonly hasCoupon = computed(() => this.cart().appliedCoupon !== null);

  /**
   * Tiene descuentos
   */
  readonly hasDiscount = computed(() => this.cart().totals.totalDiscount > 0);

  /**
   * Califica para envío gratis
   */
  readonly qualifiesForFreeShipping = computed(() => {
    const result = this.domainService.checkFreeShipping(this.cart());
    return result.qualifies;
  });

  /**
   * Monto para envío gratis
   */
  readonly amountForFreeShipping = computed(() => {
    const result = this.domainService.checkFreeShipping(this.cart());
    return result.amountNeeded;
  });

  /**
   * Mensaje de envío gratis
   */
  readonly freeShippingMessage = computed(() => {
    return this.domainService.getFreeShippingMessage(this.cart());
  });

  /**
   * Resumen del carrito
   */
  readonly summary = computed(() => {
    return this.domainService.getCartSummary(this.cart());
  });

  /**
   * Recomendaciones
   */
  readonly recommendations = computed(() => {
    return this.domainService.getCartRecommendations(this.cart());
  });

  /**
   * Tiene problemas de stock
   */
  readonly hasStockIssues = computed(() => {
    return this.cart().items.some(item => item.hasStockIssue || !item.isAvailable);
  });

  // ==================== INITIALIZATION ====================

  constructor() {
    // Cargar carrito inicial
    this.loadCart();
  }

  /**
   * Carga el carrito actual
   */
  async loadCart(): Promise<void> {
    try {
      const userId = this.currentUserId();
      const cart = await this.repository.getCart(userId);
      this.cart.set(cart);
    } catch (error) {
      console.error('Error cargando carrito:', error);
    }
  }

  /**
   * Inicia el listener del carrito (para usuarios autenticados)
   */
  startWatching(): void {
    const userId = this.currentUserId();
    
    if (userId) {
      // Convertir Observable a Signal
      const cartSignal = toSignal(this.repository.watchCart(userId));
      
      // Actualizar cuando cambie
      this.cart.set(cartSignal() || createCart({ userId }));
    }
  }

  // ==================== METHODS - ITEMS ====================

  /**
   * Agrega un producto al carrito
   */
  async addItem(
    productId: string,
    variantId: string,
    quantity = 1
  ): Promise<boolean> {
    this.isLoading.set(true);
    this.error.set(null);

    try {
      const result = await this.addToCartUseCase.execute({
        productId,
        variantId,
        quantity,
        userId: this.currentUserId(),
      });

      if (result.success && result.cart) {
        this.cart.set(result.cart);
        this.showToast(`Producto agregado al carrito`);
        return true;
      } else {
        this.error.set(result.error || 'Error al agregar');
        return false;
      }
    } finally {
      this.isLoading.set(false);
    }
  }

  /**
   * Remueve un item del carrito
   */
  async removeItem(itemId: string): Promise<boolean> {
    this.isLoading.set(true);
    this.error.set(null);

    try {
      const result = await this.removeFromCartUseCase.execute({
        itemId,
        userId: this.currentUserId(),
      });

      if (result.success && result.cart) {
        this.cart.set(result.cart);
        this.showToast('Producto removido');
        return true;
      } else {
        this.error.set(result.error || 'Error al remover');
        return false;
      }
    } finally {
      this.isLoading.set(false);
    }
  }

  /**
   * Actualiza la cantidad de un item
   */
  async updateQuantity(itemId: string, quantity: number): Promise<boolean> {
    this.isLoading.set(true);
    this.error.set(null);

    try {
      const result = await this.updateQuantityUseCase.execute({
        itemId,
        quantity,
        userId: this.currentUserId(),
      });

      if (result.success && result.cart) {
        this.cart.set(result.cart);
        return true;
      } else {
        this.error.set(result.error || 'Error al actualizar');
        return false;
      }
    } finally {
      this.isLoading.set(false);
    }
  }

  /**
   * Incrementa la cantidad de un item
   */
  async increment(itemId: string): Promise<boolean> {
    return this.updateQuantityUseCase.increment(itemId, this.currentUserId()).then(result => {
      if (result.success && result.cart) {
        this.cart.set(result.cart);
        return true;
      }
      return false;
    });
  }

  /**
   * Decrementa la cantidad de un item
   */
  async decrement(itemId: string): Promise<boolean> {
    return this.updateQuantityUseCase.decrement(itemId, this.currentUserId()).then(result => {
      if (result.success && result.cart) {
        this.cart.set(result.cart);
        return true;
      }
      return false;
    });
  }

  /**
   * Limpia el carrito
   */
  async clearCart(): Promise<boolean> {
    this.isLoading.set(true);

    try {
      const result = await this.removeFromCartUseCase.clearCart(this.currentUserId());

      if (result.success && result.cart) {
        this.cart.set(result.cart);
        this.showToast('Carrito limpiado');
        return true;
      }
      return false;
    } finally {
      this.isLoading.set(false);
    }
  }

  // ==================== METHODS - COUPONS ====================

  /**
   * Aplica un cupón
   */
  async applyCoupon(couponCode: string): Promise<boolean> {
    this.isLoading.set(true);
    this.error.set(null);

    try {
      const result = await this.applyCouponUseCase.execute({
        couponCode,
        userId: this.currentUserId(),
      });

      if (result.success && result.cart) {
        this.cart.set(result.cart);
        this.showToast(`Cupón aplicado: ${result.coupon?.code}`);
        return true;
      } else {
        this.error.set(result.error || 'Cupón no válido');
        return false;
      }
    } finally {
      this.isLoading.set(false);
    }
  }

  /**
   * Remueve el cupón
   */
  async removeCoupon(): Promise<boolean> {
    this.isLoading.set(true);

    try {
      const result = await this.applyCouponUseCase.removeCoupon(this.currentUserId());

      if (result.success && result.cart) {
        this.cart.set(result.cart);
        this.showToast('Cupón removido');
        return true;
      }
      return false;
    } finally {
      this.isLoading.set(false);
    }
  }

  // ==================== METHODS - SYNC ====================

  /**
   * Sincroniza carritos al hacer login
   */
  async syncCart(userId: string): Promise<void> {
    this.isLoading.set(true);

    try {
      const result = await this.syncCartUseCase.execute({
        localUserId: null,
        remoteUserId: userId,
      });

      if (result.success && result.cart) {
        this.currentUserId.set(userId);
        this.cart.set(result.cart);

        if (result.merged) {
          this.showToast('Carrito sincronizado');
        }
      }
    } finally {
      this.isLoading.set(false);
    }
  }

  /**
   * Establece el usuario actual
   */
  setUser(userId: string | null): void {
    this.currentUserId.set(userId);
    this.loadCart();
  }

  // ==================== METHODS - VALIDATION ====================

  /**
   * Valida el stock del carrito
   */
  async validateStock(): Promise<boolean> {
    const result = await this.validateStockUseCase.execute(this.currentUserId());

    if (result.success && result.cart) {
      this.cart.set(result.cart);

      if (result.hasIssues) {
        this.showToast(`${result.issuesCount} productos con problemas de stock`);
        return false;
      }
      return true;
    }
    return false;
  }

  // ==================== METHODS - HELPERS ====================

  /**
   * Verifica si un producto está en el carrito
   */
  isInCart(productId: string, variantId: string): boolean {
    return isInCart(this.cart(), productId, variantId);
  }

  /**
   * Obtiene la cantidad de un producto en el carrito
   */
  getQuantity(productId: string, variantId: string): number {
    return getItemQuantity(this.cart(), productId, variantId);
  }

  /**
   * Formatea un precio
   */
  formatPrice(price: number): string {
    return this.domainService.formatPrice(price);
  }

  /**
   * Abre el drawer del carrito
   */
  openDrawer(): void {
    this.isDrawerOpen.set(true);
  }

  /**
   * Cierra el drawer del carrito
   */
  closeDrawer(): void {
    this.isDrawerOpen.set(false);
  }

  /**
   * Toggle del drawer
   */
  toggleDrawer(): void {
    this.isDrawerOpen.update(open => !open);
  }

  /**
   * Muestra un toast temporal
   */
  private showToast(message: string): void {
    this.toast.set(message);
    setTimeout(() => this.toast.set(null), 3000);
  }

  /**
   * Limpia el error
   */
  clearError(): void {
    this.error.set(null);
  }

  /**
   * Limpia el toast
   */
  clearToast(): void {
    this.toast.set(null);
  }
}
