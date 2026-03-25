import { NextResponse } from "next/server";
import { z } from "zod";

import { savePushSubscription } from "@/lib/repositories/push-subscriptions";

const subscribeSchema = z.object({
  deviceId: z.string().optional(),
  subscription: z.object({
    endpoint: z.string(),
    keys: z.object({
      p256dh: z.string(),
      auth: z.string()
    })
  }),
  preferences: z.object({
    enabled: z.boolean(),
    matchReminders: z.boolean(),
    liveEvents: z.boolean(),
    officialNews: z.boolean(),
    quietHoursEnabled: z.boolean(),
    quietHoursStart: z.string(),
    quietHoursEnd: z.string()
  })
});

export async function POST(request: Request) {
  const json = (await request.json()) as unknown;
  const parsed = subscribeSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid subscription payload" }, { status: 400 });
  }

  const result = await savePushSubscription(parsed.data);

  return NextResponse.json({
    data: result,
    stale: false,
    syncedAt: new Date().toISOString()
  });
}
