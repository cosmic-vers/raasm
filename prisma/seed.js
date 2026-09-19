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
    // Three consecutive nights, each 7pm-11pm.
    const day1Start = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    day1Start.setHours(19, 0, 0, 0);
    const dayStart = (offset) => new Date(day1Start.getTime() + offset * 24 * 60 * 60 * 1000);
    const dayEnd = (offset) => new Date(dayStart(offset).getTime() + 4 * 60 * 60 * 1000);

    const event = await prisma.event.create({
      data: {
        title: "Your Event Name",
        tagline: "A short one-line hook about the event",
        description: "Full description of the event goes here. Edit this from the admin dashboard.",
        venue: "Venue Name",
        address: "Full address here",
        startsAt: dayStart(0),
        endsAt: dayEnd(2), // spans all 3 nights
      },
    });

    // Solo / Couple / Trio / Squad passes, each sold separately per day.
    const groupTiers = [
      { name: "Solo", groupSize: 1, price: 50000, quantity: 150 },
      { name: "Couple", groupSize: 2, price: 90000, quantity: 80 },
      { name: "Trio", groupSize: 3, price: 130000, quantity: 40 },
      { name: "Squad", groupSize: 4, price: 160000, quantity: 30 },
    ];

    const ticketTypes = [];
    for (let day = 0; day < 3; day++) {
      for (const tier of groupTiers) {
        ticketTypes.push({
          eventId: event.id,
          name: tier.name,
          eventDate: dayStart(day),
          groupSize: tier.groupSize,
          price: tier.price,
          quantity: tier.quantity,
        });
      }
    }
    await prisma.ticketType.createMany({ data: ticketTypes });
    console.log("Created a sample 3-day event with Solo/Couple/Trio/Squad tickets for each day.");
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
