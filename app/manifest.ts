import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Inter Daily",
    short_name: "Inter Daily",
    description: "国际米兰球迷的比赛日移动端控制台。",
    start_url: "/",
    display: "standalone",
    background_color: "#07090C",
    theme_color: "#07090C",
    lang: "zh-CN",
    orientation: "portrait",
    icons: [
      {
        src: "/icon-192.svg",
        sizes: "192x192",
        type: "image/svg+xml"
      },
      {
        src: "/icon-512.svg",
        sizes: "512x512",
        type: "image/svg+xml"
      },
      {
        src: "/maskable-icon.svg",
        sizes: "512x512",
        type: "image/svg+xml",
        purpose: "maskable"
      }
    ]
  };
}
