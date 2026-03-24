import { getStoredOrders } from "@/server/checkout.service";
import { createPersistentId, emitStorageMutation, readStorageJson, writeStorageJson } from "@/server/storage";

const SUPPORT_STORAGE_KEY = "eventhub.support-cases";
const SUPPORT_CHANNEL = "support";

export type SupportCaseCategory = "order" | "payment" | "ticket" | "refund" | "access";
export type SupportCaseStatus = "open" | "investigating" | "resolved";

export interface SupportCaseRecord {
  id: string;
  accountId?: string | null;
  orderId?: string | null;
  orderReference?: string | null;
  eventSlug?: string | null;
  category: SupportCaseCategory;
  status: SupportCaseStatus;
  subject: string;
  message: string;
  resolutionSummary?: string | null;
  metadata?: Record<string, string | number | boolean | null>;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSupportCaseInput {
  accountId?: string | null;
  orderId?: string | null;
  category: SupportCaseCategory;
  subject: string;
  message: string;
}

const nowIso = () => new Date().toISOString();

const persistSupportCases = (supportCases: SupportCaseRecord[]) => {
  writeStorageJson(SUPPORT_STORAGE_KEY, supportCases);
  emitStorageMutation(SUPPORT_CHANNEL);
};

export const getStoredSupportCases = () => readStorageJson<SupportCaseRecord[]>(SUPPORT_STORAGE_KEY, []);

export const listSupportCasesByAccount = (accountId?: string | null) =>
  accountId ? getStoredSupportCases().filter((supportCase) => supportCase.accountId === accountId) : [];

export const createSupportCaseLocal = (input: CreateSupportCaseInput): SupportCaseRecord => {
  const relatedOrder = input.orderId ? getStoredOrders().find((order) => order.id === input.orderId) ?? null : null;
  const createdAt = nowIso();
  const supportCase: SupportCaseRecord = {
    id: createPersistentId("support"),
    accountId: input.accountId ?? null,
    orderId: input.orderId ?? null,
    orderReference: relatedOrder?.reference ?? null,
    eventSlug: relatedOrder?.eventSlug ?? null,
    category: input.category,
    status: "open",
    subject: input.subject.trim(),
    message: input.message.trim(),
    resolutionSummary: null,
    metadata: {},
    createdAt,
    updatedAt: createdAt,
  };

  persistSupportCases([supportCase, ...getStoredSupportCases()]);

  return supportCase;
};

export const supportStorageChannel = SUPPORT_CHANNEL;
