/**
 * Environment Configuration
 * 
 * Configuración del entorno de desarrollo.
 * Incluye credenciales de Firebase y otras configuraciones.
 * 
 * IMPORTANTE: Este archivo contiene configuración pública de Firebase.
 * Las credenciales sensibles (API keys de backend) están en Secret Manager.
 */

export const environment = {
  production: false,

  // Configuración de Firebase
  // Obtén estos valores de: https://console.firebase.google.com/project/tepizon-web/settings/general
  firebase: {
    apiKey: 'TU_API_KEY_AQUI', // Public API Key
    authDomain: 'tepizon-web.firebaseapp.com',
    projectId: 'tepizon-web',
    storageBucket: 'tepizon-web.firebasestorage.app',
    messagingSenderId: 'TU_MESSAGING_SENDER_ID',
    appId: 'TU_APP_ID',
    measurementId: 'TU_MEASUREMENT_ID', // Opcional para Analytics
  },

  // URLs de Cloud Functions
  cloudFunctionsBaseUrl: 'https://us-central1-tepizon-web.cloudfunctions.net',

  // Endpoints de Cloud Functions
  endpoints: {
    createPaymentIntent: 'createPaymentIntent',
    handleStripeWebhook: 'handleStripeWebhook',
    processRefund: 'processRefund',
    updateOrderStatus: 'updateOrderStatus',
    sendNotification: 'sendNotification',
    trackProductView: 'trackProductView',
  },

  // Configuración de la app
  app: {
    name: 'Tepizon Platform',
    version: '1.0.0',
    defaultLanguage: 'es',
    supportedLanguages: ['es', 'en'],
    currency: 'MXN',
    currencySymbol: '$',
  },

  // Features flags
  features: {
    socialLogin: true,
    googleLogin: true,
    facebookLogin: false, // Deshabilitado por ahora
    emailVerificationRequired: true,
    passwordReset: true,
    rememberMe: true,
  },

  // Configuración de analytics
  analytics: {
    enabled: false, // Cambiar a true en producción
    debug: true,
  },

  // Configuración de logging
  logging: {
    level: 'debug', // 'error' | 'warn' | 'info' | 'debug'
    enableConsole: true,
    enableRemote: false,
  },
};

/**
 * Instrucciones para obtener la configuración de Firebase:
 * 
 * 1. Ve a: https://console.firebase.google.com/project/tepizon-web/settings/general
 * 2. Scroll down hasta "Tus apps"
 * 3. Si no tienes una app web, haz clic en "Añadir app" y selecciona "Web"
 * 4. Copia la configuración y reemplaza los valores arriba
 * 5. Los valores son públicos y seguros para incluir en el código del frontend
 * 
 * Ejemplo de configuración real:
 * ```
 * apiKey: "AIzaSyC...",
 * authDomain: "tepizon-web.firebaseapp.com",
 * projectId: "tepizon-web",
 * storageBucket: "tepizon-web.firebasestorage.app",
 * messagingSenderId: "356932896799",
 * appId: "1:356932896799:web:...",
 * measurementId: "G-..."
 * ```
 */