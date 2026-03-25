"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { type PropsWithChildren, useState } from "react";

import { PreferencesProvider } from "@/hooks/use-preferences";

import { ServiceWorkerRegistrar } from "./service-worker-registrar";

export function AppProviders({ children }: PropsWithChildren) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            refetchOnWindowFocus: false,
            staleTime: 60_000,
            retry: 1
          }
        }
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <PreferencesProvider>
        <ServiceWorkerRegistrar />
        {children}
      </PreferencesProvider>
    </QueryClientProvider>
  );
}
