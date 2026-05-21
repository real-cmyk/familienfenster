"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function TerminEintragen() {
  const [titel, setTitel] = useState("");
  const [beschreibung, setBeschreibung] = useState("");
  const [datum, setDatum] = useState("");
  const [zeit, setZeit] = useState("");
  const [ganztaegig, setGanztaegig] = useState(false);
  const [laedt, setLaedt] = useState(false);
  const [fehler, setFehler] = useState("");
  const router = useRouter();

  async function handleAbsenden(e: React.FormEvent) {
    e.preventDefault();
    setLaedt(true);
    setFehler("");

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setFehler("Nicht eingeloggt."); setLaedt(false); return; }

    const { data: person } = await supabase
      .from("personen")
      .select("id")
      .eq("auth_id", user.id)
      .single();

    const { error } = await supabase.from("kalender_eintraege").insert({
      erstellt_von: person?.id ?? null,
      titel,
      beschreibung: beschreibung || null,
      termin_datum: datum,
      termin_zeit: ganztaegig ? null : (zeit || null),
      ganztaegig,
    });

    if (error) {
      setFehler("Konnte nicht gespeichert werden.");
      setLaedt(false);
      return;
    }

    router.push("/familie");
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-8" style={{ color: "var(--farbe-warm-text)" }}>
        Termin eintragen
      </h1>

      <form onSubmit={handleAbsenden} className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <label className="font-medium text-lg" style={{ color: "var(--farbe-warm-text)" }}>Termin *</label>
          <input
            type="text"
            value={titel}
            onChange={(e) => setTitel(e.target.value)}
            placeholder="z.B. Arzttermin beim Dr. Müller"
            required
            className="rounded-2xl border-2 px-5 py-4 text-lg w-full outline-none"
            style={{ borderColor: "var(--farbe-warm-akzent-hell)", background: "var(--farbe-hell-karte)" }}
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="font-medium text-lg" style={{ color: "var(--farbe-warm-text)" }}>Datum *</label>
          <input
            type="date"
            value={datum}
            onChange={(e) => setDatum(e.target.value)}
            required
            min={new Date().toISOString().split("T")[0]}
            className="rounded-2xl border-2 px-5 py-4 text-lg w-full outline-none"
            style={{ borderColor: "var(--farbe-warm-akzent-hell)", background: "var(--farbe-hell-karte)" }}
          />
        </div>

        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="ganztaegig"
            checked={ganztaegig}
            onChange={(e) => setGanztaegig(e.target.checked)}
            className="w-6 h-6"
          />
          <label htmlFor="ganztaegig" className="text-lg" style={{ color: "var(--farbe-warm-text)" }}>
            Ganztägig
          </label>
        </div>

        {!ganztaegig && (
          <div className="flex flex-col gap-2">
            <label className="font-medium text-lg" style={{ color: "var(--farbe-warm-text)" }}>
              Uhrzeit (optional)
            </label>
            <input
              type="time"
              value={zeit}
              onChange={(e) => setZeit(e.target.value)}
              className="rounded-2xl border-2 px-5 py-4 text-lg w-full outline-none"
              style={{ borderColor: "var(--farbe-warm-akzent-hell)", background: "var(--farbe-hell-karte)" }}
            />
          </div>
        )}

        <div className="flex flex-col gap-2">
          <label className="font-medium text-lg" style={{ color: "var(--farbe-warm-text)" }}>
            Notiz (optional)
          </label>
          <textarea
            value={beschreibung}
            onChange={(e) => setBeschreibung(e.target.value)}
            placeholder="z.B. Jonas holt dich ab"
            rows={2}
            className="rounded-2xl border-2 px-5 py-4 text-base w-full outline-none resize-none"
            style={{ borderColor: "var(--farbe-warm-akzent-hell)", background: "var(--farbe-hell-karte)" }}
          />
        </div>

        {fehler && <p className="text-red-600">{fehler}</p>}

        <button
          type="submit"
          disabled={laedt}
          className="rounded-2xl py-4 text-xl font-bold text-white disabled:opacity-60"
          style={{ background: "var(--farbe-warm-akzent)", minHeight: "64px" }}
        >
          {laedt ? "Wird gespeichert…" : "Termin eintragen 📅"}
        </button>
      </form>
    </div>
  );
}
