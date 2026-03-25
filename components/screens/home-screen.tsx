"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { BookOpenText, Shield, Trophy } from "lucide-react";

import { AppShell } from "@/components/base/app-shell";
import { EmptyState } from "@/components/base/empty-state";
import { OfflineBadge } from "@/components/base/offline-badge";
import { ErrorPanel, LoadingCards, StalePanel } from "@/components/base/resource-panels";
import { SectionTitle } from "@/components/base/section-title";
import { SegmentedTabs } from "@/components/base/segmented-tabs";
import { ChangeFeed } from "@/components/business/change-feed";
import { MemoryCard } from "@/components/business/memory-card";
import { NewsPriorityList } from "@/components/business/news-priority-list";
import { NextMatchHero } from "@/components/business/next-match-hero";
import { ScoreStrip } from "@/components/business/score-strip";
import { StandingsMiniCard } from "@/components/business/standings-mini-card";
import { useAppLanguage } from "@/hooks/use-app-language";
import { useNetworkStatus } from "@/hooks/use-network-status";
import { useTimeZone } from "@/hooks/use-timezone";
import { apiEnvelopeSchema, homePayloadSchema } from "@/lib/schemas";
import { fetchApi } from "@/lib/services/api";

export function HomeScreen() {
  const timeZone = useTimeZone();
  const isOnline = useNetworkStatus();
  const { copy, language, languageOptions, setLanguage } = useAppLanguage();
  const query = useQuery({
    queryKey: ["home", timeZone],
    queryFn: () => fetchApi(`/api/home?tz=${encodeURIComponent(timeZone)}`, apiEnvelopeSchema(homePayloadSchema))
  });

  return (
    <AppShell pathname="/">
      <div className="space-y-6">
        <section className="space-y-3">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-2">
              <p className="text-xs tracking-[0.24em] text-brand-primary">{copy.appName}</p>
              <p className="max-w-[14rem] text-sm leading-6 text-text-secondary">{copy.homeTagline}</p>
            </div>
            <div className="w-[156px] space-y-2">
              <p className="text-right text-[11px] tracking-[0.16em] text-text-muted">{copy.language}</p>
              <SegmentedTabs
                options={languageOptions.map((item) => ({ label: item.label, value: item.value }))}
                value={language}
                onChange={(value) => setLanguage(value as typeof language)}
                compact
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <OfflineBadge offline={!isOnline} />
            <span className="inline-flex items-center rounded-full bg-brand-soft px-3 py-1.5 text-xs text-brand-primary">
              {copy.syncedEvery}
            </span>
            <Link href="/squad" className="rounded-full border border-border-subtle px-4 py-2 text-sm text-text-secondary">
              {copy.homeSquad}
            </Link>
          </div>
        </section>

        {query.isLoading ? <LoadingCards lines={4} /> : null}
        {query.isError ? <ErrorPanel title={copy.errorLoad} detail={copy.tryLater} /> : null}
        {query.data?.stale ? <StalePanel syncedAt={query.data.syncedAt} /> : null}

        {query.data?.data ? (
          <>
            {query.data.data.nextFixture ? <NextMatchHero fixture={query.data.data.nextFixture} stale={query.data.stale} /> : null}

            {query.data.data.lastFixture ? (
              <section className="space-y-3">
                <SectionTitle>{copy.scoreLastResult}</SectionTitle>
                <ScoreStrip fixture={query.data.data.lastFixture} label={copy.scoreLastResult} />
              </section>
            ) : null}

            {query.data.data.standingsSummary ? (
              <section className="space-y-3">
                <SectionTitle>{copy.standingsTitle}</SectionTitle>
                <StandingsMiniCard standings={query.data.data.standingsSummary} />
              </section>
            ) : null}

            <section className="space-y-3">
              <SectionTitle
                action={
                  <Link href="/news" className="text-sm font-medium text-brand-primary">
                    {copy.homeAllNews}
                  </Link>
                }
              >
                {copy.homeNews}
              </SectionTitle>
              {query.data.data.topNews.length > 0 ? (
                <NewsPriorityList items={query.data.data.topNews} />
              ) : (
                <EmptyState title={copy.homeNoNews} description={copy.homeNoNewsDesc} icon={<BookOpenText className="h-5 w-5" />} />
              )}
            </section>

            <section className="space-y-3">
              <SectionTitle>{copy.homeChanges}</SectionTitle>
              <ChangeFeed items={query.data.data.injuriesAndTransfers} />
            </section>

            <section className="space-y-3">
              <SectionTitle>{copy.homeBreaking}</SectionTitle>
              <ChangeFeed items={query.data.data.changes} />
            </section>

            {query.data.data.memoryCard ? (
              <section className="space-y-3">
                <SectionTitle>{copy.homeMemory}</SectionTitle>
                <MemoryCard item={query.data.data.memoryCard} />
              </section>
            ) : null}

            <section className="grid grid-cols-3 gap-4">
              <Link href="/matches" className="rounded-xl bg-white/4 p-4">
                <Trophy className="mb-3 h-5 w-5 text-brand-primary" />
                <p className="text-sm font-medium text-text-primary">{copy.homeMatches}</p>
              </Link>
              <Link href="/live" className="rounded-xl bg-white/4 p-4">
                <Shield className="mb-3 h-5 w-5 text-brand-primary" />
                <p className="text-sm font-medium text-text-primary">{copy.homeTeam}</p>
              </Link>
              <Link href="/memory" className="rounded-xl bg-white/4 p-4">
                <BookOpenText className="mb-3 h-5 w-5 text-accent-gold" />
                <p className="text-sm font-medium text-text-primary">{copy.homeHistory}</p>
              </Link>
            </section>
          </>
        ) : null}
      </div>
    </AppShell>
  );
}
