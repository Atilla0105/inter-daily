import { ArrowUpRight, ShieldAlert, Siren, Sparkles } from "lucide-react";

import { Card } from "@/components/base/card";
import type { ChangeAlert } from "@/lib/types";

const iconMap = {
  injury: ShieldAlert,
  transfer: Sparkles,
  ranking: ArrowUpRight,
  suspension: ShieldAlert,
  lineup: Sparkles,
  result: ArrowUpRight,
  news: Sparkles,
  "fixture-time": Siren
} as const;

export function ChangeFeed({ items }: { items: ChangeAlert[] }) {
  return (
    <div className="space-y-3">
      {items.map((item) => {
        const Icon = iconMap[item.type] ?? Sparkles;
        return (
          <Card key={item.id} className="p-4">
            <div className="flex items-start gap-3">
              <div className="mt-1 flex h-10 w-10 items-center justify-center rounded-full bg-white/5 text-text-secondary">
                <Icon className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-sm font-semibold text-text-primary">{item.title}</h3>
                  <span className="text-[11px] uppercase tracking-[0.16em] text-text-muted">{item.severity}</span>
                </div>
                <p className="mt-2 text-sm leading-6 text-text-secondary">{item.detail}</p>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
