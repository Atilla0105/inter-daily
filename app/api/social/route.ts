import { NextResponse } from "next/server";

import { getSocialFeedData } from "@/lib/services/social-feed";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const sourceType = searchParams.get("sourceType") ?? "all";
  const limitParam = Number(searchParams.get("limit") ?? "12");
  const limit = Number.isFinite(limitParam) ? Math.max(1, Math.min(12, limitParam)) : 12;
  const payload = await getSocialFeedData(sourceType, limit);

  return NextResponse.json(payload);
}
