"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import AdminShell from "../AdminShell";

export default function AdminGalleryPage() {
  const { status } = useSession();
  const router = useRouter();
  const [event, setEvent] = useState(null);
  const [file, setFile] = useState(null);
  const [caption, setCaption] = useState("");
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/admin/login");
  }, [status, router]);

  useEffect(() => {
    fetch("/api/events").then((r) => r.json()).then((d) => setEvent(d.event));
  }, []);

  async function handleUpload(e) {
    e.preventDefault();
    if (!file) return;
    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("eventId", event.id);
    formData.append("caption", caption);
    const res = await fetch("/api/gallery", { method: "POST", body: formData });
    setUploading(false);
    if (res.ok) {
      const data = await res.json();
      setEvent((ev) => ({ ...ev, galleryImages: [data.image, ...ev.galleryImages] }));
      setFile(null);
      setCaption("");
      e.target.reset();
    }
  }

  async function handleDelete(id) {
    if (!confirm("Remove this photo?")) return;
    await fetch("/api/gallery", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setEvent((ev) => ({ ...ev, galleryImages: ev.galleryImages.filter((g) => g.id !== id) }));
  }

  if (status !== "authenticated" || !event) {
    return <div className="container" style={{ paddingTop: 80 }}>Loading…</div>;
  }

  return (
    <AdminShell active="gallery">
      <h1 style={{ fontSize: 24 }}>Gallery</h1>

      <form onSubmit={handleUpload} style={{ marginTop: 20, display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
        <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files[0])} required />
        <input placeholder="Caption (optional)" value={caption} onChange={(e) => setCaption(e.target.value)} style={{ minWidth: 180 }} />
        <button className="btn btn-primary" disabled={uploading}>{uploading ? "Uploading…" : "Upload"}</button>
      </form>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 14, marginTop: 28 }}>
        {event.galleryImages.map((img) => (
          <div key={img.id} className="card" style={{ padding: 8 }}>
            <img src={img.url} alt={img.caption || ""} style={{ width: "100%", height: 140, objectFit: "cover", borderRadius: "var(--radius)" }} />
            {img.caption && <p style={{ fontSize: 12, marginTop: 6 }}>{img.caption}</p>}
            <button className="btn btn-outline" style={{ marginTop: 8, fontSize: 12, padding: "6px 10px", width: "100%" }} onClick={() => handleDelete(img.id)}>
              Remove
            </button>
          </div>
        ))}
      </div>
    </AdminShell>
  );
}
