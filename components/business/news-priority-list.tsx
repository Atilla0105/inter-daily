"use client";

import Link from "next/link";

import { useAppLanguage } from "@/hooks/use-app-language";

import { Card } from "@/components/base/card";
import { Chip } from "@/components/base/chip";
import type { NewsItem } from "@/lib/types";

export function NewsPriorityList({ items }: { items: NewsItem[] }) {
  const { getNewsCategoryLabel, copy } = useAppLanguage();

  return (
    <div className="space-y-2">
      {items.map((item, index) => (
        <Link key={item.id} href={`/news/${item.id}`}>
          <Card interactive className="p-4">
            <div className="mb-2.5 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Chip tone={item.category === "official" ? "brand" : item.category === "transfers" ? "gold" : "neutral"}>
                  {getNewsCategoryLabel(item.category)}
                </Chip>
                <p className="text-xs text-text-muted">{copy.importantRank(index + 1)}</p>
              </div>
              <p className="text-xs text-text-muted">{item.sourceName}</p>
            </div>
            <h3 className="text-base font-semibold leading-6 text-text-primary">{item.title}</h3>
            <p className="mt-2 text-sm leading-6 text-text-secondary">{item.excerpt}</p>
          </Card>
        </Link>
      ))}
    </div>
  );
}
