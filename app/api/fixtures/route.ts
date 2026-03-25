import { NextResponse } from "next/server";

import { getFixturesData } from "@/lib/services/app-data";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") as "upcoming" | "finished" | "all" | "live" | null;
  const competition = searchParams.get("competition") as
    | "all"
    | "serie-a"
    | "ucl"
    | "coppa-italia"
    | "club-friendly"
    | null;
  const timeZone = searchParams.get("tz") ?? "Asia/Ho_Chi_Minh";

  const payload = await getFixturesData({
    status: status ?? "all",
    competition: competition ?? "all",
    timeZone
  });

  return NextResponse.json(payload);
}
