"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { useAppLanguage } from "@/hooks/use-app-language";

import { Card } from "@/components/base/card";
import { Chip } from "@/components/base/chip";
import type { StandingSummary } from "@/lib/types";

export function StandingsMiniCard({ standings }: { standings: StandingSummary }) {
  const { copy, getCompetitionLabel } = useAppLanguage();

  return (
    <Card>
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <p className="text-xs tracking-[0.18em] text-text-muted">{getCompetitionLabel(standings.competition)}</p>
          <h3 className="mt-1 text-xl font-semibold text-text-primary">{copy.standingsTitle}</h3>
        </div>
        <Chip tone="brand">P{standings.inter.position}</Chip>
      </div>

      <div className="mb-4 grid grid-cols-3 gap-3 rounded-xl bg-bg-secondary/70 p-3">
        <div>
          <p className="text-xs text-text-muted">{copy.standingsPoints}</p>
          <p className="numeric mt-1 text-2xl font-semibold text-text-primary">{standings.inter.points}</p>
        </div>
        <div>
          <p className="text-xs text-text-muted">{copy.standingsLeaderGap}</p>
          <p className="numeric mt-1 text-2xl font-semibold text-text-primary">{standings.inter.gapToLeader}</p>
        </div>
        <div>
          <p className="text-xs text-text-muted">{copy.standingsGoalDiff}</p>
          <p className="numeric mt-1 text-2xl font-semibold text-text-primary">
            {standings.inter.goalsFor - standings.inter.goalsAgainst}
          </p>
        </div>
      </div>

      <div className="space-y-2">
        {standings.rows.slice(0, 5).map((row) => (
          <div
            key={row.teamId}
            className={`flex items-center justify-between rounded-xl px-3 py-2 ${
              row.highlight === "inter" ? "bg-brand-soft" : "bg-white/3"
            }`}
          >
            <div className="flex items-center gap-3">
              <p className="numeric w-5 text-sm text-text-muted">{row.position}</p>
              <p className="text-sm font-medium text-text-primary">{row.teamName}</p>
            </div>
            <p className="numeric text-sm font-semibold text-text-primary">{row.points}</p>
          </div>
        ))}
      </div>

      <Link href="/matches" className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-brand-primary">
        {copy.standingsMore}
        <ArrowRight className="h-4 w-4" />
      </Link>
    </Card>
  );
}
