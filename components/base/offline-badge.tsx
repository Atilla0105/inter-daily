"use client";

import { WifiOff } from "lucide-react";

import { useAppLanguage } from "@/hooks/use-app-language";

import { Chip } from "./chip";

export function OfflineBadge({ offline }: { offline: boolean }) {
  const { copy } = useAppLanguage();

  if (!offline) {
    return null;
  }

  return (
    <Chip tone="warning" className="gap-1.5">
      <WifiOff className="h-3.5 w-3.5" />
      {copy.offlineMode}
    </Chip>
  );
}
