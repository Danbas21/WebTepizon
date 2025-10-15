// ============================================================================
// APP ROUTES - TEPIZON PLATFORM
// ============================================================================
// Definición de rutas de la aplicación con lazy loading
// Angular 20 standalone routes
// ============================================================================

import { Routes } from '@angular/router';

/**
 * Rutas principales de la aplicación
 * 
 * Características:
 * - Lazy loading de módulos
 * - Guards para protección de rutas
 * - Títulos descriptivos
 * - Redirecciones
 */
export const routes: Routes = [
    // ==========================================================================
    // HOME
    // ==========================================================================
    {
        path: '',
        loadComponent: () => import('./features/home/home.component')
            .then(m => m.HomeComponent),
        title: 'Inicio - Tepizon'
    },

    // ==========================================================================
    // AUTH
    // ==========================================================================
    {
        path: 'auth',
        children: [
            {
                path: 'login',
                loadComponent: () => import('./features/auth/presentation/pages/login/login.component')
                    .then(m => m.LoginComponent),
                title: 'Iniciar Sesión - Tepizon'
            },
            {
                path: 'register',
                loadComponent: () => import('./features/auth/presentation/pages/register/register.component')
                    .then(m => m.RegisterComponent),
                title: 'Crear Cuenta - Tepizon'
            },
            {
                path: 'forgot-password',
                loadComponent: () => import('./features/auth/presentation/pages/forgot-password/forgot-password.component')
                    .then(m => m.ForgotPasswordComponent),
                title: 'Recuperar Contraseña - Tepizon'
            },
            {
                path: '',
                redirectTo: 'login',
                pathMatch: 'full'
            }
        ]
    },

    // ==========================================================================
    // PRODUCTS / CATALOG
    // ==========================================================================
    {
        path: 'products',
        children: [
            {
                path: '',
                loadComponent: () => import('./features/catalog/presentation/pages/product-list/product-list.component')
                    .then(m => m.ProductListComponent),
                title: 'Productos - Tepizon'
            },
            {
                path: ':id',
                loadComponent: () => import('./features/catalog/presentation/pages/product-detail/product-detail.component')
                    .then(m => m.ProductDetailComponent),
                title: 'Detalle del Producto - Tepizon'
            }
        ]
    },

    // ==========================================================================
    // CATEGORIES
    // ==========================================================================
    {
        path: 'categories',
        children: [
            {
                path: '',
                loadComponent: () => import('./features/catalog/presentation/pages/categories/categories.component')
                    .then(m => m.CategoriesComponent),
                title: 'Categorías - Tepizon'
            },
            {
                path: ':slug',
                loadComponent: () => import('./features/catalog/presentation/pages/category-products/category-products.component')
                    .then(m => m.CategoryProductsComponent),
                title: 'Categoría - Tepizon'
            }
        ]
    },

    // ==========================================================================
    // SEARCH
    // ==========================================================================
    {
        path: 'search',
        loadComponent: () => import('./features/catalog/presentation/pages/search-results/search-results.component')
            .then(m => m.SearchResultsComponent),
        title: 'Resultados de Búsqueda - Tepizon'
    },

    // ==========================================================================
    // CART
    // ==========================================================================
    {
        path: 'cart',
        loadComponent: () => import('./features/cart/presentation/pages/cart/cart.component')
            .then(m => m.CartComponent),
        title: 'Carrito de Compras - Tepizon'
    },

    // ==========================================================================
    // WISHLIST
    // ==========================================================================
    {
        path: 'wishlist',
        loadComponent: () => import('./features/wishlist/presentation/pages/wishlist/wishlist.component')
            .then(m => m.WishlistComponent),
        title: 'Lista de Deseos - Tepizon'
        // canActivate: [authGuard] // TODO: Agregar cuando esté listo
    },

    // ==========================================================================
    // CHECKOUT
    // ==========================================================================
    {
        path: 'checkout',
        loadComponent: () => import('./features/checkout/presentation/pages/checkout/checkout.component')
            .then(m => m.CheckoutComponent),
        title: 'Finalizar Compra - Tepizon'
        // canActivate: [authGuard] // TODO: Agregar cuando esté listo
    },

    // ==========================================================================
    // ORDERS
    // ==========================================================================
    {
        path: 'orders',
        // canActivate: [authGuard], // TODO: Agregar cuando esté listo
        children: [
            {
                path: '',
                loadComponent: () => import('./features/orders/presentation/pages/orders-list/orders-list.component')
                    .then(m => m.OrdersListComponent),
                title: 'Mis Órdenes - Tepizon'
            },
            {
                path: ':id',
                loadComponent: () => import('./features/orders/presentation/pages/order-detail/order-detail.component')
                    .then(m => m.OrderDetailComponent),
                title: 'Detalle de Orden - Tepizon'
            }
        ]
    },

    // ==========================================================================
    // USER PROFILE
    // ==========================================================================
    {
        path: 'profile',
        // canActivate: [authGuard], // TODO: Agregar cuando esté listo
        children: [
            {
                path: '',
                loadComponent: () => import('./features/auth/presentation/pages/profile/profile.component')
                    .then(m => m.ProfileComponent),
                title: 'Mi Perfil - Tepizon'
            },
            {
                path: 'addresses',
                loadComponent: () => import('./features/checkout/presentation/pages/addresses/addresses.component')
                    .then(m => m.AddressesComponent),
                title: 'Mis Direcciones - Tepizon'
            },
            {
                path: 'payment-methods',
                loadComponent: () => import('./features/checkout/presentation/pages/payment-methods/payment-methods.component')
                    .then(m => m.PaymentMethodsComponent),
                title: 'Mis Métodos de Pago - Tepizon'
            }
        ]
    },

    // ==========================================================================
    // DEALS / OFFERS
    // ==========================================================================
    {
        path: 'deals',
        loadComponent: () => import('./features/catalog/presentation/pages/deals/deals.component')
            .then(m => m.DealsComponent),
        title: 'Ofertas - Tepizon'
    },

    // ==========================================================================
    // STATIC PAGES
    // ==========================================================================
    {
        path: 'about',
        loadComponent: () => import('./features/static/pages/about/about.component')
            .then(m => m.AboutComponent),
        title: 'Acerca de Nosotros - Tepizon'
    },
    {
        path: 'contact',
        loadComponent: () => import('./features/static/pages/contact/contact.component')
            .then(m => m.ContactComponent),
        title: 'Contacto - Tepizon'
    },
    {
        path: 'help',
        loadComponent: () => import('./features/static/pages/help/help.component')
            .then(m => m.HelpComponent),
        title: 'Centro de Ayuda - Tepizon'
    },
    {
        path: 'shipping',
        loadComponent: () => import('./features/static/pages/shipping/shipping.component')
            .then(m => m.ShippingComponent),
        title: 'Información de Envíos - Tepizon'
    },
    {
        path: 'returns',
        loadComponent: () => import('./features/static/pages/returns/returns.component')
            .then(m => m.ReturnsComponent),
        title: 'Política de Devoluciones - Tepizon'
    },

    // ==========================================================================
    // LEGAL
    // ==========================================================================
    {
        path: 'terms',
        loadComponent: () => import('./features/static/pages/terms/terms.component')
            .then(m => m.TermsComponent),
        title: 'Términos y Condiciones - Tepizon'
    },
    {
        path: 'privacy',
        loadComponent: () => import('./features/static/pages/privacy/privacy.component')
            .then(m => m.PrivacyComponent),
        title: 'Política de Privacidad - Tepizon'
    },
    {
        path: 'cookies',
        loadComponent: () => import('./features/static/pages/cookies/cookies.component')
            .then(m => m.CookiesComponent),
        title: 'Política de Cookies - Tepizon'
    },

    // ==========================================================================
    // ERROR PAGES
    // ==========================================================================
    {
        path: '404',
        loadComponent: () => import('./shared/components/not-found/not-found.component')
            .then(m => m.NotFoundComponent),
        title: 'Página No Encontrada - Tepizon'
    },

    // ==========================================================================
    // WILDCARD (debe ser la última)
    // ==========================================================================
    {
        path: '**',
        redirectTo: '404'
    }
];
