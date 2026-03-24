import crypto from "node:crypto";
import {
  appendAnalyticsEvent,
  appendAuditLog,
  asArray,
  asNullableText,
  asObject,
  assertCondition,
  buildBarcode,
  buildMaskedCard,
  buildPixCopyPaste,
  buildPixPayload,
  buildQrPayload,
  buildReference,
  buildWalletUrl,
  mapNotificationRow,
  mapOrderRow,
  mapPaymentRow,
  mapSeatHoldRow,
  mapTicketRow,
  runWithMaybeClient,
  runWithMaybeTransaction,
  toMoney,
} from "./helpers.mjs";

const HOLD_TTL_MS = 10 * 60 * 1000;
const ticketCategoryMultipliers = {
  full: 1,
  half: 0.5,
  social: 0.7,
};

const createNotificationPayload = ({ order, event, payment, template, tickets = [] }) => {
  if (template === "payment-under-review") {
    return {
      subject: `Pedido ${order.reference} em revisao`,
      preview: `O pagamento ${payment.reference} esta aguardando analise manual antes da emissao dos ingressos.`,
      metadata: {
        paymentReference: payment.reference,
        paymentMethod: payment.method,
        paymentStatus: payment.status,
      },
    };
  }

  if (template === "tickets-issued") {
    return {
      subject: `Ingressos ${order.reference} emitidos`,
      preview: `${tickets.length} ingresso(s) ficaram disponiveis na sua area da conta para ${event.slug}.`,
      metadata: {
        issuedTickets: tickets.length,
      },
    };
  }

  if (template === "order-cancelled") {
    return {
      subject: `Pedido ${order.reference} cancelado`,
      preview: `Seu pedido foi cancelado e os assentos voltaram para disponibilidade do evento.`,
      metadata: {
        paymentMethod: order.paymentMethod,
        total: order.pricing.total,
      },
    };
  }

  return {
    subject: `Pedido ${order.reference} confirmado`,
    preview: `Recebemos o pedido de ${order.items.length} ingresso(s) para ${event.slug}.`,
    metadata: {
      paymentMethod: order.paymentMethod,
      tickets: order.items.length,
      total: order.pricing.total,
    },
  };
};

const insertNotification = async (client, { order, event, payment, template, tickets = [] }) => {
  const message = createNotificationPayload({ order, event, payment, template, tickets });
  const notificationId = crypto.randomUUID();
  const result = await client.query(
    `
      insert into public.notifications (
        id, order_id, account_id, event_id, channel, template, recipient, subject, preview, status, sent_at, metadata
      )
      values ($1, $2, $3, $4, 'email', $5, $6, $7, $8, 'sent', timezone('utc'::text, now()), $9::jsonb)
      returning *
    `,
    [
      notificationId,
      order.id,
      order.accountId,
      order.eventId,
      template,
      order.buyer.email,
      message.subject,
      message.preview,
      JSON.stringify(asObject(message.metadata)),
    ],
  );

  return mapNotificationRow(result.rows[0]);
};

const expireActiveSeatHoldsInternal = async (client, sessionId, seatIds = null) => {
  const params = [sessionId];
  let seatFilterSql = "";

  if (seatIds && seatIds.length > 0) {
    params.push(seatIds);
    seatFilterSql = "and seat_id = any($2::uuid[])";
  }

  const expiredResult = await client.query(
    `
      update public.seat_holds
      set status = 'expired', updated_at = timezone('utc'::text, now())
      where session_id = $1
        ${seatFilterSql}
        and status = 'active'
        and expires_at <= timezone('utc'::text, now())
      returning *
    `,
    params,
  );

  if (expiredResult.rowCount > 0) {
    const expiredSeatIds = expiredResult.rows.map((row) => row.seat_id);
    await client.query(
      `
        update public.event_seats
        set status = case
          when status = 'reserved' then 'available'::public.seat_status
          else status
        end
        where id = any($1::uuid[])
          and not exists (
            select 1
            from public.seat_holds active_hold
            where active_hold.seat_id = public.event_seats.id
              and active_hold.status = 'active'
          )
      `,
      [expiredSeatIds],
    );
  }

  return expiredResult.rows.map(mapSeatHoldRow);
};

const getHoldRowsByToken = async (client, holdToken, lock = false) => {
  const query = `
    select *
    from public.seat_holds
    where hold_token = $1
    order by created_at asc
    ${lock ? "for update" : ""}
  `;
  const result = await client.query(query, [holdToken]);
  return result.rows.map(mapSeatHoldRow);
};

const getEventPricingContext = async (client, sessionId) => {
  const result = await client.query(
    `
      select
        s.id as session_id,
        s.event_id,
        e.slug as event_slug,
        e.title as event_title,
        e.service_fee_per_ticket,
        e.processing_fee_per_order,
        e.platform_fee_rate,
        e.currency
      from public.event_sessions s
      inner join public.events e on e.id = s.event_id
      where s.id = $1
      limit 1
    `,
    [sessionId],
  );

  assertCondition(result.rowCount === 1, "Sessao nao encontrada para o fluxo de ticketing.");
  return result.rows[0];
};

const getOrderContext = async (client, orderId, { lock = false } = {}) => {
  const orderResult = await client.query(
    `
      select *
      from public.orders
      where id = $1
      ${lock ? "for update" : ""}
    `,
    [orderId],
  );
  assertCondition(orderResult.rowCount === 1, "Pedido nao encontrado.");

  const order = mapOrderRow(orderResult.rows[0]);
  const itemsResult = await client.query("select * from public.order_items where order_id = $1 order by created_at asc", [
    orderId,
  ]);
  const paymentResult = await client.query("select * from public.payments where order_id = $1 limit 1", [orderId]);
  const eventResult = await client.query("select id, slug, title from public.events where id = $1 limit 1", [
    order.eventId,
  ]);
  const ticketResult = await client.query("select * from public.tickets where order_id = $1 order by issued_at asc", [
    orderId,
  ]);
  const notificationResult = await client.query(
    "select * from public.notifications where order_id = $1 order by created_at asc",
    [orderId],
  );

  return {
    order: {
      ...order,
      items: itemsResult.rows.map((row) => ({
        id: row.id,
        orderId: row.order_id,
        seatId: row.seat_id,
        sectionId: row.section_id,
        holdId: row.hold_id,
        seatKey: row.seat_key,
        label: row.label,
        rowLabel: row.row_label,
        sectionKey: row.section_key,
        sectionName: row.section_name,
        holderName: row.holder_name,
        holderDocument: row.holder_document,
        ticketCategory: row.ticket_category,
        basePrice: toMoney(row.base_price),
        price: toMoney(row.price),
        metadata: asObject(row.metadata),
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      })),
    },
    payment: paymentResult.rowCount > 0 ? mapPaymentRow(paymentResult.rows[0]) : null,
    event: eventResult.rowCount > 0 ? eventResult.rows[0] : null,
    tickets: ticketResult.rows.map(mapTicketRow),
    notifications: notificationResult.rows.map(mapNotificationRow),
  };
};

const issueTicketsIfNeeded = async (client, orderContext) => {
  if (orderContext.tickets.length > 0) {
    return orderContext.tickets;
  }

  const issuedTickets = [];

  for (const item of orderContext.order.items) {
    const ticketId = crypto.randomUUID();
    const walletToken = crypto.randomUUID();
    const result = await client.query(
      `
        insert into public.tickets (
          id, order_id, order_item_id, account_id, event_id, session_id, seat_id,
          holder_name, holder_document, label, section_name, barcode, qr_payload, wallet_token, wallet_url, metadata
        )
        values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16::jsonb)
        returning *
      `,
      [
        ticketId,
        orderContext.order.id,
        item.id,
        orderContext.order.accountId,
        orderContext.order.eventId,
        orderContext.order.sessionId,
        item.seatId,
        item.holderName,
        asNullableText(item.holderDocument),
        item.label,
        item.sectionName,
        buildBarcode({ orderReference: orderContext.order.reference, seatKey: item.seatKey }),
        buildQrPayload({
          orderReference: orderContext.order.reference,
          eventSlug: orderContext.event.slug,
          seatKey: item.seatKey,
        }),
        walletToken,
        buildWalletUrl({ ticketId, walletToken }),
        JSON.stringify(asObject(item.metadata)),
      ],
    );

    issuedTickets.push(mapTicketRow(result.rows[0]));
  }

  return issuedTickets;
};

const createNotificationIfMissing = async (client, orderContext, template, payment, tickets = []) => {
  const existing = orderContext.notifications.find((notification) => notification.template === template);

  if (existing) {
    return null;
  }

  return insertNotification(client, {
    order: orderContext.order,
    event: orderContext.event,
    payment,
    template,
    tickets,
  });
};

const setSeatStatus = async (client, seatIds, status) => {
  if (seatIds.length === 0) {
    return;
  }

  await client.query("update public.event_seats set status = $2 where id = any($1::uuid[])", [seatIds, status]);
};

const finalizeApproval = async (client, orderId, actor = {}) => {
  const orderContext = await getOrderContext(client, orderId, { lock: true });
  assertCondition(orderContext.payment, "Pagamento nao encontrado para o pedido.");
  assertCondition(orderContext.order.status !== "cancelled", "Nao e possivel aprovar um pedido cancelado.");

  if (orderContext.payment.status !== "authorized") {
    const paymentResult = await client.query(
      `
        update public.payments
        set status = 'authorized', authorized_at = timezone('utc'::text, now())
        where id = $1
        returning *
      `,
      [orderContext.payment.id],
    );
    orderContext.payment = mapPaymentRow(paymentResult.rows[0]);
  }

  const orderResult = await client.query(
    `
      update public.orders
      set status = 'approved'
      where id = $1
      returning *
    `,
    [orderId],
  );
  orderContext.order = {
    ...mapOrderRow(orderResult.rows[0]),
    items: orderContext.order.items,
  };

  await client.query(
    `
      update public.seat_holds
      set status = 'confirmed', updated_at = timezone('utc'::text, now())
      where order_id = $1
        and status in ('active', 'confirmed')
    `,
    [orderId],
  );

  await setSeatStatus(
    client,
    orderContext.order.items.map((item) => item.seatId).filter(Boolean),
    "sold",
  );

  const tickets = await issueTicketsIfNeeded(client, orderContext);
  orderContext.tickets = tickets;

  const createdNotifications = [];
  const orderConfirmation = await createNotificationIfMissing(
    client,
    orderContext,
    "order-confirmation",
    orderContext.payment,
    tickets,
  );

  if (orderConfirmation) {
    createdNotifications.push(orderConfirmation);
  }

  const issuedNotification = await createNotificationIfMissing(
    client,
    orderContext,
    "tickets-issued",
    orderContext.payment,
    tickets,
  );

  if (issuedNotification) {
    createdNotifications.push(issuedNotification);
  }

  if (createdNotifications.length > 0) {
    orderContext.notifications = [...orderContext.notifications, ...createdNotifications];
  }

  await appendAnalyticsEvent(client, {
    name: "order_approved",
    accountId: orderContext.order.accountId,
    orderId: orderId,
    eventId: orderContext.order.eventId,
    sessionId: orderContext.order.sessionId,
    payload: {
      paymentMethod: orderContext.order.paymentMethod,
      total: orderContext.order.pricing.total,
      tickets: orderContext.order.items.length,
    },
  });

  await appendAnalyticsEvent(client, {
    name: "tickets_issued",
    accountId: orderContext.order.accountId,
    orderId: orderId,
    eventId: orderContext.order.eventId,
    sessionId: orderContext.order.sessionId,
    payload: {
      tickets: tickets.length,
    },
  });

  if (createdNotifications.length > 0) {
    await appendAnalyticsEvent(client, {
      name: "notifications_dispatched",
      accountId: orderContext.order.accountId,
      orderId: orderId,
      eventId: orderContext.order.eventId,
      sessionId: orderContext.order.sessionId,
      payload: {
        notifications: createdNotifications.length,
      },
    });
  }

  await appendAuditLog(client, {
    actorType: actor.actorType ?? "system",
    actorId: actor.actorId ?? null,
    actorEmail: actor.actorEmail ?? null,
    action: "order.approved",
    targetTable: "orders",
    targetId: orderId,
    context: {
      paymentId: orderContext.payment.id,
      ticketsIssued: tickets.length,
    },
  });

  return getOrderContext(client, orderId);
};

export const expireActiveSeatHolds = async (sessionId, seatIds = null, options = {}) =>
  runWithMaybeTransaction(options.client, async (client) => expireActiveSeatHoldsInternal(client, sessionId, seatIds));

export const createSeatHold = async (
  { sessionId, seatIds, accountId = null, ttlMs = HOLD_TTL_MS, source = "checkout", metadata = {} },
  options = {},
) =>
  runWithMaybeTransaction(options.client, async (client) => {
    const uniqueSeatIds = Array.from(new Set(asArray(seatIds).filter(Boolean)));
    assertCondition(uniqueSeatIds.length > 0, "Nenhum assento foi informado para criar hold.");

    await expireActiveSeatHoldsInternal(client, sessionId, uniqueSeatIds);

    const seatsResult = await client.query(
      `
        select id, label, status
        from public.event_seats
        where session_id = $1
          and id = any($2::uuid[])
        order by id asc
        for update
      `,
      [sessionId, uniqueSeatIds],
    );

    assertCondition(seatsResult.rowCount === uniqueSeatIds.length, "Um ou mais assentos nao pertencem a esta sessao.");

    const blockingHoldsResult = await client.query(
      `
        select seat_id
        from public.seat_holds
        where session_id = $1
          and seat_id = any($2::uuid[])
          and status = 'active'
        for update
      `,
      [sessionId, uniqueSeatIds],
    );

    assertCondition(blockingHoldsResult.rowCount === 0, "Um ou mais assentos acabaram de ficar indisponiveis.");

    const blockedSeat = seatsResult.rows.find((row) => !["available", "accessible"].includes(row.status));
    assertCondition(!blockedSeat, `O assento ${blockedSeat?.label ?? ""} nao pode ser reservado neste momento.`);

    const holdToken = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + ttlMs).toISOString();
    const createdHolds = [];

    for (const seatRow of seatsResult.rows) {
      const result = await client.query(
        `
          insert into public.seat_holds (
            id, session_id, seat_id, hold_token, account_id, status, source, expires_at, metadata
          )
          values ($1, $2, $3, $4, $5, 'active', $6, $7, $8::jsonb)
          returning *
        `,
        [crypto.randomUUID(), sessionId, seatRow.id, holdToken, accountId, source, expiresAt, JSON.stringify(asObject(metadata))],
      );
      createdHolds.push(mapSeatHoldRow(result.rows[0]));
    }

    await setSeatStatus(client, uniqueSeatIds, "reserved");

    await appendAnalyticsEvent(client, {
      name: "seat_hold_created",
      accountId,
      sessionId,
      payload: {
        seats: uniqueSeatIds.length,
      },
    });

    await appendAuditLog(client, {
      actorType: accountId ? "account" : "system",
      actorId: accountId,
      action: "seat_hold.created",
      targetTable: "seat_holds",
      context: {
        holdToken,
        sessionId,
        seats: uniqueSeatIds.length,
      },
    });

    return {
      holdToken,
      sessionId,
      accountId,
      expiresAt,
      seats: createdHolds,
    };
  });

export const releaseSeatHold = async (holdToken, options = {}) =>
  runWithMaybeTransaction(options.client, async (client) => {
    const holdRows = await getHoldRowsByToken(client, holdToken, true);
    assertCondition(holdRows.length > 0, "Hold nao encontrado.");

    const activeRows = holdRows.filter((row) => row.status === "active");
    if (activeRows.length === 0) {
      return {
        holdToken,
        released: false,
        seats: holdRows,
      };
    }

    const updatedResult = await client.query(
      `
        update public.seat_holds
        set status = 'released', updated_at = timezone('utc'::text, now())
        where hold_token = $1
          and status = 'active'
        returning *
      `,
      [holdToken],
    );

    const seatIds = updatedResult.rows.map((row) => row.seat_id);
    await client.query(
      `
        update public.event_seats
        set status = 'available'
        where id = any($1::uuid[])
          and not exists (
            select 1
            from public.seat_holds blocking_hold
            where blocking_hold.seat_id = public.event_seats.id
              and blocking_hold.status in ('active', 'confirmed')
          )
      `,
      [seatIds],
    );

    await appendAnalyticsEvent(client, {
      name: "seat_hold_released",
      accountId: activeRows[0].accountId,
      sessionId: activeRows[0].sessionId,
      payload: {
        holdToken,
        seats: seatIds.length,
      },
    });

    await appendAuditLog(client, {
      actorType: options.actorType ?? (activeRows[0].accountId ? "account" : "system"),
      actorId: options.actorId ?? activeRows[0].accountId,
      actorEmail: options.actorEmail ?? null,
      action: "seat_hold.released",
      targetTable: "seat_holds",
      context: {
        holdToken,
        seats: seatIds.length,
      },
    });

    return {
      holdToken,
      released: true,
      seats: updatedResult.rows.map(mapSeatHoldRow),
    };
  });

export const createOrderWithPayment = async (
  {
    sessionId,
    holdToken = null,
    accountId = null,
    paymentMethod,
    installments = "1x",
    buyer,
    items,
    metadata = {},
    paymentMetadata = {},
    cardLast4 = "4242",
  },
  options = {},
) =>
  runWithMaybeTransaction(options.client, async (client) => {
    assertCondition(paymentMethod, "Metodo de pagamento e obrigatorio.");
    assertCondition(buyer?.fullName && buyer?.email, "Comprador precisa informar nome e email.");

    const normalizedItems = asArray(items).map((item) => ({
      seatId: item.seatId,
      holderName: item.holderName,
      holderDocument: item.holderDocument ?? item.document ?? null,
      ticketCategory: item.ticketCategory ?? "full",
      metadata: asObject(item.metadata),
    }));
    const uniqueSeatIds = Array.from(new Set(normalizedItems.map((item) => item.seatId).filter(Boolean)));
    assertCondition(uniqueSeatIds.length > 0, "Nenhum assento foi informado para o pedido.");
    assertCondition(uniqueSeatIds.length === normalizedItems.length, "Existem assentos duplicados no pedido.");

    const pricingContext = await getEventPricingContext(client, sessionId);
    await expireActiveSeatHoldsInternal(client, sessionId, uniqueSeatIds);

    const seatsResult = await client.query(
      `
        select
          seat.id,
          seat.seat_key,
          seat.label,
          seat.row_label,
          seat.base_price,
          seat.status,
          section.id as section_id,
          section.section_key,
          section.name as section_name
        from public.event_seats seat
        left join public.event_sections section on section.id = seat.section_id
        where seat.session_id = $1
          and seat.id = any($2::uuid[])
        order by seat.id asc
        for update of seat
      `,
      [sessionId, uniqueSeatIds],
    );
    assertCondition(seatsResult.rowCount === uniqueSeatIds.length, "Um ou mais assentos nao pertencem a esta sessao.");

    let holdRows = [];

    if (holdToken) {
      holdRows = await getHoldRowsByToken(client, holdToken, true);
      const activeHoldRows = holdRows.filter((row) => row.status === "active");
      assertCondition(activeHoldRows.length === uniqueSeatIds.length, "O hold informado nao cobre todos os assentos do pedido.");

      const coveredSeatIds = new Set(activeHoldRows.map((row) => row.seatId));
      const missingHoldSeat = uniqueSeatIds.find((seatId) => !coveredSeatIds.has(seatId));
      assertCondition(!missingHoldSeat, "O hold informado nao corresponde aos assentos do pedido.");
    } else {
      const blockingHolds = await client.query(
        `
          select seat_id
          from public.seat_holds
          where session_id = $1
            and seat_id = any($2::uuid[])
            and status = 'active'
        `,
        [sessionId, uniqueSeatIds],
      );
      assertCondition(blockingHolds.rowCount === 0, "Um ou mais assentos acabaram de ficar indisponiveis.");
    }

    const nonSelectableSeat = seatsResult.rows.find((row) => {
      if (holdToken) {
        return row.status === "sold" || row.status === "blocked";
      }

      return !["available", "accessible"].includes(row.status);
    });
    assertCondition(!nonSelectableSeat, `O assento ${nonSelectableSeat?.label ?? ""} nao pode compor este pedido.`);

    const itemBySeatId = new Map(normalizedItems.map((item) => [item.seatId, item]));
    const orderItemsPayload = seatsResult.rows.map((seatRow) => {
      const inputItem = itemBySeatId.get(seatRow.id);
      const multiplier = ticketCategoryMultipliers[inputItem.ticketCategory] ?? 1;
      const price = toMoney(Number(seatRow.base_price) * multiplier);

      assertCondition(inputItem?.holderName, `Titular ausente para o assento ${seatRow.label}.`);

      return {
        seatId: seatRow.id,
        seatKey: seatRow.seat_key,
        label: seatRow.label,
        rowLabel: seatRow.row_label,
        sectionId: seatRow.section_id,
        sectionKey: seatRow.section_key,
        sectionName: seatRow.section_name,
        holderName: inputItem.holderName,
        holderDocument: asNullableText(inputItem.holderDocument),
        ticketCategory: inputItem.ticketCategory,
        basePrice: toMoney(seatRow.base_price),
        price,
        metadata: inputItem.metadata,
      };
    });

    const subtotal = toMoney(orderItemsPayload.reduce((sum, item) => sum + item.price, 0));
    const serviceFee = toMoney(Number(pricingContext.service_fee_per_ticket ?? 0) * orderItemsPayload.length);
    const processingFee = orderItemsPayload.length > 0 ? toMoney(pricingContext.processing_fee_per_order ?? 0) : 0;
    const total = toMoney(subtotal + serviceFee + processingFee);
    const platformFeeRate = Number(pricingContext.platform_fee_rate ?? 0.1);
    const platformFeeTotal = toMoney(subtotal * platformFeeRate);
    const initialOrderStatus = paymentMethod === "corporate" ? "under_review" : "approved";
    const initialPaymentStatus = paymentMethod === "corporate" ? "under_review" : "authorized";
    const paymentProvider =
      paymentMethod === "pix" ? "provider-pix" : paymentMethod === "card" ? "provider-card" : "manual-corporate";

    const orderResult = await client.query(
      `
        insert into public.orders (
          id, reference, event_id, session_id, account_id, status, payment_method, installments,
          buyer_full_name, buyer_email, buyer_document, buyer_phone, buyer_city,
          subtotal, service_fee, processing_fee, total, platform_fee_rate, platform_fee_total, currency, hold_token, metadata
        )
        values (
          $1, $2, $3, $4, $5, $6, $7, $8,
          $9, $10, $11, $12, $13,
          $14, $15, $16, $17, $18, $19, $20, $21, $22::jsonb
        )
        returning *
      `,
      [
        crypto.randomUUID(),
        buildReference("PED"),
        pricingContext.event_id,
        sessionId,
        accountId,
        initialOrderStatus,
        paymentMethod,
        installments,
        buyer.fullName.trim(),
        buyer.email.trim().toLowerCase(),
        asNullableText(buyer.document),
        asNullableText(buyer.phone),
        asNullableText(buyer.city),
        subtotal,
        serviceFee,
        processingFee,
        total,
        platformFeeRate,
        platformFeeTotal,
        pricingContext.currency ?? "BRL",
        holdToken,
        JSON.stringify(asObject(metadata)),
      ],
    );

    const order = mapOrderRow(orderResult.rows[0]);

    if (holdToken) {
      await client.query(
        `
          update public.seat_holds
          set status = 'confirmed', order_id = $2, updated_at = timezone('utc'::text, now())
          where hold_token = $1
            and status = 'active'
        `,
        [holdToken, order.id],
      );
      holdRows = await getHoldRowsByToken(client, holdToken, false);
    } else {
      const syntheticHoldToken = crypto.randomUUID();
      holdRows = [];

      for (const item of orderItemsPayload) {
        const holdResult = await client.query(
          `
            insert into public.seat_holds (
              id, session_id, seat_id, hold_token, account_id, status, source, expires_at, order_id, metadata
            )
            values ($1, $2, $3, $4, $5, 'confirmed', 'checkout', timezone('utc'::text, now()), $6, $7::jsonb)
            returning *
          `,
          [crypto.randomUUID(), sessionId, item.seatId, syntheticHoldToken, accountId, order.id, JSON.stringify({ createdByOrder: true })],
        );
        holdRows.push(mapSeatHoldRow(holdResult.rows[0]));
      }
    }

    for (const item of orderItemsPayload) {
      const matchingHold = holdRows.find((holdRow) => holdRow.seatId === item.seatId);
      await client.query(
        `
          insert into public.order_items (
            id, order_id, seat_id, section_id, hold_id, seat_key, label, row_label, section_key, section_name,
            holder_name, holder_document, ticket_category, base_price, price, metadata
          )
          values (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
            $11, $12, $13, $14, $15, $16::jsonb
          )
        `,
        [
          crypto.randomUUID(),
          order.id,
          item.seatId,
          item.sectionId,
          matchingHold?.id ?? null,
          item.seatKey,
          item.label,
          item.rowLabel,
          item.sectionKey,
          item.sectionName,
          item.holderName,
          item.holderDocument,
          item.ticketCategory,
          item.basePrice,
          item.price,
          JSON.stringify(asObject(item.metadata)),
        ],
      );
    }

    const paymentReference = buildReference(paymentMethod === "pix" ? "PIX" : paymentMethod === "card" ? "CARD" : "CORP");
    const paymentResult = await client.query(
      `
        insert into public.payments (
          id, order_id, reference, provider, method, status, amount, currency, installments, pix_payload,
          pix_copy_paste, pix_expires_at, masked_card, corporate_protocol, authorized_at, metadata
        )
        values (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
          $11, $12, $13, $14, $15, $16::jsonb
        )
        returning *
      `,
      [
        crypto.randomUUID(),
        order.id,
        paymentReference,
        paymentProvider,
        paymentMethod,
        initialPaymentStatus,
        total,
        pricingContext.currency ?? "BRL",
        installments,
        paymentMethod === "pix"
          ? buildPixPayload({ paymentReference, orderReference: order.reference, amount: total })
          : null,
        paymentMethod === "pix" ? buildPixCopyPaste({ paymentReference, amount: total }) : null,
        paymentMethod === "pix" ? new Date(Date.now() + 15 * 60 * 1000).toISOString() : null,
        paymentMethod === "card" ? buildMaskedCard(cardLast4) : null,
        paymentMethod === "corporate" ? buildReference("REV") : null,
        initialPaymentStatus === "authorized" ? new Date().toISOString() : null,
        JSON.stringify(asObject(paymentMetadata)),
      ],
    );

    const payment = mapPaymentRow(paymentResult.rows[0]);
    await setSeatStatus(client, uniqueSeatIds, initialOrderStatus === "approved" ? "sold" : "reserved");

    await appendAnalyticsEvent(client, {
      name: initialPaymentStatus === "authorized" ? "payment_authorized" : "payment_under_review",
      accountId,
      orderId: order.id,
      eventId: pricingContext.event_id,
      sessionId,
      payload: {
        method: paymentMethod,
        amount: total,
        installments,
      },
    });

    await appendAuditLog(client, {
      actorType: accountId ? "account" : "system",
      actorId: accountId,
      action: "order.created",
      targetTable: "orders",
      targetId: order.id,
      context: {
        paymentMethod,
        seats: uniqueSeatIds.length,
        status: initialOrderStatus,
      },
    });

    if (initialOrderStatus === "under_review") {
      const orderContext = await getOrderContext(client, order.id);
      const reviewNotification = await createNotificationIfMissing(
        client,
        orderContext,
        "payment-under-review",
        payment,
        [],
      );

      if (reviewNotification) {
        await appendAnalyticsEvent(client, {
          name: "notifications_dispatched",
          accountId,
          orderId: order.id,
          eventId: pricingContext.event_id,
          sessionId,
          payload: {
            notifications: 1,
            template: "payment-under-review",
          },
        });
      }

      return getOrderContext(client, order.id);
    }

    return finalizeApproval(client, order.id, {
      actorType: accountId ? "account" : "system",
      actorId: accountId,
    });
  });

export const approveOrder = async (orderId, actor = {}, options = {}) =>
  runWithMaybeTransaction(options.client, async (client) => finalizeApproval(client, orderId, actor));

export const cancelOrder = async (orderId, actor = {}, options = {}) =>
  runWithMaybeTransaction(options.client, async (client) => {
    const orderContext = await getOrderContext(client, orderId, { lock: true });
    assertCondition(orderContext.order.status !== "cancelled", "Pedido ja esta cancelado.");

    const orderResult = await client.query(
      `
        update public.orders
        set status = 'cancelled'
        where id = $1
        returning *
      `,
      [orderId],
    );
    orderContext.order = {
      ...mapOrderRow(orderResult.rows[0]),
      items: orderContext.order.items,
    };

    if (orderContext.payment && orderContext.payment.status !== "refunded") {
      const paymentResult = await client.query(
        `
          update public.payments
          set status = 'refunded'
          where id = $1
          returning *
        `,
        [orderContext.payment.id],
      );
      orderContext.payment = mapPaymentRow(paymentResult.rows[0]);
    }

    await client.query(
      `
        update public.seat_holds
        set status = 'released', updated_at = timezone('utc'::text, now())
        where order_id = $1
          and status in ('active', 'confirmed')
      `,
      [orderId],
    );

    await setSeatStatus(
      client,
      orderContext.order.items.map((item) => item.seatId).filter(Boolean),
      "available",
    );

    if (orderContext.tickets.length > 0) {
      await client.query(
        `
          update public.tickets
          set status = 'cancelled', cancelled_at = timezone('utc'::text, now())
          where order_id = $1
            and status <> 'cancelled'
        `,
        [orderId],
      );
    }

    const cancelledNotification = await createNotificationIfMissing(
      client,
      orderContext,
      "order-cancelled",
      orderContext.payment,
      [],
    );

    await appendAnalyticsEvent(client, {
      name: "order_cancelled",
      accountId: orderContext.order.accountId,
      orderId,
      eventId: orderContext.order.eventId,
      sessionId: orderContext.order.sessionId,
      payload: {
        paymentMethod: orderContext.order.paymentMethod,
        total: orderContext.order.pricing.total,
      },
    });

    if (orderContext.tickets.length > 0) {
      await appendAnalyticsEvent(client, {
        name: "tickets_cancelled",
        accountId: orderContext.order.accountId,
        orderId,
        eventId: orderContext.order.eventId,
        sessionId: orderContext.order.sessionId,
        payload: {
          tickets: orderContext.tickets.length,
        },
      });
    }

    if (cancelledNotification) {
      await appendAnalyticsEvent(client, {
        name: "notifications_dispatched",
        accountId: orderContext.order.accountId,
        orderId,
        eventId: orderContext.order.eventId,
        sessionId: orderContext.order.sessionId,
        payload: {
          notifications: 1,
          template: "order-cancelled",
        },
      });
    }

    await appendAuditLog(client, {
      actorType: actor.actorType ?? "system",
      actorId: actor.actorId ?? null,
      actorEmail: actor.actorEmail ?? null,
      action: "order.cancelled",
      targetTable: "orders",
      targetId: orderId,
      context: {
        ticketsCancelled: orderContext.tickets.length,
      },
    });

    return getOrderContext(client, orderId);
  });

export const getOrderGraph = async (orderId, options = {}) =>
  runWithMaybeClient(options.client, async (client) => getOrderContext(client, orderId));
