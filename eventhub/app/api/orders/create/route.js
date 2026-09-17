import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "../../../../lib/prisma";
import { getRazorpayClient } from "../../../../lib/razorpay";
import { releaseStaleReservations, tryReserve, releaseReservation } from "../../../../lib/reservations";
import { checkRateLimit } from "../../../../lib/rateLimit";
import { getBuyerSession } from "../../../../lib/buyerSession";

export async function POST(req) {
  // Cheap first line of defense against a script hammering this endpoint
  // (e.g. trying to grab every ticket, or abuse a referral code).
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const rl = checkRateLimit(`order:${ip}`, 8, 60_000); // 8 attempts per minute per IP
  if (!rl.allowed) {
    return NextResponse.json({ error: "Too many attempts. Please wait a moment and try again." }, { status: 429 });
  }

  let reservedTicketTypeId = null;
  let reservedQuantity = 0;

  try {
    const body = await req.json();
    const { ticketTypeId, quantity, buyerName, buyerEmail, buyerPhone, referralCode } = body;

    if (!ticketTypeId || !quantity || !buyerName || !buyerEmail || !buyerPhone) {
      return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
    }
    if (quantity < 1 || quantity > 10) {
      return NextResponse.json({ error: "Quantity must be between 1 and 10." }, { status: 400 });
    }

    // Free up any seats held by abandoned checkouts before checking availability.
    await releaseStaleReservations();

    const ticketType = await prisma.ticketType.findUnique({ where: { id: ticketTypeId } });
    if (!ticketType) {
      return NextResponse.json({ error: "Ticket type not found." }, { status: 404 });
    }

    // Atomic reserve: this is the fix for overselling. Only one request can
    // win the last seat even if hundreds arrive in the same instant.
    const reserved = await tryReserve(ticketTypeId, quantity);
    if (!reserved) {
      return NextResponse.json({ error: "Not enough tickets left." }, { status: 409 });
    }
    reservedTicketTypeId = ticketTypeId;
    reservedQuantity = quantity;

    let referral = null;
    if (referralCode) {
      referral = await prisma.referral.findUnique({ where: { code: referralCode.trim().toUpperCase() } });
    }

    const subtotal = ticketType.price * quantity;
    const discount = referral ? Math.round((subtotal * referral.discountPct) / 100) : 0;
    const amount = subtotal - discount;

    const buyerSession = getBuyerSession(cookies());

    const order = await prisma.order.create({
      data: {
        buyerName,
        buyerEmail,
        buyerPhone,
        amount,
        status: "pending",
        referralId: referral?.id,
        userId: buyerSession?.userId,
        items: {
          create: [{ ticketTypeId, quantity, unitPrice: ticketType.price }],
        },
      },
    });

    // Create the Razorpay order. If keys aren't set yet, this throws a clear
    // error the admin will see instead of the checkout silently failing.
    const razorpay = getRazorpayClient();
    const rzpOrder = await razorpay.orders.create({
      amount, // paise
      currency: "INR",
      receipt: order.id,
    });

    await prisma.order.update({
      where: { id: order.id },
      data: { razorpayOrderId: rzpOrder.id },
    });

    return NextResponse.json({
      orderId: order.id,
      razorpayOrderId: rzpOrder.id,
      amount,
      currency: "INR",
      keyId: process.env.RAZORPAY_KEY_ID,
    });
  } catch (err) {
    console.error(err);
    // Something failed after we already reserved seats - give them back
    // immediately rather than waiting for the stale-reservation cleanup.
    if (reservedTicketTypeId) {
      await releaseReservation(reservedTicketTypeId, reservedQuantity).catch(() => {});
    }
    return NextResponse.json({ error: err.message || "Could not create order." }, { status: 500 });
  }
}
