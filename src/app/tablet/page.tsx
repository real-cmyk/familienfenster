import { createAdminClient } from "@/lib/supabase/admin";
import { formatiereDatum, tageszeitGruss, formatiereZeit, formatiereDatumKurz } from "@/lib/datum";
import WohlbefindenButton from "@/components/tablet/WohlbefindenButton";
import Link from "next/link";

// SVG-Illustrationen für die Kacheln
function KalenderIllustration() {
  return (
    <svg viewBox="0 0 120 100" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      {/* Kalender-Seite */}
      <rect x="10" y="18" width="100" height="74" rx="10" fill="#FDE8D0" />
      <rect x="10" y="18" width="100" height="24" rx="10" fill="#C1703A" />
      <rect x="10" y="30" width="100" height="12" fill="#C1703A" />
      {/* Spiralbindung */}
      <circle cx="38" cy="18" r="5" fill="white" />
      <circle cx="60" cy="18" r="5" fill="white" />
      <circle cx="82" cy="18" r="5" fill="white" />
      {/* Monatstitel */}
      <rect x="30" y="24" width="60" height="8" rx="3" fill="rgba(255,255,255,0.4)" />
      {/* Tage-Raster */}
      {[0,1,2,3,4,5,6].map(col => (
        <rect key={col} x={15 + col * 13} y="52" width="9" height="9" rx="2" fill="rgba(193,112,58,0.15)" />
      ))}
      {[0,1,2,3,4,5,6].map(col => (
        <rect key={col} x={15 + col * 13} y="65" width="9" height="9" rx="2" fill="rgba(193,112,58,0.15)" />
      ))}
      {[0,1,2,3,4].map(col => (
        <rect key={col} x={15 + col * 13} y="78" width="9" height="9" rx="2" fill="rgba(193,112,58,0.15)" />
      ))}
      {/* Hervorgehobener Tag */}
      <rect x="54" y="65" width="9" height="9" rx="2" fill="#C1703A" />
      {/* Blümchen */}
      <circle cx="95" cy="78" r="7" fill="#F9C784" />
      <circle cx="95" cy="69" r="4" fill="#F9C784" />
      <circle cx="95" cy="87" r="4" fill="#F9C784" />
      <circle cx="88" cy="78" r="4" fill="#F9C784" />
      <circle cx="102" cy="78" r="4" fill="#F9C784" />
      <circle cx="95" cy="78" r="4" fill="#E8623A" />
    </svg>
  );
}

function FotosIllustration() {
  return (
    <svg viewBox="0 0 120 100" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      {/* Hinteres Foto */}
      <rect x="28" y="12" width="65" height="76" rx="4" fill="white" transform="rotate(6 28 12)" />
      {/* Mittleres Foto */}
      <rect x="18" y="14" width="65" height="76" rx="4" fill="white" transform="rotate(-4 18 14)" />
      {/* Vorderes Polaroid */}
      <rect x="22" y="16" width="70" height="74" rx="4" fill="white" />
      {/* Foto-Inhalt */}
      <rect x="28" y="22" width="58" height="52" rx="3" fill="#FDE8D0" />
      {/* Himmel */}
      <rect x="28" y="22" width="58" height="24" rx="3" fill="#AEE4F8" />
      {/* Hügel */}
      <ellipse cx="57" cy="52" rx="35" ry="14" fill="#7DC87D" />
      {/* Sonne */}
      <circle cx="72" cy="30" r="8" fill="#F9C784" />
      {/* Herzchen auf Foto */}
      <path d="M52 44 C52 41 56 38 60 43 C64 38 68 41 68 44 C68 50 60 56 60 56 C60 56 52 50 52 44Z" fill="#E8623A" />
      {/* Unterschrift */}
      <rect x="34" y="80" width="46" height="5" rx="2" fill="#DEB8A0" />
    </svg>
  );
}

function MusikIllustration() {
  return (
    <svg viewBox="0 0 120 100" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      {/* Schallplatte */}
      <circle cx="60" cy="52" r="38" fill="#3D2B1F" />
      <circle cx="60" cy="52" r="28" fill="#4a3528" />
      <circle cx="60" cy="52" r="18" fill="#3D2B1F" />
      <circle cx="60" cy="52" r="10" fill="#C1703A" />
      <circle cx="60" cy="52" r="4" fill="white" />
      {/* Rillen */}
      <circle cx="60" cy="52" r="34" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="2" />
      <circle cx="60" cy="52" r="30" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="2" />
      <circle cx="60" cy="52" r="26" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="2" />
      <circle cx="60" cy="52" r="22" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="2" />
      {/* Noten */}
      <text x="14" y="28" fontSize="20" fill="#C1703A">♪</text>
      <text x="88" y="24" fontSize="16" fill="#F9C784">♫</text>
      <text x="92" y="82" fontSize="18" fill="#C1703A">♪</text>
      {/* Herz */}
      <path d="M16 70 C16 67 20 64 24 69 C28 64 32 67 32 70 C32 76 24 82 24 82 C24 82 16 76 16 70Z" fill="#E8623A" />
    </svg>
  );
}

function FamilieIllustration() {
  return (
    <svg viewBox="0 0 120 100" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      {/* Haus */}
      <path d="M20 55 L60 20 L100 55 L100 88 L20 88 Z" fill="#FDE8D0" />
      <path d="M20 55 L60 20 L100 55 Z" fill="#C1703A" />
      {/* Fenster links */}
      <rect x="28" y="62" width="20" height="20" rx="3" fill="#AEE4F8" />
      <line x1="38" y1="62" x2="38" y2="82" stroke="white" strokeWidth="2" />
      <line x1="28" y1="72" x2="48" y2="72" stroke="white" strokeWidth="2" />
      {/* Tür */}
      <rect x="52" y="68" width="16" height="20" rx="3" fill="#C1703A" />
      <circle cx="64" cy="79" r="2" fill="#F9C784" />
      {/* Fenster rechts */}
      <rect x="72" y="62" width="20" height="20" rx="3" fill="#AEE4F8" />
      <line x1="82" y1="62" x2="82" y2="82" stroke="white" strokeWidth="2" />
      <line x1="72" y1="72" x2="92" y2="72" stroke="white" strokeWidth="2" />
      {/* Herzen */}
      <path d="M52 10 C52 7 56 4 60 9 C64 4 68 7 68 10 C68 16 60 22 60 22 C60 22 52 16 52 10Z" fill="#E8623A" />
      {/* Rauch/Kamin */}
      <rect x="70" y="28" width="8" height="14" rx="2" fill="#DEB8A0" />
      <path d="M71 28 Q74 22 77 28" fill="none" stroke="rgba(61,43,31,0.3)" strokeWidth="2" />
    </svg>
  );
}

async function ladeDaten() {
  const supabase = createAdminClient();
  const heute = new Date().toISOString().split("T")[0];

  const { data: termine } = await supabase
    .from("kalender_eintraege")
    .select("id, titel, termin_datum, termin_zeit, ganztaegig")
    .gte("termin_datum", heute)
    .order("termin_datum", { ascending: true })
    .order("termin_zeit", { ascending: true })
    .limit(1);

  return { naechsterTermin: termine?.[0] ?? null };
}

const KACHELN = [
  { href: "/tablet/kalender", label: "Termine", farbe: "#FDE8D0", rand: "#C1703A", Bild: KalenderIllustration },
  { href: "/tablet/fotos",    label: "Fotos",   farbe: "#E8F5E9", rand: "#7DC87D", Bild: FotosIllustration },
  { href: "/tablet/musik",    label: "Musik",   farbe: "#EDE7F6", rand: "#9575CD", Bild: MusikIllustration },
  { href: "/tablet/besuche",  label: "Familie", farbe: "#FFF3E0", rand: "#E8623A", Bild: FamilieIllustration },
];

export default async function TabletHomescreen() {
  const { naechsterTermin } = await ladeDaten();
  const jetzt = new Date();
  const gruss = tageszeitGruss();
  const datumText = formatiereDatum(jetzt);

  return (
    <div className="flex flex-col min-h-full p-5 gap-5">

      {/* Kopfbereich */}
      <div className="text-center pt-2">
        <p className="text-3xl font-bold" style={{ color: "var(--farbe-warm-akzent)" }}>
          {gruss} ❤️
        </p>
        <p className="text-lg mt-1" style={{ color: "var(--farbe-warm-text-weich)" }}>
          {datumText}
        </p>
      </div>

      {/* Nächster Termin – kompakt */}
      {naechsterTermin ? (
        <div
          className="rounded-2xl px-5 py-4 flex items-center gap-3"
          style={{ background: "var(--farbe-hell-karte)", border: "2px solid var(--farbe-warm-akzent-hell)" }}
        >
          <span className="text-3xl" aria-hidden="true">📅</span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--farbe-warm-text-weich)" }}>
              Nächster Termin
            </p>
            <p className="text-lg font-bold leading-tight" style={{ color: "var(--farbe-warm-text)" }}>
              {naechsterTermin.ganztaegig
                ? naechsterTermin.titel
                : `${formatiereZeit(naechsterTermin.termin_zeit ?? "00:00")} – ${naechsterTermin.titel}`}
            </p>
            <p className="text-sm" style={{ color: "var(--farbe-warm-text-weich)" }}>
              {formatiereDatumKurz(new Date(naechsterTermin.termin_datum))}
            </p>
          </div>
        </div>
      ) : (
        <div
          className="rounded-2xl px-5 py-3 flex items-center gap-3"
          style={{ background: "var(--farbe-hell-karte)", border: "2px solid var(--farbe-warm-akzent-hell)" }}
        >
          <span className="text-2xl" aria-hidden="true">📅</span>
          <p className="text-base" style={{ color: "var(--farbe-warm-text-weich)" }}>
            Heute stehen keine Termine an
          </p>
        </div>
      )}

      {/* Kachel-Raster 2×2 */}
      <div className="grid grid-cols-2 gap-4 flex-1">
        {KACHELN.map(({ href, label, farbe, rand, Bild }) => (
          <Link
            key={href}
            href={href}
            className="rounded-3xl flex flex-col items-center justify-between overflow-hidden transition-transform active:scale-95"
            style={{
              background: farbe,
              border: `3px solid ${rand}`,
              minHeight: "160px",
              padding: "16px 12px 12px",
            }}
          >
            <div className="w-full flex-1 flex items-center justify-center" style={{ maxHeight: "110px" }}>
              <Bild />
            </div>
            <p
              className="text-lg font-bold text-center mt-1"
              style={{ color: "var(--farbe-warm-text)" }}
            >
              {label}
            </p>
          </Link>
        ))}
      </div>

      {/* Wohlbefinden-Button */}
      <div className="flex justify-center pb-2">
        <WohlbefindenButton />
      </div>

    </div>
  );
}
