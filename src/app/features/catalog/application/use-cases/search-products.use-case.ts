/**
 * Search Products Use Case
 * 
 * Orquesta el flujo de búsqueda de productos por texto.
 * Incluye cálculo de relevancia y sugerencias.
 * 
 * @pattern Use Case (Clean Architecture)
 */

import { Injectable, inject } from '@angular/core';
import { CatalogRepositoryPort } from '../../domain/ports/catalog.repository.port';
import { CatalogDomainService } from '../../domain/services/catalog.domain.service';
import { Product } from '../../domain/models/product.model';

export interface SearchProductsUseCaseInput {
  query: string;
  limit?: number;
}

export interface SearchProductsUseCaseOutput {
  success: boolean;
  products?: Product[];
  suggestions?: string[];
  error?: string;
}

/**
 * Use Case para búsqueda de productos
 * 
 * Flujo:
 * 1. Validar query de búsqueda
 * 2. Ejecutar búsqueda en repositorio
 * 3. Calcular relevancia
 * 4. Generar sugerencias
 * 5. Ordenar por relevancia
 * 6. Retornar resultados
 */
@Injectable({
  providedIn: 'root',
})
export class SearchProductsUseCase {
  private readonly repository = inject(CatalogRepositoryPort);
  private readonly domainService = inject(CatalogDomainService);

  /**
   * Ejecuta la búsqueda de productos
   */
  async execute(input: SearchProductsUseCaseInput): Promise<SearchProductsUseCaseOutput> {
    try {
      // 1. Validar query
      if (!input.query || input.query.trim().length < 2) {
        return {
          success: false,
          error: 'La búsqueda debe tener al menos 2 caracteres',
        };
      }

      const query = input.query.trim();
      const limit = input.limit || 20;

      // 2. Ejecutar búsqueda
      const products = await this.repository.searchProducts(query, limit);

      // 3. Calcular relevancia y ordenar
      const productsWithRelevance = products.map(product => ({
        product,
        relevance: this.domainService.calculateSearchRelevance(product, query),
      }));

      // Ordenar por relevancia
      productsWithRelevance.sort((a, b) => b.relevance - a.relevance);

      const sortedProducts = productsWithRelevance.map(p => p.product);

      // 4. Generar sugerencias
      const suggestions = this.domainService.generateSearchSuggestions(
        sortedProducts,
        query,
        5
      );

      // 5. Retornar resultados
      return {
        success: true,
        products: sortedProducts,
        suggestions,
      };
    } catch (error) {
      console.error('Error en SearchProductsUseCase:', error);
      return {
        success: false,
        error: 'Error al buscar productos. Intenta de nuevo',
      };
    }
  }

  /**
   * Búsqueda rápida (autocomplete)
   * Retorna solo nombres de productos para sugerencias
   */
  async quickSearch(query: string): Promise<string[]> {
    if (!query || query.trim().length < 2) {
      return [];
    }

    try {
      const result = await this.execute({ query, limit: 5 });
      return result.suggestions || [];
    } catch (error) {
      console.error('Error en quickSearch:', error);
      return [];
    }
  }

  /**
   * Busca productos similares a una búsqueda
   */
  async searchSimilar(query: string, limit = 10): Promise<Product[]> {
    try {
      const result = await this.execute({ query, limit });
      return result.products || [];
    } catch (error) {
      console.error('Error en searchSimilar:', error);
      return [];
    }
  }
}
