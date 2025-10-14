/**
 * Social Login Use Case
 * 
 * Orquesta el flujo de autenticación con Google usando redirect.
 * Maneja tanto el inicio del redirect como la captura del resultado.
 * 
 * @pattern Use Case (Clean Architecture)
 */

import { Injectable, inject } from '@angular/core';
import { AuthRepositoryPort } from '../../domain/ports/auth.repository.port';
import { User } from '../../domain/models/user.model';
import { AuthDomainService } from '../../domain/services/auth.domain.service';
import { AuthError, createAuthError } from '../../domain/models/auth-error.model';

export interface SocialLoginUseCaseOutput {
  success: boolean;
  user?: User;
  error?: AuthError;
  isNewUser?: boolean;
}

/**
 * Use Case para login con Google (redirect)
 * 
 * Flujo de inicio:
 * 1. Ejecutar redirect a Google
 * 
 * Flujo de captura:
 * 1. Obtener resultado del redirect
 * 2. Determinar si es usuario nuevo o existente
 * 3. Retornar resultado
 */
@Injectable({
  providedIn: 'root',
})
export class SocialLoginUseCase {
  private readonly repository = inject(AuthRepositoryPort);
  private readonly domainService = inject(AuthDomainService);

  /**
   * Inicia el flujo de login con Google
   * Redirige al usuario a la página de autenticación de Google
   * 
   * @throws AuthError si hay un problema iniciando el redirect
   */
  async initiateGoogleLogin(): Promise<void> {
    try {
      await this.repository.loginWithGoogle();
    } catch (error) {
      throw createAuthError(error);
    }
  }

  /**
   * Captura el resultado del redirect de Google
   * Debe llamarse en la página de destino después del redirect
   * 
   * @returns Resultado del login con usuario o error
   */
  async handleGoogleRedirectResult(): Promise<SocialLoginUseCaseOutput> {
    try {
      // 1. Obtener resultado del redirect
      const user = await this.repository.getRedirectResult();

      // 2. Si no hay resultado, no hay nada que hacer
      if (!user) {
        return {
          success: false,
          error: new AuthError({
            code: 'REDIRECT_CANCELLED' as any,
            message: 'No se completó el inicio de sesión con Google',
            timestamp: new Date(),
          }),
        };
      }

      // 3. Determinar si es usuario nuevo
      // Un usuario es nuevo si createdAt y updatedAt son muy cercanos (< 5 segundos)
      const isNewUser = this.isNewlyCreatedUser(user);

      // 4. Validar que el usuario esté activo
      if (!this.domainService.canMakePurchases(user)) {
        return {
          success: false,
          error: new AuthError({
            code: 'USER_DISABLED' as any,
            message: 'Tu cuenta no está activa',
            timestamp: new Date(),
          }),
        };
      }

      // 5. Retornar éxito
      return {
        success: true,
        user,
        isNewUser,
      };
    } catch (error) {
      // Convertir a AuthError si no lo es
      const authError = createAuthError(error);

      return {
        success: false,
        error: authError,
      };
    }
  }

  /**
   * Verifica si el usuario fue recién creado
   * Útil para mostrar onboarding a usuarios nuevos
   * 
   * @param user - Usuario a verificar
   * @returns true si el usuario fue creado hace menos de 5 segundos
   */
  private isNewlyCreatedUser(user: User): boolean {
    const createdAt = user.createdAt.getTime();
    const updatedAt = user.updatedAt.getTime();
    const diff = Math.abs(updatedAt - createdAt);
    
    // Si la diferencia es menor a 5 segundos, es usuario nuevo
    return diff < 5000;
  }

  /**
   * Verifica si hay un redirect pendiente de procesar
   * Útil para llamar en el constructor de componentes que manejan redirects
   * 
   * @returns true si hay un redirect pendiente
   */
  async hasRedirectPending(): Promise<boolean> {
    try {
      const user = await this.repository.getRedirectResult();
      return user !== null;
    } catch (error) {
      console.error('Error verificando redirect pendiente:', error);
      return false;
    }
  }

  /**
   * Cancela un redirect en progreso
   * Útil si el usuario decide no continuar con el login
   */
  cancelRedirect(): void {
    // El redirect ya se canceló si el usuario vuelve sin completar
    // Aquí podríamos limpiar algún estado local si fuera necesario
    console.log('Redirect de Google cancelado por el usuario');
  }
}
