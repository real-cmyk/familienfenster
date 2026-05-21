"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { aktiviereWakeLock, aktiviereKioskMode } from "@/lib/kiosk";
import HeartbeatSender from "@/components/tablet/HeartbeatSender";

const NAV_EINTRAEGE = [
  { href: "/tablet", icon: "🏠", label: "Start" },
  { href: "/tablet/kalender", icon: "📅", label: "Kalender" },
  { href: "/tablet/fotos", icon: "🖼️", label: "Fotos" },
  { href: "/tablet/musik", icon: "🎵", label: "Musik" },
  { href: "/tablet/besuche", icon: "👨‍👩‍👧", label: "Familie" },
];

export default function TabletLayout({ children }: { children: React.ReactNode }) {
  const pfad = usePathname();

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

      {/* Hauptinhalt */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>

      {/* Untere Navigation */}
      <nav
        className="flex border-t shrink-0"
        style={{
          borderColor: "var(--farbe-warm-akzent-hell)",
          background: "var(--farbe-hell-karte)",
        }}
      >
        {NAV_EINTRAEGE.map(({ href, icon, label }) => {
          const aktiv = pfad === href;
          return (
            <Link
              key={href}
              href={href}
              className="flex flex-col items-center justify-center flex-1 py-3 gap-1 transition-colors"
              style={{
                minHeight: "80px",
                color: aktiv ? "var(--farbe-warm-akzent)" : "var(--farbe-warm-text-weich)",
                background: aktiv ? "var(--farbe-warm-bg2)" : "transparent",
                fontWeight: aktiv ? "700" : "400",
              }}
            >
              <span className="text-2xl" aria-hidden="true">{icon}</span>
              <span className="text-sm">{label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
