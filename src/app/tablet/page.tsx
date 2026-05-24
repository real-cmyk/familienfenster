import { createAdminClient } from "@/lib/supabase/admin";
import { formatiereDatum, tageszeitGruss, formatiereZeit, formatiereDatumKurz } from "@/lib/datum";
import WohlbefindenButton from "@/components/tablet/WohlbefindenButton";
import Link from "next/link";

/* ── SVG-Illustrationen ───────────────────────────────────────────────── */

function KalenderIllustration() {
  return (
    <svg viewBox="0 0 160 130" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"
      style={{ width: "100%", height: "100%", display: "block" }}>
      <rect x="18" y="22" width="124" height="96" rx="12" fill="rgba(0,0,0,0.12)" />
      <rect x="14" y="18" width="124" height="96" rx="12" fill="white" />
      <rect x="14" y="18" width="124" height="30" rx="12" fill="#C1703A" />
      <rect x="14" y="36" width="124" height="12" fill="#C1703A" />
      <circle cx="44" cy="18" r="6" fill="white" stroke="#C1703A" strokeWidth="2" />
      <circle cx="72" cy="18" r="6" fill="white" stroke="#C1703A" strokeWidth="2" />
      <circle cx="100" cy="18" r="6" fill="white" stroke="#C1703A" strokeWidth="2" />
      <circle cx="128" cy="18" r="6" fill="white" stroke="#C1703A" strokeWidth="2" />
      <rect x="52" y="26" width="48" height="8" rx="4" fill="rgba(255,255,255,0.5)" />
      {[0,1,2,3,4,5,6].map(c => (
        <rect key={`r1-${c}`} x={20 + c*17} y="56" width="13" height="13" rx="3" fill="#FDE8D0" />
      ))}
      {[0,1,2,3,4,5,6].map(c => (
        <rect key={`r2-${c}`} x={20 + c*17} y="74" width="13" height="13" rx="3" fill="#FDE8D0" />
      ))}
      {[0,1,2,3,4,5].map(c => (
        <rect key={`r3-${c}`} x={20 + c*17} y="92" width="13" height="13" rx="3" fill="#FDE8D0" />
      ))}
      <rect x="71" y="74" width="13" height="13" rx="3" fill="#C1703A" />
      <text x="77.5" y="84" textAnchor="middle" fontSize="9" fontWeight="bold" fill="white">14</text>
      <path d="M120 96 C120 92 124 89 128 94 C132 89 136 92 136 96 C136 103 128 110 128 110 C128 110 120 103 120 96Z" fill="#E8623A" />
    </svg>
  );
}

function FotosIllustration() {
  return (
    <svg viewBox="0 0 160 130" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"
      style={{ width: "100%", height: "100%", display: "block" }}>
      <rect x="38" y="10" width="84" height="100" rx="6" fill="#d4ecc5" transform="rotate(7 80 60)" />
      <rect x="28" y="10" width="84" height="100" rx="6" fill="#c8e6fa" transform="rotate(-5 80 60)" />
      <rect x="30" y="12" width="88" height="106" rx="6" fill="white" stroke="#3D2B1F" strokeWidth="3" />
      <rect x="38" y="20" width="72" height="70" rx="4" fill="#AEE4F8" />
      <ellipse cx="74" cy="86" rx="42" ry="16" fill="#7DC87D" />
      <ellipse cx="74" cy="82" rx="30" ry="12" fill="#5BB55B" />
      <circle cx="98" cy="32" r="12" fill="#F9C784" stroke="#E8A020" strokeWidth="2" />
      {[0,45,90,135,180,225,270,315].map(deg => {
        const rad = deg * Math.PI / 180;
        return <line key={deg} x1={98 + 14 * Math.cos(rad)} y1={32 + 14 * Math.sin(rad)}
          x2={98 + 20 * Math.cos(rad)} y2={32 + 20 * Math.sin(rad)}
          stroke="#E8A020" strokeWidth="2" strokeLinecap="round" />;
      })}
      <path d="M66 74 C66 70 70 67 74 72 C78 67 82 70 82 74 C82 80 74 86 74 86 C74 86 66 80 66 74Z" fill="#E8623A" />
      <rect x="42" y="98" width="64" height="7" rx="3" fill="#DEB8A0" />
      <rect x="52" y="109" width="44" height="5" rx="2" fill="#EDD0BC" />
    </svg>
  );
}

function MusikIllustration() {
  return (
    <svg viewBox="0 0 160 130" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"
      style={{ width: "100%", height: "100%", display: "block" }}>
      <circle cx="82" cy="68" r="52" fill="rgba(0,0,0,0.15)" />
      <circle cx="80" cy="65" r="52" fill="#2C1A10" />
      {[44,38,32,26,20].map(r => (
        <circle key={r} cx="80" cy="65" r={r} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="2.5" />
      ))}
      <circle cx="80" cy="65" r="16" fill="#C1703A" />
      <circle cx="80" cy="65" r="10" fill="#9D5520" />
      <circle cx="80" cy="65" r="4" fill="#F5EDE8" />
      <ellipse cx="60" cy="42" rx="12" ry="7" fill="rgba(255,255,255,0.08)" transform="rotate(-30 60 42)" />
      <text x="14" y="32" fontSize="28" fill="#9D5520" fontFamily="serif">♪</text>
      <text x="118" y="28" fontSize="22" fill="#9D5520" fontFamily="serif">♫</text>
      <text x="122" y="108" fontSize="24" fill="#9D5520" fontFamily="serif">♩</text>
      <path d="M12 84 C12 79 17 75 22 81 C27 75 32 79 32 84 C32 92 22 100 22 100 C22 100 12 92 12 84Z" fill="#E8623A" />
    </svg>
  );
}

function FamilieIllustration() {
  return (
    <svg viewBox="0 0 160 130" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"
      style={{ width: "100%", height: "100%", display: "block" }}>
      <rect x="8" y="8" width="144" height="114" rx="10" fill="#AEE4F8" />
      <path d="M28 72 L80 28 L132 72 L132 118 L28 118 Z" fill="rgba(0,0,0,0.1)" transform="translate(4,4)" />
      <path d="M24 72 L80 26 L136 72 Z" fill="#C1703A" stroke="#8B4513" strokeWidth="2" strokeLinejoin="round" />
      <rect x="28" y="70" width="104" height="50" rx="4" fill="#FDE8D0" stroke="#DEB8A0" strokeWidth="2" />
      <rect x="8" y="118" width="144" height="10" rx="4" fill="#7DC87D" />
      <rect x="36" y="80" width="28" height="26" rx="4" fill="#AEE4F8" stroke="#3D2B1F" strokeWidth="2" />
      <line x1="50" y1="80" x2="50" y2="106" stroke="#3D2B1F" strokeWidth="1.5" />
      <line x1="36" y1="93" x2="64" y2="93" stroke="#3D2B1F" strokeWidth="1.5" />
      <rect x="66" y="88" width="28" height="32" rx="4" fill="#C1703A" stroke="#8B4513" strokeWidth="2" />
      <circle cx="90" cy="104" r="3" fill="#F9C784" />
      <rect x="96" y="80" width="28" height="26" rx="4" fill="#AEE4F8" stroke="#3D2B1F" strokeWidth="2" />
      <line x1="110" y1="80" x2="110" y2="106" stroke="#3D2B1F" strokeWidth="1.5" />
      <line x1="96" y1="93" x2="124" y2="93" stroke="#3D2B1F" strokeWidth="1.5" />
      <rect x="108" y="38" width="14" height="22" rx="3" fill="#DEB8A0" stroke="#C1703A" strokeWidth="1.5" />
      <path d="M112 38 Q108 28 114 20 Q120 12 116 4" fill="none" stroke="rgba(100,80,70,0.4)" strokeWidth="3" strokeLinecap="round" />
      <path d="M68 14 C68 9 73 5 80 11 C87 5 92 9 92 14 C92 22 80 30 80 30 C80 30 68 22 68 14Z" fill="#E8623A" stroke="white" strokeWidth="1.5" />
    </svg>
  );
}

/* ── Daten laden ──────────────────────────────────────────────────────── */
async function ladeDaten() {
  const supabase = createAdminClient();
  const heute = new Date().toISOString().split("T")[0];
  const [{ data: termine }, { data: omas }] = await Promise.all([
    supabase.from("kalender_eintraege").select("id, titel, termin_datum, termin_zeit, ganztaegig")
      .gte("termin_datum", heute).order("termin_datum").order("termin_zeit").limit(1),
    supabase.from("personen").select("name, spitzname").eq("rolle", "oma").limit(1),
  ]);
  return {
    naechsterTermin: termine?.[0] ?? null,
    omaName: omas?.[0]?.spitzname ?? omas?.[0]?.name ?? null,
  };
}

const KACHELN = [
  { href: "/tablet/kalender", label: "Termine",  farbe: "#FDF0E4", rand: "#C1703A", textFarbe: "#7A3A10", Bild: KalenderIllustration },
  { href: "/tablet/fotos",    label: "Fotos",    farbe: "#E8F5E9", rand: "#4CAF50", textFarbe: "#1B5E20", Bild: FotosIllustration },
  { href: "/tablet/musik",    label: "Musik",    farbe: "#EDE7F6", rand: "#7B1FA2", textFarbe: "#4A148C", Bild: MusikIllustration },
  { href: "/tablet/besuche",  label: "Familie",  farbe: "#FFF8E1", rand: "#E8623A", textFarbe: "#8B2500", Bild: FamilieIllustration },
];

/* ── Seite ────────────────────────────────────────────────────────────── */
export default async function TabletHomescreen() {
  const { naechsterTermin, omaName } = await ladeDaten();
  const jetzt = new Date();
  const gruss = tageszeitGruss();
  const datumText = formatiereDatum(jetzt);

  const terminText = naechsterTermin
    ? naechsterTermin.ganztaegig
      ? `${naechsterTermin.titel} — ${formatiereDatumKurz(new Date(naechsterTermin.termin_datum + "T12:00:00"))}`
      : `${naechsterTermin.titel} — ${formatiereZeit(naechsterTermin.termin_zeit ?? "")}, ${formatiereDatumKurz(new Date(naechsterTermin.termin_datum + "T12:00:00"))}`
    : null;

  return (
    <>
      <style>{`
        /* ════════════════════════════════════════════
           Basis — Portrait (Standard)
           Outer flex column: info → tiles → actions
        ════════════════════════════════════════════ */
        .hs {
          display: flex;
          flex-direction: column;
          height: 100%;
          padding: 16px;
          gap: 12px;
          box-sizing: border-box;
          background: var(--farbe-warm-bg, #FDF6EE);
        }

        /*
         * In portrait: .hs-sidebar has display:contents,
         * so .hs-info and .hs-actions become direct flex children
         * of .hs. We use CSS order to place them correctly:
         *   1 = hs-info  (top)
         *   2 = hs-tiles (middle)
         *   3 = hs-actions (bottom)
         */
        .hs-sidebar { display: contents; }
        .hs-info    { order: 1; flex-shrink: 0; display: flex; flex-direction: column; gap: 6px; }
        .hs-tiles   { order: 2; }
        .hs-actions { order: 3; flex-shrink: 0; display: flex; flex-direction: column; gap: 10px; }

        /* Gruss + Datum */
        .hs-gruss {
          font-size: 1.75rem;
          font-weight: 700;
          color: var(--farbe-warm-text, #3D2B1F);
          line-height: 1.2;
        }
        .hs-datum {
          font-size: 1rem;
          color: var(--farbe-warm-text, #3D2B1F);
          opacity: 0.7;
        }

        /* Nächster Termin */
        .hs-termin {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 14px;
          border-radius: 14px;
          background: white;
          border: 2px solid #C1703A;
          margin-top: 2px;
        }
        .hs-termin-emoji { font-size: 1.4rem; flex-shrink: 0; }
        .hs-termin-text  { font-size: 0.95rem; font-weight: 600; color: #7A3A10; line-height: 1.3; }

        /* Kacheln 2×2 */
        .hs-tiles {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
          flex: 1 1 0;
          min-height: 0;
        }
        .hs-tile {
          position: relative;
          display: flex;
          align-items: flex-end;
          justify-content: center;
          padding: 0 10px 14px;
          border-radius: 20px;
          border: 3px solid;
          text-decoration: none;
          min-height: 150px;
          overflow: hidden;
          transition: opacity 0.15s;
          -webkit-tap-highlight-color: transparent;
        }
        .hs-tile:active { opacity: 0.75; }
        .hs-tile-bild {
          position: absolute;
          inset: 0;
          padding: 8px 8px 42px;
          pointer-events: none;
        }
        .hs-tile-label {
          position: relative;
          z-index: 1;
          font-size: 1.15rem;
          font-weight: 700;
        }

        /* Lina-Button */
        .hs-lina {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 14px 20px;
          border-radius: 20px;
          background: #FFF0F5;
          border: 3px solid #E91E8C;
          text-decoration: none;
          min-height: 72px;
          transition: opacity 0.15s;
          -webkit-tap-highlight-color: transparent;
        }
        .hs-lina:active { opacity: 0.75; }
        .hs-lina-emoji  { font-size: 2.5rem; flex-shrink: 0; }
        .hs-lina-titel  { font-size: 1.1rem; font-weight: 700; color: #880E4F; }
        .hs-lina-sub    { font-size: 0.8rem; color: #AD1457; }

        /* ════════════════════════════════════════════
           Landscape — Samsung Tab S6 Lite 2020
           ~1067 × 600 CSS px
           Layout: left sidebar (240px) | right tiles
        ════════════════════════════════════════════ */
        @media (orientation: landscape) {
          .hs {
            flex-direction: row;
            padding: 12px;
            gap: 12px;
          }

          /*
           * Sidebar becomes an actual box again (not contents).
           * It's a flex column that fills the full height on the left.
           * Contains hs-info (top) and hs-actions (bottom).
           */
          .hs-sidebar {
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            width: 240px;
            flex-shrink: 0;
          }

          /* Reset order (sidebar children are already in correct order) */
          .hs-info    { order: unset; }
          .hs-actions { order: unset; }

          /* Tiles fill remaining width */
          .hs-tiles   { order: unset; flex: 1 1 0; grid-template-rows: 1fr 1fr; height: 100%; }

          /* Smaller typography / spacing in landscape */
          .hs-gruss { font-size: 1.3rem; }
          .hs-datum { font-size: 0.82rem; }

          .hs-termin { padding: 8px 12px; border-radius: 12px; }
          .hs-termin-emoji { font-size: 1.15rem; }
          .hs-termin-text  { font-size: 0.8rem; }

          .hs-tile { min-height: 0; border-radius: 16px; padding: 0 8px 12px; border-width: 2px; }
          .hs-tile-bild { padding: 6px 6px 38px; }
          .hs-tile-label { font-size: 1rem; }

          .hs-lina {
            padding: 10px 12px;
            min-height: 58px;
            gap: 10px;
            border-radius: 14px;
            border-width: 2px;
          }
          .hs-lina-emoji  { font-size: 1.9rem; }
          .hs-lina-titel  { font-size: 0.9rem; }
          .hs-lina-sub    { font-size: 0.7rem; }

          .hs-actions { gap: 7px; }
          .hs-info    { gap: 5px; }
        }
      `}</style>

      <div className="hs">

        {/* Sidebar-Wrapper:
            Portrait  → display:contents, children flow into .hs column
            Landscape → display:flex column, left sidebar */}
        <div className="hs-sidebar">

          {/* ── Gruss + Datum + Termin ── */}
          <div className="hs-info">
            <div className="hs-gruss">
              {gruss}{omaName ? `, ${omaName}` : ""}
            </div>
            <div className="hs-datum">{datumText}</div>
            {terminText && (
              <div className="hs-termin">
                <span className="hs-termin-emoji">📅</span>
                <span className="hs-termin-text">{terminText}</span>
              </div>
            )}
          </div>

          {/* ── Lina + Wohlbefinden ── */}
          <div className="hs-actions">
            <Link href="/tablet/avatar" className="hs-lina">
              <span className="hs-lina-emoji">🤖</span>
              <div>
                <div className="hs-lina-titel">Mit Lina sprechen</div>
                <div className="hs-lina-sub">Deine persönliche Begleiterin</div>
              </div>
            </Link>
            <WohlbefindenButton />
          </div>

        </div>

        {/* ── Kacheln 2×2 ── */}
        <div className="hs-tiles">
          {KACHELN.map(({ href, label, farbe, rand, textFarbe, Bild }) => (
            <Link
              key={href}
              href={href}
              className="hs-tile"
              style={{ background: farbe, borderColor: rand, color: textFarbe }}
            >
              <div className="hs-tile-bild"><Bild /></div>
              <span className="hs-tile-label">{label}</span>
            </Link>
          ))}
        </div>

      </div>
    </>
  );
}
