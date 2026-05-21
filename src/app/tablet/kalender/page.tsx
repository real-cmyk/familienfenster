import { createAdminClient } from "@/lib/supabase/admin";
import { formatiereDatumKurz, formatiereZeit } from "@/lib/datum";

async function ladeTermine() {
  const supabase = createAdminClient();
  const heute = new Date().toISOString().split("T")[0];
  const inSiebenTagen = new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0];

  const { data } = await supabase
    .from("kalender_eintraege")
    .select("id, titel, beschreibung, termin_datum, termin_zeit, ganztaegig")
    .gte("termin_datum", heute)
    .lte("termin_datum", inSiebenTagen)
    .order("termin_datum", { ascending: true })
    .order("termin_zeit", { ascending: true });

  return data ?? [];
}

function gruppiereNachTag(termine: Awaited<ReturnType<typeof ladeTermine>>) {
  const gruppen: Record<string, typeof termine> = {};
  for (const t of termine) {
    if (!gruppen[t.termin_datum]) gruppen[t.termin_datum] = [];
    gruppen[t.termin_datum].push(t);
  }
  return gruppen;
}

export default async function KalenderSeite() {
  const termine = await ladeTermine();
  const gruppen = gruppiereNachTag(termine);
  const tage = Object.keys(gruppen).sort();

  return (
    <div className="p-6 pb-4">
      <h1 className="text-2xl font-bold mb-6" style={{ color: "var(--farbe-warm-text)" }}>
        Kalender
      </h1>

      {tage.length === 0 ? (
        <div
          className="rounded-3xl p-8 text-center"
          style={{ background: "var(--farbe-hell-karte)" }}
        >
          <p className="text-5xl mb-4">📅</p>
          <p className="text-xl" style={{ color: "var(--farbe-warm-text-weich)" }}>
            Diese Woche sind keine Termine eingetragen.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          {tage.map((datum) => (
            <div key={datum}>
              <p
                className="text-lg font-bold mb-3 px-1"
                style={{ color: "var(--farbe-warm-akzent)" }}
              >
                {formatiereDatumKurz(new Date(datum))}
              </p>
              <div className="flex flex-col gap-3">
                {gruppen[datum].map((termin) => (
                  <div
                    key={termin.id}
                    className="rounded-2xl p-5"
                    style={{
                      background: "var(--farbe-hell-karte)",
                      border: "2px solid var(--farbe-warm-akzent-hell)",
                    }}
                  >
                    <p className="text-xl font-semibold" style={{ color: "var(--farbe-warm-text)" }}>
                      {!termin.ganztaegig && termin.termin_zeit
                        ? `${formatiereZeit(termin.termin_zeit)} – `
                        : ""}
                      {termin.titel}
                    </p>
                    {termin.beschreibung && (
                      <p className="text-base mt-1" style={{ color: "var(--farbe-warm-text-weich)" }}>
                        {termin.beschreibung}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
