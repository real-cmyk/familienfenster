"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

/* ── Typen ──────────────────────────────────────────────────────────────── */
type Termin = { id: string; titel: string; beschreibung: string | null; termin_datum: string; termin_zeit: string | null; ganztaegig: boolean };
type Besuch = { id: string; besuchs_datum: string; besuchs_zeit: string | null; nachricht: string | null; name: string };
type Eintrag = { typ: "termin"; d: Termin } | { typ: "besuch"; d: Besuch };

/* ── Hilfsfunktionen ────────────────────────────────────────────────────── */
const WOCHENTAGE_KURZ = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];
const WOCHENTAGE_LANG = ["Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag", "Sonntag"];
const MONATE = ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"];

function isoHeute() { return new Date().toISOString().split("T")[0]; }
function isoAdd(n: number) { return new Date(Date.now() + n * 86400000).toISOString().split("T")[0]; }
function zeitText(zeit: string | null) { return zeit ? zeit.substring(0, 5) + " Uhr – " : ""; }

function wochentag(iso: string) {
  const d = new Date(iso + "T12:00:00");
  const idx = (d.getDay() + 6) % 7; // 0=Mo
  return { kurz: WOCHENTAGE_KURZ[idx], lang: WOCHENTAGE_LANG[idx] };
}
function datumHübsch(iso: string) {
  const d = new Date(iso + "T12:00:00");
  return `${d.getDate()}. ${MONATE[d.getMonth()]}`;
}
function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}
function getFirstWeekday(year: number, month: number) {
  return (new Date(year, month, 1).getDay() + 6) % 7; // 0=Mo
}

/* ── Daten laden ────────────────────────────────────────────────────────── */
async function ladeAlles(von: string, bis: string) {
  const supabase = createClient();
  const [tRes, bRes] = await Promise.all([
    supabase
      .from("kalender_eintraege")
      .select("id, titel, beschreibung, termin_datum, termin_zeit, ganztaegig")
      .gte("termin_datum", von).lte("termin_datum", bis)
      .order("termin_datum").order("termin_zeit"),
    supabase
      .from("besuche")
      .select("id, besuchs_datum, besuchs_zeit, nachricht, personen(name, spitzname)")
      .gte("besuchs_datum", von).lte("besuchs_datum", bis)
      .eq("status", "angekuendigt")
      .order("besuchs_datum").order("besuchs_zeit"),
  ]);

  const gruppen: Record<string, Eintrag[]> = {};
  for (const t of tRes.data ?? []) {
    if (!gruppen[t.termin_datum]) gruppen[t.termin_datum] = [];
    gruppen[t.termin_datum].push({ typ: "termin", d: t as Termin });
  }
  for (const b of bRes.data ?? []) {
    const p = Array.isArray(b.personen) ? b.personen[0] : b.personen;
    const name = (p as { spitzname?: string | null; name: string } | null)?.spitzname
      ?? (p as { name: string } | null)?.name ?? "Besuch";
    if (!gruppen[b.besuchs_datum]) gruppen[b.besuchs_datum] = [];
    gruppen[b.besuchs_datum].push({ typ: "besuch", d: { id: b.id, besuchs_datum: b.besuchs_datum, besuchs_zeit: b.besuchs_zeit, nachricht: b.nachricht, name } });
  }
  return gruppen;
}

/* ── Hauptseite ─────────────────────────────────────────────────────────── */
export default function TabletKalenderSeite() {
  const [ansicht, setAnsicht] = useState<"7tage" | "monat">("7tage");
  const [gruppen, setGruppen] = useState<Record<string, Eintrag[]>>({});
  const [laedt, setLaedt] = useState(true);

  const heute = new Date();
  const [monatJahr, setMonatJahr] = useState({ monat: heute.getMonth(), jahr: heute.getFullYear() });

  useEffect(() => {
    setLaedt(true);
    const von = ansicht === "7tage"
      ? isoHeute()
      : `${monatJahr.jahr}-${String(monatJahr.monat + 1).padStart(2, "0")}-01`;
    const bis = ansicht === "7tage"
      ? isoAdd(13)
      : `${monatJahr.jahr}-${String(monatJahr.monat + 1).padStart(2, "0")}-${getDaysInMonth(monatJahr.jahr, monatJahr.monat)}`;

    ladeAlles(von, bis).then((g) => { setGruppen(g); setLaedt(false); });
  }, [ansicht, monatJahr]);

  return (
    <div className="p-5 pb-8 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold" style={{ color: "var(--farbe-warm-text)" }}>
          Kalender
        </h1>
        {/* Ansicht-Toggle */}
        <div className="flex rounded-2xl overflow-hidden border-2" style={{ borderColor: "var(--farbe-warm-akzent)" }}>
          {(["7tage", "monat"] as const).map((a) => (
            <button
              key={a}
              onClick={() => setAnsicht(a)}
              className="px-4 py-2 text-base font-semibold transition-colors"
              style={{
                background: ansicht === a ? "var(--farbe-warm-akzent)" : "var(--farbe-hell-karte)",
                color: ansicht === a ? "white" : "var(--farbe-warm-akzent)",
                minHeight: "44px",
              }}
            >
              {a === "7tage" ? "7 Tage" : "Monat"}
            </button>
          ))}
        </div>
      </div>

      {laedt ? (
        <p className="text-center py-12 text-xl" style={{ color: "var(--farbe-warm-text-weich)" }}>
          Wird geladen…
        </p>
      ) : ansicht === "7tage" ? (
        <SiebenTageAnsicht gruppen={gruppen} />
      ) : (
        <MonatsAnsicht
          gruppen={gruppen}
          monat={monatJahr.monat}
          jahr={monatJahr.jahr}
          onNavigiere={(delta) => {
            setMonatJahr((prev) => {
              let m = prev.monat + delta;
              let j = prev.jahr;
              if (m < 0) { m = 11; j--; }
              if (m > 11) { m = 0; j++; }
              return { monat: m, jahr: j };
            });
          }}
        />
      )}
    </div>
  );
}

/* ── 7-Tage-Ansicht ─────────────────────────────────────────────────────── */
function SiebenTageAnsicht({ gruppen }: { gruppen: Record<string, Eintrag[]> }) {
  const tage = Array.from({ length: 14 }, (_, i) => isoAdd(i));
  const mitEintraegen = tage.filter((d) => (gruppen[d]?.length ?? 0) > 0);

  if (mitEintraegen.length === 0) {
    return (
      <div className="text-center py-16 rounded-3xl" style={{ background: "var(--farbe-hell-karte)" }}>
        <p className="text-5xl mb-4">☀️</p>
        <p className="text-xl" style={{ color: "var(--farbe-warm-text-weich)" }}>
          In den nächsten zwei Wochen keine Termine
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {tage.map((iso) => {
        const eintraege = gruppen[iso] ?? [];
        if (eintraege.length === 0) return null;
        const istHeute = iso === isoHeute();
        const wt = wochentag(iso);
        return (
          <div key={iso}>
            {/* Tag-Header */}
            <div className="flex items-center gap-3 mb-2">
              <div
                className="rounded-2xl px-4 py-2 text-lg font-bold shrink-0"
                style={{
                  background: istHeute ? "var(--farbe-warm-akzent)" : "var(--farbe-warm-akzent-hell)",
                  color: istHeute ? "white" : "var(--farbe-warm-akzent)",
                  minWidth: "56px",
                  textAlign: "center",
                }}
              >
                {wt.kurz}
              </div>
              <p className="text-xl font-bold" style={{ color: "var(--farbe-warm-text)" }}>
                {datumHübsch(iso)}
                {istHeute && <span className="ml-2 text-base font-normal" style={{ color: "var(--farbe-warm-akzent)" }}>• Heute</span>}
              </p>
            </div>
            {/* Einträge */}
            <div className="flex flex-col gap-2 pl-2">
              {eintraege.map((e, i) =>
                e.typ === "besuch" ? (
                  <div key={i} className="rounded-2xl p-4 flex gap-3 items-start"
                    style={{ background: "#F0FBF0", border: "2px solid #86EFAC" }}>
                    <span className="text-2xl">🏠</span>
                    <div>
                      <p className="text-lg font-semibold" style={{ color: "#166534" }}>
                        {zeitText(e.d.besuchs_zeit)}{e.d.name} kommt zu Besuch
                      </p>
                      {e.d.nachricht && <p className="text-base mt-1 italic" style={{ color: "#15803D" }}>„{e.d.nachricht}"</p>}
                    </div>
                  </div>
                ) : (
                  <div key={i} className="rounded-2xl p-4 flex gap-3 items-start"
                    style={{ background: "var(--farbe-hell-karte)", border: "2px solid var(--farbe-warm-akzent-hell)" }}>
                    <span className="text-2xl">📌</span>
                    <div>
                      <p className="text-lg font-semibold" style={{ color: "var(--farbe-warm-text)" }}>
                        {!e.d.ganztaegig ? zeitText(e.d.termin_zeit) : ""}{e.d.titel}
                      </p>
                      {e.d.beschreibung && <p className="text-base mt-1" style={{ color: "var(--farbe-warm-text-weich)" }}>{e.d.beschreibung}</p>}
                    </div>
                  </div>
                )
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ── Monatsansicht ──────────────────────────────────────────────────────── */
function MonatsAnsicht({
  gruppen, monat, jahr, onNavigiere,
}: {
  gruppen: Record<string, Eintrag[]>;
  monat: number;
  jahr: number;
  onNavigiere: (delta: number) => void;
}) {
  const [ausgewaehltIso, setAusgewaehltIso] = useState<string | null>(null);

  const daysInMonth = getDaysInMonth(jahr, monat);
  const firstDay = getFirstWeekday(jahr, monat);
  const heuteIso = isoHeute();

  return (
    <div className="flex flex-col gap-4">
      {/* Monat-Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => { setAusgewaehltIso(null); onNavigiere(-1); }}
          className="w-14 h-14 rounded-full text-2xl font-bold flex items-center justify-center"
          style={{ background: "var(--farbe-warm-akzent-hell)", color: "var(--farbe-warm-akzent)" }}
        >←</button>
        <h2 className="text-2xl font-bold" style={{ color: "var(--farbe-warm-text)" }}>
          {MONATE[monat]} {jahr}
        </h2>
        <button
          onClick={() => { setAusgewaehltIso(null); onNavigiere(1); }}
          className="w-14 h-14 rounded-full text-2xl font-bold flex items-center justify-center"
          style={{ background: "var(--farbe-warm-akzent-hell)", color: "var(--farbe-warm-akzent)" }}
        >→</button>
      </div>

      {/* Kalender-Grid */}
      <div className="rounded-2xl p-4" style={{ background: "var(--farbe-hell-karte)" }}>
        {/* Wochentage-Header */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {WOCHENTAGE_KURZ.map((w) => (
            <div key={w} className="text-center text-sm font-semibold py-1" style={{ color: "var(--farbe-warm-text-weich)" }}>{w}</div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: firstDay }).map((_, i) => <div key={`l${i}`} />)}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const tag = i + 1;
            const iso = `${jahr}-${String(monat + 1).padStart(2, "0")}-${String(tag).padStart(2, "0")}`;
            const eintraege = gruppen[iso] ?? [];
            const hatTermin = eintraege.some((e) => e.typ === "termin");
            const hatBesuch = eintraege.some((e) => e.typ === "besuch");
            const istHeute = iso === heuteIso;
            const istGewaehlt = iso === ausgewaehltIso;

            return (
              <button
                key={tag}
                onClick={() => setAusgewaehltIso(iso === ausgewaehltIso ? null : iso)}
                className="aspect-square rounded-xl flex flex-col items-center justify-center text-lg font-medium transition-all"
                style={{
                  background: istGewaehlt
                    ? "var(--farbe-warm-akzent)"
                    : istHeute
                    ? "var(--farbe-warm-akzent-hell)"
                    : "transparent",
                  color: istGewaehlt ? "white" : "var(--farbe-warm-text)",
                  border: istHeute && !istGewaehlt ? "2px solid var(--farbe-warm-akzent)" : "2px solid transparent",
                }}
              >
                {tag}
                {(hatTermin || hatBesuch) && (
                  <div className="flex gap-0.5 mt-0.5">
                    {hatTermin && <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: istGewaehlt ? "white" : "var(--farbe-warm-akzent)", display: "inline-block" }} />}
                    {hatBesuch && <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: istGewaehlt ? "white" : "#22c55e", display: "inline-block" }} />}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Detail-Panel */}
      {ausgewaehltIso && (() => {
        const eintraege = gruppen[ausgewaehltIso] ?? [];
        const wt = wochentag(ausgewaehltIso);
        return (
          <div className="rounded-2xl p-4 flex flex-col gap-3"
            style={{ background: "var(--farbe-hell-karte)", border: "2px solid var(--farbe-warm-akzent-hell)" }}>
            <p className="text-xl font-bold" style={{ color: "var(--farbe-warm-akzent)" }}>
              {wt.lang}, {datumHübsch(ausgewaehltIso)}
            </p>
            {eintraege.length === 0 ? (
              <p style={{ color: "var(--farbe-warm-text-weich)" }}>Keine Einträge an diesem Tag</p>
            ) : eintraege.map((e, i) =>
              e.typ === "besuch" ? (
                <div key={i} className="flex gap-3 items-start">
                  <span className="text-2xl">🏠</span>
                  <p className="text-lg" style={{ color: "#166534" }}>
                    {zeitText(e.d.besuchs_zeit)}{e.d.name} kommt zu Besuch
                    {e.d.nachricht && <><br /><span className="italic text-base">„{e.d.nachricht}"</span></>}
                  </p>
                </div>
              ) : (
                <div key={i} className="flex gap-3 items-start">
                  <span className="text-2xl">📌</span>
                  <p className="text-lg" style={{ color: "var(--farbe-warm-text)" }}>
                    {!e.d.ganztaegig ? zeitText(e.d.termin_zeit) : ""}{e.d.titel}
                    {e.d.beschreibung && <><br /><span className="text-base" style={{ color: "var(--farbe-warm-text-weich)" }}>{e.d.beschreibung}</span></>}
                  </p>
                </div>
              )
            )}
          </div>
        );
      })()}
    </div>
  );
}
