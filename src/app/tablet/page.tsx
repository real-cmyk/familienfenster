import { createAdminClient } from "@/lib/supabase/admin";
import { formatiereDatum, tageszeitGruss, formatiereZeit, formatiereDatumKurz } from "@/lib/datum";
import WohlbefindenButton from "@/components/tablet/WohlbefindenButton";
import Link from "next/link";

/* ── SVG-Illustrationen ───────────────────────────────────────────────── */

function KalenderIllustration() {
  return (
    <svg viewBox="0 0 160 130" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"
      style={{ width: "100%", height: "100%", display: "block" }}>
      {/* Schatten */}
      <rect x="18" y="22" width="124" height="96" rx="12" fill="rgba(0,0,0,0.12)" />
      {/* Kalender-Körper */}
      <rect x="14" y="18" width="124" height="96" rx="12" fill="white" />
      {/* Kopfleiste */}
      <rect x="14" y="18" width="124" height="30" rx="12" fill="#C1703A" />
      <rect x="14" y="36" width="124" height="12" fill="#C1703A" />
      {/* Spiralen */}
      <circle cx="44" cy="18" r="6" fill="white" stroke="#C1703A" strokeWidth="2" />
      <circle cx="72" cy="18" r="6" fill="white" stroke="#C1703A" strokeWidth="2" />
      <circle cx="100" cy="18" r="6" fill="white" stroke="#C1703A" strokeWidth="2" />
      <circle cx="128" cy="18" r="6" fill="white" stroke="#C1703A" strokeWidth="2" />
      {/* Monat Text-Platzhalter */}
      <rect x="52" y="26" width="48" height="8" rx="4" fill="rgba(255,255,255,0.5)" />
      {/* Tage-Raster: 7 Spalten × 3 Reihen */}
      {[0,1,2,3,4,5,6].map(c => (
        <rect key={`r1-${c}`} x={20 + c*17} y="56" width="13" height="13" rx="3" fill="#FDE8D0" />
      ))}
      {[0,1,2,3,4,5,6].map(c => (
        <rect key={`r2-${c}`} x={20 + c*17} y="74" width="13" height="13" rx="3" fill="#FDE8D0" />
      ))}
      {[0,1,2,3,4,5].map(c => (
        <rect key={`r3-${c}`} x={20 + c*17} y="92" width="13" height="13" rx="3" fill="#FDE8D0" />
      ))}
      {/* Hervorgehobener Tag (orange) */}
      <rect x="71" y="74" width="13" height="13" rx="3" fill="#C1703A" />
      <text x="77.5" y="84" textAnchor="middle" fontSize="9" fontWeight="bold" fill="white">14</text>
      {/* Herzchen */}
      <path d="M120 96 C120 92 124 89 128 94 C132 89 136 92 136 96 C136 103 128 110 128 110 C128 110 120 103 120 96Z"
        fill="#E8623A" />
    </svg>
  );
}

function FotosIllustration() {
  return (
    <svg viewBox="0 0 160 130" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"
      style={{ width: "100%", height: "100%", display: "block" }}>
      {/* Hintere Fotos (gestapelt) */}
      <rect x="38" y="10" width="84" height="100" rx="6" fill="#d4ecc5"
        transform="rotate(7 80 60)" />
      <rect x="28" y="10" width="84" height="100" rx="6" fill="#c8e6fa"
        transform="rotate(-5 80 60)" />
      {/* Vorderes Polaroid – weiß */}
      <rect x="30" y="12" width="88" height="106" rx="6" fill="white"
        stroke="#3D2B1F" strokeWidth="3" />
      {/* Foto-Bereich */}
      <rect x="38" y="20" width="72" height="70" rx="4" fill="#AEE4F8" />
      {/* Hügel */}
      <ellipse cx="74" cy="86" rx="42" ry="16" fill="#7DC87D" />
      <ellipse cx="74" cy="82" rx="30" ry="12" fill="#5BB55B" />
      {/* Sonne */}
      <circle cx="98" cy="32" r="12" fill="#F9C784" stroke="#E8A020" strokeWidth="2" />
      {/* Sonne-Strahlen */}
      {[0,45,90,135,180,225,270,315].map(deg => {
        const rad = deg * Math.PI / 180;
        return <line key={deg}
          x1={98 + 14 * Math.cos(rad)} y1={32 + 14 * Math.sin(rad)}
          x2={98 + 20 * Math.cos(rad)} y2={32 + 20 * Math.sin(rad)}
          stroke="#E8A020" strokeWidth="2" strokeLinecap="round" />;
      })}
      {/* Herz auf Hügel */}
      <path d="M66 74 C66 70 70 67 74 72 C78 67 82 70 82 74 C82 80 74 86 74 86 C74 86 66 80 66 74Z"
        fill="#E8623A" />
      {/* Unterschrift-Linie */}
      <rect x="42" y="98" width="64" height="7" rx="3" fill="#DEB8A0" />
      <rect x="52" y="109" width="44" height="5" rx="2" fill="#EDD0BC" />
    </svg>
  );
}

function MusikIllustration() {
  return (
    <svg viewBox="0 0 160 130" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"
      style={{ width: "100%", height: "100%", display: "block" }}>
      {/* Schallplatten-Schatten */}
      <circle cx="82" cy="68" r="52" fill="rgba(0,0,0,0.15)" />
      {/* Schallplatte */}
      <circle cx="80" cy="65" r="52" fill="#2C1A10" />
      {/* Rillen */}
      {[44,38,32,26,20].map(r => (
        <circle key={r} cx="80" cy="65" r={r} fill="none"
          stroke="rgba(255,255,255,0.12)" strokeWidth="2.5" />
      ))}
      {/* Label */}
      <circle cx="80" cy="65" r="16" fill="#C1703A" />
      <circle cx="80" cy="65" r="10" fill="#9D5520" />
      {/* Mittelloch */}
      <circle cx="80" cy="65" r="4" fill="#F5EDE8" />
      {/* Highlight-Glanz */}
      <ellipse cx="60" cy="42" rx="12" ry="7" fill="rgba(255,255,255,0.08)"
        transform="rotate(-30 60 42)" />
      {/* Musiknoten */}
      <text x="14" y="32" fontSize="28" fill="#9D5520" fontFamily="serif">♪</text>
      <text x="118" y="28" fontSize="22" fill="#9D5520" fontFamily="serif">♫</text>
      <text x="122" y="108" fontSize="24" fill="#9D5520" fontFamily="serif">♩</text>
      {/* Herz */}
      <path d="M12 84 C12 79 17 75 22 81 C27 75 32 79 32 84 C32 92 22 100 22 100 C22 100 12 92 12 84Z"
        fill="#E8623A" />
    </svg>
  );
}

function FamilieIllustration() {
  return (
    <svg viewBox="0 0 160 130" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"
      style={{ width: "100%", height: "100%", display: "block" }}>
      {/* Himmel-Hintergrund */}
      <rect x="8" y="8" width="144" height="114" rx="10" fill="#AEE4F8" />
      {/* Schatten Haus */}
      <path d="M28 72 L80 28 L132 72 L132 118 L28 118 Z" fill="rgba(0,0,0,0.1)" transform="translate(4,4)" />
      {/* Dach */}
      <path d="M24 72 L80 26 L136 72 Z" fill="#C1703A" stroke="#8B4513" strokeWidth="2" strokeLinejoin="round" />
      {/* Haus-Körper */}
      <rect x="28" y="70" width="104" height="50" rx="4" fill="#FDE8D0" stroke="#DEB8A0" strokeWidth="2" />
      {/* Boden */}
      <rect x="8" y="118" width="144" height="10" rx="4" fill="#7DC87D" />
      {/* Fenster links */}
      <rect x="36" y="80" width="28" height="26" rx="4" fill="#AEE4F8" stroke="#3D2B1F" strokeWidth="2" />
      <line x1="50" y1="80" x2="50" y2="106" stroke="#3D2B1F" strokeWidth="1.5" />
      <line x1="36" y1="93" x2="64" y2="93" stroke="#3D2B1F" strokeWidth="1.5" />
      {/* Tür */}
      <rect x="66" y="88" width="28" height="32" rx="4" fill="#C1703A" stroke="#8B4513" strokeWidth="2" />
      <circle cx="90" cy="104" r="3" fill="#F9C784" />
      {/* Fenster rechts */}
      <rect x="96" y="80" width="28" height="26" rx="4" fill="#AEE4F8" stroke="#3D2B1F" strokeWidth="2" />
      <line x1="110" y1="80" x2="110" y2="106" stroke="#3D2B1F" strokeWidth="1.5" />
      <line x1="96" y1="93" x2="124" y2="93" stroke="#3D2B1F" strokeWidth="1.5" />
      {/* Kamin */}
      <rect x="108" y="38" width="14" height="22" rx="3" fill="#DEB8A0" stroke="#C1703A" strokeWidth="1.5" />
      {/* Rauch */}
      <path d="M112 38 Q108 28 114 20 Q120 12 116 4" fill="none"
        stroke="rgba(100,80,70,0.4)" strokeWidth="3" strokeLinecap="round" />
      {/* Herz über dem Haus */}
      <path d="M68 14 C68 9 73 5 80 11 C87 5 92 9 92 14 C92 22 80 30 80 30 C80 30 68 22 68 14Z"
        fill="#E8623A" stroke="white" strokeWidth="1.5" />
    </svg>
  );
}

/* ── Daten laden ──────────────────────────────────────────────────────── */

async function ladeDaten() {
  const supabase = createAdminClient();
  const heute = new Date().toISOString().split("T")[0];

  const [{ data: termine }, { data: omas }] = await Promise.all([
    supabase
      .from("kalender_eintraege")
      .select("id, titel, termin_datum, termin_zeit, ganztaegig")
      .gte("termin_datum", heute)
      .order("termin_datum", { ascending: true })
      .order("termin_zeit", { ascending: true })
      .limit(1),
    supabase
      .from("personen")
      .select("name, spitzname")
      .eq("rolle", "oma")
      .limit(1),
  ]);

  return {
    naechsterTermin: termine?.[0] ?? null,
    omaName: omas?.[0]?.spitzname ?? omas?.[0]?.name ?? null,
  };
}

/* ── Kachel-Konfiguration ─────────────────────────────────────────────── */

const KACHELN = [
  {
    href: "/tablet/kalender",
    label: "Termine",
    farbe: "#FDF0E4",
    rand: "#C1703A",
    textFarbe: "#7A3A10",
    Bild: KalenderIllustration,
  },
  {
    href: "/tablet/fotos",
    label: "Fotos",
    farbe: "#E8F5E9",
    rand: "#4CAF50",
    textFarbe: "#1B5E20",
    Bild: FotosIllustration,
  },
  {
    href: "/tablet/musik",
    label: "Musik",
    farbe: "#EDE7F6",
    rand: "#7B1FA2",
    textFarbe: "#4A148C",
    Bild: MusikIllustration,
  },
  {
    href: "/tablet/besuche",
    label: "Familie",
    farbe: "#FFF8E1",
    rand: "#E8623A",
    textFarbe: "#8B2500",
    Bild: FamilieIllustration,
  },
];

/* ── Seite ────────────────────────────────────────────────────────────── */

export default async function TabletHomescreen() {
  const { naechsterTermin, omaName } = await ladeDaten();
  const jetzt = new Date();
  const gruss = tageszeitGruss();
  const datumText = formatiereDatum(jetzt);

  return (
    <div className="flex flex-col min-h-full p-5 gap-5">

      {/* Kopfbereich */}
      <div className="text-center pt-2">
        <p className="text-3xl font-bold" style={{ color: "var(--farbe-warm-akzent)" }}>
          {gruss}{omaName ? `, ${omaName}` : ""} ❤️
        </p>
        <p className="text-lg mt-1" style={{ color: "var(--farbe-warm-text-weich)" }}>
          {datumText}
        </p>
      </div>

      {/* Nächster Termin – kompakt */}
      {naechsterTermin ? (
        <div
          className="rounded-2xl px-5 py-4 flex items-center gap-3"
          style={{
            background: "var(--farbe-hell-karte)",
            border: "2px solid var(--farbe-warm-akzent-hell)",
          }}
        >
          <span className="text-3xl" aria-hidden="true">📅</span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide"
              style={{ color: "var(--farbe-warm-text-weich)" }}>
              Nächster Termin
            </p>
            <p className="text-lg font-bold leading-tight"
              style={{ color: "var(--farbe-warm-text)" }}>
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
          style={{
            background: "var(--farbe-hell-karte)",
            border: "2px solid var(--farbe-warm-akzent-hell)",
          }}
        >
          <span className="text-2xl" aria-hidden="true">📅</span>
          <p className="text-base" style={{ color: "var(--farbe-warm-text-weich)" }}>
            Heute stehen keine Termine an
          </p>
        </div>
      )}

      {/* Kachel-Raster 2×2 */}
      <div className="grid grid-cols-2 gap-4" style={{ flex: "1 1 0" }}>
        {KACHELN.map(({ href, label, farbe, rand, textFarbe, Bild }) => (
          <Link
            key={href}
            href={href}
            className="rounded-3xl flex flex-col items-center justify-end transition-transform active:scale-95"
            style={{
              background: farbe,
              border: `4px solid ${rand}`,
              minHeight: "170px",
              overflow: "hidden",
              position: "relative",
              paddingBottom: "12px",
            }}
          >
            {/* Illustration füllt obere 3/4 */}
            <div style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: "42px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "8px",
            }}>
              <Bild />
            </div>
            {/* Label unten */}
            <p
              className="text-lg font-extrabold text-center"
              style={{
                color: textFarbe,
                position: "relative",
                zIndex: 1,
                textShadow: "0 1px 2px rgba(255,255,255,0.8)",
                letterSpacing: "0.02em",
              }}
            >
              {label}
            </p>
          </Link>
        ))}
      </div>

      {/* Lina-Avatar – breite Kachel */}
      <Link
        href="/tablet/avatar"
        className="rounded-3xl flex items-center gap-5 px-6 transition-transform active:scale-95 shrink-0"
        style={{
          background: "#FFF0F5",
          border: "4px solid #E91E8C",
          minHeight: "80px",
        }}
      >
        <span className="text-5xl shrink-0" aria-hidden="true">💬</span>
        <div>
          <p className="text-lg font-extrabold" style={{ color: "#880E4F" }}>
            Mit Lina snacken
          </p>
          <p className="text-sm" style={{ color: "#AD1457" }}>
            Plattdüütsche Gesprächspartnerin
          </p>
        </div>
      </Link>

      {/* Wohlbefinden-Button */}
      <div className="flex justify-center pb-2">
        <WohlbefindenButton />
      </div>

    </div>
  );
}
