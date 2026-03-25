"use client";

import { Sparkles } from "lucide-react";

import { Card } from "@/components/base/card";
import { Chip } from "@/components/base/chip";
import { useAppLanguage } from "@/hooks/use-app-language";
import type { HomeEditorial } from "@/lib/types";

type BriefingPanelProps = {
  editorial: HomeEditorial;
};

export function BriefingPanel({ editorial }: BriefingPanelProps) {
  const { copy, formatUiDateTime } = useAppLanguage();
  const hasContent =
    editorial.topNews.length > 0 ||
    editorial.clubUpdates.length > 0 ||
    editorial.playerWatch.length > 0 ||
    editorial.injuryTransferWatch.length > 0 ||
    editorial.dailyChanges.length > 0 ||
    editorial.matchStoryline !== null;

  const leadTopNews = editorial.topNews[0] ?? null;
  const extraTopNews = editorial.topNews.slice(leadTopNews ? 1 : 0);
  const leadTitle = editorial.matchStoryline?.headline ?? leadTopNews?.title ?? editorial.clubUpdates[0]?.title ?? null;
  const leadSummary = editorial.matchStoryline?.summary ?? leadTopNews?.summary ?? editorial.clubUpdates[0]?.summary ?? null;
  const leadChip = editorial.matchStoryline ? copy.briefingStoryline : copy.briefingTopNews;
  const leadMeta = leadTopNews ? `${leadTopNews.source} · ${formatUiDateTime(leadTopNews.publishedAt)}` : copy.briefingSourceOnly;

  if (!hasContent) {
    return (
      <Card elevated className="p-4">
        <div className="flex items-start gap-3">
          <div className="rounded-2xl bg-brand-soft p-2 text-brand-primary">
            <Sparkles className="h-4 w-4" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-semibold text-text-primary">{copy.briefingPending}</p>
            <p className="text-sm leading-6 text-text-secondary">{copy.briefingPendingDesc}</p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {leadTitle && leadSummary ? (
        <Card elevated className="overflow-hidden p-0">
          <div className="border-b border-border-subtle bg-brand-soft/70 px-4 py-3">
            <div className="flex items-center justify-between gap-3">
              <Chip tone="brand">{leadChip}</Chip>
              <p className="text-xs text-text-muted">{copy.briefingSourceOnly}</p>
            </div>
          </div>
          <div className="space-y-3 p-4">
            <h3 className="text-lg font-semibold leading-7 text-text-primary">{leadTitle}</h3>
            <p className="text-sm leading-6 text-text-secondary">{leadSummary}</p>
            <p className="text-xs text-text-muted">{leadMeta}</p>
          </div>
        </Card>
      ) : null}

      {extraTopNews.length > 0 ? (
        <div className="space-y-3">
          {extraTopNews.slice(0, 2).map((item) => (
            <Card key={item.url} className="p-4">
              <div className="mb-2 flex items-center justify-between gap-3">
                <Chip tone="brand">{copy.briefingTopNews}</Chip>
                <p className="text-xs text-text-muted">{formatUiDateTime(item.publishedAt)}</p>
              </div>
              <h3 className="text-base font-semibold leading-6 text-text-primary">{item.title}</h3>
              <p className="mt-2 text-sm leading-6 text-text-secondary">{item.summary}</p>
              <p className="mt-3 text-xs text-text-muted">{item.source}</p>
            </Card>
          ))}
        </div>
      ) : null}

      {editorial.clubUpdates.length > 0 ? (
        <Card className="p-4">
          <div className="mb-3 flex items-center gap-2">
            <Chip tone="neutral">{copy.briefingClub}</Chip>
          </div>
          <div className="space-y-3">
            {editorial.clubUpdates.slice(0, 2).map((item) => (
              <div key={`${item.title}-${item.publishedAt}`} className="space-y-1">
                <p className="text-sm font-medium text-text-primary">{item.title}</p>
                <p className="text-sm leading-6 text-text-secondary">{item.summary}</p>
              </div>
            ))}
          </div>
        </Card>
      ) : null}

      {editorial.playerWatch.length > 0 ? (
        <Card className="p-4">
          <div className="mb-3 flex items-center gap-2">
            <Chip tone="neutral">{copy.briefingPlayerWatch}</Chip>
          </div>
          <div className="space-y-3">
            {editorial.playerWatch.slice(0, 3).map((item) => (
              <div key={`${item.player}-${item.publishedAt}`} className="space-y-1">
                <p className="text-sm font-medium text-text-primary">{item.player}</p>
                <p className="text-sm leading-6 text-text-secondary">{item.update}</p>
                <p className="text-xs text-text-muted">
                  {item.source} · {formatUiDateTime(item.publishedAt)}
                </p>
              </div>
            ))}
          </div>
        </Card>
      ) : null}

      {editorial.injuryTransferWatch.length > 0 ? (
        <Card className="p-4">
          <div className="mb-3 flex items-center gap-2">
            <Chip tone="gold">{copy.briefingWatch}</Chip>
          </div>
          <div className="space-y-3">
            {editorial.injuryTransferWatch.slice(0, 3).map((item) => (
              <div key={`${item.title}-${item.publishedAt}`} className="space-y-1">
                <p className="text-sm font-medium text-text-primary">{item.title}</p>
                <p className="text-sm leading-6 text-text-secondary">{item.summary}</p>
                <p className="text-xs text-text-muted">
                  {item.source} · {formatUiDateTime(item.publishedAt)}
                </p>
              </div>
            ))}
          </div>
        </Card>
      ) : null}

      {editorial.dailyChanges.length > 0 ? (
        <Card className="p-4">
          <div className="mb-3 flex items-center gap-2">
            <Chip tone="gold">{copy.briefingChanges}</Chip>
          </div>
          <div className="space-y-3">
            {editorial.dailyChanges.slice(0, 3).map((item) => (
              <div key={`${item.label}-${item.detail}`} className="space-y-1">
                <p className="text-sm font-medium text-text-primary">{item.label}</p>
                <p className="text-sm leading-6 text-text-secondary">{item.detail}</p>
              </div>
            ))}
          </div>
        </Card>
      ) : null}
    </div>
  );
}
