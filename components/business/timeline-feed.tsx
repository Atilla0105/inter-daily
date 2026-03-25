import { Card } from "@/components/base/card";
import type { TimelineEvent } from "@/lib/types";

export function TimelineFeed({ items }: { items: TimelineEvent[] }) {
  return (
    <div className="space-y-3">
      {items.map((item) => (
        <Card key={item.id} className="p-4">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/5 text-sm font-semibold text-text-primary">
              {item.minute}
              {item.extraMinute ? `+${item.extraMinute}` : ""}
            </div>
            <div>
              <h3 className="text-sm font-semibold text-text-primary">{item.title}</h3>
              {item.description ? <p className="mt-1 text-sm text-text-secondary">{item.description}</p> : null}
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
