import env from "@/lib/config/env";
import { mirroredSocialAccounts, socialFeedSeed } from "@/lib/data/social";
import { apifyInstagramMirrorProvider } from "@/lib/providers/social/apify-instagram";
import { getCachedOrLoad, primeCacheValue } from "@/lib/server/cache";
import type { ApiEnvelope, MirroredSocialAccount, SocialFeedItem, SocialMirrorRecord, SocialSourceType } from "@/lib/types";

const SOCIAL_FEED_CACHE_KEY = "social:mirror-feed";
const DEFAULT_MAX_POSTS_PER_ACCOUNT = 2;
const DEFAULT_LIMIT = 12;
const MIN_SYNC_HOURS = 2;
const MAX_SYNC_HOURS = 6;
const USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36";

function getSocialSyncSeconds() {
  const hours = Number.isFinite(env.socialSyncHours) ? env.socialSyncHours : MAX_SYNC_HOURS;
  return Math.max(MIN_SYNC_HOURS, Math.min(MAX_SYNC_HOURS, hours)) * 60 * 60;
}

function normalizeHandle(value: string) {
  return value.trim().replace(/^@/, "").toLowerCase();
}

function getConfiguredHandles() {
  return Array.from(
    new Set([env.socialClubAccount, ...env.socialPlayerAccounts.split(",")].map(normalizeHandle).filter(Boolean))
  );
}

function buildCatalog(handles: string[]): MirroredSocialAccount[] {
  const known = new Map(
    mirroredSocialAccounts.map((account) => [account.sourceAccount.toLowerCase(), account] as const)
  );

  return handles.map((handle) => {
    const existing = known.get(handle);

    if (existing) {
      return existing;
    }

    return {
      sourceAccount: handle,
      displayName: handle,
      sourceType: handle === normalizeHandle(env.socialClubAccount) ? "club" : "player",
      roleLabel: handle === normalizeHandle(env.socialClubAccount) ? "俱乐部官方" : "球员账号",
      summary: "自定义镜像账号。"
    };
  });
}

function toPublicFeedItem(item: SocialMirrorRecord): SocialFeedItem {
  return {
    id: item.id,
    sourceAccount: item.sourceAccount,
    sourceLabel: item.sourceLabel,
    sourceType: item.sourceType,
    postType: item.postType,
    caption: item.caption,
    publishedAt: item.publishedAt,
    thumbnail: item.remoteThumbnailUrl ? `/api/social/assets/${encodeURIComponent(item.id)}?kind=thumbnail` : null,
    mediaUrl: item.remoteMediaUrl ? `/api/social/assets/${encodeURIComponent(item.id)}?kind=media` : null,
    permalink: item.permalink ?? null
  };
}

function filterRecords(items: SocialMirrorRecord[], sourceType?: string) {
  if (!sourceType || sourceType === "all") {
    return items;
  }

  if (sourceType === "club" || sourceType === "player") {
    return items.filter((item) => item.sourceType === sourceType);
  }

  return items;
}

async function loadSocialMirrorRecords() {
  const handles = getConfiguredHandles();
  const catalog = buildCatalog(handles);

  try {
    const liveItems = await apifyInstagramMirrorProvider.listFeed({
      catalog,
      handles,
      clubHandle: normalizeHandle(env.socialClubAccount),
      maxPostsPerAccount: DEFAULT_MAX_POSTS_PER_ACCOUNT
    });

    if (liveItems.length > 0) {
      return liveItems.slice(0, DEFAULT_LIMIT);
    }
  } catch {
    // Provider failures fall back to cached data or seeds.
  }

  return socialFeedSeed.slice(0, DEFAULT_LIMIT);
}

function buildPlaceholderSvg(record?: SocialMirrorRecord | null) {
  const label = record?.sourceLabel ?? "Inter Mirror";
  const badge = record?.postType === "reel" ? "REEL" : "POST";
  const caption = (record?.caption ?? "暂时没有可用缩略图").slice(0, 54);

  return `<svg xmlns="http://www.w3.org/2000/svg" width="960" height="720" viewBox="0 0 960 720" fill="none">
    <rect width="960" height="720" rx="32" fill="#131A22"/>
    <rect x="24" y="24" width="912" height="672" rx="28" fill="#18212B" stroke="#243040"/>
    <circle cx="96" cy="96" r="36" fill="#1266AB" fill-opacity="0.18"/>
    <text x="96" y="104" text-anchor="middle" fill="#F5F7FA" font-family="system-ui, sans-serif" font-size="26" font-weight="700">${label
      .slice(0, 1)
      .toUpperCase()}</text>
    <text x="148" y="92" fill="#F5F7FA" font-family="system-ui, sans-serif" font-size="28" font-weight="700">${label}</text>
    <text x="148" y="126" fill="#B8C2CF" font-family="system-ui, sans-serif" font-size="18">Inter Daily 社媒镜像</text>
    <rect x="772" y="60" width="112" height="44" rx="22" fill="#1266AB" fill-opacity="0.16" stroke="#1266AB"/>
    <text x="828" y="88" text-anchor="middle" fill="#F5F7FA" font-family="system-ui, sans-serif" font-size="18" font-weight="700">${badge}</text>
    <text x="64" y="560" fill="#F5F7FA" font-family="system-ui, sans-serif" font-size="40" font-weight="700">暂时没有可用缩略图</text>
    <text x="64" y="614" fill="#B8C2CF" font-family="system-ui, sans-serif" font-size="24">${caption}</text>
  </svg>`;
}

function placeholderResponse(record?: SocialMirrorRecord | null) {
  return new Response(buildPlaceholderSvg(record), {
    headers: {
      "content-type": "image/svg+xml; charset=utf-8",
      "cache-control": `public, max-age=3600, s-maxage=${getSocialSyncSeconds()}, stale-while-revalidate=86400`
    }
  });
}

export async function getSocialFeedData(
  sourceType?: string,
  limit = DEFAULT_LIMIT
): Promise<ApiEnvelope<SocialFeedItem[]>> {
  const result = await getCachedOrLoad(SOCIAL_FEED_CACHE_KEY, getSocialSyncSeconds(), loadSocialMirrorRecords);
  const items = filterRecords(result.data, sourceType)
    .slice(0, limit)
    .map((item) => ({
      ...toPublicFeedItem(item),
      stale: result.stale
    }));

  return {
    data: items,
    stale: result.stale,
    syncedAt: result.syncedAt,
    offlineReady: true
  };
}

export async function refreshSocialFeed() {
  const data = await loadSocialMirrorRecords();
  const syncedAt = new Date().toISOString();

  await primeCacheValue(SOCIAL_FEED_CACHE_KEY, getSocialSyncSeconds(), data, syncedAt);

  return {
    source: apifyInstagramMirrorProvider.name,
    accounts: getConfiguredHandles(),
    items: data.length,
    latestSource: data[0]?.sourceAccount ?? null,
    latestPublishedAt: data[0]?.publishedAt ?? null
  };
}

export async function getSocialAssetResponse(id: string, kind: "thumbnail" | "media") {
  const result = await getCachedOrLoad(SOCIAL_FEED_CACHE_KEY, getSocialSyncSeconds(), loadSocialMirrorRecords);
  const record = result.data.find((item) => item.id === id);
  const remoteUrl =
    kind === "media" ? record?.remoteMediaUrl ?? record?.remoteThumbnailUrl ?? null : record?.remoteThumbnailUrl ?? null;

  if (!record || !remoteUrl) {
    return placeholderResponse(record);
  }

  try {
    const response = await fetch(remoteUrl, {
      headers: {
        accept: "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
        "user-agent": USER_AGENT
      },
      next: {
        revalidate: getSocialSyncSeconds()
      }
    });

    if (!response.ok || !response.body) {
      throw new Error(`asset proxy failed: ${response.status}`);
    }

    return new Response(response.body, {
      headers: {
        "content-type": response.headers.get("content-type") ?? "image/jpeg",
        "cache-control": `public, max-age=3600, s-maxage=${getSocialSyncSeconds()}, stale-while-revalidate=86400`
      }
    });
  } catch {
    return placeholderResponse(record);
  }
}

export function getFeaturedSocialAccounts() {
  return mirroredSocialAccounts;
}

export function filterSocialFeedBySourceType<T extends { sourceType: SocialSourceType }>(items: T[], sourceType: string) {
  if (sourceType !== "club" && sourceType !== "player") {
    return items;
  }

  return items.filter((item) => item.sourceType === sourceType);
}
