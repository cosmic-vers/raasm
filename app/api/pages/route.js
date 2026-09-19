import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { unstable_cache, revalidateTag } from "next/cache";
import { authOptions } from "../../../lib/authOptions";
import { prisma } from "../../../lib/prisma";

// This handler reads the live database - without this, Next tries to
// prerender the public GET endpoint during `next build`, before the
// runtime database connection exists.
export const dynamic = "force-dynamic";

// Only these two static pages exist for now. Keeping this as an allowlist
// (rather than letting the admin create arbitrary slugs) keeps the public
// site's nav/footer links and this API in sync with each other.
const ALLOWED_SLUGS = ["about", "help"];

// Sensible starting copy so the pages read fine even before an admin has
// saved anything from the dashboard - never show a blank page to a visitor.
const DEFAULTS = {
  about: {
    title: "About Us",
    body:
      "We're the team behind this event, and we're excited to have you join us.\n\n" +
      "This page can be edited any time from the admin dashboard under \"About & Help\" - " +
      "add your story, your team, or anything else you'd like visitors to know.",
  },
  help: {
    title: "Help & FAQs",
    body:
      "Have a question about tickets, entry, or the event itself? Here's what you need to know.\n\n" +
      "Can't find an answer here? Reach out to us directly and we'll get back to you.\n\n" +
      "This page can be edited any time from the admin dashboard under \"About & Help\".",
  },
};

const getCachedPages = unstable_cache(
  async () => prisma.pageContent.findMany({ where: { slug: { in: ALLOWED_SLUGS } } }),
  ["public-pages"],
  { tags: ["pages"], revalidate: 60 }
);

// Public, no auth needed - returns both pages, one being the merge of the
// saved row (if any) over the default copy above.
export async function GET() {
  const rows = await getCachedPages();
  const bySlug = Object.fromEntries(rows.map((r) => [r.slug, r]));

  const pages = {};
  for (const slug of ALLOWED_SLUGS) {
    const saved = bySlug[slug];
    pages[slug] = {
      slug,
      title: saved?.title || DEFAULTS[slug].title,
      body: saved?.body ?? DEFAULTS[slug].body,
      updatedAt: saved?.updatedAt || null,
    };
  }

  return NextResponse.json({ pages });
}

// Admin-only: create or update one page's content by slug.
export async function PUT(req) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const { slug, title, body } = await req.json();

  if (!ALLOWED_SLUGS.includes(slug)) {
    return NextResponse.json({ error: "Unknown page." }, { status: 400 });
  }
  if (!title || !title.trim()) {
    return NextResponse.json({ error: "Title is required." }, { status: 400 });
  }

  const page = await prisma.pageContent.upsert({
    where: { slug },
    update: { title: title.trim(), body: body || "" },
    create: { slug, title: title.trim(), body: body || "" },
  });

  revalidateTag("pages");
  return NextResponse.json({ page });
}
