import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "../../../lib/prisma";
import { verifyFirebaseIdToken } from "../../../lib/firebaseAdmin";
import { createBuyerSessionToken, buyerCookieOptions, buyerCookieName, getBuyerSession } from "../../../lib/buyerSession";
import { checkRateLimit } from "../../../lib/rateLimit";

// Called right after the browser completes Firebase sign-in - Google or
// the passwordless email link. We re-verify the ID token server-side
// (never trust anything the client just claims) and upsert a User row
// keyed on the Firebase UID, however they signed in.
export async function POST(req) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const rl = checkRateLimit(`buyer-auth:${ip}`, 20, 60_000);
  if (!rl.allowed) {
    return NextResponse.json({ error: "Too many attempts. Please wait a moment." }, { status: 429 });
  }

  try {
    const { idToken, name } = await req.json();
    if (!idToken) return NextResponse.json({ error: "Missing ID token." }, { status: 400 });

    const decoded = await verifyFirebaseIdToken(idToken);
    const email = decoded.email;
    if (!email) {
      return NextResponse.json({ error: "Token has no verified email." }, { status: 400 });
    }

    const resolvedName = decoded.name || name || null;

    const user = await prisma.user.upsert({
      where: { firebaseUid: decoded.uid },
      update: resolvedName ? { name: resolvedName } : {},
      create: { firebaseUid: decoded.uid, email, name: resolvedName },
    });

    const token = createBuyerSessionToken(user);
    cookies().set(buyerCookieName(), token, buyerCookieOptions());

    return NextResponse.json({ user: { id: user.id, email: user.email, name: user.name } });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Could not verify sign-in." }, { status: 401 });
  }
}

export async function DELETE() {
  cookies().delete(buyerCookieName());
  return NextResponse.json({ ok: true });
}

export async function GET() {
  const store = cookies();
  const session = getBuyerSession(store);
  if (!session) return NextResponse.json({ user: null });

  const user = await prisma.user.findUnique({ where: { id: session.userId } });
  if (!user) return NextResponse.json({ user: null });

  return NextResponse.json({ user: { id: user.id, email: user.email, name: user.name } });
}
