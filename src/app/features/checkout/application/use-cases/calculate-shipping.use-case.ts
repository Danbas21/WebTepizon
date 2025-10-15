/**
 * Use Case: CalculateShipping
 * Calcula las opciones de envío disponibles
 */

import { inject } from '@angular/core';
import { CheckoutRepositoryPort } from '../../domain/checkout.repository.port';
import { CheckoutDomainService } from '../../domain/checkout.domain.service';
import { ShippingCalculation, ShippingOption } from '../../domain/shipping.model';
import { CheckoutError, CheckoutErrorCode } from '../../domain/checkout.model';

export class CalculateShippingUseCase {
  private readonly repository = inject(CheckoutRepositoryPort);

  async execute(
    userId: string,
    addressId: string,
    cartSubtotal: number
  ): Promise<ShippingCalculation> {
    // Obtener la dirección
    const address = await this.repository.getAddress(userId, addressId);

    if (!address) {
      throw new CheckoutError(
        'Dirección no encontrada',
        CheckoutErrorCode.INVALID_ADDRESS
      );
    }

    // Validar dirección
    const validation = CheckoutDomainService.validateAddress(address);
    if (!validation.isValid) {
      throw new CheckoutError(
        'La dirección seleccionada no es válida',
        CheckoutErrorCode.INVALID_ADDRESS
      );
    }

    // Calcular opciones de envío usando el servicio de dominio
    const shippingOptions = CheckoutDomainService.calculateShippingOptions(
      address.state,
      address.postalCode,
      cartSubtotal
    );

    if (shippingOptions.length === 0) {
      throw new CheckoutError(
        'No hay opciones de envío disponibles para esta dirección',
        CheckoutErrorCode.SHIPPING_NOT_AVAILABLE
      );
    }

    const freeShippingThreshold = 500; // $500 MXN
    const qualifiesForFreeShipping = cartSubtotal >= freeShippingThreshold;

    return {
      addressId: address.id,
      postalCode: address.postalCode,
      state: address.state,
      city: address.city,
      options: shippingOptions,
      cartSubtotal,
      qualifiesForFreeShipping,
      freeShippingThreshold,
      amountUntilFreeShipping: Math.max(0, freeShippingThreshold - cartSubtotal)
    };
  }
}

/**
 * Obtiene las opciones de envío por código postal
 */
export class GetShippingOptionsUseCase {
  private readonly repository = inject(CheckoutRepositoryPort);

  async execute(postalCode: string, state: string): Promise<ShippingOption[]> {
    return this.repository.getShippingOptions(postalCode, state);
  }
}
