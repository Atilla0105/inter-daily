import { NextResponse } from "next/server";

import { getStandingsData } from "@/lib/services/app-data";

export async function GET() {
  const payload = await getStandingsData();
  return NextResponse.json(payload);
}
