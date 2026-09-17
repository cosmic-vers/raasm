import { prisma } from "./prisma";
import { generateTicketCode } from "./tickets";
import { confirmReservation } from "./reservations";

// Confirms an order as paid and mints its tickets - safe to call more than
// once for the same order (e.g. once from the browser's callback and again
// from the webhook, whichever arrives first). Uses a transaction with a
// status check inside it, so only the first caller actually does the work;
// the second just returns the tickets that already exist.
export async function confirmOrderPaid(orderId, razorpayPaymentId) {
  return prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });
    if (!order) return { ok: false, error: "Order not found." };

    if (order.status === "paid") {
      const tickets = await tx.ticket.findMany({ where: { orderId } });
      return { ok: true, tickets, alreadyProcessed: true };
    }

    await tx.order.update({
      where: { id: orderId },
      data: { status: "paid", razorpayPaymentId },
    });

    const tickets = [];
    for (const item of order.items) {
      await confirmReservation(tx, item.ticketTypeId, item.quantity);
      for (let i = 0; i < item.quantity; i++) {
        let t;
        for (let attempt = 0; attempt < 5; attempt++) {
          try {
            t = await tx.ticket.create({
              data: { code: generateTicketCode(), orderId, ticketTypeId: item.ticketTypeId },
            });
            break;
          } catch (err) {
            // P2002 = unique constraint violation - vanishingly rare with a
            // 1B+ code space, but retry with a freshly generated code rather
            // than fail someone's paid order over it.
            if (err.code !== "P2002" || attempt === 4) throw err;
          }
        }
        tickets.push(t);
      }
    }

    return { ok: true, tickets, alreadyProcessed: false };
  });
}
