"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  signInWithGoogle,
  sendEmailLoginLink,
  isEmailLoginLink,
  completeEmailLogin,
  completeEmailLoginWithEmail,
} from "../../lib/firebaseClient";

async function establishSession(credential, fallbackName) {
  const idToken = await credential.user.getIdToken();
  const res = await fetch("/api/buyer-session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idToken, name: fallbackName || undefined }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Could not create your login session.");
  }
}

function authErrorMessage(err) {
  const code = err?.code || "";
  if (code === "auth/invalid-api-key" || code === "auth/configuration-not-found") {
    return "Login has not been configured yet. Please contact the event organiser.";
  }
  if (code === "auth/operation-not-allowed") {
    return "This sign-in method isn't enabled yet. Please contact the event organiser.";
  }
  if (code === "auth/unauthorized-domain") {
    return "This website domain is not authorised for login yet.";
  }
  if (code === "auth/popup-closed-by-user" || code === "auth/cancelled-popup-request") {
    return ""; // user just closed the Google popup - not a real error
  }
  if (code === "auth/network-request-failed") {
    return "We couldn't reach the login service. Check your connection and try again.";
  }
  return code ? `Couldn't log you in (${code}). Please try again shortly.` : err?.message || "Couldn't log you in. Please try again shortly.";
}

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/my-tickets";

  const [mode, setMode] = useState("choose"); // choose | email-sent | needs-email-confirm
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [confirmEmail, setConfirmEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // If this page was opened from the sign-in link in the user's email,
  // finish the login automatically.
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!isEmailLoginLink(window.location.href)) return;

    (async () => {
      setLoading(true);
      try {
        const { credential, name: savedName } = await completeEmailLogin(window.location.href);
        await establishSession(credential, savedName);
        router.push(next);
        router.refresh();
      } catch (err) {
        if (err.needsEmail) {
          setMode("needs-email-confirm");
        } else {
          setError(authErrorMessage(err));
        }
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleGoogle() {
    setError("");
    setLoading(true);
    try {
      const credential = await signInWithGoogle();
      await establishSession(credential);
      router.push(next);
      router.refresh();
    } catch (err) {
      const msg = authErrorMessage(err);
      if (msg) setError(msg);
    } finally {
      setLoading(false);
    }
  }

  async function handleSendLink(e) {
    e.preventDefault();
    setError("");
    if (!email.includes("@")) {
      setError("Enter a valid email address.");
      return;
    }
    setLoading(true);
    try {
      await sendEmailLoginLink(email.trim(), name.trim());
      setMode("email-sent");
    } catch (err) {
      setError(authErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirmEmail(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { credential, name: savedName } = await completeEmailLoginWithEmail(window.location.href, confirmEmail.trim());
      await establishSession(credential, savedName);
      router.push(next);
      router.refresh();
    } catch (err) {
      setError(authErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container" style={{ paddingTop: 48, paddingBottom: 64, maxWidth: 420 }}>
      <div style={{ textAlign: "center", marginBottom: 20 }}>
        <img src="/logo.png" alt="" width={52} height={52} style={{ borderRadius: "50%" }} />
      </div>
      <h1 style={{ fontSize: 28, textAlign: "center" }}>Log in</h1>

      {mode === "choose" && (
        <>
          <p style={{ fontSize: 14, color: "rgba(242,234,216,0.6)", marginTop: 6 }}>
            So you can find your tickets again later, from any device.
          </p>

          <button
            className="btn btn-primary"
            style={{ width: "100%", marginTop: 24 }}
            onClick={handleGoogle}
            disabled={loading}
          >
            Continue with Google
          </button>

          <div style={{ textAlign: "center", margin: "20px 0", fontSize: 13, color: "rgba(242,234,216,0.4)" }}>or</div>

          <form onSubmit={handleSendLink}>
            <div className="field">
              <label>Email address</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" autoFocus />
            </div>
            <div className="field">
              <label>Your name (so we know it's you)</label>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Optional" />
            </div>
            {error && <p className="error-text">{error}</p>}
            <button className="btn btn-outline" type="submit" style={{ width: "100%" }} disabled={loading}>
              {loading ? "Sending…" : "Email me a login link"}
            </button>
          </form>
        </>
      )}

      {mode === "email-sent" && (
        <div style={{ marginTop: 24 }}>
          <p style={{ color: "rgba(242,234,216,0.8)" }}>
            Check <strong>{email}</strong> for a login link — open it on this device to finish logging in.
          </p>
          <button className="btn btn-outline" style={{ marginTop: 16 }} onClick={() => setMode("choose")}>
            Use a different method
          </button>
        </div>
      )}

      {mode === "needs-email-confirm" && (
        <form onSubmit={handleConfirmEmail} style={{ marginTop: 24 }}>
          <p style={{ fontSize: 14, color: "rgba(242,234,216,0.7)" }}>
            Confirm the email you requested this link with.
          </p>
          <div className="field">
            <label>Email address</label>
            <input type="email" value={confirmEmail} onChange={(e) => setConfirmEmail(e.target.value)} autoFocus />
          </div>
          {error && <p className="error-text">{error}</p>}
          <button className="btn btn-primary" type="submit" style={{ width: "100%" }} disabled={loading}>
            {loading ? "Verifying…" : "Finish logging in"}
          </button>
        </form>
      )}
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginContent />
    </Suspense>
  );
}
