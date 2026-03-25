import { detailSeeds, homeSeed, newsDetailsSeed, rawFixtures, squadSeed, standingsSeed, topNewsSeed } from "@/lib/data/mock";
import { interOfficialProvider } from "@/lib/providers/official/inter-official";
import { footballDataProvider } from "@/lib/providers/sports/football-data";
import { getCachedOrLoad } from "@/lib/server/cache";
import type {
  ApiEnvelope,
  FixtureCard,
  FixtureDetail,
  HomePayload,
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

function buildFixtureCard(seed: (typeof rawFixtures)[number], timeZone: string): FixtureCard {
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
    countdownLabel: seed.status === "SCHEDULED" ? countdownLabel(seed.kickoffAtUtc) : seed.status === "LIVE" ? "实时同步中" : null,
    keyStory: seed.keyStory ?? null,
    hasReminder: seed.hasReminder ?? false
  };
}

function hydrateFixtureDetail(detail: FixtureDetail, timeZone: string): FixtureDetail {
  return {
    ...detail,
    fixture: {
      ...detail.fixture,
      kickoffDisplay: formatKickoff(detail.fixture.kickoffAtUtc, timeZone),
      localTimeLabel: formatTimeZoneLabel(detail.fixture.kickoffAtUtc, timeZone)
    }
  };
}

export async function getHomePayload(timeZone: string): Promise<ApiEnvelope<HomePayload>> {
  const result = await getCachedOrLoad("home", 120, async () => {
    const liveFixture = rawFixtures.find((fixture) => fixture.status === "LIVE");
    const nextScheduled = rawFixtures.find((fixture) => fixture.status === "SCHEDULED");
    const lastFinished = [...rawFixtures].reverse().find((fixture) => fixture.status === "FINISHED");

    return {
      ...homeSeed,
      nextFixture: buildFixtureCard(liveFixture ?? nextScheduled ?? rawFixtures[0], timeZone),
      lastFixture: lastFinished ? buildFixtureCard(lastFinished, timeZone) : null
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
    let items = rawFixtures.map((fixture) => buildFixtureCard(fixture, query.timeZone));

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

    return items;
  });

  return {
    data: result.data,
    stale: result.stale,
    syncedAt: result.syncedAt,
    offlineReady: true
  };
}

export async function getFixtureDetailData(id: string, timeZone: string): Promise<ApiEnvelope<FixtureDetail | null>> {
  const result = await getCachedOrLoad(`fixture:${id}:${timeZone}`, 60, async () => {
    const seed = detailSeeds[id];
    return seed ? hydrateFixtureDetail(seed, timeZone) : null;
  });

  return {
    data: result.data,
    stale: result.stale,
    syncedAt: result.syncedAt,
    offlineReady: true
  };
}

export async function getLiveCenterData(timeZone: string): Promise<ApiEnvelope<FixtureDetail | null>> {
  const liveFixture = rawFixtures.find((fixture) => fixture.status === "LIVE") ?? rawFixtures[1];
  return getFixtureDetailData(liveFixture.id, timeZone);
}

export async function getNewsData(category?: string): Promise<ApiEnvelope<NewsItem[]>> {
  const result = await getCachedOrLoad(`news:${category ?? "all"}`, 300, async () => {
    let items = [...topNewsSeed];

    if (category && category !== "all") {
      items = items.filter((item) => item.category === category);
    }

    return items.sort((left, right) => right.priorityScore - left.priorityScore);
  });

  return {
    data: result.data,
    stale: result.stale,
    syncedAt: result.syncedAt,
    offlineReady: true
  };
}

export async function getNewsDetailData(id: string): Promise<ApiEnvelope<NewsDetail | null>> {
  const result = await getCachedOrLoad(`news-detail:${id}`, 900, async () => newsDetailsSeed[id] ?? null);

  return {
    data: result.data,
    stale: result.stale,
    syncedAt: result.syncedAt,
    offlineReady: true
  };
}

export async function getStandingsData(): Promise<ApiEnvelope<StandingSummary>> {
  const result = await getCachedOrLoad("standings:serie-a", 3600, async () => standingsSeed);

  return {
    data: result.data,
    stale: result.stale,
    syncedAt: result.syncedAt,
    offlineReady: true
  };
}

export async function getSquadData(): Promise<ApiEnvelope<SquadPlayer[]>> {
  const result = await getCachedOrLoad("squad", 86_400, async () => squadSeed);

  return {
    data: result.data,
    stale: result.stale,
    syncedAt: result.syncedAt,
    offlineReady: true
  };
}

export async function refreshOfficialNews() {
  const news = await interOfficialProvider.listNews();
  return {
    source: interOfficialProvider.name,
    inserted: news.length,
    latestHeadline: news[0]?.title ?? null
  };
}

export async function refreshSportsData() {
  const fixtures = await footballDataProvider.getFixtures("108");
  const standings = await footballDataProvider.getStandings("SA");
  const squad = await footballDataProvider.getSquad("108");

  return {
    source: footballDataProvider.name,
    fixtures: fixtures.length,
    standings: standings ? 1 : 0,
    squad: squad.length
  };
}

export async function refreshLiveWindow() {
  const live = await footballDataProvider.getFixtureDetail("0");

  return {
    source: footballDataProvider.name,
    hasLiveData: live !== null
  };
}
