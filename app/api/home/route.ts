import { NextResponse } from "next/server";

import { getHomePayload } from "@/lib/services/app-data";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const timeZone = searchParams.get("tz") ?? "Asia/Ho_Chi_Minh";
  const payload = await getHomePayload(timeZone);

  return NextResponse.json(payload);
}
