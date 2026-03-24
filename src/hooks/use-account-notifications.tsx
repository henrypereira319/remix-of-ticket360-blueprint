import { useEffect, useState } from "react";
import type { NotificationRecord } from "@/server/notification.service";
import { listNotificationsByAccount, notificationsApiChannels } from "@/server/api/notifications.api";
import { useStorageChannelVersion } from "@/hooks/use-storage-channel-version";

export const useAccountNotifications = (accountId?: string | null) => {
  const version = useStorageChannelVersion([...notificationsApiChannels]);
  const [notifications, setNotifications] = useState<NotificationRecord[]>([]);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      const nextNotifications = await listNotificationsByAccount(accountId);

      if (!cancelled) {
        setNotifications(nextNotifications);
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [accountId, version]);

  return { notifications };
};
