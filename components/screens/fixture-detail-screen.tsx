"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";

import { AppShell } from "@/components/base/app-shell";
import { EmptyState } from "@/components/base/empty-state";
import { PageHeader } from "@/components/base/page-header";
import { ErrorPanel, LoadingCards, StalePanel } from "@/components/base/resource-panels";
import { SectionTitle } from "@/components/base/section-title";
import { CapabilityCard } from "@/components/business/capability-card";
import { LineupGrid } from "@/components/business/lineup-grid";
import { ScoreStrip } from "@/components/business/score-strip";
import { StatBars } from "@/components/business/stat-bars";
import { TimelineFeed } from "@/components/business/timeline-feed";
import { useTimeZone } from "@/hooks/use-timezone";
import { apiEnvelopeSchema, fixtureDetailSchema } from "@/lib/schemas";
import { fetchApi } from "@/lib/services/api";

export function FixtureDetailScreen({ id }: { id: string }) {
  const timeZone = useTimeZone();
  const query = useQuery({
    queryKey: ["fixture-detail", id, timeZone],
    queryFn: () =>
      fetchApi(`/api/fixtures/${id}?tz=${encodeURIComponent(timeZone)}`, apiEnvelopeSchema(fixtureDetailSchema))
  });

  return (
    <AppShell pathname={`/fixtures/${id}`}>
      <div className="space-y-6">
        <PageHeader
          title="比赛详情"
          subtitle="比分、时间线、阵容与统计按 provider 能力自动降级。"
          action={
            <Link href="/matches" className="rounded-full border border-border-subtle px-4 py-2 text-sm text-text-secondary">
              返回赛程
            </Link>
          }
        />

        {query.isLoading ? <LoadingCards lines={3} /> : null}
        {query.isError ? <ErrorPanel title="比赛详情加载失败" detail="当前无法读取这场比赛的详细信息。" /> : null}
        {query.data?.stale ? <StalePanel syncedAt={query.data.syncedAt} /> : null}

        {!query.isLoading && !query.data?.data ? (
          <EmptyState title="暂无详情" description="该场比赛尚未生成详细面板。" />
        ) : null}

        {query.data?.data ? (
          <>
            <ScoreStrip fixture={query.data.data.fixture} label="比分与状态" />

            <section className="space-y-3">
              <SectionTitle eyebrow="Summary">比赛摘要</SectionTitle>
              <div className="rounded-xl bg-white/4 p-4 text-sm leading-6 text-text-secondary">{query.data.data.summary}</div>
            </section>

            <section className="space-y-3">
              <SectionTitle eyebrow="Timeline">时间线</SectionTitle>
              {query.data.data.timeline ? (
                <TimelineFeed items={query.data.data.timeline} />
              ) : (
                <CapabilityCard title="当前没有分钟级事件" description="该 provider 不提供完整时间线或比赛尚未进入对应阶段。" />
              )}
            </section>

            <section className="space-y-3">
              <SectionTitle eyebrow="Lineups">阵容</SectionTitle>
              {query.data.data.lineups ? (
                <LineupGrid home={query.data.data.lineups.home} away={query.data.data.lineups.away} />
              ) : (
                <CapabilityCard title="阵容未提供" description="阵容与替补信息将在后续 provider 升级后自动接入。" />
              )}
            </section>

            <section className="space-y-3">
              <SectionTitle eyebrow="Stats">技术统计</SectionTitle>
              {query.data.data.stats ? (
                <StatBars items={query.data.data.stats} />
              ) : (
                <CapabilityCard title="技术统计未提供" description="当前 provider 只提供基础比分与赛果。" />
              )}
            </section>
          </>
        ) : null}
      </div>
    </AppShell>
  );
}
