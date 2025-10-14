/**
 * Auth Token Domain Model
 * 
 * Representa el token de autenticación de Firebase que se almacena manualmente.
 * Incluye información de expiración y refresh.
 * 
 * @domain Auth
 */

export interface AuthToken {
  idToken: string;
  refreshToken: string;
  expiresAt: Date;
  issuedAt: Date;
}

/**
 * Factory para crear un nuevo AuthToken
 */
export function createAuthToken(
  idToken: string,
  refreshToken: string,
  expiresIn: number = 3600 // 1 hora por defecto
): AuthToken {
  const now = new Date();
  return {
    idToken,
    refreshToken,
    issuedAt: now,
    expiresAt: new Date(now.getTime() + expiresIn * 1000),
  };
}

/**
 * Verifica si el token ha expirado
 */
export function isTokenExpired(token: AuthToken): boolean {
  return new Date() >= token.expiresAt;
}

/**
 * Verifica si el token está próximo a expirar (dentro de 5 minutos)
 */
export function isTokenExpiringSoon(token: AuthToken): boolean {
  const fiveMinutes = 5 * 60 * 1000;
  const expiresIn = token.expiresAt.getTime() - Date.now();
  return expiresIn <= fiveMinutes;
}

/**
 * Calcula el tiempo restante hasta la expiración en segundos
 */
export function getTokenRemainingTime(token: AuthToken): number {
  const now = Date.now();
  const expiresAt = token.expiresAt.getTime();
  const remaining = Math.floor((expiresAt - now) / 1000);
  return Math.max(0, remaining);
}
