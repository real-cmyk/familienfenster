import { createAdminClient } from "@/lib/supabase/admin";
import { formatiereDatumKurz, formatiereZeit } from "@/lib/datum";

async function ladeBesuche() {
  const supabase = createAdminClient();
  const heute = new Date().toISOString().split("T")[0];

  const { data } = await supabase
    .from("besuche")
    .select(`
      id, besuchs_datum, besuchs_zeit, nachricht, status,
      besucher:personen(name, avatar_storage_key)
    `)
    .eq("status", "angekuendigt")
    .gte("besuchs_datum", heute)
    .order("besuchs_datum", { ascending: true })
    .order("besuchs_zeit", { ascending: true });

  return data ?? [];
}

export default async function BesucheSeite() {
  const besuche = await ladeBesuche();

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6" style={{ color: "var(--farbe-warm-text)" }}>
        Familie kommt vorbei
      </h1>

      {besuche.length === 0 ? (
        <div
          className="rounded-3xl p-8 text-center"
          style={{ background: "var(--farbe-hell-karte)" }}
        >
          <p className="text-5xl mb-4">👨‍👩‍👧</p>
          <p className="text-xl" style={{ color: "var(--farbe-warm-text-weich)" }}>
            Noch keine Besuche angekündigt.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          {besuche.map((besuch) => {
            const besucher = Array.isArray(besuch.besucher)
              ? besuch.besucher[0]
              : besuch.besucher;
            return (
              <div
                key={besuch.id}
                className="rounded-3xl p-6"
                style={{
                  background: "var(--farbe-gruen-hell)",
                  border: "2px solid var(--farbe-gruen)",
                }}
              >
                <div className="flex items-center gap-4 mb-3">
                  <span className="text-4xl" aria-hidden="true">❤️</span>
                  <div>
                    <p className="text-xl font-bold" style={{ color: "var(--farbe-warm-text)" }}>
                      {besucher?.name ?? "Jemand aus der Familie"} kommt vorbei
                    </p>
                    <p className="text-base" style={{ color: "var(--farbe-warm-text-weich)" }}>
                      {formatiereDatumKurz(new Date(besuch.besuchs_datum))}
                      {besuch.besuchs_zeit
                        ? ` um ${formatiereZeit(besuch.besuchs_zeit)}`
                        : ""}
                    </p>
                  </div>
                </div>
                {besuch.nachricht && (
                  <p
                    className="text-base italic px-1"
                    style={{ color: "var(--farbe-gruen)", borderLeft: "3px solid var(--farbe-gruen)", paddingLeft: "12px" }}
                  >
                    {besuch.nachricht}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
