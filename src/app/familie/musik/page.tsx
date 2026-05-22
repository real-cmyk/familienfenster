"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { RADIO_SENDER } from "@/app/tablet/musik/page";

export default function FamilieMusikSeite() {
  const [gespeichert, setGespeichert] = useState<string[]>([]);   // aktueller DB-Stand
  const [ausgewaehlt, setAusgewaehlt] = useState<string[]>([]);   // lokale Auswahl
  const [laedt, setLaedt] = useState(true);
  const [speichert, setSpeichert] = useState(false);
  const [erfolg, setErfolg] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("radio_favoriten")
      .select("station_id")
      .then(({ data }) => {
        const ids = (data ?? []).map((r: { station_id: string }) => r.station_id);
        setGespeichert(ids);
        setAusgewaehlt(ids);
        setLaedt(false);
      });
  }, []);

  function toggle(id: string) {
    setErfolg(false);
    setAusgewaehlt((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  async function speichern() {
    setSpeichert(true);
    setErfolg(false);
    const supabase = createClient();

    const zuLoeschen = gespeichert.filter((id) => !ausgewaehlt.includes(id));
    const zuEinfuegen = ausgewaehlt.filter((id) => !gespeichert.includes(id));

    await Promise.all([
      ...zuLoeschen.map((id) => supabase.from("radio_favoriten").delete().eq("station_id", id)),
      ...zuEinfuegen.map((id) => supabase.from("radio_favoriten").insert({ station_id: id })),
    ]);

    setGespeichert(ausgewaehlt);
    setSpeichert(false);
    setErfolg(true);
    setTimeout(() => setErfolg(false), 3000);
  }

  const hatAenderungen = JSON.stringify([...ausgewaehlt].sort()) !== JSON.stringify([...gespeichert].sort());

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: "var(--farbe-warm-text)" }}>
          Radio für Oma
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--farbe-warm-text-weich)" }}>
          Wähle die Lieblingssender — sie erscheinen als Kacheln auf Omas Tablet.
        </p>
      </div>

      {laedt ? (
        <p className="text-center py-8" style={{ color: "var(--farbe-warm-text-weich)" }}>Wird geladen…</p>
      ) : (
        <>
          <div className="flex flex-col gap-3">
            {RADIO_SENDER.map((sender) => {
              const aktiv = ausgewaehlt.includes(sender.id);
              return (
                <button
                  key={sender.id}
                  onClick={() => toggle(sender.id)}
                  className="rounded-2xl p-4 flex items-center gap-4 text-left transition-all active:scale-97"
                  style={{
                    background: aktiv ? sender.farbe : "var(--farbe-hell-karte)",
                    border: `2px solid ${aktiv ? sender.rand : "var(--farbe-warm-akzent-hell)"}`,
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
                  {/* Checkbox */}
                  <div
                    className="rounded-xl flex items-center justify-center shrink-0 transition-all"
                    style={{
                      width: "44px", height: "44px",
                      background: aktiv ? sender.rand : "transparent",
                      border: `2px solid ${aktiv ? sender.rand : "var(--farbe-warm-akzent-hell)"}`,
                      fontSize: "1.4rem",
                    }}
                  >
                    {aktiv ? "✓" : ""}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Speichern-Button */}
          <div className="sticky bottom-20 pt-2">
            <button
              onClick={speichern}
              disabled={!hatAenderungen || speichert}
              className="w-full rounded-2xl py-4 text-xl font-bold text-white transition-all disabled:opacity-40"
              style={{
                background: erfolg ? "#22C55E" : "var(--farbe-warm-akzent)",
                minHeight: "64px",
                boxShadow: hatAenderungen && !speichert ? "0 4px 16px rgba(193,112,58,0.4)" : "none",
              }}
            >
              {erfolg ? "✓ Gespeichert!" : speichert ? "Wird gespeichert…" : hatAenderungen ? "💾 Auswahl speichern" : "Keine Änderungen"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
