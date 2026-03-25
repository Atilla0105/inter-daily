"use client";

import { cn } from "@/lib/utils/cn";

export type SegmentOption<T extends string> = {
  label: string;
  value: T;
};

export function SegmentedTabs<T extends string>({
  options,
  value,
  onChange,
  compact = false
}: {
  options: readonly SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
  compact?: boolean;
}) {
  return (
    <div className="hide-scrollbar flex gap-2 overflow-x-auto rounded-full border border-border-subtle bg-surface/85 p-1">
      {options.map((option) => {
        const isActive = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={cn(
              "whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-all duration-gentle",
              compact && "px-3 py-1.5 text-xs",
              isActive
                ? "bg-brand-primary text-white"
                : "text-text-secondary hover:bg-white/5 hover:text-text-primary"
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
