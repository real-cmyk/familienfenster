"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";

type Besuch = {
  id: string;
  besuchs_datum: string;
  besuchs_zeit: string | null;
  nachricht: string | null;
  besucher_id: string;
  besucher: { name: string } | null;
  eigener: boolean;
};

const WOCHENTAGE = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];
const MONATE = [
  "Januar", "Februar", "März", "April", "Mai", "Juni",
  "Juli", "August", "September", "Oktober", "November", "Dezember",
];

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  const day = new Date(year, month, 1).getDay();
  return day === 0 ? 6 : day - 1; // 0 = Montag
}

function formatDatum(iso: string) {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("de-DE", { weekday: "long", day: "numeric", month: "long" });
}

export default function BesucheKalender() {
  const heute = new Date();
  const heuteIso = heute.toISOString().split("T")[0];

  const [jahr, setJahr] = useState(heute.getFullYear());
  const [monat, setMonat] = useState(heute.getMonth());
  const [besuche, setBesuche] = useState<Besuch[]>([]);
  const [laedt, setLaedt] = useState(true);
  const [meinPersonId, setMeinPersonId] = useState<string | null>(null);

  // Formular für gewählten Tag
  const [gewaehltDatum, setGewaehltDatum] = useState<string | null>(null);
  const [zeit, setZeit] = useState("");
  const [nachricht, setNachricht] = useState("");
  const [speichert, setSpeichert] = useState(false);
  const [fehler, setFehler] = useState("");

  const ladeBesuche = useCallback(async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: person } = await supabase
      .from("personen").select("id").eq("auth_id", user.id).single();
    if (person) setMeinPersonId(person.id);

    const { data } = await supabase
      .from("besuche")
      .select("id, besuchs_datum, besuchs_zeit, nachricht, besucher_id, besucher:personen(name)")
      .eq("status", "angekuendigt")
      .gte("besuchs_datum", heuteIso)
      .order("besuchs_datum", { ascending: true });

    if (data) {
      setBesuche(data.map(b => ({
        ...b,
        besucher: Array.isArray(b.besucher) ? b.besucher[0] : (b.besucher as { name: string } | null),
        eigener: b.besucher_id === person?.id,
      })));
    }
    setLaedt(false);
  }, [heuteIso]);

  useEffect(() => { ladeBesuche(); }, [ladeBesuche]);

  // Tage mit Besuch im aktuellen Monat
  const besuchsTage = new Set(
    besuche
      .filter(b => {
        const d = new Date(b.besuchs_datum + "T00:00:00");
        return d.getFullYear() === jahr && d.getMonth() === monat;
      })
      .map(b => new Date(b.besuchs_datum + "T00:00:00").getDate())
  );

  function navigiere(delta: number) {
    let m = monat + delta;
    let j = jahr;
    if (m < 0) { m = 11; j--; }
    if (m > 11) { m = 0; j++; }
    setMonat(m);
    setJahr(j);
    setGewaehltDatum(null);
  }

  function waehleTag(tag: number) {
    const iso = `${jahr}-${String(monat + 1).padStart(2, "0")}-${String(tag).padStart(2, "0")}`;
    if (iso < heuteIso) return;
    setGewaehltDatum(iso);
    setZeit("");
    setNachricht("");
    setFehler("");
  }

  async function handleSpeichern() {
    if (!gewaehltDatum) return;
    setSpeichert(true);
    setFehler("");

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setFehler("Nicht eingeloggt."); setSpeichert(false); return; }

    const { data: person } = await supabase
      .from("personen").select("id").eq("auth_id", user.id).single();
    if (!person) { setFehler("Profil nicht gefunden."); setSpeichert(false); return; }

    const { error } = await supabase.from("besuche").insert({
      besucher_id: person.id,
      besuchs_datum: gewaehltDatum,
      besuchs_zeit: zeit || null,
      nachricht: nachricht || null,
    });

    if (error) {
      setFehler("Konnte nicht gespeichert werden. Bitte erneut versuchen.");
      setSpeichert(false);
      return;
    }

    setGewaehltDatum(null);
    await ladeBesuche();
    setSpeichert(false);
  }

  async function handleLoeschen(id: string) {
    if (!confirm("Diesen Besuch wirklich löschen?")) return;
    const supabase = createClient();
    await supabase.from("besuche").delete().eq("id", id);
    setBesuche(prev => prev.filter(b => b.id !== id));
  }

  const daysInMonth = getDaysInMonth(jahr, monat);
  const firstDay = getFirstDayOfMonth(jahr, monat);

  // Ist der aktuelle Monat in der Vergangenheit?
  const istVergangenerMonat =
    jahr < heute.getFullYear() ||
    (jahr === heute.getFullYear() && monat < heute.getMonth());

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6" style={{ color: "var(--farbe-warm-text)" }}>
        Besuche ankündigen
      </h1>

      {/* Kalender */}
      <div
        className="rounded-3xl p-5 mb-6"
        style={{ background: "var(--farbe-hell-karte)", border: "2px solid var(--farbe-warm-akzent-hell)" }}
      >
        {/* Monat-Navigation */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => navigiere(-1)}
            disabled={istVergangenerMonat}
            className="w-12 h-12 rounded-full text-xl font-bold flex items-center justify-center disabled:opacity-30"
            style={{ background: "var(--farbe-warm-bg)", color: "var(--farbe-warm-akzent)" }}
            aria-label="Vorheriger Monat"
          >
            ←
          </button>
          <h2 className="text-lg font-bold" style={{ color: "var(--farbe-warm-text)" }}>
            {MONATE[monat]} {jahr}
          </h2>
          <button
            onClick={() => navigiere(1)}
            className="w-12 h-12 rounded-full text-xl font-bold flex items-center justify-center"
            style={{ background: "var(--farbe-warm-bg)", color: "var(--farbe-warm-akzent)" }}
            aria-label="Nächster Monat"
          >
            →
          </button>
        </div>

        {/* Wochentag-Kopfzeile */}
        <div className="grid grid-cols-7 gap-1 mb-1">
          {WOCHENTAGE.map(w => (
            <div
              key={w}
              className="text-center text-sm font-semibold py-1"
              style={{ color: "var(--farbe-warm-text-weich)" }}
            >
              {w}
            </div>
          ))}
        </div>

        {/* Tage */}
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: firstDay }).map((_, i) => (
            <div key={`leer-${i}`} />
          ))}

          {Array.from({ length: daysInMonth }).map((_, i) => {
            const tag = i + 1;
            const iso = `${jahr}-${String(monat + 1).padStart(2, "0")}-${String(tag).padStart(2, "0")}`;
            const hatBesuch = besuchsTage.has(tag);
            const istHeute =
              tag === heute.getDate() &&
              monat === heute.getMonth() &&
              jahr === heute.getFullYear();
            const istVergangenheit = iso < heuteIso;
            const istGewaehlt = gewaehltDatum === iso;

            return (
              <button
                key={tag}
                onClick={() => waehleTag(tag)}
                disabled={istVergangenheit}
                className="aspect-square rounded-xl flex flex-col items-center justify-center text-sm font-medium transition-all"
                style={{
                  background: istGewaehlt
                    ? "var(--farbe-warm-akzent)"
                    : hatBesuch
                    ? "var(--farbe-gruen-hell)"
                    : istHeute
                    ? "var(--farbe-warm-akzent-hell)"
                    : "transparent",
                  color: istGewaehlt
                    ? "white"
                    : "var(--farbe-warm-text)",
                  opacity: istVergangenheit ? 0.3 : 1,
                  border: istHeute && !istGewaehlt
                    ? "2px solid var(--farbe-warm-akzent)"
                    : "2px solid transparent",
                  cursor: istVergangenheit ? "default" : "pointer",
                }}
              >
                {tag}
                {hatBesuch && !istGewaehlt && (
                  <span style={{ color: "var(--farbe-gruen)", fontSize: "8px", lineHeight: 1 }}>●</span>
                )}
              </button>
            );
          })}
        </div>

        <p className="text-xs text-center mt-3" style={{ color: "var(--farbe-warm-text-weich)" }}>
          Tippe auf einen Tag, um einen Besuch anzukündigen
        </p>
      </div>

      {/* Formular für gewählten Tag */}
      {gewaehltDatum && (
        <div
          className="rounded-3xl p-5 mb-6"
          style={{ background: "var(--farbe-gruen-hell)", border: "2px solid var(--farbe-gruen)" }}
        >
          <h3 className="text-lg font-bold mb-4" style={{ color: "var(--farbe-warm-text)" }}>
            {formatDatum(gewaehltDatum)}
          </h3>
          <div className="flex flex-col gap-4">
            <div>
              <label
                className="text-sm font-medium mb-1 block"
                style={{ color: "var(--farbe-warm-text)" }}
              >
                Uhrzeit (optional)
              </label>
              <input
                type="time"
                value={zeit}
                onChange={e => setZeit(e.target.value)}
                className="rounded-2xl border-2 px-4 py-3 text-lg w-full outline-none"
                style={{ borderColor: "var(--farbe-gruen)", background: "var(--farbe-hell-karte)" }}
              />
            </div>
            <div>
              <label
                className="text-sm font-medium mb-1 block"
                style={{ color: "var(--farbe-warm-text)" }}
              >
                Nachricht an Oma (optional)
              </label>
              <textarea
                value={nachricht}
                onChange={e => setNachricht(e.target.value)}
                placeholder="Wir bringen Kuchen mit!"
                rows={2}
                className="rounded-2xl border-2 px-4 py-3 text-base w-full outline-none resize-none"
                style={{ borderColor: "var(--farbe-gruen)", background: "var(--farbe-hell-karte)" }}
              />
            </div>
            {fehler && <p className="text-red-600 text-sm">{fehler}</p>}
            <div className="flex gap-3">
              <button
                onClick={handleSpeichern}
                disabled={speichert}
                className="flex-1 rounded-2xl py-4 text-lg font-bold text-white disabled:opacity-50"
                style={{ background: "var(--farbe-warm-akzent)", minHeight: "56px" }}
              >
                {speichert ? "Wird gespeichert…" : "Ankündigen ❤️"}
              </button>
              <button
                onClick={() => setGewaehltDatum(null)}
                className="rounded-2xl px-5 py-4 text-base font-medium"
                style={{
                  background: "var(--farbe-hell-karte)",
                  color: "var(--farbe-warm-text)",
                  minHeight: "56px",
                }}
              >
                Abbrechen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Liste der angekündigten Besuche */}
      <h2 className="text-xl font-bold mb-4" style={{ color: "var(--farbe-warm-text)" }}>
        Angekündigte Besuche
      </h2>

      {laedt && (
        <p className="text-center py-8" style={{ color: "var(--farbe-warm-text-weich)" }}>
          Wird geladen…
        </p>
      )}

      {!laedt && besuche.length === 0 && (
        <div
          className="text-center py-12 rounded-3xl"
          style={{ background: "var(--farbe-hell-karte)" }}
        >
          <p className="text-4xl mb-3">👨‍👩‍👧</p>
          <p style={{ color: "var(--farbe-warm-text-weich)" }}>
            Noch keine Besuche angekündigt.<br />
            Tippe einfach auf einen Tag im Kalender!
          </p>
        </div>
      )}

      <div className="flex flex-col gap-4">
        {besuche.map(besuch => (
          <div
            key={besuch.id}
            className="rounded-2xl p-4 flex items-start gap-4"
            style={{
              background: "var(--farbe-hell-karte)",
              border: besuch.eigener
                ? "2px solid var(--farbe-warm-akzent)"
                : "2px solid var(--farbe-warm-akzent-hell)",
            }}
          >
            <span className="text-3xl" aria-hidden="true">❤️</span>
            <div className="flex-1 min-w-0">
              <p className="font-bold" style={{ color: "var(--farbe-warm-text)" }}>
                {besuch.besucher?.name ?? "Familie"}
                {besuch.eigener && (
                  <span style={{ color: "var(--farbe-warm-akzent)", fontWeight: "normal" }}> (du)</span>
                )}
              </p>
              <p className="text-sm" style={{ color: "var(--farbe-warm-text-weich)" }}>
                {formatDatum(besuch.besuchs_datum)}
                {besuch.besuchs_zeit
                  ? ` um ${besuch.besuchs_zeit.substring(0, 5)} Uhr`
                  : ""}
              </p>
              {besuch.nachricht && (
                <p
                  className="text-sm italic mt-1"
                  style={{ color: "var(--farbe-warm-text-weich)" }}
                >
                  „{besuch.nachricht}"
                </p>
              )}
            </div>
            {(besuch.eigener || meinPersonId === null) && (
              <button
                onClick={() => handleLoeschen(besuch.id)}
                className="rounded-xl px-3 py-2 text-sm font-medium flex-shrink-0"
                style={{ background: "#fee2e2", color: "#dc2626", minHeight: "44px" }}
              >
                Löschen
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
