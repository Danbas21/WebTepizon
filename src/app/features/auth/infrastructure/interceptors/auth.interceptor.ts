/**
 * Auth Interceptor
 * 
 * Interceptor funcional de Angular 20 para agregar el token de autenticación
 * automáticamente a todas las peticiones HTTP salientes.
 * 
 * @pattern Interceptor
 */

import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthFacade } from '../application/auth.facade';
import { switchMap, take, catchError } from 'rxjs/operators';
import { from, throwError } from 'rxjs';

/**
 * Interceptor para agregar el Authorization header con el token de Firebase
 * 
 * Características:
 * - Agrega el token automáticamente a todas las peticiones
 * - Excluye URLs públicas que no requieren autenticación
 * - Maneja errores de token expirado (intenta refresh)
 * - Compatible con zoneless mode (usa from() para convertir Promise)
 * 
 * @example
 * // En app.config.ts
 * provideHttpClient(
 *   withInterceptors([authInterceptor])
 * )
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authFacade = inject(AuthFacade);

  // URLs que no requieren autenticación
  const publicUrls = [
    '/auth/login',
    '/auth/register',
    '/auth/reset-password',
  ];

  // Si la URL es pública, continuar sin token
  if (publicUrls.some(url => req.url.includes(url))) {
    return next(req);
  }

  // Si no hay usuario autenticado, continuar sin token
  if (!authFacade.isAuthenticated()) {
    return next(req);
  }

  // Obtener el token actual (con refresh automático si es necesario)
  return from(authFacade.refreshToken()).pipe(
    take(1),
    switchMap(token => {
      if (!token) {
        // No hay token, continuar sin él
        return next(req);
      }

      // Clonar la request y agregar el token
      const authReq = req.clone({
        setHeaders: {
          Authorization: `Bearer ${token.idToken}`,
        },
      });

      return next(authReq);
    }),
    catchError(error => {
      // Error obteniendo token, continuar sin él
      console.error('Error en auth interceptor:', error);
      return next(req);
    })
  );
};

/**
 * Interceptor alternativo para Cloud Functions de Firebase
 * Usa el token de Firebase directamente sin necesidad de refresh
 */
export const firebaseFunctionsInterceptor: HttpInterceptorFn = (req, next) => {
  const authFacade = inject(AuthFacade);

  // Solo aplicar a URLs de Cloud Functions
  const cloudFunctionsBaseUrl = 'https://us-central1-tepizon-web.cloudfunctions.net';
  
  if (!req.url.startsWith(cloudFunctionsBaseUrl)) {
    return next(req);
  }

  // Obtener token actual
  const token = authFacade.token();

  if (!token) {
    // No hay token, continuar sin él
    return next(req);
  }

  // Clonar la request y agregar el token
  const authReq = req.clone({
    setHeaders: {
      Authorization: `Bearer ${token.idToken}`,
    },
  });

  return next(authReq);
};

/**
 * Configuración en app.config.ts:
 * 
 * ```typescript
 * import { provideHttpClient, withInterceptors } from '@angular/common/http';
 * import { authInterceptor, firebaseFunctionsInterceptor } from './features/auth/interceptors/auth.interceptor';
 * 
 * export const appConfig: ApplicationConfig = {
 *   providers: [
 *     provideHttpClient(
 *       withFetch(),
 *       withInterceptors([
 *         authInterceptor,              // Para APIs externas
 *         firebaseFunctionsInterceptor, // Para Cloud Functions
 *       ])
 *     ),
 *   ],
 * };
 * ```
 */
