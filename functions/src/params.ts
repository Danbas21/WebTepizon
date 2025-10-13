// ===============================================
// CLOUD FUNCTIONS V2 - PARAMS & SECRETS
// File: functions/src/params.ts
// ===============================================

import { defineString, defineSecret } from 'firebase-functions/params';

// ============= PUBLIC PARAMS (Non-Sensitive) =============
// These are read from .env files or Cloud Run environment

/**
 * SMTP Configuration (Non-sensitive)
 */
export const SMTP_HOST = defineString('SMTP_HOST', {
  default: 'smtp.gmail.com',
  description: 'SMTP server hostname',
});

export const SMTP_PORT = defineString('SMTP_PORT', {
  default: '587',
  description: 'SMTP server port',
});

/**
 * Application Configuration
 */
export const APP_NAME = defineString('APP_NAME', {
  default: 'E-Commerce Platform',
  description: 'Application name for emails and notifications',
});

export const APP_URL = defineString('APP_URL', {
  default: 'https://tu-tienda.com',
  description: 'Base URL of the application',
});

export const SUPPORT_EMAIL = defineString('SUPPORT_EMAIL', {
  default: 'support@tu-tienda.com',
  description: 'Support email address',
});

/**
 * Order Configuration
 */
export const ORDER_EXPIRY_HOURS = defineString('ORDER_EXPIRY_HOURS', {
  default: '24',
  description: 'Hours after which unpaid orders expire',
});

export const CART_EXPIRY_DAYS = defineString('CART_EXPIRY_DAYS', {
  default: '30',
  description: 'Days after which inactive carts are deleted',
});

// ============= SECRETS (Sensitive Data) =============
// These use Secret Manager in production
// Use .secret.local for local emulator testing

/**
 * Stripe Secrets
 */
export const STRIPE_SECRET_KEY = defineSecret('STRIPE_SECRET_KEY');

export const STRIPE_WEBHOOK_SECRET = defineSecret('STRIPE_WEBHOOK_SECRET');

/**
 * SMTP Secrets
 */
export const SMTP_USER = defineSecret('SMTP_USER');

export const SMTP_PASSWORD = defineSecret('SMTP_PASSWORD');

/**
 * Optional: Third-party API Keys
 */
export const SENDGRID_API_KEY = defineSecret('SENDGRID_API_KEY');

export const TWILIO_ACCOUNT_SID = defineSecret('TWILIO_ACCOUNT_SID');

export const TWILIO_AUTH_TOKEN = defineSecret('TWILIO_AUTH_TOKEN');

// ============= HELPER FUNCTIONS =============

/**
 * Get all public params as object
 */
export function getPublicConfig() {
  return {
    smtpHost: SMTP_HOST.value(),
    smtpPort: Number(SMTP_PORT.value()),
    appName: APP_NAME.value(),
    appUrl: APP_URL.value(),
    supportEmail: SUPPORT_EMAIL.value(),
    orderExpiryHours: Number(ORDER_EXPIRY_HOURS.value()),
    cartExpiryDays: Number(CART_EXPIRY_DAYS.value()),
  };
}

/**
 * Validate that required secrets are set
 */
export function validateSecrets(required: string[]): void {
  const missing: string[] = [];

  required.forEach((secret) => {
    try {
      // Try to access the secret
      switch (secret) {
      case 'STRIPE_SECRET_KEY':
        if (!STRIPE_SECRET_KEY.value()) missing.push(secret);
        break;
      case 'STRIPE_WEBHOOK_SECRET':
        if (!STRIPE_WEBHOOK_SECRET.value()) missing.push(secret);
        break;
      case 'SMTP_USER':
        if (!SMTP_USER.value()) missing.push(secret);
        break;
      case 'SMTP_PASSWORD':
        if (!SMTP_PASSWORD.value()) missing.push(secret);
        break;
      }
    } catch (error) {
      missing.push(secret);
    }
  });

  if (missing.length > 0) {
    throw new Error(`Missing required secrets: ${missing.join(', ')}`);
  }
}