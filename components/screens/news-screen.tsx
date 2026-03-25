"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

import { AppShell } from "@/components/base/app-shell";
import { EmptyState } from "@/components/base/empty-state";
import { OfflineBadge } from "@/components/base/offline-badge";
import { ErrorPanel, LoadingCards, StalePanel } from "@/components/base/resource-panels";
import { SegmentedTabs } from "@/components/base/segmented-tabs";
import { NewsPriorityList } from "@/components/business/news-priority-list";
import { useAppLanguage } from "@/hooks/use-app-language";
import { useNetworkStatus } from "@/hooks/use-network-status";
import { apiEnvelopeSchema, newsItemSchema } from "@/lib/schemas";
import { fetchApi } from "@/lib/services/api";

export function NewsScreen() {
  const { copy } = useAppLanguage();
  const categoryOptions = [
    { label: copy.newsOfficial, value: "official" },
    { label: copy.newsMatchday, value: "matchday" },
    { label: copy.newsTransfers, value: "transfers" }
  ] as const;

  const [category, setCategory] = useState<(typeof categoryOptions)[number]["value"]>("official");
  const isOnline = useNetworkStatus();
  const query = useQuery({
    queryKey: ["news", category],
    queryFn: () => fetchApi(`/api/news?category=${category}`, apiEnvelopeSchema(newsItemSchema.array()))
  });

  return (
    <AppShell pathname="/news">
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <OfflineBadge offline={!isOnline} />
        </div>
        <SegmentedTabs options={categoryOptions} value={category} onChange={setCategory} compact />

        {query.isLoading ? <LoadingCards lines={3} /> : null}
        {query.isError ? <ErrorPanel title={copy.newsError} detail={copy.newsErrorDesc} /> : null}
        {query.data?.stale ? <StalePanel syncedAt={query.data.syncedAt} /> : null}

        {query.data && query.data.data.length === 0 ? (
          <EmptyState title={copy.newsEmpty} description={copy.newsEmptyDesc} />
        ) : null}

        {query.data?.data ? <NewsPriorityList items={query.data.data} /> : null}
      </div>
    </AppShell>
  );
}
