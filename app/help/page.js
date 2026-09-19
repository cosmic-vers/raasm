"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FestiveHeader, FestiveFooter } from "../../components/PageChrome";

export default function HelpPage() {
  const [page, setPage] = useState(null);

  useEffect(() => {
    fetch("/api/pages")
      .then((r) => r.json())
      .then((d) => setPage(d.pages?.help))
      .catch(() => setPage({ title: "Help & FAQs", body: "" }));
  }, []);

  if (!page) {
    return <div className="container" style={{ paddingTop: 80 }}>Loading…</div>;
  }

  return (
    <main className="container" style={{ paddingTop: 32, paddingBottom: 0 }}>
      <FestiveHeader />
      <Link href="/" style={{ fontSize: 14, color: "rgba(242,234,216,0.6)" }}>← Back to event</Link>
      <h1 style={{ fontSize: 34, marginTop: 16 }}>{page.title}</h1>
      <div style={{ marginTop: 20, maxWidth: 680 }}>
        {page.body.split(/\n\s*\n/).map((para, i) => (
          <p key={i} style={{ lineHeight: 1.7, color: "rgba(242,234,216,0.85)", whiteSpace: "pre-wrap", marginBottom: 16 }}>
            {para}
          </p>
        ))}
      </div>
      <FestiveFooter />
    </main>
  );
}
