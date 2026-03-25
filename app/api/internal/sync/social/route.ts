import { NextResponse } from "next/server";

import { isAuthorizedCron } from "@/lib/server/cron";
import { refreshSocialFeed } from "@/lib/services/social-feed";

export const runtime = "nodejs";

async function handler(request: Request) {
  if (!isAuthorizedCron(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await refreshSocialFeed();
  return NextResponse.json({
    data: result,
    stale: false,
    syncedAt: new Date().toISOString()
  });
}

export async function GET(request: Request) {
  return handler(request);
}

export async function POST(request: Request) {
  return handler(request);
}
