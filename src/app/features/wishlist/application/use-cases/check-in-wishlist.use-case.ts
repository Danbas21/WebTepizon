/**
 * Use Case: CheckInWishlist
 * Verifica si un producto específico está en la lista de deseos
 */

import { inject } from '@angular/core';
import { WishlistRepositoryPort } from '../../domain/wishlist.repository.port';

export class CheckInWishlistUseCase {
  private readonly repository = inject(WishlistRepositoryPort);

  /**
   * Verifica si un producto/variante está en la wishlist
   */
  async execute(
    userId: string, 
    productId: string, 
    variantId?: string
  ): Promise<boolean> {
    return this.repository.checkIfInWishlist(userId, productId, variantId);
  }
}
