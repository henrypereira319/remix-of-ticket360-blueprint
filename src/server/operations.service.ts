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
  openDiagnostics: number;
  criticalDiagnostics: number;
}

export type BackofficeDiagnosticSeverity = "success" | "info" | "warning" | "critical";

export interface BackofficeDiagnostic {
  id: string;
  severity: BackofficeDiagnosticSeverity;
  title: string;
  summary: string;
  metricLabel?: string;
  metricValue?: string;
  references: string[];
  actions: string[];
}

export interface BackofficeRunbook {
  id: string;
  title: string;
  summary: string;
  trigger: string;
  steps: string[];
  successCriteria: string[];
}

export interface BackofficeSnapshot {
  summary: BackofficeSummary;
  reviewQueue: BackofficeOrderRow[];
  orders: BackofficeOrderRow[];
  payments: PaymentRecord[];
  tickets: IssuedTicketRecord[];
  notifications: NotificationRecord[];
  analytics: AnalyticsEventRecord[];
  diagnostics: BackofficeDiagnostic[];
  runbooks: BackofficeRunbook[];
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

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const getMinutesSince = (value?: string | null) => {
  if (!value) {
    return 0;
  }

  const parsed = new Date(value).getTime();

  if (Number.isNaN(parsed)) {
    return 0;
  }

  return Math.max(0, Math.round((Date.now() - parsed) / 60000));
};

const buildRunbooks = (): BackofficeRunbook[] => [
  {
    id: "approve-under-review-order",
    title: "Aprovar pedido em revisao",
    summary: "Fluxo padrao para liquidar um pedido corporativo/manual e liberar os ingressos.",
    trigger: "Use quando um pedido estiver em under_review e os dados do comprador, setores e pagamento estiverem coerentes.",
    steps: [
      "Conferir comprador, titulares e assentos antes de agir.",
      "Validar protocolo corporativo, metodo de pagamento e valor total.",
      "Aprovar o pedido para autorizar pagamento e emitir os tickets.",
      "Confirmar que o pedido saiu da fila e que tickets/notificacoes apareceram nos paineis relacionados.",
    ],
    successCriteria: [
      "Pedido com status approved.",
      "Pagamento com status authorized.",
      "Ao menos um ticket com status issued.",
      "Notificacoes de confirmacao e emissao registradas.",
    ],
  },
  {
    id: "deny-or-cancel-order",
    title: "Negar ou cancelar pedido",
    summary: "Procedimento para encerrar um pedido sem deixar inventario, pagamento ou ticket em estado incorreto.",
    trigger: "Use quando houver divergencia comercial, reprovação manual ou cancelamento depois da aprovacao.",
    steps: [
      "Identificar se o pedido ainda esta em revisao ou ja foi aprovado.",
      "Negar pedidos pendentes ou cancelar pedidos aprovados pelo backoffice.",
      "Conferir refund local, liberacao do inventario e cancelamento dos tickets vinculados.",
      "Validar que a notificacao de cancelamento apareceu na outbox e que o pedido ficou com status cancelled.",
    ],
    successCriteria: [
      "Pedido com status cancelled.",
      "Pagamento com status refunded quando existir.",
      "Tickets com status cancelled ou inexistentes para pedidos nao emitidos.",
      "Assentos voltaram para available quando aplicavel.",
    ],
  },
  {
    id: "triage-diagnostics",
    title: "Triagem de diagnosticos",
    summary: "Roteiro rapido para interpretar alertas operacionais antes de intervir manualmente.",
    trigger: "Use quando a aba de diagnosticos apontar backlog, gaps de emissao, refund ou entrega.",
    steps: [
      "Ler a severidade do alerta e abrir os pedidos de referencia listados.",
      "Cruzar status de pedido, pagamento, tickets e notificacoes antes de agir.",
      "Resolver primeiro alertas criticos que possam bloquear acesso ou gerar perda comercial.",
      "Revalidar os contadores do dashboard para confirmar que o alerta desapareceu depois da acao.",
    ],
    successCriteria: [
      "Nao ha gaps criticos de refund, emissao ou confirmacao.",
      "A fila de revisao esta dentro do ritmo esperado para o ambiente.",
      "Os pedidos citados no alerta passaram a refletir estados coerentes entre dominios.",
    ],
  },
];

const buildDiagnostics = (orders: BackofficeOrderRow[], notifications: NotificationRecord[]): BackofficeDiagnostic[] => {
  const diagnostics: BackofficeDiagnostic[] = [];
  const reviewQueue = orders.filter((row) => row.order.status === "under_review");
  const approvedMissingTickets = orders.filter(
    (row) => row.order.status === "approved" && row.tickets.filter((ticket) => ticket.status === "issued").length === 0,
  );
  const approvedMissingNotifications = orders.filter(
    (row) =>
      row.order.status === "approved" &&
      (!row.notifications.some((notification) => notification.template === "order-confirmation") ||
        !row.notifications.some((notification) => notification.template === "tickets-issued")),
  );
  const cancelledRefundGaps = orders.filter(
    (row) => row.order.status === "cancelled" && row.payment && row.payment.status !== "refunded",
  );
  const cancelledTicketGaps = orders.filter(
    (row) => row.order.status === "cancelled" && row.tickets.some((ticket) => ticket.status !== "cancelled"),
  );
  const failedNotifications = notifications.filter((notification) => notification.status === "failed");

  if (reviewQueue.length > 0) {
    const oldestReviewMinutes = reviewQueue.reduce(
      (currentOldest, row) => Math.max(currentOldest, getMinutesSince(row.order.createdAt)),
      0,
    );

    diagnostics.push({
      id: "review-queue-backlog",
      severity: oldestReviewMinutes >= 30 ? "critical" : "warning",
      title: oldestReviewMinutes >= 30 ? "Fila de revisao envelhecida" : "Fila de revisao ativa",
      summary:
        oldestReviewMinutes >= 30
          ? "Existem pedidos esperando ha mais tempo do que o ideal para um fluxo manual local."
          : "Existem pedidos aguardando acao manual para liberar pagamento e emissao.",
      metricLabel: "Pedidos em revisao",
      metricValue: `${reviewQueue.length} pedidos · ${currencyFormatter.format(
        reviewQueue.reduce((total, row) => total + row.order.pricing.total, 0),
      )}`,
      references: reviewQueue.map((row) => row.order.reference).slice(0, 4),
      actions: [
        "Priorizar os pedidos listados na fila de revisao.",
        "Conferir protocolo corporativo, comprador e assentos antes da aprovacao.",
        "Depois da acao, validar se os tickets e notificacoes foram gerados.",
      ],
    });
  }

  if (approvedMissingTickets.length > 0) {
    diagnostics.push({
      id: "approved-orders-missing-tickets",
      severity: "critical",
      title: "Pedidos aprovados sem ticket emitido",
      summary: "Ha pedidos aprovados que nao geraram ingressos emitidos, o que bloqueia a experiencia de acesso.",
      metricLabel: "Gap de emissao",
      metricValue: `${approvedMissingTickets.length} pedido(s)`,
      references: approvedMissingTickets.map((row) => row.order.reference).slice(0, 4),
      actions: [
        "Abrir os pedidos citados e conferir o status do pagamento.",
        "Validar se houve falha entre aprovacao e emissao.",
        "Nao considerar o fluxo encerrado ate haver ticket emitido ou cancelamento formal.",
      ],
    });
  }

  if (approvedMissingNotifications.length > 0) {
    diagnostics.push({
      id: "approved-orders-missing-notifications",
      severity: "warning",
      title: "Pedidos aprovados com entrega incompleta",
      summary: "Ha pedidos aprovados sem todas as notificacoes esperadas de confirmacao e emissao.",
      metricLabel: "Gap de comunicacao",
      metricValue: `${approvedMissingNotifications.length} pedido(s)`,
      references: approvedMissingNotifications.map((row) => row.order.reference).slice(0, 4),
      actions: [
        "Conferir a outbox dos pedidos citados.",
        "Validar se confirmacao e emissao apareceram para o comprador.",
        "Tratar como entrega incompleta ate que ambas as mensagens estejam registradas.",
      ],
    });
  }

  if (cancelledRefundGaps.length > 0) {
    diagnostics.push({
      id: "cancelled-orders-missing-refund",
      severity: "critical",
      title: "Cancelamentos sem refund",
      summary: "Existem pedidos cancelados cujo pagamento ainda nao foi marcado como refunded.",
      metricLabel: "Gap financeiro",
      metricValue: `${cancelledRefundGaps.length} pedido(s)`,
      references: cancelledRefundGaps.map((row) => row.order.reference).slice(0, 4),
      actions: [
        "Conferir o pagamento vinculado ao pedido cancelado.",
        "Nao fechar o caso enquanto o refund local nao estiver refletido.",
        "Revalidar tambem liberacao de inventario e comunicacao de cancelamento.",
      ],
    });
  }

  if (cancelledTicketGaps.length > 0) {
    diagnostics.push({
      id: "cancelled-orders-with-active-tickets",
      severity: "critical",
      title: "Cancelamentos com ticket ainda ativo",
      summary: "Ha tickets que continuam ativos mesmo depois do pedido ter sido cancelado.",
      metricLabel: "Gap de acesso",
      metricValue: `${cancelledTicketGaps.length} pedido(s)`,
      references: cancelledTicketGaps.map((row) => row.order.reference).slice(0, 4),
      actions: [
        "Abrir os tickets do pedido citado e conferir o status atual.",
        "Tratar como risco de acesso indevido ate que o ticket esteja cancelado.",
        "Revalidar o wallet e os codigos expostos ao comprador.",
      ],
    });
  }

  if (failedNotifications.length > 0) {
    diagnostics.push({
      id: "notification-failures",
      severity: "warning",
      title: "Falhas de notificacao detectadas",
      summary: "A outbox local registra notificacoes com falha que merecem rechecagem manual.",
      metricLabel: "Falhas na outbox",
      metricValue: `${failedNotifications.length} item(ns)`,
      references: failedNotifications
        .map((notification) => notification.orderId)
        .filter((value): value is string => Boolean(value))
        .slice(0, 4),
      actions: [
        "Inspecionar o template e o destinatario das notificacoes falhadas.",
        "Confirmar se o pedido teve comunicacao alternativa ou se segue sem entrega.",
        "Usar a trilha do pedido para verificar se a falha afetou o pos-compra.",
      ],
    });
  }

  if (diagnostics.length === 0) {
    diagnostics.push({
      id: "operations-healthy",
      severity: "success",
      title: "Operacao local sem gaps abertos",
      summary: "Pedidos, pagamentos, tickets e notificacoes estao consistentes nos cenarios atualmente persistidos.",
      metricLabel: "Estado atual",
      metricValue: "Sem alertas",
      references: [],
      actions: [
        "Continuar monitorando fila de revisao, refunds e emissao conforme novos pedidos entrarem.",
      ],
    });
  }

  return diagnostics;
};

export const getBackofficeSnapshot = (): BackofficeSnapshot => {
  const notifications = sortByDateDesc(getStoredNotifications());
  const analytics = sortByDateDesc(getStoredAnalyticsEvents());
  const payments = sortByDateDesc(getStoredPayments());
  const tickets = sortByDateDesc(getStoredTickets());
  const orders = sortByDateDesc(getStoredOrders()).map((order) => createOrderRow(order, notifications, analytics));
  const diagnostics = buildDiagnostics(orders, notifications);
  const runbooks = buildRunbooks();

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
    openDiagnostics: diagnostics.filter((diagnostic) => diagnostic.severity !== "success").length,
    criticalDiagnostics: diagnostics.filter((diagnostic) => diagnostic.severity === "critical").length,
  };

  return {
    summary,
    reviewQueue: orders.filter((row) => row.order.status === "under_review"),
    orders,
    payments,
    tickets,
    notifications,
    analytics,
    diagnostics,
    runbooks,
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
