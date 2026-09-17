"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import AdminShell from "../AdminShell";

function Bar({ label, value, max }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4 }}>
        <span>{label}</span>
        <span style={{ color: "rgba(242,234,216,0.6)" }}>{value}</span>
      </div>
      <div style={{ background: "var(--line)", borderRadius: 4, height: 8, overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, background: "var(--gold)", height: "100%" }} />
      </div>
    </div>
  );
}

export default function AdminStatsPage() {
  const { status } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState(null);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/admin/login");
  }, [status, router]);

  useEffect(() => {
    fetch("/api/stats").then((r) => r.json()).then(setStats);
  }, []);

  if (status !== "authenticated" || !stats) {
    return <div className="container" style={{ paddingTop: 80 }}>Loading…</div>;
  }

  const maxTicketType = Math.max(1, ...stats.byTicketType.map((t) => t.capacity));
  const maxReferral = Math.max(1, ...stats.byReferral.map((r) => r.ticketsSold), stats.direct.ticketsSold);

  return (
    <AdminShell active="stats">
      <h1 style={{ fontSize: 24 }}>Statistics</h1>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 14, marginTop: 20, maxWidth: 640 }}>
        <div className="card">
          <p style={{ fontSize: 12, color: "rgba(242,234,216,0.5)" }}>Tickets sold</p>
          <p style={{ fontSize: 28, fontFamily: "var(--serif)", marginTop: 4 }}>{stats.totalTicketsSold}</p>
        </div>
        <div className="card">
          <p style={{ fontSize: 12, color: "rgba(242,234,216,0.5)" }}>Checked in</p>
          <p style={{ fontSize: 28, fontFamily: "var(--serif)", marginTop: 4 }}>{stats.totalCheckedIn}</p>
        </div>
      </div>

      <h2 style={{ fontSize: 20, marginTop: 40 }}>By ticket type</h2>
      <div style={{ maxWidth: 520, marginTop: 14 }}>
        {stats.byTicketType.map((tt) => (
          <Bar key={tt.name} label={`${tt.name} — ${tt.checkedIn} checked in`} value={tt.sold} max={maxTicketType} />
        ))}
      </div>

      <h2 style={{ fontSize: 20, marginTop: 40 }}>Entries by referral</h2>
      <p style={{ fontSize: 13, color: "rgba(242,234,216,0.5)", marginTop: 4 }}>
        How many tickets, and how many actual entries, came from each referral code.
      </p>
      <table style={{ marginTop: 16, maxWidth: 640 }}>
        <thead>
          <tr><th>Code</th><th>Owner</th><th>Tickets sold</th><th>Checked in</th><th>Revenue</th></tr>
        </thead>
        <tbody>
          <tr>
            <td>Direct (no code)</td>
            <td>—</td>
            <td>{stats.direct.ticketsSold}</td>
            <td>{stats.direct.checkedIn}</td>
            <td>—</td>
          </tr>
          {stats.byReferral.map((r) => (
            <tr key={r.code}>
              <td style={{ fontWeight: 600 }}>{r.code}</td>
              <td>{r.ownerName || "—"}</td>
              <td>{r.ticketsSold}</td>
              <td>{r.checkedIn}</td>
              <td>₹{(r.revenue / 100).toLocaleString("en-IN")}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </AdminShell>
  );
}
