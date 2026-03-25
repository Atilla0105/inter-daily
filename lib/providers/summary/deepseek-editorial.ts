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
const maxToolRounds = 4;
const maxBodyChars = 6000;

const fixtureStorylineSchema = z.object({
  summary: z.string().nullable(),
  storylines: z.array(z.string()),
  sourceUrls: z.array(z.string().url())
});

const homeEditorialResultSchema = z.object({
  topNewsSummaries: z.array(
    z.object({
      newsId: z.string(),
      summary: z.string(),
      sourceUrls: z.array(z.string().url())
    })
  ),
  clubUpdates: z.array(
    z.object({
      title: z.string(),
      detail: z.string(),
      sourceUrls: z.array(z.string().url()),
      sourceTitles: z.array(z.string()),
      severity: z.enum(["low", "medium", "high"]),
      type: z.enum(["fixture-time", "injury", "suspension", "ranking", "lineup", "result", "news", "transfer", "club", "player"]).optional()
    })
  ),
  playerUpdates: z.array(
    z.object({
      title: z.string(),
      detail: z.string(),
      sourceUrls: z.array(z.string().url()),
      sourceTitles: z.array(z.string()),
      severity: z.enum(["low", "medium", "high"]),
      type: z.enum(["fixture-time", "injury", "suspension", "ranking", "lineup", "result", "news", "transfer", "club", "player"]).optional()
    })
  ),
  injuryTransferWatch: z.array(
    z.object({
      title: z.string(),
      detail: z.string(),
      sourceUrls: z.array(z.string().url()),
      sourceTitles: z.array(z.string()),
      severity: z.enum(["low", "medium", "high"]),
      type: z.enum(["injury", "suspension", "transfer"]).optional()
    })
  ),
  dailyChangeDigest: z.array(
    z.object({
      title: z.string(),
      detail: z.string(),
      sourceUrls: z.array(z.string().url()),
      sourceTitles: z.array(z.string()),
      severity: z.enum(["low", "medium", "high"]),
      type: z.enum(["fixture-time", "injury", "suspension", "ranking", "lineup", "result", "news", "transfer"]).optional()
    })
  ),
  preMatchStoryline: z
    .object({
      summary: z.string().nullable(),
      bullets: z.array(z.string()),
      sourceUrls: z.array(z.string().url())
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

async function fetchTrustedWebpage(url: string) {
  if (!isTrustedUrl(url)) {
    return {
      ok: false,
      url,
      error: "untrusted_url"
    };
  }

  const response = await fetch(url, {
    next: { revalidate: 900 }
  });

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
    text: trimText(text)
  };
}

async function readOfficialInterArticle(url: string) {
  if (!isTrustedUrl(url)) {
    return {
      ok: false,
      url,
      error: "untrusted_url"
    };
  }

  const article = await interOfficialProvider.getArticle(url);
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

async function readSelectedSourceContent(sourceIds: string[], sourceCatalog: EditorialSourceCatalogItem[]) {
  const targets = sourceCatalog.filter((item) => sourceIds.includes(item.id)).slice(0, 5);
  const articles = await Promise.all(
    targets.map(async (item) => {
      const article = await interOfficialProvider.getArticle(item.canonicalUrl);
      if (!article) {
        return null;
      }

      return {
        id: item.id,
        title: article.title,
        canonicalUrl: article.canonicalUrl,
        publishedAt: article.publishedAt,
        body: trimText(article.body)
      };
    })
  );

  return {
    ok: true,
    items: articles.filter(Boolean)
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

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${env.deepseekApiKey}`
    },
    body: JSON.stringify(payload),
    cache: "no-store"
  });

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
        name: "fetch_trusted_webpage",
        description: "Fetch a trusted Inter official webpage and return cleaned text content.",
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
        name: "read_official_inter_article",
        description: "Parse an official Inter news article and return title, excerpt, publishedAt and body.",
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
    },
    {
      type: "function",
      function: {
        name: "read_selected_source_content",
        description: "Read article bodies for specific source ids from the provided source catalog.",
        parameters: {
          type: "object",
          additionalProperties: false,
          properties: {
            sourceIds: {
              type: "array",
              items: { type: "string" },
              description: "Source ids from the source catalog."
            }
          },
          required: ["sourceIds"]
        }
      }
    }
  ];
}

async function executeTool(toolCall: ToolCall, sourceCatalog: EditorialSourceCatalogItem[]) {
  const args = JSON.parse(toolCall.function.arguments || "{}") as Record<string, unknown>;

  if (toolCall.function.name === "fetch_trusted_webpage") {
    return fetchTrustedWebpage(typeof args.url === "string" ? args.url : "");
  }

  if (toolCall.function.name === "read_official_inter_article") {
    return readOfficialInterArticle(typeof args.url === "string" ? args.url : "");
  }

  if (toolCall.function.name === "read_selected_source_content") {
    return readSelectedSourceContent(Array.isArray(args.sourceIds) ? args.sourceIds.filter((item): item is string => typeof item === "string") : [], sourceCatalog);
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
      useBeta: true,
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
  const deterministicContext = {
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
        "You are the Inter Daily editorial engine. Never use your own knowledge as a fact source. Only use the deterministic sports facts provided by the user and evidence returned by tools. Never fabricate club updates, player updates, injuries, transfers, or storylines. If evidence is weak or absent, return empty arrays or null. All final text must be concise Simplified Chinese."
    },
    {
      role: "user",
      content: `Generate home editorial modules for Inter Daily.\nRules:\n- sports facts in the context are deterministic and may be referenced directly\n- for news, club/player updates, transfer watch, and storylines, inspect source catalog items with tools before deciding\n- if an item has no supporting evidence from provided context or tools, leave it out\n- preMatchStoryline must be null when there is no upcoming or live fixture\n- use only source ids from sourceCatalog for topNewsSummaries\n\nContext JSON:\n${JSON.stringify(deterministicContext, null, 2)}`
    }
  ];
}

function buildFixtureMessages(input: FixtureEditorialInput): ChatMessage[] {
  const deterministicContext = {
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
        "You are the Inter Daily match editorial engine. Never invent match facts, tactical details, injuries, or player updates. Use only the deterministic fixture context and evidence returned by tools. If evidence is weak, return null summary and an empty storyline list."
    },
    {
      role: "user",
      content: `Create a pre-match storyline package for the selected fixture.\nRules:\n- inspect official sources with tools before deciding\n- do not describe unverified lineups or injuries\n- if there is not enough evidence, return null summary and [] storylines\n- final text must be concise Simplified Chinese\n\nContext JSON:\n${JSON.stringify(deterministicContext, null, 2)}`
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
        "Return JSON only with keys: topNewsSummaries, clubUpdates, playerUpdates, injuryTransferWatch, dailyChangeDigest, preMatchStoryline. If evidence is weak or missing, use [] or null. No markdown."
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
