"use client";

import { useTimeZone } from "@/hooks/use-timezone";
import { useAppLanguage } from "@/hooks/use-app-language";

import { Card } from "@/components/base/card";
import { Chip } from "@/components/base/chip";
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
          <p className="mt-1 text-lg font-semibold text-text-primary">
            {fixture.homeTeam.shortName} vs {fixture.awayTeam.shortName}
          </p>
          <p className="mt-2 text-sm text-text-secondary">{formatUiMonthDayTime(fixture.kickoffAtUtc, timeZone)}</p>
        </div>
        <p className="numeric text-3xl font-semibold text-text-primary">
          {fixture.homeTeam.score ?? "-"}:{fixture.awayTeam.score ?? "-"}
        </p>
      </div>
    </Card>
  );
}
