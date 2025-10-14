// src/app/features/auth/infrastructure/repositories/auth.repository.ts

import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

// Domain
import { User, UserRole } from '../../domain/entities/user.entity';
import { AuthPort } from '../../domain/ports/auth.port';

// Infrastructure
import { FirebaseAuthAdapter } from '../adapters/firebase-auth.adapter';

/**
 * Repository de Autenticación
 * Implementa el patrón Repository para abstraer el acceso a datos
 * Delega las operaciones al adapter correspondiente (Firebase en este caso)
 * 
 * El Repository es parte de la capa de Infrastructure pero implementa
 * interfaces definidas en el Domain (AuthPort)
 */
@Injectable({
    providedIn: 'root',
})
export class AuthRepository implements AuthPort {
    private readonly authAdapter = inject(FirebaseAuthAdapter);

    /**
     * Observable del usuario autenticado actual
     */
    get currentUser$(): Observable<User | null> {
        return this.authAdapter.currentUser$;
    }

    /**
     * Signal del usuario actual (Angular 20)
     */
    get currentUser() {
        return this.authAdapter.currentUser;
    }

    /**
     * Login con email y password
     */
    login(email: string, password: string): Observable<User> {
        return this.authAdapter.login(email, password);
    }

    /**
     * Registro con email y password
     */
    register(email: string, password: string, displayName: string): Observable<User> {
        return this.authAdapter.register(email, password, displayName);
    }

    /**
     * Login con Google OAuth
     */
    loginWithGoogle(): Observable<User> {
        return this.authAdapter.loginWithGoogle();
    }

    /**
     * Login con Facebook OAuth
     */
    loginWithFacebook(): Observable<User> {
        return this.authAdapter.loginWithFacebook();
    }

    /**
     * Logout
     */
    logout(): Observable<void> {
        return this.authAdapter.logout();
    }

    /**
     * Enviar email de recuperación de contraseña
     */
    resetPassword(email: string): Observable<void> {
        return this.authAdapter.resetPassword(email);
    }

    /**
     * Actualizar perfil de usuario
     */
    updateUserProfile(displayName: string, photoURL?: string): Observable<void> {
        return this.authAdapter.updateUserProfile(displayName, photoURL);
    }

    /**
     * Actualizar email
     */
    updateUserEmail(newEmail: string): Observable<void> {
        return this.authAdapter.updateUserEmail(newEmail);
    }

    /**
     * Actualizar contraseña
     */
    updateUserPassword(newPassword: string): Observable<void> {
        return this.authAdapter.updateUserPassword(newPassword);
    }

    /**
     * Obtener token de autenticación
     */
    getAuthToken(): Promise<string | null> {
        return this.authAdapter.getAuthToken();
    }

    /**
     * Verificar si el usuario tiene un rol específico
     */
    hasRole(role: UserRole): Promise<boolean> {
        return this.authAdapter.hasRole(role);
    }
}