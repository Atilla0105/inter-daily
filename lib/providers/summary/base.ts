import type { ChangeAlert, FixtureCard, HomeEditorial, NewsItem, SquadPlayer, StandingSummary } from "@/lib/types";

export type EditorialSourceCatalogItem = {
  id: string;
  title: string;
  canonicalUrl: string;
  publishedAt: string;
  sourceName: string;
  category: NewsItem["category"];
};

export type HomeEditorialInput = {
  nextFixture: FixtureCard | null;
  lastFixture: FixtureCard | null;
  standings: StandingSummary | null;
  recentChanges: ChangeAlert[];
  topNews: NewsItem[];
  squad: SquadPlayer[];
  sourceCatalog: EditorialSourceCatalogItem[];
};

export type FixtureEditorialInput = {
  fixture: FixtureCard;
  standings: StandingSummary | null;
  recentChanges: ChangeAlert[];
  sourceCatalog: EditorialSourceCatalogItem[];
};

export interface SummaryProvider {
  readonly name: string;
  generateHomeEditorial(input: HomeEditorialInput): Promise<HomeEditorial>;
  generateFixtureStoryline(
    input: FixtureEditorialInput
  ): Promise<{
    summary: string | null;
    storylines: string[];
    sourceUrls: string[];
  }>;
}
