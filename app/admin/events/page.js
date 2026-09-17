"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import AdminShell from "../AdminShell";

export default function AdminEventsPage() {
  const { status } = useSession();
  const router = useRouter();
  const [event, setEvent] = useState(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [newTicket, setNewTicket] = useState({ name: "", price: "", quantity: "" });

  useEffect(() => {
    if (status === "unauthenticated") router.push("/admin/login");
  }, [status, router]);

  useEffect(() => {
    fetch("/api/events").then((r) => r.json()).then((d) => setEvent(d.event));
  }, []);

  function toLocalInput(dateStr) {
    const d = new Date(dateStr);
    const pad = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }

  async function saveEvent(e) {
    e.preventDefault();
    setSaving(true);
    setMessage("");
    const res = await fetch("/api/events", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(event),
    });
    setSaving(false);
    setMessage(res.ok ? "Saved." : "Could not save.");
  }

  async function addTicketType(e) {
    e.preventDefault();
    const res = await fetch("/api/events/ticket-types", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        eventId: event.id,
        name: newTicket.name,
        price: Math.round(Number(newTicket.price) * 100),
        quantity: Number(newTicket.quantity),
      }),
    });
    if (res.ok) {
      const data = await res.json();
      setEvent((ev) => ({ ...ev, ticketTypes: [...ev.ticketTypes, data.ticketType] }));
      setNewTicket({ name: "", price: "", quantity: "" });
    }
  }

  async function updateTicketType(tt) {
    await fetch("/api/events/ticket-types", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(tt),
    });
  }

  async function deleteTicketType(id) {
    if (!confirm("Delete this ticket type?")) return;
    await fetch("/api/events/ticket-types", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setEvent((ev) => ({ ...ev, ticketTypes: ev.ticketTypes.filter((t) => t.id !== id) }));
  }

  if (status !== "authenticated" || !event) {
    return <div className="container" style={{ paddingTop: 80 }}>Loading…</div>;
  }

  return (
    <AdminShell active="events">
      <h1 style={{ fontSize: 24 }}>Event details</h1>
      <form onSubmit={saveEvent} style={{ maxWidth: 560, marginTop: 20 }}>
        <div className="field">
          <label>Title</label>
          <input value={event.title} onChange={(e) => setEvent({ ...event, title: e.target.value })} />
        </div>
        <div className="field">
          <label>Tagline</label>
          <input value={event.tagline || ""} onChange={(e) => setEvent({ ...event, tagline: e.target.value })} />
        </div>
        <div className="field">
          <label>Description</label>
          <textarea rows={5} value={event.description} onChange={(e) => setEvent({ ...event, description: e.target.value })} />
        </div>
        <div className="field">
          <label>Venue</label>
          <input value={event.venue} onChange={(e) => setEvent({ ...event, venue: e.target.value })} />
        </div>
        <div className="field">
          <label>Address</label>
          <input value={event.address || ""} onChange={(e) => setEvent({ ...event, address: e.target.value })} />
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          <div className="field" style={{ flex: 1 }}>
            <label>Latitude (optional, for map)</label>
            <input value={event.latitude ?? ""} onChange={(e) => setEvent({ ...event, latitude: e.target.value })} placeholder="e.g. 12.9716" />
          </div>
          <div className="field" style={{ flex: 1 }}>
            <label>Longitude (optional, for map)</label>
            <input value={event.longitude ?? ""} onChange={(e) => setEvent({ ...event, longitude: e.target.value })} placeholder="e.g. 77.5946" />
          </div>
        </div>
        <div className="field">
          <label>Google Maps link (optional — used for the "Get Directions" button)</label>
          <input value={event.mapUrl || ""} onChange={(e) => setEvent({ ...event, mapUrl: e.target.value })} placeholder="Paste a Google Maps share link" />
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          <div className="field" style={{ flex: 1 }}>
            <label>Starts at</label>
            <input type="datetime-local" value={toLocalInput(event.startsAt)} onChange={(e) => setEvent({ ...event, startsAt: e.target.value })} />
          </div>
          <div className="field" style={{ flex: 1 }}>
            <label>Ends at</label>
            <input type="datetime-local" value={toLocalInput(event.endsAt)} onChange={(e) => setEvent({ ...event, endsAt: e.target.value })} />
          </div>
        </div>
        {message && <p className="success-text">{message}</p>}
        <button className="btn btn-primary" disabled={saving}>{saving ? "Saving…" : "Save event"}</button>
      </form>

      <h2 style={{ fontSize: 22, marginTop: 44 }}>Ticket types</h2>
      <table style={{ marginTop: 14, maxWidth: 640 }}>
        <thead>
          <tr><th>Name</th><th>Price</th><th>Qty</th><th>Sold</th><th></th></tr>
        </thead>
        <tbody>
          {event.ticketTypes.map((tt) => (
            <tr key={tt.id}>
              <td>{tt.name}</td>
              <td>₹{(tt.price / 100).toLocaleString("en-IN")}</td>
              <td>{tt.quantity}</td>
              <td>{tt.sold}</td>
              <td>
                <button className="btn btn-outline" style={{ fontSize: 12, padding: "6px 10px" }} onClick={() => deleteTicketType(tt.id)}>
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <form onSubmit={addTicketType} style={{ display: "flex", gap: 10, marginTop: 20, flexWrap: "wrap", maxWidth: 640 }}>
        <input placeholder="Name (e.g. VIP)" value={newTicket.name} onChange={(e) => setNewTicket({ ...newTicket, name: e.target.value })} style={{ flex: 1, minWidth: 140 }} required />
        <input placeholder="Price (₹)" type="number" value={newTicket.price} onChange={(e) => setNewTicket({ ...newTicket, price: e.target.value })} style={{ width: 110 }} required />
        <input placeholder="Quantity" type="number" value={newTicket.quantity} onChange={(e) => setNewTicket({ ...newTicket, quantity: e.target.value })} style={{ width: 100 }} required />
        <button className="btn btn-primary">Add</button>
      </form>
    </AdminShell>
  );
}
