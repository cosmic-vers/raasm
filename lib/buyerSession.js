import crypto from "crypto";

// A small, dependency-free signed session cookie for buyers (kept
// completely separate from the admin NextAuth session so the two can
// never collide or interfere with each other).
const COOKIE_NAME = "buyer_session";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 90; // 90 days - people re-open ticket links long after buying

function secret() {
  return process.env.BUYER_SESSION_SECRET || process.env.NEXTAUTH_SECRET || "dev-secret-change-me";
}

function sign(payload) {
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig = crypto.createHmac("sha256", secret()).update(body).digest("base64url");
  return `${body}.${sig}`;
}

function unsign(token) {
  if (!token) return null;
  try {
    const [body, sig] = token.split(".");
    if (!body || !sig) return null;
    const expected = crypto.createHmac("sha256", secret()).update(body).digest("base64url");
    const sigBuf = Buffer.from(sig);
    const expectedBuf = Buffer.from(expected);
    // timingSafeEqual throws if lengths differ (e.g. a tampered/truncated
    // cookie) rather than returning false - treat that the same as "invalid".
    if (sigBuf.length !== expectedBuf.length) return null;
    if (!crypto.timingSafeEqual(sigBuf, expectedBuf)) return null;
    return JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
  } catch {
    return null;
  }
}

export function buyerCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  };
}

export function buyerCookieName() {
  return COOKIE_NAME;
}

export function createBuyerSessionToken(user) {
  return sign({ userId: user.id, phone: user.phone, iat: Date.now() });
}

// Reads the session from a NextRequest-style cookies() accessor (App Router).
export function getBuyerSession(cookieStore) {
  const token = cookieStore.get(COOKIE_NAME)?.value;
  const data = unsign(token);
  if (!data) return null;
  return data;
}
