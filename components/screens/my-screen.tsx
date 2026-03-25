"use client";

import { useQuery } from "@tanstack/react-query";
import { BellRing, Download, MoonStar, Palette, Smartphone } from "lucide-react";
import { useState } from "react";

import env from "@/lib/config/env";
import { fetchApi } from "@/lib/services/api";
import { apiEnvelopeSchema, homePayloadSchema } from "@/lib/schemas";

import { AppShell } from "@/components/base/app-shell";
import { Card } from "@/components/base/card";
import { PageHeader } from "@/components/base/page-header";
import { SectionTitle } from "@/components/base/section-title";
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
  const deviceId = useDeviceId();
  const installPrompt = useInstallPrompt();
  const isOnline = useNetworkStatus();
  const [subscriptionState, setSubscriptionState] = useState<string>("未订阅");

  const homeQuery = useQuery({
    queryKey: ["my-home-sync"],
    queryFn: () => fetchApi("/api/home", apiEnvelopeSchema(homePayloadSchema))
  });

  async function enablePush() {
    if (!("serviceWorker" in navigator)) {
      setSubscriptionState("当前浏览器不支持");
      return;
    }

    if (!env.vapidPublicKey) {
      setSubscriptionState("缺少 VAPID 公钥");
      return;
    }

    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      setSubscriptionState("通知权限未开启");
      return;
    }

    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(env.vapidPublicKey)
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

    setSubscriptionState("已订阅");
  }

  return (
    <AppShell pathname="/my">
      <div className="space-y-6">
        <PageHeader title="我的" subtitle="本机偏好、本地收藏与 PWA 体验都在这里。" offline={!isOnline} />

        <section className="grid grid-cols-2 gap-3">
          <Card className="p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-text-muted">Saved</p>
            <p className="numeric mt-2 text-3xl font-semibold text-text-primary">
              {preferences.savedFixtureIds.length + preferences.savedNewsIds.length}
            </p>
            <p className="mt-2 text-sm text-text-secondary">已保存内容</p>
          </Card>
          <Card className="p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-text-muted">Sync</p>
            <p className="mt-2 text-sm font-semibold text-text-primary">{homeQuery.data?.syncedAt ? "最近已同步" : "等待首次同步"}</p>
            <p className="mt-2 text-sm text-text-secondary">
              {homeQuery.data?.syncedAt ? new Date(homeQuery.data.syncedAt).toLocaleString("zh-CN") : "尚未获取"}
            </p>
          </Card>
        </section>

        <section className="space-y-3">
          <SectionTitle eyebrow="Notifications">通知偏好</SectionTitle>
          <Card className="space-y-3 p-4">
            {[
              ["enabled", "总通知开关"],
              ["matchReminders", "赛前提醒"],
              ["liveEvents", "比赛进程提醒"],
              ["officialNews", "官方新闻提醒"]
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
                  {preferences.notifications[key as keyof typeof preferences.notifications] ? "开" : "关"}
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
                Web Push 订阅
              </span>
              <span className="text-sm text-text-secondary">{subscriptionState}</span>
            </button>
          </Card>
        </section>

        <section className="space-y-3">
          <SectionTitle eyebrow="Theme">主题与动效</SectionTitle>
          <Card className="space-y-4 p-4">
            <div>
              <p className="mb-3 inline-flex items-center gap-2 text-sm text-text-primary">
                <Palette className="h-4 w-4 text-brand-primary" />
                深色主题
              </p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setTheme("classic")}
                  className={`rounded-xl px-4 py-3 text-sm ${
                    preferences.theme === "classic" ? "bg-brand-primary text-white" : "bg-white/4 text-text-primary"
                  }`}
                >
                  Classic Night
                </button>
                <button
                  type="button"
                  onClick={() => setTheme("contrast")}
                  className={`rounded-xl px-4 py-3 text-sm ${
                    preferences.theme === "contrast" ? "bg-brand-primary text-white" : "bg-white/4 text-text-primary"
                  }`}
                >
                  High Contrast
                </button>
              </div>
            </div>
            <div>
              <p className="mb-3 inline-flex items-center gap-2 text-sm text-text-primary">
                <MoonStar className="h-4 w-4 text-brand-primary" />
                动效密度
              </p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setMotion("full")}
                  className={`rounded-xl px-4 py-3 text-sm ${
                    preferences.motion === "full" ? "bg-brand-primary text-white" : "bg-white/4 text-text-primary"
                  }`}
                >
                  细微动效
                </button>
                <button
                  type="button"
                  onClick={() => setMotion("reduced")}
                  className={`rounded-xl px-4 py-3 text-sm ${
                    preferences.motion === "reduced" ? "bg-brand-primary text-white" : "bg-white/4 text-text-primary"
                  }`}
                >
                  减弱动效
                </button>
              </div>
            </div>
          </Card>
        </section>

        <section className="space-y-3">
          <SectionTitle eyebrow="PWA">安装与离线</SectionTitle>
          <Card className="space-y-3 p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/5 text-brand-primary">
                <Download className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-text-primary">添加到主屏幕</p>
                <p className="mt-1 text-sm leading-6 text-text-secondary">
                  安装后可离线打开最近同步过的首页与赛程。
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => installPrompt.promptInstall()}
              disabled={!installPrompt.isSupported}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-brand-primary px-4 py-3 text-sm font-medium text-white disabled:opacity-40"
            >
              <Smartphone className="h-4 w-4" />
              {installPrompt.isSupported ? "安装 PWA" : "浏览器暂未提供安装入口"}
            </button>
          </Card>
        </section>
      </div>
    </AppShell>
  );
}
