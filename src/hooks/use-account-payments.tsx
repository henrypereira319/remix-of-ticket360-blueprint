import { useEffect, useState } from "react";
import type { PaymentRecord } from "@/server/payment.service";
import { listPaymentsByAccount, paymentsApiChannels } from "@/server/api/payments.api";
import { useStorageChannelVersion } from "@/hooks/use-storage-channel-version";

export const useAccountPayments = (accountId?: string | null) => {
  const version = useStorageChannelVersion([...paymentsApiChannels]);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      const nextPayments = await listPaymentsByAccount(accountId);

      if (!cancelled) {
        setPayments(nextPayments);
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [accountId, version]);

  return { payments };
};
