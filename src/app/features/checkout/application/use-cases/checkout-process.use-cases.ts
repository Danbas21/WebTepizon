/**
 * Use Cases: Checkout Process & Order Creation
 * Gestión del proceso de checkout y creación de órdenes
 */

import { inject } from '@angular/core';
import { Observable, firstValueFrom } from 'rxjs';
import { CheckoutRepositoryPort } from '../../domain/checkout.repository.port';
import { CheckoutDomainService } from '../../domain/checkout.domain.service';
import { 
  CheckoutSession, 
  UpdateCheckoutDto,
  CheckoutStep,
  CheckoutError,
  CheckoutErrorCode
} from '../../domain/checkout.model';
import { Order, CreateOrderDto } from '../../domain/order.model';

/**
 * Obtiene o crea la sesión de checkout
 */
export class GetCheckoutSessionUseCase {
  private readonly repository = inject(CheckoutRepositoryPort);

  execute(userId: string): Observable<CheckoutSession> {
    return this.repository.getCheckoutSession(userId);
  }
}

/**
 * Inicia una nueva sesión de checkout
 */
export class StartCheckoutUseCase {
  private readonly repository = inject(CheckoutRepositoryPort);

  async execute(userId: string, cartId: string): Promise<CheckoutSession> {
    // Validar que el carrito tenga items
    const hasStock = await this.repository.validateCartStock(cartId);
    
    if (!hasStock) {
      throw new CheckoutError(
        'Algunos productos en tu carrito ya no tienen stock disponible',
        CheckoutErrorCode.INSUFFICIENT_STOCK
      );
    }

    return this.repository.createCheckoutSession(userId, cartId);
  }
}

/**
 * Actualiza la sesión de checkout
 */
export class UpdateCheckoutSessionUseCase {
  private readonly repository = inject(CheckoutRepositoryPort);

  async execute(
    userId: string, 
    updates: UpdateCheckoutDto
  ): Promise<CheckoutSession> {
    const session = await firstValueFrom(
      this.repository.getCheckoutSession(userId)
    );

    // Validar si la sesión ha expirado
    if (CheckoutDomainService.isSessionExpired(session)) {
      throw new CheckoutError(
        'Tu sesión de checkout ha expirado. Por favor, inicia de nuevo.',
        CheckoutErrorCode.SESSION_EXPIRED
      );
    }

    // Validar transición de paso
    if (updates.step) {
      const canProceed = CheckoutDomainService.canProceedToNextStep(
        session.currentStep,
        session
      );

      if (!canProceed && updates.step > session.currentStep) {
        throw new CheckoutError(
          'Debes completar el paso actual antes de continuar',
          CheckoutErrorCode.INVALID_ADDRESS
        );
      }
    }

    return this.repository.updateCheckoutSession(userId, updates);
  }
}

/**
 * Avanza al siguiente paso del checkout
 */
export class ProceedToNextStepUseCase {
  private readonly repository = inject(CheckoutRepositoryPort);

  async execute(userId: string): Promise<CheckoutSession> {
    const session = await firstValueFrom(
      this.repository.getCheckoutSession(userId)
    );

    // Validar que se puede avanzar
    const canProceed = CheckoutDomainService.canProceedToNextStep(
      session.currentStep,
      session
    );

    if (!canProceed) {
      throw new CheckoutError(
        'Completa la información requerida antes de continuar',
        CheckoutErrorCode.INVALID_ADDRESS,
        session.currentStep
      );
    }

    // Determinar siguiente paso
    const steps = [CheckoutStep.SHIPPING, CheckoutStep.PAYMENT, CheckoutStep.REVIEW];
    const currentIndex = steps.indexOf(session.currentStep);
    const nextStep = steps[currentIndex + 1];

    if (!nextStep) {
      throw new CheckoutError(
        'Ya estás en el último paso',
        CheckoutErrorCode.UNKNOWN_ERROR
      );
    }

    return this.repository.updateCheckoutSession(userId, { step: nextStep });
  }
}

/**
 * Regresa al paso anterior del checkout
 */
export class GoToPreviousStepUseCase {
  private readonly repository = inject(CheckoutRepositoryPort);

  async execute(userId: string): Promise<CheckoutSession> {
    const session = await firstValueFrom(
      this.repository.getCheckoutSession(userId)
    );

    const steps = [CheckoutStep.SHIPPING, CheckoutStep.PAYMENT, CheckoutStep.REVIEW];
    const currentIndex = steps.indexOf(session.currentStep);
    const previousStep = steps[currentIndex - 1];

    if (!previousStep) {
      throw new CheckoutError(
        'Ya estás en el primer paso',
        CheckoutErrorCode.UNKNOWN_ERROR
      );
    }

    return this.repository.updateCheckoutSession(userId, { step: previousStep });
  }
}

/**
 * Crea la orden y procesa el pago
 */
export class CreateOrderUseCase {
  private readonly repository = inject(CheckoutRepositoryPort);

  async execute(userId: string): Promise<Order> {
    // Obtener sesión de checkout
    const session = await firstValueFrom(
      this.repository.getCheckoutSession(userId)
    );

    // Validar sesión
    const validation = CheckoutDomainService.validateCheckoutSession(session);
    
    if (!validation.canPlaceOrder) {
      const errorMessages = validation.errors.map(e => e.message).join(', ');
      throw new CheckoutError(
        `No se puede crear la orden: ${errorMessages}`,
        validation.errors[0]?.code || CheckoutErrorCode.UNKNOWN_ERROR
      );
    }

    // Validar stock nuevamente
    const hasStock = await this.repository.validateCartStock(session.cartId);
    if (!hasStock) {
      throw new CheckoutError(
        'Algunos productos ya no tienen stock disponible',
        CheckoutErrorCode.INSUFFICIENT_STOCK
      );
    }

    // Crear DTO de orden
    const orderDto: CreateOrderDto = {
      userId,
      cartId: session.cartId,
      shippingAddressId: session.selectedAddress!.id,
      shippingOptionId: session.selectedShippingOption!.id,
      paymentMethodId: session.selectedPaymentMethod!.id,
      requiresInvoice: session.requiresInvoice,
      invoice: session.invoiceData,
      customerNotes: undefined
    };

    // Crear orden
    const order = await this.repository.createOrder(orderDto);

    // Limpiar sesión de checkout después de crear la orden
    await this.repository.clearCheckoutSession(userId);

    return order;
  }
}

/**
 * Cancela la sesión de checkout
 */
export class CancelCheckoutUseCase {
  private readonly repository = inject(CheckoutRepositoryPort);

  async execute(userId: string): Promise<void> {
    await this.repository.clearCheckoutSession(userId);
  }
}

/**
 * Valida la sesión de checkout actual
 */
export class ValidateCheckoutUseCase {
  private readonly repository = inject(CheckoutRepositoryPort);

  async execute(userId: string) {
    const session = await firstValueFrom(
      this.repository.getCheckoutSession(userId)
    );

    return CheckoutDomainService.validateCheckoutSession(session);
  }
}
