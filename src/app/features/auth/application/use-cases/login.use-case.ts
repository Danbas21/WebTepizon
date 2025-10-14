/**
 * Login Use Case
 * 
 * Orquesta el flujo de autenticación con email y contraseña.
 * Incluye validaciones de dominio y manejo de errores.
 * 
 * @pattern Use Case (Clean Architecture)
 */

import { Injectable, inject } from '@angular/core';
import { AuthRepositoryPort, LoginCredentials } from '../../domain/ports/auth.repository.port';
import { User } from '../../domain/models/user.model';
import { AuthDomainService } from '../../domain/services/auth.domain.service';
import { AuthError, AuthErrorCode, createAuthError } from '../../domain/models/auth-error.model';

export interface LoginUseCaseInput {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface LoginUseCaseOutput {
  success: boolean;
  user?: User;
  error?: AuthError;
}

/**
 * Use Case para login con email y contraseña
 * 
 * Flujo:
 * 1. Validar email
 * 2. Sanitizar datos
 * 3. Ejecutar login a través del repositorio
 * 4. Retornar resultado
 */
@Injectable({
  providedIn: 'root',
})
export class LoginUseCase {
  private readonly repository = inject(AuthRepositoryPort);
  private readonly domainService = inject(AuthDomainService);

  /**
   * Ejecuta el caso de uso de login
   * 
   * @param input - Credenciales de login
   * @returns Resultado del login con usuario o error
   */
  async execute(input: LoginUseCaseInput): Promise<LoginUseCaseOutput> {
    try {
      // 1. Validar email
      if (!this.domainService.validateEmail(input.email)) {
        return {
          success: false,
          error: new AuthError({
            code: AuthErrorCode.INVALID_EMAIL,
            message: 'El correo electrónico no es válido',
            timestamp: new Date(),
          }),
        };
      }

      // 2. Validar contraseña
      if (!input.password || input.password.length < 6) {
        return {
          success: false,
          error: new AuthError({
            code: AuthErrorCode.WEAK_PASSWORD,
            message: 'La contraseña debe tener al menos 6 caracteres',
            timestamp: new Date(),
          }),
        };
      }

      // 3. Sanitizar email
      const sanitizedEmail = this.domainService.sanitizeEmail(input.email);

      // 4. Crear credenciales
      const credentials: LoginCredentials = {
        email: sanitizedEmail,
        password: input.password,
      };

      // 5. Ejecutar login
      const user = await this.repository.login(credentials);

      // 6. Validar que el usuario esté activo
      if (!this.domainService.canMakePurchases(user)) {
        throw new AuthError({
          code: AuthErrorCode.USER_DISABLED,
          message: 'Tu cuenta no está activa. Por favor verifica tu correo electrónico',
          timestamp: new Date(),
        });
      }

      // 7. Retornar éxito
      return {
        success: true,
        user,
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
   * Valida las credenciales sin ejecutar el login
   * Útil para validaciones en tiempo real en el formulario
   * 
   * @param input - Credenciales a validar
   * @returns true si las credenciales son válidas
   */
  validateCredentials(input: LoginUseCaseInput): { valid: boolean; message?: string } {
    if (!this.domainService.validateEmail(input.email)) {
      return {
        valid: false,
        message: 'El correo electrónico no es válido',
      };
    }

    if (!input.password || input.password.length < 6) {
      return {
        valid: false,
        message: 'La contraseña debe tener al menos 6 caracteres',
      };
    }

    return { valid: true };
  }
}
