"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import AdminShell from "../AdminShell";

export default function AdminStallsPage() {
  const { status } = useSession();
  const router = useRouter();
  const [event, setEvent] = useState(null);
  const [stalls, setStalls] = useState([]);
  const [form, setForm] = useState({ name: "", description: "", category: "", boothNumber: "", file: null });
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/admin/login");
  }, [status, router]);

  useEffect(() => {
    fetch("/api/events").then((r) => r.json()).then((d) => setEvent(d.event));
    loadStalls();
  }, []);

  function loadStalls() {
    fetch("/api/stalls").then((r) => r.json()).then((d) => setStalls(d.stalls || []));
  }

  async function handleAdd(e) {
    e.preventDefault();
    if (!event) return;
    setUploading(true);
    const formData = new FormData();
    formData.append("eventId", event.id);
    formData.append("name", form.name);
    formData.append("description", form.description);
    formData.append("category", form.category);
    formData.append("boothNumber", form.boothNumber);
    if (form.file) formData.append("file", form.file);

    const res = await fetch("/api/stalls", { method: "POST", body: formData });
    setUploading(false);
    if (res.ok) {
      setForm({ name: "", description: "", category: "", boothNumber: "", file: null });
      e.target.reset();
      loadStalls();
    }
  }

  async function handleDelete(id) {
    if (!confirm("Remove this stall?")) return;
    await fetch("/api/stalls", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    loadStalls();
  }

  if (status !== "authenticated") {
    return <div className="container" style={{ paddingTop: 80 }}>Loading…</div>;
  }

  return (
    <AdminShell active="stalls">
      <h1 style={{ fontSize: 24 }}>Stalls</h1>

      <form onSubmit={handleAdd} style={{ marginTop: 20, display: "grid", gap: 10, maxWidth: 480 }}>
        <input placeholder="Stall name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        <input placeholder="Description (optional)" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        <div style={{ display: "flex", gap: 10 }}>
          <input placeholder="Category (e.g. Food)" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} style={{ flex: 1 }} />
          <input placeholder="Booth #" value={form.boothNumber} onChange={(e) => setForm({ ...form, boothNumber: e.target.value })} style={{ width: 100 }} />
        </div>
        <input type="file" accept="image/*" onChange={(e) => setForm({ ...form, file: e.target.files[0] })} />
        <button className="btn btn-primary" disabled={uploading}>{uploading ? "Adding…" : "Add stall"}</button>
      </form>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 14, marginTop: 32 }}>
        {stalls.map((stall) => (
          <div key={stall.id} className="card">
            {stall.image && <img src={stall.image} alt={stall.name} style={{ width: "100%", height: 110, objectFit: "cover", borderRadius: "var(--radius)", marginBottom: 8 }} />}
            <h3 style={{ fontSize: 16 }}>{stall.name}</h3>
            <p style={{ fontSize: 12, color: "rgba(242,234,216,0.5)" }}>{stall.category || "—"} {stall.boothNumber ? `· Booth ${stall.boothNumber}` : ""}</p>
            <button className="btn btn-outline" style={{ marginTop: 10, fontSize: 12, padding: "6px 10px", width: "100%" }} onClick={() => handleDelete(stall.id)}>
              Remove
            </button>
          </div>
        ))}
      </div>
    </AdminShell>
  );
}
