import { prisma } from "./prisma";

// How long an unpaid order holds its seats before they're released back
// into the pool. Keep this short - just long enough for someone to
// actually complete Razorpay checkout.
export const RESERVATION_TIMEOUT_MINUTES = 15;

// Pending orders older than the timeout are abandoned checkouts - release
// the seats they were holding and mark them expired. Called at the start
// of every new booking attempt, so stock frees up automatically without
// needing a separate cron job.
export async function releaseStaleReservations() {
  const cutoff = new Date(Date.now() - RESERVATION_TIMEOUT_MINUTES * 60 * 1000);

  const stale = await prisma.order.findMany({
    where: { status: "pending", createdAt: { lt: cutoff } },
    include: { items: true },
  });

  for (const order of stale) {
    await prisma.$transaction(async (tx) => {
      for (const item of order.items) {
        await tx.ticketType.update({
          where: { id: item.ticketTypeId },
          data: { reserved: { decrement: item.quantity } },
        });
      }
      await tx.order.update({ where: { id: order.id }, data: { status: "expired" } });
    });
  }
}

// Atomically reserves `quantity` seats on a ticket type, but only if
// sold + reserved + quantity still fits within the total quantity. This is
// a single conditional UPDATE, so it's safe even if many requests hit it
// in the same instant - the database guarantees only one of them can push
// the count over the limit; the rest see 0 rows affected and fail cleanly.
export async function tryReserve(ticketTypeId, quantity) {
  const result = await prisma.$executeRaw`
    UPDATE "TicketType"
    SET reserved = reserved + ${quantity}
    WHERE id = ${ticketTypeId}
      AND (sold + reserved + ${quantity}) <= quantity
  `;
  return result > 0; // true if the update actually applied (seats were available)
}

// Releases a reservation without converting it to a sale - used when
// order/payment creation fails after the seats were already held.
export async function releaseReservation(ticketTypeId, quantity) {
  await prisma.ticketType.update({
    where: { id: ticketTypeId },
    data: { reserved: { decrement: quantity } },
  });
}

// Converts a held reservation into a confirmed sale once payment is verified.
export async function confirmReservation(tx, ticketTypeId, quantity) {
  await tx.ticketType.update({
    where: { id: ticketTypeId },
    data: { reserved: { decrement: quantity }, sold: { increment: quantity } },
  });
}
