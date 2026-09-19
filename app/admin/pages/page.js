"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import AdminShell from "../AdminShell";

const FIELDS = [
  { slug: "about", label: "About Us", href: "/about" },
  { slug: "help", label: "Help & FAQs", href: "/help" },
];

export default function AdminPagesPage() {
  const { status } = useSession();
  const router = useRouter();
  const [pages, setPages] = useState(null);
  const [savingSlug, setSavingSlug] = useState(null);
  const [messages, setMessages] = useState({});

  useEffect(() => {
    if (status === "unauthenticated") router.push("/admin/login");
  }, [status, router]);

  useEffect(() => {
    fetch("/api/pages").then((r) => r.json()).then((d) => setPages(d.pages));
  }, []);

  function updateField(slug, key, value) {
    setPages((p) => ({ ...p, [slug]: { ...p[slug], [key]: value } }));
  }

  async function saveOne(slug, e) {
    e.preventDefault();
    setSavingSlug(slug);
    setMessages((m) => ({ ...m, [slug]: "" }));
    const { title, body } = pages[slug];
    const res = await fetch("/api/pages", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug, title, body }),
    });
    setSavingSlug(null);
    setMessages((m) => ({ ...m, [slug]: res.ok ? "Saved." : "Could not save. Please try again." }));
  }

  if (status !== "authenticated" || !pages) {
    return <div className="container" style={{ paddingTop: 80 }}>Loading…</div>;
  }

  return (
    <AdminShell active="pages">
      <h1 style={{ fontSize: 24 }}>About & Help</h1>
      <p style={{ fontSize: 14, color: "rgba(242,234,216,0.6)", marginTop: 6, maxWidth: 560 }}>
        Edit the content shown on the public "About Us" and "Help" pages. Leave a blank line between paragraphs.
      </p>

      {FIELDS.map(({ slug, label, href }) => (
        <form key={slug} onSubmit={(e) => saveOne(slug, e)} style={{ maxWidth: 640, marginTop: 36 }}>
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
            <h2 style={{ fontSize: 18 }}>{label}</h2>
            <a href={href} target="_blank" rel="noreferrer" style={{ fontSize: 13, color: "rgba(242,234,216,0.55)" }}>
              View page →
            </a>
          </div>
          <div className="field" style={{ marginTop: 12 }}>
            <label>Page title</label>
            <input
              value={pages[slug].title}
              onChange={(e) => updateField(slug, "title", e.target.value)}
              required
            />
          </div>
          <div className="field">
            <label>Page content</label>
            <textarea
              rows={8}
              value={pages[slug].body}
              onChange={(e) => updateField(slug, "body", e.target.value)}
            />
          </div>
          {messages[slug] && (
            <p className={messages[slug] === "Saved." ? "success-text" : "error-text"}>{messages[slug]}</p>
          )}
          <button className="btn btn-primary" disabled={savingSlug === slug}>
            {savingSlug === slug ? "Saving…" : `Save ${label}`}
          </button>
        </form>
      ))}
    </AdminShell>
  );
}
