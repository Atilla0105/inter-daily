import { NextResponse } from "next/server";

import { getHomeEditorialData } from "@/lib/services/app-data";
import { EMPTY_HOME_EDITORIAL } from "@/lib/types";

const editorialRouteTimeoutMs = 15000;

function createEditorialFallback() {
  const syncedAt = new Date().toISOString();

  return {
    data: EMPTY_HOME_EDITORIAL,
    stale: true,
    syncedAt,
    offlineReady: true
  };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const timeZone = searchParams.get("tz") ?? "Asia/Ho_Chi_Minh";
  const payload = await Promise.race([
    getHomeEditorialData(timeZone),
    new Promise<Awaited<ReturnType<typeof getHomeEditorialData>>>((resolve) =>
      setTimeout(() => resolve(createEditorialFallback()), editorialRouteTimeoutMs)
    )
  ]);

  return NextResponse.json(payload);
}
