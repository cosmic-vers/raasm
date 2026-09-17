import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { unstable_cache, revalidateTag } from "next/cache";
import { authOptions } from "../../../lib/authOptions";
import { prisma } from "../../../lib/prisma";
import { uploadImage } from "../../../lib/upload";

const getCachedMenu = unstable_cache(
  async () => prisma.menuItem.findMany({ orderBy: [{ category: "asc" }, { name: "asc" }] }),
  ["public-menu"],
  { tags: ["menu"], revalidate: 60 } // menu changes rarely mid-event - longer TTL than the event/ticket data
);

export async function GET() {
  const items = await getCachedMenu();
  return NextResponse.json({ items });
}

// Accepts multipart/form-data so an image can be attached in the same request.
export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const formData = await req.formData();
  const eventId = formData.get("eventId");
  const name = formData.get("name");
  const description = formData.get("description") || null;
  const category = formData.get("category") || null;
  const priceRaw = formData.get("price");
  const price = priceRaw ? Math.round(Number(priceRaw) * 100) : null;
  const file = formData.get("file");

  if (!eventId || !name) {
    return NextResponse.json({ error: "eventId and name are required." }, { status: 400 });
  }

  const image = file && file.size > 0 ? await uploadImage(file) : null;

  const item = await prisma.menuItem.create({
    data: { eventId, name, description, category, price, image },
  });
  revalidateTag("menu");
  return NextResponse.json({ item });
}

export async function PUT(req) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const { id, name, description, category, price, available } = await req.json();
  if (!id) return NextResponse.json({ error: "Missing id." }, { status: 400 });

  const item = await prisma.menuItem.update({
    where: { id },
    data: {
      name,
      description,
      category,
      price: price != null ? Math.round(Number(price) * 100) : null,
      available,
    },
  });
  revalidateTag("menu");
  return NextResponse.json({ item });
}

export async function DELETE(req) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const { id } = await req.json();
  await prisma.menuItem.delete({ where: { id } });
  revalidateTag("menu");
  return NextResponse.json({ ok: true });
}
