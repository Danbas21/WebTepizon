/**
 * Category Domain Model
 * 
 * Representa una categoría de productos con soporte para jerarquía anidada.
 * Permite múltiples niveles de subcategorías.
 * 
 * @domain Catalog
 */

export interface CategoryImage {
  url: string;
  alt: string;
}

export interface CategorySEO {
  title: string;
  description: string;
  keywords: string[];
  slug: string;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  
  // Jerarquía
  parentId: string | null; // null si es categoría raíz
  level: number; // 0 = raíz, 1 = subcategoría, 2 = sub-subcategoría, etc.
  path: string[]; // ['ropa', 'hombre', 'camisetas']
  
  // Display
  image?: CategoryImage;
  icon?: string; // URL o nombre de ícono
  color?: string; // Color hex para UI
  order: number; // Orden de display
  
  // Status
  isActive: boolean;
  isFeatured: boolean;
  
  // Metadata
  productCount: number; // Número de productos en esta categoría
  seo: CategorySEO;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Categoría con sus hijos (para árbol de navegación)
 */
export interface CategoryWithChildren extends Category {
  children: CategoryWithChildren[];
}

/**
 * Factory para crear una categoría con valores por defecto
 */
export function createCategory(partial: Partial<Category>): Category {
  const now = new Date();
  
  return {
    id: partial.id || '',
    name: partial.name || '',
    description: partial.description,
    
    parentId: partial.parentId || null,
    level: partial.level || 0,
    path: partial.path || [],
    
    image: partial.image,
    icon: partial.icon,
    color: partial.color,
    order: partial.order || 0,
    
    isActive: partial.isActive !== undefined ? partial.isActive : true,
    isFeatured: partial.isFeatured || false,
    
    productCount: partial.productCount || 0,
    seo: partial.seo || {
      title: partial.name || '',
      description: partial.description || '',
      keywords: [],
      slug: partial.name?.toLowerCase().replace(/\s+/g, '-') || '',
    },
    
    createdAt: partial.createdAt || now,
    updatedAt: partial.updatedAt || now,
  };
}

/**
 * Verifica si una categoría es raíz (no tiene padre)
 */
export function isRootCategory(category: Category): boolean {
  return category.parentId === null || category.level === 0;
}

/**
 * Verifica si una categoría tiene subcategorías
 */
export function hasChildren(category: CategoryWithChildren): boolean {
  return category.children.length > 0;
}

/**
 * Obtiene el path completo de una categoría como string
 */
export function getCategoryPath(category: Category): string {
  return category.path.join(' > ');
}

/**
 * Construye un árbol de categorías desde una lista plana
 */
export function buildCategoryTree(categories: Category[]): CategoryWithChildren[] {
  const map = new Map<string, CategoryWithChildren>();
  const roots: CategoryWithChildren[] = [];

  // Inicializar todas las categorías con children vacío
  categories.forEach(cat => {
    map.set(cat.id, { ...cat, children: [] });
  });

  // Construir el árbol
  categories.forEach(cat => {
    const node = map.get(cat.id)!;
    
    if (cat.parentId === null) {
      // Es raíz
      roots.push(node);
    } else {
      // Agregar a su padre
      const parent = map.get(cat.parentId);
      if (parent) {
        parent.children.push(node);
      }
    }
  });

  // Ordenar cada nivel por order
  const sortChildren = (nodes: CategoryWithChildren[]): void => {
    nodes.sort((a, b) => a.order - b.order);
    nodes.forEach(node => {
      if (node.children.length > 0) {
        sortChildren(node.children);
      }
    });
  };

  sortChildren(roots);

  return roots;
}

/**
 * Obtiene todas las categorías descendientes de una categoría
 */
export function getDescendants(
  category: CategoryWithChildren,
  includeRoot = false
): CategoryWithChildren[] {
  const descendants: CategoryWithChildren[] = includeRoot ? [category] : [];

  const traverse = (cat: CategoryWithChildren): void => {
    cat.children.forEach(child => {
      descendants.push(child);
      traverse(child);
    });
  };

  traverse(category);

  return descendants;
}

/**
 * Obtiene los IDs de todas las categorías descendientes
 */
export function getDescendantIds(
  category: CategoryWithChildren,
  includeRoot = true
): string[] {
  const descendants = getDescendants(category, includeRoot);
  return descendants.map(cat => cat.id);
}

/**
 * Encuentra una categoría en el árbol por ID
 */
export function findCategoryById(
  tree: CategoryWithChildren[],
  id: string
): CategoryWithChildren | null {
  for (const category of tree) {
    if (category.id === id) {
      return category;
    }
    if (category.children.length > 0) {
      const found = findCategoryById(category.children, id);
      if (found) return found;
    }
  }
  return null;
}

/**
 * Obtiene el breadcrumb de una categoría
 */
export function getCategoryBreadcrumb(category: Category): { id: string; name: string }[] {
  return category.path.map((name, index) => ({
    id: '', // En la práctica, necesitarías obtener los IDs de los ancestros
    name,
  }));
}

/**
 * Verifica si una categoría es ancestro de otra
 */
export function isAncestor(ancestor: Category, descendant: Category): boolean {
  return descendant.path.includes(ancestor.name);
}

/**
 * Aplana un árbol de categorías a una lista
 */
export function flattenCategoryTree(tree: CategoryWithChildren[]): Category[] {
  const result: Category[] = [];

  const traverse = (nodes: CategoryWithChildren[]): void => {
    nodes.forEach(node => {
      const { children, ...category } = node;
      result.push(category);
      if (children.length > 0) {
        traverse(children);
      }
    });
  };

  traverse(tree);

  return result;
}

/**
 * Obtiene solo las categorías raíz de una lista
 */
export function getRootCategories(categories: Category[]): Category[] {
  return categories.filter(cat => isRootCategory(cat));
}

/**
 * Obtiene las subcategorías directas de una categoría
 */
export function getDirectChildren(
  categories: Category[],
  parentId: string
): Category[] {
  return categories.filter(cat => cat.parentId === parentId);
}
