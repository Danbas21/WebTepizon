// ==========================================================
// USER ENTITY
// ==========================================================
// src/app/features/auth/domain/entities/user.entity.ts

/**
 * Roles de usuario en la aplicación
 */
export type UserRole = 'USER' | 'ADMIN';

/**
 * Entidad User del dominio
 * Representa un usuario del sistema
 */
export interface User {
    id: string;
    email: string;
    displayName: string;
    photoURL?: string;
    role: UserRole;
    emailVerified: boolean;
    phone?: string;
    createdAt: Date;
    lastLoginAt: Date;
    updatedAt?: Date;
}
