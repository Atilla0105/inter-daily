"use client";

import { useEffect, useState } from "react";

type DeferredPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
};

export function useInstallPrompt() {
  const [promptEvent, setPromptEvent] = useState<DeferredPromptEvent | null>(null);

  useEffect(() => {
    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setPromptEvent(event as DeferredPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  return {
    isSupported: promptEvent !== null,
    async promptInstall() {
      if (!promptEvent) {
        return "dismissed" as const;
      }

      await promptEvent.prompt();
      const result = await promptEvent.userChoice;
      setPromptEvent(null);
      return result.outcome;
    }
  };
}
