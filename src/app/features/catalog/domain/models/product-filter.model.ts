/**
 * Product Filter and Sort Models
 * 
 * Define los filtros disponibles para búsqueda de productos:
 * - Precio (rango)
 * - Categoría
 * - Marca
 * - Talla
 * - Color
 * - Rating
 * - Disponibilidad
 * - Descuento
 * 
 * @domain Catalog
 */

export enum ProductSortOption {
  NEWEST = 'NEWEST', // Más recientes
  PRICE_LOW_HIGH = 'PRICE_LOW_HIGH', // Precio: menor a mayor
  PRICE_HIGH_LOW = 'PRICE_HIGH_LOW', // Precio: mayor a menor
  MOST_SOLD = 'MOST_SOLD', // Más vendidos
  BEST_RATED = 'BEST_RATED', // Mejor calificados
  ALPHABETICAL = 'ALPHABETICAL', // Alfabético A-Z
}

export interface PriceRange {
  min: number;
  max: number;
}

export interface ProductFilter {
  // Búsqueda por texto
  searchQuery?: string;
  
  // Filtro de precio
  priceRange?: PriceRange;
  
  // Filtro de categoría (incluye subcategorías)
  categoryIds?: string[];
  
  // Filtro de marca
  brands?: string[];
  
  // Filtro de tallas
  sizes?: string[];
  
  // Filtro de colores
  colors?: string[];
  
  // Filtro de rating (mínimo)
  minRating?: number; // 0-5
  
  // Filtro de disponibilidad
  inStock?: boolean; // true = solo productos con stock
  
  // Filtro de descuento
  onSale?: boolean; // true = solo productos con descuento
  
  // Filtros adicionales
  isFeatured?: boolean;
  isNew?: boolean;
  tags?: string[];
}

export interface ProductSort {
  option: ProductSortOption;
  direction: 'asc' | 'desc';
}

export interface ProductPagination {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface ProductQueryParams {
  filter: ProductFilter;
  sort: ProductSort;
  pagination: {
    page: number;
    pageSize: number;
  };
}

export interface ProductQueryResult {
  products: any[]; // Product[] - evitamos circular dependency
  pagination: ProductPagination;
  appliedFilters: ProductFilter;
  availableFilters: AvailableFilters;
}

export interface AvailableFilters {
  brands: string[];
  sizes: string[];
  colors: string[];
  priceRange: PriceRange;
  categories: string[];
}

/**
 * Factory para crear filtros por defecto
 */
export function createProductFilter(partial: Partial<ProductFilter> = {}): ProductFilter {
  return {
    searchQuery: partial.searchQuery,
    priceRange: partial.priceRange,
    categoryIds: partial.categoryIds,
    brands: partial.brands,
    sizes: partial.sizes,
    colors: partial.colors,
    minRating: partial.minRating,
    inStock: partial.inStock,
    onSale: partial.onSale,
    isFeatured: partial.isFeatured,
    isNew: partial.isNew,
    tags: partial.tags,
  };
}

/**
 * Factory para crear ordenamiento por defecto
 */
export function createProductSort(
  option: ProductSortOption = ProductSortOption.NEWEST
): ProductSort {
  return {
    option,
    direction: option === ProductSortOption.PRICE_HIGH_LOW ? 'desc' : 'asc',
  };
}

/**
 * Factory para crear paginación por defecto
 */
export function createProductPagination(
  page = 1,
  pageSize = 20,
  totalItems = 0
): ProductPagination {
  const totalPages = Math.ceil(totalItems / pageSize);
  
  return {
    page,
    pageSize,
    totalItems,
    totalPages,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1,
  };
}

/**
 * Verifica si hay filtros activos
 */
export function hasActiveFilters(filter: ProductFilter): boolean {
  return !!(
    filter.searchQuery ||
    filter.priceRange ||
    filter.categoryIds?.length ||
    filter.brands?.length ||
    filter.sizes?.length ||
    filter.colors?.length ||
    filter.minRating ||
    filter.inStock !== undefined ||
    filter.onSale ||
    filter.isFeatured ||
    filter.isNew ||
    filter.tags?.length
  );
}

/**
 * Cuenta el número de filtros activos
 */
export function countActiveFilters(filter: ProductFilter): number {
  let count = 0;
  
  if (filter.searchQuery) count++;
  if (filter.priceRange) count++;
  if (filter.categoryIds?.length) count++;
  if (filter.brands?.length) count += filter.brands.length;
  if (filter.sizes?.length) count += filter.sizes.length;
  if (filter.colors?.length) count += filter.colors.length;
  if (filter.minRating) count++;
  if (filter.inStock !== undefined) count++;
  if (filter.onSale) count++;
  if (filter.isFeatured) count++;
  if (filter.isNew) count++;
  if (filter.tags?.length) count += filter.tags.length;
  
  return count;
}

/**
 * Limpia todos los filtros
 */
export function clearProductFilters(): ProductFilter {
  return createProductFilter();
}

/**
 * Remueve un filtro específico
 */
export function removeFilter(
  filter: ProductFilter,
  filterType: keyof ProductFilter
): ProductFilter {
  return {
    ...filter,
    [filterType]: undefined,
  };
}

/**
 * Agrega un valor a un filtro de array
 */
export function addFilterValue(
  filter: ProductFilter,
  filterType: 'brands' | 'sizes' | 'colors' | 'categoryIds' | 'tags',
  value: string
): ProductFilter {
  const currentValues = filter[filterType] || [];
  
  if (currentValues.includes(value)) {
    return filter; // Ya existe
  }
  
  return {
    ...filter,
    [filterType]: [...currentValues, value],
  };
}

/**
 * Remueve un valor de un filtro de array
 */
export function removeFilterValue(
  filter: ProductFilter,
  filterType: 'brands' | 'sizes' | 'colors' | 'categoryIds' | 'tags',
  value: string
): ProductFilter {
  const currentValues = filter[filterType] || [];
  
  return {
    ...filter,
    [filterType]: currentValues.filter(v => v !== value),
  };
}

/**
 * Obtiene el label legible de una opción de ordenamiento
 */
export function getSortLabel(option: ProductSortOption): string {
  const labels: Record<ProductSortOption, string> = {
    [ProductSortOption.NEWEST]: 'Más recientes',
    [ProductSortOption.PRICE_LOW_HIGH]: 'Precio: menor a mayor',
    [ProductSortOption.PRICE_HIGH_LOW]: 'Precio: mayor a menor',
    [ProductSortOption.MOST_SOLD]: 'Más vendidos',
    [ProductSortOption.BEST_RATED]: 'Mejor calificados',
    [ProductSortOption.ALPHABETICAL]: 'Alfabético A-Z',
  };
  
  return labels[option];
}

/**
 * Convierte filtros a query params para URL
 */
export function filtersToQueryParams(filter: ProductFilter): Record<string, string> {
  const params: Record<string, string> = {};
  
  if (filter.searchQuery) params['q'] = filter.searchQuery;
  if (filter.priceRange) {
    params['minPrice'] = filter.priceRange.min.toString();
    params['maxPrice'] = filter.priceRange.max.toString();
  }
  if (filter.categoryIds?.length) params['categories'] = filter.categoryIds.join(',');
  if (filter.brands?.length) params['brands'] = filter.brands.join(',');
  if (filter.sizes?.length) params['sizes'] = filter.sizes.join(',');
  if (filter.colors?.length) params['colors'] = filter.colors.join(',');
  if (filter.minRating) params['minRating'] = filter.minRating.toString();
  if (filter.inStock !== undefined) params['inStock'] = filter.inStock.toString();
  if (filter.onSale) params['onSale'] = 'true';
  if (filter.isFeatured) params['featured'] = 'true';
  if (filter.isNew) params['new'] = 'true';
  if (filter.tags?.length) params['tags'] = filter.tags.join(',');
  
  return params;
}

/**
 * Convierte query params a filtros
 */
export function queryParamsToFilters(params: Record<string, string>): ProductFilter {
  const filter: ProductFilter = {};
  
  if (params['q']) filter.searchQuery = params['q'];
  if (params['minPrice'] && params['maxPrice']) {
    filter.priceRange = {
      min: parseFloat(params['minPrice']),
      max: parseFloat(params['maxPrice']),
    };
  }
  if (params['categories']) filter.categoryIds = params['categories'].split(',');
  if (params['brands']) filter.brands = params['brands'].split(',');
  if (params['sizes']) filter.sizes = params['sizes'].split(',');
  if (params['colors']) filter.colors = params['colors'].split(',');
  if (params['minRating']) filter.minRating = parseFloat(params['minRating']);
  if (params['inStock']) filter.inStock = params['inStock'] === 'true';
  if (params['onSale']) filter.onSale = true;
  if (params['featured']) filter.isFeatured = true;
  if (params['new']) filter.isNew = true;
  if (params['tags']) filter.tags = params['tags'].split(',');
  
  return filter;
}

/**
 * Valida que un rango de precio sea válido
 */
export function isValidPriceRange(range: PriceRange): boolean {
  return range.min >= 0 && range.max > range.min;
}

/**
 * Valida que un rating sea válido
 */
export function isValidRating(rating: number): boolean {
  return rating >= 0 && rating <= 5;
}
