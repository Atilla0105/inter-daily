import env from "@/lib/config/env";
import type { MirroredSocialAccount, SocialMirrorRecord } from "@/lib/types";

type ApifyInstagramItem = {
  id?: string | null;
  shortCode?: string | null;
  shortcode?: string | null;
  url?: string | null;
  caption?: string | null;
  timestamp?: string | number | null;
  publishedAt?: string | number | null;
  takenAt?: string | number | null;
  takenAtTimestamp?: string | number | null;
  createTime?: string | number | null;
  createdAt?: string | number | null;
  displayUrl?: string | null;
  displayUrlHd?: string | null;
  imageUrl?: string | null;
  thumbnailUrl?: string | null;
  videoUrl?: string | null;
  type?: string | null;
  mediaType?: string | null;
  productType?: string | null;
  author?: string | null;
  ownerUsername?: string | null;
  username?: string | null;
};

const ALT_CAPTION_PATTERN = /^(photo shared by|video by)\b/i;
const EMBEDDED_DATE_PATTERN = /\bon\s+([A-Z][a-z]+ \d{1,2}, \d{4}(?: at \d{1,2}:\d{2}(?:\s?[AP]M)?)?)/i;

function normalizeActorId(actorId: string) {
  return actorId.includes("/") ? actorId.replace("/", "~") : actorId;
}

function normalizeHandle(raw?: string | null) {
  return raw?.trim().replace(/^@/, "").toLowerCase() ?? "";
}

function coerceDateValue(raw?: string | number | null) {
  if (raw === null || raw === undefined || raw === "") {
    return null;
  }

  if (typeof raw === "number") {
    const millis = raw > 1e12 ? raw : raw * 1000;
    const parsed = new Date(millis);
    return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
  }

  const value = raw.trim();
  if (!value) {
    return null;
  }

  if (/^\d+$/.test(value)) {
    return coerceDateValue(Number(value));
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

function parseCaptionDate(raw?: string | null) {
  const text = raw?.trim();
  if (!text) {
    return null;
  }

  const match = text.match(EMBEDDED_DATE_PATTERN);
  if (!match) {
    return null;
  }

  const parsed = new Date(match[1]);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

function normalizePublishedAt(item: ApifyInstagramItem) {
  return (
    coerceDateValue(item.timestamp) ??
    coerceDateValue(item.publishedAt) ??
    coerceDateValue(item.takenAtTimestamp) ??
    coerceDateValue(item.takenAt) ??
    coerceDateValue(item.createTime) ??
    coerceDateValue(item.createdAt) ??
    parseCaptionDate(item.caption)
  );
}

function normalizeCaption(raw?: string | null, sourceLabel?: string) {
  const text = raw?.trim();

  if (!text) {
    return `${sourceLabel ?? "该账号"}的公开内容镜像，原始文案暂不可用。`;
  }

  const collapsed = text.replace(/\s+/g, " ").trim();
  if (!collapsed) {
    return `${sourceLabel ?? "该账号"}的公开内容镜像，原始文案暂不可用。`;
  }

  if (ALT_CAPTION_PATTERN.test(collapsed)) {
    return `${sourceLabel ?? "该账号"}的公开内容镜像，原始文案暂不可用。`;
  }

  return collapsed.slice(0, 280);
}

function normalizePostType(item: ApifyInstagramItem) {
  const rawType = `${item.type ?? item.mediaType ?? item.productType ?? ""}`.toLowerCase();
  return rawType.includes("reel") ? "reel" : "post";
}

function selectThumbnailUrl(item: ApifyInstagramItem) {
  return item.displayUrl?.trim() || item.displayUrlHd?.trim() || item.imageUrl?.trim() || item.thumbnailUrl?.trim() || null;
}

function selectMediaUrl(item: ApifyInstagramItem) {
  return item.videoUrl?.trim() || null;
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
      const author = normalizeHandle(item.author ?? item.ownerUsername ?? item.username);
      if (!author) {
        continue;
      }

      const publishedAt = normalizePublishedAt(item);
      if (!publishedAt) {
        continue;
      }

      const metadata = metaMap.get(author);
      const shortCode = item.shortCode?.trim() || item.shortcode?.trim() || item.id?.trim() || `${author}-${publishedAt}`;

      normalized.push({
        id: `${author}-${shortCode}`,
        sourceAccount: author,
        sourceLabel: metadata?.displayName ?? author,
        sourceType: author === input.clubHandle.toLowerCase() ? "club" : metadata?.sourceType ?? "player",
        postType: normalizePostType(item),
        caption: normalizeCaption(item.caption, metadata?.displayName ?? author),
        publishedAt,
        permalink: item.url?.trim() || null,
        remoteThumbnailUrl: selectThumbnailUrl(item),
        remoteMediaUrl: selectMediaUrl(item)
      });
    }

    return normalized.sort((left, right) => new Date(right.publishedAt).getTime() - new Date(left.publishedAt).getTime());
  }
}

export const apifyInstagramMirrorProvider = new ApifyInstagramMirrorProvider();
