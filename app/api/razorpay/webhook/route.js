import { NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "../../../../lib/prisma";
import { confirmOrderPaid } from "../../../../lib/orderConfirmation";

// This is now the RELIABLE source of truth for payment confirmation - set
// it up in the Razorpay dashboard under Settings > Webhooks, pointing at
// https://yourdomain.com/api/razorpay/webhook, subscribed to the
// "payment.captured" event. Set RAZORPAY_WEBHOOK_SECRET in .env to match
// what you set in the dashboard.
//
// Why this matters: the browser-side confirmation (../verify/route.js)
// only runs if the buyer's browser is still open and online right after
// paying. If they close the tab, lose signal, or their phone dies, that
// call never happens - but Razorpay still calls this webhook regardless,
// so tickets still get generated.
export async function POST(req) {
  const rawBody = await req.text();
  const signature = req.headers.get("x-razorpay-signature");
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;

  if (!secret) {
    console.error("RAZORPAY_WEBHOOK_SECRET is not set - webhook cannot verify requests.");
    return NextResponse.json({ error: "Webhook secret not configured." }, { status: 500 });
  }

  const expected = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
  if (expected !== signature) {
    return NextResponse.json({ error: "Invalid webhook signature." }, { status: 400 });
  }

  const event = JSON.parse(rawBody);

  if (event.event === "payment.captured") {
    const payment = event.payload.payment.entity;
    const order = await prisma.order.findUnique({ where: { razorpayOrderId: payment.order_id } });
    if (order) {
      await confirmOrderPaid(order.id, payment.id);
    }
  }

  return NextResponse.json({ received: true });
}
