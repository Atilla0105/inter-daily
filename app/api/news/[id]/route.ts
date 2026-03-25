import { NextResponse } from "next/server";

import { getNewsDetailData } from "@/lib/services/app-data";

export async function GET(
  _: Request,
  context: {
    params: Promise<{ id: string }>;
  }
) {
  const { id } = await context.params;
  const payload = await getNewsDetailData(id);

  return NextResponse.json(payload);
}
