"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import NavAuth from "../components/NavAuth";
import Countdown from "../components/Countdown";
import { MarigoldGarland, Lantern, DandiyaSticks, Diya } from "../components/FestiveMotifs";

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

function formatDayLabel(dateStr) {
  return new Intl.DateTimeFormat("en-IN", { weekday: "long", day: "numeric", month: "long" }).format(new Date(dateStr));
}

// Groups the flat ticketTypes list into one bucket per calendar day, in
// date order, so the storefront can show "Day 1 / Day 2 / Day 3" tabs.
function groupByDay(ticketTypes) {
  const byDate = new Map();
  for (const tt of ticketTypes) {
    const key = new Date(tt.eventDate).toDateString();
    if (!byDate.has(key)) byDate.set(key, { date: tt.eventDate, tickets: [] });
    byDate.get(key).tickets.push(tt);
  }
  return [...byDate.values()]
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .map((group, i) => ({ ...group, dayNumber: i + 1 }));
}

function HomeContent() {
  const searchParams = useSearchParams();
  const refCode = searchParams.get("ref");
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState(0);

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
      <nav style={{ padding: "14px 0 0", borderBottom: "1px solid var(--line)" }}>
        <div className="container" style={{ display: "flex", gap: 20, fontSize: 14, alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", paddingBottom: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <img src="/logo.png" alt={event.title} width={44} height={44} style={{ borderRadius: "50%" }} />
            <div style={{ display: "flex", gap: 20 }}>
              <Link href="/menu" style={{ color: "rgba(242,234,216,0.75)" }}>Food & Drinks</Link>
              <Link href="/stalls" style={{ color: "rgba(242,234,216,0.75)" }}>Stalls</Link>
              <Link href="/location" style={{ color: "rgba(242,234,216,0.75)" }}>Getting there</Link>
              <Link href="/about" style={{ color: "rgba(242,234,216,0.75)" }}>About</Link>
              <Link href="/help" style={{ color: "rgba(242,234,216,0.75)" }}>Help</Link>
            </div>
          </div>
          <NavAuth />
        </div>
        <MarigoldGarland height={40} />
      </nav>

      {/* Hero */}
      <section style={{ padding: "56px 0 48px", borderBottom: "1px solid var(--line)", position: "relative", overflow: "hidden" }}>
        <div className="hero-rise hero-rise-1 hero-lanterns" style={{ position: "absolute", top: 0, left: "6%", display: "flex", gap: 28 }}>
          <Lantern size={34} color="var(--magenta)" />
          <Lantern size={26} color="var(--orange)" style={{ marginTop: 18 }} />
        </div>
        <div className="hero-rise hero-rise-1 hero-lanterns" style={{ position: "absolute", top: 0, right: "6%", display: "flex", gap: 28 }}>
          <Lantern size={26} color="var(--orange)" style={{ marginTop: 18 }} />
          <Lantern size={34} color="var(--magenta)" />
        </div>

        <img
          src="/dancer-boy.webp"
          alt=""
          aria-hidden="true"
          className="hero-rise hero-rise-3 hero-dancer hero-dancer-left hero-dancer-sway"
        />
        <img
          src="/dancer-girl.webp"
          alt=""
          aria-hidden="true"
          className="hero-rise hero-rise-3 hero-dancer hero-dancer-right hero-dancer-sway"
        />

        <div className="container" style={{ position: "relative", zIndex: 1 }}>
          <div className="hero-rise hero-rise-1 deity-frame">
            <img src="/deity.webp" alt="Deity blessing the festival" className="deity-image" />
          </div>
          {refCode && (
            <p className="hero-rise hero-rise-1" style={{ fontSize: 13, color: "var(--gold)", marginBottom: 8 }}>
              Referred by code {refCode.toUpperCase()} — it'll be applied at checkout.
            </p>
          )}
          <p className="hero-rise hero-rise-1" style={{ fontSize: 14, letterSpacing: "0.02em", color: "var(--gold)", marginBottom: 14 }}>
            {formatDateRange(event.startsAt, event.endsAt)}
          </p>
          <h1 className="hero-rise hero-rise-2 gradient-text" style={{ fontFamily: "var(--display)", fontWeight: 400, fontSize: "clamp(40px, 7vw, 72px)", maxWidth: 760, lineHeight: 1.08, margin: "0 auto", textAlign: "center" }}>{event.title}</h1>
          {event.tagline && (
            <p className="hero-rise hero-rise-3" style={{ fontSize: 19, marginTop: 18, maxWidth: 560, color: "rgba(242,234,216,0.8)", margin: "18px auto 0", textAlign: "center" }}>
              {event.tagline}
            </p>
          )}
          <p className="hero-rise hero-rise-3" style={{ marginTop: 10, fontSize: 15, color: "rgba(242,234,216,0.6)", textAlign: "center" }}>
            {event.venue}{event.address ? ` — ${event.address}` : ""}
          </p>

          <div className="hero-rise hero-rise-4" style={{ display: "flex", justifyContent: "center" }}>
            <Countdown target={event.countdownTarget || event.startsAt} label={event.countdownLabel || "Event starts in"} />
          </div>

          <div className="hero-rise hero-rise-4" style={{ marginTop: 30, textAlign: "center" }}>
            <a href="#tickets" className="btn btn-festive">Get tickets</a>
          </div>
        </div>
      </section>

      <MarigoldGarland height={36} />

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
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 22 }}>
            <DandiyaSticks size={34} />
            <h2 style={{ fontSize: 26 }}>Tickets</h2>
          </div>

          {(() => {
            const days = groupByDay(event.ticketTypes);
            if (days.length === 0) {
              return <p style={{ color: "rgba(242,234,216,0.6)" }}>Tickets aren't on sale yet — check back soon.</p>;
            }
            const active = days[Math.min(selectedDay, days.length - 1)];

            return (
              <>
                {days.length > 1 && (
                  <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
                    {days.map((d, i) => (
                      <button
                        key={d.date}
                        type="button"
                        onClick={() => setSelectedDay(i)}
                        className={i === Math.min(selectedDay, days.length - 1) ? "btn btn-primary" : "btn btn-outline"}
                        style={{ fontSize: 13, padding: "8px 16px" }}
                      >
                        Day {d.dayNumber}
                      </button>
                    ))}
                  </div>
                )}
                <p style={{ fontSize: 14, color: "var(--gold)", marginBottom: 16 }}>{formatDayLabel(active.date)}</p>

                <div style={{ display: "grid", gap: 16, maxWidth: 640 }}>
                  {active.tickets.map((tt) => {
                    const soldOut = tt.sold >= tt.quantity;
                    return (
                      <div className="ticket-stub" key={tt.id}>
                        <div className="stub-main">
                          <h3 style={{ fontSize: 20 }}>{tt.name}</h3>
                          <p style={{ fontSize: 13, marginTop: 4, color: "rgba(28,26,21,0.6)" }}>
                            Admits {tt.groupSize} {tt.groupSize === 1 ? "person" : "people"}
                          </p>
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
              </>
            );
          })()}

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
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 14, marginBottom: 14 }}>
          <Diya size={28} />
          <img src="/logo.png" alt={event.title} width={40} height={40} style={{ borderRadius: "50%" }} />
          <Diya size={28} style={{ transform: "scaleX(-1)" }} />
        </div>
        <p style={{ fontSize: 13, color: "rgba(242,234,216,0.6)" }}>
          <Link href="/menu">Food & Drinks</Link> · <Link href="/stalls">Stalls</Link> · <Link href="/location">Getting there</Link> · <Link href="/about">About</Link> · <Link href="/help">Help</Link>
        </p>
        <p style={{ fontSize: 12, marginTop: 10, color: "rgba(242,234,216,0.4)" }}>
          <Link href="/admin/login">Admin</Link>
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
