import { beforeEach, describe, expect, it } from "vitest";
import { events } from "@/data/events";
import {
  approveOrderFromBackoffice,
  cancelOrderFromBackoffice,
  denyOrderFromBackoffice,
  getBackofficeSnapshot,
} from "@/server/operations.service";
import { createCheckoutOrder } from "@/server/checkout.service";
import { getPaymentByOrder } from "@/server/payment.service";
import { hydrateEventInventory } from "@/server/seat-inventory.service";
import { getTicketsByOrder } from "@/server/ticket.service";

const sampleEvent = events[0];
const availableSeats = sampleEvent.seatMap.seats.filter((seat) => seat.status === "available").slice(0, 3);

const createCorporateOrder = (seatId: string) =>
  createCheckoutOrder({
    event: sampleEvent,
    selectedSeatIds: [seatId],
    ticketCategories: {
      [seatId]: "full",
    },
    buyer: {
      fullName: "Operacao Local",
      email: "operacao@eventhub.dev",
      document: "12345678900",
      phone: "11999999999",
      city: "Sao Paulo / SP",
    },
    tickets: [{ seatId, holderName: "Titular Local", document: "12345678900" }],
    paymentMethod: "corporate",
    installments: "1x",
    accountId: "account_ops",
  });

describe("operations backoffice service", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("builds an operational snapshot with review queue and linked records", () => {
    const order = createCorporateOrder(availableSeats[0].id);

    const snapshot = getBackofficeSnapshot();
    const reviewRow = snapshot.reviewQueue.find((row) => row.order.id === order.id);
    const reviewDiagnostic = snapshot.diagnostics.find((diagnostic) => diagnostic.id === "review-queue-backlog");

    expect(snapshot.summary.totalOrders).toBe(1);
    expect(snapshot.summary.underReviewOrders).toBe(1);
    expect(snapshot.summary.pendingReviewRevenue).toBe(order.pricing.total);
    expect(snapshot.summary.openDiagnostics).toBeGreaterThan(0);
    expect(reviewRow?.order.reference).toBe(order.reference);
    expect(reviewRow?.payment?.status).toBe("under_review");
    expect(reviewRow?.notifications.length).toBe(1);
    expect(reviewRow?.tickets).toHaveLength(0);
    expect(reviewDiagnostic?.severity).toBe("warning");
    expect(reviewDiagnostic?.references).toContain(order.reference);
    expect(snapshot.runbooks.length).toBeGreaterThanOrEqual(3);
  });

  it("approves an under-review order from backoffice and issues ticket", () => {
    const order = createCorporateOrder(availableSeats[1].id);

    const approvedOrder = approveOrderFromBackoffice(order.id);

    expect(approvedOrder.status).toBe("approved");
    expect(getPaymentByOrder(order.id)?.status).toBe("authorized");
    expect(getTicketsByOrder(order.id)).toHaveLength(1);
    expect(hydrateEventInventory(sampleEvent).seatMap.seats.find((seat) => seat.id === availableSeats[1].id)?.status).toBe("sold");

    const snapshot = getBackofficeSnapshot();
    expect(snapshot.summary.approvedOrders).toBe(1);
    expect(snapshot.summary.issuedTickets).toBe(1);
    expect(snapshot.reviewQueue).toHaveLength(0);
    expect(snapshot.summary.openDiagnostics).toBe(0);
    expect(snapshot.diagnostics[0]?.id).toBe("operations-healthy");
  });

  it("denies an under-review order from backoffice and releases the seat", () => {
    const order = createCorporateOrder(availableSeats[2].id);

    const deniedOrder = denyOrderFromBackoffice(order.id);

    expect(deniedOrder.status).toBe("cancelled");
    expect(getPaymentByOrder(order.id)?.status).toBe("refunded");
    expect(hydrateEventInventory(sampleEvent).seatMap.seats.find((seat) => seat.id === availableSeats[2].id)?.status).toBe("available");

    const snapshot = getBackofficeSnapshot();
    expect(snapshot.summary.cancelledOrders).toBe(1);
    expect(snapshot.summary.refundedRevenue).toBe(order.pricing.total);
  });

  it("cancels an approved order from backoffice", () => {
    const order = createCheckoutOrder({
      event: sampleEvent,
      selectedSeatIds: [availableSeats[0].id],
      ticketCategories: {
        [availableSeats[0].id]: "full",
      },
      buyer: {
        fullName: "Operacao Card",
        email: "card@eventhub.dev",
        document: "12345678900",
        phone: "11999999999",
        city: "Sao Paulo / SP",
      },
      tickets: [{ seatId: availableSeats[0].id, holderName: "Titular Card", document: "12345678900" }],
      paymentMethod: "card",
      installments: "1x",
      accountId: "account_card_ops",
    });

    const cancelledOrder = cancelOrderFromBackoffice(order.id);

    expect(cancelledOrder.status).toBe("cancelled");
    expect(getPaymentByOrder(order.id)?.status).toBe("refunded");
    expect(getTicketsByOrder(order.id)[0]?.status).toBe("cancelled");
  });
});
