import { createAdminClient } from "@/lib/supabase/admin";
import { formatiereDatum, tageszeitGruss, formatiereZeit, formatiereDatumKurz } from "@/lib/datum";
import WohlbefindenButton from "@/components/tablet/WohlbefindenButton";
import FotoKarussell from "@/components/tablet/FotoKarussell";

async function ladeDaten() {
  const supabase = createAdminClient();
  const heute = new Date().toISOString().split("T")[0];

  const [{ data: termine }, { data: fotos }] = await Promise.all([
    supabase
      .from("kalender_eintraege")
      .select("id, titel, termin_datum, termin_zeit, ganztaegig")
      .gte("termin_datum", heute)
      .order("termin_datum", { ascending: true })
      .order("termin_zeit", { ascending: true })
      .limit(3),
    supabase
      .from("fotos")
      .select("id, storage_key, beschriftung")
      .eq("status", "genehmigt")
      .order("anzeige_reihenfolge", { ascending: true })
      .limit(20),
  ]);

  return { termine: termine ?? [], fotos: fotos ?? [] };
}

export default async function TabletHomescreen() {
  const { termine, fotos } = await ladeDaten();
  const jetzt = new Date();
  const gruss = tageszeitGruss();
  const datumText = formatiereDatum(jetzt);

  const naechsterTermin = termine[0];

  return (
    <div className="flex flex-col min-h-full p-6 gap-6">
      {/* Kopfbereich: Gruß + Datum */}
      <div className="text-center pt-4">
        <p className="text-2xl font-semibold" style={{ color: "var(--farbe-warm-akzent)" }}>
          {gruss} ❤️
        </p>
        <p className="text-xl mt-1" style={{ color: "var(--farbe-warm-text-weich)" }}>
          {datumText}
        </p>
      </div>

      {/* Foto-Diashow */}
      {fotos.length > 0 && (
        <div className="rounded-3xl overflow-hidden" style={{ height: "240px" }}>
          <FotoKarussell fotos={fotos} />
        </div>
      )}

      {/* Nächster Termin */}
      <div
        className="rounded-3xl p-5"
        style={{ background: "var(--farbe-hell-karte)", border: "2px solid var(--farbe-warm-akzent-hell)" }}
      >
        <p className="text-base font-semibold mb-2" style={{ color: "var(--farbe-warm-text-weich)" }}>
          {termine.length === 0 ? "Keine weiteren Termine" : "Nächster Termin"}
        </p>
        {naechsterTermin ? (
          <>
            <p className="text-2xl font-bold" style={{ color: "var(--farbe-warm-text)" }}>
              {naechsterTermin.ganztaegig
                ? naechsterTermin.titel
                : `${formatiereZeit(naechsterTermin.termin_zeit ?? "00:00")} – ${naechsterTermin.titel}`}
            </p>
            <p className="text-base mt-1" style={{ color: "var(--farbe-warm-text-weich)" }}>
              {formatiereDatumKurz(new Date(naechsterTermin.termin_datum))}
            </p>
          </>
        ) : (
          <p className="text-xl" style={{ color: "var(--farbe-warm-text-weich)" }}>
            Diese Woche ist noch nichts eingetragen.
          </p>
        )}
      </div>

      {/* Wohlbefinden-Button */}
      <div className="flex justify-center pb-4">
        <WohlbefindenButton />
      </div>
    </div>
  );
}
