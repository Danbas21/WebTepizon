/**
 * Firebase Catalog Adapter
 * 
 * Implementación del adaptador para Firebase Firestore.
 * Maneja la comunicación con Firestore y convierte los datos a modelos de dominio.
 * 
 * @pattern Adapter (Hexagonal Architecture)
 * @infrastructure Firebase
 */

import { Injectable, inject } from '@angular/core';
import {
  Firestore,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  QueryConstraint,
  DocumentSnapshot,
  onSnapshot,
  increment,
  updateDoc,
  Timestamp,
} from '@angular/fire/firestore';
import { Observable, from } from 'rxjs';
import { map } from 'rxjs/operators';

import { Product, ProductStatus, ProductVariant, createProduct } from '../../domain/models/product.model';
import { Category, CategoryWithChildren, createCategory, buildCategoryTree } from '../../domain/models/category.model';
import {
  ProductFilter,
  ProductSort,
  ProductSortOption,
  ProductQueryResult,
  createProductPagination,
} from '../../domain/models/product-filter.model';
import { GetProductsParams } from '../../domain/ports/catalog.repository.port';

/**
 * Adapter de Firebase para Catálogo
 * 
 * Responsabilidades:
 * - CRUD de productos
 * - CRUD de categorías
 * - Filtrado y búsqueda
 * - Paginación
 * - Stock en tiempo real
 * - Analytics
 */
@Injectable({
  providedIn: 'root',
})
export class FirebaseCatalogAdapter {
  private readonly firestore = inject(Firestore);

  // Colecciones
  private readonly productsCollection = collection(this.firestore, 'products');
  private readonly categoriesCollection = collection(this.firestore, 'categories');
  private readonly analyticsCollection = collection(this.firestore, 'analytics');

  // ==================== PRODUCTS ====================

  /**
   * Obtiene productos con filtros y paginación
   */
  async getProducts(params: GetProductsParams): Promise<ProductQueryResult> {
    const {
      filter = {},
      sort = { option: ProductSortOption.NEWEST, direction: 'asc' },
      page = 1,
      pageSize = 20,
    } = params;

    try {
      // Construir query constraints
      const constraints: QueryConstraint[] = [where('isActive', '==', true)];

      // Filtro de categoría
      if (filter.categoryIds?.length) {
        constraints.push(where('categoryId', 'in', filter.categoryIds));
      }

      // Filtro de marca
      if (filter.brands?.length) {
        constraints.push(where('brand', 'in', filter.brands));
      }

      // Filtro de stock
      if (filter.inStock) {
        constraints.push(where('isOutOfStock', '==', false));
      }

      // Filtro de descuento
      if (filter.onSale) {
        constraints.push(where('hasDiscount', '==', true));
      }

      // Filtro de destacados
      if (filter.isFeatured) {
        constraints.push(where('isFeatured', '==', true));
      }

      // Filtro de nuevos
      if (filter.isNew) {
        constraints.push(where('isNew', '==', true));
      }

      // Ordenamiento
      const orderField = this.getSortField(sort.option);
      if (orderField) {
        constraints.push(orderBy(orderField, sort.direction));
      }

      // Paginación
      constraints.push(limit(pageSize));

      // Ejecutar query
      const q = query(this.productsCollection, ...constraints);
      const snapshot = await getDocs(q);

      const products = snapshot.docs.map(doc => this.mapDocToProduct(doc));

      // Filtros adicionales (client-side)
      let filtered = products;

      // Filtro de precio (no disponible en Firestore con "in")
      if (filter.priceRange) {
        filtered = filtered.filter(
          p => p.minPrice >= filter.priceRange!.min && p.maxPrice <= filter.priceRange!.max
        );
      }

      // Filtro de rating
      if (filter.minRating) {
        filtered = filtered.filter(p => p.rating.average >= filter.minRating!);
      }

      // Búsqueda por texto (client-side)
      if (filter.searchQuery) {
        const query = filter.searchQuery.toLowerCase();
        filtered = filtered.filter(
          p =>
            p.name.toLowerCase().includes(query) ||
            p.description.toLowerCase().includes(query) ||
            p.brand.toLowerCase().includes(query)
        );
      }

      // Calcular paginación
      const totalItems = filtered.length; // En producción, usar count aggregation
      const pagination = createProductPagination(page, pageSize, totalItems);

      // Aplicar paginación
      const startIndex = (page - 1) * pageSize;
      const endIndex = startIndex + pageSize;
      const paginatedProducts = filtered.slice(startIndex, endIndex);

      return {
        products: paginatedProducts,
        pagination,
        appliedFilters: filter,
        availableFilters: {
          brands: [],
          sizes: [],
          colors: [],
          priceRange: { min: 0, max: 10000 },
          categories: [],
        },
      };
    } catch (error) {
      console.error('Error obteniendo productos:', error);
      throw error;
    }
  }

  /**
   * Obtiene un producto por ID
   */
  async getProductById(productId: string): Promise<Product | null> {
    try {
      const productDoc = doc(this.productsCollection, productId);
      const snapshot = await getDoc(productDoc);

      if (!snapshot.exists()) {
        return null;
      }

      return this.mapDocToProduct(snapshot);
    } catch (error) {
      console.error('Error obteniendo producto:', error);
      throw error;
    }
  }

  /**
   * Obtiene un producto por slug
   */
  async getProductBySlug(slug: string): Promise<Product | null> {
    try {
      const q = query(this.productsCollection, where('seo.slug', '==', slug), limit(1));
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        return null;
      }

      return this.mapDocToProduct(snapshot.docs[0]);
    } catch (error) {
      console.error('Error obteniendo producto por slug:', error);
      throw error;
    }
  }

  /**
   * Busca productos por texto
   */
  async searchProducts(searchQuery: string, searchLimit = 10): Promise<Product[]> {
    try {
      // Firestore no tiene búsqueda full-text nativa
      // Esto es una implementación simple. Para producción, usar Algolia o Elastic
      const q = query(
        this.productsCollection,
        where('isActive', '==', true),
        orderBy('name'),
        limit(searchLimit * 3) // Obtener más para filtrar client-side
      );

      const snapshot = await getDocs(q);
      const products = snapshot.docs.map(doc => this.mapDocToProduct(doc));

      // Filtrar por texto (client-side)
      const query = searchQuery.toLowerCase();
      return products
        .filter(
          p =>
            p.name.toLowerCase().includes(query) ||
            p.description.toLowerCase().includes(query) ||
            p.brand.toLowerCase().includes(query)
        )
        .slice(0, searchLimit);
    } catch (error) {
      console.error('Error buscando productos:', error);
      throw error;
    }
  }

  /**
   * Obtiene productos relacionados
   */
  async getRelatedProducts(productId: string, searchLimit = 4): Promise<Product[]> {
    try {
      const product = await this.getProductById(productId);
      if (!product) return [];

      const q = query(
        this.productsCollection,
        where('categoryId', '==', product.categoryId),
        where('isActive', '==', true),
        limit(searchLimit + 1)
      );

      const snapshot = await getDocs(q);
      const products = snapshot.docs
        .map(doc => this.mapDocToProduct(doc))
        .filter(p => p.id !== productId);

      return products.slice(0, searchLimit);
    } catch (error) {
      console.error('Error obteniendo productos relacionados:', error);
      throw error;
    }
  }

  /**
   * Obtiene productos destacados
   */
  async getFeaturedProducts(searchLimit = 8): Promise<Product[]> {
    try {
      const q = query(
        this.productsCollection,
        where('isFeatured', '==', true),
        where('isActive', '==', true),
        orderBy('createdAt', 'desc'),
        limit(searchLimit)
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => this.mapDocToProduct(doc));
    } catch (error) {
      console.error('Error obteniendo productos destacados:', error);
      throw error;
    }
  }

  /**
   * Obtiene productos nuevos
   */
  async getNewProducts(searchLimit = 8): Promise<Product[]> {
    try {
      const q = query(
        this.productsCollection,
        where('isNew', '==', true),
        where('isActive', '==', true),
        orderBy('createdAt', 'desc'),
        limit(searchLimit)
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => this.mapDocToProduct(doc));
    } catch (error) {
      console.error('Error obteniendo productos nuevos:', error);
      throw error;
    }
  }

  /**
   * Obtiene productos más vendidos
   */
  async getBestSellingProducts(searchLimit = 8): Promise<Product[]> {
    try {
      const q = query(
        this.productsCollection,
        where('isActive', '==', true),
        orderBy('analytics.purchases', 'desc'),
        limit(searchLimit)
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => this.mapDocToProduct(doc));
    } catch (error) {
      console.error('Error obteniendo productos más vendidos:', error);
      throw error;
    }
  }

  /**
   * Observable del stock de un producto en tiempo real
   */
  watchProductStock(productId: string): Observable<Product> {
    const productDoc = doc(this.productsCollection, productId);

    return new Observable(observer => {
      const unsubscribe = onSnapshot(
        productDoc,
        snapshot => {
          if (snapshot.exists()) {
            observer.next(this.mapDocToProduct(snapshot));
          }
        },
        error => {
          console.error('Error en listener de stock:', error);
          observer.error(error);
        }
      );

      return () => unsubscribe();
    });
  }

  /**
   * Verifica disponibilidad de una variante
   */
  async checkVariantAvailability(
    productId: string,
    variantId: string,
    quantity: number
  ): Promise<boolean> {
    try {
      const product = await this.getProductById(productId);
      if (!product) return false;

      const variant = product.variants.find(v => v.id === variantId);
      if (!variant) return false;

      return variant.stock >= quantity;
    } catch (error) {
      console.error('Error verificando disponibilidad:', error);
      return false;
    }
  }

  // ==================== CATEGORIES ====================

  /**
   * Obtiene todas las categorías
   */
  async getCategories(includeInactive = false): Promise<Category[]> {
    try {
      const constraints: QueryConstraint[] = [];

      if (!includeInactive) {
        constraints.push(where('isActive', '==', true));
      }

      constraints.push(orderBy('order', 'asc'));

      const q = query(this.categoriesCollection, ...constraints);
      const snapshot = await getDocs(q);

      return snapshot.docs.map(doc => this.mapDocToCategory(doc));
    } catch (error) {
      console.error('Error obteniendo categorías:', error);
      throw error;
    }
  }

  /**
   * Obtiene el árbol de categorías
   */
  async getCategoryTree(): Promise<CategoryWithChildren[]> {
    try {
      const categories = await this.getCategories();
      return buildCategoryTree(categories);
    } catch (error) {
      console.error('Error construyendo árbol de categorías:', error);
      throw error;
    }
  }

  /**
   * Obtiene una categoría por ID
   */
  async getCategoryById(categoryId: string): Promise<Category | null> {
    try {
      const categoryDoc = doc(this.categoriesCollection, categoryId);
      const snapshot = await getDoc(categoryDoc);

      if (!snapshot.exists()) {
        return null;
      }

      return this.mapDocToCategory(snapshot);
    } catch (error) {
      console.error('Error obteniendo categoría:', error);
      throw error;
    }
  }

  /**
   * Obtiene una categoría por slug
   */
  async getCategoryBySlug(slug: string): Promise<Category | null> {
    try {
      const q = query(this.categoriesCollection, where('seo.slug', '==', slug), limit(1));
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        return null;
      }

      return this.mapDocToCategory(snapshot.docs[0]);
    } catch (error) {
      console.error('Error obteniendo categoría por slug:', error);
      throw error;
    }
  }

  // ==================== ANALYTICS ====================

  /**
   * Registra una vista de producto
   */
  async trackProductView(productId: string, userId?: string): Promise<void> {
    try {
      const productDoc = doc(this.productsCollection, productId);
      await updateDoc(productDoc, {
        'analytics.views': increment(1),
        'analytics.lastViewed': Timestamp.now(),
      });

      // Opcional: guardar en colección analytics para tracking detallado
      if (userId) {
        // Implementar si se requiere tracking por usuario
      }
    } catch (error) {
      console.error('Error registrando vista:', error);
    }
  }

  /**
   * Registra un click en producto
   */
  async trackProductClick(productId: string, userId?: string): Promise<void> {
    try {
      const productDoc = doc(this.productsCollection, productId);
      await updateDoc(productDoc, {
        'analytics.clicks': increment(1),
      });
    } catch (error) {
      console.error('Error registrando click:', error);
    }
  }

  /**
   * Registra tiempo en página
   */
  async trackProductTimeOnPage(
    productId: string,
    timeInSeconds: number,
    userId?: string
  ): Promise<void> {
    try {
      // Calcular nuevo promedio
      const product = await this.getProductById(productId);
      if (!product) return;

      const totalViews = product.analytics.views;
      const currentAvg = product.analytics.averageTimeOnPage;
      const newAvg = ((currentAvg * (totalViews - 1)) + timeInSeconds) / totalViews;

      const productDoc = doc(this.productsCollection, productId);
      await updateDoc(productDoc, {
        'analytics.averageTimeOnPage': Math.round(newAvg),
      });
    } catch (error) {
      console.error('Error registrando tiempo:', error);
    }
  }

  /**
   * Obtiene productos más vistos
   */
  async getMostViewedProducts(searchLimit = 10): Promise<Product[]> {
    try {
      const q = query(
        this.productsCollection,
        where('isActive', '==', true),
        orderBy('analytics.views', 'desc'),
        limit(searchLimit)
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => this.mapDocToProduct(doc));
    } catch (error) {
      console.error('Error obteniendo productos más vistos:', error);
      throw error;
    }
  }

  // ==================== MAPPERS ====================

  /**
   * Mapea documento de Firestore a Product
   */
  private mapDocToProduct(doc: DocumentSnapshot): Product {
    const data = doc.data();
    if (!data) {
      throw new Error('Documento sin datos');
    }

    return createProduct({
      id: doc.id,
      name: data['name'],
      description: data['description'],
      shortDescription: data['shortDescription'],
      brand: data['brand'],
      categoryId: data['categoryId'],
      categoryPath: data['categoryPath'],
      variants: data['variants'],
      hasVariants: data['hasVariants'],
      images: data['images'],
      mainImage: data['mainImage'],
      basePrice: data['basePrice'],
      minPrice: data['minPrice'],
      maxPrice: data['maxPrice'],
      hasDiscount: data['hasDiscount'],
      discountPercentage: data['discountPercentage'],
      totalStock: data['totalStock'],
      isLowStock: data['isLowStock'],
      isOutOfStock: data['isOutOfStock'],
      status: data['status'],
      isActive: data['isActive'],
      isFeatured: data['isFeatured'],
      isNew: data['isNew'],
      rating: data['rating'],
      tags: data['tags'],
      dimensions: data['dimensions'],
      seo: data['seo'],
      analytics: data['analytics'],
      createdAt: data['createdAt']?.toDate(),
      updatedAt: data['updatedAt']?.toDate(),
      publishedAt: data['publishedAt']?.toDate(),
    });
  }

  /**
   * Mapea documento de Firestore a Category
   */
  private mapDocToCategory(doc: DocumentSnapshot): Category {
    const data = doc.data();
    if (!data) {
      throw new Error('Documento sin datos');
    }

    return createCategory({
      id: doc.id,
      name: data['name'],
      description: data['description'],
      parentId: data['parentId'],
      level: data['level'],
      path: data['path'],
      image: data['image'],
      icon: data['icon'],
      color: data['color'],
      order: data['order'],
      isActive: data['isActive'],
      isFeatured: data['isFeatured'],
      productCount: data['productCount'],
      seo: data['seo'],
      createdAt: data['createdAt']?.toDate(),
      updatedAt: data['updatedAt']?.toDate(),
    });
  }

  /**
   * Obtiene el campo de Firestore para ordenamiento
   */
  private getSortField(option: ProductSortOption): string | null {
    switch (option) {
      case ProductSortOption.NEWEST:
        return 'createdAt';
      case ProductSortOption.PRICE_LOW_HIGH:
      case ProductSortOption.PRICE_HIGH_LOW:
        return 'minPrice';
      case ProductSortOption.MOST_SOLD:
        return 'analytics.purchases';
      case ProductSortOption.BEST_RATED:
        return 'rating.average';
      case ProductSortOption.ALPHABETICAL:
        return 'name';
      default:
        return null;
    }
  }
}
