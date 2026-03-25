import { WifiOff } from "lucide-react";

import { Chip } from "./chip";

export function OfflineBadge({ offline }: { offline: boolean }) {
  if (!offline) {
    return null;
  }

  return (
    <Chip tone="warning" className="gap-1.5">
      <WifiOff className="h-3.5 w-3.5" />
      离线模式
    </Chip>
  );
}
