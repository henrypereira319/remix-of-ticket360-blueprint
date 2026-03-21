import {
  getNotificationsByAccount,
  getStoredNotifications,
  notificationStorageChannel,
  type NotificationRecord,
} from "@/server/notification.service";

export const notificationsApiChannels = [notificationStorageChannel] as const;

export const listNotificationsByAccount = async (accountId?: string | null) => getNotificationsByAccount(accountId);

export const listAllNotifications = async (): Promise<NotificationRecord[]> => getStoredNotifications();
