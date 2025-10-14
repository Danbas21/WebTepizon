# Contexto del Proyecto para Claude

## 📊 INFORMACIÓN DEL PROYECTO

**Nombre:** Tepizon Platform (E-Commerce Multi-Categoría)  
**Project ID Firebase:** `tepizon-web`  
**Ubicación Local:** `D:\tepizon\tepizon-platform\` y `D:\AppTepizon\AppTepizon\`  
**Región Cloud:** `us-central1`  
**Service Account:** `356932896799-compute@developer.gserviceaccount.com`  
**Functions Codebase:** `f-tepizon`

---

## 🛠️ Stack

### Backend
- **Firebase Cloud Functions v2**: 11 funciones deployadas (Node.js 22)
- **Firestore Database**: NoSQL con 10 colecciones configuradas
- **Firebase Authentication**: Email/Password + Google + Facebook OAuth
- **Firebase Storage**: Para imágenes de productos y usuarios
- **Firebase Hosting**: Para hosting del frontend Angular
- **Secret Manager**: Google Cloud Secret Manager para manejo seguro de credenciales
- **Payments**: Stripe API v2024-06-20 (checkout sessions + webhooks)
- **Email**: Nodemailer con SMTP (Gmail App Password)
- **Cron Jobs**: Cloud Scheduler para tareas automáticas

### Frontend
- **Framework**: Angular 20 (versión estable agosto 2025)
- **Features Modernas**: 
  - Zoneless mode (sin Zone.js)
  - Signals nativos para reactividad
  - Control Flow moderno (@if, @for)
  - toSignal, linkSignal
  - Standalone components
- **State Management**: NgRx Signal Store
- **Styling**: SCSS + Design Tokens + Tailwind utility classes limitadas
- **UI Components**: Lucide Icons + componentes custom
- **PWA**: Angular PWA con service workers y manifest
- **i18n**: Español e Inglés (ngx-translate)
- **Routing**: Angular Router con guards

### Base de Datos
- **Firestore Collections**:
  - `users/` - Usuarios y perfiles
  - `products/` - Catálogo de productos con variantes
  - `categories/` - Categorías y subcategorías
  - `carts/` - Carritos de compra (persistentes)
  - `orders/` - Órdenes con historial de estados
  - `wishlists/` - Listas de deseos por usuario
  - `coupons/` - Cupones y descuentos
  - `notifications/` - Notificaciones push
  - `analytics/` - Métricas de productos
  - `counters/` - Contadores para order numbers
- **Índices Compuestos**: 15 índices configurados para queries complejas
- **Security Rules**: Implementadas con validación estricta

### Auth
- **Firebase Authentication**:
  - Email/Password
  - Google OAuth
  - Facebook OAuth
- **Roles**: USER (cliente) y ADMIN (administrador local)
- **Guards**: Auth guard + Admin guard en Angular
- **Tokens**: Firebase ID tokens (automáticos, refresh cada 1h)

### Design System
- **Tipografía**: Inter (Google Fonts)
- **Paleta de Colores**:
  - **Neutral**: #000000 → #FFFFFF (10 tonos)
  - **Primary** (Verde oscuro): #00100D → #E6EAE9
  - **Secondary** (Verde olivo): #485318 → #FAF0EC
  - **Accent** (Morado): #392855 → #F6F1FE
- **Theme**: Light/Dark mode con CSS variables
- **Spacing**: Sistema de 4px base (1-24 pasos)
- **Border Radius**: sm(4px) → 2xl(24px)
- **Shadows**: 5 niveles de elevación

---

## 🏗️ Arquitectura-PatronesDiseño

### Arquitectura Principal
**Hexagonal Architecture** (Ports & Adapters)

```
┌─────────────────────────────────────┐
│   PRESENTATION (Angular UI)        │
│   Components, Pages, Guards        │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│   APPLICATION (Use Cases)           │
│   Facades, Signal Stores            │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│   DOMAIN (Core Business)            │
│   Entities, Value Objects, Ports   │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│   INFRASTRUCTURE (Adapters)         │
│   Firebase, Stripe, LocalStorage    │
└─────────────────────────────────────┘
```

### Patrones Implementados
1. **Repository Pattern** - Abstracción de Firestore
2. **Adapter Pattern** - Firebase/Stripe adapters
3. **Facade Pattern** - Simplificar use cases para UI
4. **Strategy Pattern** - Algoritmos de descuentos dinámicos
5. **Factory Pattern** - Creación de entidades Product
6. **Command Pattern** - Operaciones carrito con undo/redo
7. **Observer Pattern** - Signals para reactividad
8. **Singleton Pattern** - Theme, i18n, config services

### Bounded Contexts (Feature Modules)
- **auth** - Autenticación (login, register, profile)
- **catalog** - Productos (list, detail, search, filters)
- **cart** - Carrito de compras
- **wishlist** - Lista de deseos
- **checkout** - Proceso de pago
- **orders** - Gestión de órdenes
- **admin** - Panel administrativo

---

## 📋 Decisiones

### 1. Cloud Functions v2
- ✅ Migración completa de `functions.config()` a `defineSecret()/defineString()`
- ✅ Secrets en Secret Manager (producción)
- ✅ `.secret.local` para testing local
- ❌ NO usar `firebase functions:config:set` (deprecated)

### 2. Manejo de Pagos
- Stripe como pasarela única (mejor soporte MXN)
- Payment methods: Tarjeta, Transferencia, Contra entrega
- Webhooks para confirmación asíncrona
- Refunds habilitados para admin y usuarios

### 3. Gestión de Inventario
- Stock en tiempo real con Firestore listeners
- Reducción automática al confirmar pago
- Alertas de bajo stock a admins
- Threshold configurable por producto

### 4. Flujo de Órdenes
```
PENDING_PAYMENT → PAID → PROCESSING → SHIPPED → 
OUT_FOR_DELIVERY → DELIVERED
```
- Auto-ship después de 24h si hay stock
- Cliente confirma entrega manualmente
- Devoluciones vía email (no automáticas)

### 5. Carrito Persistente
- LocalStorage para sesión (guest users)
- Sync con Firestore para usuarios autenticados
- TTL de 30 días (limpieza automática)

### 6. Internacionalización
- Español e Inglés desde día 1
- Solo MXN (pesos mexicanos)
- Usuario selecciona idioma en preferencias

### 7. PWA y Performance
- Service workers para caché
- Lazy loading de módulos
- Imágenes optimizadas en Storage
- Bundle size target: <500KB gzipped

### 8. Security
- Firestore rules estrictas (owner-based)
- HTTPS obligatorio
- Secrets NUNCA en código
- Validación dual (backend + frontend)

---

## 🔐 Errores-Resueltos

### 1. Cloud Functions API Deprecated ✅
**Problema:** Warning de `functions.config()` deprecated  
**Solución:** Migración completa a v2
- Creado `params.ts` con `defineSecret()` y `defineString()`
- Configurados secretos: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `SMTP_USER`, `SMTP_PASSWORD`
- Actualizado código de todas las functions
**Archivos:** `f-tepizon/src/params.ts`, todas las functions

### 2. Secrets en Local vs Producción ✅
**Problema:** Necesitábamos diferentes secrets para dev/prod  
**Solución:**
- Producción: `firebase functions:secrets:set NOMBRE`
- Local: `.secret.local` (auto-detectado por emulators)
- Público: `.env` y `.env.local`
**Configurado:** `f-tepizon/.secret.local`, `f-tepizon/.gitignore`

### 3. Stripe Webhook Signature ✅
**Problema:** Webhooks requerían raw body para validación  
**Solución:** Uso de `req.rawBody` en Cloud Functions v2  
**Implementado:** `f-tepizon/src/payments/createPaymentIntent.ts` línea 87

### 4. Estructura Hexagonal ✅
**Problema:** Definir organización escalable  
**Solución:** Feature modules con 4 capas cada uno
```
features/
├── auth/
│   ├── domain/
│   ├── application/
│   ├── infrastructure/
│   └── presentation/
```

### 5. Firestore Composite Indexes ✅
**Problema:** Queries complejas sin índices fallaban  
**Solución:** 15 índices compuestos pre-configurados  
**Archivo:** `firestore.indexes.json`

### 6. TypeScript Strict Mode ✅
**Problema:** Errores con tipos `any`  
**Solución:**
- Strict mode en `tsconfig.json`
- Interfaces explícitas para todos los modelos
- Uso de `unknown` en lugar de `any`
**Configurado:** `f-tepizon/tsconfig.json`

### 7. Firebase Init Codebase Name ✅
**Problema:** Error "Invalid codebase name" al usar mayúsculas  
**Solución:** Usar solo lowercase: `f-tepizon`  
**Resultado:** Functions deployadas exitosamente

---

## 📈 Estado-Etapa-Avance

### ✅ FASE 1: DISEÑO Y ARQUITECTURA [100%]
- ✅ Estructura hexagonal definida
- ✅ Design System completo (tokens, colores, tipografía)
- ✅ Patrones documentados
- ✅ Modelos TypeScript (interfaces completas)
- ✅ Guía Stripe configuración
- ✅ Setup proyecto Angular

### ✅ FASE 2: BACKEND CON FIREBASE [100%]
- ✅ Firestore schema (10 colecciones)
- ✅ Security Rules implementadas
- ✅ 15 índices compuestos configurados
- ✅ **11 Cloud Functions DEPLOYADAS Y ACTIVAS:**

| Función | URL | Secrets | Estado |
|---------|-----|---------|--------|
| createPaymentIntent | `https://us-central1-tepizon-web.cloudfunctions.net/createPaymentIntent` | STRIPE_SECRET_KEY | ✅ ACTIVE |
| handleStripeWebhook | `https://us-central1-tepizon-web.cloudfunctions.net/handleStripeWebhook` | STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET | ✅ ACTIVE |
| processRefund | `https://us-central1-tepizon-web.cloudfunctions.net/processRefund` | STRIPE_SECRET_KEY | ✅ ACTIVE |
| onOrderCreated | `https://us-central1-tepizon-web.cloudfunctions.net/onOrderCreated` | - | ✅ ACTIVE |
| updateOrderStatus | `https://us-central1-tepizon-web.cloudfunctions.net/updateOrderStatus` | - | ✅ ACTIVE |
| scheduleOrderUpdates | `https://us-central1-tepizon-web.cloudfunctions.net/scheduleOrderUpdates` | - | ✅ ACTIVE |
| onProductUpdated | `https://us-central1-tepizon-web.cloudfunctions.net/onProductUpdated` | - | ✅ ACTIVE |
| cleanupExpiredCarts | `https://us-central1-tepizon-web.cloudfunctions.net/cleanupExpiredCarts` | - | ✅ ACTIVE |
| sendNotification | `https://us-central1-tepizon-web.cloudfunctions.net/sendNotification` | - | ✅ ACTIVE |
| trackProductView | `https://us-central1-tepizon-web.cloudfunctions.net/trackProductView` | - | ✅ ACTIVE |
| updateLastLogin | `https://us-central1-tepizon-web.cloudfunctions.net/updateLastLogin` | - | ✅ ACTIVE |

- ✅ Migración exitosa a Cloud Functions v2
- ✅ Secret Manager configurado
- ⚠️ **PENDIENTE:** Configurar Stripe Webhook endpoint

### 🔄 FASE 3: SERVICIOS Y APIS [0%] ← SIGUIENTE
- ❌ Firebase Auth Adapter
- ❌ Firebase Catalog Adapter
- ❌ Firebase Orders Adapter
- ❌ Firebase Cart Adapter
- ❌ Stripe Payment Adapter
- ❌ LocalStorage Adapter
- ❌ Repository Implementations
- ❌ Domain Services
- ❌ Use Cases (login, register, addToCart, etc.)
- ❌ Facades por módulo
- ❌ Tests unitarios de servicios

### ❌ FASE 4: FRONTEND COMPLETO [0%]
- ❌ Setup Angular app
- ❌ Design System components (Button, Card, Input, Modal, etc.)
- ❌ Layout (Header, Footer, Sidebar)
- ❌ Auth module (login, register, profile)
- ❌ Catalog module (list, detail, filters)
- ❌ Cart & Wishlist pages
- ❌ Checkout flow (3 steps)
- ❌ Order management
- ❌ Admin panel
- ❌ i18n implementation
- ❌ Theme switcher
- ❌ PWA config

### ❌ FASE 5: TESTING Y DEBUG [0%]
- ❌ Unit tests (Jest)
- ❌ Integration tests
- ❌ E2E tests (Cypress)
- ❌ Lighthouse audit (target: 90+)
- ❌ Security audit

### ❌ FASE 6: DEPLOY A PRODUCCIÓN [0%]
- ❌ Build optimizado
- ❌ Stripe modo live
- ❌ Dominio personalizado
- ❌ SSL/HTTPS
- ❌ Monitoring y alertas
- ❌ Documentación final

---

## 🎯 Siguiente-Paso-Inmediato

### Prioridad Alta (Hacer AHORA)
1. **Configurar Stripe Webhook** (5 min)
   ```bash
   # URL a configurar en Stripe Dashboard:
   https://us-central1-tepizon-web.cloudfunctions.net/handleStripeWebhook
   
   # Events: payment_intent.succeeded, payment_intent.payment_failed, charge.refunded
   # Luego actualizar secret:
   firebase functions:secrets:set STRIPE_WEBHOOK_SECRET
   ```

2. **Testear Functions Básicas** (15 min)
   - Crear colección de Postman
   - Testear createPaymentIntent
   - Testear updateOrderStatus
   - Verificar logs: `firebase functions:log --follow`

### Prioridad Media (Fase 3)
3. **Comenzar con Adapters** (Fase 3)
   - Crear `src/app/features/auth/infrastructure/adapters/firebase-auth.adapter.ts`
   - Implementar login, register, logout
   - Crear repositories
   - Crear use cases básicos

### Prioridad Baja (Después)
4. **Frontend Development** (Fase 4)
   - Setup Angular app completo
   - Design System components
   - Auth UI

---

## 📂 Estructura-Actual-Proyecto

```
D:\tepizon\tepizon-platform\
├── firebase.json
├── firestore.rules
├── firestore.indexes.json
├── storage.rules
├── .firebaserc
├── f-tepizon/                    ← Cloud Functions
│   ├── src/
│   │   ├── index.ts
│   │   ├── params.ts            ← defineSecret/defineString
│   │   ├── auth/
│   │   ├── payments/            ← Stripe integration
│   │   ├── orders/
│   │   ├── products/
│   │   ├── carts/
│   │   ├── notifications/
│   │   └── analytics/
│   ├── package.json
│   ├── tsconfig.json
│   ├── .env                     ← Public config
│   ├── .env.local               ← Local overrides
│   └── .secret.local            ← Local secrets (gitignored)
├── public/                       ← Hosting (temp)
└── CLAUDE_CONTEXT.md            ← Este archivo
```

---

## 🔗 URLs-Importantes

### Producción
- **Firebase Console:** https://console.firebase.google.com/project/tepizon-web
- **Functions Base URL:** `https://us-central1-tepizon-web.cloudfunctions.net/`
- **Firestore Console:** https://console.firebase.google.com/project/tepizon-web/firestore
- **Secret Manager:** https://console.cloud.google.com/security/secret-manager?project=tepizon-web
- **Stripe Dashboard:** https://dashboard.stripe.com (pendiente configurar webhook)

### Emuladores (Local)
- **Emulator UI:** http://localhost:4000
- **Auth Emulator:** http://localhost:9099
- **Firestore Emulator:** http://localhost:8080
- **Functions Emulator:** http://localhost:5001
- **Hosting Emulator:** http://localhost:5000
- **Storage Emulator:** http://localhost:9199

---

## 💻 Comandos-Útiles

### Functions
```bash
# Ver logs en tiempo real
firebase functions:log --follow

# Listar functions deployadas
firebase functions:list

# Deploy específico
firebase deploy --only functions:createPaymentIntent

# Configurar secret
firebase functions:secrets:set NOMBRE_SECRETO
```

### Emulators
```bash
# Iniciar todos
firebase emulators:start

# Solo functions
firebase emulators:start --only functions,firestore

# Con datos importados
firebase emulators:start --import=./emulator-data
```

### Firestore
```bash
# Deploy rules
firebase deploy --only firestore:rules

# Deploy indexes
firebase deploy --only firestore:indexes
```

---

## 📊 Métricas-Actuales

- **Functions Deployadas:** 11/11 ✅
- **Secrets Configurados:** 4/4 ✅
- **Firestore Collections:** 10 definidas
- **Security Rules:** Implementadas
- **Índices Compuestos:** 15 configurados
- **Runtime:** Node.js 22
- **Región:** us-central1
- **Estado General:** Backend 100% funcional

---

## 🎓 Referencias-Técnicas

- [Firebase Functions v2](https://firebase.google.com/docs/functions/v2)
- [Secret Manager](https://firebase.google.com/docs/functions/config-env)
- [defineSecret Docs](https://firebase.google.com/docs/reference/functions/2nd-gen/node/firebase-functions.params#definesecret)
- [Stripe API](https://stripe.com/docs/api)
- [Angular 20](https://angular.dev)
- [NgRx Signals](https://ngrx.io/guide/signals)
- [Firestore Best Practices](https://firebase.google.com/docs/firestore/best-practices)

---

**Última actualización:** Backend deployado - 11 functions ACTIVE  
**Última acción:** `firebase deploy --only functions` exitoso  
**Siguiente milestone:** Fase 3 - Adapters y Repositories  
**Progreso global:** 40% (2/6 fases + deployment verificado)