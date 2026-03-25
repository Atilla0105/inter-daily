import { NextResponse } from "next/server";

import { getSquadData } from "@/lib/services/app-data";

export async function GET() {
  const payload = await getSquadData();
  return NextResponse.json(payload);
}
