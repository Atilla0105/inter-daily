"use client";

import { useEffect } from "react";

export function ServiceWorkerRegistrar() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) {
      return;
    }

    let hasReloaded = false;

    navigator.serviceWorker
      .register("/sw.js", { updateViaCache: "none" })
      .then((registration) => {
        navigator.serviceWorker.addEventListener("controllerchange", () => {
          if (hasReloaded) {
            return;
          }

          hasReloaded = true;
          window.location.reload();
        });

        if (registration.waiting) {
          registration.waiting.postMessage({ type: "SKIP_WAITING" });
        }

        registration.addEventListener("updatefound", () => {
          const worker = registration.installing;
          if (!worker) {
            return;
          }

          worker.addEventListener("statechange", () => {
            if (worker.state === "installed") {
              worker.postMessage({ type: "SKIP_WAITING" });
            }
          });
        });

        registration.update().catch(() => {
          // Ignore update failures and keep the current worker.
        });
      })
      .catch(() => {
        // Ignore registration failure in development.
      });
  }, []);

  return null;
}
