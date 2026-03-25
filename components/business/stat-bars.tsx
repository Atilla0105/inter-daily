import { Card } from "@/components/base/card";
import type { MatchStat } from "@/lib/types";

function toPercent(value: string) {
  return Number.parseInt(value.replace("%", ""), 10);
}

export function StatBars({ items }: { items: MatchStat[] }) {
  return (
    <div className="space-y-3">
      {items.map((item) => {
        const homeValue = toPercent(item.home) || Number.parseInt(item.home, 10);
        const awayValue = toPercent(item.away) || Number.parseInt(item.away, 10);
        const total = homeValue + awayValue || 1;
        const homeWidth = (homeValue / total) * 100;

        return (
          <Card key={item.label} className="p-4">
            <div className="mb-3 flex items-center justify-between text-sm">
              <span className="numeric font-semibold text-text-primary">{item.home}</span>
              <span className="text-text-secondary">{item.label}</span>
              <span className="numeric font-semibold text-text-primary">{item.away}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-white/5">
              <div className="h-full rounded-full bg-brand-primary" style={{ width: `${homeWidth}%` }} />
            </div>
          </Card>
        );
      })}
    </div>
  );
}
