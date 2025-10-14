/**
 * Auth Repository Implementation
 * 
 * Implementación concreta del puerto AuthRepositoryPort.
 * Delega las operaciones al FirebaseAuthAdapter y expone el contrato del dominio.
 * 
 * @pattern Repository (Hexagonal Architecture)
 */

import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import {
  AuthRepositoryPort,
  LoginCredentials,
  RegisterData,
  AuthState,
} from '../../domain/ports/auth.repository.port';
import { User } from '../../domain/models/user.model';
import { AuthToken } from '../../domain/models/auth-token.model';
import { FirebaseAuthAdapter } from '../adapters/firebase-auth.adapter';

/**
 * Implementación del repositorio de autenticación
 * 
 * Esta clase actúa como un puente entre el dominio y la infraestructura.
 * Todas las operaciones se delegan al adapter de Firebase.
 */
@Injectable({
  providedIn: 'root',
})
export class AuthRepositoryImpl extends AuthRepositoryPort {
  private readonly adapter = inject(FirebaseAuthAdapter);

  /**
   * Observable del estado de autenticación
   */
  override get authState$(): Observable<AuthState> {
    return this.adapter.authState$;
  }

  /**
   * Login con email y contraseña
   */
  override async login(credentials: LoginCredentials): Promise<User> {
    return this.adapter.login(credentials);
  }

  /**
   * Registro de nuevo usuario
   */
  override async register(data: RegisterData): Promise<User> {
    return this.adapter.register(data);
  }

  /**
   * Login con Google (redirect)
   */
  override async loginWithGoogle(): Promise<void> {
    return this.adapter.loginWithGoogle();
  }

  /**
   * Obtiene el resultado del redirect de Google
   */
  override async getRedirectResult(): Promise<User | null> {
    return this.adapter.getRedirectResult();
  }

  /**
   * Cierra sesión
   */
  override async logout(): Promise<void> {
    return this.adapter.logout();
  }

  /**
   * Obtiene el usuario actual
   */
  override async getCurrentUser(): Promise<User | null> {
    return this.adapter.getCurrentUser();
  }

  /**
   * Obtiene el token actual
   */
  override async getToken(forceRefresh = false): Promise<AuthToken | null> {
    return this.adapter.getToken(forceRefresh);
  }

  /**
   * Renueva el token
   */
  override async refreshToken(): Promise<AuthToken> {
    return this.adapter.refreshToken();
  }

  /**
   * Envía email de verificación
   */
  override async sendEmailVerification(): Promise<void> {
    return this.adapter.sendEmailVerification();
  }

  /**
   * Envía email para resetear contraseña
   */
  override async sendPasswordResetEmail(email: string): Promise<void> {
    return this.adapter.sendPasswordResetEmail(email);
  }

  /**
   * Actualiza el perfil del usuario
   */
  override async updateProfile(updates: Partial<User['profile']>): Promise<User> {
    return this.adapter.updateProfile(updates);
  }

  /**
   * Verifica si hay un usuario autenticado (síncrono)
   */
  override isAuthenticated(): boolean {
    return this.adapter.isAuthenticated();
  }
}
