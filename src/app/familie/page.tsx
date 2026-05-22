import { createClient } from "@/lib/supabase/server";
import { getEigenePerson } from "@/lib/auth";
import { formatiereDatumKurz, formatiereZeit } from "@/lib/datum";
import Link from "next/link";
import WohlbefindenFeed from "@/components/familie/WohlbefindenFeed";

async function ladeDaten() {
  const supabase = await createClient();
  const heute = new Date().toISOString().split("T")[0];

  const [{ data: naechsteBesuche }, { data: naechsteTermine }] = await Promise.all([
    supabase
      .from("besuche")
      .select("id, besuchs_datum, besuchs_zeit, besucher:personen(name)")
      .eq("status", "angekuendigt")
      .gte("besuchs_datum", heute)
      .order("besuchs_datum", { ascending: true })
      .limit(3),
    supabase
      .from("kalender_eintraege")
      .select("id, titel, termin_datum, termin_zeit")
      .gte("termin_datum", heute)
      .order("termin_datum", { ascending: true })
      .limit(3),
  ]);

  return {
    naechsteBesuche: naechsteBesuche ?? [],
    naechsteTermine: naechsteTermine ?? [],
  };
}

export default async function FamilieDashboard() {
  const person = await getEigenePerson();
  const { naechsteBesuche, naechsteTermine } = await ladeDaten();

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold" style={{ color: "var(--farbe-warm-text)" }}>
        Hallo, {person?.spitzname ?? person?.name ?? ""} 👋
      </h1>

      {/* Wohlbefinden-Feed (Realtime) */}
      <WohlbefindenFeed />

      {/* Schnellzugriff – 2 × 2 */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { href: "/familie/kalender", icon: "📅", label: "Kalender & Besuche", sub: "Termin eintragen oder ankündigen" },
          { href: "/familie/fotos/hochladen", icon: "📸", label: "Foto hochladen", sub: "Für Oma freigeben" },
          { href: "/familie/nachrichten", icon: "✉️", label: "Nachricht senden", sub: "Brief an Oma schreiben" },
          { href: "/familie/fotos", icon: "🖼️", label: "Alle Fotos", sub: "Galerie verwalten" },
        ].map(({ href, icon, label, sub }) => (
          <Link
            key={href}
            href={href}
            className="rounded-2xl p-4 flex flex-col gap-1 transition-transform active:scale-97"
            style={{
              background: "var(--farbe-hell-karte)",
              border: "2px solid var(--farbe-warm-akzent-hell)",
              minHeight: "90px",
            }}
          >
            <span className="text-2xl" aria-hidden="true">{icon}</span>
            <span className="text-sm font-semibold leading-tight" style={{ color: "var(--farbe-warm-text)" }}>
              {label}
            </span>
            <span className="text-xs" style={{ color: "var(--farbe-warm-text-weich)" }}>{sub}</span>
          </Link>
        ))}
      </div>

      {/* Angekündigte Besuche */}
      {naechsteBesuche.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold" style={{ color: "var(--farbe-warm-text)" }}>
              Angekündigte Besuche
            </h2>
            <Link href="/familie/kalender" className="text-sm" style={{ color: "var(--farbe-warm-akzent)" }}>
              Alle →
            </Link>
          </div>
          <div className="flex flex-col gap-2">
            {naechsteBesuche.map((b) => {
              const besucher = Array.isArray(b.besucher) ? b.besucher[0] : b.besucher;
              return (
                <div
                  key={b.id}
                  className="rounded-xl px-4 py-3 flex items-center gap-3"
                  style={{ background: "var(--farbe-gruen-hell)", border: "1px solid var(--farbe-gruen)" }}
                >
                  <span>🏠</span>
                  <div>
                    <span className="font-medium text-sm" style={{ color: "var(--farbe-warm-text)" }}>
                      {besucher?.name}
                    </span>
                    <span className="text-sm" style={{ color: "var(--farbe-warm-text-weich)" }}>
                      {" "}– {formatiereDatumKurz(new Date(b.besuchs_datum))}
                      {b.besuchs_zeit ? ` um ${formatiereZeit(b.besuchs_zeit)}` : ""}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Nächste Termine */}
      {naechsteTermine.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold" style={{ color: "var(--farbe-warm-text)" }}>
              Nächste Termine
            </h2>
            <Link href="/familie/kalender" className="text-sm" style={{ color: "var(--farbe-warm-akzent)" }}>
              Alle →
            </Link>
          </div>
          <div className="flex flex-col gap-2">
            {naechsteTermine.map((t) => (
              <div
                key={t.id}
                className="rounded-xl px-4 py-3 flex items-center gap-3"
                style={{ background: "var(--farbe-hell-karte)", border: "1px solid var(--farbe-warm-akzent-hell)" }}
              >
                <span>📌</span>
                <div>
                  <span className="font-medium text-sm" style={{ color: "var(--farbe-warm-text)" }}>
                    {t.titel}
                  </span>
                  <span className="text-sm" style={{ color: "var(--farbe-warm-text-weich)" }}>
                    {" "}– {formatiereDatumKurz(new Date(t.termin_datum))}
                    {t.termin_zeit ? ` um ${formatiereZeit(t.termin_zeit)}` : ""}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
