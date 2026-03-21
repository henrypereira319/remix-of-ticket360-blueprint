import type { CheckoutOrderRecord } from "@/server/checkout.service";
import { trackAnalyticsEvent } from "@/server/analytics.service";
import type { PaymentRecord } from "@/server/payment.service";
import type { IssuedTicketRecord } from "@/server/ticket.service";
import { createPersistentId, emitStorageMutation, readStorageJson, writeStorageJson } from "@/server/storage";

const NOTIFICATIONS_STORAGE_KEY = "eventhub.notifications";
const NOTIFICATIONS_CHANNEL = "notifications";

export type NotificationChannel = "email";
export type NotificationTemplate = "order-confirmation" | "tickets-issued" | "payment-under-review" | "order-cancelled";
export type NotificationStatus = "queued" | "sent" | "failed";

export interface NotificationRecord {
  id: string;
  accountId?: string | null;
  orderId?: string | null;
  eventId: string;
  eventSlug: string;
  channel: NotificationChannel;
  template: NotificationTemplate;
  recipient: string;
  subject: string;
  preview: string;
  status: NotificationStatus;
  createdAt: string;
  sentAt?: string | null;
  metadata?: Record<string, string | number | boolean | null>;
}

const nowIso = () => new Date().toISOString();

export const getStoredNotifications = () => readStorageJson<NotificationRecord[]>(NOTIFICATIONS_STORAGE_KEY, []);

const persistNotifications = (notifications: NotificationRecord[]) => {
  writeStorageJson(NOTIFICATIONS_STORAGE_KEY, notifications);
  emitStorageMutation(NOTIFICATIONS_CHANNEL);
};

export const getNotificationsByAccount = (accountId?: string | null) =>
  accountId ? getStoredNotifications().filter((notification) => notification.accountId === accountId) : [];

const hasNotificationTemplate = (orderId: string, template: NotificationTemplate) =>
  getStoredNotifications().some((notification) => notification.orderId === orderId && notification.template === template);

export const dispatchPaymentUnderReviewNotification = (
  order: CheckoutOrderRecord,
  payment: PaymentRecord,
): NotificationRecord => {
  const existing = getStoredNotifications().find(
    (notification) => notification.orderId === order.id && notification.template === "payment-under-review",
  );

  if (existing) {
    return existing;
  }

  const createdAt = nowIso();
  const notification: NotificationRecord = {
    id: createPersistentId("notification"),
    accountId: order.accountId ?? null,
    orderId: order.id,
    eventId: order.eventId,
    eventSlug: order.eventSlug,
    channel: "email",
    template: "payment-under-review",
    recipient: order.buyer.email,
    subject: `Pedido ${order.reference} em revisao`,
    preview: `O pagamento ${payment.reference} esta aguardando analise manual antes da emissao dos ingressos.`,
    status: "sent",
    createdAt,
    sentAt: createdAt,
    metadata: {
      paymentReference: payment.reference,
      paymentMethod: payment.method,
      status: payment.status,
    },
  };

  persistNotifications([notification, ...getStoredNotifications()]);

  trackAnalyticsEvent({
    name: "notifications_dispatched",
    accountId: order.accountId ?? null,
    eventId: order.eventId,
    eventSlug: order.eventSlug,
    orderId: order.id,
    payload: {
      notifications: 1,
      template: "payment-under-review",
    },
  });

  return notification;
};

export const dispatchOrderNotifications = (order: CheckoutOrderRecord, tickets: IssuedTicketRecord[]): NotificationRecord[] => {
  const existingNotifications = getStoredNotifications().filter(
    (notification) =>
      notification.orderId === order.id &&
      (notification.template === "order-confirmation" || notification.template === "tickets-issued"),
  );

  if (existingNotifications.length === 2) {
    return existingNotifications;
  }

  const createdAt = nowIso();
  const notificationPayloads: NotificationRecord[] = [];

  if (!hasNotificationTemplate(order.id, "order-confirmation")) {
    notificationPayloads.push({
      id: createPersistentId("notification"),
      accountId: order.accountId ?? null,
      orderId: order.id,
      eventId: order.eventId,
      eventSlug: order.eventSlug,
      channel: "email",
      template: "order-confirmation",
      recipient: order.buyer.email,
      subject: `Pedido ${order.reference} confirmado`,
      preview: `Recebemos o pedido de ${order.tickets.length} ingresso(s) para ${order.eventSlug}.`,
      status: "sent",
      createdAt,
      sentAt: createdAt,
      metadata: {
        paymentMethod: order.paymentMethod,
        tickets: order.tickets.length,
        total: order.pricing.total,
      },
    });
  }

  if (!hasNotificationTemplate(order.id, "tickets-issued")) {
    notificationPayloads.push({
      id: createPersistentId("notification"),
      accountId: order.accountId ?? null,
      orderId: order.id,
      eventId: order.eventId,
      eventSlug: order.eventSlug,
      channel: "email",
      template: "tickets-issued",
      recipient: order.buyer.email,
      subject: `Ingressos ${order.reference} emitidos`,
      preview: `${tickets.length} ingresso(s) ficaram disponiveis na sua area da conta.`,
      status: "sent",
      createdAt,
      sentAt: createdAt,
      metadata: {
        issuedTickets: tickets.length,
      },
    });
  }

  if (notificationPayloads.length === 0) {
    return existingNotifications;
  }

  persistNotifications([...notificationPayloads, ...getStoredNotifications()]);

  trackAnalyticsEvent({
    name: "notifications_dispatched",
    accountId: order.accountId ?? null,
    eventId: order.eventId,
    eventSlug: order.eventSlug,
    orderId: order.id,
    payload: {
      notifications: notificationPayloads.length,
    },
  });

  return notificationPayloads;
};

export const dispatchOrderCancelledNotification = (order: CheckoutOrderRecord): NotificationRecord => {
  const existing = getStoredNotifications().find(
    (notification) => notification.orderId === order.id && notification.template === "order-cancelled",
  );

  if (existing) {
    return existing;
  }

  const createdAt = nowIso();
  const notification: NotificationRecord = {
    id: createPersistentId("notification"),
    accountId: order.accountId ?? null,
    orderId: order.id,
    eventId: order.eventId,
    eventSlug: order.eventSlug,
    channel: "email",
    template: "order-cancelled",
    recipient: order.buyer.email,
    subject: `Pedido ${order.reference} cancelado`,
    preview: `Seu pedido foi cancelado localmente e os assentos voltaram para disponibilidade do evento.`,
    status: "sent",
    createdAt,
    sentAt: createdAt,
    metadata: {
      paymentMethod: order.paymentMethod,
      total: order.pricing.total,
    },
  };

  persistNotifications([notification, ...getStoredNotifications()]);

  trackAnalyticsEvent({
    name: "notifications_dispatched",
    accountId: order.accountId ?? null,
    eventId: order.eventId,
    eventSlug: order.eventSlug,
    orderId: order.id,
    payload: {
      notifications: 1,
      template: "order-cancelled",
    },
  });

  return notification;
};

export const notificationStorageChannel = NOTIFICATIONS_CHANNEL;
