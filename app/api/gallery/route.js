import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { revalidateTag } from "next/cache";
import { authOptions } from "../../../lib/authOptions";
import { prisma } from "../../../lib/prisma";
import { uploadImage } from "../../../lib/upload";

export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get("file");
  const eventId = formData.get("eventId");
  const caption = formData.get("caption") || "";

  if (!file || !eventId) {
    return NextResponse.json({ error: "File and eventId are required." }, { status: 400 });
  }

  const url = await uploadImage(file);
  const image = await prisma.galleryImage.create({ data: { eventId, url, caption } });

  revalidateTag("event");
  return NextResponse.json({ image });
}

export async function DELETE(req) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const { id } = await req.json();
  await prisma.galleryImage.delete({ where: { id } });
  revalidateTag("event");
  return NextResponse.json({ ok: true });
}
