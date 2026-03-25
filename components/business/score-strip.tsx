"use client";

import { useTimeZone } from "@/hooks/use-timezone";
import { useAppLanguage } from "@/hooks/use-app-language";

import { Card } from "@/components/base/card";
import { Chip } from "@/components/base/chip";
import { TeamCrest } from "@/components/base/team-crest";
import type { FixtureCard } from "@/lib/types";

export function ScoreStrip({ fixture, label }: { fixture: FixtureCard; label?: string }) {
  const timeZone = useTimeZone();
  const { copy, getCompetitionLabel, getMatchStatusLabel, formatUiMonthDayTime } = useAppLanguage();

  return (
    <Card className="p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <p className="text-xs tracking-[0.18em] text-text-muted">{label ?? copy.scoreLastResult}</p>
        <Chip tone={fixture.statusTone === "live" ? "live" : fixture.statusTone}>
          {getMatchStatusLabel(fixture.status)}
        </Chip>
      </div>
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm text-text-secondary">{getCompetitionLabel(fixture.competition)}</p>
          <div className="mt-2 space-y-2">
            <div className="flex items-center gap-2.5">
              <TeamCrest team={fixture.homeTeam} size="sm" />
              <p className="text-base font-semibold text-text-primary">{fixture.homeTeam.shortName}</p>
            </div>
            <div className="flex items-center gap-2.5">
              <TeamCrest team={fixture.awayTeam} size="sm" />
              <p className="text-base font-semibold text-text-primary">{fixture.awayTeam.shortName}</p>
            </div>
          </div>
          <p className="mt-2 text-sm text-text-secondary">{formatUiMonthDayTime(fixture.kickoffAtUtc, timeZone)}</p>
        </div>
        <p className="numeric text-3xl font-semibold text-text-primary">
          {fixture.homeTeam.score ?? "-"}:{fixture.awayTeam.score ?? "-"}
        </p>
      </div>
    </Card>
  );
}
