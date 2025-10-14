/**
 * Auth Domain Service
 * 
 * Contiene la lógica de negocio relacionada con la autenticación.
 * Incluye validaciones, reglas de negocio y transformaciones de datos.
 * 
 * @domain Auth
 * @pattern Domain Service
 */

import { inject, Injectable } from '@angular/core';
import { User, UserRole, isActiveUser } from '../models/user.model';
import { AuthToken, isTokenExpired, isTokenExpiringSoon } from '../models/auth-token.model';
import { AuthError, AuthErrorCode, createAuthError } from '../models/auth-error.model';
import { RegisterData } from '../ports/auth.repository.port';

@Injectable({
  providedIn: 'root',
})
export class AuthDomainService {
  /**
   * Valida el formato de un email
   * 
   * @param email - Email a validar
   * @returns true si el email es válido
   */
  validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Valida la fortaleza de una contraseña
   * 
   * Reglas:
   * - Mínimo 6 caracteres (requerido por Firebase)
   * - Recomendado: 8+ caracteres con números y símbolos
   * 
   * @param password - Contraseña a validar
   * @returns Objeto con resultado de validación y mensaje
   */
  validatePassword(password: string): { isValid: boolean; message?: string } {
    if (!password || password.length < 6) {
      return {
        isValid: false,
        message: 'La contraseña debe tener al menos 6 caracteres',
      };
    }

    // Validación recomendada (no obligatoria)
    if (password.length < 8) {
      return {
        isValid: true,
        message: 'Recomendamos usar al menos 8 caracteres',
      };
    }

    const hasNumber = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    if (!hasNumber || !hasSpecialChar) {
      return {
        isValid: true,
        message: 'Recomendamos incluir números y símbolos para mayor seguridad',
      };
    }

    return { isValid: true };
  }

  /**
   * Valida los datos de registro
   * 
   * @param data - Datos a validar
   * @throws AuthError si los datos son inválidos
   */
  validateRegistrationData(data: RegisterData): void {
    // Validar email
    if (!this.validateEmail(data.email)) {
      throw new AuthError({
        code: AuthErrorCode.INVALID_EMAIL,
        message: 'El correo electrónico no es válido',
        timestamp: new Date(),
      });
    }

    // Validar contraseña
    const passwordValidation = this.validatePassword(data.password);
    if (!passwordValidation.isValid) {
      throw new AuthError({
        code: AuthErrorCode.WEAK_PASSWORD,
        message: passwordValidation.message || 'La contraseña no es válida',
        timestamp: new Date(),
      });
    }

    // Validar nombres
    if (!data.firstName || data.firstName.trim().length < 2) {
      throw new AuthError({
        code: AuthErrorCode.INVALID_EMAIL, // Reutilizamos este código
        message: 'El nombre debe tener al menos 2 caracteres',
        timestamp: new Date(),
      });
    }

    if (!data.lastName || data.lastName.trim().length < 2) {
      throw new AuthError({
        code: AuthErrorCode.INVALID_EMAIL,
        message: 'El apellido debe tener al menos 2 caracteres',
        timestamp: new Date(),
      });
    }

    // Validar teléfono (opcional)
    if (data.phone && data.phone.length > 0) {
      const phoneRegex = /^[0-9]{10}$/;
      if (!phoneRegex.test(data.phone.replace(/\D/g, ''))) {
        throw new AuthError({
          code: AuthErrorCode.INVALID_EMAIL,
          message: 'El teléfono debe tener 10 dígitos',
          timestamp: new Date(),
        });
      }
    }
  }

  /**
   * Verifica si un usuario puede acceder al panel de administración
   * 
   * @param user - Usuario a verificar
   * @returns true si el usuario es admin y está activo
   */
  canAccessAdmin(user: User | null): boolean {
    if (!user) return false;
    return user.role === UserRole.ADMIN && isActiveUser(user);
  }

  /**
   * Verifica si un usuario puede realizar compras
   * 
   * @param user - Usuario a verificar
   * @returns true si el usuario está activo y verificado
   */
  canMakePurchases(user: User | null): boolean {
    if (!user) return false;
    return isActiveUser(user);
  }

  /**
   * Verifica si un token necesita ser renovado
   * 
   * @param token - Token a verificar
   * @returns true si el token está expirado o próximo a expirar
   */
  shouldRefreshToken(token: AuthToken | null): boolean {
    if (!token) return false;
    return isTokenExpired(token) || isTokenExpiringSoon(token);
  }

  /**
   * Sanitiza el email removiendo espacios y convirtiendo a minúsculas
   * 
   * @param email - Email a sanitizar
   * @returns Email sanitizado
   */
  sanitizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }

  /**
   * Genera un nombre de usuario a partir del email
   * Útil para display si no hay firstName/lastName
   * 
   * @param email - Email del usuario
   * @returns Nombre de usuario generado
   */
  generateUsernameFromEmail(email: string): string {
    const localPart = email.split('@')[0];
    return localPart.charAt(0).toUpperCase() + localPart.slice(1);
  }

  /**
   * Calcula el tiempo de espera antes del próximo intento de login
   * después de múltiples intentos fallidos
   * 
   * @param attempts - Número de intentos fallidos
   * @returns Tiempo de espera en segundos
   */
  calculateLoginThrottleTime(attempts: number): number {
    // Backoff exponencial: 2^attempts segundos
    // Máximo 5 minutos (300 segundos)
    const throttleTime = Math.pow(2, attempts);
    return Math.min(throttleTime, 300);
  }

  /**
   * Verifica si dos usuarios son la misma entidad
   * 
   * @param user1 - Primer usuario
   * @param user2 - Segundo usuario
   * @returns true si son el mismo usuario
   */
  isSameUser(user1: User | null, user2: User | null): boolean {
    if (!user1 || !user2) return false;
    return user1.uid === user2.uid;
  }

  /**
   * Obtiene el nombre completo del usuario
   * 
   * @param user - Usuario
   * @returns Nombre completo o email si no hay nombre
   */
  getUserFullName(user: User): string {
    const { firstName, lastName } = user.profile;
    if (firstName && lastName) {
      return `${firstName} ${lastName}`;
    }
    if (firstName) {
      return firstName;
    }
    return this.generateUsernameFromEmail(user.email);
  }

  /**
   * Valida que un usuario tenga los permisos necesarios para una operación
   * 
   * @param user - Usuario a verificar
   * @param requiredRole - Rol requerido
   * @throws AuthError si el usuario no tiene permisos
   */
  requireRole(user: User | null, requiredRole: UserRole): void {
    if (!user) {
      throw new AuthError({
        code: AuthErrorCode.UNAUTHORIZED,
        message: 'Debes iniciar sesión para realizar esta acción',
        timestamp: new Date(),
      });
    }

    if (user.role !== requiredRole) {
      throw new AuthError({
        code: AuthErrorCode.UNAUTHORIZED,
        message: 'No tienes permisos para realizar esta acción',
        timestamp: new Date(),
      });
    }

    if (!isActiveUser(user)) {
      throw new AuthError({
        code: AuthErrorCode.USER_DISABLED,
        message: 'Tu cuenta no está activa. Verifica tu email',
        timestamp: new Date(),
      });
    }
  }

  /**
   * Limpia datos sensibles del usuario para logging
   * 
   * @param user - Usuario
   * @returns Usuario sin datos sensibles
   */
  sanitizeUserForLogging(user: User): Partial<User> {
    return {
      uid: user.uid,
      email: user.email.replace(/(.{2})(.*)(@.*)/, '$1***$3'),
      role: user.role,
      emailVerified: user.emailVerified,
      isActive: user.isActive,
      lastLoginAt: user.lastLoginAt,
    };
  }
}
