import type { ReactNode } from "react";

import { OfflineBadge } from "./offline-badge";

export function PageHeader({
  title,
  subtitle,
  status,
  action,
  offline = false
}: {
  title: string;
  subtitle: string;
  status?: ReactNode;
  action?: ReactNode;
  offline?: boolean;
}) {
  return (
    <header className="flex items-start justify-between gap-4">
      <div>
        <p className="mb-2 text-xs tracking-[0.24em] text-brand-primary">国米日报</p>
        <h1 className="text-[28px] font-semibold tracking-tight text-text-primary">{title}</h1>
        <p className="mt-2 max-w-[18rem] text-sm leading-6 text-text-secondary">{subtitle}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <OfflineBadge offline={offline} />
          {status}
        </div>
      </div>
      {action}
    </header>
  );
}
