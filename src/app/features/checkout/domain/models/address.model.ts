/**
 * Modelo de dominio: Address
 * Representa una dirección de envío del usuario
 */

export interface Address {
  readonly id: string;
  readonly userId: string;
  
  // Información del destinatario
  readonly fullName: string;
  readonly phoneNumber: string;
  readonly email?: string;
  
  // Dirección
  readonly street: string;
  readonly exteriorNumber: string;
  readonly interiorNumber?: string;
  readonly neighborhood: string; // Colonia
  readonly city: string; // Ciudad/Municipio
  readonly state: string; // Estado
  readonly postalCode: string; // Código Postal
  readonly country: string; // Default: México
  
  // Referencias
  readonly references?: string; // "Entre calle X y Y"
  readonly additionalInfo?: string;
  
  // Configuración
  readonly isDefault: boolean;
  readonly label?: string; // "Casa", "Oficina", etc.
  readonly type: AddressType;
  
  // Metadata
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly lastUsedAt?: Date;
}

export enum AddressType {
  HOME = 'HOME',
  OFFICE = 'OFFICE',
  OTHER = 'OTHER'
}

export interface CreateAddressDto {
  fullName: string;
  phoneNumber: string;
  email?: string;
  street: string;
  exteriorNumber: string;
  interiorNumber?: string;
  neighborhood: string;
  city: string;
  state: string;
  postalCode: string;
  country?: string;
  references?: string;
  additionalInfo?: string;
  isDefault?: boolean;
  label?: string;
  type?: AddressType;
}

export interface UpdateAddressDto {
  fullName?: string;
  phoneNumber?: string;
  email?: string;
  street?: string;
  exteriorNumber?: string;
  interiorNumber?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  references?: string;
  additionalInfo?: string;
  isDefault?: boolean;
  label?: string;
  type?: AddressType;
}

export interface AddressValidationResult {
  isValid: boolean;
  errors: AddressValidationError[];
}

export interface AddressValidationError {
  field: string;
  message: string;
  code: string;
}

// Estados de México
export const MEXICO_STATES = [
  'Aguascalientes', 'Baja California', 'Baja California Sur', 'Campeche',
  'Chiapas', 'Chihuahua', 'Coahuila', 'Colima', 'Ciudad de México',
  'Durango', 'Guanajuato', 'Guerrero', 'Hidalgo', 'Jalisco',
  'Estado de México', 'Michoacán', 'Morelos', 'Nayarit', 'Nuevo León',
  'Oaxaca', 'Puebla', 'Querétaro', 'Quintana Roo', 'San Luis Potosí',
  'Sinaloa', 'Sonora', 'Tabasco', 'Tamaulipas', 'Tlaxcala',
  'Veracruz', 'Yucatán', 'Zacatecas'
] as const;

export type MexicoState = typeof MEXICO_STATES[number];
