// ===============================================
// UPDATE USER LAST LOGIN
// File: functions/src/auth/updateLastLogin.ts
// ===============================================

import { onCall } from 'firebase-functions/v2/https';
import * as functions from 'firebase-functions/v2';
import * as admin from 'firebase-admin';


/**
 * Callable function to update user's last login timestamp
 */
export const updateLastLogin = onCall(async (request) => {
  const { auth } = request;

  if (!auth) {
    throw new functions.https.HttpsError(
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
    throw new functions.https.HttpsError(
      'internal',
      'Failed to update last login'
    );
  }
});