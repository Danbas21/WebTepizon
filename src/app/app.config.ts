import { ApplicationConfig, provideZonelessChangeDetection, importProvidersFrom } from '@angular/core';
import { provideRouter, withComponentInputBinding, withViewTransitions } from '@angular/router';
import { provideHttpClient, withInterceptors, withFetch } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideFirebaseApp, initializeApp } from '@angular/fire/app';
import { provideAuth, getAuth } from '@angular/fire/auth';
import { provideFirestore, getFirestore } from '@angular/fire/firestore';
import { provideStorage, getStorage } from '@angular/fire/storage';
import { WISHLIST_PROVIDERS } from './features/wishlist/wishlist.providers';
import { routes } from './app.routes';
import { environment } from '#env/environment';
import { authInterceptor, errorInterceptor } from '#core/interceptors';
import { provideClientHydration } from '@angular/platform-browser';

import { MAT_FORM_FIELD_DEFAULT_OPTIONS } from '@angular/material/form-field';
import { MAT_SNACK_BAR_DEFAULT_OPTIONS } from '@angular/material/snack-bar';
import { MAT_DATE_LOCALE, DateAdapter, MAT_DATE_FORMATS } from '@angular/material/core';

const firebaseConfig = {
  apiKey: "AIzaSyCrqH9QpXOZ8lFy51yZCclcOeTJhkL1iok",
  authDomain: "tepizon-web.firebaseapp.com",
  projectId: "tepizon-web",
  storageBucket: "tepizon-web.firebasestorage.app",
  messagingSenderId: "356932896799",
  appId: "1:356932896799:web:c6a71684633e2c3d01ad2a",
  measurementId: "G-CY6YZ7L5V5"
};


export const appConfig: ApplicationConfig = {
  providers: [
    provideZonelessChangeDetection(),
    provideRouter(routes, withComponentInputBinding(), withViewTransitions()),
    provideHttpClient(withFetch(), withInterceptors([authInterceptor, errorInterceptor])),
    provideFirebaseApp(() => initializeApp(environment.firebase)),
    provideAuth(() => getAuth()),
    provideAnimationsAsync(),
    provideFirestore(() => getFirestore()),
    provideStorage(() => getStorage()),
    provideFirebaseApp(() => initializeApp(environment.firebase)),
    provideFirestore(() => getFirestore()),
    provideClientHydration(),



    ...WISHLIST_PROVIDERS,


    {
      provide: MAT_FORM_FIELD_DEFAULT_OPTIONS,
      useValue: {
        appearance: 'outline', // 'fill' | 'outline'
        floatLabel: 'auto',
        subscriptSizing: 'fixed'
      }
    },

    // Snackbar configuration por defecto
    {
      provide: MAT_SNACK_BAR_DEFAULT_OPTIONS,
      useValue: {
        duration: 3000,
        horizontalPosition: 'end',
        verticalPosition: 'bottom'
      }
    },

    // Date locale (español - México)
    {
      provide: MAT_DATE_LOCALE,
      useValue: 'es-MX'
    },

    {
      provide: 'AuthRepositoryPort', // Token de inyección
      useClass: AuthRepositoryImpl,  // Implementación concreta
    },


  ]
};





/**
 * Configuración principal de la aplicación
 * 
 * Incluye:
 * - Zone.js disabled (zoneless mode)
 * - Router
 * - HttpClient con fetch API
 * - Firebase (Auth, Firestore, Storage)
 */

/**
 * Instrucciones de uso:
 * 
 * 1. Crea este archivo en: src/app/app.config.ts
 * 
 * 2. En main.ts, importa appConfig:
 * 
 * ```typescript
 * import { bootstrapApplication } from '@angular/platform-browser';
 * import { AppComponent } from './app/app.component';
 * import { appConfig } from './app/app.config';
 * 
 * bootstrapApplication(AppComponent, appConfig)
 *   .catch((err) => console.error(err));
 * ```
 * 
 * 3. Crea app.routes.ts con tus rutas:
 * 
 * ```typescript
 * import { Routes } from '@angular/router';
 * import { authGuard, adminGuard, guestGuard } from './features/auth/guards/auth.guards';
 * 
 * export const routes: Routes = [
 *   {
 *     path: '',
 *     redirectTo: '/catalog',
 *     pathMatch: 'full',
 *   },
 *   {
 *     path: 'auth',
 *     canActivate: [guestGuard],
 *     loadChildren: () => import('./features/auth/auth.routes').then(m => m.AUTH_ROUTES),
 *   },
 *   {
 *     path: 'catalog',
 *     loadChildren: () => import('./features/catalog/catalog.routes').then(m => m.CATALOG_ROUTES),
 *   },
 *   {
 *     path: 'admin',
 *     canActivate: [authGuard, adminGuard],
 *     loadChildren: () => import('./features/admin/admin.routes').then(m => m.ADMIN_ROUTES),
 *   },
 * ];
 * ```
 * 
 * 4. En AppComponent (standalone):
 * 
 * ```typescript
 * import { Component } from '@angular/core';
 * import { RouterOutlet } from '@angular/router';
 * 
 * @Component({
 *   selector: 'app-root',
 *   standalone: true,
 *   imports: [RouterOutlet],
 *   template: `
 *     <router-outlet />
 *   `,
 * })
 * export class AppComponent {}
 * ```
 */

/**
 * IMPORTANTE: Provider de AuthRepositoryPort
 * 
 * Para que funcione la inyección del repositorio, necesitas importar:
 */
import { AuthRepositoryPort } from './features/auth/domain/ports/auth.repository.port';
import { AuthRepositoryImpl } from './features/auth/infrastructure/repositories/auth.repository.impl';

/**
 * Nota sobre Zoneless Mode:
 * 
 * Angular 20 soporta zoneless mode, que es más eficiente que Zone.js.
 * Para habilitarlo completamente:
 * 
 * 1. En app.config.ts, usa:
 *    provideZoneChangeDetection({ eventCoalescing: true })
 * 
 * 2. En main.ts, remueve zone.js del polyfills:
 *    // Comentar o remover: import 'zone.js';
 * 
 * 3. Usar Signals en lugar de observables donde sea posible
 * 
 * 4. Para componentes que usan Observables, usar toSignal():
 *    readonly data = toSignal(this.service.data$);
 */

/**
 * Estructura de carpetas recomendada:
 * 
 * src/
 * ├── app/
 * │   ├── app.component.ts (standalone)
 * │   ├── app.config.ts (este archivo)
 * │   ├── app.routes.ts (rutas principales)
 * │   ├── features/
 * │   │   ├── auth/
 * │   │   │   ├── domain/
 * │   │   │   ├── application/
 * │   │   │   ├── infrastructure/
 * │   │   │   ├── presentation/
 * │   │   │   ├── guards/
 * │   │   │   └── auth.routes.ts
 * │   │   ├── catalog/
 * │   │   └── ...
 * │   ├── shared/
 * │   │   ├── components/
 * │   │   ├── directives/
 * │   │   └── pipes/
 * │   └── core/
 * │       ├── services/
 * │       └── interceptors/
 * ├── environments/
 * │   ├── environment.ts
 * │   └── environment.prod.ts
 * └── main.ts
 */