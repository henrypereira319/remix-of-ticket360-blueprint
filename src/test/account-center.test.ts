import { describe, expect, it } from "vitest";
import {
  buildOrderTimeline,
  filterOrdersByStatus,
  humanizeEventSlug,
  maskDocument,
  maskEmail,
} from "@/lib/account-center";
import type { CheckoutOrderRecord } from "@/server/checkout.service";
import type { NotificationRecord } from "@/server/notification.service";
import type { PaymentRecord } from "@/server/payment.service";
import type { IssuedTicketRecord } from "@/server/ticket.service";

const mockOrder: CheckoutOrderRecord = {
  id: "order_1",
  reference: "PED-2026-123456",
  status: "approved",
  eventId: "event_1",
  eventSlug: "hamlet-cia-teatro-novo",
  accountId: "account_1",
  holdToken: "hold_1",
  paymentMethod: "pix",
  installments: "1x",
  buyer: {
    fullName: "Maria da Silva",
    email: "maria@eventhub.dev",
    document: "12345678900",
    phone: "11999999999",
    city: "Sao Paulo / SP",
  },
  tickets: [
    {
      seatId: "plateia-a1",
      label: "A1",
      sectionId: "plateia",
      sectionName: "Plateia",
      basePrice: 280,
      price: 280,
      ticketCategory: "full",
      holderName: "Maria da Silva",
      document: "12345678900",
    },
  ],
  pricing: {
    subtotal: 280,
    serviceFee: 24,
    processingFee: 4.9,
    total: 308.9,
  },
  createdAt: "2026-03-21T12:00:00.000Z",
  updatedAt: "2026-03-21T12:02:00.000Z",
};

const mockPayment: PaymentRecord = {
  id: "payment_1",
  orderId: "order_1",
  orderReference: "PED-2026-123456",
  eventId: "event_1",
  eventSlug: "hamlet-cia-teatro-novo",
  accountId: "account_1",
  method: "pix",
  provider: "local-pix",
  status: "authorized",
  amount: 308.9,
  currency: "BRL",
  installments: "1x",
  reference: "PIX-12345678",
  pixPayload: "pix://PIX-12345678",
  pixCopyPaste: "000201...",
  pixExpiresAt: "2026-03-21T12:15:00.000Z",
  createdAt: "2026-03-21T12:00:30.000Z",
  updatedAt: "2026-03-21T12:00:30.000Z",
  authorizedAt: "2026-03-21T12:00:30.000Z",
};

const mockTickets: IssuedTicketRecord[] = [
  {
    id: "ticket_1",
    orderId: "order_1",
    orderReference: "PED-2026-123456",
    eventId: "event_1",
    eventSlug: "hamlet-cia-teatro-novo",
    accountId: "account_1",
    seatId: "plateia-a1",
    label: "A1",
    sectionId: "plateia",
    sectionName: "Plateia",
    holderName: "Maria da Silva",
    document: "12345678900",
    qrPayload: "eventhub|PED-2026-123456|hamlet-cia-teatro-novo|plateia-a1",
    barcode: "1234567890",
    walletToken: "wallet_1",
    walletUrl: "/conta?ticket=ticket_1&wallet=wallet_1",
    status: "issued",
    issuedAt: "2026-03-21T12:02:10.000Z",
    updatedAt: "2026-03-21T12:02:10.000Z",
  },
];

const mockNotifications: NotificationRecord[] = [
  {
    id: "notification_1",
    accountId: "account_1",
    orderId: "order_1",
    eventId: "event_1",
    eventSlug: "hamlet-cia-teatro-novo",
    channel: "email",
    template: "order-confirmation",
    recipient: "maria@eventhub.dev",
    subject: "Pedido confirmado",
    preview: "Seu pedido foi confirmado.",
    status: "sent",
    createdAt: "2026-03-21T12:02:20.000Z",
    sentAt: "2026-03-21T12:02:20.000Z",
    metadata: {
      total: 308.9,
    },
  },
];

describe("account center helpers", () => {
  it("filters orders by current status", () => {
    const cancelledOrder: CheckoutOrderRecord = {
      ...mockOrder,
      id: "order_2",
      reference: "PED-2026-654321",
      status: "cancelled",
    };

    expect(filterOrdersByStatus([mockOrder, cancelledOrder], "all")).toHaveLength(2);
    expect(filterOrdersByStatus([mockOrder, cancelledOrder], "approved")).toEqual([mockOrder]);
    expect(filterOrdersByStatus([mockOrder, cancelledOrder], "cancelled")).toEqual([cancelledOrder]);
  });

  it("builds a descending timeline with payment, order, tickets and notifications", () => {
    const timeline = buildOrderTimeline({
      order: mockOrder,
      payment: mockPayment,
      tickets: mockTickets,
      notifications: mockNotifications,
    });

    expect(timeline.map((item) => item.title)).toEqual([
      "Confirmacao do pedido",
      "Ingressos emitidos",
      "Pedido aprovado",
      "Pagamento autorizado",
      "Pedido criado",
    ]);
  });

  it("formats event slugs and masks sensitive fields", () => {
    expect(humanizeEventSlug("hamlet-cia-teatro-novo")).toBe("Hamlet Cia Teatro Novo");
    expect(maskEmail("maria@eventhub.dev")).toBe("ma***a@eventhub.dev");
    expect(maskDocument("12345678900")).toBe("123.***.***-00");
  });
});
