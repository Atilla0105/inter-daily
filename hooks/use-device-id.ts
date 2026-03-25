"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "inter-daily/device-id";

export function useDeviceId() {
  const [deviceId, setDeviceId] = useState<string>("");

  useEffect(() => {
    const existing = window.localStorage.getItem(STORAGE_KEY);
    if (existing) {
      setDeviceId(existing);
      return;
    }

    const nextId = `device-${crypto.randomUUID()}`;
    window.localStorage.setItem(STORAGE_KEY, nextId);
    setDeviceId(nextId);
  }, []);

  return deviceId;
}
