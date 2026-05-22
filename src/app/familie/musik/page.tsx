"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { RADIO_SENDER } from "@/app/tablet/musik/page";

export default function FamilieMusikSeite() {
  const [favoriten, setFavoriten] = useState<string[]>([]);
  const [laedt, setLaedt] = useState(true);
  const [speichert, setSpeichert] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("radio_favoriten")
      .select("station_id")
      .then(({ data }) => {
        setFavoriten((data ?? []).map((r: { station_id: string }) => r.station_id));
        setLaedt(false);
      });
  }, []);

  async function toggleFavorit(stationId: string) {
    setSpeichert(stationId);
    const supabase = createClient();

    if (favoriten.includes(stationId)) {
      await supabase.from("radio_favoriten").delete().eq("station_id", stationId);
      setFavoriten((prev) => prev.filter((id) => id !== stationId));
    } else {
      await supabase.from("radio_favoriten").insert({ station_id: stationId });
      setFavoriten((prev) => [...prev, stationId]);
    }

    setSpeichert(null);
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: "var(--farbe-warm-text)" }}>
          Radio für Oma
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--farbe-warm-text-weich)" }}>
          Wähle Sender als Favorit — sie erscheinen oben auf Omas Tablet.
        </p>
      </div>

      {laedt ? (
        <p className="text-center py-8" style={{ color: "var(--farbe-warm-text-weich)" }}>
          Wird geladen…
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {RADIO_SENDER.map((sender) => {
            const istFavorit = favoriten.includes(sender.id);
            return (
              <button
                key={sender.id}
                onClick={() => toggleFavorit(sender.id)}
                disabled={speichert === sender.id}
                className="rounded-2xl p-4 flex items-center gap-4 text-left transition-transform active:scale-97 disabled:opacity-60"
                style={{
                  background: istFavorit ? "var(--farbe-warm-akzent-hell)" : "var(--farbe-hell-karte)",
                  border: `2px solid ${istFavorit ? "var(--farbe-warm-akzent)" : "var(--farbe-warm-akzent-hell)"}`,
                  minHeight: "72px",
                }}
              >
                <span className="text-3xl shrink-0">{sender.emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-base font-semibold" style={{ color: "var(--farbe-warm-text)" }}>
                    {sender.name}
                  </p>
                  <p className="text-sm" style={{ color: "var(--farbe-warm-text-weich)" }}>
                    {sender.region}
                  </p>
                </div>
                <div
                  className="rounded-full flex items-center justify-center shrink-0"
                  style={{
                    width: "44px", height: "44px",
                    background: istFavorit ? "var(--farbe-warm-akzent)" : "var(--farbe-warm-bg)",
                    fontSize: "1.4rem",
                    transition: "all 0.2s",
                  }}
                >
                  {istFavorit ? "⭐" : "☆"}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
