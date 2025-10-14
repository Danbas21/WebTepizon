// src/app/features/auth/application/use-cases/auth.use-cases.ts

import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map, tap, switchMap } from 'rxjs/operators';

// Domain
import { User } from '../../domain/entities/user.entity';
import { AuthPort } from '../../domain/ports/auth.port';

// Infrastructure
import { AuthRepository } from '../../infrastructure/repositories/auth.repository';

// Shared services (analytics, logging, etc)
// import { AnalyticsService } from '@shared/services/analytics.service';
// import { LoggerService } from '@shared/services/logger.service';

/**
 * Use Cases de Autenticación
 * Contienen la lógica de negocio de la aplicación
 * Orquestan operaciones entre múltiples servicios y repositories
 * Son invocados por las Facades para simplificar la comunicación con la UI
 */
@Injectable({
    providedIn: 'root',
})
export class AuthUseCases {
    private readonly authRepository = inject(AuthRepository);
    // private readonly analytics = inject(AnalyticsService);
    // private readonly logger = inject(LoggerService);

    /**
     * Use Case: Login con Email y Password
     * Incluye validación, autenticación y logging
     */
    loginWithEmail(email: string, password: string): Observable<User> {
        // Validar inputs
        if (!email || !password) {
            throw new Error('Email and password are required');
        }

        if (!this.isValidEmail(email)) {
            throw new Error('Invalid email format');
        }

        return this.authRepository.login(email, password).pipe(
            tap((user) => {
                // Logging del evento
                console.log('User logged in:', user.id);

                // Analytics (descomentar cuando esté disponible)
                // this.analytics.trackEvent('login_success', {
                //   method: 'email',
                //   userId: user.id,
                // });
            })
        );
    }

    /**
     * Use Case: Registro de nuevo usuario
     * Incluye validación, creación de cuenta y configuración inicial
     */
    registerWithEmail(
        email: string,
        password: string,
        displayName: string
    ): Observable<User> {
        // Validaciones
        if (!email || !password || !displayName) {
            throw new Error('All fields are required');
        }

        if (!this.isValidEmail(email)) {
            throw new Error('Invalid email format');
        }

        if (password.length < 6) {
            throw new Error('Password must be at least 6 characters');
        }

        if (displayName.trim().length < 2) {
            throw new Error('Display name must be at least 2 characters');
        }

        return this.authRepository.register(email, password, displayName).pipe(
            tap((user) => {
                console.log('User registered:', user.id);

                // Analytics
                // this.analytics.trackEvent('signup_success', {
                //   method: 'email',
                //   userId: user.id,
                // });
            })
        );
    }

    /**
     * Use Case: Login con Google OAuth
     */
    loginWithGoogle(): Observable<User> {
        return this.authRepository.loginWithGoogle().pipe(
            tap((user) => {
                console.log('User logged in with Google:', user.id);

                // this.analytics.trackEvent('login_success', {
                //   method: 'google',
                //   userId: user.id,
                // });
            })
        );
    }

    /**
     * Use Case: Login con Facebook OAuth
     */
    loginWithFacebook(): Observable<User> {
        return this.authRepository.loginWithFacebook().pipe(
            tap((user) => {
                console.log('User logged in with Facebook:', user.id);

                // this.analytics.trackEvent('login_success', {
                //   method: 'facebook',
                //   userId: user.id,
                // });
            })
        );
    }

    /**
     * Use Case: Logout
     * Limpia sesión y redirige
     */
    logout(): Observable<void> {
        const currentUser = this.authRepository.currentUser();

        return this.authRepository.logout().pipe(
            tap(() => {
                console.log('User logged out:', currentUser?.id);

                // this.analytics.trackEvent('logout', {
                //   userId: currentUser?.id,
                // });

                // Limpiar cualquier caché local si es necesario
                // this.cacheService.clearAll();
            })
        );
    }

    /**
     * Use Case: Recuperación de contraseña
     * Envía email con instrucciones
     */
    requestPasswordReset(email: string): Observable<void> {
        if (!email || !this.isValidEmail(email)) {
            throw new Error('Invalid email format');
        }

        return this.authRepository.resetPassword(email).pipe(
            tap(() => {
                console.log('Password reset email sent to:', email);

                // this.analytics.trackEvent('password_reset_requested', { email });
            })
        );
    }

    /**
     * Use Case: Actualizar perfil de usuario
     * Valida y actualiza información del perfil
     */
    updateProfile(displayName: string, photoURL?: string): Observable<void> {
        if (!displayName || displayName.trim().length < 2) {
            throw new Error('Display name must be at least 2 characters');
        }

        if (photoURL && !this.isValidUrl(photoURL)) {
            throw new Error('Invalid photo URL format');
        }

        return this.authRepository.updateUserProfile(displayName, photoURL).pipe(
            tap(() => {
                console.log('Profile updated:', displayName);

                // this.analytics.trackEvent('profile_updated', {
                //   userId: this.authRepository.currentUser()?.id,
                // });
            })
        );
    }

    /**
     * Use Case: Actualizar email
     * Requiere re-autenticación si es necesario
     */
    updateEmail(newEmail: string): Observable<void> {
        if (!newEmail || !this.isValidEmail(newEmail)) {
            throw new Error('Invalid email format');
        }

        const currentEmail = this.authRepository.currentUser()?.email;

        if (currentEmail === newEmail) {
            throw new Error('New email must be different from current email');
        }

        return this.authRepository.updateUserEmail(newEmail).pipe(
            tap(() => {
                console.log('Email updated from', currentEmail, 'to', newEmail);

                // this.analytics.trackEvent('email_updated', {
                //   userId: this.authRepository.currentUser()?.id,
                // });
            })
        );
    }

    /**
     * Use Case: Actualizar contraseña
     * Incluye validación de fortaleza
     */
    updatePassword(newPassword: string): Observable<void> {
        if (!newPassword || newPassword.length < 6) {
            throw new Error('Password must be at least 6 characters');
        }

        if (!this.isStrongPassword(newPassword)) {
            throw new Error('Password must contain letters, numbers and special characters');
        }

        return this.authRepository.updateUserPassword(newPassword).pipe(
            tap(() => {
                console.log('Password updated successfully');

                // this.analytics.trackEvent('password_updated', {
                //   userId: this.authRepository.currentUser()?.id,
                // });
            })
        );
    }

    /**
     * Use Case: Verificar si el usuario tiene un rol específico
     * Útil para guards y autorización
     */
    async checkUserRole(requiredRole: 'USER' | 'ADMIN'): Promise<boolean> {
        return this.authRepository.hasRole(requiredRole);
    }

    /**
     * Use Case: Obtener token de autenticación
     * Para llamadas autenticadas a APIs
     */
    async getAuthToken(): Promise<string | null> {
        return this.authRepository.getAuthToken();
    }

    // ========== MÉTODOS PRIVADOS DE VALIDACIÓN ==========

    /**
     * Validar formato de email
     */
    private isValidEmail(email: string): boolean {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    /**
     * Validar formato de URL
     */
    private isValidUrl(url: string): boolean {
        try {
            new URL(url);
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Validar fortaleza de contraseña
     * Requiere: letras, números y caracteres especiales
     */
    private isStrongPassword(password: string): boolean {
        const hasLetters = /[a-zA-Z]/.test(password);
        const hasNumbers = /\d/.test(password);
        const hasSpecialChars = /[!@#$%^&*(),.?":{}|<>]/.test(password);

        return hasLetters && hasNumbers && hasSpecialChars;
    }
}