/**
 * Use Cases: Address Management
 * Gestión completa de direcciones de envío
 */

import { inject } from '@angular/core';
import { Observable } from 'rxjs';
import { CheckoutRepositoryPort } from '../../domain/checkout.repository.port';
import { CheckoutDomainService } from '../../domain/checkout.domain.service';
import { 
  Address, 
  CreateAddressDto, 
  UpdateAddressDto 
} from '../../domain/address.model';
import { CheckoutError, CheckoutErrorCode } from '../../domain/checkout.model';

/**
 * Obtiene todas las direcciones del usuario
 */
export class GetUserAddressesUseCase {
  private readonly repository = inject(CheckoutRepositoryPort);

  execute(userId: string): Observable<Address[]> {
    return this.repository.getUserAddresses(userId);
  }
}

/**
 * Crea una nueva dirección
 */
export class CreateAddressUseCase {
  private readonly repository = inject(CheckoutRepositoryPort);

  async execute(userId: string, dto: CreateAddressDto): Promise<Address> {
    // Validar dirección
    const validation = CheckoutDomainService.validateAddress(dto);
    
    if (!validation.isValid) {
      const errorMessages = validation.errors.map(e => e.message).join(', ');
      throw new CheckoutError(
        `Dirección inválida: ${errorMessages}`,
        CheckoutErrorCode.INVALID_ADDRESS
      );
    }

    // Crear dirección
    const address = await this.repository.createAddress(userId, {
      ...dto,
      country: dto.country || 'México'
    });

    return address;
  }
}

/**
 * Actualiza una dirección existente
 */
export class UpdateAddressUseCase {
  private readonly repository = inject(CheckoutRepositoryPort);

  async execute(
    userId: string, 
    addressId: string, 
    dto: UpdateAddressDto
  ): Promise<Address> {
    // Validar campos actualizados
    if (Object.keys(dto).length > 0) {
      const validation = CheckoutDomainService.validateAddress(dto);
      
      if (!validation.isValid) {
        const errorMessages = validation.errors.map(e => e.message).join(', ');
        throw new CheckoutError(
          `Datos inválidos: ${errorMessages}`,
          CheckoutErrorCode.INVALID_ADDRESS
        );
      }
    }

    return this.repository.updateAddress(userId, addressId, dto);
  }
}

/**
 * Elimina una dirección
 */
export class DeleteAddressUseCase {
  private readonly repository = inject(CheckoutRepositoryPort);

  async execute(userId: string, addressId: string): Promise<void> {
    await this.repository.deleteAddress(userId, addressId);
  }
}

/**
 * Establece una dirección como predeterminada
 */
export class SetDefaultAddressUseCase {
  private readonly repository = inject(CheckoutRepositoryPort);

  async execute(userId: string, addressId: string): Promise<void> {
    await this.repository.setDefaultAddress(userId, addressId);
  }
}

/**
 * Obtiene la dirección predeterminada del usuario
 */
export class GetDefaultAddressUseCase {
  private readonly repository = inject(CheckoutRepositoryPort);

  async execute(userId: string): Promise<Address | null> {
    return this.repository.getDefaultAddress(userId);
  }
}
