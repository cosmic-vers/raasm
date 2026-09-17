# EventHub

A single-event website: ticket booking, QR check-in, admin dashboard, photo
gallery, food menu, stalls directory, venue map, referral/discount links,
and booking statistics — all backed by one database.

## What's included

**Public site**
- `/` — event details, ticket types, gallery
- `/menu` — food & drinks
- `/stalls` — vendor/stall directory
- `/location` — embedded map + "Get Directions" button
- `/book` — buyer form → Razorpay Checkout → QR ticket(s)
- `/verify` — door-staff check-in (camera scan or manual code entry)

**Admin dashboard** (`/admin/dashboard`, behind login)
- Event details, including venue coordinates/map link
- Ticket types (name, price, quantity)
- Food menu items
- Stalls
- Gallery photos
- Referral/discount codes, with revenue per code
- Attendee list with check-in status
- **Statistics**: tickets sold and checked-in per ticket type, and per
  referral code — this is where you see "how many entries came from
  PRIYA10" etc.

## Production-readiness fixes included

If you read through the code, these are already handled:

1. **No more overselling.** Booking used to check "is there stock?" and
   then create the order as two separate steps — under real concurrent
   traffic, multiple people could pass that check for the same last seat.
   It's now one atomic database operation (`lib/reservations.js`), so only
   one request can win the last seat no matter how many arrive at once.
2. **Postgres instead of SQLite.** SQLite locks the whole file on writes
   and can't run on serverless hosts. The schema now targets Postgres —
   you need a real `DATABASE_URL` (see below).
3. **Reliable payment confirmation.** The Razorpay **webhook** is now the
   primary source of truth for "did this actually get paid," not just a
   backup — so if a buyer's browser dies right after paying, they still
   get their ticket. Both the webhook and the browser-side callback share
   one idempotent function (`lib/orderConfirmation.js`), so a payment can
   never generate two sets of tickets.
4. **Abandoned-checkout cleanup.** If someone starts a booking and never
   pays, their held seats are automatically released back into the pool
   after 15 minutes (`RESERVATION_TIMEOUT_MINUTES` in `lib/reservations.js`).
5. **Cloud image storage.** Gallery/menu/stall photos upload to Cloudinary
   if you set the `CLOUDINARY_*` env vars; otherwise they fall back to
   local disk (fine for testing, not for real deployment).
6. **Basic rate limiting** on booking and ticket-verification endpoints, to
   blunt scripted abuse (see the note in `lib/rateLimit.js` about its
   single-server limitation).

## Setup

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Get a Postgres database.** Free options that work well: Neon
   (neon.tech), Supabase (supabase.com), Railway (railway.app). Copy the
   connection string they give you.

3. **Configure environment variables**
   ```bash
   cp .env.example .env
   ```
   Fill in `DATABASE_URL` (from step 2), `NEXTAUTH_SECRET` and
   `TICKET_SECRET` (generate each with
   `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`),
   your Razorpay test keys, and your admin email/password. Cloudinary keys
   are optional for local testing.

4. **Set up the database**
   ```bash
   npm run db:push
   npm run db:seed
   ```

5. **Run it**
   ```bash
   npm run dev
   ```

## Still on you before a city-wide launch

These aren't code problems — they're accounts/logistics only you can do:

- **Razorpay live activation** — test keys work for you and me, but real
  payments need KYC (business details, bank account, PAN). Start this
  early; it can take a few days.
- **Set up the webhook** — in the Razorpay dashboard under
  **Settings → Webhooks**, point it at
  `https://yourdomain.com/api/razorpay/webhook`, subscribed to
  `payment.captured`, and put the secret it gives you into
  `RAZORPAY_WEBHOOK_SECRET`. Do this before launch — it's the reliable
  half of payment confirmation.
- **Hosting + domain** — deploy to a VPS (e.g. DigitalOcean, Hetzner) or a
  platform like Railway/Render running `npm run build && npm run start`.
  Point your domain's DNS at it and get HTTPS (most platforms do this
  automatically via Let's Encrypt).
- **Venue wifi for the check-in scanner** — confirm it in advance. If it's
  unreliable, say so and I can add an offline-queue mode to `/verify` that
  syncs scans once connectivity returns.
- **Load-test before the real ticket drop** — once deployed, it's worth
  simulating 200–500 concurrent bookings against a test event before
  announcing publicly, so you catch anything specific to your host's
  capacity.
- **Error tracking (recommended, not required)** — a free Sentry account
  wired in would tell you immediately if something breaks at 11pm instead
  of finding out from an angry email. Ask me if you want this added.
- **Database backups** — Neon/Supabase/Railway all do automatic daily
  backups on their free tiers; just confirm it's switched on.

## How the referral stats work

Create a code under **Admin → Referral links** (e.g. `PRIYA10`). Share
`https://yourdomain.com/?ref=PRIYA10` — it carries through checkout
automatically. **Admin → Statistics** then shows, per code: tickets sold,
how many of those actually checked in at the door, and revenue generated.

## Moving further past one VPS

If you eventually outgrow a single server:
- Swap `lib/rateLimit.js`'s in-memory counter for Upstash Redis's
  rate-limit package, so limits are shared across instances.
- Everything else (Postgres, Cloudinary, the webhook-based payment flow)
  already works fine across multiple instances as-is.

## Project structure

```
app/
  page.js, menu/, stalls/, location/    → public pages
  book/page.js                           → booking + Razorpay checkout
  verify/page.js                          → QR check-in scanner
  admin/                                   → dashboard (events, menu, stalls, gallery, referrals, attendees, stats)
  api/                                       → all backend routes
lib/
  reservations.js                             → atomic ticket-hold logic (the overselling fix)
  orderConfirmation.js                         → shared idempotent payment confirmation
  rateLimit.js, upload.js, tickets.js, razorpay.js, authOptions.js, prisma.js
prisma/schema.prisma                            → the single database schema
```
