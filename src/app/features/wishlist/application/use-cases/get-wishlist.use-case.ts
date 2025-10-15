/**
 * Use Case: GetWishlist
 * Obtiene la lista de deseos del usuario con todas sus estadísticas
 */

import { inject } from '@angular/core';
import { Observable } from 'rxjs';
import { WishlistRepositoryPort } from '../../domain/wishlist.repository.port';
import { Wishlist } from '../../domain/wishlist.model';

export class GetWishlistUseCase {
  private readonly repository = inject(WishlistRepositoryPort);

  /**
   * Obtiene la wishlist del usuario (una vez)
   */
  execute(userId: string): Observable<Wishlist> {
    return this.repository.getWishlist(userId);
  }

  /**
   * Observa cambios en tiempo real de la wishlist
   */
  watch(userId: string): Observable<Wishlist> {
    return this.repository.watchWishlist(userId);
  }
}
