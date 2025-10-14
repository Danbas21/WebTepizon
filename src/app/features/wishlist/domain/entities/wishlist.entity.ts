// ==========================================================
// WISHLIST ENTITY
// ==========================================================
// src/app/features/wishlist/domain/entities/wishlist.entity.ts

/**
 * Item de wishlist
 */
export interface WishlistItem {
    productId: string;
    productName: string;
    productImage: string;
    price: number;
    addedAt: Date;
}

/**
 * Entidad Wishlist del dominio
 * Representa la lista de deseos de un usuario
 */
export interface Wishlist {
    id: string;
    userId: string;
    items: WishlistItem[];
    createdAt: Date;
    updatedAt: Date;
}