"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FestiveHeader, FestiveFooter } from "../../components/PageChrome";

export default function StallsPage() {
  const [stalls, setStalls] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/stalls")
      .then((r) => r.json())
      .then((d) => setStalls(d.stalls || []))
      .finally(() => setLoading(false));
  }, []);

  const categories = [...new Set(stalls.map((s) => s.category || "Other"))];

  return (
    <main className="container" style={{ paddingTop: 32, paddingBottom: 0 }}>
      <FestiveHeader />
      <Link href="/" style={{ fontSize: 14, color: "rgba(242,234,216,0.6)" }}>← Back to event</Link>
      <h1 style={{ fontSize: 34, marginTop: 16 }}>Stalls</h1>
      <p style={{ marginTop: 8, color: "rgba(242,234,216,0.7)" }}>Who'll be there on the day.</p>

      {loading && <p style={{ marginTop: 24 }}>Loading…</p>}
      {!loading && stalls.length === 0 && <p style={{ marginTop: 24 }}>Stall list not published yet — check back soon.</p>}

      {categories.map((cat) => (
        <section key={cat} style={{ marginTop: 36 }}>
          <h2 style={{ fontSize: 20, color: "var(--gold)" }}>{cat}</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 14, marginTop: 14 }}>
            {stalls.filter((s) => (s.category || "Other") === cat).map((stall) => (
              <div key={stall.id} className="card">
                {stall.image && (
                  <img src={stall.image} alt={stall.name} style={{ width: "100%", height: 130, objectFit: "cover", borderRadius: "var(--radius)", marginBottom: 10 }} />
                )}
                <h3 style={{ fontSize: 17 }}>{stall.name}</h3>
                {stall.boothNumber && (
                  <p style={{ fontSize: 12, color: "var(--gold)", marginTop: 2 }}>Booth {stall.boothNumber}</p>
                )}
                {stall.description && (
                  <p style={{ fontSize: 14, marginTop: 6, color: "rgba(242,234,216,0.65)" }}>{stall.description}</p>
                )}
              </div>
            ))}
          </div>
        </section>
      ))}
      <FestiveFooter />
    </main>
  );
}
