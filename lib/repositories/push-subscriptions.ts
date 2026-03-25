import { prisma } from "@/lib/server/prisma";
import type { NotificationPreferences, PushSubscriptionRecord } from "@/lib/types";

const fallbackSubscriptions = new Map<
  string,
  {
    subscription: PushSubscriptionRecord;
    preferences: NotificationPreferences;
    deviceId?: string | null;
  }
>();

export async function savePushSubscription(input: {
  deviceId?: string | null;
  subscription: PushSubscriptionRecord;
  preferences: NotificationPreferences;
}) {
  fallbackSubscriptions.set(input.subscription.endpoint, input);

  if (!prisma) {
    return {
      saved: true,
      storage: "memory" as const
    };
  }

  await prisma.pushSubscription.upsert({
    where: {
      endpoint: input.subscription.endpoint
    },
    update: {
      deviceId: input.deviceId ?? null,
      p256dh: input.subscription.keys.p256dh,
      auth: input.subscription.keys.auth,
      notificationsEnabled: input.preferences.enabled,
      matchReminders: input.preferences.matchReminders,
      liveEvents: input.preferences.liveEvents,
      officialNews: input.preferences.officialNews,
      quietHoursEnabled: input.preferences.quietHoursEnabled,
      quietHoursStart: input.preferences.quietHoursStart,
      quietHoursEnd: input.preferences.quietHoursEnd
    },
    create: {
      endpoint: input.subscription.endpoint,
      deviceId: input.deviceId ?? null,
      p256dh: input.subscription.keys.p256dh,
      auth: input.subscription.keys.auth,
      notificationsEnabled: input.preferences.enabled,
      matchReminders: input.preferences.matchReminders,
      liveEvents: input.preferences.liveEvents,
      officialNews: input.preferences.officialNews,
      quietHoursEnabled: input.preferences.quietHoursEnabled,
      quietHoursStart: input.preferences.quietHoursStart,
      quietHoursEnd: input.preferences.quietHoursEnd
    }
  });

  return {
    saved: true,
    storage: "prisma" as const
  };
}

export async function listPushSubscriptions() {
  if (!prisma) {
    return Array.from(fallbackSubscriptions.values());
  }

  const rows = await prisma.pushSubscription.findMany();
  return rows.map((row) => ({
    deviceId: row.deviceId,
    subscription: {
      endpoint: row.endpoint,
      keys: {
        p256dh: row.p256dh,
        auth: row.auth
      }
    },
    preferences: {
      enabled: row.notificationsEnabled,
      matchReminders: row.matchReminders,
      liveEvents: row.liveEvents,
      officialNews: row.officialNews,
      quietHoursEnabled: row.quietHoursEnabled,
      quietHoursStart: row.quietHoursStart ?? "23:00",
      quietHoursEnd: row.quietHoursEnd ?? "08:00"
    }
  }));
}
