import { startHttpServer } from "../server/http/app.mjs";

const run = async () => {
  const server = await startHttpServer({ port: 0, host: "127.0.0.1" });

  try {
    const address = server.address();

    if (!address || typeof address === "string") {
      throw new Error("Nao foi possivel obter a porta do servidor HTTP.");
    }

    const baseUrl = `http://127.0.0.1:${address.port}`;
    const suffix = Date.now().toString().slice(-8);
    const eventSnapshot = {
      slug: `http-smoke-event-${suffix}`,
      title: `HTTP Smoke Event ${suffix}`,
      summary: "Fluxo remoto via BFF",
      description: "Evento sintetico para validar inventario e checkout via HTTP.",
      category: "Operacao",
      city: "Sao Paulo / SP",
      venueName: `Venue HTTP ${suffix}`,
      image: null,
      bannerImage: null,
      priceFrom: 120,
      securityNotes: ["Smoke http"],
      month: "Mar",
      day: "29",
      weekday: "Sab",
      time: "20:00",
      details: {
        address: "Rua HTTP, 10",
        openingTime: "19:00",
      },
      seatMap: {
        hallName: "Sala HTTP",
        stageLabel: "Palco HTTP",
        totalSeats: 2,
        availableSeats: 2,
        sectionStats: {},
        notes: [],
        sections: [
          {
            id: "plateia-a",
            name: "Plateia A",
            shortLabel: "P.A",
            price: 120,
            tone: "orange",
          },
        ],
        seats: [
          {
            id: "plateia-a-a1",
            label: "A1",
            row: "A",
            number: 1,
            sectionId: "plateia-a",
            status: "available",
            area: "Plateia A",
          },
          {
            id: "plateia-a-a2",
            label: "A2",
            row: "A",
            number: 2,
            sectionId: "plateia-a",
            status: "available",
            area: "Plateia A",
          },
        ],
      },
    };

    const [healthResponse, runtimeResponse] = await Promise.all([
      fetch(`${baseUrl}/api/health`),
      fetch(`${baseUrl}/api/catalog/runtime-event`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          eventSnapshot,
          holdToken: null,
        }),
      }),
    ]);

    const health = await healthResponse.json();
    const runtimeEvent = await runtimeResponse.json();

    if (!healthResponse.ok) {
      throw new Error(`Healthcheck falhou com status ${healthResponse.status}.`);
    }

    if (!runtimeResponse.ok) {
      throw new Error(
        `Runtime falhou com status ${runtimeResponse.status}: ${typeof runtimeEvent?.error === "string" ? runtimeEvent.error : JSON.stringify(runtimeEvent)}`,
      );
    }

    const authRegisterResponse = await fetch(`${baseUrl}/api/auth/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        fullName: "HTTP Buyer",
        email: `http-buyer-${suffix}@example.com`,
        document: "12345678900",
        phone: "11999999999",
        city: "Sao Paulo / SP",
        password: "senha123",
      }),
    });
    const authRegister = await authRegisterResponse.json();

    if (!authRegisterResponse.ok) {
      throw new Error(
        `Auth register falhou com status ${authRegisterResponse.status}: ${authRegister.error ?? JSON.stringify(authRegister)}`,
      );
    }

    const authLoginResponse = await fetch(`${baseUrl}/api/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: `http-buyer-${suffix}@example.com`,
        password: "senha123",
      }),
    });
    const authLogin = await authLoginResponse.json();

    if (!authLoginResponse.ok) {
      throw new Error(
        `Auth login falhou com status ${authLoginResponse.status}: ${authLogin.error ?? JSON.stringify(authLogin)}`,
      );
    }

    const accountId = authLogin?.account?.id;

    if (!accountId) {
      throw new Error("Login remoto nao devolveu um accountId valido.");
    }

    const authProfileUpdateResponse = await fetch(`${baseUrl}/api/accounts/${accountId}/profile`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        fullName: "HTTP Buyer Updated",
        email: `http-buyer-${suffix}@example.com`,
        document: "12345678900",
        phone: "11999999999",
        city: "Campinas / SP",
      }),
    });
    const authProfileUpdate = await authProfileUpdateResponse.json();

    if (!authProfileUpdateResponse.ok) {
      throw new Error(
        `Auth profile update falhou com status ${authProfileUpdateResponse.status}: ${authProfileUpdate.error ?? JSON.stringify(authProfileUpdate)}`,
      );
    }

    const catalogPublicationResponse = await fetch(`${baseUrl}/api/catalog/publication-state`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        eventSnapshots: [runtimeEvent],
      }),
    });
    const catalogPublication = await catalogPublicationResponse.json();

    if (!catalogPublicationResponse.ok) {
      throw new Error(
        `Catalog publication falhou com status ${catalogPublicationResponse.status}: ${catalogPublication.error ?? JSON.stringify(catalogPublication)}`,
      );
    }

    const catalogSearchResponse = await fetch(`${baseUrl}/api/catalog/search`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: suffix,
        limit: 3,
        eventSnapshots: [runtimeEvent],
      }),
    });
    const catalogSearch = await catalogSearchResponse.json();

    if (!catalogSearchResponse.ok) {
      throw new Error(
        `Catalog search falhou com status ${catalogSearchResponse.status}: ${catalogSearch.error ?? JSON.stringify(catalogSearch)}`,
      );
    }

    const holdResponse = await fetch(`${baseUrl}/api/inventory/holds`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        eventSnapshot: runtimeEvent,
        seatIds: ["plateia-a-a1"],
        accountId,
      }),
    });
    const hold = await holdResponse.json();

    if (!holdResponse.ok) {
      throw new Error(`Hold falhou com status ${holdResponse.status}: ${hold.error ?? JSON.stringify(hold)}`);
    }

    const organizerSnapshotResponse = await fetch(`${baseUrl}/api/organizer/snapshot`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        eventSnapshots: [runtimeEvent],
      }),
    });
    const organizerSnapshot = await organizerSnapshotResponse.json();

    if (!organizerSnapshotResponse.ok) {
      throw new Error(
        `Organizer snapshot falhou com status ${organizerSnapshotResponse.status}: ${organizerSnapshot.error ?? JSON.stringify(organizerSnapshot)}`,
      );
    }

    const clonedEventSlug = `${runtimeEvent.slug}-clone`;
    const organizerCreateResponse = await fetch(`${baseUrl}/api/organizer/events`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        eventSnapshot: {
          ...runtimeEvent,
          slug: clonedEventSlug,
          title: `${runtimeEvent.title} Clone`,
          summary: "Evento clonado para validar CRUD do organizador.",
          publicationStatus: "draft",
        },
      }),
    });
    const organizerCreated = await organizerCreateResponse.json();

    if (!organizerCreateResponse.ok) {
      throw new Error(
        `Organizer create falhou com status ${organizerCreateResponse.status}: ${organizerCreated.error ?? JSON.stringify(organizerCreated)}`,
      );
    }

    const organizerEditorResponse = await fetch(`${baseUrl}/api/organizer/events/${clonedEventSlug}/editor`);
    const organizerEditor = await organizerEditorResponse.json();

    if (!organizerEditorResponse.ok) {
      throw new Error(
        `Organizer editor falhou com status ${organizerEditorResponse.status}: ${organizerEditor.error ?? JSON.stringify(organizerEditor)}`,
      );
    }

    const organizerUpdateResponse = await fetch(`${baseUrl}/api/organizer/events/${clonedEventSlug}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        eventSnapshot: {
          ...organizerEditor,
          title: `${organizerEditor.title} Updated`,
          summary: "Evento atualizado via CRUD do organizador.",
          publicationStatus: "published",
        },
      }),
    });
    const organizerUpdated = await organizerUpdateResponse.json();

    if (!organizerUpdateResponse.ok) {
      throw new Error(
        `Organizer update falhou com status ${organizerUpdateResponse.status}: ${organizerUpdated.error ?? JSON.stringify(organizerUpdated)}`,
      );
    }

    const catalogListResponse = await fetch(`${baseUrl}/api/catalog/events`);
    const catalogList = await catalogListResponse.json();

    if (!catalogListResponse.ok) {
      throw new Error(`Catalog list falhou com status ${catalogListResponse.status}: ${JSON.stringify(catalogList)}`);
    }

    const catalogEventResponse = await fetch(`${baseUrl}/api/catalog/events/${clonedEventSlug}`);
    const catalogEvent = await catalogEventResponse.json();

    if (!catalogEventResponse.ok) {
      throw new Error(
        `Catalog event falhou com status ${catalogEventResponse.status}: ${catalogEvent.error ?? JSON.stringify(catalogEvent)}`,
      );
    }

    const catalogRuntimeBySlugResponse = await fetch(`${baseUrl}/api/catalog/events/${runtimeEvent.slug}/runtime`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        holdToken: null,
      }),
    });
    const catalogRuntimeBySlug = await catalogRuntimeBySlugResponse.json();

    if (!catalogRuntimeBySlugResponse.ok) {
      throw new Error(
        `Catalog runtime by slug falhou com status ${catalogRuntimeBySlugResponse.status}: ${catalogRuntimeBySlug.error ?? JSON.stringify(catalogRuntimeBySlug)}`,
      );
    }

    const organizerUnpublishResponse = await fetch(`${baseUrl}/api/organizer/events/${runtimeEvent.slug}/unpublish`, {
      method: "POST",
    });
    const organizerUnpublish = await organizerUnpublishResponse.json();

    if (!organizerUnpublishResponse.ok) {
      throw new Error(
        `Organizer unpublish falhou com status ${organizerUnpublishResponse.status}: ${organizerUnpublish.error ?? JSON.stringify(organizerUnpublish)}`,
      );
    }

    const organizerPublishResponse = await fetch(`${baseUrl}/api/organizer/events/${runtimeEvent.slug}/publish`, {
      method: "POST",
    });
    const organizerPublish = await organizerPublishResponse.json();

    if (!organizerPublishResponse.ok) {
      throw new Error(
        `Organizer publish falhou com status ${organizerPublishResponse.status}: ${organizerPublish.error ?? JSON.stringify(organizerPublish)}`,
      );
    }

    const organizerArchiveResponse = await fetch(`${baseUrl}/api/organizer/events/${clonedEventSlug}/archive`, {
      method: "POST",
    });
    const organizerArchive = await organizerArchiveResponse.json();

    if (!organizerArchiveResponse.ok) {
      throw new Error(
        `Organizer archive falhou com status ${organizerArchiveResponse.status}: ${organizerArchive.error ?? JSON.stringify(organizerArchive)}`,
      );
    }

    const catalogArchivedResponse = await fetch(`${baseUrl}/api/catalog/events/${clonedEventSlug}`);

    if (catalogArchivedResponse.status !== 404) {
      throw new Error(`Evento arquivado ainda apareceu no catalogo publico com status ${catalogArchivedResponse.status}.`);
    }

    const orderResponse = await fetch(`${baseUrl}/api/orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        event: runtimeEvent,
        selectedSeatIds: ["plateia-a-a1"],
        ticketCategories: {
          "plateia-a-a1": "full",
        },
        buyer: {
          fullName: "HTTP Buyer",
          email: "http@example.com",
          document: "12345678900",
          phone: "11999999999",
          city: "Sao Paulo / SP",
        },
        tickets: [
          {
            seatId: "plateia-a-a1",
            holderName: "HTTP Holder",
            document: "12345678900",
          },
        ],
        paymentMethod: "pix",
        installments: "1x",
        accountId,
        holdToken: hold.holdToken,
      }),
    });
    const order = await orderResponse.json();

    if (!orderResponse.ok) {
      throw new Error(`Order falhou com status ${orderResponse.status}: ${order.error ?? JSON.stringify(order)}`);
    }

    const supportCaseResponse = await fetch(`${baseUrl}/api/support/cases`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        accountId,
        orderId: order.id,
        category: "ticket",
        subject: "Ticket nao apareceu na wallet",
        message: "Smoke test validando abertura de caso de suporte no backend.",
      }),
    });
    const supportCase = await supportCaseResponse.json();

    if (!supportCaseResponse.ok) {
      throw new Error(
        `Support case falhou com status ${supportCaseResponse.status}: ${supportCase.error ?? JSON.stringify(supportCase)}`,
      );
    }

    const backofficeResponse = await fetch(`${baseUrl}/api/backoffice`);
    const backoffice = await backofficeResponse.json();
    const [
      accountProfileResponse,
      accountOrdersResponse,
      accountPaymentsResponse,
      accountTicketsResponse,
      accountNotificationsResponse,
      accountSupportCasesResponse,
    ] =
      await Promise.all([
        fetch(`${baseUrl}/api/accounts/${accountId}/profile`),
        fetch(`${baseUrl}/api/accounts/${accountId}/orders`),
        fetch(`${baseUrl}/api/accounts/${accountId}/payments`),
        fetch(`${baseUrl}/api/accounts/${accountId}/tickets`),
        fetch(`${baseUrl}/api/accounts/${accountId}/notifications`),
        fetch(`${baseUrl}/api/accounts/${accountId}/support-cases`),
      ]);
    const accountProfile = await accountProfileResponse.json();
    const accountOrders = await accountOrdersResponse.json();
    const accountPayments = await accountPaymentsResponse.json();
    const accountTickets = await accountTicketsResponse.json();
    const accountNotifications = await accountNotificationsResponse.json();
    const accountSupportCases = await accountSupportCasesResponse.json();

    if (!backofficeResponse.ok) {
      throw new Error(
        `Backoffice falhou com status ${backofficeResponse.status}: ${typeof backoffice?.error === "string" ? backoffice.error : JSON.stringify(backoffice)}`,
      );
    }

    if (
      !accountProfileResponse.ok ||
      !accountOrdersResponse.ok ||
      !accountPaymentsResponse.ok ||
      !accountTicketsResponse.ok ||
      !accountNotificationsResponse.ok ||
      !accountSupportCasesResponse.ok
    ) {
      throw new Error("Leituras remotas da conta falharam.");
    }

    const authLogoutResponse = await fetch(`${baseUrl}/api/auth/logout`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        accountId,
      }),
    });
    const authLogout = await authLogoutResponse.json();

    if (!authLogoutResponse.ok) {
      throw new Error(
        `Auth logout falhou com status ${authLogoutResponse.status}: ${authLogout.error ?? JSON.stringify(authLogout)}`,
      );
    }

    console.log("backend http smoke ok");
    console.log(
      JSON.stringify(
        {
          health,
          runtime: {
            slug: runtimeEvent.slug,
            seats: runtimeEvent.seatMap?.seats?.length ?? 0,
          },
          catalog: {
            publicationStatus: catalogPublication?.[runtimeEvent.slug]?.publicationStatus ?? null,
            searchHits: catalogSearch?.slugs?.length ?? 0,
            listedEvents: Array.isArray(catalogList) ? catalogList.length : 0,
            clonedTitle: catalogEvent?.title ?? null,
            runtimeSeats: catalogRuntimeBySlug?.seatMap?.seats?.length ?? 0,
          },
          hold: {
            holdToken: hold.holdToken,
            seatIds: hold.seatIds,
          },
          organizer: {
            events: organizerSnapshot.summary?.totalEvents ?? 0,
            published: organizerSnapshot.summary?.publishedEvents ?? 0,
            createdSlug: organizerCreated.slug,
            updatedStatus: organizerUpdated.publicationStatus,
            unpublishedStatus: organizerUnpublish.publicationStatus,
            republishedStatus: organizerPublish.publicationStatus,
            archivedStatus: organizerArchive.publicationStatus,
          },
          order: {
            reference: order.reference,
            status: order.status,
            total: order.pricing?.total ?? null,
          },
          account: {
            orders: accountOrders.length,
            payments: accountPayments.length,
            tickets: accountTickets.length,
            notifications: accountNotifications.length,
            supportCases: accountSupportCases.length,
          },
          support: {
            caseId: supportCase.id,
            status: supportCase.status,
            category: supportCase.category,
          },
          auth: {
            accountId,
            registeredProvider: authRegister?.account?.provider ?? null,
            updatedCity: authProfileUpdate?.city ?? null,
            activityCount: accountProfile?.activity?.length ?? 0,
            logoutOk: authLogout?.ok ?? false,
          },
          summary: backoffice.summary,
          orders: backoffice.orders?.length ?? 0,
        },
        null,
        2,
      ),
    );
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => {
        if (error) {
          reject(error);
          return;
        }

        resolve();
      });
    });
  }
};

run().catch((error) => {
  console.error("backend http smoke falhou.");
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
