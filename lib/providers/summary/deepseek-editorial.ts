import { load } from "cheerio";
import { z } from "zod";

import env from "@/lib/config/env";
import { interOfficialProvider } from "@/lib/providers/official/inter-official";
import type {
  EditorialSourceCatalogItem,
  FixtureEditorialInput,
  HomeEditorialInput,
  SummaryProvider
} from "@/lib/providers/summary/base";
import { EMPTY_HOME_EDITORIAL, type HomeEditorial } from "@/lib/types";

const trustedHosts = new Set(["www.inter.it", "inter.it"]);
const maxToolRounds = 3;
const maxBodyChars = 6000;
const maxHtmlChars = 40000;
const maxListingCards = 12;
const trustedFetchTimeoutMs = 8000;
const articleReadTimeoutMs = 9000;
const deepseekRequestTimeoutMs = 12000;

const fixtureStorylineSchema = z.object({
  summary: z.string().nullable(),
  storylines: z.array(z.string()),
  sourceUrls: z.array(z.string().url())
});

const homeEditorialResultSchema = z.object({
  topNews: z.array(
    z.object({
      title: z.string(),
      summary: z.string(),
      source: z.string(),
      publishedAt: z.string(),
      url: z.string().url()
    })
  ),
  clubUpdates: z.array(
    z.object({
      title: z.string(),
      summary: z.string(),
      source: z.string(),
      publishedAt: z.string()
    })
  ),
  playerWatch: z.array(
    z.object({
      player: z.string(),
      update: z.string(),
      source: z.string(),
      publishedAt: z.string()
    })
  ),
  injuryTransferWatch: z.array(
    z.object({
      type: z.enum(["injury", "transfer"]),
      title: z.string(),
      summary: z.string(),
      source: z.string(),
      publishedAt: z.string()
    })
  ),
  dailyChanges: z.array(
    z.object({
      label: z.string(),
      detail: z.string(),
    })
  ),
  matchStoryline: z
    .object({
      headline: z.string(),
      summary: z.string(),
      sources: z.array(z.string())
    })
    .nullable()
});

type ToolCall = {
  id: string;
  type: "function";
  function: {
    name: string;
    arguments: string;
  };
};

type ChatMessage = {
  role: "system" | "user" | "assistant" | "tool";
  content: string | null;
  tool_call_id?: string;
  tool_calls?: ToolCall[];
};

function trimText(input: string) {
  return input.trim().slice(0, maxBodyChars);
}

function isTrustedUrl(url: string) {
  try {
    const parsed = new URL(url);
    return trustedHosts.has(parsed.hostname);
  } catch {
    return false;
  }
}

function stripCodeFence(input: string) {
  return input.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/\s*```$/i, "").trim();
}

function extractNextData<T>(html: string) {
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

function normalizeUrlKey(url: string) {
  try {
    const parsed = new URL(url);
    return `${parsed.origin}${parsed.pathname}`.replace(/\/$/, "");
  } catch {
    return url.trim().replace(/\/$/, "");
  }
}

function normalizePublishedAt(value: unknown) {
  if (typeof value !== "string" || !value.trim()) {
    return null;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

function inferCategory(entry: {
  title?: string | null;
  subtitle?: string | null;
  metaDescription?: string | null;
  categoriesCollection?: {
    items?: Array<{
      slug?: string | null;
    } | null> | null;
  } | null;
}) {
  const slugs = (entry.categoriesCollection?.items ?? [])
    .map((item) => item?.slug?.toLowerCase().trim())
    .filter(Boolean) as string[];
  const haystack = [entry.title, entry.subtitle, entry.metaDescription, ...slugs].join(" ").toLowerCase();

  if (slugs.some((slug) => slug.includes("transfer")) || /\btransfer\b|\bmercato\b|\bcontract\b/.test(haystack)) {
    return "transfers";
  }

  if (
    slugs.some((slug) =>
      ["team", "tickets", "fixtures", "match-report", "inter-women", "inter-academy", "youth"].includes(slug)
    ) ||
    /\bvs\b|\bpreview\b|\bmatch\b|\bline-?ups?\b|\btraining\b|\bcalled up\b|\binternational duty\b|\bserie a\b|\bchampions league\b|\bcoppa\b/.test(
      haystack
    )
  ) {
    return "matchday";
  }

  return "official";
}

function serializeSourceCatalog(sourceCatalog: EditorialSourceCatalogItem[]) {
  return sourceCatalog.map((item) => ({
    id: item.id,
    title: item.title,
    canonicalUrl: item.canonicalUrl,
    publishedAt: item.publishedAt,
    sourceName: item.sourceName,
    category: item.category
  }));
}

function createTimeoutSignal(timeoutMs: number) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(new Error(`timeout_${timeoutMs}`)), timeoutMs);

  return {
    signal: controller.signal,
    clear: () => clearTimeout(timeoutId)
  };
}

function withTimeout<T>(run: () => Promise<T>, timeoutMs: number, fallback: T): Promise<T> {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => resolve(fallback), timeoutMs);

    run()
      .then((result) => {
        clearTimeout(timeoutId);
        resolve(result);
      })
      .catch((error) => {
        clearTimeout(timeoutId);
        reject(error);
      });
  });
}

async function fetchTrustedWebpage(url: string) {
  if (!isTrustedUrl(url)) {
    return {
      ok: false,
      url,
      error: "untrusted_url"
    };
  }

  const timeout = createTimeoutSignal(trustedFetchTimeoutMs);
  const response = await fetch(url, {
    next: { revalidate: 900 },
    signal: timeout.signal
  }).finally(() => timeout.clear());

  if (!response.ok) {
    return {
      ok: false,
      url,
      error: `request_failed_${response.status}`
    };
  }

  const html = await response.text();
  const $ = load(html);
  $("script, style, noscript").remove();

  const title = $("h1").first().text().trim() || $("title").first().text().trim() || "Untitled";
  const root = $("article").first().length ? $("article").first() : $("main").first().length ? $("main").first() : $("body");
  const text = root
    .find("h1, h2, h3, p, li")
    .map((_, element) => $(element).text().trim())
    .get()
    .filter(Boolean)
    .slice(0, 90)
    .join("\n");

  return {
    ok: true,
    url,
    title,
    text: trimText(text),
    html: html.slice(0, maxHtmlChars),
    truncated: html.length > maxHtmlChars
  };
}

function parseInterNewsPage(html: string, sourceCatalog: EditorialSourceCatalogItem[]) {
  const sourceIdByUrl = new Map(sourceCatalog.map((item) => [normalizeUrlKey(item.canonicalUrl), item.id]));
  const nextData = extractNextData<{
    props?: {
      pageProps?: {
        newsCarousel?: Array<{
          slug?: string | null;
          title?: string | null;
          subtitle?: string | null;
          metaDescription?: string | null;
          published?: boolean | null;
          pageType?: string | null;
          date?: string | null;
          sys?: { publishedAt?: string | null; firstPublishedAt?: string | null } | null;
          categoriesCollection?: {
            items?: Array<{ slug?: string | null } | null> | null;
          } | null;
        }>;
        moreNews?: Array<{
          slug?: string | null;
          title?: string | null;
          subtitle?: string | null;
          metaDescription?: string | null;
          published?: boolean | null;
          pageType?: string | null;
          date?: string | null;
          sys?: { publishedAt?: string | null; firstPublishedAt?: string | null } | null;
          categoriesCollection?: {
            items?: Array<{ slug?: string | null } | null> | null;
          } | null;
        }>;
        page?: {
          nowTrending?: {
            articlesCollection?: {
              items?: Array<{
                slug?: string | null;
                title?: string | null;
                subtitle?: string | null;
                metaDescription?: string | null;
                published?: boolean | null;
                pageType?: string | null;
                date?: string | null;
                sys?: { publishedAt?: string | null; firstPublishedAt?: string | null } | null;
                categoriesCollection?: {
                  items?: Array<{ slug?: string | null } | null> | null;
                } | null;
              } | null> | null;
            } | null;
          } | null;
        } | null;
      } | null;
    } | null;
  }>(html);

  const entries = [
    ...(nextData?.props?.pageProps?.newsCarousel ?? []),
    ...(nextData?.props?.pageProps?.moreNews ?? []),
    ...(nextData?.props?.pageProps?.page?.nowTrending?.articlesCollection?.items ?? [])
  ]
    .filter(Boolean)
    .filter((entry) => entry?.published !== false && entry?.pageType !== "landing-page");

  const seen = new Set<string>();
  const cards = entries
    .map((entry) => {
      const slug = entry?.slug?.trim();

      if (!slug || seen.has(slug)) {
        return null;
      }

      seen.add(slug);
      const canonicalUrl = `${env.interOfficialBaseUrl}/news/${slug}`;
      return {
        title: entry?.title?.trim() ?? "Inter 官方新闻",
        canonicalUrl,
        publishedAt: normalizePublishedAt(entry?.date ?? entry?.sys?.publishedAt ?? entry?.sys?.firstPublishedAt),
        category: inferCategory(entry ?? {}),
        matchedSourceId: sourceIdByUrl.get(normalizeUrlKey(canonicalUrl)) ?? null
      };
    })
    .filter(Boolean)
    .slice(0, maxListingCards);

  if (cards.length > 0) {
    return {
      ok: true,
      cards
    };
  }

  const $ = load(html);
  const fallbackCards = $("a[href*='/news/']")
    .map((_, element) => {
      const href = $(element).attr("href");
      const title = $(element).text().trim();

      if (!href || !title) {
        return null;
      }

      const canonicalUrl = href.startsWith("http") ? href : new URL(href, env.interOfficialBaseUrl).toString();
      return {
        title,
        canonicalUrl,
        publishedAt: null,
        category: "official",
        matchedSourceId: sourceIdByUrl.get(normalizeUrlKey(canonicalUrl)) ?? null
      };
    })
    .get()
    .filter(Boolean)
    .slice(0, maxListingCards);

  return {
    ok: true,
    cards: fallbackCards
  };
}

async function extractArticleText(url: string) {
  if (!isTrustedUrl(url)) {
    return {
      ok: false,
      url,
      error: "untrusted_url"
    };
  }

  const article = await withTimeout(() => interOfficialProvider.getArticle(url), articleReadTimeoutMs, null);
  if (!article) {
    return {
      ok: false,
      url,
      error: "article_not_found"
    };
  }

  return {
    ok: true,
    url: article.canonicalUrl,
    title: article.title,
    excerpt: article.excerpt,
    publishedAt: article.publishedAt,
    body: trimText(article.body)
  };
}

async function requestDeepSeek(messages: ChatMessage[], options?: { useBeta?: boolean; tools?: unknown[]; responseFormatJson?: boolean }) {
  const endpointBase = env.deepseekBaseUrl.replace(/\/$/, "");
  const endpoint = `${endpointBase}${options?.useBeta ? "/beta" : ""}/chat/completions`;
  const payload: Record<string, unknown> = {
    model: env.deepseekModel,
    temperature: 0.1,
    messages
  };

  if (options?.tools) {
    payload.tools = options.tools;
    payload.tool_choice = "auto";
  }

  if (options?.responseFormatJson) {
    payload.response_format = {
      type: "json_object"
    };
  }

  const timeout = createTimeoutSignal(deepseekRequestTimeoutMs);
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${env.deepseekApiKey}`
    },
    body: JSON.stringify(payload),
    cache: "no-store",
    signal: timeout.signal
  }).finally(() => timeout.clear());

  if (!response.ok) {
    throw new Error(`DeepSeek request failed: ${response.status}`);
  }

  return (await response.json()) as {
    choices?: Array<{
      message?: {
        role?: "assistant";
        content?: string | null;
        tool_calls?: ToolCall[];
      };
    }>;
  };
}

function buildToolDefinitions() {
  return [
    {
      type: "function",
      function: {
        name: "fetch_url",
        description: "Fetch raw HTML from a trusted URL",
        parameters: {
          type: "object",
          additionalProperties: false,
          properties: {
            url: {
              type: "string",
              description: "Full trusted Inter official URL to fetch."
            }
          },
          required: ["url"]
        }
      }
    },
    {
      type: "function",
      function: {
        name: "parse_inter_news_page",
        description: "Parse Inter news listing page into article cards",
        parameters: {
          type: "object",
          additionalProperties: false,
          properties: {
            html: {
              type: "string",
              description: "Raw HTML from the Inter news listing page."
            }
          },
          required: ["html"]
        }
      }
    },
    {
      type: "function",
      function: {
        name: "extract_article_text",
        description: "Extract clean article text and metadata from a news article URL",
        parameters: {
          type: "object",
          additionalProperties: false,
          properties: {
            url: {
              type: "string",
              description: "Full trusted Inter official article URL."
            }
          },
          required: ["url"]
        }
      }
    }
  ];
}

async function executeTool(toolCall: ToolCall, sourceCatalog: EditorialSourceCatalogItem[]) {
  const args = JSON.parse(toolCall.function.arguments || "{}") as Record<string, unknown>;

  if (toolCall.function.name === "fetch_url") {
    return fetchTrustedWebpage(typeof args.url === "string" ? args.url : "");
  }

  if (toolCall.function.name === "parse_inter_news_page") {
    return parseInterNewsPage(typeof args.html === "string" ? args.html : "", sourceCatalog);
  }

  if (toolCall.function.name === "extract_article_text") {
    return extractArticleText(typeof args.url === "string" ? args.url : "");
  }

  return {
    ok: false,
    error: "unknown_tool"
  };
}

async function runToolPhase(initialMessages: ChatMessage[], sourceCatalog: EditorialSourceCatalogItem[]) {
  const messages = [...initialMessages];

  for (let index = 0; index < maxToolRounds; index += 1) {
    const response = await requestDeepSeek(messages, {
      tools: buildToolDefinitions()
    });

    const message = response.choices?.[0]?.message;
    if (!message) {
      break;
    }

    if (!message.tool_calls?.length) {
      messages.push({
        role: "assistant",
        content: message.content ?? ""
      });
      break;
    }

    messages.push({
      role: "assistant",
      content: message.content ?? null,
      tool_calls: message.tool_calls
    });

    for (const toolCall of message.tool_calls) {
      const result = await executeTool(toolCall, sourceCatalog);
      messages.push({
        role: "tool",
        tool_call_id: toolCall.id,
        content: JSON.stringify(result)
      });
    }
  }

  return messages;
}

async function finalizeJson<T>(messages: ChatMessage[], schema: z.ZodSchema<T>, finalPrompt: string) {
  const response = await requestDeepSeek(
    [
      ...messages,
      {
        role: "user",
        content: finalPrompt
      }
    ],
    {
      responseFormatJson: true
    }
  );

  const content = response.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("DeepSeek returned empty content");
  }

  return schema.parse(JSON.parse(stripCodeFence(content)));
}

function buildHomeMessages(input: HomeEditorialInput): ChatMessage[] {
  const listingUrl = `${env.interOfficialBaseUrl}/news`;
  const deterministicContext = {
    listingUrl,
    nextFixture: input.nextFixture
      ? {
          id: input.nextFixture.id,
          round: input.nextFixture.round,
          stage: input.nextFixture.stage,
          kickoffAtUtc: input.nextFixture.kickoffAtUtc,
          venue: input.nextFixture.venue,
          homeTeam: input.nextFixture.homeTeam.shortName,
          awayTeam: input.nextFixture.awayTeam.shortName,
          status: input.nextFixture.status
        }
      : null,
    lastFixture: input.lastFixture
      ? {
          id: input.lastFixture.id,
          round: input.lastFixture.round,
          score: `${input.lastFixture.homeTeam.shortName} ${input.lastFixture.homeTeam.score ?? "-"}:${input.lastFixture.awayTeam.score ?? "-"} ${input.lastFixture.awayTeam.shortName}`,
          status: input.lastFixture.status
        }
      : null,
    standings: input.standings
      ? {
          competition: input.standings.competitionLabel,
          inter: {
            position: input.standings.inter.position,
            points: input.standings.inter.points,
            gapToLeader: input.standings.inter.gapToLeader
          },
          topRows: input.standings.rows.slice(0, 5).map((row) => ({
            position: row.position,
            teamName: row.teamName,
            points: row.points
          }))
        }
      : null,
    recentChanges: input.recentChanges.slice(0, 6).map((item) => ({
      type: item.type,
      title: item.title,
      detail: item.detail,
      occurredAt: item.occurredAt,
      severity: item.severity
    })),
    squadWatch: input.squad
      .filter((player) => player.status !== "可出场")
      .slice(0, 6)
      .map((player) => ({
        name: player.name,
        status: player.status,
        positionGroup: player.positionGroup
      })),
    topNews: input.topNews.slice(0, 6).map((item) => ({
      id: item.id,
      title: item.title,
      publishedAt: item.publishedAt,
      category: item.category,
      canonicalUrl: item.canonicalUrl
    })),
    sourceCatalog: serializeSourceCatalog(input.sourceCatalog)
  };

  return [
    {
      role: "system",
      content:
        "You are the Inter Daily editorial engine. Never use your own knowledge as a fact source. Only use the deterministic sports facts provided by the user and evidence returned by tools. Never fabricate club updates, player updates, injuries, transfers, or storylines. If evidence is weak or absent, return empty arrays or null. Use the tool flow fetch_url -> parse_inter_news_page -> extract_article_text whenever official news evidence is needed. All final text must be concise Simplified Chinese."
    },
    {
      role: "user",
      content: `Generate home editorial modules for Inter Daily.\nRules:\n- sports facts in the context are deterministic and may be referenced directly\n- when you need official news evidence, first call fetch_url with listingUrl, then parse_inter_news_page, then extract_article_text for selected article URLs\n- inspect at most 3 articles unless the evidence is still insufficient\n- if an item has no supporting evidence from provided context or tools, leave it out\n- matchStoryline must be null when there is no upcoming or live fixture or there is not enough evidence\n- topNews items must use the exact article title, url, source, and publishedAt from trusted evidence\n- clubUpdates must contain title, summary, source, publishedAt\n- playerWatch must contain player, update, source, publishedAt\n- injuryTransferWatch must contain type, title, summary, source, publishedAt\n- dailyChanges must contain label and detail only\n\nContext JSON:\n${JSON.stringify(deterministicContext, null, 2)}`
    }
  ];
}

function buildFixtureMessages(input: FixtureEditorialInput): ChatMessage[] {
  const listingUrl = `${env.interOfficialBaseUrl}/news`;
  const deterministicContext = {
    listingUrl,
    fixture: {
      id: input.fixture.id,
      round: input.fixture.round,
      stage: input.fixture.stage,
      kickoffAtUtc: input.fixture.kickoffAtUtc,
      venue: input.fixture.venue,
      homeTeam: input.fixture.homeTeam.shortName,
      awayTeam: input.fixture.awayTeam.shortName,
      status: input.fixture.status
    },
    standings: input.standings
      ? {
          competition: input.standings.competitionLabel,
          interPosition: input.standings.inter.position,
          interPoints: input.standings.inter.points,
          gapToLeader: input.standings.inter.gapToLeader
        }
      : null,
    recentChanges: input.recentChanges.slice(0, 6).map((item) => ({
      type: item.type,
      title: item.title,
      detail: item.detail,
      occurredAt: item.occurredAt
    })),
    sourceCatalog: serializeSourceCatalog(input.sourceCatalog)
  };

  return [
    {
      role: "system",
      content:
        "You are the Inter Daily match editorial engine. Never invent match facts, tactical details, injuries, or player updates. Use only the deterministic fixture context and evidence returned by tools. Use the tool flow fetch_url -> parse_inter_news_page -> extract_article_text whenever official news evidence is needed. If evidence is weak, return null summary and an empty storyline list."
    },
    {
      role: "user",
      content: `Create a pre-match storyline package for the selected fixture.\nRules:\n- when you need official news evidence, first call fetch_url with listingUrl, then parse_inter_news_page, then extract_article_text for selected article URLs\n- inspect at most 3 articles unless the evidence is still insufficient\n- do not describe unverified lineups or injuries\n- if there is not enough evidence, return null summary and [] storylines\n- final text must be concise Simplified Chinese\n\nContext JSON:\n${JSON.stringify(deterministicContext, null, 2)}`
    }
  ];
}

export class DeepSeekEditorialProvider implements SummaryProvider {
  readonly name = "DeepSeek Editorial";

  async generateHomeEditorial(input: HomeEditorialInput): Promise<HomeEditorial> {
    if (!env.deepseekApiKey || input.sourceCatalog.length === 0) {
      return EMPTY_HOME_EDITORIAL;
    }

    try {
      const messages = await runToolPhase(buildHomeMessages(input), input.sourceCatalog);
      return await finalizeJson(
        messages,
        homeEditorialResultSchema,
        "Return JSON only with keys: topNews, clubUpdates, playerWatch, injuryTransferWatch, matchStoryline, dailyChanges. If evidence is weak or missing, use [] or null. Do not add extra keys. No markdown."
      );
    } catch {
      return EMPTY_HOME_EDITORIAL;
    }
  }

  async generateFixtureStoryline(input: FixtureEditorialInput) {
    if (!env.deepseekApiKey || input.sourceCatalog.length === 0) {
      return {
        summary: null,
        storylines: [],
        sourceUrls: []
      };
    }

    try {
      const messages = await runToolPhase(buildFixtureMessages(input), input.sourceCatalog);
      return await finalizeJson(
        messages,
        fixtureStorylineSchema,
        "Return JSON only with keys: summary, storylines, sourceUrls. If evidence is weak or missing, return {\"summary\":null,\"storylines\":[],\"sourceUrls\":[]}. No markdown."
      );
    } catch {
      return {
        summary: null,
        storylines: [],
        sourceUrls: []
      };
    }
  }
}

export const deepseekEditorialProvider = new DeepSeekEditorialProvider();
