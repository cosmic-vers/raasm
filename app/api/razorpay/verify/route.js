import { NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "../../../../lib/prisma";
import { confirmOrderPaid } from "../../../../lib/orderConfirmation";

// This is the fast-path confirmation, fired by the browser right after
// Razorpay's checkout succeeds. The webhook (see ../webhook/route.js) is
// the reliable backstop for cases where the browser never gets to call
// this - closed tab, lost signal, app killed, etc. Both paths call the
// same idempotent confirmOrderPaid(), so whichever fires first does the
// work and the other just returns the same result.
export async function POST(req) {
  try {
    const { orderId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = await req.json();

    if (!orderId || !razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json({ error: "Missing verification fields." }, { status: 400 });
    }

    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) return NextResponse.json({ error: "Order not found." }, { status: 404 });

    if (order.status !== "paid") {
      // Verify the payment really came from Razorpay for this exact order.
      const body = `${razorpay_order_id}|${razorpay_payment_id}`;
      const expectedSignature = crypto
        .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET || "")
        .update(body)
        .digest("hex");

      if (expectedSignature !== razorpay_signature) {
        return NextResponse.json({ error: "Payment signature mismatch." }, { status: 400 });
      }
    }

    const result = await confirmOrderPaid(orderId, razorpay_payment_id);
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 404 });

    return NextResponse.json({ ok: true, tickets: result.tickets });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: err.message || "Verification failed." }, { status: 500 });
  }
}
