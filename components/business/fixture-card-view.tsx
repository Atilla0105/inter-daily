"use client";

import Link from "next/link";
import { Bell, Clock3, MapPin } from "lucide-react";

import { useTimeZone } from "@/hooks/use-timezone";
import { useAppLanguage } from "@/hooks/use-app-language";

import { Card } from "@/components/base/card";
import { Chip } from "@/components/base/chip";
import type { FixtureCard } from "@/lib/types";

export function FixtureCardView({ fixture }: { fixture: FixtureCard }) {
  const timeZone = useTimeZone();
  const { getCompetitionLabel, getMatchStatusLabel, formatUiCountdown, formatUiMonthDayTime, copy } = useAppLanguage();

  return (
    <Link href={`/fixtures/${fixture.id}`}>
      <Card interactive className="p-4">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs tracking-[0.18em] text-text-muted">{getCompetitionLabel(fixture.competition)}</p>
            <p className="mt-1 text-sm font-medium text-text-primary">{fixture.round}</p>
          </div>
          <Chip tone={fixture.statusTone === "live" ? "live" : fixture.statusTone} pulse={fixture.statusTone === "live"}>
            {getMatchStatusLabel(fixture.status)}
          </Chip>
        </div>
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-2">
            <p className="text-base font-semibold text-text-primary">{fixture.homeTeam.shortName}</p>
            <p className="text-base font-semibold text-text-primary">{fixture.awayTeam.shortName}</p>
          </div>
          <div className="text-right">
            <p className="numeric text-3xl font-semibold text-text-primary">
              {fixture.homeTeam.score ?? "-"}:{fixture.awayTeam.score ?? "-"}
            </p>
            <p className="mt-1 text-xs text-text-secondary">
              {fixture.status === "SCHEDULED" ? formatUiCountdown(fixture.kickoffAtUtc) : getMatchStatusLabel(fixture.status)}
            </p>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-3 text-xs text-text-secondary">
          <span className="inline-flex items-center gap-1.5">
            <Clock3 className="h-3.5 w-3.5" />
            {formatUiMonthDayTime(fixture.kickoffAtUtc, timeZone)}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5" />
            {fixture.venue}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Bell className="h-3.5 w-3.5" />
            {fixture.hasReminder ? copy.reminderOn : copy.reminderOff}
          </span>
        </div>
      </Card>
    </Link>
  );
}
