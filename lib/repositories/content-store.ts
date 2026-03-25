import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/server/prisma";
import type { ChangeAlert, FixtureCard, NewsItem, SquadPlayer, StandingSummary } from "@/lib/types";
import { competitionLabel, countdownLabel, formatKickoff, formatTimeZoneLabel, statusLabel, statusTone } from "@/lib/utils/time";

type StoredChangeInput = {
  entityType: string;
  entityId: string;
  changeType: string;
  oldValueJson?: unknown;
  newValueJson?: unknown;
  sourceName: string;
};

function readStoredTeamMeta(sourceMetaJson: Prisma.JsonValue | null | undefined, key: "homeTeam" | "awayTeam") {
  if (typeof sourceMetaJson !== "object" || sourceMetaJson === null || Array.isArray(sourceMetaJson)) {
    return null;
  }

  const meta = sourceMetaJson as Prisma.JsonObject;
  if (!(key in meta)) {
    return null;
  }

  const value = meta[key];
  return typeof value === "object" && value !== null ? (value as Record<string, unknown>) : null;
}

export async function listStoredFixtures(timeZone: string): Promise<FixtureCard[]> {
  if (!prisma) {
    return [];
  }

  const rows = await prisma.fixture.findMany({
    orderBy: {
      kickoffAtUtc: "asc"
    }
  });

  return rows.map((row) => {
    const homeTeamMeta = readStoredTeamMeta(row.sourceMetaJson, "homeTeam");
    const awayTeamMeta = readStoredTeamMeta(row.sourceMetaJson, "awayTeam");

    return {
      id: row.providerFixtureId,
      competition: (row.competitionKey as FixtureCard["competition"]) ?? "serie-a",
      competitionLabel: row.competitionName || competitionLabel(row.competitionKey as FixtureCard["competition"]),
      round: row.round ?? "待确认轮次",
      venue: row.venueName ?? "待确认球场",
      stage: row.stage ?? "比赛",
      kickoffAtUtc: row.kickoffAtUtc.toISOString(),
      kickoffDisplay: formatKickoff(row.kickoffAtUtc.toISOString(), timeZone),
      localTimeLabel: formatTimeZoneLabel(row.kickoffAtUtc.toISOString(), timeZone),
      isHome: row.homeTeamName.includes("Inter"),
      status: row.status as FixtureCard["status"],
      statusLabel: statusLabel(row.status as FixtureCard["status"]),
      statusTone: statusTone(row.status as FixtureCard["status"]),
      homeTeam: {
        id: typeof homeTeamMeta?.id === "string" ? homeTeamMeta.id : `${row.providerFixtureId}-home`,
        name: row.homeTeamName,
        shortName: row.homeTeamShortName,
        crestUrl: typeof homeTeamMeta?.crestUrl === "string" ? homeTeamMeta.crestUrl : null,
        score: row.scoreHome
      },
      awayTeam: {
        id: typeof awayTeamMeta?.id === "string" ? awayTeamMeta.id : `${row.providerFixtureId}-away`,
        name: row.awayTeamName,
        shortName: row.awayTeamShortName,
        crestUrl: typeof awayTeamMeta?.crestUrl === "string" ? awayTeamMeta.crestUrl : null,
        score: row.scoreAway
      },
      countdownLabel:
        row.status === "SCHEDULED"
          ? countdownLabel(row.kickoffAtUtc.toISOString())
          : row.isLive
            ? "实时同步中"
            : null,
      keyStory:
        typeof row.sourceMetaJson === "object" &&
        row.sourceMetaJson !== null &&
        "keyStory" in row.sourceMetaJson &&
        typeof row.sourceMetaJson.keyStory === "string"
          ? row.sourceMetaJson.keyStory
          : null,
      hasReminder: false,
      stale: false
    };
  });
}

export async function getStoredFixture(providerFixtureId: string, timeZone: string): Promise<FixtureCard | null> {
  if (!prisma) {
    return null;
  }

  const row = await prisma.fixture.findUnique({
    where: {
      providerFixtureId
    }
  });

  if (!row) {
    return null;
  }

  const homeTeamMeta = readStoredTeamMeta(row.sourceMetaJson, "homeTeam");
  const awayTeamMeta = readStoredTeamMeta(row.sourceMetaJson, "awayTeam");

  return {
    id: row.providerFixtureId,
    competition: (row.competitionKey as FixtureCard["competition"]) ?? "serie-a",
    competitionLabel: row.competitionName || competitionLabel(row.competitionKey as FixtureCard["competition"]),
    round: row.round ?? "待确认轮次",
    venue: row.venueName ?? "待确认球场",
    stage: row.stage ?? "比赛",
    kickoffAtUtc: row.kickoffAtUtc.toISOString(),
    kickoffDisplay: formatKickoff(row.kickoffAtUtc.toISOString(), timeZone),
    localTimeLabel: formatTimeZoneLabel(row.kickoffAtUtc.toISOString(), timeZone),
    isHome: row.homeTeamName.includes("Inter"),
    status: row.status as FixtureCard["status"],
    statusLabel: statusLabel(row.status as FixtureCard["status"]),
    statusTone: statusTone(row.status as FixtureCard["status"]),
    homeTeam: {
      id: typeof homeTeamMeta?.id === "string" ? homeTeamMeta.id : `${row.providerFixtureId}-home`,
      name: row.homeTeamName,
      shortName: row.homeTeamShortName,
      crestUrl: typeof homeTeamMeta?.crestUrl === "string" ? homeTeamMeta.crestUrl : null,
      score: row.scoreHome
    },
    awayTeam: {
      id: typeof awayTeamMeta?.id === "string" ? awayTeamMeta.id : `${row.providerFixtureId}-away`,
      name: row.awayTeamName,
      shortName: row.awayTeamShortName,
      crestUrl: typeof awayTeamMeta?.crestUrl === "string" ? awayTeamMeta.crestUrl : null,
      score: row.scoreAway
    },
    countdownLabel:
      row.status === "SCHEDULED"
        ? countdownLabel(row.kickoffAtUtc.toISOString())
        : row.isLive
          ? "实时同步中"
          : null,
    keyStory:
      typeof row.sourceMetaJson === "object" &&
      row.sourceMetaJson !== null &&
      "keyStory" in row.sourceMetaJson &&
      typeof row.sourceMetaJson.keyStory === "string"
        ? row.sourceMetaJson.keyStory
        : null,
    hasReminder: false,
    stale: false
  };
}

export async function upsertFixtures(input: FixtureCard[], sourceName: string) {
  if (!prisma) {
    return;
  }

  for (const fixture of input) {
    await prisma.fixture.upsert({
      where: {
        providerFixtureId: fixture.id
      },
      update: {
        provider: sourceName,
        competitionName: fixture.competitionLabel,
        competitionKey: fixture.competition,
        season: "current",
        stage: fixture.stage,
        round: fixture.round,
        venueName: fixture.venue,
        homeTeamName: fixture.homeTeam.name,
        awayTeamName: fixture.awayTeam.name,
        homeTeamShortName: fixture.homeTeam.shortName,
        awayTeamShortName: fixture.awayTeam.shortName,
        kickoffAtUtc: new Date(fixture.kickoffAtUtc),
        status: fixture.status,
        scoreHome: fixture.homeTeam.score ?? null,
        scoreAway: fixture.awayTeam.score ?? null,
        isLive: fixture.status === "LIVE",
        lastSyncedAt: new Date(),
        sourceMetaJson: {
          keyStory: fixture.keyStory,
          homeTeam: {
            id: fixture.homeTeam.id,
            crestUrl: fixture.homeTeam.crestUrl ?? null
          },
          awayTeam: {
            id: fixture.awayTeam.id,
            crestUrl: fixture.awayTeam.crestUrl ?? null
          }
        }
      },
      create: {
        provider: sourceName,
        providerFixtureId: fixture.id,
        competitionName: fixture.competitionLabel,
        competitionKey: fixture.competition,
        season: "current",
        stage: fixture.stage,
        round: fixture.round,
        venueName: fixture.venue,
        homeTeamName: fixture.homeTeam.name,
        awayTeamName: fixture.awayTeam.name,
        homeTeamShortName: fixture.homeTeam.shortName,
        awayTeamShortName: fixture.awayTeam.shortName,
        kickoffAtUtc: new Date(fixture.kickoffAtUtc),
        status: fixture.status,
        scoreHome: fixture.homeTeam.score ?? null,
        scoreAway: fixture.awayTeam.score ?? null,
        isLive: fixture.status === "LIVE",
        lastSyncedAt: new Date(),
        sourceMetaJson: {
          keyStory: fixture.keyStory,
          homeTeam: {
            id: fixture.homeTeam.id,
            crestUrl: fixture.homeTeam.crestUrl ?? null
          },
          awayTeam: {
            id: fixture.awayTeam.id,
            crestUrl: fixture.awayTeam.crestUrl ?? null
          }
        }
      }
    });
  }
}

export async function getLatestStandings(): Promise<StandingSummary | null> {
  if (!prisma) {
    return null;
  }

  const row = await prisma.standingsSnapshot.findFirst({
    orderBy: {
      snapshotAt: "desc"
    }
  });

  if (!row) {
    return null;
  }

  return row.tableJson as unknown as StandingSummary;
}

export async function saveStandings(summary: StandingSummary, sourceName: string) {
  if (!prisma) {
    return;
  }

  await prisma.standingsSnapshot.create({
    data: {
      competitionName: summary.competitionLabel,
      competitionKey: summary.competition,
      season: summary.season,
      tableJson: summary,
      provider: sourceName
    }
  });
}

export async function listStoredPlayers(): Promise<SquadPlayer[]> {
  if (!prisma) {
    return [];
  }

  const rows = await prisma.player.findMany({
    orderBy: [{ position: "asc" }, { shirtNumber: "asc" }]
  });

  return rows.map((row) => {
    const meta =
      typeof row.metaJson === "object" && row.metaJson !== null ? (row.metaJson as Record<string, unknown>) : {};

    return {
      id: row.providerPlayerId,
      name: row.name,
      shirtNumber: row.shirtNumber ?? 0,
      positionGroup: (meta.positionGroup as SquadPlayer["positionGroup"]) ?? "中场",
      nationality: row.nationality ?? "未知",
      birthDate: typeof meta.birthDate === "string" ? meta.birthDate : null,
      heightCm: typeof meta.heightCm === "number" ? meta.heightCm : null,
      photoUrl: row.photoUrl,
      status: row.status as SquadPlayer["status"]
    };
  });
}

export async function upsertPlayers(players: SquadPlayer[], sourceName: string) {
  if (!prisma) {
    return;
  }

  for (const player of players) {
    await prisma.player.upsert({
      where: {
        providerPlayerId: player.id
      },
      update: {
        provider: sourceName,
        teamName: "Inter Milan",
        name: player.name,
        shirtNumber: player.shirtNumber,
        position: player.positionGroup,
        nationality: player.nationality,
        photoUrl: player.photoUrl ?? null,
        status: player.status,
        metaJson: {
          positionGroup: player.positionGroup,
          birthDate: player.birthDate,
          heightCm: player.heightCm
        },
        lastSyncedAt: new Date()
      },
      create: {
        provider: sourceName,
        providerPlayerId: player.id,
        teamName: "Inter Milan",
        name: player.name,
        shirtNumber: player.shirtNumber,
        position: player.positionGroup,
        nationality: player.nationality,
        photoUrl: player.photoUrl ?? null,
        status: player.status,
        metaJson: {
          positionGroup: player.positionGroup,
          birthDate: player.birthDate,
          heightCm: player.heightCm
        },
        lastSyncedAt: new Date()
      }
    });
  }
}

export async function listStoredNews(): Promise<NewsItem[]> {
  if (!prisma) {
    return [];
  }

  const rows = await prisma.newsArticle.findMany({
    orderBy: {
      publishedAt: "desc"
    },
    take: 30
  });

  return rows.map((row) => ({
    id: row.slug,
    title: row.title,
    excerpt: row.excerpt ?? "",
    sourceName: row.sourceName,
    sourceType: row.sourceType as NewsItem["sourceType"],
    sourceUrl: row.sourceUrl,
    canonicalUrl: row.canonicalUrl,
    publishedAt: row.publishedAt.toISOString(),
    coverImageUrl: row.coverImageUrl,
    category: row.category as NewsItem["category"],
    tags: [],
    priorityScore: 70
  }));
}

export async function getStoredNewsBySlug(slug: string): Promise<NewsItem | null> {
  if (!prisma) {
    return null;
  }

  const row = await prisma.newsArticle.findUnique({
    where: {
      slug
    }
  });

  if (!row) {
    return null;
  }

  return {
    id: row.slug,
    title: row.title,
    excerpt: row.excerpt ?? "",
    sourceName: row.sourceName,
    sourceType: row.sourceType as NewsItem["sourceType"],
    sourceUrl: row.sourceUrl,
    canonicalUrl: row.canonicalUrl,
    publishedAt: row.publishedAt.toISOString(),
    coverImageUrl: row.coverImageUrl,
    category: row.category as NewsItem["category"],
    tags: [],
    priorityScore: 70
  };
}

export async function upsertNews(items: NewsItem[]) {
  if (!prisma) {
    return;
  }

  for (const item of items) {
    await prisma.newsArticle.upsert({
      where: {
        canonicalUrl: item.canonicalUrl
      },
      update: {
        slug: item.id,
        sourceName: item.sourceName,
        sourceType: item.sourceType,
        sourceUrl: item.sourceUrl,
        title: item.title,
        excerpt: item.excerpt,
        coverImageUrl: item.coverImageUrl ?? null,
        publishedAt: new Date(item.publishedAt),
        category: item.category
      },
      create: {
        slug: item.id,
        sourceName: item.sourceName,
        sourceType: item.sourceType,
        sourceUrl: item.sourceUrl,
        canonicalUrl: item.canonicalUrl,
        title: item.title,
        excerpt: item.excerpt,
        coverImageUrl: item.coverImageUrl ?? null,
        publishedAt: new Date(item.publishedAt),
        category: item.category
      }
    });
  }
}

export async function storeChangeLogs(changes: StoredChangeInput[]) {
  if (!prisma || changes.length === 0) {
    return;
  }

  await prisma.changeLog.createMany({
    data: changes.map((change) => ({
      entityType: change.entityType,
      entityId: change.entityId,
      changeType: change.changeType,
      oldValueJson: change.oldValueJson ?? Prisma.JsonNull,
      newValueJson: change.newValueJson ?? Prisma.JsonNull,
      sourceName: change.sourceName
    }))
  });
}

export async function listRecentChanges(): Promise<ChangeAlert[]> {
  if (!prisma) {
    return [];
  }

  const rows = await prisma.changeLog.findMany({
    orderBy: {
      detectedAt: "desc"
    },
    take: 8
  });

  return rows.map((row, index) => ({
    id: row.id,
    type: (row.changeType === "news" ? "news" : row.changeType === "fixture-time" ? "fixture-time" : row.changeType === "result" ? "result" : row.changeType === "ranking" ? "ranking" : "news") as ChangeAlert["type"],
    title:
      typeof row.newValueJson === "object" &&
      row.newValueJson !== null &&
      "title" in row.newValueJson &&
      typeof row.newValueJson.title === "string"
        ? row.newValueJson.title
        : `同步更新 ${index + 1}`,
    detail:
      typeof row.newValueJson === "object" &&
      row.newValueJson !== null &&
      "detail" in row.newValueJson &&
      typeof row.newValueJson.detail === "string"
        ? row.newValueJson.detail
        : `${row.sourceName} 检测到新的 ${row.changeType} 变化。`,
    occurredAt: row.detectedAt.toISOString(),
    severity: row.changeType === "result" || row.changeType === "ranking" ? "high" : "medium"
  }));
}
