"use client";

import Link from "next/link";
import { MarigoldGarland, Diya } from "./FestiveMotifs";

// Shared header/footer used on the secondary pages (menu, stalls, location)
// so the logo + garland treatment from the homepage is consistent
// everywhere, without repeating the same markup on every page.

export function FestiveHeader() {
  return (
    <div style={{ textAlign: "center", marginBottom: 28 }}>
      <img src="/logo.png" alt="" width={48} height={48} style={{ borderRadius: "50%" }} />
      <div style={{ marginTop: 6 }}><MarigoldGarland height={28} /></div>
    </div>
  );
}

export function FestiveFooter() {
  return (
    <footer style={{ padding: "40px 0 32px", borderTop: "1px solid var(--line)", textAlign: "center", marginTop: 48 }}>
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 14, marginBottom: 14 }}>
        <Diya size={26} />
        <img src="/logo.png" alt="" width={36} height={36} style={{ borderRadius: "50%" }} />
        <Diya size={26} style={{ transform: "scaleX(-1)" }} />
      </div>
      <p style={{ fontSize: 13, color: "rgba(242,234,216,0.6)" }}>
        <Link href="/menu">Food & Drinks</Link> · <Link href="/stalls">Stalls</Link> · <Link href="/location">Getting there</Link>
      </p>
      <p style={{ fontSize: 12, marginTop: 10, color: "rgba(242,234,216,0.4)" }}>
        <Link href="/">Back to event</Link>
      </p>
    </footer>
  );
}
