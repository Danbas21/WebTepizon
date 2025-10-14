/**
 * Auth Repository Port
 * 
 * Define el contrato que deben cumplir las implementaciones del repositorio
 * de autenticación. Esta es la interfaz entre el dominio y la infraestructura.
 * 
 * @pattern Port (Hexagonal Architecture)
 */

import { Observable } from 'rxjs';
import { User } from '../models/user.model';
import { AuthToken } from '../models/auth-token.model';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
}

export interface AuthState {
  user: User | null;
  token: AuthToken | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

/**
 * Puerto del repositorio de autenticación
 * 
 * Las implementaciones de esta interfaz deben manejar:
 * - Autenticación con email/password
 * - Autenticación con Google (redirect)
 * - Gestión de tokens (manual)
 * - Estado de autenticación (Observable)
 */
export abstract class AuthRepositoryPort {
  /**
   * Observable del estado de autenticación
   * Emite cada vez que cambia el estado del usuario o token
   */
  abstract authState$: Observable<AuthState>;

  /**
   * Login con email y contraseña
   * 
   * @param credentials - Email y contraseña del usuario
   * @returns Promise con el usuario autenticado
   * @throws AuthError si las credenciales son inválidas
   */
  abstract login(credentials: LoginCredentials): Promise<User>;

  /**
   * Registro de nuevo usuario con email y contraseña
   * 
   * @param data - Datos del nuevo usuario
   * @returns Promise con el usuario creado
   * @throws AuthError si el email ya está en uso
   */
  abstract register(data: RegisterData): Promise<User>;

  /**
   * Login con Google (redirect)
   * Redirige al usuario a la página de autenticación de Google
   * 
   * @throws AuthError si hay un problema con el redirect
   */
  abstract loginWithGoogle(): Promise<void>;

  /**
   * Obtiene el resultado del redirect de Google
   * Debe llamarse después de que el usuario vuelva del redirect
   * 
   * @returns Promise con el usuario autenticado o null si no hay resultado
   * @throws AuthError si el redirect fue cancelado o falló
   */
  abstract getRedirectResult(): Promise<User | null>;

  /**
   * Cierra la sesión del usuario actual
   * Limpia el token almacenado
   * 
   * @throws AuthError si hay un problema al cerrar sesión
   */
  abstract logout(): Promise<void>;

  /**
   * Obtiene el usuario actual del contexto de Firebase
   * 
   * @returns Promise con el usuario actual o null si no hay sesión
   */
  abstract getCurrentUser(): Promise<User | null>;

  /**
   * Obtiene el token actual
   * Si el token está expirado, intenta renovarlo automáticamente
   * 
   * @param forceRefresh - Forzar la renovación del token
   * @returns Promise con el token actual o null si no hay sesión
   * @throws AuthError si falla la renovación del token
   */
  abstract getToken(forceRefresh?: boolean): Promise<AuthToken | null>;

  /**
   * Renueva el token de autenticación
   * 
   * @returns Promise con el nuevo token
   * @throws AuthError si falla la renovación
   */
  abstract refreshToken(): Promise<AuthToken>;

  /**
   * Envía un email de verificación al usuario actual
   * 
   * @throws AuthError si no hay usuario autenticado
   */
  abstract sendEmailVerification(): Promise<void>;

  /**
   * Envía un email para resetear la contraseña
   * 
   * @param email - Email del usuario
   * @throws AuthError si el email no existe
   */
  abstract sendPasswordResetEmail(email: string): Promise<void>;

  /**
   * Actualiza el perfil del usuario actual
   * 
   * @param updates - Datos a actualizar
   * @returns Promise con el usuario actualizado
   * @throws AuthError si no hay usuario autenticado
   */
  abstract updateProfile(updates: Partial<User['profile']>): Promise<User>;

  /**
   * Verifica si hay un usuario autenticado
   * Versión síncrona para guards
   * 
   * @returns true si hay un usuario autenticado
   */
  abstract isAuthenticated(): boolean;
}
