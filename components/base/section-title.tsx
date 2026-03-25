import type { PropsWithChildren, ReactNode } from "react";

export function SectionTitle({
  eyebrow,
  children,
  action
}: PropsWithChildren<{
  eyebrow?: string;
  action?: ReactNode;
}>) {
  return (
    <div className="flex items-end justify-between gap-3">
      <div>
        {eyebrow ? <p className="mb-1 text-xs uppercase tracking-[0.18em] text-text-muted">{eyebrow}</p> : null}
        <h2 className="text-lg font-semibold tracking-tight text-text-primary">{children}</h2>
      </div>
      {action}
    </div>
  );
}
