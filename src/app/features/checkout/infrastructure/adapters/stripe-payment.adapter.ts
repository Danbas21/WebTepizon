// infrastructure/adapters/stripe-payment.adapter.ts
import { Injectable } from '@angular/core';
import { loadStripe, Stripe, StripeElements } from '@stripe/stripe-js';
import { environment } from '../../../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class StripePaymentAdapter {
    private stripePromise: Promise<Stripe | null>;

    constructor() {
        this.stripePromise = loadStripe(environment.stripe.publishableKey);
    }

    async createPaymentIntent(amount: number, currency: 'MXN'): Promise<string> {
        // Esto debe llamar a tu Cloud Function de Firebase
        const response = await fetch('/api/create-payment-intent', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ amount, currency })
        });

        const { clientSecret } = await response.json();
        return clientSecret;
    }

    async confirmCardPayment(
        clientSecret: string,
        cardElement: any
    ): Promise<{ success: boolean; error?: string }> {
        const stripe = await this.stripePromise;
        if (!stripe) throw new Error('Stripe not loaded');

        const { error, paymentIntent } = await stripe.confirmCardPayment(
            clientSecret,
            {
                payment_method: {
                    card: cardElement
                }
            }
        );

        if (error) {
            return { success: false, error: error.message };
        }

        return { success: true };
    }
}