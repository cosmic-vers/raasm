# What changed

## 1. Razorpay
No code changes needed — your webhook and signature verification were already correct. Just:
1. Get test keys from Razorpay Dashboard → Settings → API Keys, put them in `.env`.
2. Add the webhook URL (`https://yourdomain.com/api/razorpay/webhook`) under Settings → Webhooks, subscribed to `payment.captured`.
3. Put the webhook secret in `.env` too. Test with a dummy card before going live.

## 2. Buyer login (Firebase: Google + email link)
New: buyers can log in with Google or a passwordless email link, and see their tickets later. (This replaced an earlier phone-OTP version of this feature — if you see references to phone/OTP login elsewhere, they're stale; Google + email link is what's actually implemented.)

- `prisma/schema.prisma` — added a `User` model (email, Firebase UID), linked to `Order`.
- `lib/firebaseClient.js` / `lib/firebaseAdmin.js` — Firebase SDK wrappers.
- `lib/buyerSession.js` — a signed cookie for buyer login, kept fully separate from your admin login so the two never conflict.
- `app/login/page.js` — "Continue with Google" or "email me a login link", either way ends up logged in.
- `app/api/auth/session/route.js` — verifies the Firebase ID token server-side, creates/looks up the account, sets the session cookie; also handles logout (`DELETE`) and "am I logged in" (`GET`).
- `app/my-tickets/page.js` + `app/api/my-tickets/route.js` — a buyer's ticket dashboard, with live QR codes and check-in status.
- `app/book/page.js` — requires login before booking, so every ticket is tied to an account.

**You need to do before this works:**
1. Create a Firebase project (free) at console.firebase.google.com.
2. Under Authentication → Sign-in method, enable **Google**, and enable **Email/Password → Email link (passwordless sign-in)**.
3. Under Authentication → Settings → Authorized domains, add your real deployed domain.
4. Add a Web app to get your `NEXT_PUBLIC_FIREBASE_*` values.
5. Generate a service account key (Project Settings → Service Accounts) for the server-side `FIREBASE_*` values.
6. All of this is spelled out step-by-step in `.env.example`.

Both Google and email-link sign-in are free on Firebase's Spark (no-billing) plan — no SMS costs, no Blaze upgrade needed.

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

## 6. About Us & Help pages (editable from admin)
New: two static public pages, `/about` and `/help`, with content you can edit any time — no code changes needed.

- `prisma/schema.prisma` — added a `PageContent` model (`slug`, `title`, `body`).
- `app/api/pages/route.js` — public `GET` (returns both pages, with sensible placeholder copy if nothing's been saved yet), admin-only `PUT` to save one page by slug.
- `app/about/page.js`, `app/help/page.js` — the public pages, styled to match the rest of the site.
- `app/admin/pages/page.js` — new "About & Help" tab in the admin nav, with a simple title + text box for each page. Leave a blank line between paragraphs.
- Linked from the homepage nav/footer and the shared footer on menu/stalls/location.

**You need to do before this works:** run `npx prisma db push` (see step 2 below) — this feature added a new database table, so it won't exist in your database until you push the schema.

## 7. Ticket check-in hardening
`app/api/tickets/verify/route.js` — the check-in write is now a single conditional update (only succeeds if the ticket was still un-checked-in) instead of a check-then-write. Closes a narrow race where the same QR code scanned on two devices in the same instant could both report success; now exactly one wins and the other correctly sees "already checked in."

# Recommended order to actually ship this
1. Run `npm install` (pulls in the new `firebase` and `firebase-admin` packages).
2. `npx prisma db push` against your Neon database — this adds the `User` table and the new `PageContent` table (for About/Help).
3. Fill in `.env` — Razorpay test keys first, then Firebase.
4. Test the full flow locally: log in with Google or your email, book a ticket with a test card, check it in on `/verify`.
5. Fill in the About and Help pages from `/admin/pages` — they show placeholder text until you do.
6. Run `npm run build` locally and make sure it completes clean before deploying — do this even if everything above looks fine.
7. Go live with Razorpay only once KYC is approved and you've tested end to end.
