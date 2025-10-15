/**
 * Modelo de dominio: WishlistItem
 * Representa un producto individual en la lista de deseos del usuario
 */

export interface WishlistItem {
  readonly id: string;
  readonly productId: string;
  readonly variantId?: string;
  
  // Snapshot del producto (para evitar inconsistencias)
  readonly productSnapshot: {
    readonly name: string;
    readonly brand: string;
    readonly mainImage: string;
    readonly slug: string;
  };
  
  // Snapshot de la variante (si aplica)
  readonly variantSnapshot?: {
    readonly sku: string;
    readonly size?: string;
    readonly color?: string;
    readonly price: number;
    readonly compareAtPrice?: number;
    readonly image?: string;
  };
  
  // Información actual del producto (para alertas)
  readonly currentPrice: number;
  readonly originalPrice: number; // Precio cuando se agregó
  readonly priceChange: number; // Diferencia de precio
  readonly hasPriceDropped: boolean;
  
  readonly isAvailable: boolean;
  readonly isInStock: boolean;
  readonly stockQuantity: number;
  
  // Alertas y notificaciones
  readonly priceAlertEnabled: boolean;
  readonly priceAlertThreshold?: number; // % de descuento para alertar
  readonly stockAlertEnabled: boolean;
  
  // Metadata
  readonly addedAt: Date;
  readonly updatedAt: Date;
  readonly lastCheckedAt: Date;
  readonly notes?: string; // Notas personales del usuario
  readonly priority: 'HIGH' | 'MEDIUM' | 'LOW';
}

export interface CreateWishlistItemDto {
  productId: string;
  variantId?: string;
  productSnapshot: {
    name: string;
    brand: string;
    mainImage: string;
    slug: string;
  };
  variantSnapshot?: {
    sku: string;
    size?: string;
    color?: string;
    price: number;
    compareAtPrice?: number;
    image?: string;
  };
  currentPrice: number;
  isAvailable: boolean;
  isInStock: boolean;
  stockQuantity: number;
  notes?: string;
  priority?: 'HIGH' | 'MEDIUM' | 'LOW';
  priceAlertEnabled?: boolean;
  priceAlertThreshold?: number;
  stockAlertEnabled?: boolean;
}

export interface UpdateWishlistItemDto {
  notes?: string;
  priority?: 'HIGH' | 'MEDIUM' | 'LOW';
  priceAlertEnabled?: boolean;
  priceAlertThreshold?: number;
  stockAlertEnabled?: boolean;
}
