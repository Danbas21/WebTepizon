/**
 * Product Domain Model
 * 
 * Representa un producto en el catálogo con:
 * - Variantes (tallas, colores)
 * - Múltiples imágenes (máximo 3)
 * - Stock e inventario
 * - Ratings y reviews
 * - Analytics
 * 
 * @domain Catalog
 */

export enum ProductStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  OUT_OF_STOCK = 'OUT_OF_STOCK',
  DISCONTINUED = 'DISCONTINUED',
}

export interface ProductVariant {
  id: string;
  sku: string;
  size?: string;
  color?: string;
  stock: number;
  price: number;
  compareAtPrice?: number; // Precio anterior (para mostrar descuento)
  images: string[]; // URLs de imágenes específicas de esta variante
}

export interface ProductImage {
  url: string;
  alt: string;
  isPrimary: boolean;
  order: number;
}

export interface ProductRating {
  average: number; // 0-5
  count: number; // Número de reviews
  distribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
}

export interface ProductDimensions {
  weight?: number; // kg
  length?: number; // cm
  width?: number; // cm
  height?: number; // cm
}

export interface ProductSEO {
  title: string;
  description: string;
  keywords: string[];
  slug: string;
}

export interface ProductAnalytics {
  views: number;
  clicks: number;
  purchases: number;
  averageTimeOnPage: number; // segundos
  conversionRate: number; // porcentaje
  lastViewed?: Date;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  shortDescription?: string;
  brand: string;
  categoryId: string;
  categoryPath: string[]; // ['ropa', 'hombre', 'camisetas']
  
  // Variantes
  variants: ProductVariant[];
  hasVariants: boolean;
  
  // Imágenes (máximo 3)
  images: ProductImage[];
  mainImage: string;
  
  // Pricing
  basePrice: number;
  minPrice: number; // Precio más bajo entre variantes
  maxPrice: number; // Precio más alto entre variantes
  hasDiscount: boolean;
  discountPercentage?: number;
  
  // Stock
  totalStock: number;
  isLowStock: boolean; // < 5 unidades
  isOutOfStock: boolean;
  
  // Status
  status: ProductStatus;
  isActive: boolean;
  isFeatured: boolean;
  isNew: boolean;
  
  // Rating
  rating: ProductRating;
  
  // Metadata
  tags: string[];
  dimensions?: ProductDimensions;
  seo: ProductSEO;
  
  // Analytics
  analytics: ProductAnalytics;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  publishedAt?: Date;
}

/**
 * Factory para crear un producto con valores por defecto
 */
export function createProduct(partial: Partial<Product>): Product {
  const now = new Date();
  
  return {
    id: partial.id || '',
    name: partial.name || '',
    description: partial.description || '',
    shortDescription: partial.shortDescription,
    brand: partial.brand || '',
    categoryId: partial.categoryId || '',
    categoryPath: partial.categoryPath || [],
    
    variants: partial.variants || [],
    hasVariants: partial.hasVariants || (partial.variants?.length || 0) > 1,
    
    images: partial.images || [],
    mainImage: partial.mainImage || '',
    
    basePrice: partial.basePrice || 0,
    minPrice: partial.minPrice || 0,
    maxPrice: partial.maxPrice || 0,
    hasDiscount: partial.hasDiscount || false,
    discountPercentage: partial.discountPercentage,
    
    totalStock: partial.totalStock || 0,
    isLowStock: partial.isLowStock || (partial.totalStock || 0) < 5,
    isOutOfStock: partial.isOutOfStock || (partial.totalStock || 0) === 0,
    
    status: partial.status || ProductStatus.ACTIVE,
    isActive: partial.isActive !== undefined ? partial.isActive : true,
    isFeatured: partial.isFeatured || false,
    isNew: partial.isNew || false,
    
    rating: partial.rating || {
      average: 0,
      count: 0,
      distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    },
    
    tags: partial.tags || [],
    dimensions: partial.dimensions,
    seo: partial.seo || {
      title: partial.name || '',
      description: partial.shortDescription || partial.description || '',
      keywords: [],
      slug: partial.name?.toLowerCase().replace(/\s+/g, '-') || '',
    },
    
    analytics: partial.analytics || {
      views: 0,
      clicks: 0,
      purchases: 0,
      averageTimeOnPage: 0,
      conversionRate: 0,
    },
    
    createdAt: partial.createdAt || now,
    updatedAt: partial.updatedAt || now,
    publishedAt: partial.publishedAt,
  };
}

/**
 * Factory para crear una variante de producto
 */
export function createProductVariant(partial: Partial<ProductVariant>): ProductVariant {
  return {
    id: partial.id || '',
    sku: partial.sku || '',
    size: partial.size,
    color: partial.color,
    stock: partial.stock || 0,
    price: partial.price || 0,
    compareAtPrice: partial.compareAtPrice,
    images: partial.images || [],
  };
}

/**
 * Calcula el precio mínimo y máximo de un producto
 */
export function calculatePriceRange(product: Product): { min: number; max: number } {
  if (!product.variants.length) {
    return { min: product.basePrice, max: product.basePrice };
  }

  const prices = product.variants.map(v => v.price);
  return {
    min: Math.min(...prices),
    max: Math.max(...prices),
  };
}

/**
 * Calcula el stock total de un producto
 */
export function calculateTotalStock(product: Product): number {
  if (!product.variants.length) {
    return 0;
  }

  return product.variants.reduce((total, variant) => total + variant.stock, 0);
}

/**
 * Verifica si un producto tiene descuento
 */
export function hasProductDiscount(product: Product): boolean {
  return product.variants.some(v => v.compareAtPrice && v.compareAtPrice > v.price);
}

/**
 * Calcula el porcentaje de descuento promedio
 */
export function calculateDiscountPercentage(product: Product): number {
  const variantsWithDiscount = product.variants.filter(
    v => v.compareAtPrice && v.compareAtPrice > v.price
  );

  if (!variantsWithDiscount.length) return 0;

  const avgDiscount = variantsWithDiscount.reduce((sum, v) => {
    const discount = ((v.compareAtPrice! - v.price) / v.compareAtPrice!) * 100;
    return sum + discount;
  }, 0) / variantsWithDiscount.length;

  return Math.round(avgDiscount);
}

/**
 * Type guard para verificar si un producto está activo
 */
export function isProductActive(product: Product): boolean {
  return product.status === ProductStatus.ACTIVE && product.isActive;
}

/**
 * Type guard para verificar si un producto está disponible para compra
 */
export function isProductAvailable(product: Product): boolean {
  return isProductActive(product) && !product.isOutOfStock;
}

/**
 * Obtiene la variante de un producto por ID
 */
export function getProductVariant(product: Product, variantId: string): ProductVariant | null {
  return product.variants.find(v => v.id === variantId) || null;
}

/**
 * Obtiene la imagen principal de un producto
 */
export function getPrimaryImage(product: Product): ProductImage | null {
  return product.images.find(img => img.isPrimary) || product.images[0] || null;
}
