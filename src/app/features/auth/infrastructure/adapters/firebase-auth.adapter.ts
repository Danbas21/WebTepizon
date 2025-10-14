// src/app/features/auth/infrastructure/adapters/firebase-auth.adapter.ts

import { Injectable, inject } from '@angular/core';
import {
    Auth,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
    updateProfile,
    sendPasswordResetEmail,
    updateEmail,
    updatePassword,
    GoogleAuthProvider,
    FacebookAuthProvider,
    signInWithPopup,
    onAuthStateChanged,
    User as FirebaseUser,
    UserCredential,
} from '@angular/fire/auth';
import { Observable, from, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { toSignal } from '@angular/core/rxjs-interop';

// Domain
import { User, UserRole } from '../../domain/entities/user.entity';
import { AuthPort } from '../../domain/ports/auth.port';
import { AuthError } from '../../domain/errors/auth.errors';

/**
 * Adapter para Firebase Authentication
 * Implementa el port AuthPort definido en el dominio
 * Convierte entre tipos de Firebase y tipos del dominio
 */
@Injectable({
    providedIn: 'root',
})
export class FirebaseAuthAdapter implements AuthPort {
    private readonly auth = inject(Auth);

    /**
     * Observable del usuario autenticado actual
     * Se actualiza automáticamente cuando cambia el estado de auth
     */
    readonly currentUser$ = new Observable<User | null>((observer) => {
        return onAuthStateChanged(this.auth, async (firebaseUser) => {
            if (firebaseUser) {
                try {
                    const user = await this.mapFirebaseUserToDomain(firebaseUser);
                    observer.next(user);
                } catch (error) {
                    observer.error(this.handleAuthError(error));
                }
            } else {
                observer.next(null);
            }
        });
    });

    /**
     * Signal del usuario actual (Angular 20)
     * Para uso directo en templates con mayor performance
     */
    readonly currentUser = toSignal(this.currentUser$, { initialValue: null });

    /**
     * Login con email y password
     */
    login(email: string, password: string): Observable<User> {
        return from(signInWithEmailAndPassword(this.auth, email, password)).pipe(
            map((credential) => this.mapCredentialToDomain(credential)),
            catchError((error) => throwError(() => this.handleAuthError(error)))
        );
    }

    /**
     * Registro con email y password
     */
    register(email: string, password: string, displayName: string): Observable<User> {
        return from(
            createUserWithEmailAndPassword(this.auth, email, password)
        ).pipe(
            map(async (credential) => {
                // Actualizar profile con displayName
                if (credential.user) {
                    await updateProfile(credential.user, { displayName });
                    await credential.user.reload();
                }
                return this.mapCredentialToDomain(credential);
            }),
            map((userPromise) => from(userPromise)),
            catchError((error) => throwError(() => this.handleAuthError(error)))
        );
    }

    /**
     * Login con Google OAuth
     */
    loginWithGoogle(): Observable<User> {
        const provider = new GoogleAuthProvider();
        provider.addScope('profile');
        provider.addScope('email');

        return from(signInWithPopup(this.auth, provider)).pipe(
            map((credential) => this.mapCredentialToDomain(credential)),
            catchError((error) => throwError(() => this.handleAuthError(error)))
        );
    }

    /**
     * Login con Facebook OAuth
     */
    loginWithFacebook(): Observable<User> {
        const provider = new FacebookAuthProvider();
        provider.addScope('email');
        provider.addScope('public_profile');

        return from(signInWithPopup(this.auth, provider)).pipe(
            map((credential) => this.mapCredentialToDomain(credential)),
            catchError((error) => throwError(() => this.handleAuthError(error)))
        );
    }

    /**
     * Logout
     */
    logout(): Observable<void> {
        return from(signOut(this.auth)).pipe(
            catchError((error) => throwError(() => this.handleAuthError(error)))
        );
    }

    /**
     * Enviar email de recuperación de contraseña
     */
    resetPassword(email: string): Observable<void> {
        return from(sendPasswordResetEmail(this.auth, email)).pipe(
            catchError((error) => throwError(() => this.handleAuthError(error)))
        );
    }

    /**
     * Actualizar perfil de usuario
     */
    updateUserProfile(displayName: string, photoURL?: string): Observable<void> {
        const user = this.auth.currentUser;
        if (!user) {
            return throwError(() => new AuthError('NO_USER', 'No authenticated user'));
        }

        return from(updateProfile(user, { displayName, photoURL })).pipe(
            catchError((error) => throwError(() => this.handleAuthError(error)))
        );
    }

    /**
     * Actualizar email
     */
    updateUserEmail(newEmail: string): Observable<void> {
        const user = this.auth.currentUser;
        if (!user) {
            return throwError(() => new AuthError('NO_USER', 'No authenticated user'));
        }

        return from(updateEmail(user, newEmail)).pipe(
            catchError((error) => throwError(() => this.handleAuthError(error)))
        );
    }

    /**
     * Actualizar contraseña
     */
    updateUserPassword(newPassword: string): Observable<void> {
        const user = this.auth.currentUser;
        if (!user) {
            return throwError(() => new AuthError('NO_USER', 'No authenticated user'));
        }

        return from(updatePassword(user, newPassword)).pipe(
            catchError((error) => throwError(() => this.handleAuthError(error)))
        );
    }

    /**
     * Obtener token de autenticación
     */
    async getAuthToken(): Promise<string | null> {
        const user = this.auth.currentUser;
        if (!user) return null;

        try {
            return await user.getIdToken();
        } catch (error) {
            console.error('Error getting auth token:', error);
            return null;
        }
    }

    /**
     * Verificar si el usuario tiene un rol específico
     */
    async hasRole(role: UserRole): Promise<boolean> {
        const user = this.auth.currentUser;
        if (!user) return false;

        try {
            const tokenResult = await user.getIdTokenResult();
            const userRole = tokenResult.claims['role'] as UserRole;
            return userRole === role;
        } catch (error) {
            console.error('Error checking role:', error);
            return false;
        }
    }

    // ========== MÉTODOS PRIVADOS ==========

    /**
     * Mapea UserCredential de Firebase a entidad User del dominio
     */
    private mapCredentialToDomain(credential: UserCredential): User {
        const firebaseUser = credential.user;

        return {
            id: firebaseUser.uid,
            email: firebaseUser.email!,
            displayName: firebaseUser.displayName || 'Usuario',
            photoURL: firebaseUser.photoURL || undefined,
            role: 'USER', // Por defecto, el role se obtiene del token
            emailVerified: firebaseUser.emailVerified,
            createdAt: new Date(firebaseUser.metadata.creationTime!),
            lastLoginAt: new Date(firebaseUser.metadata.lastSignInTime!),
        };
    }

    /**
     * Mapea FirebaseUser a entidad User del dominio
     * Se usa para el observable de currentUser$
     */
    private async mapFirebaseUserToDomain(firebaseUser: FirebaseUser): Promise<User> {
        // Obtener custom claims (role)
        const tokenResult = await firebaseUser.getIdTokenResult();
        const role = (tokenResult.claims['role'] as UserRole) || 'USER';

        return {
            id: firebaseUser.uid,
            email: firebaseUser.email!,
            displayName: firebaseUser.displayName || 'Usuario',
            photoURL: firebaseUser.photoURL || undefined,
            role,
            emailVerified: firebaseUser.emailVerified,
            createdAt: new Date(firebaseUser.metadata.creationTime!),
            lastLoginAt: new Date(firebaseUser.metadata.lastSignInTime!),
        };
    }

    /**
     * Maneja errores de Firebase Auth y los convierte a errores del dominio
     */
    private handleAuthError(error: any): AuthError {
        const code = error?.code || 'UNKNOWN';
        const message = error?.message || 'An unknown error occurred';

        // Mapeo de códigos de error de Firebase a errores del dominio
        const errorMap: Record<string, { code: string; message: string }> = {
            'auth/user-not-found': {
                code: 'USER_NOT_FOUND',
                message: 'No existe una cuenta con este email',
            },
            'auth/wrong-password': {
                code: 'INVALID_CREDENTIALS',
                message: 'Email o contraseña incorrectos',
            },
            'auth/email-already-in-use': {
                code: 'EMAIL_IN_USE',
                message: 'Este email ya está registrado',
            },
            'auth/weak-password': {
                code: 'WEAK_PASSWORD',
                message: 'La contraseña debe tener al menos 6 caracteres',
            },
            'auth/invalid-email': {
                code: 'INVALID_EMAIL',
                message: 'Email inválido',
            },
            'auth/operation-not-allowed': {
                code: 'OPERATION_NOT_ALLOWED',
                message: 'Operación no permitida',
            },
            'auth/too-many-requests': {
                code: 'TOO_MANY_REQUESTS',
                message: 'Demasiados intentos. Intenta más tarde',
            },
            'auth/user-disabled': {
                code: 'USER_DISABLED',
                message: 'Esta cuenta ha sido deshabilitada',
            },
            'auth/requires-recent-login': {
                code: 'REQUIRES_RECENT_LOGIN',
                message: 'Por seguridad, vuelve a iniciar sesión',
            },
            'auth/popup-closed-by-user': {
                code: 'POPUP_CLOSED',
                message: 'Ventana cerrada. Intenta nuevamente',
            },
            'auth/network-request-failed': {
                code: 'NETWORK_ERROR',
                message: 'Error de conexión. Verifica tu internet',
            },
        };

        const mappedError = errorMap[code] || {
            code: 'UNKNOWN',
            message: message,
        };

        return new AuthError(mappedError.code, mappedError.message, error);
    }
}