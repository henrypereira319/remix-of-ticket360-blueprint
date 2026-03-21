import { beforeEach, describe, expect, it } from "vitest";
import { events } from "@/data/events";
import { getStoredAnalyticsEvents } from "@/server/analytics.service";
import { cancelCheckoutOrder, createCheckoutOrder, getStoredOrders, settleOrderPayment } from "@/server/checkout.service";
import { getStoredNotifications } from "@/server/notification.service";
import { getPaymentByOrder, getPaymentsByAccount } from "@/server/payment.service";
import { createSeatHold, hydrateEventInventory } from "@/server/seat-inventory.service";
import { getTicketsByAccount, getTicketsByOrder } from "@/server/ticket.service";

const sampleEvent = events[0];
const availableSeats = sampleEvent.seatMap.seats.filter((seat) => seat.status === "available").slice(0, 3);

describe("checkout backend services", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("creates temporary holds and reflects them in runtime inventory", () => {
    const hold = createSeatHold(sampleEvent, [availableSeats[0].id, availableSeats[1].id], {
      accountId: "account_test",
    });

    expect(hold.seatIds).toEqual([availableSeats[0].id, availableSeats[1].id]);

    const runtimeEvent = hydrateEventInventory(sampleEvent);
    const firstSeat = runtimeEvent.seatMap.seats.find((seat) => seat.id === availableSeats[0].id);
    const secondSeat = runtimeEvent.seatMap.seats.find((seat) => seat.id === availableSeats[1].id);

    expect(firstSeat?.status).toBe("reserved");
    expect(secondSeat?.status).toBe("reserved");
  });

  it("creates persistent checkout orders and marks seats as sold", () => {
    const hold = createSeatHold(sampleEvent, [availableSeats[0].id, availableSeats[1].id], {
      accountId: "account_test",
    });

    const order = createCheckoutOrder({
      event: sampleEvent,
      selectedSeatIds: [availableSeats[0].id, availableSeats[1].id],
      ticketCategories: {
        [availableSeats[0].id]: "full",
        [availableSeats[1].id]: "half",
      },
      buyer: {
        fullName: "Teste Comprador",
        email: "teste@eventhub.dev",
        document: "12345678900",
        phone: "11999999999",
        city: "Sao Paulo / SP",
      },
      tickets: [
        { seatId: availableSeats[0].id, holderName: "Titular Um", document: "12345678900" },
        { seatId: availableSeats[1].id, holderName: "Titular Dois", document: "99888777666" },
      ],
      paymentMethod: "pix",
      installments: "1x",
      accountId: "account_test",
      holdToken: hold.holdToken,
    });

    expect(order.reference).toMatch(/^PED-/);
    expect(order.status).toBe("approved");
    expect(order.tickets).toHaveLength(2);
    expect(getStoredOrders()).toHaveLength(1);
    expect(getPaymentByOrder(order.id)?.status).toBe("authorized");
    expect(getPaymentsByAccount("account_test")).toHaveLength(1);
    expect(getTicketsByOrder(order.id)).toHaveLength(2);
    expect(getTicketsByAccount("account_test")).toHaveLength(2);
    expect(getStoredNotifications().filter((notification) => notification.orderId === order.id)).toHaveLength(2);
    expect(getStoredAnalyticsEvents().map((event) => event.name)).toEqual(
      expect.arrayContaining(["seat_hold_created", "payment_authorized", "order_approved", "tickets_issued", "notifications_dispatched"]),
    );

    const runtimeEvent = hydrateEventInventory(sampleEvent);
    const firstSeat = runtimeEvent.seatMap.seats.find((seat) => seat.id === availableSeats[0].id);
    const secondSeat = runtimeEvent.seatMap.seats.find((seat) => seat.id === availableSeats[1].id);

    expect(firstSeat?.status).toBe("sold");
    expect(secondSeat?.status).toBe("sold");
  });

  it("blocks duplicate orders for an already confirmed seat", () => {
    createCheckoutOrder({
      event: sampleEvent,
      selectedSeatIds: [availableSeats[2].id],
      ticketCategories: {
        [availableSeats[2].id]: "full",
      },
      buyer: {
        fullName: "Comprador 1",
        email: "one@eventhub.dev",
        document: "12345678900",
        phone: "11999999999",
        city: "Sao Paulo / SP",
      },
      tickets: [{ seatId: availableSeats[2].id, holderName: "Titular Unico", document: "12345678900" }],
      paymentMethod: "pix",
      installments: "1x",
      accountId: "account_1",
    });

    expect(() =>
      createCheckoutOrder({
        event: sampleEvent,
        selectedSeatIds: [availableSeats[2].id],
        ticketCategories: {
          [availableSeats[2].id]: "full",
        },
        buyer: {
          fullName: "Comprador 2",
          email: "two@eventhub.dev",
          document: "10987654321",
          phone: "11888888888",
          city: "Rio de Janeiro / RJ",
        },
        tickets: [{ seatId: availableSeats[2].id, holderName: "Outro Titular", document: "10987654321" }],
        paymentMethod: "card",
        installments: "1x",
        accountId: "account_2",
      }),
    ).toThrow(/indisponivel/i);
  });

  it("keeps corporate orders under review without issuing tickets", () => {
    const order = createCheckoutOrder({
      event: sampleEvent,
      selectedSeatIds: [availableSeats[0].id],
      ticketCategories: {
        [availableSeats[0].id]: "full",
      },
      buyer: {
        fullName: "Comprador Corporativo",
        email: "corp@eventhub.dev",
        document: "12345678900",
        phone: "11999999999",
        city: "Sao Paulo / SP",
      },
      tickets: [{ seatId: availableSeats[0].id, holderName: "Titular Corp", document: "12345678900" }],
      paymentMethod: "corporate",
      installments: "1x",
      accountId: "account_corp",
    });

    expect(order.status).toBe("under_review");
    expect(getPaymentByOrder(order.id)?.status).toBe("under_review");
    expect(getTicketsByOrder(order.id)).toHaveLength(0);
    expect(hydrateEventInventory(sampleEvent).seatMap.seats.find((seat) => seat.id === availableSeats[0].id)?.status).toBe("reserved");

    const notifications = getStoredNotifications().filter((notification) => notification.orderId === order.id);
    expect(notifications).toHaveLength(1);
    expect(notifications[0]?.template).toBe("payment-under-review");
  });

  it("can settle an under-review order and emit tickets later", () => {
    const pendingOrder = createCheckoutOrder({
      event: sampleEvent,
      selectedSeatIds: [availableSeats[1].id],
      ticketCategories: {
        [availableSeats[1].id]: "full",
      },
      buyer: {
        fullName: "Financeiro",
        email: "financeiro@eventhub.dev",
        document: "12345678900",
        phone: "11999999999",
        city: "Sao Paulo / SP",
      },
      tickets: [{ seatId: availableSeats[1].id, holderName: "Titular Financeiro", document: "12345678900" }],
      paymentMethod: "corporate",
      installments: "1x",
      accountId: "account_finance",
    });

    const settledOrder = settleOrderPayment(pendingOrder.id);

    expect(settledOrder.status).toBe("approved");
    expect(getPaymentByOrder(pendingOrder.id)?.status).toBe("authorized");
    expect(getTicketsByOrder(pendingOrder.id)).toHaveLength(1);
    expect(hydrateEventInventory(sampleEvent).seatMap.seats.find((seat) => seat.id === availableSeats[1].id)?.status).toBe("sold");
  });

  it("can cancel an approved order and release inventory again", () => {
    const order = createCheckoutOrder({
      event: sampleEvent,
      selectedSeatIds: [availableSeats[2].id],
      ticketCategories: {
        [availableSeats[2].id]: "full",
      },
      buyer: {
        fullName: "Comprador Cancelamento",
        email: "cancelamento@eventhub.dev",
        document: "12345678900",
        phone: "11999999999",
        city: "Sao Paulo / SP",
      },
      tickets: [{ seatId: availableSeats[2].id, holderName: "Titular Cancelado", document: "12345678900" }],
      paymentMethod: "card",
      installments: "1x",
      accountId: "account_cancel",
    });

    const cancelledOrder = cancelCheckoutOrder(order.id);

    expect(cancelledOrder.status).toBe("cancelled");
    expect(getPaymentByOrder(order.id)?.status).toBe("refunded");
    expect(getTicketsByOrder(order.id)[0]?.status).toBe("cancelled");
    expect(hydrateEventInventory(sampleEvent).seatMap.seats.find((seat) => seat.id === availableSeats[2].id)?.status).toBe("available");
    expect(getStoredNotifications().some((notification) => notification.orderId === order.id && notification.template === "order-cancelled")).toBe(true);
    expect(getStoredAnalyticsEvents().map((event) => event.name)).toEqual(expect.arrayContaining(["order_cancelled", "tickets_cancelled"]));
  });
});
