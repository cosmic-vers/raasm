import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { verifyTicketCodeSignature, normalizeTicketCode } from "../../../../lib/tickets";
import { checkRateLimit } from "../../../../lib/rateLimit";

// Called from the door-staff scanner page. Marks a ticket as used on first
// scan; a second scan of the same code is reported as already checked in
// so staff can catch duplicate/shared tickets.
//
// Note: this endpoint doesn't require admin login by design, so door staff
// can use it without a shared password. That means anyone with the /verify
// link could technically check tickets in - keep that link within your
// staff group, don't post it publicly.
export async function POST(req) {
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

    const updated = await prisma.ticket.update({
      where: { code },
      data: { checkedIn: true, checkedInAt: new Date() },
    });

    return NextResponse.json({
      valid: true,
      ticketType: ticket.ticketType.name,
      buyerName: ticket.order.buyerName,
      checkedInAt: updated.checkedInAt,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Verification failed." }, { status: 500 });
  }
}
