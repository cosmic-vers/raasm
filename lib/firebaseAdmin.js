import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

// Server-side Firebase Admin SDK, used to verify the ID token the client
// gets back after a successful phone OTP sign-in. Never expose these
// credentials to the browser - they live only in server env vars.
function getAdminApp() {
  if (getApps().length) return getApps()[0];

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  // Private keys from env vars usually have literal "\n" instead of real
  // newlines once pasted into .env - this restores them.
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      "Firebase Admin is not configured. Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY in your .env (from a service account key downloaded in Firebase Console > Project Settings > Service Accounts)."
    );
  }

  return initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) });
}

export async function verifyFirebaseIdToken(idToken) {
  const app = getAdminApp();
  return getAuth(app).verifyIdToken(idToken);
}
