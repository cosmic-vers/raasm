import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../lib/authOptions";
import { prisma } from "../../../lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const tickets = await prisma.ticket.findMany({
    include: {
      ticketType: true,
      order: { include: { referral: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const rows = tickets.map((t) => ({
    id: t.id,
    code: t.code,
    ticketType: t.ticketType.name,
    eventDate: t.ticketType.eventDate,
    groupSize: t.ticketType.groupSize,
    buyerName: t.order.buyerName,
    buyerEmail: t.order.buyerEmail,
    buyerPhone: t.order.buyerPhone,
    orderStatus: t.order.status,
    referralCode: t.order.referral?.code || null,
    checkedIn: t.checkedIn,
    checkedInAt: t.checkedInAt,
  }));

  return NextResponse.json({ attendees: rows });
}
