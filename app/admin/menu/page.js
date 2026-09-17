"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import AdminShell from "../AdminShell";

export default function AdminMenuPage() {
  const { status } = useSession();
  const router = useRouter();
  const [event, setEvent] = useState(null);
  const [items, setItems] = useState([]);
  const [form, setForm] = useState({ name: "", description: "", category: "", price: "", file: null });
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/admin/login");
  }, [status, router]);

  useEffect(() => {
    fetch("/api/events").then((r) => r.json()).then((d) => setEvent(d.event));
    loadItems();
  }, []);

  function loadItems() {
    fetch("/api/menu").then((r) => r.json()).then((d) => setItems(d.items || []));
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
    if (form.price) formData.append("price", form.price);
    if (form.file) formData.append("file", form.file);

    const res = await fetch("/api/menu", { method: "POST", body: formData });
    setUploading(false);
    if (res.ok) {
      setForm({ name: "", description: "", category: "", price: "", file: null });
      e.target.reset();
      loadItems();
    }
  }

  async function toggleAvailable(item) {
    await fetch("/api/menu", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...item, available: !item.available }),
    });
    loadItems();
  }

  async function handleDelete(id) {
    if (!confirm("Remove this menu item?")) return;
    await fetch("/api/menu", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    loadItems();
  }

  if (status !== "authenticated") {
    return <div className="container" style={{ paddingTop: 80 }}>Loading…</div>;
  }

  return (
    <AdminShell active="menu">
      <h1 style={{ fontSize: 24 }}>Food & drinks menu</h1>

      <form onSubmit={handleAdd} style={{ marginTop: 20, display: "grid", gap: 10, maxWidth: 480 }}>
        <input placeholder="Item name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        <input placeholder="Description (optional)" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        <div style={{ display: "flex", gap: 10 }}>
          <input placeholder="Category (e.g. Mains)" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} style={{ flex: 1 }} />
          <input placeholder="Price ₹ (optional)" type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} style={{ width: 130 }} />
        </div>
        <input type="file" accept="image/*" onChange={(e) => setForm({ ...form, file: e.target.files[0] })} />
        <button className="btn btn-primary" disabled={uploading}>{uploading ? "Adding…" : "Add item"}</button>
      </form>

      <table style={{ marginTop: 32, maxWidth: 720 }}>
        <thead>
          <tr><th>Name</th><th>Category</th><th>Price</th><th>Available</th><th></th></tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id}>
              <td>{item.name}</td>
              <td>{item.category || "—"}</td>
              <td>{item.price != null ? `₹${(item.price / 100).toLocaleString("en-IN")}` : "—"}</td>
              <td>
                <button className="btn btn-outline" style={{ fontSize: 12, padding: "6px 10px" }} onClick={() => toggleAvailable(item)}>
                  {item.available ? "Available" : "Unavailable"}
                </button>
              </td>
              <td>
                <button className="btn btn-outline" style={{ fontSize: 12, padding: "6px 10px" }} onClick={() => handleDelete(item.id)}>
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </AdminShell>
  );
}
