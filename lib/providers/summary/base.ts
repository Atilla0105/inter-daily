export interface SummaryProvider {
  readonly name: string;
  summarize(text: string): Promise<{
    summary: string;
    bullets: string[];
    category: string;
    confidence: number;
  } | null>;
}
