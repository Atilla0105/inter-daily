"use client";

import Link from "next/link";
import { ArrowUpRight, BellPlus } from "lucide-react";

import { useTimeZone } from "@/hooks/use-timezone";
import { useAppLanguage } from "@/hooks/use-app-language";

import { Card } from "@/components/base/card";
import { Chip } from "@/components/base/chip";
import { TeamCrest } from "@/components/base/team-crest";
import type { FixtureCard } from "@/lib/types";

import { CountdownDigits } from "./countdown-digits";

export function NextMatchHero({ fixture, stale = false }: { fixture: FixtureCard; stale?: boolean }) {
  const timeZone = useTimeZone();
  const { copy, getCompetitionLabel, getMatchStatusLabel, formatUiCountdown, formatUiTimeZoneLabel } = useAppLanguage();

  return (
    <Card elevated className="overflow-hidden rounded-xl3 p-5">
      <div className="mb-5 flex items-start justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Chip tone={fixture.statusTone === "live" ? "live" : "brand"} pulse={fixture.statusTone === "live"}>
            {getMatchStatusLabel(fixture.status)}
          </Chip>
          <Chip tone="neutral">{getCompetitionLabel(fixture.competition)}</Chip>
          {stale ? <Chip tone="warning">{copy.cacheFallback}</Chip> : null}
        </div>
        <button
          type="button"
          className="flex h-11 w-11 items-center justify-center rounded-full border border-border-subtle bg-white/5 text-text-primary"
          aria-label={copy.reminderSettings}
        >
          <BellPlus className="h-5 w-5" />
        </button>
      </div>

      <div className="mb-4">
        <p className="text-sm text-text-secondary">{fixture.round}</p>
        <div className="mt-2 flex items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-3">
              <TeamCrest team={fixture.homeTeam} size="lg" />
              <h2 className="text-[30px] font-semibold tracking-tight text-text-primary">{fixture.homeTeam.shortName}</h2>
            </div>
            <p className="pl-[60px] pt-1 text-xs tracking-[0.16em] text-text-muted">vs</p>
            <div className="mt-1 flex items-center gap-3">
              <TeamCrest team={fixture.awayTeam} size="lg" />
              <h2 className="text-[30px] font-semibold tracking-tight text-text-primary">{fixture.awayTeam.shortName}</h2>
            </div>
          </div>
          <div className="min-w-[88px] text-right">
            <p className="numeric text-[44px] font-semibold leading-none text-text-primary">
              {fixture.homeTeam.score ?? "-"}:{fixture.awayTeam.score ?? "-"}
            </p>
            <p className="mt-2 text-xs text-text-secondary">{formatUiTimeZoneLabel(fixture.kickoffAtUtc, timeZone)}</p>
          </div>
        </div>
      </div>

      <p className="mb-4 text-sm leading-6 text-text-secondary">{fixture.keyStory}</p>

      <div className="mb-5">
        <CountdownDigits
          label={fixture.status === "SCHEDULED" ? formatUiCountdown(fixture.kickoffAtUtc) : getMatchStatusLabel(fixture.status)}
        />
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-border-subtle pt-4">
        <div>
          <p className="text-xs tracking-[0.16em] text-text-muted">{fixture.stage}</p>
          <p className="mt-1 text-sm text-text-secondary">{fixture.venue}</p>
        </div>
        <Link
          href={`/fixtures/${fixture.id}`}
          className="inline-flex items-center gap-2 rounded-full bg-brand-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-hover"
        >
          {copy.matchDetail}
          <ArrowUpRight className="h-4 w-4" />
        </Link>
      </div>
    </Card>
  );
}
