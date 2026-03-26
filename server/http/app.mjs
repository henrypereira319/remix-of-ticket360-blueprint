import crypto from "node:crypto";
import express from "express";
import {
  appendCustomerAccountLogoutInDb,
  getCustomerAccountByIdFromDb,
  loginCustomerAccountInDb,
  loginCustomerAccountWithGoogleInDb,
  registerCustomerAccountInDb,
  updateCustomerAccountProfileInDb,
} from "../domain/auth-backend.mjs";
import {
  listNotificationsByLocalAccountId,
  listOrdersByLocalAccountId,
  listPaymentsByLocalAccountId,
  listTicketsByLocalAccountId,
} from "../domain/account-backend.mjs";
import {
  getCatalogPublicationState,
  getEventCatalogGraph,
  hydrateRuntimeEventSnapshot,
  searchPublishedCatalogSlugs,
  syncEventSnapshot,
} from "../domain/catalog-backend.mjs";
import {
  getCatalogEventBySlugFromDb,
  getRuntimeEventBySlugFromDb,
  listCatalogEventsFromDb,
  searchCatalogEventsFromDb,
} from "../domain/catalog-view-backend.mjs";
import {
  archiveOrganizerEventFromDb,
  getOrganizerEventEditorFromDb,
  getOrganizerSnapshotFromDb,
  publishOrganizerEventFromDb,
  saveOrganizerEventFromDb,
  syncOrganizerCatalogSnapshots,
  unpublishOrganizerEventFromDb,
} from "../domain/organizer-backend.mjs";
import {
  approveOrderFromDb,
  cancelOrderFromDb,
  denyOrderFromDb,
  getBackofficeSnapshotFromDb,
} from "../domain/operations-backend.mjs";
import { createSupportCaseInDb, listSupportCasesByLocalAccountId } from "../domain/support-backend.mjs";
import { createOrderWithPayment, createSeatHold, releaseSeatHold } from "../domain/ticketing-backend.mjs";
import { withDbClient } from "../db/client.mjs";

const jsonHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Allow-Methods": "GET,POST,PUT,OPTIONS",
};

const logStructured = (payload) => {
  console.log(
    JSON.stringify({
      at: new Date().toISOString(),
      ...payload,
    }),
  );
};

const withActor = (request) => ({
  actorType: request.headers["x-actor-type"] ?? "operator",
  actorId: request.headers["x-actor-id"] ?? null,
  actorEmail: request.headers["x-actor-email"] ?? null,
});

const asUuidOrNull = (value) =>
  typeof value === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)
    ? value
    : null;

const resolveProfileAccountId = async (accountId) => {
  const candidateId = asUuidOrNull(accountId);

  if (!candidateId) {
    return null;
  }

  return withDbClient(async (client) => {
    const result = await client.query("select id from public.profiles where id = $1 limit 1", [candidateId]);
    return result.rows[0]?.id ?? null;
  });
};

export const createApp = () => {
  const app = express();

  app.use(express.json({ limit: "1mb" }));
  app.use((request, response, next) => {
    Object.entries(jsonHeaders).forEach(([key, value]) => response.setHeader(key, value));

    if (request.method === "OPTIONS") {
      response.status(204).end();
      return;
    }

    next();
  });
  app.use((request, response, next) => {
    const requestId = String(request.headers["x-request-id"] ?? crypto.randomUUID());
    const startedAt = Date.now();

    request.requestId = requestId;
    response.setHeader("x-request-id", requestId);
    response.on("finish", () => {
      logStructured({
        level: response.statusCode >= 500 ? "error" : response.statusCode >= 400 ? "warn" : "info",
        scope: "http.request",
        requestId,
        method: request.method,
        path: request.path,
        status: response.statusCode,
        durationMs: Date.now() - startedAt,
        actorType: request.headers["x-actor-type"] ?? null,
      });
    });

    next();
  });

  app.get("/api/health", (_request, response) => {
    response.json({
      ok: true,
      service: "ticketing-backend",
      now: new Date().toISOString(),
    });
  });

  app.post("/api/auth/register", async (request, response, next) => {
    try {
      const result = await registerCustomerAccountInDb(request.body, withActor(request));
      response.json(result);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/auth/login", async (request, response, next) => {
    try {
      const result = await loginCustomerAccountInDb(request.body, withActor(request));
      response.json(result);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/auth/google", async (request, response, next) => {
    try {
      const result = await loginCustomerAccountWithGoogleInDb(request.body?.credential, withActor(request));
      response.json(result);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/auth/logout", async (request, response, next) => {
    try {
      response.json(await appendCustomerAccountLogoutInDb(request.body?.accountId, withActor(request)));
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/backoffice", async (_request, response, next) => {
    try {
      const snapshot = await getBackofficeSnapshotFromDb();
      response.json(snapshot);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/organizer/snapshot", async (request, response, next) => {
    try {
      await syncOrganizerCatalogSnapshots(request.body?.eventSnapshots);
      const snapshot = await getOrganizerSnapshotFromDb();
      response.json(snapshot);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/organizer/events/:eventSlug/editor", async (request, response, next) => {
    try {
      const event = await getOrganizerEventEditorFromDb(request.params.eventSlug);
      response.json(event);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/organizer/events", async (request, response, next) => {
    try {
      const event = await saveOrganizerEventFromDb(request.body?.eventSnapshot, withActor(request));
      response.json(event);
    } catch (error) {
      next(error);
    }
  });

  app.put("/api/organizer/events/:eventSlug", async (request, response, next) => {
    try {
      if (request.body?.eventSnapshot?.slug && request.body.eventSnapshot.slug !== request.params.eventSlug) {
        response.status(400).json({
          ok: false,
          error: "O slug do evento nao pode ser alterado neste fluxo.",
          requestId: request.requestId ?? null,
        });
        return;
      }

      const event = await saveOrganizerEventFromDb(
        {
          ...(request.body?.eventSnapshot ?? {}),
          slug: request.params.eventSlug,
        },
        withActor(request),
      );
      response.json(event);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/organizer/events/:eventSlug/publish", async (request, response, next) => {
    try {
      const event = await publishOrganizerEventFromDb(request.params.eventSlug, withActor(request));
      response.json(event);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/organizer/events/:eventSlug/unpublish", async (request, response, next) => {
    try {
      const event = await unpublishOrganizerEventFromDb(request.params.eventSlug, withActor(request));
      response.json(event);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/organizer/events/:eventSlug/archive", async (request, response, next) => {
    try {
      const event = await archiveOrganizerEventFromDb(request.params.eventSlug, withActor(request));
      response.json(event);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/catalog/events", async (request, response, next) => {
    try {
      const events = await listCatalogEventsFromDb({
        city: request.query?.city,
        category: request.query?.category,
        publishedOnly: true,
      });
      response.json(events);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/catalog/events/:eventSlug", async (request, response, next) => {
    try {
      const event = await getCatalogEventBySlugFromDb(request.params.eventSlug, {
        publishedOnly: true,
      });

      if (!event) {
        response.status(404).json({
          ok: false,
          error: "Evento nao encontrado no catalogo.",
          requestId: request.requestId ?? null,
        });
        return;
      }

      response.json(event);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/catalog/events/:eventSlug/runtime", async (request, response, next) => {
    try {
      const event = await getRuntimeEventBySlugFromDb(request.params.eventSlug, {
        holdToken: request.body?.holdToken ?? null,
        publishedOnly: true,
      });

      if (!event) {
        response.status(404).json({
          ok: false,
          error: "Evento nao encontrado no runtime do catalogo.",
          requestId: request.requestId ?? null,
        });
        return;
      }

      response.json(event);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/catalog/runtime-event", async (request, response, next) => {
    try {
      const runtimeEvent = await hydrateRuntimeEventSnapshot(request.body?.eventSnapshot, {
        holdToken: request.body?.holdToken ?? null,
      });
      response.json(runtimeEvent);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/catalog/publication-state", async (request, response, next) => {
    try {
      const eventSnapshots = Array.isArray(request.body?.eventSnapshots) ? request.body.eventSnapshots : [];
      await syncOrganizerCatalogSnapshots(eventSnapshots);
      const publicationState = await getCatalogPublicationState(eventSnapshots.map((eventSnapshot) => eventSnapshot?.slug));
      response.json(publicationState);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/catalog/search", async (request, response, next) => {
    try {
      const eventSnapshots = Array.isArray(request.body?.eventSnapshots) ? request.body.eventSnapshots : [];
      await syncOrganizerCatalogSnapshots(eventSnapshots);
      const slugs = await searchPublishedCatalogSlugs(request.body?.query, {
        limit: request.body?.limit ?? 6,
      });
      const events = await searchCatalogEventsFromDb(request.body?.query, {
        limit: request.body?.limit ?? 6,
      });
      response.json({
        slugs,
        events,
      });
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/inventory/holds", async (request, response, next) => {
    try {
      const eventSnapshot = request.body?.eventSnapshot;
      const selectedSeatKeys = Array.isArray(request.body?.seatIds) ? request.body.seatIds : [];
      const profileAccountId = await resolveProfileAccountId(request.body?.accountId);
      const synced = await syncEventSnapshot(eventSnapshot);
      const hold = await withDbClient(async (client) => {
        const seatResult = await client.query(
          `
            select id, seat_key
            from public.event_seats
            where session_id = $1
              and seat_key = any($2::text[])
          `,
          [synced.session.id, selectedSeatKeys],
        );

        const seatIdByKey = new Map(seatResult.rows.map((row) => [row.seat_key, row.id]));
        const dbSeatIds = selectedSeatKeys.map((seatKey) => seatIdByKey.get(seatKey)).filter(Boolean);

        if (dbSeatIds.length !== selectedSeatKeys.length) {
          throw new Error("Nem todos os assentos selecionados existem no backend.");
        }

        return createSeatHold(
          {
            sessionId: synced.session.id,
            seatIds: dbSeatIds,
            accountId: profileAccountId,
            ttlMs: request.body?.ttlMs,
            metadata: {
              sourceSlug: eventSnapshot?.slug ?? null,
              localAccountId: request.body?.accountId ?? null,
            },
          },
          { client },
        );
      });

      response.json({
        holdToken: hold.holdToken,
        eventId: eventSnapshot?.id ?? null,
        seatIds: selectedSeatKeys,
        expiresAt: hold.expiresAt,
      });
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/inventory/holds/:holdToken/release", async (request, response, next) => {
    try {
      const released = await releaseSeatHold(request.params.holdToken, withActor(request));
      response.json(released);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/orders", async (request, response, next) => {
    try {
      const eventSnapshot = request.body?.event;
      const profileAccountId = await resolveProfileAccountId(request.body?.accountId);
      const synced = await syncEventSnapshot(eventSnapshot);
      const selectedSeatKeys = Array.isArray(request.body?.selectedSeatIds) ? request.body.selectedSeatIds : [];
      const selectedTicketCategories = request.body?.ticketCategories ?? {};
      const ticketInputs = Array.isArray(request.body?.tickets) ? request.body.tickets : [];

      const graph = await withDbClient(async (client) => {
        const seatResult = await client.query(
          `
            select id, seat_key
            from public.event_seats
            where session_id = $1
              and seat_key = any($2::text[])
          `,
          [synced.session.id, selectedSeatKeys],
        );

        const seatIdByKey = new Map(seatResult.rows.map((row) => [row.seat_key, row.id]));
        const items = selectedSeatKeys.map((seatKey) => {
          const ticketInput = ticketInputs.find((ticket) => ticket.seatId === seatKey);
          const dbSeatId = seatIdByKey.get(seatKey);

          if (!dbSeatId) {
            throw new Error(`Assento ${seatKey} ainda nao existe no backend.`);
          }

          return {
            seatId: dbSeatId,
            holderName: ticketInput?.holderName ?? "",
            holderDocument: ticketInput?.document ?? null,
            ticketCategory: selectedTicketCategories?.[seatKey] ?? "full",
            metadata: {
              localSeatId: seatKey,
            },
          };
        });

        return createOrderWithPayment(
          {
            sessionId: synced.session.id,
            holdToken: request.body?.holdToken ?? null,
            accountId: profileAccountId,
            paymentMethod: request.body?.paymentMethod,
            installments: request.body?.installments ?? "1x",
            buyer: request.body?.buyer,
            items,
            metadata: {
              source: "frontend-bff",
              eventSlug: eventSnapshot?.slug ?? null,
              localAccountId: request.body?.accountId ?? null,
            },
          },
          { client },
        );
      });

      response.json({
        id: graph.order.id,
        reference: graph.order.reference,
        status: graph.order.status,
        eventId: graph.order.eventId,
        eventSlug: eventSnapshot?.slug ?? null,
        accountId: request.body?.accountId ?? null,
        holdToken: graph.order.holdToken,
        paymentMethod: graph.order.paymentMethod,
        installments: graph.order.installments,
        buyer: graph.order.buyer,
        tickets: graph.order.items.map((item) => ({
          seatId: item.metadata?.localSeatId ?? item.seatKey,
          label: item.label,
          sectionId: item.sectionId,
          sectionName: item.sectionName,
          basePrice: item.basePrice,
          price: item.price,
          ticketCategory: item.ticketCategory,
          holderName: item.holderName,
          document: item.holderDocument ?? "",
        })),
        pricing: {
          subtotal: graph.order.pricing.subtotal,
          serviceFee: graph.order.pricing.serviceFee,
          processingFee: graph.order.pricing.processingFee,
          total: graph.order.pricing.total,
        },
        createdAt: graph.order.createdAt,
        updatedAt: graph.order.updatedAt,
      });
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/accounts/:accountId/orders", async (request, response, next) => {
    try {
      response.json(await listOrdersByLocalAccountId(request.params.accountId));
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/accounts/:accountId/profile", async (request, response, next) => {
    try {
      response.json(await getCustomerAccountByIdFromDb(request.params.accountId));
    } catch (error) {
      next(error);
    }
  });

  app.put("/api/accounts/:accountId/profile", async (request, response, next) => {
    try {
      response.json(await updateCustomerAccountProfileInDb(request.params.accountId, request.body, withActor(request)));
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/accounts/:accountId/payments", async (request, response, next) => {
    try {
      response.json(await listPaymentsByLocalAccountId(request.params.accountId));
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/accounts/:accountId/tickets", async (request, response, next) => {
    try {
      response.json(await listTicketsByLocalAccountId(request.params.accountId));
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/accounts/:accountId/notifications", async (request, response, next) => {
    try {
      response.json(await listNotificationsByLocalAccountId(request.params.accountId));
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/accounts/:accountId/support-cases", async (request, response, next) => {
    try {
      response.json(await listSupportCasesByLocalAccountId(request.params.accountId));
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/support/cases", async (request, response, next) => {
    try {
      const profileAccountId = await resolveProfileAccountId(request.body?.accountId);
      const supportCase = await createSupportCaseInDb(
        {
          accountId: profileAccountId,
          orderId: asUuidOrNull(request.body?.orderId),
          category: request.body?.category,
          subject: request.body?.subject,
          message: request.body?.message,
          metadata: {
            ...(request.body?.metadata ?? {}),
            localAccountId: request.body?.accountId ?? null,
          },
        },
        withActor(request),
      );
      response.json(supportCase);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/backoffice/orders/:orderId/approve", async (request, response, next) => {
    try {
      const order = await approveOrderFromDb(request.params.orderId, withActor(request));
      response.json(order);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/backoffice/orders/:orderId/deny", async (request, response, next) => {
    try {
      const order = await denyOrderFromDb(request.params.orderId, withActor(request));
      response.json(order);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/backoffice/orders/:orderId/cancel", async (request, response, next) => {
    try {
      const order = await cancelOrderFromDb(request.params.orderId, withActor(request));
      response.json(order);
    } catch (error) {
      next(error);
    }
  });

  app.use((error, _request, response, _next) => {
    const message = error instanceof Error ? error.message : "Erro interno do backend.";
    logStructured({
      level: "error",
      scope: "http.error",
      requestId: _request.requestId ?? null,
      method: _request.method,
      path: _request.path,
      error: message,
    });
    response.status(500).json({
      ok: false,
      error: message,
      requestId: _request.requestId ?? null,
    });
  });

  return app;
};

export const startHttpServer = ({ port = Number(process.env.PORT ?? 8787), host = "0.0.0.0" } = {}) => {
  const app = createApp();

  return new Promise((resolve) => {
    const server = app.listen(port, host, () => {
      resolve(server);
    });
  });
};
