"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function BesuchAnkuendigen() {
  const [datum, setDatum] = useState("");
  const [zeit, setZeit] = useState("");
  const [nachricht, setNachricht] = useState("");
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

    if (!person) { setFehler("Profil nicht gefunden."); setLaedt(false); return; }

    const { error } = await supabase.from("besuche").insert({
      besucher_id: person.id,
      besuchs_datum: datum,
      besuchs_zeit: zeit || null,
      nachricht: nachricht || null,
    });

    if (error) {
      setFehler("Konnte nicht gespeichert werden. Bitte erneut versuchen.");
      setLaedt(false);
      return;
    }

    router.push("/familie");
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-8" style={{ color: "var(--farbe-warm-text)" }}>
        Besuch ankündigen
      </h1>

      <form onSubmit={handleAbsenden} className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <label className="font-medium text-lg" style={{ color: "var(--farbe-warm-text)" }}>
            Datum *
          </label>
          <input
            type="date"
            value={datum}
            onChange={(e) => setDatum(e.target.value)}
            required
            min={new Date().toISOString().split("T")[0]}
            className="rounded-2xl border-2 px-5 py-4 text-xl w-full outline-none focus:border-[var(--farbe-warm-akzent)]"
            style={{ borderColor: "var(--farbe-warm-akzent-hell)", background: "var(--farbe-hell-karte)" }}
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="font-medium text-lg" style={{ color: "var(--farbe-warm-text)" }}>
            Uhrzeit (optional)
          </label>
          <input
            type="time"
            value={zeit}
            onChange={(e) => setZeit(e.target.value)}
            className="rounded-2xl border-2 px-5 py-4 text-xl w-full outline-none focus:border-[var(--farbe-warm-akzent)]"
            style={{ borderColor: "var(--farbe-warm-akzent-hell)", background: "var(--farbe-hell-karte)" }}
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="font-medium text-lg" style={{ color: "var(--farbe-warm-text)" }}>
            Nachricht an Oma (optional)
          </label>
          <textarea
            value={nachricht}
            onChange={(e) => setNachricht(e.target.value)}
            placeholder="Wir bringen Kuchen mit!"
            rows={3}
            className="rounded-2xl border-2 px-5 py-4 text-lg w-full outline-none resize-none focus:border-[var(--farbe-warm-akzent)]"
            style={{ borderColor: "var(--farbe-warm-akzent-hell)", background: "var(--farbe-hell-karte)" }}
          />
        </div>

        {fehler && <p className="text-red-600">{fehler}</p>}

        <button
          type="submit"
          disabled={laedt}
          className="rounded-2xl py-4 text-xl font-bold text-white transition-opacity disabled:opacity-60"
          style={{ background: "var(--farbe-warm-akzent)", minHeight: "64px" }}
        >
          {laedt ? "Wird gespeichert…" : "Besuch ankündigen ❤️"}
        </button>
      </form>
    </div>
  );
}
