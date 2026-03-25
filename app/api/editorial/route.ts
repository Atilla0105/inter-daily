import { NextResponse } from "next/server";

import { getHomeEditorialData } from "@/lib/services/app-data";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const timeZone = searchParams.get("tz") ?? "Asia/Ho_Chi_Minh";
  const payload = await getHomeEditorialData(timeZone);

  return NextResponse.json(payload);
}
