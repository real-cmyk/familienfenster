"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";

/* ── Typen ─────────────────────────────────────────────────────────────── */
type Termin = { id: string; titel: string; termin_datum: string; termin_zeit: string | null; ganztaegig: boolean; beschreibung: string | null; typ: "termin" };
type Besuch = { id: string; besuchs_datum: string; besuchs_zeit: string | null; nachricht: string | null; besucher_name: string; besucher_id: string; eigener: boolean; typ: "besuch" };
type Eintrag = Termin | Besuch;

/* ── Kalender-Helfer ───────────────────────────────────────────────────── */
const MONATE = ["Januar","Februar","März","April","Mai","Juni","Juli","August","September","Oktober","November","Dezember"];
const WT = ["Mo","Di","Mi","Do","Fr","Sa","So"];

function isoToDate(iso: string) { return new Date(iso + "T00:00:00"); }
function toIso(d: Date) { return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`; }

function getKW(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

function getMonthWeeks(year: number, month: number): Date[][] {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const weeks: Date[][] = [];
  let startDow = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1; // Mo=0

  let cur = new Date(firstDay);
  cur.setDate(cur.getDate() - startDow);

  while (cur <= lastDay || weeks.length === 0) {
    const week: Date[] = [];
    for (let i = 0; i < 7; i++) {
      week.push(new Date(cur));
      cur.setDate(cur.getDate() + 1);
    }
    weeks.push(week);
    if (cur > lastDay && weeks.length >= 4) break;
  }
  return weeks;
}

function formatZeit(zeit: string) { return zeit.substring(0, 5) + " Uhr"; }
function formatDatumLang(iso: string) {
  return isoToDate(iso).toLocaleDateString("de-DE", { weekday: "long", day: "numeric", month: "long" });
}

/* ── Hauptkomponente ───────────────────────────────────────────────────── */
export default function UnifiedKalender() {
  const heute = new Date();
  const heuteIso = toIso(heute);

  const [jahr, setJahr] = useState(heute.getFullYear());
  const [monat, setMonat] = useState(heute.getMonth());
  const [eintraege, setEintraege] = useState<Eintrag[]>([]);
  const [laedt, setLaedt] = useState(true);
  const [meinPersonId, setMeinPersonId] = useState<string | null>(null);

  // Tagesdetail-Panel
  const [gewaehltIso, setGewaehltIso] = useState<string | null>(null);
  const [formTyp, setFormTyp] = useState<"termin" | "besuch" | null>(null);

  // Termin-Formular
  const [terminTitel, setTerminTitel] = useState("");
  const [terminBeschr, setTerminBeschr] = useState("");
  const [terminZeit, setTerminZeit] = useState("");
  const [terminGanztaegig, setTerminGanztaegig] = useState(false);

  // Besuch-Formular
  const [besuchZeit, setBesuchZeit] = useState("");
  const [besuchNachricht, setBesuchNachricht] = useState("");

  const [speichert, setSpeichert] = useState(false);
  const [fehler, setFehler] = useState("");

  /* Daten laden */
  const ladeDaten = useCallback(async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: person } = await supabase.from("personen").select("id").eq("auth_id", user.id).single();
    if (person) setMeinPersonId(person.id);

    // Drei Monate laden (für Navigation)
    const vonDatum = toIso(new Date(jahr, monat - 1, 1));
    const bisDatum = toIso(new Date(jahr, monat + 2, 0));

    const [{ data: termine }, { data: besuche }] = await Promise.all([
      supabase.from("kalender_eintraege")
        .select("id, titel, termin_datum, termin_zeit, ganztaegig, beschreibung")
        .gte("termin_datum", vonDatum).lte("termin_datum", bisDatum)
        .order("termin_datum").order("termin_zeit"),
      supabase.from("besuche")
        .select("id, besuchs_datum, besuchs_zeit, nachricht, besucher_id, besucher:personen(name)")
        .eq("status", "angekuendigt")
        .gte("besuchs_datum", vonDatum).lte("besuchs_datum", bisDatum)
        .order("besuchs_datum"),
    ]);

    const terminListe: Termin[] = (termine ?? []).map(t => ({ ...t, typ: "termin" as const }));
    const besuchListe: Besuch[] = (besuche ?? []).map(b => ({
      id: b.id,
      besuchs_datum: b.besuchs_datum,
      besuchs_zeit: b.besuchs_zeit,
      nachricht: b.nachricht,
      besucher_id: b.besucher_id,
      besucher_name: (Array.isArray(b.besucher) ? b.besucher[0] : b.besucher as { name: string } | null)?.name ?? "Familie",
      eigener: b.besucher_id === person?.id,
      typ: "besuch" as const,
    }));

    setEintraege([...terminListe, ...besuchListe]);
    setLaedt(false);
  }, [jahr, monat]);

  useEffect(() => { ladeDaten(); }, [ladeDaten]);

  /* Nach Monat gruppieren */
  const eintraegeNachDatum = new Map<string, Eintrag[]>();
  for (const e of eintraege) {
    const datum = e.typ === "termin" ? e.termin_datum : e.besuchs_datum;
    if (!eintraegeNachDatum.has(datum)) eintraegeNachDatum.set(datum, []);
    eintraegeNachDatum.get(datum)!.push(e);
  }

  function navigiere(delta: number) {
    let m = monat + delta, j = jahr;
    if (m < 0) { m = 11; j--; }
    if (m > 11) { m = 0; j++; }
    setMonat(m); setJahr(j);
    setGewaehltIso(null); setFormTyp(null);
  }

  function waehleTag(iso: string) {
    setGewaehltIso(iso === gewaehltIso ? null : iso);
    setFormTyp(null);
    setFehler("");
    setTerminTitel(""); setTerminBeschr(""); setTerminZeit(""); setTerminGanztaegig(false);
    setBesuchZeit(""); setBesuchNachricht("");
  }

  async function handleSpeichern() {
    if (!gewaehltIso || !formTyp) return;
    setSpeichert(true); setFehler("");

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setFehler("Nicht eingeloggt."); setSpeichert(false); return; }
    const { data: person } = await supabase.from("personen").select("id").eq("auth_id", user.id).single();

    let error;
    if (formTyp === "termin") {
      if (!terminTitel.trim()) { setFehler("Bitte einen Titel eingeben."); setSpeichert(false); return; }
      ({ error } = await supabase.from("kalender_eintraege").insert({
        erstellt_von: person?.id,
        titel: terminTitel.trim(),
        beschreibung: terminBeschr || null,
        termin_datum: gewaehltIso,
        termin_zeit: terminGanztaegig ? null : (terminZeit || null),
        ganztaegig: terminGanztaegig,
      }));
    } else {
      ({ error } = await supabase.from("besuche").insert({
        besucher_id: person?.id,
        besuchs_datum: gewaehltIso,
        besuchs_zeit: besuchZeit || null,
        nachricht: besuchNachricht || null,
      }));
    }

    if (error) { setFehler("Konnte nicht gespeichert werden."); setSpeichert(false); return; }

    setFormTyp(null);
    setTerminTitel(""); setTerminBeschr(""); setTerminZeit(""); setTerminGanztaegig(false);
    setBesuchZeit(""); setBesuchNachricht("");
    await ladeDaten();
    setSpeichert(false);
  }

  async function handleLoeschen(eintrag: Eintrag) {
    if (!confirm("Eintrag wirklich löschen?")) return;
    const supabase = createClient();
    if (eintrag.typ === "termin") await supabase.from("kalender_eintraege").delete().eq("id", eintrag.id);
    else await supabase.from("besuche").delete().eq("id", eintrag.id);
    await ladeDaten();
  }

  const wochen = getMonthWeeks(jahr, monat);
  const tagesEintraege = gewaehltIso ? (eintraegeNachDatum.get(gewaehltIso) ?? []) : [];
  const isPast = gewaehltIso ? gewaehltIso < heuteIso : false;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-5" style={{ color: "var(--farbe-warm-text)" }}>Kalender</h1>

      {/* ── Monats-Navigation ── */}
      <div className="rounded-3xl overflow-hidden mb-4"
        style={{ background: "var(--farbe-hell-karte)", border: "2px solid var(--farbe-warm-akzent-hell)" }}>

        <div className="flex items-center justify-between px-4 py-3"
          style={{ background: "var(--farbe-warm-akzent)" }}>
          <button onClick={() => navigiere(-1)} className="text-white text-2xl w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/20" aria-label="Vormonat">←</button>
          <h2 className="text-lg font-bold text-white">{MONATE[monat]} {jahr}</h2>
          <button onClick={() => navigiere(1)} className="text-white text-2xl w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/20" aria-label="Nächster Monat">→</button>
        </div>

        {/* Wochentag-Header */}
        <div className="grid text-xs font-bold text-center py-2 px-1"
          style={{ gridTemplateColumns: "36px repeat(7, 1fr)", color: "var(--farbe-warm-text-weich)" }}>
          <div>KW</div>
          {WT.map(w => <div key={w}>{w}</div>)}
        </div>

        {/* Kalender-Wochen */}
        <div className="px-1 pb-2 flex flex-col gap-1">
          {wochen.map((woche, wi) => {
            const kw = getKW(woche[0]);
            return (
              <div key={wi} className="grid items-center" style={{ gridTemplateColumns: "36px repeat(7, 1fr)", gap: "2px" }}>
                {/* KW-Nummer */}
                <div className="text-xs text-center font-semibold rounded-lg py-1"
                  style={{ color: "var(--farbe-warm-text-weich)", background: "var(--farbe-warm-bg)" }}>
                  {kw}
                </div>
                {/* 7 Tage */}
                {woche.map((tag, ti) => {
                  const iso = toIso(tag);
                  const istDieserMonat = tag.getMonth() === monat;
                  const istHeute = iso === heuteIso;
                  const istGewaehlt = iso === gewaehltIso;
                  const tagEintraege = eintraegeNachDatum.get(iso) ?? [];
                  const hatTermin = tagEintraege.some(e => e.typ === "termin");
                  const hatBesuch = tagEintraege.some(e => e.typ === "besuch");

                  return (
                    <button
                      key={ti}
                      onClick={() => waehleTag(iso)}
                      className="rounded-xl flex flex-col items-center justify-center transition-all active:scale-90"
                      style={{
                        aspectRatio: "1",
                        minHeight: "42px",
                        background: istGewaehlt
                          ? "var(--farbe-warm-akzent)"
                          : istHeute
                          ? "var(--farbe-warm-akzent-hell)"
                          : "transparent",
                        color: istGewaehlt ? "white" : istDieserMonat ? "var(--farbe-warm-text)" : "var(--farbe-warm-text-weich)",
                        opacity: istDieserMonat ? 1 : 0.35,
                        fontWeight: istHeute || istGewaehlt ? "700" : "400",
                        border: istHeute && !istGewaehlt ? "2px solid var(--farbe-warm-akzent)" : "2px solid transparent",
                        fontSize: "0.9rem",
                      }}
                    >
                      <span>{tag.getDate()}</span>
                      {/* Punkte für Einträge */}
                      {(hatTermin || hatBesuch) && (
                        <div className="flex gap-0.5 mt-0.5">
                          {hatTermin && <span style={{ width: 5, height: 5, borderRadius: "50%", background: istGewaehlt ? "rgba(255,255,255,0.8)" : "#C1703A", display: "block" }} />}
                          {hatBesuch && <span style={{ width: 5, height: 5, borderRadius: "50%", background: istGewaehlt ? "rgba(255,255,255,0.8)" : "#4CAF50", display: "block" }} />}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>

        {/* Legende */}
        <div className="flex gap-4 px-4 pb-3">
          <div className="flex items-center gap-1.5 text-sm" style={{ color: "var(--farbe-warm-text-weich)" }}>
            <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#C1703A", display: "inline-block" }} />
            Termin
          </div>
          <div className="flex items-center gap-1.5 text-sm" style={{ color: "var(--farbe-warm-text-weich)" }}>
            <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#4CAF50", display: "inline-block" }} />
            Besuch
          </div>
        </div>
      </div>

      {/* ── Tages-Detail Panel ── */}
      {gewaehltIso && (
        <div className="rounded-3xl overflow-hidden mb-4"
          style={{ border: "2px solid var(--farbe-warm-akzent)", background: "var(--farbe-hell-karte)" }}>

          <div className="px-5 py-3 font-bold text-base" style={{ background: "var(--farbe-warm-akzent-hell)", color: "var(--farbe-warm-akzent)" }}>
            {formatDatumLang(gewaehltIso)}
          </div>

          {/* Einträge dieses Tags */}
          {tagesEintraege.length > 0 && (
            <div className="px-5 py-3 flex flex-col gap-2">
              {tagesEintraege.map(e => (
                <div key={e.id} className="flex items-start gap-3 rounded-xl p-3"
                  style={{ background: e.typ === "termin" ? "rgba(193,112,58,0.1)" : "rgba(76,175,80,0.1)", border: `1.5px solid ${e.typ === "termin" ? "#C1703A" : "#4CAF50"}` }}>
                  <span className="text-xl mt-0.5">{e.typ === "termin" ? "📅" : "❤️"}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm" style={{ color: "var(--farbe-warm-text)" }}>
                      {e.typ === "termin" ? e.titel : `${e.besucher_name} kommt vorbei`}
                    </p>
                    {(e.typ === "termin" ? e.termin_zeit : e.besuchs_zeit) && (
                      <p className="text-xs" style={{ color: "var(--farbe-warm-text-weich)" }}>
                        {formatZeit((e.typ === "termin" ? e.termin_zeit : e.besuchs_zeit)!)}
                      </p>
                    )}
                    {e.typ === "termin" && e.ganztaegig && <p className="text-xs" style={{ color: "var(--farbe-warm-text-weich)" }}>Ganztägig</p>}
                    {e.typ === "besuch" && e.nachricht && <p className="text-xs italic" style={{ color: "var(--farbe-warm-text-weich)" }}>„{e.nachricht}"</p>}
                  </div>
                  {(e.typ === "termin" || (e.typ === "besuch" && e.eigener)) && (
                    <button onClick={() => handleLoeschen(e)} className="text-xs rounded-lg px-2 py-1 shrink-0"
                      style={{ background: "#fee2e2", color: "#dc2626", minHeight: "36px" }}>
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Hinzufügen-Buttons */}
          {!isPast && !formTyp && (
            <div className="px-5 pb-4 flex gap-3">
              <button onClick={() => setFormTyp("termin")}
                className="flex-1 rounded-2xl py-3 text-sm font-semibold"
                style={{ background: "rgba(193,112,58,0.12)", color: "#C1703A", border: "2px solid #C1703A", minHeight: "48px" }}>
                + Termin
              </button>
              <button onClick={() => setFormTyp("besuch")}
                className="flex-1 rounded-2xl py-3 text-sm font-semibold"
                style={{ background: "rgba(76,175,80,0.12)", color: "#2E7D32", border: "2px solid #4CAF50", minHeight: "48px" }}>
                + Besuch ankündigen
              </button>
            </div>
          )}

          {/* Termin-Formular */}
          {formTyp === "termin" && (
            <div className="px-5 pb-5 flex flex-col gap-3">
              <input type="text" placeholder="Titel *" value={terminTitel} onChange={e => setTerminTitel(e.target.value)}
                className="rounded-2xl border-2 px-4 py-3 text-base w-full outline-none"
                style={{ borderColor: "#C1703A", background: "var(--farbe-warm-bg)" }} />
              <div className="flex gap-3">
                <label className="flex items-center gap-2 text-sm cursor-pointer" style={{ color: "var(--farbe-warm-text)" }}>
                  <input type="checkbox" checked={terminGanztaegig} onChange={e => setTerminGanztaegig(e.target.checked)} className="w-5 h-5" />
                  Ganztägig
                </label>
                {!terminGanztaegig && (
                  <input type="time" value={terminZeit} onChange={e => setTerminZeit(e.target.value)}
                    className="rounded-xl border-2 px-3 py-2 text-base outline-none flex-1"
                    style={{ borderColor: "var(--farbe-warm-akzent-hell)", background: "var(--farbe-warm-bg)" }} />
                )}
              </div>
              <textarea placeholder="Notiz (optional)" value={terminBeschr} onChange={e => setTerminBeschr(e.target.value)}
                rows={2} className="rounded-2xl border-2 px-4 py-3 text-base w-full outline-none resize-none"
                style={{ borderColor: "var(--farbe-warm-akzent-hell)", background: "var(--farbe-warm-bg)" }} />
              {fehler && <p className="text-red-600 text-sm">{fehler}</p>}
              <div className="flex gap-3">
                <button onClick={handleSpeichern} disabled={speichert}
                  className="flex-1 rounded-2xl py-3 text-base font-bold text-white disabled:opacity-50"
                  style={{ background: "#C1703A", minHeight: "52px" }}>
                  {speichert ? "Wird gespeichert…" : "Termin speichern 📅"}
                </button>
                <button onClick={() => setFormTyp(null)} className="rounded-2xl px-4 py-3 text-base"
                  style={{ background: "var(--farbe-warm-bg)", color: "var(--farbe-warm-text)", minHeight: "52px" }}>
                  Abbrechen
                </button>
              </div>
            </div>
          )}

          {/* Besuch-Formular */}
          {formTyp === "besuch" && (
            <div className="px-5 pb-5 flex flex-col gap-3">
              <input type="time" value={besuchZeit} onChange={e => setBesuchZeit(e.target.value)}
                className="rounded-2xl border-2 px-4 py-3 text-base w-full outline-none"
                style={{ borderColor: "#4CAF50", background: "var(--farbe-warm-bg)" }} />
              <textarea placeholder="Nachricht an Oma (optional)" value={besuchNachricht} onChange={e => setBesuchNachricht(e.target.value)}
                rows={2} className="rounded-2xl border-2 px-4 py-3 text-base w-full outline-none resize-none"
                style={{ borderColor: "var(--farbe-warm-akzent-hell)", background: "var(--farbe-warm-bg)" }} />
              {fehler && <p className="text-red-600 text-sm">{fehler}</p>}
              <div className="flex gap-3">
                <button onClick={handleSpeichern} disabled={speichert}
                  className="flex-1 rounded-2xl py-3 text-base font-bold text-white disabled:opacity-50"
                  style={{ background: "#4CAF50", minHeight: "52px" }}>
                  {speichert ? "Wird gespeichert…" : "Besuch ankündigen ❤️"}
                </button>
                <button onClick={() => setFormTyp(null)} className="rounded-2xl px-4 py-3 text-base"
                  style={{ background: "var(--farbe-warm-bg)", color: "var(--farbe-warm-text)", minHeight: "52px" }}>
                  Abbrechen
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {laedt && <p className="text-center py-6" style={{ color: "var(--farbe-warm-text-weich)" }}>Wird geladen…</p>}
    </div>
  );
}
