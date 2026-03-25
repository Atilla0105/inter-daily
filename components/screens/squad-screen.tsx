"use client";

import { useQuery } from "@tanstack/react-query";

import { AppShell } from "@/components/base/app-shell";
import { Card } from "@/components/base/card";
import { ErrorPanel, LoadingCards, StalePanel } from "@/components/base/resource-panels";
import { SectionTitle } from "@/components/base/section-title";
import { useAppLanguage } from "@/hooks/use-app-language";
import { apiEnvelopeSchema, squadPlayerSchema } from "@/lib/schemas";
import { fetchApi } from "@/lib/services/api";

const positionGroups = ["门将", "后卫", "中场", "前锋"] as const;

export function SquadScreen() {
  const { copy, getPlayerStatusLabel, getPositionLabel } = useAppLanguage();
  const query = useQuery({
    queryKey: ["squad"],
    queryFn: () => fetchApi("/api/team/squad", apiEnvelopeSchema(squadPlayerSchema.array()))
  });

  return (
    <AppShell pathname="/squad">
      <div className="space-y-6">
        {query.isLoading ? <LoadingCards lines={3} /> : null}
        {query.isError ? <ErrorPanel title={copy.squadError} detail={copy.squadErrorDesc} /> : null}
        {query.data?.stale ? <StalePanel syncedAt={query.data.syncedAt} /> : null}

        {positionGroups.map((group) => {
          const players = query.data?.data.filter((player) => player.positionGroup === group) ?? [];
          if (players.length === 0) {
            return null;
          }

          return (
            <section key={group} className="space-y-3">
              <SectionTitle>{getPositionLabel(group)}</SectionTitle>
              <div className="space-y-4">
                {players.map((player) => (
                  <Card key={player.id} className="p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-base font-semibold text-text-primary">{player.name}</p>
                        <p className="mt-1 text-sm text-text-secondary">
                          {player.nationality} · {getPlayerStatusLabel(player.status)}
                        </p>
                      </div>
                      <p className="numeric text-2xl font-semibold text-text-primary">#{player.shirtNumber}</p>
                    </div>
                  </Card>
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </AppShell>
  );
}
