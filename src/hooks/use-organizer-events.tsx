import { useEffect, useState } from "react";
import { useStorageChannelVersion } from "@/hooks/use-storage-channel-version";
import { getOrganizerData, organizerApiChannels } from "@/server/api/organizer.api";
import type { OrganizerSnapshot } from "@/server/organizer.service";

export const useOrganizerEvents = () => {
  const version = useStorageChannelVersion([...organizerApiChannels]);
  const [snapshot, setSnapshot] = useState<OrganizerSnapshot | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      const nextSnapshot = await getOrganizerData();

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
