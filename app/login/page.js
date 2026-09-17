"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { resetRecaptcha, sendOtp } from "../../lib/firebaseClient";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/my-tickets";

  const [step, setStep] = useState("phone"); // phone | otp
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [name, setName] = useState("");
  const [confirmationResult, setConfirmationResult] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function toE164(raw) {
    const digits = raw.replace(/\D/g, "");
    if (raw.trim().startsWith("+")) return `+${digits}`;
    // Accept the common 91xxxxxxxxxx format as well as a local 10-digit
    // Indian number. Previously this produced +9191xxxxxxxxxx.
    if (digits.startsWith("91") && digits.length === 12) return `+${digits}`;
    // Default to India country code since that's this event's audience -
    // change this if you're running the event elsewhere.
    return `+91${digits}`;
  }

  useEffect(() => () => resetRecaptcha(), []);

  function phoneAuthError(err) {
    const code = err?.code || "";
    if (code === "auth/invalid-api-key" || code === "auth/configuration-not-found") {
      return "Phone login has not been configured yet. Please contact the event organiser.";
    }
    if (code === "auth/operation-not-allowed") {
      return "Phone sign-in is not enabled in Firebase yet. Please contact the event organiser.";
    }
    if (code === "auth/unauthorized-domain") {
      return "This website domain is not authorised for phone login yet.";
    }
    if (code === "auth/too-many-requests" || code === "auth/quota-exceeded") {
      return "SMS sending is temporarily unavailable. Please try again later.";
    }
    if (code === "auth/invalid-phone-number") {
      return "Enter a valid phone number, including the correct country code.";
    }
    return "Couldn't send the code. Please try again shortly.";
  }

  async function handleSendOtp(e) {
    e.preventDefault();
    setError("");
    const normalizedPhone = phone.trim().replace(/[\s()-]/g, "");
    if (!/^(?:\+91|91)?[6-9]\d{9}$/.test(normalizedPhone)) {
      setError("Enter a valid 10-digit Indian mobile number.");
      return;
    }
    setLoading(true);
    try {
      const result = await sendOtp(toE164(phone), "recaptcha-container");
      setConfirmationResult(result);
      setStep("otp");
    } catch (err) {
      console.error(err);
      setError(phoneAuthError(err));
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOtp(e) {
    e.preventDefault();
    setError("");
    if (otp.trim().length < 6) {
      setError("Enter the 6-digit code.");
      return;
    }
    setLoading(true);
    try {
      const credential = await confirmationResult.confirm(otp.trim());
      const idToken = await credential.user.getIdToken();

      const res = await fetch("/api/auth/phone", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken, name: name || undefined }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Could not create your login session.");
      }

      router.push(next);
      router.refresh();
    } catch (err) {
      console.error(err);
      setError(err.message || "That code didn't match. Check the SMS and try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container" style={{ paddingTop: 64, paddingBottom: 64, maxWidth: 420 }}>
      <h1 style={{ fontSize: 28 }}>Log in</h1>
      <p style={{ fontSize: 14, color: "rgba(242,234,216,0.6)", marginTop: 6 }}>
        {step === "phone"
          ? "We'll text you a one-time code — no password needed."
          : `Enter the code we sent to ${phone}.`}
      </p>

      {step === "phone" ? (
        <form onSubmit={handleSendOtp} style={{ marginTop: 24 }}>
          <div className="field">
            <label>Phone number</label>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="98765 43210"
              inputMode="tel"
              autoFocus
            />
          </div>
          {error && <p className="error-text">{error}</p>}
          <button className="btn btn-primary" type="submit" disabled={loading} style={{ width: "100%", marginTop: 8 }}>
            {loading ? "Sending…" : "Send code"}
          </button>
        </form>
      ) : (
        <form onSubmit={handleVerifyOtp} style={{ marginTop: 24 }}>
          <div className="field">
            <label>6-digit code</label>
            <input
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              placeholder="123456"
              inputMode="numeric"
              maxLength={6}
              autoFocus
              style={{ letterSpacing: "0.3em", fontSize: 20, textAlign: "center" }}
            />
          </div>
          <div className="field">
            <label>Your name (so we know it's you)</label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Optional" />
          </div>
          {error && <p className="error-text">{error}</p>}
          <button className="btn btn-primary" type="submit" disabled={loading} style={{ width: "100%", marginTop: 8 }}>
            {loading ? "Verifying…" : "Verify & log in"}
          </button>
          <button
            type="button"
            className="btn btn-outline"
            style={{ width: "100%", marginTop: 10 }}
            onClick={() => { resetRecaptcha(); setStep("phone"); setOtp(""); setError(""); }}
          >
            Use a different number
          </button>
        </form>
      )}

      {/* Firebase attaches its invisible reCAPTCHA challenge here. */}
      <div id="recaptcha-container" />
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
