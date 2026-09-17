"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";
import AdminShell from "../AdminShell";

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") router.push("/admin/login");
  }, [status, router]);

  if (status !== "authenticated") {
    return <div className="container" style={{ paddingTop: 80 }}>Loading…</div>;
  }

  return (
    <AdminShell active="dashboard">
      <h1 style={{ fontSize: 26 }}>Welcome, {session.user.name || session.user.email}</h1>
      <p style={{ marginTop: 8, color: "rgba(242,234,216,0.6)" }}>Manage your event from here.</p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginTop: 32 }}>
        <DashCard href="/admin/events" title="Event & tickets" desc="Edit details, prices, quantities, and location." />
        <DashCard href="/admin/menu" title="Food menu" desc="Manage what's on offer at the event." />
        <DashCard href="/admin/stalls" title="Stalls" desc="List vendors and stalls at the event." />
        <DashCard href="/admin/gallery" title="Gallery" desc="Upload and manage event photos." />
        <DashCard href="/admin/referrals" title="Referral links" desc="Create discount codes to share." />
        <DashCard href="/admin/attendees" title="Attendees" desc="See everyone who's booked, and who's checked in." />
        <DashCard href="/admin/stats" title="Statistics" desc="Tickets sold, check-ins, and referral performance." />
        <DashCard href="/verify" title="Check-in scanner" desc="Open the door-staff QR scanner." />
      </div>
    </AdminShell>
  );
}

function DashCard({ href, title, desc }) {
  return (
    <Link href={href} className="card" style={{ display: "block", textDecoration: "none" }}>
      <h3 style={{ fontSize: 18 }}>{title}</h3>
      <p style={{ fontSize: 14, marginTop: 6, color: "rgba(242,234,216,0.6)" }}>{desc}</p>
    </Link>
  );
}
