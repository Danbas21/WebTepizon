# 🛍️ Tepizon Platform

> E-Commerce multi-categoría construido con Angular 20 + Firebase

[![Firebase](https://img.shields.io/badge/Firebase-11_Functions-orange?logo=firebase)](https://console.firebase.google.com/project/tepizon-web)
[![Angular](https://img.shields.io/badge/Angular-20-red?logo=angular)](https://angular.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.4-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Stripe](https://img.shields.io/badge/Stripe-Payments-purple?logo=stripe)](https://stripe.com)
[![License](https://img.shields.io/badge/License-Private-red)]()

---

## 📋 Tabla de Contenidos

- [Sobre el Proyecto](#sobre-el-proyecto)
- [Stack Tecnológico](#stack-tecnológico)
- [Características](#características)
- [Estructura del Proyecto](#estructura-del-proyecto)
- [Instalación](#instalación)
- [Desarrollo](#desarrollo)
- [Deployment](#deployment)
- [Testing](#testing)
- [Arquitectura](#arquitectura)
- [Contribuir](#contribuir)
- [Roadmap](#roadmap)

---

## 🎯 Sobre el Proyecto

**Tepizon Platform** es una plataforma e-commerce moderna diseñada para venta de artículos diversos: ropa, deportes, hogar y decoración.

### Características Principales

✅ **Catálogo Dinámico** - Productos con variantes (tallas, colores)  
✅ **Carrito Persistente** - Sincronización en tiempo real  
✅ **Pagos Seguros** - Integración con Stripe  
✅ **Gestión de Órdenes** - Seguimiento en tiempo real  
✅ **PWA** - Funciona offline  
✅ **Multi-idioma** - Español e Inglés  
✅ **Responsive** - Mobile-first design  

---

## 🛠️ Stack Tecnológico

### Frontend
- **Framework:** Angular 20 (Zoneless, Signals, Control Flow moderno)
- **State:** NgRx Signal Store
- **Estilos:** SCSS + Design Tokens + Tailwind utilities
- **UI:** Lucide Icons + Custom components
- **i18n:** ngx-translate

### Backend
- **Runtime:** Firebase Cloud Functions v2 (Node.js 22)
- **Database:** Firestore (NoSQL)
- **Auth:** Firebase Authentication
- **Storage:** Firebase Storage
- **Payments:** Stripe API
- **Secrets:** Google Cloud Secret Manager

### DevOps
- **Hosting:** Firebase Hosting
- **CI/CD:** GitHub Actions (pendiente)
- **Monitoring:** Firebase Performance + Analytics
- **Testing:** Jest + Cypress

---

## 🚀 Características

### Para Clientes

- 🔍 **Búsqueda Avanzada** - Filtros por categoría, precio, rating
- 🛒 **Carrito Inteligente** - Persistencia automática
- ❤️ **Wishlist** - Guardar productos favoritos
- 💳 **Múltiples Pagos** - Tarjeta, transferencia, contra entrega
- 📦 **Seguimiento** - Estado de orden en tiempo real
- ⭐ **Reseñas** - Sistema de calificaciones
- 🎟️ **Cupones** - Descuentos aplicables
- 🔔 **Notificaciones** - Actualizaciones push

### Para Administradores

- 📊 **Dashboard** - Métricas y analytics
- 📦 **Gestión de Productos** - CRUD completo
- 📋 **Gestión de Órdenes** - Actualizar estados
- 👥 **Gestión de Usuarios** - Roles y permisos
- 💰 **Cupones** - Crear y gestionar descuentos
- 📈 **Analytics** - Productos más vendidos

---

## 📁 Estructura del Proyecto

```
tepizon-platform/
├── f-tepizon/                      # Cloud Functions
│   ├── src/
│   │   ├── index.ts               # Export de functions
│   │   ├── params.ts              # Secrets y config
│   │   ├── auth/                  # Authentication
│   │   ├── payments/              # Stripe integration
│   │   ├── orders/                # Order management
│   │   ├── products/              # Product management
│   │   ├── carts/                 # Cart operations
│   │   ├── notifications/         # Push notifications
│   │   └── analytics/             # Product tracking
│   ├── .env                       # Public config
│   ├── .secret.local              # Local secrets (gitignored)
│   └── package.json
│
├── src/                            # Angular app (pendiente Fase 4)
│   └── app/
│       ├── core/                  # Singleton services
│       ├── shared/                # Shared components
│       └── features/              # Feature modules
│           ├── auth/
│           ├── catalog/
│           ├── cart/
│           ├── checkout/
│           ├── orders/
│           └── admin/
│
├── firestore.rules                # Security rules
├── firestore.indexes.json         # Composite indexes
├── storage.rules                  # Storage rules
├── firebase.json                  # Firebase config
├── CLAUDE_CONTEXT.md             # Contexto del proyecto
└── README.md                      # Este archivo
```

---

## 🔧 Instalación

### Prerequisitos

```bash
node >= 18.0.0
npm >= 9.0.0
firebase-tools >= 13.0.0
```

### Setup

```bash
# Clonar repositorio
git clone https://github.com/tu-usuario/tepizon-platform.git
cd tepizon-platform

# Instalar Firebase CLI
npm install -g firebase-tools

# Login a Firebase
firebase login

# Instalar dependencias de functions
cd f-tepizon
npm install

# Crear archivo de secrets local
cp .secret.local.example .secret.local
# Editar .secret.local con tus valores

# Compilar functions
npm run build
```

---

## 💻 Desarrollo

### Iniciar Emuladores

```bash
# Desde la raíz del proyecto
firebase emulators:start

# Acceder a:
# - Emulator UI: http://localhost:4000
# - Auth: http://localhost:9099
# - Firestore: http://localhost:8080
# - Functions: http://localhost:5001
```

### Compilar Functions

```bash
cd f-tepizon

# Build una vez
npm run build

# Watch mode
npm run build:watch
```

### Ver Logs

```bash
# Logs en tiempo real
firebase functions:log --follow

# Logs de función específica
firebase functions:log --only createPaymentIntent
```

---

## 🚢 Deployment

### Prerequisitos

1. **Configurar Secrets:**
```bash
firebase functions:secrets:set STRIPE_SECRET_KEY
firebase functions:secrets:set STRIPE_WEBHOOK_SECRET
firebase functions:secrets:set SMTP_USER
firebase functions:secrets:set SMTP_PASSWORD
```

2. **Verificar Firestore:**
```bash
firebase deploy --only firestore:rules
firebase deploy --only firestore:indexes
```

### Deploy Completo

```bash
# Deploy todo
firebase deploy

# O por partes:
firebase deploy --only functions
firebase deploy --only hosting
firebase deploy --only firestore
```

### Deploy Selectivo

```bash
# Solo una función
firebase deploy --only functions:createPaymentIntent

# Grupo de funciones
firebase deploy --only functions:payments
```

---

## 🧪 Testing

### Unit Tests

```bash
cd f-tepizon
npm test
```

### E2E Tests

```bash
npm run test:e2e
```

### Performance

```bash
npm run lighthouse
```

---

## 🏗️ Arquitectura

### Hexagonal Architecture (Ports & Adapters)

```
┌─────────────────────────────────────┐
│   PRESENTATION LAYER                │
│   Angular Components & Pages        │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│   APPLICATION LAYER                 │
│   Use Cases & Facades               │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│   DOMAIN LAYER                      │
│   Business Logic & Entities         │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│   INFRASTRUCTURE LAYER              │
│   Firebase, Stripe, Storage         │
└─────────────────────────────────────┘
```

### Patrones Implementados

- **Repository Pattern** - Abstracción de datos
- **Adapter Pattern** - Integración externa
- **Facade Pattern** - Simplificación de APIs
- **Strategy Pattern** - Descuentos dinámicos
- **Factory Pattern** - Creación de entidades
- **Observer Pattern** - Reactive state

### Cloud Functions

| Función | Tipo | Trigger | Secrets |
|---------|------|---------|---------|
| createPaymentIntent | Callable | HTTP | STRIPE_SECRET_KEY |
| handleStripeWebhook | HTTP | Webhook | STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET |
| processRefund | Callable | HTTP | STRIPE_SECRET_KEY |
| onOrderCreated | Background | Firestore | - |
| updateOrderStatus | Callable | HTTP | - |
| scheduleOrderUpdates | Scheduled | Cron (1h) | - |
| onProductUpdated | Background | Firestore | - |
| cleanupExpiredCarts | Scheduled | Cron (daily) | - |
| sendNotification | Callable | HTTP | - |
| trackProductView | Callable | HTTP | - |
| updateLastLogin | Callable | HTTP | - |

---

## 🤝 Contribuir

### Workflow

1. Fork el proyecto
2. Crear feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit cambios (`git commit -m 'Add AmazingFeature'`)
4. Push a branch (`git push origin feature/AmazingFeature`)
5. Abrir Pull Request

### Coding Standards

- **TypeScript strict mode**
- **ESLint configurado**
- **Prettier para formato**
- **Commits semánticos** (feat, fix, docs, etc.)

### Code Style

```typescript
// ✅ Correcto
export class ProductService {
  constructor(private readonly repo: ProductRepository) {}

  async getProducts(): Promise<Product[]> {
    return this.repo.findAll();
  }
}

// ❌ Incorrecto
export class ProductService {
  constructor(private repo) {} // Sin tipos

  getProducts() { // Sin async/await ni tipos
    return this.repo.findAll();
  }
}
```

---

## 🗺️ Roadmap

### ✅ Fase 1: Diseño [COMPLETADA]
- Arquitectura definida
- Design System
- Modelos de datos

### ✅ Fase 2: Backend [COMPLETADA]
- 11 Cloud Functions deployadas
- Firestore configurado
- Stripe integrado
- Security rules

### 🔄 Fase 3: Adapters [EN DESARROLLO]
- [ ] Firebase Auth Adapter
- [ ] Firebase Catalog Adapter
- [ ] Firebase Orders Adapter
- [ ] Stripe Payment Adapter
- [ ] Repositories
- [ ] Use Cases
- [ ] Facades

### ❌ Fase 4: Frontend [PENDIENTE]
- [ ] Design System Components
- [ ] Auth Module UI
- [ ] Catalog Module UI
- [ ] Cart & Checkout UI
- [ ] Order Management UI
- [ ] Admin Panel

### ❌ Fase 5: Testing [PENDIENTE]
- [ ] Unit Tests
- [ ] E2E Tests
- [ ] Performance Tests
- [ ] Security Audit

### ❌ Fase 6: Producción [PENDIENTE]
- [ ] Dominio personalizado
- [ ] SSL/HTTPS
- [ ] CI/CD Pipeline
- [ ] Monitoring
- [ ] Analytics

---

## 📊 Estado del Proyecto

**Progreso Global:** 40% (2/6 fases completadas)

| Fase | Estado | Progreso |
|------|--------|----------|
| 1. Diseño | ✅ Completada | 100% |
| 2. Backend | ✅ Completada | 100% |
| 3. Adapters | 🔄 En desarrollo | 0% |
| 4. Frontend | ❌ Pendiente | 0% |
| 5. Testing | ❌ Pendiente | 0% |
| 6. Producción | ❌ Pendiente | 0% |

---

## 🔗 Links Útiles

- **Firebase Console:** [tepizon-web](https://console.firebase.google.com/project/tepizon-web)
- **Cloud Functions:** https://us-central1-tepizon-web.cloudfunctions.net/
- **Firestore:** [Database](https://console.firebase.google.com/project/tepizon-web/firestore)
- **Secret Manager:** [Secrets](https://console.cloud.google.com/security/secret-manager?project=tepizon-web)
- **Stripe Dashboard:** https://dashboard.stripe.com
- **Documentation:** [Docs](./CLAUDE_CONTEXT.md)

---

## 📞 Contacto

**Desarrollador:** [Tu Nombre]  
**Email:** adesezio@gmail.com  
**Project Link:** [GitHub Repository]

---

## 📝 Licencia

Este proyecto es privado y confidencial.

---

## 🙏 Agradecimientos

- [Firebase](https://firebase.google.com/)
- [Angular](https://angular.dev/)
- [Stripe](https://stripe.com/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Lucide Icons](https://lucide.dev/)

---

**Última actualización:** Backend deployado exitosamente  
**Versión:** 0.4.0  
**Estado:** En desarrollo activo