"use client";

/* eslint-disable @next/next/no-img-element */

import { useMemo, useState } from "react";

import type { FixtureTeam } from "@/lib/types";
import { cn } from "@/lib/utils/cn";

const sizeClasses = {
  sm: "h-8 w-8",
  md: "h-10 w-10",
  lg: "h-12 w-12"
} as const;

function buildMonogram(team: FixtureTeam) {
  const source = team.shortName || team.name;
  const sanitized = source.replace(/[^A-Za-z0-9\u00C0-\u024F\u4E00-\u9FFF]/g, " ").trim();
  const parts = sanitized.split(/\s+/).filter(Boolean);

  if (parts.length >= 2) {
    return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
  }

  return (parts[0] ?? source).slice(0, 2).toUpperCase();
}

export function TeamCrest({
  team,
  size = "md",
  className
}: {
  team: FixtureTeam;
  size?: keyof typeof sizeClasses;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  const monogram = useMemo(() => buildMonogram(team), [team]);
  const src = team.crestUrl && !failed ? team.crestUrl : null;

  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center overflow-hidden rounded-full border border-border-subtle bg-bg-secondary/90",
        sizeClasses[size],
        className
      )}
      aria-hidden="true"
    >
      {src ? (
        <img
          src={src}
          alt={`${team.shortName || team.name} crest`}
          className="h-full w-full object-contain p-1"
          loading="lazy"
          referrerPolicy="no-referrer"
          onError={() => setFailed(true)}
        />
      ) : (
        <span className="text-[10px] font-semibold tracking-[0.08em] text-text-secondary">{monogram}</span>
      )}
    </div>
  );
}
