"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import NavAuth from "../components/NavAuth";

function formatDateRange(startsAt, endsAt) {
  const start = new Date(startsAt);
  const end = new Date(endsAt);
  const dateFmt = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "long", year: "numeric" });
  const timeFmt = new Intl.DateTimeFormat("en-IN", { hour: "numeric", minute: "2-digit" });
  return `${dateFmt.format(start)} · ${timeFmt.format(start)} – ${timeFmt.format(end)}`;
}

function formatPrice(paise) {
  return `₹${(paise / 100).toLocaleString("en-IN")}`;
}

function HomeContent() {
  const searchParams = useSearchParams();
  const refCode = searchParams.get("ref");
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/events")
      .then((r) => r.json())
      .then((data) => setEvent(data.event))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="container" style={{ paddingTop: 80 }}>Loading…</div>;
  }

  if (!event) {
    return (
      <div className="container" style={{ paddingTop: 80 }}>
        <h1>No event set up yet</h1>
        <p>Run the seed script, or add one from the admin dashboard.</p>
      </div>
    );
  }

  return (
    <main>
      <nav style={{ padding: "16px 0", borderBottom: "1px solid var(--line)" }}>
        <div className="container" style={{ display: "flex", gap: 20, fontSize: 14, alignItems: "center", justifyContent: "space-between", flexWrap: "wrap" }}>
          <div style={{ display: "flex", gap: 20 }}>
            <Link href="/menu" style={{ color: "rgba(242,234,216,0.75)" }}>Food & Drinks</Link>
            <Link href="/stalls" style={{ color: "rgba(242,234,216,0.75)" }}>Stalls</Link>
            <Link href="/location" style={{ color: "rgba(242,234,216,0.75)" }}>Getting there</Link>
          </div>
          <NavAuth />
        </div>
      </nav>

      {/* Hero */}
      <section style={{ padding: "72px 0 48px", borderBottom: "1px solid var(--line)" }}>
        <div className="container">
          {refCode && (
            <p className="hero-rise hero-rise-1" style={{ fontSize: 13, color: "var(--gold)", marginBottom: 8 }}>
              Referred by code {refCode.toUpperCase()} — it'll be applied at checkout.
            </p>
          )}
          <p className="hero-rise hero-rise-1" style={{ fontSize: 14, letterSpacing: "0.02em", color: "var(--gold)", marginBottom: 14 }}>
            {formatDateRange(event.startsAt, event.endsAt)}
          </p>
          <h1 className="hero-rise hero-rise-2" style={{ fontSize: "clamp(38px, 6vw, 64px)", maxWidth: 700 }}>{event.title}</h1>
          {event.tagline && (
            <p className="hero-rise hero-rise-3" style={{ fontSize: 19, marginTop: 18, maxWidth: 560, color: "rgba(242,234,216,0.8)" }}>
              {event.tagline}
            </p>
          )}
          <p className="hero-rise hero-rise-3" style={{ marginTop: 10, fontSize: 15, color: "rgba(242,234,216,0.6)" }}>
            {event.venue}{event.address ? ` — ${event.address}` : ""}
          </p>
          <div className="hero-rise hero-rise-4" style={{ marginTop: 30 }}>
            <a href="#tickets" className="btn btn-primary">Get tickets</a>
          </div>
        </div>
      </section>

      {/* About */}
      <section style={{ padding: "48px 0" }}>
        <div className="container">
          <h2 style={{ fontSize: 26, marginBottom: 14 }}>About the event</h2>
          <p style={{ maxWidth: 680, lineHeight: 1.7, color: "rgba(242,234,216,0.85)", whiteSpace: "pre-wrap" }}>
            {event.description}
          </p>
        </div>
      </section>

      {/* Tickets */}
      <section id="tickets" style={{ padding: "48px 0", borderTop: "1px solid var(--line)" }}>
        <div className="container">
          <h2 style={{ fontSize: 26, marginBottom: 22 }}>Tickets</h2>
          <div style={{ display: "grid", gap: 16, maxWidth: 640 }}>
            {event.ticketTypes.map((tt) => {
              const soldOut = tt.sold >= tt.quantity;
              return (
                <div className="ticket-stub" key={tt.id}>
                  <div className="stub-main">
                    <h3 style={{ fontSize: 20 }}>{tt.name}</h3>
                    {tt.description && (
                      <p style={{ fontSize: 14, marginTop: 6, color: "rgba(28,26,21,0.7)" }}>{tt.description}</p>
                    )}
                    <p style={{ fontSize: 13, marginTop: 8, color: "rgba(28,26,21,0.55)" }}>
                      {soldOut ? "Sold out" : `${tt.quantity - tt.sold} left`}
                    </p>
                  </div>
                  <div className="stub-end">
                    <span style={{ fontFamily: "var(--serif)", fontSize: 20, fontWeight: 700 }}>
                      {formatPrice(tt.price)}
                    </span>
                    <Link
                      href={soldOut ? "#" : `/book?ticketTypeId=${tt.id}${refCode ? `&ref=${refCode}` : ""}`}
                      className="btn btn-primary"
                      style={{ marginTop: 12, fontSize: 13, padding: "8px 14px", pointerEvents: soldOut ? "none" : "auto", opacity: soldOut ? 0.5 : 1 }}
                    >
                      Book
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
          <p style={{ marginTop: 18, fontSize: 13, color: "rgba(242,234,216,0.5)" }}>
            Have a referral code from a friend? Enter it on the booking page for a discount.
          </p>
        </div>
      </section>

      {/* Gallery */}
      {event.galleryImages.length > 0 && (
        <section style={{ padding: "48px 0", borderTop: "1px solid var(--line)" }}>
          <div className="container">
            <h2 style={{ fontSize: 26, marginBottom: 22 }}>Gallery</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 12 }}>
              {event.galleryImages.map((img) => (
                <img
                  key={img.id}
                  src={img.url}
                  alt={img.caption || event.title}
                  style={{ width: "100%", height: 180, objectFit: "cover", borderRadius: "var(--radius)" }}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      <footer style={{ padding: "32px 0", borderTop: "1px solid var(--line)", textAlign: "center" }}>
        <p style={{ fontSize: 13, color: "rgba(242,234,216,0.6)" }}>
          <Link href="/menu">Food & Drinks</Link> · <Link href="/stalls">Stalls</Link> · <Link href="/location">Getting there</Link>
        </p>
        <p style={{ fontSize: 12, marginTop: 10, color: "rgba(242,234,216,0.4)" }}>
          <Link href="/admin/login">Admin</Link> · <Link href="/verify">Ticket check-in</Link>
        </p>
      </footer>
    </main>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={<div className="container" style={{ paddingTop: 80 }}>Loading…</div>}>
      <HomeContent />
    </Suspense>
  );
}
