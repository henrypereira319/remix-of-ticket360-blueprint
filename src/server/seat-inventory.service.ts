import type { EventData, EventSeatStatus } from "@/data/events";
import { getSeatById, isSeatSelectable } from "@/lib/ticketing";
import { trackAnalyticsEvent } from "@/server/analytics.service";
import { createPersistentId, emitStorageMutation, readStorageJson, writeStorageJson } from "@/server/storage";

const INVENTORY_STORAGE_KEY = "eventhub.inventory.reservations";
const INVENTORY_CHANNEL = "inventory";
const HOLD_TTL_MS = 10 * 60 * 1000;

export type SeatReservationSource = "hold" | "order";
export type SeatReservationState = "held" | "pending_review" | "confirmed" | "released" | "expired";

export interface SeatReservationRecord {
  id: string;
  eventId: string;
  eventSlug: string;
  seatId: string;
  source: SeatReservationSource;
  state: SeatReservationState;
  accountId?: string | null;
  holdToken?: string | null;
  orderId?: string | null;
  createdAt: string;
  updatedAt: string;
  expiresAt?: string | null;
}

export interface SeatHoldRecord {
  holdToken: string;
  eventId: string;
  seatIds: string[];
  expiresAt: string;
}

const nowIso = () => new Date().toISOString();

const isExpiredHold = (record: SeatReservationRecord, referenceTime = new Date()) =>
  record.state === "held" && Boolean(record.expiresAt) && new Date(record.expiresAt!).getTime() <= referenceTime.getTime();

const normalizeReservations = (records: SeatReservationRecord[], referenceTime = new Date()) => {
  let mutated = false;

  const normalized = records.map((record) => {
    if (isExpiredHold(record, referenceTime)) {
      mutated = true;
      return {
        ...record,
        state: "expired" as const,
        updatedAt: referenceTime.toISOString(),
      };
    }

    return record;
  });

  if (mutated) {
    writeStorageJson(INVENTORY_STORAGE_KEY, normalized);
  }

  return normalized;
};

export const getReservationRecords = () =>
  normalizeReservations(readStorageJson<SeatReservationRecord[]>(INVENTORY_STORAGE_KEY, []));

const persistReservations = (records: SeatReservationRecord[]) => {
  writeStorageJson(INVENTORY_STORAGE_KEY, records);
  emitStorageMutation(INVENTORY_CHANNEL);
};

const getBlockingReservation = (eventId: string, seatId: string, holdToken?: string) =>
  getReservationRecords().find((record) => {
    if (record.eventId !== eventId || record.seatId !== seatId) {
      return false;
    }

    if (record.state === "confirmed" || record.state === "pending_review") {
      return true;
    }

    if (record.state === "held") {
      return !holdToken || record.holdToken !== holdToken;
    }

    return false;
  });

export const getSeatRuntimeStatus = (
  eventId: string,
  seatId: string,
  baseStatus: EventSeatStatus,
  holdToken?: string,
): EventSeatStatus => {
  const blockingReservation = getBlockingReservation(eventId, seatId, holdToken);

  if (!blockingReservation) {
    return baseStatus;
  }

  if (blockingReservation.state === "confirmed") {
    return "sold";
  }

  if (blockingReservation.state === "held" || blockingReservation.state === "pending_review") {
    return "reserved";
  }

  return baseStatus;
};

export const hydrateEventInventory = (event: EventData, holdToken?: string): EventData => ({
  ...event,
  seatMap: {
    ...event.seatMap,
    seats: event.seatMap.seats.map((seat) => ({
      ...seat,
      status: getSeatRuntimeStatus(event.id, seat.id, seat.status, holdToken),
    })),
  },
});

export const createSeatHold = (
  event: EventData,
  seatIds: string[],
  options?: {
    accountId?: string | null;
    ttlMs?: number;
  },
): SeatHoldRecord => {
  const uniqueSeatIds = Array.from(new Set(seatIds));

  if (uniqueSeatIds.length === 0) {
    throw new Error("Nenhum assento foi informado para criar hold.");
  }

  uniqueSeatIds.forEach((seatId) => {
    const seat = getSeatById(event, seatId);

    if (!isSeatSelectable(seat)) {
      throw new Error(`O assento ${seatId} nao pode ser reservado neste momento.`);
    }

    if (getBlockingReservation(event.id, seatId)) {
      throw new Error(`O assento ${seat?.label ?? seatId} acabou de ficar indisponivel.`);
    }
  });

  const createdAt = nowIso();
  const expiresAt = new Date(Date.now() + (options?.ttlMs ?? HOLD_TTL_MS)).toISOString();
  const holdToken = createPersistentId("hold");
  const reservations = getReservationRecords();

  const holdRecords = uniqueSeatIds.map<SeatReservationRecord>((seatId) => ({
    id: createPersistentId("reservation"),
    eventId: event.id,
    eventSlug: event.slug,
    seatId,
    source: "hold",
    state: "held",
    accountId: options?.accountId ?? null,
    holdToken,
    createdAt,
    updatedAt: createdAt,
    expiresAt,
  }));

  persistReservations([...reservations, ...holdRecords]);

  trackAnalyticsEvent({
    name: "seat_hold_created",
    accountId: options?.accountId ?? null,
    eventId: event.id,
    eventSlug: event.slug,
    payload: {
      seats: uniqueSeatIds.length,
    },
  });

  return {
    holdToken,
    eventId: event.id,
    seatIds: uniqueSeatIds,
    expiresAt,
  };
};

export const releaseSeatHold = (holdToken: string) => {
  const referenceTime = nowIso();
  const reservations = getReservationRecords();
  let changed = false;

  const nextReservations = reservations.map((record) => {
    if (record.holdToken === holdToken && record.state === "held") {
      changed = true;
      return {
        ...record,
        state: "released" as const,
        updatedAt: referenceTime,
      };
    }

    return record;
  });

  if (changed) {
    persistReservations(nextReservations);
    trackAnalyticsEvent({
      name: "seat_hold_released",
      eventId: nextReservations.find((record) => record.holdToken === holdToken)?.eventId ?? null,
      eventSlug: nextReservations.find((record) => record.holdToken === holdToken)?.eventSlug ?? null,
      payload: {
        holdToken,
      },
    });
  }
};

export const reserveSeatsForReview = (event: EventData, seatIds: string[], orderId: string, holdToken?: string) => {
  const uniqueSeatIds = Array.from(new Set(seatIds));
  const reservations = getReservationRecords();
  const referenceTime = nowIso();
  let changed = false;

  const nextReservations = reservations.map((record) => {
    if (record.eventId !== event.id || !uniqueSeatIds.includes(record.seatId)) {
      return record;
    }

    if (record.state === "held" && (!holdToken || record.holdToken === holdToken)) {
      changed = true;
      return {
        ...record,
        source: "order" as const,
        state: "pending_review" as const,
        orderId,
        expiresAt: null,
        updatedAt: referenceTime,
      };
    }

    return record;
  });

  uniqueSeatIds.forEach((seatId) => {
    const alreadyReserved = nextReservations.some(
      (record) => record.eventId === event.id && record.seatId === seatId && record.state === "pending_review",
    );

    if (alreadyReserved) {
      return;
    }

    const seat = getSeatById(event, seatId);

    if (!seat) {
      return;
    }

    const blockingReservation = nextReservations.find((record) => {
      if (record.eventId !== event.id || record.seatId !== seatId) {
        return false;
      }

      if (record.state === "confirmed" || record.state === "pending_review") {
        return true;
      }

      if (record.state === "held") {
        return Boolean(holdToken) && record.holdToken !== holdToken;
      }

      return false;
    });

    if (blockingReservation) {
      throw new Error(`Nao foi possivel reservar ${seat.label} para revisao porque o assento ficou indisponivel.`);
    }

    nextReservations.push({
      id: createPersistentId("reservation"),
      eventId: event.id,
      eventSlug: event.slug,
      seatId,
      source: "order",
      state: "pending_review",
      accountId: null,
      holdToken: holdToken ?? null,
      orderId,
      createdAt: referenceTime,
      updatedAt: referenceTime,
      expiresAt: null,
    });
    changed = true;
  });

  if (changed) {
    persistReservations(nextReservations);
  }
};

export const confirmHeldSeats = (event: EventData, seatIds: string[], orderId: string, holdToken?: string) => {
  const uniqueSeatIds = Array.from(new Set(seatIds));
  const reservations = getReservationRecords();
  const referenceTime = nowIso();
  let changed = false;

  const nextReservations = reservations.map((record) => {
    if (record.eventId !== event.id || !uniqueSeatIds.includes(record.seatId)) {
      return record;
    }

    if ((record.state === "held" || record.state === "pending_review") && (!holdToken || record.holdToken === holdToken)) {
      changed = true;
      return {
        ...record,
        state: "released" as const,
        updatedAt: referenceTime,
      };
    }

    return record;
  });

  uniqueSeatIds.forEach((seatId) => {
    const seat = getSeatById(event, seatId);

    if (!seat) {
      return;
    }

    if (getBlockingReservation(event.id, seatId, holdToken)) {
      throw new Error(`Nao foi possivel confirmar ${seat.label} porque o assento ficou indisponivel.`);
    }

    nextReservations.push({
      id: createPersistentId("reservation"),
      eventId: event.id,
      eventSlug: event.slug,
      seatId,
      source: "order",
      state: "confirmed",
      accountId: null,
      holdToken: holdToken ?? null,
      orderId,
      createdAt: referenceTime,
      updatedAt: referenceTime,
      expiresAt: null,
    });
    changed = true;
  });

  if (changed) {
    persistReservations(nextReservations);
  }
};

export const confirmReservedSeatsForOrder = (orderId: string) => {
  const reservations = getReservationRecords();
  const referenceTime = nowIso();
  let changed = false;

  const nextReservations = reservations.map((record) => {
    if (record.orderId === orderId && record.state === "pending_review") {
      changed = true;
      return {
        ...record,
        state: "confirmed" as const,
        updatedAt: referenceTime,
      };
    }

    return record;
  });

  if (changed) {
    persistReservations(nextReservations);
  }
};

export const releaseOrderSeatReservations = (orderId: string) => {
  const reservations = getReservationRecords();
  const referenceTime = nowIso();
  let changed = false;

  const nextReservations = reservations.map((record) => {
    if (record.orderId === orderId && (record.state === "pending_review" || record.state === "confirmed")) {
      changed = true;
      return {
        ...record,
        state: "released" as const,
        updatedAt: referenceTime,
      };
    }

    return record;
  });

  if (changed) {
    persistReservations(nextReservations);
  }
};

export const getInventorySnapshot = (event: EventData) => {
  const reservations = getReservationRecords().filter((record) => record.eventId === event.id);

  return {
    held: reservations.filter((record) => record.state === "held").length,
    underReview: reservations.filter((record) => record.state === "pending_review").length,
    sold: reservations.filter((record) => record.state === "confirmed").length,
    reservations,
  };
};

export const inventoryStorageChannel = INVENTORY_CHANNEL;
