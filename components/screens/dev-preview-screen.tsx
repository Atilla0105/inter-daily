import { AppShell } from "@/components/base/app-shell";
import { Card } from "@/components/base/card";
import { Chip } from "@/components/base/chip";
import { ChangeFeed } from "@/components/business/change-feed";
import { MemoryCard } from "@/components/business/memory-card";
import { NextMatchHero } from "@/components/business/next-match-hero";
import { ScoreStrip } from "@/components/business/score-strip";
import { StandingsMiniCard } from "@/components/business/standings-mini-card";
import { changesSeed, memorySeed, rawFixtures, standingsSeed } from "@/lib/data/mock";
import { competitionLabel, countdownLabel, formatKickoff, formatTimeZoneLabel, statusLabel, statusTone } from "@/lib/utils/time";

function previewFixture(widthLabel: string) {
  const seed = rawFixtures[1];
  return {
    id: `${seed.id}-${widthLabel}`,
    competition: seed.competition,
    competitionLabel: competitionLabel(seed.competition),
    round: seed.round,
    venue: seed.venue,
    stage: seed.stage,
    kickoffAtUtc: seed.kickoffAtUtc,
    kickoffDisplay: formatKickoff(seed.kickoffAtUtc, "Asia/Ho_Chi_Minh"),
    localTimeLabel: formatTimeZoneLabel(seed.kickoffAtUtc, "Asia/Ho_Chi_Minh"),
    isHome: seed.isHome,
    status: seed.status,
    statusLabel: statusLabel(seed.status),
    statusTone: statusTone(seed.status),
    homeTeam: seed.homeTeam,
    awayTeam: seed.awayTeam,
    countdownLabel: countdownLabel(seed.kickoffAtUtc),
    keyStory: seed.keyStory,
    hasReminder: true
  } as const;
}

export function DevPreviewScreen() {
  const widths = [360, 390, 430] as const;

  return (
    <AppShell pathname="/dev/preview">
      <div className="space-y-6">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-brand-primary">Preview</p>
          <h1 className="mt-2 text-[32px] font-semibold tracking-tight text-text-primary">组件预览</h1>
          <p className="mt-2 text-sm text-text-secondary">用于检查 360 / 390 / 430 三档宽度下的视觉密度和触摸反馈。</p>
        </div>
        <div className="space-y-4">
          {widths.map((width) => {
            const fixture = previewFixture(`${width}`);
            return (
              <Card key={width} className="p-4">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-text-primary">{width}px</h2>
                  <Chip tone="brand">Preview</Chip>
                </div>
                <div className="mx-auto space-y-4" style={{ width }}>
                  <NextMatchHero fixture={fixture} />
                  <ScoreStrip fixture={fixture} />
                  <StandingsMiniCard standings={standingsSeed} />
                  <ChangeFeed items={changesSeed.slice(0, 2)} />
                  <MemoryCard item={memorySeed} />
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </AppShell>
  );
}
