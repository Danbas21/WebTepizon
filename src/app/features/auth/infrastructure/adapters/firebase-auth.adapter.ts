/**
 * Firebase Auth Adapter
 * 
 * Implementación del adaptador para Firebase Authentication v10+.
 * Maneja la comunicación con Firebase y convierte los datos a modelos de dominio.
 * 
 * @pattern Adapter (Hexagonal Architecture)
 * @infrastructure Firebase
 */

import { Injectable, inject } from '@angular/core';
import {
  Auth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithRedirect,
  getRedirectResult,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  updateProfile as firebaseUpdateProfile,
  sendEmailVerification as firebaseSendEmailVerification,
  sendPasswordResetEmail as firebaseSendPasswordResetEmail,
  User as FirebaseUser,
  UserCredential,
} from '@angular/fire/auth';
import {
  Firestore,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  serverTimestamp,
} from '@angular/fire/firestore';
import { BehaviorSubject, Observable, from, of } from 'rxjs';
import { switchMap, map, catchError, tap } from 'rxjs/operators';

import { User, UserRole, AuthProvider, createUser } from '../../domain/models/user.model';
import { AuthToken, createAuthToken, isTokenExpired } from '../../domain/models/auth-token.model';
import { createAuthError, AuthError, AuthErrorCode } from '../../domain/models/auth-error.model';
import {
  LoginCredentials,
  RegisterData,
  AuthState,
} from '../../domain/ports/auth.repository.port';

/**
 * Adapter de Firebase Authentication
 * 
 * Responsabilidades:
 * - Autenticación con email/password
 * - Autenticación con Google (redirect)
 * - Gestión de tokens (almacenamiento manual)
 * - Sincronización con Firestore (colección users)
 * - Estado reactivo de autenticación
 */
@Injectable({
  providedIn: 'root',
})
export class FirebaseAuthAdapter {
  private readonly auth = inject(Auth);
  private readonly firestore = inject(Firestore);

  // Estado reactivo interno
  private readonly authStateSubject = new BehaviorSubject<AuthState>({
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: true,
  });

  // Observable público del estado
  public readonly authState$ = this.authStateSubject.asObservable();

  // Provider de Google
  private readonly googleProvider = new GoogleAuthProvider();

  constructor() {
    this.initializeAuthStateListener();
  }

  /**
   * Inicializa el listener de cambios de autenticación de Firebase
   * Sincroniza el estado local con Firebase
   */
  private initializeAuthStateListener(): void {
    onAuthStateChanged(
      this.auth,
      async (firebaseUser) => {
        try {
          if (firebaseUser) {
            // Usuario autenticado - obtener datos completos
            const user = await this.getUserFromFirestore(firebaseUser.uid);
            const token = await this.extractToken(firebaseUser);

            // Actualizar último login
            await this.updateLastLogin(firebaseUser.uid);

            this.authStateSubject.next({
              user,
              token,
              isAuthenticated: true,
              isLoading: false,
            });

            // Guardar token en localStorage
            this.saveTokenToStorage(token);
          } else {
            // Usuario no autenticado - limpiar estado
            this.authStateSubject.next({
              user: null,
              token: null,
              isAuthenticated: false,
              isLoading: false,
            });

            this.clearTokenFromStorage();
          }
        } catch (error) {
          console.error('Error en auth state listener:', error);
          this.authStateSubject.next({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
          });
        }
      },
      (error) => {
        console.error('Error en auth state listener:', error);
        this.authStateSubject.next({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false,
        });
      }
    );
  }

  /**
   * Login con email y contraseña
   */
  async login(credentials: LoginCredentials): Promise<User> {
    try {
      const userCredential = await signInWithEmailAndPassword(
        this.auth,
        credentials.email,
        credentials.password
      );

      return await this.handleAuthSuccess(userCredential);
    } catch (error) {
      throw createAuthError(error);
    }
  }

  /**
   * Registro de nuevo usuario
   */
  async register(data: RegisterData): Promise<User> {
    try {
      // 1. Crear usuario en Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(
        this.auth,
        data.email,
        data.password
      );

      // 2. Actualizar perfil en Firebase Auth
      await firebaseUpdateProfile(userCredential.user, {
        displayName: `${data.firstName} ${data.lastName}`,
      });

      // 3. Crear documento en Firestore
      const user = createUser({
        uid: userCredential.user.uid,
        email: data.email,
        emailVerified: false,
        role: UserRole.USER,
        provider: AuthProvider.EMAIL,
        profile: {
          firstName: data.firstName,
          lastName: data.lastName,
          phone: data.phone,
          language: 'es',
          theme: 'light',
        },
        addresses: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        isActive: true,
        wishlistCount: 0,
        ordersCount: 0,
      });

      await this.saveUserToFirestore(user);

      // 4. Enviar email de verificación
      await firebaseSendEmailVerification(userCredential.user);

      return user;
    } catch (error) {
      throw createAuthError(error);
    }
  }

  /**
   * Login con Google (redirect)
   */
  async loginWithGoogle(): Promise<void> {
    try {
      // Configurar provider
      this.googleProvider.setCustomParameters({
        prompt: 'select_account',
      });

      // Iniciar redirect
      await signInWithRedirect(this.auth, this.googleProvider);
    } catch (error) {
      throw createAuthError(error);
    }
  }

  /**
   * Obtiene el resultado del redirect de Google
   */
  async getRedirectResult(): Promise<User | null> {
    try {
      const result = await getRedirectResult(this.auth);

      if (!result) {
        return null;
      }

      // Verificar si el usuario ya existe en Firestore
      const existingUser = await this.getUserFromFirestore(result.user.uid).catch(() => null);

      if (existingUser) {
        // Usuario existente - actualizar último login
        await this.updateLastLogin(result.user.uid);
        return existingUser;
      }

      // Nuevo usuario - crear en Firestore
      const names = this.parseGoogleDisplayName(result.user.displayName || '');
      const user = createUser({
        uid: result.user.uid,
        email: result.user.email || '',
        emailVerified: result.user.emailVerified,
        role: UserRole.USER,
        provider: AuthProvider.GOOGLE,
        profile: {
          firstName: names.firstName,
          lastName: names.lastName,
          avatar: result.user.photoURL || undefined,
          language: 'es',
          theme: 'light',
        },
        addresses: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        isActive: true,
        wishlistCount: 0,
        ordersCount: 0,
      });

      await this.saveUserToFirestore(user);

      return user;
    } catch (error) {
      throw createAuthError(error);
    }
  }

  /**
   * Cierra sesión
   */
  async logout(): Promise<void> {
    try {
      await signOut(this.auth);
      this.clearTokenFromStorage();
    } catch (error) {
      throw createAuthError(error);
    }
  }

  /**
   * Obtiene el usuario actual
   */
  async getCurrentUser(): Promise<User | null> {
    const firebaseUser = this.auth.currentUser;
    if (!firebaseUser) {
      return null;
    }

    try {
      return await this.getUserFromFirestore(firebaseUser.uid);
    } catch (error) {
      throw createAuthError(error);
    }
  }

  /**
   * Obtiene el token actual
   */
  async getToken(forceRefresh = false): Promise<AuthToken | null> {
    const firebaseUser = this.auth.currentUser;
    if (!firebaseUser) {
      return null;
    }

    try {
      // Si no forzamos refresh, intentar obtener del storage
      if (!forceRefresh) {
        const storedToken = this.getTokenFromStorage();
        if (storedToken && !isTokenExpired(storedToken)) {
          return storedToken;
        }
      }

      // Obtener nuevo token de Firebase
      const token = await this.extractToken(firebaseUser);
      this.saveTokenToStorage(token);
      return token;
    } catch (error) {
      throw createAuthError(error);
    }
  }

  /**
   * Renueva el token
   */
  async refreshToken(): Promise<AuthToken> {
    const firebaseUser = this.auth.currentUser;
    if (!firebaseUser) {
      throw new AuthError({
        code: AuthErrorCode.UNAUTHORIZED,
        message: 'No hay usuario autenticado',
        timestamp: new Date(),
      });
    }

    try {
      const token = await this.extractToken(firebaseUser, true);
      this.saveTokenToStorage(token);
      return token;
    } catch (error) {
      throw createAuthError(error);
    }
  }

  /**
   * Envía email de verificación
   */
  async sendEmailVerification(): Promise<void> {
    const firebaseUser = this.auth.currentUser;
    if (!firebaseUser) {
      throw new AuthError({
        code: AuthErrorCode.UNAUTHORIZED,
        message: 'No hay usuario autenticado',
        timestamp: new Date(),
      });
    }

    try {
      await firebaseSendEmailVerification(firebaseUser);
    } catch (error) {
      throw createAuthError(error);
    }
  }

  /**
   * Envía email para resetear contraseña
   */
  async sendPasswordResetEmail(email: string): Promise<void> {
    try {
      await firebaseSendPasswordResetEmail(this.auth, email);
    } catch (error) {
      throw createAuthError(error);
    }
  }

  /**
   * Actualiza el perfil del usuario
   */
  async updateProfile(updates: Partial<User['profile']>): Promise<User> {
    const firebaseUser = this.auth.currentUser;
    if (!firebaseUser) {
      throw new AuthError({
        code: AuthErrorCode.UNAUTHORIZED,
        message: 'No hay usuario autenticado',
        timestamp: new Date(),
      });
    }

    try {
      // Obtener usuario actual de Firestore
      const currentUser = await this.getUserFromFirestore(firebaseUser.uid);

      // Actualizar en Firestore
      const userRef = doc(this.firestore, 'users', firebaseUser.uid);
      await updateDoc(userRef, {
        profile: { ...currentUser.profile, ...updates },
        updatedAt: serverTimestamp(),
      });

      // Actualizar displayName en Firebase Auth si cambió firstName o lastName
      if (updates.firstName || updates.lastName) {
        const displayName = `${updates.firstName || currentUser.profile.firstName} ${
          updates.lastName || currentUser.profile.lastName
        }`;
        await firebaseUpdateProfile(firebaseUser, { displayName });
      }

      // Retornar usuario actualizado
      return await this.getUserFromFirestore(firebaseUser.uid);
    } catch (error) {
      throw createAuthError(error);
    }
  }

  /**
   * Verifica si hay un usuario autenticado (síncrono)
   */
  isAuthenticated(): boolean {
    return this.authStateSubject.value.isAuthenticated;
  }

  // ==================== MÉTODOS PRIVADOS ====================

  /**
   * Maneja el éxito de autenticación
   */
  private async handleAuthSuccess(userCredential: UserCredential): Promise<User> {
    const user = await this.getUserFromFirestore(userCredential.user.uid);
    const token = await this.extractToken(userCredential.user);

    this.authStateSubject.next({
      user,
      token,
      isAuthenticated: true,
      isLoading: false,
    });

    this.saveTokenToStorage(token);

    return user;
  }

  /**
   * Extrae el token de un usuario de Firebase
   */
  private async extractToken(firebaseUser: FirebaseUser, forceRefresh = false): Promise<AuthToken> {
    const idToken = await firebaseUser.getIdToken(forceRefresh);
    const idTokenResult = await firebaseUser.getIdTokenResult(forceRefresh);
    const refreshToken = firebaseUser.refreshToken;

    // Calcular tiempo de expiración
    const expirationTime = new Date(idTokenResult.expirationTime).getTime();
    const issuedAtTime = new Date(idTokenResult.issuedAtTime).getTime();
    const expiresIn = Math.floor((expirationTime - issuedAtTime) / 1000);

    return createAuthToken(idToken, refreshToken, expiresIn);
  }

  /**
   * Obtiene un usuario de Firestore
   */
  private async getUserFromFirestore(uid: string): Promise<User> {
    const userRef = doc(this.firestore, 'users', uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      throw new AuthError({
        code: AuthErrorCode.USER_NOT_FOUND,
        message: 'Usuario no encontrado en la base de datos',
        timestamp: new Date(),
      });
    }

    const data = userSnap.data();

    return createUser({
      uid: userSnap.id,
      email: data['email'],
      emailVerified: data['emailVerified'],
      role: data['role'] as UserRole,
      profile: data['profile'],
      addresses: data['addresses'] || [],
      provider: data['provider'] as AuthProvider,
      createdAt: data['createdAt']?.toDate() || new Date(),
      updatedAt: data['updatedAt']?.toDate() || new Date(),
      lastLoginAt: data['lastLoginAt']?.toDate(),
      isActive: data['isActive'],
      wishlistCount: data['wishlistCount'] || 0,
      ordersCount: data['ordersCount'] || 0,
    });
  }

  /**
   * Guarda un usuario en Firestore
   */
  private async saveUserToFirestore(user: User): Promise<void> {
    const userRef = doc(this.firestore, 'users', user.uid);
    await setDoc(userRef, {
      email: user.email,
      emailVerified: user.emailVerified,
      role: user.role,
      profile: user.profile,
      addresses: user.addresses,
      provider: user.provider,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      isActive: user.isActive,
      wishlistCount: user.wishlistCount,
      ordersCount: user.ordersCount,
    });
  }

  /**
   * Actualiza el último login del usuario
   */
  private async updateLastLogin(uid: string): Promise<void> {
    try {
      const userRef = doc(this.firestore, 'users', uid);
      await updateDoc(userRef, {
        lastLoginAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error actualizando último login:', error);
    }
  }

  /**
   * Parsea el displayName de Google en firstName y lastName
   */
  private parseGoogleDisplayName(displayName: string): { firstName: string; lastName: string } {
    const parts = displayName.trim().split(' ');
    if (parts.length === 1) {
      return { firstName: parts[0], lastName: '' };
    }
    const firstName = parts[0];
    const lastName = parts.slice(1).join(' ');
    return { firstName, lastName };
  }

  /**
   * Guarda el token en localStorage
   */
  private saveTokenToStorage(token: AuthToken): void {
    try {
      localStorage.setItem('auth_token', JSON.stringify({
        idToken: token.idToken,
        refreshToken: token.refreshToken,
        expiresAt: token.expiresAt.toISOString(),
        issuedAt: token.issuedAt.toISOString(),
      }));
    } catch (error) {
      console.error('Error guardando token:', error);
    }
  }

  /**
   * Obtiene el token de localStorage
   */
  private getTokenFromStorage(): AuthToken | null {
    try {
      const stored = localStorage.getItem('auth_token');
      if (!stored) return null;

      const parsed = JSON.parse(stored);
      return {
        idToken: parsed.idToken,
        refreshToken: parsed.refreshToken,
        expiresAt: new Date(parsed.expiresAt),
        issuedAt: new Date(parsed.issuedAt),
      };
    } catch (error) {
      console.error('Error obteniendo token:', error);
      return null;
    }
  }

  /**
   * Limpia el token de localStorage
   */
  private clearTokenFromStorage(): void {
    try {
      localStorage.removeItem('auth_token');
    } catch (error) {
      console.error('Error limpiando token:', error);
    }
  }
}
