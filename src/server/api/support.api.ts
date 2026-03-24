import { emitBackendMutation, hasConfiguredBackendUrl, requestBackendJson } from "@/lib/backend-http";
import {
  createSupportCaseLocal,
  listSupportCasesByAccount as listSupportCasesByAccountLocal,
  supportStorageChannel,
  type CreateSupportCaseInput,
  type SupportCaseRecord,
} from "@/server/support.service";

const remoteSupportChannel = "support.remote";

export const supportApiChannels = hasConfiguredBackendUrl
  ? ([remoteSupportChannel, "account.remote"] as const)
  : ([supportStorageChannel] as const);

const notifyRemoteSupportMutation = () => {
  emitBackendMutation(remoteSupportChannel);
  emitBackendMutation("account.remote");
};

export const listSupportCasesByAccount = async (accountId?: string | null) => {
  if (hasConfiguredBackendUrl && accountId) {
    try {
      return await requestBackendJson<SupportCaseRecord[]>(`/api/accounts/${accountId}/support-cases`);
    } catch (error) {
      console.warn("Falha ao carregar casos remotos de suporte, usando fallback local.", error);
    }
  }

  return listSupportCasesByAccountLocal(accountId);
};

export const createSupportCase = async (input: CreateSupportCaseInput) => {
  if (hasConfiguredBackendUrl) {
    try {
      const supportCase = await requestBackendJson<SupportCaseRecord>("/api/support/cases", {
        method: "POST",
        body: JSON.stringify(input),
      });
      notifyRemoteSupportMutation();
      return supportCase;
    } catch (error) {
      console.warn("Falha ao criar caso remoto de suporte, usando fallback local.", error);
    }
  }

  return createSupportCaseLocal(input);
};
