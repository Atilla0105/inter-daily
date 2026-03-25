import { load } from "cheerio";

import env from "@/lib/config/env";
import { memorySeed, newsDetailsSeed, squadSeed, topNewsSeed } from "@/lib/data/mock";
import type { MemoryEntry, NewsDetail, NewsItem, SquadPlayer } from "@/lib/types";

import type { OfficialNewsProvider } from "./base";

async function fetchHtml(url: string) {
  const response = await fetch(url, {
    next: { revalidate: 900 }
  });

  if (!response.ok) {
    throw new Error(`Official source request failed: ${response.status}`);
  }

  return response.text();
}

export class InterOfficialProvider implements OfficialNewsProvider {
  readonly name = "Inter.it";

  async listNews(): Promise<NewsItem[]> {
    try {
      const html = await fetchHtml(`${env.interOfficialBaseUrl}/news`);
      const $ = load(html);
      const cards = $("a[href*='/news/']").slice(0, 6);

      if (cards.length === 0) {
        return topNewsSeed;
      }

      return cards
        .map((index, element) => {
          const node = $(element);
          const href = node.attr("href");
          const title =
            node.find("h2, h3, [class*='title']").first().text().trim() ||
            node.find("img").attr("alt") ||
            `官方新闻 ${index + 1}`;

          if (!href) {
            return null;
          }

          return {
            id: `official-${index}`,
            title,
            excerpt:
              node.find("p, [class*='subtitle'], [class*='description']").first().text().trim() ||
              "Inter 官方站点同步内容。",
            sourceName: "Inter.it",
            sourceType: "official" as const,
            sourceUrl: `${env.interOfficialBaseUrl}/news`,
            canonicalUrl: href.startsWith("http") ? href : `${env.interOfficialBaseUrl}${href}`,
            publishedAt: new Date().toISOString(),
            coverImageUrl: node.find("img").attr("src") ?? null,
            category: "official" as const,
            tags: ["官方"],
            priorityScore: 80 - index
          };
        })
        .get()
        .filter(Boolean) as NewsItem[];
    } catch (error) {
      return topNewsSeed.filter((item) => item.sourceType === "official");
    }
  }

  async getArticle(url: string): Promise<NewsDetail | null> {
    const seed = Object.values(newsDetailsSeed).find((item) => item.canonicalUrl === url);
    try {
      const html = await fetchHtml(url);
      const $ = load(html);
      const title = $("h1").first().text().trim() || seed?.title || "官方新闻";
      const paragraphs = $("article p")
        .slice(0, 5)
        .map((_, element) => $(element).text().trim())
        .get()
        .filter(Boolean);

      return {
        ...(seed ?? topNewsSeed[0]),
        canonicalUrl: url,
        title,
        body: paragraphs.join("\n\n") || seed?.body || "暂无可提取的正文，保留原文跳转。",
        related: topNewsSeed.slice(0, 2)
      };
    } catch (error) {
      return seed ?? null;
    }
  }

  async listHallOfFame(): Promise<MemoryEntry[]> {
    return [memorySeed];
  }

  async getSquadPage(): Promise<SquadPlayer[]> {
    return squadSeed;
  }
}

export const interOfficialProvider = new InterOfficialProvider();
