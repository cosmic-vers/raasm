import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../lib/authOptions";
import { prisma } from "../../../../lib/prisma";
import { verifyTicketCodeSignature, normalizeTicketCode, venueDateKey } from "../../../../lib/tickets";
import { checkRateLimit } from "../../../../lib/rateLimit";

// Called from the door-staff scanner page. Marks a ticket as used on first
// scan; a second scan of the same code is reported as already checked in
// so staff can catch duplicate/shared tickets.
//
// Requires an authenticated admin session - without this, anyone who found
// the /verify URL could check tickets in (or mark them used) without ever
// logging in. Door staff should log in with the admin account (or a staff
// account, if you add separate ones) before scanning.
export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Log in as an admin to scan tickets." }, { status: 401 });
  }

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const rl = checkRateLimit(`verify:${ip}`, 120, 60_000); // generous - real scanning can be fast
  if (!rl.allowed) {
    return NextResponse.json({ error: "Too many requests. Please slow down." }, { status: 429 });
  }

  try {
    const { code: rawCode } = await req.json();
    if (!rawCode) return NextResponse.json({ error: "No code provided." }, { status: 400 });
    const code = normalizeTicketCode(rawCode);

    if (!verifyTicketCodeSignature(code)) {
      return NextResponse.json({ valid: false, reason: "Invalid or forged ticket code." }, { status: 400 });
    }

    const ticket = await prisma.ticket.findUnique({
      where: { code },
      include: { ticketType: true, order: true },
    });

    if (!ticket) {
      return NextResponse.json({ valid: false, reason: "Ticket not found." }, { status: 404 });
    }

    if (ticket.checkedIn) {
      return NextResponse.json({
        valid: false,
        reason: "Already checked in.",
        checkedInAt: ticket.checkedInAt,
        ticketType: ticket.ticketType.name,
        buyerName: ticket.order.buyerName,
      });
    }

    // Multi-day event: a ticket is only valid on the specific day it was
    // sold for. Reject (without consuming it) if scanned on any other day.
    const ticketDay = venueDateKey(ticket.ticketType.eventDate);
    const today = venueDateKey(new Date());
    if (ticketDay !== today) {
      const dayLabel = new Date(ticket.ticketType.eventDate).toLocaleDateString("en-IN", {
        timeZone: "Asia/Kolkata",
        weekday: "long",
        day: "numeric",
        month: "long",
      });
      return NextResponse.json({
        valid: false,
        reason: `Wrong day — this ticket is for ${dayLabel}.`,
        ticketType: ticket.ticketType.name,
        buyerName: ticket.order.buyerName,
        groupSize: ticket.ticketType.groupSize,
      });
    }

    // Conditional update (only where still not checked in) rather than a
    // plain update - this is what makes it safe if the same code is
    // scanned twice in the same instant on two different devices at the
    // door. Only one of them can win the flip; the loser sees 0 rows
    // affected and is told it's already checked in instead of both
    // succeeding.
    const now = new Date();
    const result = await prisma.ticket.updateMany({
      where: { code, checkedIn: false },
      data: { checkedIn: true, checkedInAt: now },
    });

    if (result.count === 0) {
      const latest = await prisma.ticket.findUnique({ where: { code } });
      return NextResponse.json({
        valid: false,
        reason: "Already checked in.",
        checkedInAt: latest?.checkedInAt,
        ticketType: ticket.ticketType.name,
        buyerName: ticket.order.buyerName,
        groupSize: ticket.ticketType.groupSize,
      });
    }

    return NextResponse.json({
      valid: true,
      ticketType: ticket.ticketType.name,
      buyerName: ticket.order.buyerName,
      groupSize: ticket.ticketType.groupSize,
      checkedInAt: now,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Verification failed." }, { status: 500 });
  }
}
