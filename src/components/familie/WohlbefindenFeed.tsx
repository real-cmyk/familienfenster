"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Signal = { id: string; gesendet_am: string };

export default function WohlbefindenFeed() {
  const [signale, setSignale] = useState<Signal[]>([]);

  useEffect(() => {
    const supabase = createClient();

    // Initiale Daten laden
    supabase
      .from("wohlbefinden_signale")
      .select("id, gesendet_am")
      .order("gesendet_am", { ascending: false })
      .limit(5)
      .then(({ data }) => setSignale(data ?? []));

    // Realtime-Abo
    const kanal = supabase
      .channel("wohlbefinden")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "wohlbefinden_signale" },
        (payload) => {
          setSignale((prev) => [payload.new as Signal, ...prev].slice(0, 5));
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(kanal); };
  }, []);

  if (signale.length === 0) return null;

  const letztes = signale[0];
  const datum = new Date(letztes.gesendet_am);
  const uhrzeit = datum.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" });
  const datumText = datum.toLocaleDateString("de-DE", { weekday: "long", day: "numeric", month: "long" });

  return (
    <div
      className="rounded-2xl p-5 animate-gleiten-ein"
      style={{
        background: "var(--farbe-gruen-hell)",
        border: "2px solid var(--farbe-gruen)",
      }}
    >
      <p className="text-lg font-bold" style={{ color: "var(--farbe-gruen)" }}>
        ❤️ Oma geht es gut!
      </p>
      <p className="text-base" style={{ color: "var(--farbe-warm-text-weich)" }}>
        Gemeldet am {datumText} um {uhrzeit} Uhr
      </p>
    </div>
  );
}
