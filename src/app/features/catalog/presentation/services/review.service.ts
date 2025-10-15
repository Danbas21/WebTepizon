// ============================================================================
// REVIEW SERVICE - TEPIZON PLATFORM
// ============================================================================
// Servicio para gestión de reviews y ratings de productos
// ============================================================================

import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

/**
 * Review de producto
 */
export interface ProductReview {
  id: string;
  productId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  
  // Rating y comentario
  rating: number; // 1-5
  title?: string;
  comment: string;
  
  // Verificación
  verified: boolean; // Usuario verificó compra
  
  // Imágenes adjuntas
  images?: string[];
  
  // Interacciones
  helpful: number;
  notHelpful: number;
  
  // Respuesta del vendedor
  response?: {
    text: string;
    date: Date;
  };
  
  // Moderación
  status: 'pending' | 'approved' | 'rejected';
  moderatedBy?: string;
  moderatedAt?: Date;
  
  // Fechas
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Estadísticas de reviews
 */
export interface ReviewStats {
  averageRating: number;
  totalReviews: number;
  ratingDistribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
  verifiedPurchases: number;
  withImages: number;
}

/**
 * Parámetros para obtener reviews
 */
export interface GetReviewsParams {
  productId: string;
  sortBy?: 'recent' | 'helpful' | 'rating-high' | 'rating-low';
  filterByRating?: number;
  verified?: boolean;
  page?: number;
  limit?: number;
}

/**
 * Respuesta paginada de reviews
 */
export interface ReviewsResponse {
  reviews: ProductReview[];
  stats: ReviewStats;
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * Servicio de Reviews
 * 
 * Características:
 * - Gestión de reviews de productos
 * - Rating y comentarios
 * - Helpful voting
 * - Estadísticas de reviews
 * - Filtrado y ordenamiento
 * - Verificación de compra
 * 
 * @example
 * ```typescript
 * constructor(private reviewService: ReviewService) {
 *   this.reviewService.getReviews({ productId: 'prod-123' });
 * }
 * ```
 */
@Injectable({
  providedIn: 'root'
})
export class ReviewService {
  // ========================================================================
  // DEPENDENCIES
  // ========================================================================
  
  private readonly http = inject(HttpClient);
  private readonly API_URL = '/api/reviews';
  
  // ========================================================================
  // SIGNALS - ESTADO
  // ========================================================================
  
  /** Reviews actuales */
  private readonly currentReviews = signal<ProductReview[]>([]);
  
  /** Estadísticas actuales */
  private readonly currentStats = signal<ReviewStats | null>(null);
  
  /** Estado de carga */
  private readonly isLoadingSignal = signal(false);
  
  /** Estado de envío de review */
  private readonly isSubmittingSignal = signal(false);
  
  /** Caché de reviews por producto */
  private readonly reviewsCache = signal<Map<string, ProductReview[]>>(new Map());
  
  /** Caché de stats por producto */
  private readonly statsCache = signal<Map<string, ReviewStats>>(new Map());
  
  // ========================================================================
  // SIGNALS PÚBLICOS (READONLY)
  // ========================================================================
  
  /** Reviews actuales (readonly) */
  readonly reviews = this.currentReviews.asReadonly();
  
  /** Estadísticas actuales (readonly) */
  readonly stats = this.currentStats.asReadonly();
  
  /** Estado de carga (readonly) */
  readonly isLoading = this.isLoadingSignal.asReadonly();
  
  /** Estado de envío (readonly) */
  readonly isSubmitting = this.isSubmittingSignal.asReadonly();
  
  // ========================================================================
  // COMPUTED SIGNALS
  // ========================================================================
  
  /**
   * Reviews verificadas
   */
  readonly verifiedReviews = computed(() => 
    this.currentReviews().filter(r => r.verified)
  );
  
  /**
   * Reviews con imágenes
   */
  readonly reviewsWithImages = computed(() => 
    this.currentReviews().filter(r => r.images && r.images.length > 0)
  );
  
  /**
   * Reviews más útiles (top 5)
   */
  readonly mostHelpfulReviews = computed(() => 
    [...this.currentReviews()]
      .sort((a, b) => b.helpful - a.helpful)
      .slice(0, 5)
  );
  
  // ========================================================================
  // MÉTODOS PÚBLICOS - OBTENER REVIEWS
  // ========================================================================
  
  /**
   * Obtener reviews de un producto
   */
  async getReviews(params: GetReviewsParams): Promise<ReviewsResponse> {
    this.isLoadingSignal.set(true);
    
    try {
      // Construir query params
      let httpParams = new HttpParams()
        .set('productId', params.productId);
      
      if (params.sortBy) {
        httpParams = httpParams.set('sortBy', params.sortBy);
      }
      
      if (params.filterByRating) {
        httpParams = httpParams.set('rating', params.filterByRating.toString());
      }
      
      if (params.verified !== undefined) {
        httpParams = httpParams.set('verified', params.verified.toString());
      }
      
      if (params.page) {
        httpParams = httpParams.set('page', params.page.toString());
      }
      
      if (params.limit) {
        httpParams = httpParams.set('limit', params.limit.toString());
      }
      
      // TODO: Llamar al backend real
      // const response = await firstValueFrom(
      //   this.http.get<ReviewsResponse>(this.API_URL, { params: httpParams })
      // );
      
      // Simulación
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const mockReviews = this.generateMockReviews(params.productId, params.limit || 10);
      const mockStats = this.generateMockStats();
      
      const response: ReviewsResponse = {
        reviews: mockReviews,
        stats: mockStats,
        total: mockStats.totalReviews,
        page: params.page || 1,
        limit: params.limit || 10,
        totalPages: Math.ceil(mockStats.totalReviews / (params.limit || 10))
      };
      
      // Actualizar signals
      this.currentReviews.set(response.reviews);
      this.currentStats.set(response.stats);
      
      // Actualizar caché
      this.reviewsCache.update(cache => {
        const newCache = new Map(cache);
        newCache.set(params.productId, response.reviews);
        return newCache;
      });
      
      this.statsCache.update(cache => {
        const newCache = new Map(cache);
        newCache.set(params.productId, response.stats);
        return newCache;
      });
      
      return response;
      
    } catch (error) {
      console.error('Error al obtener reviews:', error);
      throw error;
    } finally {
      this.isLoadingSignal.set(false);
    }
  }
  
  /**
   * Obtener estadísticas de reviews de un producto
   */
  async getReviewStats(productId: string): Promise<ReviewStats> {
    // Intentar obtener del caché
    const cached = this.statsCache().get(productId);
    if (cached) {
      return cached;
    }
    
    try {
      // TODO: Llamar al backend real
      // const stats = await firstValueFrom(
      //   this.http.get<ReviewStats>(`${this.API_URL}/stats/${productId}`)
      // );
      
      // Simulación
      await new Promise(resolve => setTimeout(resolve, 300));
      const stats = this.generateMockStats();
      
      // Actualizar caché
      this.statsCache.update(cache => {
        const newCache = new Map(cache);
        newCache.set(productId, stats);
        return newCache;
      });
      
      return stats;
      
    } catch (error) {
      console.error('Error al obtener estadísticas:', error);
      throw error;
    }
  }
  
  // ========================================================================
  // MÉTODOS PÚBLICOS - CREAR/EDITAR REVIEW
  // ========================================================================
  
  /**
   * Crear nueva review
   */
  async createReview(data: {
    productId: string;
    rating: number;
    title?: string;
    comment: string;
    images?: File[];
  }): Promise<ProductReview> {
    this.isSubmittingSignal.set(true);
    
    try {
      // TODO: Subir imágenes si existen
      // const imageUrls = await this.uploadImages(data.images);
      
      // TODO: Crear review en backend
      // const review = await firstValueFrom(
      //   this.http.post<ProductReview>(this.API_URL, {
      //     ...data,
      //     images: imageUrls
      //   })
      // );
      
      // Simulación
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockReview: ProductReview = {
        id: `review-${Date.now()}`,
        productId: data.productId,
        userId: 'current-user-id',
        userName: 'Usuario Actual',
        rating: data.rating,
        title: data.title,
        comment: data.comment,
        verified: false,
        helpful: 0,
        notHelpful: 0,
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      // Actualizar reviews locales
      this.currentReviews.update(reviews => [mockReview, ...reviews]);
      
      // Invalidar caché
      this.reviewsCache.update(cache => {
        const newCache = new Map(cache);
        newCache.delete(data.productId);
        return newCache;
      });
      
      this.statsCache.update(cache => {
        const newCache = new Map(cache);
        newCache.delete(data.productId);
        return newCache;
      });
      
      return mockReview;
      
    } catch (error) {
      console.error('Error al crear review:', error);
      throw error;
    } finally {
      this.isSubmittingSignal.set(false);
    }
  }
  
  /**
   * Editar review existente
   */
  async updateReview(
    reviewId: string,
    data: Partial<Pick<ProductReview, 'rating' | 'title' | 'comment'>>
  ): Promise<ProductReview> {
    try {
      // TODO: Actualizar en backend
      // const updated = await firstValueFrom(
      //   this.http.patch<ProductReview>(`${this.API_URL}/${reviewId}`, data)
      // );
      
      // Simulación
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Actualizar review local
      this.currentReviews.update(reviews =>
        reviews.map(r => 
          r.id === reviewId
            ? { ...r, ...data, updatedAt: new Date() }
            : r
        )
      );
      
      const updated = this.currentReviews().find(r => r.id === reviewId)!;
      return updated;
      
    } catch (error) {
      console.error('Error al actualizar review:', error);
      throw error;
    }
  }
  
  /**
   * Eliminar review
   */
  async deleteReview(reviewId: string): Promise<void> {
    try {
      // TODO: Eliminar en backend
      // await firstValueFrom(
      //   this.http.delete(`${this.API_URL}/${reviewId}`)
      // );
      
      // Simulación
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Remover de reviews locales
      this.currentReviews.update(reviews =>
        reviews.filter(r => r.id !== reviewId)
      );
      
    } catch (error) {
      console.error('Error al eliminar review:', error);
      throw error;
    }
  }
  
  // ========================================================================
  // MÉTODOS PÚBLICOS - INTERACCIONES
  // ========================================================================
  
  /**
   * Marcar review como útil
   */
  async markHelpful(reviewId: string): Promise<void> {
    try {
      // TODO: Actualizar en backend
      // await firstValueFrom(
      //   this.http.post(`${this.API_URL}/${reviewId}/helpful`, {})
      // );
      
      // Actualizar localmente
      this.currentReviews.update(reviews =>
        reviews.map(r =>
          r.id === reviewId
            ? { ...r, helpful: r.helpful + 1 }
            : r
        )
      );
      
    } catch (error) {
      console.error('Error al marcar como útil:', error);
      throw error;
    }
  }
  
  /**
   * Marcar review como no útil
   */
  async markNotHelpful(reviewId: string): Promise<void> {
    try {
      // TODO: Actualizar en backend
      // await firstValueFrom(
      //   this.http.post(`${this.API_URL}/${reviewId}/not-helpful`, {})
      // );
      
      // Actualizar localmente
      this.currentReviews.update(reviews =>
        reviews.map(r =>
          r.id === reviewId
            ? { ...r, notHelpful: r.notHelpful + 1 }
            : r
        )
      );
      
    } catch (error) {
      console.error('Error al marcar como no útil:', error);
      throw error;
    }
  }
  
  /**
   * Reportar review
   */
  async reportReview(reviewId: string, reason: string): Promise<void> {
    try {
      // TODO: Enviar reporte al backend
      // await firstValueFrom(
      //   this.http.post(`${this.API_URL}/${reviewId}/report`, { reason })
      // );
      
      console.log('Review reportada:', reviewId, reason);
      
    } catch (error) {
      console.error('Error al reportar review:', error);
      throw error;
    }
  }
  
  // ========================================================================
  // MÉTODOS PÚBLICOS - UTILIDADES
  // ========================================================================
  
  /**
   * Verificar si el usuario puede dejar review
   */
  async canUserReview(productId: string): Promise<boolean> {
    try {
      // TODO: Verificar en backend
      // - Usuario ha comprado el producto
      // - No tiene review pendiente/aprobada
      
      // Simulación
      return true;
      
    } catch (error) {
      console.error('Error al verificar permiso de review:', error);
      return false;
    }
  }
  
  /**
   * Obtener review del usuario para un producto
   */
  async getUserReview(productId: string): Promise<ProductReview | null> {
    try {
      // TODO: Obtener del backend
      // const review = await firstValueFrom(
      //   this.http.get<ProductReview>(`${this.API_URL}/user/${productId}`)
      // );
      
      // Simulación
      return null;
      
    } catch (error) {
      console.error('Error al obtener review del usuario:', error);
      return null;
    }
  }
  
  /**
   * Limpiar caché
   */
  clearCache(): void {
    this.reviewsCache.set(new Map());
    this.statsCache.set(new Map());
    this.currentReviews.set([]);
    this.currentStats.set(null);
  }
  
  // ========================================================================
  // MÉTODOS PRIVADOS - MOCK DATA
  // ========================================================================
  
  /**
   * Generar reviews mock
   */
  private generateMockReviews(productId: string, count: number): ProductReview[] {
    const names = ['Juan Pérez', 'María García', 'Carlos López', 'Ana Martínez', 'Luis Rodríguez'];
    const comments = [
      'Excelente producto, superó mis expectativas.',
      'Muy buena calidad, lo recomiendo.',
      'Justo lo que esperaba, muy contento con la compra.',
      'Buen producto, aunque tardó un poco en llegar.',
      'Muy satisfecho, volvería a comprar.'
    ];
    
    return Array.from({ length: count }, (_, i) => ({
      id: `review-${productId}-${i}`,
      productId,
      userId: `user-${i}`,
      userName: names[i % names.length],
      rating: Math.floor(Math.random() * 2) + 4,
      comment: comments[i % comments.length],
      verified: Math.random() > 0.3,
      helpful: Math.floor(Math.random() * 50),
      notHelpful: Math.floor(Math.random() * 10),
      images: Math.random() > 0.7 ? ['/assets/images/review-1.jpg'] : undefined,
      status: 'approved' as const,
      createdAt: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000),
      updatedAt: new Date()
    }));
  }
  
  /**
   * Generar estadísticas mock
   */
  private generateMockStats(): ReviewStats {
    return {
      averageRating: 4.5,
      totalReviews: 127,
      ratingDistribution: {
        1: 2,
        2: 5,
        3: 15,
        4: 45,
        5: 60
      },
      verifiedPurchases: 98,
      withImages: 23
    };
  }
}
