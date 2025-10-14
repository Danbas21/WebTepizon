/**
 * Cart Domain Model
 * 
 * Representa el carrito de compras completo con:
 * - Items del carrito
 * - Cupón aplicado
 * - Cálculos de totales (subtotal, descuentos, impuestos, envío)
 * - Metadata de seguimiento
 * 
 * @domain Cart
 */

import { CartItem, recalculateCartItem } from './cart-item.model';
import { Coupon, calculateCouponDiscount, isFreeShippingCoupon } from './coupon.model';

export enum CartStatus {
  ACTIVE = 'ACTIVE', // Carrito activo
  ABANDONED = 'ABANDONED', // Carrito abandonado (>24h sin actividad)
  CONVERTED = 'CONVERTED', // Convertido a orden
  EXPIRED = 'EXPIRED', // Expirado (>30 días)
}

export interface CartTotals {
  itemsCount: number; // Total de items
  itemsQuantity: number; // Suma de cantidades
  subtotal: number; // Suma de todos los items
  itemsDiscount: number; // Descuentos de productos
  couponDiscount: number; // Descuento del cupón
  totalDiscount: number; // itemsDiscount + couponDiscount
  taxRate: number; // Tasa de impuesto (ej: 0.16 = 16%)
  tax: number; // Impuesto calculado
  shippingCost: number; // Costo de envío
  total: number; // Total final
}

export interface Cart {
  id: string; // ID del carrito
  userId: string | null; // null si es guest
  
  // Items
  items: CartItem[];
  
  // Cupón aplicado
  appliedCoupon: Coupon | null;
  
  // Totales calculados
  totals: CartTotals;
  
  // Status
  status: CartStatus;
  isEmpty: boolean;
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  lastActivityAt: Date;
  expiresAt: Date; // Fecha de expiración (30 días)
  
  // Tracking
  source?: string; // Origen del carrito (web, mobile, etc.)
  sessionId?: string; // ID de sesión
}

/**
 * Factory para crear un carrito con valores por defecto
 */
export function createCart(partial: Partial<Cart> = {}): Cart {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 días
  
  const items = partial.items || [];
  const totals = calculateCartTotals(
    items,
    partial.appliedCoupon || null,
    partial.totals?.taxRate || 0.16,
    partial.totals?.shippingCost || 0
  );
  
  return {
    id: partial.id || generateCartId(),
    userId: partial.userId || null,
    items,
    appliedCoupon: partial.appliedCoupon || null,
    totals,
    status: partial.status || CartStatus.ACTIVE,
    isEmpty: items.length === 0,
    createdAt: partial.createdAt || now,
    updatedAt: partial.updatedAt || now,
    lastActivityAt: partial.lastActivityAt || now,
    expiresAt: partial.expiresAt || expiresAt,
    source: partial.source,
    sessionId: partial.sessionId,
  };
}

/**
 * Genera un ID único para el carrito
 */
function generateCartId(): string {
  return `cart_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Calcula los totales del carrito
 */
export function calculateCartTotals(
  items: CartItem[],
  coupon: Coupon | null,
  taxRate = 0.16,
  shippingCost = 0
): CartTotals {
  // Recalcular cada item
  const recalculatedItems = items.map(item => recalculateCartItem(item));
  
  // Contadores
  const itemsCount = recalculatedItems.length;
  const itemsQuantity = recalculatedItems.reduce((sum, item) => sum + item.quantity, 0);
  
  // Subtotal (suma de subtotals de items)
  const subtotal = recalculatedItems.reduce((sum, item) => sum + item.subtotal, 0);
  
  // Descuentos de items
  const itemsDiscount = recalculatedItems.reduce((sum, item) => sum + item.discount, 0);
  
  // Descuento del cupón
  const subtotalAfterItemsDiscount = subtotal - itemsDiscount;
  const couponDiscount = coupon
    ? calculateCouponDiscount(coupon, subtotalAfterItemsDiscount)
    : 0;
  
  // Descuento total
  const totalDiscount = itemsDiscount + couponDiscount;
  
  // Base para impuestos (subtotal - descuentos)
  const taxableAmount = subtotal - totalDiscount;
  
  // Impuesto
  const tax = taxableAmount * taxRate;
  
  // Envío (gratis si hay cupón de free shipping)
  const finalShippingCost = coupon && isFreeShippingCoupon(coupon) ? 0 : shippingCost;
  
  // Total final
  const total = taxableAmount + tax + finalShippingCost;
  
  return {
    itemsCount,
    itemsQuantity,
    subtotal,
    itemsDiscount,
    couponDiscount,
    totalDiscount,
    taxRate,
    tax,
    shippingCost: finalShippingCost,
    total: Math.max(0, total), // No puede ser negativo
  };
}

/**
 * Recalcula los totales del carrito
 */
export function recalculateCart(cart: Cart): Cart {
  const totals = calculateCartTotals(
    cart.items,
    cart.appliedCoupon,
    cart.totals.taxRate,
    cart.totals.shippingCost
  );
  
  return {
    ...cart,
    totals,
    isEmpty: cart.items.length === 0,
    updatedAt: new Date(),
  };
}

/**
 * Agrega un item al carrito (o incrementa cantidad si ya existe)
 */
export function addItemToCart(cart: Cart, item: CartItem): Cart {
  const existingItemIndex = cart.items.findIndex(
    i => i.productId === item.productId && i.variantId === item.variantId
  );
  
  let newItems: CartItem[];
  
  if (existingItemIndex >= 0) {
    // Ya existe, incrementar cantidad
    const existingItem = cart.items[existingItemIndex];
    const newQuantity = Math.min(
      existingItem.quantity + item.quantity,
      existingItem.maxQuantity
    );
    
    newItems = [...cart.items];
    newItems[existingItemIndex] = {
      ...existingItem,
      quantity: newQuantity,
      updatedAt: new Date(),
    };
  } else {
    // Nuevo item
    newItems = [...cart.items, item];
  }
  
  return recalculateCart({
    ...cart,
    items: newItems,
    lastActivityAt: new Date(),
  });
}

/**
 * Remueve un item del carrito
 */
export function removeItemFromCart(cart: Cart, itemId: string): Cart {
  const newItems = cart.items.filter(item => item.id !== itemId);
  
  return recalculateCart({
    ...cart,
    items: newItems,
    lastActivityAt: new Date(),
  });
}

/**
 * Actualiza la cantidad de un item
 */
export function updateItemQuantity(
  cart: Cart,
  itemId: string,
  quantity: number
): Cart {
  const itemIndex = cart.items.findIndex(item => item.id === itemId);
  
  if (itemIndex < 0) {
    return cart; // Item no encontrado
  }
  
  const item = cart.items[itemIndex];
  
  // Validar cantidad
  if (quantity < 1) {
    // Si la cantidad es 0 o negativa, remover el item
    return removeItemFromCart(cart, itemId);
  }
  
  if (quantity > item.maxQuantity) {
    quantity = item.maxQuantity;
  }
  
  const newItems = [...cart.items];
  newItems[itemIndex] = {
    ...item,
    quantity,
    updatedAt: new Date(),
  };
  
  return recalculateCart({
    ...cart,
    items: newItems,
    lastActivityAt: new Date(),
  });
}

/**
 * Aplica un cupón al carrito
 */
export function applyCouponToCart(cart: Cart, coupon: Coupon): Cart {
  return recalculateCart({
    ...cart,
    appliedCoupon: coupon,
    lastActivityAt: new Date(),
  });
}

/**
 * Remueve el cupón del carrito
 */
export function removeCouponFromCart(cart: Cart): Cart {
  return recalculateCart({
    ...cart,
    appliedCoupon: null,
    lastActivityAt: new Date(),
  });
}

/**
 * Limpia el carrito
 */
export function clearCart(cart: Cart): Cart {
  return recalculateCart({
    ...cart,
    items: [],
    appliedCoupon: null,
    lastActivityAt: new Date(),
  });
}

/**
 * Actualiza el costo de envío
 */
export function updateShippingCost(cart: Cart, shippingCost: number): Cart {
  const totals = calculateCartTotals(
    cart.items,
    cart.appliedCoupon,
    cart.totals.taxRate,
    shippingCost
  );
  
  return {
    ...cart,
    totals,
    updatedAt: new Date(),
  };
}

/**
 * Actualiza la tasa de impuesto
 */
export function updateTaxRate(cart: Cart, taxRate: number): Cart {
  const totals = calculateCartTotals(
    cart.items,
    cart.appliedCoupon,
    taxRate,
    cart.totals.shippingCost
  );
  
  return {
    ...cart,
    totals,
    updatedAt: new Date(),
  };
}

/**
 * Verifica si el carrito está abandonado (>24h sin actividad)
 */
export function isCartAbandoned(cart: Cart): boolean {
  const now = new Date();
  const hoursSinceLastActivity =
    (now.getTime() - cart.lastActivityAt.getTime()) / (1000 * 60 * 60);
  
  return hoursSinceLastActivity > 24 && !cart.isEmpty;
}

/**
 * Verifica si el carrito está expirado (>30 días)
 */
export function isCartExpired(cart: Cart): boolean {
  return new Date() > cart.expiresAt;
}

/**
 * Verifica si hay problemas de stock en algún item
 */
export function hasStockIssues(cart: Cart): boolean {
  return cart.items.some(item => item.hasStockIssue || !item.isAvailable);
}

/**
 * Obtiene items con problemas de stock
 */
export function getItemsWithStockIssues(cart: Cart): CartItem[] {
  return cart.items.filter(item => item.hasStockIssue || !item.isAvailable);
}

/**
 * Obtiene items disponibles
 */
export function getAvailableItems(cart: Cart): CartItem[] {
  return cart.items.filter(item => item.isAvailable && !item.hasStockIssue);
}

/**
 * Merge de dos carritos (útil al hacer login)
 * Combina items y mantiene el más reciente de cada producto/variante
 */
export function mergeCarts(localCart: Cart, remoteCart: Cart): Cart {
  const mergedItems = [...remoteCart.items];
  
  // Agregar items del carrito local que no estén en el remoto
  localCart.items.forEach(localItem => {
    const existsInRemote = remoteCart.items.some(
      remoteItem =>
        remoteItem.productId === localItem.productId &&
        remoteItem.variantId === localItem.variantId
    );
    
    if (!existsInRemote) {
      mergedItems.push(localItem);
    }
  });
  
  // Usar el cupón del carrito remoto si existe, sino el del local
  const appliedCoupon = remoteCart.appliedCoupon || localCart.appliedCoupon;
  
  return recalculateCart({
    ...remoteCart,
    items: mergedItems,
    appliedCoupon,
    updatedAt: new Date(),
    lastActivityAt: new Date(),
  });
}

/**
 * Verifica si un producto/variante está en el carrito
 */
export function isInCart(cart: Cart, productId: string, variantId: string): boolean {
  return cart.items.some(
    item => item.productId === productId && item.variantId === variantId
  );
}

/**
 * Obtiene un item del carrito por producto y variante
 */
export function getCartItem(
  cart: Cart,
  productId: string,
  variantId: string
): CartItem | null {
  return (
    cart.items.find(
      item => item.productId === productId && item.variantId === variantId
    ) || null
  );
}

/**
 * Obtiene la cantidad de un producto en el carrito
 */
export function getItemQuantity(
  cart: Cart,
  productId: string,
  variantId: string
): number {
  const item = getCartItem(cart, productId, variantId);
  return item ? item.quantity : 0;
}

/**
 * Calcula el ahorro total (descuentos)
 */
export function getTotalSavings(cart: Cart): number {
  return cart.totals.totalDiscount;
}

/**
 * Obtiene el porcentaje de ahorro
 */
export function getSavingsPercentage(cart: Cart): number {
  if (cart.totals.subtotal === 0) return 0;
  return Math.round((cart.totals.totalDiscount / cart.totals.subtotal) * 100);
}

/**
 * Verifica si califica para envío gratis (ejemplo: >$500)
 */
export function qualifiesForFreeShipping(
  cart: Cart,
  freeShippingThreshold = 500
): boolean {
  return cart.totals.subtotal >= freeShippingThreshold;
}

/**
 * Calcula cuánto falta para envío gratis
 */
export function amountUntilFreeShipping(
  cart: Cart,
  freeShippingThreshold = 500
): number {
  if (qualifiesForFreeShipping(cart, freeShippingThreshold)) {
    return 0;
  }
  return freeShippingThreshold - cart.totals.subtotal;
}
