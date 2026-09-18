"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";

const NAV = [
  { key: "dashboard", href: "/admin/dashboard", label: "Dashboard" },
  { key: "events", href: "/admin/events", label: "Event & tickets" },
  { key: "menu", href: "/admin/menu", label: "Menu" },
  { key: "stalls", href: "/admin/stalls", label: "Stalls" },
  { key: "gallery", href: "/admin/gallery", label: "Gallery" },
  { key: "referrals", href: "/admin/referrals", label: "Referrals" },
  { key: "attendees", href: "/admin/attendees", label: "Attendees" },
  { key: "stats", href: "/admin/stats", label: "Stats" },
  { key: "verify", href: "/verify", label: "Check-in scanner" },
];

export default function AdminShell({ active, children }) {
  return (
    <div>
      <nav style={{ borderBottom: "1px solid var(--line)", padding: "16px 0" }}>
        <div className="container" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <div style={{ display: "flex", gap: 18, flexWrap: "wrap" }}>
            {NAV.map((item) => (
              <Link
                key={item.key}
                href={item.href}
                style={{
                  fontSize: 14,
                  color: active === item.key ? "var(--gold)" : "rgba(242,234,216,0.7)",
                  fontWeight: active === item.key ? 600 : 400,
                }}
              >
                {item.label}
              </Link>
            ))}
          </div>
          <button className="btn btn-outline" style={{ fontSize: 13, padding: "8px 14px" }} onClick={() => signOut({ callbackUrl: "/admin/login" })}>
            Sign out
          </button>
        </div>
      </nav>
      <div className="container" style={{ paddingTop: 32, paddingBottom: 48 }}>
        {children}
      </div>
    </div>
  );
}
