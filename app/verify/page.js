"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

// Short beep/buzz feedback so staff can tell valid/invalid apart without
// staring at the screen in a loud, dark venue entrance.
function playTone(kind) {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = "sine";
    osc.frequency.value = kind === "valid" ? 880 : 220;
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + (kind === "valid" ? 0.15 : 0.35));
    osc.start();
    osc.stop(ctx.currentTime + (kind === "valid" ? 0.15 : 0.35));
  } catch (e) {}
  if (navigator.vibrate) {
    navigator.vibrate(kind === "valid" ? 60 : [80, 60, 80]);
  }
}

export default function VerifyPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const scannerRef = useRef(null);
  const [result, setResult] = useState(null);
  const [manualCode, setManualCode] = useState("");
  const [scanning, setScanning] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const [torchSupported, setTorchSupported] = useState(false);
  const [sessionCount, setSessionCount] = useState({ valid: 0, invalid: 0 });
  const busyRef = useRef(false);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/admin/login?callbackUrl=/verify");
  }, [status, router]);

  const checkCode = useCallback(async (code) => {
    if (busyRef.current) return;
    busyRef.current = true;
    setResult({ loading: true });
    try {
      const res = await fetch("/api/tickets/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const data = await res.json();
      setResult(data);
      playTone(data.valid ? "valid" : "invalid");
      setSessionCount((c) => (data.valid ? { ...c, valid: c.valid + 1 } : { ...c, invalid: c.invalid + 1 }));
    } catch (err) {
      setResult({ valid: false, reason: "Network error." });
      playTone("invalid");
    } finally {
      busyRef.current = false;
    }
  }, []);

  useEffect(() => {
    if (status !== "authenticated") return;
    let html5QrCode;
    let active = true;

    async function start() {
      const { Html5Qrcode } = await import("html5-qrcode");
      if (!active) return;
      html5QrCode = new Html5Qrcode("qr-reader");
      scannerRef.current = html5QrCode;
      try {
        await html5QrCode.start(
          { facingMode: "environment" },
          { fps: 12, qrbox: { width: 260, height: 260 } },
          (decodedText) => {
            if (busyRef.current) return;
            html5QrCode.pause();
            checkCode(decodedText).then(() => {
              setTimeout(() => {
                try { html5QrCode.resume(); } catch (e) {}
              }, 1400);
            });
          },
          () => {}
        );
        setScanning(true);
        try {
          const capabilities = html5QrCode.getRunningTrackCapabilities?.();
          if (capabilities && capabilities.torch) setTorchSupported(true);
        } catch (e) {}
      } catch (err) {
        setScanning(false);
      }
    }

    start();

    return () => {
      active = false;
      if (html5QrCode) {
        html5QrCode.stop().catch(() => {});
      }
    };
  }, [checkCode, status]);

  function toggleTorch() {
    const next = !torchOn;
    try {
      scannerRef.current?.applyVideoConstraints({ advanced: [{ torch: next }] });
      setTorchOn(next);
    } catch (e) {}
  }

  function handleManualSubmit(e) {
    e.preventDefault();
    if (manualCode.trim()) {
      checkCode(manualCode.trim());
      setManualCode("");
    }
  }

  const flashColor = !result || result.loading ? null : result.valid ? "#1f6b3a" : "#7a2222";

  if (status === "loading") {
    return <div className="container" style={{ paddingTop: 80 }}>Checking your session…</div>;
  }
  if (status === "unauthenticated") {
    return <div className="container" style={{ paddingTop: 80 }}>Redirecting to login…</div>;
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: flashColor || "var(--ink)",
        transition: "background 0.25s ease",
      }}
    >
      <div className="container" style={{ paddingTop: 32, paddingBottom: 48, maxWidth: 480 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <h1 style={{ fontSize: 24 }}>Ticket check-in</h1>
          <p style={{ fontSize: 13, color: "rgba(242,234,216,0.55)" }}>
            <span style={{ color: "#8fd39a" }}>{sessionCount.valid} in</span>
            {"  ·  "}
            <span style={{ color: "#e69a9a" }}>{sessionCount.invalid} rejected</span>
          </p>
        </div>
        <p style={{ fontSize: 14, color: "rgba(242,234,216,0.6)", marginTop: 6 }}>
          Point the camera at a ticket's QR code, or type the short code in manually.
        </p>

        <div style={{ position: "relative", marginTop: 20 }}>
          <div
            id="qr-reader"
            style={{ borderRadius: "var(--radius)", overflow: "hidden", background: "#000", minHeight: 260 }}
          />
          {torchSupported && (
            <button
              type="button"
              onClick={toggleTorch}
              className="btn btn-outline"
              style={{
                position: "absolute",
                bottom: 12,
                right: 12,
                padding: "8px 12px",
                fontSize: 12,
                background: "rgba(20,23,31,0.75)",
              }}
            >
              {torchOn ? "Torch off" : "Torch on"}
            </button>
          )}
        </div>
        {!scanning && (
          <p style={{ fontSize: 13, color: "rgba(242,234,216,0.5)", marginTop: 8 }}>
            Couldn't access the camera — allow camera permission, or use manual entry below.
          </p>
        )}

        <form onSubmit={handleManualSubmit} style={{ marginTop: 20 }}>
          <div className="field">
            <label>Ticket code (manual entry)</label>
            <input
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              placeholder="H4K9PX-7A2E"
              style={{ textTransform: "uppercase", letterSpacing: "0.05em", fontFamily: "monospace", fontSize: 16 }}
              autoCapitalize="characters"
            />
          </div>
          <button className="btn btn-outline" type="submit">Check</button>
        </form>

        {result && (
          <div
            className="card"
            style={{
              marginTop: 24,
              borderColor: result.valid ? "#7fbf7f" : result.loading ? "var(--line)" : "#e17a6a",
              background: "rgba(20,23,31,0.9)",
            }}
          >
            {result.loading ? (
              <p>Checking…</p>
            ) : result.valid ? (
              <>
                <p className="success-text" style={{ fontSize: 18, fontWeight: 700 }}>✓ Valid — checked in</p>
                <p style={{ marginTop: 6 }}>{result.buyerName} · {result.ticketType}</p>
              </>
            ) : (
              <>
                <p className="error-text" style={{ fontSize: 18, fontWeight: 700 }}>✗ {result.reason}</p>
                {result.buyerName && <p style={{ marginTop: 6 }}>{result.buyerName} · {result.ticketType}</p>}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
