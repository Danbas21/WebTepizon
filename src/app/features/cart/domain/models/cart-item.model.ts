/**
 * Cart Item Domain Model
 * 
 * Representa un item individual en el carrito de compras.
 * Incluye producto, variante seleccionada, cantidad y cálculos.
 * 
 * @domain Cart
 */

export interface CartItem {
  id: string; // ID único del item en el carrito
  productId: string;
  variantId: string;
  
  // Snapshot del producto (para evitar inconsistencias)
  productSnapshot: {
    name: string;
    brand: string;
    mainImage: string;
    slug: string;
  };
  
  // Snapshot de la variante
  variantSnapshot: {
    sku: string;
    size?: string;
    color?: string;
    price: number;
    compareAtPrice?: number;
    image?: string;
  };
  
  // Cantidad
  quantity: number;
  maxQuantity: number; // Límite por stock o regla de negocio
  
  // Precios calculados
  unitPrice: number; // Precio unitario actual
  subtotal: number; // unitPrice * quantity
  discount: number; // Descuento total aplicado
  total: number; // subtotal - discount
  
  // Metadata
  addedAt: Date;
  updatedAt: Date;
  
  // Validación
  isAvailable: boolean; // Si el producto/variante sigue disponible
  hasStockIssue: boolean; // Si hay problema de stock
  stockMessage?: string; // Mensaje de stock (ej: "Solo quedan 2")
}

/**
 * Factory para crear un CartItem con valores por defecto
 */
export function createCartItem(partial: Partial<CartItem>): CartItem {
  const now = new Date();
  const unitPrice = partial.variantSnapshot?.price || 0;
  const quantity = partial.quantity || 1;
  
  // Calcular descuento si hay compareAtPrice
  const compareAtPrice = partial.variantSnapshot?.compareAtPrice;
  const discountPerUnit = compareAtPrice && compareAtPrice > unitPrice
    ? compareAtPrice - unitPrice
    : 0;
  
  const subtotal = unitPrice * quantity;
  const discount = discountPerUnit * quantity;
  const total = subtotal - discount;
  
  return {
    id: partial.id || generateCartItemId(),
    productId: partial.productId || '',
    variantId: partial.variantId || '',
    productSnapshot: partial.productSnapshot || {
      name: '',
      brand: '',
      mainImage: '',
      slug: '',
    },
    variantSnapshot: partial.variantSnapshot || {
      sku: '',
      price: 0,
    },
    quantity,
    maxQuantity: partial.maxQuantity || 99,
    unitPrice,
    subtotal,
    discount,
    total,
    addedAt: partial.addedAt || now,
    updatedAt: partial.updatedAt || now,
    isAvailable: partial.isAvailable !== undefined ? partial.isAvailable : true,
    hasStockIssue: partial.hasStockIssue || false,
    stockMessage: partial.stockMessage,
  };
}

/**
 * Genera un ID único para un item del carrito
 */
function generateCartItemId(): string {
  return `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Calcula el subtotal de un item
 */
export function calculateItemSubtotal(item: CartItem): number {
  return item.unitPrice * item.quantity;
}

/**
 * Calcula el descuento total de un item
 */
export function calculateItemDiscount(item: CartItem): number {
  if (!item.variantSnapshot.compareAtPrice) return 0;
  
  const discountPerUnit = item.variantSnapshot.compareAtPrice - item.unitPrice;
  return discountPerUnit * item.quantity;
}

/**
 * Calcula el total de un item
 */
export function calculateItemTotal(item: CartItem): number {
  return calculateItemSubtotal(item) - calculateItemDiscount(item);
}

/**
 * Recalcula todos los valores de un item
 */
export function recalculateCartItem(item: CartItem): CartItem {
  const subtotal = calculateItemSubtotal(item);
  const discount = calculateItemDiscount(item);
  const total = calculateItemTotal(item);
  
  return {
    ...item,
    subtotal,
    discount,
    total,
  };
}

/**
 * Valida si un item puede agregarse al carrito
 */
export function canAddToCart(quantity: number, maxQuantity: number): boolean {
  return quantity > 0 && quantity <= maxQuantity;
}

/**
 * Valida si se puede incrementar la cantidad de un item
 */
export function canIncrement(item: CartItem): boolean {
  return item.quantity < item.maxQuantity;
}

/**
 * Valida si se puede decrementar la cantidad de un item
 */
export function canDecrement(item: CartItem): boolean {
  return item.quantity > 1;
}

/**
 * Obtiene el porcentaje de descuento de un item
 */
export function getItemDiscountPercentage(item: CartItem): number {
  if (!item.variantSnapshot.compareAtPrice) return 0;
  
  const compareAt = item.variantSnapshot.compareAtPrice;
  const current = item.unitPrice;
  
  return Math.round(((compareAt - current) / compareAt) * 100);
}

/**
 * Verifica si dos items son iguales (mismo producto y variante)
 */
export function areItemsEqual(item1: CartItem, item2: CartItem): boolean {
  return (
    item1.productId === item2.productId &&
    item1.variantId === item2.variantId
  );
}

/**
 * Genera una clave única para identificar un item en el carrito
 */
export function getCartItemKey(productId: string, variantId: string): string {
  return `${productId}_${variantId}`;
}

/**
 * Crea un item del carrito desde un producto y variante
 */
export function createCartItemFromProduct(
  productId: string,
  productName: string,
  productBrand: string,
  productImage: string,
  productSlug: string,
  variantId: string,
  variantSku: string,
  variantSize: string | undefined,
  variantColor: string | undefined,
  variantPrice: number,
  variantCompareAtPrice: number | undefined,
  variantImage: string | undefined,
  quantity: number,
  maxQuantity: number
): CartItem {
  return createCartItem({
    productId,
    variantId,
    productSnapshot: {
      name: productName,
      brand: productBrand,
      mainImage: productImage,
      slug: productSlug,
    },
    variantSnapshot: {
      sku: variantSku,
      size: variantSize,
      color: variantColor,
      price: variantPrice,
      compareAtPrice: variantCompareAtPrice,
      image: variantImage,
    },
    quantity,
    maxQuantity,
  });
}

/**
 * Formatea el nombre completo de un item (con variantes)
 */
export function formatItemName(item: CartItem): string {
  let name = item.productSnapshot.name;
  
  const parts: string[] = [];
  if (item.variantSnapshot.size) parts.push(item.variantSnapshot.size);
  if (item.variantSnapshot.color) parts.push(item.variantSnapshot.color);
  
  if (parts.length > 0) {
    name += ` (${parts.join(', ')})`;
  }
  
  return name;
}
