import { z } from "zod";

import env from "@/lib/config/env";
import { deepseek } from "@/lib/deepseek";
import { interOfficialProvider } from "@/lib/providers/official/inter-official";
import { homeEditorialSchema } from "@/lib/schemas";
import { getCachedOrLoad } from "@/lib/server/cache";
import { EMPTY_HOME_EDITORIAL, type HomeEditorial } from "@/lib/types";

const briefingCacheTtlSeconds = 7200;
const maxListingItems = 6;
const maxArticleItems = 4;
const maxBodyChars = 5000;
const briefingTimeoutMs = 15000;

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

export async function buildSourceBundle() {
  const listing = (await interOfficialProvider.listNews())
    .filter((item) => item.sourceType === "official")
    .slice(0, maxListingItems);

  const articleDetails = await Promise.all(
    listing.slice(0, maxArticleItems).map(async (item) => {
      const detail = await interOfficialProvider.getArticle(item.canonicalUrl);
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
  );

  return sourceBundleSchema.parse({
    generatedAt: new Date().toISOString(),
    listingUrl: `${env.interOfficialBaseUrl}/news`,
    listing: listing.map((item) => ({
      title: item.title,
      source: item.sourceName,
      publishedAt: item.publishedAt,
      url: item.canonicalUrl,
      category: item.category
    })),
    articles: articleDetails.filter(Boolean)
  });
}

export async function generateDailyBriefing(): Promise<HomeEditorial> {
  if (!env.deepseekApiKey) {
    return createBriefingFallback();
  }

  const result = await withTimeout(
    () =>
      getCachedOrLoad("briefing:daily", briefingCacheTtlSeconds, async () => {
        const sourceBundle = await buildSourceBundle();
        if (sourceBundle.articles.length === 0) {
          return createBriefingFallback();
        }

        const response = await deepseek.chat.completions.create({
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
        });

        const raw = response.choices[0]?.message?.content ?? "{}";
        return homeEditorialSchema.parse(JSON.parse(stripCodeFence(raw)));
      }),
    briefingTimeoutMs,
    {
      data: createBriefingFallback(),
      stale: true,
      syncedAt: new Date().toISOString()
    }
  );

  return result.data;
}

