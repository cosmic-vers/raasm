"use client";

import { useEffect, useState } from "react";

function getRemaining(target) {
  const diff = new Date(target).getTime() - Date.now();
  if (diff <= 0) return null;
  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  };
}

function Unit({ value, label }) {
  return (
    <div style={{ textAlign: "center", minWidth: 56 }}>
      <div
        style={{
          fontFamily: "var(--display, var(--serif))",
          fontSize: "clamp(28px, 5vw, 44px)",
          lineHeight: 1,
          background: "var(--festive-gradient, var(--gold))",
          WebkitBackgroundClip: "text",
          backgroundClip: "text",
          color: "transparent",
        }}
      >
        {String(value).padStart(2, "0")}
      </div>
      <div style={{ fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", color: "rgba(242,234,216,0.55)", marginTop: 4 }}>
        {label}
      </div>
    </div>
  );
}

// Pass the target date/time (ISO string or Date) and an optional label.
// Renders nothing once the target has passed, rather than showing a
// confusing "00:00:00:00" or negative countdown.
export default function Countdown({ target, label }) {
  const [remaining, setRemaining] = useState(() => (target ? getRemaining(target) : null));

  useEffect(() => {
    if (!target) return;
    const interval = setInterval(() => setRemaining(getRemaining(target)), 1000);
    return () => clearInterval(interval);
  }, [target]);

  if (!target || !remaining) return null;

  return (
    <div style={{ marginTop: 28 }}>
      {label && (
        <p style={{ fontSize: 13, letterSpacing: "0.04em", color: "rgba(242,234,216,0.6)", marginBottom: 10, textTransform: "uppercase" }}>
          {label}
        </p>
      )}
      <div style={{ display: "flex", gap: 18 }}>
        <Unit value={remaining.days} label="Days" />
        <Unit value={remaining.hours} label="Hrs" />
        <Unit value={remaining.minutes} label="Min" />
        <Unit value={remaining.seconds} label="Sec" />
      </div>
    </div>
  );
}
