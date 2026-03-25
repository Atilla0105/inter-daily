"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import { useAppLanguage } from "@/hooks/use-app-language";

import { Card } from "@/components/base/card";
import { Chip } from "@/components/base/chip";
import type { MemoryEntry } from "@/lib/types";

export function MemoryCard({ item }: { item: MemoryEntry }) {
  const { copy } = useAppLanguage();

  return (
    <Card className="overflow-hidden bg-gradient-to-br from-surface to-bg-secondary p-5">
      <div className="mb-3 flex items-center justify-between gap-2">
        <Chip tone="gold">{item.accentLabel}</Chip>
        <p className="text-xs tracking-[0.18em] text-text-muted">{item.seasonLabel}</p>
      </div>
      <h3 className="text-2xl font-semibold tracking-tight text-text-primary">{item.title}</h3>
      <p className="mt-1 text-sm text-accent-gold">{item.subtitle}</p>
      <p className="mt-4 text-sm leading-6 text-text-secondary">{item.blurb}</p>
      <Link href="/memory" className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-text-primary">
        {copy.memoryEnter}
        <ArrowUpRight className="h-4 w-4" />
      </Link>
    </Card>
  );
}
