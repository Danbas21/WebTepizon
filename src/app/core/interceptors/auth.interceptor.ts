// ============================================================================
// AUTH INTERCEPTOR - TEPIZON PLATFORM
// ============================================================================
// Interceptor funcional para agregar token de autenticación a peticiones HTTP
// Angular 20 functional interceptors
// ============================================================================

import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

/**
 * Interceptor de Autenticación
 * 
 * Funcionalidad:
 * - Agrega el token JWT al header Authorization de todas las peticiones
 * - Solo se aplica a peticiones que van al backend API
 * - Formato: "Bearer {token}"
 * 
 * Uso en app.config.ts:
 * ```typescript
 * provideHttpClient(
 *   withFetch(),
 *   withInterceptors([authInterceptor])
 * )
 * ```
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  
  // Obtener token del AuthService
  const token = authService.getAuthToken();
  
  // Si no hay token, continuar sin modificar
  if (!token) {
    return next(req);
  }
  
  // URLs que no necesitan autenticación (whitelist)
  const publicUrls = [
    '/auth/login',
    '/auth/register',
    '/auth/forgot-password',
    '/public/',
  ];
  
  // Verificar si la URL es pública
  const isPublicUrl = publicUrls.some(url => req.url.includes(url));
  
  if (isPublicUrl) {
    return next(req);
  }
  
  // Clonar la petición y agregar el header Authorization
  const authReq = req.clone({
    setHeaders: {
      Authorization: `Bearer ${token}`
    }
  });
  
  return next(authReq);
};

/**
 * Interceptor para manejar errores de autenticación (401, 403)
 * 
 * Funcionalidad:
 * - Detecta errores 401 (Unauthorized)
 * - Detecta errores 403 (Forbidden)
 * - Limpia la sesión y redirige al login
 * - Muestra mensaje toast apropiado
 * 
 * Uso:
 * ```typescript
 * provideHttpClient(
 *   withFetch(),
 *   withInterceptors([authInterceptor, authErrorInterceptor])
 * )
 * ```
 */
export const authErrorInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  
  return next(req).pipe(
    // TODO: Implementar manejo de errores con catchError
    // catchError((error: HttpErrorResponse) => {
    //   if (error.status === 401) {
    //     // Token inválido o expirado
    //     authService.logout();
    //     toast.sessionExpired();
    //   } else if (error.status === 403) {
    //     // Sin permisos
    //     toast.error('No tienes permisos para realizar esta acción');
    //   }
    //   return throwError(() => error);
    // })
  );
};
