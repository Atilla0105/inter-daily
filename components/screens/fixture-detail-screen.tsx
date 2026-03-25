"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";

import { AppShell } from "@/components/base/app-shell";
import { EmptyState } from "@/components/base/empty-state";
import { ErrorPanel, LoadingCards, StalePanel } from "@/components/base/resource-panels";
import { SectionTitle } from "@/components/base/section-title";
import { CapabilityCard } from "@/components/business/capability-card";
import { LineupGrid } from "@/components/business/lineup-grid";
import { ScoreStrip } from "@/components/business/score-strip";
import { StatBars } from "@/components/business/stat-bars";
import { TimelineFeed } from "@/components/business/timeline-feed";
import { useAppLanguage } from "@/hooks/use-app-language";
import { useTimeZone } from "@/hooks/use-timezone";
import { apiEnvelopeSchema, fixtureDetailSchema } from "@/lib/schemas";
import { fetchApi } from "@/lib/services/api";

export function FixtureDetailScreen({ id }: { id: string }) {
  const timeZone = useTimeZone();
  const { copy } = useAppLanguage();
  const query = useQuery({
    queryKey: ["fixture-detail", id, timeZone],
    queryFn: () =>
      fetchApi(`/api/fixtures/${id}?tz=${encodeURIComponent(timeZone)}`, apiEnvelopeSchema(fixtureDetailSchema))
  });

  return (
    <AppShell pathname={`/fixtures/${id}`}>
      <div className="space-y-6">
        <div className="flex justify-end">
          <Link href="/matches" className="rounded-full border border-border-subtle px-4 py-2 text-sm text-text-secondary">
            {copy.fixtureDetailBack}
          </Link>
        </div>

        {query.isLoading ? <LoadingCards lines={3} /> : null}
        {query.isError ? <ErrorPanel title={copy.fixtureDetailError} detail={copy.fixtureDetailErrorDesc} /> : null}
        {query.data?.stale ? <StalePanel syncedAt={query.data.syncedAt} /> : null}

        {!query.isLoading && !query.data?.data ? (
          <EmptyState title={copy.fixtureDetailEmpty} description={copy.fixtureDetailEmptyDesc} />
        ) : null}

        {query.data?.data ? (
          <>
            <ScoreStrip fixture={query.data.data.fixture} label={copy.scoreAndStatus} />

            <section className="space-y-3">
              <SectionTitle>{copy.fixtureSummary}</SectionTitle>
              <div className="rounded-xl bg-white/4 p-4 text-sm leading-6 text-text-secondary">{query.data.data.summary}</div>
            </section>

            <section className="space-y-3">
              <SectionTitle>{copy.fixtureTimeline}</SectionTitle>
              {query.data.data.timeline ? (
                <TimelineFeed items={query.data.data.timeline} />
              ) : (
                <CapabilityCard title={copy.noTimeline} description={copy.noTimelineDesc} />
              )}
            </section>

            <section className="space-y-3">
              <SectionTitle>{copy.fixtureLineups}</SectionTitle>
              {query.data.data.lineups ? (
                <LineupGrid home={query.data.data.lineups.home} away={query.data.data.lineups.away} />
              ) : (
                <CapabilityCard title={copy.noLineups} description={copy.noLineupsDesc} />
              )}
            </section>

            <section className="space-y-3">
              <SectionTitle>{copy.fixtureStats}</SectionTitle>
              {query.data.data.stats ? (
                <StatBars items={query.data.data.stats} />
              ) : (
                <CapabilityCard title={copy.noStats} description={copy.noStatsDesc} />
              )}
            </section>
          </>
        ) : null}
      </div>
    </AppShell>
  );
}
