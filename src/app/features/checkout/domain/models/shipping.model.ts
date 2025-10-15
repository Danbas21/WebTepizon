/**
 * Modelo de dominio: Shipping
 * Representa las opciones y cálculos de envío
 */

export interface ShippingOption {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly cost: number;
  readonly estimatedDays: number;
  readonly estimatedDeliveryDate: Date;
  readonly type: ShippingType;
  readonly carrier?: string; // "DHL", "FedEx", "Estafeta"
  readonly isFree: boolean;
  readonly isAvailable: boolean;
  readonly restrictions?: string[];
}

export enum ShippingType {
  STANDARD = 'STANDARD',
  EXPRESS = 'EXPRESS',
  SAME_DAY = 'SAME_DAY',
  PICKUP = 'PICKUP' // Recoger en tienda
}

export interface ShippingZone {
  readonly id: string;
  readonly name: string;
  readonly states: string[];
  readonly postalCodeRanges?: PostalCodeRange[];
  readonly baseCost: number;
  readonly additionalCostPerKg?: number;
  readonly freeShippingThreshold?: number; // Envío gratis si supera este monto
  readonly estimatedDays: number;
}

export interface PostalCodeRange {
  readonly from: string;
  readonly to: string;
}

export interface ShippingCalculation {
  readonly addressId: string;
  readonly postalCode: string;
  readonly state: string;
  readonly city: string;
  readonly zone?: ShippingZone;
  readonly options: ShippingOption[];
  readonly selectedOptionId?: string;
  readonly cartSubtotal: number;
  readonly qualifiesForFreeShipping: boolean;
  readonly freeShippingThreshold: number; // $500 MXN
  readonly amountUntilFreeShipping: number;
}

export interface ShippingRate {
  readonly zoneId: string;
  readonly baseRate: number;
  readonly perKgRate: number;
  readonly expressMultiplier: number; // e.g., 1.5x for express
  readonly sameDayMultiplier: number; // e.g., 2x for same day
}

export interface DeliveryEstimate {
  readonly minDays: number;
  readonly maxDays: number;
  readonly estimatedDate: Date;
  readonly minDate: Date;
  readonly maxDate: Date;
}

// Configuración de envío para México
export const MEXICO_SHIPPING_CONFIG = {
  FREE_SHIPPING_THRESHOLD: 500, // $500 MXN
  STANDARD_BASE_COST: 99, // $99 MXN
  EXPRESS_MULTIPLIER: 1.5,
  SAME_DAY_MULTIPLIER: 2.5,
  DEFAULT_ESTIMATED_DAYS: 5,
  EXPRESS_ESTIMATED_DAYS: 2,
  SAME_DAY_HOURS: 4,
  
  // Zonas de envío
  ZONES: {
    CENTRAL: {
      states: ['Ciudad de México', 'Estado de México', 'Morelos', 'Puebla', 'Tlaxcala'],
      baseCost: 99,
      estimatedDays: 2
    },
    NORTH: {
      states: ['Baja California', 'Chihuahua', 'Coahuila', 'Nuevo León', 'Sonora', 'Tamaulipas'],
      baseCost: 149,
      estimatedDays: 4
    },
    SOUTH: {
      states: ['Chiapas', 'Oaxaca', 'Quintana Roo', 'Tabasco', 'Veracruz', 'Yucatán'],
      baseCost: 149,
      estimatedDays: 5
    },
    WEST: {
      states: ['Colima', 'Jalisco', 'Michoacán', 'Nayarit', 'Sinaloa'],
      baseCost: 129,
      estimatedDays: 3
    },
    OTHER: {
      states: [], // Resto de estados
      baseCost: 129,
      estimatedDays: 4
    }
  }
} as const;
