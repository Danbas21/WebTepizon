# 🛍️ TEPIZON E-COMMERCE PLATFORM - CONTEXTO DEL PROYECTO

**Versión:** 2.0 - Actualizado después de completar Cart Module  
**Fecha:** Octubre 2025  
**Estado:** 3 módulos completados (Auth, Catalog, Cart)

---

## 📋 INFORMACIÓN GENERAL

### Stack Tecnológico
- **Frontend:** Angular 20 con Signals y Standalone Components
- **Backend:** Firebase (Auth, Firestore, Storage, Functions)
- **Arquitectura:** Hexagonal (Clean Architecture)
- **Estado:** Signals nativos de Angular 20
- **Estilos:** TailwindCSS
- **Idioma:** Español (México)

### Arquitectura por Capas
```
Domain Layer → Modelos, Puertos, Servicios de dominio
Application Layer → Use Cases, Facades
Infrastructure Layer → Adapters (Firebase, localStorage), Repositories
Presentation Layer → Components, Pages
```

---

## ✅ MÓDULOS COMPLETADOS (3/6)

### 1️⃣ AUTH MODULE - 100% ✅
**Ubicación:** `src/app/features/auth/`

**Archivos creados (17):**
- Domain: `user.model.ts`, `auth-token.model.ts`, `auth-error.model.ts`, `auth.repository.port.ts`, `auth.domain.service.ts`
- Infrastructure: `firebase-auth.adapter.ts`, `auth.repository.impl.ts`, `auth.interceptor.ts`
- Application: `login.use-case.ts`, `register.use-case.ts`, `social-login.use-case.ts`, `logout.use-case.ts`, `auth.facade.ts`
- Guards: `auth.guards.ts` (6 guards funcionales)
- Config: `app.config.ts`, `environment.ts`
- Docs: `README-AUTH-MODULE.md`, `ARCHITECTURE-DIAGRAM.md`

**Características:**
- Login/Register con email
- Social login (Google, Facebook)
- Verificación de email
- Reset de contraseña
- 6 guards funcionales (auth, admin, email verified, etc.)
- HTTP interceptor para tokens
- Sesión persistente
- Manejo robusto de errores

---

### 2️⃣ CATALOG MODULE - 100% ✅
**Ubicación:** `src/app/features/catalog/`

**Archivos creados (14):**
- Domain: `product.model.ts`, `category.model.ts`, `product-filter.model.ts`, `catalog.repository.port.ts`, `catalog.domain.service.ts`
- Infrastructure: `firebase-catalog.adapter.ts`, `catalog.repository.impl.ts`
- Application: `get-products.use-case.ts`, `search-products.use-case.ts`, `get-product-detail.use-case.ts`, `get-categories.use-case.ts`, `catalog.facade.ts`
- Extras: `catalog-models-index.ts` (barrel exports)
- Docs: `README-CATALOG-MODULE.md`

**Características:**
- Productos con variantes (tallas, colores)
- 3 imágenes por producto
- Categorías anidadas (multi-nivel)
- 8 filtros (precio, categoría, marca, talla, color, rating, stock, descuento)
- 6 tipos de ordenamiento
- Infinite scroll
- Búsqueda por texto con relevancia
- Stock en tiempo real
- Analytics (vistas, clicks, tiempo en página)
- Stock bajo (< 5 unidades)
- Ratings y reseñas

---

### 3️⃣ CART MODULE - 100% ✅
**Ubicación:** `src/app/features/cart/`

**Archivos creados (14):**
- Domain: `cart-item.model.ts`, `coupon.model.ts`, `cart.model.ts`, `cart.repository.port.ts`, `cart.domain.service.ts`
- Infrastructure: `firebase-cart.adapter.ts`, `local-cart.adapter.ts`, `cart.repository.impl.ts`
- Application: `add-to-cart.use-case.ts`, `cart-use-cases.ts` (Remove, Update, Apply Coupon, Sync, Validate), `cart.facade.ts`
- Extras: `cart-models-index.ts` (barrel exports)
- Docs: `README-CART-MODULE.md`

**Características:**
- Persistencia dual (localStorage para guests, Firestore para usuarios)
- Sincronización automática al hacer login (merge de carritos)
- Sistema de cupones completo (3 tipos: porcentual, fijo, envío gratis)
- Validación de stock en tiempo real
- Cálculos automáticos (subtotal, descuentos, impuestos, envío)
- Envío gratis sobre $500 MXN
- Límites de cantidad (máx 99 por item, 50 items por carrito)
- IVA 16% (México)
- Carrito abandonado (tracking después de 24h)
- Snapshot de productos (evita inconsistencias)
- Signals reactivos de Angular 20

---

## ❌ MÓDULOS PENDIENTES (3/6)

### 4️⃣ WISHLIST MODULE (Próximo recomendado) ❤️
**Prioridad:** Media  
**Complejidad:** Baja (8-10 archivos)  
**Dependencias:** Auth ✅, Catalog ✅

**Funcionalidades:**
- Agregar/remover productos de favoritos
- Persistencia en Firestore
- Mover de wishlist a cart
- Compartir wishlist (URL pública)
- Notificaciones de cambios de precio
- Alertas de stock disponible

---

### 5️⃣ CHECKOUT MODULE 💳
**Prioridad:** Alta  
**Complejidad:** Alta (15-20 archivos)  
**Dependencias:** Auth ✅, Catalog ✅, Cart ✅

**Funcionalidades:**
- Formulario de dirección de envío
- Métodos de pago (Stripe/PayPal/tarjeta)
- Validación de dirección
- Cálculo de envío dinámico
- Revisión de orden
- Confirmación de pago
- Integración con payment gateway
- Generación de orden
- Emails de confirmación
- Reducción automática de stock
- Facturación (CFDI México)

---

### 6️⃣ ORDERS MODULE 📦
**Prioridad:** Alta  
**Complejidad:** Media (12-15 archivos)  
**Dependencias:** Auth ✅, Catalog ✅, Cart ✅, Checkout ❌

**Funcionalidades:**
- Historial de órdenes del usuario
- Detalle de orden
- Tracking de envío
- Estados de orden (pendiente, procesando, enviado, entregado, cancelado)
- Cancelación de orden
- Devoluciones y reembolsos
- Reordenar productos
- Facturas y recibos PDF
- Notificaciones de estado

---

## 📂 ESTRUCTURA DE CARPETAS ACTUAL

```
tepizon-platform/
├── src/
│   ├── app/
│   │   ├── features/
│   │   │   ├── auth/ ✅ (17 archivos)
│   │   │   │   ├── domain/
│   │   │   │   ├── application/
│   │   │   │   ├── infrastructure/
│   │   │   │   ├── guards/
│   │   │   │   └── README.md
│   │   │   │
│   │   │   ├── catalog/ ✅ (14 archivos)
│   │   │   │   ├── domain/
│   │   │   │   ├── application/
│   │   │   │   ├── infrastructure/
│   │   │   │   └── README.md
│   │   │   │
│   │   │   ├── cart/ ✅ (14 archivos)
│   │   │   │   ├── domain/
│   │   │   │   ├── application/
│   │   │   │   ├── infrastructure/
│   │   │   │   └── README.md
│   │   │   │
│   │   │   ├── wishlist/ ❌ (pendiente)
│   │   │   ├── checkout/ ❌ (pendiente)
│   │   │   └── orders/ ❌ (pendiente)
│   │   │
│   │   ├── shared/
│   │   │   └── components/
│   │   │
│   │   ├── core/
│   │   │   ├── guards/
│   │   │   └── interceptors/
│   │   │
│   │   ├── app.component.ts
│   │   ├── app.config.ts ✅
│   │   └── app.routes.ts
│   │
│   ├── environments/
│   │   ├── environment.ts ✅
│   │   └── environment.prod.ts
│   │
│   └── assets/
│
├── docs/
│   ├── auth-module/
│   ├── catalog-module/
│   └── cart-module/
│
├── firebase.json
├── firestore.rules
├── firestore.indexes.json ✅
└── package.json
```

---

## 🔥 FIRESTORE SCHEMA ACTUAL

### Collection: users
```typescript
{
  uid: string
  email: string
  displayName: string
  photoURL: string
  emailVerified: boolean
  phoneNumber: string | null
  role: 'user' | 'admin'
  createdAt: timestamp
  updatedAt: timestamp
  lastLoginAt: timestamp
}
```

### Collection: products
```typescript
{
  id: string
  name: string
  description: string
  brand: string
  categoryId: string
  categoryPath: string[]
  variants: [
    {
      id: string
      sku: string
      size?: string
      color?: string
      stock: number
      price: number
      compareAtPrice?: number
      images: string[]
    }
  ]
  images: [
    {
      url: string
      alt: string
      isPrimary: boolean
      order: number
    }
  ]
  mainImage: string
  basePrice: number
  minPrice: number
  maxPrice: number
  hasDiscount: boolean
  discountPercentage: number
  totalStock: number
  isLowStock: boolean
  isOutOfStock: boolean
  status: 'ACTIVE' | 'INACTIVE' | 'OUT_OF_STOCK' | 'DISCONTINUED'
  isActive: boolean
  isFeatured: boolean
  isNew: boolean
  rating: {
    average: number
    count: number
    distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
  }
  tags: string[]
  seo: {
    title: string
    description: string
    keywords: string[]
    slug: string
  }
  analytics: {
    views: number
    clicks: number
    purchases: number
    averageTimeOnPage: number
    conversionRate: number
    lastViewed: timestamp
  }
  createdAt: timestamp
  updatedAt: timestamp
}
```

### Collection: categories
```typescript
{
  id: string
  name: string
  description: string
  parentId: string | null
  level: number
  path: string[]
  image: { url: string, alt: string }
  icon: string
  color: string
  order: number
  isActive: boolean
  isFeatured: boolean
  productCount: number
  seo: {
    title: string
    description: string
    keywords: string[]
    slug: string
  }
  createdAt: timestamp
  updatedAt: timestamp
}
```

### Collection: carts
```typescript
{
  id: string
  userId: string
  items: [
    {
      id: string
      productId: string
      variantId: string
      productSnapshot: {
        name: string
        brand: string
        mainImage: string
        slug: string
      }
      variantSnapshot: {
        sku: string
        size?: string
        color?: string
        price: number
        compareAtPrice?: number
        image?: string
      }
      quantity: number
      maxQuantity: number
      unitPrice: number
      subtotal: number
      discount: number
      total: number
      addedAt: timestamp
      updatedAt: timestamp
      isAvailable: boolean
      hasStockIssue: boolean
      stockMessage?: string
    }
  ]
  appliedCoupon: {
    id: string
    code: string
    type: 'PERCENTAGE' | 'FIXED' | 'FREE_SHIPPING'
    value: number
    ...
  } | null
  totals: {
    itemsCount: number
    itemsQuantity: number
    subtotal: number
    itemsDiscount: number
    couponDiscount: number
    totalDiscount: number
    taxRate: number
    tax: number
    shippingCost: number
    total: number
  }
  status: 'ACTIVE' | 'ABANDONED' | 'CONVERTED' | 'EXPIRED'
  isEmpty: boolean
  createdAt: timestamp
  updatedAt: timestamp
  lastActivityAt: timestamp
  expiresAt: timestamp
  source: string
  sessionId: string
}
```

### Collection: coupons
```typescript
{
  id: string
  code: string (indexed)
  name: string
  description: string
  type: 'PERCENTAGE' | 'FIXED' | 'FREE_SHIPPING'
  value: number
  status: 'ACTIVE' | 'EXPIRED' | 'EXHAUSTED' | 'INACTIVE'
  isActive: boolean
  restrictions: {
    minPurchaseAmount?: number
    maxDiscountAmount?: number
    categoryIds?: string[]
    productIds?: string[]
    firstPurchaseOnly?: boolean
    userIds?: string[]
  }
  maxUses?: number
  usedCount: number
  maxUsesPerUser?: number
  validFrom: timestamp
  validUntil: timestamp
  createdAt: timestamp
  updatedAt: timestamp
}
```

---

## 🔐 FIRESTORE INDEXES NECESARIOS

```json
{
  "indexes": [
    {
      "collectionGroup": "products",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "isActive", "order": "ASCENDING" },
        { "fieldPath": "categoryId", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "products",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "isActive", "order": "ASCENDING" },
        { "fieldPath": "isFeatured", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "products",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "isActive", "order": "ASCENDING" },
        { "fieldPath": "analytics.views", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "categories",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "isActive", "order": "ASCENDING" },
        { "fieldPath": "order", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "carts",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "status", "order": "ASCENDING" },
        { "fieldPath": "lastActivityAt", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "coupons",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "code", "order": "ASCENDING" },
        { "fieldPath": "isActive", "order": "ASCENDING" }
      ]
    }
  ]
}
```

---

## 🎯 PROGRESO DEL PROYECTO

### Fase 1: Configuración Inicial ✅
- [x] Setup de Angular 20
- [x] Configuración de Firebase
- [x] TailwindCSS
- [x] Estructura de carpetas

### Fase 2: Arquitectura Base ✅
- [x] Hexagonal Architecture implementada
- [x] Patterns definidos (Repository, Use Case, Facade)
- [x] Estructura por capas

### Fase 3: Módulos Core (3/6 completados)
- [x] Auth Module - 100%
- [x] Catalog Module - 100%
- [x] Cart Module - 100%
- [ ] Wishlist Module - 0%
- [ ] Checkout Module - 0%
- [ ] Orders Module - 0%

### Fase 4: Frontend UI (0%)
- [ ] Design System
- [ ] Componentes reutilizables
- [ ] Páginas principales
- [ ] Responsive design

### Fase 5: Testing (0%)
- [ ] Unit tests
- [ ] Integration tests
- [ ] E2E tests

### Fase 6: Deployment (0%)
- [ ] Firebase Hosting
- [ ] CI/CD
- [ ] Monitoreo

---

## 📊 ESTADÍSTICAS DEL PROYECTO

- **Total de archivos creados:** 45
- **Módulos completados:** 3/6 (50%)
- **Líneas de código (aprox):** ~8,000
- **Tiempo invertido:** ~4-5 horas
- **Progreso general:** 50%

---

## 🚀 PRÓXIMOS PASOS RECOMENDADOS

### Opción 1: Continuar con Módulos Backend (Recomendado)
1. **Wishlist Module** ❤️ (8-10 archivos, ~1 hora)
   - Más simple y rápido
   - Independiente de otros módulos
   - Funcionalidad útil para usuarios

2. **Checkout Module** 💳 (15-20 archivos, ~2-3 horas)
   - Crítico para e-commerce
   - Integración con payment gateway
   - Requiere Cart Module ✅

3. **Orders Module** 📦 (12-15 archivos, ~1.5-2 horas)
   - Gestión de órdenes
   - Tracking de envíos
   - Requiere Checkout Module

### Opción 2: Empezar Frontend UI
- Product List Page
- Product Detail Page
- Cart Drawer
- Checkout Flow
- Ver la aplicación funcionando visualmente

### Opción 3: Admin Dashboard
- Panel de administración
- Gestión de productos
- Gestión de órdenes
- Analytics

---

## 💡 DECISIONES TÉCNICAS IMPORTANTES

### Signals vs RxJS
- **Decisión:** Usar Signals de Angular 20 para estado reactivo
- **Razón:** Más simple, mejor performance, nativo de Angular
- **Uso de RxJS:** Solo para HTTP y Firestore listeners

### Persistencia del Carrito
- **Guests:** localStorage (inmediato, sin backend)
- **Usuarios:** Firestore (persistente, multi-dispositivo)
- **Sincronización:** Al hacer login se hace merge automático

### Stock Management
- **En tiempo real:** Listeners de Firestore
- **Validación:** Antes de agregar al carrito y en checkout
- **Stock bajo:** Alerta cuando quedan < 5 unidades

### Cupones
- **Tipos:** Porcentual, Fijo, Envío gratis
- **Restricciones:** Monto mínimo, categorías, productos, usuarios
- **Validación:** Cliente + Servidor

### Precios e Impuestos
- **Moneda:** MXN (Pesos mexicanos)
- **IVA:** 16% (estándar México)
- **Envío gratis:** Compras > $500 MXN
- **Envío estándar:** $99 MXN

---

## 📝 NOTAS IMPORTANTES

1. **Todos los archivos usan TypeScript estricto**
2. **Todos los componentes son standalone (Angular 20)**
3. **Se usa Signals para reactividad (no observables en UI)**
4. **Arquitectura hexagonal consistente en todos los módulos**
5. **Los README de cada módulo tienen ejemplos de uso**
6. **Los Facades simplifican el uso desde la UI**
7. **Validaciones en dominio + infraestructura**

---

## 🤝 CÓMO USAR ESTE CONTEXTO

Este documento debe ser usado al inicio de cada nuevo prompt para:
1. Recordar el estado actual del proyecto
2. Mantener consistencia en la arquitectura
3. Evitar duplicar trabajo
4. Seguir las mismas convenciones
5. Conocer las dependencias entre módulos

**Instrucción para el próximo prompt:**
"Aquí está el contexto actualizado del proyecto Tepizon. Hemos completado Auth, Catalog y Cart modules. ¿Continuamos con [módulo específico]?"

---

**Última actualización:** Octubre 2025  
**Próxima acción recomendada:** Implementar Wishlist Module