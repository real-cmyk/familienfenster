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
  // Baut einen tiefen Fake-History-Puffer auf, damit der Android-Zurück-Button
  // niemals echte Browser-History-Einträge außerhalb von /tablet erreicht.
  // Jedes popstate füllt den Puffer sofort wieder auf — er kann nicht erschöpft werden.
  const PUFFER = 10;
  const fuellePuffer = () => {
    for (let i = 0; i < PUFFER; i++) {
      history.pushState(null, "", "/tablet");
    }
  };

  // Ersten Puffer befüllen (überschreibt auch alle echten Einträge davor)
  history.replaceState(null, "", "/tablet");
  fuellePuffer();

  window.addEventListener("popstate", () => {
    // Nach jedem Zurück-Schritt sofort wieder auffüllen
    fuellePuffer();
  });
}
