import env from "@/lib/config/env";
import { changesSeed, detailSeeds, homeSeed, memorySeed, newsDetailsSeed, rawFixtures, squadSeed, standingsSeed, topNewsSeed } from "@/lib/data/mock";
import { interOfficialProvider } from "@/lib/providers/official/inter-official";
import { footballDataProvider } from "@/lib/providers/sports/football-data";
import {
  getLatestStandings,
  getStoredFixture,
  listRecentChanges,
  listStoredFixtures,
  listStoredNews,
  listStoredPlayers,
  saveStandings,
  storeChangeLogs,
  upsertFixtures,
  upsertNews,
  upsertPlayers,
  getStoredNewsBySlug
} from "@/lib/repositories/content-store";
import { getCachedOrLoad } from "@/lib/server/cache";
import { sendPushNotifications } from "@/lib/server/push";
import type {
  ApiEnvelope,
  ChangeAlert,
  FixtureCard,
  FixtureDetail,
  HomePayload,
  MatchStatus,
  MemoryEntry,
  NewsDetail,
  NewsItem,
  SquadPlayer,
  StandingSummary
} from "@/lib/types";
import { competitionLabel, countdownLabel, formatKickoff, formatTimeZoneLabel, statusLabel, statusTone } from "@/lib/utils/time";

type FixturesQuery = {
  status?: "upcoming" | "finished" | "all" | "live";
  competition?: "all" | FixtureCard["competition"];
  timeZone: string;
};

type NotificationTask = {
  title: string;
  body: string;
  url?: string;
  type: "match" | "news";
};

function buildSeedFixtureCard(seed: (typeof rawFixtures)[number], timeZone: string): FixtureCard {
  return {
    id: seed.id,
    competition: seed.competition,
    competitionLabel: competitionLabel(seed.competition),
    round: seed.round,
    venue: seed.venue,
    stage: seed.stage,
    kickoffAtUtc: seed.kickoffAtUtc,
    kickoffDisplay: formatKickoff(seed.kickoffAtUtc, timeZone),
    localTimeLabel: formatTimeZoneLabel(seed.kickoffAtUtc, timeZone),
    isHome: seed.isHome,
    status: seed.status,
    statusLabel: statusLabel(seed.status),
    statusTone: statusTone(seed.status),
    homeTeam: seed.homeTeam,
    awayTeam: seed.awayTeam,
    countdownLabel:
      seed.status === "SCHEDULED" ? countdownLabel(seed.kickoffAtUtc) : seed.status === "LIVE" ? "实时同步中" : null,
    keyStory: seed.keyStory ?? null,
    hasReminder: seed.hasReminder ?? false
  };
}

function withTimeZone(fixture: FixtureCard, timeZone: string): FixtureCard {
  return {
    ...fixture,
    kickoffDisplay: formatKickoff(fixture.kickoffAtUtc, timeZone),
    localTimeLabel: formatTimeZoneLabel(fixture.kickoffAtUtc, timeZone),
    countdownLabel:
      fixture.status === "SCHEDULED"
        ? countdownLabel(fixture.kickoffAtUtc)
        : fixture.status === "LIVE"
          ? fixture.countdownLabel ?? "实时同步中"
          : null
  };
}

function hydrateFixtureDetail(detail: FixtureDetail, timeZone: string): FixtureDetail {
  return {
    ...detail,
    fixture: withTimeZone(detail.fixture, timeZone)
  };
}

function sortFixtures(fixtures: FixtureCard[]) {
  return [...fixtures].sort(
    (left, right) => new Date(left.kickoffAtUtc).getTime() - new Date(right.kickoffAtUtc).getTime()
  );
}

function fallbackFixtures(timeZone: string) {
  return sortFixtures(rawFixtures.map((fixture) => buildSeedFixtureCard(fixture, timeZone)));
}

async function loadFixtures(timeZone: string) {
  const stored = await listStoredFixtures(timeZone);
  if (stored.length > 0) {
    return sortFixtures(stored.map((fixture) => withTimeZone(fixture, timeZone)));
  }

  try {
    const providerFixtures = await footballDataProvider.getFixtures(env.sportsTeamId || "108");
    return sortFixtures(providerFixtures.map((fixture) => withTimeZone(fixture, timeZone)));
  } catch {
    return fallbackFixtures(timeZone);
  }
}

async function loadStandings() {
  const stored = await getLatestStandings();
  if (stored) {
    return stored;
  }

  try {
    return (
      (await footballDataProvider.getStandings(env.sportsCompetitionIdSerieA || "SA")) ?? standingsSeed
    );
  } catch {
    return standingsSeed;
  }
}

function mergeNews(primary: NewsItem[], fallback: NewsItem[]) {
  const merged = new Map<string, NewsItem>();

  for (const item of [...primary, ...fallback]) {
    if (!merged.has(item.id)) {
      merged.set(item.id, item);
    }
  }

  return [...merged.values()].sort((left, right) => {
    if (right.priorityScore !== left.priorityScore) {
      return right.priorityScore - left.priorityScore;
    }

    return new Date(right.publishedAt).getTime() - new Date(left.publishedAt).getTime();
  });
}

async function loadNews(category?: string) {
  const stored = await listStoredNews();
  if (stored.length > 0) {
    const merged = mergeNews(stored, topNewsSeed);
    return category && category !== "all" ? merged.filter((item) => item.category === category) : merged;
  }

  try {
    const official = await interOfficialProvider.listNews();
    const merged = mergeNews(official, topNewsSeed);
    return category && category !== "all" ? merged.filter((item) => item.category === category) : merged;
  } catch {
    const merged = mergeNews([], topNewsSeed);
    return category && category !== "all" ? merged.filter((item) => item.category === category) : merged;
  }
}

async function loadMemoryCard(): Promise<MemoryEntry> {
  try {
    const items = await interOfficialProvider.listHallOfFame();
    return items[0] ?? memorySeed;
  } catch {
    return memorySeed;
  }
}

async function loadSquad() {
  const stored = await listStoredPlayers();
  if (stored.length > 0) {
    return stored;
  }

  try {
    const squad = await footballDataProvider.getSquad(env.sportsTeamId || "108");
    return squad.length > 0 ? squad : squadSeed;
  } catch {
    return squadSeed;
  }
}

function buildRecentChangesFallback() {
  return changesSeed;
}

function fixtureChangeToAlert(input: {
  fixture: FixtureCard;
  changeType: "fixture-time" | "result";
  detail: string;
}): ChangeAlert {
  return {
    id: `${input.fixture.id}-${input.changeType}`,
    type: input.changeType,
    title:
      input.changeType === "result"
        ? `${input.fixture.homeTeam.shortName} ${input.fixture.homeTeam.score ?? "-"}:${input.fixture.awayTeam.score ?? "-"} ${input.fixture.awayTeam.shortName}`
        : `${input.fixture.homeTeam.shortName} vs ${input.fixture.awayTeam.shortName}`,
    detail: input.detail,
    occurredAt: new Date().toISOString(),
    severity: input.changeType === "result" ? "high" : "medium"
  };
}

export async function getHomePayload(timeZone: string): Promise<ApiEnvelope<HomePayload>> {
  const result = await getCachedOrLoad(`home:${timeZone}`, 120, async () => {
    const fixtures = await loadFixtures(timeZone);
    const standings = await loadStandings();
    const news = await loadNews();
    const memoryCard = await loadMemoryCard();
    const recentChanges = await listRecentChanges();

    const liveFixture = fixtures.find((fixture) => fixture.status === "LIVE");
    const nextScheduled = fixtures.find((fixture) => fixture.status === "SCHEDULED");
    const lastFinished = [...fixtures].reverse().find((fixture) => fixture.status === "FINISHED");

    return {
      ...homeSeed,
      nextFixture: liveFixture ?? nextScheduled ?? fixtures[0] ?? null,
      lastFixture: lastFinished ?? null,
      standingsSummary: standings,
      topNews: news.slice(0, 3),
      changes: recentChanges.length > 0 ? recentChanges : buildRecentChangesFallback(),
      memoryCard,
      injuriesAndTransfers:
        recentChanges.filter((item) => item.type === "transfer" || item.type === "injury" || item.type === "suspension")
          .slice(0, 3)
          .concat(homeSeed.injuriesAndTransfers)
          .slice(0, 3)
    };
  });

  return {
    data: {
      ...result.data,
      stale: result.stale,
      syncedAt: result.syncedAt
    },
    stale: result.stale,
    syncedAt: result.syncedAt,
    offlineReady: true
  };
}

export async function getFixturesData(query: FixturesQuery): Promise<ApiEnvelope<FixtureCard[]>> {
  const cacheKey = `fixtures:${query.status ?? "all"}:${query.competition ?? "all"}:${query.timeZone}`;
  const result = await getCachedOrLoad(cacheKey, 300, async () => {
    let items = await loadFixtures(query.timeZone);

    if (query.competition && query.competition !== "all") {
      items = items.filter((fixture) => fixture.competition === query.competition);
    }

    if (query.status === "upcoming") {
      items = items.filter((fixture) => fixture.status === "SCHEDULED");
    }

    if (query.status === "finished") {
      items = items.filter((fixture) => fixture.status === "FINISHED");
    }

    if (query.status === "live") {
      items = items.filter((fixture) => fixture.status === "LIVE");
    }

    return sortFixtures(items);
  });

  return {
    data: result.data,
    stale: result.stale,
    syncedAt: result.syncedAt,
    offlineReady: true
  };
}

function buildBaseDetail(fixture: FixtureCard, stale = false): FixtureDetail {
  return {
    fixture,
    summary: fixture.keyStory ?? "当前数据源只提供基础赛程和比分信息。",
    storylines: ["当前 provider 已接入基础赛程/比分。", "阵容、分钟级时间线和技术统计将由更强的数据源补全。"],
    timeline: null,
    lineups: null,
    stats: null,
    capabilities: {
      timeline: false,
      lineups: false,
      stats: false,
      injuries: false,
      liveEvents: fixture.status === "LIVE",
      playerRatings: true,
      fanReaction: true
    },
    syncedAt: new Date().toISOString(),
    stale
  };
}

export async function getFixtureDetailData(id: string, timeZone: string): Promise<ApiEnvelope<FixtureDetail | null>> {
  const result = await getCachedOrLoad(`fixture:${id}:${timeZone}`, 60, async () => {
    if (detailSeeds[id]) {
      return hydrateFixtureDetail(detailSeeds[id], timeZone);
    }

    const stored = await getStoredFixture(id, timeZone);
    if (stored) {
      return buildBaseDetail(withTimeZone(stored, timeZone));
    }

    try {
      const providerDetail = await footballDataProvider.getFixtureDetail(id);
      return providerDetail ? hydrateFixtureDetail(providerDetail, timeZone) : null;
    } catch {
      return null;
    }
  });

  return {
    data: result.data,
    stale: result.stale,
    syncedAt: result.syncedAt,
    offlineReady: true
  };
}

export async function getLiveCenterData(timeZone: string): Promise<ApiEnvelope<FixtureDetail | null>> {
  const fixtures = await getFixturesData({
    status: "live",
    competition: "all",
    timeZone
  });

  const liveFixture = fixtures.data[0] ?? (await getFixturesData({ status: "upcoming", competition: "all", timeZone })).data[0] ?? null;
  return liveFixture ? getFixtureDetailData(liveFixture.id, timeZone) : { data: null, stale: false, syncedAt: new Date().toISOString() };
}

export async function getNewsData(category?: string): Promise<ApiEnvelope<NewsItem[]>> {
  const result = await getCachedOrLoad(`news:${category ?? "all"}`, 300, async () => loadNews(category));

  return {
    data: result.data,
    stale: result.stale,
    syncedAt: result.syncedAt,
    offlineReady: true
  };
}

export async function getNewsDetailData(id: string): Promise<ApiEnvelope<NewsDetail | null>> {
  const result = await getCachedOrLoad(`news-detail:${id}`, 900, async () => {
    if (newsDetailsSeed[id]) {
      return newsDetailsSeed[id];
    }

    const stored = await getStoredNewsBySlug(id);
    if (stored && stored.sourceType === "official") {
      try {
        return (await interOfficialProvider.getArticle(stored.canonicalUrl)) ?? {
          ...stored,
          body: stored.excerpt,
          related: (await loadNews()).filter((item) => item.id !== stored.id).slice(0, 2)
        };
      } catch {
        return {
          ...stored,
          body: stored.excerpt,
          related: (await loadNews()).filter((item) => item.id !== stored.id).slice(0, 2)
        };
      }
    }

    if (stored) {
      return {
        ...stored,
        body: stored.excerpt,
        related: (await loadNews()).filter((item) => item.id !== stored.id).slice(0, 2)
      };
    }

    return null;
  });

  return {
    data: result.data,
    stale: result.stale,
    syncedAt: result.syncedAt,
    offlineReady: true
  };
}

export async function getStandingsData(): Promise<ApiEnvelope<StandingSummary>> {
  const result = await getCachedOrLoad("standings:serie-a", 3600, async () => loadStandings());

  return {
    data: result.data,
    stale: result.stale,
    syncedAt: result.syncedAt,
    offlineReady: true
  };
}

export async function getSquadData(): Promise<ApiEnvelope<SquadPlayer[]>> {
  const result = await getCachedOrLoad("squad", 86_400, async () => loadSquad());

  return {
    data: result.data,
    stale: result.stale,
    syncedAt: result.syncedAt,
    offlineReady: true
  };
}

export async function refreshOfficialNews() {
  const existing = await listStoredNews();
  const incoming = await interOfficialProvider.listNews();
  const existingIds = new Set(existing.map((item) => item.id));
  const newItems = incoming.filter((item) => !existingIds.has(item.id));

  await upsertNews(incoming);

  const changeLogs = newItems.map((item) => ({
    entityType: "news",
    entityId: item.id,
    changeType: "news",
    sourceName: interOfficialProvider.name,
    newValueJson: {
      title: item.title,
      detail: `${item.sourceName} 发布了新内容：${item.title}`
    }
  }));

  await storeChangeLogs(changeLogs);

  const notifications: NotificationTask[] = newItems.slice(0, 2).map((item) => ({
    title: "Inter Daily 官方新闻",
    body: item.title,
    url: `/news/${item.id}`,
    type: "news"
  }));

  if (notifications.length > 0) {
    await Promise.all(notifications.map((notification) => sendPushNotifications(notification)));
  }

  return {
    source: interOfficialProvider.name,
    inserted: newItems.length,
    latestHeadline: incoming[0]?.title ?? null,
    notifications
  };
}

function compareFixtureStatus(previous: FixtureCard | undefined, next: FixtureCard): ChangeAlert[] {
  if (!previous) {
    return [];
  }

  const alerts: ChangeAlert[] = [];

  if (previous.kickoffAtUtc !== next.kickoffAtUtc) {
    alerts.push(
      fixtureChangeToAlert({
        fixture: next,
        changeType: "fixture-time",
        detail: `开球时间已更新为 ${next.kickoffDisplay}。`
      })
    );
  }

  const scoreChanged =
    previous.homeTeam.score !== next.homeTeam.score || previous.awayTeam.score !== next.awayTeam.score;
  if (previous.status !== next.status || scoreChanged) {
    alerts.push(
      fixtureChangeToAlert({
        fixture: next,
        changeType: "result",
        detail: `比赛状态更新为 ${statusLabel(next.status as MatchStatus)}。`
      })
    );
  }

  return alerts;
}

export async function refreshSportsData() {
  const previousFixtures = await listStoredFixtures("UTC");
  const previousMap = new Map(previousFixtures.map((fixture) => [fixture.id, fixture]));
  const previousStandings = await getLatestStandings();

  const fixtures = await footballDataProvider.getFixtures(env.sportsTeamId || "108");
  const standings =
    (await footballDataProvider.getStandings(env.sportsCompetitionIdSerieA || "SA")) ?? standingsSeed;
  const squad = await footballDataProvider.getSquad(env.sportsTeamId || "108");

  await upsertFixtures(fixtures, footballDataProvider.name);
  await saveStandings(standings, footballDataProvider.name);
  await upsertPlayers(squad, footballDataProvider.name);

  const fixtureAlerts = fixtures.flatMap((fixture) => compareFixtureStatus(previousMap.get(fixture.id), fixture));
  const rankingAlert =
    previousStandings && previousStandings.inter.position !== standings.inter.position
      ? [
          {
            id: "ranking-shift",
            type: "ranking" as const,
            title: `联赛排名变化：现在第 ${standings.inter.position} 名`,
            detail: `国际米兰排名从第 ${previousStandings.inter.position} 位更新到第 ${standings.inter.position} 位。`,
            occurredAt: new Date().toISOString(),
            severity: "high" as const
          }
        ]
      : [];

  const allAlerts = [...fixtureAlerts, ...rankingAlert];

  await storeChangeLogs(
    allAlerts.map((alert) => ({
      entityType: alert.type === "ranking" ? "standings" : "fixture",
      entityId: alert.id,
      changeType: alert.type,
      sourceName: footballDataProvider.name,
      newValueJson: {
        title: alert.title,
        detail: alert.detail
      }
    }))
  );

  const notifications: NotificationTask[] = allAlerts.slice(0, 2).map((alert) => ({
    title: "Inter Daily 比赛更新",
    body: alert.title,
    url: alert.type === "ranking" ? "/matches" : "/live",
    type: "match"
  }));

  if (notifications.length > 0) {
    await Promise.all(notifications.map((notification) => sendPushNotifications(notification)));
  }

  return {
    source: footballDataProvider.name,
    fixtures: fixtures.length,
    standings: standings ? 1 : 0,
    squad: squad.length,
    notifications
  };
}

export async function refreshLiveWindow() {
  const fixtures = await footballDataProvider.getFixtures(env.sportsTeamId || "108");
  const live = fixtures.filter((fixture) => fixture.status === "LIVE");

  if (live.length > 0) {
    await upsertFixtures(fixtures, footballDataProvider.name);
  }

  return {
    source: footballDataProvider.name,
    hasLiveData: live.length > 0,
    liveCount: live.length
  };
}
