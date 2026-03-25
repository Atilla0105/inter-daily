import type { ComponentPropsWithoutRef, PropsWithChildren } from "react";

import { cn } from "@/lib/utils/cn";

type CardProps = PropsWithChildren<
  ComponentPropsWithoutRef<"div"> & {
    elevated?: boolean;
    interactive?: boolean;
  }
>;

export function Card({ children, className, elevated = false, interactive = false, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "card-border surface-glow rounded-card bg-surface p-4",
        elevated && "bg-surface-elevated",
        interactive &&
          "transition-all duration-gentle active:translate-y-[1px] active:shadow-tap",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
