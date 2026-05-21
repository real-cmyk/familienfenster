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

  return { naechsteBesuche: naechsteBesuche ?? [], naechsteTermine: naechsteTermine ?? [] };
}

export default async function FamilieDashboard() {
  const person = await getEigenePerson();
  const { naechsteBesuche, naechsteTermine } = await ladeDaten();

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-2xl font-bold" style={{ color: "var(--farbe-warm-text)" }}>
        Hallo, {person?.spitzname ?? person?.name ?? ""}
      </h1>

      {/* Wohlbefinden-Feed (Realtime) */}
      <WohlbefindenFeed />

      {/* Schnellzugriff */}
      <div className="grid grid-cols-2 gap-4">
        {[
          { href: "/familie/besuche/neu", icon: "👋", label: "Besuch ankündigen" },
          { href: "/familie/fotos/hochladen", icon: "📸", label: "Foto hochladen" },
          { href: "/familie/kalender", icon: "📅", label: "Termin eintragen" },
          { href: "/familie/nachrichten", icon: "💬", label: "Nachricht senden" },
        ].map(({ href, icon, label }) => (
          <Link
            key={href}
            href={href}
            className="rounded-2xl p-5 flex flex-col items-center gap-2 text-center transition-transform active:scale-97"
            style={{
              background: "var(--farbe-hell-karte)",
              border: "2px solid var(--farbe-warm-akzent-hell)",
              minHeight: "100px",
            }}
          >
            <span className="text-3xl" aria-hidden="true">{icon}</span>
            <span className="text-base font-medium" style={{ color: "var(--farbe-warm-text)" }}>{label}</span>
          </Link>
        ))}
      </div>

      {/* Kommende Besuche */}
      {naechsteBesuche.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-3" style={{ color: "var(--farbe-warm-text)" }}>
            Angekündigte Besuche
          </h2>
          <div className="flex flex-col gap-2">
            {naechsteBesuche.map((b) => {
              const besucher = Array.isArray(b.besucher) ? b.besucher[0] : b.besucher;
              return (
                <div
                  key={b.id}
                  className="rounded-xl px-4 py-3"
                  style={{ background: "var(--farbe-gruen-hell)", border: "1px solid var(--farbe-gruen)" }}
                >
                  <span className="font-medium" style={{ color: "var(--farbe-warm-text)" }}>
                    {besucher?.name}
                  </span>{" "}
                  <span style={{ color: "var(--farbe-warm-text-weich)" }}>
                    – {formatiereDatumKurz(new Date(b.besuchs_datum))}
                    {b.besuchs_zeit ? ` um ${formatiereZeit(b.besuchs_zeit)}` : ""}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Kommende Termine */}
      {naechsteTermine.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-3" style={{ color: "var(--farbe-warm-text)" }}>
            Nächste Termine
          </h2>
          <div className="flex flex-col gap-2">
            {naechsteTermine.map((t) => (
              <div
                key={t.id}
                className="rounded-xl px-4 py-3"
                style={{ background: "var(--farbe-hell-karte)", border: "1px solid var(--farbe-warm-akzent-hell)" }}
              >
                <span className="font-medium" style={{ color: "var(--farbe-warm-text)" }}>{t.titel}</span>{" "}
                <span style={{ color: "var(--farbe-warm-text-weich)" }}>
                  – {formatiereDatumKurz(new Date(t.termin_datum))}
                  {t.termin_zeit ? ` um ${formatiereZeit(t.termin_zeit)}` : ""}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
