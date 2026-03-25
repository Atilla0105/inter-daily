import Link from "next/link";
import { Bell, Clock3, MapPin } from "lucide-react";

import { Card } from "@/components/base/card";
import { Chip } from "@/components/base/chip";
import type { FixtureCard } from "@/lib/types";

export function FixtureCardView({ fixture }: { fixture: FixtureCard }) {
  return (
    <Link href={`/fixtures/${fixture.id}`}>
      <Card interactive className="p-4">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-text-muted">{fixture.competitionLabel}</p>
            <p className="mt-1 text-sm font-medium text-text-primary">{fixture.round}</p>
          </div>
          <Chip tone={fixture.statusTone === "live" ? "live" : fixture.statusTone} pulse={fixture.statusTone === "live"}>
            {fixture.statusLabel}
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
            <p className="mt-1 text-xs text-text-secondary">{fixture.countdownLabel}</p>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-3 text-xs text-text-secondary">
          <span className="inline-flex items-center gap-1.5">
            <Clock3 className="h-3.5 w-3.5" />
            {fixture.kickoffDisplay}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5" />
            {fixture.venue}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Bell className="h-3.5 w-3.5" />
            {fixture.hasReminder ? "已提醒" : "可提醒"}
          </span>
        </div>
      </Card>
    </Link>
  );
}
