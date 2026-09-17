"use client";

import { initializeApp, getApps } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  signInWithEmailLink,
} from "firebase/auth";

// Client-side Firebase config. These NEXT_PUBLIC_* values are safe to
// expose in the browser (that's how Firebase web apps always work) -
// access is actually controlled by Firebase's own domain allowlist and
// your Auth rules, not by hiding this config.
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

// --- Google sign-in ---
// Free on Firebase's Spark (no billing) plan - just needs Google enabled
// under Authentication > Sign-in method, and your domain listed under
// Authentication > Settings > Authorized domains.
export async function signInWithGoogle() {
  const auth = getFirebaseAuth();
  const provider = new GoogleAuthProvider();
  return signInWithPopup(auth, provider);
}

// --- Passwordless email link sign-in ---
// Also free on Spark - Firebase sends the email itself, no SMTP/email
// service needed on your end. Needs "Email/Password" > "Email link
// (passwordless sign-in)" enabled under Authentication > Sign-in method.
const EMAIL_STORAGE_KEY = "eventhub_email_for_signin";
const NAME_STORAGE_KEY = "eventhub_name_for_signin";

export async function sendEmailLoginLink(email, name) {
  const auth = getFirebaseAuth();
  const actionCodeSettings = {
    url: `${window.location.origin}/login`,
    handleCodeInApp: true,
  };
  await sendSignInLinkToEmail(auth, email, actionCodeSettings);
  // Firebase needs the same email back when the link is opened (possibly a
  // different tab/session), so stash it locally rather than putting it in
  // the link itself.
  window.localStorage.setItem(EMAIL_STORAGE_KEY, email);
  if (name) window.localStorage.setItem(NAME_STORAGE_KEY, name);
}

export function isEmailLoginLink(url) {
  const auth = getFirebaseAuth();
  return isSignInWithEmailLink(auth, url);
}

// Returns { credential, name } on success, or throws. If the link is opened
// on a different device/browser than it was requested from, `needsEmail`
// is thrown so the caller can prompt for the email address instead.
export async function completeEmailLogin(url) {
  const auth = getFirebaseAuth();
  let email = window.localStorage.getItem(EMAIL_STORAGE_KEY);
  if (!email) {
    const err = new Error("Enter the email you used to request the link.");
    err.needsEmail = true;
    throw err;
  }
  const credential = await signInWithEmailLink(auth, email, url);
  const name = window.localStorage.getItem(NAME_STORAGE_KEY) || "";
  window.localStorage.removeItem(EMAIL_STORAGE_KEY);
  window.localStorage.removeItem(NAME_STORAGE_KEY);
  return { credential, name };
}

export async function completeEmailLoginWithEmail(url, email) {
  const auth = getFirebaseAuth();
  const credential = await signInWithEmailLink(auth, email, url);
  const name = window.localStorage.getItem(NAME_STORAGE_KEY) || "";
  window.localStorage.removeItem(EMAIL_STORAGE_KEY);
  window.localStorage.removeItem(NAME_STORAGE_KEY);
  return { credential, name };
}
