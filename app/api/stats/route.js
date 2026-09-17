import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../lib/authOptions";
import { prisma } from "../../../lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const [ticketTypes, tickets, referrals] = await Promise.all([
    prisma.ticketType.findMany(),
    prisma.ticket.findMany({ include: { ticketType: true, order: { include: { referral: true } } } }),
    prisma.referral.findMany(),
  ]);

  const paidTickets = tickets.filter((t) => t.order.status === "paid");
  const totalTicketsSold = paidTickets.length;
  const totalCheckedIn = paidTickets.filter((t) => t.checkedIn).length;

  const byTicketType = ticketTypes.map((tt) => {
    const sold = paidTickets.filter((t) => t.ticketTypeId === tt.id);
    return {
      name: tt.name,
      sold: sold.length,
      checkedIn: sold.filter((t) => t.checkedIn).length,
      capacity: tt.quantity,
    };
  });

  const byReferral = referrals.map((r) => {
    const sold = paidTickets.filter((t) => t.order.referralId === r.id);
    return {
      code: r.code,
      ownerName: r.ownerName,
      ticketsSold: sold.length,
      checkedIn: sold.filter((t) => t.checkedIn).length,
      revenue: sold.reduce((sum, t) => sum + t.ticketType.price, 0),
    };
  });

  const directSold = paidTickets.filter((t) => !t.order.referralId);
  const direct = {
    ticketsSold: directSold.length,
    checkedIn: directSold.filter((t) => t.checkedIn).length,
  };

  return NextResponse.json({
    totalTicketsSold,
    totalCheckedIn,
    byTicketType,
    byReferral,
    direct,
  });
}
