import { events, type RuntimeEventData } from "@/data/events";
import { emitBackendMutation, hasConfiguredBackendUrl, requestBackendJson } from "@/lib/backend-http";
import { loadSeatMapData } from "@/server/seat-map-loader";
import {
  getOrganizerSnapshot,
  organizerStorageChannels,
  type OrganizerSnapshot,
} from "@/server/organizer.service";

const remoteOrganizerChannel = "organizer.remote";

export const organizerApiChannels = hasConfiguredBackendUrl
  ? ([remoteOrganizerChannel, "orders.remote", "backoffice.remote", "account.remote"] as const)
  : organizerStorageChannels;

let organizerCatalogPromise: Promise<RuntimeEventData[]> | null = null;

const notifyRemoteOrganizerMutation = () => {
  emitBackendMutation(remoteOrganizerChannel);
};

const getOrganizerCatalogSnapshots = async () => {
  if (!organizerCatalogPromise) {
    organizerCatalogPromise = Promise.all(
      events.map(async (event) => ({
        ...event,
        seatMap: await loadSeatMapData(event.seatMap),
      })),
    );
  }

  return organizerCatalogPromise;
};

export const getOrganizerData = async (): Promise<OrganizerSnapshot> => {
  if (hasConfiguredBackendUrl) {
    try {
      const eventSnapshots = await getOrganizerCatalogSnapshots();
      return await requestBackendJson<OrganizerSnapshot>("/api/organizer/snapshot", {
        method: "POST",
        body: JSON.stringify({
          eventSnapshots,
        }),
      });
    } catch (error) {
      console.warn("Falha ao carregar snapshot remoto do organizador, usando fallback local.", error);
    }
  }

  return getOrganizerSnapshot();
};

export const getOrganizerEventEditor = async (eventSlug: string) => {
  if (!hasConfiguredBackendUrl) {
    throw new Error("Editor real do organizador exige backend configurado.");
  }

  return requestBackendJson<RuntimeEventData>(`/api/organizer/events/${eventSlug}/editor`);
};

export const createOrganizerEvent = async (eventSnapshot: RuntimeEventData) => {
  if (!hasConfiguredBackendUrl) {
    throw new Error("Criacao real de evento exige backend configurado.");
  }

  const result = await requestBackendJson<{
    id: string;
    slug: string;
    publicationStatus: "draft" | "published" | "cancelled" | "archived";
    publishedAt: string | null;
  }>("/api/organizer/events", {
    method: "POST",
    body: JSON.stringify({
      eventSnapshot,
    }),
  });
  notifyRemoteOrganizerMutation();
  return result;
};

export const updateOrganizerEvent = async (eventSlug: string, eventSnapshot: RuntimeEventData) => {
  if (!hasConfiguredBackendUrl) {
    throw new Error("Edicao real de evento exige backend configurado.");
  }

  const result = await requestBackendJson<{
    id: string;
    slug: string;
    publicationStatus: "draft" | "published" | "cancelled" | "archived";
    publishedAt: string | null;
  }>(`/api/organizer/events/${eventSlug}`, {
    method: "PUT",
    body: JSON.stringify({
      eventSnapshot,
    }),
  });
  notifyRemoteOrganizerMutation();
  return result;
};

export const publishOrganizerEvent = async (eventSlug: string) => {
  if (!hasConfiguredBackendUrl) {
    throw new Error("Publicacao real exige backend configurado.");
  }

  const result = await requestBackendJson<{
    id: string;
    slug: string;
    publicationStatus: "published";
    publishedAt: string | null;
  }>(`/api/organizer/events/${eventSlug}/publish`, {
    method: "POST",
  });
  notifyRemoteOrganizerMutation();
  return result;
};

export const unpublishOrganizerEvent = async (eventSlug: string) => {
  if (!hasConfiguredBackendUrl) {
    throw new Error("Despublicacao real exige backend configurado.");
  }

  const result = await requestBackendJson<{
    id: string;
    slug: string;
    publicationStatus: "draft";
    publishedAt: string | null;
  }>(`/api/organizer/events/${eventSlug}/unpublish`, {
    method: "POST",
  });
  notifyRemoteOrganizerMutation();
  return result;
};

export const archiveOrganizerEvent = async (eventSlug: string) => {
  if (!hasConfiguredBackendUrl) {
    throw new Error("Arquivamento real exige backend configurado.");
  }

  const result = await requestBackendJson<{
    id: string;
    slug: string;
    publicationStatus: "archived";
    publishedAt: string | null;
  }>(`/api/organizer/events/${eventSlug}/archive`, {
    method: "POST",
  });
  notifyRemoteOrganizerMutation();
  return result;
};
