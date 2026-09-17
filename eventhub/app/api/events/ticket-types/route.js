import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { revalidateTag } from "next/cache";
import { authOptions } from "../../../../lib/authOptions";
import { prisma } from "../../../../lib/prisma";

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  return session;
}

export async function POST(req) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const { eventId, name, description, price, quantity } = await req.json();
  if (!eventId || !name || price == null || quantity == null) {
    return NextResponse.json({ error: "Missing fields." }, { status: 400 });
  }

  const ticketType = await prisma.ticketType.create({
    data: { eventId, name, description, price, quantity },
  });
  revalidateTag("event");
  return NextResponse.json({ ticketType });
}

export async function PUT(req) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const { id, name, description, price, quantity } = await req.json();
  if (!id) return NextResponse.json({ error: "Missing id." }, { status: 400 });

  const ticketType = await prisma.ticketType.update({
    where: { id },
    data: { name, description, price, quantity },
  });
  revalidateTag("event");
  return NextResponse.json({ ticketType });
}

export async function DELETE(req) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const { id } = await req.json();
  await prisma.ticketType.delete({ where: { id } });
  revalidateTag("event");
  return NextResponse.json({ ok: true });
}
