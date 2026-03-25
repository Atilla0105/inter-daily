"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useState } from "react";

import { AppShell } from "@/components/base/app-shell";
import { Card } from "@/components/base/card";
import { EmptyState } from "@/components/base/empty-state";
import { PageHeader } from "@/components/base/page-header";
import { ErrorPanel, LoadingCards, StalePanel } from "@/components/base/resource-panels";
import { SectionTitle } from "@/components/base/section-title";
import { SegmentedTabs } from "@/components/base/segmented-tabs";
import { SocialFeedList } from "@/components/business/social-feed-list";
import { headCoachProfile, mirroredSocialAccounts } from "@/lib/data/social";
import { apiEnvelopeSchema, socialFeedItemSchema, squadPlayerSchema } from "@/lib/schemas";
import { fetchApi } from "@/lib/services/api";
import type { MirroredSocialAccount, SquadPlayer } from "@/lib/types";
import { useNetworkStatus } from "@/hooks/use-network-status";
import { useTimeZone } from "@/hooks/use-timezone";

const sourceOptions = [
  { label: "全部", value: "all" },
  { label: "俱乐部", value: "club" },
  { label: "球员", value: "player" }
] as const;

function matchFeaturedPlayer(account: MirroredSocialAccount, players: SquadPlayer[]) {
  const keywords = account.lookupKeywords?.map((keyword) => keyword.toLowerCase()) ?? [account.displayName.toLowerCase()];

  return (
    players.find((player) => {
      const haystack = `${player.name} ${player.nationality}`.toLowerCase();
      return keywords.some((keyword) => haystack.includes(keyword));
    }) ?? null
  );
}

export function TeamScreen() {
  const isOnline = useNetworkStatus();
  const timeZone = useTimeZone();
  const [sourceType, setSourceType] = useState<(typeof sourceOptions)[number]["value"]>("all");

  const socialQuery = useQuery({
    queryKey: ["social-feed", sourceType],
    queryFn: () => fetchApi(`/api/social?sourceType=${sourceType}&limit=12`, apiEnvelopeSchema(socialFeedItemSchema.array()))
  });

  const squadQuery = useQuery({
    queryKey: ["team-squad-hub"],
    queryFn: () => fetchApi("/api/team/squad", apiEnvelopeSchema(squadPlayerSchema.array()))
  });

  const featuredPlayers = mirroredSocialAccounts
    .filter((account) => account.sourceType === "player")
    .map((account) => ({
      account,
      player: matchFeaturedPlayer(account, squadQuery.data?.data ?? [])
    }));

  return (
    <AppShell pathname="/live">
      <div className="space-y-6">
        <PageHeader
          title="球队"
          subtitle="这里不再追 Live，而是集中看球队、主教练、核心球员和站内社媒镜像。"
          offline={!isOnline}
          status={
            <span className="inline-flex items-center rounded-full bg-brand-soft px-3 py-1.5 text-xs text-brand-primary">
              2-6 小时同步
            </span>
          }
          action={
            <Link href="/squad" className="rounded-full border border-border-subtle px-4 py-2 text-sm text-text-secondary">
              完整阵容
            </Link>
          }
        />

        {socialQuery.isLoading && !socialQuery.data ? <LoadingCards lines={3} /> : null}
        {socialQuery.isError ? <ErrorPanel title="社媒镜像暂时不可用" detail="当前无法同步球队社媒内容，请稍后再试。" /> : null}
        {socialQuery.data?.stale || squadQuery.data?.stale ? (
          <StalePanel syncedAt={socialQuery.data?.syncedAt ?? squadQuery.data?.syncedAt ?? new Date().toISOString()} />
        ) : null}

        <section className="space-y-3">
          <SectionTitle eyebrow="Club Desk">球队中枢</SectionTitle>
          <Card elevated className="space-y-4 p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xl font-semibold tracking-tight text-text-primary">FC Internazionale Milano</p>
                <p className="mt-2 text-sm leading-6 text-text-secondary">
                  第三个 Tab 现在改为球队控制台：俱乐部官方镜像、主教练视角和主力球员近况都集中在这里。
                </p>
              </div>
              <div className="rounded-2xl border border-border-subtle bg-bg-secondary px-3 py-2 text-right">
                <p className="text-[11px] uppercase tracking-[0.2em] text-text-muted">Mirror</p>
                <p className="mt-1 text-sm font-medium text-text-primary">@inter</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-white/4 p-3">
                <p className="text-xs uppercase tracking-[0.18em] text-text-muted">内容策略</p>
                <p className="mt-2 text-sm text-text-primary">只读站内镜像，不显示 Instagram 外链。</p>
              </div>
              <div className="rounded-2xl bg-white/4 p-3">
                <p className="text-xs uppercase tracking-[0.18em] text-text-muted">加载方式</p>
                <p className="mt-2 text-sm text-text-primary">缩略图经后端代理，尽量保证中国大陆可访问。</p>
              </div>
            </div>
          </Card>
        </section>

        <section className="space-y-3">
          <SectionTitle eyebrow="Coach">主教练</SectionTitle>
          <Card className="p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-lg font-semibold text-text-primary">{headCoachProfile.name}</p>
                <p className="mt-1 text-sm text-brand-primary">{headCoachProfile.role}</p>
              </div>
              <span className="rounded-full bg-accent-gold-soft px-3 py-1 text-xs font-medium text-accent-gold">
                {headCoachProfile.badge}
              </span>
            </div>
            <p className="mt-4 text-sm leading-6 text-text-secondary">{headCoachProfile.summary}</p>
          </Card>
        </section>

        <section className="space-y-3">
          <SectionTitle eyebrow="Core Players">主力球员</SectionTitle>
          {squadQuery.isLoading && !squadQuery.data ? <LoadingCards lines={2} /> : null}
          {squadQuery.isError ? <ErrorPanel title="主力球员信息暂不可用" detail="阵容数据暂时没有完成同步。" /> : null}

          <div className="grid grid-cols-2 gap-3">
            {featuredPlayers.map(({ account, player }) => (
              <Card key={account.sourceAccount} className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-base font-semibold text-text-primary">{account.displayName}</p>
                    <p className="mt-1 text-xs text-brand-primary">@{account.sourceAccount}</p>
                  </div>
                  <p className="numeric text-xl font-semibold text-text-primary">
                    {player?.shirtNumber ? `#${player.shirtNumber}` : "--"}
                  </p>
                </div>
                <p className="mt-3 text-sm text-text-secondary">{account.roleLabel}</p>
                <p className="mt-2 text-xs leading-5 text-text-muted">
                  {player ? `${player.nationality} · ${player.status}` : account.summary}
                </p>
              </Card>
            ))}
          </div>
        </section>

        <section className="space-y-3">
          <SectionTitle eyebrow="Social Mirror">球队社媒镜像</SectionTitle>
          <SegmentedTabs options={sourceOptions} value={sourceType} onChange={setSourceType} compact />

          {socialQuery.data && socialQuery.data.data.length === 0 ? (
            <EmptyState title="当前没有镜像内容" description="等待下一个同步周期，或稍后刷新再看。" />
          ) : null}

          {socialQuery.data?.data ? <SocialFeedList items={socialQuery.data.data} timeZone={timeZone} /> : null}
        </section>
      </div>
    </AppShell>
  );
}
