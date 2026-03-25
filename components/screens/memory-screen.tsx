"use client";

import { useQuery } from "@tanstack/react-query";

import { AppShell } from "@/components/base/app-shell";
import { Card } from "@/components/base/card";
import { ErrorPanel, LoadingCards } from "@/components/base/resource-panels";
import { MemoryCard } from "@/components/business/memory-card";
import { useAppLanguage } from "@/hooks/use-app-language";
import { apiEnvelopeSchema, homePayloadSchema } from "@/lib/schemas";
import { fetchApi } from "@/lib/services/api";

export function MemoryScreen() {
  const { copy } = useAppLanguage();
  const query = useQuery({
    queryKey: ["memory-home"],
    queryFn: () => fetchApi("/api/home", apiEnvelopeSchema(homePayloadSchema))
  });

  return (
    <AppShell pathname="/memory">
      <div className="space-y-6">
        {query.isLoading ? <LoadingCards lines={2} /> : null}
        {query.isError ? <ErrorPanel title={copy.memoryError} detail={copy.memoryErrorDesc} /> : null}
        {query.data?.data.memoryCard ? <MemoryCard item={query.data.data.memoryCard} /> : null}
        <Card className="p-5">
          <p className="text-sm leading-7 text-text-secondary">{copy.memoryFuture}</p>
        </Card>
      </div>
    </AppShell>
  );
}
