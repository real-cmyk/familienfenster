"use client";

import { useEffect } from "react";

export default function HeartbeatSender() {
  useEffect(() => {
    async function sendeHeartbeat() {
      try {
        const batterie = "getBattery" in navigator
          ? Math.round((await (navigator as { getBattery: () => Promise<{ level: number }> }).getBattery()).level * 100)
          : null;

        await fetch("/api/geraet/heartbeat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ batterie_prozent: batterie }),
        });
      } catch {
        // Netzwerkfehler — ignorieren
      }
    }

    sendeHeartbeat();
    const interval = setInterval(sendeHeartbeat, 60000);
    return () => clearInterval(interval);
  }, []);

  return null;
}
