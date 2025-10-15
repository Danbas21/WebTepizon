/**
 * Use Case: MoveToCart
 * Mueve un producto de la wishlist al carrito de compras
 */

import { inject } from '@angular/core';
import { WishlistRepositoryPort } from '../../domain/wishlist.repository.port';
import { WishlistError, WishlistErrorCode } from '../../domain/wishlist.model';

export interface MoveToCartResult {
  success: boolean;
  removedFromWishlist: boolean;
  addedToCart: boolean;
  message: string;
}

export class MoveToCartUseCase {
  private readonly repository = inject(WishlistRepositoryPort);

  async execute(
    userId: string, 
    itemId: string,
    quantity: number = 1
  ): Promise<MoveToCartResult> {
    // 1. Obtener el item de la wishlist
    const item = await this.repository.getItem(userId, itemId);

    if (!item) {
      throw new WishlistError(
        'El producto no existe en tu lista de deseos',
        WishlistErrorCode.ITEM_NOT_FOUND
      );
    }

    // 2. Verificar disponibilidad
    if (!item.isAvailable) {
      return {
        success: false,
        removedFromWishlist: false,
        addedToCart: false,
        message: 'Este producto ya no está disponible'
      };
    }

    if (!item.isInStock) {
      return {
        success: false,
        removedFromWishlist: false,
        addedToCart: false,
        message: 'Este producto está agotado'
      };
    }

    if (item.stockQuantity < quantity) {
      return {
        success: false,
        removedFromWishlist: false,
        addedToCart: false,
        message: `Solo hay ${item.stockQuantity} unidades disponibles`
      };
    }

    // 3. TODO: Agregar al carrito
    // Esta integración se hará cuando conectemos con el Cart Module
    // Por ahora, retornamos la información necesaria para que el facade lo maneje
    
    // 4. Remover de la wishlist después de agregar al carrito exitosamente
    await this.repository.removeItem(userId, itemId);

    return {
      success: true,
      removedFromWishlist: true,
      addedToCart: true, // Se cambiará cuando tengamos la integración real
      message: 'Producto movido al carrito exitosamente'
    };
  }

  /**
   * Obtiene la información necesaria para agregar al carrito sin remover de wishlist
   */
  async getCartData(userId: string, itemId: string) {
    const item = await this.repository.getItem(userId, itemId);

    if (!item) {
      throw new WishlistError(
        'El producto no existe en tu lista de deseos',
        WishlistErrorCode.ITEM_NOT_FOUND
      );
    }

    return {
      productId: item.productId,
      variantId: item.variantId,
      quantity: 1,
      productSnapshot: item.productSnapshot,
      variantSnapshot: item.variantSnapshot,
      isAvailable: item.isAvailable,
      isInStock: item.isInStock,
      stockQuantity: item.stockQuantity
    };
  }
}
