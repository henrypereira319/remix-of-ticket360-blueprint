import { useEffect, useMemo, useState } from "react";

export const useStorageChannelVersion = (channels: string[]) => {
  const [version, setVersion] = useState(0);
  const channelKey = channels.join("|");
  const watchedChannels = useMemo(() => new Set(channelKey.split("|").filter(Boolean)), [channelKey]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const refresh = () => setVersion((current) => current + 1);

    const handleMutation = (event: Event) => {
      const detail = (event as CustomEvent<{ channel?: string }>).detail;

      if (detail?.channel && watchedChannels.has(detail.channel)) {
        refresh();
      }
    };

    window.addEventListener("eventhub:storage-mutation", handleMutation as EventListener);
    window.addEventListener("storage", refresh);

    return () => {
      window.removeEventListener("eventhub:storage-mutation", handleMutation as EventListener);
      window.removeEventListener("storage", refresh);
    };
  }, [watchedChannels]);

  return version;
};
