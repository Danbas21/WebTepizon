/**
 * Auth Facade
 * 
 * Simplifica el uso de los use cases de autenticación para la capa de presentación.
 * Expone un API simple usando Signals de Angular 20 para reactividad.
 * 
 * @pattern Facade (Gang of Four)
 * @layer Application
 */

import { Injectable, inject, signal, computed, effect } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';

import { AuthRepositoryPort } from '../domain/ports/auth.repository.port';
import { User, isAdmin } from '../domain/models/user.model';
import { AuthToken } from '../domain/models/auth-token.model';
import { AuthError } from '../domain/models/auth-error.model';

import { LoginUseCase, LoginUseCaseInput, LoginUseCaseOutput } from './use-cases/login.use-case';
import {
  RegisterUseCase,
  RegisterUseCaseInput,
  RegisterUseCaseOutput,
} from './use-cases/register.use-case';
import {
  SocialLoginUseCase,
  SocialLoginUseCaseOutput,
} from './use-cases/social-login.use-case';
import { LogoutUseCase } from './use-cases/logout.use-case';

/**
 * Facade de autenticación
 * 
 * Proporciona una API simple y reactiva para la UI:
 * - Signals para estado reactivo
 * - Métodos asíncronos para operaciones
 * - Computed signals para datos derivados
 * - Manejo de errores centralizado
 */
@Injectable({
  providedIn: 'root',
})
export class AuthFacade {
  // Inyección de dependencias
  private readonly repository = inject(AuthRepositoryPort);
  private readonly router = inject(Router);
  private readonly loginUseCase = inject(LoginUseCase);
  private readonly registerUseCase = inject(RegisterUseCase);
  private readonly socialLoginUseCase = inject(SocialLoginUseCase);
  private readonly logoutUseCase = inject(LogoutUseCase);

  // ==================== SIGNALS ====================

  /**
   * Estado de autenticación (desde Observable de Firebase)
   * Se actualiza automáticamente cuando cambia el estado en Firebase
   */
  private readonly authState = toSignal(this.repository.authState$, {
    initialValue: {
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: true,
    },
  });

  /**
   * Signal de loading para operaciones
   */
  private readonly operationLoading = signal(false);

  /**
   * Signal de error actual
   */
  private readonly currentError = signal<AuthError | null>(null);

  // ==================== COMPUTED SIGNALS ====================

  /**
   * Usuario actual (reactivo)
   */
  readonly user = computed(() => this.authState().user);

  /**
   * Token actual (reactivo)
   */
  readonly token = computed(() => this.authState().token);

  /**
   * Estado de autenticación (reactivo)
   */
  readonly isAuthenticated = computed(() => this.authState().isAuthenticated);

  /**
   * Estado de carga inicial (reactivo)
   */
  readonly isLoading = computed(() => this.authState().isLoading);

  /**
   * Estado de operación en curso (reactivo)
   */
  readonly isOperationLoading = computed(() => this.operationLoading());

  /**
   * Error actual (reactivo)
   */
  readonly error = computed(() => this.currentError());

  /**
   * Verifica si el usuario es admin (reactivo)
   */
  readonly isAdmin = computed(() => {
    const user = this.user();
    return user ? isAdmin(user) : false;
  });

  /**
   * Verifica si el email está verificado (reactivo)
   */
  readonly isEmailVerified = computed(() => {
    const user = this.user();
    return user ? user.emailVerified : false;
  });

  /**
   * Nombre completo del usuario (reactivo)
   */
  readonly userFullName = computed(() => {
    const user = this.user();
    if (!user) return null;
    return `${user.profile.firstName} ${user.profile.lastName}`.trim();
  });

  /**
   * Avatar del usuario (reactivo)
   */
  readonly userAvatar = computed(() => {
    const user = this.user();
    return user?.profile.avatar || null;
  });

  /**
   * Iniciales del usuario para avatar fallback (reactivo)
   */
  readonly userInitials = computed(() => {
    const user = this.user();
    if (!user) return '';
    const first = user.profile.firstName.charAt(0).toUpperCase();
    const last = user.profile.lastName.charAt(0).toUpperCase();
    return `${first}${last}`;
  });

  // ==================== CONSTRUCTOR ====================

  constructor() {
    // Effect para manejar el resultado de Google Redirect
    effect(() => {
      if (!this.isLoading()) {
        this.checkGoogleRedirectResult();
      }
    });
  }

  // ==================== MÉTODOS PÚBLICOS ====================

  /**
   * Login con email y contraseña
   */
  async login(input: LoginUseCaseInput): Promise<LoginUseCaseOutput> {
    this.operationLoading.set(true);
    this.currentError.set(null);

    try {
      const result = await this.loginUseCase.execute(input);

      if (result.success) {
        // Limpiar error
        this.currentError.set(null);
      } else {
        // Guardar error
        this.currentError.set(result.error || null);
      }

      return result;
    } finally {
      this.operationLoading.set(false);
    }
  }

  /**
   * Registro de nuevo usuario
   */
  async register(input: RegisterUseCaseInput): Promise<RegisterUseCaseOutput> {
    this.operationLoading.set(true);
    this.currentError.set(null);

    try {
      const result = await this.registerUseCase.execute(input);

      if (result.success) {
        this.currentError.set(null);
      } else {
        this.currentError.set(result.error || null);
      }

      return result;
    } finally {
      this.operationLoading.set(false);
    }
  }

  /**
   * Login con Google (redirect)
   */
  async loginWithGoogle(): Promise<void> {
    this.operationLoading.set(true);
    this.currentError.set(null);

    try {
      await this.socialLoginUseCase.initiateGoogleLogin();
      // El redirect ocurre, no llegamos aquí hasta que el usuario vuelva
    } catch (error) {
      this.currentError.set(error as AuthError);
      this.operationLoading.set(false);
    }
  }

  /**
   * Cierra sesión
   */
  async logout(redirectTo = '/auth/login'): Promise<void> {
    this.operationLoading.set(true);
    this.currentError.set(null);

    try {
      await this.logoutUseCase.execute({
        redirectTo,
        clearLocalData: true,
      });
    } catch (error) {
      this.currentError.set(error as AuthError);
    } finally {
      this.operationLoading.set(false);
    }
  }

  /**
   * Reenvía email de verificación
   */
  async resendVerificationEmail(): Promise<boolean> {
    this.operationLoading.set(true);
    this.currentError.set(null);

    try {
      const result = await this.registerUseCase.resendVerificationEmail();
      return result;
    } finally {
      this.operationLoading.set(false);
    }
  }

  /**
   * Envía email para resetear contraseña
   */
  async sendPasswordResetEmail(email: string): Promise<boolean> {
    this.operationLoading.set(true);
    this.currentError.set(null);

    try {
      await this.repository.sendPasswordResetEmail(email);
      return true;
    } catch (error) {
      this.currentError.set(error as AuthError);
      return false;
    } finally {
      this.operationLoading.set(false);
    }
  }

  /**
   * Actualiza el perfil del usuario
   */
  async updateProfile(updates: Partial<User['profile']>): Promise<boolean> {
    this.operationLoading.set(true);
    this.currentError.set(null);

    try {
      await this.repository.updateProfile(updates);
      return true;
    } catch (error) {
      this.currentError.set(error as AuthError);
      return false;
    } finally {
      this.operationLoading.set(false);
    }
  }

  /**
   * Obtiene un nuevo token (con refresh si es necesario)
   */
  async refreshToken(): Promise<AuthToken | null> {
    try {
      return await this.repository.refreshToken();
    } catch (error) {
      this.currentError.set(error as AuthError);
      return null;
    }
  }

  /**
   * Limpia el error actual
   */
  clearError(): void {
    this.currentError.set(null);
  }

  /**
   * Redirige al usuario según su rol
   */
  async navigateToDefaultRoute(): Promise<void> {
    if (this.isAdmin()) {
      await this.router.navigate(['/admin']);
    } else {
      await this.router.navigate(['/catalog']);
    }
  }

  /**
   * Verifica si el usuario tiene permisos para una ruta
   */
  canAccessRoute(requiredRole?: 'admin' | 'user'): boolean {
    if (!this.isAuthenticated()) return false;

    if (requiredRole === 'admin') {
      return this.isAdmin();
    }

    return true;
  }

  // ==================== MÉTODOS PRIVADOS ====================

  /**
   * Verifica si hay un resultado de Google Redirect pendiente
   */
  private async checkGoogleRedirectResult(): Promise<void> {
    try {
      const result = await this.socialLoginUseCase.handleGoogleRedirectResult();

      if (result.success && result.user) {
        // Login exitoso - redirigir
        await this.navigateToDefaultRoute();
      } else if (result.error) {
        this.currentError.set(result.error);
      }
    } catch (error) {
      console.error('Error procesando resultado de Google:', error);
    }
  }
}
