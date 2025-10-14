// src/app/features/auth/application/facades/auth.facade.ts

import { Injectable, inject, signal, computed } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Observable, catchError, of, tap } from 'rxjs';
import { Router } from '@angular/router';

// Domain
import { User } from '../../domain/entities/user.entity';

// Application
import { AuthUseCases } from '../use-cases/auth.use-cases';

// Infrastructure
import { AuthRepository } from '../../infrastructure/repositories/auth.repository';

/**
 * Estado de la UI para autenticación
 */
interface AuthState {
    loading: boolean;
    error: string | null;
}

/**
 * Auth Facade
 * 
 * Proporciona una API simplificada para la UI
 * Maneja el estado de loading y errores
 * Coordina navegación post-autenticación
 * Usa Angular Signals para reactividad optimizada
 * 
 * La Facade es el único punto de contacto entre los componentes
 * de presentación y la lógica de negocio
 */
@Injectable({
    providedIn: 'root',
})
export class AuthFacade {
    private readonly authUseCases = inject(AuthUseCases);
    private readonly authRepository = inject(AuthRepository);
    private readonly router = inject(Router);

    // ========== SIGNALS (STATE MANAGEMENT) ==========

    /**
     * Signal del usuario actual
     * Se actualiza automáticamente cuando cambia el estado de auth
     */
    readonly currentUser = this.authRepository.currentUser;

    /**
     * Signal de estado de autenticación
     */
    readonly isAuthenticated = computed(() => this.currentUser() !== null);

    /**
     * Signal de rol de usuario
     */
    readonly userRole = computed(() => this.currentUser()?.role);

    /**
     * Signal de estado de admin
     */
    readonly isAdmin = computed(() => this.userRole() === 'ADMIN');

    /**
     * Signal de estado de la UI
     */
    private readonly authState = signal<AuthState>({
        loading: false,
        error: null,
    });

    /**
     * Signals derivados del estado
     */
    readonly isLoading = computed(() => this.authState().loading);
    readonly error = computed(() => this.authState().error);

    // ========== MÉTODOS PÚBLICOS ==========

    /**
     * Login con email y password
     */
    loginWithEmail(email: string, password: string): Observable<User> {
        this.setLoading(true);
        this.clearError();

        return this.authUseCases.loginWithEmail(email, password).pipe(
            tap({
                next: (user) => {
                    this.setLoading(false);
                    this.navigateAfterLogin(user);
                },
                error: (error) => {
                    this.setLoading(false);
                    this.setError(this.getErrorMessage(error));
                },
            }),
            catchError((error) => {
                // Ya manejamos el error en tap, pero lo propagamos
                throw error;
            })
        );
    }

    /**
     * Registro de nuevo usuario
     */
    registerWithEmail(
        email: string,
        password: string,
        displayName: string
    ): Observable<User> {
        this.setLoading(true);
        this.clearError();

        return this.authUseCases.registerWithEmail(email, password, displayName).pipe(
            tap({
                next: (user) => {
                    this.setLoading(false);
                    this.navigateAfterLogin(user);
                },
                error: (error) => {
                    this.setLoading(false);
                    this.setError(this.getErrorMessage(error));
                },
            }),
            catchError((error) => {
                throw error;
            })
        );
    }

    /**
     * Login con Google
     */
    loginWithGoogle(): Observable<User> {
        this.setLoading(true);
        this.clearError();

        return this.authUseCases.loginWithGoogle().pipe(
            tap({
                next: (user) => {
                    this.setLoading(false);
                    this.navigateAfterLogin(user);
                },
                error: (error) => {
                    this.setLoading(false);
                    this.setError(this.getErrorMessage(error));
                },
            }),
            catchError((error) => {
                throw error;
            })
        );
    }

    /**
     * Login con Facebook
     */
    loginWithFacebook(): Observable<User> {
        this.setLoading(true);
        this.clearError();

        return this.authUseCases.loginWithFacebook().pipe(
            tap({
                next: (user) => {
                    this.setLoading(false);
                    this.navigateAfterLogin(user);
                },
                error: (error) => {
                    this.setLoading(false);
                    this.setError(this.getErrorMessage(error));
                },
            }),
            catchError((error) => {
                throw error;
            })
        );
    }

    /**
     * Logout
     */
    logout(): Observable<void> {
        this.setLoading(true);
        this.clearError();

        return this.authUseCases.logout().pipe(
            tap({
                next: () => {
                    this.setLoading(false);
                    this.router.navigate(['/auth/login']);
                },
                error: (error) => {
                    this.setLoading(false);
                    this.setError(this.getErrorMessage(error));
                },
            })
        );
    }

    /**
     * Solicitar recuperación de contraseña
     */
    requestPasswordReset(email: string): Observable<void> {
        this.setLoading(true);
        this.clearError();

        return this.authUseCases.requestPasswordReset(email).pipe(
            tap({
                next: () => {
                    this.setLoading(false);
                    // Mostrar mensaje de éxito en la UI
                },
                error: (error) => {
                    this.setLoading(false);
                    this.setError(this.getErrorMessage(error));
                },
            })
        );
    }

    /**
     * Actualizar perfil
     */
    updateProfile(displayName: string, photoURL?: string): Observable<void> {
        this.setLoading(true);
        this.clearError();

        return this.authUseCases.updateProfile(displayName, photoURL).pipe(
            tap({
                next: () => {
                    this.setLoading(false);
                    // Mostrar mensaje de éxito
                },
                error: (error) => {
                    this.setLoading(false);
                    this.setError(this.getErrorMessage(error));
                },
            })
        );
    }

    /**
     * Actualizar email
     */
    updateEmail(newEmail: string): Observable<void> {
        this.setLoading(true);
        this.clearError();

        return this.authUseCases.updateEmail(newEmail).pipe(
            tap({
                next: () => {
                    this.setLoading(false);
                    // Mostrar mensaje de éxito
                },
                error: (error) => {
                    this.setLoading(false);
                    this.setError(this.getErrorMessage(error));
                },
            })
        );
    }

    /**
     * Actualizar contraseña
     */
    updatePassword(newPassword: string): Observable<void> {
        this.setLoading(true);
        this.clearError();

        return this.authUseCases.updatePassword(newPassword).pipe(
            tap({
                next: () => {
                    this.setLoading(false);
                    // Mostrar mensaje de éxito
                },
                error: (error) => {
                    this.setLoading(false);
                    this.setError(this.getErrorMessage(error));
                },
            })
        );
    }

    /**
     * Verificar si el usuario tiene un rol específico
     */
    async hasRole(role: 'USER' | 'ADMIN'): Promise<boolean> {
        return this.authUseCases.checkUserRole(role);
    }

    /**
     * Obtener token de autenticación
     */
    async getAuthToken(): Promise<string | null> {
        return this.authUseCases.getAuthToken();
    }

    /**
     * Limpiar error
     */
    clearError(): void {
        this.authState.update((state) => ({ ...state, error: null }));
    }

    // ========== MÉTODOS PRIVADOS ==========

    /**
     * Establecer estado de loading
     */
    private setLoading(loading: boolean): void {
        this.authState.update((state) => ({ ...state, loading }));
    }

    /**
     * Establecer error
     */
    private setError(error: string): void {
        this.authState.update((state) => ({ ...state, error }));
    }

    /**
     * Navegar después de login exitoso
     * Redirige según el rol del usuario
     */
    private navigateAfterLogin(user: User): void {
        if (user.role === 'ADMIN') {
            this.router.navigate(['/admin/dashboard']);
        } else {
            this.router.navigate(['/']);
        }
    }

    /**
     * Obtener mensaje de error amigable
     */
    private getErrorMessage(error: any): string {
        if (error?.message) {
            return error.message;
        }

        if (typeof error === 'string') {
            return error;
        }

        return 'Ocurrió un error inesperado. Por favor intenta nuevamente.';
    }
}