"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { BookOpenText, Shield, Trophy } from "lucide-react";

import { AppShell } from "@/components/base/app-shell";
import { EmptyState } from "@/components/base/empty-state";
import { PageHeader } from "@/components/base/page-header";
import { ErrorPanel, LoadingCards, StalePanel } from "@/components/base/resource-panels";
import { SectionTitle } from "@/components/base/section-title";
import { ChangeFeed } from "@/components/business/change-feed";
import { MemoryCard } from "@/components/business/memory-card";
import { NewsPriorityList } from "@/components/business/news-priority-list";
import { NextMatchHero } from "@/components/business/next-match-hero";
import { ScoreStrip } from "@/components/business/score-strip";
import { StandingsMiniCard } from "@/components/business/standings-mini-card";
import { useNetworkStatus } from "@/hooks/use-network-status";
import { useTimeZone } from "@/hooks/use-timezone";
import { apiEnvelopeSchema, homePayloadSchema } from "@/lib/schemas";
import { fetchApi } from "@/lib/services/api";

export function HomeScreen() {
  const timeZone = useTimeZone();
  const isOnline = useNetworkStatus();
  const query = useQuery({
    queryKey: ["home", timeZone],
    queryFn: () => fetchApi(`/api/home?tz=${encodeURIComponent(timeZone)}`, apiEnvelopeSchema(homePayloadSchema))
  });

  return (
    <AppShell pathname="/">
      <div className="space-y-6">
        <PageHeader
          title="首页"
          subtitle="10 秒内读完今天最重要的国米变化。"
          offline={!isOnline}
          action={
            <Link
              href="/squad"
              className="rounded-full border border-border-subtle px-4 py-2 text-sm text-text-secondary"
            >
              阵容
            </Link>
          }
        />

        {query.isLoading ? <LoadingCards lines={4} /> : null}
        {query.isError ? <ErrorPanel title="首页加载失败" detail="无法获取首页聚合信息，请稍后再试。" /> : null}
        {query.data?.stale ? <StalePanel syncedAt={query.data.syncedAt} /> : null}

        {query.data?.data ? (
          <>
            {query.data.data.nextFixture ? <NextMatchHero fixture={query.data.data.nextFixture} stale={query.data.stale} /> : null}

            {query.data.data.lastFixture ? (
              <section className="space-y-3">
                <SectionTitle eyebrow="Latest Result">上一场结果</SectionTitle>
                <ScoreStrip fixture={query.data.data.lastFixture} />
              </section>
            ) : null}

            {query.data.data.standingsSummary ? (
              <section className="space-y-3">
                <SectionTitle eyebrow="Standings">迷你积分榜</SectionTitle>
                <StandingsMiniCard standings={query.data.data.standingsSummary} />
              </section>
            ) : null}

            <section className="space-y-3">
              <SectionTitle
                eyebrow="Priority News"
                action={
                  <Link href="/news" className="text-sm font-medium text-brand-primary">
                    全部新闻
                  </Link>
                }
              >
                今日重点新闻
              </SectionTitle>
              {query.data.data.topNews.length > 0 ? (
                <NewsPriorityList items={query.data.data.topNews} />
              ) : (
                <EmptyState title="暂无新闻" description="新闻同步完成后会在这里显示。" icon={<BookOpenText className="h-5 w-5" />} />
              )}
            </section>

            <section className="space-y-3">
              <SectionTitle eyebrow="Change Feed">伤停 / 停赛 / 转会变化</SectionTitle>
              <ChangeFeed items={query.data.data.injuriesAndTransfers} />
            </section>

            <section className="space-y-3">
              <SectionTitle eyebrow="Breaking Changes">关键变化</SectionTitle>
              <ChangeFeed items={query.data.data.changes} />
            </section>

            {query.data.data.memoryCard ? (
              <section className="space-y-3">
                <SectionTitle eyebrow="Legacy">Nerazzurri Memory</SectionTitle>
                <MemoryCard item={query.data.data.memoryCard} />
              </section>
            ) : null}

            <section className="grid grid-cols-3 gap-3">
              <Link href="/matches" className="rounded-xl bg-white/4 p-4">
                <Trophy className="mb-3 h-5 w-5 text-brand-primary" />
                <p className="text-sm font-medium text-text-primary">赛程</p>
              </Link>
              <Link href="/live" className="rounded-xl bg-white/4 p-4">
                <Shield className="mb-3 h-5 w-5 text-brand-primary" />
                <p className="text-sm font-medium text-text-primary">Live</p>
              </Link>
              <Link href="/memory" className="rounded-xl bg-white/4 p-4">
                <BookOpenText className="mb-3 h-5 w-5 text-accent-gold" />
                <p className="text-sm font-medium text-text-primary">历史</p>
              </Link>
            </section>
          </>
        ) : null}
      </div>
    </AppShell>
  );
}
