import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { unstable_cache, revalidateTag } from "next/cache";
import { authOptions } from "../../../lib/authOptions";
import { prisma } from "../../../lib/prisma";

// This handler reads the live database. Without this directive Next attempts
// to prerender the public GET endpoint during `next build`, before Railway's
// runtime database connection is available.
export const dynamic = "force-dynamic";

// Single-event site: GET returns the one event with its ticket types and
// gallery. Public, no auth needed - this is what the homepage reads, and
// under real traffic every visitor hits it, so it's cached for a short
// window rather than round-tripping to the database on every page load.
// Ticket sold/reserved counts can be up to ~20s stale on the *displayed*
// number - the actual booking check in /api/orders/create is always live
// and atomic regardless, so this never risks overselling, just an
// occasionally-stale "X left" label.
const getCachedEvent = unstable_cache(
  async () => {
    return prisma.event.findFirst({
      include: { ticketTypes: true, galleryImages: { orderBy: { createdAt: "desc" } } },
      orderBy: { createdAt: "asc" },
    });
  },
  ["public-event"],
  { tags: ["event"], revalidate: 20 }
);

export async function GET() {
  const event = await getCachedEvent();
  return NextResponse.json({ event });
}

// Admin-only: update the event's details.
export async function PUT(req) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const body = await req.json();
  const { id, title, tagline, description, venue, address, latitude, longitude, mapUrl, startsAt, endsAt, coverImage, countdownTarget, countdownLabel } = body;

  if (!id) return NextResponse.json({ error: "Event id required." }, { status: 400 });

  const updated = await prisma.event.update({
    where: { id },
    data: {
      title,
      tagline,
      description,
      venue,
      address,
      latitude: latitude != null && latitude !== "" ? Number(latitude) : null,
      longitude: longitude != null && longitude !== "" ? Number(longitude) : null,
      mapUrl,
      startsAt: startsAt ? new Date(startsAt) : undefined,
      endsAt: endsAt ? new Date(endsAt) : undefined,
      coverImage,
      countdownTarget: countdownTarget ? new Date(countdownTarget) : null,
      countdownLabel: countdownLabel || null,
    },
  });

  revalidateTag("event"); // so the change shows up immediately, not after the cache window
  return NextResponse.json({ event: updated });
}
