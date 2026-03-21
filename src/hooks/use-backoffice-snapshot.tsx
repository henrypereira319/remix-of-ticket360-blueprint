import { useEffect, useState } from "react";
import { useStorageChannelVersion } from "@/hooks/use-storage-channel-version";
import { backofficeApiChannels, getBackofficeData } from "@/server/api/operations.api";
import type { BackofficeSnapshot } from "@/server/operations.service";

export const useBackofficeSnapshot = () => {
  const version = useStorageChannelVersion([...backofficeApiChannels]);
  const [snapshot, setSnapshot] = useState<BackofficeSnapshot | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      const nextSnapshot = await getBackofficeData();

      if (!cancelled) {
        setSnapshot(nextSnapshot);
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [version]);

  return snapshot;
};
