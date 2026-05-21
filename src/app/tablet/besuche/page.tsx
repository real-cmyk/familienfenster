import { createAdminClient } from "@/lib/supabase/admin";
import { formatiereDatumKurz, formatiereZeit } from "@/lib/datum";

async function ladeDaten() {
  const supabase = createAdminClient();
  const heute = new Date().toISOString().split("T")[0];

  const [{ data: besuche }, { data: nachrichten }] = await Promise.all([
    supabase
      .from("besuche")
      .select(`id, besuchs_datum, besuchs_zeit, nachricht, status,
        besucher:personen(name)`)
      .eq("status", "angekuendigt")
      .gte("besuchs_datum", heute)
      .order("besuchs_datum", { ascending: true })
      .order("besuchs_zeit", { ascending: true }),

    supabase
      .from("nachrichten")
      .select(`id, text, erstellt_am,
        von_person:personen(name)`)
      .order("erstellt_am", { ascending: false })
      .limit(10),
  ]);

  return { besuche: besuche ?? [], nachrichten: nachrichten ?? [] };
}

function formatiereDatumZeit(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("de-DE", {
    weekday: "short",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function FamilieSeite() {
  const { besuche, nachrichten } = await ladeDaten();

  return (
    <div className="p-6 pb-8 flex flex-col gap-8">

      {/* ─── Besuche ─── */}
      <section>
        <h1 className="text-2xl font-bold mb-5" style={{ color: "var(--farbe-warm-text)" }}>
          Familie kommt vorbei 👨‍👩‍👧
        </h1>

        {besuche.length === 0 ? (
          <div
            className="rounded-3xl p-8 text-center"
            style={{ background: "var(--farbe-hell-karte)" }}
          >
            <p className="text-5xl mb-3">🏠</p>
            <p className="text-xl" style={{ color: "var(--farbe-warm-text-weich)" }}>
              Noch kein Besuch angekündigt.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {besuche.map((besuch) => {
              const besucher = Array.isArray(besuch.besucher)
                ? besuch.besucher[0]
                : besuch.besucher;
              return (
                <div
                  key={besuch.id}
                  className="rounded-3xl p-5"
                  style={{
                    background: "var(--farbe-gruen-hell)",
                    border: "3px solid var(--farbe-gruen)",
                  }}
                >
                  <div className="flex items-center gap-4">
                    <span className="text-4xl" aria-hidden="true">❤️</span>
                    <div>
                      <p className="text-xl font-bold" style={{ color: "var(--farbe-warm-text)" }}>
                        {besucher?.name ?? "Jemand aus der Familie"} kommt vorbei
                      </p>
                      <p className="text-base" style={{ color: "var(--farbe-warm-text-weich)" }}>
                        {formatiereDatumKurz(new Date(besuch.besuchs_datum))}
                        {besuch.besuchs_zeit
                          ? ` um ${formatiereZeit(besuch.besuchs_zeit)} Uhr`
                          : ""}
                      </p>
                    </div>
                  </div>
                  {besuch.nachricht && (
                    <p
                      className="text-base italic mt-3 pl-3"
                      style={{
                        color: "var(--farbe-gruen)",
                        borderLeft: "3px solid var(--farbe-gruen)",
                      }}
                    >
                      {besuch.nachricht}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ─── Nachrichten ─── */}
      <section>
        <h2 className="text-2xl font-bold mb-5" style={{ color: "var(--farbe-warm-text)" }}>
          Briefchen von der Familie ✉️
        </h2>

        {nachrichten.length === 0 ? (
          <div
            className="rounded-3xl p-8 text-center"
            style={{ background: "var(--farbe-hell-karte)" }}
          >
            <p className="text-5xl mb-3">✉️</p>
            <p className="text-xl" style={{ color: "var(--farbe-warm-text-weich)" }}>
              Noch keine Nachrichten.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {nachrichten.map((msg) => {
              const von = Array.isArray(msg.von_person)
                ? msg.von_person[0]
                : msg.von_person;
              return (
                <div
                  key={msg.id}
                  className="rounded-3xl p-5"
                  style={{
                    background: "var(--farbe-hell-karte)",
                    border: "2px solid var(--farbe-warm-akzent-hell)",
                  }}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-3xl" aria-hidden="true">💌</span>
                    <div>
                      <p className="text-lg font-bold" style={{ color: "var(--farbe-warm-akzent)" }}>
                        {von?.name ?? "Familie"}
                      </p>
                      <p className="text-sm" style={{ color: "var(--farbe-warm-text-weich)" }}>
                        {formatiereDatumZeit(msg.erstellt_am)}
                      </p>
                    </div>
                  </div>
                  <p className="text-lg leading-relaxed" style={{ color: "var(--farbe-warm-text)" }}>
                    {msg.text}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </section>

    </div>
  );
}
