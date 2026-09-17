"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import AdminShell from "../AdminShell";

export default function AdminAttendeesPage() {
  const { status } = useSession();
  const router = useRouter();
  const [attendees, setAttendees] = useState([]);
  const [filter, setFilter] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") router.push("/admin/login");
  }, [status, router]);

  useEffect(() => {
    fetch("/api/attendees").then((r) => r.json()).then((d) => setAttendees(d.attendees || []));
  }, []);

  const filtered = attendees.filter((a) =>
    `${a.buyerName} ${a.buyerEmail} ${a.ticketType}`.toLowerCase().includes(filter.toLowerCase())
  );

  const checkedInCount = attendees.filter((a) => a.checkedIn).length;

  if (status !== "authenticated") {
    return <div className="container" style={{ paddingTop: 80 }}>Loading…</div>;
  }

  return (
    <AdminShell active="attendees">
      <h1 style={{ fontSize: 24 }}>Attendees</h1>
      <p style={{ fontSize: 14, color: "rgba(242,234,216,0.6)", marginTop: 6 }}>
        {attendees.length} ticket{attendees.length !== 1 ? "s" : ""} total · {checkedInCount} checked in
      </p>

      <input
        placeholder="Search by name, email, or ticket type"
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        style={{ marginTop: 16, maxWidth: 360, width: "100%" }}
      />

      <div style={{ overflowX: "auto", marginTop: 20 }}>
        <table>
          <thead>
            <tr>
              <th>Name</th><th>Email</th><th>Phone</th><th>Ticket</th><th>Status</th><th>Referral</th><th>Checked in</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((a) => (
              <tr key={a.id}>
                <td>{a.buyerName}</td>
                <td>{a.buyerEmail}</td>
                <td>{a.buyerPhone}</td>
                <td>{a.ticketType}</td>
                <td>{a.orderStatus}</td>
                <td>{a.referralCode || "—"}</td>
                <td>{a.checkedIn ? `✓ ${new Date(a.checkedInAt).toLocaleTimeString()}` : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminShell>
  );
}
