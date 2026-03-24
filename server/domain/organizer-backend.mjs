import { withDbClient } from "../db/client.mjs";
import { appendAuditLog, asObject, toMoney } from "./helpers.mjs";
import { setEventPublicationStatus, syncEventSnapshot } from "./catalog-backend.mjs";
import { getRuntimeEventBySlugFromDb } from "./catalog-view-backend.mjs";

const PLATFORM_FEE_RATE = 0.1;

const getTimestamp = (value) => {
  if (!value) {
    return null;
  }

  const parsed = new Date(value).getTime();
  return Number.isNaN(parsed) ? null : parsed;
};

const getLatestIso = (values) => {
  const timestamps = values
    .map((value) => getTimestamp(value))
    .filter((value) => value !== null)
    .sort((left, right) => right - left);

  return timestamps[0] ? new Date(timestamps[0]).toISOString() : null;
};

const roundCurrency = (value) => Math.round(value * 100) / 100;

const pushMapArray = (map, key, value) => {
  map.set(key, [...(map.get(key) ?? []), value]);
};

const mapCatalogEvent = (eventRow) => {
  const metadata = asObject(eventRow.metadata);
  const details = asObject(metadata.details);

  return {
    id: eventRow.id,
    slug: eventRow.slug,
    title: eventRow.title,
    category: eventRow.category,
    city: eventRow.city,
    venueName: eventRow.venue_name ?? eventRow.city,
    summary: eventRow.summary ?? "",
    priceFrom: toMoney(eventRow.price_from),
    details: {
      organizer: details.organizer ?? "Organizador local",
      address: details.address ?? eventRow.venue_address ?? "",
      openingTime: details.openingTime ?? "",
      ageRating: details.ageRating ?? "",
      agePolicy: details.agePolicy ?? "",
      paymentInfo: details.paymentInfo ?? "",
      salesInfo: details.salesInfo ?? "",
      infoParagraphs: Array.isArray(details.infoParagraphs) ? details.infoParagraphs : [],
      importantNotice: details.importantNotice ?? "",
      ticketPolicies: Array.isArray(details.ticketPolicies) ? details.ticketPolicies : [],
    },
  };
};

const buildEventDiagnostics = (input) => {
  const diagnostics = [];

  if (input.publicationStatus === "draft") {
    diagnostics.push("Evento salvo no backend, mas ainda nao esta publicado no catalogo.");
  }

  if (input.publicationStatus === "cancelled") {
    diagnostics.push("Evento cancelado no backend e fora da operacao comercial.");
  }

  if (input.publicationStatus === "archived") {
    diagnostics.push("Evento arquivado no backend, mantido apenas para historico e auditoria.");
  }

  if (input.orders.some((order) => order.status === "under_review")) {
    diagnostics.push("Fila manual aberta para aprovar ou negar pedidos.");
  }

  if (input.orders.some((order) => order.status === "approved") && input.tickets.length === 0) {
    diagnostics.push("Pedido aprovado sem ticket emitido no backend.");
  }

  if (input.notifications.some((notification) => notification.status === "failed")) {
    diagnostics.push("Existem falhas de comunicacao pendentes de revisao.");
  }

  if (
    input.orders.some((order) => order.status === "cancelled") &&
    input.payments.some((payment) => payment.status !== "refunded")
  ) {
    diagnostics.push("Ha cancelamentos que pedem conferencia financeira.");
  }

  if (diagnostics.length === 0) {
    if (input.orders.length === 0) {
      diagnostics.push("Evento publicado sem operacao iniciada no backend.");
    } else {
      diagnostics.push("Operacao coerente entre venda, emissao e comunicacao.");
    }
  }

  return diagnostics;
};

const resolveEventStatus = (input) => {
  if (input.underReviewOrders > 0 || input.failedNotifications > 0) {
    return "attention";
  }

  if (input.totalOrders > 0 || input.issuedTickets > 0) {
    return "selling";
  }

  return "published";
};

const buildEventSnapshot = (eventRow, orders, payments, tickets, notifications, analytics) => {
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
      .reduce((total, order) => total + order.platformFeeTotal, 0),
  );
  const pendingPlatformFeeRevenue = roundCurrency(
    orders
      .filter((order) => order.status === "under_review")
      .reduce((total, order) => total + order.platformFeeTotal, 0),
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
    event: mapCatalogEvent(eventRow),
    status: resolveEventStatus({
      underReviewOrders,
      failedNotifications,
      totalOrders,
      issuedTickets,
    }),
    publicationStatus: eventRow.status,
    publishedAt: eventRow.published_at,
    diagnostics: buildEventDiagnostics({
      publicationStatus: eventRow.status,
      orders,
      payments,
      tickets,
      notifications,
    }),
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

export const syncOrganizerCatalogSnapshots = async (eventSnapshots) => {
  for (const eventSnapshot of Array.isArray(eventSnapshots) ? eventSnapshots : []) {
    await syncEventSnapshot(eventSnapshot);
  }
};

export const getOrganizerEventEditorFromDb = async (eventIdOrSlug) => {
  const event = await getRuntimeEventBySlugFromDb(eventIdOrSlug, {
    publishedOnly: false,
  });

  if (!event) {
    throw new Error("Evento nao encontrado para edicao.");
  }

  return event;
};

export const getOrganizerSnapshotFromDb = async () =>
  withDbClient(async (client) => {
    const eventsResult = await client.query(
      `
        select e.*, v.name as venue_name, v.address as venue_address
        from public.events e
        left join public.venues v on v.id = e.venue_id
        order by e.updated_at desc, e.title asc
      `,
    );
    const ordersResult = await client.query(
      `
        select o.*
        from public.orders o
        order by o.created_at desc
      `,
    );
    const paymentsResult = await client.query(
      `
        select p.*, o.event_id
        from public.payments p
        inner join public.orders o on o.id = p.order_id
        order by p.created_at desc
      `,
    );
    const ticketsResult = await client.query(
      `
        select t.*
        from public.tickets t
        order by t.issued_at desc
      `,
    );
    const notificationsResult = await client.query(
      `
        select n.*
        from public.notifications n
        order by n.created_at desc
      `,
    );
    const analyticsResult = await client.query(
      `
        select a.*
        from public.analytics_events a
        order by a.occurred_at desc
      `,
    );

    const ordersByEventId = new Map();
    ordersResult.rows.forEach((row) => {
      pushMapArray(ordersByEventId, row.event_id, {
        id: row.id,
        status: row.status,
        total: toMoney(row.total),
        platformFeeTotal: toMoney(row.platform_fee_total),
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      });
    });

    const paymentsByEventId = new Map();
    paymentsResult.rows.forEach((row) => {
      pushMapArray(paymentsByEventId, row.event_id, {
        id: row.id,
        status: row.status,
        amount: toMoney(row.amount),
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      });
    });

    const ticketsByEventId = new Map();
    ticketsResult.rows.forEach((row) => {
      pushMapArray(ticketsByEventId, row.event_id, {
        id: row.id,
        status: row.status,
        issuedAt: row.issued_at,
        updatedAt: row.updated_at,
      });
    });

    const notificationsByEventId = new Map();
    notificationsResult.rows.forEach((row) => {
      if (row.event_id) {
        pushMapArray(notificationsByEventId, row.event_id, {
          id: row.id,
          status: row.status,
          createdAt: row.created_at,
          sentAt: row.sent_at,
        });
      }
    });

    const analyticsByEventId = new Map();
    analyticsResult.rows.forEach((row) => {
      if (row.event_id) {
        pushMapArray(analyticsByEventId, row.event_id, {
          id: row.id,
          occurredAt: row.occurred_at,
        });
      }
    });

    const eventSnapshots = eventsResult.rows
      .map((eventRow) =>
        buildEventSnapshot(
          eventRow,
          ordersByEventId.get(eventRow.id) ?? [],
          paymentsByEventId.get(eventRow.id) ?? [],
          ticketsByEventId.get(eventRow.id) ?? [],
          notificationsByEventId.get(eventRow.id) ?? [],
          analyticsByEventId.get(eventRow.id) ?? [],
        ),
      )
      .sort(
        (left, right) =>
          (right.status === "attention" ? 2 : right.status === "selling" ? 1 : 0) -
            (left.status === "attention" ? 2 : left.status === "selling" ? 1 : 0) ||
          (right.publicationStatus === "published" ? 1 : 0) - (left.publicationStatus === "published" ? 1 : 0) ||
          right.grossRevenue - left.grossRevenue ||
          right.totalOrders - left.totalOrders ||
          left.event.title.localeCompare(right.event.title),
      );

    const summary = {
      totalEvents: eventSnapshots.length,
      publishedEvents: eventSnapshots.filter((event) => event.publicationStatus === "published").length,
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
  });

export const publishOrganizerEventFromDb = async (eventIdOrSlug, actor = {}) => {
  const event = await setEventPublicationStatus(eventIdOrSlug, "published", actor);

  return {
    id: event.id,
    slug: event.slug,
    publicationStatus: event.status,
    publishedAt: event.publishedAt,
  };
};

export const unpublishOrganizerEventFromDb = async (eventIdOrSlug, actor = {}) => {
  const event = await setEventPublicationStatus(eventIdOrSlug, "draft", actor);

  return {
    id: event.id,
    slug: event.slug,
    publicationStatus: event.status,
    publishedAt: event.publishedAt,
  };
};

export const archiveOrganizerEventFromDb = async (eventIdOrSlug, actor = {}) => {
  const event = await setEventPublicationStatus(eventIdOrSlug, "archived", actor);

  return {
    id: event.id,
    slug: event.slug,
    publicationStatus: event.status,
    publishedAt: event.publishedAt,
  };
};

export const saveOrganizerEventFromDb = async (eventSnapshot, actor = {}) =>
  withDbClient(async (client) => {
    const synced = await syncEventSnapshot(eventSnapshot, { client });

    await appendAuditLog(client, {
      actorType: actor.actorType ?? "operator",
      actorId: actor.actorId ?? null,
      actorEmail: actor.actorEmail ?? null,
      action: "event.upserted",
      targetTable: "events",
      targetId: synced.event.id,
      context: {
        slug: synced.event.slug,
        title: synced.event.title,
        publicationStatus: synced.event.status,
        startsAt: synced.session.startsAt,
      },
    });

    return {
      id: synced.event.id,
      slug: synced.event.slug,
      publicationStatus: synced.event.status,
      publishedAt: synced.event.publishedAt,
    };
  });

export const estimatePlatformFeeForEvent = (amount) => roundCurrency(Number(amount ?? 0) * PLATFORM_FEE_RATE);
