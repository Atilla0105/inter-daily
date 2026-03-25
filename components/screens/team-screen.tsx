"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useState } from "react";

import { AppShell } from "@/components/base/app-shell";
import { Card } from "@/components/base/card";
import { EmptyState } from "@/components/base/empty-state";
import { OfflineBadge } from "@/components/base/offline-badge";
import { ErrorPanel, LoadingCards, StalePanel } from "@/components/base/resource-panels";
import { SectionTitle } from "@/components/base/section-title";
import { SegmentedTabs } from "@/components/base/segmented-tabs";
import { SocialFeedList } from "@/components/business/social-feed-list";
import { corePlayerProfiles, headCoachProfile, mirroredSocialAccounts } from "@/lib/data/social";
import { apiEnvelopeSchema, socialFeedItemSchema, squadPlayerSchema } from "@/lib/schemas";
import { fetchApi } from "@/lib/services/api";
import type { SquadPlayer } from "@/lib/types";
import { useAppLanguage } from "@/hooks/use-app-language";
import { useNetworkStatus } from "@/hooks/use-network-status";
import { useTimeZone } from "@/hooks/use-timezone";

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

function translateRoleLabel(roleLabel: string, language: "zh" | "ug") {
  if (language === "zh") {
    return roleLabel;
  }

  const roleMap: Record<string, string> = {
    主力门将: "ئاساسىي ۋاراتار",
    机动中卫: "يۆتكىلىشچان ئوتتۇرا ئارقا",
    防线中枢: "مۇداپىئە مەركىزى",
    左中卫核心: "سول ئوتتۇرا ئارقا يادروسى",
    右翼卫: "ئوڭ قانات ئارقا",
    左翼卫: "سول قانات ئارقا",
    中场推进核心: "ئوتتۇرا سەپ ئىلگىرى سۈرۈش يادروسى",
    中场节拍器: "ئوتتۇرا سەپ رىتىم باشقۇرغۇچى",
    经验型中场: "تەجرىبىلىك ئوتتۇرا سەپ",
    前插型中场: "ئالغا سىڭىدىغان ئوتتۇرا سەپ",
    锋线主力: "ئاساسىي ھۇجۇمچى",
    "队长 / 中锋": "كاپىتان / مەركىزىي ھۇجۇمچى"
  };

  return roleMap[roleLabel] ?? roleLabel;
}

export function TeamScreen() {
  const isOnline = useNetworkStatus();
  const timeZone = useTimeZone();
  const { copy, language, getPlayerStatusLabel, getPositionLabel } = useAppLanguage();
  const sourceOptions = [
    { label: copy.filterAll, value: "all" },
    { label: language === "ug" ? "كۇلۇب" : "俱乐部", value: "club" },
    { label: language === "ug" ? "توپچى" : "球员", value: "player" }
  ] as const;
  const [sourceType, setSourceType] = useState<(typeof sourceOptions)[number]["value"]>("all");

  const socialQuery = useQuery({
    queryKey: ["social-feed", sourceType],
    queryFn: () => fetchApi(`/api/social?sourceType=${sourceType}&limit=12`, apiEnvelopeSchema(socialFeedItemSchema.array()))
  });

  const squadQuery = useQuery({
    queryKey: ["team-squad-hub"],
    queryFn: () => fetchApi("/api/team/squad", apiEnvelopeSchema(squadPlayerSchema.array()))
  });

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

  return (
    <AppShell pathname="/live">
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <OfflineBadge offline={!isOnline} />
          <Link href="/squad" className="rounded-full border border-border-subtle px-4 py-2 text-sm text-text-secondary">
            {copy.teamFullSquad}
          </Link>
        </div>

        {socialQuery.isLoading && !socialQuery.data ? <LoadingCards lines={3} /> : null}
        {socialQuery.isError ? <ErrorPanel title={copy.teamSocialError} detail={copy.teamSocialErrorDesc} /> : null}
        {socialQuery.data?.stale || squadQuery.data?.stale ? (
          <StalePanel syncedAt={socialQuery.data?.syncedAt ?? squadQuery.data?.syncedAt ?? new Date().toISOString()} />
        ) : null}

        <section className="space-y-3">
          <SectionTitle>{copy.coach}</SectionTitle>
          <Card className="p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-lg font-semibold text-text-primary">{headCoachProfile.name}</p>
                <p className="mt-1 text-sm text-brand-primary">{copy.coach}</p>
              </div>
              <span className="rounded-full bg-accent-gold-soft px-3 py-1 text-xs font-medium text-accent-gold">
                {language === "ug" ? "بىرىنچى سەپ" : headCoachProfile.badge}
              </span>
            </div>
            <p className="mt-4 text-sm leading-6 text-text-secondary">{copy.teamInfoDesc}</p>
          </Card>
        </section>

        <section className="space-y-3">
          <SectionTitle action={<span className="text-xs text-text-muted">{copy.coreNote}</span>}>
            {copy.coreTwelve}
          </SectionTitle>
          {squadQuery.isLoading && !squadQuery.data ? <LoadingCards lines={3} /> : null}
          {squadQuery.isError ? <ErrorPanel title={copy.teamNoSquad} detail={copy.teamNoSquadDesc} /> : null}

          <div className="grid grid-cols-2 gap-4">
            {corePlayers.map(({ profile, player, socialAccount }) => (
              <Card key={profile.displayName} className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-base font-semibold text-text-primary">{player?.name ?? profile.displayName}</p>
                    <p className="mt-1 text-xs text-brand-primary">{translateRoleLabel(profile.roleLabel, language)}</p>
                  </div>
                  <div className="text-right">
                    <p className="numeric text-xl font-semibold text-text-primary">
                      {player?.shirtNumber ? `#${player.shirtNumber}` : "--"}
                    </p>
                    <p className="mt-1 text-[11px] text-text-muted">
                      {player?.positionGroup ? getPositionLabel(player.positionGroup) : copy.syncPending}
                    </p>
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
                    {player?.status ? getPlayerStatusLabel(player.status) : copy.syncPending}
                  </span>
                  {socialAccount ? (
                    <span className="rounded-full bg-brand-soft px-2.5 py-1 text-[11px] font-medium text-brand-primary">
                      @{socialAccount.sourceAccount}
                    </span>
                  ) : null}
                </div>

                <p className="mt-3 text-xs leading-5 text-text-muted">
                  {player
                    ? `${player.nationality} · ${getPlayerStatusLabel(player.status)}${
                        player.birthDate ? ` · ${copy.birthYear(player.birthDate.slice(0, 4))}` : ""
                      }`
                    : copy.syncPendingDesc}
                </p>
              </Card>
            ))}
          </div>
        </section>

        <section className="space-y-3">
          <SectionTitle>{copy.teamSocial}</SectionTitle>
          <SegmentedTabs options={sourceOptions} value={sourceType} onChange={setSourceType} compact />

          {socialQuery.data && socialQuery.data.data.length === 0 ? (
            <EmptyState title={copy.teamSocialEmpty} description={copy.teamSocialEmptyDesc} />
          ) : null}

          {socialQuery.data?.data ? <SocialFeedList items={socialQuery.data.data} timeZone={timeZone} /> : null}
        </section>
      </div>
    </AppShell>
  );
}
