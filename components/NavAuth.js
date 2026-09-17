"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

// Small auth-aware nav fragment: shows "Log in" or "My tickets / Log out"
// depending on the buyer's login session. Used on every public page.
export default function NavAuth() {
  const [user, setUser] = useState(undefined); // undefined = loading, null = logged out

  useEffect(() => {
    fetch("/api/auth/session")
      .then((r) => r.json())
      .then((d) => setUser(d.user))
      .catch(() => setUser(null));
  }, []);

  async function handleLogout() {
    await fetch("/api/auth/session", { method: "DELETE" });
    setUser(null);
    window.location.href = "/";
  }

  if (user === undefined) return null;

  return user ? (
    <span style={{ display: "flex", gap: 16, alignItems: "center" }}>
      <Link href="/my-tickets" style={{ color: "rgba(242,234,216,0.75)" }}>My tickets</Link>
      <button
        onClick={handleLogout}
        style={{ background: "none", border: "none", color: "rgba(242,234,216,0.5)", fontSize: 14, padding: 0 }}
      >
        Log out
      </button>
    </span>
  ) : (
    <Link href="/login" style={{ color: "rgba(242,234,216,0.75)" }}>Log in</Link>
  );
}
