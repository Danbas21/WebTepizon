// ============================================================================
// THEME SERVICE - TEPIZON PLATFORM
// ============================================================================
// Servicio para gestionar el tema (light/dark) de la aplicación
// Usa Signals nativos de Angular 20 y localStorage para persistencia
// ============================================================================

import { Injectable, signal, effect, computed, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

/**
 * Tipos de tema disponibles
 */
export type Theme = 'light' | 'dark';

/**
 * Servicio para gestionar el tema de la aplicación
 * 
 * Características:
 * - Detecta preferencia del sistema operativo
 * - Persiste la selección del usuario en localStorage
 * - Reactivo con Angular Signals
 * - SSR-safe (verifica si está en browser)
 */
@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  // Platform ID para verificar si estamos en el browser
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);
  
  // Clave para localStorage
  private readonly STORAGE_KEY = 'tepizon-theme';
  
  // ========================================================================
  // SIGNALS
  // ========================================================================
  
  /**
   * Signal que mantiene el tema actual
   */
  private readonly themeSignal = signal<Theme>(this.getInitialTheme());
  
  /**
   * Signal de solo lectura para exponer el tema actual
   */
  readonly currentTheme = this.themeSignal.asReadonly();
  
  /**
   * Computed signal que indica si está en modo oscuro
   */
  readonly isDarkMode = computed(() => this.currentTheme() === 'dark');
  
  /**
   * Computed signal que indica si está en modo claro
   */
  readonly isLightMode = computed(() => this.currentTheme() === 'light');
  
  // ========================================================================
  // CONSTRUCTOR
  // ========================================================================
  
  constructor() {
    // Effect para aplicar el tema al DOM cuando cambie
    effect(() => {
      const theme = this.currentTheme();
      this.applyThemeToDOM(theme);
      this.saveThemeToStorage(theme);
    });
    
    // Escuchar cambios en la preferencia del sistema (solo en browser)
    if (this.isBrowser) {
      this.listenToSystemThemeChanges();
    }
  }
  
  // ========================================================================
  // MÉTODOS PÚBLICOS
  // ========================================================================
  
  /**
   * Cambiar al tema especificado
   * @param theme - 'light' o 'dark'
   */
  setTheme(theme: Theme): void {
    this.themeSignal.set(theme);
  }
  
  /**
   * Alternar entre light y dark
   */
  toggleTheme(): void {
    const newTheme = this.isDarkMode() ? 'light' : 'dark';
    this.setTheme(newTheme);
  }
  
  /**
   * Establecer el tema según la preferencia del sistema
   */
  useSystemTheme(): void {
    if (!this.isBrowser) return;
    
    const systemTheme = this.getSystemTheme();
    this.setTheme(systemTheme);
    
    // Eliminar la preferencia guardada para usar siempre la del sistema
    localStorage.removeItem(this.STORAGE_KEY);
  }
  
  /**
   * Resetear al tema por defecto (light)
   */
  resetTheme(): void {
    this.setTheme('light');
  }
  
  // ========================================================================
  // MÉTODOS PRIVADOS
  // ========================================================================
  
  /**
   * Obtener el tema inicial al cargar la aplicación
   * Orden de prioridad:
   * 1. Tema guardado en localStorage
   * 2. Preferencia del sistema
   * 3. Light por defecto
   */
  private getInitialTheme(): Theme {
    if (!this.isBrowser) {
      return 'light'; // SSR default
    }
    
    // 1. Verificar localStorage
    const savedTheme = localStorage.getItem(this.STORAGE_KEY) as Theme | null;
    if (savedTheme && (savedTheme === 'light' || savedTheme === 'dark')) {
      return savedTheme;
    }
    
    // 2. Usar preferencia del sistema
    return this.getSystemTheme();
  }
  
  /**
   * Obtener la preferencia de tema del sistema operativo
   */
  private getSystemTheme(): Theme {
    if (!this.isBrowser) {
      return 'light';
    }
    
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    return prefersDark ? 'dark' : 'light';
  }
  
  /**
   * Aplicar el tema al DOM (agregar/quitar clase dark-theme)
   */
  private applyThemeToDOM(theme: Theme): void {
    if (!this.isBrowser) return;
    
    const htmlElement = document.documentElement;
    const bodyElement = document.body;
    
    if (theme === 'dark') {
      htmlElement.classList.add('dark-theme');
      bodyElement.classList.add('dark-theme');
    } else {
      htmlElement.classList.remove('dark-theme');
      bodyElement.classList.remove('dark-theme');
    }
    
    // Agregar meta theme-color para browsers móviles
    this.updateMetaThemeColor(theme);
  }
  
  /**
   * Actualizar el color del tema en el meta tag para móviles
   */
  private updateMetaThemeColor(theme: Theme): void {
    if (!this.isBrowser) return;
    
    let metaThemeColor = document.querySelector('meta[name="theme-color"]');
    
    if (!metaThemeColor) {
      metaThemeColor = document.createElement('meta');
      metaThemeColor.setAttribute('name', 'theme-color');
      document.head.appendChild(metaThemeColor);
    }
    
    // Colores del _tokens.scss
    const color = theme === 'dark' ? '#1A1A1A' : '#F5F5F5';
    metaThemeColor.setAttribute('content', color);
  }
  
  /**
   * Guardar el tema en localStorage
   */
  private saveThemeToStorage(theme: Theme): void {
    if (!this.isBrowser) return;
    
    try {
      localStorage.setItem(this.STORAGE_KEY, theme);
    } catch (error) {
      console.error('Error al guardar el tema en localStorage:', error);
    }
  }
  
  /**
   * Escuchar cambios en la preferencia de tema del sistema
   */
  private listenToSystemThemeChanges(): void {
    if (!this.isBrowser) return;
    
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    // Callback cuando cambia la preferencia del sistema
    const handleChange = (e: MediaQueryListEvent) => {
      // Solo aplicar si el usuario NO ha guardado una preferencia manual
      const savedTheme = localStorage.getItem(this.STORAGE_KEY);
      if (!savedTheme) {
        const newTheme = e.matches ? 'dark' : 'light';
        this.setTheme(newTheme);
      }
    };
    
    // Agregar listener (compatibilidad con navegadores antiguos)
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
    } else {
      // Fallback para navegadores antiguos
      mediaQuery.addListener(handleChange);
    }
  }
}
