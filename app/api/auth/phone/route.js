import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "../../../../lib/prisma";
import { verifyFirebaseIdToken } from "../../../../lib/firebaseAdmin";
import { createBuyerSessionToken, buyerCookieOptions, buyerCookieName } from "../../../../lib/buyerSession";
import { checkRateLimit } from "../../../../lib/rateLimit";

// Called right after the browser completes Firebase's phone OTP flow.
// We re-verify the ID token server-side (never trust a phone number the
// client just claims) and upsert a User row keyed on the Firebase UID.
export async function POST(req) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const rl = checkRateLimit(`phone-auth:${ip}`, 20, 60_000);
  if (!rl.allowed) {
    return NextResponse.json({ error: "Too many attempts. Please wait a moment." }, { status: 429 });
  }

  try {
    const { idToken, name } = await req.json();
    if (!idToken) return NextResponse.json({ error: "Missing ID token." }, { status: 400 });

    const decoded = await verifyFirebaseIdToken(idToken);
    const phone = decoded.phone_number;
    if (!phone) {
      return NextResponse.json({ error: "Token has no verified phone number." }, { status: 400 });
    }

    const user = await prisma.user.upsert({
      where: { firebaseUid: decoded.uid },
      update: name ? { name } : {},
      create: { firebaseUid: decoded.uid, phone, name: name || null },
    });

    const token = createBuyerSessionToken(user);
    cookies().set(buyerCookieName(), token, buyerCookieOptions());

    return NextResponse.json({ user: { id: user.id, phone: user.phone, name: user.name } });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Could not verify phone sign-in." }, { status: 401 });
  }
}

export async function DELETE() {
  cookies().delete(buyerCookieName());
  return NextResponse.json({ ok: true });
}

export async function GET() {
  const store = cookies();
  const token = store.get(buyerCookieName())?.value;
  if (!token) return NextResponse.json({ user: null });

  const { getBuyerSession } = await import("../../../../lib/buyerSession");
  const session = getBuyerSession(store);
  if (!session) return NextResponse.json({ user: null });

  const user = await prisma.user.findUnique({ where: { id: session.userId } });
  if (!user) return NextResponse.json({ user: null });

  return NextResponse.json({ user: { id: user.id, phone: user.phone, name: user.name } });
}
