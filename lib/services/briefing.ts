import { z } from "zod";

import env from "@/lib/config/env";
import { deepseek } from "@/lib/deepseek";
import { interOfficialProvider } from "@/lib/providers/official/inter-official";
import { homeEditorialSchema } from "@/lib/schemas";
import { getCachedOrLoad } from "@/lib/server/cache";
import { EMPTY_HOME_EDITORIAL, type ApiEnvelope, type HomeEditorial } from "@/lib/types";

const briefingCacheTtlSeconds = 7200;
const briefingCacheKey = "briefing:v3:daily";
const maxListingItems = 6;
const maxArticleItems = 4;
const maxBodyChars = 5000;
const articleBundleTimeoutMs = 5000;
const deepseekBriefingTimeoutMs = 6000;

const sourceBundleSchema = z.object({
  generatedAt: z.string(),
  listingUrl: z.string().url(),
  listing: z.array(
    z.object({
      title: z.string(),
      source: z.string(),
      publishedAt: z.string(),
      url: z.string().url(),
      category: z.string()
    })
  ),
  articles: z.array(
    z.object({
      title: z.string(),
      source: z.string(),
      publishedAt: z.string(),
      url: z.string().url(),
      category: z.string(),
      excerpt: z.string(),
      body: z.string()
    })
  )
});

function hasBriefingContent(briefing: HomeEditorial) {
  return (
    briefing.topNews.length > 0 ||
    briefing.clubUpdates.length > 0 ||
    briefing.playerWatch.length > 0 ||
    briefing.injuryTransferWatch.length > 0 ||
    briefing.dailyChanges.length > 0 ||
    briefing.matchStoryline !== null
  );
}

function buildListingSummary(item: z.infer<typeof sourceBundleSchema>["listing"][number]) {
  if (item.category === "transfers") {
    return "官方列表提到了转会相关动态，详情以原文为准。";
  }

  if (item.category === "matchday") {
    return "官方列表已更新比赛日内容，详情以原文为准。";
  }

  return "官方新闻列表已有更新，详情以原文为准。";
}

function buildFallbackBriefingFromSources(sourceBundle: z.infer<typeof sourceBundleSchema>): HomeEditorial {
  const articles =
    sourceBundle.articles.length > 0
      ? sourceBundle.articles
      : sourceBundle.listing.map((item) => ({
          title: item.title,
          source: item.source,
          publishedAt: item.publishedAt,
          url: item.url,
          category: item.category,
          excerpt: buildListingSummary(item),
          body: buildListingSummary(item)
        }));
  const listing = sourceBundle.listing;

  return {
    topNews: articles.slice(0, 3).map((article) => ({
      title: article.title,
      summary: article.excerpt || article.body.slice(0, 140),
      source: article.source,
      publishedAt: article.publishedAt,
      url: article.url
    })),
    clubUpdates: articles
      .filter((article) => article.category === "official" || article.category === "matchday")
      .slice(0, 2)
      .map((article) => ({
        title: article.title,
        summary: article.excerpt || article.body.slice(0, 120),
        source: article.source,
        publishedAt: article.publishedAt
      })),
    playerWatch: [],
    injuryTransferWatch: articles
      .filter((article) => article.category === "transfers")
      .slice(0, 2)
      .map((article) => ({
        type: "transfer" as const,
        title: article.title,
        summary: article.excerpt || article.body.slice(0, 120),
        source: article.source,
        publishedAt: article.publishedAt
      })),
    matchStoryline: null,
    dailyChanges: listing.slice(0, 3).map((item) => ({
      label: item.title,
      detail: `${item.source} · ${item.publishedAt.slice(5, 16).replace("T", " ")}`
    }))
  };
}

function stripCodeFence(input: string) {
  return input.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/\s*```$/i, "").trim();
}

function createBriefingFallback() {
  return {
    ...EMPTY_HOME_EDITORIAL
  };
}

function withTimeout<T>(run: () => Promise<T>, timeoutMs: number, fallback: T): Promise<T> {
  return new Promise((resolve) => {
    const timeoutId = setTimeout(() => resolve(fallback), timeoutMs);

    run()
      .then((result) => {
        clearTimeout(timeoutId);
        resolve(result);
      })
      .catch(() => {
        clearTimeout(timeoutId);
        resolve(fallback);
      });
  });
}

async function buildListingBundle() {
  const listing = (await interOfficialProvider.listNews())
    .filter((item) => item.sourceType === "official")
    .slice(0, maxListingItems);

  return {
    generatedAt: new Date().toISOString(),
    listingUrl: `${env.interOfficialBaseUrl}/news`,
    listing: listing.map((item) => ({
      title: item.title,
      source: item.sourceName,
      publishedAt: item.publishedAt,
      url: item.canonicalUrl,
      category: item.category
    }))
  };
}

export async function buildSourceBundle() {
  const listingBundle = await buildListingBundle();

  const articleDetails = await withTimeout(
    async () =>
      Promise.all(
        listingBundle.listing.slice(0, maxArticleItems).map(async (item) => {
          const detail = await interOfficialProvider.getArticle(item.url);
          if (!detail) {
            return null;
          }

          return {
            title: detail.title,
            source: detail.sourceName,
            publishedAt: detail.publishedAt,
            url: detail.canonicalUrl,
            category: detail.category,
            excerpt: detail.excerpt,
            body: detail.body.slice(0, maxBodyChars)
          };
        })
      ),
    articleBundleTimeoutMs,
    []
  );

  return sourceBundleSchema.parse({
    ...listingBundle,
    articles: articleDetails.filter(Boolean)
  });
}

export async function generateDailyBriefing(): Promise<HomeEditorial> {
  const result = await getDailyBriefingData();
  return result.data;
}

export async function getDailyBriefingData(): Promise<ApiEnvelope<HomeEditorial>> {
  const result = await getCachedOrLoad(briefingCacheKey, briefingCacheTtlSeconds, async () => {
    const sourceBundle = await buildSourceBundle();
    const fallbackBriefing =
      sourceBundle.listing.length > 0 ? buildFallbackBriefingFromSources(sourceBundle) : createBriefingFallback();

    if (sourceBundle.articles.length === 0 || !env.deepseekApiKey) {
      return fallbackBriefing;
    }

    const response = await withTimeout(
      () =>
        deepseek.chat.completions.create({
          model: env.deepseekModel,
          response_format: { type: "json_object" },
          messages: [
            {
              role: "system",
              content: `You are a backend editorial agent for an Inter Milan fan app.
Return json only.
Never invent facts.
Use only provided source materials.
If evidence is weak or missing, use empty arrays or null.
All natural language output must be concise Simplified Chinese.`
            },
            {
              role: "user",
              content: `Generate the daily briefing as json.

Return exactly this shape:
{
  "topNews": [
    {
      "title": "",
      "summary": "",
      "source": "",
      "publishedAt": "",
      "url": ""
    }
  ],
  "clubUpdates": [
    {
      "title": "",
      "summary": "",
      "source": "",
      "publishedAt": ""
    }
  ],
  "playerWatch": [
    {
      "player": "",
      "update": "",
      "source": "",
      "publishedAt": ""
    }
  ],
  "injuryTransferWatch": [
    {
      "type": "injury|transfer",
      "title": "",
      "summary": "",
      "source": "",
      "publishedAt": ""
    }
  ],
  "matchStoryline": {
    "headline": "",
    "summary": "",
    "sources": []
  },
  "dailyChanges": [
    {
      "label": "",
      "detail": ""
    }
  ]
}

Rules:
- Never use outside knowledge.
- Never invent injuries, transfers, or player updates.
- topNews, clubUpdates, playerWatch, injuryTransferWatch, dailyChanges can be empty arrays.
- matchStoryline can be null.
- Prefer the most recent and best-supported Inter official items.

Source materials:
${JSON.stringify(sourceBundle)}`
            }
          ]
        }),
      deepseekBriefingTimeoutMs,
      null
    );

    if (!response) {
      return fallbackBriefing;
    }

    try {
      const raw = response.choices[0]?.message?.content ?? "{}";
      const parsed = homeEditorialSchema.parse(JSON.parse(stripCodeFence(raw)));
      return hasBriefingContent(parsed) ? parsed : fallbackBriefing;
    } catch {
      return fallbackBriefing;
    }
  });

  return {
    data: result.data,
    stale: result.stale,
    syncedAt: result.syncedAt,
    offlineReady: true
  };
}
