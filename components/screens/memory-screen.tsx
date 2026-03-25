"use client";

import { useQuery } from "@tanstack/react-query";

import { AppShell } from "@/components/base/app-shell";
import { Card } from "@/components/base/card";
import { ErrorPanel, LoadingCards } from "@/components/base/resource-panels";
import { MemoryCard } from "@/components/business/memory-card";
import { apiEnvelopeSchema, homePayloadSchema } from "@/lib/schemas";
import { fetchApi } from "@/lib/services/api";

export function MemoryScreen() {
  const query = useQuery({
    queryKey: ["memory-home"],
    queryFn: () => fetchApi("/api/home", apiEnvelopeSchema(homePayloadSchema))
  });

  return (
    <AppShell pathname="/memory">
      <div className="space-y-6">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-accent-gold">Legacy</p>
          <h1 className="mt-2 text-[32px] font-semibold tracking-tight text-text-primary">Nerazzurri Memory</h1>
          <p className="mt-2 text-sm leading-6 text-text-secondary">给老球迷留一块情绪与记忆的空间，而不只是今天的结果。</p>
        </div>
        {query.isLoading ? <LoadingCards lines={2} /> : null}
        {query.isError ? <ErrorPanel title="历史记忆暂不可用" detail="稍后再回来，或者先看首页的记忆卡片。" /> : null}
        {query.data?.data.memoryCard ? <MemoryCard item={query.data.data.memoryCard} /> : null}
        <Card className="p-5">
          <p className="text-sm leading-7 text-text-secondary">
            MVP 阶段的历史内容以聚合卡片和官方来源跳转为主，后续可以扩展 Hall of Fame、传奇球员和“今天在国米历史上”。
          </p>
        </Card>
      </div>
    </AppShell>
  );
}
