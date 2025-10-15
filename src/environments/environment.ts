/**
 * Environment Configuration
 * 
 * Configuración del entorno de desarrollo.
 * Incluye credenciales de Firebase y otras configuraciones.
 * 
 * IMPORTANTE: Este archivo contiene configuración pública de Firebase.
 * Las credenciales sensibles (API keys de backend) están en Secret Manager.
 */

export interface Environment {
  production: boolean;
  apiUrl: string;
  firebase: {
    apiKey: string;
    authDomain: string;
    projectId: string;
    storageBucket: string;
    messagingSenderId: string;
    appId: string;
    measurementId: string;
  };
  stripe: {
    publishableKey: string;
  };
  features: {
    enableAnalytics: boolean;
    enableServiceWorker: boolean;
    enableOfflineMode: boolean;
    enablePushNotifications: boolean;
  };
}

export const environment = {
  production: false,
  apiUrl: 'http://localhost:4200/api',

  // Configuración de Firebase
  // Obtén estos valores de: https://console.firebase.google.com/project/tepizon-web/settings/general
  firebase: {
    apiKey: "AIzaSyCrqH9QpXOZ8lFy51yZCclcOeTJhkL1iok",
    authDomain: "tepizon-web.firebaseapp.com",
    projectId: "tepizon-web",
    storageBucket: "tepizon-web.firebasestorage.app",
    messagingSenderId: "356932896799",
    appId: "1:356932896799:web:c6a71684633e2c3d01ad2a",
    measurementId: "G-CY6YZ7L5V5"
  },

  stripe: {
    publishableKey: 'pk_live_51SH8VSPQvi6nXKP8zYycuoXDl3EE3HamSAMeu167QQWER2tC709tmeT3khsiJTeyWA56e7jVu4NTsyh1aTKC4h6N00cDUeHps2',
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