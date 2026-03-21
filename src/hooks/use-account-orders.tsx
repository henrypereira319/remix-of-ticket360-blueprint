import { useEffect, useState } from "react";
import type { CheckoutOrderRecord } from "@/server/checkout.service";
import { listOrdersByAccount, ordersApiChannels } from "@/server/api/orders.api";
import { useStorageChannelVersion } from "@/hooks/use-storage-channel-version";

export const useAccountOrders = (accountId?: string | null) => {
  const version = useStorageChannelVersion([...ordersApiChannels]);
  const [orders, setOrders] = useState<CheckoutOrderRecord[]>([]);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      const nextOrders = await listOrdersByAccount(accountId);

      if (!cancelled) {
        setOrders(nextOrders);
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [accountId, version]);

  return { orders };
};
