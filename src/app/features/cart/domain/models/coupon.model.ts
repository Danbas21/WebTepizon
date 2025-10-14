/**
 * Coupon Domain Model
 * 
 * Representa un cupón de descuento aplicable al carrito.
 * Incluye validaciones, tipos de descuento y restricciones.
 * 
 * @domain Cart
 */

export enum CouponType {
  PERCENTAGE = 'PERCENTAGE', // Descuento porcentual (ej: 10%)
  FIXED = 'FIXED', // Descuento fijo (ej: $50)
  FREE_SHIPPING = 'FREE_SHIPPING', // Envío gratis
}

export enum CouponStatus {
  ACTIVE = 'ACTIVE',
  EXPIRED = 'EXPIRED',
  EXHAUSTED = 'EXHAUSTED', // Usos agotados
  INACTIVE = 'INACTIVE',
}

export interface CouponRestrictions {
  minPurchaseAmount?: number; // Monto mínimo de compra
  maxDiscountAmount?: number; // Descuento máximo (para porcentuales)
  categoryIds?: string[]; // Solo para categorías específicas
  productIds?: string[]; // Solo para productos específicos
  firstPurchaseOnly?: boolean; // Solo primera compra
  userIds?: string[]; // Solo para usuarios específicos
}

export interface Coupon {
  id: string;
  code: string; // Código del cupón (ej: "SAVE10")
  name: string; // Nombre descriptivo
  description?: string;
  
  // Tipo de descuento
  type: CouponType;
  value: number; // Valor del descuento (10 = 10% o $10 según type)
  
  // Status
  status: CouponStatus;
  isActive: boolean;
  
  // Restricciones
  restrictions: CouponRestrictions;
  
  // Límites de uso
  maxUses?: number; // Máximo de usos totales
  usedCount: number; // Veces que se ha usado
  maxUsesPerUser?: number; // Máximo de usos por usuario
  
  // Vigencia
  validFrom: Date;
  validUntil: Date;
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Factory para crear un cupón con valores por defecto
 */
export function createCoupon(partial: Partial<Coupon>): Coupon {
  const now = new Date();
  
  return {
    id: partial.id || '',
    code: partial.code || '',
    name: partial.name || '',
    description: partial.description,
    type: partial.type || CouponType.PERCENTAGE,
    value: partial.value || 0,
    status: partial.status || CouponStatus.ACTIVE,
    isActive: partial.isActive !== undefined ? partial.isActive : true,
    restrictions: partial.restrictions || {},
    maxUses: partial.maxUses,
    usedCount: partial.usedCount || 0,
    maxUsesPerUser: partial.maxUsesPerUser,
    validFrom: partial.validFrom || now,
    validUntil: partial.validUntil || new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000), // 30 días
    createdAt: partial.createdAt || now,
    updatedAt: partial.updatedAt || now,
  };
}

/**
 * Valida si un cupón está activo y vigente
 */
export function isCouponValid(coupon: Coupon): boolean {
  const now = new Date();
  
  return (
    coupon.isActive &&
    coupon.status === CouponStatus.ACTIVE &&
    coupon.validFrom <= now &&
    coupon.validUntil >= now &&
    (!coupon.maxUses || coupon.usedCount < coupon.maxUses)
  );
}

/**
 * Valida si un cupón está expirado
 */
export function isCouponExpired(coupon: Coupon): boolean {
  return new Date() > coupon.validUntil;
}

/**
 * Valida si un cupón ha agotado sus usos
 */
export function isCouponExhausted(coupon: Coupon): boolean {
  return !!(coupon.maxUses && coupon.usedCount >= coupon.maxUses);
}

/**
 * Valida si un usuario puede usar el cupón
 */
export function canUserUseCoupon(
  coupon: Coupon,
  userId: string,
  userUsageCount: number
): boolean {
  // Verificar si hay restricción de usuarios
  if (coupon.restrictions.userIds?.length) {
    if (!coupon.restrictions.userIds.includes(userId)) {
      return false;
    }
  }
  
  // Verificar límite de usos por usuario
  if (coupon.maxUsesPerUser && userUsageCount >= coupon.maxUsesPerUser) {
    return false;
  }
  
  return true;
}

/**
 * Valida si el cupón aplica para un monto de compra
 */
export function meetsMinimumAmount(coupon: Coupon, subtotal: number): boolean {
  if (!coupon.restrictions.minPurchaseAmount) return true;
  return subtotal >= coupon.restrictions.minPurchaseAmount;
}

/**
 * Calcula el descuento de un cupón
 */
export function calculateCouponDiscount(
  coupon: Coupon,
  subtotal: number
): number {
  let discount = 0;
  
  switch (coupon.type) {
    case CouponType.PERCENTAGE:
      discount = (subtotal * coupon.value) / 100;
      
      // Aplicar límite máximo si existe
      if (coupon.restrictions.maxDiscountAmount) {
        discount = Math.min(discount, coupon.restrictions.maxDiscountAmount);
      }
      break;
      
    case CouponType.FIXED:
      discount = coupon.value;
      // No puede ser mayor al subtotal
      discount = Math.min(discount, subtotal);
      break;
      
    case CouponType.FREE_SHIPPING:
      // El descuento se aplica en el shipping, aquí retornamos 0
      discount = 0;
      break;
  }
  
  return Math.max(0, discount);
}

/**
 * Obtiene el mensaje de error de validación de un cupón
 */
export function getCouponValidationError(
  coupon: Coupon,
  subtotal: number,
  userId?: string,
  userUsageCount = 0
): string | null {
  if (!isCouponValid(coupon)) {
    if (isCouponExpired(coupon)) {
      return 'Este cupón ha expirado';
    }
    if (isCouponExhausted(coupon)) {
      return 'Este cupón ha alcanzado su límite de usos';
    }
    return 'Este cupón no está activo';
  }
  
  if (!meetsMinimumAmount(coupon, subtotal)) {
    return `Compra mínima requerida: $${coupon.restrictions.minPurchaseAmount}`;
  }
  
  if (userId && !canUserUseCoupon(coupon, userId, userUsageCount)) {
    if (coupon.restrictions.userIds?.length && !coupon.restrictions.userIds.includes(userId)) {
      return 'Este cupón no está disponible para tu cuenta';
    }
    if (coupon.maxUsesPerUser && userUsageCount >= coupon.maxUsesPerUser) {
      return 'Ya has usado este cupón el máximo de veces permitido';
    }
  }
  
  return null;
}

/**
 * Formatea el valor del cupón para display
 */
export function formatCouponValue(coupon: Coupon): string {
  switch (coupon.type) {
    case CouponType.PERCENTAGE:
      return `${coupon.value}% de descuento`;
      
    case CouponType.FIXED:
      return `$${coupon.value} de descuento`;
      
    case CouponType.FREE_SHIPPING:
      return 'Envío gratis';
      
    default:
      return '';
  }
}

/**
 * Normaliza el código del cupón (uppercase, sin espacios)
 */
export function normalizeCouponCode(code: string): string {
  return code.toUpperCase().trim();
}

/**
 * Verifica si un cupón aplica a envío gratis
 */
export function isFreeShippingCoupon(coupon: Coupon): boolean {
  return coupon.type === CouponType.FREE_SHIPPING;
}

/**
 * Obtiene los días restantes de validez
 */
export function getDaysUntilExpiration(coupon: Coupon): number {
  const now = new Date();
  const diff = coupon.validUntil.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

/**
 * Verifica si el cupón está por expirar (menos de 7 días)
 */
export function isExpiringPoon(coupon: Coupon): boolean {
  const daysLeft = getDaysUntilExpiration(coupon);
  return daysLeft > 0 && daysLeft <= 7;
}
