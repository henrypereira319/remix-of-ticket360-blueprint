import type { CheckoutOrderPaymentMethod, CheckoutOrderRecord, CheckoutOrderStatus } from "@/server/checkout.service";
import type { NotificationRecord, NotificationStatus, NotificationTemplate } from "@/server/notification.service";
import type { PaymentRecord, PaymentStatus } from "@/server/payment.service";
import type { IssuedTicketRecord, IssuedTicketStatus } from "@/server/ticket.service";

export type AccountOrderStatusFilter = "all" | CheckoutOrderStatus;
export type AccountStatusTone = "neutral" | "success" | "warning" | "danger";

export interface AccountStatusMeta {
  label: string;
  tone: AccountStatusTone;
}

export interface OrderTimelineItem {
  id: string;
  occurredAt: string;
  title: string;
  description: string;
  tone: AccountStatusTone;
}

export const orderStatusMeta: Record<CheckoutOrderStatus, AccountStatusMeta> = {
  submitted: {
    label: "Recebido",
    tone: "neutral",
  },
  under_review: {
    label: "Em revisao",
    tone: "warning",
  },
  approved: {
    label: "Aprovado",
    tone: "success",
  },
  cancelled: {
    label: "Cancelado",
    tone: "danger",
  },
};

export const paymentStatusMeta: Record<PaymentStatus, AccountStatusMeta> = {
  authorized: {
    label: "Autorizado",
    tone: "success",
  },
  under_review: {
    label: "Em revisao",
    tone: "warning",
  },
  failed: {
    label: "Falhou",
    tone: "danger",
  },
  expired: {
    label: "Expirado",
    tone: "danger",
  },
  refunded: {
    label: "Reembolsado",
    tone: "neutral",
  },
};

export const ticketStatusMeta: Record<IssuedTicketStatus, AccountStatusMeta> = {
  issued: {
    label: "Emitido",
    tone: "success",
  },
  used: {
    label: "Utilizado",
    tone: "neutral",
  },
  cancelled: {
    label: "Cancelado",
    tone: "danger",
  },
};

export const notificationStatusMeta: Record<NotificationStatus, AccountStatusMeta> = {
  queued: {
    label: "Na fila",
    tone: "warning",
  },
  sent: {
    label: "Enviado",
    tone: "success",
  },
  failed: {
    label: "Falhou",
    tone: "danger",
  },
};

export const notificationTemplateLabels: Record<NotificationTemplate, string> = {
  "order-confirmation": "Confirmacao do pedido",
  "tickets-issued": "Emissao de ingressos",
  "payment-under-review": "Pagamento em revisao",
  "order-cancelled": "Cancelamento do pedido",
};

export const paymentMethodLabels: Record<CheckoutOrderPaymentMethod, string> = {
  pix: "Pix",
  card: "Cartao",
  corporate: "Corporativo",
};

const capitalize = (value: string) => value.charAt(0).toUpperCase() + value.slice(1);

export const humanizeEventSlug = (slug: string) =>
  slug
    .split("-")
    .filter(Boolean)
    .map(capitalize)
    .join(" ");

export const maskEmail = (value: string) => {
  const [localPart, domain] = value.split("@");

  if (!localPart || !domain) {
    return value;
  }

  if (localPart.length <= 2) {
    return `${localPart[0] ?? ""}***@${domain}`;
  }

  return `${localPart.slice(0, 2)}***${localPart.slice(-1)}@${domain}`;
};

export const maskDocument = (value: string) => {
  const normalized = value.replace(/\D/g, "");

  if (normalized.length <= 4) {
    return value;
  }

  return `${normalized.slice(0, 3)}.***.***-${normalized.slice(-2)}`;
};

export const filterOrdersByStatus = (
  orders: CheckoutOrderRecord[],
  status: AccountOrderStatusFilter,
): CheckoutOrderRecord[] => {
  if (status === "all") {
    return orders;
  }

  return orders.filter((order) => order.status === status);
};

export const buildOrderTimeline = (input: {
  order: CheckoutOrderRecord;
  payment: PaymentRecord | null;
  tickets: IssuedTicketRecord[];
  notifications: NotificationRecord[];
}): OrderTimelineItem[] => {
  const { order, payment, tickets, notifications } = input;
  const timeline: OrderTimelineItem[] = [
    {
      id: `${order.id}-created`,
      occurredAt: order.createdAt,
      title: "Pedido criado",
      description: `${order.reference} entrou na fila com ${order.tickets.length} ingresso(s).`,
      tone: "neutral",
    },
  ];

  if (payment) {
    timeline.push({
      id: `${payment.id}-status`,
      occurredAt: payment.authorizedAt ?? payment.updatedAt ?? payment.createdAt,
      title:
        payment.status === "authorized"
          ? "Pagamento autorizado"
          : payment.status === "under_review"
            ? "Pagamento em revisao"
            : payment.status === "refunded"
              ? "Pagamento reembolsado"
              : payment.status === "expired"
                ? "Pagamento expirado"
                : "Pagamento falhou",
      description: `${paymentMethodLabels[payment.method]} via ${payment.provider} no valor de R$ ${payment.amount
        .toFixed(2)
        .replace(".", ",")}.`,
      tone: paymentStatusMeta[payment.status].tone,
    });
  }

  if (order.status !== "submitted" || order.updatedAt !== order.createdAt) {
    timeline.push({
      id: `${order.id}-status`,
      occurredAt: order.updatedAt,
      title:
        order.status === "approved"
          ? "Pedido aprovado"
          : order.status === "under_review"
            ? "Pedido em revisao"
            : order.status === "cancelled"
              ? "Pedido cancelado"
              : "Pedido atualizado",
      description: `Status atual: ${orderStatusMeta[order.status].label}.`,
      tone: orderStatusMeta[order.status].tone,
    });
  }

  const issuedTickets = tickets.filter((ticket) => ticket.status === "issued");
  const cancelledTickets = tickets.filter((ticket) => ticket.status === "cancelled");
  const usedTickets = tickets.filter((ticket) => ticket.status === "used");

  if (issuedTickets.length > 0) {
    const firstIssuedAt = [...issuedTickets].sort((left, right) => left.issuedAt.localeCompare(right.issuedAt))[0]?.issuedAt;

    if (firstIssuedAt) {
      timeline.push({
        id: `${order.id}-tickets-issued`,
        occurredAt: firstIssuedAt,
        title: "Ingressos emitidos",
        description: `${issuedTickets.length} ingresso(s) liberados para wallet e QR code.`,
        tone: "success",
      });
    }
  }

  if (usedTickets.length > 0) {
    const usedAt = [...usedTickets].sort((left, right) => left.updatedAt.localeCompare(right.updatedAt))[0]?.updatedAt;

    if (usedAt) {
      timeline.push({
        id: `${order.id}-tickets-used`,
        occurredAt: usedAt,
        title: "Ingressos utilizados",
        description: `${usedTickets.length} ingresso(s) ja passaram pela portaria local.`,
        tone: "neutral",
      });
    }
  }

  if (cancelledTickets.length > 0) {
    const cancelledAt = [...cancelledTickets].sort((left, right) => left.updatedAt.localeCompare(right.updatedAt))[0]?.updatedAt;

    if (cancelledAt) {
      timeline.push({
        id: `${order.id}-tickets-cancelled`,
        occurredAt: cancelledAt,
        title: "Ingressos cancelados",
        description: `${cancelledTickets.length} ingresso(s) tiveram o QR desativado.`,
        tone: "danger",
      });
    }
  }

  notifications.forEach((notification) => {
    timeline.push({
      id: notification.id,
      occurredAt: notification.sentAt ?? notification.createdAt,
      title: notificationTemplateLabels[notification.template],
      description: `${notificationStatusMeta[notification.status].label} para ${notification.recipient}.`,
      tone: notificationStatusMeta[notification.status].tone,
    });
  });

  return timeline.sort((left, right) => right.occurredAt.localeCompare(left.occurredAt));
};
