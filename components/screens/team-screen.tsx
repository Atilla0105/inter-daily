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
import { corePlayerProfiles, headCoachProfile, mirroredSocialAccounts } from "@/lib/data/social";
import { apiEnvelopeSchema, socialFeedItemSchema, squadPlayerSchema } from "@/lib/schemas";
import { fetchApi } from "@/lib/services/api";
import type { SquadPlayer } from "@/lib/types";
import { useNetworkStatus } from "@/hooks/use-network-status";
import { useTimeZone } from "@/hooks/use-timezone";

const sourceOptions = [
  { label: "全部", value: "all" },
  { label: "俱乐部", value: "club" },
  { label: "球员", value: "player" }
] as const;

function normalizeSearchValue(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function matchSquadPlayer(keywords: readonly string[], players: SquadPlayer[]) {
  return (
    players.find((player) => {
      const haystack = normalizeSearchValue(`${player.name} ${player.nationality}`);
      return keywords.some((keyword) => haystack.includes(normalizeSearchValue(keyword)));
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

  const clubMirrorAccount = mirroredSocialAccounts.find((account) => account.sourceType === "club");
  const corePlayers = corePlayerProfiles.map((profile) => {
    const player = matchSquadPlayer(profile.lookupKeywords, squadQuery.data?.data ?? []);
    const socialAccount = profile.socialAccount
      ? mirroredSocialAccounts.find((account) => account.sourceAccount === profile.socialAccount) ?? null
      : null;

    return {
      profile,
      player,
      socialAccount
    };
  });
  const syncedCorePlayers = corePlayers.filter((item) => item.player).length;

  return (
    <AppShell pathname="/live">
      <div className="space-y-6">
        <PageHeader
          title="球队"
          subtitle="这里集中看球队信息、主教练、12 名主力球员和站内社媒镜像，不再单独保留 Live 页面。"
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
          <SectionTitle eyebrow="Team Desk">球队中枢</SectionTitle>
          <Card elevated className="space-y-4 p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xl font-semibold tracking-tight text-text-primary">FC Internazionale Milano</p>
                <p className="mt-2 text-sm leading-6 text-text-secondary">
                  这是球队控制台，不是泛资讯流。球队信息、主教练视角、12 名主力球员和站内社媒镜像都压缩到一个移动端页面里。
                </p>
              </div>
              <div className="rounded-2xl border border-border-subtle bg-bg-secondary px-3 py-2 text-right">
                <p className="text-[11px] uppercase tracking-[0.2em] text-text-muted">Mirror</p>
                <p className="mt-1 text-sm font-medium text-text-primary">@{clubMirrorAccount?.sourceAccount ?? "inter"}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-white/4 p-3">
                <p className="text-xs uppercase tracking-[0.18em] text-text-muted">球队信息</p>
                <p className="mt-2 text-sm text-text-primary">主教练、主力框架和社媒镜像统一收口。</p>
              </div>
              <div className="rounded-2xl bg-white/4 p-3">
                <p className="text-xs uppercase tracking-[0.18em] text-text-muted">镜像账号</p>
                <p className="mt-2 text-sm text-text-primary">{mirroredSocialAccounts.length} 个账号，面向大陆网络做后端代理。</p>
              </div>
              <div className="rounded-2xl bg-white/4 p-3">
                <p className="text-xs uppercase tracking-[0.18em] text-text-muted">主力框架</p>
                <p className="mt-2 text-sm text-text-primary">固定展示 12 名主力球员，避免阵容接口顺序干扰阅读。</p>
              </div>
              <div className="rounded-2xl bg-white/4 p-3">
                <p className="text-xs uppercase tracking-[0.18em] text-text-muted">当前同步</p>
                <p className="mt-2 text-sm text-text-primary">
                  {syncedCorePlayers}/{corePlayers.length} 名主力已匹配到实时阵容数据。
                </p>
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
          <SectionTitle
            eyebrow="Core 12"
            action={<span className="text-xs text-text-muted">默认主力框架，不等于赛前首发</span>}
          >
            十二名主力球员
          </SectionTitle>
          {squadQuery.isLoading && !squadQuery.data ? <LoadingCards lines={3} /> : null}
          {squadQuery.isError ? <ErrorPanel title="主力球员信息暂不可用" detail="阵容数据暂时没有完成同步。" /> : null}

          <div className="grid grid-cols-2 gap-3">
            {corePlayers.map(({ profile, player, socialAccount }) => (
              <Card key={profile.displayName} className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-base font-semibold text-text-primary">{player?.name ?? profile.displayName}</p>
                    <p className="mt-1 text-xs text-brand-primary">{profile.roleLabel}</p>
                  </div>
                  <div className="text-right">
                    <p className="numeric text-xl font-semibold text-text-primary">
                      {player?.shirtNumber ? `#${player.shirtNumber}` : "--"}
                    </p>
                    <p className="mt-1 text-[11px] text-text-muted">{player?.positionGroup ?? "待同步"}</p>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  <span
                    className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${
                      player?.status === "可出场"
                        ? "bg-success/12 text-success"
                        : player
                          ? "bg-warning/15 text-warning"
                          : "bg-white/6 text-text-muted"
                    }`}
                  >
                    {player?.status ?? "资料补齐中"}
                  </span>
                  {socialAccount ? (
                    <span className="rounded-full bg-brand-soft px-2.5 py-1 text-[11px] font-medium text-brand-primary">
                      @{socialAccount.sourceAccount}
                    </span>
                  ) : null}
                </div>

                <p className="mt-3 text-xs leading-5 text-text-muted">
                  {player
                    ? `${player.nationality} · ${player.status}${player.birthDate ? ` · ${player.birthDate.slice(0, 4)} 年生` : ""}`
                    : "等待阵容接口补齐号码、国籍和状态后自动同步。"}
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
