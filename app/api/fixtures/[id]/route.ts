import { NextResponse } from "next/server";

import { getFixtureDetailData } from "@/lib/services/app-data";

export async function GET(
  request: Request,
  context: {
    params: Promise<{ id: string }>;
  }
) {
  const { id } = await context.params;
  const { searchParams } = new URL(request.url);
  const timeZone = searchParams.get("tz") ?? "Asia/Ho_Chi_Minh";
  const payload = await getFixtureDetailData(id, timeZone);

  return NextResponse.json(payload);
}
