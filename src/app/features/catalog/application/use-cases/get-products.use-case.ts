/**
 * Get Products Use Case
 * 
 * Orquesta el flujo de consulta de productos con filtros y paginación.
 * Incluye validaciones y transformaciones.
 * 
 * @pattern Use Case (Clean Architecture)
 */

import { Injectable, inject } from '@angular/core';
import { CatalogRepositoryPort, GetProductsParams } from '../../domain/ports/catalog.repository.port';
import { CatalogDomainService } from '../../domain/services/catalog.domain.service';
import {
  ProductFilter,
  ProductSort,
  ProductQueryResult,
  ProductSortOption,
  createProductFilter,
  createProductSort,
} from '../../domain/models/product-filter.model';

export interface GetProductsUseCaseInput {
  filter?: ProductFilter;
  sort?: ProductSort;
  page?: number;
  pageSize?: number;
}

export interface GetProductsUseCaseOutput {
  success: boolean;
  data?: ProductQueryResult;
  error?: string;
}

/**
 * Use Case para obtener productos
 * 
 * Flujo:
 * 1. Validar filtros
 * 2. Aplicar valores por defecto
 * 3. Ejecutar consulta
 * 4. Retornar resultados paginados
 */
@Injectable({
  providedIn: 'root',
})
export class GetProductsUseCase {
  private readonly repository = inject(CatalogRepositoryPort);
  private readonly domainService = inject(CatalogDomainService);

  /**
   * Ejecuta el caso de uso
   */
  async execute(input: GetProductsUseCaseInput = {}): Promise<GetProductsUseCaseOutput> {
    try {
      // 1. Valores por defecto
      const filter = input.filter || createProductFilter();
      const sort = input.sort || createProductSort(ProductSortOption.NEWEST);
      const page = input.page || 1;
      const pageSize = input.pageSize || 20;

      // 2. Validar filtros
      const validation = this.domainService.validateFilter(filter);
      if (!validation.isValid) {
        return {
          success: false,
          error: validation.errors.join(', '),
        };
      }

      // 3. Ejecutar consulta
      const params: GetProductsParams = {
        filter,
        sort,
        page,
        pageSize,
      };

      const result = await this.repository.getProducts(params);

      // 4. Retornar éxito
      return {
        success: true,
        data: result,
      };
    } catch (error) {
      console.error('Error en GetProductsUseCase:', error);
      return {
        success: false,
        error: 'Error al obtener productos. Intenta de nuevo',
      };
    }
  }

  /**
   * Obtiene solo productos activos y disponibles
   */
  async getAvailableProducts(input: GetProductsUseCaseInput = {}): Promise<GetProductsUseCaseOutput> {
    return this.execute({
      ...input,
      filter: {
        ...input.filter,
        inStock: true,
      },
    });
  }

  /**
   * Obtiene productos de una categoría específica
   */
  async getProductsByCategory(
    categoryId: string,
    input: GetProductsUseCaseInput = {}
  ): Promise<GetProductsUseCaseOutput> {
    return this.execute({
      ...input,
      filter: {
        ...input.filter,
        categoryIds: [categoryId],
      },
    });
  }

  /**
   * Obtiene productos con descuento
   */
  async getDiscountedProducts(input: GetProductsUseCaseInput = {}): Promise<GetProductsUseCaseOutput> {
    return this.execute({
      ...input,
      filter: {
        ...input.filter,
        onSale: true,
      },
      sort: input.sort || createProductSort(ProductSortOption.PRICE_LOW_HIGH),
    });
  }
}
