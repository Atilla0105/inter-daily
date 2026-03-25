import { NextResponse } from "next/server";

import { generateDailyBriefing } from "@/lib/services/briefing";

export async function GET() {
  const briefing = await generateDailyBriefing();
  return NextResponse.json(briefing);
}
