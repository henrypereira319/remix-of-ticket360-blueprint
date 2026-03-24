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
  type CheckoutOrderStatus,
} from "@/server/checkout.service";
import {
  getStoredNotifications,
  notificationStorageChannel,
  type NotificationRecord,
  type NotificationStatus,
} from "@/server/notification.service";
import {
  getPaymentByOrder,
  getStoredPayments,
  paymentStorageChannel,
  type PaymentRecord,
  type PaymentStatus,
} from "@/server/payment.service";
import {
  getStoredTickets,
  getTicketsByOrder,
  ticketStorageChannel,
  type IssuedTicketRecord,
  type IssuedTicketStatus,
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
  activeEventsCount: number;
  grossPlatformRevenue: number;
  netPlatformFeeRevenue: number;
  pendingPlatformFeeRevenue: number;
  totalOrders: number;
  submittedOrders: number;
  underReviewOrders: number;
  approvedOrders: number;
  cancelledOrders: number;
  grossOrderRevenue: number;
  approvedRevenue: number;
  cancelledRevenue: number;
  authorizedRevenue: number;
  refundedRevenue: number;
  pendingReviewRevenue: number;
  averageOrderValue: number;
  resolutionRate: number;
  approvalRate: number;
  ticketCoverageRate: number;
  notificationCoverageRate: number;
  issuedTickets: number;
  cancelledTickets: number;
  sentNotifications: number;
  failedNotifications: number;
  analyticsEvents: number;
  openDiagnostics: number;
  criticalDiagnostics: number;
  averageReviewAgeMinutes: number;
  oldestReviewAgeMinutes: number;
  averageIssueLeadTimeMinutes: number;
  lastActivityAt: string | null;
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

export interface BackofficeActivityPoint {
  label: string;
  orders: number;
  payments: number;
  tickets: number;
  notifications: number;
  analytics: number;
  revenue: number;
}

export interface BackofficeStatusSeriesPoint {
  key: string;
  label: string;
  count: number;
  amount: number;
}

export interface BackofficeCountSeriesPoint {
  key: string;
  label: string;
  count: number;
}

export interface BackofficeEventLoadPoint {
  eventSlug: string;
  orders: number;
  activeOrders: number;
  approvedOrders: number;
  reviewQueueOrders: number;
  revenue: number;
  platformFeeRevenue: number;
  tickets: number;
  notifications: number;
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
  activitySeries: BackofficeActivityPoint[];
  orderStatusSeries: BackofficeStatusSeriesPoint[];
  paymentStatusSeries: BackofficeStatusSeriesPoint[];
  ticketStatusSeries: BackofficeCountSeriesPoint[];
  notificationStatusSeries: BackofficeCountSeriesPoint[];
  eventLoadSeries: BackofficeEventLoadPoint[];
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

const PLATFORM_FEE_RATE = 0.1;

const activityHourFormatter = new Intl.DateTimeFormat("pt-BR", {
  hour: "2-digit",
  minute: "2-digit",
});

const activityDayFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
});

const orderStatusLabels: Record<CheckoutOrderStatus, string> = {
  submitted: "Submetidos",
  under_review: "Em revisao",
  approved: "Aprovados",
  cancelled: "Cancelados",
};

const paymentStatusLabels: Record<PaymentStatus, string> = {
  authorized: "Autorizados",
  under_review: "Em revisao",
  failed: "Falhos",
  expired: "Expirados",
  refunded: "Refund",
};

const ticketStatusLabels: Record<IssuedTicketStatus, string> = {
  issued: "Emitidos",
  used: "Usados",
  cancelled: "Cancelados",
};

const notificationStatusLabels: Record<NotificationStatus, string> = {
  queued: "Fila",
  sent: "Enviadas",
  failed: "Falhas",
};

const severityPriority: Record<BackofficeDiagnosticSeverity, number> = {
  critical: 3,
  warning: 2,
  info: 1,
  success: 0,
};

const getTimestamp = (value?: string | null) => {
  if (!value) {
    return null;
  }

  const parsed = new Date(value).getTime();
  return Number.isNaN(parsed) ? null : parsed;
};

const getMinutesSince = (value?: string | null) => {
  const parsed = getTimestamp(value);

  if (parsed === null) {
    return 0;
  }

  return Math.max(0, Math.round((Date.now() - parsed) / 60000));
};

const getMinutesBetween = (start?: string | null, end?: string | null) => {
  const startTs = getTimestamp(start);
  const endTs = getTimestamp(end);

  if (startTs === null || endTs === null || endTs < startTs) {
    return null;
  }

  return Math.round((endTs - startTs) / 60000);
};

const roundRate = (value: number, total: number) => {
  if (total === 0) {
    return 0;
  }

  return Math.round((value / total) * 1000) / 10;
};

const averageRounded = (values: number[]) => {
  if (values.length === 0) {
    return 0;
  }

  return Math.round(values.reduce((total, value) => total + value, 0) / values.length);
};

const roundCurrency = (value: number) => Math.round(value * 100) / 100;

const isCollectedPaymentStatus = (status: PaymentStatus) => status === "authorized" || status === "refunded";

const getOrderTicketSubtotal = (row: BackofficeOrderRow) =>
  row.order.tickets.reduce((total, ticket) => total + ticket.price, 0);

const getPlatformFeeRevenue = (row: BackofficeOrderRow) =>
  row.order.status === "approved" ? roundCurrency(getOrderTicketSubtotal(row) * PLATFORM_FEE_RATE) : 0;

const getPendingPlatformFeeRevenue = (row: BackofficeOrderRow) =>
  row.order.status === "under_review" ? roundCurrency(getOrderTicketSubtotal(row) * PLATFORM_FEE_RATE) : 0;

const getCollectedGrossRevenue = (row: BackofficeOrderRow) =>
  row.payment && isCollectedPaymentStatus(row.payment.status) ? row.payment.amount : 0;

const startOfHour = (timestamp: number) => {
  const date = new Date(timestamp);
  date.setMinutes(0, 0, 0);
  return date.getTime();
};

const startOfDay = (timestamp: number) => {
  const date = new Date(timestamp);
  date.setHours(0, 0, 0, 0);
  return date.getTime();
};

const formatBucketLabel = (timestamp: number, useDailyBuckets: boolean) =>
  useDailyBuckets
    ? activityDayFormatter.format(new Date(timestamp))
    : activityHourFormatter.format(new Date(timestamp));

type ActivitySeed =
  | { at?: string | null; kind: "orders"; revenue: number }
  | { at?: string | null; kind: "payments" | "tickets" | "notifications" | "analytics"; revenue?: never };

const buildActivitySeries = (
  orders: BackofficeOrderRow[],
  payments: PaymentRecord[],
  tickets: IssuedTicketRecord[],
  notifications: NotificationRecord[],
  analytics: AnalyticsEventRecord[],
): BackofficeActivityPoint[] => {
  const activitySeeds: ActivitySeed[] = [
    ...orders.map((row) => ({
      at: row.order.createdAt,
      kind: "orders" as const,
      revenue: row.order.pricing.total,
    })),
    ...payments.map((payment) => ({
      at: payment.createdAt,
      kind: "payments" as const,
    })),
    ...tickets.map((ticket) => ({
      at: ticket.issuedAt,
      kind: "tickets" as const,
    })),
    ...notifications.map((notification) => ({
      at: notification.createdAt,
      kind: "notifications" as const,
    })),
    ...analytics.map((event) => ({
      at: event.occurredAt,
      kind: "analytics" as const,
    })),
  ];

  const timestamps = activitySeeds
    .map((seed) => getTimestamp(seed.at))
    .filter((value): value is number => value !== null);
  const referenceTimestamp = timestamps.length > 0 ? Math.max(...timestamps) : Date.now();
  const oldestTimestamp = timestamps.length > 0 ? Math.min(...timestamps) : referenceTimestamp;
  const useDailyBuckets = referenceTimestamp - oldestTimestamp > 36 * 60 * 60 * 1000;
  const bucketSize = useDailyBuckets ? 24 * 60 * 60 * 1000 : 60 * 60 * 1000;
  const bucketCount = useDailyBuckets ? 7 : 6;
  const bucketEnd = useDailyBuckets ? startOfDay(referenceTimestamp) : startOfHour(referenceTimestamp);
  const firstBucketStart = bucketEnd - bucketSize * (bucketCount - 1);

  const series = Array.from({ length: bucketCount }, (_, index) => {
    const bucketStart = firstBucketStart + bucketSize * index;

    return {
      label: formatBucketLabel(bucketStart, useDailyBuckets),
      orders: 0,
      payments: 0,
      tickets: 0,
      notifications: 0,
      analytics: 0,
      revenue: 0,
    };
  });

  activitySeeds.forEach((seed) => {
    const timestamp = getTimestamp(seed.at);

    if (timestamp === null) {
      return;
    }

    const index = Math.floor((timestamp - firstBucketStart) / bucketSize);

    if (index < 0 || index >= series.length) {
      return;
    }

    series[index][seed.kind] += 1;

    if (seed.kind === "orders") {
      series[index].revenue += seed.revenue;
    }
  });

  return series;
};

const buildOrderStatusSeries = (orders: BackofficeOrderRow[]): BackofficeStatusSeriesPoint[] =>
  (Object.entries(orderStatusLabels) as [CheckoutOrderStatus, string][])
    .map(([status, label]) => ({
      key: status,
      label,
      count: orders.filter((row) => row.order.status === status).length,
      amount: orders
        .filter((row) => row.order.status === status)
        .reduce((total, row) => total + row.order.pricing.total, 0),
    }))
    .filter((item) => item.count > 0 || item.amount > 0);

const buildPaymentStatusSeries = (payments: PaymentRecord[]): BackofficeStatusSeriesPoint[] =>
  (Object.entries(paymentStatusLabels) as [PaymentStatus, string][])
    .map(([status, label]) => ({
      key: status,
      label,
      count: payments.filter((payment) => payment.status === status).length,
      amount: payments
        .filter((payment) => payment.status === status)
        .reduce((total, payment) => total + payment.amount, 0),
    }))
    .filter((item) => item.count > 0 || item.amount > 0);

const buildTicketStatusSeries = (tickets: IssuedTicketRecord[]): BackofficeCountSeriesPoint[] =>
  (Object.entries(ticketStatusLabels) as [IssuedTicketStatus, string][])
    .map(([status, label]) => ({
      key: status,
      label,
      count: tickets.filter((ticket) => ticket.status === status).length,
    }))
    .filter((item) => item.count > 0);

const buildNotificationStatusSeries = (notifications: NotificationRecord[]): BackofficeCountSeriesPoint[] =>
  (Object.entries(notificationStatusLabels) as [NotificationStatus, string][])
    .map(([status, label]) => ({
      key: status,
      label,
      count: notifications.filter((notification) => notification.status === status).length,
    }))
    .filter((item) => item.count > 0);

const buildEventLoadSeries = (orders: BackofficeOrderRow[]): BackofficeEventLoadPoint[] => {
  const grouped = new Map<string, BackofficeEventLoadPoint>();

  orders.forEach((row) => {
    const current = grouped.get(row.order.eventSlug) ?? {
      eventSlug: row.order.eventSlug,
      orders: 0,
      activeOrders: 0,
      approvedOrders: 0,
      reviewQueueOrders: 0,
      revenue: 0,
      platformFeeRevenue: 0,
      tickets: 0,
      notifications: 0,
    };

    current.orders += 1;
    current.revenue += getCollectedGrossRevenue(row);
    current.platformFeeRevenue += getPlatformFeeRevenue(row);
    current.tickets += row.tickets.length;
    current.notifications += row.notifications.length;

    if (row.order.status !== "cancelled") {
      current.activeOrders += 1;
    }

    if (row.order.status === "approved") {
      current.approvedOrders += 1;
    }

    if (row.order.status === "under_review") {
      current.reviewQueueOrders += 1;
    }

    grouped.set(row.order.eventSlug, current);
  });

  return [...grouped.values()]
    .sort(
      (left, right) =>
        right.reviewQueueOrders - left.reviewQueueOrders ||
        right.activeOrders - left.activeOrders ||
        right.revenue - left.revenue ||
        right.orders - left.orders,
    )
    .slice(0, 5);
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
  const orderReferenceById = new Map(orders.map((row) => [row.order.id, row.order.reference]));

  if (reviewQueue.length > 0) {
    const reviewQueueAges = reviewQueue.map((row) => getMinutesSince(row.order.createdAt));
    const oldestReviewMinutes = Math.max(...reviewQueueAges);

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
        .map((notification) => (notification.orderId ? orderReferenceById.get(notification.orderId) ?? notification.orderId : null))
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

  return diagnostics.sort(
    (left, right) =>
      severityPriority[right.severity] - severityPriority[left.severity] ||
      right.references.length - left.references.length ||
      left.title.localeCompare(right.title),
  );
};

export const getBackofficeSnapshot = (): BackofficeSnapshot => {
  const notifications = sortByDateDesc(getStoredNotifications());
  const analytics = sortByDateDesc(getStoredAnalyticsEvents());
  const payments = sortByDateDesc(getStoredPayments());
  const tickets = sortByDateDesc(getStoredTickets());
  const orders = sortByDateDesc(getStoredOrders()).map((order) => createOrderRow(order, notifications, analytics));
  const reviewQueue = orders.filter((row) => row.order.status === "under_review");
  const approvedOrders = orders.filter((row) => row.order.status === "approved");
  const cancelledOrders = orders.filter((row) => row.order.status === "cancelled");
  const activeOrders = orders.filter((row) => row.order.status !== "cancelled");
  const diagnostics = buildDiagnostics(orders, notifications);
  const runbooks = buildRunbooks();
  const activitySeries = buildActivitySeries(orders, payments, tickets, notifications, analytics);
  const orderStatusSeries = buildOrderStatusSeries(orders);
  const paymentStatusSeries = buildPaymentStatusSeries(payments);
  const ticketStatusSeries = buildTicketStatusSeries(tickets);
  const notificationStatusSeries = buildNotificationStatusSeries(notifications);
  const eventLoadSeries = buildEventLoadSeries(orders);
  const grossOrderRevenue = orders.reduce((total, row) => total + row.order.pricing.total, 0);
  const grossPlatformRevenue = roundCurrency(orders.reduce((total, row) => total + getCollectedGrossRevenue(row), 0));
  const netPlatformFeeRevenue = roundCurrency(orders.reduce((total, row) => total + getPlatformFeeRevenue(row), 0));
  const pendingPlatformFeeRevenue = roundCurrency(
    orders.reduce((total, row) => total + getPendingPlatformFeeRevenue(row), 0),
  );
  const approvedRevenue = approvedOrders.reduce((total, row) => total + row.order.pricing.total, 0);
  const cancelledRevenue = cancelledOrders.reduce((total, row) => total + row.order.pricing.total, 0);
  const pendingReviewRevenue = reviewQueue.reduce((total, row) => total + row.order.pricing.total, 0);
  const approvedOrdersWithTickets = approvedOrders.filter((row) =>
    row.tickets.some((ticket) => ticket.status === "issued" || ticket.status === "used"),
  ).length;
  const approvedOrdersWithNotifications = approvedOrders.filter(
    (row) =>
      row.notifications.some((notification) => notification.template === "order-confirmation") &&
      row.notifications.some((notification) => notification.template === "tickets-issued"),
  ).length;
  const reviewQueueAges = reviewQueue.map((row) => getMinutesSince(row.order.createdAt));
  const issueLeadTimes = approvedOrders
    .map((row) => {
      const firstIssuedTicket = row.tickets
        .filter((ticket) => ticket.status === "issued" || ticket.status === "used")
        .sort((left, right) => left.issuedAt.localeCompare(right.issuedAt))[0];

      return getMinutesBetween(row.order.createdAt, firstIssuedTicket?.issuedAt);
    })
    .filter((value): value is number => value !== null);
  const lastActivityTimestamp = [
    ...orders.map((row) => getTimestamp(row.order.updatedAt)),
    ...payments.map((payment) => getTimestamp(payment.updatedAt)),
    ...tickets.map((ticket) => getTimestamp(ticket.updatedAt)),
    ...notifications.map((notification) => getTimestamp(notification.sentAt ?? notification.createdAt)),
    ...analytics.map((event) => getTimestamp(event.occurredAt)),
  ]
    .filter((value): value is number => value !== null)
    .sort((left, right) => right - left)[0];

  const summary: BackofficeSummary = {
    activeEventsCount: new Set(activeOrders.map((row) => row.order.eventId)).size,
    grossPlatformRevenue,
    netPlatformFeeRevenue,
    pendingPlatformFeeRevenue,
    totalOrders: orders.length,
    submittedOrders: orders.filter((row) => row.order.status === "submitted").length,
    underReviewOrders: reviewQueue.length,
    approvedOrders: approvedOrders.length,
    cancelledOrders: cancelledOrders.length,
    grossOrderRevenue,
    approvedRevenue,
    cancelledRevenue,
    authorizedRevenue: payments
      .filter((payment) => payment.status === "authorized")
      .reduce((total, payment) => total + payment.amount, 0),
    refundedRevenue: payments
      .filter((payment) => payment.status === "refunded")
      .reduce((total, payment) => total + payment.amount, 0),
    pendingReviewRevenue,
    averageOrderValue: orders.length > 0 ? grossOrderRevenue / orders.length : 0,
    resolutionRate: roundRate(approvedOrders.length + cancelledOrders.length, orders.length),
    approvalRate: roundRate(approvedOrders.length, approvedOrders.length + cancelledOrders.length),
    ticketCoverageRate: roundRate(approvedOrdersWithTickets, approvedOrders.length),
    notificationCoverageRate: roundRate(approvedOrdersWithNotifications, approvedOrders.length),
    issuedTickets: tickets.filter((ticket) => ticket.status === "issued").length,
    cancelledTickets: tickets.filter((ticket) => ticket.status === "cancelled").length,
    sentNotifications: notifications.filter((notification) => notification.status === "sent").length,
    failedNotifications: notifications.filter((notification) => notification.status === "failed").length,
    analyticsEvents: analytics.length,
    openDiagnostics: diagnostics.filter((diagnostic) => diagnostic.severity !== "success").length,
    criticalDiagnostics: diagnostics.filter((diagnostic) => diagnostic.severity === "critical").length,
    averageReviewAgeMinutes: averageRounded(reviewQueueAges),
    oldestReviewAgeMinutes: reviewQueueAges.length > 0 ? Math.max(...reviewQueueAges) : 0,
    averageIssueLeadTimeMinutes: averageRounded(issueLeadTimes),
    lastActivityAt: lastActivityTimestamp ? new Date(lastActivityTimestamp).toISOString() : null,
  };

  return {
    summary,
    reviewQueue,
    orders,
    payments,
    tickets,
    notifications,
    analytics,
    diagnostics,
    runbooks,
    activitySeries,
    orderStatusSeries,
    paymentStatusSeries,
    ticketStatusSeries,
    notificationStatusSeries,
    eventLoadSeries,
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
