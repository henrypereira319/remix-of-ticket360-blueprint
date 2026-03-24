import crypto from "node:crypto";
import {
  appendAuditLog,
  asArray,
  asNullableText,
  asObject,
  assertCondition,
  runWithMaybeClient,
  runWithMaybeTransaction,
  toMoney,
} from "./helpers.mjs";

const monthMap = {
  jan: 1,
  fev: 2,
  mar: 3,
  abr: 4,
  mai: 5,
  jun: 6,
  jul: 7,
  ago: 8,
  set: 9,
  out: 10,
  nov: 11,
  dez: 12,
};

const slugify = (value) =>
  String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const parseCityState = (value) => {
  const [cityPart, statePart] = String(value ?? "")
    .split("/")
    .map((item) => item.trim())
    .filter(Boolean);
  const normalizedValue = String(value ?? "").trim();

  return {
    city: cityPart || normalizedValue || "Sao Paulo",
    state: statePart ?? null,
  };
};

const parseStartsAtFromSnapshot = (eventSnapshot) => {
  const year = Number(eventSnapshot?.year ?? new Date().getFullYear());
  const monthToken = String(eventSnapshot?.month ?? "").trim().toLowerCase().slice(0, 3);
  const month = monthMap[monthToken];
  const day = Number(eventSnapshot?.day ?? 1);
  const [hourPart, minutePart] = String(eventSnapshot?.time ?? "20:00")
    .split(":")
    .map((item) => Number(item));

  if (month && Number.isFinite(day) && Number.isFinite(hourPart) && Number.isFinite(minutePart)) {
    return new Date(Date.UTC(year, month - 1, day, hourPart + 3, minutePart, 0)).toISOString();
  }

  return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
};

const buildRuntimeMetadata = (eventSnapshot) => ({
  weekday: eventSnapshot.weekday ?? null,
  month: eventSnapshot.month ?? null,
  day: eventSnapshot.day ?? null,
  time: eventSnapshot.time ?? null,
  discoveryLabel: eventSnapshot.discoveryLabel ?? null,
  tags: asArray(eventSnapshot.tags),
  searchTerms: asArray(eventSnapshot.searchTerms),
  salesBadge: eventSnapshot.salesBadge ?? null,
  details: asObject(eventSnapshot.details),
  runtimeSource: "client-snapshot",
});

const recalculateRuntimeSeatMap = (seatMap) => {
  const seats = asArray(seatMap.seats);
  const sections = asArray(seatMap.sections);
  const sectionStats = Object.fromEntries(
    sections.map((section) => [
      section.id,
      {
        total: seats.filter((seat) => seat.sectionId === section.id).length,
        selectable: seats.filter(
          (seat) => seat.sectionId === section.id && ["available", "accessible"].includes(seat.status),
        ).length,
      },
    ]),
  );

  return {
    ...seatMap,
    totalSeats: seats.length,
    availableSeats: seats.filter((seat) => ["available", "accessible"].includes(seat.status)).length,
    sectionStats,
  };
};

const mapVenueRow = (row) => ({
  id: row.id,
  slug: row.slug,
  name: row.name,
  city: row.city,
  state: row.state,
  country: row.country,
  address: row.address,
  timezone: row.timezone,
  kind: row.kind,
  seatMapManifest: asObject(row.seat_map_manifest),
  createdBy: row.created_by,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const mapEventRow = (row) => ({
  id: row.id,
  slug: row.slug,
  title: row.title,
  summary: row.summary,
  description: row.description,
  category: row.category,
  city: row.city,
  venueId: row.venue_id,
  bannerUrl: row.banner_url,
  heroUrl: row.hero_url,
  priceFrom: toMoney(row.price_from),
  serviceFeePerTicket: toMoney(row.service_fee_per_ticket),
  processingFeePerOrder: toMoney(row.processing_fee_per_order),
  platformFeeRate: Number(row.platform_fee_rate ?? 0),
  currency: row.currency,
  status: row.status,
  publishedAt: row.published_at,
  securityNotes: asArray(row.security_notes),
  metadata: asObject(row.metadata),
  createdBy: row.created_by,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const mapSessionRow = (row) => ({
  id: row.id,
  eventId: row.event_id,
  startsAt: row.starts_at,
  doorsOpenAt: row.doors_open_at,
  salesStartAt: row.sales_start_at,
  salesEndAt: row.sales_end_at,
  status: row.status,
  capacity: row.capacity,
  metadata: asObject(row.metadata),
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const mapSectionRow = (row) => ({
  id: row.id,
  sessionId: row.session_id,
  sectionKey: row.section_key,
  name: row.name,
  shortLabel: row.short_label,
  price: toMoney(row.price),
  position: row.position,
  tone: row.tone,
  metadata: asObject(row.metadata),
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const mapSeatRow = (row) => ({
  id: row.id,
  sessionId: row.session_id,
  sectionId: row.section_id,
  seatKey: row.seat_key,
  label: row.label,
  rowLabel: row.row_label,
  seatNumber: row.seat_number,
  areaLabel: row.area_label,
  basePrice: toMoney(row.base_price),
  status: row.status,
  tags: asArray(row.tags),
  metadata: asObject(row.metadata),
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

export const upsertVenue = async (input, options = {}) =>
  runWithMaybeTransaction(options.client, async (client) => {
    const venueId = input.id ?? crypto.randomUUID();
    const result = await client.query(
      `
        insert into public.venues (
          id, slug, name, city, state, country, address, timezone, kind, seat_map_manifest, created_by
        )
        values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10::jsonb, $11)
        on conflict (slug) do update set
          name = excluded.name,
          city = excluded.city,
          state = excluded.state,
          country = excluded.country,
          address = excluded.address,
          timezone = excluded.timezone,
          kind = excluded.kind,
          seat_map_manifest = excluded.seat_map_manifest,
          created_by = coalesce(public.venues.created_by, excluded.created_by)
        returning *
      `,
      [
        venueId,
        input.slug,
        input.name,
        input.city,
        asNullableText(input.state),
        input.country ?? "BR",
        asNullableText(input.address),
        input.timezone ?? "America/Sao_Paulo",
        input.kind ?? "seated",
        JSON.stringify(asObject(input.seatMapManifest)),
        input.createdBy ?? null,
      ],
    );

    return mapVenueRow(result.rows[0]);
  });

export const upsertEvent = async (input, options = {}) =>
  runWithMaybeTransaction(options.client, async (client) => {
    const eventId = input.id ?? crypto.randomUUID();
    const result = await client.query(
      `
        insert into public.events (
          id, slug, title, summary, description, category, city, venue_id, banner_url, hero_url, price_from,
          service_fee_per_ticket, processing_fee_per_order, platform_fee_rate, currency, status, published_at,
          security_notes, metadata, created_by
        )
        values (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11,
          $12, $13, $14, $15, $16, $17, $18::jsonb, $19::jsonb, $20
        )
        on conflict (slug) do update set
          title = excluded.title,
          summary = excluded.summary,
          description = excluded.description,
          category = excluded.category,
          city = excluded.city,
          venue_id = excluded.venue_id,
          banner_url = excluded.banner_url,
          hero_url = excluded.hero_url,
          price_from = excluded.price_from,
          service_fee_per_ticket = excluded.service_fee_per_ticket,
          processing_fee_per_order = excluded.processing_fee_per_order,
          platform_fee_rate = excluded.platform_fee_rate,
          currency = excluded.currency,
          status = excluded.status,
          published_at = excluded.published_at,
          security_notes = excluded.security_notes,
          metadata = excluded.metadata
        returning *
      `,
      [
        eventId,
        input.slug,
        input.title,
        asNullableText(input.summary),
        asNullableText(input.description),
        input.category,
        input.city,
        input.venueId ?? null,
        asNullableText(input.bannerUrl),
        asNullableText(input.heroUrl),
        toMoney(input.priceFrom),
        toMoney(input.serviceFeePerTicket ?? 0),
        toMoney(input.processingFeePerOrder ?? 0),
        Number(input.platformFeeRate ?? 0.1),
        input.currency ?? "BRL",
        input.status ?? "draft",
        input.publishedAt ?? null,
        JSON.stringify(asArray(input.securityNotes)),
        JSON.stringify(asObject(input.metadata)),
        input.createdBy ?? null,
      ],
    );

    return mapEventRow(result.rows[0]);
  });

export const upsertEventSession = async (input, options = {}) =>
  runWithMaybeTransaction(options.client, async (client) => {
    const sessionId = input.id ?? crypto.randomUUID();
    const result = await client.query(
      `
        insert into public.event_sessions (
          id, event_id, starts_at, doors_open_at, sales_start_at, sales_end_at, status, capacity, metadata
        )
        values ($1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb)
        on conflict (event_id, starts_at) do update set
          doors_open_at = excluded.doors_open_at,
          sales_start_at = excluded.sales_start_at,
          sales_end_at = excluded.sales_end_at,
          status = excluded.status,
          capacity = excluded.capacity,
          metadata = excluded.metadata
        returning *
      `,
      [
        sessionId,
        input.eventId,
        input.startsAt,
        input.doorsOpenAt ?? null,
        input.salesStartAt ?? null,
        input.salesEndAt ?? null,
        input.status ?? "scheduled",
        input.capacity ?? null,
        JSON.stringify(asObject(input.metadata)),
      ],
    );

    return mapSessionRow(result.rows[0]);
  });

export const replaceSessionSections = async (sessionId, sections, options = {}) =>
  runWithMaybeTransaction(options.client, async (client) => {
    const nextSections = asArray(sections);
    const sectionKeys = nextSections.map((section) => section.sectionKey);

    if (sectionKeys.length > 0) {
      await client.query(
        `
          delete from public.event_sections
          where session_id = $1
            and not (section_key = any($2::text[]))
        `,
        [sessionId, sectionKeys],
      );
    } else {
      await client.query("delete from public.event_sections where session_id = $1", [sessionId]);
      return [];
    }

    const storedSections = [];

    for (const [index, section] of nextSections.entries()) {
      const sectionId = section.id ?? crypto.randomUUID();
      const result = await client.query(
        `
          insert into public.event_sections (
            id, session_id, section_key, name, short_label, price, position, tone, metadata
          )
          values ($1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb)
          on conflict (session_id, section_key) do update set
            name = excluded.name,
            short_label = excluded.short_label,
            price = excluded.price,
            position = excluded.position,
            tone = excluded.tone,
            metadata = excluded.metadata
          returning *
        `,
        [
          sectionId,
          sessionId,
          section.sectionKey,
          section.name,
          asNullableText(section.shortLabel),
          toMoney(section.price),
          Number(section.position ?? index),
          asNullableText(section.tone),
          JSON.stringify(asObject(section.metadata)),
        ],
      );

      storedSections.push(mapSectionRow(result.rows[0]));
    }

    return storedSections.sort((left, right) => left.position - right.position);
  });

export const replaceSessionSeats = async (sessionId, seats, options = {}) =>
  runWithMaybeTransaction(options.client, async (client) => {
    const nextSeats = asArray(seats);
    const seatKeys = nextSeats.map((seat) => seat.seatKey);

    if (seatKeys.length > 0) {
      await client.query(
        `
          delete from public.event_seats
          where session_id = $1
            and not (seat_key = any($2::text[]))
        `,
        [sessionId, seatKeys],
      );
    } else {
      await client.query("delete from public.event_seats where session_id = $1", [sessionId]);
      return [];
    }

    const sectionRows = await client.query(
      "select id, section_key from public.event_sections where session_id = $1",
      [sessionId],
    );
    const sectionIdByKey = new Map(sectionRows.rows.map((row) => [row.section_key, row.id]));
    const storedSeats = [];

    for (const seat of nextSeats) {
      const resolvedSectionId = seat.sectionId ?? sectionIdByKey.get(seat.sectionKey) ?? null;
      assertCondition(resolvedSectionId, `Setor nao encontrado para o assento ${seat.seatKey}.`);

      const seatId = seat.id ?? crypto.randomUUID();
      const result = await client.query(
        `
          insert into public.event_seats (
            id, session_id, section_id, seat_key, label, row_label, seat_number, area_label, base_price, status, tags, metadata
          )
          values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11::text[], $12::jsonb)
          on conflict (session_id, seat_key) do update set
            section_id = excluded.section_id,
            label = excluded.label,
            row_label = excluded.row_label,
            seat_number = excluded.seat_number,
            area_label = excluded.area_label,
            base_price = excluded.base_price,
            status = excluded.status,
            tags = excluded.tags,
            metadata = excluded.metadata
          returning *
        `,
        [
          seatId,
          sessionId,
          resolvedSectionId,
          seat.seatKey,
          seat.label,
          asNullableText(seat.rowLabel),
          seat.seatNumber ?? null,
          asNullableText(seat.areaLabel),
          toMoney(seat.basePrice),
          seat.status ?? "available",
          asArray(seat.tags),
          JSON.stringify(asObject(seat.metadata)),
        ],
      );

      storedSeats.push(mapSeatRow(result.rows[0]));
    }

    return storedSeats;
  });

export const getEventCatalogGraph = async (eventIdOrSlug, options = {}) =>
  runWithMaybeClient(options.client, async (client) => {
    const eventResult = await client.query(
      `
        select
          e.*,
          v.slug as venue_slug,
          v.name as venue_name,
          v.city as venue_city,
          v.address as venue_address,
          v.timezone as venue_timezone,
          v.seat_map_manifest as venue_seat_map_manifest
        from public.events e
        left join public.venues v on v.id = e.venue_id
        where e.id::text = $1 or e.slug = $1
        limit 1
      `,
      [eventIdOrSlug],
    );

    assertCondition(eventResult.rowCount === 1, "Evento nao encontrado no catalogo.");
    const eventRow = eventResult.rows[0];

    const sessionResult = await client.query(
      "select * from public.event_sessions where event_id = $1 order by starts_at asc",
      [eventRow.id],
    );

    const sessions = [];

    for (const sessionRow of sessionResult.rows) {
      const sectionsResult = await client.query(
        "select * from public.event_sections where session_id = $1 order by position asc, name asc",
        [sessionRow.id],
      );
      const seatsResult = await client.query(
        "select * from public.event_seats where session_id = $1 order by row_label asc nulls last, seat_number asc nulls last, label asc",
        [sessionRow.id],
      );

      sessions.push({
        ...mapSessionRow(sessionRow),
        sections: sectionsResult.rows.map(mapSectionRow),
        seats: seatsResult.rows.map(mapSeatRow),
      });
    }

    return {
      event: {
        ...mapEventRow(eventRow),
        venue: eventRow.venue_id
          ? {
              id: eventRow.venue_id,
              slug: eventRow.venue_slug,
              name: eventRow.venue_name,
              city: eventRow.venue_city,
              address: eventRow.venue_address,
              timezone: eventRow.venue_timezone,
              seatMapManifest: asObject(eventRow.venue_seat_map_manifest),
            }
          : null,
      },
      sessions,
    };
  });

export const setEventPublicationStatus = async (eventIdOrSlug, status, actor = {}, options = {}) =>
  runWithMaybeTransaction(options.client, async (client) => {
    const result = await client.query(
      `
        update public.events
        set
          status = $2::public.event_status,
          published_at = case
            when $2::public.event_status = 'published'::public.event_status
              then coalesce(published_at, timezone('utc'::text, now()))
            else null
          end
        where id::text = $1 or slug = $1
        returning *
      `,
      [eventIdOrSlug, status],
    );

    assertCondition(result.rowCount === 1, "Evento nao encontrado para atualizar publicacao.");

    await client.query(
      `
        update public.event_sessions
        set status = case
          when $2::public.event_status = 'published'::public.event_status then 'onsale'::public.session_status
          when $2::public.event_status = 'cancelled'::public.event_status then 'cancelled'::public.session_status
          else 'scheduled'::public.session_status
        end
        where event_id = $1
      `,
      [result.rows[0].id, status],
    );

    await appendAuditLog(client, {
      actorType: actor.actorType ?? "system",
      actorId: actor.actorId ?? null,
      actorEmail: actor.actorEmail ?? null,
      action: "event.publication_status.updated",
      targetTable: "events",
      targetId: result.rows[0].id,
      context: {
        slug: result.rows[0].slug,
        status,
      },
    });

    return mapEventRow(result.rows[0]);
  });

export const getCatalogPublicationState = async (slugs, options = {}) =>
  runWithMaybeClient(options.client, async (client) => {
    const normalizedSlugs = Array.isArray(slugs)
      ? slugs.map((slug) => String(slug ?? "").trim()).filter(Boolean)
      : [];

    if (normalizedSlugs.length === 0) {
      return {};
    }

    const result = await client.query(
      `
        select slug, status, published_at
        from public.events
        where slug = any($1::text[])
      `,
      [normalizedSlugs],
    );

    return Object.fromEntries(
      result.rows.map((row) => [
        row.slug,
        {
          publicationStatus: row.status,
          publishedAt: row.published_at,
        },
      ]),
    );
  });

export const searchPublishedCatalogSlugs = async (query, options = {}) =>
  runWithMaybeClient(options.client, async (client) => {
    const normalizedQuery = String(query ?? "").trim().toLowerCase();

    if (!normalizedQuery) {
      return [];
    }

    const likeQuery = `%${normalizedQuery}%`;
    const result = await client.query(
      `
        select e.slug
        from public.events e
        left join public.venues v on v.id = e.venue_id
        where e.status = 'published'
          and (
            lower(e.title) like $1
            or lower(e.category) like $1
            or lower(e.city) like $1
            or lower(coalesce(e.summary, '')) like $1
            or lower(coalesce(v.name, '')) like $1
            or lower(coalesce(e.metadata ->> 'discoveryLabel', '')) like $1
            or exists (
              select 1
              from jsonb_array_elements_text(coalesce(e.metadata -> 'tags', '[]'::jsonb)) as tag(value)
              where lower(tag.value) like $1
            )
            or exists (
              select 1
              from jsonb_array_elements_text(coalesce(e.metadata -> 'searchTerms', '[]'::jsonb)) as term(value)
              where lower(term.value) like $1
            )
          )
        order by
          case when lower(e.title) like $1 then 0 else 1 end,
          case when lower(coalesce(e.metadata ->> 'discoveryLabel', '')) like $1 then 0 else 1 end,
          e.price_from asc,
          e.title asc
        limit $2
      `,
      [likeQuery, Number(options.limit ?? 6)],
    );

    return result.rows.map((row) => row.slug);
  });

export const syncEventSnapshot = async (eventSnapshot, options = {}) =>
  runWithMaybeTransaction(options.client, async (client) => {
    assertCondition(eventSnapshot?.slug, "Evento invalido para sincronizacao.");
    assertCondition(eventSnapshot?.seatMap?.sections, "Evento sem seat map para sincronizacao.");

    const cityState = parseCityState(eventSnapshot.city);
    const venue = await upsertVenue(
      {
        slug:
          eventSnapshot.seatMap?.venueId ??
          slugify(`${eventSnapshot.venueName ?? eventSnapshot.seatMap?.hallName ?? eventSnapshot.slug}-${cityState.city}`),
        name: eventSnapshot.venueName ?? eventSnapshot.seatMap?.hallName ?? eventSnapshot.slug,
        city: cityState.city,
        state: cityState.state,
        address: eventSnapshot.details?.address ?? null,
        kind: eventSnapshot.seatMap?.variant === "theater" ? "seated" : "seated",
        seatMapManifest: {
          hallName: eventSnapshot.seatMap?.hallName ?? null,
          stageLabel: eventSnapshot.seatMap?.stageLabel ?? null,
          variant: eventSnapshot.seatMap?.variant ?? "standard",
          viewport: asObject(eventSnapshot.seatMap?.viewport),
          totalSeats: eventSnapshot.seatMap?.totalSeats ?? 0,
          availableSeats: eventSnapshot.seatMap?.availableSeats ?? 0,
          sectionStats: asObject(eventSnapshot.seatMap?.sectionStats),
          geometryPath: eventSnapshot.seatMap?.geometryPath ?? null,
          backgroundAssetPath: eventSnapshot.seatMap?.backgroundAssetPath ?? null,
          notes: asArray(eventSnapshot.seatMap?.notes),
        },
      },
      { client },
    );

    const existingEventResult = await client.query(
      `
        select status, published_at
        from public.events
        where slug = $1
        limit 1
      `,
      [eventSnapshot.slug],
    );
    const existingEvent = existingEventResult.rows[0] ?? null;
    const publicationStatus = eventSnapshot.publicationStatus ?? eventSnapshot.status ?? existingEvent?.status ?? "published";
    const publishedAt =
      publicationStatus === "published"
        ? eventSnapshot.publishedAt ?? existingEvent?.published_at ?? new Date().toISOString()
        : null;

    const event = await upsertEvent(
      {
        slug: eventSnapshot.slug,
        title: eventSnapshot.title,
        summary: eventSnapshot.summary,
        description: eventSnapshot.description,
        category: eventSnapshot.category ?? "Marketplace",
        city: eventSnapshot.city ?? cityState.city,
        venueId: venue.id,
        bannerUrl: eventSnapshot.bannerImage ?? eventSnapshot.bannerUrl ?? null,
        heroUrl: eventSnapshot.image ?? eventSnapshot.heroUrl ?? null,
        priceFrom: Number(eventSnapshot.priceFrom ?? 0),
        serviceFeePerTicket: Number(eventSnapshot.serviceFeePerTicket ?? 18),
        processingFeePerOrder: Number(eventSnapshot.processingFeePerOrder ?? 4.9),
        platformFeeRate: Number(eventSnapshot.platformFeeRate ?? 0.1),
        currency: eventSnapshot.currency ?? "BRL",
        status: publicationStatus,
        publishedAt,
        securityNotes: asArray(eventSnapshot.securityNotes),
        metadata: buildRuntimeMetadata(eventSnapshot),
      },
      { client },
    );

    const startsAt = parseStartsAtFromSnapshot(eventSnapshot);
    const session = await upsertEventSession(
      {
        eventId: event.id,
        startsAt,
        status:
          publicationStatus === "published"
            ? "onsale"
            : publicationStatus === "cancelled"
              ? "cancelled"
              : "scheduled",
        capacity: eventSnapshot.seatMap?.totalSeats ?? null,
        metadata: {
          hallName: eventSnapshot.seatMap?.hallName ?? null,
          stageLabel: eventSnapshot.seatMap?.stageLabel ?? null,
        },
      },
      { client },
    );

    const sections = await replaceSessionSections(
      session.id,
      asArray(eventSnapshot.seatMap?.sections).map((section, index) => ({
        sectionKey: section.id,
        name: section.name,
        shortLabel: section.shortLabel ?? section.name,
        price: Number(section.price ?? 0),
        position: index,
        tone: section.tone ?? null,
        metadata: {
          description: section.description ?? null,
          mapArea: asObject(section.mapArea),
        },
      })),
      { client },
    );
    const sectionIdByKey = new Map(sections.map((section) => [section.sectionKey, section.id]));

    for (const seat of asArray(eventSnapshot.seatMap?.seats)) {
      const sectionKey = seat.sectionId;
      const sectionId = sectionIdByKey.get(sectionKey) ?? null;
      assertCondition(sectionId, `Setor nao encontrado para o assento ${seat.id}.`);

      await client.query(
        `
          insert into public.event_seats (
            id, session_id, section_id, seat_key, label, row_label, seat_number, area_label, base_price, status, tags, metadata
          )
          values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11::text[], $12::jsonb)
          on conflict (session_id, seat_key) do update set
            section_id = excluded.section_id,
            label = excluded.label,
            row_label = excluded.row_label,
            seat_number = excluded.seat_number,
            area_label = excluded.area_label,
            base_price = excluded.base_price,
            status = case
              when public.event_seats.status in ('reserved', 'sold', 'blocked') then public.event_seats.status
              else excluded.status
            end,
            tags = excluded.tags,
            metadata = excluded.metadata
        `,
        [
          crypto.randomUUID(),
          session.id,
          sectionId,
          seat.id,
          seat.label,
          asNullableText(seat.row),
          seat.number ?? null,
          asNullableText(seat.area),
          Number(
            asArray(eventSnapshot.seatMap?.sections).find((section) => section.id === seat.sectionId)?.price ?? 0,
          ),
          seat.status ?? "available",
          asArray(seat.tags),
          JSON.stringify({
            position: asObject(seat.position),
            vectorPath: seat.vectorPath ?? null,
            sourceFill: seat.sourceFill ?? null,
            sourceOpacity: seat.sourceOpacity ?? null,
          }),
        ],
      );
    }

    return {
      venue,
      event,
      session,
      sections,
    };
  });

export const hydrateRuntimeEventSnapshot = async (eventSnapshot, options = {}) =>
  runWithMaybeTransaction(options.client, async (client) => {
    const synced = await syncEventSnapshot(eventSnapshot, { client });

    const seatResult = await client.query(
      "select seat_key, status from public.event_seats where session_id = $1 order by seat_key asc",
      [synced.session.id],
    );
    const statusBySeatKey = new Map(seatResult.rows.map((row) => [row.seat_key, row.status]));

    let ownSeatKeys = new Set();
    if (options.holdToken) {
      const ownHoldResult = await client.query(
        `
          select seat.seat_key
          from public.seat_holds hold
          inner join public.event_seats seat on seat.id = hold.seat_id
          where hold.hold_token = $1
            and hold.status = 'active'
        `,
        [options.holdToken],
      );
      ownSeatKeys = new Set(ownHoldResult.rows.map((row) => row.seat_key));
    }

    const nextSeatMap = recalculateRuntimeSeatMap({
      ...eventSnapshot.seatMap,
      seats: asArray(eventSnapshot.seatMap?.seats).map((seat) => ({
        ...seat,
        status: ownSeatKeys.has(seat.id) ? seat.status : statusBySeatKey.get(seat.id) ?? seat.status,
      })),
    });

    return {
      ...eventSnapshot,
      seatMap: nextSeatMap,
    };
  });
