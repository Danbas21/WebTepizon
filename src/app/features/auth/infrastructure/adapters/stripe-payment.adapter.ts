// src/app/features/checkout/infrastructure/adapters/stripe-payment.adapter.ts

import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, from, throwError, of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { loadStripe, Stripe, StripeElements, StripeCardElement } from '@stripe/stripe-js';

// Domain
import { PaymentPort, PaymentIntentData, PaymentMethodType } from '../../domain/ports/payment.port';
import { PaymentIntent } from '../../domain/entities/payment-intent.entity';
import { PaymentError } from '../../domain/errors/payment.errors';

// Environment
import { environment } from '@env/environment';

/**
 * Adapter para Stripe Payments
 * Maneja la creación de Payment Intents y procesamiento de pagos
 * Se comunica con Cloud Functions para operaciones server-side
 */
@Injectable({
    providedIn: 'root',
})
export class StripePaymentAdapter implements PaymentPort {
    private readonly http = inject(HttpClient);
    private stripe: Stripe | null = null;
    private elements: StripeElements | null = null;
    private cardElement: StripeCardElement | null = null;

    // URLs de Cloud Functions
    private readonly functionsUrl = environment.functionsUrl;
    private readonly createPaymentIntentUrl = `${this.functionsUrl}/createPaymentIntent`;
    private readonly processRefundUrl = `${this.functionsUrl}/processRefund`;

    /**
     * Inicializar Stripe SDK
     * Debe llamarse antes de usar cualquier otro método
     */
    async initializeStripe(): Promise<void> {
        if (this.stripe) return; // Ya inicializado

        try {
            this.stripe = await loadStripe(environment.stripePublicKey);
            if (!this.stripe) {
                throw new PaymentError('STRIPE_INIT_FAILED', 'Failed to initialize Stripe');
            }
        } catch (error) {
            throw this.handlePaymentError(error);
        }
    }

    /**
     * Crear elementos de Stripe (Card Element)
     * Para formularios de tarjeta customizados
     */
    createCardElement(containerId: string): void {
        if (!this.stripe) {
            throw new PaymentError('STRIPE_NOT_INITIALIZED', 'Stripe must be initialized first');
        }

        this.elements = this.stripe.elements({
            locale: 'es-419', // Español latinoamericano
        });

        this.cardElement = this.elements.create('card', {
            style: {
                base: {
                    fontSize: '16px',
                    color: '#000000',
                    fontFamily: 'Inter, sans-serif',
                    '::placeholder': {
                        color: '#a0a0a0',
                    },
                },
                invalid: {
                    color: '#dc2626',
                    iconColor: '#dc2626',
                },
            },
            hidePostalCode: false,
        });

        const container = document.getElementById(containerId);
        if (container) {
            this.cardElement.mount(`#${containerId}`);
        }
    }

    /**
     * Crear Payment Intent
     * Se comunica con Cloud Function para crear el intent en el server
     */
    createPaymentIntent(data: PaymentIntentData): Observable<PaymentIntent> {
        const headers = new HttpHeaders({
            'Content-Type': 'application/json',
        });

        const body = {
            amount: data.amount,
            currency: data.currency || 'mxn',
            orderId: data.orderId,
            customerId: data.customerId,
            metadata: data.metadata || {},
        };

        return this.http.post<any>(this.createPaymentIntentUrl, body, { headers }).pipe(
            map((response) => ({
                id: response.id,
                clientSecret: response.clientSecret,
                amount: response.amount,
                currency: response.currency,
                status: response.status,
                orderId: data.orderId,
                customerId: data.customerId,
                createdAt: new Date(response.created * 1000),
            })),
            catchError((error) => throwError(() => this.handlePaymentError(error)))
        );
    }

    /**
     * Confirmar pago con tarjeta
     * Usa el Card Element para procesar el pago
     */
    confirmCardPayment(
        clientSecret: string,
        billingDetails: {
            name: string;
            email: string;
            phone?: string;
            address?: {
                line1: string;
                city: string;
                state: string;
                postal_code: string;
                country: string;
            };
        }
    ): Observable<{ success: boolean; paymentIntentId?: string; error?: string }> {
        if (!this.stripe || !this.cardElement) {
            return throwError(() =>
                new PaymentError('STRIPE_NOT_INITIALIZED', 'Stripe or Card Element not initialized')
            );
        }

        return from(
            this.stripe.confirmCardPayment(clientSecret, {
                payment_method: {
                    card: this.cardElement,
                    billing_details: billingDetails,
                },
            })
        ).pipe(
            map((result) => {
                if (result.error) {
                    throw new PaymentError(
                        'PAYMENT_FAILED',
                        result.error.message || 'Payment failed',
                        result.error
                    );
                }

                return {
                    success: true,
                    paymentIntentId: result.paymentIntent.id,
                };
            }),
            catchError((error) => throwError(() => this.handlePaymentError(error)))
        );
    }

    /**
     * Confirmar pago con método alternativo (OXXO, transferencia, etc)
     * Para México, Stripe soporta OXXO como método de pago
     */
    confirmAlternativePayment(
        clientSecret: string,
        paymentMethodType: PaymentMethodType,
        billingDetails: {
            name: string;
            email: string;
        }
    ): Observable<{ success: boolean; paymentIntentId?: string; nextAction?: any }> {
        if (!this.stripe) {
            return throwError(() =>
                new PaymentError('STRIPE_NOT_INITIALIZED', 'Stripe not initialized')
            );
        }

        const paymentMethodData: any = {
            billing_details: billingDetails,
        };

        // Configurar según el tipo de método
        switch (paymentMethodType) {
            case 'OXXO':
                paymentMethodData.type = 'oxxo';
                break;
            case 'TRANSFER':
                paymentMethodData.type = 'customer_balance';
                break;
            default:
                return throwError(() =>
                    new PaymentError('INVALID_PAYMENT_METHOD', `Unsupported payment method: ${paymentMethodType}`)
                );
        }

        return from(
            this.stripe.confirmPayment({
                clientSecret,
                confirmParams: {
                    payment_method_data: paymentMethodData,
                    return_url: `${window.location.origin}/checkout/success`,
                },
                redirect: 'if_required',
            })
        ).pipe(
            map((result: any) => {
                if (result.error) {
                    throw new PaymentError(
                        'PAYMENT_FAILED',
                        result.error.message || 'Payment failed',
                        result.error
                    );
                }

                return {
                    success: true,
                    paymentIntentId: result.paymentIntent?.id,
                    nextAction: result.paymentIntent?.next_action,
                };
            }),
            catchError((error) => throwError(() => this.handlePaymentError(error)))
        );
    }

    /**
     * Procesar reembolso
     * Se comunica con Cloud Function para procesar el refund
     */
    processRefund(
        paymentIntentId: string,
        amount?: number,
        reason?: string
    ): Observable<{ success: boolean; refundId: string }> {
        const headers = new HttpHeaders({
            'Content-Type': 'application/json',
        });

        const body = {
            paymentIntentId,
            amount,
            reason: reason || 'requested_by_customer',
        };

        return this.http.post<any>(this.processRefundUrl, body, { headers }).pipe(
            map((response) => ({
                success: true,
                refundId: response.refundId,
            })),
            catchError((error) => throwError(() => this.handlePaymentError(error)))
        );
    }

    /**
     * Obtener estado de Payment Intent
     */
    retrievePaymentIntent(clientSecret: string): Observable<PaymentIntent> {
        if (!this.stripe) {
            return throwError(() =>
                new PaymentError('STRIPE_NOT_INITIALIZED', 'Stripe not initialized')
            );
        }

        return from(this.stripe.retrievePaymentIntent(clientSecret)).pipe(
            map((result) => {
                if (result.error) {
                    throw new PaymentError(
                        'PAYMENT_RETRIEVAL_FAILED',
                        result.error.message || 'Failed to retrieve payment intent',
                        result.error
                    );
                }

                const pi = result.paymentIntent;
                return {
                    id: pi.id,
                    clientSecret: pi.client_secret!,
                    amount: pi.amount,
                    currency: pi.currency,
                    status: pi.status,
                    orderId: pi.metadata.orderId,
                    customerId: pi.metadata.customerId,
                    createdAt: new Date(pi.created * 1000),
                };
            }),
            catchError((error) => throwError(() => this.handlePaymentError(error)))
        );
    }

    /**
     * Limpiar elementos de Stripe
     * Llamar cuando se desmonte el componente
     */
    cleanup(): void {
        if (this.cardElement) {
            this.cardElement.unmount();
            this.cardElement.destroy();
            this.cardElement = null;
        }
        this.elements = null;
    }

    // ========== MÉTODOS PRIVADOS ==========

    /**
     * Maneja errores de Stripe y los convierte a errores del dominio
     */
    private handlePaymentError(error: any): PaymentError {
        // Error de Stripe
        if (error?.type) {
            const stripeErrorMap: Record<string, { code: string; message: string }> = {
                card_error: {
                    code: 'CARD_ERROR',
                    message: error.message || 'Error con la tarjeta',
                },
                validation_error: {
                    code: 'VALIDATION_ERROR',
                    message: error.message || 'Datos de pago inválidos',
                },
                api_error: {
                    code: 'API_ERROR',
                    message: 'Error temporal del servicio de pagos',
                },
                authentication_error: {
                    code: 'AUTH_ERROR',
                    message: 'Error de autenticación con Stripe',
                },
                rate_limit_error: {
                    code: 'RATE_LIMIT',
                    message: 'Demasiadas solicitudes, intenta más tarde',
                },
            };

            const mapped = stripeErrorMap[error.type] || {
                code: 'STRIPE_ERROR',
                message: error.message || 'Error procesando el pago',
            };

            return new PaymentError(mapped.code, mapped.message, error);
        }

        // Error HTTP (Cloud Functions)
        if (error?.status) {
            const httpErrorMap: Record<number, { code: string; message: string }> = {
                400: {
                    code: 'BAD_REQUEST',
                    message: 'Solicitud inválida',
                },
                401: {
                    code: 'UNAUTHORIZED',
                    message: 'No autorizado',
                },
                403: {
                    code: 'FORBIDDEN',
                    message: 'Acceso denegado',
                },
                404: {
                    code: 'NOT_FOUND',
                    message: 'Recurso no encontrado',
                },
                500: {
                    code: 'SERVER_ERROR',
                    message: 'Error del servidor',
                },
            };

            const mapped = httpErrorMap[error.status] || {
                code: 'HTTP_ERROR',
                message: error.message || 'Error de conexión',
            };

            return new PaymentError(mapped.code, mapped.message, error);
        }

        // Error genérico
        return new PaymentError(
            'UNKNOWN',
            error?.message || 'Error desconocido procesando el pago',
            error
        );
    }
}