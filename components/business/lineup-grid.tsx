"use client";

import { useAppLanguage } from "@/hooks/use-app-language";

import { Card } from "@/components/base/card";
import type { TeamLineup } from "@/lib/types";

function TeamBlock({ title, lineup }: { title: string; lineup: TeamLineup }) {
  return (
    <Card className="p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-text-primary">{title}</p>
          <p className="text-xs text-text-secondary">
            {lineup.formation} · {lineup.coach}
          </p>
        </div>
      </div>
      <div className="space-y-2">
        {lineup.starters.map((player) => (
          <div key={player.id} className="flex items-center justify-between rounded-xl bg-white/3 px-3 py-2">
            <p className="text-sm text-text-primary">{player.name}</p>
            <p className="numeric text-sm text-text-secondary">#{player.number}</p>
          </div>
        ))}
      </div>
    </Card>
  );
}

export function LineupGrid({ home, away }: { home: TeamLineup; away: TeamLineup }) {
  const { language } = useAppLanguage();

  return (
    <div className="grid gap-3">
      <TeamBlock title={language === "ug" ? "ئۆي مەيدانى تىزىملىكى" : "主队阵容"} lineup={home} />
      <TeamBlock title={language === "ug" ? "مېھمان تىزىملىكى" : "客队阵容"} lineup={away} />
    </div>
  );
}
