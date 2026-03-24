import { withDbClient } from "../db/client.mjs";
import { asArray, asObject } from "./helpers.mjs";
import { getEventCatalogGraph, searchPublishedCatalogSlugs } from "./catalog-backend.mjs";

const accessibleTags = new Set(["wheelchair", "low-vision", "reduced-mobility"]);

const monthFormatter = new Intl.DateTimeFormat("pt-BR", {
  month: "short",
  timeZone: "America/Sao_Paulo",
});

const weekdayFormatter = new Intl.DateTimeFormat("pt-BR", {
  weekday: "short",
  timeZone: "America/Sao_Paulo",
});

const dayFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  timeZone: "America/Sao_Paulo",
});

const timeFormatter = new Intl.DateTimeFormat("pt-BR", {
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
  timeZone: "America/Sao_Paulo",
});

const normalizeToken = (value) => {
  const normalized = String(value ?? "").replace(/\.$/, "").trim();
  return normalized ? normalized.charAt(0).toUpperCase() + normalized.slice(1) : "";
};

const toDateParts = (startsAt) => {
  if (!startsAt) {
    return {
      month: "",
      day: "",
      weekday: "",
      time: "",
    };
  }

  const date = new Date(startsAt);

  return {
    month: normalizeToken(monthFormatter.format(date)),
    day: dayFormatter.format(date),
    weekday: normalizeToken(weekdayFormatter.format(date)),
    time: timeFormatter.format(date),
  };
};

const getPrimarySession = (sessions) =>
  [...asArray(sessions)].sort((left, right) => new Date(left.startsAt).getTime() - new Date(right.startsAt).getTime())[0] ?? null;

const getFallbackSeatStatus = (seat) => {
  if (seat.status === "accessible") {
    return "accessible";
  }

  return asArray(seat.tags).some((tag) => accessibleTags.has(tag)) ? "accessible" : "available";
};

const buildSectionStats = (sections, seats) =>
  Object.fromEntries(
    asArray(sections).map((section) => [
      section.id,
      {
        total: seats.filter((seat) => seat.sectionId === section.id).length,
        selectable: seats.filter(
          (seat) => seat.sectionId === section.id && ["available", "accessible"].includes(seat.status),
        ).length,
      },
    ]),
  );

const buildEventDetails = (event, metadata) => {
  const details = asObject(metadata.details);
  const infoParagraphs = asArray(details.infoParagraphs).filter(Boolean);
  const ticketPolicies = asArray(details.ticketPolicies).filter(Boolean);

  return {
    organizer: details.organizer ?? "Organizador local",
    address: details.address ?? event.venue?.address ?? "",
    openingTime: details.openingTime ?? "",
    ageRating: details.ageRating ?? "Livre",
    agePolicy: details.agePolicy ?? "Consulte a politica de acesso antes da compra.",
    paymentInfo: details.paymentInfo ?? "Pix, cartao e fluxo corporativo sob revisao manual.",
    salesInfo: details.salesInfo ?? "Compra sujeita a disponibilidade e regras do evento.",
    infoParagraphs:
      infoParagraphs.length > 0 ? infoParagraphs : [event.summary, event.description].filter(Boolean),
    importantNotice:
      details.importantNotice ??
      "Os assentos selecionados ficam vinculados ao pedido aprovado e ao ticket emitido.",
    ticketPolicies:
      ticketPolicies.length > 0
        ? ticketPolicies
        : asArray(event.securityNotes).filter(Boolean).slice(0, 3),
  };
};

const buildSeatMap = (primarySession, venueManifest, options = {}) => {
  const sectionKeyById = new Map(
    asArray(primarySession?.sections).map((section) => [section.id, section.sectionKey]),
  );
  const sections = asArray(primarySession?.sections).map((section) => ({
    id: section.sectionKey,
    name: section.name,
    shortLabel: section.shortLabel ?? section.name,
    price: section.price,
    tone: section.tone ?? "slate",
    description: asObject(section.metadata).description ?? undefined,
    mapArea: asObject(section.metadata).mapArea ?? undefined,
  }));

  const ownHoldSeatKeys = options.ownHoldSeatKeys ?? new Set();
  const seats = asArray(primarySession?.seats).map((seat) => {
    const mappedStatus =
      ownHoldSeatKeys.has(seat.seatKey) && seat.status === "reserved" ? getFallbackSeatStatus(seat) : seat.status;

    return {
      id: seat.seatKey,
      label: seat.label,
      row: seat.rowLabel ?? "",
      number: seat.seatNumber ?? 0,
      sectionId: sectionKeyById.get(seat.sectionId) ?? seat.sectionId ?? "",
      status: mappedStatus,
      area: seat.areaLabel ?? undefined,
      tags: asArray(seat.tags),
      position: asObject(seat.metadata).position ?? undefined,
      vectorPath: asObject(seat.metadata).vectorPath ?? undefined,
      sourceFill: asObject(seat.metadata).sourceFill ?? undefined,
      sourceOpacity: asObject(seat.metadata).sourceOpacity ?? undefined,
    };
  });

  const seatMap = {
    hallName: venueManifest.hallName ?? primarySession?.metadata?.hallName ?? "Sala principal",
    stageLabel: venueManifest.stageLabel ?? primarySession?.metadata?.stageLabel ?? "Palco principal",
    sections,
    notes: asArray(venueManifest.notes),
    variant: venueManifest.variant ?? "standard",
    viewport: Object.keys(asObject(venueManifest.viewport)).length > 0 ? asObject(venueManifest.viewport) : undefined,
    totalSeats: seats.length,
    availableSeats: seats.filter((seat) => ["available", "accessible"].includes(seat.status)).length,
    sectionStats: buildSectionStats(sections, seats),
    venueId: venueManifest.venueId ?? undefined,
    geometryPath: venueManifest.geometryPath ?? undefined,
    backgroundAssetPath: venueManifest.backgroundAssetPath ?? undefined,
  };

  if (options.includeSeats) {
    return {
      ...seatMap,
      seats,
    };
  }

  return seatMap;
};

const mapGraphToCatalogEvent = (graph, options = {}) => {
  const event = graph.event;
  const metadata = asObject(event.metadata);
  const primarySession = getPrimarySession(graph.sessions);
  const venueManifest = asObject(event.venue?.seatMapManifest ?? metadata.seatMapManifest);
  const seatMap = buildSeatMap(primarySession, venueManifest, {
    includeSeats: options.includeSeats,
    ownHoldSeatKeys: options.ownHoldSeatKeys,
  });
  const dateParts = toDateParts(primarySession?.startsAt);

  return {
    id: event.id,
    slug: event.slug,
    title: event.title,
    image: event.heroUrl ?? event.bannerUrl ?? "",
    bannerImage: event.bannerUrl ?? event.heroUrl ?? "",
    category: event.category,
    discoveryLabel: metadata.discoveryLabel ?? event.category,
    tags: asArray(metadata.tags),
    searchTerms: asArray(metadata.searchTerms),
    salesBadge: metadata.salesBadge ?? undefined,
    month: dateParts.month,
    day: dateParts.day,
    weekday: dateParts.weekday,
    time: dateParts.time,
    city: event.city,
    venueName: event.venue?.name ?? event.city,
    summary: event.summary ?? "",
    description: event.description ?? "",
    priceFrom: event.priceFrom,
    securityNotes: asArray(event.securityNotes),
    seatMap,
    details: buildEventDetails(event, metadata),
    publicationStatus: event.status,
    publishedAt: event.publishedAt,
    serviceFeePerTicket: event.serviceFeePerTicket,
    processingFeePerOrder: event.processingFeePerOrder,
    platformFeeRate: event.platformFeeRate,
    currency: event.currency,
    startsAt: primarySession?.startsAt ?? null,
  };
};

const getCatalogEventRow = async (client, eventIdOrSlug) => {
  const result = await client.query(
    `
      select id, slug, status
      from public.events
      where id::text = $1 or slug = $1
      limit 1
    `,
    [eventIdOrSlug],
  );

  return result.rows[0] ?? null;
};

const getOwnHoldSeatKeys = async (client, sessionId, holdToken) => {
  if (!holdToken || !sessionId) {
    return new Set();
  }

  const result = await client.query(
    `
      select seat.seat_key
      from public.seat_holds hold
      inner join public.event_seats seat on seat.id = hold.seat_id
      where hold.session_id = $1
        and hold.hold_token = $2
        and hold.status = 'active'
    `,
    [sessionId, holdToken],
  );

  return new Set(result.rows.map((row) => row.seat_key));
};

const getCatalogGraphIfVisible = async (client, eventIdOrSlug, options = {}) => {
  const row = await getCatalogEventRow(client, eventIdOrSlug);

  if (!row) {
    return null;
  }

  if (options.publishedOnly !== false && row.status !== "published") {
    return null;
  }

  return getEventCatalogGraph(row.id, { client });
};

const getMappedCatalogEvent = async (client, eventIdOrSlug, options = {}) => {
  const graph = await getCatalogGraphIfVisible(client, eventIdOrSlug, options);

  if (!graph) {
    return null;
  }

  return mapGraphToCatalogEvent(graph, {
    includeSeats: false,
  });
};

export const getCatalogEventBySlugFromDb = async (eventIdOrSlug, options = {}) =>
  withDbClient(async (client) => {
    return getMappedCatalogEvent(client, eventIdOrSlug, options);
  });

export const getRuntimeEventBySlugFromDb = async (eventIdOrSlug, options = {}) =>
  withDbClient(async (client) => {
    const graph = await getCatalogGraphIfVisible(client, eventIdOrSlug, options);

    if (!graph) {
      return null;
    }

    const primarySession = getPrimarySession(graph.sessions);
    const ownHoldSeatKeys = await getOwnHoldSeatKeys(client, primarySession?.id ?? null, options.holdToken ?? null);

    return mapGraphToCatalogEvent(graph, {
      includeSeats: true,
      ownHoldSeatKeys,
    });
  });

export const listCatalogEventsFromDb = async (options = {}) =>
  withDbClient(async (client) => {
    const params = [];
    const clauses = [];

    if (options.publishedOnly !== false) {
      params.push("published");
      clauses.push(`status = $${params.length}::public.event_status`);
    }

    if (options.city) {
      params.push(`%${String(options.city).trim().toLowerCase()}%`);
      clauses.push(`lower(city) like $${params.length}`);
    }

    if (options.category) {
      params.push(String(options.category).trim().toLowerCase());
      clauses.push(`lower(category) = $${params.length}`);
    }

    if (options.query) {
      params.push(`%${String(options.query).trim().toLowerCase()}%`);
      clauses.push(`(lower(title) like $${params.length} or lower(coalesce(summary, '')) like $${params.length})`);
    }

    const whereClause = clauses.length > 0 ? `where ${clauses.join(" and ")}` : "";
    const limitClause =
      Number.isFinite(Number(options.limit)) && Number(options.limit) > 0 ? `limit ${Number(options.limit)}` : "";
    const result = await client.query(
      `
        select id
        from public.events
        ${whereClause}
        order by published_at desc nulls last, updated_at desc, title asc
        ${limitClause}
      `,
      params,
    );

    const events = [];

    for (const row of result.rows) {
      const event = await getMappedCatalogEvent(client, row.id, {
        publishedOnly: options.publishedOnly,
      });

      if (event) {
        events.push(event);
      }
    }

    return events;
  });

export const searchCatalogEventsFromDb = async (query, options = {}) =>
  withDbClient(async (client) => {
    const slugs = await searchPublishedCatalogSlugs(query, {
      client,
      limit: options.limit ?? 6,
    });
    const events = [];

    for (const slug of slugs) {
      const event = await getMappedCatalogEvent(client, slug, {
        publishedOnly: true,
      });

      if (event) {
        events.push(event);
      }
    }

    return events;
  });
