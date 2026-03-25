import webpush from "web-push";

import env from "@/lib/config/env";
import { listPushSubscriptions } from "@/lib/repositories/push-subscriptions";

let configured = false;

function ensureConfigured() {
  if (configured) {
    return true;
  }

  if (!env.vapidPublicKey || !env.vapidPrivateKey) {
    return false;
  }

  webpush.setVapidDetails(env.vapidSubject, env.vapidPublicKey, env.vapidPrivateKey);
  configured = true;
  return true;
}

export async function sendPushNotifications(input: {
  title: string;
  body: string;
  url?: string;
  type: "match" | "news";
}) {
  if (!ensureConfigured()) {
    return {
      sent: 0,
      skipped: true
    };
  }

  const subscriptions = await listPushSubscriptions();
  if (subscriptions.length === 0) {
    return {
      sent: 0,
      skipped: true
    };
  }

  const payload = JSON.stringify({
    title: input.title,
    body: input.body,
    url: input.url ?? "/",
    type: input.type
  });

  let sent = 0;

  await Promise.allSettled(
    subscriptions.map(async (subscription) => {
      const shouldReceive =
        input.type === "match" ? subscription.preferences.matchReminders : subscription.preferences.officialNews;

      if (!subscription.preferences.enabled || !shouldReceive) {
        return;
      }

      await webpush.sendNotification(subscription.subscription, payload);
      sent += 1;
    })
  );

  return {
    sent,
    skipped: false
  };
}
