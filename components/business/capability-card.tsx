import { Info } from "lucide-react";

import { Card } from "@/components/base/card";

export function CapabilityCard({ title, description }: { title: string; description: string }) {
  return (
    <Card className="border-dashed p-4">
      <div className="flex items-start gap-3">
        <div className="mt-1 flex h-9 w-9 items-center justify-center rounded-full bg-white/5 text-text-secondary">
          <Info className="h-4 w-4" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-text-primary">{title}</h3>
          <p className="mt-2 text-sm leading-6 text-text-secondary">{description}</p>
        </div>
      </div>
    </Card>
  );
}
