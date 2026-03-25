import { NextResponse } from "next/server";

import { getPreferences, savePreferences } from "@/lib/repositories/preferences-store";
import { userPreferencesSchema } from "@/lib/schemas";
import { DEFAULT_PREFERENCES } from "@/lib/types";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const deviceId = searchParams.get("deviceId");
  const preferences = await getPreferences(deviceId);

  return NextResponse.json({
    data: preferences,
    stale: false,
    syncedAt: new Date().toISOString(),
    offlineReady: true
  });
}

export async function PUT(request: Request) {
  const { searchParams } = new URL(request.url);
  const deviceId = searchParams.get("deviceId");
  const json = (await request.json()) as unknown;
  const parsed = userPreferencesSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Invalid preferences payload"
      },
      { status: 400 }
    );
  }

  const saved = deviceId ? await savePreferences(deviceId, parsed.data) : DEFAULT_PREFERENCES;

  return NextResponse.json({
    data: saved,
    stale: false,
    syncedAt: new Date().toISOString()
  });
}
