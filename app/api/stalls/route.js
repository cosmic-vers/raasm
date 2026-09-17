import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { unstable_cache, revalidateTag } from "next/cache";
import { authOptions } from "../../../lib/authOptions";
import { prisma } from "../../../lib/prisma";
import { uploadImage } from "../../../lib/upload";

const getCachedStalls = unstable_cache(
  async () => prisma.stall.findMany({ orderBy: [{ category: "asc" }, { name: "asc" }] }),
  ["public-stalls"],
  { tags: ["stalls"], revalidate: 60 }
);

export async function GET() {
  const stalls = await getCachedStalls();
  return NextResponse.json({ stalls });
}

export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const formData = await req.formData();
  const eventId = formData.get("eventId");
  const name = formData.get("name");
  const description = formData.get("description") || null;
  const category = formData.get("category") || null;
  const boothNumber = formData.get("boothNumber") || null;
  const file = formData.get("file");

  if (!eventId || !name) {
    return NextResponse.json({ error: "eventId and name are required." }, { status: 400 });
  }

  const image = file && file.size > 0 ? await uploadImage(file) : null;

  const stall = await prisma.stall.create({
    data: { eventId, name, description, category, boothNumber, image },
  });
  revalidateTag("stalls");
  return NextResponse.json({ stall });
}

export async function PUT(req) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const { id, name, description, category, boothNumber } = await req.json();
  if (!id) return NextResponse.json({ error: "Missing id." }, { status: 400 });

  const stall = await prisma.stall.update({
    where: { id },
    data: { name, description, category, boothNumber },
  });
  revalidateTag("stalls");
  return NextResponse.json({ stall });
}

export async function DELETE(req) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const { id } = await req.json();
  await prisma.stall.delete({ where: { id } });
  revalidateTag("stalls");
  return NextResponse.json({ ok: true });
}
