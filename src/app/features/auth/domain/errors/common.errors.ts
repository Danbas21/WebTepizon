// ==========================================================
// SHARED ERRORS (UTILITY)
// ==========================================================
// src/app/shared/errors/common.errors.ts

/**
 * Error de validación genérico
 */
export class ValidationError extends Error {
    constructor(
        public readonly field: string,
        message: string
    ) {
        super(message);
        this.name = 'ValidationError';

        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, ValidationError);
        }
    }
}

/**
 * Error de red/conexión
 */
export class NetworkError extends Error {
    constructor(message = 'Error de conexión. Verifica tu internet') {
        super(message);
        this.name = 'NetworkError';

        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, NetworkError);
        }
    }
}

/**
 * Error de servicio no disponible
 */
export class ServiceUnavailableError extends Error {
    constructor(service: string) {
        super(`El servicio ${service} no está disponible temporalmente`);
        this.name = 'ServiceUnavailableError';

        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, ServiceUnavailableError);
        }
    }
}

/**
 * Error de permisos
 */
export class PermissionDeniedError extends Error {
    constructor(message = 'No tienes permisos para realizar esta acción') {
        super(message);
        this.name = 'PermissionDeniedError';

        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, PermissionDeniedError);
        }
    }
}