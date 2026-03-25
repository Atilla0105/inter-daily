import env from "@/lib/config/env";
import type { MirroredSocialAccount, SocialMirrorRecord } from "@/lib/types";

type ApifyInstagramItem = {
  id?: string | null;
  shortCode?: string | null;
  url?: string | null;
  caption?: string | null;
  timestamp?: string | null;
  displayUrl?: string | null;
  type?: string | null;
  author?: string | null;
};

function normalizeActorId(actorId: string) {
  return actorId.includes("/") ? actorId.replace("/", "~") : actorId;
}

function normalizePublishedAt(raw?: string | null) {
  if (!raw) {
    return new Date().toISOString();
  }

  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? new Date().toISOString() : parsed.toISOString();
}

function normalizeCaption(raw?: string | null) {
  const text = raw?.trim();

  if (!text) {
    return "社媒镜像已同步，本条没有可用文案。";
  }

  return text.replace(/\s+/g, " ").slice(0, 280);
}

export class ApifyInstagramMirrorProvider {
  readonly name = "Apify Instagram Mirror";

  async listFeed(input: {
    catalog: MirroredSocialAccount[];
    handles: string[];
    clubHandle: string;
    maxPostsPerAccount: number;
  }): Promise<SocialMirrorRecord[]> {
    if (!env.apifyToken || input.handles.length === 0) {
      return [];
    }

    const actorId = normalizeActorId(env.apifyInstagramActorId);
    const endpoint = `https://api.apify.com/v2/acts/${actorId}/run-sync-get-dataset-items?token=${env.apifyToken}`;
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({
        profiles: input.handles,
        maxPosts: input.maxPostsPerAccount
      }),
      cache: "no-store"
    });

    if (!response.ok) {
      throw new Error(`Apify social fetch failed: ${response.status}`);
    }

    const items = (await response.json()) as ApifyInstagramItem[];
    const metaMap = new Map(
      input.catalog.map((account) => [account.sourceAccount.toLowerCase(), account] as const)
    );

    const normalized: SocialMirrorRecord[] = [];

    for (const item of items) {
      const author = item.author?.trim().replace(/^@/, "").toLowerCase();

      if (!author) {
        continue;
      }

      const metadata = metaMap.get(author);
      const shortCode = item.shortCode?.trim() || item.id?.trim() || `${author}-${item.timestamp ?? Date.now()}`;

      normalized.push({
        id: `${author}-${shortCode}`,
        sourceAccount: author,
        sourceLabel: metadata?.displayName ?? author,
        sourceType: author === input.clubHandle.toLowerCase() ? "club" : metadata?.sourceType ?? "player",
        postType: item.type === "reel" ? "reel" : "post",
        caption: normalizeCaption(item.caption),
        publishedAt: normalizePublishedAt(item.timestamp),
        permalink: item.url?.trim() || null,
        remoteThumbnailUrl: item.displayUrl?.trim() || null,
        remoteMediaUrl: null
      });
    }

    return normalized.sort((left, right) => new Date(right.publishedAt).getTime() - new Date(left.publishedAt).getTime());
  }
}

export const apifyInstagramMirrorProvider = new ApifyInstagramMirrorProvider();
