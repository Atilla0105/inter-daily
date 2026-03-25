"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";

import { AppShell } from "@/components/base/app-shell";
import { ErrorPanel, LoadingCards, StalePanel } from "@/components/base/resource-panels";
import { SectionTitle } from "@/components/base/section-title";
import { NewsPriorityList } from "@/components/business/news-priority-list";
import { usePreferences } from "@/hooks/use-preferences";
import { apiEnvelopeSchema, newsItemSchema } from "@/lib/schemas";
import { fetchApi } from "@/lib/services/api";
import { z } from "zod";

const newsDetailEnvelope = apiEnvelopeSchema(
  newsItemSchema.extend({
    body: z.string(),
    related: newsItemSchema.array()
  })
);

export function NewsDetailScreen({ id }: { id: string }) {
  const { preferences, toggleSavedNews } = usePreferences();
  const query = useQuery({
    queryKey: ["news-detail", id],
    queryFn: () => fetchApi(`/api/news/${id}`, newsDetailEnvelope)
  });

  const saved = preferences.savedNewsIds.includes(id);

  return (
    <AppShell pathname={`/news/${id}`}>
      <div className="space-y-6">
        {query.isLoading ? <LoadingCards lines={3} /> : null}
        {query.isError ? <ErrorPanel title="新闻详情加载失败" detail="请稍后重试或直接打开原文。" /> : null}
        {query.data?.stale ? <StalePanel syncedAt={query.data.syncedAt} /> : null}

        {query.data?.data ? (
          <>
            <div className="space-y-3">
              <p className="text-xs uppercase tracking-[0.18em] text-brand-primary">{query.data.data.sourceName}</p>
              <h1 className="text-[32px] font-semibold leading-tight text-text-primary">{query.data.data.title}</h1>
              <p className="text-sm text-text-secondary">{new Date(query.data.data.publishedAt).toLocaleString("zh-CN")}</p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => toggleSavedNews(id)}
                  className="rounded-full bg-brand-primary px-4 py-2 text-sm font-medium text-white"
                >
                  {saved ? "取消收藏" : "收藏"}
                </button>
                <Link
                  href={query.data.data.canonicalUrl}
                  className="rounded-full border border-border-subtle px-4 py-2 text-sm text-text-secondary"
                >
                  打开原文
                </Link>
              </div>
            </div>

            <div className="rounded-xl2 bg-white/4 p-5 text-sm leading-7 text-text-secondary whitespace-pre-line">
              {query.data.data.body}
            </div>

            <section className="space-y-3">
              <SectionTitle eyebrow="Related">相关内容</SectionTitle>
              <NewsPriorityList items={query.data.data.related} />
            </section>
          </>
        ) : null}
      </div>
    </AppShell>
  );
}
