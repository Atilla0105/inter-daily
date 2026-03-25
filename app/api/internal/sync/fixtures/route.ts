import { NextResponse } from "next/server";

import { isAuthorizedCron } from "@/lib/server/cron";
import { refreshSportsData } from "@/lib/services/app-data";

export async function POST(request: Request) {
  if (!isAuthorizedCron(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await refreshSportsData();
  return NextResponse.json({
    data: result,
    stale: false,
    syncedAt: new Date().toISOString()
  });
}
