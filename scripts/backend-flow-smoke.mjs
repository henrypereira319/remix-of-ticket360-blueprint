import {
  getEventCatalogGraph,
  replaceSessionSections,
  replaceSessionSeats,
  upsertEvent,
  upsertEventSession,
  upsertVenue,
} from "../server/domain/catalog-backend.mjs";
import {
  approveOrder,
  cancelOrder,
  createOrderWithPayment,
  createSeatHold,
  getOrderGraph,
} from "../server/domain/ticketing-backend.mjs";

const buildDemoCatalog = async () => {
  const slugSuffix = Date.now().toString().slice(-8);
  const venue = await upsertVenue({
    slug: `smoke-venue-${slugSuffix}`,
    name: `Smoke Venue ${slugSuffix}`,
    city: "Sao Paulo",
    state: "SP",
    address: "Rua de Teste, 100",
    kind: "seated",
    seatMapManifest: {
      hallName: "Sala Smoke",
      totalSeats: 4,
    },
  });

  const event = await upsertEvent({
    slug: `smoke-event-${slugSuffix}`,
    title: `Smoke Event ${slugSuffix}`,
    summary: "Fluxo definitivo de hold, pedido, aprovacao e cancelamento.",
    description: "Evento tecnico de prova de vida para backend real no Supabase/Postgres.",
    category: "Operacao",
    city: "Sao Paulo / SP",
    venueId: venue.id,
    priceFrom: 140,
    serviceFeePerTicket: 18,
    processingFeePerOrder: 4.9,
    platformFeeRate: 0.1,
    status: "published",
    publishedAt: new Date().toISOString(),
    securityNotes: ["Smoke test backend"],
  });

  const session = await upsertEventSession({
    eventId: event.id,
    startsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    doorsOpenAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000 - 60 * 60 * 1000).toISOString(),
    salesStartAt: new Date().toISOString(),
    status: "onsale",
    capacity: 4,
  });

  const sections = await replaceSessionSections(session.id, [
    {
      sectionKey: "plateia-a",
      name: "Plateia A",
      shortLabel: "P.A",
      price: 140,
      position: 0,
      tone: "orange",
    },
    {
      sectionKey: "plateia-b",
      name: "Plateia B",
      shortLabel: "P.B",
      price: 110,
      position: 1,
      tone: "slate",
    },
  ]);

  const sectionIdByKey = new Map(sections.map((section) => [section.sectionKey, section.id]));

  const seats = await replaceSessionSeats(session.id, [
    {
      seatKey: "plateia-a-a1",
      label: "A1",
      rowLabel: "A",
      seatNumber: 1,
      areaLabel: "Plateia A",
      sectionId: sectionIdByKey.get("plateia-a"),
      basePrice: 140,
      status: "available",
    },
    {
      seatKey: "plateia-a-a2",
      label: "A2",
      rowLabel: "A",
      seatNumber: 2,
      areaLabel: "Plateia A",
      sectionId: sectionIdByKey.get("plateia-a"),
      basePrice: 140,
      status: "available",
    },
    {
      seatKey: "plateia-b-b1",
      label: "B1",
      rowLabel: "B",
      seatNumber: 1,
      areaLabel: "Plateia B",
      sectionId: sectionIdByKey.get("plateia-b"),
      basePrice: 110,
      status: "available",
    },
    {
      seatKey: "plateia-b-b2",
      label: "B2",
      rowLabel: "B",
      seatNumber: 2,
      areaLabel: "Plateia B",
      sectionId: sectionIdByKey.get("plateia-b"),
      basePrice: 110,
      status: "accessible",
    },
  ]);

  return { venue, event, session, sections, seats };
};

const run = async () => {
  const catalog = await buildDemoCatalog();

  const hold = await createSeatHold({
    sessionId: catalog.session.id,
    seatIds: [catalog.seats[0].id, catalog.seats[1].id],
    metadata: { smoke: true },
  });

  const underReviewOrder = await createOrderWithPayment({
    sessionId: catalog.session.id,
    holdToken: hold.holdToken,
    paymentMethod: "corporate",
    installments: "1x",
    buyer: {
      fullName: "Smoke Buyer",
      email: "smoke@example.com",
      document: "11122233344",
      phone: "11999999999",
      city: "Sao Paulo",
    },
    items: [
      {
        seatId: catalog.seats[0].id,
        holderName: "Smoke Holder 1",
        holderDocument: "11122233344",
        ticketCategory: "full",
      },
      {
        seatId: catalog.seats[1].id,
        holderName: "Smoke Holder 2",
        holderDocument: "55566677788",
        ticketCategory: "half",
      },
    ],
    metadata: {
      smoke: true,
      flow: "under_review_then_approve",
    },
  });

  const approvedOrder = await approveOrder(underReviewOrder.order.id, {
    actorType: "operator",
    actorEmail: "ops-smoke@example.com",
  });

  const directOrder = await createOrderWithPayment({
    sessionId: catalog.session.id,
    paymentMethod: "pix",
    buyer: {
      fullName: "Pix Buyer",
      email: "pix@example.com",
      document: "99988877766",
      phone: "11888888888",
      city: "Campinas",
    },
    items: [
      {
        seatId: catalog.seats[2].id,
        holderName: "Pix Holder",
        holderDocument: "99988877766",
        ticketCategory: "social",
      },
    ],
    metadata: {
      smoke: true,
      flow: "direct_pix_then_cancel",
    },
  });

  const cancelledOrder = await cancelOrder(directOrder.order.id, {
    actorType: "operator",
    actorEmail: "ops-smoke@example.com",
  });

  const [catalogGraph, approvedGraph, cancelledGraph] = await Promise.all([
    getEventCatalogGraph(catalog.event.id),
    getOrderGraph(approvedOrder.order.id),
    getOrderGraph(cancelledOrder.order.id),
  ]);

  console.log("backend flow smoke ok");
  console.log(
    JSON.stringify(
      {
        event: {
          id: catalogGraph.event.id,
          slug: catalogGraph.event.slug,
          sessions: catalogGraph.sessions.length,
          seats: catalogGraph.sessions[0]?.seats.length ?? 0,
        },
        approvedOrder: {
          reference: approvedGraph.order.reference,
          status: approvedGraph.order.status,
          paymentStatus: approvedGraph.payment?.status ?? null,
          tickets: approvedGraph.tickets.length,
          notifications: approvedGraph.notifications.length,
        },
        cancelledOrder: {
          reference: cancelledGraph.order.reference,
          status: cancelledGraph.order.status,
          paymentStatus: cancelledGraph.payment?.status ?? null,
          tickets: cancelledGraph.tickets.length,
          notifications: cancelledGraph.notifications.length,
        },
      },
      null,
      2,
    ),
  );
};

run().catch((error) => {
  console.error("backend flow smoke falhou.");
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
