// ==========================================================
// CATEGORY ENTITY
// ==========================================================
// src/app/features/catalog/domain/entities/category.entity.ts

/**
 * Entidad Category del dominio
 * Representa una categoría de productos
 */
export interface Category {
    id: string;
    name: string;
    slug: string;
    description?: string;
    image?: string;
    icon?: string;
    parentId?: string;
    order: number;
    isActive: boolean;
    productCount: number;
    createdAt: Date;
    updatedAt: Date;
}