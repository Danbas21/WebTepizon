// ============================================================================
// HOME COMPONENT - TEPIZON PLATFORM
// ============================================================================
// Página principal de la aplicación
// ============================================================================

import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ButtonComponent } from '../shared/components/button/button.component';
import { CardComponent } from '../shared/components/card/card.component';

/**
 * Componente de la página principal (Home)
 * 
 * Muestra:
 * - Hero section
 * - Categorías destacadas
 * - Productos destacados
 * - Ofertas especiales
 */
@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ButtonComponent,
    CardComponent,
  ],
  template: `
    <div class="home-page">
      <!-- Hero Section -->
      <section class="hero">
        <div class="container">
          <div class="hero-content">
            <h1 class="hero-title">Bienvenido a Tepizon</h1>
            <p class="hero-subtitle">
              Tu tienda en línea de confianza para moda, deportes, hogar y más
            </p>
            <div class="hero-actions">
              <app-button 
                variant="primary" 
                size="lg"
                routerLink="/products">
                Explorar Productos
              </app-button>
              <app-button 
                variant="secondary" 
                size="lg"
                routerLink="/deals">
                Ver Ofertas
              </app-button>
            </div>
          </div>
        </div>
      </section>
      
      <!-- Categories Section -->
      <section class="categories">
        <div class="container">
          <h2 class="section-title">Comprar por Categoría</h2>
          <div class="categories-grid">
            @for (category of categories; track category.id) {
              <app-card variant="elevated" [clickable]="true">
                <div class="category-card">
                  <div class="category-icon">{{ category.emoji }}</div>
                  <h3 class="category-name">{{ category.name }}</h3>
                  <p class="category-count">{{ category.productCount }} productos</p>
                </div>
              </app-card>
            }
          </div>
        </div>
      </section>
      
      <!-- Features Section -->
      <section class="features">
        <div class="container">
          <div class="features-grid">
            @for (feature of features; track feature.id) {
              <div class="feature-item">
                <div class="feature-icon">{{ feature.icon }}</div>
                <h3 class="feature-title">{{ feature.title }}</h3>
                <p class="feature-description">{{ feature.description }}</p>
              </div>
            }
          </div>
        </div>
      </section>
    </div>
  `,
  styles: [`
    @import 'src/styles/tokens';
    @import 'src/styles/mixins';
    
    // ========================================================================
    // HERO SECTION
    // ========================================================================
    
    .hero {
      background: linear-gradient(135deg, $primary-1000 0%, $primary-800 100%);
      padding: spacing('24') 0;
      color: $neutral-0;
      
      @include mobile-only {
        padding: spacing('16') 0;
      }
    }
    
    .hero-content {
      @include flex-column-center;
      gap: spacing('6');
      text-align: center;
    }
    
    .hero-title {
      @include heading-1;
      color: $neutral-0;
      
      @include mobile-only {
        font-size: font-size('4xl');
      }
    }
    
    .hero-subtitle {
      @include body-large;
      color: rgba($neutral-0, 0.9);
      max-width: 600px;
    }
    
    .hero-actions {
      @include flex-center;
      gap: spacing('4');
      flex-wrap: wrap;
    }
    
    // ========================================================================
    // CATEGORIES SECTION
    // ========================================================================
    
    .categories {
      padding: spacing('16') 0;
      
      @include mobile-only {
        padding: spacing('12') 0;
      }
    }
    
    .section-title {
      @include heading-2;
      text-align: center;
      margin-bottom: spacing('8');
      
      @include mobile-only {
        font-size: font-size('3xl');
        margin-bottom: spacing('6');
      }
    }
    
    .categories-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: spacing('6');
      
      @include mobile-only {
        grid-template-columns: repeat(2, 1fr);
        gap: spacing('4');
      }
    }
    
    .category-card {
      @include flex-column-center;
      gap: spacing('3');
      padding: spacing('6');
      text-align: center;
    }
    
    .category-icon {
      font-size: 48px;
      
      @include mobile-only {
        font-size: 36px;
      }
    }
    
    .category-name {
      @include heading-5;
      margin: 0;
    }
    
    .category-count {
      @include body-small;
      color: $neutral-600;
      margin: 0;
    }
    
    // ========================================================================
    // FEATURES SECTION
    // ========================================================================
    
    .features {
      background-color: $neutral-50;
      padding: spacing('16') 0;
      
      :host-context(.dark-theme) & {
        background-color: $neutral-900;
      }
      
      @include mobile-only {
        padding: spacing('12') 0;
      }
    }
    
    .features-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: spacing('8');
      
      @include mobile-only {
        grid-template-columns: 1fr;
        gap: spacing('6');
      }
    }
    
    .feature-item {
      @include flex-column;
      align-items: center;
      gap: spacing('4');
      text-align: center;
    }
    
    .feature-icon {
      font-size: 64px;
      
      @include mobile-only {
        font-size: 48px;
      }
    }
    
    .feature-title {
      @include heading-5;
      margin: 0;
    }
    
    .feature-description {
      @include body-base;
      color: $neutral-700;
      margin: 0;
      
      :host-context(.dark-theme) & {
        color: $neutral-300;
      }
    }
  `]
})
export class HomeComponent {
  // ========================================================================
  // DATA
  // ========================================================================
  
  /** Categorías principales */
  readonly categories = [
    {
      id: 1,
      name: 'Ropa',
      emoji: '👕',
      productCount: 234,
      slug: 'ropa'
    },
    {
      id: 2,
      name: 'Deportes',
      emoji: '⚽',
      productCount: 156,
      slug: 'deportes'
    },
    {
      id: 3,
      name: 'Hogar',
      emoji: '🏠',
      productCount: 189,
      slug: 'hogar'
    },
    {
      id: 4,
      name: 'Decoración',
      emoji: '🎨',
      productCount: 142,
      slug: 'decoracion'
    }
  ];
  
  /** Features de la plataforma */
  readonly features = [
    {
      id: 1,
      icon: '🚚',
      title: 'Envío Gratis',
      description: 'En compras mayores a $500 MXN'
    },
    {
      id: 2,
      icon: '🔒',
      title: 'Pago Seguro',
      description: 'Tus datos están protegidos'
    },
    {
      id: 3,
      icon: '↩️',
      title: 'Devoluciones Fáciles',
      description: '30 días para devoluciones'
    },
    {
      id: 4,
      icon: '💬',
      title: 'Soporte 24/7',
      description: 'Estamos aquí para ayudarte'
    }
  ];
}
