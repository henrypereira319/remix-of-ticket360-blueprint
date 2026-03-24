import { withDbClient } from "../db/client.mjs";
import { approveOrder, cancelOrder, getOrderGraph } from "./ticketing-backend.mjs";
import { asObject, toMoney } from "./helpers.mjs";

const sortByDateDesc = (items) =>
  [...items].sort((left, right) => {
    const leftDate = left.createdAt ?? left.issuedAt ?? left.occurredAt ?? "";
    const rightDate = right.createdAt ?? right.issuedAt ?? right.occurredAt ?? "";
    return String(rightDate).localeCompare(String(leftDate));
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

const orderStatusLabels = {
  submitted: "Submetidos",
  under_review: "Em revisao",
  approved: "Aprovados",
  cancelled: "Cancelados",
};

const paymentStatusLabels = {
  authorized: "Autorizados",
  under_review: "Em revisao",
  failed: "Falhos",
  expired: "Expirados",
  refunded: "Refund",
};

const ticketStatusLabels = {
  issued: "Emitidos",
  used: "Usados",
  cancelled: "Cancelados",
};

const notificationStatusLabels = {
  queued: "Fila",
  sent: "Enviadas",
  failed: "Falhas",
};

const severityPriority = {
  critical: 3,
  warning: 2,
  info: 1,
  success: 0,
};

const getTimestamp = (value) => {
  if (!value) {
    return null;
  }

  const parsed = new Date(value).getTime();
  return Number.isNaN(parsed) ? null : parsed;
};

const getMinutesSince = (value) => {
  const parsed = getTimestamp(value);

  if (parsed === null) {
    return 0;
  }

  return Math.max(0, Math.round((Date.now() - parsed) / 60000));
};

const getMinutesBetween = (start, end) => {
  const startTs = getTimestamp(start);
  const endTs = getTimestamp(end);

  if (startTs === null || endTs === null || endTs < startTs) {
    return null;
  }

  return Math.round((endTs - startTs) / 60000);
};

const roundRate = (value, total) => {
  if (total === 0) {
    return 0;
  }

  return Math.round((value / total) * 1000) / 10;
};

const averageRounded = (values) => {
  if (values.length === 0) {
    return 0;
  }

  return Math.round(values.reduce((total, value) => total + value, 0) / values.length);
};

const roundCurrency = (value) => Math.round(value * 100) / 100;
const isCollectedPaymentStatus = (status) => status === "authorized" || status === "refunded";
const getOrderTicketSubtotal = (row) => row.order.tickets.reduce((total, ticket) => total + ticket.price, 0);
const getPlatformFeeRevenue = (row) =>
  row.order.status === "approved" ? roundCurrency(getOrderTicketSubtotal(row) * PLATFORM_FEE_RATE) : 0;
const getPendingPlatformFeeRevenue = (row) =>
  row.order.status === "under_review" ? roundCurrency(getOrderTicketSubtotal(row) * PLATFORM_FEE_RATE) : 0;
const getCollectedGrossRevenue = (row) =>
  row.payment && isCollectedPaymentStatus(row.payment.status) ? row.payment.amount : 0;

const startOfHour = (timestamp) => {
  const date = new Date(timestamp);
  date.setMinutes(0, 0, 0);
  return date.getTime();
};

const startOfDay = (timestamp) => {
  const date = new Date(timestamp);
  date.setHours(0, 0, 0, 0);
  return date.getTime();
};

const formatBucketLabel = (timestamp, useDailyBuckets) =>
  useDailyBuckets ? activityDayFormatter.format(new Date(timestamp)) : activityHourFormatter.format(new Date(timestamp));

const pushMapArray = (map, key, value) => {
  map.set(key, [...(map.get(key) ?? []), value]);
};

const buildActivitySeries = (orders, payments, tickets, notifications, analytics) => {
  const activitySeeds = [
    ...orders.map((row) => ({
      at: row.order.createdAt,
      kind: "orders",
      revenue: row.order.pricing.total,
    })),
    ...payments.map((payment) => ({
      at: payment.createdAt,
      kind: "payments",
    })),
    ...tickets.map((ticket) => ({
      at: ticket.issuedAt,
      kind: "tickets",
    })),
    ...notifications.map((notification) => ({
      at: notification.createdAt,
      kind: "notifications",
    })),
    ...analytics.map((event) => ({
      at: event.occurredAt,
      kind: "analytics",
    })),
  ];

  const timestamps = activitySeeds.map((seed) => getTimestamp(seed.at)).filter((value) => value !== null);
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

const buildOrderStatusSeries = (orders) =>
  Object.entries(orderStatusLabels)
    .map(([status, label]) => ({
      key: status,
      label,
      count: orders.filter((row) => row.order.status === status).length,
      amount: orders
        .filter((row) => row.order.status === status)
        .reduce((total, row) => total + row.order.pricing.total, 0),
    }))
    .filter((item) => item.count > 0 || item.amount > 0);

const buildPaymentStatusSeries = (payments) =>
  Object.entries(paymentStatusLabels)
    .map(([status, label]) => ({
      key: status,
      label,
      count: payments.filter((payment) => payment.status === status).length,
      amount: payments
        .filter((payment) => payment.status === status)
        .reduce((total, payment) => total + payment.amount, 0),
    }))
    .filter((item) => item.count > 0 || item.amount > 0);

const buildTicketStatusSeries = (tickets) =>
  Object.entries(ticketStatusLabels)
    .map(([status, label]) => ({
      key: status,
      label,
      count: tickets.filter((ticket) => ticket.status === status).length,
    }))
    .filter((item) => item.count > 0);

const buildNotificationStatusSeries = (notifications) =>
  Object.entries(notificationStatusLabels)
    .map(([status, label]) => ({
      key: status,
      label,
      count: notifications.filter((notification) => notification.status === status).length,
    }))
    .filter((item) => item.count > 0);

const buildEventLoadSeries = (orders) => {
  const grouped = new Map();

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

const buildRunbooks = () => [
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

const buildDiagnostics = (orders, notifications) => {
  const diagnostics = [];
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
        .filter(Boolean)
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
      actions: ["Continuar monitorando fila de revisao, refunds e emissao conforme novos pedidos entrarem."],
    });
  }

  return diagnostics.sort(
    (left, right) =>
      severityPriority[right.severity] - severityPriority[left.severity] ||
      right.references.length - left.references.length ||
      left.title.localeCompare(right.title),
  );
};

const mapOrderRows = (orderRows, orderItemsByOrderId, paymentByOrderId, ticketsByOrderId, notificationsByOrderId, analyticsByOrderId) =>
  orderRows.map((row) => ({
    order: {
      id: row.id,
      reference: row.reference,
      status: row.status,
      eventId: row.event_id,
      eventSlug: row.event_slug,
      accountId: row.account_id,
      holdToken: row.hold_token,
      paymentMethod: row.payment_method,
      installments: row.installments,
      buyer: {
        fullName: row.buyer_full_name,
        email: row.buyer_email,
        document: row.buyer_document,
        phone: row.buyer_phone,
        city: row.buyer_city,
      },
      tickets: orderItemsByOrderId.get(row.id) ?? [],
      pricing: {
        subtotal: toMoney(row.subtotal),
        serviceFee: toMoney(row.service_fee),
        processingFee: toMoney(row.processing_fee),
        total: toMoney(row.total),
      },
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    },
    payment: paymentByOrderId.get(row.id) ?? null,
    tickets: ticketsByOrderId.get(row.id) ?? [],
    notifications: notificationsByOrderId.get(row.id) ?? [],
    analytics: analyticsByOrderId.get(row.id) ?? [],
  }));

export const getBackofficeSnapshotFromDb = async () =>
  withDbClient(async (client) => {
    const ordersResult = await client.query(
      `
        select o.*, e.slug as event_slug
        from public.orders o
        inner join public.events e on e.id = o.event_id
        order by o.created_at desc
      `,
    );
    const itemsResult = await client.query("select oi.* from public.order_items oi order by oi.created_at asc");
    const paymentsResult = await client.query(
      `
        select p.*, o.reference as order_reference, o.event_id, e.slug as event_slug, o.account_id
        from public.payments p
        inner join public.orders o on o.id = p.order_id
        inner join public.events e on e.id = o.event_id
        order by p.created_at desc
      `,
    );
    const ticketsResult = await client.query(
      `
        select t.*, o.reference as order_reference, e.slug as event_slug
        from public.tickets t
        inner join public.orders o on o.id = t.order_id
        inner join public.events e on e.id = t.event_id
        order by t.issued_at desc
      `,
    );
    const notificationsResult = await client.query(
      `
        select n.*, e.slug as event_slug
        from public.notifications n
        left join public.events e on e.id = n.event_id
        order by n.created_at desc
      `,
    );
    const analyticsResult = await client.query(
      `
        select a.*, e.slug as event_slug
        from public.analytics_events a
        left join public.events e on e.id = a.event_id
        order by a.occurred_at desc
      `,
    );

    const orderItemsByOrderId = new Map();
    itemsResult.rows.forEach((row) => {
      pushMapArray(orderItemsByOrderId, row.order_id, {
        seatId: row.seat_id,
        label: row.label,
        sectionId: row.section_id,
        sectionName: row.section_name,
        basePrice: toMoney(row.base_price),
        price: toMoney(row.price),
        ticketCategory: row.ticket_category,
        holderName: row.holder_name,
        document: row.holder_document,
      });
    });

    const payments = sortByDateDesc(
      paymentsResult.rows.map((row) => ({
        id: row.id,
        orderId: row.order_id,
        orderReference: row.order_reference,
        eventId: row.event_id,
        eventSlug: row.event_slug,
        accountId: row.account_id,
        method: row.method,
        provider: row.provider,
        status: row.status,
        amount: toMoney(row.amount),
        currency: row.currency,
        installments: row.installments,
        reference: row.reference,
        pixPayload: row.pix_payload,
        pixCopyPaste: row.pix_copy_paste,
        pixExpiresAt: row.pix_expires_at,
        maskedCard: row.masked_card,
        corporateProtocol: row.corporate_protocol,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        authorizedAt: row.authorized_at,
      })),
    );
    const paymentByOrderId = new Map(payments.map((payment) => [payment.orderId, payment]));

    const tickets = sortByDateDesc(
      ticketsResult.rows.map((row) => ({
        id: row.id,
        orderId: row.order_id,
        orderReference: row.order_reference,
        eventId: row.event_id,
        eventSlug: row.event_slug,
        accountId: row.account_id,
        seatId: row.seat_id,
        label: row.label,
        sectionId: asObject(row.metadata).sectionId ?? row.seat_id ?? "",
        sectionName: row.section_name,
        holderName: row.holder_name,
        document: row.holder_document,
        qrPayload: row.qr_payload,
        barcode: row.barcode,
        walletToken: row.wallet_token,
        walletUrl: row.wallet_url,
        status: row.status,
        issuedAt: row.issued_at,
        updatedAt: row.updated_at,
      })),
    );
    const ticketsByOrderId = new Map();
    tickets.forEach((ticket) => pushMapArray(ticketsByOrderId, ticket.orderId, ticket));

    const notifications = sortByDateDesc(
      notificationsResult.rows.map((row) => ({
        id: row.id,
        accountId: row.account_id,
        orderId: row.order_id,
        eventId: row.event_id,
        eventSlug: row.event_slug,
        channel: row.channel,
        template: row.template,
        recipient: row.recipient,
        subject: row.subject,
        preview: row.preview,
        status: row.status,
        createdAt: row.created_at,
        sentAt: row.sent_at,
        metadata: asObject(row.metadata),
      })),
    );
    const notificationsByOrderId = new Map();
    notifications.forEach((notification) => {
      if (notification.orderId) {
        pushMapArray(notificationsByOrderId, notification.orderId, notification);
      }
    });

    const analytics = sortByDateDesc(
      analyticsResult.rows.map((row) => ({
        id: row.id,
        name: row.name,
        accountId: row.account_id,
        eventId: row.event_id,
        eventSlug: row.event_slug,
        orderId: row.order_id,
        occurredAt: row.occurred_at,
        payload: asObject(row.payload),
      })),
    );
    const analyticsByOrderId = new Map();
    analytics.forEach((event) => {
      if (event.orderId) {
        pushMapArray(analyticsByOrderId, event.orderId, event);
      }
    });

    const orders = mapOrderRows(
      ordersResult.rows,
      orderItemsByOrderId,
      paymentByOrderId,
      ticketsByOrderId,
      notificationsByOrderId,
      analyticsByOrderId,
    );
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
          .sort((left, right) => String(left.issuedAt ?? "").localeCompare(String(right.issuedAt ?? "")))[0];

        return getMinutesBetween(row.order.createdAt, firstIssuedTicket?.issuedAt);
      })
      .filter((value) => value !== null);
    const lastActivityTimestamp = [
      ...orders.map((row) => getTimestamp(row.order.updatedAt)),
      ...payments.map((payment) => getTimestamp(payment.updatedAt)),
      ...tickets.map((ticket) => getTimestamp(ticket.updatedAt)),
      ...notifications.map((notification) => getTimestamp(notification.sentAt ?? notification.createdAt)),
      ...analytics.map((event) => getTimestamp(event.occurredAt)),
    ]
      .filter((value) => value !== null)
      .sort((left, right) => right - left)[0];

    const summary = {
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
  });

export const approveOrderFromDb = async (orderId, actor = {}) => {
  const graph = await approveOrder(orderId, actor);
  return {
    id: graph.order.id,
    reference: graph.order.reference,
    status: graph.order.status,
  };
};

export const denyOrderFromDb = async (orderId, actor = {}) => {
  const graph = await getOrderGraph(orderId);

  if (!["under_review", "submitted"].includes(graph.order.status)) {
    throw new Error("Somente pedidos pendentes de revisao podem ser negados.");
  }

  const cancelled = await cancelOrder(orderId, actor);
  return {
    id: cancelled.order.id,
    reference: cancelled.order.reference,
    status: cancelled.order.status,
  };
};

export const cancelOrderFromDb = async (orderId, actor = {}) => {
  const cancelled = await cancelOrder(orderId, actor);
  return {
    id: cancelled.order.id,
    reference: cancelled.order.reference,
    status: cancelled.order.status,
  };
};
