import { createAdminClient } from "@/lib/supabase/admin";
import { formatiereDatumKurz, formatiereZeit } from "@/lib/datum";

type Eintrag =
  | { typ: "termin"; id: string; titel: string; zeit: string | null; ganztaegig: boolean; beschreibung?: string | null }
  | { typ: "besuch"; id: string; name: string; zeit: string | null; nachricht?: string | null };

async function ladeEintraege(): Promise<Record<string, Eintrag[]>> {
  const supabase = createAdminClient();
  const heute = new Date().toISOString().split("T")[0];
  const in14Tagen = new Date(Date.now() + 14 * 86400000).toISOString().split("T")[0];

  const [termineRes, besuche14Res] = await Promise.all([
    supabase
      .from("kalender_eintraege")
      .select("id, titel, beschreibung, termin_datum, termin_zeit, ganztaegig")
      .gte("termin_datum", heute)
      .lte("termin_datum", in14Tagen)
      .order("termin_datum", { ascending: true })
      .order("termin_zeit", { ascending: true }),
    supabase
      .from("besuche")
      .select("id, besuchs_datum, besuchs_zeit, nachricht, personen(name, spitzname)")
      .gte("besuchs_datum", heute)
      .lte("besuchs_datum", in14Tagen)
      .eq("status", "geplant")
      .order("besuchs_datum", { ascending: true })
      .order("besuchs_zeit", { ascending: true }),
  ]);

  const gruppen: Record<string, Eintrag[]> = {};

  for (const t of termineRes.data ?? []) {
    if (!gruppen[t.termin_datum]) gruppen[t.termin_datum] = [];
    gruppen[t.termin_datum].push({
      typ: "termin",
      id: t.id,
      titel: t.titel,
      zeit: t.termin_zeit ?? null,
      ganztaegig: t.ganztaegig,
      beschreibung: t.beschreibung,
    });
  }

  for (const b of besuche14Res.data ?? []) {
    const datum = b.besuchs_datum;
    if (!gruppen[datum]) gruppen[datum] = [];
    const person = Array.isArray(b.personen) ? b.personen[0] : b.personen;
    gruppen[datum].push({
      typ: "besuch",
      id: b.id,
      name: (person as { name: string; spitzname?: string | null })?.spitzname ?? (person as { name: string })?.name ?? "Besuch",
      zeit: b.besuchs_zeit ?? null,
      nachricht: b.nachricht,
    });
  }

  // Sort entries within each day by time (null = end of list)
  for (const dag of Object.keys(gruppen)) {
    gruppen[dag].sort((a, b) => {
      const ta = a.zeit ?? "99:99";
      const tb = b.zeit ?? "99:99";
      return ta.localeCompare(tb);
    });
  }

  return gruppen;
}

const WOCHENTAG = ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"];

export default async function TabletKalenderSeite() {
  const gruppen = await ladeEintraege();
  const tage = Object.keys(gruppen).sort();

  return (
    <div className="p-5 pb-8">
      <h1 className="text-3xl font-bold mb-6" style={{ color: "var(--farbe-warm-text)" }}>
        Kalender
      </h1>

      {tage.length === 0 ? (
        <div
          className="rounded-3xl p-10 text-center"
          style={{ background: "var(--farbe-hell-karte)" }}
        >
          <p className="text-6xl mb-4">📅</p>
          <p className="text-2xl" style={{ color: "var(--farbe-warm-text-weich)" }}>
            In den nächsten zwei Wochen sind keine Termine eingetragen.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {tage.map((datum) => {
            const d = new Date(datum + "T12:00:00");
            const wt = WOCHENTAG[d.getDay()];
            const istHeute = datum === new Date().toISOString().split("T")[0];
            return (
              <div key={datum}>
                {/* Tages-Header */}
                <div
                  className="flex items-center gap-3 mb-3 px-1"
                >
                  <div
                    className="rounded-2xl px-4 py-2 font-bold text-lg"
                    style={{
                      background: istHeute ? "var(--farbe-warm-akzent)" : "var(--farbe-warm-akzent-hell)",
                      color: istHeute ? "white" : "var(--farbe-warm-akzent)",
                      minWidth: "56px",
                      textAlign: "center",
                    }}
                  >
                    {wt}
                  </div>
                  <p className="text-xl font-bold" style={{ color: "var(--farbe-warm-text)" }}>
                    {formatiereDatumKurz(d)}
                    {istHeute && (
                      <span className="ml-2 text-base font-normal" style={{ color: "var(--farbe-warm-akzent)" }}>
                        • Heute
                      </span>
                    )}
                  </p>
                </div>

                {/* Einträge */}
                <div className="flex flex-col gap-3">
                  {gruppen[datum].map((eintrag) =>
                    eintrag.typ === "besuch" ? (
                      <div
                        key={eintrag.id}
                        className="rounded-2xl p-5 flex gap-4 items-start"
                        style={{
                          background: "#F0FBF0",
                          border: "2px solid #86EFAC",
                        }}
                      >
                        <span className="text-3xl mt-1">🏠</span>
                        <div>
                          <p className="text-xl font-semibold" style={{ color: "#166534" }}>
                            {eintrag.zeit ? `${formatiereZeit(eintrag.zeit)} – ` : ""}
                            {eintrag.name} kommt zu Besuch
                          </p>
                          {eintrag.nachricht && (
                            <p className="text-base mt-1" style={{ color: "#15803D" }}>
                              „{eintrag.nachricht}"
                            </p>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div
                        key={eintrag.id}
                        className="rounded-2xl p-5 flex gap-4 items-start"
                        style={{
                          background: "var(--farbe-hell-karte)",
                          border: "2px solid var(--farbe-warm-akzent-hell)",
                        }}
                      >
                        <span className="text-3xl mt-1">📌</span>
                        <div>
                          <p className="text-xl font-semibold" style={{ color: "var(--farbe-warm-text)" }}>
                            {!eintrag.ganztaegig && eintrag.zeit
                              ? `${formatiereZeit(eintrag.zeit)} – `
                              : ""}
                            {eintrag.titel}
                          </p>
                          {eintrag.beschreibung && (
                            <p className="text-base mt-1" style={{ color: "var(--farbe-warm-text-weich)" }}>
                              {eintrag.beschreibung}
                            </p>
                          )}
                        </div>
                      </div>
                    )
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
