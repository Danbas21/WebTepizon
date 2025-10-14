/**
 * Get Product Detail Use Case
 * 
 * Orquesta el flujo de consulta de detalle de un producto.
 * Incluye tracking de analytics y productos relacionados.
 * 
 * @pattern Use Case (Clean Architecture)
 */

import { Injectable, inject } from '@angular/core';
import { CatalogRepositoryPort } from '../../domain/ports/catalog.repository.port';
import { Product, isProductAvailable } from '../../domain/models/product.model';

export interface GetProductDetailUseCaseInput {
  productId?: string;
  slug?: string;
  trackView?: boolean;
  userId?: string;
  includeRelated?: boolean;
}

export interface GetProductDetailUseCaseOutput {
  success: boolean;
  product?: Product;
  relatedProducts?: Product[];
  error?: string;
}

/**
 * Use Case para obtener detalle de producto
 * 
 * Flujo:
 * 1. Obtener producto por ID o slug
 * 2. Verificar disponibilidad
 * 3. Registrar vista (analytics)
 * 4. Obtener productos relacionados
 * 5. Retornar resultado
 */
@Injectable({
  providedIn: 'root',
})
export class GetProductDetailUseCase {
  private readonly repository = inject(CatalogRepositoryPort);

  /**
   * Ejecuta el caso de uso
   */
  async execute(input: GetProductDetailUseCaseInput): Promise<GetProductDetailUseCaseOutput> {
    try {
      // 1. Validar que se proporcione ID o slug
      if (!input.productId && !input.slug) {
        return {
          success: false,
          error: 'Se requiere ID o slug del producto',
        };
      }

      // 2. Obtener producto
      let product: Product | null = null;

      if (input.productId) {
        product = await this.repository.getProductById(input.productId);
      } else if (input.slug) {
        product = await this.repository.getProductBySlug(input.slug);
      }

      if (!product) {
        return {
          success: false,
          error: 'Producto no encontrado',
        };
      }

      // 3. Verificar si está activo
      if (!isProductAvailable(product)) {
        return {
          success: false,
          error: 'Producto no disponible actualmente',
        };
      }

      // 4. Registrar vista (opcional)
      if (input.trackView !== false) {
        // No esperar respuesta para no bloquear
        this.repository.trackProductView(product.id, input.userId).catch(err => {
          console.error('Error registrando vista:', err);
        });
      }

      // 5. Obtener productos relacionados (opcional)
      let relatedProducts: Product[] = [];
      if (input.includeRelated !== false) {
        try {
          relatedProducts = await this.repository.getRelatedProducts(product.id, 4);
        } catch (error) {
          console.error('Error obteniendo productos relacionados:', error);
          // No fallar si no se pueden obtener relacionados
        }
      }

      // 6. Retornar resultado
      return {
        success: true,
        product,
        relatedProducts,
      };
    } catch (error) {
      console.error('Error en GetProductDetailUseCase:', error);
      return {
        success: false,
        error: 'Error al obtener el producto. Intenta de nuevo',
      };
    }
  }

  /**
   * Obtiene solo el producto sin analytics ni relacionados
   */
  async getProductQuick(productId: string): Promise<Product | null> {
    try {
      return await this.repository.getProductById(productId);
    } catch (error) {
      console.error('Error en getProductQuick:', error);
      return null;
    }
  }

  /**
   * Registra un click en producto (desde lista)
   */
  async trackClick(productId: string, userId?: string): Promise<void> {
    try {
      await this.repository.trackProductClick(productId, userId);
    } catch (error) {
      console.error('Error registrando click:', error);
    }
  }

  /**
   * Registra tiempo en página de producto
   */
  async trackTimeOnPage(
    productId: string,
    timeInSeconds: number,
    userId?: string
  ): Promise<void> {
    try {
      // Solo registrar si el tiempo es razonable (> 3 segundos y < 1 hora)
      if (timeInSeconds < 3 || timeInSeconds > 3600) {
        return;
      }

      await this.repository.trackProductTimeOnPage(productId, timeInSeconds, userId);
    } catch (error) {
      console.error('Error registrando tiempo:', error);
    }
  }
}
