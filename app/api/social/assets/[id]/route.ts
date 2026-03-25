import { getSocialAssetResponse } from "@/lib/services/social-feed";

export const runtime = "nodejs";

export async function GET(
  request: Request,
  context: {
    params: Promise<{
      id: string;
    }>;
  }
) {
  const { searchParams } = new URL(request.url);
  const { id } = await context.params;
  const kind = searchParams.get("kind") === "media" ? "media" : "thumbnail";

  return getSocialAssetResponse(decodeURIComponent(id), kind);
}
