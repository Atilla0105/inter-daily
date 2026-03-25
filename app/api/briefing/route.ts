import { unstable_noStore as noStore } from "next/cache";
import { NextResponse } from "next/server";

import { getDailyBriefingData } from "@/lib/services/briefing";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";

export async function GET() {
  noStore();

  const briefing = await getDailyBriefingData();
  return NextResponse.json(briefing.data, {
    headers: {
      "Cache-Control": "no-store, max-age=0"
    }
  });
}
