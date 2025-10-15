// ============================================================================
// AUTH GUARD - TEPIZON PLATFORM
// ============================================================================
// Guard funcional para proteger rutas que requieren autenticación
// Angular 20 functional guards
// ============================================================================

import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { ToastService } from '../services/toast.service';

/**
 * Guard para proteger rutas que requieren autenticación
 * 
 * Uso:
 * ```typescript
 * {
 *   path: 'profile',
 *   component: ProfileComponent,
 *   canActivate: [authGuard]
 * }
 * ```
 * 
 * Funcionalidad:
 * - Verifica si el usuario está autenticado
 * - Redirige a /auth/login si no está autenticado
 * - Muestra mensaje toast informativo
 * - Guarda la URL de destino para redirección post-login
 */
export const authGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const toast = inject(ToastService);
  
  // TODO: Verificar autenticación con AuthFacade o AuthService
  // const authService = inject(AuthService);
  // const isAuthenticated = authService.isAuthenticated();
  
  // Simulación - cambiar por verificación real
  const isAuthenticated = false; // authService.isAuthenticated();
  
  if (isAuthenticated) {
    return true;
  }
  
  // Guardar la URL de destino para redirección después del login
  const returnUrl = state.url;
  
  // Mostrar mensaje
  toast.info('Debes iniciar sesión para acceder a esta página');
  
  // Redirigir a login con returnUrl
  return router.createUrlTree(['/auth/login'], {
    queryParams: { returnUrl }
  });
};

/**
 * Guard para redirigir usuarios autenticados
 * Útil para páginas de login/register
 * 
 * Uso:
 * ```typescript
 * {
 *   path: 'login',
 *   component: LoginComponent,
 *   canActivate: [redirectIfAuthenticatedGuard]
 * }
 * ```
 */
export const redirectIfAuthenticatedGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  
  // TODO: Verificar autenticación
  // const authService = inject(AuthService);
  // const isAuthenticated = authService.isAuthenticated();
  
  // Simulación
  const isAuthenticated = false;
  
  if (isAuthenticated) {
    // Usuario ya está autenticado, redirigir al home
    return router.createUrlTree(['/']);
  }
  
  return true;
};

/**
 * Guard para verificar email verificado
 * Solo permite acceso si el email del usuario está verificado
 * 
 * Uso:
 * ```typescript
 * {
 *   path: 'premium',
 *   component: PremiumComponent,
 *   canActivate: [authGuard, emailVerifiedGuard]
 * }
 * ```
 */
export const emailVerifiedGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const toast = inject(ToastService);
  
  // TODO: Verificar email verificado
  // const authService = inject(AuthService);
  // const emailVerified = authService.currentUser()?.emailVerified;
  
  // Simulación
  const emailVerified = true;
  
  if (emailVerified) {
    return true;
  }
  
  // Mostrar mensaje
  toast.warning('Debes verificar tu email para acceder a esta función');
  
  // Redirigir a página de verificación o perfil
  return router.createUrlTree(['/profile']);
};

/**
 * Guard para roles/permisos específicos
 * Permite acceso solo a usuarios con roles específicos
 * 
 * Uso:
 * ```typescript
 * {
 *   path: 'admin',
 *   component: AdminComponent,
 *   canActivate: [authGuard, roleGuard],
 *   data: { roles: ['admin', 'superadmin'] }
 * }
 * ```
 */
export const roleGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const toast = inject(ToastService);
  
  // Obtener roles requeridos de la ruta
  const requiredRoles = route.data['roles'] as string[] || [];
  
  // TODO: Obtener rol del usuario actual
  // const authService = inject(AuthService);
  // const userRole = authService.currentUser()?.role;
  
  // Simulación
  const userRole = 'user';
  
  // Verificar si el usuario tiene alguno de los roles requeridos
  const hasRequiredRole = requiredRoles.includes(userRole);
  
  if (hasRequiredRole) {
    return true;
  }
  
  // Mostrar mensaje
  toast.error('No tienes permisos para acceder a esta página');
  
  // Redirigir al home
  return router.createUrlTree(['/']);
};
