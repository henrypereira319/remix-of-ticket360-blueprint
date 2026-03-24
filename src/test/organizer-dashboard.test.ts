import { beforeEach, describe, expect, it } from "vitest";
import { events } from "@/data/events";
import { createCheckoutOrder } from "@/server/checkout.service";
import { getOrganizerSnapshot } from "@/server/organizer.service";

const sampleEvent = events[0];
const availableSeats = sampleEvent.seatMap.seats.filter((seat) => seat.status === "available").slice(0, 2);

describe("organizer snapshot service", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("exposes the published catalog even before sales exist", () => {
    const snapshot = getOrganizerSnapshot();
    const firstEvent = snapshot.events.find((event) => event.event.id === sampleEvent.id);

    expect(snapshot.summary.totalEvents).toBe(events.length);
    expect(snapshot.summary.publishedEvents).toBe(events.length);
    expect(snapshot.summary.eventsWithOrders).toBe(0);
    expect(snapshot.summary.eventsWithoutOrders).toBe(events.length);
    expect(snapshot.summary.attentionEvents).toBe(0);
    expect(firstEvent?.status).toBe("published");
    expect(firstEvent?.publicationStatus).toBe("published");
    expect(firstEvent?.diagnostics[0]).toContain("Evento publicado sem operação");
  });

  it("highlights events with review queue as attention items", () => {
    const order = createCheckoutOrder({
      event: sampleEvent,
      selectedSeatIds: [availableSeats[0].id],
      ticketCategories: {
        [availableSeats[0].id]: "full",
      },
      buyer: {
        fullName: "Produtor Local",
        email: "produtor@eventhub.dev",
        document: "12345678900",
        phone: "11999999999",
        city: "Sao Paulo / SP",
      },
      tickets: [{ seatId: availableSeats[0].id, holderName: "Titular Local", document: "12345678900" }],
      paymentMethod: "corporate",
      installments: "1x",
      accountId: "account_organizer",
    });

    const snapshot = getOrganizerSnapshot();
    const eventRow = snapshot.events.find((event) => event.event.id === sampleEvent.id);

    expect(order.status).toBe("under_review");
    expect(snapshot.summary.eventsWithOrders).toBe(1);
    expect(snapshot.summary.attentionEvents).toBe(1);
    expect(snapshot.summary.underReviewOrders).toBe(1);
    expect(eventRow?.status).toBe("attention");
    expect(eventRow?.underReviewOrders).toBe(1);
    expect(eventRow?.diagnostics).toContain("Fila manual aberta para aprovar ou negar pedidos.");
  });

  it("moves the event to selling after approval and ticket issuance", () => {
    const order = createCheckoutOrder({
      event: sampleEvent,
      selectedSeatIds: [availableSeats[1].id],
      ticketCategories: {
        [availableSeats[1].id]: "full",
      },
      buyer: {
        fullName: "Produtor Card",
        email: "produtor-card@eventhub.dev",
        document: "12345678900",
        phone: "11999999999",
        city: "Sao Paulo / SP",
      },
      tickets: [{ seatId: availableSeats[1].id, holderName: "Titular Card", document: "12345678900" }],
      paymentMethod: "card",
      installments: "1x",
      accountId: "account_organizer_card",
    });

    const snapshot = getOrganizerSnapshot();
    const eventRow = snapshot.events.find((event) => event.event.id === sampleEvent.id);

    expect(snapshot.summary.eventsWithOrders).toBe(1);
    expect(snapshot.summary.attentionEvents).toBe(0);
    expect(snapshot.summary.issuedTickets).toBe(1);
    expect(eventRow?.status).toBe("selling");
    expect(eventRow?.issuedTickets).toBe(1);
    expect(eventRow?.authorizedRevenue).toBe(order.pricing.total);
    expect(eventRow?.diagnostics).toContain("Operação coerente entre venda, emissão e comunicação.");
  });
});
