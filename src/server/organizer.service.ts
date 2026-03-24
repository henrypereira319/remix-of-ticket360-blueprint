import { events, type EventData } from "@/data/events";
import {
  analyticsStorageChannel,
  getStoredAnalyticsEvents,
  type AnalyticsEventRecord,
} from "@/server/analytics.service";
import {
  checkoutStorageChannel,
  getStoredOrders,
  type CheckoutOrderRecord,
} from "@/server/checkout.service";
import {
  getStoredNotifications,
  notificationStorageChannel,
  type NotificationRecord,
} from "@/server/notification.service";
import {
  getStoredPayments,
  paymentStorageChannel,
  type PaymentRecord,
} from "@/server/payment.service";
import {
  getStoredTickets,
  ticketStorageChannel,
  type IssuedTicketRecord,
} from "@/server/ticket.service";

export const organizerStorageChannels = [
  checkoutStorageChannel,
  paymentStorageChannel,
  ticketStorageChannel,
  notificationStorageChannel,
  analyticsStorageChannel,
] as const;

export type OrganizerEventStatus = "published" | "selling" | "attention";
export type OrganizerPublicationStatus = "draft" | "published" | "cancelled" | "archived";

export type OrganizerCatalogEvent = Pick<
  EventData,
  "id" | "slug" | "title" | "category" | "city" | "venueName" | "summary" | "priceFrom" | "details"
>;

export interface OrganizerEventSnapshot {
  event: OrganizerCatalogEvent;
  status: OrganizerEventStatus;
  publicationStatus: OrganizerPublicationStatus;
  publishedAt: string | null;
  diagnostics: string[];
  totalOrders: number;
  activeOrders: number;
  approvedOrders: number;
  underReviewOrders: number;
  cancelledOrders: number;
  grossRevenue: number;
  authorizedRevenue: number;
  refundedRevenue: number;
  platformFeeRevenue: number;
  pendingPlatformFeeRevenue: number;
  issuedTickets: number;
  cancelledTickets: number;
  sentNotifications: number;
  failedNotifications: number;
  analyticsEvents: number;
  latestOrderAt: string | null;
  lastActivityAt: string | null;
}

export interface OrganizerSummary {
  totalEvents: number;
  publishedEvents: number;
  eventsWithOrders: number;
  eventsWithoutOrders: number;
  attentionEvents: number;
  totalOrders: number;
  underReviewOrders: number;
  grossRevenue: number;
  authorizedRevenue: number;
  refundedRevenue: number;
  platformFeeRevenue: number;
  pendingPlatformFeeRevenue: number;
  issuedTickets: number;
  sentNotifications: number;
}

export interface OrganizerSnapshot {
  summary: OrganizerSummary;
  events: OrganizerEventSnapshot[];
  attention: OrganizerEventSnapshot[];
  portfolio: OrganizerEventSnapshot[];
  quiet: OrganizerEventSnapshot[];
}

const PLATFORM_FEE_RATE = 0.1;

const getTimestamp = (value?: string | null) => {
  if (!value) {
    return null;
  }

  const parsed = new Date(value).getTime();
  return Number.isNaN(parsed) ? null : parsed;
};

const getLatestIso = (values: Array<string | null | undefined>) => {
  const timestamps = values
    .map((value) => getTimestamp(value))
    .filter((value): value is number => value !== null)
    .sort((left, right) => right - left);

  return timestamps[0] ? new Date(timestamps[0]).toISOString() : null;
};

const roundCurrency = (value: number) => Math.round(value * 100) / 100;
const toOrganizerCatalogEvent = (event: EventData): OrganizerCatalogEvent => ({
  id: event.id,
  slug: event.slug,
  title: event.title,
  category: event.category,
  city: event.city,
  venueName: event.venueName,
  summary: event.summary,
  priceFrom: event.priceFrom,
  details: event.details,
});

const buildEventDiagnostics = (input: {
  orders: CheckoutOrderRecord[];
  payments: PaymentRecord[];
  tickets: IssuedTicketRecord[];
  notifications: NotificationRecord[];
}) => {
  const diagnostics: string[] = [];

  if (input.orders.some((order) => order.status === "under_review")) {
    diagnostics.push("Fila manual aberta para aprovar ou negar pedidos.");
  }

  if (input.orders.some((order) => order.status === "approved") && input.tickets.length === 0) {
    diagnostics.push("Pedido aprovado sem ticket emitido nesta base local.");
  }

  if (input.notifications.some((notification) => notification.status === "failed")) {
    diagnostics.push("Existem falhas de comunicação pendentes de revisão.");
  }

  if (
    input.orders.some((order) => order.status === "cancelled") &&
    input.payments.some((payment) => payment.status !== "refunded")
  ) {
    diagnostics.push("Há cancelamentos que pedem conferência financeira.");
  }

  if (diagnostics.length === 0) {
    if (input.orders.length === 0) {
      diagnostics.push("Evento publicado sem operação iniciada no ambiente local.");
    } else {
      diagnostics.push("Operação coerente entre venda, emissão e comunicação.");
    }
  }

  return diagnostics;
};

const resolveEventStatus = (input: {
  underReviewOrders: number;
  failedNotifications: number;
  totalOrders: number;
  issuedTickets: number;
}) => {
  if (input.underReviewOrders > 0 || input.failedNotifications > 0) {
    return "attention" as const;
  }

  if (input.totalOrders > 0 || input.issuedTickets > 0) {
    return "selling" as const;
  }

  return "published" as const;
};

const buildEventSnapshot = (
  event: EventData,
  orders: CheckoutOrderRecord[],
  payments: PaymentRecord[],
  tickets: IssuedTicketRecord[],
  notifications: NotificationRecord[],
  analytics: AnalyticsEventRecord[],
): OrganizerEventSnapshot => {
  const totalOrders = orders.length;
  const activeOrders = orders.filter((order) => order.status !== "cancelled").length;
  const approvedOrders = orders.filter((order) => order.status === "approved").length;
  const underReviewOrders = orders.filter((order) => order.status === "under_review").length;
  const cancelledOrders = orders.filter((order) => order.status === "cancelled").length;
  const grossRevenue = roundCurrency(payments.reduce((total, payment) => total + payment.amount, 0));
  const authorizedRevenue = roundCurrency(
    payments
      .filter((payment) => payment.status === "authorized")
      .reduce((total, payment) => total + payment.amount, 0),
  );
  const refundedRevenue = roundCurrency(
    payments
      .filter((payment) => payment.status === "refunded")
      .reduce((total, payment) => total + payment.amount, 0),
  );
  const platformFeeRevenue = roundCurrency(
    orders
      .filter((order) => order.status === "approved")
      .reduce(
        (total, order) => total + order.tickets.reduce((subtotal, ticket) => subtotal + ticket.price, 0) * PLATFORM_FEE_RATE,
        0,
      ),
  );
  const pendingPlatformFeeRevenue = roundCurrency(
    orders
      .filter((order) => order.status === "under_review")
      .reduce(
        (total, order) => total + order.tickets.reduce((subtotal, ticket) => subtotal + ticket.price, 0) * PLATFORM_FEE_RATE,
        0,
      ),
  );
  const issuedTickets = tickets.filter((ticket) => ticket.status === "issued").length;
  const cancelledTickets = tickets.filter((ticket) => ticket.status === "cancelled").length;
  const sentNotifications = notifications.filter((notification) => notification.status === "sent").length;
  const failedNotifications = notifications.filter((notification) => notification.status === "failed").length;
  const latestOrderAt = getLatestIso(orders.map((order) => order.updatedAt));
  const lastActivityAt = getLatestIso([
    ...orders.map((order) => order.updatedAt),
    ...payments.map((payment) => payment.updatedAt),
    ...tickets.map((ticket) => ticket.updatedAt),
    ...notifications.map((notification) => notification.sentAt ?? notification.createdAt),
    ...analytics.map((eventRecord) => eventRecord.occurredAt),
  ]);

  return {
    event: toOrganizerCatalogEvent(event),
    status: resolveEventStatus({
      underReviewOrders,
      failedNotifications,
      totalOrders,
      issuedTickets,
    }),
    publicationStatus: "published",
    publishedAt: null,
    diagnostics: buildEventDiagnostics({ orders, payments, tickets, notifications }),
    totalOrders,
    activeOrders,
    approvedOrders,
    underReviewOrders,
    cancelledOrders,
    grossRevenue,
    authorizedRevenue,
    refundedRevenue,
    platformFeeRevenue,
    pendingPlatformFeeRevenue,
    issuedTickets,
    cancelledTickets,
    sentNotifications,
    failedNotifications,
    analyticsEvents: analytics.length,
    latestOrderAt,
    lastActivityAt,
  };
};

export const getOrganizerSnapshot = (): OrganizerSnapshot => {
  const orders = getStoredOrders();
  const payments = getStoredPayments();
  const tickets = getStoredTickets();
  const notifications = getStoredNotifications();
  const analytics = getStoredAnalyticsEvents();

  const eventSnapshots = events
    .map((event) =>
      buildEventSnapshot(
        event,
        orders.filter((order) => order.eventId === event.id),
        payments.filter((payment) => payment.eventId === event.id),
        tickets.filter((ticket) => ticket.eventId === event.id),
        notifications.filter((notification) => notification.eventId === event.id),
        analytics.filter((eventRecord) => eventRecord.eventId === event.id),
      ),
    )
    .sort(
      (left, right) =>
        (right.status === "attention" ? 2 : right.status === "selling" ? 1 : 0) -
          (left.status === "attention" ? 2 : left.status === "selling" ? 1 : 0) ||
        right.grossRevenue - left.grossRevenue ||
        right.totalOrders - left.totalOrders ||
        left.event.title.localeCompare(right.event.title),
    );

  const summary: OrganizerSummary = {
    totalEvents: eventSnapshots.length,
    publishedEvents: eventSnapshots.length,
    eventsWithOrders: eventSnapshots.filter((event) => event.totalOrders > 0).length,
    eventsWithoutOrders: eventSnapshots.filter((event) => event.totalOrders === 0).length,
    attentionEvents: eventSnapshots.filter((event) => event.status === "attention").length,
    totalOrders: eventSnapshots.reduce((total, event) => total + event.totalOrders, 0),
    underReviewOrders: eventSnapshots.reduce((total, event) => total + event.underReviewOrders, 0),
    grossRevenue: roundCurrency(eventSnapshots.reduce((total, event) => total + event.grossRevenue, 0)),
    authorizedRevenue: roundCurrency(eventSnapshots.reduce((total, event) => total + event.authorizedRevenue, 0)),
    refundedRevenue: roundCurrency(eventSnapshots.reduce((total, event) => total + event.refundedRevenue, 0)),
    platformFeeRevenue: roundCurrency(eventSnapshots.reduce((total, event) => total + event.platformFeeRevenue, 0)),
    pendingPlatformFeeRevenue: roundCurrency(
      eventSnapshots.reduce((total, event) => total + event.pendingPlatformFeeRevenue, 0),
    ),
    issuedTickets: eventSnapshots.reduce((total, event) => total + event.issuedTickets, 0),
    sentNotifications: eventSnapshots.reduce((total, event) => total + event.sentNotifications, 0),
  };

  return {
    summary,
    events: eventSnapshots,
    attention: eventSnapshots.filter((event) => event.status === "attention"),
    portfolio: eventSnapshots.filter((event) => event.totalOrders > 0),
    quiet: eventSnapshots.filter((event) => event.totalOrders === 0),
  };
};
