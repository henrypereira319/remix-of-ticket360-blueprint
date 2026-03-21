import {
  approveOrderFromBackoffice,
  cancelOrderFromBackoffice,
  denyOrderFromBackoffice,
  getBackofficeSnapshot,
  operationsStorageChannels,
} from "@/server/operations.service";

export const backofficeApiChannels = operationsStorageChannels;

export const getBackofficeData = async () => getBackofficeSnapshot();

export const approveBackofficeOrder = async (orderId: string) => approveOrderFromBackoffice(orderId);

export const denyBackofficeOrder = async (orderId: string) => denyOrderFromBackoffice(orderId);

export const cancelBackofficeOrder = async (orderId: string) => cancelOrderFromBackoffice(orderId);
