import env from "@/lib/config/env";
import { detailSeeds, rawFixtures, squadSeed, standingsSeed } from "@/lib/data/mock";
import type { FixtureCard, FixtureDetail, SquadPlayer, StandingSummary } from "@/lib/types";
import { competitionLabel, countdownLabel, formatKickoff, formatTimeZoneLabel, statusLabel, statusTone } from "@/lib/utils/time";

import type { SportsDataProvider } from "./base";

type FootballDataMatch = {
  id: number;
  utcDate: string;
  status: "TIMED" | "IN_PLAY" | "PAUSED" | "FINISHED" | "POSTPONED" | "CANCELLED";
  stage?: string | null;
  matchday?: number | null;
  area?: {
    name?: string | null;
  } | null;
  competition?: {
    code?: string | null;
    name?: string | null;
  } | null;
  venue?: string | null;
  homeTeam: {
    id: number;
    shortName?: string | null;
    tla?: string | null;
    name: string;
    crest?: string | null;
  };
  awayTeam: {
    id: number;
    shortName?: string | null;
    tla?: string | null;
    name: string;
    crest?: string | null;
  };
  score?: {
    fullTime?: {
      home?: number | null;
      away?: number | null;
    } | null;
  } | null;
};

function toInternalStatus(status: FootballDataMatch["status"]): FixtureCard["status"] {
  switch (status) {
    case "IN_PLAY":
    case "PAUSED":
      return "LIVE";
    case "FINISHED":
      return "FINISHED";
    case "POSTPONED":
      return "POSTPONED";
    case "CANCELLED":
      return "CANCELLED";
    default:
      return "SCHEDULED";
  }
}

function toCompetition(code?: string | null): FixtureCard["competition"] {
  if (code === "CL") {
    return "ucl";
  }

  if (code === "CUP") {
    return "coppa-italia";
  }

  return "serie-a";
}

function buildCard(match: FootballDataMatch, timeZone = "UTC", focusTeamId?: string): FixtureCard {
  const competition = toCompetition(match.competition?.code);
  const status = toInternalStatus(match.status);
  const interId = focusTeamId ?? env.sportsTeamId;

  return {
    id: String(match.id),
    competition,
    competitionLabel: match.competition?.name ?? competitionLabel(competition),
    round: match.matchday ? `第${match.matchday}轮` : "待确认轮次",
    venue: match.venue ?? match.area?.name ?? "待确认球场",
    stage: match.stage ?? "比赛",
    kickoffAtUtc: match.utcDate,
    kickoffDisplay: formatKickoff(match.utcDate, timeZone),
    localTimeLabel: formatTimeZoneLabel(match.utcDate, timeZone),
    isHome: interId ? String(match.homeTeam.id) === String(interId) : rawFixtures[0]?.awayTeam.id !== String(match.homeTeam.id),
    status,
    statusLabel: statusLabel(status),
    statusTone: statusTone(status),
    homeTeam: {
      id: String(match.homeTeam.id),
      name: match.homeTeam.name,
      shortName: match.homeTeam.shortName ?? match.homeTeam.tla ?? match.homeTeam.name,
      crestUrl: match.homeTeam.crest,
      score: match.score?.fullTime?.home ?? null
    },
    awayTeam: {
      id: String(match.awayTeam.id),
      name: match.awayTeam.name,
      shortName: match.awayTeam.shortName ?? match.awayTeam.tla ?? match.awayTeam.name,
      crestUrl: match.awayTeam.crest,
      score: match.score?.fullTime?.away ?? null
    },
    countdownLabel: status === "SCHEDULED" ? countdownLabel(match.utcDate) : null,
    keyStory: null,
    hasReminder: false
  };
}

async function fetchFootballData<T>(path: string): Promise<T | null> {
  if (!env.sportsApiKey) {
    return null;
  }

  const response = await fetch(`https://api.football-data.org/v4${path}`, {
    headers: {
      "X-Auth-Token": env.sportsApiKey
    },
    next: { revalidate: 60 }
  });

  if (!response.ok) {
    throw new Error(`football-data request failed: ${response.status}`);
  }

  return (await response.json()) as T;
}

export class FootballDataProvider implements SportsDataProvider {
  readonly name = "football-data.org";

  async getFixtures(teamExternalId: string) {
    const data = await fetchFootballData<{ matches: FootballDataMatch[] }>(
      `/teams/${teamExternalId}/matches?status=SCHEDULED,IN_PLAY,PAUSED,FINISHED`
    );

    if (!data) {
      return rawFixtures.map((fixture) => ({
        id: fixture.id,
        competition: fixture.competition,
        competitionLabel: competitionLabel(fixture.competition),
        round: fixture.round,
        venue: fixture.venue,
        stage: fixture.stage,
        kickoffAtUtc: fixture.kickoffAtUtc,
        kickoffDisplay: formatKickoff(fixture.kickoffAtUtc, "UTC"),
        localTimeLabel: formatTimeZoneLabel(fixture.kickoffAtUtc, "UTC"),
        isHome: fixture.isHome,
        status: fixture.status,
        statusLabel: statusLabel(fixture.status),
        statusTone: statusTone(fixture.status),
        homeTeam: fixture.homeTeam,
        awayTeam: fixture.awayTeam,
        countdownLabel:
          fixture.status === "SCHEDULED" ? countdownLabel(fixture.kickoffAtUtc) : fixture.status === "LIVE" ? "实时同步中" : null,
        keyStory: fixture.keyStory ?? null,
        hasReminder: fixture.hasReminder ?? false
      }));
    }

    return data.matches.map((match) => buildCard(match, "UTC", teamExternalId));
  }

  async getFixtureDetail(fixtureExternalId: string): Promise<FixtureDetail | null> {
    const data = await fetchFootballData<{ match: FootballDataMatch }>(`/matches/${fixtureExternalId}`);

    if (!data) {
      return detailSeeds[fixtureExternalId] ?? null;
    }

    const fixture = buildCard(data.match, "UTC", env.sportsTeamId);

    return {
      fixture,
      summary: "football-data.org 当前仅提供基础比赛详情，时间线、阵容与技术统计需要更强 provider。",
      storylines: ["当前 provider 已接入基础详情。", "更多 live 细节建议后续切换 Sportmonks 或 API-Football。"],
      timeline: null,
      lineups: null,
      stats: null,
      capabilities: {
        timeline: false,
        lineups: false,
        stats: false,
        injuries: false,
        liveEvents: true,
        playerRatings: true,
        fanReaction: true
      },
      syncedAt: new Date().toISOString(),
      stale: false
    };
  }

  async getStandings(competitionExternalId: string): Promise<StandingSummary | null> {
    const data = await fetchFootballData<{
      standings?: Array<{
        table: Array<{
          position: number;
          team: { id: number; shortName?: string | null; name: string };
          playedGames: number;
          points: number;
          goalDifference: number;
        }>;
      }>;
    }>(`/competitions/${competitionExternalId}/standings`);

    if (!data?.standings?.[0]) {
      return standingsSeed;
    }

    const table = data.standings[0].table.slice(0, 5);
    const interRow = data.standings[0].table.find((row) => row.team.name.includes("Inter"));
    const leader = data.standings[0].table[0];
    const fourth = data.standings[0].table[3];

    return {
      competition: "serie-a",
      competitionLabel: "意甲",
      season: "当前赛季",
      inter: {
        position: interRow?.position ?? standingsSeed.inter.position,
        gapToLeader: leader && interRow ? leader.points - interRow.points : standingsSeed.inter.gapToLeader,
        gapToTopFour: fourth && interRow ? fourth.points - interRow.points : standingsSeed.inter.gapToTopFour,
        played: interRow?.playedGames ?? standingsSeed.inter.played,
        wins: standingsSeed.inter.wins,
        draws: standingsSeed.inter.draws,
        losses: standingsSeed.inter.losses,
        goalsFor: standingsSeed.inter.goalsFor,
        goalsAgainst: standingsSeed.inter.goalsAgainst,
        points: interRow?.points ?? standingsSeed.inter.points
      },
      rows: table.map((row) => ({
        position: row.position,
        teamId: String(row.team.id),
        teamName: row.team.shortName ?? row.team.name,
        played: row.playedGames,
        points: row.points,
        goalDiff: row.goalDifference,
        form: [],
        highlight: row.team.name.includes("Inter") ? "inter" : row.position === 1 ? "leader" : undefined
      })),
      stale: false,
      syncedAt: new Date().toISOString()
    };
  }

  async getSquad(teamExternalId: string): Promise<SquadPlayer[]> {
    const data = await fetchFootballData<{
      squad?: Array<{
        id: number;
        name: string;
        position?: string | null;
        nationality?: string | null;
        dateOfBirth?: string | null;
      }>;
    }>(`/teams/${teamExternalId}`);

    if (!data?.squad?.length) {
      return squadSeed;
    }

    return data.squad.map((player, index) => ({
      id: String(player.id),
      name: player.name,
      shirtNumber: index + 1,
      positionGroup: player.position?.includes("keeper")
        ? "门将"
        : player.position?.includes("defence")
          ? "后卫"
          : player.position?.includes("midfield")
            ? "中场"
            : "前锋",
      nationality: player.nationality ?? "未知",
      birthDate: player.dateOfBirth ?? null,
      status: "可出场"
    }));
  }
}

export const footballDataProvider = new FootballDataProvider();
