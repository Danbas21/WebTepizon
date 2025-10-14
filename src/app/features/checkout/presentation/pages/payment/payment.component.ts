// features/checkout/presentation/pages/payment/payment.component.ts
import { Component, OnInit, inject } from '@angular/core';
import { loadStripe, StripeElements } from '@stripe/stripe-js';
import { environment } from '../../../../../../environments/environment';

@Component({
    selector: 'app-payment',
    template: `
    <div class="payment-container">
      <h2>Información de Pago</h2>
      
      <form (submit)="handleSubmit($event)">
        <!-- Stripe Card Element se montará aquí -->
        <div id="card-element"></div>
        
        <div id="card-errors" role="alert">{{ errorMessage }}</div>
        
        <button type="submit" [disabled]="loading">
          {{ loading ? 'Procesando...' : 'Pagar $' + total }}
        </button>
      </form>
    </div>
  `
})
export class PaymentComponent implements OnInit {
    private stripe: any;
    private cardElement: any;

    errorMessage = '';
    loading = false;
    total = 1299.99;

    async ngOnInit() {
        // Inicializar Stripe
        this.stripe = await loadStripe(environment.stripe.publishableKey);

        // Crear elementos
        const elements = this.stripe.elements();
        this.cardElement = elements.create('card', {
            style: {
                base: {
                    fontSize: '16px',
                    color: '#32325d',
                    fontFamily: 'Inter, sans-serif',
                    '::placeholder': {
                        color: '#aab7c4'
                    }
                }
            }
        });

        // Montar el elemento en el DOM
        this.cardElement.mount('#card-element');

        // Escuchar errores
        this.cardElement.on('change', (event: any) => {
            this.errorMessage = event.error ? event.error.message : '';
        });
    }

    async handleSubmit(event: Event) {
        event.preventDefault();
        this.loading = true;

        try {
            // 1. Crear Payment Intent en el backend
            const clientSecret = await this.createPaymentIntent();

            // 2. Confirmar el pago
            const { error, paymentIntent } = await this.stripe.confirmCardPayment(
                clientSecret,
                {
                    payment_method: {
                        card: this.cardElement
                    }
                }
            );

            if (error) {
                this.errorMessage = error.message;
            } else {
                // Pago exitoso!
                console.log('Payment successful:', paymentIntent);
                // Redirigir a confirmación
            }
        } catch (err) {
            this.errorMessage = 'Error al procesar el pago';
        } finally {
            this.loading = false;
        }
    }

    private async createPaymentIntent(): Promise<string> {
        const response = await fetch('/api/create-payment-intent', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                amount: Math.round(this.total * 100), // Stripe usa centavos
                currency: 'mxn'
            })
        });

        const { clientSecret } = await response.json();
        return clientSecret;
    }
}