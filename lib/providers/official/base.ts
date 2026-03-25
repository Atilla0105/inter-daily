import type { MemoryEntry, NewsDetail, NewsItem, SquadPlayer } from "@/lib/types";

export interface OfficialNewsProvider {
  readonly name: string;
  listNews(): Promise<NewsItem[]>;
  getArticle(url: string): Promise<NewsDetail | null>;
  listHallOfFame(): Promise<MemoryEntry[]>;
  getSquadPage(): Promise<SquadPlayer[]>;
}
