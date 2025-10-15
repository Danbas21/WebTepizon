// ============================================================================
// INPUT COMPONENT - TEPIZON PLATFORM
// ============================================================================
// Componente de input reutilizable con validaciones y estados
// Compatible con Angular Forms (Reactive & Template-driven)
// ============================================================================

import { Component, input, output, signal, computed, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';

/**
 * Tipos de input disponibles
 */
export type InputType = 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'search';

/**
 * Tamaños del input
 */
export type InputSize = 'sm' | 'md' | 'lg';

/**
 * Componente Input reutilizable
 * 
 * @example
 * ```html
 * <app-input
 *   label="Email"
 *   type="email"
 *   placeholder="tu@email.com"
 *   [required]="true"
 *   [error]="emailError()"
 *   [(ngModel)]="email">
 * </app-input>
 * ```
 */
@Component({
  selector: 'app-input',
  standalone: true,
  imports: [
    CommonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
  ],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => InputComponent),
      multi: true
    }
  ],
  template: `
    <div [class]="containerClasses()">
      <!-- Label -->
      @if (label()) {
        <label [for]="inputId()" class="input-label">
          {{ label() }}
          @if (required()) {
            <span class="required-mark">*</span>
          }
        </label>
      }
      
      <!-- Input container -->
      <div class="input-wrapper">
        <!-- Icon izquierdo -->
        @if (iconLeft()) {
          <mat-icon class="input-icon input-icon-left">
            {{ iconLeft() }}
          </mat-icon>
        }
        
        <!-- Input element -->
        <input
          [id]="inputId()"
          [type]="inputType()"
          [class]="inputClasses()"
          [placeholder]="placeholder()"
          [disabled]="disabled()"
          [readonly]="readonly()"
          [required]="required()"
          [min]="min()"
          [max]="max()"
          [minlength]="minLength()"
          [maxlength]="maxLength()"
          [pattern]="pattern()"
          [autocomplete]="autocomplete()"
          [value]="value()"
          (input)="onInput($event)"
          (blur)="onTouched()"
          (focus)="onFocus()"
          [attr.aria-label]="ariaLabel() || label()"
          [attr.aria-describedby]="hasError() ? errorId() : helperTextId()"
          [attr.aria-invalid]="hasError()" />
        
        <!-- Icon derecho o toggle password -->
        @if (type() === 'password') {
          <button
            type="button"
            class="input-icon input-icon-right password-toggle"
            (click)="togglePasswordVisibility()"
            [attr.aria-label]="showPassword() ? 'Ocultar contraseña' : 'Mostrar contraseña'">
            <mat-icon>
              {{ showPassword() ? 'visibility_off' : 'visibility' }}
            </mat-icon>
          </button>
        } @else if (iconRight()) {
          <mat-icon class="input-icon input-icon-right">
            {{ iconRight() }}
          </mat-icon>
        }
        
        <!-- Clear button -->
        @if (clearable() && value() && !disabled() && !readonly()) {
          <button
            type="button"
            class="input-icon input-icon-right clear-button"
            (click)="clearValue()"
            aria-label="Limpiar">
            <mat-icon>close</mat-icon>
          </button>
        }
      </div>
      
      <!-- Helper text o error -->
      @if (hasError()) {
        <span [id]="errorId()" class="error-text">
          <mat-icon class="error-icon">error</mat-icon>
          {{ error() }}
        </span>
      } @else if (helperText()) {
        <span [id]="helperTextId()" class="helper-text">
          {{ helperText() }}
        </span>
      }
      
      <!-- Character counter -->
      @if (maxLength() && showCounter()) {
        <span class="char-counter">
          {{ value().length }} / {{ maxLength() }}
        </span>
      }
    </div>
  `,
  styles: [`
    @import 'src/styles/tokens';
    @import 'src/styles/mixins';
    
    // ========================================================================
    // CONTAINER
    // ========================================================================
    
    .input-container {
      display: flex;
      flex-direction: column;
      gap: spacing('2');
      width: 100%;
    }
    
    // ========================================================================
    // LABEL
    // ========================================================================
    
    .input-label {
      @include label;
      color: $neutral-800;
      
      :host-context(.dark-theme) & {
        color: $neutral-200;
      }
    }
    
    .required-mark {
      color: $error;
      margin-left: spacing('1');
    }
    
    // ========================================================================
    // INPUT WRAPPER
    // ========================================================================
    
    .input-wrapper {
      position: relative;
      display: flex;
      align-items: center;
    }
    
    // ========================================================================
    // INPUT BASE
    // ========================================================================
    
    .input {
      @include input-base;
      
      // Con icono izquierdo
      &.has-icon-left {
        padding-left: spacing('10');
      }
      
      // Con icono derecho
      &.has-icon-right {
        padding-right: spacing('10');
      }
      
      // Con ambos iconos
      &.has-icon-left.has-icon-right {
        padding-left: spacing('10');
        padding-right: spacing('10');
      }
      
      // Dark mode
      :host-context(.dark-theme) & {
        background-color: $neutral-800;
        color: $neutral-0;
        border-color: $neutral-700;
        
        &::placeholder {
          color: $neutral-500;
        }
        
        &:hover:not(:disabled) {
          border-color: $neutral-600;
        }
      }
    }
    
    // ========================================================================
    // ESTADOS
    // ========================================================================
    
    .input-error {
      border-color: $error !important;
      
      &:focus {
        box-shadow: 0 0 0 3px rgba($error, 0.1) !important;
      }
    }
    
    .input-success {
      border-color: $success !important;
      
      &:focus {
        box-shadow: 0 0 0 3px rgba($success, 0.1) !important;
      }
    }
    
    // ========================================================================
    // TAMAÑOS
    // ========================================================================
    
    .input-sm {
      padding: spacing('2') spacing('3');
      font-size: font-size('sm');
      min-height: 32px;
    }
    
    .input-md {
      padding: spacing('3') spacing('4');
      font-size: font-size('base');
      min-height: 40px;
    }
    
    .input-lg {
      padding: spacing('4') spacing('5');
      font-size: font-size('lg');
      min-height: 48px;
    }
    
    // ========================================================================
    // ICONOS
    // ========================================================================
    
    .input-icon {
      position: absolute;
      color: $neutral-500;
      pointer-events: none;
      
      :host-context(.dark-theme) & {
        color: $neutral-400;
      }
      
      &-left {
        left: spacing('3');
      }
      
      &-right {
        right: spacing('3');
      }
    }
    
    .password-toggle,
    .clear-button {
      pointer-events: all;
      cursor: pointer;
      background: transparent;
      border: none;
      padding: spacing('1');
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: radius('sm');
      transition: all $transition-speed-fast $transition-timing;
      
      &:hover {
        background-color: $neutral-100;
        
        :host-context(.dark-theme) & {
          background-color: $neutral-700;
        }
      }
      
      mat-icon {
        font-size: 20px;
        width: 20px;
        height: 20px;
      }
    }
    
    // ========================================================================
    // MENSAJES
    // ========================================================================
    
    .error-text {
      @include body-small;
      @include flex-start;
      gap: spacing('1');
      color: $error;
      
      .error-icon {
        font-size: 16px;
        width: 16px;
        height: 16px;
      }
    }
    
    .helper-text {
      @include body-small;
      color: $neutral-600;
      
      :host-context(.dark-theme) & {
        color: $neutral-400;
      }
    }
    
    .char-counter {
      @include body-xs;
      color: $neutral-500;
      text-align: right;
      
      :host-context(.dark-theme) & {
        color: $neutral-400;
      }
    }
    
    // ========================================================================
    // RESPONSIVE
    // ========================================================================
    
    @include mobile-only {
      .input {
        font-size: 16px; // Evita zoom automático en iOS
      }
    }
  `]
})
export class InputComponent implements ControlValueAccessor {
  // ========================================================================
  // INPUTS
  // ========================================================================
  
  /** Etiqueta del input */
  label = input<string>('');
  
  /** Tipo de input */
  type = input<InputType>('text');
  
  /** Tamaño del input */
  size = input<InputSize>('md');
  
  /** Placeholder */
  placeholder = input<string>('');
  
  /** Input deshabilitado */
  disabled = input<boolean>(false);
  
  /** Input de solo lectura */
  readonly = input<boolean>(false);
  
  /** Input requerido */
  required = input<boolean>(false);
  
  /** Mensaje de error */
  error = input<string>('');
  
  /** Texto de ayuda */
  helperText = input<string>('');
  
  /** Icono izquierdo */
  iconLeft = input<string>('');
  
  /** Icono derecho */
  iconRight = input<string>('');
  
  /** Permitir limpiar valor */
  clearable = input<boolean>(false);
  
  /** Mostrar contador de caracteres */
  showCounter = input<boolean>(false);
  
  /** Valor mínimo (para number) */
  min = input<number | undefined>(undefined);
  
  /** Valor máximo (para number) */
  max = input<number | undefined>(undefined);
  
  /** Longitud mínima */
  minLength = input<number | undefined>(undefined);
  
  /** Longitud máxima */
  maxLength = input<number | undefined>(undefined);
  
  /** Patrón de validación */
  pattern = input<string | undefined>(undefined);
  
  /** Autocomplete */
  autocomplete = input<string>('off');
  
  /** Aria label */
  ariaLabel = input<string>('');
  
  // ========================================================================
  // OUTPUTS
  // ========================================================================
  
  /** Evento cuando el input obtiene foco */
  focused = output<void>();
  
  /** Evento cuando el input pierde foco */
  blurred = output<void>();
  
  // ========================================================================
  // SIGNALS INTERNOS
  // ========================================================================
  
  /** Valor del input */
  private readonly valueSignal = signal<string>('');
  readonly value = this.valueSignal.asReadonly();
  
  /** Mostrar contraseña */
  readonly showPassword = signal(false);
  
  /** Input ID único */
  readonly inputId = signal(`input-${Math.random().toString(36).substr(2, 9)}`);
  
  /** Error ID */
  readonly errorId = computed(() => `${this.inputId()}-error`);
  
  /** Helper text ID */
  readonly helperTextId = computed(() => `${this.inputId()}-helper`);
  
  /** Tiene error */
  readonly hasError = computed(() => !!this.error());
  
  /** Tipo actual del input (cambia si es password y se muestra) */
  readonly inputType = computed(() => {
    if (this.type() === 'password' && this.showPassword()) {
      return 'text';
    }
    return this.type();
  });
  
  // ========================================================================
  // COMPUTED SIGNALS
  // ========================================================================
  
  /**
   * Clases del container
   */
  containerClasses = computed(() => {
    return 'input-container';
  });
  
  /**
   * Clases del input
   */
  inputClasses = computed(() => {
    const classes = ['input'];
    
    // Tamaño
    classes.push(`input-${this.size()}`);
    
    // Con icono
    if (this.iconLeft() || this.type() === 'password') {
      classes.push('has-icon-left');
    }
    if (this.iconRight() || this.clearable() || this.type() === 'password') {
      classes.push('has-icon-right');
    }
    
    // Estado
    if (this.hasError()) {
      classes.push('input-error');
    }
    
    return classes.join(' ');
  });
  
  // ========================================================================
  // CONTROL VALUE ACCESSOR
  // ========================================================================
  
  private onChange: (value: string) => void = () => {};
  onTouched: () => void = () => {};
  
  writeValue(value: string): void {
    this.valueSignal.set(value || '');
  }
  
  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }
  
  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }
  
  setDisabledState(isDisabled: boolean): void {
    // El estado disabled se maneja via input signal
  }
  
  // ========================================================================
  // MÉTODOS
  // ========================================================================
  
  /**
   * Manejar input
   */
  onInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    const value = target.value;
    this.valueSignal.set(value);
    this.onChange(value);
  }
  
  /**
   * Manejar foco
   */
  onFocus(): void {
    this.focused.emit();
  }
  
  /**
   * Alternar visibilidad de contraseña
   */
  togglePasswordVisibility(): void {
    this.showPassword.update(show => !show);
  }
  
  /**
   * Limpiar valor
   */
  clearValue(): void {
    this.valueSignal.set('');
    this.onChange('');
  }
}
