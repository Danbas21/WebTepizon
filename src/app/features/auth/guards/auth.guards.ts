/**
 * Auth Guards
 * 
 * Guards funcionales de Angular 20 para proteger rutas.
 * Incluye guards para autenticación y roles.
 * 
 * @pattern Guard (Angular Router)
 */

import { inject } from '@angular/core';
import { Router, CanActivateFn, UrlTree } from '@angular/router';
import { AuthFacade } from '../application/auth.facade';
import { map, take } from 'rxjs/operators';
import { Observable } from 'rxjs';

/**
 * Guard para rutas que requieren autenticación
 * Redirige a /auth/login si el usuario no está autenticado
 * 
 * @example
 * ```typescript
 * {
 *   path: 'profile',
 *   component: ProfileComponent,
 *   canActivate: [authGuard]
 * }
 * ```
 */
export const authGuard: CanActivateFn = (): boolean | UrlTree => {
  const authFacade = inject(AuthFacade);
  const router = inject(Router);

  const isAuthenticated = authFacade.isAuthenticated();
  const isLoading = authFacade.isLoading();

  // Si está cargando, esperar
  if (isLoading) {
    return true; // Temporalmente permitir, el effect en AuthFacade manejará el redirect
  }

  // Si no está autenticado, redirigir a login
  if (!isAuthenticated) {
    return router.createUrlTree(['/auth/login']);
  }

  return true;
};

/**
 * Guard para rutas que solo pueden acceder usuarios admin
 * Redirige a /catalog si el usuario no es admin
 * 
 * @example
 * ```typescript
 * {
 *   path: 'admin',
 *   component: AdminComponent,
 *   canActivate: [authGuard, adminGuard]
 * }
 * ```
 */
export const adminGuard: CanActivateFn = (): boolean | UrlTree => {
  const authFacade = inject(AuthFacade);
  const router = inject(Router);

  const isAdmin = authFacade.isAdmin();
  const isAuthenticated = authFacade.isAuthenticated();

  // Si no está autenticado, redirigir a login
  if (!isAuthenticated) {
    return router.createUrlTree(['/auth/login']);
  }

  // Si no es admin, redirigir a catalog
  if (!isAdmin) {
    return router.createUrlTree(['/catalog']);
  }

  return true;
};

/**
 * Guard para rutas que solo pueden acceder usuarios con email verificado
 * Redirige a /auth/verify-email si el email no está verificado
 * 
 * @example
 * ```typescript
 * {
 *   path: 'checkout',
 *   component: CheckoutComponent,
 *   canActivate: [authGuard, emailVerifiedGuard]
 * }
 * ```
 */
export const emailVerifiedGuard: CanActivateFn = (): boolean | UrlTree => {
  const authFacade = inject(AuthFacade);
  const router = inject(Router);

  const isEmailVerified = authFacade.isEmailVerified();
  const isAuthenticated = authFacade.isAuthenticated();

  // Si no está autenticado, redirigir a login
  if (!isAuthenticated) {
    return router.createUrlTree(['/auth/login']);
  }

  // Si el email no está verificado, redirigir a verify-email
  if (!isEmailVerified) {
    return router.createUrlTree(['/auth/verify-email']);
  }

  return true;
};

/**
 * Guard para rutas que solo pueden acceder usuarios NO autenticados
 * Redirige a /catalog si el usuario ya está autenticado
 * Útil para login/register
 * 
 * @example
 * ```typescript
 * {
 *   path: 'login',
 *   component: LoginComponent,
 *   canActivate: [guestGuard]
 * }
 * ```
 */
export const guestGuard: CanActivateFn = (): boolean | UrlTree => {
  const authFacade = inject(AuthFacade);
  const router = inject(Router);

  const isAuthenticated = authFacade.isAuthenticated();
  const isLoading = authFacade.isLoading();

  // Si está cargando, esperar
  if (isLoading) {
    return true;
  }

  // Si ya está autenticado, redirigir a catalog
  if (isAuthenticated) {
    return router.createUrlTree(['/catalog']);
  }

  return true;
};

/**
 * Guard para verificar si el usuario puede acceder a checkout
 * Verifica autenticación y email verificado
 * 
 * @example
 * ```typescript
 * {
 *   path: 'checkout',
 *   component: CheckoutComponent,
 *   canActivate: [checkoutGuard]
 * }
 * ```
 */
export const checkoutGuard: CanActivateFn = (): boolean | UrlTree => {
  const authFacade = inject(AuthFacade);
  const router = inject(Router);

  const isAuthenticated = authFacade.isAuthenticated();
  const isEmailVerified = authFacade.isEmailVerified();

  // Si no está autenticado, redirigir a login con returnUrl
  if (!isAuthenticated) {
    return router.createUrlTree(['/auth/login'], {
      queryParams: { returnUrl: '/checkout' },
    });
  }

  // Si el email no está verificado, redirigir a verify-email
  if (!isEmailVerified) {
    return router.createUrlTree(['/auth/verify-email'], {
      queryParams: { returnUrl: '/checkout' },
    });
  }

  return true;
};

/**
 * Guard para manejo de redirect después de login
 * Redirige al usuario a la URL guardada en queryParams después de login exitoso
 */
export const redirectAfterLoginGuard: CanActivateFn = (): boolean | UrlTree => {
  const authFacade = inject(AuthFacade);
  const router = inject(Router);

  const isAuthenticated = authFacade.isAuthenticated();

  if (isAuthenticated) {
    // Obtener returnUrl de queryParams
    const returnUrl = router.parseUrl(router.url).queryParams['returnUrl'];
    
    if (returnUrl) {
      return router.createUrlTree([returnUrl]);
    }

    // Si no hay returnUrl, redirigir según rol
    if (authFacade.isAdmin()) {
      return router.createUrlTree(['/admin']);
    }

    return router.createUrlTree(['/catalog']);
  }

  return true;
};
