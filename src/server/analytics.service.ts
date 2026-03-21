import { createPersistentId, emitStorageMutation, readStorageJson, writeStorageJson } from "@/server/storage";

const ANALYTICS_STORAGE_KEY = "eventhub.analytics.events";
const ANALYTICS_CHANNEL = "analytics";

export type AnalyticsEventName =
  | "seat_hold_created"
  | "seat_hold_released"
  | "payment_authorized"
  | "payment_under_review"
  | "order_approved"
  | "order_cancelled"
  | "tickets_issued"
  | "tickets_cancelled"
  | "notifications_dispatched";

export interface AnalyticsEventRecord {
  id: string;
  name: AnalyticsEventName;
  accountId?: string | null;
  eventId?: string | null;
  eventSlug?: string | null;
  orderId?: string | null;
  occurredAt: string;
  payload?: Record<string, string | number | boolean | null>;
}

const nowIso = () => new Date().toISOString();

export const getStoredAnalyticsEvents = () => readStorageJson<AnalyticsEventRecord[]>(ANALYTICS_STORAGE_KEY, []);

const persistAnalyticsEvents = (events: AnalyticsEventRecord[]) => {
  writeStorageJson(ANALYTICS_STORAGE_KEY, events);
  emitStorageMutation(ANALYTICS_CHANNEL);
};

export const trackAnalyticsEvent = (
  input: Omit<AnalyticsEventRecord, "id" | "occurredAt">,
): AnalyticsEventRecord => {
  const event: AnalyticsEventRecord = {
    id: createPersistentId("analytics"),
    occurredAt: nowIso(),
    ...input,
  };

  persistAnalyticsEvents([event, ...getStoredAnalyticsEvents()]);

  return event;
};

export const analyticsStorageChannel = ANALYTICS_CHANNEL;
