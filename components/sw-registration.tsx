"use client";

import { useEffect } from "react";

export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;

    const swUrl = "/sw.js";
    navigator.serviceWorker
      .register(swUrl)
      .then((registration) => {
        console.log("✅ SW registered:", registration.scope);
      })
      .catch((error) => {
        console.log("❌ SW registration failed:", error);
      });
  }, []);

  return null;
}
