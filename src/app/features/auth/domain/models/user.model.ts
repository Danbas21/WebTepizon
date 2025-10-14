/**
 * User Domain Model
 * 
 * Representa la entidad de usuario en el dominio del negocio.
 * Incluye información de perfil, roles y metadatos de autenticación.
 * 
 * @domain Auth
 */

export enum UserRole {
  USER = 'USER',
  ADMIN = 'ADMIN',
}

export enum AuthProvider {
  EMAIL = 'email',
  GOOGLE = 'google.com',
  FACEBOOK = 'facebook.com',
}

export interface UserProfile {
  firstName: string;
  lastName: string;
  phone?: string;
  avatar?: string;
  language: 'es' | 'en';
  theme: 'light' | 'dark';
}

export interface UserAddress {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  isDefault: boolean;
}

export interface User {
  uid: string;
  email: string;
  emailVerified: boolean;
  role: UserRole;
  profile: UserProfile;
  addresses: UserAddress[];
  provider: AuthProvider;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;
  isActive: boolean;
  wishlistCount: number;
  ordersCount: number;
}

/**
 * Factory para crear un nuevo usuario con valores por defecto
 */
export function createUser(partial: Partial<User>): User {
  return {
    uid: partial.uid || '',
    email: partial.email || '',
    emailVerified: partial.emailVerified || false,
    role: partial.role || UserRole.USER,
    profile: partial.profile || {
      firstName: '',
      lastName: '',
      language: 'es',
      theme: 'light',
    },
    addresses: partial.addresses || [],
    provider: partial.provider || AuthProvider.EMAIL,
    createdAt: partial.createdAt || new Date(),
    updatedAt: partial.updatedAt || new Date(),
    lastLoginAt: partial.lastLoginAt,
    isActive: partial.isActive !== undefined ? partial.isActive : true,
    wishlistCount: partial.wishlistCount || 0,
    ordersCount: partial.ordersCount || 0,
  };
}

/**
 * Type guard para verificar si un usuario es admin
 */
export function isAdmin(user: User): boolean {
  return user.role === UserRole.ADMIN;
}

/**
 * Type guard para verificar si un usuario está activo
 */
export function isActiveUser(user: User): boolean {
  return user.isActive && user.emailVerified;
}
