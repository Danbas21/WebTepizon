/**
 * Use Case: AddToWishlist
 * Agrega un producto a la lista de deseos del usuario
 */

import { inject } from '@angular/core';
import { WishlistRepositoryPort } from '../domain/wishlist.repository.port';
import { WishlistDomainService } from '../domain/wishlist.domain.service';
import { CreateWishlistItemDto, WishlistItem } from '../domain/wishlist-item.model';
import { firstValueFrom } from 'rxjs';

export class AddToWishlistUseCase {
  private readonly repository = inject(WishlistRepositoryPort);

  async execute(
    userId: string, 
    dto: CreateWishlistItemDto
  ): Promise<WishlistItem> {
    // 1. Validar los datos del item
    WishlistDomainService.validateCreateItemDto(dto);

    // 2. Obtener la wishlist actual
    const wishlist = await firstValueFrom(this.repository.getWishlist(userId));

    // 3. Validar que se puede agregar
    WishlistDomainService.validateAddItem(
      wishlist, 
      dto.productId, 
      dto.variantId
    );

    // 4. Agregar el item
    const newItem = await this.repository.addItem(userId, dto);

    return newItem;
  }
}
