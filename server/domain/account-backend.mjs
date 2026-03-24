import { withDbClient } from "../db/client.mjs";
import { asObject, toMoney } from "./helpers.mjs";

const mapOrderItemsByOrderId = (rows) => {
  const itemsByOrderId = new Map();

  rows.forEach((row) => {
    itemsByOrderId.set(row.order_id, [
      ...(itemsByOrderId.get(row.order_id) ?? []),
      {
        seatId: asObject(row.metadata).localSeatId ?? row.seat_key,
        label: row.label,
        sectionId: row.section_id,
        sectionName: row.section_name,
        basePrice: toMoney(row.base_price),
        price: toMoney(row.price),
        ticketCategory: row.ticket_category,
        holderName: row.holder_name,
        document: row.holder_document ?? "",
      },
    ]);
  });

  return itemsByOrderId;
};

export const listOrdersByLocalAccountId = async (localAccountId) =>
  withDbClient(async (client) => {
    const ordersResult = await client.query(
      `
        select o.*, e.slug as event_slug
        from public.orders o
        inner join public.events e on e.id = o.event_id
        where o.metadata ->> 'localAccountId' = $1
        order by o.created_at desc
      `,
      [localAccountId],
    );

    const orderIds = ordersResult.rows.map((row) => row.id);
    const itemsResult =
      orderIds.length > 0
        ? await client.query("select * from public.order_items where order_id = any($1::uuid[]) order by created_at asc", [orderIds])
        : { rows: [] };
    const itemsByOrderId = mapOrderItemsByOrderId(itemsResult.rows);

    return ordersResult.rows.map((row) => ({
      id: row.id,
      reference: row.reference,
      status: row.status,
      eventId: row.event_id,
      eventSlug: row.event_slug,
      accountId: localAccountId,
      holdToken: row.hold_token,
      paymentMethod: row.payment_method,
      installments: row.installments,
      buyer: {
        fullName: row.buyer_full_name,
        email: row.buyer_email,
        document: row.buyer_document ?? "",
        phone: row.buyer_phone ?? "",
        city: row.buyer_city ?? "",
      },
      tickets: itemsByOrderId.get(row.id) ?? [],
      pricing: {
        subtotal: toMoney(row.subtotal),
        serviceFee: toMoney(row.service_fee),
        processingFee: toMoney(row.processing_fee),
        total: toMoney(row.total),
      },
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
  });

export const listPaymentsByLocalAccountId = async (localAccountId) =>
  withDbClient(async (client) => {
    const result = await client.query(
      `
        select p.*, o.reference as order_reference, o.account_id, e.id as event_id, e.slug as event_slug
        from public.payments p
        inner join public.orders o on o.id = p.order_id
        inner join public.events e on e.id = o.event_id
        where o.metadata ->> 'localAccountId' = $1
        order by p.created_at desc
      `,
      [localAccountId],
    );

    return result.rows.map((row) => ({
      id: row.id,
      orderId: row.order_id,
      orderReference: row.order_reference,
      eventId: row.event_id,
      eventSlug: row.event_slug,
      accountId: localAccountId,
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
    }));
  });

export const listTicketsByLocalAccountId = async (localAccountId) =>
  withDbClient(async (client) => {
    const result = await client.query(
      `
        select t.*, o.reference as order_reference, e.slug as event_slug, oi.metadata as order_item_metadata
        from public.tickets t
        inner join public.orders o on o.id = t.order_id
        inner join public.events e on e.id = t.event_id
        left join public.order_items oi on oi.id = t.order_item_id
        where o.metadata ->> 'localAccountId' = $1
        order by t.issued_at desc
      `,
      [localAccountId],
    );

    return result.rows.map((row) => ({
      id: row.id,
      orderId: row.order_id,
      orderReference: row.order_reference,
      eventId: row.event_id,
      eventSlug: row.event_slug,
      accountId: localAccountId,
      seatId: asObject(row.order_item_metadata).localSeatId ?? row.seat_id,
      label: row.label,
      sectionId: row.section_name,
      sectionName: row.section_name,
      holderName: row.holder_name,
      document: row.holder_document ?? "",
      qrPayload: row.qr_payload,
      barcode: row.barcode,
      walletToken: row.wallet_token,
      walletUrl: row.wallet_url,
      status: row.status,
      issuedAt: row.issued_at,
      updatedAt: row.updated_at,
    }));
  });

export const listNotificationsByLocalAccountId = async (localAccountId) =>
  withDbClient(async (client) => {
    const result = await client.query(
      `
        select n.*, e.slug as event_slug
        from public.notifications n
        inner join public.orders o on o.id = n.order_id
        left join public.events e on e.id = n.event_id
        where o.metadata ->> 'localAccountId' = $1
        order by n.created_at desc
      `,
      [localAccountId],
    );

    return result.rows.map((row) => ({
      id: row.id,
      accountId: localAccountId,
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
    }));
  });
