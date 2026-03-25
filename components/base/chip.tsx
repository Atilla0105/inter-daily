import type { PropsWithChildren } from "react";

import { cn } from "@/lib/utils/cn";

const toneStyles = {
  neutral: "border-border-subtle bg-white/5 text-text-secondary",
  live: "border-live/40 bg-live/10 text-live",
  success: "border-success/30 bg-success/10 text-success",
  warning: "border-warning/30 bg-warning/10 text-warning",
  danger: "border-danger/30 bg-danger/10 text-danger",
  brand: "border-brand-primary/30 bg-brand-soft text-[#7fc1ff]",
  gold: "border-accent-gold/30 bg-accent-gold-soft text-accent-gold"
} as const;

export function Chip({
  children,
  tone = "neutral",
  pulse = false,
  className
}: PropsWithChildren<{
  tone?: keyof typeof toneStyles;
  pulse?: boolean;
  className?: string;
}>) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-medium tracking-[0.12em]",
        toneStyles[tone],
        className
      )}
    >
      {pulse ? <span className="h-1.5 w-1.5 animate-live rounded-full bg-current" /> : null}
      {children}
    </span>
  );
}
