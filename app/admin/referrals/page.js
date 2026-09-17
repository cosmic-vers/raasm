"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import AdminShell from "../AdminShell";

export default function AdminReferralsPage() {
  const { status } = useSession();
  const router = useRouter();
  const [referrals, setReferrals] = useState([]);
  const [form, setForm] = useState({ code: "", ownerName: "", discountPct: "" });
  const [siteUrl, setSiteUrl] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") router.push("/admin/login");
  }, [status, router]);

  useEffect(() => {
    setSiteUrl(window.location.origin);
    load();
  }, []);

  function load() {
    fetch("/api/referrals").then((r) => r.json()).then((d) => setReferrals(d.referrals || []));
  }

  async function handleCreate(e) {
    e.preventDefault();
    const res = await fetch("/api/referrals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, discountPct: Number(form.discountPct) || 0 }),
    });
    if (res.ok) {
      setForm({ code: "", ownerName: "", discountPct: "" });
      load();
    }
  }

  async function handleDelete(id) {
    if (!confirm("Delete this referral code?")) return;
    await fetch("/api/referrals", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    load();
  }

  if (status !== "authenticated") {
    return <div className="container" style={{ paddingTop: 80 }}>Loading…</div>;
  }

  return (
    <AdminShell active="referrals">
      <h1 style={{ fontSize: 24 }}>Referral links</h1>
      <p style={{ fontSize: 14, color: "rgba(242,234,216,0.6)", marginTop: 6, maxWidth: 560 }}>
        Give each person a code. Anyone who books using that code (via link or by typing it in at checkout) gets the discount, and you can see how many tickets each code sold.
      </p>

      <form onSubmit={handleCreate} style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 20, maxWidth: 640 }}>
        <input placeholder="Code (e.g. FRIEND10)" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} style={{ flex: 1, minWidth: 140 }} required />
        <input placeholder="Owner name (optional)" value={form.ownerName} onChange={(e) => setForm({ ...form, ownerName: e.target.value })} style={{ flex: 1, minWidth: 140 }} />
        <input placeholder="Discount %" type="number" min="0" max="100" value={form.discountPct} onChange={(e) => setForm({ ...form, discountPct: e.target.value })} style={{ width: 110 }} />
        <button className="btn btn-primary">Create</button>
      </form>

      <table style={{ marginTop: 28, maxWidth: 720 }}>
        <thead>
          <tr><th>Code</th><th>Link</th><th>Owner</th><th>Discount</th><th>Paid orders</th><th>Revenue</th><th></th></tr>
        </thead>
        <tbody>
          {referrals.map((r) => (
            <tr key={r.id}>
              <td style={{ fontWeight: 600 }}>{r.code}</td>
              <td style={{ fontSize: 12 }}>{siteUrl}/?ref={r.code}</td>
              <td>{r.ownerName || "—"}</td>
              <td>{r.discountPct}%</td>
              <td>{r.paidOrders}</td>
              <td>₹{(r.revenue / 100).toLocaleString("en-IN")}</td>
              <td>
                <button className="btn btn-outline" style={{ fontSize: 12, padding: "6px 10px" }} onClick={() => handleDelete(r.id)}>
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
