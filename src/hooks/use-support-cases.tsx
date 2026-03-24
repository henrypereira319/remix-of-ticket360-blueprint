import { useEffect, useState } from "react";
import { useStorageChannelVersion } from "@/hooks/use-storage-channel-version";
import { listSupportCasesByAccount, supportApiChannels } from "@/server/api/support.api";
import type { SupportCaseRecord } from "@/server/support.service";

export const useSupportCases = (accountId?: string | null) => {
  const version = useStorageChannelVersion([...supportApiChannels]);
  const [supportCases, setSupportCases] = useState<SupportCaseRecord[]>([]);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      const nextCases = await listSupportCasesByAccount(accountId);

      if (!cancelled) {
        setSupportCases(nextCases);
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [accountId, version]);

  return {
    supportCases,
  };
};
