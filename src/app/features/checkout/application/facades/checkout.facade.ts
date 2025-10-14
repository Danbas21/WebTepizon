// src/app/features/checkout/application/facades/checkout.facade.ts

import { Injectable, inject, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, catchError, tap } from 'rxjs';

// Domain
import { PaymentIntent } from '../../domain/entities/payment-intent.entity';
import { PaymentMethodType } from '../../domain/ports/payment.port';

// Application
import { CheckoutUseCases, BillingInfo, CheckoutResult } from '../use-cases/checkout.use-cases';

// Other features
import { CartFacade } from '../../../cart/application/facades/cart.facade';

/**
 * Estado del checkout
 */
interface CheckoutState {
    loading: boolean;
    error: string | null;
    currentStep: 'billing' | 'payment' | 'confirmation';
    paymentIntent: PaymentIntent | null;
    billingInfo: BillingInfo | null;
    paymentMethod: PaymentMethodType | null;
}

/**
 * Checkout Facade
 * Maneja el flujo completo del proceso de checkout
 * Coordina entre carrito, pagos y creación de órdenes
 */
@Injectable({
    providedIn: 'root',
})
export class CheckoutFacade {
    private readonly checkoutUseCases = inject(CheckoutUseCases);
    private readonly cartFacade = inject(CartFacade);
    private readonly router = inject(Router);

    // ========== STATE MANAGEMENT ==========

    /**
     * Signal de estado del checkout
     */
    private readonly checkoutState = signal<CheckoutState>({
        loading: false,
        error: null,
        currentStep: 'billing',
        paymentIntent: null,
        billingInfo: null,
        paymentMethod: null,
    });

    /**
     * Signals derivados
     */
    readonly isLoading = computed(() => this.checkoutState().loading);
    readonly error = computed(() => this.checkoutState().error);
    readonly currentStep = computed(() => this.checkoutState().currentStep);
    readonly paymentIntent = computed(() => this.checkoutState().paymentIntent);
    readonly billingInfo = computed(() => this.checkoutState().billingInfo);
    readonly paymentMethod = computed(() => this.checkoutState().paymentMethod);

    /**
     * Computed para validación de pasos
     */
    readonly canProceedToPayment = computed(() => {
        const billingInfo = this.billingInfo();
        return billingInfo !== null && this.validateBillingInfo(billingInfo).valid;
    });

    readonly canConfirmOrder = computed(() => {
        return this.paymentIntent() !== null && this.paymentMethod() !== null;
    });

    // ========== MÉTODOS PÚBLICOS ==========

    /**
     * Inicializar checkout
     * Debe llamarse al entrar a la página de checkout
     */
    async initializeCheckout(): Promise<void> {
        try {
            this.setLoading(true);
            this.clearError();

            // Validar que haya items en el carrito
            if (this.cartFacade.isEmpty()) {
                throw new Error('El carrito está vacío');
            }

            // Inicializar Stripe
            await this.checkoutUseCases.initializePayment();

            this.setLoading(false);
            this.setStep('billing');
        } catch (error) {
            this.setLoading(false);
            this.setError(this.getErrorMessage(error));
            throw error;
        }
    }

    /**
     * Guardar información de facturación
     */
    saveBillingInfo(billingInfo: BillingInfo): void {
        // Validar billing info
        const validation = this.validateBillingInfo(billingInfo);

        if (!validation.valid) {
            throw new Error(validation.errors[0]);
        }

        this.checkoutState.update((state) => ({
            ...state,
            billingInfo,
        }));

        console.log('Billing info saved');
    }

    /**
     * Seleccionar método de pago
     */
    selectPaymentMethod(method: PaymentMethodType): void {
        this.checkoutState.update((state) => ({
            ...state,
            paymentMethod: method,
        }));

        console.log('Payment method selected:', method);
    }

    /**
     * Proceder al paso de pago
     * Crea el Payment Intent
     */
    proceedToPayment(): Observable<PaymentIntent> {
        if (!this.canProceedToPayment()) {
            throw new Error('Información de facturación incompleta');
        }

        this.setLoading(true);
        this.clearError();

        // Generar orderId temporal
        const orderId = this.generateOrderId();

        return this.checkoutUseCases.createPaymentIntent(orderId).pipe(
            tap({
                next: (paymentIntent) => {
                    this.setLoading(false);
                    this.checkoutState.update((state) => ({
                        ...state,
                        paymentIntent,
                        currentStep: 'payment',
                    }));
                },
                error: (error) => {
                    this.setLoading(false);
                    this.setError(this.getErrorMessage(error));
                },
            }),
            catchError((error) => {
                throw error;
            })
        );
    }

    /**
     * Procesar pago con tarjeta
     */
    processCardPayment(): Observable<CheckoutResult> {
        if (!this.canConfirmOrder()) {
            throw new Error('Datos de pago incompletos');
        }

        const clientSecret = this.paymentIntent()!.clientSecret;
        const billingInfo = this.billingInfo()!;

        this.setLoading(true);
        this.clearError();

        return this.checkoutUseCases.processCardPayment(clientSecret, billingInfo).pipe(
            tap({
                next: (result) => {
                    this.setLoading(false);
                    if (result.success) {
                        this.handleSuccessfulPayment(result);
                    } else {
                        this.setError(result.error || 'Error procesando el pago');
                    }
                },
                error: (error) => {
                    this.setLoading(false);
                    this.setError(this.getErrorMessage(error));
                },
            }),
            catchError((error) => {
                throw error;
            })
        );
    }

    /**
     * Procesar pago con método alternativo (OXXO)
     */
    processAlternativePayment(): Observable<CheckoutResult> {
        if (!this.canConfirmOrder()) {
            throw new Error('Datos de pago incompletos');
        }

        const clientSecret = this.paymentIntent()!.clientSecret;
        const billingInfo = this.billingInfo()!;
        const paymentMethod = this.paymentMethod()!;

        this.setLoading(true);
        this.clearError();

        return this.checkoutUseCases.processAlternativePayment(
            clientSecret,
            paymentMethod,
            billingInfo
        ).pipe(
            tap({
                next: (result) => {
                    this.setLoading(false);
                    if (result.success) {
                        this.handleSuccessfulPayment(result);
                    } else {
                        this.setError('Error procesando el pago');
                    }
                },
                error: (error) => {
                    this.setLoading(false);
                    this.setError(this.getErrorMessage(error));
                },
            }),
            catchError((error) => {
                throw error;
            })
        );
    }

    /**
     * Procesar pago contra entrega
     */
    processCashOnDelivery(): Observable<CheckoutResult> {
        if (!this.billingInfo()) {
            throw new Error('Información de facturación requerida');
        }

        const orderId = this.generateOrderId();
        const billingInfo = this.billingInfo()!;

        this.setLoading(true);
        this.clearError();

        return this.checkoutUseCases.processCashOnDelivery(orderId, billingInfo).pipe(
            tap({
                next: (result) => {
                    this.setLoading(false);
                    if (result.success) {
                        this.handleSuccessfulPayment(result);
                    }
                },
                error: (error) => {
                    this.setLoading(false);
                    this.setError(this.getErrorMessage(error));
                },
            }),
            catchError((error) => {
                throw error;
            })
        );
    }

    /**
     * Validar información de checkout
     */
    validateBillingInfo(billingInfo: BillingInfo): {
        valid: boolean;
        errors: string[];
    } {
        return this.checkoutUseCases.validateCheckoutInfo(billingInfo);
    }

    /**
     * Obtener estado de pago
     */
    getPaymentStatus(clientSecret: string): Observable<PaymentIntent> {
        return this.checkoutUseCases.getPaymentStatus(clientSecret);
    }

    /**
     * Cambiar paso del checkout
     */
    setStep(step: 'billing' | 'payment' | 'confirmation'): void {
        this.checkoutState.update((state) => ({
            ...state,
            currentStep: step,
        }));
    }

    /**
     * Volver al paso anterior
     */
    goToPreviousStep(): void {
        const currentStep = this.currentStep();

        if (currentStep === 'payment') {
            this.setStep('billing');
        } else if (currentStep === 'confirmation') {
            this.setStep('payment');
        }
    }

    /**
     * Limpiar error
     */
    clearError(): void {
        this.checkoutState.update((state) => ({ ...state, error: null }));
    }

    /**
     * Resetear checkout
     * Útil después de completar una compra
     */
    resetCheckout(): void {
        this.checkoutState.set({
            loading: false,
            error: null,
            currentStep: 'billing',
            paymentIntent: null,
            billingInfo: null,
            paymentMethod: null,
        });

        this.checkoutUseCases.cleanup();
    }

    /**
     * Cancelar checkout
     */
    cancelCheckout(): void {
        this.resetCheckout();
        this.router.navigate(['/cart']);
    }

    // ========== MÉTODOS PRIVADOS ==========

    private setLoading(loading: boolean): void {
        this.checkoutState.update((state) => ({ ...state, loading }));
    }

    private setError(error: string): void {
        this.checkoutState.update((state) => ({ ...state, error }));
    }

    private getErrorMessage(error: any): string {
        if (error?.message) {
            return error.message;
        }

        if (typeof error === 'string') {
            return error;
        }

        return 'Ocurrió un error al procesar el pago.';
    }

    /**
     * Generar ID temporal de orden
     */
    private generateOrderId(): string {
        return `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Manejar pago exitoso
     */
    private handleSuccessfulPayment(result: CheckoutResult): void {
        console.log('Payment successful:', result);

        // Limpiar carrito
        this.cartFacade.clearCart().subscribe();

        // Navegar a página de confirmación
        this.router.navigate(['/checkout/success'], {
            queryParams: {
                orderId: result.orderId,
                paymentIntentId: result.paymentIntentId,
            },
        });

        // Analytics
        // this.analytics.trackEvent('purchase', {
        //   orderId: result.orderId,
        //   value: this.cartFacade.total(),
        //   paymentMethod: this.paymentMethod(),
        // });

        // Resetear checkout
        this.resetCheckout();
    }
}