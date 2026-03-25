import { NextResponse } from "next/server";

import { getNewsData } from "@/lib/services/app-data";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category") ?? undefined;
  const payload = await getNewsData(category);

  return NextResponse.json(payload);
}
