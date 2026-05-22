"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

/**
 * Unsichtbare Komponente: Lauscht per Supabase-Realtime auf Änderungen
 * und ruft router.refresh() auf – dadurch laden Server-Komponenten neu.
 */
export default function TabletRealtime() {
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();

    const kanal = supabase
      .channel("tablet-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "kalender_eintraege" }, () => router.refresh())
      .on("postgres_changes", { event: "*", schema: "public", table: "besuche" }, () => router.refresh())
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "nachrichten" }, () => router.refresh())
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "wohlbefinden_signale" }, () => {})
      .subscribe();

    return () => { supabase.removeChannel(kanal); };
  }, [router]);

  return null;
}
