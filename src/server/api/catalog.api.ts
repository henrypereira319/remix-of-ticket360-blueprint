import {
  events as catalogSeedEvents,
  getEventBySlug,
  searchEvents,
  type EventData,
  type RuntimeEventData,
} from "@/data/events";
import { BackendHttpError, hasConfiguredBackendUrl, requestBackendJson } from "@/lib/backend-http";
import { hydrateEventInventory } from "@/server/seat-inventory.service";
import { loadSeatMapData } from "@/server/seat-map-loader";

export interface CatalogListInput {
  city?: string;
  category?: string;
}

const normalize = (value?: string | null) => value?.trim().toLowerCase() ?? "";

let catalogBootstrapPromise: Promise<RuntimeEventData[]> | null = null;
let remoteCatalogBootstrapPromise: Promise<void> | null = null;

const getCatalogBootstrapSnapshots = async () => {
  if (!catalogBootstrapPromise) {
    catalogBootstrapPromise = Promise.all(
      catalogSeedEvents.map(async (event) => ({
        ...event,
        seatMap: await loadSeatMapData(event.seatMap),
      })),
    );
  }

  return catalogBootstrapPromise;
};

const ensureRemoteCatalogBootstrap = async () => {
  if (!hasConfiguredBackendUrl) {
    return;
  }

  if (!remoteCatalogBootstrapPromise) {
    remoteCatalogBootstrapPromise = (async () => {
      const eventSnapshots = await getCatalogBootstrapSnapshots();
      await requestBackendJson<Record<string, { publicationStatus: string; publishedAt: string | null }>>(
        "/api/catalog/publication-state",
        {
          method: "POST",
          body: JSON.stringify({
            eventSnapshots,
          }),
        },
      );
    })().catch((error) => {
      remoteCatalogBootstrapPromise = null;
      throw error;
    });
  }

  await remoteCatalogBootstrapPromise;
};

const applyCatalogFilters = (events: EventData[], input?: CatalogListInput) => {
  const normalizedCity = normalize(input?.city);
  const normalizedCategory = normalize(input?.category);

  return events.filter((event) => {
    const cityMatches = normalizedCity ? normalize(event.city).includes(normalizedCity) : true;
    const categoryMatches = normalizedCategory ? normalize(event.category) === normalizedCategory : true;
    return cityMatches && categoryMatches;
  });
};

const buildCatalogQuery = (input?: CatalogListInput) => {
  const searchParams = new URLSearchParams();

  if (input?.city?.trim()) {
    searchParams.set("city", input.city.trim());
  }

  if (input?.category?.trim()) {
    searchParams.set("category", input.category.trim());
  }

  const queryString = searchParams.toString();
  return queryString ? `/api/catalog/events?${queryString}` : "/api/catalog/events";
};

const isNotFoundError = (error: unknown) => error instanceof BackendHttpError && error.status === 404;

export const getCatalogEventBySlug = async (slug?: string): Promise<EventData | null> => {
  if (!slug) {
    return null;
  }

  if (hasConfiguredBackendUrl) {
    try {
      await ensureRemoteCatalogBootstrap();
      return await requestBackendJson<EventData>(`/api/catalog/events/${slug}`);
    } catch (error) {
      if (isNotFoundError(error)) {
        return null;
      }

      console.warn("Falha ao carregar evento remoto do catalogo, usando fallback local.", error);
    }
  }

  return getEventBySlug(slug) ?? null;
};

export const getRuntimeEventBySlug = async (
  slug?: string,
  options?: {
    holdToken?: string | null;
  },
): Promise<RuntimeEventData | null> => {
  if (!slug) {
    return null;
  }

  if (hasConfiguredBackendUrl) {
    try {
      await ensureRemoteCatalogBootstrap();
      return await requestBackendJson<RuntimeEventData>(`/api/catalog/events/${slug}/runtime`, {
        method: "POST",
        body: JSON.stringify({
          holdToken: options?.holdToken ?? null,
        }),
      });
    } catch (error) {
      if (isNotFoundError(error)) {
        return null;
      }

      console.warn("Falha ao carregar runtime remoto do evento, usando fallback local.", error);
    }
  }

  const event = getEventBySlug(slug);

  if (!event) {
    return null;
  }

  const seatMap = await loadSeatMapData(event.seatMap);

  return hydrateEventInventory(
    {
      ...event,
      seatMap,
    },
    options?.holdToken ?? undefined,
  );
};

export const listCatalogEvents = async (input?: CatalogListInput): Promise<EventData[]> => {
  if (hasConfiguredBackendUrl) {
    try {
      await ensureRemoteCatalogBootstrap();
      return await requestBackendJson<EventData[]>(buildCatalogQuery(input));
    } catch (error) {
      console.warn("Falha ao carregar lista remota do catalogo, usando fallback local.", error);
    }
  }

  return applyCatalogFilters(catalogSeedEvents, input);
};

export const searchCatalogEvents = async (query: string): Promise<EventData[]> => {
  const normalizedQuery = query.trim();

  if (!normalizedQuery) {
    return [];
  }

  if (hasConfiguredBackendUrl) {
    try {
      await ensureRemoteCatalogBootstrap();
      const response = await requestBackendJson<{ slugs?: string[]; events?: EventData[] }>("/api/catalog/search", {
        method: "POST",
        body: JSON.stringify({
          query: normalizedQuery,
          limit: 6,
        }),
      });

      if (Array.isArray(response.events) && response.events.length > 0) {
        return response.events;
      }

      if (Array.isArray(response.slugs) && response.slugs.length > 0) {
        return response.slugs
          .map((slug) => getEventBySlug(slug))
          .filter((event): event is EventData => Boolean(event));
      }
    } catch (error) {
      console.warn("Falha ao buscar no catalogo remoto, usando fallback local.", error);
    }
  }

  return searchEvents(normalizedQuery);
};
