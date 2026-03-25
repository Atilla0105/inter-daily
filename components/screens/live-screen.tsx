"use client";

import { useQuery } from "@tanstack/react-query";
import { Radio, Star } from "lucide-react";
import { useState } from "react";

import { AppShell } from "@/components/base/app-shell";
import { Card } from "@/components/base/card";
import { EmptyState } from "@/components/base/empty-state";
import { PageHeader } from "@/components/base/page-header";
import { ErrorPanel, LoadingCards, StalePanel } from "@/components/base/resource-panels";
import { SectionTitle } from "@/components/base/section-title";
import { CapabilityCard } from "@/components/business/capability-card";
import { LineupGrid } from "@/components/business/lineup-grid";
import { ScoreStrip } from "@/components/business/score-strip";
import { StatBars } from "@/components/business/stat-bars";
import { TimelineFeed } from "@/components/business/timeline-feed";
import { useNetworkStatus } from "@/hooks/use-network-status";
import { usePreferences } from "@/hooks/use-preferences";
import { useTimeZone } from "@/hooks/use-timezone";
import { apiEnvelopeSchema, fixtureCardSchema, fixtureDetailSchema, homePayloadSchema } from "@/lib/schemas";
import { fetchApi } from "@/lib/services/api";

export function LiveScreen() {
  const timeZone = useTimeZone();
  const isOnline = useNetworkStatus();
  const { preferences, setRating } = usePreferences();
  const [reaction, setReaction] = useState(preferences.reactionPresets[0] ?? "Forza Inter");

  const liveFixturesQuery = useQuery({
    queryKey: ["live-fixtures", timeZone],
    queryFn: () =>
      fetchApi(`/api/fixtures?tz=${encodeURIComponent(timeZone)}&status=live`, apiEnvelopeSchema(fixtureCardSchema.array())),
    refetchInterval: isOnline ? 60_000 : false
  });

  const homeQuery = useQuery({
    queryKey: ["home-live", timeZone],
    queryFn: () => fetchApi(`/api/home?tz=${encodeURIComponent(timeZone)}`, apiEnvelopeSchema(homePayloadSchema))
  });

  const focusFixture = liveFixturesQuery.data?.data[0] ?? homeQuery.data?.data.nextFixture ?? null;

  const detailQuery = useQuery({
    queryKey: ["live-detail", focusFixture?.id, timeZone],
    queryFn: () =>
      fetchApi(`/api/fixtures/${focusFixture?.id}?tz=${encodeURIComponent(timeZone)}`, apiEnvelopeSchema(fixtureDetailSchema)),
    enabled: Boolean(focusFixture?.id),
    refetchInterval: focusFixture?.status === "LIVE" && isOnline ? 60_000 : false
  });

  const detail = detailQuery.data?.data ?? null;

  return (
    <AppShell pathname="/live">
      <div className="space-y-6">
        <PageHeader
          title="Live"
          subtitle="比赛中心会根据当前状态自动切换到 live、赛前或赛后视图。"
          offline={!isOnline}
          status={
            focusFixture ? (
              <span className="inline-flex items-center gap-2 rounded-full bg-live/10 px-3 py-1.5 text-xs text-live">
                <Radio className="h-3.5 w-3.5" />
                {focusFixture.statusLabel}
              </span>
            ) : undefined
          }
        />

        {liveFixturesQuery.isLoading || homeQuery.isLoading ? <LoadingCards lines={2} /> : null}
        {liveFixturesQuery.isError && homeQuery.isError ? (
          <ErrorPanel title="比赛中心暂时不可用" detail="Live 页面没能拿到当前比赛数据，请稍后再试。" />
        ) : null}
        {(liveFixturesQuery.data?.stale || detailQuery.data?.stale) && (
          <StalePanel syncedAt={detailQuery.data?.syncedAt ?? liveFixturesQuery.data?.syncedAt ?? new Date().toISOString()} />
        )}

        {!focusFixture ? (
          <EmptyState title="当前没有比赛焦点" description="比赛日前后会自动切换到最近一场正式比赛。" />
        ) : (
          <>
            <ScoreStrip
              fixture={detail?.fixture ?? focusFixture}
              label={focusFixture.status === "LIVE" ? "实时比分板" : focusFixture.status === "FINISHED" ? "赛后比分板" : "赛前焦点"}
            />

            <Card className="p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-text-muted">Match Story</p>
              <p className="mt-3 text-sm leading-6 text-text-secondary">
                {detail?.summary ?? focusFixture.keyStory ?? "当前没有更多战术叙事，等待比赛同步更新。"}
              </p>
              {detail?.storylines?.length ? (
                <ul className="mt-4 space-y-2">
                  {detail.storylines.map((item) => (
                    <li key={item} className="rounded-xl bg-white/4 px-3 py-2 text-sm text-text-primary">
                      {item}
                    </li>
                  ))}
                </ul>
              ) : null}
            </Card>

            <section className="space-y-3">
              <SectionTitle eyebrow="Timeline">事件时间线</SectionTitle>
              {detailQuery.isLoading ? <LoadingCards lines={2} /> : null}
              {detail?.timeline ? (
                <TimelineFeed items={detail.timeline} />
              ) : (
                <CapabilityCard
                  title="当前数据源暂不提供完整事件流"
                  description="已保留时间线模块位置；接入更强的 sports provider 后，这里会切换成分钟级事件时间线。"
                />
              )}
            </section>

            <section className="space-y-3">
              <SectionTitle eyebrow="Lineups">阵容</SectionTitle>
              {detail?.lineups ? (
                <LineupGrid home={detail.lineups.home} away={detail.lineups.away} />
              ) : (
                <CapabilityCard
                  title="阵容模块已降级"
                  description="football-data.org 在当前 MVP 中只保证基础赛程与比分，首发和替补将由后续 provider 提供。"
                />
              )}
            </section>

            <section className="space-y-3">
              <SectionTitle eyebrow="Stats">技术统计</SectionTitle>
              {detail?.stats ? (
                <StatBars items={detail.stats} />
              ) : (
                <CapabilityCard
                  title="技术统计等待更高阶 provider"
                  description="当前结构已经预留 stats 面板，未来切换数据源时不需要改页面结构。"
                />
              )}
            </section>

            <section className="space-y-3">
              <SectionTitle eyebrow="Fan Reaction">球迷反应块</SectionTitle>
              <Card className="p-4">
                <div className="grid grid-cols-3 gap-2">
                  {preferences.reactionPresets.map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => setReaction(item)}
                      className={`rounded-xl px-3 py-3 text-sm ${
                        reaction === item ? "bg-brand-primary text-white" : "bg-white/4 text-text-secondary"
                      }`}
                    >
                      {item}
                    </button>
                  ))}
                </div>
                <p className="mt-4 text-sm text-text-secondary">当前你的即时反应：{reaction}</p>
              </Card>
            </section>

            <section className="space-y-3">
              <SectionTitle eyebrow="Player Rating">球员评分录入</SectionTitle>
              <Card className="p-4">
                <div className="mb-3 flex items-center gap-2">
                  <Star className="h-4 w-4 text-accent-gold" />
                  <p className="text-sm text-text-secondary">私有评分只保存在本机。</p>
                </div>
                <div className="grid grid-cols-5 gap-2">
                  {[6, 7, 8, 9, 10].map((value) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setRating(focusFixture.id, value)}
                      className={`rounded-xl px-3 py-3 text-sm ${
                        preferences.ratingEntries[focusFixture.id] === value
                          ? "bg-brand-primary text-white"
                          : "bg-white/4 text-text-primary"
                      }`}
                    >
                      {value}.0
                    </button>
                  ))}
                </div>
              </Card>
            </section>
          </>
        )}
      </div>
    </AppShell>
  );
}
