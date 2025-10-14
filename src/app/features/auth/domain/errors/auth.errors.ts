// ==========================================================
// AUTH ERRORS
// ==========================================================
// src/app/features/auth/domain/errors/auth.errors.ts

/**
 * Error base para el dominio de autenticación
 */
export class AuthError extends Error {
    constructor(
        public readonly code: string,
        message: string,
        public readonly originalError?: any
    ) {
        super(message);
        this.name = 'AuthError';

        // Mantener el stack trace correcto
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, AuthError);
        }
    }
}

/**
 * Errores específicos de autenticación
 */
export class InvalidCredentialsError extends AuthError {
    constructor(message = 'Email o contraseña incorrectos') {
        super('INVALID_CREDENTIALS', message);
        this.name = 'InvalidCredentialsError';
    }
}

export class UserNotFoundError extends AuthError {
    constructor(message = 'Usuario no encontrado') {
        super('USER_NOT_FOUND', message);
        this.name = 'UserNotFoundError';
    }
}

export class EmailInUseError extends AuthError {
    constructor(message = 'Este email ya está registrado') {
        super('EMAIL_IN_USE', message);
        this.name = 'EmailInUseError';
    }
}

export class WeakPasswordError extends AuthError {
    constructor(message = 'La contraseña debe tener al menos 6 caracteres') {
        super('WEAK_PASSWORD', message);
        this.name = 'WeakPasswordError';
    }
}

export class UnauthorizedError extends AuthError {
    constructor(message = 'No tienes permiso para realizar esta acción') {
        super('UNAUTHORIZED', message);
        this.name = 'UnauthorizedError';
    }
}
