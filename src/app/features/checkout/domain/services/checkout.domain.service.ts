/**
 * Servicio de Dominio: CheckoutDomainService
 * Contiene la lógica de negocio pura de Checkout
 */

import { 
  Address, 
  AddressValidationResult, 
  AddressValidationError,
  MEXICO_STATES 
} from './address.model';
import { PaymentMethod, CardBrand } from './payment-method.model';
import { 
  ShippingCalculation, 
  ShippingOption, 
  ShippingType,
  MEXICO_SHIPPING_CONFIG 
} from './shipping.model';
import { 
  CheckoutSession, 
  CheckoutStep, 
  CheckoutValidations,
  CheckoutError,
  CheckoutErrorCode,
  CheckoutProgress
} from './checkout.model';
import { Order, OrderStatus } from './order.model';

export class CheckoutDomainService {
  private static readonly POSTAL_CODE_REGEX = /^\d{5}$/;
  private static readonly PHONE_REGEX = /^(\+52)?[\s\-]?(\d{10})$/;
  private static readonly RFC_REGEX = /^([A-ZÑ&]{3,4})(\d{6})([A-Z\d]{3})$/;
  private static readonly EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  private static readonly SESSION_DURATION_HOURS = 2;

  // ========== ADDRESS VALIDATION ==========

  /**
   * Valida una dirección completa
   */
  static validateAddress(address: Partial<Address>): AddressValidationResult {
    const errors: AddressValidationError[] = [];

    // Nombre completo
    if (!address.fullName || address.fullName.trim().length < 3) {
      errors.push({
        field: 'fullName',
        message: 'El nombre completo es requerido (mínimo 3 caracteres)',
        code: 'INVALID_FULL_NAME'
      });
    }

    // Teléfono
    if (!address.phoneNumber || !this.PHONE_REGEX.test(address.phoneNumber)) {
      errors.push({
        field: 'phoneNumber',
        message: 'El teléfono debe ser de 10 dígitos',
        code: 'INVALID_PHONE'
      });
    }

    // Email (opcional pero si existe debe ser válido)
    if (address.email && !this.EMAIL_REGEX.test(address.email)) {
      errors.push({
        field: 'email',
        message: 'El correo electrónico no es válido',
        code: 'INVALID_EMAIL'
      });
    }

    // Calle
    if (!address.street || address.street.trim().length < 3) {
      errors.push({
        field: 'street',
        message: 'La calle es requerida',
        code: 'INVALID_STREET'
      });
    }

    // Número exterior
    if (!address.exteriorNumber || address.exteriorNumber.trim().length === 0) {
      errors.push({
        field: 'exteriorNumber',
        message: 'El número exterior es requerido',
        code: 'INVALID_EXTERIOR_NUMBER'
      });
    }

    // Colonia
    if (!address.neighborhood || address.neighborhood.trim().length < 3) {
      errors.push({
        field: 'neighborhood',
        message: 'La colonia es requerida',
        code: 'INVALID_NEIGHBORHOOD'
      });
    }

    // Ciudad
    if (!address.city || address.city.trim().length < 3) {
      errors.push({
        field: 'city',
        message: 'La ciudad es requerida',
        code: 'INVALID_CITY'
      });
    }

    // Estado
    if (!address.state || !MEXICO_STATES.includes(address.state as any)) {
      errors.push({
        field: 'state',
        message: 'El estado no es válido',
        code: 'INVALID_STATE'
      });
    }

    // Código postal
    if (!address.postalCode || !this.POSTAL_CODE_REGEX.test(address.postalCode)) {
      errors.push({
        field: 'postalCode',
        message: 'El código postal debe ser de 5 dígitos',
        code: 'INVALID_POSTAL_CODE'
      });
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Valida RFC para facturación
   */
  static validateRFC(rfc: string): boolean {
    return this.RFC_REGEX.test(rfc.toUpperCase());
  }

  // ========== SHIPPING CALCULATIONS ==========

  /**
   * Calcula las opciones de envío disponibles
   */
  static calculateShippingOptions(
    state: string,
    postalCode: string,
    cartSubtotal: number
  ): ShippingOption[] {
    const zone = this.getShippingZone(state);
    const qualifiesForFree = cartSubtotal >= MEXICO_SHIPPING_CONFIG.FREE_SHIPPING_THRESHOLD;
    
    const options: ShippingOption[] = [];
    const today = new Date();

    // Envío Estándar
    const standardCost = qualifiesForFree ? 0 : zone.baseCost;
    const standardDate = this.addBusinessDays(today, zone.estimatedDays);
    
    options.push({
      id: 'standard',
      name: 'Envío Estándar',
      description: `Entrega en ${zone.estimatedDays} días hábiles`,
      cost: standardCost,
      estimatedDays: zone.estimatedDays,
      estimatedDeliveryDate: standardDate,
      type: ShippingType.STANDARD,
      isFree: standardCost === 0,
      isAvailable: true
    });

    // Envío Express (no aplica envío gratis)
    const expressCost = zone.baseCost * MEXICO_SHIPPING_CONFIG.EXPRESS_MULTIPLIER;
    const expressDate = this.addBusinessDays(today, MEXICO_SHIPPING_CONFIG.EXPRESS_ESTIMATED_DAYS);
    
    options.push({
      id: 'express',
      name: 'Envío Express',
      description: 'Entrega en 2 días hábiles',
      cost: expressCost,
      estimatedDays: MEXICO_SHIPPING_CONFIG.EXPRESS_ESTIMATED_DAYS,
      estimatedDeliveryDate: expressDate,
      type: ShippingType.EXPRESS,
      isFree: false,
      isAvailable: true,
      carrier: 'DHL Express'
    });

    // Same Day (solo para zona central)
    if (zone.name === 'CENTRAL' && this.canDeliverSameDay()) {
      const sameDayCost = zone.baseCost * MEXICO_SHIPPING_CONFIG.SAME_DAY_MULTIPLIER;
      const sameDayDate = new Date(today);
      sameDayDate.setHours(today.getHours() + MEXICO_SHIPPING_CONFIG.SAME_DAY_HOURS);

      options.push({
        id: 'same-day',
        name: 'Entrega el mismo día',
        description: `Entrega en ${MEXICO_SHIPPING_CONFIG.SAME_DAY_HOURS} horas`,
        cost: sameDayCost,
        estimatedDays: 0,
        estimatedDeliveryDate: sameDayDate,
        type: ShippingType.SAME_DAY,
        isFree: false,
        isAvailable: true,
        carrier: 'Mensajería Express',
        restrictions: ['Disponible solo antes de las 12:00 PM']
      });
    }

    return options;
  }

  /**
   * Determina la zona de envío basada en el estado
   */
  private static getShippingZone(state: string): { name: string; baseCost: number; estimatedDays: number } {
    const zones = MEXICO_SHIPPING_CONFIG.ZONES;

    if (zones.CENTRAL.states.includes(state)) {
      return { name: 'CENTRAL', ...zones.CENTRAL };
    }
    if (zones.NORTH.states.includes(state)) {
      return { name: 'NORTH', ...zones.NORTH };
    }
    if (zones.SOUTH.states.includes(state)) {
      return { name: 'SOUTH', ...zones.SOUTH };
    }
    if (zones.WEST.states.includes(state)) {
      return { name: 'WEST', ...zones.WEST };
    }

    return { name: 'OTHER', ...zones.OTHER };
  }

  /**
   * Agrega días hábiles a una fecha
   */
  private static addBusinessDays(date: Date, days: number): Date {
    const result = new Date(date);
    let addedDays = 0;

    while (addedDays < days) {
      result.setDate(result.getDate() + 1);
      const dayOfWeek = result.getDay();
      
      // Saltar fines de semana
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        addedDays++;
      }
    }

    return result;
  }

  /**
   * Verifica si se puede entregar el mismo día
   */
  private static canDeliverSameDay(): boolean {
    const now = new Date();
    const hour = now.getHours();
    const dayOfWeek = now.getDay();
    
    // Solo de lunes a viernes antes de las 12:00 PM
    return dayOfWeek >= 1 && dayOfWeek <= 5 && hour < 12;
  }

  // ========== CHECKOUT VALIDATION ==========

  /**
   * Valida el estado completo del checkout
   */
  static validateCheckoutSession(session: CheckoutSession): CheckoutValidations {
    const errors: CheckoutError[] = [];
    
    // Validar carrito
    const hasValidCart = session.orderSummary.itemsCount > 0;
    if (!hasValidCart) {
      errors.push({
        code: CheckoutErrorCode.EMPTY_CART,
        message: 'El carrito está vacío',
        step: CheckoutStep.SHIPPING
      });
    }

    // Validar dirección
    const hasValidAddress = !!session.selectedAddress;
    if (!hasValidAddress && session.currentStep !== CheckoutStep.SHIPPING) {
      errors.push({
        code: CheckoutErrorCode.INVALID_ADDRESS,
        message: 'Debes seleccionar una dirección de envío',
        step: CheckoutStep.SHIPPING
      });
    }

    // Validar envío
    const hasValidShipping = !!session.selectedShippingOption;
    if (!hasValidShipping && session.currentStep === CheckoutStep.REVIEW) {
      errors.push({
        code: CheckoutErrorCode.INVALID_SHIPPING,
        message: 'Debes seleccionar un método de envío',
        step: CheckoutStep.SHIPPING
      });
    }

    // Validar método de pago
    const hasValidPayment = !!session.selectedPaymentMethod;
    if (!hasValidPayment && session.currentStep === CheckoutStep.REVIEW) {
      errors.push({
        code: CheckoutErrorCode.INVALID_PAYMENT,
        message: 'Debes seleccionar un método de pago',
        step: CheckoutStep.PAYMENT
      });
    }

    // Verificar stock (se asume que se validó externamente)
    const hasStockAvailable = true;

    const canPlaceOrder = 
      hasValidCart &&
      hasValidAddress &&
      hasValidShipping &&
      hasValidPayment &&
      hasStockAvailable &&
      errors.length === 0;

    return {
      hasValidCart,
      hasValidAddress,
      hasValidShipping,
      hasValidPayment,
      hasStockAvailable,
      canPlaceOrder,
      errors,
      warnings: []
    };
  }

  /**
   * Determina si se puede avanzar al siguiente paso
   */
  static canProceedToNextStep(
    currentStep: CheckoutStep,
    session: CheckoutSession
  ): boolean {
    switch (currentStep) {
      case CheckoutStep.SHIPPING:
        return !!session.selectedAddress && !!session.selectedShippingOption;
      
      case CheckoutStep.PAYMENT:
        return !!session.selectedPaymentMethod;
      
      case CheckoutStep.REVIEW:
        return this.validateCheckoutSession(session).canPlaceOrder;
      
      default:
        return false;
    }
  }

  /**
   * Calcula el progreso del checkout
   */
  static calculateProgress(session: CheckoutSession): CheckoutProgress {
    const steps = [CheckoutStep.SHIPPING, CheckoutStep.PAYMENT, CheckoutStep.REVIEW];
    const currentIndex = steps.indexOf(session.currentStep);
    const completedSteps = session.completedSteps.length;
    
    return {
      currentStep: session.currentStep,
      totalSteps: steps.length,
      completedSteps,
      percentageComplete: (completedSteps / steps.length) * 100,
      nextStep: currentIndex < steps.length - 1 ? steps[currentIndex + 1] : undefined,
      previousStep: currentIndex > 0 ? steps[currentIndex - 1] : undefined
    };
  }

  // ========== ORDER GENERATION ==========

  /**
   * Genera un número de orden único
   */
  static generateOrderNumber(): string {
    const year = new Date().getFullYear();
    const random = Math.floor(Math.random() * 99999).toString().padStart(5, '0');
    return `ORD-${year}-${random}`;
  }

  /**
   * Verifica si una sesión de checkout ha expirado
   */
  static isSessionExpired(session: CheckoutSession): boolean {
    return new Date() > session.expiresAt;
  }

  /**
   * Calcula la fecha de expiración de una sesión
   */
  static calculateSessionExpiry(): Date {
    const expiry = new Date();
    expiry.setHours(expiry.getHours() + this.SESSION_DURATION_HOURS);
    return expiry;
  }

  // ========== PAYMENT VALIDATION ==========

  /**
   * Valida si una tarjeta ha expirado
   */
  static isCardExpired(expiryMonth: number, expiryYear: number): boolean {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    if (expiryYear < currentYear) {
      return true;
    }
    
    if (expiryYear === currentYear && expiryMonth < currentMonth) {
      return true;
    }

    return false;
  }

  /**
   * Detecta la marca de tarjeta por el número
   */
  static detectCardBrand(cardNumber: string): CardBrand {
    const cleaned = cardNumber.replace(/\s/g, '');
    
    if (/^4/.test(cleaned)) {
      return CardBrand.VISA;
    }
    if (/^5[1-5]/.test(cleaned)) {
      return CardBrand.MASTERCARD;
    }
    if (/^3[47]/.test(cleaned)) {
      return CardBrand.AMEX;
    }
    if (/^6(?:011|5)/.test(cleaned)) {
      return CardBrand.DISCOVER;
    }

    return CardBrand.UNKNOWN;
  }

  // ========== HELPERS ==========

  /**
   * Formatea un número de teléfono
   */
  static formatPhoneNumber(phone: string): string {
    const cleaned = phone.replace(/\D/g, '');
    
    if (cleaned.length === 10) {
      return cleaned.replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3');
    }
    
    return phone;
  }

  /**
   * Formatea un código postal
   */
  static formatPostalCode(postalCode: string): string {
    return postalCode.replace(/\D/g, '').substring(0, 5);
  }
}
