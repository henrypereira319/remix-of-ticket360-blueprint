import type { EventData } from "@/data/events";
import type { TicketCategory } from "@/lib/ticketing";
import { getCheckoutPricing, getSeatById, getSectionById, getSelectionSummary, sanitizeSelectedSeatIds } from "@/lib/ticketing";
import { trackAnalyticsEvent } from "@/server/analytics.service";
import { dispatchOrderCancelledNotification, dispatchOrderNotifications, dispatchPaymentUnderReviewNotification } from "@/server/notification.service";
import { authorizePayment, createPaymentForOrder, getPaymentByOrder, refundPayment } from "@/server/payment.service";
import { confirmHeldSeats, confirmReservedSeatsForOrder, releaseOrderSeatReservations, reserveSeatsForReview } from "@/server/seat-inventory.service";
import { createPersistentId, emitStorageMutation, readStorageJson, writeStorageJson } from "@/server/storage";
import { cancelTicketsForOrder, issueTicketsForOrder } from "@/server/ticket.service";

const ORDERS_STORAGE_KEY = "eventhub.orders";
const ORDERS_CHANNEL = "orders";

export type CheckoutPaymentMethod = "pix" | "card" | "corporate";
export type CheckoutOrderPaymentMethod = CheckoutPaymentMethod;
export type CheckoutOrderStatus = "submitted" | "under_review" | "approved" | "cancelled";

export interface CheckoutBuyerRecord {
  fullName: string;
  email: string;
  document: string;
  phone: string;
  city: string;
}

export interface CheckoutHolderInput {
  seatId: string;
  holderName: string;
  document: string;
}

export interface CheckoutOrderTicketRecord {
  seatId: string;
  label: string;
  sectionId: string;
  sectionName: string;
  basePrice: number;
  price: number;
  ticketCategory: TicketCategory;
  holderName: string;
  document: string;
}

export interface CheckoutOrderRecord {
  id: string;
  reference: string;
  status: CheckoutOrderStatus;
  eventId: string;
  eventSlug: string;
  accountId?: string | null;
  holdToken?: string | null;
  paymentMethod: CheckoutPaymentMethod;
  installments: string;
  buyer: CheckoutBuyerRecord;
  tickets: CheckoutOrderTicketRecord[];
  pricing: ReturnType<typeof getCheckoutPricing>;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCheckoutOrderInput {
  event: EventData;
  selectedSeatIds: string[];
  ticketCategories: Record<string, TicketCategory>;
  buyer: CheckoutBuyerRecord;
  tickets: CheckoutHolderInput[];
  paymentMethod: CheckoutPaymentMethod;
  installments: string;
  accountId?: string | null;
  holdToken?: string | null;
}

const nowIso = () => new Date().toISOString();
const createReference = () => `PED-${new Date().getFullYear()}-${Math.random().toString().slice(2, 8)}`;

export const getStoredOrders = () => readStorageJson<CheckoutOrderRecord[]>(ORDERS_STORAGE_KEY, []);

const persistOrders = (orders: CheckoutOrderRecord[]) => {
  writeStorageJson(ORDERS_STORAGE_KEY, orders);
  emitStorageMutation(ORDERS_CHANNEL);
};

const updateStoredOrderStatus = (orderId: string, status: CheckoutOrderStatus) => {
  const orders = getStoredOrders();
  const orderIndex = orders.findIndex((item) => item.id === orderId);

  if (orderIndex === -1) {
    throw new Error("Pedido nao encontrado.");
  }

  const updatedOrder: CheckoutOrderRecord = {
    ...orders[orderIndex],
    status,
    updatedAt: nowIso(),
  };

  const nextOrders = [...orders];
  nextOrders[orderIndex] = updatedOrder;
  persistOrders(nextOrders);

  return updatedOrder;
};

export const approveCheckoutOrder = (orderId: string): CheckoutOrderRecord => {
  const payment = getPaymentByOrder(orderId);

  if (!payment || payment.status !== "authorized") {
    throw new Error("O pagamento ainda nao esta autorizado para emissao dos ingressos.");
  }
  const approvedOrder = updateStoredOrderStatus(orderId, "approved");
  confirmReservedSeatsForOrder(orderId);

  const issuedTickets = issueTicketsForOrder(approvedOrder);
  dispatchOrderNotifications(approvedOrder, issuedTickets);
  trackAnalyticsEvent({
    name: "order_approved",
    accountId: approvedOrder.accountId ?? null,
    eventId: approvedOrder.eventId,
    eventSlug: approvedOrder.eventSlug,
    orderId: approvedOrder.id,
    payload: {
      paymentMethod: approvedOrder.paymentMethod,
      total: approvedOrder.pricing.total,
      tickets: approvedOrder.tickets.length,
    },
  });

  return approvedOrder;
};

export const settleOrderPayment = (orderId: string): CheckoutOrderRecord => {
  const payment = getPaymentByOrder(orderId);

  if (!payment) {
    throw new Error("Nao existe pagamento vinculado a este pedido.");
  }

  if (payment.status !== "authorized") {
    authorizePayment(payment.id);
  }

  return approveCheckoutOrder(orderId);
};

export const cancelCheckoutOrder = (orderId: string): CheckoutOrderRecord => {
  const payment = getPaymentByOrder(orderId);
  const cancelledOrder = updateStoredOrderStatus(orderId, "cancelled");

  if (payment && payment.status !== "refunded") {
    refundPayment(payment.id);
  }

  releaseOrderSeatReservations(orderId);
  cancelTicketsForOrder(orderId);
  dispatchOrderCancelledNotification(cancelledOrder);

  trackAnalyticsEvent({
    name: "order_cancelled",
    accountId: cancelledOrder.accountId ?? null,
    eventId: cancelledOrder.eventId,
    eventSlug: cancelledOrder.eventSlug,
    orderId: cancelledOrder.id,
    payload: {
      paymentMethod: cancelledOrder.paymentMethod,
      total: cancelledOrder.pricing.total,
    },
  });

  return cancelledOrder;
};

export const createCheckoutOrder = (input: CreateCheckoutOrderInput): CheckoutOrderRecord => {
  const selectedSeatIds = sanitizeSelectedSeatIds(input.event, input.selectedSeatIds);

  if (selectedSeatIds.length === 0) {
    throw new Error("Nenhum assento valido foi informado para o pedido.");
  }

  const selection = getSelectionSummary(input.event, selectedSeatIds, input.ticketCategories);

  if (selection.items.length !== selectedSeatIds.length) {
    throw new Error("O resumo de assentos nao corresponde ao pedido informado.");
  }

  const ticketMap = new Map(input.tickets.map((ticket) => [ticket.seatId, ticket]));
  const missingTicketInfo = selection.items.find((item) => !ticketMap.get(item.seatId)?.holderName || !ticketMap.get(item.seatId)?.document);

  if (missingTicketInfo) {
    throw new Error(`Preencha os dados do titular do assento ${missingTicketInfo.label}.`);
  }

  const pricing = getCheckoutPricing(selection.total, selection.items.length);
  const createdAt = nowIso();
  const orderId = createPersistentId("order");

  const order: CheckoutOrderRecord = {
    id: orderId,
    reference: createReference(),
    status: "submitted",
    eventId: input.event.id,
    eventSlug: input.event.slug,
    accountId: input.accountId ?? null,
    holdToken: input.holdToken ?? null,
    paymentMethod: input.paymentMethod,
    installments: input.installments,
    buyer: {
      fullName: input.buyer.fullName.trim(),
      email: input.buyer.email.trim().toLowerCase(),
      document: input.buyer.document.trim(),
      phone: input.buyer.phone.trim(),
      city: input.buyer.city.trim(),
    },
    tickets: selection.items.map((item) => {
      const holder = ticketMap.get(item.seatId)!;
      const seat = getSeatById(input.event, item.seatId);
      const section = getSectionById(input.event, item.section.id);

      if (!seat || !section) {
        throw new Error(`Nao foi possivel montar o ticket do assento ${item.seatId}.`);
      }

      return {
        seatId: item.seatId,
        label: seat.label,
        sectionId: section.id,
        sectionName: section.name,
        basePrice: item.basePrice,
        price: item.price,
        ticketCategory: item.ticketCategory,
        holderName: holder.holderName.trim(),
        document: holder.document.trim(),
      };
    }),
    pricing,
    createdAt,
    updatedAt: createdAt,
  };

  persistOrders([order, ...getStoredOrders()]);
  const payment = createPaymentForOrder(order);

  if (payment.status === "authorized") {
    confirmHeldSeats(input.event, selectedSeatIds, order.id, input.holdToken);
    return approveCheckoutOrder(order.id);
  }

  reserveSeatsForReview(input.event, selectedSeatIds, order.id, input.holdToken);
  const reviewedOrder = updateStoredOrderStatus(order.id, "under_review");
  dispatchPaymentUnderReviewNotification(reviewedOrder, payment);
  return reviewedOrder;
};

export const getOrdersByAccount = (accountId?: string | null) =>
  accountId ? getStoredOrders().filter((order) => order.accountId === accountId) : [];

export const checkoutStorageChannel = ORDERS_CHANNEL;
