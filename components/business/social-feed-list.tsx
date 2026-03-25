"use client";

import Image from "next/image";

import { useAppLanguage } from "@/hooks/use-app-language";

import { Card } from "@/components/base/card";
import type { SocialFeedItem } from "@/lib/types";
import { cn } from "@/lib/utils/cn";

export function SocialFeedList({ items, timeZone }: { items: SocialFeedItem[]; timeZone: string }) {
  const { getSocialPostLabel, getSocialSourceLabel, formatUiMonthDayTime } = useAppLanguage();

  return (
    <div className="space-y-4">
      {items.map((item) => {
        const hasThumbnail = Boolean(item.thumbnail);

        return (
          <Card key={item.id} className={cn(hasThumbnail ? "overflow-hidden p-0" : "p-4")} interactive>
            {hasThumbnail ? (
              <div className="relative aspect-[4/3] overflow-hidden border-b border-border-subtle bg-bg-secondary">
                <Image
                  src={item.thumbnail!}
                  alt={`${item.sourceLabel} ${getSocialPostLabel(item.postType)}`}
                  fill
                  sizes="(max-width: 430px) 100vw, 430px"
                  className="object-cover"
                  unoptimized
                />
                <div className="absolute left-3 top-3 flex gap-2">
                  <span className="rounded-full bg-bg-primary/80 px-2.5 py-1 text-[11px] font-medium text-text-primary backdrop-blur">
                    @{item.sourceAccount}
                  </span>
                  <span
                    className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${
                      item.postType === "reel" ? "bg-live/15 text-live" : "bg-brand-soft text-brand-primary"
                    }`}
                  >
                    {getSocialPostLabel(item.postType)}
                  </span>
                </div>
              </div>
            ) : null}

            <div className={cn("space-y-3", hasThumbnail ? "p-4" : "")}>
              {!hasThumbnail ? (
                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full bg-bg-secondary px-2.5 py-1 text-[11px] font-medium text-text-primary">
                    @{item.sourceAccount}
                  </span>
                  <span
                    className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${
                      item.postType === "reel" ? "bg-live/15 text-live" : "bg-brand-soft text-brand-primary"
                    }`}
                  >
                    {getSocialPostLabel(item.postType)}
                  </span>
                </div>
              ) : null}

              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-text-primary">{item.sourceLabel}</p>
                  <p className="text-xs text-text-muted">
                    {getSocialSourceLabel(item.sourceType)} · {formatUiMonthDayTime(item.publishedAt, timeZone)}
                  </p>
                </div>
              </div>

              <p
                className="text-sm leading-6 text-text-secondary"
                style={{
                  display: "-webkit-box",
                  WebkitLineClamp: hasThumbnail ? 3 : 4,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden"
                }}
              >
                {item.caption}
              </p>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
