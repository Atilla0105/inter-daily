import Link from "next/link";
import { CalendarDays, House, Newspaper, Radio, UserRound } from "lucide-react";

import { cn } from "@/lib/utils/cn";

const tabs = [
  { href: "/", label: "Home", icon: House, match: (pathname: string) => pathname === "/" },
  {
    href: "/matches",
    label: "Matches",
    icon: CalendarDays,
    match: (pathname: string) => pathname.startsWith("/matches") || pathname.startsWith("/fixtures")
  },
  { href: "/live", label: "Live", icon: Radio, match: (pathname: string) => pathname.startsWith("/live") },
  { href: "/news", label: "News", icon: Newspaper, match: (pathname: string) => pathname.startsWith("/news") },
  { href: "/my", label: "My", icon: UserRound, match: (pathname: string) => pathname.startsWith("/my") }
] as const;

export function TabBar({ pathname }: { pathname: string }) {
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center px-4 pb-[calc(var(--safe-bottom)+12px)]">
      <nav className="pointer-events-auto w-full max-w-[430px] rounded-[28px] border border-border-subtle bg-bg-secondary/95 px-3 py-2 backdrop-blur-md">
        <ul className="grid grid-cols-5 gap-2">
          {tabs.map((tab) => {
            const active = tab.match(pathname);
            const Icon = tab.icon;
            return (
              <li key={tab.href}>
                <Link
                  href={tab.href}
                  className={cn(
                    "flex flex-col items-center gap-1 rounded-[18px] px-2 py-2 text-[11px] transition-colors duration-gentle",
                    active ? "bg-brand-soft text-text-primary" : "text-text-muted hover:text-text-primary"
                  )}
                >
                  <Icon className={cn("h-5 w-5", active && "text-brand-primary")} />
                  <span>{tab.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
