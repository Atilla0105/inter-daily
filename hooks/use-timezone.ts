"use client";

import { useMemo } from "react";

export function useTimeZone() {
  return useMemo(() => Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Ho_Chi_Minh", []);
}
