import {
  analyticsStorageChannel,
  getStoredAnalyticsEvents,
  type AnalyticsEventRecord,
} from "@/server/analytics.service";

export const analyticsApiChannels = [analyticsStorageChannel] as const;

export const listAnalyticsEvents = async (): Promise<AnalyticsEventRecord[]> => getStoredAnalyticsEvents();
