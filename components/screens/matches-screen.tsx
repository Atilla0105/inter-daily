"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

import { AppShell } from "@/components/base/app-shell";
import { EmptyState } from "@/components/base/empty-state";
import { PageHeader } from "@/components/base/page-header";
import { ErrorPanel, LoadingCards, StalePanel } from "@/components/base/resource-panels";
import { SectionTitle } from "@/components/base/section-title";
import { SegmentedTabs } from "@/components/base/segmented-tabs";
import { FixtureCardView } from "@/components/business/fixture-card-view";
import { useNetworkStatus } from "@/hooks/use-network-status";
import { useTimeZone } from "@/hooks/use-timezone";
import { apiEnvelopeSchema, fixtureCardSchema } from "@/lib/schemas";
import { fetchApi } from "@/lib/services/api";

const competitionOptions: { label: string; value: "all" | "serie-a" | "ucl" | "coppa-italia" }[] = [
  { label: "全部", value: "all" },
  { label: "意甲", value: "serie-a" },
  { label: "欧冠", value: "ucl" },
  { label: "意杯", value: "coppa-italia" }
] ;

const statusOptions: { label: string; value: "upcoming" | "finished" | "all" }[] = [
  { label: "Upcoming", value: "upcoming" },
  { label: "Finished", value: "finished" },
  { label: "All", value: "all" }
] ;

export function MatchesScreen() {
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
      <div className="space-y-6">
        <PageHeader
          title="赛程"
          subtitle={`全部时间已转换为 ${timeZone.replace("_", " ")}。`}
          offline={!isOnline}
        />

        <div className="space-y-3">
          <SectionTitle eyebrow="Competitions">赛事筛选</SectionTitle>
          <SegmentedTabs options={competitionOptions} value={competition} onChange={setCompetition} compact />
          <SegmentedTabs options={statusOptions} value={status} onChange={setStatus} compact />
        </div>

        {query.isLoading ? <LoadingCards lines={3} /> : null}
        {query.isError ? <ErrorPanel title="赛程同步失败" detail="无法载入赛程列表，请稍后再试。" /> : null}
        {query.data?.stale ? <StalePanel syncedAt={query.data.syncedAt} /> : null}

        {query.data && query.data.data.length === 0 ? (
          <EmptyState title="当前筛选下暂无比赛" description="切换赛事或时间状态后再看一下。" />
        ) : null}

        <div className="space-y-3">
          {query.data?.data.map((fixture) => <FixtureCardView key={fixture.id} fixture={fixture} />)}
        </div>
      </div>
    </AppShell>
  );
}
