"use client";

import { formatInTimeZone } from "date-fns-tz";
import Image from "next/image";

import { Card } from "@/components/base/card";
import type { SocialFeedItem } from "@/lib/types";

function formatPublishedAt(iso: string, timeZone: string) {
  return formatInTimeZone(iso, timeZone, "MM月dd日 HH:mm");
}

export function SocialFeedList({ items, timeZone }: { items: SocialFeedItem[]; timeZone: string }) {
  return (
    <div className="space-y-3">
      {items.map((item) => (
        <Card key={item.id} className="overflow-hidden p-0" interactive>
          <div className="relative aspect-[4/3] overflow-hidden border-b border-border-subtle bg-bg-secondary">
            {item.thumbnail ? (
              <Image
                src={item.thumbnail}
                alt={`${item.sourceLabel} ${item.postType}`}
                fill
                sizes="(max-width: 430px) 100vw, 430px"
                className="object-cover"
                unoptimized
              />
            ) : null}
            <div className="absolute left-3 top-3 flex gap-2">
              <span className="rounded-full bg-bg-primary/80 px-2.5 py-1 text-[11px] font-medium text-text-primary backdrop-blur">
                @{item.sourceAccount}
              </span>
              <span
                className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${
                  item.postType === "reel" ? "bg-live/15 text-live" : "bg-brand-soft text-brand-primary"
                }`}
              >
                {item.postType === "reel" ? "Reel" : "Post"}
              </span>
            </div>
          </div>

          <div className="space-y-3 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-text-primary">{item.sourceLabel}</p>
                <p className="text-xs text-text-muted">
                  {item.sourceType === "club" ? "俱乐部镜像" : "球员镜像"} · {formatPublishedAt(item.publishedAt, timeZone)}
                </p>
              </div>
            </div>
            <p
              className="text-sm leading-6 text-text-secondary"
              style={{
                display: "-webkit-box",
                WebkitLineClamp: 3,
                WebkitBoxOrient: "vertical",
                overflow: "hidden"
              }}
            >
              {item.caption}
            </p>
          </div>
        </Card>
      ))}
    </div>
  );
}
