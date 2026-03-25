"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

import { AppShell } from "@/components/base/app-shell";
import { EmptyState } from "@/components/base/empty-state";
import { OfflineBadge } from "@/components/base/offline-badge";
import { ErrorPanel, LoadingCards, StalePanel } from "@/components/base/resource-panels";
import { SectionTitle } from "@/components/base/section-title";
import { SegmentedTabs } from "@/components/base/segmented-tabs";
import { FixtureCardView } from "@/components/business/fixture-card-view";
import { useAppLanguage } from "@/hooks/use-app-language";
import { useNetworkStatus } from "@/hooks/use-network-status";
import { useTimeZone } from "@/hooks/use-timezone";
import { apiEnvelopeSchema, fixtureCardSchema } from "@/lib/schemas";
import { fetchApi } from "@/lib/services/api";

export function MatchesScreen() {
  const { copy, getCompetitionLabel } = useAppLanguage();
  const competitionOptions = [
    { label: copy.filterAll, value: "all" },
    { label: getCompetitionLabel("serie-a"), value: "serie-a" },
    { label: getCompetitionLabel("ucl"), value: "ucl" },
    { label: getCompetitionLabel("coppa-italia"), value: "coppa-italia" }
  ] as const;
  const statusOptions = [
    { label: copy.filterUpcoming, value: "upcoming" },
    { label: copy.filterFinished, value: "finished" },
    { label: copy.filterAll, value: "all" }
  ] as const;

  const [competition, setCompetition] = useState<(typeof competitionOptions)[number]["value"]>("all");
  const [status, setStatus] = useState<(typeof statusOptions)[number]["value"]>("upcoming");
  const timeZone = useTimeZone();
  const isOnline = useNetworkStatus();

  const query = useQuery({
    queryKey: ["fixtures", timeZone, competition, status],
    queryFn: () =>
      fetchApi(
        `/api/fixtures?tz=${encodeURIComponent(timeZone)}&competition=${competition}&status=${status}`,
        apiEnvelopeSchema(fixtureCardSchema.array())
      )
  });

  return (
    <AppShell pathname="/matches">
      <div className="space-y-5">
        <div className="flex flex-wrap items-center gap-2">
          <OfflineBadge offline={!isOnline} />
          <span className="text-sm text-text-secondary">{copy.matchesLocalTime(timeZone)}</span>
        </div>

        <div className="space-y-2.5">
          <SectionTitle>{copy.filterCompetitions}</SectionTitle>
          <SegmentedTabs options={competitionOptions} value={competition} onChange={setCompetition} compact />
          <SegmentedTabs options={statusOptions} value={status} onChange={setStatus} compact />
        </div>

        {query.isLoading ? <LoadingCards lines={3} /> : null}
        {query.isError ? <ErrorPanel title={copy.matchesError} detail={copy.matchesErrorDesc} /> : null}
        {query.data?.stale ? <StalePanel syncedAt={query.data.syncedAt} /> : null}

        {query.data && query.data.data.length === 0 ? (
          <EmptyState title={copy.matchesEmpty} description={copy.matchesEmptyDesc} />
        ) : null}

        <div className="space-y-2.5">
          {query.data?.data.map((fixture) => <FixtureCardView key={fixture.id} fixture={fixture} />)}
        </div>
      </div>
    </AppShell>
  );
}
