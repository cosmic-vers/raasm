"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

function formatDate(d) {
  return new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric" }).format(new Date(d));
}

export default function MyTicketsPage() {
  const [state, setState] = useState({ loading: true, orders: null, needsLogin: false });

  useEffect(() => {
    fetch("/api/my-tickets")
      .then(async (r) => {
        if (r.status === 401) return setState({ loading: false, orders: null, needsLogin: true });
        const data = await r.json();
        setState({ loading: false, orders: data.orders, needsLogin: false });
      })
      .catch(() => setState({ loading: false, orders: [], needsLogin: false }));
  }, []);

  if (state.loading) {
    return <div className="container" style={{ paddingTop: 80 }}>Loading your tickets…</div>;
  }

  if (state.needsLogin) {
    return (
      <div className="container" style={{ paddingTop: 80, maxWidth: 480 }}>
        <h1 style={{ fontSize: 26 }}>Log in to see your tickets</h1>
        <p style={{ marginTop: 10, color: "rgba(242,234,216,0.7)" }}>
          Tickets you've bought while logged in show up here — with Google or email, from any device.
        </p>
        <Link href="/login?next=/my-tickets" className="btn btn-primary" style={{ marginTop: 20 }}>
          Log in
        </Link>
      </div>
    );
  }

  const orders = state.orders || [];

  return (
    <div className="container" style={{ paddingTop: 48, paddingBottom: 64, maxWidth: 640 }}>
      <h1 style={{ fontSize: 28 }}>Your tickets</h1>

      {orders.length === 0 && (
        <p style={{ marginTop: 16, color: "rgba(242,234,216,0.7)" }}>
          No tickets on this account yet. <Link href="/">Browse the event</Link> to book one.
        </p>
      )}

      <div style={{ display: "grid", gap: 24, marginTop: 24 }}>
        {orders.map((order) => (
          <div key={order.id}>
            <p style={{ fontSize: 13, color: "rgba(242,234,216,0.55)", marginBottom: 10 }}>
              {order.ticketTypeName}
              {order.eventDate && ` · Valid ${formatDate(order.eventDate)}`}
              {" · "}Admits {order.groupSize} {order.groupSize === 1 ? "person" : "people"}
              {" · "}Booked {formatDate(order.createdAt)}
            </p>
            <div style={{ display: "grid", gap: 14 }}>
              {order.tickets.map((t) => (
                <div key={t.id} className="ticket-stub">
                  <div className="stub-main" style={{ display: "flex", alignItems: "center", gap: 16 }}>
                    <img src={t.qr} alt="QR code" width={84} height={84} style={{ borderRadius: 6 }} />
                    <div>
                      <p style={{ fontFamily: "monospace", fontSize: 16, letterSpacing: "0.04em", fontWeight: 600 }}>
                        {t.code}
                      </p>
                      <p style={{ fontSize: 13, marginTop: 6, color: t.checkedIn ? "#3f7a3f" : "rgba(28,26,21,0.55)" }}>
                        {t.checkedIn ? "Already checked in" : "Not checked in yet"}
                      </p>
                    </div>
                  </div>
                  <div className="stub-end">
                    <span style={{ fontSize: 12, textAlign: "center" }}>Show this at the door</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
