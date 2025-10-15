/**
 * Use Case: ClearWishlist
 * Elimina todos los productos de la lista de deseos
 */

import { inject } from '@angular/core';
import { WishlistRepositoryPort } from '../../domain/wishlist.repository.port';

export class ClearWishlistUseCase {
  private readonly repository = inject(WishlistRepositoryPort);

  async execute(userId: string): Promise<void> {
    await this.repository.clearWishlist(userId);
  }
}
