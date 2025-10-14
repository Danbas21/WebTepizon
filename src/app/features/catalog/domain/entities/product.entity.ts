// ==========================================================
// PRODUCT ENTITY
// ==========================================================
// src/app/features/catalog/domain/entities/product.entity.ts

/**
 * Estado de un producto
 */
export type ProductStatus = 'ACTIVE' | 'INACTIVE' | 'DRAFT' | 'OUT_OF_STOCK';

/**
 * Dimensiones físicas del producto
 */
export interface ProductDimensions {
    length: number;  // cm
    width: number;   // cm
    height: number;  // cm
    weight: number;  // kg
}

/**
 * Información SEO del producto
 */
export interface ProductSEO {
    metaTitle?: string;
    metaDescription?: string;
    keywords?: string[];
    canonicalUrl?: string;
}

/**
 * Entidad Product del dominio
 * Representa un producto en el catálogo
 */
export interface Product {
    id: string;
    name: string;
    slug: string;
    description: string;
    shortDescription?: string;

    // Precios
    price: number;
    compareAtPrice?: number;  // Precio original (para mostrar descuento)
    cost?: number;            // Costo para admin

    // Inventario
    sku: string;
    barcode?: string;
    stock: number;
    lowStockThreshold: number;

    // Categorización
    categoryId: string;
    categoryName: string;

    // Media
    images: string[];
    thumbnail?: string;

    // Metadata
    tags?: string[];
    status: ProductStatus;
    isFeatured: boolean;

    // Físico
    weight?: number;
    dimensions?: ProductDimensions;

    // SEO
    seo?: ProductSEO;

    // Analytics
    views: number;
    purchaseCount: number;
    rating: number;
    reviewCount: number;

    // Timestamps
    createdAt: Date;
    updatedAt: Date;
    lastViewedAt?: Date;
}
