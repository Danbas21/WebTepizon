/**
 * Register Use Case
 * 
 * Orquesta el flujo de registro de nuevos usuarios.
 * Incluye validaciones de dominio, creación de usuario y envío de email de verificación.
 * 
 * @pattern Use Case (Clean Architecture)
 */

import { Injectable, inject } from '@angular/core';
import { AuthRepositoryPort, RegisterData } from '../../domain/ports/auth.repository.port';
import { User } from '../../domain/models/user.model';
import { AuthDomainService } from '../../domain/services/auth.domain.service';
import { AuthError, createAuthError } from '../../domain/models/auth-error.model';

export interface RegisterUseCaseInput {
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  phone?: string;
  acceptTerms: boolean;
}

export interface RegisterUseCaseOutput {
  success: boolean;
  user?: User;
  error?: AuthError;
  verificationEmailSent?: boolean;
}

/**
 * Use Case para registro de nuevos usuarios
 * 
 * Flujo:
 * 1. Validar términos y condiciones
 * 2. Validar que las contraseñas coincidan
 * 3. Validar datos con el dominio
 * 4. Ejecutar registro a través del repositorio
 * 5. Email de verificación ya se envía automáticamente en el adapter
 * 6. Retornar resultado
 */
@Injectable({
  providedIn: 'root',
})
export class RegisterUseCase {
  private readonly repository = inject(AuthRepositoryPort);
  private readonly domainService = inject(AuthDomainService);

  /**
   * Ejecuta el caso de uso de registro
   * 
   * @param input - Datos de registro
   * @returns Resultado del registro con usuario o error
   */
  async execute(input: RegisterUseCaseInput): Promise<RegisterUseCaseOutput> {
    try {
      // 1. Validar términos y condiciones
      if (!input.acceptTerms) {
        return {
          success: false,
          error: new AuthError({
            code: 'INVALID_EMAIL' as any, // Reutilizamos el código
            message: 'Debes aceptar los términos y condiciones',
            timestamp: new Date(),
          }),
        };
      }

      // 2. Validar que las contraseñas coincidan
      if (input.password !== input.confirmPassword) {
        return {
          success: false,
          error: new AuthError({
            code: 'WEAK_PASSWORD' as any,
            message: 'Las contraseñas no coinciden',
            timestamp: new Date(),
          }),
        };
      }

      // 3. Sanitizar email
      const sanitizedEmail = this.domainService.sanitizeEmail(input.email);

      // 4. Crear datos de registro
      const registerData: RegisterData = {
        email: sanitizedEmail,
        password: input.password,
        firstName: input.firstName.trim(),
        lastName: input.lastName.trim(),
        phone: input.phone?.trim(),
      };

      // 5. Validar datos con el dominio
      this.domainService.validateRegistrationData(registerData);

      // 6. Ejecutar registro
      // El adapter ya envía el email de verificación automáticamente
      const user = await this.repository.register(registerData);

      // 7. Retornar éxito
      return {
        success: true,
        user,
        verificationEmailSent: true,
      };
    } catch (error) {
      // Convertir a AuthError si no lo es
      const authError = createAuthError(error);

      return {
        success: false,
        error: authError,
        verificationEmailSent: false,
      };
    }
  }

  /**
   * Valida los datos de registro sin ejecutar el registro
   * Útil para validaciones en tiempo real en el formulario
   * 
   * @param input - Datos a validar
   * @returns Objeto con resultado de validación
   */
  validateRegistrationData(input: RegisterUseCaseInput): {
    valid: boolean;
    errors: { [key: string]: string };
  } {
    const errors: { [key: string]: string } = {};

    // Validar términos
    if (!input.acceptTerms) {
      errors['acceptTerms'] = 'Debes aceptar los términos y condiciones';
    }

    // Validar email
    if (!this.domainService.validateEmail(input.email)) {
      errors['email'] = 'El correo electrónico no es válido';
    }

    // Validar contraseña
    const passwordValidation = this.domainService.validatePassword(input.password);
    if (!passwordValidation.isValid) {
      errors['password'] = passwordValidation.message || 'La contraseña no es válida';
    }

    // Validar confirmación de contraseña
    if (input.password !== input.confirmPassword) {
      errors['confirmPassword'] = 'Las contraseñas no coinciden';
    }

    // Validar nombres
    if (!input.firstName || input.firstName.trim().length < 2) {
      errors['firstName'] = 'El nombre debe tener al menos 2 caracteres';
    }

    if (!input.lastName || input.lastName.trim().length < 2) {
      errors['lastName'] = 'El apellido debe tener al menos 2 caracteres';
    }

    // Validar teléfono (opcional)
    if (input.phone && input.phone.length > 0) {
      const phoneRegex = /^[0-9]{10}$/;
      if (!phoneRegex.test(input.phone.replace(/\D/g, ''))) {
        errors['phone'] = 'El teléfono debe tener 10 dígitos';
      }
    }

    return {
      valid: Object.keys(errors).length === 0,
      errors,
    };
  }

  /**
   * Reenvía el email de verificación
   * 
   * @returns true si se envió exitosamente
   */
  async resendVerificationEmail(): Promise<boolean> {
    try {
      await this.repository.sendEmailVerification();
      return true;
    } catch (error) {
      console.error('Error reenviando email de verificación:', error);
      return false;
    }
  }
}
