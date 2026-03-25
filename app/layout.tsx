import type { Metadata, Viewport } from "next";
import Script from "next/script";
import type { PropsWithChildren } from "react";

import { AppProviders } from "@/components/providers/app-providers";

import "./globals.css";

export const metadata: Metadata = {
  title: "Inter Daily",
  description: "国际米兰球迷的移动端比赛日控制台。",
  manifest: "/manifest.webmanifest",
  applicationName: "Inter Daily",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Inter Daily"
  },
  icons: {
    icon: [
      { url: "/icon-192.svg", type: "image/svg+xml" },
      { url: "/icon-512.svg", type: "image/svg+xml" }
    ],
    apple: [{ url: "/apple-touch-icon.svg", type: "image/svg+xml" }]
  }
};

export const viewport: Viewport = {
  themeColor: "#07090C",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover"
};

const themeBootScript = `
  try {
    const raw = window.localStorage.getItem('inter-daily/preferences/v1');
    if (!raw) document.documentElement.dataset.theme = 'classic';
    const parsed = raw ? JSON.parse(raw) : null;
    document.documentElement.dataset.theme = parsed?.theme ?? 'classic';
    document.documentElement.dataset.motion = parsed?.motion ?? 'full';
  } catch (error) {
    document.documentElement.dataset.theme = 'classic';
    document.documentElement.dataset.motion = 'full';
  }
`;

export default function RootLayout({ children }: PropsWithChildren) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body>
        <Script id="theme-boot" strategy="beforeInteractive">
          {themeBootScript}
        </Script>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
