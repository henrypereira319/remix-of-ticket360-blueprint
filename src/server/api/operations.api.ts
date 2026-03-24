import {
  approveOrderFromBackoffice,
  cancelOrderFromBackoffice,
  denyOrderFromBackoffice,
  getBackofficeSnapshot,
  operationsStorageChannels,
} from "@/server/operations.service";
import { emitBackendMutation, hasConfiguredBackendUrl, requestBackendJson } from "@/lib/backend-http";
import type { BackofficeSnapshot } from "@/server/operations.service";

const remoteBackofficeChannel = "backoffice.remote";

export const backofficeApiChannels = hasConfiguredBackendUrl ? ([remoteBackofficeChannel] as const) : operationsStorageChannels;

const notifyRemoteMutation = () => {
  emitBackendMutation(remoteBackofficeChannel);
  emitBackendMutation("account.remote");
};

export const getBackofficeData = async () => {
  if (hasConfiguredBackendUrl) {
    try {
      return await requestBackendJson<BackofficeSnapshot>("/api/backoffice");
    } catch (error) {
      console.warn("Falha ao buscar backoffice remoto, usando snapshot local.", error);
    }
  }

  return getBackofficeSnapshot();
};

export const approveBackofficeOrder = async (orderId: string) => {
  if (hasConfiguredBackendUrl) {
    try {
      const result = await requestBackendJson<{ reference: string }>(`/api/backoffice/orders/${orderId}/approve`, {
        method: "POST",
      });
      notifyRemoteMutation();
      return result;
    } catch (error) {
      console.warn("Falha ao aprovar pedido no backend remoto, usando fluxo local.", error);
    }
  }

  return approveOrderFromBackoffice(orderId);
};

export const denyBackofficeOrder = async (orderId: string) => {
  if (hasConfiguredBackendUrl) {
    try {
      const result = await requestBackendJson<{ reference: string }>(`/api/backoffice/orders/${orderId}/deny`, {
        method: "POST",
      });
      notifyRemoteMutation();
      return result;
    } catch (error) {
      console.warn("Falha ao negar pedido no backend remoto, usando fluxo local.", error);
    }
  }

  return denyOrderFromBackoffice(orderId);
};

export const cancelBackofficeOrder = async (orderId: string) => {
  if (hasConfiguredBackendUrl) {
    try {
      const result = await requestBackendJson<{ reference: string }>(`/api/backoffice/orders/${orderId}/cancel`, {
        method: "POST",
      });
      notifyRemoteMutation();
      return result;
    } catch (error) {
      console.warn("Falha ao cancelar pedido no backend remoto, usando fluxo local.", error);
    }
  }

  return cancelOrderFromBackoffice(orderId);
};
