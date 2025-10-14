// ==========================================================
// COUPON ENTITY
// ==========================================================
// src/app/features/checkout/domain/entities/coupon.entity.ts

/**
 * Tipo de descuento
 */
export type CouponType = 'PERCENTAGE' | 'FIXED';

/**
 * Entidad Coupon del dominio
 * Representa un cupón de descuento
 */
export interface Coupon {
    id: string;
    code: string;
    type: CouponType;
    discount: number;         // 0.1 para 10% o 100 para $100
    minPurchase?: number;
    maxDiscount?: number;     // Para cupones de porcentaje
    usageLimit?: number;
    usageCount: number;
    isActive: boolean;
    validFrom: Date;
    validUntil?: Date;
    createdAt: Date;
    updatedAt: Date;
}