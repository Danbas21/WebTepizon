// ===============================================
// AUTHENTICATION FUNCTIONS (Versión Correcta)
// File: functions/src/auth/onUserCreated.ts
// ===============================================

import * as functions from 'firebase-functions/v1';
import * as admin from 'firebase-admin';
import * as nodemailer from 'nodemailer';

/**
 * Triggered when a new user is created in Firebase Auth
 * Creates a corresponding user document in Firestore
 * NO requiere GCIP - funciona automáticamente con v1 API
 */
export const onUserCreated = functions.auth.user().onCreate(async (user) => {
  const { uid, email, displayName, photoURL } = user;

  // Parse display name into first and last name
  const parts = (displayName ?? '').trim().split(/\s+/);
  const firstName = parts[0] ?? '';
  const lastName = parts.slice(1).join(' ') ?? '';

  // Create user document
  const userDoc = {
    id: uid,
    email: email || '',
    firstName,
    lastName,
    avatar: photoURL || null,
    phone: null,

    preferences: {
      theme: 'light',
      language: 'es',
      emailNotifications: true,
      smsNotifications: false,
    },

    role: 'USER',
    isEmailVerified: false,
    isPhoneVerified: false,

    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    lastLoginAt: admin.firestore.FieldValue.serverTimestamp(),
  };

  try {
    // Create user document in Firestore
    await admin.firestore()
      .collection('users')
      .doc(uid)
      .set(userDoc);

    // Create empty wishlist
    await admin.firestore()
      .collection('wishlists')
      .doc(uid)
      .set({
        userId: uid,
        items: [],
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

    // Send welcome email (opcional)
    await sendWelcomeEmail(email || '', firstName);

    functions.logger.info(`User document created for ${uid}`);
  } catch (error) {
    functions.logger.error('Error creating user document:', error);
    // El usuario ya fue creado en Auth, solo registramos el error
  }
});

/**
 * Send welcome email to new user
 */
async function sendWelcomeEmail(
  email: string,
  firstName: string
): Promise<void> {
  // TODO: Implement email sending with your preferred service
  // Options: SendGrid, Mailgun, Nodemailer, etc.

  const emailContent = {
    to: email,
    subject: '¡Bienvenido a Tepizon! 🎉',
    html: `
      <div style="
        font-family: 'Inter', Arial, sans-serif;
        max-width: 600px;
        margin: 0 auto;
      ">
        <h1 style="color: #01261E;">¡Hola ${firstName}!</h1>
        <p>
          Gracias por unirte a nuestra plataforma.
          Estamos emocionados de tenerte con nosotros.
        </p>
        <p>Explora nuestros productos y encuentra lo que necesitas:</p>
        <ul>
          <li>Ropa</li>
          <li>Deportes</li>
          <li>Hogar</li>
          <li>Decoración</li>
        </ul>
        <a 
          href="https://tu-tienda.com"
          style="
            display: inline-block;
            background-color: #01261E;
            color: white;
            padding: 12px 24px;
            text-decoration: none;
            border-radius: 8px;
            margin-top: 20px;
          "
        >
          Comenzar a Comprar
        </a>
        <p style="margin-top: 30px; color: #666; font-size: 14px;">
          Si tienes alguna pregunta, no dudes en contactarnos.
        </p>
      </div>
    `,
  };

  functions.logger.info('Welcome email would be sent to:', email);
  // Actual implementation would use email service here
  // Example with Nodemailer:
  // const transporter = nodemailer.createTransport({...});
  // await transporter.sendMail(emailContent);

  // In a real implementation, you would use code like this:
  // ---------------------------------------------------------

  //
  const transporter = nodemailer.createTransport({
    host: 'smtp.example.com',
    port: 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  try {
    await transporter.sendMail(emailContent);
    functions.logger.info('Welcome email sent successfully to:', email);
  } catch (err) {
    functions.logger.error('Error sending welcome email:', err);
  }
}

// ===============================================
// UPDATE LAST LOGIN (v2 API - Callable Function)
// ===============================================

import { onCall, HttpsError } from 'firebase-functions/v2/https';

/**
 * Callable function to update user's last login timestamp
 */
export const updateLastLogin = onCall(async (request) => {
  const { auth } = request;

  if (!auth) {
    throw new HttpsError(
      'unauthenticated',
      'User must be authenticated'
    );
  }

  try {
    await admin.firestore()
      .collection('users')
      .doc(auth.uid)
      .update({
        lastLoginAt: admin.firestore.FieldValue.serverTimestamp(),
      });

    return { success: true };
  } catch (error) {
    functions.logger.error('Error updating last login:', error);
    throw new HttpsError(
      'internal',
      'Failed to update last login'
    );
  }
});