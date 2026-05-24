"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { aktiviereWakeLock, aktiviereKioskMode } from "@/lib/kiosk";
import HeartbeatSender from "@/components/tablet/HeartbeatSender";
import TabletRealtime from "@/components/tablet/TabletRealtime";

export default function TabletLayout({ children }: { children: React.ReactNode }) {
  const pfad = usePathname();
  const istHomescreen = pfad === "/tablet";

  useEffect(() => {
    aktiviereWakeLock();
    aktiviereKioskMode();
  }, []);

  return (
    <div
      className="flex flex-col h-screen overflow-hidden"
      style={{ background: "var(--farbe-warm-bg)" }}
    >
      <HeartbeatSender />
      <TabletRealtime />

      {/* Home-Button — erscheint auf allen Unterseiten */}
      {!istHomescreen && (
        <div className="shrink-0 px-4 pt-4 pb-1">
          <Link
            href="/tablet"
            className="inline-flex items-center gap-2 rounded-2xl px-5 py-3 font-semibold transition-transform active:scale-95"
            style={{
              background: "var(--farbe-hell-karte)",
              border: "2px solid var(--farbe-warm-akzent-hell)",
              color: "var(--farbe-warm-akzent)",
              minHeight: "52px",
              fontSize: "1.1rem",
            }}
          >
            <span aria-hidden="true">🏠</span>
            <span>Startseite</span>
          </Link>
        </div>
      )}

      {/* Hauptinhalt */}
      <main className="flex-1 overflow-y-auto min-h-0">
        {children}
      </main>
    </div>
  );
}
