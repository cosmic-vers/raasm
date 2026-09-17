"use client";

import { initializeApp, getApps } from "firebase/app";
import { getAuth, RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";

// Client-side Firebase config. These NEXT_PUBLIC_* values are safe to
// expose in the browser (that's how Firebase web apps always work) -
// access is actually controlled by Firebase's own domain allowlist and
// your Firestore/Auth rules, not by hiding this config.
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
};

function getFirebaseApp() {
  if (getApps().length) return getApps()[0];
  return initializeApp(firebaseConfig);
}

export function getFirebaseAuth() {
  return getAuth(getFirebaseApp());
}

// Firebase requires an invisible reCAPTCHA to prove the phone-auth request
// comes from a real browser, not a script farming free SMS. It attaches
// itself to a DOM node you already have on the page (see login/page.js).
export function ensureRecaptcha(containerId) {
  const auth = getFirebaseAuth();
  // Keep the verifier in this module rather than on `window`. A verifier left
  // attached to a previous login page makes Firebase reject subsequent SMS
  // attempts with a "container already contains an element" error.
  if (!globalThis.__eventHubRecaptchaVerifier) {
    globalThis.__eventHubRecaptchaVerifier = new RecaptchaVerifier(auth, containerId, { size: "invisible" });
  }
  return globalThis.__eventHubRecaptchaVerifier;
}

export function resetRecaptcha() {
  const verifier = globalThis.__eventHubRecaptchaVerifier;
  if (verifier) verifier.clear();
  delete globalThis.__eventHubRecaptchaVerifier;
}

export async function sendOtp(phoneE164, containerId) {
  const auth = getFirebaseAuth();
  const verifier = ensureRecaptcha(containerId);
  try {
    return await signInWithPhoneNumber(auth, phoneE164, verifier);
  } catch (error) {
    // A failed challenge/invalid number cannot reliably be reused. Start the
    // next attempt with a newly rendered invisible reCAPTCHA.
    resetRecaptcha();
    throw error;
  }
}
