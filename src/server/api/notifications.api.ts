import {
  getNotificationsByAccount,
  getStoredNotifications,
  notificationStorageChannel,
  type NotificationRecord,
} from "@/server/notification.service";
import { hasConfiguredBackendUrl, requestBackendJson } from "@/lib/backend-http";

export const notificationsApiChannels = hasConfiguredBackendUrl
  ? (["account.remote"] as const)
  : ([notificationStorageChannel] as const);

export const listNotificationsByAccount = async (accountId?: string | null) => {
  if (hasConfiguredBackendUrl && accountId) {
    try {
      return await requestBackendJson<NotificationRecord[]>(`/api/accounts/${accountId}/notifications`);
    } catch (error) {
      console.warn("Falha ao carregar notificacoes remotas da conta, usando fallback local.", error);
    }
  }

  return getNotificationsByAccount(accountId);
};

export const listAllNotifications = async (): Promise<NotificationRecord[]> => getStoredNotifications();
