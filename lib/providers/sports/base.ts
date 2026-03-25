import type { FixtureDetail, FixtureCard, SquadPlayer, StandingSummary } from "@/lib/types";

export interface SportsDataProvider {
  readonly name: string;
  getFixtures(teamExternalId: string): Promise<FixtureCard[]>;
  getFixtureDetail(fixtureExternalId: string): Promise<FixtureDetail | null>;
  getStandings(competitionExternalId: string): Promise<StandingSummary | null>;
  getSquad(teamExternalId: string): Promise<SquadPlayer[]>;
}
