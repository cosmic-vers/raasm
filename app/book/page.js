"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

// Loads the Razorpay checkout script on demand and caches the promise, so
// we never try to construct window.Razorpay before it actually exists -
// this is what "window.Razorpay is not a constructor" means: the script
// hadn't finished loading yet.
let razorpayScriptPromise = null;
function loadRazorpayScript() {
  if (typeof window !== "undefined" && window.Razorpay) return Promise.resolve();
  if (razorpayScriptPromise) return razorpayScriptPromise;

  razorpayScriptPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Could not load the payment script. Check your internet connection and try again."));
    document.body.appendChild(script);
  });

  return razorpayScriptPromise;
}

function BookingForm() {
  const params = useSearchParams();
  const ticketTypeId = params.get("ticketTypeId");
  const refCode = params.get("ref") || "";

  const [event, setEvent] = useState(null);
  const [ticketType, setTicketType] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [form, setForm] = useState({ buyerName: "", buyerEmail: "", buyerPhone: "", referralCode: refCode });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [tickets, setTickets] = useState(null);
  const [auth, setAuth] = useState({ loading: true, user: null });

  useEffect(() => {
    fetch("/api/events")
      .then((r) => r.json())
      .then((data) => {
        setEvent(data.event);
        const tt = data.event?.ticketTypes.find((t) => t.id === ticketTypeId);
        setTicketType(tt || null);
      });
  }, [ticketTypeId]);

  useEffect(() => {
    fetch("/api/buyer-session")
      .then((r) => r.json())
      .then((d) => {
        setAuth({ loading: false, user: d.user || null });
        if (d.user) {
          setForm((f) => ({
            ...f,
            buyerEmail: f.buyerEmail || d.user.email || "",
            buyerName: f.buyerName || d.user.name || "",
          }));
        }
      })
      .catch(() => setAuth({ loading: false, user: null }));
  }, []);

  function updateField(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await loadRazorpayScript();

      const res = await fetch("/api/orders/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticketTypeId, quantity, ...form }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong.");

      const options = {
        key: data.keyId,
        amount: data.amount,
        currency: data.currency,
        name: event.title,
        description: `${ticketType.name} × ${quantity} — ${new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short" }).format(new Date(ticketType.eventDate))}`,
        order_id: data.razorpayOrderId,
        prefill: { name: form.buyerName, email: form.buyerEmail, contact: form.buyerPhone },
        theme: { color: "#f0b23c" },
        handler: async function (response) {
          const verifyRes = await fetch("/api/razorpay/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ orderId: data.orderId, ...response }),
          });
          const verifyData = await verifyRes.json();
          if (verifyRes.ok) {
            setTickets(verifyData.tickets);
          } else {
            setError(verifyData.error || "Payment could not be verified.");
          }
        },
        modal: {
          ondismiss: () => setSubmitting(false),
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      setError(err.message);
      setSubmitting(false);
    }
  }

  if (!ticketTypeId) {
    return (
      <div className="container" style={{ paddingTop: 80 }}>
        <p>No ticket selected. <Link href="/">Go back and pick one</Link>.</p>
      </div>
    );
  }

  if (auth.loading) {
    return <div className="container" style={{ paddingTop: 80 }}>Loading…</div>;
  }

  if (!auth.user) {
    return (
      <div className="container" style={{ paddingTop: 64, maxWidth: 420, textAlign: "center" }}>
        <img src="/logo.png" alt="" width={52} height={52} style={{ borderRadius: "50%" }} />
        <h1 style={{ fontSize: 26, marginTop: 20 }}>Log in to book</h1>
        <p style={{ marginTop: 10, color: "rgba(242,234,216,0.7)" }}>
          So your ticket is tied to your account and shows up under "My tickets" later, you'll need to log in first — it only takes a moment.
        </p>
        <Link
          href={`/login?next=/book?ticketTypeId=${ticketTypeId}${refCode ? `%26ref=${refCode}` : ""}`}
          className="btn btn-primary"
          style={{ marginTop: 20 }}
        >
          Log in to continue
        </Link>
      </div>
    );
  }

  if (tickets) {
    return (
      <div className="container" style={{ paddingTop: 56, maxWidth: 480 }}>
        <div style={{ textAlign: "center", marginBottom: 16 }}>
          <img src="/logo.png" alt="" width={56} height={56} style={{ borderRadius: "50%" }} />
        </div>
        <h1 style={{ fontSize: 28, textAlign: "center" }}>You're in 🎟️</h1>
        <p style={{ marginTop: 10, color: "rgba(242,234,216,0.8)", textAlign: "center" }}>
          {tickets.length} ticket{tickets.length > 1 ? "s" : ""} booked
          {ticketType ? ` for ${new Intl.DateTimeFormat("en-IN", { weekday: "long", day: "numeric", month: "long" }).format(new Date(ticketType.eventDate))}` : ""}.
          A confirmation has been recorded — bring the QR code(s) below to the door. Each admits {ticketType?.groupSize || 1} {ticketType?.groupSize === 1 ? "person" : "people"}.
        </p>
        <div style={{ display: "grid", gap: 14, marginTop: 24 }}>
          {tickets.map((t) => (
            <TicketQr key={t.id} code={t.code} />
          ))}
        </div>
        <div style={{ display: "flex", gap: 12, marginTop: 24, flexWrap: "wrap", justifyContent: "center" }}>
          <Link href="/" className="btn btn-outline">Back to event</Link>
          <Link href="/my-tickets" className="btn btn-primary">View in My tickets</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container" style={{ paddingTop: 40, paddingBottom: 64, maxWidth: 480 }}>
      <div style={{ textAlign: "center", marginBottom: 20 }}>
        <img src="/logo.png" alt="" width={44} height={44} style={{ borderRadius: "50%" }} />
      </div>
      <Link href="/" style={{ fontSize: 14, color: "rgba(242,234,216,0.6)" }}>← Back</Link>
      <h1 style={{ fontSize: 28, marginTop: 14 }}>Book your ticket</h1>
      {ticketType && (
        <>
          <p style={{ marginTop: 8, color: "rgba(242,234,216,0.7)" }}>
            {ticketType.name} — ₹{(ticketType.price / 100).toLocaleString("en-IN")} each
          </p>
          <p style={{ marginTop: 4, fontSize: 13, color: "var(--gold)" }}>
            {new Intl.DateTimeFormat("en-IN", { weekday: "long", day: "numeric", month: "long" }).format(new Date(ticketType.eventDate))}
            {" · "}Admits {ticketType.groupSize} {ticketType.groupSize === 1 ? "person" : "people"} per ticket
          </p>
        </>
      )}

      <form onSubmit={handleSubmit} style={{ marginTop: 28 }}>
        <p style={{ fontSize: 13, color: "rgba(242,234,216,0.55)", marginBottom: 18 }}>
          Booking as {auth.user.email || auth.user.name}.
        </p>
        <div className="field">
          <label>Quantity</label>
          <input
            type="number"
            min={1}
            max={10}
            value={quantity}
            onChange={(e) => setQuantity(Number(e.target.value))}
            required
          />
          {ticketType && (
            <p style={{ fontSize: 12, marginTop: 4, color: "rgba(242,234,216,0.5)" }}>
              Total: {quantity * ticketType.groupSize} people · ₹{((ticketType.price * quantity) / 100).toLocaleString("en-IN")}
            </p>
          )}
        </div>
        <div className="field">
          <label>Full name</label>
          <input value={form.buyerName} onChange={(e) => updateField("buyerName", e.target.value)} required />
        </div>
        <div className="field">
          <label>Email</label>
          <input type="email" value={form.buyerEmail} onChange={(e) => updateField("buyerEmail", e.target.value)} required />
        </div>
        <div className="field">
          <label>Phone</label>
          <input value={form.buyerPhone} onChange={(e) => updateField("buyerPhone", e.target.value)} required />
        </div>
        <div className="field">
          <label>Referral / discount code (optional)</label>
          <input value={form.referralCode} onChange={(e) => updateField("referralCode", e.target.value)} placeholder="e.g. FRIEND10" />
        </div>

        {error && <p className="error-text">{error}</p>}

        <button type="submit" className="btn btn-primary" style={{ width: "100%", marginTop: 8 }} disabled={submitting}>
          {submitting ? "Processing…" : "Proceed to payment"}
        </button>
      </form>
    </div>
  );
}

function TicketQr({ code }) {
  const [qr, setQr] = useState(null);
  useEffect(() => {
    // QR is generated client-side purely for display convenience here;
    // the code itself (with its signature) is what actually gets verified.
    import("qrcode").then((QRCode) => {
      QRCode.toDataURL(code, { margin: 1, width: 220 }).then(setQr);
    });
  }, [code]);

  return (
    <div className="card" style={{ textAlign: "center" }}>
      {qr ? <img src={qr} alt="Ticket QR code" style={{ width: 180, height: 180 }} /> : <p>Generating QR…</p>}
      <p style={{ fontSize: 13, marginTop: 10, fontFamily: "monospace", letterSpacing: "0.04em", color: "rgba(242,234,216,0.6)" }}>{code}</p>
    </div>
  );
}

export default function BookPage() {
  return (
    <Suspense fallback={<div className="container" style={{ paddingTop: 80 }}>Loading…</div>}>
      <BookingForm />
    </Suspense>
  );
}
