// src/app/features/checkout/application/use-cases/checkout.use-cases.ts

import { Injectable, inject } from '@angular/core';
import { Observable, forkJoin } from 'rxjs';
import { map, tap, switchMap, catchError } from 'rxjs/operators';

// Domain
import { PaymentIntent } from '../../domain/entities/payment-intent.entity';
import { PaymentMethodType } from '../../domain/ports/payment.port';

// Infrastructure
import { StripePaymentAdapter } from '../../infrastructure/adapters/stripe-payment.adapter';

// Other features
import { CartRepository } from '@features/cart/infrastructure/repositories/cart.repository';
import { AuthRepository } from '@features/auth/infrastructure/repositories/auth.repository';

// Errors
import { PaymentError } from '../../domain/errors/payment.errors';

/**
 * Información de facturación/envío
 */
export interface BillingInfo {
    name: string;
    email: string;
    phone: string;
    address: {
        line1: string;
        line2?: string;
        city: string;
        state: string;
        postal_code: string;
        country: string;
    };
}

/**
 * Resultado del checkout
 */
export interface CheckoutResult {
    success: boolean;
    orderId?: string;
    paymentIntentId?: string;
    error?: string;
}

/**
 * Use Cases de Checkout
 * Orquestan el proceso completo de pago
 */
@Injectable({
    providedIn: 'root',
})
export class CheckoutUseCases {
    private readonly paymentAdapter = inject(StripePaymentAdapter);
    private readonly cartRepository = inject(CartRepository);
    private readonly authRepository = inject(AuthRepository);

    /**
     * Use Case: Inicializar Stripe
     * Debe ejecutarse antes de mostrar el formulario de pago
     */
    async initializePayment(): Promise<void> {
        try {
            await this.paymentAdapter.initializeStripe();
            console.log('Stripe initialized successfully');
        } catch (error) {
            console.error('Error initializing Stripe:', error);
            throw new PaymentError('INIT_FAILED', 'Failed to initialize payment system', error);
        }
    }

    /**
     * Use Case: Crear Payment Intent
     * Genera el intent para procesar el pago
     */
    createPaymentIntent(orderId: string): Observable<PaymentIntent> {
        const cart = this.cartRepository.getCart();

        if (!cart || cart.items.length === 0) {
            throw new PaymentError('EMPTY_CART', 'Cannot create payment for empty cart');
        }

        const user = this.authRepository.currentUser();

        if (!user) {
            throw new PaymentError('NOT_AUTHENTICATED', 'User must be authenticated to checkout');
        }

        // Validar monto
        if (cart.total <= 0) {
            throw new PaymentError('INVALID_AMOUNT', 'Payment amount must be greater than 0');
        }

        const paymentData = {
            amount: Math.round(cart.total * 100), // Convertir a centavos
            currency: 'mxn',
            orderId,
            customerId: user.id,
            metadata: {
                userId: user.id,
                userEmail: user.email,
                itemCount: cart.itemCount,
                subtotal: cart.subtotal,
                discount: cart.discount,
                tax: cart.tax,
                shipping: cart.shipping,
            },
        };

        return this.paymentAdapter.createPaymentIntent(paymentData).pipe(
            tap((paymentIntent) => {
                console.log('Payment intent created:', paymentIntent.id);

                // Analytics
                // this.analytics.trackEvent('payment_intent_created', {
                //   amount: cart.total,
                //   orderId,
                // });
            }),
            catchError((error) => {
                console.error('Error creating payment intent:', error);
                throw error;
            })
        );
    }

    /**
     * Use Case: Procesar pago con tarjeta
     * Completa el proceso de pago
     */
    processCardPayment(
        clientSecret: string,
        billingInfo: BillingInfo
    ): Observable<CheckoutResult> {
        // Validar billing info
        this.validateBillingInfo(billingInfo);

        return this.paymentAdapter.confirmCardPayment(clientSecret, billingInfo).pipe(
            map((result) => {
                if (result.success) {
                    console.log('Payment successful:', result.paymentIntentId);

                    // Analytics
                    // this.analytics.trackEvent('payment_success', {
                    //   paymentIntentId: result.paymentIntentId,
                    //   method: 'card',
                    // });

                    return {
                        success: true,
                        paymentIntentId: result.paymentIntentId,
                    };
                }

                return {
                    success: false,
                    error: result.error || 'Payment failed',
                };
            }),
            catchError((error) => {
                console.error('Error processing card payment:', error);

                // Analytics
                // this.analytics.trackEvent('payment_failed', {
                //   method: 'card',
                //   error: error.message,
                // });

                throw error;
            })
        );
    }

    /**
     * Use Case: Procesar pago con método alternativo (OXXO)
     */
    processAlternativePayment(
        clientSecret: string,
        paymentMethod: PaymentMethodType,
        billingInfo: BillingInfo
    ): Observable<CheckoutResult> {
        // Validar billing info básica
        if (!billingInfo.name || !billingInfo.email) {
            throw new PaymentError('INVALID_BILLING_INFO', 'Name and email are required');
        }

        return this.paymentAdapter.confirmAlternativePayment(
            clientSecret,
            paymentMethod,
            {
                name: billingInfo.name,
                email: billingInfo.email,
            }
        ).pipe(
            map((result) => {
                if (result.success) {
                    console.log('Alternative payment initiated:', result.paymentIntentId);

                    // Analytics
                    // this.analytics.trackEvent('payment_success', {
                    //   paymentIntentId: result.paymentIntentId,
                    //   method: paymentMethod,
                    // });

                    return {
                        success: true,
                        paymentIntentId: result.paymentIntentId,
                    };
                }

                return {
                    success: false,
                    error: 'Payment initialization failed',
                };
            }),
            catchError((error) => {
                console.error('Error processing alternative payment:', error);
                throw error;
            })
        );
    }

    /**
     * Use Case: Procesar pago contra entrega
     * No requiere Payment Intent de Stripe
     */
    processCashOnDelivery(
        orderId: string,
        billingInfo: BillingInfo
    ): Observable<CheckoutResult> {
        // Validar billing info
        this.validateBillingInfo(billingInfo);

        // Para pago contra entrega, solo validamos la orden
        // El pago se procesará al momento de la entrega

        console.log('Cash on delivery order created:', orderId);

        // Analytics
        // this.analytics.trackEvent('payment_success', {
        //   orderId,
        //   method: 'cash_on_delivery',
        // });

        return new Observable((observer) => {
            observer.next({
                success: true,
                orderId,
            });
            observer.complete();
        });
    }

    /**
     * Use Case: Validar información de checkout antes de procesar
     */
    validateCheckoutInfo(billingInfo: BillingInfo): {
        valid: boolean;
        errors: string[];
    } {
        const errors: string[] = [];

        // Validar nombre
        if (!billingInfo.name || billingInfo.name.trim().length < 2) {
            errors.push('Nombre completo es requerido');
        }

        // Validar email
        if (!billingInfo.email || !this.isValidEmail(billingInfo.email)) {
            errors.push('Email válido es requerido');
        }

        // Validar teléfono
        if (!billingInfo.phone || billingInfo.phone.length < 10) {
            errors.push('Teléfono válido es requerido');
        }

        // Validar dirección
        if (!billingInfo.address.line1) {
            errors.push('Dirección es requerida');
        }

        if (!billingInfo.address.city) {
            errors.push('Ciudad es requerida');
        }

        if (!billingInfo.address.state) {
            errors.push('Estado es requerido');
        }

        if (!billingInfo.address.postal_code || billingInfo.address.postal_code.length < 5) {
            errors.push('Código postal válido es requerido');
        }

        if (!billingInfo.address.country) {
            errors.push('País es requerido');
        }

        return {
            valid: errors.length === 0,
            errors,
        };
    }

    /**
     * Use Case: Obtener estado de Payment Intent
     */
    getPaymentStatus(clientSecret: string): Observable<PaymentIntent> {
        return this.paymentAdapter.retrievePaymentIntent(clientSecret).pipe(
            tap((paymentIntent) => {
                console.log('Payment intent status:', paymentIntent.status);
            }),
            catchError((error) => {
                console.error('Error retrieving payment status:', error);
                throw error;
            })
        );
    }

    /**
     * Use Case: Procesar reembolso
     * Solo admin puede ejecutar esto
     */
    processRefund(
        paymentIntentId: string,
        amount?: number,
        reason?: string
    ): Observable<{ success: boolean; refundId: string }> {
        // Verificar permisos de admin
        const user = this.authRepository.currentUser();

        if (!user || user.role !== 'ADMIN') {
            throw new PaymentError('UNAUTHORIZED', 'Only admins can process refunds');
        }

        return this.paymentAdapter.processRefund(paymentIntentId, amount, reason).pipe(
            tap((result) => {
                console.log('Refund processed:', result.refundId);

                // Analytics
                // this.analytics.trackEvent('refund_processed', {
                //   paymentIntentId,
                //   refundId: result.refundId,
                //   amount,
                // });
            }),
            catchError((error) => {
                console.error('Error processing refund:', error);
                throw error;
            })
        );
    }

    /**
     * Limpiar recursos de Stripe
     */
    cleanup(): void {
        this.paymentAdapter.cleanup();
    }

    // ========== MÉTODOS PRIVADOS ==========

    /**
     * Validar información de facturación completa
     */
    private validateBillingInfo(billingInfo: BillingInfo): void {
        const validation = this.validateCheckoutInfo(billingInfo);

        if (!validation.valid) {
            throw new PaymentError(
                'INVALID_BILLING_INFO',
                validation.errors.join(', ')
            );
        }
    }

    /**
     * Validar formato de email
     */
    private isValidEmail(email: string): boolean {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
}