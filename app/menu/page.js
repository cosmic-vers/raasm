"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FestiveHeader, FestiveFooter } from "../../components/PageChrome";

export default function MenuPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/menu")
      .then((r) => r.json())
      .then((d) => setItems(d.items || []))
      .finally(() => setLoading(false));
  }, []);

  const categories = [...new Set(items.map((i) => i.category || "Other"))];

  return (
    <main className="container" style={{ paddingTop: 32, paddingBottom: 0 }}>
      <FestiveHeader />
      <Link href="/" style={{ fontSize: 14, color: "rgba(242,234,216,0.6)" }}>← Back to event</Link>
      <h1 style={{ fontSize: 34, marginTop: 16 }}>Food & Drinks</h1>
      <p style={{ marginTop: 8, color: "rgba(242,234,216,0.7)" }}>What's available on-site.</p>

      {loading && <p style={{ marginTop: 24 }}>Loading…</p>}
      {!loading && items.length === 0 && <p style={{ marginTop: 24 }}>Menu not published yet — check back soon.</p>}

      {categories.map((cat) => (
        <section key={cat} style={{ marginTop: 36 }}>
          <h2 style={{ fontSize: 20, color: "var(--gold)" }}>{cat}</h2>
          <div style={{ display: "grid", gap: 12, marginTop: 14 }}>
            {items.filter((i) => (i.category || "Other") === cat).map((item) => (
              <div key={item.id} className="card" style={{ display: "flex", gap: 14, alignItems: "center", opacity: item.available ? 1 : 0.5 }}>
                {item.image && (
                  <img src={item.image} alt={item.name} style={{ width: 64, height: 64, objectFit: "cover", borderRadius: "var(--radius)" }} />
                )}
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                    <h3 style={{ fontSize: 17 }}>{item.name}{!item.available && " (unavailable)"}</h3>
                    {item.price != null && (
                      <span style={{ fontFamily: "var(--serif)", fontWeight: 600 }}>₹{(item.price / 100).toLocaleString("en-IN")}</span>
                    )}
                  </div>
                  {item.description && (
                    <p style={{ fontSize: 14, marginTop: 4, color: "rgba(242,234,216,0.65)" }}>{item.description}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      ))}
      <FestiveFooter />
    </main>
  );
}
