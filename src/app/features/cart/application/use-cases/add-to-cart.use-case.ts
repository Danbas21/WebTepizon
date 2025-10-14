/**
 * Add To Cart Use Case
 * 
 * Orquesta el flujo de agregar un producto al carrito.
 * Incluye validaciones de stock, límites y creación de snapshot.
 * 
 * @pattern Use Case (Clean Architecture)
 */

import { Injectable, inject } from '@angular/core';
import { CartRepositoryPort } from '../../domain/ports/cart.repository.port';
import { CatalogRepositoryPort } from '../../../catalog/domain/ports/catalog.repository.port';
import { CartDomainService } from '../../domain/services/cart.domain.service';
import { Cart } from '../../domain/models/cart.model';
import { createCartItemFromProduct } from '../../domain/models/cart-item.model';

export interface AddToCartUseCaseInput {
  productId: string;
  variantId: string;
  quantity: number;
  userId?: string | null;
}

export interface AddToCartUseCaseOutput {
  success: boolean;
  cart?: Cart;
  error?: string;
}

/**
 * Use Case para agregar productos al carrito
 * 
 * Flujo:
 * 1. Obtener producto y variante
 * 2. Validar stock disponible
 * 3. Validar cantidad y límites
 * 4. Crear snapshot del producto/variante
 * 5. Agregar al carrito
 * 6. Retornar carrito actualizado
 */
@Injectable({
  providedIn: 'root',
})
export class AddToCartUseCase {
  private readonly cartRepository = inject(CartRepositoryPort);
  private readonly catalogRepository = inject(CatalogRepositoryPort);
  private readonly domainService = inject(CartDomainService);

  /**
   * Ejecuta el caso de uso
   */
  async execute(input: AddToCartUseCaseInput): Promise<AddToCartUseCaseOutput> {
    try {
      const { productId, variantId, quantity, userId = null } = input;

      // 1. Validar cantidad
      if (quantity < 1) {
        return {
          success: false,
          error: 'La cantidad debe ser mayor a 0',
        };
      }

      // 2. Obtener producto
      const product = await this.catalogRepository.getProductById(productId);

      if (!product) {
        return {
          success: false,
          error: 'Producto no encontrado',
        };
      }

      // 3. Obtener variante
      const variant = product.variants.find(v => v.id === variantId);

      if (!variant) {
        return {
          success: false,
          error: 'Variante no encontrada',
        };
      }

      // 4. Verificar stock
      const stockCheck = await this.cartRepository.checkStock(
        productId,
        variantId,
        quantity
      );

      if (!stockCheck.available) {
        return {
          success: false,
          error: `Stock insuficiente. Solo hay ${stockCheck.stock} disponibles`,
        };
      }

      // 5. Obtener carrito actual
      const cart = await this.cartRepository.getCart(userId);

      // 6. Validar límites
      const canAdd = this.domainService.canAddItem(cart, quantity, stockCheck.stock);

      if (!canAdd.canAdd) {
        return {
          success: false,
          error: canAdd.reason,
        };
      }

      // 7. Crear cart item con snapshot
      const cartItem = createCartItemFromProduct(
        productId,
        product.name,
        product.brand,
        product.mainImage,
        product.seo.slug,
        variantId,
        variant.sku,
        variant.size,
        variant.color,
        variant.price,
        variant.compareAtPrice,
        variant.images[0],
        quantity,
        Math.min(stockCheck.stock, this.domainService.getMaxQuantityPerItem())
      );

      // 8. Agregar al carrito
      const updatedCart = await this.cartRepository.addItem(userId, cartItem);

      // 9. Retornar éxito
      return {
        success: true,
        cart: updatedCart,
      };
    } catch (error) {
      console.error('Error en AddToCartUseCase:', error);
      return {
        success: false,
        error: 'Error al agregar al carrito. Intenta de nuevo',
      };
    }
  }

  /**
   * Agrega múltiples items al carrito
   */
  async addMultiple(
    items: AddToCartUseCaseInput[]
  ): Promise<AddToCartUseCaseOutput> {
    try {
      let cart: Cart | undefined;

      for (const item of items) {
        const result = await this.execute(item);

        if (!result.success) {
          return result; // Retornar primer error
        }

        cart = result.cart;
      }

      return {
        success: true,
        cart,
      };
    } catch (error) {
      console.error('Error en addMultiple:', error);
      return {
        success: false,
        error: 'Error al agregar productos al carrito',
      };
    }
  }

  /**
   * Re-agrega un item previamente removido
   */
  async reAddItem(
    userId: string | null,
    productId: string,
    variantId: string,
    quantity = 1
  ): Promise<AddToCartUseCaseOutput> {
    return this.execute({ productId, variantId, quantity, userId });
  }
}
