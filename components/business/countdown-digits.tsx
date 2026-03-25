"use client";

import { useAppLanguage } from "@/hooks/use-app-language";

import { Card } from "@/components/base/card";

export function CountdownDigits({ label }: { label?: string | null }) {
  const { copy } = useAppLanguage();
  const parts = (label ?? copy.awaitingSchedule).split(" ");

  return (
    <div className="grid grid-cols-2 gap-2">
      {parts.slice(0, 2).map((part, index) => (
        <Card key={`${part}-${index}`} className="rounded-xl bg-bg-secondary/80 p-3">
          <p className="numeric text-lg font-semibold text-text-primary">{part}</p>
        </Card>
      ))}
    </div>
  );
}
