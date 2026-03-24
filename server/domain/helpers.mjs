import crypto from "node:crypto";
import { withDbClient, withTransaction } from "../db/client.mjs";

export const runWithMaybeClient = async (client, callback) => {
  if (client) {
    return callback(client);
  }

  return withDbClient(callback);
};

export const runWithMaybeTransaction = async (client, callback) => {
  if (client) {
    return callback(client);
  }

  return withTransaction(callback);
};

export const asArray = (value) => (Array.isArray(value) ? value : []);

export const asObject = (value) =>
  value && typeof value === "object" && !Array.isArray(value) ? value : {};

export const asNullableText = (value) => {
  if (value === undefined || value === null) {
    return null;
  }

  const normalized = String(value).trim();
  return normalized.length > 0 ? normalized : null;
};

export const toMoney = (value) => {
  const numericValue = Number(value ?? 0);

  if (!Number.isFinite(numericValue)) {
    return 0;
  }

  return Math.round(numericValue * 100) / 100;
};

export const fromDbMoney = (value) => {
  const numericValue = Number(value ?? 0);
  return Number.isFinite(numericValue) ? numericValue : 0;
};

export const assertCondition = (condition, message) => {
  if (!condition) {
    throw new Error(message);
  }
};

export const buildReference = (prefix) => {
  const year = new Date().getFullYear();
  const suffix = crypto.randomBytes(4).toString("hex").toUpperCase();

  return `${prefix}-${year}-${suffix}`;
};

export const buildPixPayload = ({ paymentReference, orderReference, amount }) =>
  `pix://${paymentReference}/${orderReference}/${toMoney(amount).toFixed(2)}`;

export const buildPixCopyPaste = ({ paymentReference, amount }) =>
  `00020126580014BR.GOV.BCB.PIX0136${paymentReference}520400005303986540${toMoney(amount).toFixed(
    2,
  )}5802BR5920EVENTHUB PLATFORM6009SAO PAULO62070503***6304ABCD`;

export const buildMaskedCard = (cardLast4 = "4242") => `**** **** **** ${String(cardLast4).slice(-4)}`;

export const buildBarcode = ({ orderReference, seatKey }) =>
  `${String(orderReference).replace(/[^A-Z0-9]/gi, "").slice(-12)}${String(seatKey)
    .replace(/[^A-Z0-9]/gi, "")
    .slice(-8)}`;

export const buildQrPayload = ({ orderReference, eventSlug, seatKey }) =>
  `eventhub|${orderReference}|${eventSlug}|${seatKey}`;

export const buildWalletUrl = ({ ticketId, walletToken }) => `/conta?ticket=${ticketId}&wallet=${walletToken}`;

export const appendAnalyticsEvent = async (
  client,
  { name, accountId = null, orderId = null, eventId = null, sessionId = null, payload = {} },
) => {
  await client.query(
    `
      insert into public.analytics_events (name, account_id, order_id, event_id, session_id, payload)
      values ($1, $2, $3, $4, $5, $6::jsonb)
    `,
    [name, accountId, orderId, eventId, sessionId, JSON.stringify(asObject(payload))],
  );
};

export const appendAuditLog = async (
  client,
  {
    actorType = "system",
    actorId = null,
    actorEmail = null,
    action,
    targetTable,
    targetId = null,
    context = {},
  },
) => {
  await client.query(
    `
      insert into public.audit_log (actor_type, actor_id, actor_email, action, target_table, target_id, context)
      values ($1, $2, $3, $4, $5, $6, $7::jsonb)
    `,
    [actorType, actorId, actorEmail, action, targetTable, targetId, JSON.stringify(asObject(context))],
  );
};

export const mapOrderRow = (row) => ({
  id: row.id,
  reference: row.reference,
  eventId: row.event_id,
  sessionId: row.session_id,
  accountId: row.account_id,
  status: row.status,
  paymentMethod: row.payment_method,
  installments: row.installments,
  buyer: {
    fullName: row.buyer_full_name,
    email: row.buyer_email,
    document: row.buyer_document,
    phone: row.buyer_phone,
    city: row.buyer_city,
  },
  pricing: {
    subtotal: fromDbMoney(row.subtotal),
    serviceFee: fromDbMoney(row.service_fee),
    processingFee: fromDbMoney(row.processing_fee),
    total: fromDbMoney(row.total),
    platformFeeRate: Number(row.platform_fee_rate ?? 0),
    platformFeeTotal: fromDbMoney(row.platform_fee_total),
  },
  holdToken: row.hold_token,
  currency: row.currency,
  metadata: asObject(row.metadata),
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

export const mapPaymentRow = (row) => ({
  id: row.id,
  orderId: row.order_id,
  reference: row.reference,
  provider: row.provider,
  method: row.method,
  status: row.status,
  amount: fromDbMoney(row.amount),
  currency: row.currency,
  installments: row.installments,
  pixPayload: row.pix_payload,
  pixCopyPaste: row.pix_copy_paste,
  pixExpiresAt: row.pix_expires_at,
  maskedCard: row.masked_card,
  corporateProtocol: row.corporate_protocol,
  authorizedAt: row.authorized_at,
  metadata: asObject(row.metadata),
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

export const mapTicketRow = (row) => ({
  id: row.id,
  orderId: row.order_id,
  orderItemId: row.order_item_id,
  accountId: row.account_id,
  eventId: row.event_id,
  sessionId: row.session_id,
  seatId: row.seat_id,
  holderName: row.holder_name,
  holderDocument: row.holder_document,
  label: row.label,
  sectionName: row.section_name,
  barcode: row.barcode,
  qrPayload: row.qr_payload,
  walletToken: row.wallet_token,
  walletUrl: row.wallet_url,
  status: row.status,
  issuedAt: row.issued_at,
  usedAt: row.used_at,
  cancelledAt: row.cancelled_at,
  metadata: asObject(row.metadata),
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

export const mapNotificationRow = (row) => ({
  id: row.id,
  orderId: row.order_id,
  accountId: row.account_id,
  eventId: row.event_id,
  channel: row.channel,
  template: row.template,
  recipient: row.recipient,
  subject: row.subject,
  preview: row.preview,
  status: row.status,
  sentAt: row.sent_at,
  metadata: asObject(row.metadata),
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

export const mapSeatHoldRow = (row) => ({
  id: row.id,
  sessionId: row.session_id,
  seatId: row.seat_id,
  holdToken: row.hold_token,
  accountId: row.account_id,
  status: row.status,
  source: row.source,
  expiresAt: row.expires_at,
  orderId: row.order_id,
  metadata: asObject(row.metadata),
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});
