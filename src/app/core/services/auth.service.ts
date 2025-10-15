// ============================================================================
// AUTH SERVICE - TEPIZON PLATFORM
// ============================================================================
// Servicio central de autenticación con Signals
// Maneja el estado del usuario y operaciones de auth
// ============================================================================

import { Injectable, signal, computed, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';

/**
 * Interfaz de usuario autenticado
 */
export interface AuthUser {
  id: string;
  email: string;
  name: string;
  photoURL?: string;
  emailVerified: boolean;
  role: 'user' | 'admin' | 'superadmin';
  createdAt: Date;
}

/**
 * Estado de autenticación
 */
export type AuthState = 'loading' | 'authenticated' | 'unauthenticated';

/**
 * Servicio de Autenticación
 * 
 * Características:
 * - Estado reactivo con Signals
 * - Integración con Firebase Auth
 * - Persistencia de sesión
 * - Manejo de tokens
 * - SSR-safe
 * 
 * @example
 * ```typescript
 * constructor(private auth: AuthService) {
 *   effect(() => {
 *     console.log('Usuario:', this.auth.currentUser());
 *     console.log('Autenticado:', this.auth.isAuthenticated());
 *   });
 * }
 * ```
 */
@Injectable({
  providedIn: 'root'
})
export class AuthService {
  // ========================================================================
  // DEPENDENCIES
  // ========================================================================
  
  private readonly router = inject(Router);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);
  
  // ========================================================================
  // SIGNALS - ESTADO
  // ========================================================================
  
  /**
   * Estado de autenticación
   */
  private readonly authState = signal<AuthState>('loading');
  
  /**
   * Usuario actual
   */
  private readonly userSignal = signal<AuthUser | null>(null);
  
  /**
   * Token de autenticación
   */
  private readonly tokenSignal = signal<string | null>(null);
  
  // ========================================================================
  // SIGNALS PÚBLICOS (READONLY)
  // ========================================================================
  
  /**
   * Usuario actual (readonly)
   */
  readonly currentUser = this.userSignal.asReadonly();
  
  /**
   * Token actual (readonly)
   */
  readonly token = this.tokenSignal.asReadonly();
  
  /**
   * Estado de carga
   */
  readonly isLoading = computed(() => this.authState() === 'loading');
  
  /**
   * Usuario está autenticado
   */
  readonly isAuthenticated = computed(() => 
    this.authState() === 'authenticated' && this.currentUser() !== null
  );
  
  /**
   * Email está verificado
   */
  readonly isEmailVerified = computed(() => 
    this.currentUser()?.emailVerified ?? false
  );
  
  /**
   * Usuario es admin
   */
  readonly isAdmin = computed(() => {
    const role = this.currentUser()?.role;
    return role === 'admin' || role === 'superadmin';
  });
  
  /**
   * Usuario es superadmin
   */
  readonly isSuperAdmin = computed(() => 
    this.currentUser()?.role === 'superadmin'
  );
  
  // ========================================================================
  // CONSTRUCTOR
  // ========================================================================
  
  constructor() {
    if (this.isBrowser) {
      this.initializeAuth();
    }
  }
  
  // ========================================================================
  // INICIALIZACIÓN
  // ========================================================================
  
  /**
   * Inicializar autenticación
   * Verifica si hay una sesión guardada
   */
  private async initializeAuth(): Promise<void> {
    try {
      // TODO: Inicializar Firebase Auth observer
      // onAuthStateChanged((user) => { ... })
      
      // Verificar token guardado en localStorage
      const savedToken = this.getStoredToken();
      
      if (savedToken) {
        // Verificar token y cargar usuario
        await this.loadUserFromToken(savedToken);
      } else {
        this.authState.set('unauthenticated');
      }
      
    } catch (error) {
      console.error('Error al inicializar auth:', error);
      this.authState.set('unauthenticated');
    }
  }
  
  /**
   * Cargar usuario desde token
   */
  private async loadUserFromToken(token: string): Promise<void> {
    try {
      // TODO: Verificar token con backend y cargar usuario
      // const user = await this.authFacade.verifyToken(token);
      
      // Simulación
      const mockUser: AuthUser = {
        id: '123',
        email: 'user@example.com',
        name: 'Usuario Demo',
        emailVerified: true,
        role: 'user',
        createdAt: new Date()
      };
      
      this.userSignal.set(mockUser);
      this.tokenSignal.set(token);
      this.authState.set('authenticated');
      
    } catch (error) {
      console.error('Error al cargar usuario:', error);
      this.clearAuth();
    }
  }
  
  // ========================================================================
  // MÉTODOS PÚBLICOS - AUTH
  // ========================================================================
  
  /**
   * Login con email y password
   */
  async login(email: string, password: string, rememberMe: boolean = false): Promise<void> {
    try {
      // TODO: Llamar al AuthFacade para login
      // const result = await this.authFacade.login(email, password);
      
      // Simulación
      const mockUser: AuthUser = {
        id: '123',
        email,
        name: 'Usuario Demo',
        emailVerified: true,
        role: 'user',
        createdAt: new Date()
      };
      
      const mockToken = 'mock-jwt-token';
      
      this.userSignal.set(mockUser);
      this.tokenSignal.set(mockToken);
      this.authState.set('authenticated');
      
      // Guardar token si rememberMe
      if (rememberMe) {
        this.storeToken(mockToken);
      }
      
    } catch (error) {
      console.error('Error en login:', error);
      throw error;
    }
  }
  
  /**
   * Login con Google
   */
  async loginWithGoogle(): Promise<void> {
    try {
      // TODO: Implementar login con Google
      throw new Error('Login con Google no implementado');
    } catch (error) {
      console.error('Error en login con Google:', error);
      throw error;
    }
  }
  
  /**
   * Login con Facebook
   */
  async loginWithFacebook(): Promise<void> {
    try {
      // TODO: Implementar login con Facebook
      throw new Error('Login con Facebook no implementado');
    } catch (error) {
      console.error('Error en login con Facebook:', error);
      throw error;
    }
  }
  
  /**
   * Registro de nuevo usuario
   */
  async register(
    name: string,
    email: string,
    password: string,
    subscribeNewsletter: boolean = false
  ): Promise<void> {
    try {
      // TODO: Llamar al AuthFacade para registro
      // await this.authFacade.register(name, email, password, subscribeNewsletter);
      
      console.log('Registro:', { name, email, subscribeNewsletter });
      
    } catch (error) {
      console.error('Error en registro:', error);
      throw error;
    }
  }
  
  /**
   * Logout
   */
  async logout(): Promise<void> {
    try {
      // TODO: Llamar al backend para invalidar token si es necesario
      
      this.clearAuth();
      this.router.navigate(['/']);
      
    } catch (error) {
      console.error('Error en logout:', error);
      throw error;
    }
  }
  
  /**
   * Solicitar reset de contraseña
   */
  async requestPasswordReset(email: string): Promise<void> {
    try {
      // TODO: Llamar al AuthFacade para reset
      // await this.authFacade.requestPasswordReset(email);
      
      console.log('Reset solicitado para:', email);
      
    } catch (error) {
      console.error('Error al solicitar reset:', error);
      throw error;
    }
  }
  
  /**
   * Actualizar perfil del usuario
   */
  async updateProfile(data: Partial<AuthUser>): Promise<void> {
    try {
      // TODO: Actualizar perfil con AuthFacade
      // const updated = await this.authFacade.updateProfile(data);
      
      // Actualizar usuario local
      const currentUser = this.currentUser();
      if (currentUser) {
        this.userSignal.set({ ...currentUser, ...data });
      }
      
    } catch (error) {
      console.error('Error al actualizar perfil:', error);
      throw error;
    }
  }
  
  /**
   * Cambiar contraseña
   */
  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    try {
      // TODO: Cambiar contraseña con AuthFacade
      // await this.authFacade.changePassword(currentPassword, newPassword);
      
      console.log('Contraseña cambiada');
      
    } catch (error) {
      console.error('Error al cambiar contraseña:', error);
      throw error;
    }
  }
  
  // ========================================================================
  // MÉTODOS PRIVADOS - STORAGE
  // ========================================================================
  
  /**
   * Guardar token en localStorage
   */
  private storeToken(token: string): void {
    if (!this.isBrowser) return;
    
    try {
      localStorage.setItem('auth_token', token);
    } catch (error) {
      console.error('Error al guardar token:', error);
    }
  }
  
  /**
   * Obtener token guardado
   */
  private getStoredToken(): string | null {
    if (!this.isBrowser) return null;
    
    try {
      return localStorage.getItem('auth_token');
    } catch (error) {
      console.error('Error al obtener token:', error);
      return null;
    }
  }
  
  /**
   * Eliminar token guardado
   */
  private removeStoredToken(): void {
    if (!this.isBrowser) return;
    
    try {
      localStorage.removeItem('auth_token');
    } catch (error) {
      console.error('Error al eliminar token:', error);
    }
  }
  
  /**
   * Limpiar autenticación
   */
  private clearAuth(): void {
    this.userSignal.set(null);
    this.tokenSignal.set(null);
    this.authState.set('unauthenticated');
    this.removeStoredToken();
  }
  
  // ========================================================================
  // MÉTODOS DE UTILIDAD
  // ========================================================================
  
  /**
   * Verificar si tiene un rol específico
   */
  hasRole(role: string | string[]): boolean {
    const currentRole = this.currentUser()?.role;
    if (!currentRole) return false;
    
    if (Array.isArray(role)) {
      return role.includes(currentRole);
    }
    
    return currentRole === role;
  }
  
  /**
   * Obtener token de autenticación (para HTTP headers)
   */
  getAuthToken(): string | null {
    return this.token();
  }
}
