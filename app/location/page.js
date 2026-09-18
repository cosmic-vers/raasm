"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FestiveHeader, FestiveFooter } from "../../components/PageChrome";

export default function LocationPage() {
  const [event, setEvent] = useState(null);

  useEffect(() => {
    fetch("/api/events").then((r) => r.json()).then((d) => setEvent(d.event));
  }, []);

  if (!event) {
    return <div className="container" style={{ paddingTop: 80 }}>Loading…</div>;
  }

  const hasCoords = event.latitude != null && event.longitude != null;
  const embedSrc = hasCoords
    ? `https://www.google.com/maps?q=${event.latitude},${event.longitude}&z=16&output=embed`
    : event.address
    ? `https://www.google.com/maps?q=${encodeURIComponent(event.address)}&output=embed`
    : null;
  const directionsUrl =
    event.mapUrl ||
    (hasCoords
      ? `https://www.google.com/maps/dir/?api=1&destination=${event.latitude},${event.longitude}`
      : event.address
      ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(event.address)}`
      : null);

  return (
    <main className="container" style={{ paddingTop: 32, paddingBottom: 0 }}>
      <FestiveHeader />
      <Link href="/" style={{ fontSize: 14, color: "rgba(242,234,216,0.6)" }}>← Back to event</Link>
      <h1 style={{ fontSize: 34, marginTop: 16 }}>Getting there</h1>
      <p style={{ marginTop: 8, color: "rgba(242,234,216,0.8)" }}>{event.venue}</p>
      {event.address && <p style={{ fontSize: 14, color: "rgba(242,234,216,0.6)" }}>{event.address}</p>}

      {embedSrc ? (
        <div style={{ marginTop: 24, borderRadius: "var(--radius)", overflow: "hidden", border: "1px solid var(--line)" }}>
          <iframe
            src={embedSrc}
            width="100%"
            height="380"
            style={{ border: 0, display: "block" }}
            loading="lazy"
            title="Venue location"
          />
        </div>
      ) : (
        <p style={{ marginTop: 24, color: "rgba(242,234,216,0.5)" }}>
          Map not set up yet — add the venue address or coordinates from the admin dashboard.
        </p>
      )}

      {directionsUrl && (
        <a href={directionsUrl} target="_blank" rel="noreferrer" className="btn btn-primary" style={{ marginTop: 20 }}>
          Get directions
        </a>
      )}
      <FestiveFooter />
    </main>
  );
}
