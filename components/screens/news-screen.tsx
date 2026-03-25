"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

import { AppShell } from "@/components/base/app-shell";
import { EmptyState } from "@/components/base/empty-state";
import { PageHeader } from "@/components/base/page-header";
import { ErrorPanel, LoadingCards, StalePanel } from "@/components/base/resource-panels";
import { SegmentedTabs } from "@/components/base/segmented-tabs";
import { NewsPriorityList } from "@/components/business/news-priority-list";
import { useNetworkStatus } from "@/hooks/use-network-status";
import { apiEnvelopeSchema, newsItemSchema } from "@/lib/schemas";
import { fetchApi } from "@/lib/services/api";

const categoryOptions: { label: string; value: "official" | "matchday" | "transfers" }[] = [
  { label: "Official", value: "official" },
  { label: "Matchday", value: "matchday" },
  { label: "Transfers", value: "transfers" }
] ;

export function NewsScreen() {
  const [category, setCategory] = useState<(typeof categoryOptions)[number]["value"]>("official");
  const isOnline = useNetworkStatus();
  const query = useQuery({
    queryKey: ["news", category],
    queryFn: () => fetchApi(`/api/news?category=${category}`, apiEnvelopeSchema(newsItemSchema.array()))
  });

  return (
    <AppShell pathname="/news">
      <div className="space-y-6">
        <PageHeader title="新闻" subtitle="按官方、比赛日与转会线索过滤阅读。" offline={!isOnline} />
        <SegmentedTabs options={categoryOptions} value={category} onChange={setCategory} compact />

        {query.isLoading ? <LoadingCards lines={3} /> : null}
        {query.isError ? <ErrorPanel title="新闻加载失败" detail="新闻源暂时不可用，请稍后刷新。" /> : null}
        {query.data?.stale ? <StalePanel syncedAt={query.data.syncedAt} /> : null}

        {query.data && query.data.data.length === 0 ? (
          <EmptyState title="该分类暂无内容" description="切换其他标签或稍后再看。" />
        ) : null}

        {query.data?.data ? <NewsPriorityList items={query.data.data} /> : null}
      </div>
    </AppShell>
  );
}
