"use client";

import { AlertTriangle, LoaderCircle } from "lucide-react";

import { useAppLanguage } from "@/hooks/use-app-language";

import { Card } from "./card";

export function LoadingCards({ lines = 3 }: { lines?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: lines }).map((_, index) => (
        <Card key={index} className="animate-pulse p-4">
          <div className="h-4 w-24 rounded bg-white/8" />
          <div className="mt-4 h-6 w-3/4 rounded bg-white/8" />
          <div className="mt-3 h-4 w-full rounded bg-white/8" />
          <div className="mt-2 h-4 w-2/3 rounded bg-white/8" />
        </Card>
      ))}
    </div>
  );
}

export function ErrorPanel({ title, detail }: { title: string; detail: string }) {
  return (
    <Card className="p-5">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-danger/10 text-danger">
          <AlertTriangle className="h-5 w-5" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-text-primary">{title}</h3>
          <p className="mt-2 text-sm leading-6 text-text-secondary">{detail}</p>
        </div>
      </div>
    </Card>
  );
}

export function StalePanel({ syncedAt }: { syncedAt: string }) {
  const { copy, formatUiDateTime } = useAppLanguage();

  return (
    <Card className="mb-4 border-warning/30 bg-warning/10 p-3">
      <div className="flex items-center gap-2 text-sm text-warning">
        <LoaderCircle className="h-4 w-4" />
        {copy.stalePrefix} {formatUiDateTime(syncedAt)}
      </div>
    </Card>
  );
}
