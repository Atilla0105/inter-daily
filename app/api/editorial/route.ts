import { unstable_noStore as noStore } from "next/cache";
import { NextResponse } from "next/server";

import { getHomeEditorialData } from "@/lib/services/app-data";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";

export async function GET(request: Request) {
  noStore();

  const { searchParams } = new URL(request.url);
  const timeZone = searchParams.get("tz") ?? "Asia/Ho_Chi_Minh";
  const payload = await getHomeEditorialData(timeZone);

  return NextResponse.json(payload, {
    headers: {
      "Cache-Control": "no-store, max-age=0"
    }
  });
}
