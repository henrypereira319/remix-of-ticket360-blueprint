import type { RuntimeEventData } from "@/data/events";
import { getEventBySlug } from "@/data/events";
import { emitBackendMutation, hasConfiguredBackendUrl, requestBackendJson } from "@/lib/backend-http";
import {
  createSeatHold,
  getInventorySnapshot,
  inventoryStorageChannel,
  releaseSeatHold,
  type SeatHoldRecord,
} from "@/server/seat-inventory.service";

export interface CreateInventoryHoldInput {
  eventSlug: string;
  seatIds: string[];
  eventSnapshot?: RuntimeEventData | null;
  accountId?: string | null;
  ttlMs?: number;
}

const remoteInventoryChannel = "inventory.remote";

export const inventoryApiChannels = hasConfiguredBackendUrl ? ([remoteInventoryChannel] as const) : ([inventoryStorageChannel] as const);

export const createInventoryHold = async (input: CreateInventoryHoldInput): Promise<SeatHoldRecord> => {
  const event = getEventBySlug(input.eventSlug);

  if (!event) {
    throw new Error("Evento nao encontrado para criar hold.");
  }

  if (hasConfiguredBackendUrl && input.eventSnapshot) {
    try {
      const hold = await requestBackendJson<SeatHoldRecord>("/api/inventory/holds", {
        method: "POST",
        body: JSON.stringify({
          eventSnapshot: input.eventSnapshot,
          seatIds: input.seatIds,
          accountId: input.accountId ?? null,
          ttlMs: input.ttlMs,
        }),
      });
      emitBackendMutation(remoteInventoryChannel);
      return hold;
    } catch (error) {
      console.warn("Falha ao criar hold remoto, usando inventario local.", error);
    }
  }

  return createSeatHold(event, input.seatIds, {
    accountId: input.accountId ?? null,
    ttlMs: input.ttlMs,
  });
};

export const releaseInventoryHold = async (holdToken: string): Promise<void> => {
  if (hasConfiguredBackendUrl) {
    try {
      await requestBackendJson(`/api/inventory/holds/${holdToken}/release`, {
        method: "POST",
      });
      emitBackendMutation(remoteInventoryChannel);
      return;
    } catch (error) {
      console.warn("Falha ao liberar hold remoto, usando inventario local.", error);
    }
  }

  releaseSeatHold(holdToken);
};

export const getInventoryOverviewBySlug = async (eventSlug: string) => {
  const event = getEventBySlug(eventSlug);

  if (!event) {
    throw new Error("Evento nao encontrado para consultar inventario.");
  }

  return getInventorySnapshot(event);
};
