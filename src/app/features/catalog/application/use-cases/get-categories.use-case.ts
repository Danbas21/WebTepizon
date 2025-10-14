/**
 * Get Categories Use Case
 * 
 * Orquesta el flujo de consulta de categorías.
 * Incluye árbol jerárquico y breadcrumbs.
 * 
 * @pattern Use Case (Clean Architecture)
 */

import { Injectable, inject } from '@angular/core';
import { CatalogRepositoryPort } from '../../domain/ports/catalog.repository.port';
import { Category, CategoryWithChildren } from '../../domain/models/category.model';

export interface GetCategoriesUseCaseOutput {
  success: boolean;
  categories?: Category[];
  tree?: CategoryWithChildren[];
  error?: string;
}

export interface GetCategoryDetailUseCaseInput {
  categoryId?: string;
  slug?: string;
  includePath?: boolean;
  includeChildren?: boolean;
}

export interface GetCategoryDetailUseCaseOutput {
  success: boolean;
  category?: Category;
  path?: Category[];
  children?: Category[];
  error?: string;
}

/**
 * Use Case para obtener categorías
 * 
 * Flujo:
 * 1. Obtener categorías del repositorio
 * 2. Construir árbol jerárquico
 * 3. Retornar resultados
 */
@Injectable({
  providedIn: 'root',
})
export class GetCategoriesUseCase {
  private readonly repository = inject(CatalogRepositoryPort);

  /**
   * Obtiene todas las categorías como lista plana
   */
  async execute(includeInactive = false): Promise<GetCategoriesUseCaseOutput> {
    try {
      const categories = await this.repository.getCategories(includeInactive);

      return {
        success: true,
        categories,
      };
    } catch (error) {
      console.error('Error en GetCategoriesUseCase:', error);
      return {
        success: false,
        error: 'Error al obtener categorías. Intenta de nuevo',
      };
    }
  }

  /**
   * Obtiene el árbol jerárquico de categorías
   */
  async getCategoryTree(): Promise<GetCategoriesUseCaseOutput> {
    try {
      const tree = await this.repository.getCategoryTree();

      return {
        success: true,
        tree,
      };
    } catch (error) {
      console.error('Error en getCategoryTree:', error);
      return {
        success: false,
        error: 'Error al obtener árbol de categorías. Intenta de nuevo',
      };
    }
  }

  /**
   * Obtiene solo categorías raíz
   */
  async getRootCategories(): Promise<GetCategoriesUseCaseOutput> {
    try {
      const categories = await this.repository.getCategories();
      const rootCategories = categories.filter(cat => cat.parentId === null);

      return {
        success: true,
        categories: rootCategories,
      };
    } catch (error) {
      console.error('Error en getRootCategories:', error);
      return {
        success: false,
        error: 'Error al obtener categorías principales',
      };
    }
  }

  /**
   * Obtiene subcategorías de una categoría
   */
  async getSubcategories(parentId: string): Promise<GetCategoriesUseCaseOutput> {
    try {
      const categories = await this.repository.getSubcategories(parentId);

      return {
        success: true,
        categories,
      };
    } catch (error) {
      console.error('Error en getSubcategories:', error);
      return {
        success: false,
        error: 'Error al obtener subcategorías',
      };
    }
  }

  /**
   * Obtiene detalle de una categoría
   */
  async getCategoryDetail(
    input: GetCategoryDetailUseCaseInput
  ): Promise<GetCategoryDetailUseCaseOutput> {
    try {
      // 1. Validar entrada
      if (!input.categoryId && !input.slug) {
        return {
          success: false,
          error: 'Se requiere ID o slug de la categoría',
        };
      }

      // 2. Obtener categoría
      let category: Category | null = null;

      if (input.categoryId) {
        category = await this.repository.getCategoryById(input.categoryId);
      } else if (input.slug) {
        category = await this.repository.getCategoryBySlug(input.slug);
      }

      if (!category) {
        return {
          success: false,
          error: 'Categoría no encontrada',
        };
      }

      // 3. Obtener path (breadcrumb) si se solicita
      let path: Category[] = [];
      if (input.includePath !== false) {
        try {
          path = await this.repository.getCategoryPath(category.id);
        } catch (error) {
          console.error('Error obteniendo path:', error);
        }
      }

      // 4. Obtener subcategorías si se solicita
      let children: Category[] = [];
      if (input.includeChildren !== false) {
        try {
          children = await this.repository.getSubcategories(category.id);
        } catch (error) {
          console.error('Error obteniendo subcategorías:', error);
        }
      }

      // 5. Retornar resultado
      return {
        success: true,
        category,
        path,
        children,
      };
    } catch (error) {
      console.error('Error en getCategoryDetail:', error);
      return {
        success: false,
        error: 'Error al obtener la categoría',
      };
    }
  }

  /**
   * Obtiene categorías destacadas
   */
  async getFeaturedCategories(): Promise<GetCategoriesUseCaseOutput> {
    try {
      const categories = await this.repository.getCategories();
      const featured = categories.filter(cat => cat.isFeatured);

      return {
        success: true,
        categories: featured,
      };
    } catch (error) {
      console.error('Error en getFeaturedCategories:', error);
      return {
        success: false,
        error: 'Error al obtener categorías destacadas',
      };
    }
  }
}
