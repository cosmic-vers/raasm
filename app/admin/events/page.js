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
  const [newTicket, setNewTicket] = useState({ name: "", eventDate: "", groupSize: 1, price: "", quantity: "" });

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

  function toDateInput(dateStr) {
    const d = new Date(dateStr);
    const pad = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  }

  // Each calendar day the event spans - e.g. a 3-night event gets 3 entries -
  // so ticket types can be tied to "Day 1", "Day 2", "Day 3" etc.
  function eventDays(ev) {
    const start = new Date(ev.startsAt);
    const end = new Date(ev.endsAt);
    const days = [];
    const cursor = new Date(start.getFullYear(), start.getMonth(), start.getDate());
    const last = new Date(end.getFullYear(), end.getMonth(), end.getDate());
    let n = 1;
    while (cursor <= last) {
      days.push({
        value: toDateInput(cursor),
        label: `Day ${n} — ${cursor.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })}`,
      });
      cursor.setDate(cursor.getDate() + 1);
      n++;
    }
    return days;
  }

  const GROUP_PRESETS = [
    { name: "Solo", groupSize: 1 },
    { name: "Couple", groupSize: 2 },
    { name: "Trio", groupSize: 3 },
    { name: "Squad", groupSize: 4 },
  ];

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
        eventDate: newTicket.eventDate,
        groupSize: Number(newTicket.groupSize) || 1,
        price: Math.round(Number(newTicket.price) * 100),
        quantity: Number(newTicket.quantity),
      }),
    });
    if (res.ok) {
      const data = await res.json();
      setEvent((ev) => ({ ...ev, ticketTypes: [...ev.ticketTypes, data.ticketType] }));
      setNewTicket({ name: "", eventDate: newTicket.eventDate, groupSize: 1, price: "", quantity: "" });
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

        <h3 style={{ fontSize: 16, marginTop: 8, color: "rgba(242,234,216,0.8)" }}>Homepage countdown</h3>
        <p style={{ fontSize: 13, color: "rgba(242,234,216,0.5)", marginTop: 2, marginBottom: 12 }}>
          Leave the date empty to automatically count down to "Starts at" above. Set it to count down to something else instead — an early-bird deadline, gates-open time, etc.
        </p>
        <div style={{ display: "flex", gap: 12 }}>
          <div className="field" style={{ flex: 1 }}>
            <label>Counts down to (optional)</label>
            <input
              type="datetime-local"
              value={event.countdownTarget ? toLocalInput(event.countdownTarget) : ""}
              onChange={(e) => setEvent({ ...event, countdownTarget: e.target.value || null })}
            />
          </div>
          <div className="field" style={{ flex: 1 }}>
            <label>Countdown label (optional)</label>
            <input
              value={event.countdownLabel || ""}
              onChange={(e) => setEvent({ ...event, countdownLabel: e.target.value })}
              placeholder='e.g. "Early-bird ends in"'
            />
          </div>
        </div>

        {message && <p className="success-text">{message}</p>}
        <button className="btn btn-primary" disabled={saving}>{saving ? "Saving…" : "Save event"}</button>
      </form>

      <h2 style={{ fontSize: 22, marginTop: 44 }}>Ticket types</h2>
      <p style={{ fontSize: 13, color: "rgba(242,234,216,0.5)", marginTop: 2 }}>
        Each ticket type is tied to one day of the event and admits a fixed group size — e.g. "Couple, Day 2" admits 2 people.
      </p>
      <table style={{ marginTop: 14, maxWidth: 720 }}>
        <thead>
          <tr><th>Day</th><th>Name</th><th>Admits</th><th>Price</th><th>Qty</th><th>Sold</th><th></th></tr>
        </thead>
        <tbody>
          {[...event.ticketTypes]
            .sort((a, b) => new Date(a.eventDate) - new Date(b.eventDate) || a.price - b.price)
            .map((tt) => (
              <tr key={tt.id}>
                <td>{new Date(tt.eventDate).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })}</td>
                <td>{tt.name}</td>
                <td>{tt.groupSize} {tt.groupSize === 1 ? "person" : "people"}</td>
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

      <form onSubmit={addTicketType} style={{ display: "flex", gap: 10, marginTop: 20, flexWrap: "wrap", maxWidth: 720, alignItems: "flex-end" }}>
        <div className="field" style={{ minWidth: 170 }}>
          <label>Day</label>
          <select value={newTicket.eventDate} onChange={(e) => setNewTicket({ ...newTicket, eventDate: e.target.value })} required>
            <option value="" disabled>Choose a day</option>
            {eventDays(event).map((d) => (
              <option key={d.value} value={d.value}>{d.label}</option>
            ))}
          </select>
        </div>
        <div className="field" style={{ minWidth: 140 }}>
          <label>Name</label>
          <input placeholder="e.g. Solo" value={newTicket.name} onChange={(e) => setNewTicket({ ...newTicket, name: e.target.value })} required />
        </div>
        <div className="field" style={{ width: 110 }}>
          <label>Admits</label>
          <input placeholder="1" type="number" min={1} value={newTicket.groupSize} onChange={(e) => setNewTicket({ ...newTicket, groupSize: e.target.value })} required />
        </div>
        <div className="field" style={{ width: 110 }}>
          <label>Price (₹)</label>
          <input placeholder="Price (₹)" type="number" value={newTicket.price} onChange={(e) => setNewTicket({ ...newTicket, price: e.target.value })} required />
        </div>
        <div className="field" style={{ width: 100 }}>
          <label>Quantity</label>
          <input placeholder="Quantity" type="number" value={newTicket.quantity} onChange={(e) => setNewTicket({ ...newTicket, quantity: e.target.value })} required />
        </div>
        <button className="btn btn-primary" style={{ height: 40 }}>Add</button>

        <div style={{ display: "flex", gap: 8, alignItems: "center", width: "100%", marginTop: 4 }}>
          <span style={{ fontSize: 12, color: "rgba(242,234,216,0.5)" }}>Quick fill:</span>
          {GROUP_PRESETS.map((p) => (
            <button
              key={p.name}
              type="button"
              className="btn btn-outline"
              style={{ fontSize: 12, padding: "5px 10px" }}
              onClick={() => setNewTicket((nt) => ({ ...nt, name: p.name, groupSize: p.groupSize }))}
            >
              {p.name} ({p.groupSize})
            </button>
          ))}
        </div>
      </form>
    </AdminShell>
  );
}
