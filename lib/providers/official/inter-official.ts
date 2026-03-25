import { load } from "cheerio";

import env from "@/lib/config/env";
import { memorySeed, newsDetailsSeed, squadSeed, topNewsSeed } from "@/lib/data/mock";
import type { MemoryEntry, NewsDetail, NewsItem, SquadPlayer } from "@/lib/types";

import type { OfficialNewsProvider } from "./base";

type InterAsset = {
  src?: string | null;
  description?: string | null;
  thumbnails?: {
    mini?: string | null;
    thul?: string | null;
    webimage?: string | null;
  } | null;
};

type InterCategoryReference = {
  title?: string | null;
  slug?: string | null;
};

type InterRichTextNode = {
  nodeType?: string;
  value?: string | null;
  content?: InterRichTextNode[];
};

type InterTextComponent = {
  __typename?: string;
  text?: {
    json?: InterRichTextNode;
  } | null;
};

type InterNewsEntry = {
  __typename?: string;
  date?: string | null;
  published?: boolean | null;
  title?: string | null;
  subtitle?: string | null;
  slug?: string | null;
  pageType?: string | null;
  metaDescription?: string | null;
  headerImage?: InterAsset[] | null;
  categoriesCollection?: {
    items?: InterCategoryReference[] | null;
  } | null;
  sys?: {
    publishedAt?: string | null;
    firstPublishedAt?: string | null;
  } | null;
};

type InterNewsIndexProps = {
  newsCarousel?: InterNewsEntry[];
  moreNews?: InterNewsEntry[];
  page?: {
    nowTrending?: {
      articlesCollection?: {
        items?: InterNewsEntry[] | null;
      } | null;
    } | null;
  } | null;
};

type InterNewsArticleProps = {
  page?: InterNewsEntry;
  components?: InterTextComponent[] | null;
  relatedNews?: InterNewsEntry[] | null;
};

const officialFetchTimeoutMs = 8000;

async function fetchHtml(url: string) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(new Error(`timeout_${officialFetchTimeoutMs}`)), officialFetchTimeoutMs);
  const response = await fetch(url, {
    next: { revalidate: 900 },
    signal: controller.signal
  }).finally(() => clearTimeout(timeoutId));

  if (!response.ok) {
    throw new Error(`Official source request failed: ${response.status}`);
  }

  return response.text();
}

function extractNextData<T>(html: string): T | null {
  const marker = '<script id="__NEXT_DATA__" type="application/json">';
  const start = html.indexOf(marker);

  if (start === -1) {
    return null;
  }

  const after = html.slice(start + marker.length);
  const end = after.indexOf("</script>");

  if (end === -1) {
    return null;
  }

  try {
    return JSON.parse(after.slice(0, end)) as T;
  } catch {
    return null;
  }
}

function dedupeEntries(items: InterNewsEntry[]) {
  const unique = new Map<string, InterNewsEntry>();

  for (const item of items) {
    const slug = item.slug?.trim();

    if (!slug || item.published !== true || item.pageType !== "article" || unique.has(slug)) {
      continue;
    }

    unique.set(slug, item);
  }

  return [...unique.values()];
}

function pickImageUrl(images?: InterAsset[] | null) {
  const image = images?.[0];

  return image?.thumbnails?.webimage ?? image?.src ?? image?.thumbnails?.thul ?? image?.thumbnails?.mini ?? null;
}

function normalizePublishedAt(item: InterNewsEntry) {
  const rawDate = item.date ?? item.sys?.publishedAt ?? item.sys?.firstPublishedAt ?? new Date().toISOString();
  const parsed = new Date(rawDate);

  return Number.isNaN(parsed.getTime()) ? new Date().toISOString() : parsed.toISOString();
}

function deriveCategory(item: InterNewsEntry): NewsItem["category"] {
  const slugs = (item.categoriesCollection?.items ?? [])
    .map((category) => category.slug?.toLowerCase().trim())
    .filter(Boolean) as string[];
  const haystack = [item.title, item.subtitle, item.metaDescription, ...slugs].join(" ").toLowerCase();

  if (
    slugs.some((slug) => slug.includes("transfer")) ||
    /\btransfer\b|\bsigning\b|\bloan\b|\bcontract\b|\bmercato\b/.test(haystack)
  ) {
    return "transfers";
  }

  if (
    slugs.some((slug) =>
      ["team", "tickets", "fixtures", "match-report", "inter-women", "inter-academy", "youth"].includes(slug)
    ) ||
    /\bvs\b|\bpreview\b|\bguide\b|\bmatch\b|\bline-?ups?\b|\btraining\b|\bcalled up\b|\binternational duty\b|\bserie a\b|\bchampions league\b|\bcoppa\b/.test(
      haystack
    )
  ) {
    return "matchday";
  }

  return "official";
}

function buildExcerpt(item: InterNewsEntry) {
  const subtitle = item.subtitle?.trim();
  const metaDescription = item.metaDescription?.trim();

  if (subtitle) {
    return subtitle;
  }

  if (metaDescription) {
    return metaDescription;
  }

  const categoryNames = (item.categoriesCollection?.items ?? [])
    .map((category) => category.title?.trim())
    .filter(Boolean);

  if (categoryNames.length > 0) {
    return `${categoryNames.join(" / ")}更新，查看 Inter 官方最新发布。`;
  }

  return "Inter 官方站点最新发布。";
}

function toNewsItem(item: InterNewsEntry, index: number): NewsItem | null {
  const slug = item.slug?.trim();

  if (!slug) {
    return null;
  }

  const category = deriveCategory(item);
  const categoryTitles = (item.categoriesCollection?.items ?? [])
    .map((categoryItem) => categoryItem.title?.trim())
    .filter(Boolean) as string[];

  return {
    id: slug,
    title: item.title?.trim() ?? "Inter 官方新闻",
    excerpt: buildExcerpt(item),
    sourceName: "Inter.it",
    sourceType: "official",
    sourceUrl: `${env.interOfficialBaseUrl}/news`,
    canonicalUrl: `${env.interOfficialBaseUrl}/news/${slug}`,
    publishedAt: normalizePublishedAt(item),
    coverImageUrl: pickImageUrl(item.headerImage),
    category,
    tags: Array.from(new Set(["官方", ...categoryTitles])).slice(0, 3),
    priorityScore: Math.max(40, 100 - index)
  };
}

function extractText(node?: InterRichTextNode | null): string {
  if (!node) {
    return "";
  }

  if (node.nodeType === "text") {
    return node.value ?? "";
  }

  return (node.content ?? []).map((child) => extractText(child)).join("");
}

function extractParagraphs(node?: InterRichTextNode | null): string[] {
  if (!node) {
    return [];
  }

  if (node.nodeType === "paragraph" || node.nodeType === "heading-1" || node.nodeType === "heading-2" || node.nodeType === "heading-3") {
    const text = extractText(node).trim();
    return text ? [text] : [];
  }

  return (node.content ?? []).flatMap((child) => extractParagraphs(child));
}

function buildArticleBody(components?: InterTextComponent[] | null) {
  const paragraphs = (components ?? [])
    .filter((component) => component.__typename === "TextComponent")
    .flatMap((component) => extractParagraphs(component.text?.json))
    .filter(Boolean);

  return paragraphs.join("\n\n");
}

export class InterOfficialProvider implements OfficialNewsProvider {
  readonly name = "Inter.it";

  async listNews(): Promise<NewsItem[]> {
    try {
      const html = await fetchHtml(`${env.interOfficialBaseUrl}/news`);
      const nextData = extractNextData<{ props?: { pageProps?: InterNewsIndexProps } }>(html);
      const pageProps = nextData?.props?.pageProps;

      if (!pageProps) {
        return topNewsSeed.filter((item) => item.sourceType === "official");
      }

      const entries = dedupeEntries([
        ...(pageProps.newsCarousel ?? []),
        ...(pageProps.moreNews ?? []),
        ...(pageProps.page?.nowTrending?.articlesCollection?.items ?? [])
      ]);
      const items = entries.map((entry, index) => toNewsItem(entry, index)).filter(Boolean) as NewsItem[];

      return items.length > 0 ? items : topNewsSeed.filter((item) => item.sourceType === "official");
    } catch (error) {
      return topNewsSeed.filter((item) => item.sourceType === "official");
    }
  }

  async getArticle(url: string): Promise<NewsDetail | null> {
    const seed = Object.values(newsDetailsSeed).find((item) => item.canonicalUrl === url);
    try {
      const html = await fetchHtml(url);
      const nextData = extractNextData<{ props?: { pageProps?: InterNewsArticleProps } }>(html);
      const pageProps = nextData?.props?.pageProps;
      const article = pageProps?.page;
      const fallbackList = await this.listNews();

      if (article?.slug) {
        const baseItem =
          toNewsItem(article, 0) ??
          seed ?? {
            ...topNewsSeed[0],
            id: article.slug,
            canonicalUrl: url,
            title: article.title?.trim() ?? "官方新闻"
          };
        const body = buildArticleBody(pageProps?.components);

        return {
          ...baseItem,
          canonicalUrl: url,
          title: article.title?.trim() ?? baseItem.title,
          excerpt: article.subtitle?.trim() || baseItem.excerpt,
          body: body || baseItem.excerpt || seed?.body || "暂无可提取的正文，保留原文跳转。",
          related: fallbackList.filter((item) => item.id !== baseItem.id).slice(0, 2)
        };
      }

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
