import type { CheckoutOrderRecord } from "@/server/checkout.service";
import { trackAnalyticsEvent } from "@/server/analytics.service";
import { createPersistentId, emitStorageMutation, readStorageJson, writeStorageJson } from "@/server/storage";

const TICKETS_STORAGE_KEY = "eventhub.tickets";
const TICKETS_CHANNEL = "tickets";

export type IssuedTicketStatus = "issued" | "used" | "cancelled";

export interface IssuedTicketRecord {
  id: string;
  orderId: string;
  orderReference: string;
  eventId: string;
  eventSlug: string;
  accountId?: string | null;
  seatId: string;
  label: string;
  sectionId: string;
  sectionName: string;
  holderName: string;
  document: string;
  qrPayload: string;
  barcode: string;
  walletToken: string;
  walletUrl: string;
  status: IssuedTicketStatus;
  issuedAt: string;
  updatedAt: string;
}

const nowIso = () => new Date().toISOString();

const buildTicketPayload = (order: CheckoutOrderRecord, seatId: string) =>
  `eventhub|${order.reference}|${order.eventSlug}|${seatId}`;

const buildBarcode = (order: CheckoutOrderRecord, seatId: string) =>
  `${order.reference.replace(/[^A-Z0-9]/gi, "").slice(-12)}${seatId.replace(/[^A-Z0-9]/gi, "").slice(-8)}`;

export const getStoredTickets = () => readStorageJson<IssuedTicketRecord[]>(TICKETS_STORAGE_KEY, []);

const persistTickets = (tickets: IssuedTicketRecord[]) => {
  writeStorageJson(TICKETS_STORAGE_KEY, tickets);
  emitStorageMutation(TICKETS_CHANNEL);
};

export const getTicketsByOrder = (orderId: string) => getStoredTickets().filter((ticket) => ticket.orderId === orderId);

export const getTicketsByAccount = (accountId?: string | null) =>
  accountId ? getStoredTickets().filter((ticket) => ticket.accountId === accountId) : [];

export const issueTicketsForOrder = (order: CheckoutOrderRecord): IssuedTicketRecord[] => {
  const existingTickets = getTicketsByOrder(order.id);

  if (existingTickets.length > 0) {
    return existingTickets;
  }

  const issuedAt = nowIso();
  const createdTickets = order.tickets.map<IssuedTicketRecord>((ticket) => {
    const ticketId = createPersistentId("ticket");
    const qrPayload = buildTicketPayload(order, ticket.seatId);
    const walletToken = createPersistentId("wallet");

    return {
      id: ticketId,
      orderId: order.id,
      orderReference: order.reference,
      eventId: order.eventId,
      eventSlug: order.eventSlug,
      accountId: order.accountId ?? null,
      seatId: ticket.seatId,
      label: ticket.label,
      sectionId: ticket.sectionId,
      sectionName: ticket.sectionName,
      holderName: ticket.holderName,
      document: ticket.document,
      qrPayload,
      barcode: buildBarcode(order, ticket.seatId),
      walletToken,
      walletUrl: `/conta?ticket=${ticketId}&wallet=${walletToken}`,
      status: "issued",
      issuedAt,
      updatedAt: issuedAt,
    };
  });

  persistTickets([...createdTickets, ...getStoredTickets()]);

  trackAnalyticsEvent({
    name: "tickets_issued",
    accountId: order.accountId ?? null,
    eventId: order.eventId,
    eventSlug: order.eventSlug,
    orderId: order.id,
    payload: {
      tickets: createdTickets.length,
    },
  });

  return createdTickets;
};

export const cancelTicketsForOrder = (orderId: string): IssuedTicketRecord[] => {
  const tickets = getStoredTickets();
  const currentTime = nowIso();
  let changed = false;

  const nextTickets = tickets.map((ticket) => {
    if (ticket.orderId === orderId && ticket.status !== "cancelled") {
      changed = true;
      return {
        ...ticket,
        status: "cancelled" as const,
        updatedAt: currentTime,
      };
    }

    return ticket;
  });

  if (!changed) {
    return getTicketsByOrder(orderId);
  }

  persistTickets(nextTickets);

  const cancelledTickets = nextTickets.filter((ticket) => ticket.orderId === orderId);
  const firstTicket = cancelledTickets[0];

  if (firstTicket) {
    trackAnalyticsEvent({
      name: "tickets_cancelled",
      accountId: firstTicket.accountId ?? null,
      eventId: firstTicket.eventId,
      eventSlug: firstTicket.eventSlug,
      orderId,
      payload: {
        tickets: cancelledTickets.length,
      },
    });
  }

  return cancelledTickets;
};

export const ticketStorageChannel = TICKETS_CHANNEL;
