"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { z } from "zod";

import { AppShell } from "@/components/base/app-shell";
import { ErrorPanel, LoadingCards, StalePanel } from "@/components/base/resource-panels";
import { SectionTitle } from "@/components/base/section-title";
import { NewsPriorityList } from "@/components/business/news-priority-list";
import { useAppLanguage } from "@/hooks/use-app-language";
import { usePreferences } from "@/hooks/use-preferences";
import { apiEnvelopeSchema, newsItemSchema } from "@/lib/schemas";
import { fetchApi } from "@/lib/services/api";

const newsDetailEnvelope = apiEnvelopeSchema(
  newsItemSchema.extend({
    body: z.string(),
    related: newsItemSchema.array()
  })
);

export function NewsDetailScreen({ id }: { id: string }) {
  const { preferences, toggleSavedNews } = usePreferences();
  const { copy, formatUiDateTime } = useAppLanguage();
  const query = useQuery({
    queryKey: ["news-detail", id],
    queryFn: () => fetchApi(`/api/news/${id}`, newsDetailEnvelope)
  });

  const saved = preferences.savedNewsIds.includes(id);

  return (
    <AppShell pathname={`/news/${id}`}>
      <div className="space-y-6">
        {query.isLoading ? <LoadingCards lines={3} /> : null}
        {query.isError ? <ErrorPanel title={copy.newsDetailError} detail={copy.newsDetailErrorDesc} /> : null}
        {query.data?.stale ? <StalePanel syncedAt={query.data.syncedAt} /> : null}

        {query.data?.data ? (
          <>
            <div className="space-y-3">
              <p className="text-xs tracking-[0.18em] text-brand-primary">{query.data.data.sourceName}</p>
              <h1 className="text-[32px] font-semibold leading-tight text-text-primary">{query.data.data.title}</h1>
              <p className="text-sm text-text-secondary">{formatUiDateTime(query.data.data.publishedAt)}</p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => toggleSavedNews(id)}
                  className="rounded-full bg-brand-primary px-4 py-2 text-sm font-medium text-white"
                >
                  {saved ? copy.unsave : copy.save}
                </button>
                <Link
                  href={query.data.data.canonicalUrl}
                  className="rounded-full border border-border-subtle px-4 py-2 text-sm text-text-secondary"
                >
                  {copy.openSource}
                </Link>
              </div>
            </div>

            <div className="rounded-xl2 whitespace-pre-line bg-white/4 p-5 text-sm leading-7 text-text-secondary">
              {query.data.data.body}
            </div>

            <section className="space-y-3">
              <SectionTitle>{copy.relatedNews}</SectionTitle>
              <NewsPriorityList items={query.data.data.related} />
            </section>
          </>
        ) : null}
      </div>
    </AppShell>
  );
}
