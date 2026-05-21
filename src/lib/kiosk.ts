"use client";

let wakeLock: WakeLockSentinel | null = null;

export async function aktiviereWakeLock(): Promise<void> {
  if (!("wakeLock" in navigator)) return;
  try {
    wakeLock = await navigator.wakeLock.request("screen");
    document.addEventListener("visibilitychange", async () => {
      if (wakeLock !== null && document.visibilityState === "visible") {
        wakeLock = await navigator.wakeLock.request("screen");
      }
    });
  } catch {
    // Wake Lock nicht verfügbar — kein Problem
  }
}

export function aktiviereKioskMode(): void {
  // Verhindert Back-Navigation aus der Kiosk-Ansicht
  history.pushState(null, "", location.href);
  window.addEventListener("popstate", () => {
    history.pushState(null, "", location.href);
  });
}
