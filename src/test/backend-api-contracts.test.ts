import { beforeEach, describe, expect, it } from "vitest";
import { events } from "@/data/events";
import { getCatalogEventBySlug, getRuntimeEventBySlug, listCatalogEvents } from "@/server/api/catalog.api";
import { createInventoryHold, getInventoryOverviewBySlug, releaseInventoryHold } from "@/server/api/inventory.api";
import { getBackofficeData } from "@/server/api/operations.api";
import { createOrder, listAllOrders, listOrdersByAccount } from "@/server/api/orders.api";
import { getPaymentForOrder, listAllPayments } from "@/server/api/payments.api";
import { createSupportCase, listSupportCasesByAccount } from "@/server/api/support.api";
import { listAllTickets, listTicketsByAccount } from "@/server/api/tickets.api";
import { listAllNotifications } from "@/server/api/notifications.api";
import { getOrganizerData } from "@/server/api/organizer.api";
import { listAnalyticsEvents } from "@/server/api/analytics.api";

const sampleEvent = events[0];
const availableSeat = sampleEvent.seatMap.seats.find((seat) => seat.status === "available");

describe("backend api boundary", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("loads catalog and runtime event separately", async () => {
    const catalogEvent = await getCatalogEventBySlug(sampleEvent.slug);
    const runtimeEvent = await getRuntimeEventBySlug(sampleEvent.slug);
    const cityFiltered = await listCatalogEvents({ city: "Sao Paulo" });

    expect(catalogEvent?.id).toBe(sampleEvent.id);
    expect(runtimeEvent?.seatMap.totalSeats).toBeGreaterThan(0);
    expect(cityFiltered.some((event) => event.slug === sampleEvent.slug)).toBe(true);
  });

  it("creates and releases inventory holds through api contracts", async () => {
    if (!availableSeat) {
      throw new Error("Nenhum assento disponivel para o teste.");
    }

    const hold = await createInventoryHold({
      eventSlug: sampleEvent.slug,
      seatIds: [availableSeat.id],
      accountId: "account_api",
    });

    const reservedSnapshot = await getInventoryOverviewBySlug(sampleEvent.slug);
    expect(reservedSnapshot.held).toBe(1);

    await releaseInventoryHold(hold.holdToken);

    const releasedSnapshot = await getInventoryOverviewBySlug(sampleEvent.slug);
    expect(releasedSnapshot.held).toBe(0);
  });

  it("serves orders, payments, tickets, notifications and analytics through dedicated APIs", async () => {
    if (!availableSeat) {
      throw new Error("Nenhum assento disponivel para o teste.");
    }

    const order = await createOrder({
      event: sampleEvent,
      selectedSeatIds: [availableSeat.id],
      ticketCategories: {
        [availableSeat.id]: "full",
      },
      buyer: {
        fullName: "API Buyer",
        email: "api@eventhub.dev",
        document: "12345678900",
        phone: "11999999999",
        city: "Sao Paulo / SP",
      },
      tickets: [{ seatId: availableSeat.id, holderName: "API Holder", document: "12345678900" }],
      paymentMethod: "pix",
      installments: "1x",
      accountId: "account_api",
    });

    const supportCase = await createSupportCase({
      accountId: "account_api",
      orderId: order.id,
      category: "ticket",
      subject: "Ingresso nao apareceu",
      message: "Contrato de suporte para a conta de teste.",
    });

    const [orders, accountOrders, payment, payments, tickets, accountTickets, notifications, analytics, backoffice, supportCases] =
      await Promise.all([
        listAllOrders(),
        listOrdersByAccount("account_api"),
        getPaymentForOrder(order.id),
        listAllPayments(),
        listAllTickets(),
        listTicketsByAccount("account_api"),
        listAllNotifications(),
        listAnalyticsEvents(),
        getBackofficeData(),
        listSupportCasesByAccount("account_api"),
      ]);

    expect(orders).toHaveLength(1);
    expect(accountOrders[0]?.id).toBe(order.id);
    expect(payment?.orderId).toBe(order.id);
    expect(payments).toHaveLength(1);
    expect(tickets).toHaveLength(1);
    expect(accountTickets).toHaveLength(1);
    expect(notifications.length).toBeGreaterThanOrEqual(2);
    expect(analytics.length).toBeGreaterThan(0);
    expect(backoffice.summary.totalOrders).toBe(1);
    expect(supportCase.accountId).toBe("account_api");
    expect(supportCases).toHaveLength(1);
  });

  it("exposes organizer data through the API boundary", async () => {
    const organizer = await getOrganizerData();

    expect(organizer.summary.totalEvents).toBe(events.length);
    expect(organizer.events[0]?.publicationStatus).toBe("published");
  });
});
