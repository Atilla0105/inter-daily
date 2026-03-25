import { cn } from "@/lib/utils/cn";

export function StatRow({
  label,
  value,
  helper,
  emphasis = false
}: {
  label: string;
  value: string | number;
  helper?: string;
  emphasis?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-2">
      <div>
        <p className="text-xs uppercase tracking-[0.16em] text-text-muted">{label}</p>
        {helper ? <p className="mt-1 text-xs text-text-secondary">{helper}</p> : null}
      </div>
      <p className={cn("numeric text-right text-base text-text-primary", emphasis && "text-xl font-semibold")}>
        {value}
      </p>
    </div>
  );
}
