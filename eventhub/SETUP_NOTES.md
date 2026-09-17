# What changed

## 1. Razorpay
No code changes needed — your webhook and signature verification were already correct. Just:
1. Get test keys from Razorpay Dashboard → Settings → API Keys, put them in `.env`.
2. Add the webhook URL (`https://yourdomain.com/api/razorpay/webhook`) under Settings → Webhooks, subscribed to `payment.captured`.
3. Put the webhook secret in `.env` too. Test with a dummy card before going live.

## 2. Phone login (Firebase Phone Auth)
New: buyers can log in with just their phone number (OTP by SMS), and see their tickets later.

- `prisma/schema.prisma` — added a `User` model (phone, Firebase UID), linked to `Order`.
- `lib/firebaseClient.js` / `lib/firebaseAdmin.js` — Firebase SDK wrappers.
- `lib/buyerSession.js` — a signed cookie for buyer login, kept fully separate from your admin login so the two never conflict.
- `app/login/page.js` — phone number → OTP → logged in.
- `app/api/auth/phone/route.js` — verifies the OTP session server-side and creates the account.
- `app/my-tickets/page.js` + `app/api/my-tickets/route.js` — a buyer's ticket dashboard, with live QR codes and check-in status.
- `app/book/page.js` — now links a purchase to the logged-in account (still works fine as a guest if they skip login).

**You need to do before this works:**
1. Create a Firebase project (free) at console.firebase.google.com.
2. Enable **Phone** sign-in under Authentication → Sign-in method.
3. Add a Web app to get your `NEXT_PUBLIC_FIREBASE_*` values.
4. Generate a service account key (Project Settings → Service Accounts) for the server-side `FIREBASE_*` values.
5. All of this is spelled out step-by-step in the updated `.env.example`.

**Important cost note:** Firebase's free plan has a small daily SMS quota for phone auth. For a 400–500 person event where many people log in on the same day, check Firebase's current phone-auth pricing/limits before the event — you may need to enable the Blaze (pay-as-you-go) plan, which is still usually just a few cents per SMS.

## 3. Short ticket codes
`lib/tickets.js` — codes are now short and staff-typeable, like `H4K9PX-7A2E` (was a ~49-character UUID+hash string). Still tamper-resistant: a built-in checksum lets the scanner instantly reject a mistyped or made-up code before it even hits the database.

## 4. Better scanner (`app/verify/page.js`)
- Full-screen colour flash (green/red) so staff can tell valid/invalid at a glance without reading text.
- A beep + vibration on every scan.
- Running tally of check-ins/rejections for the shift.
- Torch (flashlight) toggle for scanning in a dark venue entrance, when the device supports it.
- Manual entry now expects the new short code format.

## 5. UI/UX polish
Your existing dark ink/gold ticket-branded design was already distinctive, so I kept it and made it feel smoother rather than replacing it:
- Smoother button/card/input transitions and focus states.
- A single orchestrated fade-up entrance for the homepage hero (not scattered animations everywhere).
- Ticket cards lift slightly on hover.
- Mobile layout fix for the ticket-stub cards (they were awkward on narrow screens).
- Login/My tickets links wired into the nav.

**Not yet touched:** `app/menu`, `app/stalls`, `app/location`, and the admin dashboard pages still use the older inline styling — they'll inherit the smoother buttons/cards/inputs automatically since those are shared CSS classes, but haven't had a dedicated redesign pass.

# Recommended order to actually ship this
1. Run `npm install` (pulls in the new `firebase` and `firebase-admin` packages).
2. `npx prisma db push` against your Neon database to add the `User` table.
3. Fill in `.env` — Razorpay test keys first, then Firebase.
4. Test the full flow locally: log in with your own phone, book a ticket with a test card, check it in on `/verify`.
5. Go live with Razorpay only once KYC is approved and you've tested end to end.
