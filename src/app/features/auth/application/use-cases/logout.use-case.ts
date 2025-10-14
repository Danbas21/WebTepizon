/**
 * Logout Use Case
 * 
 * Orquesta el flujo de cierre de sesión.
 * Incluye limpieza de estado local y cierre de sesión en Firebase.
 * 
 * @pattern Use Case (Clean Architecture)
 */

import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthRepositoryPort } from '../../domain/ports/auth.repository.port';
import { AuthError, createAuthError } from '../../domain/models/auth-error.model';

export interface LogoutUseCaseInput {
  redirectTo?: string; // URL a donde redirigir después del logout
  clearLocalData?: boolean; // Si se debe limpiar localStorage/sessionStorage
}

export interface LogoutUseCaseOutput {
  success: boolean;
  error?: AuthError;
}

/**
 * Use Case para cerrar sesión
 * 
 * Flujo:
 * 1. Ejecutar logout a través del repositorio
 * 2. Limpiar datos locales si se solicita
 * 3. Redirigir si se especifica
 * 4. Retornar resultado
 */
@Injectable({
  providedIn: 'root',
})
export class LogoutUseCase {
  private readonly repository = inject(AuthRepositoryPort);
  private readonly router = inject(Router);

  /**
   * Ejecuta el caso de uso de logout
   * 
   * @param input - Opciones de logout
   * @returns Resultado del logout
   */
  async execute(input: LogoutUseCaseInput = {}): Promise<LogoutUseCaseOutput> {
    try {
      // 1. Ejecutar logout en Firebase
      await this.repository.logout();

      // 2. Limpiar datos locales si se solicita
      if (input.clearLocalData) {
        this.clearLocalData();
      }

      // 3. Redirigir si se especifica
      if (input.redirectTo) {
        await this.router.navigateByUrl(input.redirectTo);
      }

      // 4. Retornar éxito
      return {
        success: true,
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
   * Logout rápido con redirección al login
   * Versión simplificada para botones de logout
   */
  async quickLogout(): Promise<void> {
    await this.execute({
      redirectTo: '/auth/login',
      clearLocalData: true,
    });
  }

  /**
   * Logout silencioso sin redirección
   * Útil para operaciones en background
   */
  async silentLogout(): Promise<LogoutUseCaseOutput> {
    return this.execute({
      clearLocalData: true,
    });
  }

  /**
   * Limpia datos locales del usuario
   * Incluye localStorage y sessionStorage
   */
  private clearLocalData(): void {
    try {
      // Limpiar keys específicas (no todo el storage)
      const keysToRemove = [
        'auth_token',
        'user_preferences',
        'cart_temp',
        'last_visited_products',
      ];

      keysToRemove.forEach(key => {
        localStorage.removeItem(key);
        sessionStorage.removeItem(key);
      });

      console.log('Datos locales limpiados exitosamente');
    } catch (error) {
      console.error('Error limpiando datos locales:', error);
    }
  }

  /**
   * Verifica si el usuario puede cerrar sesión
   * Útil para validaciones antes de mostrar el botón de logout
   * 
   * @returns true si hay un usuario autenticado
   */
  canLogout(): boolean {
    return this.repository.isAuthenticated();
  }

  /**
   * Logout con confirmación
   * Retorna true si el usuario confirma, false si cancela
   * 
   * @param confirmMessage - Mensaje de confirmación personalizado
   * @returns true si se ejecutó el logout
   */
  async logoutWithConfirmation(
    confirmMessage = '¿Estás seguro de que deseas cerrar sesión?'
  ): Promise<boolean> {
    const confirmed = window.confirm(confirmMessage);
    
    if (!confirmed) {
      return false;
    }

    const result = await this.quickLogout();
    return true;
  }
}
