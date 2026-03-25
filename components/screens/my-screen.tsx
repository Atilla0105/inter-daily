"use client";

import { useQuery } from "@tanstack/react-query";
import { BellRing, Download, MoonStar, Palette, Smartphone } from "lucide-react";
import { useState } from "react";

import publicEnv from "@/lib/config/public-env";
import { fetchApi } from "@/lib/services/api";
import { apiEnvelopeSchema, homePayloadSchema } from "@/lib/schemas";

import { AppShell } from "@/components/base/app-shell";
import { Card } from "@/components/base/card";
import { OfflineBadge } from "@/components/base/offline-badge";
import { SectionTitle } from "@/components/base/section-title";
import { useAppLanguage } from "@/hooks/use-app-language";
import { useDeviceId } from "@/hooks/use-device-id";
import { useInstallPrompt } from "@/hooks/use-install-prompt";
import { useNetworkStatus } from "@/hooks/use-network-status";
import { usePreferences } from "@/hooks/use-preferences";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replaceAll("-", "+").replaceAll("_", "/");
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}

export function MyScreen() {
  const { preferences, setPreferences, setTheme, setMotion } = usePreferences();
  const { copy, getThemeLabel, getMotionLabel, formatUiDateTime } = useAppLanguage();
  const deviceId = useDeviceId();
  const installPrompt = useInstallPrompt();
  const isOnline = useNetworkStatus();
  const [subscriptionState, setSubscriptionState] = useState<string>(copy.subscriptionIdle);

  const homeQuery = useQuery({
    queryKey: ["my-home-sync"],
    queryFn: () => fetchApi("/api/home", apiEnvelopeSchema(homePayloadSchema))
  });

  async function enablePush() {
    if (!("serviceWorker" in navigator)) {
      setSubscriptionState(copy.subscriptionUnsupported);
      return;
    }

    if (!publicEnv.vapidPublicKey) {
      setSubscriptionState(copy.subscriptionMissingKey);
      return;
    }

    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      setSubscriptionState(copy.subscriptionDenied);
      return;
    }

    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicEnv.vapidPublicKey)
    });

    await fetch("/api/push/subscribe", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        deviceId,
        subscription: subscription.toJSON(),
        preferences: preferences.notifications
      })
    });

    setSubscriptionState(copy.subscriptionReady);
  }

  return (
    <AppShell pathname="/my">
      <div className="space-y-5">
        <div className="flex items-center gap-2">
          <OfflineBadge offline={!isOnline} />
        </div>

        <section className="grid grid-cols-2 gap-2.5">
          <Card className="p-4">
            <p className="text-xs tracking-[0.18em] text-text-muted">{copy.mySaved}</p>
            <p className="numeric mt-2 text-3xl font-semibold text-text-primary">
              {preferences.savedFixtureIds.length + preferences.savedNewsIds.length}
            </p>
            <p className="mt-2 text-sm text-text-secondary">{copy.mySaved}</p>
          </Card>
          <Card className="p-4">
            <p className="text-xs tracking-[0.18em] text-text-muted">{copy.mySync}</p>
            <p className="mt-2 text-sm font-semibold text-text-primary">
              {homeQuery.data?.syncedAt ? copy.mySync : copy.myWaitingSync}
            </p>
            <p className="mt-2 text-sm text-text-secondary">
              {homeQuery.data?.syncedAt ? formatUiDateTime(homeQuery.data.syncedAt) : copy.myNotFetched}
            </p>
          </Card>
        </section>

        <section className="space-y-2.5">
          <SectionTitle>{copy.notifications}</SectionTitle>
          <Card className="space-y-2.5 p-4">
            {[
              ["enabled", copy.notifyAll],
              ["matchReminders", copy.notifyMatch],
              ["liveEvents", copy.notifyLive],
              ["officialNews", copy.notifyNews]
            ].map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() =>
                  setPreferences((current) => ({
                    ...current,
                    notifications: {
                      ...current.notifications,
                      [key]: !current.notifications[key as keyof typeof current.notifications]
                    }
                  }))
                }
                className="flex w-full items-center justify-between rounded-xl bg-white/4 px-4 py-3 text-left"
              >
                <span className="text-sm text-text-primary">{label}</span>
                <span className="text-sm text-text-secondary">
                  {preferences.notifications[key as keyof typeof preferences.notifications] ? copy.on : copy.off}
                </span>
              </button>
            ))}
            <button
              type="button"
              onClick={enablePush}
              className="flex w-full items-center justify-between rounded-xl border border-border-subtle px-4 py-3 text-left"
            >
              <span className="inline-flex items-center gap-2 text-sm text-text-primary">
                <BellRing className="h-4 w-4 text-brand-primary" />
                {copy.pushSubscribe}
              </span>
              <span className="text-sm text-text-secondary">{subscriptionState}</span>
            </button>
          </Card>
        </section>

        <section className="space-y-2.5">
          <SectionTitle>{copy.appearance}</SectionTitle>
          <Card className="space-y-3 p-4">
            <div>
              <p className="mb-3 inline-flex items-center gap-2 text-sm text-text-primary">
                <Palette className="h-4 w-4 text-brand-primary" />
                {copy.darkTheme}
              </p>
              <div className="grid grid-cols-2 gap-2">
                {(["classic", "contrast"] as const).map((theme) => (
                  <button
                    key={theme}
                    type="button"
                    onClick={() => setTheme(theme)}
                    className={`rounded-xl px-4 py-3 text-sm ${
                      preferences.theme === theme ? "bg-brand-primary text-white" : "bg-white/4 text-text-primary"
                    }`}
                  >
                    {getThemeLabel(theme)}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="mb-3 inline-flex items-center gap-2 text-sm text-text-primary">
                <MoonStar className="h-4 w-4 text-brand-primary" />
                {copy.motionDensity}
              </p>
              <div className="grid grid-cols-2 gap-2">
                {(["full", "reduced"] as const).map((motion) => (
                  <button
                    key={motion}
                    type="button"
                    onClick={() => setMotion(motion)}
                    className={`rounded-xl px-4 py-3 text-sm ${
                      preferences.motion === motion ? "bg-brand-primary text-white" : "bg-white/4 text-text-primary"
                    }`}
                  >
                    {getMotionLabel(motion)}
                  </button>
                ))}
              </div>
            </div>
          </Card>
        </section>

        <section className="space-y-2.5">
          <SectionTitle>{copy.pwa}</SectionTitle>
          <Card className="space-y-2.5 p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/5 text-brand-primary">
                <Download className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-text-primary">{copy.addToHome}</p>
                <p className="mt-1 text-sm leading-6 text-text-secondary">{copy.addToHomeDesc}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => installPrompt.promptInstall()}
              disabled={!installPrompt.isSupported}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-brand-primary px-4 py-3 text-sm font-medium text-white disabled:opacity-40"
            >
              <Smartphone className="h-4 w-4" />
              {installPrompt.isSupported ? copy.installPwa : copy.installUnavailable}
            </button>
          </Card>
        </section>
      </div>
    </AppShell>
  );
}
