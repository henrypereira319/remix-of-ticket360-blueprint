import {
  analyticsStorageChannel,
  getStoredAnalyticsEvents,
  type AnalyticsEventRecord,
} from "@/server/analytics.service";
import {
  cancelCheckoutOrder,
  checkoutStorageChannel,
  getStoredOrders,
  settleOrderPayment,
  type CheckoutOrderRecord,
} from "@/server/checkout.service";
import {
  getStoredNotifications,
  notificationStorageChannel,
  type NotificationRecord,
} from "@/server/notification.service";
import {
  getPaymentByOrder,
  getStoredPayments,
  paymentStorageChannel,
  type PaymentRecord,
} from "@/server/payment.service";
import {
  getStoredTickets,
  getTicketsByOrder,
  ticketStorageChannel,
  type IssuedTicketRecord,
} from "@/server/ticket.service";

export const operationsStorageChannels = [
  checkoutStorageChannel,
  paymentStorageChannel,
  ticketStorageChannel,
  notificationStorageChannel,
  analyticsStorageChannel,
] as const;

export interface BackofficeOrderRow {
  order: CheckoutOrderRecord;
  payment: PaymentRecord | null;
  tickets: IssuedTicketRecord[];
  notifications: NotificationRecord[];
  analytics: AnalyticsEventRecord[];
}

export interface BackofficeSummary {
  totalOrders: number;
  submittedOrders: number;
  underReviewOrders: number;
  approvedOrders: number;
  cancelledOrders: number;
  authorizedRevenue: number;
  refundedRevenue: number;
  pendingReviewRevenue: number;
  issuedTickets: number;
  cancelledTickets: number;
  sentNotifications: number;
  analyticsEvents: number;
}

export interface BackofficeSnapshot {
  summary: BackofficeSummary;
  reviewQueue: BackofficeOrderRow[];
  orders: BackofficeOrderRow[];
  payments: PaymentRecord[];
  tickets: IssuedTicketRecord[];
  notifications: NotificationRecord[];
  analytics: AnalyticsEventRecord[];
}

const sortByDateDesc = <T extends { createdAt?: string; issuedAt?: string; occurredAt?: string }>(items: T[]) =>
  [...items].sort((left, right) => {
    const leftDate = left.createdAt ?? left.issuedAt ?? left.occurredAt ?? "";
    const rightDate = right.createdAt ?? right.issuedAt ?? right.occurredAt ?? "";
    return rightDate.localeCompare(leftDate);
  });

const createOrderRow = (
  order: CheckoutOrderRecord,
  notifications: NotificationRecord[],
  analytics: AnalyticsEventRecord[],
): BackofficeOrderRow => ({
  order,
  payment: getPaymentByOrder(order.id) ?? null,
  tickets: getTicketsByOrder(order.id),
  notifications: notifications.filter((notification) => notification.orderId === order.id),
  analytics: analytics.filter((event) => event.orderId === order.id),
});

export const getBackofficeSnapshot = (): BackofficeSnapshot => {
  const notifications = sortByDateDesc(getStoredNotifications());
  const analytics = sortByDateDesc(getStoredAnalyticsEvents());
  const payments = sortByDateDesc(getStoredPayments());
  const tickets = sortByDateDesc(getStoredTickets());
  const orders = sortByDateDesc(getStoredOrders()).map((order) => createOrderRow(order, notifications, analytics));

  const summary: BackofficeSummary = {
    totalOrders: orders.length,
    submittedOrders: orders.filter((row) => row.order.status === "submitted").length,
    underReviewOrders: orders.filter((row) => row.order.status === "under_review").length,
    approvedOrders: orders.filter((row) => row.order.status === "approved").length,
    cancelledOrders: orders.filter((row) => row.order.status === "cancelled").length,
    authorizedRevenue: payments
      .filter((payment) => payment.status === "authorized")
      .reduce((total, payment) => total + payment.amount, 0),
    refundedRevenue: payments
      .filter((payment) => payment.status === "refunded")
      .reduce((total, payment) => total + payment.amount, 0),
    pendingReviewRevenue: payments
      .filter((payment) => payment.status === "under_review")
      .reduce((total, payment) => total + payment.amount, 0),
    issuedTickets: tickets.filter((ticket) => ticket.status === "issued").length,
    cancelledTickets: tickets.filter((ticket) => ticket.status === "cancelled").length,
    sentNotifications: notifications.filter((notification) => notification.status === "sent").length,
    analyticsEvents: analytics.length,
  };

  return {
    summary,
    reviewQueue: orders.filter((row) => row.order.status === "under_review"),
    orders,
    payments,
    tickets,
    notifications,
    analytics,
  };
};

export const approveOrderFromBackoffice = (orderId: string) => settleOrderPayment(orderId);

export const denyOrderFromBackoffice = (orderId: string) => {
  const order = getStoredOrders().find((item) => item.id === orderId);

  if (!order) {
    throw new Error("Pedido nao encontrado para revisao.");
  }

  if (!["under_review", "submitted"].includes(order.status)) {
    throw new Error("Somente pedidos pendentes de revisao podem ser negados.");
  }

  return cancelCheckoutOrder(orderId);
};

export const cancelOrderFromBackoffice = (orderId: string) => cancelCheckoutOrder(orderId);
