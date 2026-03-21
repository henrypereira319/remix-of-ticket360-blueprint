import type { CheckoutOrderPaymentMethod, CheckoutOrderRecord } from "@/server/checkout.service";
import { trackAnalyticsEvent } from "@/server/analytics.service";
import { createPersistentId, emitStorageMutation, readStorageJson, writeStorageJson } from "@/server/storage";

const PAYMENTS_STORAGE_KEY = "eventhub.payments";
const PAYMENTS_CHANNEL = "payments";

export type PaymentStatus = "authorized" | "under_review" | "failed" | "expired" | "refunded";
export type PaymentProvider = "local-pix" | "local-card" | "manual-corporate";

export interface PaymentRecord {
  id: string;
  orderId: string;
  orderReference: string;
  eventId: string;
  eventSlug: string;
  accountId?: string | null;
  method: CheckoutOrderPaymentMethod;
  provider: PaymentProvider;
  status: PaymentStatus;
  amount: number;
  currency: "BRL";
  installments: string;
  reference: string;
  pixPayload?: string;
  pixCopyPaste?: string;
  pixExpiresAt?: string | null;
  maskedCard?: string;
  corporateProtocol?: string;
  createdAt: string;
  updatedAt: string;
  authorizedAt?: string | null;
}

const nowIso = () => new Date().toISOString();

const buildReference = (prefix: string) => `${prefix}-${Math.random().toString().slice(2, 10)}`;

export const getStoredPayments = () => readStorageJson<PaymentRecord[]>(PAYMENTS_STORAGE_KEY, []);

const persistPayments = (payments: PaymentRecord[]) => {
  writeStorageJson(PAYMENTS_STORAGE_KEY, payments);
  emitStorageMutation(PAYMENTS_CHANNEL);
};

export const getPaymentByOrder = (orderId: string) => getStoredPayments().find((payment) => payment.orderId === orderId);

export const getPaymentsByAccount = (accountId?: string | null) =>
  accountId ? getStoredPayments().filter((payment) => payment.accountId === accountId) : [];

const buildBasePayment = (order: CheckoutOrderRecord, overrides: Partial<PaymentRecord>): PaymentRecord => ({
  id: createPersistentId("payment"),
  orderId: order.id,
  orderReference: order.reference,
  eventId: order.eventId,
  eventSlug: order.eventSlug,
  accountId: order.accountId ?? null,
  method: order.paymentMethod,
  provider: "local-card",
  status: "authorized",
  amount: order.pricing.total,
  currency: "BRL",
  installments: order.installments,
  reference: buildReference("PAY"),
  createdAt: nowIso(),
  updatedAt: nowIso(),
  authorizedAt: null,
  ...overrides,
});

export const createPaymentForOrder = (order: CheckoutOrderRecord): PaymentRecord => {
  const existingPayment = getPaymentByOrder(order.id);

  if (existingPayment) {
    return existingPayment;
  }

  const currentTime = nowIso();
  let payment: PaymentRecord;

  if (order.paymentMethod === "pix") {
    const pixReference = buildReference("PIX");
    payment = buildBasePayment(order, {
      provider: "local-pix",
      status: "authorized",
      reference: pixReference,
      pixPayload: `pix://${pixReference}/${order.reference}/${order.pricing.total.toFixed(2)}`,
      pixCopyPaste: `00020126580014BR.GOV.BCB.PIX0136${pixReference}520400005303986540${order.pricing.total.toFixed(2)}5802BR5920EVENTHUB LOCAL6009SAO PAULO62070503***6304ABCD`,
      pixExpiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
      authorizedAt: currentTime,
      createdAt: currentTime,
      updatedAt: currentTime,
    });
  } else if (order.paymentMethod === "card") {
    payment = buildBasePayment(order, {
      provider: "local-card",
      status: "authorized",
      reference: buildReference("CARD"),
      maskedCard: "**** **** **** 4242",
      authorizedAt: currentTime,
      createdAt: currentTime,
      updatedAt: currentTime,
    });
  } else {
    payment = buildBasePayment(order, {
      provider: "manual-corporate",
      status: "under_review",
      reference: buildReference("CORP"),
      corporateProtocol: buildReference("REV"),
      createdAt: currentTime,
      updatedAt: currentTime,
    });
  }

  persistPayments([payment, ...getStoredPayments()]);

  trackAnalyticsEvent({
    name: payment.status === "authorized" ? "payment_authorized" : "payment_under_review",
    accountId: order.accountId ?? null,
    eventId: order.eventId,
    eventSlug: order.eventSlug,
    orderId: order.id,
    payload: {
      method: order.paymentMethod,
      amount: order.pricing.total,
      installments: order.installments,
    },
  });

  return payment;
};

export const authorizePayment = (paymentId: string): PaymentRecord => {
  const payments = getStoredPayments();
  const paymentIndex = payments.findIndex((payment) => payment.id === paymentId);

  if (paymentIndex === -1) {
    throw new Error("Pagamento nao encontrado.");
  }

  const currentTime = nowIso();
  const updatedPayment: PaymentRecord = {
    ...payments[paymentIndex],
    status: "authorized",
    authorizedAt: currentTime,
    updatedAt: currentTime,
  };

  const nextPayments = [...payments];
  nextPayments[paymentIndex] = updatedPayment;
  persistPayments(nextPayments);

  trackAnalyticsEvent({
    name: "payment_authorized",
    accountId: updatedPayment.accountId ?? null,
    eventId: updatedPayment.eventId,
    eventSlug: updatedPayment.eventSlug,
    orderId: updatedPayment.orderId,
    payload: {
      method: updatedPayment.method,
      amount: updatedPayment.amount,
    },
  });

  return updatedPayment;
};

export const refundPayment = (paymentId: string): PaymentRecord => {
  const payments = getStoredPayments();
  const paymentIndex = payments.findIndex((payment) => payment.id === paymentId);

  if (paymentIndex === -1) {
    throw new Error("Pagamento nao encontrado.");
  }

  const currentTime = nowIso();
  const updatedPayment: PaymentRecord = {
    ...payments[paymentIndex],
    status: "refunded",
    updatedAt: currentTime,
  };

  const nextPayments = [...payments];
  nextPayments[paymentIndex] = updatedPayment;
  persistPayments(nextPayments);

  return updatedPayment;
};

export const paymentStorageChannel = PAYMENTS_CHANNEL;
