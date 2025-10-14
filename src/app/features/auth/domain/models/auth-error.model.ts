/**
 * Auth Error Models
 * 
 * Errores personalizados para el módulo de autenticación.
 * Proporciona códigos tipados y mensajes en español.
 * 
 * @domain Auth
 */

export enum AuthErrorCode {
  // Errores de login
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  USER_NOT_FOUND = 'USER_NOT_FOUND',
  WRONG_PASSWORD = 'WRONG_PASSWORD',
  TOO_MANY_REQUESTS = 'TOO_MANY_REQUESTS',
  USER_DISABLED = 'USER_DISABLED',
  
  // Errores de registro
  EMAIL_ALREADY_IN_USE = 'EMAIL_ALREADY_IN_USE',
  WEAK_PASSWORD = 'WEAK_PASSWORD',
  INVALID_EMAIL = 'INVALID_EMAIL',
  
  // Errores de social login
  POPUP_CLOSED = 'POPUP_CLOSED',
  REDIRECT_CANCELLED = 'REDIRECT_CANCELLED',
  ACCOUNT_EXISTS_WITH_DIFFERENT_CREDENTIAL = 'ACCOUNT_EXISTS_WITH_DIFFERENT_CREDENTIAL',
  
  // Errores de token
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  INVALID_TOKEN = 'INVALID_TOKEN',
  TOKEN_REFRESH_FAILED = 'TOKEN_REFRESH_FAILED',
  
  // Errores de red
  NETWORK_ERROR = 'NETWORK_ERROR',
  TIMEOUT = 'TIMEOUT',
  
  // Errores generales
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
  UNAUTHORIZED = 'UNAUTHORIZED',
}

export interface AuthErrorDetails {
  code: AuthErrorCode;
  message: string;
  originalError?: unknown;
  timestamp: Date;
}

/**
 * Clase base para errores de autenticación
 */
export class AuthError extends Error {
  public readonly code: AuthErrorCode;
  public readonly timestamp: Date;
  public readonly originalError?: unknown;

  constructor(details: AuthErrorDetails) {
    super(details.message);
    this.name = 'AuthError';
    this.code = details.code;
    this.timestamp = details.timestamp;
    this.originalError = details.originalError;

    // Mantener el stack trace correcto
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AuthError);
    }
  }

  /**
   * Convierte el error a un objeto plano para logging
   */
  toJSON() {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      timestamp: this.timestamp.toISOString(),
      stack: this.stack,
    };
  }
}

/**
 * Mapeo de códigos de Firebase a mensajes en español
 */
const ERROR_MESSAGES: Record<string, { code: AuthErrorCode; message: string }> = {
  // Firebase Auth error codes
  'auth/invalid-email': {
    code: AuthErrorCode.INVALID_EMAIL,
    message: 'El correo electrónico no es válido',
  },
  'auth/user-disabled': {
    code: AuthErrorCode.USER_DISABLED,
    message: 'Esta cuenta ha sido deshabilitada',
  },
  'auth/user-not-found': {
    code: AuthErrorCode.USER_NOT_FOUND,
    message: 'No existe una cuenta con este correo electrónico',
  },
  'auth/wrong-password': {
    code: AuthErrorCode.WRONG_PASSWORD,
    message: 'La contraseña es incorrecta',
  },
  'auth/email-already-in-use': {
    code: AuthErrorCode.EMAIL_ALREADY_IN_USE,
    message: 'Ya existe una cuenta con este correo electrónico',
  },
  'auth/weak-password': {
    code: AuthErrorCode.WEAK_PASSWORD,
    message: 'La contraseña debe tener al menos 6 caracteres',
  },
  'auth/too-many-requests': {
    code: AuthErrorCode.TOO_MANY_REQUESTS,
    message: 'Demasiados intentos fallidos. Intenta de nuevo más tarde',
  },
  'auth/network-request-failed': {
    code: AuthErrorCode.NETWORK_ERROR,
    message: 'Error de conexión. Verifica tu conexión a internet',
  },
  'auth/popup-closed-by-user': {
    code: AuthErrorCode.POPUP_CLOSED,
    message: 'La ventana de inicio de sesión fue cerrada',
  },
  'auth/cancelled-popup-request': {
    code: AuthErrorCode.REDIRECT_CANCELLED,
    message: 'Inicio de sesión cancelado',
  },
  'auth/account-exists-with-different-credential': {
    code: AuthErrorCode.ACCOUNT_EXISTS_WITH_DIFFERENT_CREDENTIAL,
    message: 'Ya existe una cuenta con este correo usando otro método de inicio de sesión',
  },
  'auth/invalid-credential': {
    code: AuthErrorCode.INVALID_CREDENTIALS,
    message: 'Las credenciales proporcionadas no son válidas',
  },
  'auth/operation-not-allowed': {
    code: AuthErrorCode.UNAUTHORIZED,
    message: 'Esta operación no está permitida',
  },
};

/**
 * Factory para crear un AuthError desde un error de Firebase
 */
export function createAuthError(error: unknown): AuthError {
  const timestamp = new Date();

  // Si ya es un AuthError, retornarlo
  if (error instanceof AuthError) {
    return error;
  }

  // Si es un error de Firebase con código
  if (error && typeof error === 'object' && 'code' in error) {
    const firebaseError = error as { code: string; message: string };
    const errorMapping = ERROR_MESSAGES[firebaseError.code];

    if (errorMapping) {
      return new AuthError({
        code: errorMapping.code,
        message: errorMapping.message,
        originalError: error,
        timestamp,
      });
    }
  }

  // Error desconocido
  return new AuthError({
    code: AuthErrorCode.UNKNOWN_ERROR,
    message: 'Ocurrió un error inesperado. Intenta de nuevo',
    originalError: error,
    timestamp,
  });
}

/**
 * Type guard para verificar si un error es de tipo AuthError
 */
export function isAuthError(error: unknown): error is AuthError {
  return error instanceof AuthError;
}

/**
 * Verifica si un error es de tipo específico
 */
export function isAuthErrorCode(error: unknown, code: AuthErrorCode): boolean {
  return isAuthError(error) && error.code === code;
}
