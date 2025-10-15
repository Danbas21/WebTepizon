/**
 * Use Case: RemoveFromWishlist
 * Remueve un producto de la lista de deseos
 */

import { inject } from '@angular/core';
import { WishlistRepositoryPort } from '../../domain/wishlist.repository.port';

export class RemoveFromWishlistUseCase {
  private readonly repository = inject(WishlistRepositoryPort);

  async execute(userId: string, itemId: string): Promise<void> {
    await this.repository.removeItem(userId, itemId);
  }
}
