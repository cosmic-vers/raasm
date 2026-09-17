import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "../../../lib/prisma";
import { getBuyerSession } from "../../../lib/buyerSession";
import { ticketCodeToQrDataUrl } from "../../../lib/tickets";

export async function GET() {
  const session = getBuyerSession(cookies());
  if (!session) return NextResponse.json({ error: "Not logged in." }, { status: 401 });

  const orders = await prisma.order.findMany({
    where: { userId: session.userId, status: "paid" },
    orderBy: { createdAt: "desc" },
    include: {
      items: { include: { ticketType: true } },
      tickets: true,
    },
  });

  const orderData = await Promise.all(
    orders.map(async (order) => ({
      id: order.id,
      createdAt: order.createdAt,
      amount: order.amount,
      ticketTypeName: order.items[0]?.ticketType?.name || "Ticket",
      tickets: await Promise.all(
        order.tickets.map(async (t) => ({
          id: t.id,
          code: t.code,
          checkedIn: t.checkedInAt !== null,
          qr: await ticketCodeToQrDataUrl(t.code),
        }))
      ),
    }))
  );

  return NextResponse.json({ orders: orderData });
}
