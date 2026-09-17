import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../lib/authOptions";
import { prisma } from "../../../lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const referrals = await prisma.referral.findMany({
    include: { orders: { where: { status: "paid" } } },
    orderBy: { createdAt: "desc" },
  });

  const withStats = referrals.map((r) => ({
    id: r.id,
    code: r.code,
    ownerName: r.ownerName,
    discountPct: r.discountPct,
    paidOrders: r.orders.length,
    revenue: r.orders.reduce((sum, o) => sum + o.amount, 0),
  }));

  return NextResponse.json({ referrals: withStats });
}

export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const { code, ownerName, discountPct } = await req.json();
  if (!code) return NextResponse.json({ error: "Code is required." }, { status: 400 });

  const referral = await prisma.referral.create({
    data: { code: code.trim().toUpperCase(), ownerName, discountPct: discountPct || 0 },
  });

  return NextResponse.json({ referral });
}

export async function DELETE(req) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const { id } = await req.json();
  await prisma.referral.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
