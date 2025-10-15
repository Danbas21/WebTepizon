/**
 * Use Cases: Payment Method Management
 * Gestión de métodos de pago y procesamiento
 */

import { inject } from '@angular/core';
import { Observable } from 'rxjs';
import { CheckoutRepositoryPort } from '../../domain/checkout.repository.port';
import { CheckoutDomainService } from '../../domain/checkout.domain.service';
import { 
  PaymentMethod, 
  CreatePaymentMethodDto,
  PaymentIntent,
  PaymentResult
} from '../../domain/payment-method.model';
import { CheckoutError, CheckoutErrorCode } from '../../domain/checkout.model';

/**
 * Obtiene todos los métodos de pago del usuario
 */
export class GetUserPaymentMethodsUseCase {
  private readonly repository = inject(CheckoutRepositoryPort);

  execute(userId: string): Observable<PaymentMethod[]> {
    return this.repository.getUserPaymentMethods(userId);
  }
}

/**
 * Crea un nuevo método de pago
 */
export class CreatePaymentMethodUseCase {
  private readonly repository = inject(CheckoutRepositoryPort);

  async execute(userId: string, dto: CreatePaymentMethodDto): Promise<PaymentMethod> {
    // Validar tarjeta si aplica
    if (dto.type === 'CARD') {
      if (!dto.cardLast4 || !dto.cardBrand) {
        throw new CheckoutError(
          'Información de tarjeta incompleta',
          CheckoutErrorCode.INVALID_PAYMENT
        );
      }

      // Validar expiración
      if (dto.cardExpiryMonth && dto.cardExpiryYear) {
        const isExpired = CheckoutDomainService.isCardExpired(
          dto.cardExpiryMonth,
          dto.cardExpiryYear
        );

        if (isExpired) {
          throw new CheckoutError(
            'La tarjeta ha expirado',
            CheckoutErrorCode.INVALID_PAYMENT
          );
        }
      }
    }

    // Validar PayPal
    if (dto.type === 'PAYPAL' && !dto.paypalEmail) {
      throw new CheckoutError(
        'Email de PayPal requerido',
        CheckoutErrorCode.INVALID_PAYMENT
      );
    }

    return this.repository.createPaymentMethod(userId, dto);
  }
}

/**
 * Elimina un método de pago
 */
export class DeletePaymentMethodUseCase {
  private readonly repository = inject(CheckoutRepositoryPort);

  async execute(userId: string, methodId: string): Promise<void> {
    await this.repository.deletePaymentMethod(userId, methodId);
  }
}

/**
 * Establece un método de pago como predeterminado
 */
export class SetDefaultPaymentMethodUseCase {
  private readonly repository = inject(CheckoutRepositoryPort);

  async execute(userId: string, methodId: string): Promise<void> {
    await this.repository.setDefaultPaymentMethod(userId, methodId);
  }
}

/**
 * Obtiene el método de pago predeterminado
 */
export class GetDefaultPaymentMethodUseCase {
  private readonly repository = inject(CheckoutRepositoryPort);

  async execute(userId: string): Promise<PaymentMethod | null> {
    return this.repository.getDefaultPaymentMethod(userId);
  }
}

/**
 * Crea un payment intent para procesar el pago
 */
export class CreatePaymentIntentUseCase {
  private readonly repository = inject(CheckoutRepositoryPort);

  async execute(
    userId: string,
    amount: number,
    paymentMethodId: string,
    metadata?: Record<string, any>
  ): Promise<PaymentIntent> {
    if (amount <= 0) {
      throw new CheckoutError(
        'El monto debe ser mayor a 0',
        CheckoutErrorCode.INVALID_PAYMENT
      );
    }

    return this.repository.createPaymentIntent(
      userId,
      amount,
      paymentMethodId,
      metadata
    );
  }
}

/**
 * Confirma y procesa el pago
 */
export class ConfirmPaymentUseCase {
  private readonly repository = inject(CheckoutRepositoryPort);

  async execute(paymentIntentId: string): Promise<PaymentResult> {
    return this.repository.confirmPayment(paymentIntentId);
  }
}
