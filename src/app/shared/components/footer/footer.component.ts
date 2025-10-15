// ============================================================================
// FOOTER COMPONENT - TEPIZON PLATFORM
// ============================================================================
// Footer principal de la aplicación con enlaces, redes sociales y newsletter
// Compatible con Angular 20
// ============================================================================

import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { ButtonComponent } from '../button/button.component';
import { InputComponent } from '../input/input.component';

/**
 * Interfaz para enlaces del footer
 */
interface FooterLink {
  label: string;
  route: string;
}

/**
 * Interfaz para sección de enlaces
 */
interface FooterSection {
  title: string;
  links: FooterLink[];
}

/**
 * Componente Footer principal
 * 
 * Características:
 * - Enlaces organizados por secciones
 * - Redes sociales
 * - Newsletter subscription
 * - Información de copyright
 * - Métodos de pago
 */
@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatIconModule,
    ButtonComponent,
    InputComponent,
  ],
  template: `
    <footer class="footer">
      <!-- Main footer content -->
      <div class="footer-main">
        <div class="container">
          <div class="footer-grid">
            <!-- Brand section -->
            <div class="footer-brand">
              <h3 class="brand-name">TEPIZON</h3>
              <p class="brand-tagline">
                Tu tienda en línea de confianza para moda, deportes, hogar y más.
              </p>
              
              <!-- Social media -->
              <div class="social-links">
                <a 
                  href="https://facebook.com" 
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Facebook"
                  class="social-link">
                  <mat-icon>facebook</mat-icon>
                </a>
                <a 
                  href="https://instagram.com" 
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Instagram"
                  class="social-link">
                  <mat-icon svgIcon="instagram">photo_camera</mat-icon>
                </a>
                <a 
                  href="https://twitter.com" 
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Twitter"
                  class="social-link">
                  <mat-icon>tag</mat-icon>
                </a>
                <a 
                  href="https://youtube.com" 
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="YouTube"
                  class="social-link">
                  <mat-icon>play_circle</mat-icon>
                </a>
              </div>
            </div>
            
            <!-- Links sections -->
            @for (section of footerSections; track section.title) {
              <div class="footer-section">
                <h4 class="section-title">{{ section.title }}</h4>
                <ul class="section-links">
                  @for (link of section.links; track link.route) {
                    <li>
                      <a [routerLink]="link.route" class="footer-link">
                        {{ link.label }}
                      </a>
                    </li>
                  }
                </ul>
              </div>
            }
            
            <!-- Newsletter -->
            <div class="footer-newsletter">
              <h4 class="section-title">Newsletter</h4>
              <p class="newsletter-text">
                Suscríbete para recibir ofertas exclusivas y novedades.
              </p>
              
              <form class="newsletter-form" (submit)="handleNewsletterSubmit($event)">
                <app-input
                  type="email"
                  placeholder="tu@email.com"
                  [required]="true"
                  [(ngModel)]="newsletterEmail"
                  size="sm">
                </app-input>
                
                <app-button
                  type="submit"
                  variant="primary"
                  size="sm"
                  [loading]="subscribing()"
                  [disabled]="!newsletterEmail">
                  Suscribirse
                </app-button>
              </form>
              
              @if (subscribeSuccess()) {
                <p class="success-message">
                  <mat-icon>check_circle</mat-icon>
                  ¡Gracias por suscribirte!
                </p>
              }
            </div>
          </div>
        </div>
      </div>
      
      <!-- Payment methods -->
      <div class="footer-payment">
        <div class="container">
          <div class="payment-content">
            <span class="payment-label">Métodos de pago:</span>
            <div class="payment-methods">
              <span class="payment-icon" title="Visa">💳</span>
              <span class="payment-icon" title="Mastercard">💳</span>
              <span class="payment-icon" title="American Express">💳</span>
              <span class="payment-icon" title="PayPal">💰</span>
              <span class="payment-icon" title="Transferencia">🏦</span>
              <span class="payment-icon" title="Efectivo">💵</span>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Bottom bar -->
      <div class="footer-bottom">
        <div class="container">
          <div class="bottom-content">
            <p class="copyright">
              © {{ currentYear }} Tepizon Platform. Todos los derechos reservados.
            </p>
            
            <div class="bottom-links">
              <a routerLink="/privacy" class="bottom-link">Privacidad</a>
              <span class="separator">•</span>
              <a routerLink="/terms" class="bottom-link">Términos</a>
              <span class="separator">•</span>
              <a routerLink="/cookies" class="bottom-link">Cookies</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  `,
  styles: [`
    @import 'src/styles/tokens';
    @import 'src/styles/mixins';
    
    // ========================================================================
    // FOOTER PRINCIPAL
    // ========================================================================
    
    .footer {
      background-color: $primary-1000;
      color: $neutral-0;
      margin-top: auto;
      
      :host-context(.dark-theme) & {
        background-color: $neutral-1000;
      }
    }
    
    .footer-main {
      padding: spacing('12') 0 spacing('8');
      
      @include mobile-only {
        padding: spacing('8') 0 spacing('6');
      }
    }
    
    // ========================================================================
    // GRID LAYOUT
    // ========================================================================
    
    .footer-grid {
      display: grid;
      grid-template-columns: 2fr repeat(3, 1fr);
      gap: spacing('8');
      
      @include respond-below('lg') {
        grid-template-columns: repeat(2, 1fr);
        gap: spacing('6');
      }
      
      @include mobile-only {
        grid-template-columns: 1fr;
        gap: spacing('8');
      }
    }
    
    // ========================================================================
    // BRAND SECTION
    // ========================================================================
    
    .footer-brand {
      @include flex-column;
      gap: spacing('4');
    }
    
    .brand-name {
      @include heading-4;
      font-weight: $font-weight-bold;
      letter-spacing: 0.05em;
      margin: 0;
      color: $neutral-0;
    }
    
    .brand-tagline {
      @include body-small;
      color: rgba($neutral-0, 0.8);
      margin: 0;
      max-width: 300px;
    }
    
    // ========================================================================
    // SOCIAL LINKS
    // ========================================================================
    
    .social-links {
      @include flex-start;
      gap: spacing('3');
    }
    
    .social-link {
      @include flex-center;
      width: 40px;
      height: 40px;
      background-color: rgba($neutral-0, 0.1);
      border-radius: radius('full');
      color: $neutral-0;
      transition: all $transition-speed-fast $transition-timing;
      
      &:hover {
        background-color: rgba($neutral-0, 0.2);
        transform: translateY(-2px);
        text-decoration: none;
      }
      
      mat-icon {
        font-size: 20px;
        width: 20px;
        height: 20px;
      }
    }
    
    // ========================================================================
    // LINKS SECTIONS
    // ========================================================================
    
    .footer-section {
      @include flex-column;
      gap: spacing('4');
    }
    
    .section-title {
      @include heading-6;
      font-weight: $font-weight-semibold;
      margin: 0;
      color: $neutral-0;
    }
    
    .section-links {
      @include flex-column;
      gap: spacing('2');
      list-style: none;
      margin: 0;
      padding: 0;
    }
    
    .footer-link {
      @include body-small;
      color: rgba($neutral-0, 0.8);
      text-decoration: none;
      transition: color $transition-speed-fast $transition-timing;
      
      &:hover {
        color: $neutral-0;
        text-decoration: underline;
      }
    }
    
    // ========================================================================
    // NEWSLETTER
    // ========================================================================
    
    .footer-newsletter {
      @include flex-column;
      gap: spacing('4');
    }
    
    .newsletter-text {
      @include body-small;
      color: rgba($neutral-0, 0.8);
      margin: 0;
    }
    
    .newsletter-form {
      @include flex-column;
      gap: spacing('2');
      
      ::ng-deep {
        .input {
          background-color: rgba($neutral-0, 0.1);
          border-color: rgba($neutral-0, 0.2);
          color: $neutral-0;
          
          &::placeholder {
            color: rgba($neutral-0, 0.5);
          }
          
          &:focus {
            background-color: rgba($neutral-0, 0.15);
            border-color: rgba($neutral-0, 0.4);
          }
        }
      }
    }
    
    .success-message {
      @include flex-start;
      gap: spacing('2');
      @include body-small;
      color: $success-light;
      margin: 0;
      
      mat-icon {
        font-size: 16px;
        width: 16px;
        height: 16px;
      }
    }
    
    // ========================================================================
    // PAYMENT METHODS
    // ========================================================================
    
    .footer-payment {
      padding: spacing('6') 0;
      border-top: 1px solid rgba($neutral-0, 0.1);
      border-bottom: 1px solid rgba($neutral-0, 0.1);
    }
    
    .payment-content {
      @include flex-between;
      align-items: center;
      flex-wrap: wrap;
      gap: spacing('4');
      
      @include mobile-only {
        flex-direction: column;
        align-items: flex-start;
      }
    }
    
    .payment-label {
      @include body-small;
      color: rgba($neutral-0, 0.8);
      font-weight: $font-weight-medium;
    }
    
    .payment-methods {
      @include flex-start;
      gap: spacing('3');
      flex-wrap: wrap;
    }
    
    .payment-icon {
      @include flex-center;
      width: 48px;
      height: 32px;
      background-color: rgba($neutral-0, 0.1);
      border-radius: radius('sm');
      font-size: 20px;
      transition: all $transition-speed-fast $transition-timing;
      
      &:hover {
        background-color: rgba($neutral-0, 0.2);
        transform: translateY(-1px);
      }
    }
    
    // ========================================================================
    // BOTTOM BAR
    // ========================================================================
    
    .footer-bottom {
      padding: spacing('6') 0;
    }
    
    .bottom-content {
      @include flex-between;
      align-items: center;
      flex-wrap: wrap;
      gap: spacing('4');
      
      @include mobile-only {
        flex-direction: column;
        text-align: center;
      }
    }
    
    .copyright {
      @include body-xs;
      color: rgba($neutral-0, 0.6);
      margin: 0;
    }
    
    .bottom-links {
      @include flex-start;
      gap: spacing('3');
      align-items: center;
    }
    
    .bottom-link {
      @include body-xs;
      color: rgba($neutral-0, 0.6);
      text-decoration: none;
      transition: color $transition-speed-fast $transition-timing;
      
      &:hover {
        color: $neutral-0;
        text-decoration: underline;
      }
    }
    
    .separator {
      color: rgba($neutral-0, 0.4);
    }
  `]
})
export class FooterComponent {
  // ========================================================================
  // SIGNALS
  // ========================================================================
  
  /** Estado de suscripción al newsletter */
  readonly subscribing = signal(false);
  
  /** Suscripción exitosa */
  readonly subscribeSuccess = signal(false);
  
  // ========================================================================
  // PROPIEDADES
  // ========================================================================
  
  /** Año actual para copyright */
  readonly currentYear = new Date().getFullYear();
  
  /** Email para newsletter */
  newsletterEmail = '';
  
  /** Secciones de enlaces del footer */
  readonly footerSections: FooterSection[] = [
    {
      title: 'Comprar',
      links: [
        { label: 'Productos', route: '/products' },
        { label: 'Categorías', route: '/categories' },
        { label: 'Ofertas', route: '/deals' },
        { label: 'Novedades', route: '/new-arrivals' },
      ]
    },
    {
      title: 'Ayuda',
      links: [
        { label: 'Centro de Ayuda', route: '/help' },
        { label: 'Envíos', route: '/shipping' },
        { label: 'Devoluciones', route: '/returns' },
        { label: 'Contacto', route: '/contact' },
      ]
    },
    {
      title: 'Legal',
      links: [
        { label: 'Términos y Condiciones', route: '/terms' },
        { label: 'Política de Privacidad', route: '/privacy' },
        { label: 'Cookies', route: '/cookies' },
        { label: 'Aviso Legal', route: '/legal' },
      ]
    },
  ];
  
  // ========================================================================
  // MÉTODOS
  // ========================================================================
  
  /**
   * Manejar suscripción al newsletter
   */
  async handleNewsletterSubmit(event: Event): Promise<void> {
    event.preventDefault();
    
    if (!this.newsletterEmail) return;
    
    this.subscribing.set(true);
    
    try {
      // TODO: Implementar llamada al backend
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log('Suscrito al newsletter:', this.newsletterEmail);
      this.subscribeSuccess.set(true);
      this.newsletterEmail = '';
      
      // Ocultar mensaje de éxito después de 5 segundos
      setTimeout(() => {
        this.subscribeSuccess.set(false);
      }, 5000);
    } catch (error) {
      console.error('Error al suscribirse:', error);
    } finally {
      this.subscribing.set(false);
    }
  }
}
