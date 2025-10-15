// ============================================================================
// TOAST SERVICE - TEPIZON PLATFORM
// ============================================================================
// Servicio para mostrar notificaciones toast/snackbar
// Usa Angular Material Snackbar y Signals de Angular 20
// ============================================================================

import { Injectable, inject } from '@angular/core';
import { MatSnackBar, MatSnackBarConfig } from '@angular/material/snack-bar';

/**
 * Tipos de toast
 */
export type ToastType = 'success' | 'error' | 'warning' | 'info';

/**
 * Posiciones del toast
 */
export type ToastPosition = 'top' | 'bottom';

/**
 * Configuración del toast
 */
export interface ToastConfig extends MatSnackBarConfig {
  type?: ToastType;
  position?: ToastPosition;
}

/**
 * Servicio para mostrar notificaciones toast
 * 
 * @example
 * ```typescript
 * constructor(private toast: ToastService) {}
 * 
 * showSuccess() {
 *   this.toast.success('Operación exitosa');
 * }
 * 
 * showError() {
 *   this.toast.error('Ocurrió un error', { duration: 5000 });
 * }
 * ```
 */
@Injectable({
  providedIn: 'root'
})
export class ToastService {
  // ========================================================================
  // DEPENDENCIES
  // ========================================================================
  
  private readonly snackBar = inject(MatSnackBar);
  
  // ========================================================================
  // CONFIGURACIÓN POR DEFECTO
  // ========================================================================
  
  private readonly defaultConfig: MatSnackBarConfig = {
    duration: 3000,
    horizontalPosition: 'end',
    verticalPosition: 'bottom',
    panelClass: [],
  };
  
  // ========================================================================
  // MÉTODOS PÚBLICOS
  // ========================================================================
  
  /**
   * Mostrar toast de éxito
   * 
   * @param message - Mensaje a mostrar
   * @param config - Configuración adicional
   */
  success(message: string, config?: ToastConfig): void {
    this.show(message, {
      ...config,
      type: 'success',
      panelClass: ['success-snackbar', ...(config?.panelClass || [])],
    });
  }
  
  /**
   * Mostrar toast de error
   * 
   * @param message - Mensaje a mostrar
   * @param config - Configuración adicional
   */
  error(message: string, config?: ToastConfig): void {
    this.show(message, {
      ...config,
      type: 'error',
      duration: config?.duration || 5000, // Errores duran más
      panelClass: ['error-snackbar', ...(config?.panelClass || [])],
    });
  }
  
  /**
   * Mostrar toast de advertencia
   * 
   * @param message - Mensaje a mostrar
   * @param config - Configuración adicional
   */
  warning(message: string, config?: ToastConfig): void {
    this.show(message, {
      ...config,
      type: 'warning',
      panelClass: ['warning-snackbar', ...(config?.panelClass || [])],
    });
  }
  
  /**
   * Mostrar toast informativo
   * 
   * @param message - Mensaje a mostrar
   * @param config - Configuración adicional
   */
  info(message: string, config?: ToastConfig): void {
    this.show(message, {
      ...config,
      type: 'info',
      panelClass: ['info-snackbar', ...(config?.panelClass || [])],
    });
  }
  
  /**
   * Mostrar toast personalizado
   * 
   * @param message - Mensaje a mostrar
   * @param config - Configuración completa
   */
  show(message: string, config?: ToastConfig): void {
    const finalConfig: MatSnackBarConfig = {
      ...this.defaultConfig,
      ...config,
    };
    
    // Ajustar posición vertical si se especifica
    if (config?.position === 'top') {
      finalConfig.verticalPosition = 'top';
    }
    
    this.snackBar.open(message, 'Cerrar', finalConfig);
  }
  
  /**
   * Mostrar toast con acción personalizada
   * 
   * @param message - Mensaje a mostrar
   * @param action - Texto del botón de acción
   * @param config - Configuración adicional
   * @returns Observable que emite cuando se hace click en la acción
   */
  showWithAction(message: string, action: string, config?: ToastConfig) {
    const finalConfig: MatSnackBarConfig = {
      ...this.defaultConfig,
      ...config,
      duration: 0, // No cerrar automáticamente si hay acción
    };
    
    const snackBarRef = this.snackBar.open(message, action, finalConfig);
    return snackBarRef.onAction();
  }
  
  /**
   * Cerrar toast actual
   */
  dismiss(): void {
    this.snackBar.dismiss();
  }
  
  // ========================================================================
  // MÉTODOS DE UTILIDAD
  // ========================================================================
  
  /**
   * Mostrar toast de carga
   * 
   * @param message - Mensaje de carga
   * @returns Función para cerrar el toast
   */
  loading(message: string = 'Cargando...'): () => void {
    this.show(message, {
      duration: 0, // No cerrar automáticamente
      panelClass: ['info-snackbar'],
    });
    
    return () => this.dismiss();
  }
  
  /**
   * Mostrar toast de operación asíncrona
   * Muestra loading, luego success o error
   * 
   * @param promise - Promesa a ejecutar
   * @param messages - Mensajes para cada estado
   */
  async fromPromise<T>(
    promise: Promise<T>,
    messages: {
      loading?: string;
      success?: string;
      error?: string;
    } = {}
  ): Promise<T> {
    const loadingMsg = messages.loading || 'Procesando...';
    const successMsg = messages.success || 'Operación exitosa';
    const errorMsg = messages.error || 'Ocurrió un error';
    
    // Mostrar loading
    const dismissLoading = this.loading(loadingMsg);
    
    try {
      const result = await promise;
      dismissLoading();
      this.success(successMsg);
      return result;
    } catch (error) {
      dismissLoading();
      this.error(errorMsg);
      throw error;
    }
  }
  
  /**
   * Mostrar confirmación de eliminación
   * 
   * @param itemName - Nombre del item eliminado
   * @param onUndo - Callback para deshacer
   */
  deleted(itemName: string, onUndo?: () => void): void {
    const message = `${itemName} eliminado`;
    
    if (onUndo) {
      this.showWithAction(message, 'Deshacer', {
        duration: 5000,
        panelClass: ['info-snackbar'],
      }).subscribe(() => {
        onUndo();
        this.info('Acción deshecha');
      });
    } else {
      this.success(message);
    }
  }
  
  /**
   * Mostrar confirmación de guardado
   * 
   * @param itemName - Nombre del item guardado
   */
  saved(itemName: string = 'Cambios'): void {
    this.success(`${itemName} guardado${itemName === 'Cambios' ? 's' : ''} correctamente`);
  }
  
  /**
   * Mostrar error de conexión
   */
  connectionError(): void {
    this.error('Error de conexión. Por favor, verifica tu internet.', {
      duration: 5000,
    });
  }
  
  /**
   * Mostrar error de validación
   * 
   * @param message - Mensaje de validación
   */
  validationError(message: string = 'Por favor, verifica los campos'): void {
    this.warning(message);
  }
  
  /**
   * Mostrar mensaje de item agregado al carrito
   * 
   * @param productName - Nombre del producto
   * @param onViewCart - Callback para ver carrito
   */
  addedToCart(productName: string, onViewCart?: () => void): void {
    const message = `${productName} agregado al carrito`;
    
    if (onViewCart) {
      this.showWithAction(message, 'Ver carrito', {
        duration: 4000,
        panelClass: ['success-snackbar'],
      }).subscribe(() => {
        onViewCart();
      });
    } else {
      this.success(message);
    }
  }
  
  /**
   * Mostrar mensaje de item agregado a wishlist
   * 
   * @param productName - Nombre del producto
   */
  addedToWishlist(productName: string): void {
    this.success(`${productName} agregado a favoritos`);
  }
  
  /**
   * Mostrar mensaje de item removido de wishlist
   * 
   * @param productName - Nombre del producto
   */
  removedFromWishlist(productName: string): void {
    this.info(`${productName} removido de favoritos`);
  }
  
  /**
   * Mostrar mensaje de orden creada
   * 
   * @param orderNumber - Número de orden
   */
  orderCreated(orderNumber: string): void {
    this.success(`Orden #${orderNumber} creada exitosamente`);
  }
  
  /**
   * Mostrar mensaje de pago exitoso
   */
  paymentSuccess(): void {
    this.success('Pago procesado exitosamente');
  }
  
  /**
   * Mostrar mensaje de pago fallido
   */
  paymentFailed(): void {
    this.error('El pago no pudo ser procesado. Intenta nuevamente.', {
      duration: 5000,
    });
  }
  
  /**
   * Mostrar mensaje de sesión expirada
   */
  sessionExpired(): void {
    this.warning('Tu sesión ha expirado. Por favor, inicia sesión nuevamente.');
  }
  
  /**
   * Mostrar mensaje de bienvenida
   * 
   * @param userName - Nombre del usuario
   */
  welcome(userName: string): void {
    this.success(`¡Bienvenido, ${userName}!`);
  }
  
  /**
   * Mostrar mensaje de logout
   */
  loggedOut(): void {
    this.info('Sesión cerrada exitosamente');
  }
}
