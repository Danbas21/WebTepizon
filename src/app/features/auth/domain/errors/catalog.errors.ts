// ==========================================================
// CATALOG ERRORS
// ==========================================================
// src/app/features/catalog/domain/errors/catalog.errors.ts

/**
 * Error base para el dominio de catálogo
 */
export class CatalogError extends Error {
    constructor(
        public readonly code: string,
        message: string,
        public readonly originalError?: any
    ) {
        super(message);
        this.name = 'CatalogError';

        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, CatalogError);
        }
    }
}

/**
 * Errores específicos de catálogo
 */
export class ProductNotFoundError extends CatalogError {
    constructor(productId: string) {
        super('PRODUCT_NOT_FOUND', `Producto con ID ${productId} no encontrado`);
        this.name = 'ProductNotFoundError';
    }
}

export class CategoryNotFoundError extends CatalogError {
    constructor(categoryId: string) {
        super('CATEGORY_NOT_FOUND', `Categoría con ID ${categoryId} no encontrada`);
        this.name = 'CategoryNotFoundError';
    }
}

export class OutOfStockError extends CatalogError {
    constructor(productName: string) {
        super('OUT_OF_STOCK', `El producto "${productName}" está agotado`);
        this.name = 'OutOfStockError';
    }
}

export class InvalidPriceError extends CatalogError {
    constructor(message = 'Precio inválido') {
        super('INVALID_PRICE', message);
        this.name = 'InvalidPriceError';
    }
}