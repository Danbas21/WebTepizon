// ============================================================================
// CATEGORY SERVICE - TEPIZON PLATFORM
// ============================================================================
// Servicio para gestión de categorías con estructura jerárquica
// ============================================================================

import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

/**
 * Categoría de producto
 */
export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  icon?: string;
  
  // Jerarquía
  parentId?: string;
  level: number;
  path: string[]; // Array de IDs de ancestros
  children?: Category[];
  
  // Metadata
  productCount: number;
  order: number;
  isActive: boolean;
  isFeatured: boolean;
  
  // SEO
  metaTitle?: string;
  metaDescription?: string;
  keywords?: string[];
  
  // Fechas
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Servicio de Categorías
 * 
 * Características:
 * - Árbol jerárquico de categorías
 * - Caché en memoria con Signals
 * - Navegación por niveles
 * - Búsqueda de categorías
 * - Categorías featured
 * 
 * @example
 * ```typescript
 * constructor(private categoryService: CategoryService) {
 *   effect(() => {
 *     console.log('Categorías:', this.categoryService.categories());
 *   });
 * }
 * ```
 */
@Injectable({
  providedIn: 'root'
})
export class CategoryService {
  // ========================================================================
  // DEPENDENCIES
  // ========================================================================
  
  private readonly http = inject(HttpClient);
  private readonly API_URL = '/api/categories';
  
  // ========================================================================
  // SIGNALS - ESTADO
  // ========================================================================
  
  /** Todas las categorías (plano) */
  private readonly allCategories = signal<Category[]>([]);
  
  /** Mapa de categorías por ID para acceso rápido */
  private readonly categoriesMap = signal<Map<string, Category>>(new Map());
  
  /** Estado de carga */
  private readonly isLoadingSignal = signal(false);
  
  /** Última actualización */
  private readonly lastUpdated = signal<Date | null>(null);
  
  // ========================================================================
  // SIGNALS PÚBLICOS (READONLY)
  // ========================================================================
  
  /** Estado de carga (readonly) */
  readonly isLoading = this.isLoadingSignal.asReadonly();
  
  // ========================================================================
  // COMPUTED SIGNALS
  // ========================================================================
  
  /**
   * Categorías raíz (nivel 0, sin parent)
   */
  readonly rootCategories = computed(() => {
    return this.allCategories()
      .filter(cat => !cat.parentId)
      .sort((a, b) => a.order - b.order);
  });
  
  /**
   * Categorías activas
   */
  readonly activeCategories = computed(() => {
    return this.allCategories().filter(cat => cat.isActive);
  });
  
  /**
   * Categorías destacadas
   */
  readonly featuredCategories = computed(() => {
    return this.allCategories()
      .filter(cat => cat.isFeatured && cat.isActive)
      .sort((a, b) => a.order - b.order);
  });
  
  /**
   * Árbol de categorías completo
   */
  readonly categoryTree = computed(() => {
    return this.buildCategoryTree(this.rootCategories());
  });
  
  /**
   * Obtener categoría por ID
   */
  readonly getCategoryById = computed(() => {
    const map = this.categoriesMap();
    return (id: string): Category | undefined => map.get(id);
  });
  
  /**
   * Obtener categoría por slug
   */
  readonly getCategoryBySlug = computed(() => {
    const categories = this.allCategories();
    return (slug: string): Category | undefined => 
      categories.find(cat => cat.slug === slug);
  });
  
  // ========================================================================
  // CONSTRUCTOR
  // ========================================================================
  
  constructor() {
    this.loadCategories();
  }
  
  // ========================================================================
  // MÉTODOS PÚBLICOS
  // ========================================================================
  
  /**
   * Cargar todas las categorías
   */
  async loadCategories(force: boolean = false): Promise<void> {
    // Si ya tenemos categorías y no se fuerza, no recargar
    if (this.allCategories().length > 0 && !force) {
      return;
    }
    
    this.isLoadingSignal.set(true);
    
    try {
      // TODO: Llamar al backend real
      // const categories = await firstValueFrom(
      //   this.http.get<Category[]>(this.API_URL)
      // );
      
      // Simulación
      await new Promise(resolve => setTimeout(resolve, 500));
      const categories = this.generateMockCategories();
      
      // Actualizar signals
      this.allCategories.set(categories);
      
      // Crear mapa para acceso rápido
      const map = new Map<string, Category>();
      categories.forEach(cat => map.set(cat.id, cat));
      this.categoriesMap.set(map);
      
      this.lastUpdated.set(new Date());
      
    } catch (error) {
      console.error('Error al cargar categorías:', error);
      throw error;
    } finally {
      this.isLoadingSignal.set(false);
    }
  }
  
  /**
   * Obtener hijos de una categoría
   */
  getChildren(categoryId: string): Category[] {
    return this.allCategories()
      .filter(cat => cat.parentId === categoryId)
      .sort((a, b) => a.order - b.order);
  }
  
  /**
   * Obtener ancestros de una categoría (breadcrumb)
   */
  getAncestors(categoryId: string): Category[] {
    const category = this.categoriesMap().get(categoryId);
    if (!category) return [];
    
    const ancestors: Category[] = [];
    const map = this.categoriesMap();
    
    category.path.forEach(ancestorId => {
      const ancestor = map.get(ancestorId);
      if (ancestor) {
        ancestors.push(ancestor);
      }
    });
    
    return ancestors;
  }
  
  /**
   * Obtener breadcrumb completo de una categoría
   */
  getBreadcrumb(categoryId: string): Category[] {
    const ancestors = this.getAncestors(categoryId);
    const category = this.categoriesMap().get(categoryId);
    
    if (category) {
      return [...ancestors, category];
    }
    
    return ancestors;
  }
  
  /**
   * Obtener todas las subcategorías recursivamente
   */
  getAllDescendants(categoryId: string): Category[] {
    const descendants: Category[] = [];
    const children = this.getChildren(categoryId);
    
    children.forEach(child => {
      descendants.push(child);
      descendants.push(...this.getAllDescendants(child.id));
    });
    
    return descendants;
  }
  
  /**
   * Buscar categorías por nombre
   */
  searchCategories(query: string): Category[] {
    const lowerQuery = query.toLowerCase();
    
    return this.allCategories()
      .filter(cat => 
        cat.name.toLowerCase().includes(lowerQuery) ||
        cat.description?.toLowerCase().includes(lowerQuery)
      )
      .sort((a, b) => {
        // Priorizar coincidencias exactas en el nombre
        const aNameMatch = a.name.toLowerCase().startsWith(lowerQuery);
        const bNameMatch = b.name.toLowerCase().startsWith(lowerQuery);
        
        if (aNameMatch && !bNameMatch) return -1;
        if (!aNameMatch && bNameMatch) return 1;
        
        return a.name.localeCompare(b.name);
      });
  }
  
  /**
   * Verificar si una categoría tiene hijos
   */
  hasChildren(categoryId: string): boolean {
    return this.allCategories().some(cat => cat.parentId === categoryId);
  }
  
  /**
   * Verificar si una categoría es ancestro de otra
   */
  isAncestor(ancestorId: string, descendantId: string): boolean {
    const descendant = this.categoriesMap().get(descendantId);
    return descendant?.path.includes(ancestorId) || false;
  }
  
  // ========================================================================
  // MÉTODOS PRIVADOS
  // ========================================================================
  
  /**
   * Construir árbol de categorías recursivamente
   */
  private buildCategoryTree(categories: Category[]): Category[] {
    return categories.map(category => ({
      ...category,
      children: this.buildCategoryTree(this.getChildren(category.id))
    }));
  }
  
  /**
   * Generar categorías mock
   */
  private generateMockCategories(): Category[] {
    const categories: Category[] = [];
    
    // Categorías raíz
    const rootCategories = [
      { id: 'cat-1', name: 'Ropa', icon: 'checkroom', order: 1 },
      { id: 'cat-2', name: 'Deportes', icon: 'sports_soccer', order: 2 },
      { id: 'cat-3', name: 'Hogar', icon: 'home', order: 3 },
      { id: 'cat-4', name: 'Tecnología', icon: 'devices', order: 4 },
      { id: 'cat-5', name: 'Decoración', icon: 'palette', order: 5 },
    ];
    
    rootCategories.forEach(root => {
      categories.push({
        id: root.id,
        name: root.name,
        slug: root.name.toLowerCase(),
        description: `Categoría de ${root.name}`,
        icon: root.icon,
        level: 0,
        path: [],
        productCount: Math.floor(Math.random() * 200) + 50,
        order: root.order,
        isActive: true,
        isFeatured: Math.random() > 0.5,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      // Subcategorías
      const subCount = Math.floor(Math.random() * 4) + 2;
      for (let i = 0; i < subCount; i++) {
        const subId = `${root.id}-sub-${i + 1}`;
        categories.push({
          id: subId,
          name: `${root.name} ${i + 1}`,
          slug: `${root.name.toLowerCase()}-${i + 1}`,
          description: `Subcategoría de ${root.name}`,
          parentId: root.id,
          level: 1,
          path: [root.id],
          productCount: Math.floor(Math.random() * 50) + 10,
          order: i + 1,
          isActive: true,
          isFeatured: false,
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }
    });
    
    return categories;
  }
}
