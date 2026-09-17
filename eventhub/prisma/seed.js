const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  const adminEmail = process.env.SEED_ADMIN_EMAIL || "admin@example.com";
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || "changeme123";

  const existingAdmin = await prisma.admin.findUnique({ where: { email: adminEmail } });
  if (!existingAdmin) {
    const hash = await bcrypt.hash(adminPassword, 10);
    await prisma.admin.create({
      data: { email: adminEmail, password: hash, name: "Event Admin" },
    });
    console.log(`Created admin: ${adminEmail} / ${adminPassword} (CHANGE THIS PASSWORD)`);
  }

  const existingEvent = await prisma.event.findFirst();
  if (!existingEvent) {
    const event = await prisma.event.create({
      data: {
        title: "Your Event Name",
        tagline: "A short one-line hook about the event",
        description: "Full description of the event goes here. Edit this from the admin dashboard.",
        venue: "Venue Name",
        address: "Full address here",
        startsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        endsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000),
      },
    });
    await prisma.ticketType.createMany({
      data: [
        { eventId: event.id, name: "General", price: 50000, quantity: 200 },
        { eventId: event.id, name: "VIP", price: 150000, quantity: 50 },
      ],
    });
    console.log("Created sample event with General (₹500) and VIP (₹1500) tickets.");
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
