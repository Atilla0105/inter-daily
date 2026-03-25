import type { PropsWithChildren, ReactNode } from "react";

import { cn } from "@/lib/utils/cn";

import { TabBar } from "./tab-bar";

export function AppShell({
  pathname,
  children,
  rail,
  className
}: PropsWithChildren<{
  pathname: string;
  rail?: ReactNode;
  className?: string;
}>) {
  return (
    <div className="app-shell-gradient app-frame">
      <div className={cn("content-wrap pb-32 pt-[calc(var(--safe-top)+20px)]", className)}>
        {children}
        {rail ? <div className="mt-6">{rail}</div> : null}
      </div>
      <TabBar pathname={pathname} />
    </div>
  );
}
