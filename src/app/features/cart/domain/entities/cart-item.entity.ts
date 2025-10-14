// ==========================================================
// CART ITEM ENTITY
// ==========================================================
// src/app/features/cart/domain/entities/cart-item.entity.ts

/**
 * Entidad CartItem del dominio
 * Representa un item dentro del carrito
 */
export interface CartItem {
    productId: string;
    productName: string;
    productImage: string;
    variantId?: string;     // Para productos con variantes (talla, color)
    price: number;
    quantity: number;
    subtotal: number;
    addedAt: Date;
}